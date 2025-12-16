import React, { useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { AlertTriangle, MapPin, Clock, AlertCircle, User, Hash, X, CheckCircle, ClipboardList, Save, CreditCard, Cpu, Wrench, Edit2 } from 'lucide-react';
import { TicketDetailsModal } from './TicketDetailsModal';

interface EscalationBoardProps {
  tickets: Ticket[];
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => void;
}

export const EscalationBoard: React.FC<EscalationBoardProps> = ({ tickets, onUpdateTicket }) => {
  // Filter active tickets: 
  // 1. Must be Critical OR High OR have 'Escalado' status
  // 2. Must NOT be Resolved
  const escalatedTickets = tickets.filter(t => {
    const isPriorityEscalation = t.priority === TicketPriority.CRITICAL || t.priority === TicketPriority.HIGH;
    const isStatusEscalation = t.status === 'Escalado' || t.status === TicketStatus.ESCALATED;
    const isResolved = t.status === TicketStatus.RESOLVED;
    
    return (isPriorityEscalation || isStatusEscalation) && !isResolved;
  });
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [validatingTicket, setValidatingTicket] = useState<Ticket | null>(null);
  
  // Validation State
  const [validationForm, setValidationForm] = useState({
    tag: '#VLDD#' as '#VLDD#' | '#NLVDD#',
    witnessName: '',
    witnessId: '',
    // Editable Action
    editedAnalystAction: '',
    // New Fields
    partReplaced: false,
    partName: '',
    cardTest: false,
    sicValidation: {
        saques: false,
        depositos: false,
        sensoriamento: false,
        smartpower: false
    }
  });

  // Open validation modal
  const handleOpenValidation = (ticket: Ticket) => {
    setValidatingTicket(ticket);
    setValidationForm({
      tag: ticket.tagNVLDD ? '#NLVDD#' : '#VLDD#',
      witnessName: ticket.customerWitnessName || '',
      witnessId: ticket.customerWitnessID || '',
      editedAnalystAction: ticket.analystAction || '', // Initialize with current action
      // Pre-fill based on ticket data where possible
      partReplaced: ticket.trocouPeca,
      partName: ticket.pecaTrocada || '',
      cardTest: false,
      sicValidation: {
          saques: false,
          depositos: false,
          sensoriamento: false,
          smartpower: false
      }
    });
  };

  // Generate Summary for Validation
  const generateValidationSummary = (ticket: Ticket, form: typeof validationForm) => {
    const sicItems = [];
    if (form.sicValidation.saques) sicItems.push('Saques');
    if (form.sicValidation.depositos) sicItems.push('Depósitos');
    if (form.sicValidation.sensoriamento) sicItems.push('Sensoriamento');
    if (form.sicValidation.smartpower) sicItems.push('Smartpower');
    const sicText = sicItems.length > 0 ? sicItems.join(', ') : 'Nenhum';

    return `RESUMO DE VALIDAÇÃO
--------------------------------
STATUS: ${form.tag}
CLIENTE: ${ticket.clientName}
LOCAL: ${ticket.locationName}
TASK: ${ticket.taskTicket}
DEFEITO RECLAMADO: ${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}
AÇÃO TÉCNICO: ${form.editedAnalystAction}

VALIDAÇÃO TÉCNICA:
- Houve Troca de Peça: ${form.partReplaced ? `Sim (${form.partName})` : 'Não'}
- Teste com Cartão: ${form.cardTest ? 'Sim' : 'Não'}

VALIDAÇÃO SIC:
- Itens validados: ${sicText}

VALIDADO POR: ${form.witnessName} (Matrícula: ${form.witnessId})
--------------------------------`.trim();
  };

  // Submit validation and close ticket
  const handleCloseTicket = () => {
    if (validatingTicket) {
      onUpdateTicket(validatingTicket.id, {
        tagVLDD: validationForm.tag === '#VLDD#',
        tagNVLDD: validationForm.tag === '#NLVDD#',
        customerWitnessName: validationForm.witnessName,
        customerWitnessID: validationForm.witnessId,
        analystAction: validationForm.editedAnalystAction, // Save the edited action
        status: TicketStatus.RESOLVED, // Close the ticket
        validatedBy: 'Sistema', // Auto-mark
        validatedAt: new Date().toISOString(), // Standard ISO format for consistency
      });
      setValidatingTicket(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-700 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8" />
          Escalonamento / Críticos
        </h2>
        <span className="px-4 py-1 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
          {escalatedTickets.length} Ativos
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {escalatedTickets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            <p>Nenhum chamado crítico ou escalado ativo no momento.</p>
          </div>
        ) : (
          escalatedTickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-lg border-l-4 border-l-red-500 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle className="w-24 h-24 text-red-600" />
              </div>
              
              <div className="p-5 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {ticket.priority}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight">{ticket.analystAction}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{ticket.description}</p>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 space-y-2">
                   <div className="flex justify-between">
                     <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-800">{ticket.locationName}</span>
                     </div>
                     <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        <Hash className="w-3 h-3" />
                        {ticket.taskTicket}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 text-slate-600 text-xs pt-1 border-t border-slate-200">
                     <User className="w-3 h-3" />
                     Analista: {ticket.analystName}
                   </div>
                </div>

                {ticket.tagVLDD || ticket.tagNVLDD ? (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                         <CheckCircle className="w-4 h-4 text-green-600" />
                         <div className="text-xs text-green-800">
                            <strong>Validado:</strong> {ticket.customerWitnessName}
                         </div>
                    </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                   <button 
                    onClick={() => handleOpenValidation(ticket)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-500/20"
                   >
                    Validar
                   </button>
                  
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Validation Modal */}
      {validatingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    Validação de Encerramento
                 </h3>
                 <button onClick={() => setValidatingTicket(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                 </button>
             </div>
             
             <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Ticket Info Block */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm space-y-2">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-slate-500 text-xs uppercase font-bold">Cliente</span>
                        <p className="font-semibold text-slate-800 truncate" title={validatingTicket.clientName}>{validatingTicket.clientName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase font-bold">Local</span>
                        <p className="font-semibold text-slate-800 truncate" title={validatingTicket.locationName}>{validatingTicket.locationName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase font-bold">Task</span>
                        <p className="font-semibold text-slate-800">{validatingTicket.taskTicket}</p>
                      </div>
                   </div>
                   <div className="border-t border-blue-200 pt-2 mt-2">
                      <span className="text-slate-500 text-xs uppercase font-bold">Defeito Reclamado</span>
                      <p className="text-slate-700 line-clamp-2">{validatingTicket.description}</p>
                   </div>
                   
                   {/* Editable Analyst Action */}
                   <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500 text-xs uppercase font-bold flex items-center gap-1">
                            Ação Técnico <Edit2 className="w-3 h-3 text-blue-500" />
                        </span>
                      </div>
                      <textarea
                        value={validationForm.editedAnalystAction}
                        onChange={(e) => setValidationForm(prev => ({...prev, editedAnalystAction: e.target.value}))}
                        className="w-full text-slate-800 text-sm bg-white border border-blue-200 rounded p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        rows={3}
                        placeholder="Edite a ação técnica se necessário..."
                      />
                   </div>
                </div>

                {/* Technical & SIC Validation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Technical Validation */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b pb-1">
                            <Wrench className="w-4 h-4 text-orange-500" /> Validação Técnica
                        </h4>
                        
                        {/* Troca de Peça */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Houve Troca de Peça?</label>
                            <div className="flex gap-4 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={validationForm.partReplaced}
                                        onChange={() => setValidationForm(prev => ({ ...prev, partReplaced: true }))}
                                        className="text-blue-600"
                                    />
                                    <span className="text-sm">Sim</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={!validationForm.partReplaced}
                                        onChange={() => setValidationForm(prev => ({ ...prev, partReplaced: false }))}
                                        className="text-blue-600"
                                    />
                                    <span className="text-sm">Não</span>
                                </label>
                            </div>
                            {validationForm.partReplaced && (
                                <input 
                                    type="text" 
                                    value={validationForm.partName}
                                    onChange={(e) => setValidationForm(prev => ({ ...prev, partName: e.target.value }))}
                                    placeholder="Qual peça?"
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            )}
                        </div>

                         {/* Teste Cartão */}
                         <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Teste com Cartão?</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={validationForm.cardTest}
                                        onChange={() => setValidationForm(prev => ({ ...prev, cardTest: true }))}
                                        className="text-blue-600"
                                    />
                                    <span className="text-sm">Sim</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        checked={!validationForm.cardTest}
                                        onChange={() => setValidationForm(prev => ({ ...prev, cardTest: false }))}
                                        className="text-blue-600"
                                    />
                                    <span className="text-sm">Não</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* SIC Validation */}
                    <div className="space-y-3">
                         <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b pb-1">
                            <Cpu className="w-4 h-4 text-purple-500" /> Validação SIC
                        </h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input 
                                    type="checkbox"
                                    checked={validationForm.sicValidation.saques}
                                    onChange={(e) => setValidationForm(prev => ({...prev, sicValidation: {...prev.sicValidation, saques: e.target.checked}}))}
                                    className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Saques</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input 
                                    type="checkbox"
                                    checked={validationForm.sicValidation.depositos}
                                    onChange={(e) => setValidationForm(prev => ({...prev, sicValidation: {...prev.sicValidation, depositos: e.target.checked}}))}
                                    className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Depósitos</span>
                            </label>
                             <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input 
                                    type="checkbox"
                                    checked={validationForm.sicValidation.sensoriamento}
                                    onChange={(e) => setValidationForm(prev => ({...prev, sicValidation: {...prev.sicValidation, sensoriamento: e.target.checked}}))}
                                    className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Sensoriamento</span>
                            </label>
                             <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input 
                                    type="checkbox"
                                    checked={validationForm.sicValidation.smartpower}
                                    onChange={(e) => setValidationForm(prev => ({...prev, sicValidation: {...prev.sicValidation, smartpower: e.target.checked}}))}
                                    className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Smartpower</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Final Confirmation Inputs */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tag de Validação</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${validationForm.tag === '#VLDD#' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                           <input 
                              type="radio" 
                              name="tag" 
                              checked={validationForm.tag === '#VLDD#'} 
                              onChange={() => setValidationForm(prev => ({ ...prev, tag: '#VLDD#' }))}
                              className="hidden"
                           />
                           <CheckCircle className="w-4 h-4" />
                           <span className="font-bold">#VLDD#</span>
                        </label>
                        <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${validationForm.tag === '#NLVDD#' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                           <input 
                              type="radio" 
                              name="tag" 
                              checked={validationForm.tag === '#NLVDD#'} 
                              onChange={() => setValidationForm(prev => ({ ...prev, tag: '#NLVDD#' }))}
                              className="hidden"
                           />
                           <X className="w-4 h-4" />
                           <span className="font-bold">#NLVDD#</span>
                        </label>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">Cliente que validou</label>
                         <input 
                           value={validationForm.witnessName}
                           onChange={(e) => setValidationForm(prev => ({ ...prev, witnessName: e.target.value }))}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                           placeholder="Nome completo"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">Matrícula</label>
                         <input 
                           value={validationForm.witnessId}
                           onChange={(e) => setValidationForm(prev => ({ ...prev, witnessId: e.target.value }))}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                           placeholder="ID / Matrícula"
                         />
                      </div>
                   </div>
                </div>

                {/* Summary */}
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Resumo Gerado</label>
                   <textarea 
                      readOnly
                      rows={8}
                      className="w-full bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs resize-none"
                      value={generateValidationSummary(validatingTicket, validationForm)}
                   />
                </div>

             </div>

             <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end rounded-b-xl">
                 <button onClick={() => setValidatingTicket(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                    Cancelar
                 </button>
                 <button 
                    onClick={handleCloseTicket}
                    disabled={!validationForm.witnessName || !validationForm.witnessId}
                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                 >
                    <Save className="w-4 h-4" />
                    Fechar Chamado
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Full Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
};