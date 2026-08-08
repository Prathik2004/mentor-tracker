export interface Student {
  _id: string;
  name: string;
  age?: number;
  course?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRecord {
  _id: string;
  date: string;
  studentId: Student | string | null;
  classType: ClassType;
  status: ClassStatus;
  schedulingType: SchedulingType;
  paymentAmount: number;
  paymentRuleSnapshot: {
    classType: string;
    status: string;
    amount: number;
    ruleId: string;
  } | null;
  classMonth: string;
  paymentMonth: string;
  paymentWindowStart: string;
  paymentWindowEnd: string;
  notes?: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ClassType = 'regular' | 'demo' | 'substitute' | 'ptm';
export type ClassStatus = 'completed' | 'student_no_show' | 'cancelled' | 'rescheduled';
export type SchedulingType = 'scheduled' | 'on_spot';
export type PaymentStatus = 'pending' | 'received' | 'partially_received' | 'disputed';

export interface Incentive {
  _id: string;
  date: string;
  type: string;
  description?: string;
  amount: number;
  month: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  earningMonth: string;
  expectedAmount: number;
  receivedAmount: number | null;
  expectedWindowStart: string;
  expectedWindowEnd: string;
  receivedDate: string | null;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRule {
  _id: string;
  classType: ClassType;
  status: 'completed' | 'student_no_show';
  amount: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface IncentiveType {
  _id: string;
  name: string;
  isDefault: boolean;
}

export interface DashboardStats {
  totalEarned: number;
  classEarnings: number;
  incentiveEarnings: number;
  totalClasses: number;
  uniqueStudents: number;
  avgPerClass: number;
  classBreakdown: Record<string, number>;
  earningsBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  schedulingBreakdown: Record<string, number>;
  recentClasses: ClassRecord[];
  todayClasses: ClassRecord[];
  todayEarnings: number;
  paymentInfo: Payment | null;
  weekStats: {
    classes: number;
    earnings: number;
    students: number;
    prevClasses: number;
    prevEarnings: number;
    prevStudents: number;
  };
  topStudents: Array<{ _id: string; name: string; count: number; earnings: number }>;
}

export interface MonthlyHistory {
  month: string;
  classEarnings: number;
  incentiveEarnings: number;
  totalEarned: number;
  classCount: number;
}

export interface ClassesResponse {
  classes: ClassRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateClassInput {
  date: string;
  studentId: string | null;
  classType: ClassType;
  status: ClassStatus;
  schedulingType: SchedulingType;
  notes?: string;
  confirmDuplicate?: boolean;
}

export interface CreateStudentInput {
  name: string;
  age?: number;
  course?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

export interface CreateIncentiveInput {
  date: string;
  type: string;
  description?: string;
  amount: number;
  month: string;
  notes?: string;
}

export interface UpdatePaymentInput {
  receivedAmount?: number | null;
  receivedDate?: string | null;
  status?: PaymentStatus;
  notes?: string;
}

export interface ClassFilters {
  month?: string;
  classType?: ClassType;
  status?: ClassStatus;
  schedulingType?: SchedulingType;
  studentId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  regular: 'Regular',
  demo: 'Demo',
  substitute: 'Substitute',
  ptm: 'PTM',
};

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  completed: 'Completed',
  student_no_show: 'Student No-show',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

export const SCHEDULING_TYPE_LABELS: Record<SchedulingType, string> = {
  scheduled: 'Scheduled',
  on_spot: 'On-spot',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  received: 'Received',
  partially_received: 'Partially Received',
  disputed: 'Disputed',
};

export const CLASS_TYPE_COLORS: Record<ClassType, string> = {
  regular: '#3b82f6',
  demo: '#8b5cf6',
  substitute: '#f59e0b',
  ptm: '#10b981',
};
