export enum TicketStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Atendimento',
  RESOLVED = 'Resolvido',
  ESCALATED = 'Escalado'
}

export enum TicketPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export enum SubjectCode {
  CODE_1100 = '1100 - Codigo',
  CODE_1101 = '1101 - Codigo de peças',
  CODE_1102 = '1102 - Codigo de midia',
  CODE_1200 = '1200 - Duvida técnica',
  CODE_1201 = '1201 - Interpretação defeito',
  CODE_1202 = '1202 - Testes perifericos',
  CODE_1203 = '1203 - Sistema de ensinamento',
  CODE_1204 = '1204 - Status sensores',
  CODE_1205 = '1205 - Diag não carrega',
  CODE_1206 = '1206 - Erro de HW',
  CODE_1207 = '1207 - Duvida em configuração'
}

export interface Ticket {
  id: string;
  clientName: string;
  analystName: string;
  supportStartTime: string;
  supportEndTime: string;
  locationName: string;
  taskTicket: string;
  serviceRequest: string;
  
  subjectCode: SubjectCode;
  analystAction: string;
  description: string;
  
  // Checklist Fields
  ligacaoDevida: boolean;
  utilizouACFS: boolean;
  ocorreuEntintamento: boolean;
  trocouPeca: boolean;
  pecaTrocada?: string;

  // New Tags
  tagVLDD: boolean;
  tagNVLDD: boolean;

  // New Witness Info
  customerWitnessName: string;
  customerWitnessID: string;

  // Validation Info
  validatedBy?: string;
  validatedAt?: string;

  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  aiAnalysis?: string;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  escalatedTickets: number;
  avgResolutionTime: string;
}