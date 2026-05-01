/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  History, 
  ChevronRight,
  ShieldCheck,
  Search,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzePdf, ValidationResult } from './lib/gemini.ts';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Por favor, selecione um arquivo PDF.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('Por favor, selecione um arquivo PDF.');
        return;
      }
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const analysisResult = await analyzePdf(base64);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na análise do documento.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Análise de Documentos de Crédito</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Módulo de Conformidade e-CAC</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center text-sm font-medium text-slate-600">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Motor de OCR Ativo (Gemini AI)
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">Ajuda</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Requirements */}
        <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Regras de Negócio</h2>
          
          <div className="space-y-8 flex-1">
            <section>
              <p className="text-[11px] font-black text-slate-800 mb-3 tracking-wider uppercase">Tipos Aceitos</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">ECD</span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">DAS</span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">DARF</span>
              </div>
            </section>

            <section>
              <p className="text-[11px] font-black text-slate-800 mb-3 tracking-wider uppercase">Códigos de Receita</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[2089, '0220', 3373, 5993, 2362, 2172, 2372, 6012, 2484, 2469, 5856, 6912].map(c => (
                  <span key={c} className="text-[9px] font-mono p-1.5 bg-slate-50 border border-slate-200 text-center rounded text-slate-600 leading-none">{c}</span>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium italic">+ códigos: 7987, 8109</p>
            </section>

            <section>
              <p className="text-[11px] font-black text-slate-800 mb-3 tracking-wider uppercase">Período de Validade</p>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  Últimos 03 meses retroativos à data atual (Competência Corrente).
                </p>
              </div>
            </section>

            <section>
              <p className="text-[11px] font-black text-slate-800 mb-3 tracking-wider uppercase">Autenticidade</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Documentos devem obrigatoriamente ser emitidos via portal <span className="font-bold text-slate-900 italic">e-CAC (Receita Federal)</span> com comprovante de quitação.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-8">
            <div className="flex items-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-400" />
              AES-256 Crypto Safe
            </div>
          </div>
        </aside>

        {/* Main Content: Dropzone and Results */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col bg-slate-50">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            {/* Dropzone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl min-h-[300px] flex flex-col items-center justify-center text-center p-8 transition-all relative overflow-hidden group ${
                file ? 'border-blue-400 bg-white' : 'border-slate-300 bg-white hover:border-blue-400'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all ${
                file ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600 group-hover:scale-110'
              }`}>
                {file ? <FileCheck2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
              </div>

              {file ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-xl font-bold text-slate-800">{file.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Pronto para processamento</p>
                  <div className="flex gap-3 justify-center mt-6">
                    <button 
                      onClick={processFile}
                      disabled={isAnalyzing}
                      className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {isAnalyzing ? 'Processando Documento...' : 'Validar Agora'}
                    </button>
                    <button 
                      onClick={() => setFile(null)}
                      className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all"
                    >
                      Trocar Arquivo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Seleção de Arquivo</h3>
                  <p className="text-slate-500 text-sm mt-2 mb-8 mx-auto max-w-sm">Arraste seus arquivos PDF aqui para análise técnica simultânea ou selecione manualmente.</p>
                  <label className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer">
                    Selecionar PDF
                    <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                  </label>
                </>
              )}
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Extraindo Metadados...</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Results Section */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pt-4 pb-20"
                >
                  <div className="flex justify-between items-end mb-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Relatório Técnico de Conformidade</h3>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      result.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      Status Final: {result.isValid ? 'Aprovado' : 'Rejeitado'}
                    </div>
                  </div>

                  {/* Main Status Hero */}
                  <div className={`bg-white border rounded-2xl p-6 shadow-sm flex items-center transition-all ${
                    result.isValid ? 'border-green-100' : 'border-red-100'
                  }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-6 shrink-0 ${
                      result.isValid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {result.isValid ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-800 mb-1">
                        {result.isValid ? 'Conformidade Verificada' : 'Inconsistência Detectada'}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium leading-normal">{result.explanation}</p>
                    </div>
                  </div>

                  {/* Criteria Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RequirementCard 
                      title="Análise Documental" 
                      subtitle={`Tipo: ${result.documentType}`}
                      met={result.requirementsMet.type}
                    />
                    <RequirementCard 
                      title="Enquadramento Fiscal" 
                      subtitle={`Código: ${result.foundCode || 'Não detectado'}`}
                      met={result.requirementsMet.code}
                    />
                    <RequirementCard 
                      title="Temporalidade" 
                      subtitle={`Ref: ${result.referenceDate || 'N/A'}`}
                      met={result.requirementsMet.date}
                    />
                    <RequirementCard 
                      title="Integridade e-CAC" 
                      subtitle="Autenticação Digital Ativa"
                      met={result.requirementsMet.origin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Summary footer */}
      <footer className="bg-slate-900 px-8 py-5 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center space-x-10">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Arquivos em Cache</span>
            <span className="text-lg font-black leading-none">01 Documento</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-700"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Integridade</span>
            <span className="text-lg font-black text-green-400 leading-none">100% Secure</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-colors uppercase tracking-widest">
            Exportar JSON
          </button>
          <button className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-bold text-xs transition-colors uppercase tracking-widest">
            Gerar Protocolo PDF
          </button>
        </div>
      </footer>
    </div>
  );
}

function RequirementCard({ title, subtitle, met }: { title: string, subtitle: string, met: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 shrink-0 transition-colors ${
        met ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      }`}>
        {met ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{title}</h4>
        <p className={`text-sm font-bold ${met ? 'text-slate-800' : 'text-red-500'}`}>{subtitle}</p>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
        met ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {met ? 'OK' : 'FAIL'}
      </span>
    </div>
  );
}
