
import React, { useMemo, useState } from 'react';
import { Documento, AgendaEntry, User } from '../types';
import { INITIAL_USERS, STATUS_LABELS } from '../constants';
import { BarChart3, PieChart, TrendingUp, Users, FileText, ShieldAlert, Sparkles, UserCheck, Bell, PhoneCall, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import AIStatisticsAnalyzer from './AIStatisticsAnalyzer';

interface StatisticsViewProps {
  documents: Documento[];
  agenda: AgendaEntry[];
  users: User[];
  currentUser: User;
  isGlobal?: boolean;
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ documents, agenda, users, currentUser, isGlobal }) => {
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
    documents.reduce((acc, doc) => acc + (doc.atribuicoes_136?.length || 0), 0)
  , [documents]);

  const counselorPerformance = useMemo(() => {
    return users
      .filter(u => (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && (isGlobal ? true : (u.unidade_id || 1) === (currentUser.unidade_id || 1)))
      .map(u => {
        const myDocs = documents.filter(d => d.conselheiro_referencia_id === u.id);
        const myAgenda = agenda.filter(a => a.conselheiro_id === u.id);
        
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
  }, [documents, agenda]);

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
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      <AIStatisticsAnalyzer stats={aiStats} totalDocs={documents.length} />

      {/* NOVA SEÇÃO: DESEMPENHO DOS CONSELHEIROS */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tight">Desempenho dos Conselheiros</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Produtividade Individual por Categoria de Ação</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Conselheiro</th>
                <th className="px-6 py-4 text-center">Unidade</th>
                <th className="px-6 py-4 text-center">Documentos</th>
                <th className="px-6 py-4 text-center">Disque 100</th>
                <th className="px-6 py-4 text-center">Notificações</th>
                <th className="px-6 py-4 text-center">Atendimentos</th>
                <th className="px-6 py-4 text-center">Monitoramentos</th>
              </tr>
            </thead>
            <tbody>
              {counselorPerformance.map(perf => (
                <tr key={perf.id} className="group hover:bg-slate-50 transition-all">
                  <td className="px-6 py-5 bg-slate-50 group-hover:bg-white rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 text-xs border border-slate-100 shadow-sm">
                        {perf.nome.substring(0, 2)}
                      </div>
                      <span className="text-[13px] font-black text-slate-700 uppercase">{perf.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase">CT {perf.unidade}</span>
                  </td>
                  <td className="px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[16px] font-black text-slate-800">{perf.docs}</span>
                      <div className="w-8 h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (perf.docs / (documents.length || 1)) * 500)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[14px] font-black text-slate-600">{perf.disque100}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[14px] font-black text-slate-600">{perf.notifications}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[14px] font-black text-slate-600">{perf.attendances}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-slate-50 group-hover:bg-white rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[14px] font-black text-slate-600">{perf.monitoring}</span>
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
