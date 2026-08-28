import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Book, 
  FileText, 
  Scale, 
  AlertCircle, 
  ExternalLink, 
  Filter, 
  ChevronRight,
  Plus,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LegalLibraryService, LegalDocument } from '../services/legalLibrary';
import { useLegalLibraryRealtime } from '../hooks/useLegalLibraryRealtime';

const CATEGORIES = [
  "CONSTITUIÇÃO", "CÓDIGOS", "ECA", "LEIS FEDERAIS", "DECRETOS FEDERAIS", 
  "RESOLUÇÕES CONANDA", "PORTARIAS", "NORMAS TÉCNICAS", "LEGISLAÇÃO EDUCACIONAL", 
  "LEGISLAÇÃO DE SAÚDE", "SUS", "SUAS", "ASSISTÊNCIA SOCIAL", "DEFICIÊNCIA", "TEA", 
  "VIOLÊNCIA", "VIOLÊNCIA DOMÉSTICA", "VIOLÊNCIA SEXUAL", "ESCUTA ESPECIALIZADA", 
  "DEPOIMENTO ESPECIAL", "PRIMEIRA INFÂNCIA", "FAMÍLIA", "ADOÇÃO", "ACOLHIMENTO", 
  "GUARDA", "TUTELA", "PODER FAMILIAR", "TRABALHO INFANTIL", "INTERNET E PROTEÇÃO DIGITAL", 
  "BULLYING", "CYBERBULLYING", "DIREITOS HUMANOS", "LEGISLAÇÃO ESTADUAL", 
  "LEGISLAÇÃO MUNICIPAL", "CMDCA", "CONSELHO TUTELAR", "PROTOCOLOS", 
  "FLUXOS DA REDE", "PLANOS MUNICIPAIS", "OUTROS"
];

const SPHERES = ["FEDERAL", "ESTADUAL", "MUNICIPAL", "OUTRO"];
const STATUSES = ["VIGENTE", "ALTERADA", "REVOGADA", "NÃO VERIFICADA"];

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker src for pdfjs
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function LegalLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSphere, setSelectedSphere] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  // Hook Reativo em Tempo Real para Biblioteca Jurídica
  const { 
    documents, 
    loading, 
    ultimaAtualizacao, 
    fromCache, 
    recarregarManual 
  } = useLegalLibraryRealtime({
    category: selectedCategory || undefined,
    sphere: selectedSphere || undefined,
    searchQuery: searchQuery || undefined
  });

  // Form for new document
  const [newDoc, setNewDoc] = useState<Partial<LegalDocument>>({
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    category: 'ECA',
    confidentiality: 'PÚBLICO',
    isPublic: true,
    subjects: [],
    keywords: [],
    relevantArticles: []
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(" ") + "\n";
        }
        text = fullText;
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        text = await file.text();
      }

      setNewDoc(prev => ({
        ...prev,
        content: text,
        name: prev.name || file.name.replace(/\.[^/.]+$/, "")
      }));
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Erro ao ler o arquivo. Tente extrair o texto manualmente.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const analyzeWithAI = async () => {
    if (!newDoc.content) {
      alert("Adicione o conteúdo do documento primeiro.");
      return;
    }

    setAnalyzingAI(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{
                text: `Analise o texto legal abaixo e extraia os seguintes metadados em formato JSON:
{
  "name": "Nome da norma",
  "type": "Tipo (Lei, Decreto, etc)",
  "number": "Número",
  "year": "Ano",
  "authority": "Órgão emissor",
  "summary": "Resumo/Ementa",
  "category": "Escolha uma: CONSTITUIÇÃO, CÓDIGOS, ECA, LEIS FEDERAIS, DECRETOS FEDERAIS, RESOLUÇÕES CONANDA, PORTARIAS, NORMAS TÉCNICAS, LEGISLAÇÃO EDUCACIONAL, LEGISLAÇÃO DE SAÚDE, SUS, SUAS, ASSISTÊNCIA SOCIAL, DEFICIÊNCIA, TEA, VIOLÊNCIA, VIOLÊNCIA DOMÉSTICA, VIOLÊNCIA SEXUAL, ESCUTA ESPECIALIZADA, DEPOIMENTO ESPECIAL, PRIMEIRA INFÂNCIA, FAMÍLIA, ADOÇÃO, ACOLHIMENTO, GUARDA, TUTELA, PODER FAMILIAR, TRABALHO INFANTIL, INTERNET E PROTEÇÃO DIGITAL, BULLYING, CYBERBULLYING, DIREITOS HUMANOS, LEGISLAÇÃO ESTADUAL, LEGISLAÇÃO MUNICIPAL, CMDCA, CONSELHO TUTELAR, PROTOCOLOS, FLUXOS DA REDE, PLANOS MUNICIPAIS, OUTROS",
  "sphere": "FEDERAL, ESTADUAL ou MUNICIPAL",
  "keywords": ["palavra1", "palavra2", ...],
  "subjects": ["assunto1", "assunto2", ...]
}

TEXTO:
${newDoc.content.substring(0, 10000)}`
              }]
            }
          ]
        })
      });

      const data = await response.json();
      let aiResult: any = {};
      try {
        const cleaned = (data.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
        aiResult = JSON.parse(cleaned);
      } catch {
        // Simple regex fallback
        const nameMatch = data.text?.match(/"name":\s*"([^"]+)"/);
        const typeMatch = data.text?.match(/"type":\s*"([^"]+)"/);
        const numberMatch = data.text?.match(/"number":\s*"([^"]+)"/);
        const yearMatch = data.text?.match(/"year":\s*"([^"]+)"/);
        const summaryMatch = data.text?.match(/"summary":\s*"([^"]+)"/);

        aiResult = {
          name: nameMatch?.[1] || newDoc.name,
          type: typeMatch?.[1] || 'Lei Federal',
          number: numberMatch?.[1] || '',
          year: yearMatch?.[1] || new Date().getFullYear().toString(),
          summary: summaryMatch?.[1] || (newDoc.content ? newDoc.content.substring(0, 300) + '...' : '')
        };
      }
      
      setNewDoc(prev => ({
        ...prev,
        ...aiResult
      }));
    } catch (error: any) {
      console.warn("Análise assistida por IA utilizou preenchimento automático local:", error?.message || error);
      if (newDoc.content && !newDoc.summary) {
        setNewDoc(prev => ({
          ...prev,
          summary: prev.content?.substring(0, 300) + '...'
        }));
      }
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await LegalLibraryService.addDocument(newDoc as any);
      setIsAddingDoc(false);
      setNewDoc({
        status: 'VIGENTE',
        sphere: 'FEDERAL',
        category: 'ECA',
        confidentiality: 'PÚBLICO',
        isPublic: true
      });
      recarregarManual();
    } catch (error) {
      console.error("Erro ao adicionar documento:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VIGENTE': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'ALTERADA': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'REVOGADA': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIGENTE': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'ALTERADA': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'REVOGADA': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  if (selectedDoc) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-4 border-b flex items-center gap-4 bg-slate-50">
          <button 
            onClick={() => setSelectedDoc(null)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedDoc.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(selectedDoc.status)}`}>
                {selectedDoc.status}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-medium">{selectedDoc.type} {selectedDoc.number}/{selectedDoc.year}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="col-span-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Ementa / Resumo</h3>
              <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                {selectedDoc.summary || "Sem ementa disponível."}
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Metadados</h3>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Esfera</span>
                    <span className="text-sm text-slate-700 font-medium">{selectedDoc.sphere}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Órgão/Autoridade</span>
                    <span className="text-sm text-slate-700 font-medium">{selectedDoc.authority || "N/A"}</span>
                  </div>
                  {selectedDoc.url && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Fonte Oficial</span>
                      <a 
                        href={selectedDoc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        Acessar Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Conteúdo da Norma</h3>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-800">
              {selectedDoc.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 shadow-sm z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Biblioteca Jurídica Viva</h1>
              <p className="text-sm text-slate-500 font-medium">Base de Conhecimento JARVIS — SGDCA & ECA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAddingDoc(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Documento
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Pesquisar artigos, leis, palavras-chave ou temas..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </form>
          <div className="flex gap-2">
            <select 
              className="px-4 py-3.5 bg-slate-100 border-none rounded-2xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer pr-10 relative"
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">Todas Categorias</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              className="px-4 py-3.5 bg-slate-100 border-none rounded-2xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer pr-10 relative"
              value={selectedSphere || ""}
              onChange={(e) => setSelectedSphere(e.target.value || null)}
            >
              <option value="">Esferas</option>
              {SPHERES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Consultando acervo jurídico...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Book className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum documento encontrado</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Não localizamos normas para os critérios informados. Experimente outros termos ou adicione novos documentos ao acervo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <motion.div 
                key={doc.id}
                layoutId={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer flex gap-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.sphere}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {doc.summary || "Sem resumo disponível."}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.keywords?.slice(0, 3).map(kw => (
                      <span key={kw} className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-lg uppercase tracking-wide">
                        {kw}
                      </span>
                    ))}
                    {doc.keywords && doc.keywords.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold">+{doc.keywords.length - 3}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      <AnimatePresence>
        {isAddingDoc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Cadastrar Nova Norma</h2>
                </div>
                <button 
                  onClick={() => setIsAddingDoc(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Search className="w-5 h-5 text-slate-400 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddDocument} className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Importar Arquivo (PDF/DOCX/TXT)</label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileUpload}
                          className="flex-1 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <button 
                          type="button"
                          onClick={analyzeWithAI}
                          disabled={!newDoc.content || loading}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" /> Analisar com IA
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Título da Norma</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Ex: Estatuto da Criança e do Adolescente"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={newDoc.name}
                        onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Ex: Lei Federal"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={newDoc.type}
                          onChange={(e) => setNewDoc({...newDoc, type: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Número/Ano</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 8.069/1990"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={newDoc.number}
                          onChange={(e) => setNewDoc({...newDoc, number: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={newDoc.category}
                          onChange={(e) => setNewDoc({...newDoc, category: e.target.value})}
                        >
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Esfera</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={newDoc.sphere}
                          onChange={(e) => setNewDoc({...newDoc, sphere: e.target.value as any})}
                        >
                          {SPHERES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={newDoc.status}
                          onChange={(e) => setNewDoc({...newDoc, status: e.target.value as any})}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">URL Oficial</label>
                        <input 
                          type="url" 
                          placeholder="https://..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={newDoc.url}
                          onChange={(e) => setNewDoc({...newDoc, url: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Resumo / Ementa</label>
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                        value={newDoc.summary}
                        onChange={(e) => setNewDoc({...newDoc, summary: e.target.value})}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Conteúdo Integral (Texto)</label>
                      <textarea 
                        required
                        rows={10}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-serif"
                        value={newDoc.content}
                        onChange={(e) => setNewDoc({...newDoc, content: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddingDoc(false)}
                    className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    Salvar Norma
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
