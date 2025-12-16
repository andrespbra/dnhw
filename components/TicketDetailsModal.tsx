import React from 'react';
import { Ticket } from '../types';
import { AlertCircle, X } from 'lucide-react';

interface TicketDetailsModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
           {/* Modal Header */}
           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${ticket.priority === 'Crítica' || ticket.priority === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <AlertCircle className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">{ticket.taskTicket}</h2>
                    <p className="text-xs text-slate-500">SR: {ticket.serviceRequest}</p>
                 </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200 rounded-full transition-colors">
                 <X className="w-6 h-6" />
              </button>
           </div>

           {/* Modal Content - Scrollable */}
           <div className="p-6 overflow-y-auto space-y-6">
              {/* Status Bar */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-700 border border-slate-200">{ticket.status}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-700 border border-slate-200">{ticket.subjectCode.split(' - ')[0]}</span>
                  {ticket.tagVLDD && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">#VLDD#</span>}
                  {ticket.tagNVLDD && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200">#NLVDD#</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Left Column */}
                 <div className="space-y-6">
                    <div>
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informações do Local</h4>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="mb-2">
                             <p className="text-xs text-slate-500">Local</p>
                             <p className="font-semibold text-slate-800">{ticket.locationName}</p>
                          </div>
                          <div className="mb-2">
                             <p className="text-xs text-slate-500">Solicitante</p>
                             <p className="font-semibold text-slate-800">{ticket.clientName}</p>
                          </div>
                          {(ticket.customerWitnessName || ticket.customerWitnessID) && (
                            <div className="pt-2 mt-2 border-t border-slate-200">
                               <p className="text-xs text-slate-500">Acompanhante</p>
                               <p className="font-medium text-slate-800 text-sm">
                                 {ticket.customerWitnessName} <span className="text-slate-400">({ticket.customerWitnessID})</span>
                               </p>
                            </div>
                          )}
                       </div>
                    </div>

                    <div>
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Relato</h4>
                       <p className="text-slate-700 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                          {ticket.description}
                       </p>
                    </div>
                 </div>

                 {/* Right Column */}
                 <div className="space-y-6">
                    <div>
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados Técnicos</h4>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                             <span className="text-sm text-slate-600">Analista</span>
                             <span className="text-sm font-semibold text-slate-900">{ticket.analystName}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                             <span className="text-sm text-slate-600">Início</span>
                             <span className="text-sm font-semibold text-slate-900">{new Date(ticket.supportStartTime).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-sm text-slate-600">Fim</span>
                             <span className="text-sm font-semibold text-slate-900">{new Date(ticket.supportEndTime).toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Checklist</h4>
                        <div className="grid grid-cols-2 gap-3">
                           <div className={`p-3 rounded-lg border text-center ${ticket.ligacaoDevida ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                              <p className="text-xs font-bold">Ligação Devida</p>
                              <p>{ticket.ligacaoDevida ? 'Sim' : 'Não'}</p>
                           </div>
                           <div className={`p-3 rounded-lg border text-center ${ticket.utilizouACFS ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              <p className="text-xs font-bold">ACFS</p>
                              <p>{ticket.utilizouACFS ? 'Sim' : 'Não'}</p>
                           </div>
                           <div className={`p-3 rounded-lg border text-center ${ticket.ocorreuEntintamento ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              <p className="text-xs font-bold">Entintamento</p>
                              <p>{ticket.ocorreuEntintamento ? 'Sim' : 'Não'}</p>
                           </div>
                           <div className={`p-3 rounded-lg border text-center ${ticket.trocouPeca ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              <p className="text-xs font-bold">Troca Peça</p>
                              <p>{ticket.trocouPeca ? 'Sim' : 'Não'}</p>
                           </div>
                        </div>
                        {ticket.pecaTrocada && (
                            <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-100">
                               Peça: {ticket.pecaTrocada}
                            </div>
                        )}
                    </div>
                 </div>
              </div>

              {/* Footer Action */}
              <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ação do Analista</h4>
                  <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-sm whitespace-pre-wrap border border-slate-800 shadow-inner">
                     {ticket.analystAction}
                  </div>
              </div>
           </div>
           
           <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
              >
                 Fechar
              </button>
           </div>
        </div>
    </div>
  );
};