
import React, { useMemo, useState } from 'react';
import { Documento } from '../types';
import { INITIAL_USERS, STATUS_LABELS } from '../constants';
import { BarChart3, PieChart, TrendingUp, Users, FileText, ShieldAlert, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import AIStatisticsAnalyzer from './AIStatisticsAnalyzer';

interface StatisticsViewProps {
  documents: Documento[];
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ documents }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const filteredDocuments = useMemo(() => {
    if (selectedStatus === 'ALL') return documents;
    return documents.filter(doc => doc.status.includes(selectedStatus as any));
  }, [documents, selectedStatus]);

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

      const ref = INITIAL_USERS.find(u => u.id === doc.conselheiro_referencia_id);
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

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-violet-50 rounded-3xl text-violet-600">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight">Relatórios Estatísticos</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Análise quantitativa da rede de proteção</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Filtrar por Status:</span>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-violet-500/20 min-w-[200px]"
          >
            <option value="ALL">Todos os Procedimentos</option>
            {Object.entries(STATUS_LABELS)
              .filter(([key]) => key !== 'NENHUMA')
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))
            }
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total de Casos</span>
          </div>
          <p className="text-[42px] font-black text-slate-900 leading-none">{filteredDocuments.length}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Em Monitoramento</span>
          </div>
          <p className="text-[42px] font-black text-slate-900 leading-none">
            {filteredDocuments.filter(d => d.status.includes('MONITORAMENTO')).length}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aguardando Validação</span>
          </div>
          <p className="text-[42px] font-black text-slate-900 leading-none">
            {filteredDocuments.filter(d => d.status.includes('AGUARDANDO_VALIDACAO')).length}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Requisições Art. 136 III</span>
          </div>
          <p className="text-[42px] font-black text-slate-900 leading-none">{aiStats.requisicoes136III}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-8">Distribuição por Bairro</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bairroData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-8">Situação dos Procedimentos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
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
      </div>

      {/* NOVA SEÇÃO: FAIXA ETÁRIA E ATRIBUIÇÕES DO CONSELHO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Faixa Etária */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-8">Distribuição por Faixa Etária</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={ageGroupData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
          <div className="flex justify-center gap-6 mt-4">
             {ageGroupData.map((g, i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{backgroundColor: ['#2563EB', '#10B981', '#F59E0B'][i % 3]}}></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase">{g.name}: {g.value}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Gráfico de Atribuições Art. 136 */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Ações do Conselho (Art. 136 ECA)</h3>
            <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[10px] font-black uppercase">Total: {totalAttributions}</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attributionsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{fontSize: 8, fontWeight: 800, fill: '#64748b'}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* NOVA SEÇÃO: DETALHAMENTO DAS MEDIDAS APLICADAS (SEPARADAS POR ARTIGO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Medidas Art. 101 (Criança/Adolescente)</h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">Proteção</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={measures101Data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={180}
                  tick={{fontSize: 8, fontWeight: 800, fill: '#64748b'}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Medidas Art. 129 (Pais/Responsáveis)</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase">Orientação</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={measures129Data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={180}
                  tick={{fontSize: 8, fontWeight: 800, fill: '#64748b'}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                />
                <Bar dataKey="value" fill="#F59E0B" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* SEÇÃO ORIGINAL: FREQUÊNCIA GERAL DE MEDIDAS */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Detalhamento das Medidas Aplicadas</h3>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Frequência de Ações</span>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={measuresData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                width={250}
                tick={{fontSize: 8, fontWeight: 800, fill: '#64748b'}} 
              />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
              />
              <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NOVA SEÇÃO: DETALHAMENTO DOS SERVIÇOS REQUISITADOS (ART. 136 III) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Serviços Requisitados (Art. 136 III)</h3>
          <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase">Detalhamento por Serviço</span>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={servicos136IIIData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                width={250}
                tick={{fontSize: 8, fontWeight: 800, fill: '#64748b'}} 
              />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NOVA SEÇÃO: ORIGEM E CANAIS DE COMUNICAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Origem */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-8">Identificação da Origem</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={originsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94A3B8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Canais de Comunicação */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-8">Canais de Comunicado</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={channelsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
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
      </div>

      <AIStatisticsAnalyzer stats={aiStats} totalDocs={filteredDocuments.length} />
    </div>
  );
};

export default StatisticsView;
