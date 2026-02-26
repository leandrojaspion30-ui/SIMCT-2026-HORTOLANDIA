
import { 
  Clock, 
  Search, 
  X,
  Layers,
  Timer,
  Trash2,
  Calendar,
  FileText,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Documento, MonitoringInfo, User as UserType, RequisicaoServico, LogType } from '../types';
import { REDE_HORTOLANDIA } from '../constants';

interface MonitoringDashboardProps {
  documents: Documento[];
  currentUser: UserType;
  effectiveUserId: string;
  onSelectDoc: (id: string) => void;
  onRemoveMonitoring: (id: string) => void;
  onUpdateMonitoring: (id: string, monitoring: MonitoringInfo) => void;
  onAddLog: (docId: string, acao: string, tipo?: LogType) => void;
  isReadOnly?: boolean;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ 
  documents, 
  currentUser, 
  onSelectDoc, 
  onUpdateMonitoring,
  onRemoveMonitoring,
  onAddLog,
  isReadOnly
}) => {
  const [filters, setFilters] = useState({ termo: '' });
  const [extendingReq, setExtendingReq] = useState<{ docId: string, req: RequisicaoServico } | null>(null);
  const [docToConfirmDelete, setDocToConfirmDelete] = useState<Documento | null>(null);
  const [extForm, setExtForm] = useState({ nova_data: '' });
  const [collapsedDocs, setCollapsedDocs] = useState<Set<string>>(new Set());
  const [showAddService, setShowAddService] = useState<string | null>(null);
  const [newService, setNewService] = useState({ area: '', servico: '', prazo: '05 DIAS', prazo_custom: '', servico_custom: '', observacao: '' });
  const [expiredItem, setExpiredItem] = useState<{ doc: Documento, req: RequisicaoServico } | null>(null);

  const filteredMonitoringDocs = useMemo(() => {
    return documents.filter(d => {
      if (!d.monitoramento || d.monitoramento.concluido || d.conselheiro_referencia_id !== currentUser.id) return false;
      
      const termo = filters.termo.toUpperCase();
      const matchTermo = !termo || 
                         d.crianca_nome.toUpperCase().includes(termo) || 
                         d.genitora_nome.toUpperCase().includes(termo);
      
      return matchTermo;
    });
  }, [documents, filters, currentUser]);

  const toggleVisibility = (docId: string) => {
    setCollapsedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const getStatusStyle = (prazo: string, hasItems: boolean = true) => {
    if (!hasItems) return { bg: 'bg-slate-100 text-slate-400 border-slate-200', text: 'AGUARDANDO REQUISIÇÃO' };
    if (!prazo) return { bg: 'bg-slate-50 text-slate-500 border-slate-200', text: 'SEM PRAZO' };
    
    const today = new Date(); today.setHours(0,0,0,0);
    const deadline = new Date(prazo); deadline.setHours(0,0,0,0);
    const diffMs = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { bg: 'bg-red-50 text-red-700 border-red-200', text: 'PRAZO VENCIDO' };
    if (diffDays <= 1) return { bg: 'bg-red-50 text-red-700 border-red-200', text: 'PRAZO VAI VENCER' };
    if (diffDays <= 5) return { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'PERTO DO PRAZO' };
    return { bg: 'bg-green-50 text-green-700 border-green-200', text: 'NO PRAZO' };
  };

  const handleExtendReqDeadline = () => {
    if (!extendingReq || !extForm.nova_data) return;
    const doc = documents.find(d => d.id === extendingReq.docId);
    if (!doc || !doc.monitoramento) return;

    const requisicoesAtualizadas = doc.monitoramento.requisicoes?.map(r => 
      r.id === extendingReq.req.id ? { ...r, dataFinal: extForm.nova_data } : r
    );

    onUpdateMonitoring(extendingReq.docId, {
      ...doc.monitoramento,
      requisicoes: requisicoesAtualizadas
    });

    onAddLog(extendingReq.docId, `MONITORAMENTO: Prazo da requisição [${extendingReq.req.servico}] alterado.`, 'MONITORAMENTO');

    setExtendingReq(null);
    setExtForm({ nova_data: '' });
  };

  const handleRemoveRequisicao = (docId: string, reqId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.monitoramento) return;

    const requisicoesAtualizadas = doc.monitoramento.requisicoes?.map(r => 
      r.id === reqId ? { ...r, excluidoDoMonitoramento: true } : r
    );

    onUpdateMonitoring(docId, {
      ...doc.monitoramento,
      requisicoes: requisicoesAtualizadas
    });

    onAddLog(docId, `MONITORAMENTO: Item de requisição removido.`, 'MONITORAMENTO');
  };

  const handleAddService = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !newService.area || !newService.servico) return;

    const today = new Date();
    let daysToAdd = 5;
    
    if (newService.prazo === 'CUSTOM') {
      daysToAdd = parseInt(newService.prazo_custom) || 0;
    } else {
      daysToAdd = parseInt(newService.prazo.split(' ')[0]) || 5;
    }

    const deadline = new Date(today);
    deadline.setDate(today.getDate() + daysToAdd);

    const newReq: RequisicaoServico = {
      id: `req-${Date.now()}`,
      area: newService.area,
      servico: newService.servico === 'OUTROS SERVIÇOS / FORA DA REDE' ? (newService.servico_custom || 'OUTRO SERVIÇO') : newService.servico,
      dataFinal: deadline.toISOString(),
      prazo: newService.prazo === 'CUSTOM' ? `${daysToAdd} DIAS` : newService.prazo,
      prazo_custom: newService.prazo === 'CUSTOM' ? newService.prazo_custom : undefined,
      observacao: newService.observacao,
      isForaDaRede: newService.servico === 'OUTROS SERVIÇOS / FORA DA REDE'
    };

    const currentMonitoring = doc.monitoramento || { concluido: false, prazoEsperado: deadline.toISOString(), requisicoes: [] };
    
    onUpdateMonitoring(docId, {
      ...currentMonitoring,
      requisicoes: [...(currentMonitoring.requisicoes || []), newReq]
    });

    onAddLog(docId, `MONITORAMENTO: Novo serviço [${newService.servico}] adicionado para acompanhamento.`, 'MONITORAMENTO');
    setShowAddService(null);
    setNewService({ area: '', servico: '', prazo: '05 DIAS', prazo_custom: '', servico_custom: '', observacao: '' });
  };

  // DIRETRIZ: Alerta de prazo vencido obrigatório
  React.useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    for (const doc of filteredMonitoringDocs) {
      const expired = doc.monitoramento?.requisicoes?.find(r => {
        if (r.excluidoDoMonitoramento || r.concluido) return false;
        const deadline = new Date(r.dataFinal);
        deadline.setHours(0,0,0,0);
        return deadline.getTime() < today.getTime();
      });

      if (expired) {
        setExpiredItem({ doc, req: expired });
        break; // Show one at a time
      }
    }
  }, [filteredMonitoringDocs]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
      <div className="bg-[#111827] p-10 rounded-2xl shadow-lg flex items-center gap-6">
        <div className="p-4 bg-[#2563EB] rounded-xl"><Clock className="w-8 h-8 text-white" /></div>
        <div>
          <h2 className="text-[20px] font-bold text-white uppercase tracking-tight">Monitoramento Clássico</h2>
          <p className="text-[13px] text-[#9CA3AF] font-medium uppercase tracking-widest mt-1">Acompanhamento de Requisições Ativas</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563] w-5 h-5" />
          <input 
            type="text" 
            placeholder="LOCALIZAR NO MONITORAMENTO..." 
            className="w-full pl-12 pr-6 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none font-bold text-[13px] uppercase tracking-wider focus:border-[#2563EB]"
            value={filters.termo}
            onChange={e => setFilters({ termo: e.target.value })}
          />
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-[#F9FAFB] flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-[15px] font-bold text-[#111827] uppercase tracking-widest">Controle de Prazos</h2>
           </div>
           <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">{filteredMonitoringDocs.length} Atendimentos</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Prontuário</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Requisições</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredMonitoringDocs.map(doc => {
                const monitoring = doc.monitoramento!;
                const activeRequisicoes = (monitoring.requisicoes || []).filter(r => !r.excluidoDoMonitoramento);
                const isHidden = collapsedDocs.has(doc.id);
                
                // Encontrar o prazo mais próximo entre as requisições ativas para definir o status global
                const closestDeadline = activeRequisicoes.length > 0 
                  ? activeRequisicoes.reduce((min, r) => r.dataFinal < min ? r.dataFinal : min, activeRequisicoes[0].dataFinal)
                  : monitoring.prazoEsperado;

                const style = getStatusStyle(closestDeadline, activeRequisicoes.length > 0);

                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border w-fit ${style.bg}`}>
                        {style.text}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[14px] font-bold text-[#111827] uppercase leading-tight">{doc.crianca_nome}</div>
                      <div className="text-[11px] text-[#4B5563] font-medium uppercase mt-1">Ref: {doc.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-4">
                        <button onClick={() => toggleVisibility(doc.id)} className="flex items-center gap-2 text-[10px] font-black text-[#2563EB] uppercase hover:underline w-fit">
                          {isHidden ? <><Eye className="w-3.5 h-3.5" /> Ver Detalhes</> : <><EyeOff className="w-3.5 h-3.5" /> Ocultar</>}
                        </button>
                        {!isHidden && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            {activeRequisicoes.map((req) => {
                              const reqStyle = getStatusStyle(req.dataFinal);
                              return (
                                <div key={req.id} className={`p-3 rounded-xl border flex flex-col gap-1 ${reqStyle.bg}`}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="text-[9px] font-black uppercase opacity-60">{req.area}</div>
                                      <div className="text-[11px] font-bold uppercase">{req.servico}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => { setExtendingReq({ docId: doc.id, req }); setExtForm({ nova_data: req.dataFinal }); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><Timer className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleRemoveRequisicao(doc.id, req.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-black uppercase flex items-center gap-1 mt-1 border-t border-black/5 pt-1">
                                      <Calendar className="w-2.5 h-2.5" /> Prazo: {new Date(req.dataFinal).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setShowAddService(doc.id)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"
                        >
                          <Plus className="w-4 h-4" /> Add Serviço
                        </button>
                        <button onClick={() => onSelectDoc(doc.id)} className="p-2.5 bg-[#111827] text-white rounded-lg hover:bg-[#2563EB] transition-all shadow-sm"><FileText className="w-4 h-4" /></button>
                        {!isReadOnly && <button onClick={() => setDocToConfirmDelete(doc)} className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"><CheckCircle2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {docToConfirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60 animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 border border-[#E5E7EB] animate-in zoom-in-95">
              <div className="text-center space-y-6">
                 <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
                 <h3 className="text-[20px] font-bold text-[#111827] uppercase">Encerrar Monitoramento?</h3>
                 <p className="text-[12px] text-[#4B5563] font-medium uppercase">Confirmar a saída deste caso do painel ativo?</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setDocToConfirmDelete(null)} className="py-4 bg-slate-100 text-[#4B5563] rounded-2xl font-black uppercase text-[11px]">Cancelar</button>
                    <button onClick={() => { if(docToConfirmDelete) onRemoveMonitoring(docToConfirmDelete.id); setDocToConfirmDelete(null); }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px]">Confirmar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {extendingReq && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 border border-[#E5E7EB] animate-in zoom-in-95 space-y-8 relative">
            <button onClick={() => setExtendingReq(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            <h3 className="text-[20px] font-bold text-[#111827] uppercase">Alterar Prazo</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#4B5563] uppercase">Nova Data Limite</label>
                  <input type="date" className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold" value={extForm.nova_data} onChange={e => setExtForm({ nova_data: e.target.value })} />
               </div>
            </div>
            <button onClick={handleExtendReqDeadline} className="w-full py-5 bg-[#111827] text-white rounded-2xl font-black uppercase text-[13px] hover:bg-[#2563EB] transition-all">Salvar Alteração</button>
          </div>
        </div>
      )}

      {showAddService && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 border border-[#E5E7EB] animate-in zoom-in-95 space-y-8 relative">
            <button onClick={() => setShowAddService(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            <h3 className="text-[20px] font-bold text-[#111827] uppercase">Adicionar Novo Serviço</h3>
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#4B5563] uppercase">Área / Serviço</label>
                    <select 
                      className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                      onChange={(e) => {
                        const [area, servico] = e.target.value.split('|');
                        setNewService(prev => ({ ...prev, area, servico }));
                      }}
                    >
                      <option value="">SELECIONAR...</option>
                      <optgroup label="OUTROS">
                        <option value="OUTROS|OUTROS SERVIÇOS / FORA DA REDE">OUTROS SERVIÇOS / FORA DA REDE</option>
                      </optgroup>
                      {Object.entries(REDE_HORTOLANDIA).map(([area, servicos]) => (
                        <optgroup key={area} label={area}>
                          {servicos.map(s => <option key={s} value={`${area}|${s}`}>{s}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  {newService.servico === 'OUTROS SERVIÇOS / FORA DA REDE' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-[#4B5563] uppercase">Nome do Serviço / Destinatário</label>
                      <input 
                        type="text"
                        placeholder="ESPECIFIQUE O SERVIÇO..."
                        className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                        value={newService.servico_custom || ''}
                        onChange={(e) => setNewService(prev => ({ ...prev, servico_custom: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#4B5563] uppercase">Prazo</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                        value={newService.prazo}
                        onChange={(e) => setNewService(prev => ({ ...prev, prazo: e.target.value }))}
                      >
                        <option value="24H">24 HORAS (URGENTE)</option>
                        <option value="48H">48 HORAS</option>
                        <option value="05 DIAS">05 DIAS</option>
                        <option value="10 DIAS">10 DIAS</option>
                        <option value="15 DIAS">15 DIAS</option>
                        <option value="CUSTOM">PERSONALIZAR...</option>
                      </select>
                      {newService.prazo === 'CUSTOM' && (
                        <input 
                          type="number"
                          placeholder="DIAS"
                          className="w-24 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                          value={newService.prazo_custom}
                          onChange={(e) => setNewService(prev => ({ ...prev, prazo_custom: e.target.value }))}
                        />
                      )}
                    </div>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#4B5563] uppercase">Observações Técnicas</label>
                  <textarea 
                    className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase min-h-[100px]"
                    placeholder="DETALHAMENTO DA REQUISIÇÃO..."
                    value={newService.observacao}
                    onChange={(e) => setNewService(prev => ({ ...prev, observacao: e.target.value }))}
                  />
               </div>
            </div>
            <button onClick={() => handleAddService(showAddService)} className="w-full py-5 bg-[#111827] text-white rounded-2xl font-black uppercase text-[13px] hover:bg-[#2563EB] transition-all">Adicionar ao Monitoramento</button>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA DE PRAZO VENCIDO OBRIGATÓRIO */}
      {expiredItem && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-xl bg-red-900/40 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-12 border-4 border-red-600 animate-in zoom-in-95 space-y-8 text-center">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-[24px] font-black text-red-600 uppercase tracking-tighter">Prazo de Monitoramento Vencido!</h3>
              <p className="text-[14px] text-slate-600 font-bold uppercase leading-relaxed">
                O serviço <span className="text-red-600">[{expiredItem.req.servico}]</span> para a criança <span className="text-red-600">[{expiredItem.doc.crianca_nome}]</span> expirou em {new Date(expiredItem.req.dataFinal).toLocaleDateString('pt-BR')}.
              </p>
              <p className="text-[12px] text-slate-400 font-bold uppercase">
                Você deve prorrogar o prazo ou encerrar o monitoramento desta família para prosseguir.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => { setExtendingReq({ docId: expiredItem.doc.id, req: expiredItem.req }); setExtForm({ nova_data: expiredItem.req.dataFinal }); setExpiredItem(null); }}
                className="py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Timer className="w-5 h-5" /> Prorrogar Prazo
              </button>
              <button 
                onClick={() => { onRemoveMonitoring(expiredItem.doc.id); setExpiredItem(null); }}
                className="py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Encerrar Monitoramento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
