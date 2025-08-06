export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
}

export interface StudioSession {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  type: 'studio' | 'product';
  name: string;
  price: number;
  quantity: number;
  details?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  };
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: 'cash' | 'qris' | 'transfer';
  paymentType: 'full' | 'dp';
  dpAmount?: number;
  remainingAmount?: number;
  customerName: string;
  customerPhone?: string;
  createdAt: string;
  createdBy: string;
}

export interface BookingStatus {
  id: string;
  transactionId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  status: 'on_process' | 'done';
  createdAt: string;
  updatedAt?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  clockIn: string;
  clockOut?: string;
  date: string;
}