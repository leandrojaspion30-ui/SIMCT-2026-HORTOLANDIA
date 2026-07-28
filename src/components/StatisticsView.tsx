
import React, { useMemo, useState } from 'react';
import { Documento, AgendaEntry, User } from '../types';
import { INITIAL_USERS, STATUS_LABELS, AGENDA_TIPOS } from '../constants';
import { BarChart3, PieChart, TrendingUp, Users, FileText, ShieldAlert, Sparkles, UserCheck, Bell, PhoneCall, Activity, Download, Printer, X, Calendar, Filter, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { formatLocalDateString } from '../lib/dateUtils';
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

interface ProfessionalHorizontalChartProps {
  title: string;
  data: DataListItem[];
  total?: number;
  labelType?: 'percentage' | 'absolute' | 'both';
  footerNote?: string;
  barColor?: string;
}

const ProfessionalHorizontalChart: React.FC<ProfessionalHorizontalChartProps> = ({ 
  title, 
  data, 
  total, 
  labelType = 'both', 
  footerNote, 
  barColor = '#dc2626' 
}) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const totalSum = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);
  const divisor = total || totalSum || 1;

  return (
    <div className="w-full bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col rounded-[1.5rem] sm:rounded-[2rem] print:shadow-none print:border-slate-300 print:break-inside-avoid print:rounded-2xl">
      {/* Banner de cabeçalho azul escuro */}
      <div className="bg-[#1e3a8a] text-white py-3.5 px-6 text-center print:py-2.5 print:px-4">
        <h4 className="text-[11px] sm:text-[12px] font-black uppercase tracking-wider leading-snug print:text-[10px]">{title}</h4>
      </div>
      
      {/* Corpo do Gráfico */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-white print:p-4">
        <div className="space-y-4">
          {data.map((item, idx) => {
            const percentage = ((item.value / divisor) * 100);
            const percentageStr = percentage.toFixed(1).replace('.', ',');
            const barWidthPercent = Math.max((item.value / maxValue) * 100, 1.5); // Garante visibilidade mínima
            const displayName = item.name ? (STATUS_LABELS[item.name as any] || item.name) : 'NÃO INFORMADO';

            return (
              <div key={idx} className="flex items-center text-[11px] sm:text-[12px] print:text-[10px]">
                {/* Rótulo da esquerda (Alinhado à direita) */}
                <div className="w-[35%] sm:w-[30%] text-right pr-4 font-bold text-slate-700 leading-tight truncate print:whitespace-normal print:overflow-visible" title={displayName}>
                  {displayName}
                </div>
                
                {/* Linha vertical (Eixo Y) e a Barra */}
                <div className="flex-1 flex items-center border-l-2 border-slate-300 pl-3 h-8 relative">
                  <div 
                    className="h-5 rounded-r transition-all duration-500 ease-out hover:opacity-90 shadow-sm" 
                    style={{ 
                      width: `${barWidthPercent}%`,
                      backgroundColor: barColor
                    }}
                  />
                  {/* Valor impresso ao final da barra */}
                  <span className="ml-3 font-mono font-black text-slate-900 text-[10px] print:text-[9px] whitespace-nowrap">
                    {labelType === 'percentage' && `${percentageStr}%`}
                    {labelType === 'absolute' && item.value}
                    {labelType === 'both' && `${item.value} (${percentageStr}%)`}
                  </span>
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="text-center py-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Rodapé do gráfico */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-wider print:mt-4 print:pt-3">
          <span>{footerNote || `Total: ${totalSum} registros`}</span>
          <span className="font-mono">SIMCT HORTOLÂNDIA</span>
        </div>
      </div>
    </div>
  );
};

const StatisticsView: React.FC<StatisticsViewProps> = ({ documents, agenda, users, currentUser, isGlobal }) => {
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const [selectedUnidadeFilter, setSelectedUnidadeFilter] = useState<'all' | 1 | 2>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrigemForDireitos, setSelectedOrigemForDireitos] = useState<string>('all');

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
      direitosFundamentais: {} as Record<string, number>,
      direitosPorOrigem: {} as Record<string, {
        totalCasos: number;
        totalViolacoes: number;
        violacoes: Record<string, number>;
        fundamentais: Record<string, number>;
      }>,
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
      acoesPorConselheiro: {} as Record<string, number>,
      locaisOcorrencia: {} as Record<string, number>,
      agendaPorCategoria: {} as Record<string, number>,
      agendaPorTipo: {} as Record<string, number>
    };

    filteredAgenda.forEach(item => {
      // Se excluído, só conta para estatística se tiver sido confirmado (Compareceu)
      if (item.excluido && item.status !== 'COMPARECEU') return;

      stats.agendaPorTipo[item.tipo] = (stats.agendaPorTipo[item.tipo] || 0) + 1;
      
      // Categorização baseada no AGENDA_TIPOS
      const category = AGENDA_TIPOS.find(cat => cat.options.includes(item.tipo))?.category || 'OUTROS';
      stats.agendaPorCategoria[category] = (stats.agendaPorCategoria[category] || 0) + 1;
    });

    filteredDocuments.forEach(doc => {
      stats.bairros[doc.bairro] = (stats.bairros[doc.bairro] || 0) + 1;
      const orig = (doc.origem || 'NÃO INFORMADO').trim();
      stats.origens[orig] = (stats.origens[orig] || 0) + 1;
      stats.canaisComunicado[doc.canal_comunicado] = (stats.canaisComunicado[doc.canal_comunicado] || 0) + 1;
      
      if (doc.local_ocorrencia) {
        stats.locaisOcorrencia[doc.local_ocorrencia] = (stats.locaisOcorrencia[doc.local_ocorrencia] || 0) + 1;
      }
      
      const currentStatus = doc.status[doc.status.length - 1];
      stats.status[currentStatus] = (stats.status[currentStatus] || 0) + 1;

      if (!stats.direitosPorOrigem[orig]) {
        stats.direitosPorOrigem[orig] = {
          totalCasos: 0,
          totalViolacoes: 0,
          violacoes: {},
          fundamentais: {}
        };
      }
      stats.direitosPorOrigem[orig].totalCasos += 1;

      let docHasViolations = false;
      doc.violacoesSipia?.forEach(v => {
        docHasViolations = true;
        const especifico = v.especifico ? v.especifico.trim() : 'VIOLAÇÃO NÃO ESPECIFICADA';
        const fundamental = v.fundamental ? v.fundamental.trim() : 'DIREITO NÃO ESPECIFICADO';

        stats.direitos[especifico] = (stats.direitos[especifico] || 0) + 1;
        stats.direitosFundamentais[fundamental] = (stats.direitosFundamentais[fundamental] || 0) + 1;

        stats.direitosPorOrigem[orig].totalViolacoes += 1;
        stats.direitosPorOrigem[orig].violacoes[especifico] = (stats.direitosPorOrigem[orig].violacoes[especifico] || 0) + 1;
        stats.direitosPorOrigem[orig].fundamentais[fundamental] = (stats.direitosPorOrigem[orig].fundamentais[fundamental] || 0) + 1;
      });

      if (!docHasViolations && doc.violencias && doc.violencias.length > 0) {
        doc.violencias.forEach(viol => {
          const nomeViol = `VIOLÊNCIA ${viol}`;
          stats.direitos[nomeViol] = (stats.direitos[nomeViol] || 0) + 1;
          stats.direitosPorOrigem[orig].totalViolacoes += 1;
          stats.direitosPorOrigem[orig].violacoes[nomeViol] = (stats.direitosPorOrigem[orig].violacoes[nomeViol] || 0) + 1;
        });
      }

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
  }, [filteredDocuments, filteredAgenda, users]);

  const origensComDireitosList = useMemo(() => {
    return Object.entries(aiStats.direitosPorOrigem)
      .map(([origem, data]) => ({
        origem,
        totalCasos: data.totalCasos,
        totalViolacoes: data.totalViolacoes,
        violacoes: data.violacoes,
        topViolacao: Object.entries(data.violacoes).sort((a, b) => b[1] - a[1])[0]
      }))
      .sort((a, b) => b.totalViolacoes - a.totalViolacoes);
  }, [aiStats]);

  const direitosChartData = useMemo(() => {
    if (selectedOrigemForDireitos === 'all') {
      return Object.entries(aiStats.direitos)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
    } else {
      const origData = aiStats.direitosPorOrigem[selectedOrigemForDireitos];
      if (!origData) return [];
      return Object.entries(origData.violacoes)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }
  }, [aiStats, selectedOrigemForDireitos]);

  const selectedOrigemStats = useMemo(() => {
    if (selectedOrigemForDireitos === 'all') {
      const totalViol = Object.values(aiStats.direitos).reduce((a, b) => a + b, 0);
      const topViol = Object.entries(aiStats.direitos).sort((a, b) => b[1] - a[1])[0];
      return {
        label: 'Todas as Origens (Visão Geral)',
        totalCasos: filteredDocuments.length,
        totalViolacoes: totalViol,
        mediaPorCaso: filteredDocuments.length ? (totalViol / filteredDocuments.length).toFixed(1) : '0',
        topViolacao: topViol ? `${topViol[0]} (${topViol[1]})` : 'Nenhum'
      };
    } else {
      const origData = aiStats.direitosPorOrigem[selectedOrigemForDireitos];
      if (!origData) {
        return {
          label: selectedOrigemForDireitos,
          totalCasos: 0,
          totalViolacoes: 0,
          mediaPorCaso: '0',
          topViolacao: 'Nenhum'
        };
      }
      const topViol = Object.entries(origData.violacoes).sort((a, b) => b[1] - a[1])[0];
      return {
        label: selectedOrigemForDireitos,
        totalCasos: origData.totalCasos,
        totalViolacoes: origData.totalViolacoes,
        mediaPorCaso: origData.totalCasos ? (origData.totalViolacoes / origData.totalCasos).toFixed(1) : '0',
        topViolacao: topViol ? `${topViol[0]} (${topViol[1]})` : 'Nenhum'
      };
    }
  }, [aiStats, selectedOrigemForDireitos, filteredDocuments]);

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

  const locaisOcorrenciaData = useMemo(() => 
    Object.entries(aiStats.locaisOcorrencia)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  , [aiStats]);

  const agendaCategoriaData = useMemo(() => 
    Object.entries(aiStats.agendaPorCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  , [aiStats]);

  const agendaTipoData = useMemo(() => 
    Object.entries(aiStats.agendaPorTipo)
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
        const myAgenda = filteredAgenda.filter(a => a.conselheiro_id === u.id && (!a.excluido || a.status === 'COMPARECEU'));
        
        return {
          id: u.id,
          nome: u.nome,
          unidade: u.unidade_id,
          docs: myDocs.length,
          disque100: myDocs.filter(d => d.origem.includes('DISQUE 100')).length,
          monitoring: myDocs.filter(d => d.status.includes('MONITORAMENTO')).length,
          agendaActions: myAgenda.length,
          attendances: myAgenda.filter(a => a.status === 'COMPARECEU').length
        };
      })
      .sort((a, b) => b.docs - a.docs);
  }, [filteredDocuments, filteredAgenda]);

  const handleExportCSV = () => {
    const headers = ["Conselheiro", "Unidade", "Documentos", "Disque 100", "Ações Agenda", "Atendimentos", "Monitoramentos"];
    const rows = counselorPerformance.map(p => [
      p.nome,
      `CT ${p.unidade}`,
      p.docs,
      p.disque100,
      p.agendaActions,
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
    <div className="space-y-8 pb-20 print:p-0 print:space-y-6">
      {/* CABEÇALHO OFICIAL DE IMPRESSÃO (Apenas Visível no PDF/Print) */}
      <div className="hidden print:flex flex-col space-y-6 border-b-2 border-slate-900 pb-6 mb-8 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Brasão de Hortolândia Simplificado e Elegante em SVG */}
            <div className="w-16 h-16 shrink-0 text-slate-950">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                <path d="M50 5 L85 25 V60 C85 80 50 95 50 95 C50 95 15 80 15 60 V25 L50 5 Z" fill="none" stroke="currentColor" strokeWidth="4" />
                <path d="M50 15 L75 30 V55 C75 70 50 82 50 82 C50 82 25 70 25 55 V30 L50 15 Z" fill="currentColor" opacity="0.15" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="50" cy="45" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M42 45 H58 M50 37 V53" stroke="currentColor" strokeWidth="2" />
                <path d="M30 15 H70" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <path d="M35 10 H65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase leading-none">ESTADO DE SÃO PAULO</p>
              <h2 className="text-[16px] font-black text-slate-950 leading-tight uppercase mt-0.5">Prefeitura Municipal de Hortolândia</h2>
              <h1 className="text-[14px] font-extrabold text-slate-800 tracking-tight uppercase leading-none mt-1">Conselho Tutelar - Colegiado Unificado</h1>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-slate-100 text-slate-950 rounded-md text-[9px] font-black border border-slate-200 uppercase tracking-wider">
              Relatório Oficial de Gestão
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">SIMCT • HORTOLÂNDIA</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px]">
          <div>
            <span className="font-black text-slate-400 uppercase block">Documento</span>
            <span className="font-extrabold text-slate-800 uppercase text-[11px]">Relatório Estatístico</span>
          </div>
          <div>
            <span className="font-black text-slate-400 uppercase block">Filtro de Unidade</span>
            <span className="font-extrabold text-slate-800 uppercase text-[11px]">
              {selectedUnidadeFilter === 'all' ? 'Ambas as Unidades' : selectedUnidadeFilter === 1 ? 'Unidade I (Sede)' : 'Unidade II (Sub-Sede)'}
            </span>
          </div>
          <div>
            <span className="font-black text-slate-400 uppercase block">Período de Análise</span>
            <span className="font-extrabold text-slate-800 uppercase text-[11px]">
              {startDate || endDate 
                ? `${startDate ? formatLocalDateString(startDate) : 'Início'} até ${endDate ? formatLocalDateString(endDate) : 'Hoje'}`
                : 'Período Integral (Todos os Registros)'}
            </span>
          </div>
          <div>
            <span className="font-black text-slate-400 uppercase block">Data de Emissão</span>
            <span className="font-extrabold text-slate-800 uppercase text-[11px]">
              {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="Gráfico 1: Distribuição de Procedimentos por Bairro" 
          data={bairroData} 
          total={filteredDocuments.length}
          barColor="#dc2626"
          footerNote="Hortolândia • Total de casos georreferenciados por Bairro"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 2: Situação e Status dos Procedimentos" 
          data={statusData} 
          total={filteredDocuments.length}
          barColor="#dc2626"
          footerNote="Hortolândia • Status operacional de andamento dos registros"
        />
      </div>

      {/* QUEBRA DE PÁGINA PARA PÁGINA 2 */}
      <div className="print-page-break h-0" />
      <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-200 pb-2 mb-6 uppercase font-black">
        <span>SIMCT • Relatório de Gestão • Hortolândia</span>
        <span>Página 2</span>
      </div>

      {/* NOVA SEÇÃO: FAIXA ETÁRIA E ATRIBUIÇÕES DO CONSELHO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="Gráfico 3: Distribuição Demográfica por Faixa Etária" 
          data={ageGroupData} 
          total={aiStats.totalCriancas}
          barColor="#dc2626"
          footerNote="Hortolândia • Faixa etária do público infantojuvenil atendido"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 4: Ações do Conselho Tutelar (Art. 136 ECA)" 
          data={attributionsData} 
          total={totalAttributions}
          barColor="#dc2626"
          footerNote="Hortolândia • Atribuições e providências institucionais tomadas"
        />
      </div>

      {/* QUEBRA DE PÁGINA PARA PÁGINA 3 */}
      <div className="print-page-break h-0" />
      <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-200 pb-2 mb-6 uppercase font-black">
        <span>SIMCT • Relatório de Gestão • Hortolândia</span>
        <span>Página 3</span>
      </div>
      
      {/* NOVA SEÇÃO: DETALHAMENTO DAS MEDIDAS APLICADAS (SEPARADAS POR ARTIGO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="Gráfico 5: Medidas de Proteção Aplicadas (Art. 101 ECA)" 
          data={measures101Data} 
          barColor="#dc2626"
          footerNote="Hortolândia • Medidas de proteção aplicadas às crianças e adolescentes"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 6: Medidas Aplicadas aos Pais ou Responsáveis (Art. 129 ECA)" 
          data={measures129Data} 
          barColor="#dc2626"
          footerNote="Hortolândia • Medidas de orientação, apoio e responsabilização familiar"
        />
      </div>

      {/* QUEBRA DE PÁGINA PARA PÁGINA 4 */}
      <div className="print-page-break h-0" />
      <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-200 pb-2 mb-6 uppercase font-black">
        <span>SIMCT • Relatório de Gestão • Hortolândia</span>
        <span>Página 4</span>
      </div>
      
      {/* SEÇÃO ORIGINAL: FREQUÊNCIA GERAL DE MEDIDAS (Agrupados em Grid para Impressão) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="Gráfico 7: Detalhamento Geral de Todas as Medidas Aplicadas" 
          data={measuresData} 
          barColor="#dc2626"
          footerNote="Hortolândia • Consolidação geral de frequência das medidas aplicadas"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 8: Serviços Requisitados pelo Conselho (Art. 136, III ECA)" 
          data={servicos136IIIData} 
          barColor="#dc2626"
          footerNote="Hortolândia • Serviços públicos requisitados na rede municipal"
        />
      </div>

      {/* QUEBRA DE PÁGINA PARA PÁGINA 5 */}
      <div className="print-page-break h-0" />
      <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-200 pb-2 mb-6 uppercase font-black">
        <span>SIMCT • Relatório de Gestão • Hortolândia</span>
        <span>Página 5</span>
      </div>

      {/* NOVA SEÇÃO: ORIGEM E CANAIS DE COMUNICAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="Gráfico 9: Identificação da Origem das Denúncias e Casos" 
          data={originsData} 
          barColor="#dc2626"
          footerNote="Hortolândia • Entidades ou canais de origem geradores da demanda"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 10: Canais de Comunicação Utilizados" 
          data={channelsData} 
          barColor="#dc2626"
          footerNote="Hortolândia • Canais e meios de comunicação formalizados no sistema"
        />
      </div>

      {/* SEÇÃO ESPECIAL: DIREITOS VIOLADOS VINCULADOS A QUEM COMUNICOU (ORIGEM) */}
      <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 print:break-inside-avoid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[9px] font-black uppercase tracking-wider">Análise Qualitativa e Quantitativa</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                Gráfico: Direitos Violados por Quem Comunicou (Origem)
              </h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                Vincular e quantificar violações de direitos com base na origem da denúncia (Ex: Disque 100, Escolas, Saúde, CRAS, etc.)
              </p>
            </div>
          </div>

          {/* Atalhos Rápidos por Comunicador Principal */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => setSelectedOrigemForDireitos('all')}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                selectedOrigemForDireitos === 'all'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas as Origens
            </button>
            {origensComDireitosList.slice(0, 5).map(item => (
              <button
                key={item.origem}
                onClick={() => setSelectedOrigemForDireitos(item.origem)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                  selectedOrigemForDireitos === item.origem
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.origem}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro de Seleção de Comunicador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[10px] font-black uppercase text-slate-600 whitespace-nowrap">Filtrar por Comunicador / Origem:</span>
          </div>
          <select
            value={selectedOrigemForDireitos}
            onChange={(e) => setSelectedOrigemForDireitos(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-300 text-slate-800 text-[11px] font-black uppercase rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 shadow-sm cursor-pointer"
          >
            <option value="all">🔍 TODAS AS ORIGENS (VISÃO GERAL DO MUNICÍPIO)</option>
            {origensComDireitosList.map(o => (
              <option key={o.origem} value={o.origem}>
                {o.origem} ({o.totalViolacoes} violações em {o.totalCasos} casos)
              </option>
            ))}
          </select>
        </div>

        {/* KPIs do Comunicador Selecionado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Comunicador / Origem</span>
            <span className="text-[12px] font-black text-rose-700 uppercase truncate block mt-1" title={selectedOrigemStats.label}>
              {selectedOrigemStats.label}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Total de Casos / Denúncias</span>
            <span className="text-xl font-black text-slate-900 block mt-1">{selectedOrigemStats.totalCasos}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Total de Direitos Violados</span>
            <span className="text-xl font-black text-rose-600 block mt-1">{selectedOrigemStats.totalViolacoes}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Violação Mais Frequente</span>
            <span className="text-[11px] font-black text-slate-800 uppercase truncate block mt-1" title={selectedOrigemStats.topViolacao}>
              {selectedOrigemStats.topViolacao}
            </span>
          </div>
        </div>

        {/* Gráfico das Violações para o Comunicador Selecionado */}
        <ProfessionalHorizontalChart
          title={`Direitos Violados Identificados — Origem: ${selectedOrigemStats.label}`}
          data={direitosChartData}
          total={selectedOrigemStats.totalViolacoes || 1}
          barColor="#e11d48"
          footerNote={`SIMCT Hortolândia • Quantificação e qualificação das violações vinculadas ao comunicador ${selectedOrigemStats.label}`}
        />

        {/* Tabela Qualitativa e Quantitativa */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-rose-600" />
              Detalhamento de Quem Comunicou e Quais Violações Foram Registradas
            </h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{origensComDireitosList.length} Comunicadores Catalogados</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[9px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Quem Comunicou (Origem)</th>
                  <th className="p-3.5 text-center">Procedimentos</th>
                  <th className="p-3.5 text-center">Violações Registradas</th>
                  <th className="p-3.5">Quais Violações Viveram Deste Comunicador (Qualificação)</th>
                  <th className="p-3.5 text-right print:hidden">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {origensComDireitosList.map((item) => {
                  const topViolationsArray = Object.entries(item.violacoes)
                    .sort((a, b) => b[1] - a[1]);

                  const isSelected = selectedOrigemForDireitos === item.origem;

                  return (
                    <tr 
                      key={item.origem} 
                      className={`hover:bg-rose-50/50 transition-colors ${isSelected ? 'bg-rose-50/80 font-bold' : ''}`}
                    >
                      <td className="p-3.5 font-bold text-slate-800 uppercase">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <span>{item.origem}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">{item.totalCasos}</td>
                      <td className="p-3.5 text-center font-mono font-black text-rose-600 bg-rose-50/30">{item.totalViolacoes}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {topViolationsArray.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Nenhuma violação tipificada</span>
                          ) : (
                            topViolationsArray.map(([vNome, vQtd]) => (
                              <span 
                                key={vNome}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[10px] font-extrabold border border-slate-200/80"
                              >
                                <span>{vNome}</span>
                                <span className="bg-rose-600 text-white rounded px-1 text-[9px] font-mono">{vQtd}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right print:hidden">
                        <button
                          onClick={() => setSelectedOrigemForDireitos(item.origem)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          Filtrar Gráfico
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {origensComDireitosList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[10px] text-slate-400 uppercase font-black">
                      Nenhum direito violado registrado no período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUEBRA DE PÁGINA PARA PÁGINA 6 */}
      <div className="print-page-break h-0" />
      <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-200 pb-2 mb-6 uppercase font-black">
        <span>SIMCT • Relatório de Gestão • Hortolândia</span>
        <span>Página 6</span>
      </div>

      {/* NOVA SEÇÃO: LOCAL DA OCORRÊNCIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="Gráfico 11: Local da Ocorrência da Violação" 
          data={locaisOcorrenciaData} 
          barColor="#dc2626"
          footerNote="Hortolândia • Locais onde as violações de direitos foram identificadas"
        />
      </div>

      {/* QUEBRA DE PÁGINA PARA PÁGINA 7 */}
      <div className="print-page-break h-0" />
      <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-200 pb-2 mb-6 uppercase font-black">
        <span>SIMCT • Relatório de Gestão • Hortolândia</span>
        <span>Página 7</span>
      </div>

      {/* NOVA SEÇÃO: AÇÕES DO CONSELHO TUTELAR (AGENDA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="Gráfico 12: Ações do Conselho Tutelar por Categoria" 
          data={agendaCategoriaData} 
          barColor="#2563eb"
          footerNote="Hortolândia • Atividades registradas na agenda institucional"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 13: Top 10 Ações Detalhadas" 
          data={agendaTipoData.slice(0, 10)} 
          barColor="#2563eb"
          footerNote="Hortolândia • Detalhamento das atividades mais frequentes"
        />
      </div>

      {/* QUEBRA DE PÁGINA PARA PÁGINA 8 */}
      <div className="print-page-break h-0" />
      <div className="hidden print:flex justify-between items-center text-[9px] text-slate-400 border-b border-slate-200 pb-2 mb-6 uppercase font-black">
        <span>SIMCT • Relatório de Gestão • Hortolândia</span>
        <span>Página 8</span>
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
                    <span className="text-[12px] font-black text-slate-700 leading-none">{perf.agendaActions}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Ações</span>
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
                <th className="px-4 sm:px-6 py-4 text-center">Ações Agenda</th>
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
                      <span className="text-[12px] sm:text-[14px] font-black text-slate-600">{perf.agendaActions}</span>
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

      {/* BLOCO DE ASSINATURAS DO COLEGIADO (Visível apenas em impressão no rodapé da última página) */}
      <div className="hidden print:block mt-12 avoid-break">
        <div className="border-t-2 border-slate-300 pt-6 mt-12">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-10">
            Hortolândia - SP, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 text-center">
            {/* Linha 1 */}
            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-slate-400 mb-1"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase">Coordenação do Conselho Tutelar</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Conselho Tutelar de Hortolândia</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-slate-400 mb-1"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase">Conselheiro(a) Relator(a)</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Membro do Colegiado</span>
            </div>

            {/* Linha 2 */}
            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-slate-400 mb-1"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase">Membro do Colegiado</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Conselheiro Tutelar Titular</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-slate-400 mb-1"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase">Membro do Colegiado</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Conselheiro Tutelar Titular</span>
            </div>
          </div>

          <div className="flex flex-col items-center mt-10">
            <div className="w-64 border-b border-slate-400 mb-1"></div>
            <span className="text-[10px] font-black text-slate-800 uppercase">Membro do Colegiado</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">Conselheiro Tutelar Titular</span>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              SIMCT • SISTEMA INTEGRADO MUNICIPAL DO CONSELHO TUTELAR • HORTOLÂNDIA/SP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
