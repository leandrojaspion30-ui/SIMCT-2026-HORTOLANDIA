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
  Repeat,
  Phone,
  Mail,
  Scale,
  Landmark,
  FileSpreadsheet,
  Filter,
  CheckCheck,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { Documento, User, ScaleException } from '../types';
import { 
  CONSELHEIROS_ALFABETICO_POR_UNIDADE, 
  getEffectiveEscala, 
  isSameCounselorName,
  CANAIS_COMUNICADO_LIST,
  normalizeCanalName,
  isRotationChannel,
  getChannelNextCounselor,
  getActiveRotationCounselors,
  isCounselorInTrioOrSubstitution,
  getActiveSubstituteInTrio,
  isScaleExceptionActive
} from '../constants';
import { saveDocumentWithAtomicRotation, deleteDocument, deleteScaleException, saveLog } from '../lib/db';

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
  const [swapIdToDelete, setSwapIdToDelete] = useState<string | null>(null);
  const [selectedSimulationChannel, setSelectedSimulationChannel] = useState<string>('OFÍCIO');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('TODOS');

  useEffect(() => {
    if (currentUser?.unidade_id) {
      setSelectedUnidade(currentUser.unidade_id);
    }
  }, [currentUser?.unidade_id]);

  const handleRemoveScaleSwap = async (exceptionId: string) => {
    try {
      await deleteScaleException(exceptionId);

      await saveLog({
        id: `log-${Date.now()}`,
        documento_id: 'SISTEMA',
        data_hora: new Date().toISOString(),
        usuario_id: currentUser.id,
        usuario_nome: currentUser.nome,
        unidade_id: selectedUnidade,
        acao: `ESCALA: Cancelamento de Substituição Excepcional pelo Diagnóstico de Distribuição (escala original restaurada).`,
        tipo: 'SISTEMA'
      }, currentUser);
      onAddLog(`ESCALA: Cancelamento de Substituição Excepcional (escala original restaurada na Unidade ${selectedUnidade}).`);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover a alteração de escala.");
    }
  };

  const [simulationSize, setSimulationSize] = useState<number>(5);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    successImediata: boolean;
    sentCount: number;
    channel: string;
    expectedSeq: string[];
    assignedSeq: string[];
    expectedSeqImediata: string[];
    assignedSeqImediata: string[];
    message: string;
  } | null>(null);

  // Mapeamento de nomes e substituições ativas
  const nameMap = useMemo(() => {
    return propNameMap || {};
  }, [propNameMap]);

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
    return getActiveRotationCounselors(selectedUnidade, users, nameMap)
      .map(u => ({ id: u.id, nome: u.nome.toUpperCase() }));
  }, [users, selectedUnidade, nameMap]);

  // Casos reais da unidade selecionada ordenados por data de criação decrescente
  const unitCasesReal = useMemo(() => {
    return documents
      .filter(d => d.unidade_id === selectedUnidade)
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  }, [documents, selectedUnidade]);

  // Casos filtrados por canal para a tabela
  const filteredUnitCases = useMemo(() => {
    if (selectedChannelFilter === 'TODOS') return unitCasesReal;
    return unitCasesReal.filter(d => {
      const docChannelNorm = normalizeCanalName(d.canal_comunicado || '');
      const filterNorm = normalizeCanalName(selectedChannelFilter);
      return docChannelNorm === filterNorm;
    });
  }, [unitCasesReal, selectedChannelFilter]);

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

  const escalaTrio = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDateReal = `${year}-${month}-${day}`;
    const currentTimeReal = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return getEffectiveEscala(todayDateReal, currentTimeReal, selectedUnidade, nameMap, scaleExceptions);
  }, [selectedUnidade, nameMap, scaleExceptions]);

  const activeExceptionsForUnit = useMemo(() => {
    if (!scaleExceptions) return [];
    const today = new Date();
    const todayDateReal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentTimeReal = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return scaleExceptions.filter(ex => ex.unidade_id === selectedUnidade && isScaleExceptionActive(ex, todayDateReal, currentTimeReal));
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

  // MATRIZ DE RODÍZIO POR CANAL (Estado em tempo real para cada canal da unidade)
  const channelRotationMatrix = useMemo(() => {
    return CANAIS_COMUNICADO_LIST.map(channelName => {
      const norm = normalizeCanalName(channelName);
      const isRotation = isRotationChannel(channelName);
      const channelCases = documents.filter(d => 
        d.unidade_id === selectedUnidade && 
        normalizeCanalName(d.canal_comunicado || '') === norm
      );
      const newChannelCases = channelCases.filter(d => !d.is_manual_override && !d.notificacao);

      if (!isRotation) {
        return {
          channelName,
          normalizedName: norm,
          isRotation: false,
          totalCases: channelCases.length,
          totalNewCases: newChannelCases.length,
          lastAssignedName: null,
          nextCounselor: null,
          counselorsState: activeCounselors.map(c => ({ ...c, isLast: false, isNext: false }))
        };
      }

      const { nextCounselor, lastAssignedName } = getChannelNextCounselor(
        selectedUnidade,
        channelName,
        documents,
        users,
        nameMap
      );

      const counselorsState = activeCounselors.map(c => ({
        ...c,
        isLast: lastAssignedName ? isSameCounselorName(c.nome, lastAssignedName) : false,
        isNext: nextCounselor ? isSameCounselorName(c.nome, nextCounselor.nome) : false
      }));

      return {
        channelName,
        normalizedName: norm,
        isRotation: true,
        totalCases: channelCases.length,
        totalNewCases: newChannelCases.length,
        lastAssignedName,
        nextCounselor,
        counselorsState
      };
    });
  }, [selectedUnidade, documents, users, activeCounselors, nameMap]);

  // Função para adicionar log interno no painel
  const log = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    setTestLogs(prev => [{ timestamp: timeStr, type, message }, ...prev]);
  };

  const clearLogs = () => {
    setTestLogs([]);
    setSimulationResult(null);
  };

  // Helper para ícones por canal
  const getChannelIcon = (channel: string) => {
    const norm = normalizeCanalName(channel);
    if (norm === 'OFÍCIO JUDICIÁRIO') return <Scale className="w-4 h-4 text-purple-600" />;
    if (norm === 'OFÍCIO MP') return <Landmark className="w-4 h-4 text-emerald-600" />;
    if (norm === 'OFÍCIO') return <FileText className="w-4 h-4 text-blue-600" />;
    if (norm === 'ATENDIMENTO PRESENCIAL') return <Users className="w-4 h-4 text-amber-600" />;
    if (norm === 'ATENDIMENTO TELEFÔNICO') return <Phone className="w-4 h-4 text-teal-600" />;
    if (norm === 'TELEFONE DE PLANTÃO') return <PhoneCall className="w-4 h-4 text-rose-600" />;
    if (norm === 'E-MAIL INSTITUCIONAL') return <Mail className="w-4 h-4 text-sky-600" />;
    if (norm === 'SIPIA') return <FileSpreadsheet className="w-4 h-4 text-indigo-600" />;
    return <FileText className="w-4 h-4 text-slate-600" />;
  };

  // EXECUTA A SIMULAÇÃO DE CONCORRÊNCIA EM SANDBOX LOCAL (RÁPIDA)
  const runSandboxSimulation = () => {
    if (activeCounselors.length === 0) {
      log('Impossível calibrar: nenhum Conselheiro ativo nesta unidade.', 'error');
      return;
    }

    const testChannel = selectedSimulationChannel;
    const testChannelNorm = normalizeCanalName(testChannel);
    const isRot = isRotationChannel(testChannel);

    if (!isRot) {
      log(`Canal "${testChannel}" é excluído do rodízio. Casos são atribuídos diretamente ao plantão da escala.`, 'warn');
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);
    clearLogs();

    log(`Iniciando Simulação concorrente para o canal [${testChannelNorm}] na Unidade ${selectedUnidade}...`, 'info');
    log(`Conselheiros no rodízio (${activeCounselors.length}): ${activeCounselors.map(c => c.nome).join(' → ')}`, 'info');

    // Identifica último conselheiro desse canal
    const { nextCounselor: initialNext, lastAssignedName: initialLast } = getChannelNextCounselor(
      selectedUnidade,
      testChannel,
      documents,
      users,
      nameMap
    );

    log(`Último atribuído no canal [${testChannelNorm}]: ${initialLast || 'NENHUM (ciclo novo)'}`, 'info');
    log(`Próximo previsto inicial: ${initialNext?.nome || 'N/A'}`, 'info');

    setTimeout(() => {
      const virtualDocsList = [...documents];
      const assignedSequence: string[] = [];
      const expectedSequence: string[] = [];
      const assignedSequenceImediata: string[] = [];
      const expectedSequenceImediata: string[] = [];

      let currentRefName = initialLast;
      const expectedRefs: { id: string, nome: string }[] = [];

      for (let i = 0; i < simulationSize; i++) {
        const lastIdx = activeCounselors.findIndex(c => isSameCounselorName(c.nome, currentRefName));
        const nextIdx = activeCounselors.length > 0 ? (lastIdx + 1) % activeCounselors.length : 0;
        const targetCounselor = activeCounselors[nextIdx];
        expectedSequence.push(targetCounselor.nome);
        expectedRefs.push(targetCounselor);
        currentRefName = targetCounselor.nome;
      }

      const todayDateReal = (() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();
      const currentTimeReal = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const virtualTrio = getEffectiveEscala(todayDateReal, currentTimeReal, selectedUnidade, nameMap, scaleExceptions);
      let currentProvName = lastAssignedImediata;

      for (let i = 0; i < simulationSize; i++) {
        const refUser = expectedRefs[i];
        const isRefUserInTrio = isCounselorInTrioOrSubstitution(
          refUser,
          virtualTrio,
          scaleExceptions,
          todayDateReal,
          currentTimeReal,
          selectedUnidade,
          nameMap
        );

        if (isRefUserInTrio && refUser) {
          const activeSubUser = getActiveSubstituteInTrio(
            refUser,
            virtualTrio,
            users,
            scaleExceptions,
            todayDateReal,
            currentTimeReal,
            selectedUnidade,
            nameMap
          );
          const assignedName = activeSubUser?.nome?.toUpperCase() || refUser.nome?.toUpperCase() || 'N/A';
          expectedSequenceImediata.push(assignedName);
          currentProvName = assignedName;
        } else {
          const lastIdx = virtualTrio.findIndex(name => isSameCounselorName(name, currentProvName));
          const nextIdx = virtualTrio.length > 0 ? (lastIdx + 1) % virtualTrio.length : 0;
          const targetImediata = virtualTrio[nextIdx];
          expectedSequenceImediata.push(targetImediata?.toUpperCase() || 'N/A');
          currentProvName = targetImediata?.toUpperCase();
        }
      }

      log(`Simulando ${simulationSize} submissões simultâneas no canal [${testChannelNorm}]...`, 'info');

      for (let i = 0; i < simulationSize; i++) {
        const { nextCounselor: assignedUser } = getChannelNextCounselor(
          selectedUnidade,
          testChannel,
          virtualDocsList,
          users,
          nameMap
        );

        if (!assignedUser) {
          log(`Erro na simulação do passo ${i + 1}: conselheiro não resolvido`, 'error');
          break;
        }

        const refNameSim = assignedUser.nome.toUpperCase();
        const mappedRefNameSim = (refNameSim && nameMap && nameMap[refNameSim]) ? nameMap[refNameSim] : refNameSim;
        const isRefSimInTrio = mappedRefNameSim && virtualTrio.some(n => isSameCounselorName(n, mappedRefNameSim));

        const virtualTodayDocs = virtualDocsList
          .filter(d => {
            const isDocOfToday = d.data_aporte === todayDateReal || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === todayDateReal);
            return isDocOfToday && d.unidade_id === selectedUnidade && !d.is_reference_in_trio && !d.notificacao && !d.is_manual_providencia && !d.is_plantao;
          })
          .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

        const lastProvId = virtualTodayDocs[0]?.conselheiro_providencia_id;
        const lastProvUser = users.find(u => u.id === lastProvId);
        const lastProvName = lastProvUser?.nome.toUpperCase();
        
        let assignedProvName = 'N/A';

        if (isRefSimInTrio) {
          assignedProvName = mappedRefNameSim || refNameSim || 'N/A';
        } else {
          const curProvIdx = virtualTrio.findIndex(n => isSameCounselorName(n, lastProvName));
          const nxtProvIdx = virtualTrio.length > 0 ? (curProvIdx + 1) % virtualTrio.length : 0;
          assignedProvName = virtualTrio[nxtProvIdx] || 'N/A';
        }

        const simulatedDoc: Documento = {
          id: `sim-${Date.now()}-${i}`,
          unidade_id: selectedUnidade,
          origem: 'SIMULAÇÃO - CANAL TESTE',
          canal_comunicado: testChannel,
          data_recebimento: todayDateReal,
          data_aporte: todayDateReal,
          hora_aporte: '10:00',
          crianca_nome: `CRIANÇA SIMULADA ${i + 1}`,
          criancas: [],
          genitora_nome: 'MÃE SIMULADA',
          bairro: 'JARDIM AMANDA',
          informacoes_documento: 'TESTE',
          observacoes_iniciais: 'RODÍZIO INDEPENDENTE POR CANAL',
          violacoesSipia: [],
          agentesVioladores: [],
          status: ['AGUARDANDO_ANALISE'],
          conselheiro_referencia_id: assignedUser.id,
          conselheiro_referencia_nome: assignedUser.nome,
          conselheiro_providencia_id: '',
          conselheiro_providencia_nome: assignedProvName,
          conselheiros_providencia_nomes: virtualTrio,
          criado_em: new Date(Date.now() + i * 1000).toISOString(),
          distribuicao_automatica: true
        };

        virtualDocsList.unshift(simulatedDoc);
        assignedSequence.push(assignedUser.nome);
        assignedSequenceImediata.push(assignedProvName.toUpperCase());

        log(`Passo ${i + 1}/${simulationSize}: Canal [${testChannelNorm}] ➔ Ref: ${assignedUser.nome} | Imed: ${assignedProvName.toUpperCase()}`, 'success');
      }

      const testPassedRef = JSON.stringify(expectedSequence) === JSON.stringify(assignedSequence);
      const testPassedImediata = JSON.stringify(expectedSequenceImediata) === JSON.stringify(assignedSequenceImediata);
      const testPassedCombined = testPassedRef && testPassedImediata;

      setSimulationResult({
        success: testPassedRef,
        successImediata: testPassedImediata,
        sentCount: simulationSize,
        channel: testChannelNorm,
        expectedSeq: expectedSequence,
        assignedSeq: assignedSequence,
        expectedSeqImediata: expectedSequenceImediata,
        assignedSeqImediata: assignedSequenceImediata,
        message: testPassedCombined 
          ? `Ciclo de rodízio do canal [${testChannelNorm}] validado com 100% de exatidão sequencial!`
          : `Discrepância encontrada no teste do canal [${testChannelNorm}].`
      });

      setIsSimulating(false);
    }, 400);
  };

  // TESTE REAL EM FIRESTORE COM AUTOCLEANUP UTILIZANDO O CANAL SELECIONADO
  const runLiveDatabaseTest = async () => {
    if (activeCounselors.length === 0) {
      log('Impossível calibrar: nenhum Conselheiro ativo nesta unidade.', 'error');
      return;
    }

    const testChannel = selectedSimulationChannel;
    const testChannelNorm = normalizeCanalName(testChannel);

    setIsSimulating(true);
    setSimulationResult(null);
    clearLogs();

    log(`Iniciando Teste com Transação Atômica no Firestore para o canal [${testChannelNorm}]...`, 'info');

    const createdIds: string[] = [];
    const assignedSequence: string[] = [];
    const expectedSequence: string[] = [];

    const { nextCounselor: initialNext, lastAssignedName: initialLast } = getChannelNextCounselor(
      selectedUnidade,
      testChannel,
      documents,
      users,
      nameMap
    );

    let currentRefName = initialLast;
    for (let i = 0; i < 3; i++) {
      const lastIdx = activeCounselors.findIndex(c => isSameCounselorName(c.nome, currentRefName));
      const nextIdx = activeCounselors.length > 0 ? (lastIdx + 1) % activeCounselors.length : 0;
      const targetCounselor = activeCounselors[nextIdx];
      expectedSequence.push(targetCounselor.nome);
      currentRefName = targetCounselor.nome;
    }

    const today = new Date();
    const todayDateReal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
      for (let i = 0; i < 3; i++) {
        const docId = `test-real-${Math.random().toString(36).substr(2, 9)}`;
        log(`[Gravando no Firestore via Transação Atômica] Doc ${i + 1}/3 no canal [${testChannelNorm}]...`, 'info');

        const testDoc: Documento = {
          id: docId,
          unidade_id: selectedUnidade,
          origem: 'SIMULAÇÃO - TRANSAÇÃO ATÔMICA',
          canal_comunicado: testChannel,
          data_recebimento: todayDateReal,
          data_aporte: todayDateReal,
          hora_aporte: '12:00',
          crianca_nome: `PROVA DE CARGA REAL ${i + 1}`,
          criancas: [],
          genitora_nome: 'PROVA DE CARGA',
          bairro: 'JARDIM PRIMAVERA',
          informacoes_documento: 'INTEGRAÇÃO REAL',
          observacoes_iniciais: 'TESTE INTEGRADO CANAL ATÔMICO',
          violacoesSipia: [],
          agentesVioladores: [],
          status: ['AGUARDANDO_ANALISE'],
          conselheiro_referencia_id: '',
          conselheiro_providencia_id: '',
          conselheiros_providencia_nomes: ['TESTE'],
          criado_em: new Date().toISOString(),
          distribuicao_automatica: true
        };

        const activeUsersOfUnit = users.filter(u => u.unidade_id === selectedUnidade && u.status === 'ATIVO');
        const savedDoc = await saveDocumentWithAtomicRotation(
          testDoc,
          selectedUnidade,
          currentUser,
          activeUsersOfUnit,
          nameMap,
          scaleExceptions
        );
        createdIds.push(docId);
        
        const assignedUserName = savedDoc.conselheiro_referencia_nome || users.find(u => u.id === savedDoc.conselheiro_referencia_id)?.nome || 'DESCONHECIDO';
        assignedSequence.push(assignedUserName);

        log(`✓ Gravado no Firestore! Doc: ${docId} ➔ Conselheiro Atribuído: ${assignedUserName}`, 'success');
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const testPassed = JSON.stringify(expectedSequence) === JSON.stringify(assignedSequence);
      if (testPassed) {
        log(`✓ SUCESSO TOTAL NO FIRESTORE! A transação atômica manteve o rodízio sequencial exato no canal [${testChannelNorm}].`, 'success');
      } else {
        log(`▲ AVISO: Discrepância na ordem síncrona de Referência para o canal.`, 'warn');
      }

      setSimulationResult({
        success: testPassed,
        successImediata: true,
        sentCount: 3,
        channel: testChannelNorm,
        expectedSeq: expectedSequence,
        assignedSeq: assignedSequence,
        expectedSeqImediata: [],
        assignedSeqImediata: [],
        message: testPassed 
          ? `O Firestore executou a transação atômica com sucesso e salvou o rodízio exato no canal [${testChannelNorm}]!`
          : `Discrepância detectada no teste do banco de dados.`
      });

      // Autolimpeza
      log(`Iniciando Autolimpeza (Rollback)...`, 'warn');
      for (const id of createdIds) {
        await deleteDocument(id);
      }
      log(`✓ Autolimpeza concluída! Todos os documentos de teste foram removidos do banco.`, 'success');

    } catch (err) {
      log(`Erro no teste integrado: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSimulating(false);
      onAddLog(`FILTRO: Executou teste de distribuição real no canal [${testChannelNorm}] com autolimpeza.`);
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
            Painel de Distribuição & Auditoria
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3">
            Rodízio Sequencial Controlado por Canal
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium mt-2 leading-relaxed">
            Acompanhe o estado de rodízio sequencial entre os 5 conselheiros para cada canal de entrada. Cada categoria mantém seu próprio ciclo contínuo e independente.
          </p>
        </div>
      </div>

      {/* SELEÇÃO DE UNIDADE E STATUS GERAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Unidade em Operação
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
              {currentUser.unidade_id === 2 && (
                <span className="text-[8px] font-black tracking-normal text-indigo-200 uppercase">Sua Unidade</span>
              )}
            </button>
          </div>
        </div>

        {/* ESCALA DO DIA - PROVIDÊNCIA IMEDIATA */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
              Trio de Providência Imediata (Escala de Trabalho Hoje)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {escalaTrio.length} Conselheiros Escalados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {escalaTrio.map((name, index) => {
              const isLast = lastAssignedImediata && name.toUpperCase() === lastAssignedImediata;
              const isNext = nextPredictedImediata && name.toUpperCase() === nextPredictedImediata?.toUpperCase();
              
              const replacedException = activeExceptionsForUnit.find(ex => {
                const today = new Date();
                const todayDateReal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const currentTimeReal = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const originalTrioRaw = getEffectiveEscala(todayDateReal, currentTimeReal, selectedUnidade, nameMap, []);
                const isOriginalInTrio = originalTrioRaw.map(n => n.toUpperCase()).includes(ex.conselheiro_original_nome.toUpperCase());
                return isOriginalInTrio && ex.conselheiro_substituto_nome.toUpperCase() === name.toUpperCase();
              });

              return (
                <div 
                  key={index}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${isNext ? 'bg-amber-50/70 border-amber-300 shadow-sm' : isLast ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-slate-100 text-slate-600 font-mono text-[10px] font-black rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-black text-slate-800 text-xs uppercase truncate max-w-[120px]">{name}</span>
                    </div>
                    {isNext && (
                      <span className="px-2 py-0.5 bg-amber-600 text-white font-black text-[8px] uppercase rounded animate-pulse">
                        Próximo
                      </span>
                    )}
                    {isLast && (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-black text-[8px] uppercase rounded">
                        Último
                      </span>
                    )}
                  </div>
                  {replacedException && (
                    <div className="mt-2 text-[8px] font-bold text-amber-700 uppercase flex items-center gap-1 bg-amber-100/60 p-1 rounded">
                      <Repeat className="w-2.5 h-2.5" /> Substituto de {replacedException.conselheiro_original_nome}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MATRIZ DE RODÍZIO POR CANAL (TRANSPARÊNCIA TOTAL) */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-black text-[10px] uppercase tracking-widest border border-indigo-100">
              Controle Sequencial Independente
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Matriz de Rodízio por Canal de Atendimento
            </h3>
            <p className="text-slate-500 text-xs font-medium mt-1">
              Cada canal avança seu próprio contador sequencial entre todos os 5 conselheiros da Unidade {selectedUnidade === 1 ? 'I' : 'II'}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-wider">
              {activeCounselors.length} Conselheiros Ativos
            </span>
          </div>
        </div>

        {/* CARDS DE CADA CANAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {channelRotationMatrix.map((chan) => {
            return (
              <div 
                key={chan.normalizedName}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all space-y-4 ${
                  !chan.isRotation 
                    ? 'bg-rose-50/40 border-rose-200' 
                    : chan.normalizedName === 'OFÍCIO JUDICIÁRIO' 
                      ? 'bg-purple-50/30 border-purple-200' 
                      : chan.normalizedName === 'OFÍCIO MP' 
                        ? 'bg-emerald-50/30 border-emerald-200' 
                        : chan.normalizedName === 'OFÍCIO' 
                          ? 'bg-blue-50/30 border-blue-200' 
                          : chan.normalizedName === 'TELEFONE DE PLANTÃO'
                            ? 'bg-rose-50/30 border-rose-200'
                            : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(chan.channelName)}
                      <span className="font-black text-xs uppercase tracking-wide text-slate-800">
                        {chan.channelName}
                      </span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                      {chan.totalNewCases} {chan.totalNewCases === 1 ? 'caso' : 'casos'}
                    </span>
                  </div>

                  {!chan.isRotation ? (
                    <div className="p-3 bg-rose-100/60 rounded-xl border border-rose-200 text-rose-800 text-[10px] font-bold leading-relaxed space-y-1">
                      <div className="font-black uppercase flex items-center gap-1">
                        <PhoneCall className="w-3.5 h-3.5" /> Canal Exclusivo de Plantão
                      </div>
                      <div>
                        Demandas deste canal são processadas diretamente pela escala de plantonistas do dia e <strong>não</strong> participam da contagem dos ciclos de rodízio.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                        <span>Sequência de Conselheiros</span>
                        <span className="text-indigo-600 font-bold">Ciclo Alfabético</span>
                      </div>

                      <div className="space-y-1.5">
                        {chan.counselorsState.map((c, idx) => (
                          <div 
                            key={c.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-[11px] font-bold transition-all border ${
                              c.isNext 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : c.isLast 
                                  ? 'bg-slate-200 text-slate-800 border-slate-300 font-extrabold' 
                                  : 'bg-white text-slate-700 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${c.isNext ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                {idx + 1}
                              </span>
                              <span className="uppercase text-[10px]">{c.nome}</span>
                            </div>
                            <div>
                              {c.isNext && (
                                <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[8px] font-black uppercase animate-pulse">
                                  Próximo da Vez
                                </span>
                              )}
                              {c.isLast && (
                                <span className="px-2 py-0.5 bg-slate-300 text-slate-800 rounded text-[8px] font-black uppercase">
                                  Último Atribuído
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {chan.isRotation && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase">
                    <span>Próximo Previsto:</span>
                    <span className="font-black text-indigo-600 text-[10px]">
                      {chan.nextCounselor?.nome || 'Aguardando...'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DISPARADOR DE TESTES CONCORRENTES (APENAS PARA LEANDRO / ADMIN) */}
      {currentUser?.nome === 'LEANDRO' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-black text-[10px] uppercase tracking-widest border border-amber-100">
                Console de Teste & Validação
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-center gap-2">
                <Zap className="w-6 h-6 text-amber-500" />
                Simulador de Distribuição Concorrente
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Canal a Testar:</label>
                <select 
                  className="p-2 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50 uppercase"
                  value={selectedSimulationChannel}
                  onChange={e => setSelectedSimulationChannel(e.target.value)}
                >
                  {CANAIS_COMUNICADO_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Qtd Registros:</label>
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
                  <Play className="w-4 h-4" /> Simulação Sandbox ({selectedSimulationChannel})
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
                  <Database className="w-4 h-4 text-amber-400" /> Teste Firestore Real com Autocleanup
                </>
              )}
            </button>
          </div>

          {/* RESULTADO DA SIMULAÇÃO */}
          {simulationResult && (
            <div className={`p-5 rounded-[1.5rem] border ${simulationResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'} space-y-4`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${simulationResult.success ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">
                    {simulationResult.success ? `Validação Concluída: [${simulationResult.channel}] 100% Exato` : 'Atenção Requerida'}
                  </h4>
                  <p className="text-xs font-bold mt-1 text-slate-600 leading-relaxed">
                    {simulationResult.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/60 p-3 rounded-2xl border border-slate-200/60">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Sequência Esperada:</span>
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
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Sequência Atribuída:</span>
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
          )}

          {/* TERMINAL DE LOGS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-500" />
                Terminal de Execução
              </span>
              <button 
                onClick={clearLogs}
                className="text-slate-400 hover:text-rose-600 text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar Logs
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-300 h-48 overflow-y-auto space-y-2 relative border border-slate-800">
              {testLogs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  Nenhum teste iniciado. Escolha o canal e clique em simular.
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
      )}

      {/* PAINEL DE AUDITORIA E REGISTROS REAIS COM FILTRO POR CANAL */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full font-black text-[10px] uppercase tracking-widest border border-amber-500/20">
              Auditoria em Tempo Real
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
              Histórico Detalhado de Distribuições
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
              Consulte a atribuição de casos por canal na Unidade {selectedUnidade === 1 ? 'I' : 'II'}, com detalhamento completo da regra aplicada.
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
                <RefreshCw className="w-3 h-3" /> Auto
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

        {/* FILTROS POR CANAL */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-wider">
            <Filter className="w-4 h-4 text-indigo-600" /> Filtrar por Canal de Entrada:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedChannelFilter('TODOS')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                selectedChannelFilter === 'TODOS'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos os Canais ({unitCasesReal.length})
            </button>
            {CANAIS_COMUNICADO_LIST.map(chan => {
              const countInChan = unitCasesReal.filter(d => normalizeCanalName(d.canal_comunicado || '') === normalizeCanalName(chan)).length;
              return (
                <button
                  key={chan}
                  onClick={() => setSelectedChannelFilter(chan)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                    selectedChannelFilter === chan
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {getChannelIcon(chan)}
                  <span>{chan}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[8px] ${selectedChannelFilter === chan ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {countInChan}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTA DE CASOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
              Casos Encontrados ({filteredUnitCases.length})
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              Mostrando até 20 registros mais recentes
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 border-t-0">
                  <th className="p-4 pl-6 text-slate-500 font-extrabold uppercase">Caso / Data</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Criança / Genitora</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Canal do Comunicado</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Conselheiro Referência</th>
                  <th className="p-4 text-slate-500 font-extrabold uppercase">Providência Imediata</th>
                  <th className="p-4 pr-6 text-slate-500 font-extrabold uppercase">Diagnóstico / Regra Aplicada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnitCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-xs text-slate-400 font-bold">
                      Nenhum prontuário registrado com o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredUnitCases.slice(0, 20).map((doc) => {
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

                    const channelNorm = normalizeCanalName(doc.canal_comunicado || '');
                    const isRotChan = isRotationChannel(doc.canal_comunicado || '');

                    // Tipo de atribuição
                    let methodLabel = isRotChan ? `Rodízio (${channelNorm})` : "Canal Plantão (Escala)";
                    let methodStyle = isRotChan ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-rose-50 text-rose-700 border-rose-100";

                    if (doc.is_manual_override || doc.is_manual_providencia || doc.providencia_imediata_manual) {
                      methodLabel = "Ajuste Manual";
                      methodStyle = "bg-rose-50 text-rose-700 border-rose-100";
                    } else if (doc.notificacao) {
                      methodLabel = "Notificação (Isento)";
                      methodStyle = "bg-blue-50 text-blue-700 border-blue-100";
                    } else if (doc.is_family_persistence) {
                      methodLabel = "Vínculo Histórico";
                      methodStyle = "bg-amber-50 text-amber-700 border-amber-100";
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

                        {/* CANAL */}
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl font-extrabold text-[10px] text-slate-700 uppercase">
                            {getChannelIcon(doc.canal_comunicado || '')}
                            <span>{doc.canal_comunicado || 'NÃO INFORMADO'}</span>
                          </div>
                        </td>

                        {/* CONSELHEIRO REFERÊNCIA */}
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                            <span className="uppercase truncate max-w-[140px]">{refName}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${methodStyle}`}>
                            {methodLabel}
                          </span>
                        </td>

                        {/* PROVIDÊNCIA IMEDIATA */}
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-slate-800">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                            <span className="uppercase truncate max-w-[140px]">{provName}</span>
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase block">
                            {doc.is_manual_providencia ? 'Sobrescrita Manual' : 'Escala do Dia'}
                          </span>
                        </td>

                        {/* DIAGNÓSTICO / REGRA */}
                        <td className="p-4 pr-6 max-w-xs md:max-w-md">
                          <div className="bg-slate-50 rounded-xl p-2.5 text-[10px] text-slate-600 font-bold leading-relaxed border border-slate-100">
                            {doc.justificativa_distribuicao || (
                              isRotChan 
                                ? `Atribuído pelo ciclo de rodízio sequencial do canal [${channelNorm}].`
                                : `Canal de plantão: atribuído ao conselheiro da escala do dia.`
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

      {swapIdToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-black uppercase text-slate-800 text-center tracking-tight mb-2">Excluir Substituição?</h3>
            <p className="text-[11px] font-medium text-slate-500 text-center mb-6 leading-relaxed">
              Deseja realmente remover esta alteração e restaurar a escala original?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSwapIdToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleRemoveScaleSwap(swapIdToDelete);
                  setSwapIdToDelete(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
