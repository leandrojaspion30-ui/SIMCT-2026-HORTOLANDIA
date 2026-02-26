
import React, { useMemo } from 'react';
import { Documento } from '../types';
import { INITIAL_USERS } from '../constants';
import { BarChart3, PieChart, TrendingUp, Users, FileText, ShieldAlert, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import AIStatisticsAnalyzer from './AIStatisticsAnalyzer';

interface StatisticsViewProps {
  documents: Documento[];
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ documents }) => {
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const aiStats = useMemo(() => {
    const stats = {
      totalCriancas: documents.reduce((acc, d) => acc + (d.criancas?.length || 0), 0),
      direitos: {} as Record<string, number>,
      bairros: {} as Record<string, number>,
      agentes: {} as Record<string, number>,
      origens: {} as Record<string, number>,
      canaisComunicado: {} as Record<string, number>,
      atribuicoesECA: {} as Record<string, number>,
      violencias: {} as Record<string, number>,
      medidasAplicadas: {} as Record<string, number>,
      status: {} as Record<string, number>,
      faixasEtarias: {
        'PRIMEIRA INFÂNCIA (0-6)': 0,
        'CRIANÇA (7-12)': 0,
        'ADOLESCENTE (13-18)': 0
      },
      acoesPorConselheiro: {} as Record<string, number>
    };

    documents.forEach(doc => {
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

      doc.violencias?.forEach(v => {
        stats.violencias[v] = (stats.violencias[v] || 0) + 1;
      });

      doc.medidas_detalhadas?.forEach(m => {
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
  }, [documents]);

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

  const totalAttributions = useMemo(() => 
    documents.reduce((acc, doc) => acc + (doc.atribuicoes_136?.length || 0), 0)
  , [documents]);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-violet-50 rounded-3xl text-violet-600">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight">Relatórios Estatísticos</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Análise quantitativa da rede de proteção</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total de Casos</span>
          </div>
          <p className="text-[42px] font-black text-slate-900 leading-none">{documents.length}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Em Monitoramento</span>
          </div>
          <p className="text-[42px] font-black text-slate-900 leading-none">
            {documents.filter(d => d.status.includes('MONITORAMENTO')).length}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aguardando Validação</span>
          </div>
          <p className="text-[42px] font-black text-slate-900 leading-none">
            {documents.filter(d => d.status.includes('AGUARDANDO_VALIDACAO')).length}
          </p>
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
      
      {/* NOVA SEÇÃO: DETALHAMENTO DAS MEDIDAS APLICADAS */}
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
              <RePieChart>
                <Pie
                  data={channelsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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

      <AIStatisticsAnalyzer stats={aiStats} totalDocs={documents.length} />
    </div>
  );
};

export default StatisticsView;
