
import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, Calendar, Clock, ShieldCheck, Table, AlertCircle, Building2, ChevronRight, CheckCircle2, UserRound, FileText, MapPin, Hash, Phone, Users, Baby, Trash2, PlusCircle, LayoutDashboard, ClipboardCheck, History } from 'lucide-react';
import { Documento, User, ChildData, DocumentStatus } from '../types';
import { BAIRROS, INITIAL_USERS, classifyTurno, ORIGENS_HIERARQUICAS, CANAIS_COMUNICADO_LIST, getEffectiveEscala, UNIFIED_GENDER_OPTIONS, CONSELHEIROS_ALFABETICO_POR_UNIDADE } from '../constants';
import FamilyHistoryModal from './FamilyHistoryModal';

interface DocumentRegistrationProps {
  documents: Documento[];
  currentUser: User;
  onSubmit: (data: any, files: File[]) => void;
  onCancel: () => void;
  initialData?: Documento;
  isReadOnly?: boolean;
}

const DocumentRegistration: React.FC<DocumentRegistrationProps> = ({ documents, currentUser, onSubmit, onCancel, initialData, isReadOnly }) => {
  const systemNow = new Date();
  const todayDate = systemNow.toISOString().split('T')[0];
  const todayTime = systemNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const [formData, setFormData] = useState({
    origem_categoria: initialData?.origem?.split(' - ')[0] || '',
    origem: initialData?.origem?.split(' - ')[1] || '',
    canal_comunicado: initialData?.canal_comunicado || '',
    notificacao: initialData?.notificacao || '',
    tipo_documento: initialData?.informacoes_documento?.split(' - ')[0] || '',
    data_aporte: initialData?.data_aporte || todayDate,
    hora_aporte: initialData?.hora_aporte || todayTime,
    genitora_nome: initialData?.genitora_nome || '',
    genitora_nao_informado: initialData?.genitora_nao_informado || false,
    cpf_genitora: initialData?.cpf_genitora || '',
    bairro: initialData?.bairro || '',
    relato_inicial: initialData?.observacoes_iniciais || '',
    conselheiro_referencia_id: initialData?.conselheiro_referencia_id || '',
    criancas: initialData?.criancas || [{ nome: '', nao_informado: false, data_nascimento: '', cpf: '', genero_identidade: '' }] as ChildData[]
  });

  const [isReferenceLocked, setIsReferenceLocked] = useState(false);
  const [isManualReference, setIsManualReference] = useState(false);
  const [showRelatoError, setShowRelatoError] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [familyHistory, setFamilyHistory] = useState<Documento[]>([]);

  const isADM = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';

  // DIRETRIZ 41/50/53: Reconhecimento por CPF e Auto-preenchimento
  useEffect(() => {
    const cpfGen = formData.cpf_genitora.replace(/\D/g, '');
    const cpfsCriancas = formData.criancas.map(c => c.cpf.replace(/\D/g, '')).filter(c => c.length === 11);
    
    const findExisting = () => {
      if (cpfGen.length === 11) {
        return documents.filter(d => d.cpf_genitora?.replace(/\D/g, '') === cpfGen);
      }
      for (const cpf of cpfsCriancas) {
        const found = documents.filter(d => d.criancas?.some(c => c.cpf?.replace(/\D/g, '') === cpf));
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
        criancas: existingDoc.criancas || prev.criancas
      }));
      setIsReferenceLocked(true);
      setIsManualReference(false);
      setFamilyHistory(history);
    } else {
      setIsReferenceLocked(false);
      setFamilyHistory([]);
    }
  }, [formData.cpf_genitora, formData.criancas, documents]);

  // DIRETRIZ 48: Escala baseada na data de HOJE
  const trioNames = useMemo(() => getEffectiveEscala(todayDate, todayTime, currentUser.unidade_id), [todayDate, todayTime, currentUser.unidade_id]);

  // DIRETRIZ 51/52: Rodízio Alfabético para Referência e Imediata
  const assignedReference = useMemo(() => {
    const conselheirosUnidade = CONSELHEIROS_ALFABETICO_POR_UNIDADE[currentUser.unidade_id] || [];
    
    if (initialData) return INITIAL_USERS.find(u => u.id === initialData.conselheiro_referencia_id);
    if (isReferenceLocked) return INITIAL_USERS.find(u => u.id === formData.conselheiro_referencia_id);
    if (isManualReference && formData.conselheiro_referencia_id) return INITIAL_USERS.find(u => u.id === formData.conselheiro_referencia_id);
    
    // Filtra casos novos (sem histórico)
    const newCases = documents.filter(d => !d.is_manual_override);
    const lastAssignedRefId = newCases[0]?.conselheiro_referencia_id;
    const lastRefName = INITIAL_USERS.find(u => u.id === lastAssignedRefId)?.nome.toUpperCase();
    
    const currentIndex = conselheirosUnidade.indexOf(lastRefName || '');
    const nextIndex = (currentIndex + 1) % conselheirosUnidade.length;
    const nextName = conselheirosUnidade[nextIndex];
    
    return INITIAL_USERS.find(u => u.nome.toUpperCase() === nextName && u.unidade_id === currentUser.unidade_id);
  }, [isReferenceLocked, formData.conselheiro_referencia_id, documents, currentUser.unidade_id]);

  const assignedImediata = useMemo(() => {
    // 1. PRIORIDADE ABSOLUTA: Notificação desbloqueia e define a imediata
    if (formData.notificacao) {
      return INITIAL_USERS.find(u => u.nome.toUpperCase() === formData.notificacao.toUpperCase() && u.unidade_id === currentUser.unidade_id);
    }

    if (initialData) return INITIAL_USERS.find(u => u.id === initialData.conselheiro_providencia_id);
    
    // 2. Lógica de Distribuição Justa (Rodízio)
    // Filtra apenas documentos de hoje que NÃO foram por notificação para manter o rodízio justo
    const todayDocs = documents.filter(d => d.data_aporte === todayDate);
    const lastAutoDoc = todayDocs.find(d => !d.notificacao);
    
    const lastImediataId = lastAutoDoc?.conselheiro_providencia_id;
    const lastImediataName = INITIAL_USERS.find(u => u.id === lastImediataId)?.nome.toUpperCase();
    
    const currentIndex = trioNames.indexOf(lastImediataName || '');
    const nextIndex = (currentIndex + 1) % trioNames.length;
    const nextName = trioNames[nextIndex];
    
    return INITIAL_USERS.find(u => u.nome.toUpperCase() === nextName && u.unidade_id === currentUser.unidade_id);
  }, [trioNames, documents, todayDate, formData.notificacao, initialData, currentUser.unidade_id]);

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
    
    // DIRETRIZ 49: Bloqueio 18+
    if (field === 'data_nascimento' && value) {
      const birthDate = new Date(value);
      const age = systemNow.getFullYear() - birthDate.getFullYear();
      if (age >= 18) {
        alert("⚠️ Bloqueio de Cadastro: Indivíduo com 18 anos ou mais identificado. O Conselho Tutelar não possui competência para novos procedimentos após a maioridade (Art. 2º do ECA).");
        newChildren[index].data_nascimento = '';
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
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    
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

    // Lógica de seleção justa de 2 validadores do trio para casos de notificação
    const notifiedName = formData.notificacao?.toUpperCase();
    const isNewNotif = !initialData || initialData.notificacao?.toUpperCase() !== notifiedName;
    
    let finalValidators = initialData?.conselheiros_providencia_nomes || trioNames;

    if (notifiedName) {
      if (isNewNotif) {
        const isNotifiedInTrio = trioNames.some(n => n.toUpperCase() === notifiedName);
        if (isNotifiedInTrio) {
          finalValidators = trioNames;
        } else {
          // Busca documentos de hoje que tiveram notificação para equilibrar a carga
          const todayNotifDocs = documents.filter(d => d.data_aporte === todayDate && d.notificacao);
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
      ...formData,
      notificacao: formData.notificacao,
      origem: `${formData.origem_categoria} - ${formData.origem}`,
      crianca_nome: formData.criancas[0].nome,
      observacoes_iniciais: formData.relato_inicial,
      data_recebimento: formData.data_aporte,
      hora_rece_bimento: formData.hora_aporte,
      periodo_rece_bimento: classifyTurno(formData.data_aporte, formData.hora_aporte),
      conselheiro_referencia_id: initialData ? initialData.conselheiro_referencia_id : ((isManualReference || isReferenceLocked) ? formData.conselheiro_referencia_id : (assignedReference?.id || formData.conselheiro_referencia_id)),
      is_manual_override: initialData ? initialData.is_manual_override : isManualReference,
      conselheiro_providencia_id: assignedImediata?.id,
      conselheiros_providencia_nomes: finalValidators,
      status: initialData ? initialData.status : (formData.notificacao ? [`NOTIFICACAO_${formData.notificacao.toUpperCase()}` as DocumentStatus] : ['AGUARDANDO_ANALISE']),
      justificativa_distribuicao: initialData 
        ? initialData.justificativa_distribuicao 
        : (formData.notificacao 
            ? `🔔 Imediata vinculada à Notificação: ${formData.notificacao}.` 
            : (isReferenceLocked 
                ? `📌 Referência mantida por vínculo histórico.` 
                : `✅ Atribuído por Rodízio Alfabético.`))
    };

    onSubmit(finalData, []);
  };

  const currentInstitutions = ORIGENS_HIERARQUICAS.find(h => h.label === formData.origem_categoria)?.options || [];

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <header className="p-8 bg-[#111827] text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-[22px] font-black uppercase tracking-tight leading-none">SIMCT - Novo Procedimento</h2>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1">Hortolândia - Gestão de Prontuários</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <fieldset disabled={isReadOnly} className="contents">
            {/* BLOCO 1: NOVO DOCUMENTO (DATA E HORA) */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">1. Novo Documento</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Documento *</label>
                <input 
                  type="date" 
                  required 
                  max={todayDate}
                  disabled={!!initialData && !isADM}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500 disabled:opacity-50"
                  value={formData.data_aporte}
                  onChange={e => setFormData({...formData, data_aporte: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora *</label>
                <input 
                  type="time" 
                  required 
                  disabled={!!initialData && !isADM}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500 disabled:opacity-50"
                  value={formData.hora_aporte}
                  onChange={e => setFormData({...formData, hora_aporte: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* BLOCO 2: ORIGEM E CANAL DO COMUNICADO (NOVO MODELO) */}
          <section className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
              <h3 className="text-[13px] font-black uppercase text-slate-800 tracking-widest">Origem e Canal do Comunicado</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* COLUNA 1: CATEGORIA */}
              <div className="space-y-2">
                <select 
                  required
                  className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  value={formData.origem_categoria}
                  onChange={e => setFormData({...formData, origem_categoria: e.target.value, origem: ''})}
                >
                  <option value="">SELECIONE CATEGORIA...</option>
                  {ORIGENS_HIERARQUICAS.map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                </select>
              </div>

              {/* COLUNA 2: INSTITUIÇÃO */}
              <div className="space-y-2">
                <select 
                  required
                  disabled={!formData.origem_categoria}
                  className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formData.origem}
                  onChange={e => setFormData({...formData, origem: e.target.value})}
                >
                  <option value="">SELECIONE INSTITUIÇÃO...</option>
                  {[...currentInstitutions].sort((a, b) => a.localeCompare(b)).map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              {/* COLUNA 3: CANAL */}
              <div className="space-y-2">
                <select 
                  required
                  className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  value={formData.canal_comunicado}
                  onChange={e => setFormData({...formData, canal_comunicado: e.target.value})}
                >
                  <option value="">SELECIONE CANAL...</option>
                  {CANAIS_COMUNICADO_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* CAMPO ADICIONAL: Nº OFÍCIO (MANTIDO PARA INTEGRIDADE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <input 
                type="text" 
                disabled={!!initialData && !isADM}
                className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm disabled:opacity-50"
                value={formData.tipo_documento}
                onChange={e => setFormData({...formData, tipo_documento: e.target.value.toUpperCase()})}
                placeholder="Nº OFÍCIO / DOCUMENTO (OPCIONAL)"
              />
              <select 
                className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                value={formData.notificacao}
                onChange={e => setFormData({...formData, notificacao: e.target.value})}
              >
                <option value="">NOTIFICAÇÃO (OPCIONAL)</option>
                {['LEANDRO', 'LUIZA', 'MILENA', 'MIRIAN', 'SANDRA', 'ROSILDA'].map((opt, i) => (
                  <option key={`${opt}-${i}`} value={opt}>{opt}</option>
                ))}
              </select>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Genitora {!formData.genitora_nao_informado && '*'}</label>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF da Genitora</label>
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
                  {BAIRROS.map(b => <option key={b} value={b}>{b}</option>)}
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
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative group">
                  {formData.criancas.length > 1 && !isReadOnly && (
                    <button type="button" onClick={() => removeChild(idx)} className="absolute top-4 right-4 p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold uppercase outline-none focus:border-blue-500 disabled:opacity-60" 
                        value={crianca.nome} 
                        onChange={e => handleChildChange(idx, 'nome', e.target.value.toUpperCase())} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Nascimento {!crianca.nao_informado && '*'}</label>
                      <input 
                        type="date" 
                        required={!crianca.nao_informado} 
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" 
                        value={crianca.data_nascimento} 
                        onChange={e => handleChildChange(idx, 'data_nascimento', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</label>
                      <input 
                        type="text" 
                        placeholder="000.000.000-00"
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:border-blue-500" 
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

                  {ageInfo && (
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
                {isADM && !isReferenceLocked && !initialData && (
                  <button 
                    type="button" 
                    onClick={() => setIsManualReference(!isManualReference)}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${isManualReference ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                  >
                    Ajuste Histórico
                  </button>
                )}
              </label>
              
              {isManualReference && isADM && !isReferenceLocked && !initialData ? (
                <select 
                  className="w-full p-4 bg-white border border-indigo-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-indigo-500 shadow-sm"
                  value={formData.conselheiro_referencia_id}
                  onChange={e => setFormData({...formData, conselheiro_referencia_id: e.target.value})}
                >
                  <option value="">Selecione o Conselheiro...</option>
                  {INITIAL_USERS.filter(u => u.perfil === 'CONSELHEIRO').map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
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
                <span className={`text-[9px] px-2 py-1 rounded-md uppercase ${(initialData && !formData.notificacao) ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'}`}>
                  {(initialData && !formData.notificacao) ? 'Distribuição Bloqueada' : (formData.notificacao ? 'Vínculo de Notificação' : 'Escala do Dia')}
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
          currentUser={currentUser} 
          onClose={() => setShowHistoryModal(false)} 
        />
      )}
    </div>
  );
};

export default DocumentRegistration;
