
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, Calendar, Clock, ShieldCheck, Table, AlertCircle, Building2, ChevronRight, CheckCircle2, UserRound, FileText, MapPin, Hash, Phone, Users, Baby, Trash2, PlusCircle, LayoutDashboard, ClipboardCheck, History, Search, ChevronDown, Check, Repeat, Lock, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Documento, User, ChildData, DocumentStatus, AgendaEntry, ScaleException } from '../types';
import { BAIRROS, INITIAL_USERS, classifyTurno, ORIGENS_HIERARQUICAS, CANAIS_COMUNICADO_LIST, getEffectiveEscala, isSameCounselorName, UNIFIED_GENDER_OPTIONS, CONSELHEIROS_ALFABETICO_POR_UNIDADE, getBairrosByUnidade, getUnidadeByBairro, LOCAL_OCORRENCIA_OPTIONS } from '../constants';
import FamilyHistoryModal from './FamilyHistoryModal';
import { saveScaleException, deleteScaleException, saveLog } from '../lib/db';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, disabled, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`${className || ''} w-full text-left flex items-center justify-between cursor-pointer`}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="PESQUISAR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold uppercase text-slate-800 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                LIMPAR
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-[10px] font-bold uppercase text-slate-400 text-center">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 text-[11px] font-bold uppercase hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    value === opt ? 'bg-blue-50/50 text-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {value === opt && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface DocumentRegistrationProps {
  documents: Documento[];
  users: User[];
  agenda: AgendaEntry[];
  currentUser: User;
  onSubmit: (data: any, files: File[]) => void;
  onCancel: () => void;
  initialData?: Documento;
  isReadOnly?: boolean;
  title?: string;
  nameMap?: Record<string, string>;
  allUsers?: User[];
  scaleExceptions?: ScaleException[];
}

const DocumentRegistration: React.FC<DocumentRegistrationProps> = ({ documents, users, agenda, currentUser, onSubmit, onCancel, initialData, isReadOnly, title, nameMap, allUsers = users, scaleExceptions = [] }) => {
  const systemNow = new Date();
  const year = systemNow.getFullYear();
  const month = String(systemNow.getMonth() + 1).padStart(2, '0');
  const day = String(systemNow.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${day}`;
  const todayTime = systemNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const [formData, setFormData] = useState({
    unidade_id: initialData?.unidade_id || currentUser.unidade_id || 1,
    origem_categoria: initialData?.origem?.split(' - ')[0] || '',
    origem: initialData?.origem?.split(' - ')[1] || '',
    canal_comunicado: initialData?.canal_comunicado || '',
    notificacao: initialData?.notificacao || '',
    tipo_documento: initialData?.informacoes_documento || '',
    numero_comunicado_violacao: initialData?.numero_comunicado_violacao || '',
    numero_sipia: initialData?.numero_sipia || '',
    data_aporte: initialData?.data_aporte || todayDate,
    hora_aporte: initialData?.hora_aporte || todayTime,
    genitora_nome: initialData?.genitora_nome || '',
    genitora_nao_informado: initialData?.genitora_nao_informado || false,
    cpf_genitora: initialData?.cpf_genitora || '',
    outro_membro_nome: initialData?.outro_membro_nome || '',
    outro_membro_parentesco: initialData?.outro_membro_parentesco || '',
    outro_membro_cpf: initialData?.outro_membro_cpf || '',
    tem_outro_membro: !!(initialData?.outro_membro_nome || initialData?.outro_membro_parentesco),
    bairro: initialData?.bairro || '',
    relato_inicial: initialData?.observacoes_iniciais || '',
    conselheiro_referencia_id: initialData?.conselheiro_referencia_id || '',
    providencia_imediata_manual: initialData?.providencia_imediata_manual || '',
    local_ocorrencia: initialData?.local_ocorrencia || '',
    is_urgente: initialData?.is_urgente || false,
    criancas: initialData?.criancas || [{ nome: '', nao_informado: false, data_nascimento: '', cpf: '', genero_identidade: '' }] as ChildData[]
  });

  const [isAnalyzingViolations, setIsAnalyzingViolations] = useState(false);

  const handleAnalyzeViolations = async () => {
    if (!formData.relato_inicial || formData.relato_inicial.length < 20) {
      alert("Descreva um relato mais detalhado para análise da IA (mínimo 20 caracteres).");
      return;
    }

    setIsAnalyzingViolations(true);
    try {
      const prompt = `Como um assistente especializado no Estatuto da Criança e do Adolescente (ECA) e no sistema SIPIA, analise o seguinte relato de um conselheiro tutelar e identifique as possíveis VIOLAÇÕES DE DIREITOS.

Relato: "${formData.relato_inicial}"

Retorne uma lista JSON com os seguintes campos para cada violação identificada:
- grupo: (Família, Sociedade, Estado, ou Entidade de Atendimento)
- especificacao: (Descrição da violação baseada no ECA)

Formato de resposta: [{"grupo": "...", "especificacao": "..."}, ...]`;

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          model: "gemini-1.5-flash" 
        })
      });

      if (!res.ok) throw new Error("Falha na análise da IA");
      
      const data = await res.json();
      const rawText = data.text || "";
      const jsonMatch = rawText.match(/\[.*\]/s);
      if (jsonMatch) {
        const suggested: any[] = JSON.parse(jsonMatch[0]);
        // Aqui poderíamos atualizar um estado de violações sugeridas
        // Por enquanto, vamos apenas alertar e sugerir que o conselheiro as adicione manualmente se o sistema permitir
        // Ou melhor, vamos integrar com o campo de violações se ele existir no formulário
        console.log("Violações Sugeridas:", suggested);
        alert("IA SIMCT: Identificamos possíveis violações. Verifique os campos de Violação do SIPIA abaixo.");
        // Se houver um campo de violações no formData, poderíamos preenchê-lo
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar análise de violações com IA.");
    } finally {
      setIsAnalyzingViolations(false);
    }
  };

  const [isReferenceLocked, setIsReferenceLocked] = useState(false);
  const [isManualReference, setIsManualReference] = useState(false);
  const [showRelatoError, setShowRelatoError] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [familyHistory, setFamilyHistory] = useState<Documento[]>([]);

  const [customOrigem, setCustomOrigem] = useState(() => {
    const val = initialData?.origem?.split(' - ')[1] || '';
    if (!val) return '';
    const cat = initialData?.origem?.split(' - ')[0] || '';
    const baseOptions = ORIGENS_HIERARQUICAS.find(h => h.label === cat)?.options || [];
    if (baseOptions.includes(val) && val !== 'OUTRO' && val !== 'OUTROS') {
      return '';
    }
    return val;
  });

  const [selectedOrigemDropdown, setSelectedOrigemDropdown] = useState(() => {
    const val = initialData?.origem?.split(' - ')[1] || '';
    if (!val) return '';
    const cat = initialData?.origem?.split(' - ')[0] || '';
    const baseOptions = ORIGENS_HIERARQUICAS.find(h => h.label === cat)?.options || [];
    if (baseOptions.includes(val) && val !== 'OUTRO' && val !== 'OUTROS') {
      return val;
    }
    return baseOptions.includes('OUTROS') ? 'OUTROS' : 'OUTRO';
  });

  const isADM = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO' || (currentUser.nome || '').trim().toUpperCase().includes('LEANDRO') || currentUser.id === 'cons1';
  const isLeandro = (currentUser.nome || '').trim().toUpperCase().includes('LEANDRO') || currentUser.id === 'cons1';

  // Permissão para editar conselheiros de referência ou providência imediata:
  // Se o documento já foi registrado anteriormente (initialData existe), APENAS Leandro pode editar.
  // Em novos cadastros (!initialData), administradores (isADM) têm a permissão.
  const canEditCouncillors = initialData ? isLeandro : isADM;

  // Estados para gerenciamento de Troca Excepcional de Escala (Casos Excepcionais)
  const [isScaleSwapModalOpen, setIsScaleSwapModalOpen] = useState(false);
  const [swapDate, setSwapDate] = useState(todayDate);
  const [swapOriginalId, setSwapOriginalId] = useState('');
  const [swapSubstituteId, setSwapSubstituteId] = useState('');
  const [swapJustification, setSwapJustification] = useState('');

  // Novos estados para personalização do horário da troca
  const [swapStartDate, setSwapStartDate] = useState(todayDate);
  const [swapStartTime, setSwapStartTime] = useState('08:00');
  const [swapEndDate, setSwapEndDate] = useState(todayDate);
  const [swapEndTime, setSwapEndTime] = useState('08:00');
  const [swapIdToDelete, setSwapIdToDelete] = useState<string | null>(null);

  const unitCounselors = useMemo(() => {
    return allUsers.filter(u => u.unidade_id === formData.unidade_id && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && u.status === 'ATIVO');
  }, [allUsers, formData.unidade_id]);

  // Lista todas as substituições ativas ou cadastradas para esta data e unidade
  const activeSwapsForDate = useMemo(() => {
    return scaleExceptions.filter(ex => {
      if (ex.unidade_id !== formData.unidade_id) return false;
      return ex.data === swapDate || ex.inicio_data === swapDate;
    });
  }, [scaleExceptions, swapDate, formData.unidade_id]);

  const handleConfirmScaleSwap = async () => {
    if (!swapDate) {
      alert("Por favor, selecione uma data válida.");
      return;
    }
    if (!swapOriginalId || !swapSubstituteId) {
      alert("Por favor, selecione os dois conselheiros.");
      return;
    }
    if (swapOriginalId === swapSubstituteId) {
      alert("O conselheiro substituto não pode ser o mesmo a ser substituído.");
      return;
    }
    if (!swapJustification.trim()) {
      alert("Por favor, informe uma justificativa para esta substituição excepcional.");
      return;
    }
    if (!swapStartDate || !swapStartTime || !swapEndDate || !swapEndTime) {
      alert("Por favor, preencha todos os campos de data e horário.");
      return;
    }

    const originalUser = allUsers.find(u => u.id === swapOriginalId);
    const substituteUser = allUsers.find(u => u.id === swapSubstituteId);

    if (!originalUser || !substituteUser) return;

    try {
      // Geramos um ID único incluindo o timestamp para permitir múltiplas trocas por faixas de horário
      const exceptionId = `swap-${swapDate}-${Date.now()}-u${formData.unidade_id}`;
      await saveScaleException({
        id: exceptionId,
        data: swapDate,
        unidade_id: formData.unidade_id,
        conselheiro_original_id: originalUser.id,
        conselheiro_original_nome: originalUser.nome,
        conselheiro_substituto_id: substituteUser.id,
        conselheiro_substituto_nome: substituteUser.nome,
        justificativa: swapJustification.trim(),
        criado_em: new Date().toISOString(),
        criado_por_id: currentUser.id,
        criado_por_nome: currentUser.nome,
        inicio_data: swapStartDate,
        inicio_hora: swapStartTime,
        fim_data: swapEndDate,
        fim_hora: swapEndTime
      });

      await saveLog({
        id: `log-${Date.now()}`,
        documento_id: 'SISTEMA',
        data_hora: new Date().toISOString(),
        usuario_id: currentUser.id,
        usuario_nome: currentUser.nome,
        unidade_id: formData.unidade_id,
        acao: `ESCALA: Substituição Excepcional na Unidade ${formData.unidade_id}. Conselheiro(a) ${originalUser.nome.toUpperCase()} substituído(a) por ${substituteUser.nome.toUpperCase()} de ${swapStartDate} ${swapStartTime} até ${swapEndDate} ${swapEndTime}. Justificativa: ${swapJustification.trim()}`,
        tipo: 'SISTEMA'
      });

      setSwapJustification('');
      setIsScaleSwapModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar a alteração de escala.");
    }
  };

  const handleRemoveScaleSwap = async (exceptionId: string) => {
    try {
      await deleteScaleException(exceptionId);

      await saveLog({
        id: `log-${Date.now()}`,
        documento_id: 'SISTEMA',
        data_hora: new Date().toISOString(),
        usuario_id: currentUser.id,
        usuario_nome: currentUser.nome,
        unidade_id: formData.unidade_id,
        acao: `ESCALA: Cancelamento de Substituição Excepcional (escala original restaurada).`,
        tipo: 'SISTEMA'
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao remover a alteração de escala.");
    }
  };

  // DIRETRIZ 41/50/53: Reconhecimento por CPF, Nome, Documento e Pasta Familiar
  useEffect(() => {
    // Lista de documentos excluindo o próprio documento caso esteja em edição
    const availableDocs = initialData ? documents.filter(d => d.id !== initialData.id) : documents;

    const cpfGen = (formData.cpf_genitora || '').replace(/\D/g, '');
    const cpfMembro = (formData.outro_membro_cpf || '').replace(/\D/g, '');
    const cpfsCriancas = formData.criancas.map(c => (c.cpf || '').replace(/\D/g, '')).filter(c => c.length === 11);
    
    const genNomeClean = (formData.genitora_nome || '').trim().toUpperCase();
    const membroNomeClean = (formData.outro_membro_nome || '').trim().toUpperCase();
    const criancasNomesClean = formData.criancas
      .map(c => (c.nome || '').trim().toUpperCase())
      .filter(n => n && n !== 'NÃO INFORMADO' && n !== 'NAO INFORMADO' && n.length >= 3);

    const numCom = (formData.numero_comunicado_violacao || '').trim().toUpperCase();
    const numSipia = (formData.numero_sipia || '').trim().toUpperCase();

    const findExisting = (): Documento[] => {
      // 1. Busca por CPF da Genitora
      if (cpfGen.length === 11) {
        const found = availableDocs.filter(d => (d.cpf_genitora || '').replace(/\D/g, '') === cpfGen);
        if (found.length > 0) return found;
      }

      // 2. Busca por CPF do Membro da Família
      if (cpfMembro.length === 11) {
        const found = availableDocs.filter(d => 
          (d.outro_membro_cpf || '').replace(/\D/g, '') === cpfMembro ||
          (d.cpf_genitora || '').replace(/\D/g, '') === cpfMembro
        );
        if (found.length > 0) return found;
      }

      // 3. Busca por CPF das Crianças
      for (const cpf of cpfsCriancas) {
        const found = availableDocs.filter(d => d.criancas?.some(c => (c.cpf || '').replace(/\D/g, '') === cpf));
        if (found.length > 0) return found;
      }

      // 4. Busca por Nome da Genitora / Responsável
      if (genNomeClean && genNomeClean !== 'NÃO INFORMADO' && genNomeClean !== 'NAO INFORMADO' && genNomeClean.length >= 3) {
        const found = availableDocs.filter(d => (d.genitora_nome || '').trim().toUpperCase() === genNomeClean);
        if (found.length > 0) return found;
      }

      // 5. Busca por Nome do Outro Membro da Família
      if (membroNomeClean && membroNomeClean !== 'NÃO INFORMADO' && membroNomeClean.length >= 3) {
        const found = availableDocs.filter(d => 
          (d.outro_membro_nome || '').trim().toUpperCase() === membroNomeClean ||
          (d.genitora_nome || '').trim().toUpperCase() === membroNomeClean
        );
        if (found.length > 0) return found;
      }

      // 6. Busca por Nome das Crianças
      for (const cNome of criancasNomesClean) {
        const found = availableDocs.filter(d => d.criancas?.some(c => (c.nome || '').trim().toUpperCase() === cNome));
        if (found.length > 0) return found;
      }

      // 7. Busca por Nº do Comunicado / SIPIA
      if (numCom && numCom.length >= 2) {
        const found = availableDocs.filter(d => (d.numero_comunicado_violacao || '').trim().toUpperCase() === numCom);
        if (found.length > 0) return found;
      }

      if (numSipia && numSipia.length >= 2) {
        const found = availableDocs.filter(d => (d.numero_sipia || '').trim().toUpperCase() === numSipia);
        if (found.length > 0) return found;
      }

      return [];
    };

    const history = findExisting();
    if (history.length > 0) {
      const existingDoc = history[0];
      
      // Armazena o histórico para exibir o aviso
      if (familyHistory.length === 0) {
        // Se ainda não mostramos o aviso para este conjunto de resultados
        setFamilyHistory(history);
        
        // Exibe o alerta conforme Instruções do Sistema
        if (!initialData && (formData.genitora_nome || '').length > 3) {
          setTimeout(() => {
            if (window.confirm("Atenção: Histórico familiar localizado. Vincular a este prontuário?")) {
              setFormData(prev => ({
                ...prev,
                genitora_nome: prev.genitora_nome || existingDoc.genitora_nome,
                bairro: prev.bairro || existingDoc.bairro,
                conselheiro_referencia_id: existingDoc.conselheiro_referencia_id,
                unidade_id: existingDoc.unidade_id || prev.unidade_id
              }));
              setIsReferenceLocked(true);
              setIsManualReference(isADM);
            }
          }, 100);
        } else {
          setIsReferenceLocked(true);
          if (!initialData) {
            setIsManualReference(isADM);
          }
        }
      }
    } else {
      setIsReferenceLocked(false);
      setFamilyHistory([]);
    }
  }, [
    formData.cpf_genitora, 
    formData.genitora_nome, 
    formData.outro_membro_cpf, 
    formData.outro_membro_nome, 
    formData.criancas, 
    formData.numero_comunicado_violacao, 
    formData.numero_sipia, 
    documents, 
    isADM, 
    initialData
  ]);

  // DIRETRIZ 48: Escala baseada na data e hora do aporte/hoje (troca de escala às 8h)
  const trioNames = useMemo(() => {
    const d = initialData ? formData.data_aporte : todayDate;
    const t = initialData ? formData.hora_aporte : (formData.hora_aporte || todayTime);
    return getEffectiveEscala(d, t, formData.unidade_id, nameMap, scaleExceptions);
  }, [initialData, formData.data_aporte, formData.hora_aporte, todayDate, todayTime, formData.unidade_id, nameMap, scaleExceptions]);

    // DIRETRIZ 51/52: Rodízio Alfabético Estável para Referência
  const assignedReference = useMemo(() => {
    // Usamos a lista viva de usuários ativos para definir a ordem de rodízio
    const activeConselheiros = allUsers
      .filter(u => {
        if (u.unidade_id !== formData.unidade_id) return false;
        if (u.status !== 'ATIVO') return false;
        if (u.perfil !== 'CONSELHEIRO' && u.perfil !== 'SUPLENTE') return false;
        if (u.perfil === 'CONSELHEIRO' && u.substituicao_ativa) return false;
        return true;
      })
      .map(u => u.nome.toUpperCase())
      .sort();
    
    if (isManualReference && formData.conselheiro_referencia_id) return allUsers.find(u => u.id === formData.conselheiro_referencia_id);
    if (initialData) return allUsers.find(u => u.id === (formData.conselheiro_referencia_id || initialData.conselheiro_referencia_id));
    if (isReferenceLocked) return allUsers.find(u => u.id === formData.conselheiro_referencia_id);
    
    // Filtra casos novos (sem histórico, sem notificação e não urgentes) ordenando descendente por data de criação para obter o último de forma consistente
    const newCases = documents
      .filter(d => !d.is_manual_override && !d.notificacao && !d.is_urgente && d.unidade_id === formData.unidade_id)
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    const lastAssignedRefId = newCases[0]?.conselheiro_referencia_id;
    const lastRefUser = allUsers.find(u => u.id === lastAssignedRefId);
    const lastRefNameRaw = lastRefUser?.nome.toUpperCase();
    const lastRefName = (lastRefNameRaw && nameMap && nameMap[lastRefNameRaw]) ? nameMap[lastRefNameRaw] : lastRefNameRaw;

    const currentIndex = activeConselheiros.indexOf(lastRefName || '');
    const nextIndex = activeConselheiros.length > 0 ? (currentIndex + 1) % activeConselheiros.length : 0;
    const nextName = activeConselheiros[nextIndex];
    
    return allUsers.find(u => u.status === 'ATIVO' && u.nome.toUpperCase() === nextName && u.unidade_id === formData.unidade_id);
  }, [allUsers, documents, isReferenceLocked, formData.conselheiro_referencia_id, initialData, formData.unidade_id, isManualReference, nameMap]);

  const assignedImediata = useMemo(() => {
    // 0. SOBRESCRITA MANUAL: Se houver providência manual acionada
    if (formData.providencia_imediata_manual) {
      return allUsers.find(u => u.id === formData.providencia_imediata_manual);
    }

    // 1. PRIORIDADE ABSOLUTA: Notificação desbloqueia e define a imediata
    if (formData.notificacao) {
      const notifTargetName = (nameMap && nameMap[formData.notificacao.toUpperCase()]) || formData.notificacao;
      return (
        allUsers.find(u => u.unidade_id === formData.unidade_id && u.status === 'ATIVO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && isSameCounselorName(u.nome, notifTargetName)) ||
        allUsers.find(u => u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, notifTargetName))
      );
    }

    // 2. TRABALHO NA SEDE / URGENTE / PLANTÃO (FORA DE EXPEDIENTE): 
    // Documentos urgentes ou recebidos durante trabalho na sede (Expediente)
    // O primeiro do trio (trioNames[0]) é o Conselheiro de Sede (Trabalho na Sede) ou o Primeiro Plantonista
    const timeInfo = (() => {
      const parts = (formData.hora_aporte || '00:00').split(':');
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1] || '0');
      const timeVal = h * 60 + m; // minutos totais desde 00:00
      
      const isDayShift = h >= 8 && h < 17; // 08:00 às 16:59
      const isNightShift = h >= 17 || h < 8; // 17:00 às 07:59
      
      const dateObj = new Date(formData.data_aporte + 'T12:00:00');
      const dayOfWeek = dateObj.getDay(); // 0: Dom, 5: Sex, 6: Sab
      
      const isWeekend = (dayOfWeek === 5 && h >= 17) || (dayOfWeek === 6) || (dayOfWeek === 0) || (dayOfWeek === 1 && h < 8);
      
      return { isDayShift, isNightShift, isWeekend };
    })();

    const isPlantao = timeInfo.isNightShift || timeInfo.isWeekend;

    if ((formData.is_urgente || isPlantao) && trioNames.length > 0) {
      // Se for noite ou final de semana, o "Primeiro Plantonista" (trioNames[0]) assume tudo.
      const targetName = trioNames[0];
      const targetUser = allUsers.find(u => u.status === 'ATIVO' && u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, targetName));
      if (targetUser) return targetUser;
    }

    if (initialData) {
      const origUser = allUsers.find(u => u.id === initialData.conselheiro_providencia_id);
      const origName = origUser?.nome || initialData.conselheiro_providencia_nome;
      const mappedName = (origName && nameMap && nameMap[origName.toUpperCase()]) ? nameMap[origName.toUpperCase()] : origName;
      if (mappedName) {
        const substituteUser = allUsers.find(u => u.status === 'ATIVO' && u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, mappedName));
        if (substituteUser) return substituteUser;
      }
      return origUser;
    }
    
    // Para novos documentos, a imediata é sempre baseada no dia real de hoje (todayDate) e usa a escala/trio de hoje
    const dateToUse = todayDate;

    // 2. SE O CONSELHEIRO DE REFERÊNCIA ESTÁ NO TRIO/PLANTÃO DE HOJE:
    // O sistema DEVE SEMPRE reconhecer e atribuir a providência imediata para ele (ou para seu substituto de plantão).
    // Esta atribuição NÃO consome o turno da distribuição sequencial.
    const refUser = (formData.conselheiro_referencia_id ? allUsers.find(u => u.id === formData.conselheiro_referencia_id) : undefined) || assignedReference;
    const refUserName = refUser?.nome?.toUpperCase();
    const mappedRefName = (refUserName && nameMap && nameMap[refUserName]) ? nameMap[refUserName] : refUserName;
    const isRefUserInTrio = mappedRefName && trioNames.some(n => isSameCounselorName(n, mappedRefName));

    if (isRefUserInTrio && refUser) {
      const activeSubstituteUser = mappedRefName ? allUsers.find(u => u.status === 'ATIVO' && u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, mappedRefName)) : undefined;
      return activeSubstituteUser || refUser;
    }

    // 3. Persistência Familiar no mesmo dia de recebimento/aporte real (Hoje)
    // Se um documento já foi recebido hoje para esta família/referência, todos os subsequentes de hoje devem ir para o mesmo conselheiro.
    // Esta regra garante que um conselheiro que pegou o primeiro caso do dia (por rodízio ou referência) continue no caso durante o dia.
    const sameFamilyTodayDocs = documents.filter(d => {
      const isDocOfToday = d.data_aporte === dateToUse || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === dateToUse);
      if (!isDocOfToday || d.unidade_id !== formData.unidade_id || !d.conselheiro_providencia_id || d.id === initialData?.id) {
        return false;
      }
      
      // Checa se a referência é a mesma
      const currentRefId = refUser?.id;
      if (currentRefId && d.conselheiro_referencia_id === currentRefId) return true;

      const cpfGen = (formData.cpf_genitora || '').replace(/\D/g, '');
      const dCpfGen = (d.cpf_genitora || '').replace(/\D/g, '') || '';
      if (cpfGen && dCpfGen && cpfGen === dCpfGen) return true;

      const nameGen = formData.genitora_nome?.trim().toUpperCase();
      const dNameGen = d.genitora_nome?.trim().toUpperCase();
      if (nameGen && dNameGen && nameGen !== 'NÃO INFORMADO' && nameGen.length >= 3 && nameGen === dNameGen) return true;

      const cpfsCriancas = formData.criancas.map(c => (c.cpf || '').replace(/\D/g, '')).filter(c => c.length === 11);
      const dCpfsCriancas = d.criancas?.map(c => (c.cpf || '').replace(/\D/g, '')).filter(c => c && c.length === 11) || [];
      if (cpfsCriancas.length > 0 && dCpfsCriancas.length > 0 && cpfsCriancas.some(cpf => dCpfsCriancas.includes(cpf))) return true;

      const namesCriancas = formData.criancas.map(c => (c.nome || '').trim().toUpperCase()).filter(n => n && n !== 'NÃO INFORMADO');
      const dNamesCriancas = d.criancas?.map(c => (c.nome || '').trim().toUpperCase()).filter(n => n && n !== 'NÃO INFORMADO') || [];
      if (namesCriancas.length > 0 && dNamesCriancas.length > 0 && namesCriancas.some(name => dNamesCriancas.includes(name))) return true;

      return false;
    });

    const sameFamilyTodayDiffProvRef = sameFamilyTodayDocs.find(d => d.conselheiro_providencia_id !== d.conselheiro_referencia_id);
    const sameFamilyTodayDirect = sameFamilyTodayDiffProvRef || sameFamilyTodayDocs[0];

    if (sameFamilyTodayDirect) {
      return allUsers.find(u => u.id === sameFamilyTodayDirect.conselheiro_providencia_id);
    }
    
    // 4. Lógica de Distribuição Justa (Rodízio de Providência Imediata)
    // Filtramos para ignorar documentos que foram atribuídos por persistência familiar, referência no trio, notificações ou manual para não quebrar a sequência de hoje
    const todayDocs = documents
      .filter(d => {
        const isDocOfToday = d.data_aporte === dateToUse || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === dateToUse);
        if (!isDocOfToday || d.unidade_id !== formData.unidade_id) {
          return false;
        }
        return !d.is_family_persistence && !d.is_manual_providencia && !d.is_reference_in_trio && !d.notificacao && !d.is_plantao && !d.is_urgente;
      })
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

    const lastAutoDoc = todayDocs[0];
    
    const lastImediataId = lastAutoDoc?.conselheiro_providencia_id;
    const lastImediataUser = allUsers.find(u => u.id === lastImediataId);
    const lastImediataNameRaw = lastImediataUser?.nome.toUpperCase();
    const lastImediataName = (lastImediataNameRaw && nameMap && nameMap[lastImediataNameRaw]) ? nameMap[lastImediataNameRaw] : lastImediataNameRaw;
    
    const currentIndex = trioNames.findIndex(n => isSameCounselorName(n, lastImediataName));
    const nextIndex = trioNames.length > 0 ? (currentIndex + 1) % trioNames.length : 0;
    const nextName = trioNames[nextIndex];
    
    return allUsers.find(u => u.status === 'ATIVO' && u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, nextName));
  }, [trioNames, documents, todayDate, formData.notificacao, formData.providencia_imediata_manual, initialData, formData.unidade_id, allUsers, nameMap, familyHistory, formData.cpf_genitora, formData.genitora_nome, formData.criancas, assignedReference]);

  const handleChildChange = (index: number, field: keyof ChildData, value: any) => {
    const newChildren = [...formData.criancas];
    
    if (field === 'nao_informado') {
      const isChecked = value === true || value === 'true';
      newChildren[index] = { 
        ...newChildren[index], 
        nao_informado: isChecked,
        nome: isChecked ? 'NÃO INFORMADO' : (newChildren[index].nome === 'NÃO INFORMADO' ? '' : newChildren[index].nome)
      };
    } else {
      newChildren[index] = { ...newChildren[index], [field]: value };
    }
    
    // DIRETRIZ 49: Bloqueio 18+ (Só processa se a data estiver completa e plausível)
    if (field === 'data_nascimento' && value && value.length === 10) {
      const parts = value.split('-');
      const birthYear = parseInt(parts[0]);
      const birthMonth = parseInt(parts[1]);
      const birthDay = parseInt(parts[2]);
      
      const currentYear = new Date().getFullYear();

      // Só processa se o ano for plausível e a data for válida
      if (birthYear > 1900 && birthYear <= currentYear && birthMonth > 0 && birthMonth <= 12 && birthDay > 0 && birthDay <= 31) {
        const birthDate = new Date(value + 'T12:00:00');
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthYear;
          if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (age >= 18) {
            newChildren[index].error = "⚠️ MAIORIDADE IDENTIFICADA: O Conselho Tutelar não possui competência após a maioridade (Art. 2º do ECA).";
          } else {
            newChildren[index].error = undefined;
          }
        }
      } else {
        newChildren[index].error = undefined;
      }
    }
    
    setFormData({ ...formData, criancas: newChildren });
  };

  const addChild = () => {
    setFormData({
      ...formData,
      criancas: [...formData.criancas, { nome: '', nao_informado: false, data_nascimento: '', cpf: '', genero_identidade: '' }]
    });
  };

  const removeChild = (index: number) => {
    if (formData.criancas.length === 1) return;
    setFormData({
      ...formData,
      criancas: formData.criancas.filter((_, i) => i !== index)
    });
  };

  const getAgeInfo = (birthDate: string) => {
    if (!birthDate || birthDate.length < 10) return null;
    const parts = birthDate.split('-');
    const year = parseInt(parts[0]);
    if (isNaN(year) || year < 1900) return null;

    const today = new Date();
    const birth = new Date(birthDate + 'T12:00:00');
    if (isNaN(birth.getTime())) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    
    if (age < 0) return null;

    return {
      age,
      isPrimeiraInfancia: age >= 0 && age <= 6,
      isExcecaoEca: age >= 18 && age <= 21
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.relato_inicial.trim()) {
      setShowRelatoError(true);
      return;
    }

    const hasAgeError = formData.criancas.some(c => !!c.error);
    if (hasAgeError) {
      alert("⚠️ Existem erros de idade no cadastro (indivíduos com 18 anos ou mais). Corrija para prosseguir.");
      return;
    }

    // Lógica de seleção justa de 2 validadores do trio para casos de notificação
    const notifiedName = formData.notificacao?.toUpperCase();
    const isNewNotif = !initialData || initialData.notificacao?.toUpperCase() !== notifiedName;
    
    // Verificação robusta de persistência familiar na mesma data de aporte do caso (ou hoje para caso novo)
    const targetDateForPersistence = initialData ? formData.data_aporte : todayDate;
    const sameFamilyTodayDocs = documents.filter(d => {
      const isDocOfTargetDate = d.data_aporte === targetDateForPersistence || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === targetDateForPersistence);
      if (!isDocOfTargetDate || d.unidade_id !== formData.unidade_id || !d.conselheiro_providencia_id || d.id === initialData?.id) {
        return false;
      }
      
      const cpfGen = (formData.cpf_genitora || '').replace(/\D/g, '');
      const dCpfGen = (d.cpf_genitora || '').replace(/\D/g, '') || '';
      if (cpfGen && dCpfGen && cpfGen === dCpfGen) return true;

      const cpfOutro = (formData.outro_membro_cpf || '').replace(/\D/g, '');
      const dCpfOutro = (d.outro_membro_cpf || '').replace(/\D/g, '') || '';
      if (cpfOutro && dCpfOutro && cpfOutro === dCpfOutro) return true;

      const nameGen = formData.genitora_nome?.trim().toUpperCase();
      const dNameGen = d.genitora_nome?.trim().toUpperCase();
      if (nameGen && dNameGen && nameGen !== 'NÃO INFORMADO' && nameGen.length >= 3 && nameGen === dNameGen) return true;

      const nameOutro = formData.outro_membro_nome?.trim().toUpperCase();
      const dNameOutro = d.outro_membro_nome?.trim().toUpperCase();
      if (nameOutro && dNameOutro && nameOutro.length >= 3 && (nameOutro === dNameOutro || nameOutro === dNameGen)) return true;

      const cpfsCriancas = formData.criancas.map(c => (c.cpf || '').replace(/\D/g, '')).filter(c => c.length === 11);
      const dCpfsCriancas = d.criancas?.map(c => (c.cpf || '').replace(/\D/g, '')).filter(c => c && c.length === 11) || [];
      if (cpfsCriancas.length > 0 && dCpfsCriancas.length > 0 && cpfsCriancas.some(cpf => dCpfsCriancas.includes(cpf))) return true;

      const namesCriancas = formData.criancas.map(c => (c.nome || '').trim().toUpperCase()).filter(n => n && n !== 'NÃO INFORMADO');
      const dNamesCriancas = d.criancas?.map(c => (c.nome || '').trim().toUpperCase()).filter(n => n && n !== 'NÃO INFORMADO') || [];
      if (namesCriancas.length > 0 && dNamesCriancas.length > 0 && namesCriancas.some(name => dNamesCriancas.includes(name))) return true;

      return false;
    });

    const sameFamilyTodayDiffProvRef = sameFamilyTodayDocs.find(d => d.conselheiro_providencia_id !== d.conselheiro_referencia_id);
    const sameFamilyTodayDirect = sameFamilyTodayDiffProvRef || sameFamilyTodayDocs[0];

    const finalRefId = (isManualReference && formData.conselheiro_referencia_id)
      ? formData.conselheiro_referencia_id
      : (initialData ? (formData.conselheiro_referencia_id || initialData.conselheiro_referencia_id) : ((isManualReference || isReferenceLocked) ? formData.conselheiro_referencia_id : (assignedReference?.id || formData.conselheiro_referencia_id)));
    const finalRefUser = allUsers.find(u => u.id === finalRefId);
    
    const finalRefName = finalRefUser?.nome?.toUpperCase();
    const mappedFinalRefName = (finalRefName && nameMap && nameMap[finalRefName]) ? nameMap[finalRefName] : finalRefName;
    const isRefUserInTrio = mappedFinalRefName && trioNames.some(n => isSameCounselorName(n, mappedFinalRefName));

    const isFamilyPersistence = !!sameFamilyTodayDirect && !(isRefUserInTrio && finalRefUser);
    const isFamilyPersistenceDiffProvRef = !!sameFamilyTodayDiffProvRef && !(isRefUserInTrio && finalRefUser);
    
    let finalValidators = initialData?.conselheiros_providencia_nomes || trioNames;

    if (notifiedName) {
      if (isNewNotif) {
        const isNotifiedInTrio = trioNames.some(n => n.toUpperCase() === notifiedName);
        if (isNotifiedInTrio) {
          finalValidators = trioNames;
        } else {
          // Busca documentos de hoje que tiveram notificação para equilibrar a carga
          const todayNotifDocs = documents.filter(d => d.data_aporte === targetDateForPersistence && d.notificacao);
          const trioStats = trioNames.map(name => ({
            name,
            count: todayNotifDocs.filter(d => d.conselheiros_providencia_nomes?.includes(name)).length
          }));
          
          // Ordena por quem menos participou em validações de notificação hoje
          // Em caso de empate, mantém a ordem da escala (estabilidade do sort)
          const selectedFromTrio = [...trioStats]
            .sort((a, b) => a.count - b.count)
            .slice(0, 2)
            .map(s => s.name);
          
          finalValidators = [notifiedName, ...selectedFromTrio];
        }
      }
    } else if (!initialData) {
      finalValidators = trioNames;
    }

    const finalData = {
      ...initialData,
      ...formData,
      outro_membro_nome: formData.tem_outro_membro ? formData.outro_membro_nome : '',
      outro_membro_parentesco: formData.tem_outro_membro ? formData.outro_membro_parentesco : '',
      outro_membro_cpf: formData.tem_outro_membro ? formData.outro_membro_cpf : '',
      unidade_id: formData.unidade_id,
      informacoes_documento: formData.tipo_documento,
      numero_comunicado_violacao: formData.numero_comunicado_violacao,
      numero_sipia: formData.numero_sipia,
      notificacao: formData.notificacao,
      providencia_imediata_manual: formData.providencia_imediata_manual,
      origem: `${formData.origem_categoria} - ${formData.origem}`,
      crianca_nome: formData.criancas[0].nome,
      observacoes_iniciais: formData.relato_inicial,
      data_recebimento: formData.data_aporte,
      hora_rece_bimento: formData.hora_aporte,
      periodo_rece_bimento: classifyTurno(formData.data_aporte, formData.hora_aporte),
      conselheiro_referencia_id: (canEditCouncillors && (isManualReference || (initialData && formData.conselheiro_referencia_id))) 
        ? (formData.conselheiro_referencia_id || (initialData ? initialData.conselheiro_referencia_id : finalRefId)) 
        : (initialData ? initialData.conselheiro_referencia_id : finalRefId),
      conselheiro_referencia_nome: (allUsers.find(u => u.id === ((canEditCouncillors && (isManualReference || (initialData && formData.conselheiro_referencia_id))) ? (formData.conselheiro_referencia_id || initialData?.conselheiro_referencia_id || finalRefId) : (initialData ? initialData.conselheiro_referencia_id : finalRefId)))?.nome) || initialData?.conselheiro_referencia_nome || '',
      is_manual_override: (canEditCouncillors && isManualReference) || (initialData ? initialData.is_manual_override : isReferenceLocked),
      conselheiro_providencia_id: (canEditCouncillors && formData.providencia_imediata_manual)
        ? formData.providencia_imediata_manual
        : (initialData ? initialData.conselheiro_providencia_id : (assignedImediata?.id || '')),
      conselheiro_providencia_nome: (allUsers.find(u => u.id === ((canEditCouncillors && formData.providencia_imediata_manual) ? formData.providencia_imediata_manual : (initialData ? initialData.conselheiro_providencia_id : (assignedImediata?.id || ''))))?.nome) || initialData?.conselheiro_providencia_nome || '',
      conselheiros_providencia_nomes: (canEditCouncillors && formData.providencia_imediata_manual)
        ? (() => {
            const manualUser = allUsers.find(u => u.id === formData.providencia_imediata_manual);
            const manualName = manualUser?.nome?.toUpperCase();
            return manualName ? [manualName, ...trioNames.filter(n => n.toUpperCase() !== manualName)] : finalValidators;
          })()
        : (initialData ? initialData.conselheiros_providencia_nomes : finalValidators),
      is_family_persistence: isFamilyPersistence,
      is_manual_providencia: !!formData.providencia_imediata_manual,
      is_reference_in_trio: isRefUserInTrio && !!finalRefUser,
      is_plantao: (() => {
        const parts = (formData.hora_aporte || '00:00').split(':');
        const h = parseInt(parts[0]);
        const dateObj = new Date(formData.data_aporte + 'T12:00:00');
        const dayOfWeek = dateObj.getDay();
        const isNight = h >= 17 || h < 8;
        const isWeekend = (dayOfWeek === 5 && h >= 17) || (dayOfWeek === 6) || (dayOfWeek === 0) || (dayOfWeek === 1 && h < 8);
        return isNight || isWeekend;
      })(),
      status: initialData ? initialData.status : (formData.notificacao ? [`NOTIFICACAO_${formData.notificacao.toUpperCase()}` as DocumentStatus] : ['AGUARDANDO_ANALISE']),
      justificativa_distribuicao: initialData 
        ? initialData.justificativa_distribuicao 
        : (formData.is_urgente
            ? `🚨 DOCUMENTO URGENTE: Atribuído para providência sem alterar a sequência regular de rodízio do Conselheiro de Referência nem da Providência Imediata.`
            : (formData.providencia_imediata_manual
                ? `✍️ Imediata atribuída MANUALMENTE: [${assignedImediata?.nome}].`
                : (formData.notificacao 
                    ? `🔔 Imediata vinculada à Notificação: ${formData.notificacao}.` 
                    : (isRefUserInTrio && finalRefUser
                        ? `🎯 Imediata vinculada ao Conselheiro de Referência [${finalRefUser.nome}] de plantão no dia.`
                        : (isFamilyPersistence
                            ? (isFamilyPersistenceDiffProvRef
                                ? `👨‍👩‍👧‍👦 Imediata mantida por vínculo familiar (Regra Conselheiro Providência !== Referência no dia).`
                                : `👨‍👩‍👧‍👦 Imediata mantida por vínculo familiar no mesmo dia.`)
                            : (isReferenceLocked 
                                ? `📌 Referência mantida por vínculo histórico.` 
                                : `✅ Atribuído por Rodízio Alfabético.`))))))
    };

    if (!finalData.conselheiro_referencia_id) {
      alert("⚠️ Falha na designação: Não foi possível determinar o Conselheiro de Referência. Verifique se o CT possui conselheiros ativos.");
      return;
    }

    if (!finalData.conselheiro_providencia_id) {
      alert("⚠️ Falha na designação: Imediata não localizada. Verifique se há escala definida para este horário ou se o conselheiro notificado está ativo.");
      return;
    }

    onSubmit(finalData, []);
  };

  const currentInstitutions = useMemo(() => {
    const base = ORIGENS_HIERARQUICAS.find(h => h.label === formData.origem_categoria)?.options || [];
    if (formData.origem_categoria && !base.includes('OUTRO') && !base.includes('OUTROS')) {
      return [...base, 'OUTRO'];
    }
    return base;
  }, [formData.origem_categoria]);

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <header className="p-5 sm:p-8 bg-[#111827] text-white flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
              <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-[22px] font-black uppercase tracking-tight leading-none">{title || 'SIMCT - Novo Procedimento'}</h2>
              <p className="text-[8px] sm:text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1">Hortolândia - Gestão de Prontuários</p>
            </div>
          </div>
          <button onClick={onCancel} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-[12px] uppercase transition-all" title="Voltar para a tela anterior">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-x-hidden">
          <fieldset disabled={isReadOnly} className="contents">
            {/* BLOCO 1: NOVO DOCUMENTO (DATA E HORA) */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-[11px] sm:text-[12px] font-black uppercase text-slate-800 tracking-widest">1. Novo Documento</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Documento *</label>
                <input 
                  type="date" 
                  required 
                  max={todayDate}
                  disabled={!!initialData && !isADM}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500 disabled:opacity-50 text-[13px] sm:text-[15px]"
                  value={formData.data_aporte}
                  onChange={e => setFormData({...formData, data_aporte: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora *</label>
                <input 
                  type="time" 
                  required 
                  disabled={!!initialData && !isADM}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500 disabled:opacity-50 text-[13px] sm:text-[15px]"
                  value={formData.hora_aporte}
                  onChange={e => setFormData({...formData, hora_aporte: e.target.value})}
                />
              </div>

              {/* URGÊNCIA */}
              <div className="sm:col-span-2">
                <label 
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                    ${formData.is_urgente 
                      ? 'bg-rose-50 border-rose-500 shadow-[0_0_15px_-5px_rgba(244,63,94,0.4)]' 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-200'}
                  `}
                >
                  <input 
                    type="checkbox"
                    className="hidden"
                    checked={formData.is_urgente}
                    onChange={e => setFormData({...formData, is_urgente: e.target.checked})}
                  />
                  <div className={`
                    w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                    ${formData.is_urgente ? 'bg-rose-500 border-rose-500' : 'bg-white border-slate-200'}
                  `}>
                    {formData.is_urgente && <AlertCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${formData.is_urgente ? 'text-rose-600' : 'text-slate-600'}`}>
                      DOCUMENTO URGENTE
                    </span>
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-tighter">
                      Marque se este documento requer providência imediata
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* BLOCO 2: ORIGEM E CANAL DO COMUNICADO (NOVO MODELO) */}
          <section className="p-4 sm:p-8 bg-slate-50/50 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
              <h3 className="text-[11px] sm:text-[13px] font-black uppercase text-slate-800 tracking-widest">2. Origem e Canal do Comunicado</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* COLUNA 1: CATEGORIA */}
              <div className="space-y-2">
                <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select 
                  required
                  className="w-full p-4 sm:p-5 bg-white border border-slate-200 rounded-xl sm:rounded-[1.5rem] font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  value={formData.origem_categoria}
                  onChange={e => {
                    setFormData({...formData, origem_categoria: e.target.value, origem: ''});
                    setSelectedOrigemDropdown('');
                    setCustomOrigem('');
                  }}
                >
                  <option value="">SELECIONE CATEGORIA...</option>
                  {ORIGENS_HIERARQUICAS.map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                </select>
              </div>

              {/* COLUNA 2: INSTITUIÇÃO */}
              <div className="space-y-2">
                <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Instituição</label>
                <SearchableSelect
                  disabled={isReadOnly || !formData.origem_categoria}
                  className="w-full p-4 sm:p-5 bg-white border border-slate-200 rounded-xl sm:rounded-[1.5rem] font-bold uppercase text-[10px] sm:text-[11px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="SELECIONE INSTITUIÇÃO..."
                  options={[...currentInstitutions].sort((a, b) => a.localeCompare(b))}
                  value={selectedOrigemDropdown}
                  onChange={val => {
                    setSelectedOrigemDropdown(val);
                    if (val === 'OUTRO' || val === 'OUTROS') {
                      setFormData(prev => ({ ...prev, origem: customOrigem || val }));
                    } else {
                      setFormData(prev => ({ ...prev, origem: val }));
                      setCustomOrigem('');
                    }
                  }}
                />
              </div>

              {/* COLUNA 3: CANAL */}
              <div className="space-y-2">
                <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal</label>
                <select 
                  required
                  className="w-full p-4 sm:p-5 bg-white border border-slate-200 rounded-xl sm:rounded-[1.5rem] font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  value={formData.canal_comunicado}
                  onChange={e => setFormData({...formData, canal_comunicado: e.target.value})}
                >
                  <option value="">SELECIONE CANAL...</option>
                  {CANAIS_COMUNICADO_LIST.filter(c => {
                    const restricted = ['RELATÓRIO', 'OFÍCIO', 'OFÍCIO MP', 'OFÍCIO JUDICIÁRIO', 'DISQUE 100', 'E-MAIL INSTITUCIONAL'].includes(c);
                    return !restricted || isADM;
                  }).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {(selectedOrigemDropdown === 'OUTRO' || selectedOrigemDropdown === 'OUTROS') && (
              <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                <div className="p-5 bg-white rounded-2xl border border-blue-100 space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Descreva a Instituição / Escola não cadastrada</label>
                  <input 
                    required
                    type="text"
                    placeholder="DIGITE O NOME OU DESCRIÇÃO DA INSTITUIÇÃO..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-inner"
                    value={customOrigem}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setCustomOrigem(val);
                      setFormData(prev => ({ ...prev, origem: val || selectedOrigemDropdown }));
                    }}
                  />
                </div>
              </div>
            )}

            {/* CAMPO ADICIONAL: Nº OFÍCIO E NOVOS CAMPOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº Ofício / Documento</label>
                <input 
                  type="text" 
                  disabled={!!initialData && !isADM}
                  className="w-full p-3 sm:p-4 bg-white border border-slate-100 rounded-xl font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm disabled:opacity-50"
                  value={formData.tipo_documento}
                  onChange={e => setFormData({...formData, tipo_documento: e.target.value.toUpperCase()})}
                  placeholder="Nº OFÍCIO / DOCUMENTO"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº Com. de Violação</label>
                <input 
                  type="text" 
                  disabled={!!initialData && !isADM}
                  className="w-full p-3 sm:p-4 bg-white border border-slate-100 rounded-xl font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm disabled:opacity-50"
                  value={formData.numero_comunicado_violacao}
                  onChange={e => setFormData({...formData, numero_comunicado_violacao: e.target.value.toUpperCase()})}
                  placeholder="Nº COMUNICADO"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº Procedimento / SIPIA</label>
                <input 
                  type="text" 
                  disabled={!!initialData && !isADM}
                  className="w-full p-3 sm:p-4 bg-white border border-slate-100 rounded-xl font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm disabled:opacity-50"
                  value={formData.numero_sipia}
                  onChange={e => setFormData({...formData, numero_sipia: e.target.value.toUpperCase()})}
                  placeholder="Nº SIPIA"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notificação (Opcional)</label>
                <select 
                  className="w-full p-3 sm:p-4 bg-white border border-slate-100 rounded-xl font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  value={formData.notificacao}
                  onChange={e => setFormData({...formData, notificacao: e.target.value})}
                >
                  <option value="">NENHUMA...</option>
                  {allUsers
                    .filter(u => {
                      if (u.unidade_id !== formData.unidade_id) return false;
                      if (u.status !== 'ATIVO') return false;
                      if (u.perfil !== 'CONSELHEIRO' && u.perfil !== 'SUPLENTE') return false;
                      if (u.perfil === 'CONSELHEIRO' && u.substituicao_ativa) return false;
                      return true;
                    })
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map(u => (
                      <option key={u.id} value={u.nome.toUpperCase()}>{u.nome.toUpperCase()}</option>
                    ))}
                </select>
              </div>
            </div>
          </section>

          {/* BLOCO 3: IDENTIFICAÇÃO FAMILIAR */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <UserRound className="w-5 h-5 text-blue-600" />
              <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">3. Identificação Familiar</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Genitora / Genitor / Responsável Legal {!formData.genitora_nao_informado && '*'}</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.genitora_nao_informado}
                      onChange={e => setFormData({...formData, genitora_nao_informado: e.target.checked, genitora_nome: e.target.checked ? 'NÃO INFORMADO' : ''})}
                    />
                    <span className="text-[9px] font-black text-slate-500 uppercase group-hover:text-blue-600 transition-colors">Não Informado</span>
                  </label>
                </div>
                <input 
                  type="text" 
                  required={!formData.genitora_nao_informado}
                  disabled={formData.genitora_nao_informado}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold uppercase outline-none focus:border-blue-500 disabled:opacity-60"
                  value={formData.genitora_nome}
                  onChange={e => setFormData({...formData, genitora_nome: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF da Genitora / Genitor / Responsável Legal</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500"
                  value={formData.cpf_genitora}
                  onChange={e => setFormData({...formData, cpf_genitora: e.target.value})}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bairro da Criança *</label>
                <SearchableSelect
                  disabled={isReadOnly}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold uppercase text-[11px]"
                  placeholder="SELECIONE O BAIRRO..."
                  options={BAIRROS}
                  value={formData.bairro}
                  onChange={val => {
                    const resolvedUnit = getUnidadeByBairro(val);
                    setFormData({
                      ...formData,
                      bairro: val,
                      unidade_id: resolvedUnit
                    });
                  }}
                />
              </div>
            </div>

            {/* ADICIONAL: OUTRO MEMBRO DA FAMÍLIA (TIO, AVÔ, AVÓ, ETC.) */}
            <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Outro Membro da Família Atendido / Familiar Referência</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={formData.tem_outro_membro}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        tem_outro_membro: checked,
                        outro_membro_parentesco: checked ? (prev.outro_membro_parentesco || 'GENITOR / GENITORA') : '',
                        outro_membro_nome: checked ? prev.outro_membro_nome : '',
                        outro_membro_cpf: checked ? prev.outro_membro_cpf : ''
                      }));
                    }}
                  />
                  <span className="text-[9px] font-black uppercase text-blue-600 group-hover:text-blue-700 transition-colors">
                    Incluir Outro Membro da Família (Genitor, Genitora, Tio, Avô, etc.)
                  </span>
                </label>
              </div>

              {formData.tem_outro_membro && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grau de Parentesco / Vínculo *</label>
                    <select 
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 cursor-pointer"
                      value={formData.outro_membro_parentesco}
                      onChange={e => setFormData({ ...formData, outro_membro_parentesco: e.target.value })}
                    >
                      <option value="GENITOR / GENITORA">GENITOR / GENITORA</option>
                      <option value="GENITOR">GENITOR (PAI)</option>
                      <option value="GENITORA">GENITORA (MÃE)</option>
                      <option value="TIO / TIA">TIO / TIA</option>
                      <option value="AVÔ / AVÓ">AVÔ / AVÓ</option>
                      <option value="IRMÃO / IRMÃ">IRMÃO / IRMÃ</option>
                      <option value="PADRASTO / MADRASTA">PADRASTO / MADRASTA</option>
                      <option value="PRIMO / PRIMA">PRIMO / PRIMA</option>
                      <option value="PADRINHO / MADRINHA">PADRINHO / MADRINHA</option>
                      <option value="CUIDADOR(A)">CUIDADOR(A) / RESPONSÁVEL DE FATO</option>
                      <option value="OUTRO">OUTRO MEMBRO DA FAMÍLIA</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Membro da Família *</label>
                    <input 
                      type="text"
                      required={formData.tem_outro_membro}
                      placeholder="NOME COMPLETO DO FAMILIAR..."
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500"
                      value={formData.outro_membro_nome}
                      onChange={e => setFormData({ ...formData, outro_membro_nome: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF do Membro da Família</label>
                    <input 
                      type="text"
                      placeholder="000.000.000-00"
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] outline-none focus:border-blue-500"
                      value={formData.outro_membro_cpf}
                      onChange={e => setFormData({ ...formData, outro_membro_cpf: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* BLOCO 4: DADOS DA CRIANÇA/ADOLESCENTE */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <Baby className="w-5 h-5 text-blue-600" />
                <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">4. Dados da Criança/Adolescente</h3>
              </div>
              {!isReadOnly && (
                <button type="button" onClick={addChild} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                  <PlusCircle className="w-4 h-4" /> Adicionar Irmão
                </button>
              )}
            </div>
            {formData.criancas.map((crianca, idx) => {
              const ageInfo = getAgeInfo(crianca.data_nascimento);
              return (
                <div key={idx} className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative group transition-all hover:border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">Criança {idx + 1}</span>
                    {formData.criancas.length > 1 && !isReadOnly && (
                      <button type="button" onClick={() => removeChild(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all focus:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-1 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome Completo {!crianca.nao_informado && '*'}</label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={crianca.nao_informado}
                            onChange={e => handleChildChange(idx, 'nao_informado', e.target.checked ? 'true' : 'false')}
                          />
                          <span className="text-[8px] font-black text-slate-500 uppercase group-hover:text-blue-600 transition-colors">Não Informado</span>
                        </label>
                      </div>
                      <input 
                        type="text" 
                        required={!crianca.nao_informado}
                        disabled={crianca.nao_informado}
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold uppercase outline-none focus:border-blue-500 disabled:opacity-60 text-xs sm:text-sm" 
                        value={crianca.nome} 
                        onChange={e => handleChildChange(idx, 'nome', e.target.value.toUpperCase())} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Nascimento</label>
                      <input 
                        type="date" 
                        max={todayDate}
                        className={`w-full p-3 bg-white border rounded-lg font-bold outline-none focus:border-blue-500 text-xs sm:text-sm ${crianca.error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} 
                        value={crianca.data_nascimento} 
                        onChange={e => handleChildChange(idx, 'data_nascimento', e.target.value)} 
                      />
                      {crianca.error && (
                        <p className="text-[8px] font-black text-red-600 uppercase leading-tight animate-in fade-in slide-in-from-top-1">{crianca.error}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</label>
                      <input 
                        type="text" 
                        placeholder="000.000.000-00"
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500 text-xs sm:text-sm" 
                        value={crianca.cpf || ''} 
                        onChange={e => handleChildChange(idx, 'cpf', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gênero {!crianca.nao_informado && '*'}</label>
                      <select 
                        required={!crianca.nao_informado} 
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold uppercase text-[10px] outline-none focus:border-blue-500"
                        value={crianca.genero_identidade}
                        onChange={e => handleChildChange(idx, 'genero_identidade', e.target.value)}
                      >
                        <option value="">SELECIONE...</option>
                        {UNIFIED_GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  {ageInfo && !crianca.error && (
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                      <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-full text-[10px] font-black uppercase shadow-sm">
                        Idade: {ageInfo.age} Anos
                      </span>
                      {ageInfo.isPrimeiraInfancia && (
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase shadow-md flex items-center gap-1 animate-pulse">
                          <Baby className="w-3 h-3" />
                          Primeira Infância (Prioridade Absoluta)
                        </span>
                      )}
                      {ageInfo.isExcecaoEca && (
                        <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 mt-1">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                            Atenção: Indivíduo com {ageInfo.age} anos. Este caso deve ser tratado como EXCEÇÃO conforme Art. 2º, parágrafo único do ECA (18 a 21 anos).
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* BLOCO 5: RELATO INICIAL */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">5. Relato Inicial dos Fatos *</h3>
              </div>
              <button
                type="button"
                onClick={handleAnalyzeViolations}
                disabled={isAnalyzingViolations || !formData.relato_inicial}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {isAnalyzingViolations ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider">Identificar Violações (IA)</span>
              </button>
            </div>
            <textarea 
              required
              disabled={!!initialData && !isADM}
              className={`w-full p-6 bg-slate-50 border-2 rounded-2xl font-medium outline-none transition-all min-h-[150px] disabled:opacity-50 ${showRelatoError && !formData.relato_inicial ? 'border-red-500 shadow-red-50' : 'border-slate-100 focus:border-blue-500'}`}
              value={formData.relato_inicial}
              onChange={e => {
                setFormData({...formData, relato_inicial: e.target.value});
                if (e.target.value) setShowRelatoError(false);
              }}
              placeholder="Descreva detalhadamente o relato dos fatos..."
            />
            {showRelatoError && !formData.relato_inicial && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">Campo obrigatório: descreva o relato dos fatos para prosseguir.</p>
            )}
          </section>

          {/* DISTRIBUIÇÃO AUTOMÁTICA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> Conselheiro de Referência
                </div>
                {canEditCouncillors && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (!formData.conselheiro_referencia_id && assignedReference?.id) {
                        setFormData(prev => ({ ...prev, conselheiro_referencia_id: assignedReference.id }));
                      }
                      setIsManualReference(!isManualReference);
                    }}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${isManualReference ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                  >
                    {isManualReference ? 'Cancelar Alteração' : 'Alterar Referência'}
                  </button>
                )}
              </label>
              
              {canEditCouncillors && isManualReference ? (
                <select 
                  required
                  className="w-full p-4 bg-white border border-indigo-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-indigo-500 shadow-sm"
                  value={formData.conselheiro_referencia_id || assignedReference?.id || ''}
                  onChange={e => setFormData({...formData, conselheiro_referencia_id: e.target.value})}
                >
                  <option value="">Selecione o Conselheiro...</option>
                  {allUsers
                    .filter(u => {
                      if (u.unidade_id !== formData.unidade_id) return false;
                      if (u.status !== 'ATIVO') return false;
                      if (u.perfil !== 'CONSELHEIRO' && u.perfil !== 'SUPLENTE') return false;
                      if (u.perfil === 'CONSELHEIRO' && u.substituicao_ativa) return false;
                      return true;
                    })
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                    ))}
                </select>
              ) : (
                <div className="p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center justify-between">
                  <span>
                    {allUsers.find(u => u.id === (formData.conselheiro_referencia_id || assignedReference?.id))?.nome || assignedReference?.nome || 'Aguardando...'}
                  </span>
                  <span className={`text-[9px] px-2 py-1 flex items-center gap-1 rounded-md uppercase font-black ${initialData && !isManualReference ? 'bg-slate-200 text-slate-700 border border-slate-300' : (isReferenceLocked ? 'bg-amber-50 text-amber-600' : (formData.notificacao ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'))}`}>
                    {(!canEditCouncillors || !isManualReference) && <Lock className="w-3 h-3 text-slate-500" />}
                    {initialData 
                      ? (isManualReference ? 'Ajuste Manual (Leandro)' : 'Cadastrado') 
                      : (isReferenceLocked 
                          ? (isManualReference ? 'Ajuste Manual (ADM)' : 'Vínculo Histórico') 
                          : (formData.notificacao 
                              ? 'Notificação (Isento do Rodízio)' 
                              : (isManualReference ? 'Ajuste Manual (ADM)' : 'Rodízio Alfabético')))}
                  </span>
                </div>
              )}
              {isReferenceLocked && (
                <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter">Referência Identificada: Atribuição vinculada por histórico familiar.</span>
                  <button 
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="ml-auto flex items-center gap-1 text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase"
                  >
                    <History className="w-3 h-3" /> Ver Histórico
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" /> Providência Imediata
                </div>
                {canEditCouncillors && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (formData.providencia_imediata_manual) {
                        setFormData(prev => ({ ...prev, providencia_imediata_manual: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, providencia_imediata_manual: assignedImediata?.id || '' }));
                      }
                    }}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${formData.providencia_imediata_manual ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                  >
                    {formData.providencia_imediata_manual ? 'Cancelar Ajuste' : 'Alterar Imediata'}
                  </button>
                )}
              </label>
              {canEditCouncillors && formData.providencia_imediata_manual ? (
                <select 
                  required
                  className="w-full p-4 bg-white border border-amber-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-amber-500 shadow-sm"
                  value={formData.providencia_imediata_manual}
                  onChange={e => setFormData({...formData, providencia_imediata_manual: e.target.value})}
                >
                  <option value="">Selecione o Conselheiro...</option>
                  {allUsers
                    .filter(u => {
                      if (u.unidade_id !== formData.unidade_id) return false;
                      if (u.status !== 'ATIVO') return false;
                      if (u.perfil !== 'CONSELHEIRO' && u.perfil !== 'SUPLENTE') return false;
                      return true;
                    })
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                    ))}
                </select>
              ) : (
                <div className={`p-4 rounded-xl font-bold flex items-center justify-between relative overflow-hidden transition-all ${
                  formData.is_urgente
                    ? 'bg-rose-50 border-2 border-rose-500 text-rose-950 shadow-md ring-2 ring-rose-200'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}>
                  {/* BADGE DE PLANTÃO / URGÊNCIA */}
                  {formData.is_urgente ? (
                    <div className="absolute top-0 right-0 px-2.5 py-1 bg-rose-600 text-white rounded-bl-lg z-10 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                      <AlertCircle className="w-3 h-3 text-white" /> DESTAQUE ESPECIAL: PROVIDÊNCIA IMEDIATA URGENTE
                    </div>
                  ) : (() => {
                    const parts = (formData.hora_aporte || '00:00').split(':');
                    const h = parseInt(parts[0]);
                    const dateObj = new Date(formData.data_aporte + 'T12:00:00');
                    const dayOfWeek = dateObj.getDay();
                    const isNight = h >= 17 || h < 8;
                    const isWeekend = (dayOfWeek === 5 && h >= 17) || (dayOfWeek === 6) || (dayOfWeek === 0) || (dayOfWeek === 1 && h < 8);
                    return isNight || isWeekend;
                  })() ? (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-bl-lg border-l border-b border-amber-200 z-10">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">PLANTÃO / URGÊNCIA</span>
                      </div>
                    </div>
                  ) : null}
                  <span className={formData.is_urgente ? 'font-black text-rose-950 text-sm flex items-center gap-1.5 pt-1' : ''}>
                    {formData.is_urgente && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    {allUsers.find(u => u.id === (formData.providencia_imediata_manual || (initialData?.conselheiro_providencia_id) || assignedImediata?.id))?.nome || assignedImediata?.nome || 'Aguardando...'}
                  </span>
                  <span className={`text-[9px] px-2 py-1 flex items-center gap-1 rounded-md uppercase font-black ${
                    formData.is_urgente 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : (initialData && !formData.providencia_imediata_manual ? 'bg-slate-200 text-slate-700 border border-slate-300' : 'bg-amber-50 text-amber-600')
                  }`}>
                    {(!canEditCouncillors || !formData.providencia_imediata_manual) && <Lock className={`w-3 h-3 ${formData.is_urgente ? 'text-white' : 'text-slate-500'}`} />}
                    {formData.is_urgente
                      ? '🚨 URGENTE'
                      : (initialData && !formData.providencia_imediata_manual
                          ? 'Cadastrado' 
                          : (formData.providencia_imediata_manual 
                              ? 'Sobrescrita Manual (ADM)' 
                              : (formData.notificacao ? 'Vínculo de Notificação' : 'Escala do Dia')))}
                  </span>
                </div>
              )}
              {!isReadOnly && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSwapDate(todayDate);
                      setSwapStartDate(todayDate);
                      setSwapStartTime('08:00');
                      
                      const d = new Date(`${todayDate}T12:00:00`);
                      d.setDate(d.getDate() + 1);
                      const nextDayStr = d.toISOString().split('T')[0];
                      setSwapEndDate(nextDayStr);
                      setSwapEndTime('08:00');
                      
                      const trio = getEffectiveEscala(todayDate, '12:00', formData.unidade_id, nameMap, scaleExceptions);
                      const firstTrioUser = unitCounselors.find(u => trio.some(n => isSameCounselorName(n, u.nome)));
                      const targetOrigId = firstTrioUser ? firstTrioUser.id : (unitCounselors[0]?.id || '');
                      setSwapOriginalId(targetOrigId);
                      
                      const nextSub = unitCounselors.find(u => u.id !== targetOrigId);
                      setSwapSubstituteId(nextSub ? nextSub.id : '');
                      setSwapJustification('');
                      setIsScaleSwapModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-[10px] font-black uppercase rounded-xl border border-amber-200/60 transition-all duration-200 shadow-sm"
                  >
                    <Repeat className="w-3.5 h-3.5 animate-spin-slow" />
                    Alterar Escala de Plantão (Caso Excepcional)
                  </button>
                </div>
              )}
            </div>
          </div>
        </fieldset>

        <div className="pt-4 border-t border-slate-100">
          {!isReadOnly ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                type="button"
                onClick={onCancel}
                className="w-full sm:w-1/3 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-[12px] tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" /> Voltar
              </button>
              <button 
                type="submit" 
                className="w-full sm:w-2/3 py-5 bg-[#111827] text-white rounded-2xl font-black uppercase text-[13px] tracking-[0.15em] shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <Save className="w-5 h-5" /> [Salvar Prontuário e Monitoramento]
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={onCancel}
              className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-[12px] tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" /> Voltar para a Tela Anterior
            </button>
          )}
        </div>
      </form>
      </div>

      {showHistoryModal && (
        <FamilyHistoryModal 
          history={familyHistory} 
          agenda={agenda}
          users={users}
          currentUser={currentUser} 
          onClose={() => setShowHistoryModal(false)} 
        />
      )}

      {isScaleSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                  <Repeat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">Substituição de Escala</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Alterar plantão de providência imediata</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSwapJustification('');
                  setIsScaleSwapModalOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="mx-8 mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-amber-800 uppercase leading-relaxed tracking-tight">Personalização de Horários</p>
                <p className="text-[10px] font-medium text-amber-700 leading-normal mt-0.5">
                  Esta troca é uma exceção. O sistema considerará o conselheiro substituto apenas no intervalo de data/horário selecionado abaixo. Fora desse período, a escala original segue normalmente.
                </p>
              </div>
            </div>

            {/* Content (Scrollable if needed) */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" /> Data de Referência
                </label>
                <input
                  type="date"
                  value={swapDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setSwapDate(newDate);
                    setSwapStartDate(newDate);
                    
                    const d = new Date(`${newDate}T12:00:00`);
                    d.setDate(d.getDate() + 1);
                    const nextDayStr = d.toISOString().split('T')[0];
                    setSwapEndDate(nextDayStr);
                    
                    const trio = getEffectiveEscala(newDate, '12:00', formData.unidade_id, nameMap, scaleExceptions);
                    const firstTrioUser = unitCounselors.find(u => trio.some(n => isSameCounselorName(n, u.nome)));
                    const targetOrigId = firstTrioUser ? firstTrioUser.id : (unitCounselors[0]?.id || '');
                    setSwapOriginalId(targetOrigId);
                    
                    const nextSub = unitCounselors.find(u => u.id !== targetOrigId);
                    setSwapSubstituteId(nextSub ? nextSub.id : '');
                  }}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data de Início
                  </label>
                  <input
                    type="date"
                    value={swapStartDate}
                    onChange={(e) => setSwapStartDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Hora de Início
                  </label>
                  <input
                    type="time"
                    value={swapStartTime}
                    onChange={(e) => setSwapStartTime(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data de Término
                  </label>
                  <input
                    type="date"
                    value={swapEndDate}
                    onChange={(e) => setSwapEndDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Hora de Término
                  </label>
                  <input
                    type="time"
                    value={swapEndTime}
                    onChange={(e) => setSwapEndTime(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Swap Row (Original & Substitute) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    A Ser Substituído
                  </label>
                  <select
                    value={swapOriginalId}
                    onChange={(e) => {
                      const newOrigId = e.target.value;
                      setSwapOriginalId(newOrigId);
                      if (newOrigId === swapSubstituteId) {
                        const nextSub = unitCounselors.find(u => u.id !== newOrigId);
                        setSwapSubstituteId(nextSub ? nextSub.id : '');
                      }
                    }}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">Selecione...</option>
                    {unitCounselors.map(u => (
                      <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Substituto
                  </label>
                  <select
                    value={swapSubstituteId}
                    onChange={(e) => setSwapSubstituteId(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">Selecione...</option>
                    {unitCounselors
                      .filter(u => u.id !== swapOriginalId)
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Justification Textarea */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Justificativa da Troca Excepcional
                </label>
                <textarea
                  rows={2}
                  value={swapJustification}
                  onChange={(e) => setSwapJustification(e.target.value)}
                  placeholder="Descreva o motivo desta alteração na escala..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400 leading-relaxed resize-none"
                />
              </div>

              {/* Existing Exception Details for this Date */}
              {activeSwapsForDate.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Substituições Ativas na Data ({swapDate})</h4>
                  <div className="space-y-3">
                    {activeSwapsForDate.map(swap => (
                      <div key={swap.id} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2 animate-in fade-in duration-200">
                        <div className="flex justify-between items-start">
                          <div className="text-[11px] font-black text-blue-800 uppercase tracking-wide">
                            {swap.conselheiro_original_nome} ➔ {swap.conselheiro_substituto_nome}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSwapIdToDelete(swap.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover Substituição"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase flex flex-wrap gap-x-2">
                          <span>Início: {swap.inicio_data || swap.data} {swap.inicio_hora || '08:00'}</span>
                          <span>|</span>
                          <span>Fim: {swap.fim_data || '-'} {swap.fim_hora || '08:00'}</span>
                        </div>
                        {swap.justificativa && (
                          <div className="p-2 bg-white rounded-lg border border-slate-100 text-[10px] text-slate-600 font-bold uppercase leading-relaxed">
                            {swap.justificativa}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setSwapJustification('');
                  setIsScaleSwapModalOpen(false);
                }}
                className="flex-1 py-3.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-black uppercase rounded-2xl transition-all tracking-wider active:scale-[0.98]"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleConfirmScaleSwap}
                className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase rounded-2xl transition-all tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                Salvar Substituição
              </button>
            </div>
          </div>
        </div>
      )}

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

export default DocumentRegistration;
