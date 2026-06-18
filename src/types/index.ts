export type Role = "ADMIN" | "MANAGER" | "SALES_USER";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "CONVERTED";
export type LeadSource = "WEBSITE" | "FACEBOOK" | "GOOGLE_ADS" | "REFERRAL" | "MANUAL";
export type DealStage = "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  status: LeadStatus;
  source: LeadSource;
  value?: number | null;
  notes?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdById: string;
  createdBy?: User;
  companyId?: string | null;
  companyRel?: Company | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdById: string;
  createdBy?: User;
  companyId?: string | null;
  companyRel?: Company | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  address?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts?: number;
    deals?: number;
    leads?: number;
  };
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate?: string | null;
  notes?: string | null;
  order: number;
  contactId?: string | null;
  contact?: Contact | null;
  companyId?: string | null;
  company?: Company | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdById: string;
  createdBy?: User;
  leadId?: string | null;
  lead?: Lead | null;
  contactId?: string | null;
  contact?: Contact | null;
  dealId?: string | null;
  deal?: Deal | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  leadId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  user?: User;
  leadId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  taskId?: string | null;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  subject: string;
  message: string;
  recipient: string;
  sentAt: string;
  leadId?: string | null;
  contactId?: string | null;
  createdById: string;
  createdBy?: User;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalLeads: number;
  totalContacts: number;
  totalDeals: number;
  totalRevenue: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  newLeadsThisMonth: number;
  dealsClosedThisMonth: number;
  revenueThisMonth: number;
  monthlyLeads: { month: string; count: number }[];
  monthlyDeals: { month: string; count: number; revenue: number }[];
  dealsByStage: { stage: string; count: number; value: number }[];
  recentActivities: Activity[];
  upcomingTasks: Task[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}
