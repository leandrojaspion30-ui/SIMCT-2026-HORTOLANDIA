
import React, { useMemo, useState } from 'react';
import { Documento, AgendaEntry, User } from '../types';
import { INITIAL_USERS, STATUS_LABELS } from '../constants';
import { BarChart3, PieChart, TrendingUp, Users, FileText, ShieldAlert, Sparkles, UserCheck, Bell, PhoneCall, Activity, Download, Printer, X, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import AIStatisticsAnalyzer from './AIStatisticsAnalyzer';

interface StatisticsViewProps {
  documents: Documento[];
  agenda: AgendaEntry[];
  users: User[];
  currentUser: User;
  isGlobal?: boolean;
}

interface DataListItem {
  name: string;
  value: number;
}

const DataListTable: React.FC<{ data: DataListItem[]; total?: number; label?: string }> = ({ data, total, label = "Categoria" }) => {
  const sum = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);
  const divisor = total || sum || 1;

  return (
    <div className="text-[11px] font-bold uppercase text-slate-600 space-y-1.5 flex flex-col h-full print:h-auto print:w-full">
      <div className="flex items-center justify-between text-[9px] font-black text-slate-400 tracking-wider pb-1.5 border-b border-slate-100 uppercase">
        <span>{label}</span>
        <div className="flex gap-4">
          <span className="w-12 text-right">QTD</span>
          <span className="w-12 text-right">%</span>
        </div>
      </div>
      <div className="overflow-y-auto pr-1 flex-1 max-h-60 scrollbar-thin divide-y divide-slate-100/60 print:max-h-none print:overflow-visible print:h-auto">
        {data.map((item, idx) => {
          const pct = ((item.value / divisor) * 100).toFixed(1);
          const displayName = item.name ? (STATUS_LABELS[item.name as any] || item.name) : 'NÃO INFORMADO';
          return (
            <div key={idx} className="flex items-center justify-between py-2 text-[10px] hover:bg-slate-50 rounded px-1 group transition-colors print:break-inside-avoid print:py-1.5">
              <span className="truncate print:whitespace-normal print:overflow-visible pr-2 text-slate-700 font-bold group-hover:text-slate-900 print:text-[10px] print:font-extrabold" title={displayName}>
                {displayName}
              </span>
              <div className="flex gap-4 shrink-0 font-mono font-black text-slate-950">
                <span className="w-12 text-right">{item.value}</span>
                <span className="w-12 text-right text-slate-400">{pct}%</span>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-6 text-[9px] font-black text-slate-300">NENHUM DADO DISPONÍVEL</div>
        )}
      </div>
    </div>
  );
};

const StatisticsView: React.FC<StatisticsViewProps> = ({ documents, agenda, users, currentUser, isGlobal }) => {
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const [selectedUnidadeFilter, setSelectedUnidadeFilter] = useState<'all' | 1 | 2>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredDocuments = useMemo(() => {
    let docs = documents;
    if (isGlobal && selectedUnidadeFilter !== 'all') {
      docs = docs.filter(d => (d.unidade_id || 1) === selectedUnidadeFilter);
    }
    if (startDate) {
      docs = docs.filter(d => {
        const docDate = d.data_aporte || d.data_recebimento || d.criado_em?.split('T')[0];
        return docDate && docDate >= startDate;
      });
    }
    if (endDate) {
      docs = docs.filter(d => {
        const docDate = d.data_aporte || d.data_recebimento || d.criado_em?.split('T')[0];
        return docDate && docDate <= endDate;
      });
    }
    return docs;
  }, [documents, isGlobal, selectedUnidadeFilter, startDate, endDate]);

  const filteredAgenda = useMemo(() => {
    let ags = agenda;
    if (isGlobal && selectedUnidadeFilter !== 'all') {
      ags = ags.filter(a => (a.unidade_id || 1) === selectedUnidadeFilter);
    }
    if (startDate) {
      ags = ags.filter(a => a.data && a.data >= startDate);
    }
    if (endDate) {
      ags = ags.filter(a => a.data && a.data <= endDate);
    }
    return ags;
  }, [agenda, isGlobal, selectedUnidadeFilter, startDate, endDate]);

  const aiStats = useMemo(() => {
    const stats = {
      totalCriancas: filteredDocuments.reduce((acc, d) => acc + (d.criancas?.length || 0), 0),
      direitos: {} as Record<string, number>,
      bairros: {} as Record<string, number>,
      agentes: {} as Record<string, number>,
      origens: {} as Record<string, number>,
      canaisComunicado: {} as Record<string, number>,
      atribuicoesECA: {} as Record<string, number>,
      requisicoes136III: 0,
      servicos136III: {} as Record<string, number>,
      violencias: {} as Record<string, number>,
      medidas101: {} as Record<string, number>,
      medidas129: {} as Record<string, number>,
      medidasAplicadas: {} as Record<string, number>,
      status: {} as Record<string, number>,
      faixasEtarias: {
        'PRIMEIRA INFÂNCIA (0-6)': 0,
        'CRIANÇA (7-12)': 0,
        'ADOLESCENTE (13-18)': 0
      },
      acoesPorConselheiro: {} as Record<string, number>
    };

    filteredDocuments.forEach(doc => {
      stats.bairros[doc.bairro] = (stats.bairros[doc.bairro] || 0) + 1;
      stats.origens[doc.origem] = (stats.origens[doc.origem] || 0) + 1;
      stats.canaisComunicado[doc.canal_comunicado] = (stats.canaisComunicado[doc.canal_comunicado] || 0) + 1;
      
      const currentStatus = doc.status[doc.status.length - 1];
      stats.status[currentStatus] = (stats.status[currentStatus] || 0) + 1;

      doc.violacoesSipia?.forEach(v => {
        stats.direitos[v.especifico] = (stats.direitos[v.especifico] || 0) + 1;
      });

      doc.agentesVioladores?.forEach(a => {
        stats.agentes[a.principal] = (stats.agentes[a.principal] || 0) + 1;
      });

      doc.atribuicoes_136?.forEach(a => {
        stats.atribuicoesECA[a] = (stats.atribuicoesECA[a] || 0) + 1;
      });

      doc.atribuicoes_136_detalhadas?.forEach(ad => {
        if (ad.inciso?.startsWith('III')) {
          stats.requisicoes136III += (ad.servicos?.length || 0);
          ad.servicos?.forEach(s => {
            const servicoNome = s.servico === 'OUTROS SERVIÇOS / FORA DA REDE' ? (s.servico_custom || 'OUTRO SERVIÇO') : s.servico;
            stats.servicos136III[servicoNome] = (stats.servicos136III[servicoNome] || 0) + 1;
          });
        }
      });

      doc.violencias?.forEach(v => {
        stats.violencias[v] = (stats.violencias[v] || 0) + 1;
      });

      doc.medidas_detalhadas?.forEach(m => {
        if (m.artigo_inciso?.includes('101')) {
          stats.medidas101[m.texto] = (stats.medidas101[m.texto] || 0) + 1;
        } else if (m.artigo_inciso?.includes('129')) {
          stats.medidas129[m.texto] = (stats.medidas129[m.texto] || 0) + 1;
        }
        stats.medidasAplicadas[m.texto] = (stats.medidasAplicadas[m.texto] || 0) + 1;
      });

      const ref = users.find(u => u.id === doc.conselheiro_referencia_id);
      if (ref) {
        stats.acoesPorConselheiro[ref.nome] = (stats.acoesPorConselheiro[ref.nome] || 0) + (doc.atribuicoes_136?.length || 0);
      }

      doc.criancas?.forEach(c => {
        if (!c.data_nascimento) return;
        const birth = new Date(c.data_nascimento);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

        if (age <= 6) stats.faixasEtarias['PRIMEIRA INFÂNCIA (0-6)']++;
        else if (age <= 12) stats.faixasEtarias['CRIANÇA (7-12)']++;
        else if (age <= 18) stats.faixasEtarias['ADOLESCENTE (13-18)']++;
      });
    });

    return stats;
  }, [filteredDocuments]);

  const bairroData = useMemo(() => 
    Object.entries(aiStats.bairros).map(([name, value]) => ({ name, value }))
  , [aiStats]);

  const statusData = useMemo(() => 
    Object.entries(aiStats.status).map(([name, value]) => ({ name, value }))
  , [aiStats]);

  const ageGroupData = useMemo(() => 
    Object.entries(aiStats.faixasEtarias).map(([name, value]) => ({ name, value }))
  , [aiStats]);

  const measuresData = useMemo(() => 
    Object.entries(aiStats.medidasAplicadas)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  , [aiStats]);

  const measures101Data = useMemo(() => 
    Object.entries(aiStats.medidas101)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  , [aiStats]);

  const measures129Data = useMemo(() => 
    Object.entries(aiStats.medidas129)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  , [aiStats]);

  const channelsData = useMemo(() => 
    Object.entries(aiStats.canaisComunicado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  , [aiStats]);

  const originsData = useMemo(() => 
    Object.entries(aiStats.origens)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  , [aiStats]);

  const attributionsData = useMemo(() => 
    Object.entries(aiStats.atribuicoesECA)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  , [aiStats]);

  const servicos136IIIData = useMemo(() => 
    Object.entries(aiStats.servicos136III)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  , [aiStats]);

  const totalAttributions = useMemo(() => 
    filteredDocuments.reduce((acc, doc) => acc + (doc.atribuicoes_136?.length || 0), 0)
  , [filteredDocuments]);

  const counselorPerformance = useMemo(() => {
    return users
      .filter(u => u.status !== 'EXCLUIDO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && (isGlobal ? true : (u.unidade_id || 1) === (currentUser.unidade_id || 1)))
      .map(u => {
        const myDocs = filteredDocuments.filter(d => d.conselheiro_referencia_id === u.id);
        const myAgenda = filteredAgenda.filter(a => a.conselheiro_id === u.id);
        
        return {
          id: u.id,
          nome: u.nome,
          unidade: u.unidade_id,
          docs: myDocs.length,
          disque100: myDocs.filter(d => d.origem.includes('DISQUE 100')).length,
          monitoring: myDocs.filter(d => d.status.includes('MONITORAMENTO')).length,
          notifications: myAgenda.filter(a => a.tipo.startsWith('NOTIFICACAO')).length,
          attendances: myAgenda.filter(a => a.status === 'COMPARECEU').length
        };
      })
      .sort((a, b) => b.docs - a.docs);
  }, [filteredDocuments, filteredAgenda]);

  const handleExportCSV = () => {
    const headers = ["Conselheiro", "Unidade", "Documentos", "Disque 100", "Notificações", "Atendimentos", "Monitoramentos"];
    const rows = counselorPerformance.map(p => [
      p.nome,
      `CT ${p.unidade}`,
      p.docs,
      p.disque100,
      p.notifications,
      p.attendances,
      p.monitoring
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(val => `"${val}"`).join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `estatisticas_conselheiros_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isInIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  return (
    <div className="space-y-8 pb-20 print:p-0 print:space-y-4">
      {isInIframe && (
        <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-6 flex items-start gap-4 shadow-sm print:hidden">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shrink-0 flex items-center justify-center">
            <span className="text-lg">💡</span>
          </div>
          <div className="text-amber-800 text-[11px] font-semibold leading-relaxed uppercase space-y-1">
            <p className="font-black text-amber-950 text-[12px]">Dica Importante para Impressão</p>
            <p>Como o sistema está sendo visualizado dentro de um painel de testes (iframe), a impressão direta pode ser desconfigurada ou bloqueada pelo navegador.</p>
            <p>Para gerar o PDF ou imprimir com qualidade perfeita, clique no ícone de <strong className="font-black text-amber-950">"Abrir em nova aba"</strong> (o botão com uma seta saindo de um quadrado no canto superior direito da tela do AI Studio) e depois use o botão "Imprimir PDF" nesta página!</p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-violet-50 rounded-3xl text-violet-600">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight">Relatórios Estatísticos</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Análise quantitativa da rede de proteção</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-[#111827] rounded-2xl text-[11px] font-black uppercase text-white hover:bg-blue-600 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4" /> Imprimir PDF
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-100 p-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm flex flex-col lg:flex-row gap-6 items-end justify-between print:hidden">
        {isGlobal ? (
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filtrar por Unidade</label>
            <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedUnidadeFilter('all')}
                className={`flex-1 min-w-[120px] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                  selectedUnidadeFilter === 'all'
                    ? 'bg-[#111827] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Ambas as Unidades</span>
              </button>
              <button
                onClick={() => setSelectedUnidadeFilter(1)}
                className={`flex-1 min-w-[120px] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                  selectedUnidadeFilter === 1
                    ? 'bg-[#111827] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>Unidade I (Sede)</span>
              </button>
              <button
                onClick={() => setSelectedUnidadeFilter(2)}
                className={`flex-1 min-w-[120px] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                  selectedUnidadeFilter === 2
                    ? 'bg-[#111827] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span>Unidade II (Sub-Sede)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden lg:block">
            {/* Espaço para alinhamento quando não for global */}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
          <div className="space-y-2 w-full sm:w-auto">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Data Inicial</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-48 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2 w-full sm:w-auto">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Data Final</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-48 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-5 py-3.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 w-full sm:w-auto h-[46px] shrink-0"
              title="Limpar filtros de data"
            >
              <X className="w-4 h-4" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:grid-cols-2 print:gap-4">
        <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Total de Casos</span>
          </div>
          <p className="text-3xl sm:text-[42px] font-black text-slate-900 leading-none">{filteredDocuments.length}</p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Em Monitoramento</span>
          </div>
          <p className="text-3xl sm:text-[42px] font-black text-slate-900 leading-none">
            {filteredDocuments.filter(d => d.status.includes('MONITORAMENTO')).length}
          </p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Aguardando Validação</span>
          </div>
          <p className="text-3xl sm:text-[42px] font-black text-slate-900 leading-none">
            {filteredDocuments.filter(d => d.status.includes('AGUARDANDO_VALIDACAO')).length}
          </p>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Ações Art. 136 III</span>
          </div>
          <p className="text-3xl sm:text-[42px] font-black text-slate-900 leading-none">{aiStats.requisicoes136III}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 print:grid-cols-1 print:gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] sm:text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">Distribuição por Bairro</h3>
            <div className="h-64 sm:h-80 print:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bairroData} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 7, fontWeight: 800, fill: '#64748B'}} 
                    width={110} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '9px', fontWeight: '900'}}
                  />
                  <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={bairroData} total={filteredDocuments.length} label="Bairro" />
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] sm:text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6 md:text-left">Situação dos Procedimentos</h3>
            <div className="h-64 sm:h-80 print:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '9px', fontWeight: '900'}}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={statusData} total={filteredDocuments.length} label="Status" />
          </div>
        </div>
      </div>

      {/* NOVA SEÇÃO: FAIXA ETÁRIA E ATRIBUIÇÕES DO CONSELHO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1 print:gap-8">
        {/* Gráfico de Faixa Etária */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">Distribuição por Faixa Etária</h3>
            <div className="h-64 sm:h-80 print:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={ageGroupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#2563EB', '#10B981', '#F59E0B'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
               {ageGroupData.map((g, i) => (
                 <div key={i} className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: ['#2563EB', '#10B981', '#F59E0B'][i % 3]}}></div>
                   <span className="text-[8px] font-black text-slate-500 uppercase">{g.name}</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={ageGroupData} total={aiStats.totalCriancas} label="Faixa Etária" />
          </div>
        </div>

        {/* Gráfico de Atribuições Art. 136 */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Ações do Conselho (Art. 136 ECA)</h3>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attributionsData} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={90}
                    tick={{fontSize: 7, fontWeight: 800, fill: '#64748b'}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={attributionsData} total={totalAttributions} label="Ação" />
          </div>
        </div>
      </div>
      
      {/* NOVA SEÇÃO: DETALHAMENTO DAS MEDIDAS APLICADAS (SEPARADAS POR ARTIGO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1 print:gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Medidas Art. 101 (Criança/Adolescente)</h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">Proteção</span>
            </div>
            <div className="h-64 sm:h-80 print:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={measures101Data} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={110}
                    tick={{fontSize: 7, fontWeight: 800, fill: '#64748b'}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                  />
                  <Bar dataKey="value" fill="#2563EB" radius={[0, 8, 8, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={measures101Data} label="Medida" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Medidas Art. 129 (Pais/Responsáveis)</h3>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase">Orientação</span>
            </div>
            <div className="h-64 sm:h-80 print:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={measures129Data} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={110}
                    tick={{fontSize: 7, fontWeight: 800, fill: '#64748b'}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                  />
                  <Bar dataKey="value" fill="#F59E0B" radius={[0, 8, 8, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={measures129Data} label="Medida" />
          </div>
        </div>
      </div>
      
      {/* SEÇÃO ORIGINAL: FREQUÊNCIA GERAL DE MEDIDAS */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Detalhamento das Medidas Aplicadas</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Frequência de Ações</span>
          </div>
          <div className="h-64 sm:h-80 print:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={measuresData} layout="vertical" margin={{ left: 5, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={110}
                  tick={{fontSize: 7, fontWeight: 800, fill: '#64748b'}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                />
                <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
          <DataListTable data={measuresData} label="Medida" />
        </div>
      </div>

      {/* NOVA SEÇÃO: DETALHAMENTO DOS SERVIÇOS REQUISITADOS (ART. 136 III) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Serviços Requisitados (Art. 136 III)</h3>
            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase">Detalhamento por Serviço</span>
          </div>
          <div className="h-64 sm:h-80 print:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicos136IIIData} layout="vertical" margin={{ left: 5, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={110}
                  tick={{fontSize: 7, fontWeight: 800, fill: '#64748b'}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
          <DataListTable data={servicos136IIIData} label="Serviço" />
        </div>
      </div>

      {/* NOVA SEÇÃO: ORIGEM E CANAIS DE COMUNICAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1 print:gap-8">
        {/* Gráfico de Origem */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">Identificação da Origem</h3>
            <div className="h-64 sm:h-80 print:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={originsData} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={90}
                    tick={{fontSize: 7, fontWeight: 800, fill: '#64748b'}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 8, 8, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={originsData} label="Origem" />
          </div>
        </div>

        {/* Gráfico de Canais de Comunicação */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm print:break-inside-auto print:flex-col print:gap-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">Canais de Comunicado</h3>
            <div className="h-64 sm:h-80 print:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={channelsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col print:w-full print:border-t print:border-l-0 print:pt-6 print:pl-0">
            <DataListTable data={channelsData} label="Canal" />
          </div>
        </div>
      </div>

      {isGlobal && <AIStatisticsAnalyzer stats={aiStats} totalDocs={filteredDocuments.length} />}

      {/* NOVA SEÇÃO: DESEMPENHO DOS CONSELHEIROS */}
      <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm print:break-inside-avoid">
        <div className="flex items-center gap-4 mb-6 sm:mb-10">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-[18px] font-black text-slate-900 uppercase tracking-tight">Desempenho dos Conselheiros</h3>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Produtividade Individual por Categoria</p>
          </div>
        </div>

        {/* LAYOUT PARA MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 md:hidden px-2 print:hidden">
          {counselorPerformance.map(perf => (
            <div key={perf.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 text-xs border border-slate-100 shadow-sm shrink-0">
                    {perf.nome.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-slate-800 uppercase leading-none">{perf.nome}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">CT {perf.unidade}</span>
                  </div>
                </div>
                <div className="bg-white px-3 py-1 rounded-lg border border-slate-100">
                  <span className="text-[12px] font-black text-slate-800">{perf.docs} <span className="text-[9px] text-slate-400">DOCS</span></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-700 leading-none">{perf.disque100}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">D100</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-700 leading-none">{perf.notifications}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Notif</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-700 leading-none">{perf.attendances}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Atend</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-700 leading-none">{perf.monitoring}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Moni</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LAYOUT PARA DESKTOP (TABELA) */}
        <div className="hidden md:block print:block overflow-x-auto -mx-6 sm:-mx-10 px-6 sm:px-10">
          <table className="w-full text-left border-separate border-spacing-y-3 min-w-[750px]">
            <thead>
              <tr className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-4 sm:px-6 py-4">Conselheiro</th>
                <th className="px-4 sm:px-6 py-4 text-center">Unidade</th>
                <th className="px-4 sm:px-6 py-4 text-center">Documentos</th>
                <th className="px-4 sm:px-6 py-4 text-center">Disque 100</th>
                <th className="px-4 sm:px-6 py-4 text-center">Notificações</th>
                <th className="px-4 sm:px-6 py-4 text-center">Atendimentos</th>
                <th className="px-4 sm:px-6 py-4 text-center">Monitoramentos</th>
              </tr>
            </thead>
            <tbody>
              {counselorPerformance.map(perf => (
                <tr key={perf.id} className="group hover:bg-slate-50 transition-all">
                  <td className="px-4 sm:px-6 py-5 bg-slate-50 group-hover:bg-white rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 text-[10px] sm:text-xs border border-slate-100 shadow-sm shrink-0">
                        {perf.nome.substring(0, 2)}
                      </div>
                      <span className="text-[12px] sm:text-[13px] font-black text-slate-700 uppercase whitespace-nowrap">{perf.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <span className="px-2 sm:px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[9px] sm:text-[10px] font-black uppercase">CT {perf.unidade}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[14px] sm:text-[16px] font-black text-slate-800">{perf.docs}</span>
                      <div className="w-8 h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (perf.docs / (filteredDocuments.length || 1)) * 500)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                      <span className="text-[12px] sm:text-[14px] font-black text-slate-600">{perf.disque100}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                      <span className="text-[12px] sm:text-[14px] font-black text-slate-600">{perf.notifications}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                      <span className="text-[12px] sm:text-[14px] font-black text-slate-600">{perf.attendances}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 bg-slate-50 group-hover:bg-white rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" />
                      <span className="text-[12px] sm:text-[14px] font-black text-slate-600">{perf.monitoring}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
