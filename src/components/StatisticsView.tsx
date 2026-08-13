
import React, { useMemo, useState } from 'react';
import { Documento, AgendaEntry, User } from '../types';
import { INITIAL_USERS, STATUS_LABELS, AGENDA_TIPOS } from '../constants';
import { 
  BarChart3, PieChart, TrendingUp, Users, FileText, ShieldAlert, Sparkles, UserCheck, 
  Bell, PhoneCall, Activity, Download, Printer, X, Calendar, Filter, BookOpen,
  Search, Folder, Clock, ArrowUp, ArrowDown, ArrowRight, RotateCcw, RotateCw, Info, ArrowLeft
} from 'lucide-react';
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

const getStatusColor = (statusName: string) => {
  const name = (STATUS_LABELS[statusName as any] || statusName).toLowerCase();
  if (name.includes('notificado') && !name.includes('leandro') && !name.includes('mirian') && !name.includes('sandra')) return '#dc2626'; // red
  if (name.includes('aguardando análise') || name.includes('aguardando analise')) return '#ea580c'; // orange
  if (name.includes('colegiado') || name.includes('aguardando validação')) return '#f59e0b'; // amber
  if (name.includes('leandro')) return '#0284c7'; // cyan/blue
  if (name.includes('concluído') || name.includes('concluido')) return '#16a34a'; // green
  if (name.includes('medida aplicada')) return '#8b5cf6'; // purple
  if (name.includes('mirian')) return '#0d9488'; // teal
  if (name.includes('sandra')) return '#4f46e5'; // indigo
  if (name.includes('encaminhado')) return '#64748b'; // slate
  if (name.includes('arquivado')) return '#94a3b8'; // gray
  return '#2563eb';
};

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
  getBarColor?: (name: string, index: number) => string;
  rightDropdown?: React.ReactNode;
  showInfoIcon?: boolean;
  xAxisScale?: number[];
}

const ProfessionalHorizontalChart: React.FC<ProfessionalHorizontalChartProps> = ({ 
  title, 
  data, 
  total, 
  labelType = 'both', 
  footerNote, 
  barColor = '#2563eb',
  getBarColor,
  rightDropdown,
  showInfoIcon = true,
  xAxisScale
}) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const totalSum = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);
  const divisor = total || totalSum || 1;

  const ticks = useMemo(() => {
    if (xAxisScale && xAxisScale.length > 0) return xAxisScale;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const step = Math.ceil(maxVal / 4) || 1;
    return [0, step, step * 2, step * 3, step * 4];
  }, [data, xAxisScale]);

  const maxScaleVal = ticks[ticks.length - 1] || maxValue;

  return (
    <div className="w-full bg-white border border-slate-100/90 shadow-2xs hover:shadow-md transition-shadow overflow-hidden flex flex-col rounded-2xl sm:rounded-3xl print:shadow-none print:border-slate-300 print:break-inside-avoid">
      {/* Título elegante posicionado acima do gráfico */}
      <div className="px-6 py-4 sm:px-7 sm:py-4.5 border-b border-slate-100/80 bg-slate-50/50 flex items-center justify-between gap-3 print:py-2.5 print:px-4">
        <div className="flex items-center gap-2">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight print:text-[10px]">
            {title}
          </h4>
          {showInfoIcon && (
            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0" />
          )}
        </div>
        {rightDropdown ? (
          rightDropdown
        ) : (
          <span className="text-[10px] font-bold text-slate-400 font-mono hidden sm:inline-block print:hidden">
            {data.length} itens
          </span>
        )}
      </div>
      
      {/* Corpo do Gráfico */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between bg-white print:p-4">
        <div className="space-y-3">
          {data.map((item, idx) => {
            const percentage = ((item.value / divisor) * 100);
            const percentageStr = percentage.toFixed(1).replace('.', ',');
            const itemBarColor = getBarColor ? getBarColor(item.name, idx) : barColor;
            const barWidthPercent = Math.max((item.value / maxScaleVal) * 100, 1.5);
            const displayName = item.name ? (STATUS_LABELS[item.name as any] || item.name) : 'NÃO INFORMADO';

            return (
              <div key={idx} className="flex items-center text-xs print:text-[10px] group">
                {/* Rótulo da esquerda */}
                <div className="w-[42%] sm:w-[38%] text-right pr-3.5 font-bold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight truncate print:whitespace-normal print:overflow-visible text-[10px] sm:text-[11px] uppercase" title={displayName}>
                  {displayName}
                </div>
                
                {/* Linha vertical (Eixo Y) e a Barra */}
                <div className="flex-1 flex items-center border-l-2 border-slate-200/80 pl-2.5 h-7 relative">
                  <div 
                    className="h-4.5 rounded-r-md transition-all duration-500 ease-out group-hover:brightness-110 shadow-2xs" 
                    style={{ 
                      width: `${Math.min(barWidthPercent, 100)}%`,
                      backgroundColor: itemBarColor
                    }}
                  />
                  {/* Valor impresso ao final da barra */}
                  <span className="ml-2.5 font-mono font-bold text-slate-800 text-[11px] print:text-[9px] whitespace-nowrap">
                    {labelType === 'percentage' && `${percentageStr}%`}
                    {labelType === 'absolute' && item.value}
                    {labelType === 'both' && `${item.value} (${percentageStr}%)`}
                  </span>
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Eixo X com valores na parte inferior */}
        <div className="mt-5 pl-[42%] sm:pl-[38%]">
          <div className="border-t border-slate-200/80 pt-1 flex justify-between text-[10px] font-mono font-bold text-slate-400 px-2.5">
            {ticks.map((tick, i) => (
              <span key={i}>{tick}</span>
            ))}
          </div>
        </div>

        {/* Rodapé do gráfico */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Atualizado agora</span>
          </div>
          <span className="font-mono text-[9px] text-slate-400">{footerNote || `Total: ${totalSum} registros`}</span>
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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bairroFilter, setBairroFilter] = useState<string>('all');
  const [conselheiroFilter, setConselheiroFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'titularidade' | 'imediata' | 'colegiado'>('overview');

  const filteredDocuments = useMemo(() => {
    let docs = documents;
    
    // Regra da UNIDADE II: Zerar todos os casos que aparecem no relatório estatístico da UNIDADE II
    docs = docs.filter(d => (d.unidade_id || 1) !== 2);

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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      docs = docs.filter(d => 
        d.id?.toLowerCase().includes(q) ||
        d.crianca_nome?.toLowerCase().includes(q) ||
        d.genitora_nome?.toLowerCase().includes(q) ||
        d.bairro?.toLowerCase().includes(q) ||
        d.criancas?.some(c => c.nome?.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      docs = docs.filter(d => {
        const curr = d.status[d.status.length - 1];
        return curr === statusFilter;
      });
    }
    if (bairroFilter !== 'all') {
      docs = docs.filter(d => d.bairro === bairroFilter);
    }
    if (conselheiroFilter !== 'all') {
      docs = docs.filter(d => d.conselheiro_referencia_id === conselheiroFilter);
    }
    if (activeTab === 'titularidade') {
      docs = docs.filter(d => d.conselheiro_referencia_id === currentUser.id);
    } else if (activeTab === 'imediata') {
      docs = docs.filter(d => d.conselheiro_referencia_id === currentUser.id);
    } else if (activeTab === 'colegiado') {
      docs = docs.filter(d => d.status.some(s => s.includes('AGUARDANDO_VALIDACAO')));
    }
    return docs;
  }, [documents, isGlobal, selectedUnidadeFilter, startDate, endDate, searchQuery, statusFilter, bairroFilter, conselheiroFilter, activeTab, currentUser]);

  const filteredAgenda = useMemo(() => {
    let ags = agenda;

    // Regra da UNIDADE II: Zerar todos os casos de agenda da UNIDADE II no relatório estatístico
    ags = ags.filter(a => (a.unidade_id || 1) !== 2);

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

      <header className="space-y-5 print:hidden">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-black uppercase text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR
            </button>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                ZELAR PELO CUMPRIMENTO DO DIREITO
              </span>
              <p className="text-xs font-black uppercase tracking-tight mt-0.5">
                <span className="text-slate-900">{currentUser?.nome?.split(' ')[0] || 'LEANDRO'}</span>{' '}
                <span className="text-blue-600">(CONSELHEIRO)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> EXPORTAR CSV
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" /> IMPRIMIR PDF
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" /> ATUALIZAR
            </button>
            <button 
              onClick={() => window.history.back()}
              className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div className="flex items-center gap-3.5 pt-2">
          <div className="p-3 bg-purple-100/70 border border-purple-200/60 rounded-2xl text-purple-600 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
              RELATÓRIOS ESTATÍSTICOS
            </h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Análise quantitativa da Rede de Proteção
            </p>
          </div>
        </div>
      </header>

      {/* FILTER CONTAINER */}
      <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xs space-y-5 print:hidden">
        {/* Row 1: Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* 1. Search */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block truncate">
              Pesquisar por família, criança ou responsável
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Digite o nome para pesquisar..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* 2. Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Status
            </label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none"
            >
              <option value="all">Qualquer status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* 3. Bairro */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Bairro
            </label>
            <select 
              value={bairroFilter}
              onChange={e => setBairroFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none"
            >
              <option value="all">Qualquer bairro</option>
              {Object.keys(aiStats.bairros).sort().map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 4. Conselheiro */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Conselheiro
            </label>
            <select 
              value={conselheiroFilter}
              onChange={e => setConselheiroFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none"
            >
              <option value="all">Qualquer conselheiro</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>

          {/* 5. Data Inicial */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Data inicial
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none"
            />
          </div>

          {/* 6. Data Final */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Data final
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer outline-none"
            />
          </div>
        </div>

        {/* Row 2: Navigation Tabs & Filter Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-6 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              VISÃO GERAL
            </button>
            <button
              onClick={() => setActiveTab('titularidade')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'titularidade'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              MINHA TITULARIDADE
            </button>
            <button
              onClick={() => setActiveTab('imediata')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'imediata'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              MINHA IMEDIATA
            </button>
            <button
              onClick={() => setActiveTab('colegiado')}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'colegiado'
                  ? 'border-blue-600 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              VALIDAÇÃO COLEGIADO
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={() => {
                // Filters are dynamically calculated via state
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>APLICAR FILTROS</span>
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setBairroFilter('all');
                setConselheiroFilter('all');
                setStartDate('');
                setEndDate('');
                setActiveTab('overview');
              }}
              className="px-3.5 py-2.5 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>LIMPAR</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 print:grid-cols-2 print:gap-4">
        {/* Card 1: Total de Casos */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              TOTAL DE CASOS
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              {filteredDocuments.length}
            </p>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
              <ArrowUp className="w-3 h-3" /> 18% em relação ao período anterior
            </span>
          </div>
        </div>

        {/* Card 2: Em Monitoramento */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              EM MONITORAMENTO
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              {filteredDocuments.filter(d => d.status[d.status.length - 1]?.includes('MONITORAMENTO')).length}
            </p>
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-2">
              <ArrowRight className="w-3 h-3 text-slate-300" /> Sem alteração
            </span>
          </div>
        </div>

        {/* Card 3: Aguardando Validação */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              AGUARDANDO VALIDAÇÃO
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              {filteredDocuments.filter(d => d.status[d.status.length - 1]?.includes('AGUARDANDO_VALIDACAO')).length}
            </p>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mt-2">
              <ArrowUp className="w-3 h-3" /> 10% em relação ao período anterior
            </span>
          </div>
        </div>

        {/* Card 4: Ações Art. 136 III */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              AÇÕES ART. 136 III
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              {aiStats.requisicoes136III}
            </p>
            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-2">
              <ArrowDown className="w-3 h-3" /> 18% em relação ao período anterior
            </span>
          </div>
        </div>
      </div>

      {/* YELLOW BANNER: MODO ISOLADO ATIVO */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 px-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-amber-950 text-xs tracking-wider uppercase">
              MODO ISOLADO ATIVO
            </h4>
            <p className="font-medium text-amber-800 text-[11px] mt-0.5">
              Exibindo apenas a pasta da família selecionada para evitar contaminação visual.
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            // Optional action to reset family isolate mode
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black rounded-xl text-xs font-bold uppercase text-white transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95"
        >
          <Folder className="w-3.5 h-3.5" /> VER TODAS AS PASTAS (2)
        </button>
      </div>

      {/* CHARTS GRID 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 print:grid-cols-2 print:gap-4 print-avoid-break">
        <ProfessionalHorizontalChart 
          title="GRÁFICO 1: DISTRIBUIÇÃO DE PROCEDIMENTOS POR BAIRRO" 
          data={bairroData} 
          total={filteredDocuments.length}
          barColor="#2563eb"
          showInfoIcon={true}
          rightDropdown={
            <select className="text-[11px] font-bold uppercase text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 outline-none cursor-pointer">
              <option>Top 10 bairros</option>
              <option>Todos os bairros</option>
            </select>
          }
          xAxisScale={[0, 5, 10, 15, 20, 25]}
          footerNote="Hortolândia • Total de casos georreferenciados por Bairro"
        />

        <ProfessionalHorizontalChart 
          title="GRÁFICO 2: SITUAÇÃO E STATUS DOS PROCEDIMENTOS" 
          data={statusData} 
          total={filteredDocuments.length}
          getBarColor={(name) => getStatusColor(name)}
          showInfoIcon={true}
          rightDropdown={
            <select className="text-[11px] font-bold uppercase text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 outline-none cursor-pointer">
              <option>Todos os status</option>
            </select>
          }
          xAxisScale={[0, 20, 40, 60, 80]}
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
          barColor="#2563eb"
          footerNote="Hortolândia • Faixa etária do público infantojuvenil atendido"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 4: Ações do Conselho Tutelar (Art. 136 ECA)" 
          data={attributionsData} 
          total={totalAttributions}
          barColor="#2563eb"
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
          barColor="#2563eb"
          footerNote="Hortolândia • Medidas de proteção aplicadas às crianças e adolescentes"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 6: Medidas Aplicadas aos Pais ou Responsáveis (Art. 129 ECA)" 
          data={measures129Data} 
          barColor="#2563eb"
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
          barColor="#2563eb"
          footerNote="Hortolândia • Consolidação geral de frequência das medidas aplicadas"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 8: Serviços Requisitados pelo Conselho (Art. 136, III ECA)" 
          data={servicos136IIIData} 
          barColor="#2563eb"
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
          barColor="#2563eb"
          footerNote="Hortolândia • Entidades ou canais de origem geradores da demanda"
        />

        <ProfessionalHorizontalChart 
          title="Gráfico 10: Canais de Comunicação Utilizados" 
          data={channelsData} 
          barColor="#2563eb"
          footerNote="Hortolândia • Canais e meios de comunicação formalizados no sistema"
        />
      </div>
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm space-y-6 print:break-inside-avoid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100">Análise Qualitativa e Quantitativa</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-tight mt-1">
                Direitos Violados por Quem Comunicou (Origem)
              </h3>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                Vincular e quantificar violações de direitos com base na origem da denúncia (Disque 100, Escolas, Saúde, CRAS, etc.)
              </p>
            </div>
          </div>

          {/* Atalhos Rápidos por Comunicador Principal */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => setSelectedOrigemForDireitos('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer active:scale-95 ${
                selectedOrigemForDireitos === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Todas as Origens
            </button>
            {origensComDireitosList.slice(0, 5).map(item => (
              <button
                key={item.origem}
                onClick={() => setSelectedOrigemForDireitos(item.origem)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer active:scale-95 ${
                  selectedOrigemForDireitos === item.origem
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {item.origem}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro de Seleção de Comunicador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold uppercase text-slate-600 whitespace-nowrap">Filtrar por Comunicador / Origem:</span>
          </div>
          <select
            value={selectedOrigemForDireitos}
            onChange={(e) => setSelectedOrigemForDireitos(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-800 text-xs font-bold uppercase rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer transition-all"
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
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Comunicador / Origem</span>
            <span className="text-xs font-bold text-blue-700 uppercase truncate block mt-1" title={selectedOrigemStats.label}>
              {selectedOrigemStats.label}
            </span>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Total de Casos / Denúncias</span>
            <span className="text-xl font-black text-slate-900 block mt-1">{selectedOrigemStats.totalCasos}</span>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Total de Direitos Violados</span>
            <span className="text-xl font-black text-blue-600 block mt-1">{selectedOrigemStats.totalViolacoes}</span>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Violação Mais Frequente</span>
            <span className="text-xs font-bold text-slate-800 uppercase truncate block mt-1" title={selectedOrigemStats.topViolacao}>
              {selectedOrigemStats.topViolacao}
            </span>
          </div>
        </div>

        {/* Gráfico das Violações para o Comunicador Selecionado */}
        <ProfessionalHorizontalChart
          title={`Direitos Violados Identificados — Origem: ${selectedOrigemStats.label}`}
          data={direitosChartData}
          total={selectedOrigemStats.totalViolacoes || 1}
          barColor="#2563eb"
          footerNote={`SIMCT Hortolândia • Quantificação e qualificação das violações vinculadas ao comunicador ${selectedOrigemStats.label}`}
        />

        {/* Tabela Qualitativa e Quantitativa */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Detalhamento de Quem Comunicou e Quais Violações Foram Registradas
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{origensComDireitosList.length} Comunicadores Catalogados</span>
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
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
                      className={`hover:bg-blue-50/40 transition-colors ${isSelected ? 'bg-blue-50/70 font-bold' : ''}`}
                    >
                      <td className="p-3.5 font-bold text-slate-800 uppercase">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span>{item.origem}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">{item.totalCasos}</td>
                      <td className="p-3.5 text-center font-mono font-black text-blue-600 bg-blue-50/30">{item.totalViolacoes}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {topViolationsArray.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Nenhuma violação tipificada</span>
                          ) : (
                            topViolationsArray.map(([vNome, vQtd]) => (
                              <span 
                                key={vNome}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200/80"
                              >
                                <span>{vNome}</span>
                                <span className="bg-blue-600 text-white rounded px-1 text-[9px] font-mono">{vQtd}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right print:hidden">
                        <button
                          onClick={() => setSelectedOrigemForDireitos(item.origem)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        >
                          Filtrar Gráfico
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {origensComDireitosList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[10px] text-slate-400 uppercase font-bold">
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
          barColor="#2563eb"
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
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm print:break-inside-avoid">
        <div className="flex items-center gap-4 mb-6 sm:mb-8 border-b border-slate-100 pb-5">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-tight">Desempenho dos Conselheiros</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">Produtividade Individual por Categoria</p>
          </div>
        </div>

        {/* LAYOUT PARA MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 md:hidden px-1 print:hidden">
          {counselorPerformance.map(perf => (
            <div key={perf.id} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                    {perf.nome.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase leading-none">{perf.nome}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 block">CT {perf.unidade}</span>
                  </div>
                </div>
                <div className="bg-white px-3 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                  <span className="text-xs font-black text-slate-800">{perf.docs} <span className="text-[10px] font-normal text-slate-400">DOCS</span></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 leading-none">{perf.disque100}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">D100</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 leading-none">{perf.agendaActions}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Ações</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 leading-none">{perf.attendances}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Atend</span>
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 leading-none">{perf.monitoring}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Moni</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LAYOUT PARA DESKTOP (TABELA) */}
        <div className="hidden md:block print:block overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2 min-w-[750px]">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Conselheiro</th>
                <th className="px-5 py-3 text-center">Unidade</th>
                <th className="px-5 py-3 text-center">Documentos</th>
                <th className="px-5 py-3 text-center">Disque 100</th>
                <th className="px-5 py-3 text-center">Ações Agenda</th>
                <th className="px-5 py-3 text-center">Atendimentos</th>
                <th className="px-5 py-3 text-center">Monitoramentos</th>
              </tr>
            </thead>
            <tbody>
              {counselorPerformance.map(perf => (
                <tr key={perf.id} className="group hover:bg-slate-50/80 transition-all">
                  <td className="px-5 py-4 bg-slate-50/60 group-hover:bg-white rounded-l-xl border-y border-l border-slate-200/50 group-hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                        {perf.nome.substring(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-slate-800 uppercase whitespace-nowrap">{perf.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 bg-slate-50/60 group-hover:bg-white border-y border-slate-200/50 group-hover:border-slate-200 text-center">
                    <span className="px-2.5 py-1 bg-slate-200/60 text-slate-700 rounded-md text-[10px] font-bold uppercase">CT {perf.unidade}</span>
                  </td>
                  <td className="px-5 py-4 bg-slate-50/60 group-hover:bg-white border-y border-slate-200/50 group-hover:border-slate-200 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-800">{perf.docs}</span>
                      <div className="w-10 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, (perf.docs / (filteredDocuments.length || 1)) * 500)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 bg-slate-50/60 group-hover:bg-white border-y border-slate-200/50 group-hover:border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-bold text-slate-700">{perf.disque100}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 bg-slate-50/60 group-hover:bg-white border-y border-slate-200/50 group-hover:border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-slate-700">{perf.agendaActions}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 bg-slate-50/60 group-hover:bg-white border-y border-slate-200/50 group-hover:border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">{perf.attendances}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 bg-slate-50/60 group-hover:bg-white rounded-r-xl border-y border-r border-slate-200/50 group-hover:border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">{perf.monitoring}</span>
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
