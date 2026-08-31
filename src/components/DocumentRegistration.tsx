
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, Calendar, Clock, ShieldCheck, Table, AlertCircle, Building2, ChevronRight, CheckCircle2, UserRound, FileText, MapPin, Hash, Phone, Users, Baby, Trash2, PlusCircle, LayoutDashboard, ClipboardCheck, History, Search, ChevronDown, Check, Repeat, Lock, ArrowLeft, Sparkles, Loader2, RotateCcw, FolderArchive, UserCheck } from 'lucide-react';
import { Documento, User, ChildData, DocumentStatus, AgendaEntry, ScaleException } from '../types';
import { BAIRROS, INITIAL_USERS, classifyTurno, ORIGENS_HIERARQUICAS, getOrigensHierarquicasByUnidade, CANAIS_COMUNICADO_LIST, getEffectiveEscala, isSameCounselorName, UNIFIED_GENDER_OPTIONS, CONSELHEIROS_ALFABETICO_POR_UNIDADE, getBairrosByUnidade, getUnidadeByBairro, LOCAL_OCORRENCIA_OPTIONS, normalizeCanalName, isRotationChannel, getChannelNextCounselor, getActiveRotationCounselors, isCounselorInTrioOrSubstitution, getActiveSubstituteInTrio } from '../constants';
import FamilyHistoryModal from './FamilyHistoryModal';
import { saveScaleException, deleteScaleException, saveLog } from '../lib/db';
import { SearchableSelect } from './SearchableSelect';

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

  const draftStorageKey = useMemo(() => {
    if (initialData?.id) {
      return `simct_draft_reg_edit_${initialData.id}_${currentUser?.id || 'default'}`;
    }
    return `simct_draft_reg_new_${currentUser?.unidade_id || 1}_${currentUser?.id || 'default'}`;
  }, [initialData?.id, currentUser?.id, currentUser?.unidade_id]);

  const [hasDraftRestored, setHasDraftRestored] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(
          parsed?.formData?.relato_inicial ||
          parsed?.formData?.genitora_nome ||
          parsed?.formData?.bairro ||
          parsed?.formData?.origem ||
          parsed?.formData?.origem_categoria ||
          parsed?.formData?.canal_comunicado ||
          parsed?.formData?.notificacao ||
          parsed?.formData?.numero_sipia ||
          parsed?.formData?.numero_comunicado_violacao ||
          parsed?.customOrigem ||
          (parsed?.formData?.criancas && parsed.formData.criancas.some((c: any) => c.nome || c.cpf))
        );
      }
    } catch {}
    return false;
  });

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.formData) {
          return parsed.formData;
        }
      }
    } catch (e) {
      console.warn("Erro ao restaurar rascunho do formulário:", e);
    }

    return {
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
      is_prontuario_fisico: initialData?.is_prontuario_fisico || false,
      conselheiro_prontuario_fisico_id: initialData?.conselheiro_prontuario_fisico_id || (initialData?.is_prontuario_fisico ? initialData.conselheiro_referencia_id : '') || '',
      criancas: initialData?.criancas || [{ nome: '', nao_informado: false, data_nascimento: '', cpf: '', genero_identidade: '' }] as ChildData[]
    };
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
          model: "gemini-3.7-flash" 
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

  const [isReferenceLocked, setIsReferenceLocked] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isReferenceLocked !== undefined) return Boolean(parsed.isReferenceLocked);
      }
    } catch {}
    return false;
  });

  const [isManualReference, setIsManualReference] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isManualReference !== undefined) return Boolean(parsed.isManualReference);
      }
    } catch {}
    return false;
  });

  const [showRelatoError, setShowRelatoError] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [familyHistory, setFamilyHistory] = useState<Documento[]>([]);
  const [cpfAutofillBanner, setCpfAutofillBanner] = useState<{
    matchedDoc: Documento;
    matchedBy: string;
  } | null>(null);
  const lastAutofilledDocIdRef = useRef<string | null>(null);

  const cleanCPF = (val: string) => (val || '').replace(/\D/g, '').slice(0, 11);

  const [customOrigem, setCustomOrigem] = useState(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.customOrigem !== undefined) return parsed.customOrigem;
      }
    } catch {}
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
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.selectedOrigemDropdown !== undefined) return parsed.selectedOrigemDropdown;
      }
    } catch {}
    const val = initialData?.origem?.split(' - ')[1] || '';
    if (!val) return '';
    const cat = initialData?.origem?.split(' - ')[0] || '';
    const baseOptions = ORIGENS_HIERARQUICAS.find(h => h.label === cat)?.options || [];
    if (baseOptions.includes(val) && val !== 'OUTRO' && val !== 'OUTROS') {
      return val;
    }
    return baseOptions.includes('OUTROS') ? 'OUTROS' : 'OUTRO';
  });

  // Auto-salvamento contínuo das informações preenchidas no rascunho local
  useEffect(() => {
    try {
      const isTouched = 
        Boolean(formData.relato_inicial?.trim()) ||
        Boolean(formData.genitora_nome?.trim()) ||
        Boolean(formData.cpf_genitora?.trim()) ||
        Boolean(formData.outro_membro_nome?.trim()) ||
        Boolean(formData.outro_membro_cpf?.trim()) ||
        Boolean(formData.bairro?.trim()) ||
        Boolean(formData.origem?.trim()) ||
        Boolean(formData.origem_categoria?.trim()) ||
        Boolean(formData.canal_comunicado?.trim()) ||
        Boolean(formData.notificacao?.trim()) ||
        Boolean(formData.numero_sipia?.trim()) ||
        Boolean(formData.numero_comunicado_violacao?.trim()) ||
        Boolean(formData.tipo_documento?.trim()) ||
        Boolean(formData.local_ocorrencia?.trim()) ||
        Boolean(customOrigem?.trim()) ||
        Boolean(selectedOrigemDropdown?.trim()) ||
        Boolean(formData.is_prontuario_fisico) ||
        formData.criancas.some(c => (c.nome?.trim() && c.nome !== 'NÃO INFORMADO') || c.cpf?.trim() || c.data_nascimento?.trim());

      if (isTouched) {
        const draftPayload = {
          formData,
          customOrigem,
          selectedOrigemDropdown,
          isReferenceLocked,
          isManualReference,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
        setHasDraftRestored(true);
      } else {
        localStorage.removeItem(draftStorageKey);
        setHasDraftRestored(false);
      }
    } catch (err) {
      console.warn("Erro ao salvar rascunho local:", err);
    }
  }, [formData, customOrigem, selectedOrigemDropdown, isReferenceLocked, isManualReference, draftStorageKey]);

  const handleClearDraft = () => {
    if (window.confirm("Deseja realmente limpar todos os campos preenchidos e reiniciar este formulário?")) {
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {}
      setHasDraftRestored(false);
      setFormData({
        unidade_id: currentUser.unidade_id || 1,
        origem_categoria: '',
        origem: '',
        canal_comunicado: '',
        notificacao: '',
        tipo_documento: '',
        numero_comunicado_violacao: '',
        numero_sipia: '',
        data_aporte: todayDate,
        hora_aporte: todayTime,
        genitora_nome: '',
        genitora_nao_informado: false,
        cpf_genitora: '',
        outro_membro_nome: '',
        outro_membro_parentesco: '',
        outro_membro_cpf: '',
        tem_outro_membro: false,
        bairro: '',
        relato_inicial: '',
        conselheiro_referencia_id: '',
        providencia_imediata_manual: '',
        local_ocorrencia: '',
        is_urgente: false,
        is_prontuario_fisico: false,
        conselheiro_prontuario_fisico_id: '',
        criancas: [{ nome: '', nao_informado: false, data_nascimento: '', cpf: '', genero_identidade: '' }] as ChildData[]
      });
      setCustomOrigem('');
      setSelectedOrigemDropdown('');
      setIsReferenceLocked(false);
      setIsManualReference(false);
      setFamilyHistory([]);
      setCpfAutofillBanner(null);
      lastAutofilledDocIdRef.current = null;
      setShowRelatoError(false);
    }
  };

  const isADM = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO' || (currentUser.nome || '').trim().toUpperCase().includes('LEANDRO') || currentUser.id === 'cons1';
  const isLeandro = (currentUser.nome || '').trim().toUpperCase().includes('LEANDRO') || currentUser.id === 'cons1';
  const isFabio = (currentUser.nome || '').trim().toUpperCase().includes('FABIO') || 
                  (currentUser.nome || '').trim().toUpperCase().includes('FÁBIO') || 
                  (currentUser.nome || '').trim().toUpperCase().includes('FABIA') || 
                  currentUser.id === 'ct2_cons3';
  const isConselheiro = currentUser.perfil === 'CONSELHEIRO' || currentUser.perfil === 'SUPLENTE';

  // Verifica se o usuário atual é o conselheiro designado para Providência Imediata neste prontuário
  const isProvImediata = useMemo(() => {
    if (!initialData || !currentUser) return false;
    if (initialData.conselheiro_providencia_id === currentUser.id) return true;
    if (currentUser.is_suplente_active && currentUser.real_user_id && initialData.conselheiro_providencia_id === currentUser.real_user_id) return true;
    if (initialData.conselheiro_providencia_nome && isSameCounselorName(initialData.conselheiro_providencia_nome, currentUser.nome)) return true;
    if (currentUser.is_suplente_active && currentUser.substituted_name && initialData.conselheiro_providencia_nome && isSameCounselorName(initialData.conselheiro_providencia_nome, currentUser.substituted_name)) return true;
    if (initialData.conselheiros_providencia_nomes?.some(name => isSameCounselorName(name, currentUser.nome) || (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(name, currentUser.substituted_name)))) return true;
    return false;
  }, [initialData, currentUser]);

  // Conselheiros de Providência Imediata, ADM, Leandro e Fábio (na Unidade 2) podem editar os campos do caso
  const canEditCase = isADM || isProvImediata || isLeandro || (isFabio && (currentUser.unidade_id === 2 || formData.unidade_id === 2));

  // Permissão para editar conselheiros de referência ou providência imediata:
  // - Leandro (Super Admin) possui permissão total.
  // - Na UNIDADE II (CT 2): FÁBIO e Administradores (ADM) da Unidade 2 possuem permissão para alterar referência e imediata (inclusive quando já existe prontuário).
  // - Na UNIDADE I (CT 1): Leandro e Administradores (ADM).
  const canEditCouncillors = useMemo(() => {
    if (isLeandro) return true;

    // Regra da UNIDADE 2:
    if (currentUser.unidade_id === 2 || formData.unidade_id === 2) {
      return isFabio || isADM;
    }

    // Regra da UNIDADE 1:
    if (initialData) {
      return isLeandro || isADM;
    }
    return currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
  }, [isLeandro, isFabio, isADM, currentUser.unidade_id, formData.unidade_id, currentUser.perfil, initialData]);

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
      }, currentUser);

      await saveLog({
        id: `log-${Date.now()}`,
        documento_id: 'SISTEMA',
        data_hora: new Date().toISOString(),
        usuario_id: currentUser.id,
        usuario_nome: currentUser.nome,
        unidade_id: formData.unidade_id,
        acao: `ESCALA: Substituição Excepcional na Unidade ${formData.unidade_id}. Conselheiro(a) ${originalUser.nome.toUpperCase()} substituído(a) por ${substituteUser.nome.toUpperCase()} de ${swapStartDate} ${swapStartTime} até ${swapEndDate} ${swapEndTime}. Justificativa: ${swapJustification.trim()}`,
        tipo: 'SISTEMA'
      }, currentUser);

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
      }, currentUser);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover a alteração de escala.");
    }
  };

  // DIRETRIZ: Reconhecimento por CPF (Genitora, Criança, Familiar), Nome e Pasta Familiar com Preenchimento Automático
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

    const findExistingWithReason = (): { docs: Documento[]; reason: string; matchedChildCpf?: string } | null => {
      // 1. Busca por CPF da Genitora
      if (cpfGen.length === 11) {
        const found = availableDocs.filter(d => 
          (d.cpf_genitora || '').replace(/\D/g, '') === cpfGen ||
          (d.outro_membro_cpf || '').replace(/\D/g, '') === cpfGen ||
          d.criancas?.some(c => (c.cpf || '').replace(/\D/g, '') === cpfGen)
        );
        if (found.length > 0) return { docs: found, reason: 'CPF da Genitora/Responsável' };
      }

      // 2. Busca por CPF das Crianças
      for (const cpf of cpfsCriancas) {
        const found = availableDocs.filter(d => 
          d.criancas?.some(c => (c.cpf || '').replace(/\D/g, '') === cpf) ||
          (d.cpf_genitora || '').replace(/\D/g, '') === cpf ||
          (d.outro_membro_cpf || '').replace(/\D/g, '') === cpf
        );
        if (found.length > 0) return { docs: found, reason: 'CPF da Criança/Adolescente', matchedChildCpf: cpf };
      }

      // 3. Busca por CPF do Outro Membro da Família
      if (cpfMembro.length === 11) {
        const found = availableDocs.filter(d => 
          (d.outro_membro_cpf || '').replace(/\D/g, '') === cpfMembro ||
          (d.cpf_genitora || '').replace(/\D/g, '') === cpfMembro ||
          d.criancas?.some(c => (c.cpf || '').replace(/\D/g, '') === cpfMembro)
        );
        if (found.length > 0) return { docs: found, reason: 'CPF de Membro Familiar' };
      }

      // 4. Busca por Nome da Genitora / Responsável
      if (genNomeClean && genNomeClean !== 'NÃO INFORMADO' && genNomeClean !== 'NAO INFORMADO' && genNomeClean.length >= 3) {
        const found = availableDocs.filter(d => (d.genitora_nome || '').trim().toUpperCase() === genNomeClean);
        if (found.length > 0) return { docs: found, reason: 'Nome da Genitora' };
      }

      // 5. Busca por Nome do Outro Membro da Família
      if (membroNomeClean && membroNomeClean !== 'NÃO INFORMADO' && membroNomeClean.length >= 3) {
        const found = availableDocs.filter(d => 
          (d.outro_membro_nome || '').trim().toUpperCase() === membroNomeClean ||
          (d.genitora_nome || '').trim().toUpperCase() === membroNomeClean
        );
        if (found.length > 0) return { docs: found, reason: 'Nome do Membro Familiar' };
      }

      // 6. Busca por Nome das Crianças
      for (const cNome of criancasNomesClean) {
        const found = availableDocs.filter(d => d.criancas?.some(c => (c.nome || '').trim().toUpperCase() === cNome));
        if (found.length > 0) return { docs: found, reason: 'Nome da Criança' };
      }

      // 7. Busca por Nº do Comunicado / SIPIA
      if (numCom && numCom.length >= 2) {
        const found = availableDocs.filter(d => (d.numero_comunicado_violacao || '').trim().toUpperCase() === numCom);
        if (found.length > 0) return { docs: found, reason: 'Nº Com. Violação' };
      }

      if (numSipia && numSipia.length >= 2) {
        const found = availableDocs.filter(d => (d.numero_sipia || '').trim().toUpperCase() === numSipia);
        if (found.length > 0) return { docs: found, reason: 'Nº SIPIA' };
      }

      return null;
    };

    const matchResult = findExistingWithReason();
    if (matchResult && matchResult.docs.length > 0) {
      const history = matchResult.docs;
      const existingDoc = history[0];
      
      setFamilyHistory(history);
      setIsReferenceLocked(true);
      if (!initialData) {
        setIsManualReference(isADM);
      }

      // Preenchimento automático inteligente caso seja novo cadastro e ainda não tenhamos auto-preenchido este prontuário
      if (!initialData && lastAutofilledDocIdRef.current !== existingDoc.id) {
        lastAutofilledDocIdRef.current = existingDoc.id;

        setFormData(prev => {
          // Preenchimento de Crianças / Adolescentes
          let updatedCriancas = [...prev.criancas];
          if (existingDoc.criancas && existingDoc.criancas.length > 0) {
            const hasExistingChildData = prev.criancas.some(c => c.nome && c.nome !== 'NÃO INFORMADO' && c.nome.length > 1);
            if (!hasExistingChildData || matchResult.matchedChildCpf) {
              // Carrega a lista completa de crianças do histórico com formatação
              updatedCriancas = existingDoc.criancas.map(c => ({
                nome: c.nome || '',
                data_nascimento: c.data_nascimento || '',
                cpf: c.cpf ? cleanCPF(c.cpf) : '',
                genero_identidade: c.genero_identidade || '',
                nao_informado: Boolean(c.nao_informado)
              }));
            }
          }

          const hasMembro = Boolean(existingDoc.tem_outro_membro || existingDoc.outro_membro_nome);

          return {
            ...prev,
            // 1. Bairro da Criança
            bairro: existingDoc.bairro || prev.bairro,
            // 2. Identificação Familiar
            genitora_nome: existingDoc.genitora_nome || prev.genitora_nome,
            cpf_genitora: existingDoc.cpf_genitora ? cleanCPF(existingDoc.cpf_genitora) : prev.cpf_genitora,
            genitora_nao_informado: false,
            // Outro Membro
            tem_outro_membro: hasMembro ? true : prev.tem_outro_membro,
            outro_membro_nome: hasMembro ? (existingDoc.outro_membro_nome || prev.outro_membro_nome) : prev.outro_membro_nome,
            outro_membro_parentesco: hasMembro ? (existingDoc.outro_membro_parentesco || prev.outro_membro_parentesco || 'GENITOR / GENITORA') : prev.outro_membro_parentesco,
            outro_membro_cpf: hasMembro && existingDoc.outro_membro_cpf ? cleanCPF(existingDoc.outro_membro_cpf) : prev.outro_membro_cpf,
            // 3. Dados das Crianças
            criancas: updatedCriancas,
            // 4. Conselheiro de Referência e Unidade
            conselheiro_referencia_id: existingDoc.conselheiro_referencia_id || prev.conselheiro_referencia_id,
            unidade_id: existingDoc.unidade_id || prev.unidade_id
          };
        });

        setCpfAutofillBanner({
          matchedDoc: existingDoc,
          matchedBy: matchResult.reason
        });
      }
    } else {
      if (!initialData) {
        setIsReferenceLocked(false);
        setFamilyHistory([]);
        setCpfAutofillBanner(null);
        lastAutofilledDocIdRef.current = null;
      }
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

  // DIRETRIZ: Escala baseada rigorosamente na data e hora do registro/aporte do documento
  const trioNames = useMemo(() => {
    const d = formData.data_aporte || todayDate;
    const t = formData.hora_aporte || todayTime;
    return getEffectiveEscala(d, t, formData.unidade_id, nameMap, scaleExceptions);
  }, [formData.data_aporte, formData.hora_aporte, todayDate, todayTime, formData.unidade_id, nameMap, scaleExceptions]);

  // DIRETRIZ 51/52: Rodízio Alfabético Estável para Referência por Canal
  const assignedReference = useMemo(() => {
    // 0. PRONTUÁRIO FÍSICO: Atribuição direta ao conselheiro do prontuário físico
    if (formData.is_prontuario_fisico && (formData.conselheiro_prontuario_fisico_id || formData.conselheiro_referencia_id)) {
      const targetId = formData.conselheiro_prontuario_fisico_id || formData.conselheiro_referencia_id;
      return allUsers.find(u => u.id === targetId && (u.unidade_id || 1) === formData.unidade_id);
    }
    if (isManualReference && formData.conselheiro_referencia_id) {
      return allUsers.find(u => u.id === formData.conselheiro_referencia_id && (u.unidade_id || 1) === formData.unidade_id);
    }
    if (initialData) {
      return allUsers.find(u => u.id === (formData.conselheiro_referencia_id || initialData.conselheiro_referencia_id) && (u.unidade_id || 1) === formData.unidade_id);
    }
    if (isReferenceLocked) {
      return allUsers.find(u => u.id === formData.conselheiro_referencia_id && (u.unidade_id || 1) === formData.unidade_id);
    }
    
    // Se for 'TELEFONE DE PLANTÃO' (excluído de rodízio):
    if (!isRotationChannel(formData.canal_comunicado)) {
      const firstTrioName = trioNames[0];
      const plantonista = allUsers.find(u => (u.unidade_id || 1) === formData.unidade_id && u.status === 'ATIVO' && isSameCounselorName(u.nome, firstTrioName));
      if (plantonista) return plantonista;
    }

    // Para outros canais com rodízio (Ofício, Ofício MP, Ofício Judiciário, Presencial, etc.):
    const { nextCounselor } = getChannelNextCounselor(
      formData.unidade_id,
      formData.canal_comunicado,
      documents,
      allUsers,
      nameMap
    );

    return nextCounselor || null;
  }, [allUsers, documents, isReferenceLocked, formData.conselheiro_referencia_id, formData.is_prontuario_fisico, formData.conselheiro_prontuario_fisico_id, initialData, formData.unidade_id, isManualReference, nameMap, formData.canal_comunicado, trioNames]);

  const currentRefUser = useMemo(() => {
    if (formData.is_prontuario_fisico && (formData.conselheiro_prontuario_fisico_id || formData.conselheiro_referencia_id)) {
      const targetId = formData.conselheiro_prontuario_fisico_id || formData.conselheiro_referencia_id;
      return allUsers.find(u => u.id === targetId && (u.unidade_id || 1) === formData.unidade_id);
    }
    if (formData.conselheiro_referencia_id) {
      return allUsers.find(u => u.id === formData.conselheiro_referencia_id && (u.unidade_id || 1) === formData.unidade_id);
    }
    return assignedReference;
  }, [formData.is_prontuario_fisico, formData.conselheiro_prontuario_fisico_id, formData.conselheiro_referencia_id, assignedReference, allUsers, formData.unidade_id]);

  const isCurrentRefUserInTrio = useMemo(() => {
    if (!currentRefUser) return false;
    return isCounselorInTrioOrSubstitution(
      currentRefUser,
      trioNames,
      scaleExceptions,
      formData.data_aporte || todayDate,
      formData.hora_aporte || todayTime,
      formData.unidade_id,
      nameMap
    );
  }, [currentRefUser, nameMap, trioNames, scaleExceptions, formData.data_aporte, formData.hora_aporte, todayDate, todayTime, formData.unidade_id]);

  const assignedImediata = useMemo(() => {
    // -1. PRONTUÁRIO FÍSICO: Imediata e Referência unificadas no mesmo conselheiro, sem roleta
    if (formData.is_prontuario_fisico) {
      const targetId = formData.conselheiro_prontuario_fisico_id || formData.conselheiro_referencia_id;
      if (targetId) {
        const targetUser = allUsers.find(u => u.id === targetId && (u.unidade_id || 1) === formData.unidade_id);
        if (targetUser) return targetUser;
      }
      if (currentRefUser) return currentRefUser;
    }

    // 0. SOBRESCRITA MANUAL: Se houver providência manual acionada
    if (formData.providencia_imediata_manual) {
      return allUsers.find(u => u.id === formData.providencia_imediata_manual && (u.unidade_id || 1) === formData.unidade_id);
    }

    // 1. BLOQUEIO DE DISTRIBUIÇÃO - NOTIFICAÇÃO: Notificação bloqueia o rodízio e direciona diretamente ao conselheiro notificado
    if (formData.notificacao) {
      const notifTargetName = (nameMap && nameMap[formData.notificacao.toUpperCase()]) || formData.notificacao;
      return (
        allUsers.find(u => u.unidade_id === formData.unidade_id && u.status === 'ATIVO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && isSameCounselorName(u.nome, notifTargetName)) ||
        allUsers.find(u => u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, notifTargetName))
      );
    }

    if (initialData) {
      const origUser = allUsers.find(u => u.id === initialData.conselheiro_providencia_id && (u.unidade_id || 1) === formData.unidade_id);
      const origName = origUser?.nome || initialData.conselheiro_providencia_nome;
      const mappedName = (origName && nameMap && nameMap[origName.toUpperCase()]) ? nameMap[origName.toUpperCase()] : origName;
      if (mappedName) {
        const substituteUser = allUsers.find(u => u.status === 'ATIVO' && (u.unidade_id || 1) === formData.unidade_id && isSameCounselorName(u.nome, mappedName));
        if (substituteUser) return substituteUser;
      }
      return origUser;
    }

    // 2. BLOQUEIO DE DISTRIBUIÇÃO - REFERÊNCIA NO TRIO DO DIA OU EM SUBSTITUIÇÃO:
    // Se o Conselheiro de Referência ESTÁ no trio do dia (ou ativo em substituição por troca),
    // o sistema BLOQUEIA a distribuição e atribui a imediata diretamente a ele (ou para seu substituto de plantão).
    if (isCurrentRefUserInTrio && currentRefUser) {
      const activeSubstituteUser = getActiveSubstituteInTrio(
        currentRefUser,
        trioNames,
        allUsers,
        scaleExceptions,
        formData.data_aporte || todayDate,
        formData.hora_aporte || todayTime,
        formData.unidade_id,
        nameMap
      );
      return activeSubstituteUser || currentRefUser;
    }

    // 3. TRABALHO NA SEDE / URGENTE / PLANTÃO (FORA DE EXPEDIENTE): 
    // Quando a referência NÃO está no trio/plantão:
    // O primeiro do trio (trioNames[0]) é o Conselheiro de Sede (Trabalho na Sede) ou o Primeiro Plantonista
    const timeInfo = (() => {
      const parts = (formData.hora_aporte || '00:00').split(':');
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1] || '0');
      const isNightShift = h >= 17 || h < 8; // 17:00 às 07:59
      
      const dateObj = new Date(formData.data_aporte + 'T12:00:00');
      const dayOfWeek = dateObj.getDay(); // 0: Dom, 5: Sex, 6: Sab
      
      const isWeekend = (dayOfWeek === 5 && h >= 17) || (dayOfWeek === 6) || (dayOfWeek === 0) || (dayOfWeek === 1 && h < 8);
      
      return { isNightShift, isWeekend };
    })();

    const isPlantao = timeInfo.isNightShift || timeInfo.isWeekend;

    if (isPlantao && trioNames.length > 0) {
      // Se for noite ou final de semana, o "Primeiro Plantonista" (trioNames[0]) assume tudo.
      const targetName = trioNames[0];
      const targetUser = allUsers.find(u => u.status === 'ATIVO' && u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, targetName));
      if (targetUser) return targetUser;
    }
    
    // Para novos documentos em expediente normal onde a referência NÃO está no trio:
    // 4. DISTRIBUIÇÃO DO TRIO DO DIA (REFERÊNCIA NÃO ESTÁ NO TRIO):
    // Quando o documento possui conselheiro de referência e ele NÃO ESTÁ no trio do dia de providência imediata,
    // o sistema DEVE SEGUIR A DISTRIBUIÇÃO SEQUENCIAL (rodízio) entre os conselheiros do trio de hoje.
    const dateToUse = todayDate;
    const todayDocs = documents
      .filter(d => {
        const isDocOfToday = d.data_aporte === dateToUse || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === dateToUse);
        if (!isDocOfToday || d.unidade_id !== formData.unidade_id) {
          return false;
        }
        return !d.is_manual_providencia && !d.is_reference_in_trio && !d.notificacao && !d.is_plantao;
      })
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

    const lastAutoDoc = todayDocs[0];
    
    const lastImediataId = lastAutoDoc?.conselheiro_providencia_id;
    const lastImediataUser = allUsers.find(u => u.id === lastImediataId && (u.unidade_id || 1) === formData.unidade_id);
    const lastImediataNameRaw = lastImediataUser?.nome.toUpperCase();
    const lastImediataName = (lastImediataNameRaw && nameMap && nameMap[lastImediataNameRaw]) ? nameMap[lastImediataNameRaw] : lastImediataNameRaw;
    
    const currentIndex = trioNames.findIndex(n => isSameCounselorName(n, lastImediataName));
    const nextIndex = trioNames.length > 0 ? (currentIndex + 1) % trioNames.length : 0;
    const nextName = trioNames[nextIndex];
    
    return allUsers.find(u => u.status === 'ATIVO' && u.unidade_id === formData.unidade_id && isSameCounselorName(u.nome, nextName));
  }, [trioNames, documents, todayDate, todayTime, formData.notificacao, formData.providencia_imediata_manual, initialData, formData.unidade_id, formData.data_aporte, formData.hora_aporte, allUsers, nameMap, currentRefUser, isCurrentRefUserInTrio, scaleExceptions]);

  const handleChildChange = (index: number, field: keyof ChildData, value: any) => {
    const newChildren = [...formData.criancas];
    
    if (field === 'nao_informado') {
      const isChecked = value === true || value === 'true';
      newChildren[index] = { 
        ...newChildren[index], 
        nao_informado: isChecked,
        nome: isChecked ? 'NÃO INFORMADO' : (newChildren[index].nome === 'NÃO INFORMADO' ? '' : newChildren[index].nome)
      };
    } else if (field === 'cpf') {
      newChildren[index] = { ...newChildren[index], cpf: cleanCPF(value) };
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

    const isFisico = Boolean(formData.is_prontuario_fisico);
    const fisicoCounselorId = formData.conselheiro_prontuario_fisico_id || formData.conselheiro_referencia_id;

    if (isFisico && !fisicoCounselorId) {
      alert("Por favor, selecione o Conselheiro responsável pelo Prontuário Físico.");
      return;
    }

    const finalRefId = isFisico
      ? fisicoCounselorId
      : (isManualReference && formData.conselheiro_referencia_id)
        ? formData.conselheiro_referencia_id
        : (initialData ? (formData.conselheiro_referencia_id || initialData.conselheiro_referencia_id) : ((isManualReference || isReferenceLocked) ? formData.conselheiro_referencia_id : (assignedReference?.id || formData.conselheiro_referencia_id)));
    const finalRefUser = allUsers.find(u => u.id === finalRefId && (u.unidade_id || 1) === formData.unidade_id);
    
    const finalRefName = finalRefUser?.nome?.toUpperCase();
    const mappedFinalRefName = (finalRefName && nameMap && nameMap[finalRefName]) ? nameMap[finalRefName] : finalRefName;
    const isRefUserInTrio = Boolean(mappedFinalRefName && trioNames.some(n => isSameCounselorName(n, mappedFinalRefName)));

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

    const finalOrigem = formData.origem_categoria === 'SOCIEDADE'
      ? 'SOCIEDADE'
      : (formData.origem ? `${formData.origem_categoria} - ${formData.origem}` : formData.origem_categoria || '');

    const finalProvId = isFisico
      ? finalRefId
      : (canEditCouncillors && formData.providencia_imediata_manual)
        ? formData.providencia_imediata_manual
        : (initialData ? initialData.conselheiro_providencia_id : (assignedImediata?.id || finalRefId || unitCounselors[0]?.id || currentUser.id));

    const finalProvUser = allUsers.find(u => u.id === finalProvId && (u.unidade_id || 1) === formData.unidade_id);
    const finalProvName = isFisico 
      ? (finalRefUser?.nome || unitCounselors[0]?.nome || currentUser.nome || '') 
      : ((finalProvUser?.nome) || initialData?.conselheiro_providencia_nome || assignedImediata?.nome || unitCounselors[0]?.nome || currentUser.nome || '');

    const finalData = {
      ...initialData,
      ...formData,
      is_prontuario_fisico: isFisico,
      conselheiro_prontuario_fisico_id: isFisico ? finalRefId : undefined,
      outro_membro_nome: formData.tem_outro_membro ? formData.outro_membro_nome : '',
      outro_membro_parentesco: formData.tem_outro_membro ? formData.outro_membro_parentesco : '',
      outro_membro_cpf: formData.tem_outro_membro ? formData.outro_membro_cpf : '',
      unidade_id: formData.unidade_id,
      informacoes_documento: formData.tipo_documento,
      numero_comunicado_violacao: formData.numero_comunicado_violacao,
      numero_sipia: formData.numero_sipia,
      notificacao: formData.notificacao,
      providencia_imediata_manual: isFisico ? finalRefId : formData.providencia_imediata_manual,
      origem: finalOrigem,
      crianca_nome: formData.criancas[0].nome,
      observacoes_iniciais: formData.relato_inicial,
      data_recebimento: formData.data_aporte,
      hora_rece_bimento: formData.hora_aporte,
      periodo_rece_bimento: classifyTurno(formData.data_aporte, formData.hora_aporte),
      conselheiro_referencia_id: isFisico
        ? finalRefId
        : ((canEditCouncillors && (isManualReference || (initialData && formData.conselheiro_referencia_id))) 
          ? (formData.conselheiro_referencia_id || (initialData ? initialData.conselheiro_referencia_id : finalRefId) || unitCounselors[0]?.id || currentUser.id) 
          : (initialData ? initialData.conselheiro_referencia_id : (finalRefId || unitCounselors[0]?.id || currentUser.id))),
      conselheiro_referencia_nome: isFisico
        ? (finalRefUser?.nome || unitCounselors[0]?.nome || currentUser.nome || '')
        : ((allUsers.find(u => u.id === ((canEditCouncillors && (isManualReference || (initialData && formData.conselheiro_referencia_id))) ? (formData.conselheiro_referencia_id || initialData?.conselheiro_referencia_id || finalRefId) : (initialData ? initialData.conselheiro_referencia_id : finalRefId)) && (u.unidade_id || 1) === formData.unidade_id)?.nome) || initialData?.conselheiro_referencia_nome || unitCounselors[0]?.nome || currentUser.nome || ''),
      is_manual_override: isFisico || (canEditCouncillors && isManualReference) || (initialData ? initialData.is_manual_override : isReferenceLocked),
      conselheiro_providencia_id: finalProvId,
      conselheiro_providencia_nome: finalProvName,
      conselheiros_providencia_nomes: isFisico
        ? [finalRefUser?.nome || currentUser.nome, ...trioNames.filter(n => !isSameCounselorName(n, finalRefUser?.nome || ''))]
        : (canEditCouncillors && formData.providencia_imediata_manual)
          ? (() => {
              const manualUser = allUsers.find(u => u.id === formData.providencia_imediata_manual && (u.unidade_id || 1) === formData.unidade_id);
              const manualName = manualUser?.nome?.toUpperCase();
              return manualName ? [manualName, ...trioNames.filter(n => n.toUpperCase() !== manualName)] : finalValidators;
            })()
          : (initialData ? initialData.conselheiros_providencia_nomes : (finalValidators && finalValidators.length > 0 ? finalValidators : [currentUser.nome])),
      is_family_persistence: false,
      is_manual_providencia: isFisico || !!formData.providencia_imediata_manual,
      is_reference_in_trio: isFisico ? false : (isRefUserInTrio && !!finalRefUser && !formData.notificacao && !formData.providencia_imediata_manual),
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
        : (isFisico 
            ? `📁 PRONTUÁRIO FÍSICO: Atribuição direta ao Conselheiro [${finalRefUser?.nome || 'Selecionado'}] como Referência e Providência Imediata simultâneas (Roleta/Rodízio desativados).`
            : (formData.providencia_imediata_manual
                ? `✍️ Imediata atribuída MANUALMENTE: [${assignedImediata?.nome}].`
                : (formData.notificacao 
                    ? `🔔 Imediata vinculada à Notificação: ${formData.notificacao} (Distribuição Bloqueada).` 
                    : (isRefUserInTrio && finalRefUser
                        ? `🎯 Imediata vinculada ao Conselheiro de Referência [${finalRefUser.nome}] de plantão no dia (Distribuição Bloqueada).`
                        : (isReferenceLocked 
                            ? `✅ Providência Imediata distribuída por Rodízio do Trio do Dia (Conselheiro de Referência [${finalRefUser?.nome || 'Histórico'}] fora do trio de hoje).` 
                            : `✅ Providência Imediata distribuída por Rodízio do Trio do Dia (Referência: [${finalRefUser?.nome || 'N/A'}]).`))))) + (formData.is_urgente ? ' (🚨 Alerta de Documento Urgente Ativado)' : '')
    };

    if (!finalData.conselheiro_referencia_id) {
      finalData.conselheiro_referencia_id = unitCounselors[0]?.id || currentUser.id;
      finalData.conselheiro_referencia_nome = unitCounselors[0]?.nome || currentUser.nome;
    }

    if (!finalData.conselheiro_providencia_id) {
      finalData.conselheiro_providencia_id = finalData.conselheiro_referencia_id;
      finalData.conselheiro_providencia_nome = finalData.conselheiro_referencia_nome;
    }

    try {
      localStorage.removeItem(draftStorageKey);
    } catch {}

    onSubmit(finalData, []);
  };

  const currentInstitutions = useMemo(() => {
    if (!formData.origem_categoria || formData.origem_categoria === 'SOCIEDADE') {
      return [];
    }
    const list = getOrigensHierarquicasByUnidade(formData.unidade_id);
    const base = list.find(h => h.label === formData.origem_categoria)?.options || [];
    if (formData.origem_categoria && !base.includes('OUTRO') && !base.includes('OUTROS')) {
      return [...base, 'OUTRO'];
    }
    return base;
  }, [formData.origem_categoria, formData.unidade_id]);

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

        {/* BANNER DE PRESERVAÇÃO DE DADOS AO NAVEGAR ENTRE TELAS */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700">
              {hasDraftRestored 
                ? '📝 Informações preservadas automaticamente ao trocar de telas. Para gravar no banco de dados, clique em Salvar ao final.'
                : '💾 Preenchimento seguro: Você pode alternar entre as abas sem perder os dados digitados.'}
            </span>
          </div>
          {hasDraftRestored && !isReadOnly && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
              title="Limpar todos os campos digitados e reiniciar o formulário"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar Rascunho
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-x-hidden">
          <fieldset disabled={isReadOnly} className="contents">
            {/* BLOCO 1: NOVO DOCUMENTO (DATA E HORA) */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-[11px] sm:text-[12px] font-black uppercase text-slate-800 tracking-widest">1. Novo Documento</h3>
              </div>

              {/* OPÇÃO AO LADO DE "NOVO DOCUMENTO": PRONTUÁRIO FÍSICO */}
              <label 
                className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none shadow-xs ${
                  formData.is_prontuario_fisico 
                    ? 'bg-amber-600 border-amber-700 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-400/40' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50/60'
                }`}
                title="Prontuário Físico: seleciona o conselheiro responsável como Referência e Imediata fixos, sem acionar a roleta de distribuição"
              >
                <input 
                  type="checkbox"
                  className="hidden"
                  disabled={!!initialData && !canEditCase}
                  checked={!!formData.is_prontuario_fisico}
                  onChange={e => {
                    const checked = e.target.checked;
                    setFormData(prev => {
                      const defaultCounselorId = checked 
                        ? (prev.conselheiro_prontuario_fisico_id || prev.conselheiro_referencia_id || unitCounselors[0]?.id || '') 
                        : '';
                      return {
                        ...prev,
                        is_prontuario_fisico: checked,
                        conselheiro_prontuario_fisico_id: defaultCounselorId,
                        conselheiro_referencia_id: checked ? defaultCounselorId : prev.conselheiro_referencia_id,
                        providencia_imediata_manual: checked ? defaultCounselorId : prev.providencia_imediata_manual
                      };
                    });
                    if (checked) {
                      setIsManualReference(false);
                    }
                  }}
                />
                <FolderArchive className={`w-4 h-4 ${formData.is_prontuario_fisico ? 'text-white' : 'text-amber-600'}`} />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                  Prontuário Físico
                </span>
                {formData.is_prontuario_fisico ? (
                  <span className="px-1.5 py-0.5 bg-amber-800 text-white rounded text-[8px] font-black uppercase tracking-tight">
                    Ativo
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                    (Sem Roleta)
                  </span>
                )}
              </label>
            </div>

            {/* PAINEL DE SELEÇÃO DO CONSELHEIRO DO PRONTUÁRIO FÍSICO */}
            {formData.is_prontuario_fisico && (
              <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-700" />
                    Conselheiro do Prontuário Físico *
                  </label>
                  <span className="text-[9px] font-black px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md uppercase flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Roleta Desativada
                  </span>
                </div>
                <select
                  required
                  disabled={!!initialData && !canEditCase}
                  className="w-full p-3.5 bg-white border-2 border-amber-400 rounded-xl font-bold uppercase text-[12px] text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm cursor-pointer"
                  value={formData.conselheiro_prontuario_fisico_id || formData.conselheiro_referencia_id || ''}
                  onChange={e => {
                    const selectedId = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      conselheiro_prontuario_fisico_id: selectedId,
                      conselheiro_referencia_id: selectedId,
                      providencia_imediata_manual: selectedId
                    }));
                  }}
                >
                  <option value="">SELECIONE O CONSELHEIRO RESPONSÁVEL...</option>
                  {getActiveRotationCounselors(formData.unidade_id, allUsers, nameMap).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nome.toUpperCase()} ({u.cargo || 'CONSELHEIRO(A)'})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] font-bold text-amber-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                  O conselheiro selecionado será definido simultaneamente como <strong>Referência</strong> e <strong>Providência Imediata</strong>.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Documento *</label>
                <input 
                  type="date" 
                  required 
                  max={todayDate}
                  disabled={!!initialData && !canEditCase}
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
                  disabled={!!initialData && !canEditCase}
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
                      Aciona alerta visual de urgência para providência imediata (sem alterar a sequência da distribuição)
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* BLOCO 2: ORIGEM E CANAL DO COMUNICADO (NOVO MODELO) */}
          <section className="p-4 sm:p-8 bg-slate-50/50 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
                <h3 className="text-[11px] sm:text-[13px] font-black uppercase text-slate-800 tracking-widest">2. Origem e Canal do Comunicado</h3>
              </div>
              {(formData.origem_categoria || selectedOrigemDropdown || formData.canal_comunicado || customOrigem) && (
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      origem_categoria: '',
                      origem: '',
                      canal_comunicado: ''
                    });
                    setSelectedOrigemDropdown('');
                    setCustomOrigem('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
                  title="Resetar e limpar campos de origem e canal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Resetar
                </button>
              )}
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
                  {getOrigensHierarquicasByUnidade(formData.unidade_id).map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                </select>
              </div>

              {/* COLUNA 2: INSTITUIÇÃO */}
              <div className="space-y-2">
                <label className="lg:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Instituição</label>
                <SearchableSelect
                  disabled={isReadOnly || !formData.origem_categoria || formData.origem_categoria === 'SOCIEDADE'}
                  className="w-full p-4 sm:p-5 bg-white border border-slate-200 rounded-xl sm:rounded-[1.5rem] font-bold uppercase text-[10px] sm:text-[11px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder={formData.origem_categoria === 'SOCIEDADE' ? "NÃO SE APLICA (SOCIEDADE)" : "SELECIONE INSTITUIÇÃO..."}
                  options={[...currentInstitutions].sort((a, b) => a.localeCompare(b))}
                  value={formData.origem_categoria === 'SOCIEDADE' ? '' : selectedOrigemDropdown}
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
                  {CANAIS_COMUNICADO_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {formData.origem_categoria !== 'SOCIEDADE' && (selectedOrigemDropdown === 'OUTRO' || selectedOrigemDropdown === 'OUTROS') && (
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
                  disabled={!!initialData && !canEditCase}
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
                  disabled={isReadOnly || (!!initialData && !canEditCase && !isConselheiro)}
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
                  disabled={isReadOnly || (!!initialData && !canEditCase && !isConselheiro)}
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
                  {getActiveRotationCounselors(formData.unidade_id, allUsers, nameMap)
                    .map(u => (
                      <option key={u.id} value={u.nome.toUpperCase()}>{u.nome.toUpperCase()}</option>
                    ))}
                </select>
              </div>
            </div>
          </section>

          {/* BLOCO 3: IDENTIFICAÇÃO FAMILIAR */}
          <section className="space-y-6">
            {cpfAutofillBanner && (
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300/80 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FolderArchive className="w-3 h-3" /> Histórico Familiar Reconhecido ({cpfAutofillBanner.matchedBy})
                      </span>
                      {cpfAutofillBanner.matchedDoc.conselheiro_referencia_id && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Conselheiro de Referência: {allUsers.find(u => u.id === cpfAutofillBanner.matchedDoc.conselheiro_referencia_id)?.nome || 'Vinculado'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-emerald-950 mt-1.5 leading-snug">
                      Bairro da Criança, Dados Familiares, Crianças/Adolescentes e Conselheiro de Referência foram preenchidos e vinculados automaticamente do prontuário existente.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FolderArchive className="w-3.5 h-3.5" /> Ver Prontuário
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCpfAutofillBanner(null);
                      setIsReferenceLocked(false);
                    }}
                    title="Ocultar aviso de preenchimento automático"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

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
                  maxLength={11}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500"
                  value={formData.cpf_genitora}
                  onChange={e => setFormData({...formData, cpf_genitora: cleanCPF(e.target.value)})}
                  placeholder="12345678900 (apenas números)"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bairro da Criança *</label>
                <SearchableSelect
                  disabled={isReadOnly}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold uppercase text-[11px]"
                  placeholder="SELECIONE O BAIRRO..."
                  options={getBairrosByUnidade(formData.unidade_id)}
                  value={formData.bairro}
                  onChange={val => {
                    setFormData(prev => ({
                      ...prev,
                      bairro: val
                    }));
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
                      maxLength={11}
                      placeholder="12345678900 (apenas números)"
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] outline-none focus:border-blue-500"
                      value={formData.outro_membro_cpf}
                      onChange={e => setFormData({ ...formData, outro_membro_cpf: cleanCPF(e.target.value) })}
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
                        maxLength={11}
                        placeholder="12345678900"
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
              disabled={!!initialData && !canEditCase}
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
                {canEditCouncillors && !formData.is_prontuario_fisico && (
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
              
              {canEditCouncillors && !formData.is_prontuario_fisico && isManualReference ? (
                <select 
                  required
                  className="w-full p-4 bg-white border border-indigo-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-indigo-500 shadow-sm"
                  value={formData.conselheiro_referencia_id || assignedReference?.id || ''}
                  onChange={e => setFormData({...formData, conselheiro_referencia_id: e.target.value})}
                >
                  <option value="">Selecione o Conselheiro...</option>
                  {getActiveRotationCounselors(formData.unidade_id, allUsers, nameMap)
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                    ))}
                </select>
              ) : (
                <div className={`p-4 rounded-xl font-bold flex items-center justify-between ${formData.is_prontuario_fisico ? 'bg-amber-50/60 border-2 border-amber-300 text-amber-950 shadow-xs' : 'bg-white border border-slate-200 text-slate-700'}`}>
                  <span>
                    {allUsers.find(u => u.id === (formData.conselheiro_referencia_id || assignedReference?.id) && (u.unidade_id || 1) === formData.unidade_id)?.nome || assignedReference?.nome || 'Aguardando...'}
                  </span>
                  <span className={`text-[9px] px-2 py-1 flex items-center gap-1 rounded-md uppercase font-black ${
                    formData.is_prontuario_fisico
                      ? 'bg-amber-600 text-white shadow-xs'
                      : (initialData && !isManualReference ? 'bg-slate-200 text-slate-700 border border-slate-300' : (isReferenceLocked ? 'bg-amber-50 text-amber-600' : (formData.notificacao ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600')))
                  }`}>
                    {(!canEditCouncillors || !isManualReference || formData.is_prontuario_fisico) && <Lock className="w-3 h-3 text-current" />}
                    {formData.is_prontuario_fisico
                      ? 'PRONTUÁRIO FÍSICO (FIXO)'
                      : (initialData 
                          ? (isManualReference ? (isFabio ? 'Ajuste Manual (Fábio)' : (isADM ? 'Ajuste Manual (ADM)' : 'Ajuste Manual (Leandro)')) : 'Cadastrado') 
                          : (isReferenceLocked 
                              ? (isManualReference ? (isFabio ? 'Ajuste Manual (Fábio)' : 'Ajuste Manual (ADM)') : 'Vínculo Histórico') 
                              : (formData.notificacao 
                                  ? 'Notificação (Isento do Rodízio)' 
                                  : (!isRotationChannel(formData.canal_comunicado)
                                      ? 'Canal Plantão (Escala do Dia)'
                                      : (isManualReference ? (isFabio ? 'Ajuste Manual (Fábio)' : 'Ajuste Manual (ADM)') : `Rodízio (${normalizeCanalName(formData.canal_comunicado)})`)))))}
                  </span>
                </div>
              )}
              {isReferenceLocked && !formData.is_prontuario_fisico && (
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
                {canEditCouncillors && !formData.is_prontuario_fisico && (
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
              {canEditCouncillors && !formData.is_prontuario_fisico && formData.providencia_imediata_manual ? (
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
                  formData.is_prontuario_fisico
                    ? 'bg-amber-50/60 border-2 border-amber-300 text-amber-950 shadow-xs'
                    : (formData.is_urgente
                        ? 'bg-rose-50 border-2 border-rose-500 text-rose-950 shadow-md ring-2 ring-rose-200'
                        : 'bg-white border border-slate-200 text-slate-700')
                }`}>
                  {/* BADGE DE PLANTÃO / URGÊNCIA */}
                  {formData.is_urgente && !formData.is_prontuario_fisico ? (
                    <div className="absolute top-0 right-0 px-2.5 py-1 bg-rose-600 text-white rounded-bl-lg z-10 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                      <AlertCircle className="w-3 h-3 text-white" /> DESTAQUE ESPECIAL: PROVIDÊNCIA IMEDIATA URGENTE
                    </div>
                  ) : !formData.is_prontuario_fisico && (() => {
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
                  <span className={formData.is_urgente && !formData.is_prontuario_fisico ? 'font-black text-rose-950 text-sm flex items-center gap-1.5 pt-1' : ''}>
                    {formData.is_urgente && !formData.is_prontuario_fisico && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    {allUsers.find(u => u.id === (formData.providencia_imediata_manual || (initialData?.conselheiro_providencia_id) || assignedImediata?.id) && (u.unidade_id || 1) === formData.unidade_id)?.nome || assignedImediata?.nome || 'Aguardando...'}
                  </span>
                  <span className={`text-[9px] px-2 py-1 flex items-center gap-1 rounded-md uppercase font-black ${
                    formData.is_prontuario_fisico
                      ? 'bg-amber-600 text-white shadow-xs'
                      : (formData.is_urgente 
                          ? 'bg-rose-600 text-white shadow-xs' 
                          : (initialData && !formData.providencia_imediata_manual ? 'bg-slate-200 text-slate-700 border border-slate-300' : (formData.notificacao || isCurrentRefUserInTrio ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')))
                  }`}>
                    {(!canEditCouncillors || !formData.providencia_imediata_manual || formData.is_prontuario_fisico) && <Lock className={`w-3 h-3 ${formData.is_urgente || formData.is_prontuario_fisico ? 'text-white' : 'text-slate-500'}`} />}
                    {formData.is_prontuario_fisico
                      ? 'PRONTUÁRIO FÍSICO (FIXO)'
                      : (formData.is_urgente
                          ? '🚨 URGENTE'
                          : (initialData && !formData.providencia_imediata_manual
                              ? 'Cadastrado' 
                              : (formData.providencia_imediata_manual 
                                  ? (isFabio ? 'Sobrescrita Manual (Fábio)' : 'Sobrescrita Manual (ADM)') 
                                  : (formData.notificacao 
                                      ? '🔔 Notificação (Bloqueada)' 
                                      : (isCurrentRefUserInTrio 
                                          ? '🎯 Referência no Trio (Bloqueada)' 
                                          : '🔄 Rodízio do Trio (Ref. Fora)')))))}
                  </span>
                </div>
              )}
              {/* Informativo de Regra de Distribuição */}
              {!initialData && (
                <div className="text-[10px] px-3 py-1.5 rounded-lg border font-medium">
                  {formData.is_prontuario_fisico ? (
                    <div className="flex items-center gap-1.5 text-amber-900 bg-amber-50/70">
                      <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                      <span><strong>Roleta Desativada (Prontuário Físico):</strong> Referência e Providência Imediata fixadas em <strong>{currentRefUser?.nome || 'Conselheiro Selecionado'}</strong> sem rodízio.</span>
                    </div>
                  ) : formData.notificacao ? (
                    <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/50">
                      <Lock className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span><strong>Distribuição Bloqueada:</strong> Providência imediata vinculada à notificação de {formData.notificacao}.</span>
                    </div>
                  ) : isCurrentRefUserInTrio ? (
                    <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/50">
                      <Lock className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span><strong>Distribuição Bloqueada:</strong> Conselheiro de Referência presente no trio do dia ({currentRefUser?.nome || 'N/A'}).</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span><strong>Distribuição Ativa:</strong> Conselheiro de Referência fora do trio do dia. Seguindo o rodízio sequencial do trio de hoje.</span>
                    </div>
                  )}
                </div>
              )}
              {!isReadOnly && !formData.is_prontuario_fisico && (
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
