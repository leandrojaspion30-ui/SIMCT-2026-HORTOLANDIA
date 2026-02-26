
import React, { useState } from 'react';
import { History, Search, User, FileText, Calendar, ShieldCheck, Database, Settings, Activity, Filter, Lock } from 'lucide-react';
import { Log, LogType } from '../types';

interface AuditLogViewerProps {
  logs: Log[];
}

const getLogTypeStyle = (tipo: LogType | undefined) => {
  switch (tipo) {
    case 'SEGURANÇA': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <Lock className="w-3.5 h-3.5" />, label: 'Segurança' };
    case 'DOCUMENTO': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Database className="w-3.5 h-3.5" />, label: 'Documento' };
    case 'VALIDAÇÃO': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Validação' };
    case 'MONITORAMENTO': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: <Activity className="w-3.5 h-3.5" />, label: 'Monitoramento' };
    case 'SISTEMA': return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: <Settings className="w-3.5 h-3.5" />, label: 'Sistema' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: <History className="w-3.5 h-3.5" />, label: 'Geral' };
  }
};

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');

  const filteredLogs = logs.filter(l => {
    const searchLower = filter.toLowerCase();
    const userName = (l.usuario_nome || '').toLowerCase();
    const action = (l.acao || '').toLowerCase();
    const docId = (l.documento_id || '').toLowerCase();
    
    const matchesSearch = userName.includes(searchLower) || action.includes(searchLower) || docId.includes(searchLower);
    const matchesType = typeFilter === 'TODOS' || l.tipo === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E7EB] flex flex-col lg:flex-row gap-6 items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 flex-1 w-full">
           <div className="relative w-full max-w-md">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4B5563] w-5 h-5" />
             <input 
               type="text" 
               placeholder="PESQUISAR POR USUÁRIO OU AÇÃO..." 
               className="w-full pl-14 pr-6 py-5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-black text-[13px] uppercase tracking-widest text-[#1F2937] focus:border-[#2563EB] transition-all"
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
             />
           </div>
           <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="TODOS">Todas as Categorias</option>
                <option value="SEGURANÇA">Segurança / Login</option>
                <option value="DOCUMENTO">Ações em Documentos</option>
                <option value="VALIDAÇÃO">Validação Técnica</option>
                <option value="MONITORAMENTO">Monitoramento Ativo</option>
                <option value="SISTEMA">Sistema e Configurações</option>
              </select>
           </div>
        </div>
        <div className="text-[12px] text-[#4B5563] font-black uppercase tracking-widest flex items-center gap-3 bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 shadow-inner">
           <History className="w-6 h-6 text-blue-600" /> {logs.length} Registros Imutáveis
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-[#E5E7EB] shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <div>
            <h2 className="font-black text-[#111827] uppercase tracking-tight text-[18px]">Trilha de Auditoria Jurídica SIMCT</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hortolândia - Segurança Institucional</p>
          </div>
          <div className="flex items-center gap-3 px-5 py-2 bg-red-50 border border-red-100 rounded-full animate-pulse">
             <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
             <span className="text-[10px] font-black uppercase text-red-700 tracking-tighter">LGPD: Dados com Retenção Imutável</span>
          </div>
        </div>
        <div className="p-0">
          <div className="divide-y divide-[#E5E7EB]">
            {filteredLogs.map((log) => {
              const style = getLogTypeStyle(log.tipo as any);
              return (
                <div key={log.id} className="p-10 hover:bg-[#F9FAFB] transition-all flex flex-col md:flex-row md:items-center gap-10 group">
                  <div className="shrink-0 flex flex-col items-center justify-center w-28 h-28 bg-slate-50 rounded-[2rem] border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-all shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 group-hover:bg-blue-200 transition-colors"></div>
                    <Calendar className="w-7 h-7 mb-2" />
                    <span className="text-[11px] font-black uppercase tracking-tighter">{new Date(log.data_hora).toLocaleDateString('pt-BR')}</span>
                    <span className="text-[10px] font-bold opacity-70">{new Date(log.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex-1 space-y-4 text-left">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${style.bg} ${style.text} ${style.border}`}>
                        {style.icon} {style.label}
                      </span>
                      <span className="flex items-center gap-2 text-[12px] font-black text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl uppercase shadow-sm">
                        <User className="w-4 h-4 text-blue-600" /> {log.usuario_nome}
                      </span>
                    </div>
                    <div className="text-[#1F2937] font-black text-[16px] uppercase tracking-tight leading-relaxed">
                      {log.acao}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] font-bold uppercase tracking-widest">
                      <FileText className="w-4 h-4" /> Protocolo: <span className="font-mono text-[#2563EB] font-black px-2 py-0.5 bg-blue-50 rounded-lg">#{log.documento_id}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-[10px] font-black text-slate-100 uppercase tracking-[0.6em] hidden xl:block select-none transform rotate-90 whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
                     SECURITY_TRACE_SIMCT
                  </div>
                </div>
              );
            })}
            
            {filteredLogs.length === 0 && (
              <div className="p-40 text-center text-[#9CA3AF] uppercase font-black text-[16px] tracking-[0.2em] bg-slate-50/50 flex flex-col items-center">
                <History className="w-20 h-20 mb-8 opacity-10" />
                Nenhum rastro de auditoria localizado para estes filtros.
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="text-center p-10 bg-slate-100 border border-slate-200 rounded-[3rem]">
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">O SIMCT mantém registros criptográficos imutáveis de todas as operações para fins de segurança jurídica e transparência municipal.</p>
      </footer>
    </div>
  );
};

export default AuditLogViewer;
