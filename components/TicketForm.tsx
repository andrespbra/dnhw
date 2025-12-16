import React, { useState, useEffect } from 'react';
import { Ticket, TicketPriority, TicketStatus, SubjectCode } from '../types';
import { analyzeTicketContent } from '../services/geminiService';
import { Bot, Save, Loader2, Wand2, Copy, Check, ClipboardList, UserCheck, AlertCircle } from 'lucide-react';

interface TicketFormProps {
  onSubmit: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    analystName: '',
    supportStartTime: '',
    supportEndTime: '',
    locationName: '',
    taskTicket: '',
    serviceRequest: '',
    
    description: '',
    subjectCode: SubjectCode.CODE_1200,
    analystAction: '',

    // Checklist
    ligacaoDevida: false,
    utilizouACFS: false,
    ocorreuEntintamento: false,
    trocouPeca: false,
    pecaTrocada: '',
    
    // Tags
    tagVLDD: false,
    tagNVLDD: false,

    // Witness
    customerWitnessName: '',
    customerWitnessID: '',
    
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.OPEN
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Set default times on mount
  useEffect(() => {
    const now = new Date();
    const formatted = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setFormData(prev => ({ 
      ...prev, 
      supportStartTime: formatted,
      supportEndTime: formatted 
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleAIAnalyze = async () => {
    if (!formData.description || !formData.clientName) return;
    
    setIsAnalyzing(true);
    setAiError(null);
    setAiAnalysis(null);

    try {
      const result = await analyzeTicketContent(formData.description, formData.clientName);
      
      setFormData(prev => ({
        ...prev,
        priority: result.priority,
        subjectCode: result.subjectCode,
        analystAction: prev.analystAction || result.analystAction, // Only fill if empty to allow user notes
      }));
      setAiAnalysis(result.suggestedNextStep);
    } catch (error) {
      console.error(error);
      setAiError("Não foi possível conectar com a IA. Verifique sua conexão ou preencha manualmente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      aiAnalysis: aiAnalysis || undefined
    });
  };

  // Generate Summary Text
  const generateSummary = () => {
    let tags = '';
    if (formData.tagVLDD) tags += '#VLDD# ';
    if (formData.tagNVLDD) tags += '#NVLDD# ';

    return `*RESUMO DO ATENDIMENTO*
--------------------------
*Analista:* ${formData.analystName}
*Cliente:* ${formData.clientName}
*Local:* ${formData.locationName}
*Task:* ${formData.taskTicket} | *SR:* ${formData.serviceRequest}
*Início:* ${formData.supportStartTime.replace('T', ' ')} | *Fim:* ${formData.supportEndTime.replace('T', ' ')}
--------------------------
*Assunto:* ${formData.subjectCode}
*Prioridade:* ${formData.priority}
*Tags:* ${tags}

*Acompanhamento:*
Nome: ${formData.customerWitnessName} | Matrícula: ${formData.customerWitnessID}

*Relato do Problema:*
${formData.description}

*Ação do Analista:*
${formData.analystAction}

*Checklist:*
- Ligação Devida: ${formData.ligacaoDevida ? 'Sim' : 'Não'}
- ACFS Utilizado: ${formData.utilizouACFS ? 'Sim' : 'Não'}
- Entintamento: ${formData.ocorreuEntintamento ? 'Sim' : 'Não'}
- Troca de Peça: ${formData.trocouPeca ? `Sim (${formData.pecaTrocada})` : 'Não'}
--------------------------`.trim();
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
          Novo Atendimento
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm">
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Row 1: Analyst & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Analista</label>
            <input
              required
              name="analystName"
              value={formData.analystName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              placeholder="Nome do analista"
            />
          </div>
           <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Início do Suporte</label>
            <input
              type="datetime-local"
              required
              name="supportStartTime"
              value={formData.supportStartTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Final do Suporte</label>
            <input
              type="datetime-local"
              required
              name="supportEndTime"
              value={formData.supportEndTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            />
          </div>
        </div>

        {/* Row 2: Client & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Cliente (Solicitante)</label>
            <input
              required
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Nome do solicitante"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome do Local</label>
            <input
              required
              name="locationName"
              value={formData.locationName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Unidade / Loja / Filial"
            />
          </div>
        </div>

        {/* Row 3: Witness Info & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="space-y-2">
             <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-bold text-blue-800">Acompanhamento no Local</label>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <input
                name="customerWitnessName"
                value={formData.customerWitnessName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Nome Cliente"
              />
               <input
                name="customerWitnessID"
                value={formData.customerWitnessID}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Matrícula"
              />
             </div>
          </div>
          <div className="space-y-2">
             <label className="text-sm font-bold text-blue-800 mb-2 block">Tags de Validação</label>
             <div className="flex gap-4 mt-2">
                 <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-400">
                    <input type="checkbox" name="tagVLDD" checked={formData.tagVLDD} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-slate-700 font-medium">#VLDD#</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-400">
                    <input type="checkbox" name="tagNVLDD" checked={formData.tagNVLDD} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-slate-700 font-medium">#NLVDD#</span>
                 </label>
             </div>
          </div>
        </div>

        {/* Row 4: Task & SR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Task / Chamado</label>
            <input
              required
              name="taskTicket"
              value={formData.taskTicket}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Número da Task ou Chamado"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">SR (Service Request)</label>
            <input
              required
              name="serviceRequest"
              value={formData.serviceRequest}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Código SR"
            />
          </div>
        </div>

        {/* Problem Description Area */}
        <div className="space-y-2 relative">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-700">Relato do Problema</label>
            <button
              type="button"
              onClick={handleAIAnalyze}
              disabled={isAnalyzing || !formData.description}
              className="text-xs flex items-center gap-1 text-purple-600 font-medium hover:text-purple-700 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Analisar com IA
            </button>
          </div>
          <textarea
            required
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
            placeholder="Descreva o problema relatado pelo cliente..."
          />
          
          {aiError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>{aiError}</div>
            </div>
          )}

          {aiAnalysis && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-800 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Próximo Passo Sugerido (IA):</strong> {aiAnalysis}
              </div>
            </div>
          )}
        </div>

        {/* Row 5: Subject Code & Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Assunto (Subject)</label>
            <select
              name="subjectCode"
              value={formData.subjectCode}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {Object.values(SubjectCode).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            {/* Checklist Section */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                 <ClipboardList className="w-4 h-4" />
                 Checklist de Atendimento
              </h3>
              
              <div className="flex flex-wrap gap-4">
                 <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300">
                    <input type="checkbox" name="ligacaoDevida" checked={formData.ligacaoDevida} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Ligação Devida</span>
                 </label>
                 
                 <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300">
                    <input type="checkbox" name="utilizouACFS" checked={formData.utilizouACFS} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Utilizou ACFS</span>
                 </label>

                 <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300">
                    <input type="checkbox" name="ocorreuEntintamento" checked={formData.ocorreuEntintamento} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Ocorreu Entintamento</span>
                 </label>
              </div>

              <div className="flex items-start gap-4 mt-2">
                 <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 h-[42px]">
                    <input type="checkbox" name="trocouPeca" checked={formData.trocouPeca} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Foi trocado Peça?</span>
                 </label>
                 {formData.trocouPeca && (
                   <div className="flex-1 animate-in fade-in slide-in-from-left-2">
                     <input
                        name="pecaTrocada"
                        value={formData.pecaTrocada}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Qual peça foi trocada?"
                      />
                   </div>
                 )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ação Analista</label>
            <textarea
              required
              name="analystAction"
              rows={4}
              value={formData.analystAction}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Descreva a ação técnica realizada..."
            />
          </div>
        </div>

        {/* Row 6: Priority & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Prioridade</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
               {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">Status Inicial</label>
             <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
               {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Summary Section */}
        <div className="border-t border-slate-200 pt-6 mt-6">
           <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Resumo para Registro</label>
              <button 
                type="button" 
                onClick={handleCopySummary}
                className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar Resumo'}
              </button>
           </div>
           <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap border border-slate-800">
             {generateSummary()}
           </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Registrar Chamado
          </button>
        </div>
      </form>
    </div>
  );
};