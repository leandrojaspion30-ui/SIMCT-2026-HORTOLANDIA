
import React, { useState, useMemo } from 'react';
import { Search, MapPin, Building2, Calendar, LayoutGrid, UserCheck, RefreshCw, Database, History } from 'lucide-react';
import { Documento, User, DocumentStatus } from '../types';
import { BAIRROS, INITIAL_USERS, STATUS_LABELS, ORIGENS_HIERARQUICAS, REDE_HORTOLANDIA } from '../constants';

interface AdvancedSearchProps {
  documents: Documento[];
  currentUser: User;
  onSelectDoc: (id: string) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ documents, onSelectDoc }) => {
  const initialFilters = {
    categoria: '',
    genitora_nome: '',
    crianca_nome: '',
    cpf: '',
    bairro: '',
    dataInicio: '',
    dataFim: '',
    status: '',
    conselheiro_ref_id: '',
    servico_rede: ''
  };

  const [filters, setFilters] = useState(initialFilters);

  const clearFilters = () => setFilters(initialFilters);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchCat = !filters.categoria || doc.origem?.includes(filters.categoria);
      const matchGenitora = !filters.genitora_nome || doc.genitora_nome.toUpperCase().includes(filters.genitora_nome.toUpperCase());
      const matchCrianca = !filters.crianca_nome || doc.crianca_nome.toUpperCase().includes(filters.crianca_nome.toUpperCase());
      const matchCpf = !filters.cpf || (doc.cpf_crianca?.includes(filters.cpf) || doc.cpf_genitora?.includes(filters.cpf));
      const matchBairro = !filters.bairro || doc.bairro === filters.bairro;
      const matchStatus = !filters.status || doc.status.includes(filters.status as DocumentStatus);
      const matchRef = !filters.conselheiro_ref_id || doc.conselheiro_referencia_id === filters.conselheiro_ref_id;
      const matchServico = !filters.servico_rede || doc.atribuicoes_136_detalhadas?.some(ad => ad.servicos?.some(s => s.area === filters.servico_rede));
      
      return matchCat && matchGenitora && matchCrianca && matchCpf && matchBairro && matchStatus && matchRef && matchServico;
    });
  }, [documents, filters]);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Database className="w-8 h-8 text-blue-600" />
              <h2 className="text-[20px] font-black uppercase tracking-tight">Motor de Busca SIMCT</h2>
           </div>
           <button onClick={clearFilters} className="text-[11px] font-black uppercase text-red-500 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Resetar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Nome da Criança</label>
              <input type="text" placeholder="BUSCAR CRIANÇA..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase" value={filters.crianca_nome} onChange={e => setFilters({...filters, crianca_nome: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Responsável (Mãe)</label>
              <input type="text" placeholder="NOME DA MÃE..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase" value={filters.genitora_nome} onChange={e => setFilters({...filters, genitora_nome: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">CPF (Criança ou Mãe)</label>
              <input type="text" placeholder="000.000.000-00" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold uppercase" value={filters.cpf} onChange={e => setFilters({...filters, cpf: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Bairro</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold" value={filters.bairro} onChange={e => setFilters({...filters, bairro: e.target.value})}>
                <option value="">TODOS OS BAIRROS</option>
                {BAIRROS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Status</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">TODOS</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Conselheiro de Referência</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold" value={filters.conselheiro_ref_id} onChange={e => setFilters({...filters, conselheiro_ref_id: e.target.value})}>
                <option value="">QUALQUER CONSELHEIRO</option>
                {INITIAL_USERS.filter(u => u.perfil === 'CONSELHEIRO').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Rede de Serviço</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold" value={filters.servico_rede} onChange={e => setFilters({...filters, servico_rede: e.target.value})}>
                <option value="">TODAS AS REDES</option>
                {Object.keys(REDE_HORTOLANDIA).map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">Resultados ({filteredDocs.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase">Protocolo</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase">Genitora</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase">Bairro</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-all cursor-pointer" onClick={() => onSelectDoc(doc.id)}>
                  <td className="px-8 py-6 text-[11px] font-mono font-bold text-blue-600">#{doc.id}</td>
                  <td className="px-8 py-6 font-black text-slate-800 text-[13px] uppercase">{doc.genitora_nome}</td>
                  <td className="px-8 py-6 text-[10px] text-slate-500 font-bold uppercase">{doc.bairro}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">{STATUS_LABELS[doc.status[doc.status.length - 1]]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDocs.length === 0 && (
          <div className="py-20 text-center text-slate-300 font-black uppercase text-[12px]">Nenhum registro localizado.</div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
