import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PhoneIncoming, 
  AlertOctagon, 
  History, 
  Menu, 
  X,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  WifiOff,
  Database
} from 'lucide-react';
import { Ticket, TicketStatus, TicketPriority, SubjectCode } from './types';
import { TicketForm } from './components/TicketForm';
import { StatsCard } from './components/StatsCard';
import { EscalationBoard } from './components/EscalationBoard';
import { TicketDetailsModal } from './components/TicketDetailsModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from './services/supabaseClient';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-ticket' | 'escalation' | 'history'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Supabase Integration ---

  // 1. Fetch Tickets
  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      if (data) {
        setTickets(data as Ticket[]);
      }
    } catch (err: any) {
      console.error('Erro detalhado ao buscar chamados:', JSON.stringify(err, null, 2));
      
      let msg = err.message || 'Erro desconhecido.';
      if (err.code === '42P01') {
        msg = 'Tabela "tickets" não encontrada. Verifique se você rodou o script SQL no Painel do Supabase.';
      } else if (err.code === 'PGRST301') {
        msg = 'Erro de permissão (RLS). Crie uma Policy no Supabase para permitir acesso.';
      } else if (msg === 'Failed to fetch') {
        msg = 'Falha de conexão. Verifique se a URL do Supabase no .env está correta.';
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchTickets();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // 2. Create Ticket
  const handleCreateTicket = async (newTicketData: Omit<Ticket, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    
    // Clean payload
    const payload = {
       ...newTicketData,
    };

    try {
      const { error } = await supabase
        .from('tickets')
        .insert([payload]);

      if (error) throw error;
      
      await fetchTickets(); // Refresh list
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Erro ao criar chamado:', err);
      alert(`Falha ao salvar: ${err.message || 'Erro desconhecido'}`);
      setIsLoading(false);
    }
  };

  // 3. Update Ticket
  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      // Optimistic update
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

      // Remove id from updates
      const { id: _, createdAt: __, ...cleanUpdates } = updates as any;

      const { error } = await supabase
        .from('tickets')
        .update(cleanUpdates)
        .eq('id', id);

      if (error) throw error;

    } catch (err: any) {
      console.error('Erro ao atualizar chamado:', err);
      alert(`Falha ao atualizar registro: ${err.message}`);
      fetchTickets(); // Revert
    }
  };

  const handleRefresh = () => {
    fetchTickets();
  };

  // --- Derived State for Stats ---
  const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN).length;
  const escalatedCount = tickets.filter(t => t.priority === TicketPriority.CRITICAL || t.priority === TicketPriority.HIGH || t.status === TicketStatus.ESCALATED).length;
  
  const resolvedToday = tickets.filter(t => {
    if (t.status !== TicketStatus.RESOLVED) return false;
    const ticketDate = new Date(t.createdAt);
    const today = new Date();
    return ticketDate.getDate() === today.getDate() &&
           ticketDate.getMonth() === today.getMonth() &&
           ticketDate.getFullYear() === today.getFullYear();
  }).length;
  
  // Data for Chart
  const subjectDataMap = new Map<string, number>();
  tickets.forEach(t => {
    const code = t.subjectCode.split(' - ')[0]; 
    subjectDataMap.set(code, (subjectDataMap.get(code) || 0) + 1);
  });

  const subjectData = Array.from(subjectDataMap.entries()).map(([name, count]) => ({ name, count }));

  const filteredTickets = tickets.filter(t => 
    t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.analystAction && t.analystAction.toLowerCase().includes(searchTerm.toLowerCase())) ||
    t.taskTicket.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <PhoneIncoming className="w-5 h-5 text-white" />
            </div>
            Diário<span className="text-blue-400"> de Bordo</span>
          </h1>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button 
             onClick={() => { setActiveTab('new-ticket'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'new-ticket' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Novo Chamado</span>
          </button>

          <button 
             onClick={() => { setActiveTab('escalation'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'escalation' ? 'bg-red-600/20 text-red-400 border border-red-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <AlertOctagon className="w-5 h-5" />
            <div className="flex-1 text-left">Escalonados</div>
            {escalatedCount > 0 && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{escalatedCount}</span>}
          </button>

          <button 
             onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <History className="w-5 h-5" />
            <span>Histórico</span>
          </button>
        </nav>
        
        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800 space-y-4">
           <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors w-full"
           >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar Dados
           </button>
           <div className="flex items-center gap-3 pt-2">
             <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
               <Database className="w-5 h-5" />
             </div>
             <div>
               <p className="text-sm font-semibold text-white">Supabase</p>
               <p className="text-xs text-slate-400">PostgreSQL</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:justify-end flex-shrink-0">
          <button onClick={toggleSidebar} className="md:hidden text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
             {isLoading && (
               <div className="flex items-center gap-2 text-xs text-blue-600 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Carregando...
               </div>
             )}
             <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar ticket, ação ou task..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                />
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {error ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <WifiOff className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Erro de Conexão</h3>
                <p className="text-center max-w-md text-sm mb-6">{error}</p>
                <div className="flex gap-2">
                   <button 
                    onClick={fetchTickets}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar Novamente
                  </button>
                </div>
            </div>
          ) : isLoading && tickets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
               <p>Conectando ao Supabase...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard 
                      title="Chamados Abertos" 
                      value={openTickets} 
                      icon={PhoneIncoming} 
                      color="bg-blue-500" 
                      trend="+12% Hoje"
                    />
                    <StatsCard 
                      title="Escalados / Críticos" 
                      value={escalatedCount} 
                      icon={AlertOctagon} 
                      color="bg-red-500" 
                      trend={escalatedCount > 0 ? "Ação Necessária" : "Estável"}
                    />
                     <StatsCard 
                      title="Resolvidos Hoje" 
                      value={resolvedToday} 
                      icon={History} 
                      color="bg-green-500" 
                    />
                    <StatsCard 
                       title="Tempo Médio" 
                       value="14m" 
                       icon={History} 
                       color="bg-purple-500"
                       trend="-2m vs Ontem"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-6">Volume por Código de Assunto</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subjectData}>
                            <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                            <YAxis fontSize={12} stroke="#94a3b8" />
                            <Tooltip 
                              cursor={{fill: '#f1f5f9'}}
                              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                               {subjectData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f59e0b'][index % 5]} />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recent Activity Mini List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Recentes</h3>
                      <div className="space-y-4">
                        {tickets.slice(0, 4).map(t => (
                          <div key={t.id} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${t.priority === 'Crítica' ? 'bg-red-500' : 'bg-blue-500'}`} />
                            <div>
                              <p className="text-sm font-medium text-slate-800 line-clamp-1">{t.analystAction}</p>
                              <p className="text-xs text-slate-500">{t.clientName} • {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'new-ticket' && (
                <div className="animate-in slide-in-from-right-10 duration-300">
                  <TicketForm 
                    onSubmit={handleCreateTicket} 
                    onCancel={() => setActiveTab('dashboard')} 
                  />
                </div>
              )}

              {activeTab === 'escalation' && (
                <div className="animate-in fade-in duration-500">
                  <EscalationBoard tickets={tickets} onUpdateTicket={handleUpdateTicket} />
                </div>
              )}

              {activeTab === 'history' && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-800">Histórico de Atendimentos</h2>
                      <button className="text-slate-500 hover:text-blue-600">
                        <Filter className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                          <tr>
                            <th className="px-6 py-4">Task / SR</th>
                            <th className="px-6 py-4">Local / Cliente</th>
                            <th className="px-6 py-4">Ação Analista</th>
                            <th className="px-6 py-4">Assunto</th>
                            <th className="px-6 py-4">Prioridade</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">{ticket.taskTicket}</span>
                                  <span className="text-xs text-slate-400">{ticket.serviceRequest}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{ticket.locationName}</span>
                                  <span className="text-xs text-slate-500">{ticket.clientName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 max-w-xs truncate" title={ticket.analystAction}>
                                 {ticket.analystAction}
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200 whitespace-nowrap">
                                  {ticket.subjectCode.split(' - ')[0]}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-bold ${ticket.priority === 'Crítica' ? 'text-red-600' : ticket.priority === 'Alta' ? 'text-orange-500' : 'text-blue-600'}`}>
                                  {ticket.priority}
                                </span>
                              </td>
                               <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                  ${ticket.status === 'Aberto' ? 'bg-green-100 text-green-700' : 
                                    ticket.status === 'Escalado' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => setSelectedTicket(ticket)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline cursor-pointer"
                                >
                                  Ver
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              )}
            </>
          )}
        </div>
        
        {/* Details Modal */}
        {selectedTicket && (
          <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        )}
      </main>
    </div>
  );
}

export default App;