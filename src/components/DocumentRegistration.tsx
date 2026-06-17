
import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, Calendar, Clock, ShieldCheck, Table, AlertCircle, Building2, ChevronRight, CheckCircle2, UserRound, FileText, MapPin, Hash, Phone, Users, Baby, Trash2, PlusCircle, LayoutDashboard, ClipboardCheck, History } from 'lucide-react';
import { Documento, User, ChildData, DocumentStatus, AgendaEntry } from '../types';
import { BAIRROS, INITIAL_USERS, classifyTurno, ORIGENS_HIERARQUICAS, CANAIS_COMUNICADO_LIST, getEffectiveEscala, UNIFIED_GENDER_OPTIONS, CONSELHEIROS_ALFABETICO_POR_UNIDADE, getBairrosByUnidade } from '../constants';
import FamilyHistoryModal from './FamilyHistoryModal';

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
}

const DocumentRegistration: React.FC<DocumentRegistrationProps> = ({ documents, users, agenda, currentUser, onSubmit, onCancel, initialData, isReadOnly, title, nameMap, allUsers = users }) => {
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
    bairro: initialData?.bairro || '',
    relato_inicial: initialData?.observacoes_iniciais || '',
    conselheiro_referencia_id: initialData?.conselheiro_referencia_id || '',
    providencia_imediata_manual: initialData?.providencia_imediata_manual || '',
    criancas: initialData?.criancas || [{ nome: '', nao_informado: false, data_nascimento: '', cpf: '', genero_identidade: '' }] as ChildData[]
  });

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

  const isADM = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';

  // DIRETRIZ 41/50/53: Reconhecimento por CPF e Auto-preenchimento
  useEffect(() => {
    const cpfGen = (formData.cpf_genitora || '').replace(/\D/g, '');
    const cpfsCriancas = formData.criancas.map(c => (c.cpf || '').replace(/\D/g, '')).filter(c => c.length === 11);
    
    const findExisting = () => {
      if (cpfGen.length === 11) {
        return documents.filter(d => (d.cpf_genitora || '').replace(/\D/g, '') === cpfGen);
      }
      for (const cpf of cpfsCriancas) {
        const found = documents.filter(d => d.criancas?.some(c => (c.cpf || '').replace(/\D/g, '') === cpf));
        if (found.length > 0) return found;
      }
      return [];
    };

    const history = findExisting();
    if (history.length > 0) {
      const existingDoc = history[0];
      setFormData(prev => ({
        ...prev,
        genitora_nome: existingDoc.genitora_nome,
        bairro: existingDoc.bairro,
        conselheiro_referencia_id: existingDoc.conselheiro_referencia_id,
        unidade_id: existingDoc.unidade_id || prev.unidade_id,
        criancas: existingDoc.criancas || prev.criancas
      }));
      setIsReferenceLocked(true);
      setIsManualReference(isADM);
      setFamilyHistory(history);
    } else {
      setIsReferenceLocked(false);
      setFamilyHistory([]);
    }
  }, [formData.cpf_genitora, formData.criancas, documents, isADM]);

  // DIRETRIZ 48: Escala baseada na data de Hoje para novos documentos (para não alterar a sequência ou sofrer interferência de data/hora retrativa)
  const trioNames = useMemo(() => {
    const d = initialData ? formData.data_aporte : todayDate;
    const t = '12:00'; // Sempre usa horário de expediente comercial padrão para alinhar com o Diagnóstico de Distribuição do dia
    return getEffectiveEscala(d, t, formData.unidade_id, nameMap);
  }, [initialData, formData.data_aporte, todayDate, formData.unidade_id, nameMap]);

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
    
    if (initialData) return allUsers.find(u => u.id === initialData.conselheiro_referencia_id);
    if (isReferenceLocked) return allUsers.find(u => u.id === formData.conselheiro_referencia_id);
    if (isManualReference && formData.conselheiro_referencia_id) return allUsers.find(u => u.id === formData.conselheiro_referencia_id);
    
    // Filtra casos novos (sem histórico) ordenando descendente por data de criação para obter o último de forma consistente
    const newCases = documents
      .filter(d => !d.is_manual_override && d.unidade_id === formData.unidade_id)
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
      return allUsers.find(u => u.nome.toUpperCase() === formData.notificacao.toUpperCase() && u.unidade_id === formData.unidade_id);
    }

    if (initialData) return allUsers.find(u => u.id === initialData.conselheiro_providencia_id);
    
    // Para novos documentos, a imediata é sempre baseada no dia real de hoje (todayDate) e usa a escala/trio de hoje
    const dateToUse = todayDate;

    // 2. Persistência Familiar no mesmo dia de recebimento/aporte real (Hoje)
    // Procuramos documentos da mesma família cadastrados hoje
    const sameFamilyTodayDocs = documents.filter(d => {
      const isDocOfToday = d.data_aporte === dateToUse || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === dateToUse);
      if (!isDocOfToday || d.unidade_id !== formData.unidade_id || !d.conselheiro_providencia_id || d.id === initialData?.id) {
        return false;
      }
      
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

    // Filtro especial correspondente à regra do usuário:
    // caso um conselheiro de providência imediata recebeu algum documento de referência que no dia não seja o próprio (d.conselheiro_providencia_id !== d.conselheiro_referencia_id)
    const sameFamilyTodayDiffProvRef = sameFamilyTodayDocs.find(d => d.conselheiro_providencia_id !== d.conselheiro_referencia_id);
    const sameFamilyTodayDirect = sameFamilyTodayDiffProvRef || sameFamilyTodayDocs[0];

    if (sameFamilyTodayDirect) {
      return allUsers.find(u => u.id === sameFamilyTodayDirect.conselheiro_providencia_id);
    }

    // Novo requisito: se já tem conselheiro de referência e ele está na providência imediata do dia (trioNames), ele deve ser a providência imediata
    const refUser = assignedReference;
    const refUserName = refUser?.nome?.toUpperCase();
    const mappedRefName = (refUserName && nameMap && nameMap[refUserName]) ? nameMap[refUserName] : refUserName;
    const isRefUserInTrio = mappedRefName && trioNames.map(n => n.toUpperCase()).includes(mappedRefName.toUpperCase());

    if (isRefUserInTrio && refUser) {
      return refUser;
    }
    
    // 3. Lógica de Distribuição Justa (Rodízio de Providência Imediata)
    // Filtramos para ignorar documentos que foram atribuídos por persistência familiar ou manual para não quebrar a sequência de hoje
    const todayDocs = documents
      .filter(d => {
        const isDocOfToday = d.data_aporte === dateToUse || (d.criado_em && new Date(d.criado_em).toISOString().split('T')[0] === dateToUse);
        if (!isDocOfToday || d.unidade_id !== formData.unidade_id) {
          return false;
        }
        return !d.is_family_persistence && !d.is_manual_providencia;
      })
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

    const lastAutoDoc = todayDocs.find(d => !d.notificacao);
    
    const lastImediataId = lastAutoDoc?.conselheiro_providencia_id;
    const lastImediataUser = allUsers.find(u => u.id === lastImediataId);
    const lastImediataNameRaw = lastImediataUser?.nome.toUpperCase();
    const lastImediataName = (lastImediataNameRaw && nameMap && nameMap[lastImediataNameRaw]) ? nameMap[lastImediataNameRaw] : lastImediataNameRaw;
    
    const currentIndex = trioNames.indexOf(lastImediataName || '');
    const nextIndex = trioNames.length > 0 ? (currentIndex + 1) % trioNames.length : 0;
    const nextName = trioNames[nextIndex];
    
    return allUsers.find(u => u.status === 'ATIVO' && u.nome.toUpperCase() === nextName && u.unidade_id === formData.unidade_id);
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

    const finalRefId = initialData ? initialData.conselheiro_referencia_id : ((isManualReference || isReferenceLocked) ? formData.conselheiro_referencia_id : (assignedReference?.id || formData.conselheiro_referencia_id));
    const finalRefUser = allUsers.find(u => u.id === finalRefId);
    
    const finalRefName = finalRefUser?.nome?.toUpperCase();
    const mappedFinalRefName = (finalRefName && nameMap && nameMap[finalRefName]) ? nameMap[finalRefName] : finalRefName;
    const isRefUserInTrio = mappedFinalRefName && trioNames.map(n => n.toUpperCase()).includes(mappedFinalRefName.toUpperCase());

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
      conselheiro_referencia_id: finalRefId,
      is_manual_override: initialData ? initialData.is_manual_override : (isManualReference || isReferenceLocked),
      conselheiro_providencia_id: assignedImediata?.id || '',
      conselheiros_providencia_nomes: finalValidators,
      is_family_persistence: isFamilyPersistence,
      is_manual_providencia: !!formData.providencia_imediata_manual,
      status: initialData ? initialData.status : (formData.notificacao ? [`NOTIFICACAO_${formData.notificacao.toUpperCase()}` as DocumentStatus] : ['AGUARDANDO_ANALISE']),
      justificativa_distribuicao: initialData 
        ? initialData.justificativa_distribuicao 
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
                            : `✅ Atribuído por Rodízio Alfabético.`)))))
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
          <button onClick={onCancel} className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
                <select 
                  required
                  disabled={!formData.origem_categoria}
                  className="w-full p-4 sm:p-5 bg-white border border-slate-200 rounded-xl sm:rounded-[1.5rem] font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  value={selectedOrigemDropdown}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedOrigemDropdown(val);
                    if (val === 'OUTRO' || val === 'OUTROS') {
                      setFormData(prev => ({ ...prev, origem: customOrigem || val }));
                    } else {
                      setFormData(prev => ({ ...prev, origem: val }));
                      setCustomOrigem('');
                    }
                  }}
                >
                  <option value="">SELECIONE INSTITUIÇÃO...</option>
                  {[...currentInstitutions].sort((a, b) => a.localeCompare(b)).map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 pt-2">
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

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Providência Imediata MANUAL</label>
                <select 
                  className="w-full p-3 sm:p-4 bg-white border border-slate-100 rounded-xl font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  value={formData.providencia_imediata_manual}
                  onChange={e => setFormData({...formData, providencia_imediata_manual: e.target.value})}
                >
                  <option value="">AUTOMÁTICA / ESCALA...</option>
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
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bairro da Criança *</label>
                <select 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500"
                  value={formData.bairro}
                  onChange={e => setFormData({...formData, bairro: e.target.value})}
                >
                  <option value="">Selecione o Bairro...</option>
                  {getBairrosByUnidade(formData.unidade_id).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
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
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Nascimento {!crianca.nao_informado && '*'}</label>
                      <input 
                        type="date" 
                        required={!crianca.nao_informado} 
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
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">5. Relato Inicial dos Fatos *</h3>
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
                {!isReferenceLocked && !initialData && (
                  <button 
                    type="button" 
                    onClick={() => setIsManualReference(!isManualReference)}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${isManualReference ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                  >
                    Ajuste Histórico
                  </button>
                )}
              </label>
              
              {isManualReference && !isReferenceLocked && !initialData ? (
                <select 
                  required
                  className="w-full p-4 bg-white border border-indigo-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-indigo-500 shadow-sm"
                  value={formData.conselheiro_referencia_id}
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
                  <span>{assignedReference?.nome || 'Aguardando...'}</span>
                  <span className={`text-[9px] px-2 py-1 rounded-md uppercase ${initialData ? 'bg-slate-100 text-slate-500' : (isReferenceLocked ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600')}`}>
                    {initialData ? 'Distribuição Bloqueada' : (isReferenceLocked ? 'Vínculo Histórico' : 'Rodízio Alfabético')}
                  </span>
                </div>
              )}
              {isReferenceLocked && (
                <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter">Referência Identificada: Atribuição bloqueada por vínculo familiar.</span>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> Providência Imediata
              </label>
              <div className="p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center justify-between">
                <span>{assignedImediata?.nome || 'Aguardando...'}</span>
                <span className={`text-[9px] px-2 py-1 rounded-md uppercase ${(initialData && !formData.notificacao && !formData.providencia_imediata_manual) ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'}`}>
                  {(initialData && !formData.notificacao && !formData.providencia_imediata_manual) 
                    ? 'Distribuição Bloqueada' 
                    : (formData.providencia_imediata_manual 
                        ? 'Sobrescrita Manual' 
                        : (formData.notificacao ? 'Vínculo de Notificação' : 'Escala do Dia'))}
                </span>
              </div>
            </div>
          </div>
        </fieldset>

        {!isReadOnly && (
          <button 
            type="submit" 
            className="w-full py-6 bg-[#111827] text-white rounded-2xl font-black uppercase text-[14px] tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Save className="w-5 h-5" /> [Salvar Prontuário e Monitoramento]
          </button>
        )}
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
    </div>
  );
};

export default DocumentRegistration;
