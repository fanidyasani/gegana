import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Only throw error in production or when actually trying to use Supabase
const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          name: string;
          role: 'admin' | 'staff';
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          name: string;
          role: 'admin' | 'staff';
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          name?: string;
          role?: 'admin' | 'staff';
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          total: number;
          amount_paid: number;
          change_amount: number;
          payment_method: 'cash' | 'qris' | 'transfer';
          payment_type: 'full' | 'dp';
          dp_amount: number | null;
          remaining_amount: number | null;
          customer_name: string;
          customer_phone: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total: number;
          amount_paid: number;
          change_amount: number;
          payment_method: 'cash' | 'qris' | 'transfer';
          payment_type: 'full' | 'dp';
          dp_amount?: number | null;
          remaining_amount?: number | null;
          customer_name: string;
          customer_phone?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total?: number;
          amount_paid?: number;
          change_amount?: number;
          payment_method?: 'cash' | 'qris' | 'transfer';
          payment_type?: 'full' | 'dp';
          dp_amount?: number | null;
          remaining_amount?: number | null;
          customer_name?: string;
          customer_phone?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          item_type: 'studio' | 'product';
          name: string;
          price: number;
          quantity: number;
          details: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          item_type: 'studio' | 'product';
          name: string;
          price: number;
          quantity: number;
          details?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          item_type?: 'studio' | 'product';
          name?: string;
          price?: number;
          quantity?: number;
          details?: any | null;
          created_at?: string;
        };
      };
      booking_statuses: {
        Row: {
          id: string;
          transaction_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          customer_name: string;
          customer_phone: string | null;
          notes: string | null;
          status: 'on_process' | 'done';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          customer_name: string;
          customer_phone?: string | null;
          notes?: string | null;
          status?: 'on_process' | 'done';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          customer_name?: string;
          customer_phone?: string | null;
          notes?: string | null;
          status?: 'on_process' | 'done';
          created_at?: string;
          updated_at?: string;
        };
      };
      attendances: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          clock_in: string;
          clock_out: string | null;
          attendance_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          clock_in: string;
          clock_out?: string | null;
          attendance_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string;
          clock_in?: string;
          clock_out?: string | null;
          attendance_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}