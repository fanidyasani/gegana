import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, BookingStatus, Attendance } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<BookingStatus[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load transactions with items
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Transform data to match our types
      const transformedTransactions: Transaction[] = transactionsData?.map(t => ({
        id: t.id,
        items: t.transaction_items.map((item: any) => ({
          id: item.id,
          type: item.item_type,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          details: item.details
        })),
        total: t.total,
        amountPaid: t.amount_paid,
        change: t.change_amount,
        paymentMethod: t.payment_method,
        paymentType: t.payment_type,
        dpAmount: t.dp_amount,
        remainingAmount: t.remaining_amount,
        customerName: t.customer_name,
        customerPhone: t.customer_phone,
        createdAt: t.created_at,
        createdBy: t.created_by || 'Unknown'
      })) || [];

      setTransactions(transformedTransactions);

      // Load booking statuses
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('booking_statuses')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const transformedBookings: BookingStatus[] = bookingsData?.map(b => ({
        id: b.id,
        transactionId: b.transaction_id,
        date: b.booking_date,
        startTime: b.start_time,
        endTime: b.end_time,
        customerName: b.customer_name,
        customerPhone: b.customer_phone,
        notes: b.notes,
        status: b.status,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      })) || [];

      setBookingStatuses(transformedBookings);

      // Load attendances
      const { data: attendancesData, error: attendancesError } = await supabase
        .from('attendances')
        .select('*')
        .order('created_at', { ascending: false });

      if (attendancesError) throw attendancesError;

      const transformedAttendances: Attendance[] = attendancesData?.map(a => ({
        id: a.id,
        userId: a.user_id,
        userName: a.user_name,
        clockIn: a.clock_in,
        clockOut: a.clock_out,
        date: a.attendance_date
      })) || [];

      setAttendances(transformedAttendances);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from database');
    } finally {
      setLoading(false);
    }
  };

  // Save transaction to Supabase
  const saveTransaction = async (transaction: Transaction) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Insert transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: transaction.id,
          total: transaction.total,
          amount_paid: transaction.amountPaid,
          change_amount: transaction.change,
          payment_method: transaction.paymentMethod,
          payment_type: transaction.paymentType,
          dp_amount: transaction.dpAmount,
          remaining_amount: transaction.remainingAmount,
          customer_name: transaction.customerName,
          customer_phone: transaction.customerPhone,
          created_by: user.id
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Insert transaction items
      const itemsToInsert = transaction.items.map(item => ({
        transaction_id: transaction.id,
        item_type: item.type,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        details: item.details
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Insert booking statuses for studio items
      const studioItems = transaction.items.filter(item => item.type === 'studio');
      if (studioItems.length > 0) {
        const bookingsToInsert = studioItems.map(item => ({
          transaction_id: transaction.id,
          booking_date: item.details?.date,
          start_time: item.details?.startTime,
          end_time: item.details?.endTime,
          customer_name: item.details?.customerName || transaction.customerName,
          customer_phone: item.details?.customerPhone || transaction.customerPhone,
          notes: item.details?.notes,
          status: 'on_process' as const
        }));

        const { error: bookingsError } = await supabase
          .from('booking_statuses')
          .insert(bookingsToInsert);

        if (bookingsError) throw bookingsError;
      }

      // Reload data
      await loadData();

    } catch (err) {
      console.error('Error saving transaction:', err);
      throw new Error('Failed to save transaction');
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: 'on_process' | 'done') => {
    try {
      const { error } = await supabase
        .from('booking_statuses')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Reload data
      await loadData();

    } catch (err) {
      console.error('Error updating booking status:', err);
      throw new Error('Failed to update booking status');
    }
  };

  // Save attendance
  const saveAttendance = async (attendance: Attendance) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('attendances')
        .insert({
          id: attendance.id,
          user_id: attendance.userId,
          user_name: attendance.userName,
          clock_in: attendance.clockIn,
          clock_out: attendance.clockOut,
          attendance_date: attendance.date
        });

      if (error) throw error;

      // Reload data
      await loadData();

    } catch (err) {
      console.error('Error saving attendance:', err);
      throw new Error('Failed to save attendance');
    }
  };

  // Update attendance (for clock out)
  const updateAttendance = async (attendanceId: string, clockOut: string) => {
    try {
      const { error } = await supabase
        .from('attendances')
        .update({ 
          clock_out: clockOut,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId);

      if (error) throw error;

      // Reload data
      await loadData();

    } catch (err) {
      console.error('Error updating attendance:', err);
      throw new Error('Failed to update attendance');
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  return {
    transactions,
    bookingStatuses,
    attendances,
    loading,
    error,
    saveTransaction,
    updateBookingStatus,
    saveAttendance,
    updateAttendance,
    reloadData: loadData
  };
};