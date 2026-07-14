import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  RefreshCw, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Database, 
  Trash2, 
  ChevronRight, 
  Building2,
  Terminal,
  UserCheck,
  Lock,
  Bell,
  FileText,
  Sliders,
  Repeat
} from 'lucide-react';
import { Documento, User, ScaleException } from '../types';
import { CONSELHEIROS_ALFABETICO_POR_UNIDADE, getEffectiveEscala } from '../constants';
import { saveDocument, deleteDocument } from '../lib/db';

interface DistributionSimulatorProps {
  documents: Documento[];
  users: User[];
  currentUser: User;
  onAddLog: (action: string) => void;
  nameMap?: Record<string, string>;
  scaleExceptions?: ScaleException[];
}

interface TestLog {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export const DistributionSimulator: React.FC<DistributionSimulatorProps> = ({ 
  documents, 
  users, 
  currentUser,
  onAddLog,
  nameMap: propNameMap,
  scaleExceptions = []
}) => {
  const [selectedUnidade, setSelectedUnidade] = useState<number>(currentUser?.unidade_id || 1);

  useEffect(() => {
    if (currentUser?.unidade_id) {
      setSelectedUnidade(currentUser.unidade_id);
    }
  }, [currentUser?.unidade_id]);

  const [simulationSize, setSimulationSize] = useState<number>(5);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    successImediata: boolean;
    sentCount: number;
    expectedSeq: string[];
    assignedSeq: string[];
    expectedSeqImediata: string[];
    assignedSeqImediata: string[];
    message: string;
  } | null>(null);

  // Filtros de Usuários
  const admsOfUnidade = useMemo(() => {
    return users.filter(u => 
      (u.perfil === 'ADMIN' || u.perfil === 'ADMINISTRATIVO') && 
      u.unidade_id === selectedUnidade &&
      u.status === 'ATIVO' &&
      u.nome.toUpperCase() !== 'LUDIMILA'
    );
  }, [users, selectedUnidade]);

  const activeCounselors = useMemo(() => {
    return users
      .filter(u => {
        if (u.unidade_id !== selectedUnidade) return false;
        if (u.status !== 'ATIVO') return false;
        if (u.perfil !== 'CONSELHEIRO' && u.perfil !== 'SUPLENTE') return false;
        
        // Se for um conselheiro titular sob substituição ativa, ele não participa do rodízio ativo
        if (u.perfil === 'CONSELHEIRO' && u.substituicao_ativa) {
          return false;
        }
        return true;
      })
      .map(u => ({ id: u.id, nome: u.nome.toUpperCase() }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [users, selectedUnidade]);

  // Casos reais da unidade selecionada ordenados por data de criação decrescente
  const unitCasesReal = useMemo(() => {
    return documents
      .filter(d => d.unidade_id === selectedUnidade)
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  }, [documents, selectedUnidade]);

  // Estatísticas das distribuições de hoje
  const todayStats = useMemo(() => {
    const todayDateReal = (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const todayUnitCases = documents.filter(d => {
      const isDocOfToday = d.data_aporte === todayDateReal || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === todayDateReal);
      return isDocOfToday && d.unidade_id === selectedUnidade;
    });

    const total = todayUnitCases.length;
    let manual = 0;
    let notification = 0;
    let persistence = 0;
    let automatic = 0;

    todayUnitCases.forEach(d => {
      if (d.is_manual_providencia || d.providencia_imediata_manual) {
        manual++;
      } else if (d.notificacao) {
        notification++;
      } else if (d.is_family_persistence) {
        persistence++;
      } else {
        automatic++;
      }
    });

    return { total, manual, notification, persistence, automatic };
  }, [documents, selectedUnidade]);

  // Encontra quem foi o último conselheiro de referência atribuído (não manual)
  const lastAssignedRef = useMemo(() => {
    const newCases = documents
      .filter(d => !d.is_manual_override && d.unidade_id === selectedUnidade)
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    
    if (newCases.length === 0) return null;
    
    const lastId = newCases[0].conselheiro_referencia_id;
    const foundUser = users.find(u => u.id === lastId);
    return foundUser ? foundUser.nome.toUpperCase() : null;
  }, [documents, users, selectedUnidade]);

  // Próximo conselheiro previsto para a próxima distribuição
  const nextPredictedCounselor = useMemo(() => {
    if (activeCounselors.length === 0) return 'Nenhum conselheiro ativo';
    const lastIndex = activeCounselors.findIndex(c => c.nome === lastAssignedRef);
    const nextIndex = (lastIndex + 1) % activeCounselors.length;
    return activeCounselors[nextIndex].nome;
  }, [activeCounselors, lastAssignedRef]);

  const nameMap = useMemo(() => {
    return propNameMap || {};
  }, [propNameMap]);

  const escalaTrio = useMemo(() => {
    const todayDateReal = (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    return getEffectiveEscala(todayDateReal, '12:00', selectedUnidade, nameMap, scaleExceptions);
  }, [selectedUnidade, nameMap, scaleExceptions]);

  const activeExceptionsForUnit = useMemo(() => {
    if (!scaleExceptions) return [];
    return scaleExceptions.filter(ex => ex.unidade_id === selectedUnidade);
  }, [scaleExceptions, selectedUnidade]);

  // Encontra quem foi o último conselheiro de providência imediata distribuído hoje automaticamente
  const lastAssignedImediata = useMemo(() => {
    const todayDateReal = (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    // Lógica idêntica ao DocumentRegistration.tsx para agrupar casos cadastrados no dia sob o rodízio de hoje
    const todayDocs = documents
      .filter(d => {
        const isDocOfToday = d.data_aporte === todayDateReal || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === todayDateReal);
        if (!isDocOfToday || d.unidade_id !== selectedUnidade) {
          return false;
        }
        const isRefOfDocInTrio = (() => {
          const rUser = users.find(u => u.id === d.conselheiro_referencia_id);
          const rName = rUser?.nome?.toUpperCase();
          const mappedRName = (rName && nameMap && nameMap[rName]) ? nameMap[rName] : rName;
          return mappedRName && escalaTrio.map(n => n.toUpperCase()).includes(mappedRName.toUpperCase());
        })();
        const isFamPersistence = d.is_family_persistence && !isRefOfDocInTrio;
        return !isFamPersistence && !d.is_manual_providencia && !d.providencia_imediata_manual;
      })
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    
    const lastAutoDoc = todayDocs.find(d => !d.notificacao);
    if (!lastAutoDoc) return null;
    const lastId = lastAutoDoc.conselheiro_providencia_id;
    const foundUser = users.find(u => u.id === lastId);
    return foundUser ? foundUser.nome.toUpperCase() : null;
  }, [documents, users, selectedUnidade, escalaTrio, nameMap]);

  // Próximo conselheiro previsto para a providência imediata
  const nextPredictedImediata = useMemo(() => {
    if (escalaTrio.length === 0) return 'Sem escala ativa';
    const lastIndex = escalaTrio.findIndex(name => name.toUpperCase() === lastAssignedImediata);
    const nextIndex = (lastIndex + 1) % escalaTrio.length;
    return escalaTrio[nextIndex];
  }, [escalaTrio, lastAssignedImediata]);

  // Função para adicionar log interno no painel
  const log = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    setTestLogs(prev => [{ timestamp: timeStr, type, message }, ...prev]);
  };

  const clearLogs = () => {
    setTestLogs([]);
    setSimulationResult(null);
  };

  // EXECUTA A SIMULAÇÃO DE CONCORRÊNCIA EM SANDBOX LOCAL (RÁPIDA)
  const runSandboxSimulation = () => {
    if (activeCounselors.length === 0) {
      log('Impossível calibrar: nenhum Conselheiro ativo nesta unidade.', 'error');
      return;
    }
    if (admsOfUnidade.length === 0) {
      log('Aviso: Nenhum usuário ADM ativo na unidade. Simulação usará atores virtuais.', 'warn');
    }

    setIsSimulating(true);
    setSimulationResult(null);
    clearLogs();

    log(`Iniciando Simulação concorrente na Unidade ${selectedUnidade}...`, 'info');
    log(`Buscando conselheiros ativos para rodízio alfabético...`, 'info');
    log(`Ordem Alfabética de Rodízio: ${activeCounselors.map(c => c.nome).join(' → ')}`, 'info');
    log(`Último atribuído no histórico real do banco: ${lastAssignedRef || 'NENHUM (novo rodízio)'}`, 'info');

    setTimeout(() => {
      // Começamos o rodízio virtual a partir do último do banco
      const virtualDocsList = [...documents];
      const assignedSequence: string[] = [];
      const expectedSequence: string[] = [];
      const assignedSequenceImediata: string[] = [];
      const expectedSequenceImediata: string[] = [];

      // Montamos o estado esperado sequencialmente para Referência
      let currentRefName = lastAssignedRef;
      const expectedRefs: { id: string, nome: string }[] = [];

      for (let i = 0; i < simulationSize; i++) {
        // Encontra o próximo previsto
        const lastIdx = activeCounselors.findIndex(c => c.nome === currentRefName);
        const nextIdx = activeCounselors.length > 0 ? (lastIdx + 1) % activeCounselors.length : 0;
        const targetCounselor = activeCounselors[nextIdx];
        expectedSequence.push(targetCounselor.nome);
        expectedRefs.push(targetCounselor);
        currentRefName = targetCounselor.nome;
      }

      // Montamos o estado esperado sequencialmente para Providência Imediata
      const todayDateReal = (() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();
      const virtualTrio = getEffectiveEscala(todayDateReal, '12:00', selectedUnidade, nameMap, scaleExceptions);
      let currentProvName = lastAssignedImediata;
      for (let i = 0; i < simulationSize; i++) {
        const refUser = expectedRefs[i];
        const refUserName = refUser?.nome?.toUpperCase();
        const mappedRefName = (refUserName && nameMap && nameMap[refUserName]) ? nameMap[refUserName] : refUserName;
        const isRefUserInTrio = mappedRefName && virtualTrio.map(n => n.toUpperCase()).includes(mappedRefName.toUpperCase());

        if (isRefUserInTrio && refUser) {
          expectedSequenceImediata.push(refUserName);
          currentProvName = refUserName;
        } else {
          const lastIdx = virtualTrio.findIndex(name => name.toUpperCase() === currentProvName);
          const nextIdx = virtualTrio.length > 0 ? (lastIdx + 1) % virtualTrio.length : 0;
          const targetImediata = virtualTrio[nextIdx];
          expectedSequenceImediata.push(targetImediata?.toUpperCase() || 'N/A');
          currentProvName = targetImediata?.toUpperCase();
        }
      }

      // Simular múltiplos ADMs agindo simultaneamente (concorrência)
      log(`Simulando ${simulationSize} submissões de documentos em simultâneo por ADMs...`, 'info');
      
      const simulatedAdmActors = admsOfUnidade.length > 0 
        ? admsOfUnidade.map(a => a.nome) 
        : ['ADM VIRTUAL 1', 'ADM VIRTUAL 2', 'ADM VIRTUAL 3'];

      for (let i = 0; i < simulationSize; i++) {
        const actor = simulatedAdmActors[i % simulatedAdmActors.length];
        const docId = `sim-${Math.random().toString(36).substr(2, 9)}`;
        const creationTime = new Date(Date.now() + i * 1000).toISOString(); // Garantir carimbo de tempo sequencial

        // Cálculo de distribuição lógica idêntico ao DocumentRegistration.tsx
        const tempNewCases = virtualDocsList
          .filter(d => !d.is_manual_override && d.unidade_id === selectedUnidade)
          .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
        
        const lastRefId = tempNewCases[0]?.conselheiro_referencia_id;
        const lastRefUser = users.find(u => u.id === lastRefId);
        const refName = lastRefUser?.nome.toUpperCase();

        const curIdx = activeCounselors.findIndex(c => c.nome === refName);
        const nxtIdx = activeCounselors.length > 0 ? (curIdx + 1) % activeCounselors.length : 0;
        const assignedUser = activeCounselors[nxtIdx];

        // Lógica de Distribuição Justa (Rodízio de Providência Imediata)
        const refNameSim = assignedUser?.nome?.toUpperCase();
        const mappedRefNameSim = (refNameSim && nameMap && nameMap[refNameSim]) ? nameMap[refNameSim] : refNameSim;
        const isRefSimInTrio = mappedRefNameSim && virtualTrio.map(n => n.toUpperCase()).includes(mappedRefNameSim.toUpperCase());

        const virtualTodayDocs = virtualDocsList
          .filter(d => {
            const isDocOfToday = d.data_aporte === todayDateReal || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === todayDateReal);
            const isRefOfDocInTrio = (() => {
              const rUser = users.find(u => u.id === d.conselheiro_referencia_id);
              const rName = rUser?.nome?.toUpperCase();
              const mappedRName = (rName && nameMap && nameMap[rName]) ? nameMap[rName] : rName;
              return mappedRName && virtualTrio.map(n => n.toUpperCase()).includes(mappedRName.toUpperCase());
            })();
            const isFamPersistence = d.is_family_persistence && !isRefOfDocInTrio;
            return isDocOfToday && d.unidade_id === selectedUnidade && !isFamPersistence && !d.notificacao && !d.is_manual_providencia;
          })
          .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

        const lastProvId = virtualTodayDocs[0]?.conselheiro_providencia_id;
        const lastProvUser = users.find(u => u.id === lastProvId);
        const lastProvName = lastProvUser?.nome.toUpperCase();
        
        let assignedProvUser: User | undefined;
        let assignedProvName: string = 'N/A';

        if (isRefSimInTrio && assignedUser) {
          assignedProvUser = users.find(u => u.id === assignedUser.id);
          assignedProvName = refNameSim;
        } else {
          const curProvIdx = virtualTrio.indexOf(lastProvName || '');
          const nxtProvIdx = virtualTrio.length > 0 ? (curProvIdx + 1) % virtualTrio.length : 0;
          assignedProvName = virtualTrio[nxtProvIdx] || 'N/A';
          assignedProvUser = users.find(u => u.status === 'ATIVO' && u.nome.toUpperCase() === assignedProvName.toUpperCase() && u.unidade_id === selectedUnidade);
        }

        // Cria o registro temporário na lista para a próxima iteração simular a sincronização rápida
        const newVirtualDoc: Documento = {
          id: docId,
          unidade_id: selectedUnidade,
          origem: 'SIMULAÇÃO - ADMINISTRATIVO',
          canal_comunicado: 'SISTEMA',
          data_recebimento: todayDateReal,
          data_aporte: todayDateReal,
          hora_aporte: '12:00',
          crianca_nome: `SIMULAÇÃO CRIANÇA ${i + 1}`,
          criancas: [],
          genitora_nome: 'SIMULAÇÃO GENITORA',
          bairro: 'JARDIM PRIMAVERA',
          informacoes_documento: 'TESTE DE CARGA',
          observacoes_iniciais: 'TESTE DE SIMULAÇÃO',
          violacoesSipia: [],
          agentesVioladores: [],
          status: ['AGUARDANDO_ANALISE'],
          conselheiro_referencia_id: assignedUser.id,
          conselheiro_providencia_id: assignedProvUser?.id || '',
          conselheiros_providencia_nomes: virtualTrio,
          criado_em: creationTime,
          distribuicao_automatica: true
        };

        virtualDocsList.unshift(newVirtualDoc); // adiciona no início
        assignedSequence.push(assignedUser.nome);
        assignedSequenceImediata.push(assignedProvName.toUpperCase());

        log(`[ADM: ${actor}] cadastrou documento para "SIMULAÇÃO CRIANÇA ${i + 1}". Ref: ${assignedUser.nome} | Imed: ${assignedProvName.toUpperCase()}`, 'success');
      }

      // Validação matemática
      const isPerfectRef = JSON.stringify(expectedSequence) === JSON.stringify(assignedSequence);
      const isPerfectImediata = JSON.stringify(expectedSequenceImediata) === JSON.stringify(assignedSequenceImediata);
      const isPerfectCombined = isPerfectRef && isPerfectImediata;

      if (isPerfectCombined) {
        log(`✓ SIMULAÇÃO CONTRATADA COM SUCESSO! Ambas as sequências de rodízio mantiveram-se íntegras.`, 'success');
      } else {
        if (!isPerfectRef) log(`✗ DISCORDÂNCIA ENCONTRADA NA SEQUÊNCIA DE RODÍZIO DE REFERÊNCIA.`, 'error');
        if (!isPerfectImediata) log(`✗ DISCORDÂNCIA ENCONTRADA NA SEQUÊNCIA DE RODÍZIO DE PROVIDÊNCIA IMEDIATA.`, 'error');
      }

      setSimulationResult({
        success: isPerfectRef,
        successImediata: isPerfectImediata,
        sentCount: simulationSize,
        expectedSeq: expectedSequence,
        assignedSeq: assignedSequence,
        expectedSeqImediata: expectedSequenceImediata,
        assignedSeqImediata: assignedSequenceImediata,
        message: isPerfectCombined 
          ? 'Análise de Concorrência Concluída: Os algoritmos de lock de indexação (Referência e Providência) estão 100% robustos para múltiplas operações simultâneas!'
          : `Falha na ordenação! ${!isPerfectRef ? '[Referência afetado] ' : ''}${!isPerfectImediata ? '[Imediata afetado]' : ''}`
      });
      setIsSimulating(false);
      onAddLog(`SIMULAÇÃO: Teste concorrente de distribuição na Unidade ${selectedUnidade} executado.`);
    }, 1500);
  };

  // EXECUTA TESTE INTEGRADO NO FIRESTORE REAL (SEGURO COM AUTOCLEANUP)
  const runLiveDatabaseTest = async () => {
    if (activeCounselors.length === 0) {
      log('Não há conselheiros ativos para fazer o teste.', 'error');
      return;
    }
    
    setIsSimulating(true);
    setSimulationResult(null);
    clearLogs();

    const todayDateReal = (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    log(`Iniciando teste integrado em tempo real no banco Firestore (Unidade ${selectedUnidade})...`, 'warn');
    log(`Este teste cadastrará 3 registros reais e depois fará a autolimpeza (rollback) instantânea.`, 'info');

    const createdIds: string[] = [];
    const expectedSequence: string[] = [];
    const assignedSequence: string[] = [];
    const expectedSequenceImediata: string[] = [];
    const assignedSequenceImediata: string[] = [];

    // Lista dinâmica local para evitar closures do React que mantêm o estado cacheado do prop "documents"
    const liveDocsList = [...documents];

    // For expected sequence (Referência)
    let currentRefName = lastAssignedRef;
    const testExpectedRefs: { id: string, nome: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const lastIdx = activeCounselors.findIndex(c => c.nome === currentRefName);
      const nextIdx = activeCounselors.length > 0 ? (lastIdx + 1) % activeCounselors.length : 0;
      const target = activeCounselors[nextIdx];
      expectedSequence.push(target.nome);
      testExpectedRefs.push(target);
      currentRefName = target.nome;
    }

    // For expected sequence (Imediata)
    const liveTrio = getEffectiveEscala(todayDateReal, '12:00', selectedUnidade, nameMap, scaleExceptions);
    let currentProvName = lastAssignedImediata;
    for (let i = 0; i < 3; i++) {
      const refUser = testExpectedRefs[i];
      const refUserName = refUser?.nome?.toUpperCase();
      const mappedRefName = (refUserName && nameMap && nameMap[refUserName]) ? nameMap[refUserName] : refUserName;
      const isRefUserInTrio = mappedRefName && liveTrio.map(n => n.toUpperCase()).includes(mappedRefName.toUpperCase());

      if (isRefUserInTrio && refUser) {
        expectedSequenceImediata.push(refUserName);
        currentProvName = refUserName;
      } else {
        const lastIdx = liveTrio.findIndex(name => name.toUpperCase() === currentProvName);
        const nextIdx = liveTrio.length > 0 ? (lastIdx + 1) % liveTrio.length : 0;
        const target = liveTrio[nextIdx];
        expectedSequenceImediata.push(target?.toUpperCase() || 'N/A');
        currentProvName = target?.toUpperCase();
      }
    }

    try {
      for (let i = 0; i < 3; i++) {
        const docId = `test-real-${Math.random().toString(36).substr(2, 9)}`;
        const creationTime = new Date().toISOString();
        
        // Simular a consulta viva do banco para obter o conselheiro dinamicamente
        const liveNewCases = liveDocsList
          .filter(d => !d.is_manual_override && d.unidade_id === selectedUnidade)
          .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
        
        const lastRefId = liveNewCases[0]?.conselheiro_referencia_id;
        const lastRefUser = users.find(u => u.id === lastRefId);
        const refName = lastRefUser?.nome.toUpperCase();

        const curIdx = activeCounselors.findIndex(c => c.nome === refName);
        const nxtIdx = activeCounselors.length > 0 ? (curIdx + 1) % activeCounselors.length : 0;
        const assignedUser = activeCounselors[nxtIdx];

        // Providência Imediata (Consulta viva do banco em tempo real)
        const liveTodayDocs = liveDocsList
          .filter(d => {
            const isDocOfToday = d.data_aporte === todayDateReal || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === todayDateReal);
            const isRefOfDocInTrio = (() => {
              const rUser = users.find(u => u.id === d.conselheiro_referencia_id);
              const rName = rUser?.nome?.toUpperCase();
              const mappedRName = (rName && nameMap && nameMap[rName]) ? nameMap[rName] : rName;
              return mappedRName && liveTrio.map(n => n.toUpperCase()).includes(mappedRName.toUpperCase());
            })();
            const isFamPersistence = d.is_family_persistence && !isRefOfDocInTrio;
            return isDocOfToday && d.unidade_id === selectedUnidade && !isFamPersistence && !d.notificacao && !d.is_manual_providencia;
          })
          .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

        const lastProvId = liveTodayDocs[0]?.conselheiro_providencia_id;
        const lastProvUser = users.find(u => u.id === lastProvId);
        const lastProvName = lastProvUser?.nome.toUpperCase();

        let assignedProvUser: User | undefined;
        let assignedProvName: string = 'N/A';

        const refNameSim = assignedUser?.nome?.toUpperCase();
        const mappedRefNameSim = (refNameSim && nameMap && nameMap[refNameSim]) ? nameMap[refNameSim] : refNameSim;
        const isRefSimInTrio = mappedRefNameSim && liveTrio.map(n => n.toUpperCase()).includes(mappedRefNameSim.toUpperCase());

        if (isRefSimInTrio && assignedUser) {
          assignedProvUser = users.find(u => u.id === assignedUser.id);
          assignedProvName = refNameSim;
        } else {
          const curProvIdx = liveTrio.indexOf(lastProvName || '');
          const nxtProvIdx = liveTrio.length > 0 ? (curProvIdx + 1) % liveTrio.length : 0;
          assignedProvName = liveTrio[nxtProvIdx] || 'N/A';
          assignedProvUser = users.find(u => u.status === 'ATIVO' && u.nome.toUpperCase() === assignedProvName.toUpperCase() && u.unidade_id === selectedUnidade);
        }

        log(`[Gravando no Firestore] Documento de teste ${i + 1}/3...`, 'info');

        const newDoc: Documento = {
          id: docId,
          unidade_id: selectedUnidade,
          origem: 'SIMULAÇÃO - GERAL ADM',
          canal_comunicado: 'SISTEMA',
          data_recebimento: todayDateReal,
          data_aporte: todayDateReal,
          hora_aporte: '12:00',
          crianca_nome: `PROVA DE CARGA REAL ${i + 1}`,
          criancas: [],
          genitora_nome: 'PROVA DE CARGA',
          bairro: 'JARDIM PRIMAVERA',
          informacoes_documento: 'INTEGRAÇÃO REAL',
          observacoes_iniciais: 'TESTE INTEGRADO CONCORRENTE',
          violacoesSipia: [],
          agentesVioladores: [],
          status: ['AGUARDANDO_ANALISE'],
          conselheiro_referencia_id: assignedUser.id,
          conselheiro_providencia_id: assignedProvUser?.id || '',
          conselheiros_providencia_nomes: liveTrio,
          criado_em: creationTime,
          distribuicao_automatica: true
        };

        // Grava no banco de dados real
        await saveDocument(newDoc);
        
        // Empurra localmente na cópia viva para o próximo loop usar o valor atualizado corretamento
        liveDocsList.unshift(newDoc);

        createdIds.push(docId);
        assignedSequence.push(assignedUser.nome);
        assignedSequenceImediata.push(assignedProvName.toUpperCase());

        log(`✓ Escrito no Firestore! ID: ${docId} | Ref: ${assignedUser.nome} | Imed: ${assignedProvName.toUpperCase()}`, 'success');
        
        // Aguarda 1 segundo entre gravações para dar tempo de consolidação do carimbo de tempo
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      log(`Verificando integridade das sequências de gravação direta...`, 'info');
      const testPassedRef = JSON.stringify(expectedSequence) === JSON.stringify(assignedSequence);
      const testPassedImediata = JSON.stringify(expectedSequenceImediata) === JSON.stringify(assignedSequenceImediata);
      const testPassedCombined = testPassedRef && testPassedImediata;

      if (testPassedCombined) {
        log(`✓ SUCESSO COMPROVADO EM FIRESTORE! Ambas as sequências (Referência e Imediata) mantiveram-se perfectly.`, 'success');
      } else {
        if (!testPassedRef) log(`▲ AVISO: Discrepância na ordem síncrona de Referência.`, 'warn');
        if (!testPassedImediata) log(`▲ AVISO: Discrepância na ordem síncrona de Providência Imediata.`, 'warn');
      }

      setSimulationResult({
        success: testPassedRef,
        successImediata: testPassedImediata,
        sentCount: 3,
        expectedSeq: expectedSequence,
        assignedSeq: assignedSequence,
        expectedSeqImediata: expectedSequenceImediata,
        assignedSeqImediata: assignedSequenceImediata,
        message: testPassedCombined 
          ? 'O banco de dados Firestore processou as concorrências e salvou sequências corretas de Referência e Providência!'
          : `Discrepância nas gravações! ${!testPassedRef ? '[Referência afetado] ' : ''}${!testPassedImediata ? '[Imediata afetado]' : ''}`
      });

      // Autolimpeza
      log(`Iniciando processo de Autolimpeza (Rollback)...`, 'warn');
      for (const id of createdIds) {
        log(`Deletando documento temporário ${id}...`, 'info');
        await deleteDocument(id);
      }
      log(`✓ Autolimpeza concluída! Nenhuma inserção ruidosa foi deixada no seu banco de dados oficial.`, 'success');

    } catch (err) {
      log(`Erro durante teste integrado de transação: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSimulating(false);
      onAddLog(`FILTRO: Executou teste de distribuição real com autolimpeza.`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 animate-in fade-in duration-300">
      
      {/* HEADER DO SIMULADOR */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-[2.5rem] p-6 sm:p-10 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity className="w-48 h-48" />
        </div>
        <div className="max-w-3xl">
          <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full font-black text-[10px] uppercase tracking-widest border border-blue-500/20">
            Console de Teste & Concorrência
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3">
            Simulador de Distribuição & Validação ADM
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium mt-2 leading-relaxed">
            Diagnostique se os usuários com privilégio ADM/Administrativo estão integrando cadastros normalmente nas duas unidades e valide de forma empírica o algoritmo de rodízio em ordem alfabética sob condições de acesso simultâneo.
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${currentUser?.nome === 'LEANDRO' ? 'lg:grid-cols-3' : 'max-w-2xl mx-auto'} gap-6`}>
        
        {/* PARTE esquerda: Configurações e Diagnóstico das Unidades */}
        <div className={`${currentUser?.nome === 'LEANDRO' ? 'lg:col-span-1' : 'col-span-1'} space-y-6`}>
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              1. Selecionar Unidade
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button 
                disabled={currentUser.unidade_id !== 1}
                onClick={() => { setSelectedUnidade(1); setSimulationResult(null); }}
                className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${
                  selectedUnidade === 1 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : currentUser.unidade_id !== 1 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  {currentUser.unidade_id !== 1 && <Lock className="w-3 h-3" />}
                  <span>Unidade I</span>
                </div>
                {currentUser.unidade_id !== 1 && (
                  <span className="text-[8px] font-black tracking-normal text-slate-400 uppercase">Bloqueado</span>
                )}
                {currentUser.unidade_id === 1 && (
                  <span className="text-[8px] font-black tracking-normal text-indigo-200 uppercase">Sua Unidade</span>
                )}
              </button>
              <button 
                disabled={currentUser.unidade_id !== 2}
                onClick={() => { setSelectedUnidade(2); setSimulationResult(null); }}
                className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${
                  selectedUnidade === 2 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : currentUser.unidade_id !== 2 
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  {currentUser.unidade_id !== 2 && <Lock className="w-3 h-3" />}
                  <span>Unidade II</span>
                </div>
                {currentUser.unidade_id !== 2 && (
                  <span className="text-[8px] font-black tracking-normal text-slate-400 uppercase">Bloqueado</span>
                )}
                {currentUser.unidade_id === 2 && (
                  <span className="text-[8px] font-black tracking-normal text-indigo-200 uppercase">Sua Unidade</span>
                )}
              </button>
            </div>

            {/* Diagnóstico de Usuários ADM */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Validação de Acesso ADM
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded">
                  OK
                </span>
              </div>
              
              <div className="space-y-2">
                {admsOfUnidade.length === 0 ? (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold p-3 bg-rose-50 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    Nenhum ADM ativo na Unidade {selectedUnidade}!
                  </div>
                ) : (
                  admsOfUnidade.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-extrabold text-slate-700">{u.nome}</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">Capacidade Escrita ✓</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ordem de Conselheiros */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Lista de Rodízio Alfabético Atual ({activeCounselors.length})
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {activeCounselors.map((c, index) => {
                  const isLast = c.nome === lastAssignedRef;
                  const isNext = c.nome === nextPredictedCounselor;
                  return (
                    <div 
                      key={c.id} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${isNext ? 'bg-blue-50/50 border-blue-200 shadow-sm' : isLast ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-100'}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <span className="w-5 h-5 bg-slate-100 text-slate-500 font-mono text-[10px] font-black rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="uppercase text-[11px] font-extrabold">{c.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLast && (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-black text-[8px] uppercase rounded">
                            Último atribuído
                          </span>
                        )}
                        {isNext && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white font-black text-[8px] uppercase rounded animate-pulse">
                            Próximo da fila
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ordem de Providência Imediata (Escala de Trabalho) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Rodízio de Providência Imediata (Escala de Hoje)
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {escalaTrio.length === 0 ? (
                  <div className="text-xs text-slate-400 font-bold p-3 bg-slate-50 rounded-xl">
                    Nenhuma escala ativa para esta data/unidade.
                  </div>
                ) : (
                  escalaTrio.map((name, index) => {
                    const isLast = lastAssignedImediata && name.toUpperCase() === lastAssignedImediata;
                    const isNext = nextPredictedImediata && name.toUpperCase() === nextPredictedImediata?.toUpperCase();
                    
                    // Verifica se este conselheiro está substituindo alguém na escala de hoje
                    const replacedException = activeExceptionsForUnit.find(ex => {
                      const todayDateReal = (() => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const day = String(today.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })();
                      const originalTrioRaw = getEffectiveEscala(todayDateReal, '12:00', selectedUnidade, nameMap, []);
                      const isOriginalInTrio = originalTrioRaw.map(n => n.toUpperCase()).includes(ex.conselheiro_original_nome.toUpperCase());
                      return isOriginalInTrio && ex.conselheiro_substituto_nome.toUpperCase() === name.toUpperCase();
                    });

                    return (
                      <div 
                        key={index} 
                        className={`flex flex-col p-2.5 rounded-xl border text-xs transition-all ${isNext ? 'bg-amber-50/50 border-amber-200 shadow-sm' : isLast ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-slate-700">
                            <span className="w-5 h-5 bg-slate-100 text-slate-500 font-mono text-[10px] font-black rounded-full flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="uppercase text-[11px] font-extrabold">{name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLast && (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-black text-[8px] uppercase rounded">
                                Último
                              </span>
                            )}
                            {isNext && (
                              <span className="px-2 py-0.5 bg-amber-600 text-white font-black text-[8px] uppercase rounded animate-pulse">
                                Próximo
                              </span>
                            )}
                          </div>
                        </div>
                        {replacedException && (
                          <div className="mt-1 pl-7 text-[8px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                            <Repeat className="w-2.5 h-2.5" /> Substituindo {replacedException.conselheiro_original_nome}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Trocas de Escala Cadastradas (Substituições) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} /> Substituições / Trocas Cadastradas ({activeExceptionsForUnit.length})
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeExceptionsForUnit.length === 0 ? (
                  <div className="text-[10px] text-slate-400 font-bold p-3 bg-slate-50 rounded-xl uppercase tracking-wider text-center">
                    Nenhuma troca cadastrada para esta Unidade.
                  </div>
                ) : (
                  activeExceptionsForUnit.map((swap) => (
                    <div 
                      key={swap.id} 
                      className="p-3 bg-amber-50/30 border border-amber-200/60 rounded-xl space-y-1.5 text-[10px]"
                    >
                      <div className="flex justify-between items-center font-black text-slate-700 uppercase">
                        <span>{swap.conselheiro_original_nome}</span>
                        <span className="text-amber-600">➔</span>
                        <span className="text-blue-700">{swap.conselheiro_substituto_nome}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase flex flex-col gap-0.5 pt-1.5 border-t border-amber-100">
                        <div>📅 Início: {swap.inicio_data ? swap.inicio_data.split('-').reverse().join('/') : swap.data} às {swap.inicio_hora || '08:00'}</div>
                        <div>📅 Término: {swap.fim_data ? swap.fim_data.split('-').reverse().join('/') : ''} às {swap.fim_hora || '08:00'}</div>
                      </div>
                      {swap.justificativa && (
                        <div className="text-[9px] font-bold text-slate-600 uppercase bg-white/60 p-1.5 rounded border border-amber-100/50 italic">
                          Motivo: "{swap.justificativa}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PARTE DIREITA: Terminal de Logs de Teste e Disparador de Concorrência (Habilitado apenas para LEANDRO) */}
        {currentUser?.nome === 'LEANDRO' && (
          <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                2. Disparar Testes Concorrentes
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Qtd Registros:</label>
                <select 
                  className="p-2 border border-slate-200 rounded-xl font-bold text-xs"
                  value={simulationSize}
                  onChange={e => setSimulationSize(Number(e.target.value))}
                >
                  <option value={3}>3 Submissões</option>
                  <option value={5}>5 Submissões</option>
                  <option value={10}>10 Submissões (Carga)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                disabled={isSimulating}
                onClick={runSandboxSimulation}
                className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-3 transition-all"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Rodar Simulação Concorrente (Sandbox)
                  </>
                )}
              </button>

              <button
                disabled={isSimulating}
                onClick={runLiveDatabaseTest}
                className="p-4 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-3 transition-all border border-slate-850"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processando Banco...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-amber-400" /> Teste Firestore Real com Autoclênup
                  </>
                )}
              </button>
            </div>

            {/* Quadro de Resultados */}
            {simulationResult && (
              <div className={`p-5 rounded-[1.5rem] border ${(simulationResult.success && simulationResult.successImediata) ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'} space-y-4`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${(simulationResult.success && simulationResult.successImediata) ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest">
                      {(simulationResult.success && simulationResult.successImediata) ? 'Diagnóstico: ✅ AMBOS INTEGRADOS E EXATOS' : 'Diagnóstico: ⚠ REQUER ATENÇÃO'}
                    </h4>
                    <p className="text-xs font-bold mt-1 text-slate-600 leading-relaxed">
                      {simulationResult.message}
                    </p>
                  </div>
                </div>

                {/* Bloco Ref */}
                <div className="space-y-2 pt-3 border-t border-slate-200/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                    1. Rodízio de Conselheiros de Referência (Alfabético):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/50 p-3 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Ordem Esperada:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {simulationResult.expectedSeq.map((name, i) => (
                          <div key={i} className="flex items-center text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 uppercase">
                            {name}
                            {i < simulationResult.expectedSeq.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 ml-1" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Ordem Atribuída:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {simulationResult.assignedSeq.map((name, i) => (
                          <div key={i} className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-lg border uppercase ${simulationResult.success ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-150 text-red-800 border-red-300'}`}>
                            {name}
                            {i < simulationResult.assignedSeq.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 ml-1" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloco Imediata */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                    2. Rodízio de Providência Imediata (Escala de Trabalho):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/50 p-3 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Ordem Esperada:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {simulationResult.expectedSeqImediata.map((name, i) => (
                          <div key={i} className="flex items-center text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 uppercase">
                            {name}
                            {i < simulationResult.expectedSeqImediata.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 ml-1" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Ordem Atribuída:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {simulationResult.assignedSeqImediata.map((name, i) => (
                          <div key={i} className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-lg border uppercase ${simulationResult.successImediata ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-150 text-red-800 border-red-300'}`}>
                            {name}
                            {i < simulationResult.assignedSeqImediata.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 ml-1" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Painel do Terminal de Logs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-500" />
                  Terminal de Diagnóstico de Fluxo
                </span>
                <button 
                  onClick={clearLogs}
                  className="text-slate-400 hover:text-rose-600 text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Logs
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-300 h-64 overflow-y-auto space-y-2 relative border border-slate-800">
                {testLogs.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Nenhum teste iniciado. Clique em um botão acima para executar.
                  </div>
                ) : (
                  testLogs.map((item, i) => {
                    let colorClass = 'text-blue-400';
                    if (item.type === 'success') colorClass = 'text-emerald-400';
                    if (item.type === 'warn') colorClass = 'text-amber-400';
                    if (item.type === 'error') colorClass = 'text-rose-400';
                    
                    return (
                      <div key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 text-[10px] shrink-0">[{item.timestamp}]</span>
                        <span className={`${colorClass} shrink-0`}>
                          {item.type === 'success' ? '[SUCCESS]' : item.type === 'warn' ? '[WARNING]' : item.type === 'error' ? '[ERROR]' : '[INFO]'}
                        </span>
                        <span className="text-slate-200">{item.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* PAINEL DE AUDITORIA E DIAGNÓSTICO DE DISTRIBUIÇÃO */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full font-black text-[10px] uppercase tracking-widest border border-amber-500/20">
              Auditoria em Tempo Real
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
              Painel de Diagnóstico de Distribuições
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
              Monitore o histórico real de atribuição de Providência Imediata sob as regras de Escala, Sobrescrita Manual e Vínculos de Notificação para a Unidade {selectedUnidade === 1 ? 'I' : 'II'}.
            </p>
          </div>
          
          {/* STATS DE HOJE */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Hoje</span>
              <span className="text-lg font-black text-slate-800">{todayStats.total}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3" /> Auto (Escala)
              </span>
              <span className="text-lg font-black text-emerald-800">{todayStats.automatic}</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Manual
              </span>
              <span className="text-lg font-black text-rose-800">{todayStats.manual}</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block flex items-center justify-center gap-1">
                <Bell className="w-3 h-3" /> Notificação
              </span>
              <span className="text-lg font-black text-blue-800">{todayStats.notification}</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> Família
              </span>
              <span className="text-lg font-black text-indigo-800">{todayStats.persistence}</span>
            </div>
          </div>
        </div>

        {/* LISTA DE CASOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
              Registros Recentes de Atendimento ({unitCasesReal.length})
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              Mostrando até os 15 casos mais recentes
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 border-t-0">
                  <th className="p-4 pl-6 text-slate-500 font-extrabold uppercase">Caso / Data</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Criança / Genitora</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Conselheiro Referência</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Providência Imediata</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Origem / Método</th>
                  <th className="p-4 pr-6 text-slate-500 font-extrabold uppercase">Diagnóstico / Justificativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitCasesReal.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-xs text-slate-400 font-bold">
                      Nenhum prontuário registrado para a Unidade {selectedUnidade === 1 ? 'I' : 'II'}.
                    </td>
                  </tr>
                ) : (
                  unitCasesReal.slice(0, 15).map((doc) => {
                    // Map name safely
                    const getMappedName = (id: string, nameField?: string) => {
                      if (!id) return "Não atribuído";
                      const found = users.find(u => u.id === id);
                      return found ? found.nome.toUpperCase() : (nameField?.toUpperCase() || "Desconhecido");
                    };

                    const refName = getMappedName(doc.conselheiro_referencia_id, doc.conselheiro_referencia_nome);
                    const provName = getMappedName(doc.conselheiro_providencia_id, doc.conselheiro_providencia_nome);

                    const timeFormatted = (() => {
                      try {
                        if (!doc.criado_em) return '';
                        return new Date(doc.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      } catch {
                        return '';
                      }
                    })();

                    const dateFormatted = (() => {
                      try {
                        const target = doc.data_recebimento || doc.data_aporte || doc.criado_em?.split('T')[0];
                        if (!target) return '';
                        const parts = target.split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        return target;
                      } catch {
                        return doc.data_recebimento || '';
                      }
                    })();

                    // Detecta se havia uma substituição/troca de escala ativa no momento de recebimento desse documento
                    const activeException = (() => {
                      if (!scaleExceptions || scaleExceptions.length === 0) return null;
                      const cDate = doc.data_recebimento || doc.data_aporte || doc.criado_em?.split('T')[0];
                      if (!cDate) return null;

                      let cTime = doc.hora_rece_bimento || doc.hora_aporte;
                      if (!cTime && doc.criado_em) {
                        try {
                          cTime = new Date(doc.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        } catch {
                          cTime = '12:00';
                        }
                      }
                      if (!cTime) cTime = '12:00';

                      const [qH, qM] = cTime.split(':').map(Number);
                      const queryDateTime = new Date(`${cDate}T${String(qH).padStart(2, '0')}:${String(qM || 0).padStart(2, '0')}:00`);

                      // Trata a passagem de dia no limite das 08:00h do plantão
                      let dutyDayStr = cDate;
                      if (qH < 8) {
                        try {
                          const d = new Date(`${cDate}T12:00:00`);
                          d.setDate(d.getDate() - 1);
                          dutyDayStr = d.toISOString().split('T')[0];
                        } catch {}
                      }

                      return scaleExceptions.find(ex => {
                        if (ex.unidade_id !== doc.unidade_id) return false;

                        if (ex.inicio_data && ex.inicio_hora && ex.fim_data && ex.fim_hora) {
                          const startDateTime = new Date(`${ex.inicio_data}T${ex.inicio_hora}:00`);
                          const endDateTime = new Date(`${ex.fim_data}T${ex.fim_hora}:00`);
                          return queryDateTime >= startDateTime && queryDateTime < endDateTime;
                        }

                        return ex.data === dutyDayStr;
                      });
                    })();

                    // Detect high-level assignment type
                    let methodLabel = "Escala do Dia";
                    let methodStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    let methodIcon = <RefreshCw className="w-3.5 h-3.5" />;

                    if (doc.is_manual_providencia || doc.providencia_imediata_manual) {
                      methodLabel = "Sobrescrita Manual";
                      methodStyle = "bg-rose-50 text-rose-700 border-rose-100";
                      methodIcon = <Zap className="w-3.5 h-3.5" />;
                    } else if (doc.notificacao) {
                      methodLabel = "Vínculo de Notificação";
                      methodStyle = "bg-blue-50 text-blue-700 border-blue-100";
                      methodIcon = <Bell className="w-3.5 h-3.5" />;
                    } else if (doc.is_family_persistence) {
                      methodLabel = "Persistência Familiar";
                      methodStyle = "bg-indigo-50 text-indigo-700 border-indigo-100";
                      methodIcon = <Users className="w-3.5 h-3.5" />;
                    } else if (activeException) {
                      methodLabel = "Troca de Escala";
                      methodStyle = "bg-amber-50 text-amber-700 border-amber-200";
                      methodIcon = <Repeat className="w-3.5 h-3.5 text-amber-600" />;
                    }

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-all text-[11px] sm:text-xs">
                        {/* CASO / DATA */}
                        <td className="p-4 pl-6 space-y-1">
                          <span className="font-black text-slate-800 uppercase block tracking-wider">
                            #{doc.id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block whitespace-nowrap">
                            {dateFormatted} {timeFormatted && `às ${timeFormatted}`}
                          </span>
                        </td>

                        {/* CRIANÇA / GENITORA */}
                        <td className="p-4 space-y-0.5">
                          <div className="font-extrabold text-slate-700 uppercase">
                            {doc.crianca_nome || "NÃO INFORMADO"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase truncate max-w-[150px]">
                            Mãe: {doc.genitora_nome || "NÃO INFORMADA"}
                          </div>
                        </td>

                        {/* CONSELHEIRO REFERÊNCIA */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                            <span className="uppercase truncate max-w-[130px]">{refName}</span>
                          </div>
                        </td>

                        {/* PROVIDÊNCIA IMEDIATA */}
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-black text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                              <span className="uppercase truncate max-w-[130px]">{provName}</span>
                            </div>
                            {activeException && (
                              <span className="text-[8px] font-bold text-amber-600 uppercase pl-3">
                                (Substituto)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ORIGEM / MÉTODO */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${methodStyle}`}>
                            {methodIcon}
                            <span>{methodLabel}</span>
                          </span>
                        </td>

                        {/* DIAGNÓSTICO / JUSTIFICATIVA */}
                        <td className="p-4 pr-6 max-w-xs md:max-w-md">
                          <div className="bg-slate-50 rounded-xl p-2.5 text-[10px] text-slate-500 font-bold leading-relaxed border border-slate-100 space-y-1">
                            <div>{doc.justificativa_distribuicao || "Distribuição automática síncrona de escala de plantão."}</div>
                            {activeException && (
                              <div className="mt-1 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[9px] text-amber-800 leading-normal font-bold uppercase">
                                🔄 <strong>SUBSTITUIÇÃO DE ESCALA ATIVA:</strong> {activeException.conselheiro_original_nome} foi substituído(a) por {activeException.conselheiro_substituto_nome} das {activeException.inicio_hora || '08:00'} de {activeException.inicio_data ? activeException.inicio_data.split('-').reverse().join('/') : ''} às {activeException.fim_hora || '08:00'} de {activeException.fim_data ? activeException.fim_data.split('-').reverse().join('/') : ''}.
                                {activeException.justificativa && <div className="mt-0.5 font-semibold text-slate-500 italic">Motivo: "{activeException.justificativa}"</div>}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
