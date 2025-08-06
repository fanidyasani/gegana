import React, { useState, useEffect } from 'react';
// import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Calendar, Clock, User, Phone, FileText, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Product, CartItem, Transaction, BookingStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';


const STUDIO_PRICE = 85000; // 2 hours session

const AVAILABLE_TIMES = [
  { start: '11:00', end: '13:00' },
  { start: '13:00', end: '15:00' },
  { start: '15:00', end: '17:00' },
  { start: '17:00', end: '19:00' },
  { start: '19:00', end: '21:00' },
  { start: '21:00', end: '23:00' },
  { start: '23:00', end: '01:00' },
];

const PRODUCTS: Product[] = [
  { id: '1', name: 'Senar Gitar', price: 10000 },
  { id: '2', name: 'Senar Bass', price: 50000 },
  { id: '3', name: 'Stick Drum', price: 25000 },
  { id: '4', name: 'Pick Gitar', price: 5000 },
  { id: '5', name: 'Air Putih', price: 5000 },
  { id: '6', name: 'Teh', price: 5000 },
  { id: '7', name: 'Kopi', price: 5000 },
];

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<BookingStatus[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 👇 STATE BARU UNTUK FILTER TRANSAKSI
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Studio booking form
  const [studioForm, setStudioForm] = useState({
    date: new Date().toISOString().split('T')[0],
    selectedTimes: [] as string[],
    customerName: '',
    customerPhone: '',
    notes: ''
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'cash' as 'cash' | 'qris' | 'transfer',
    paymentType: 'full' as 'full' | 'dp',
    amountPaid: '',
    dpAmount: ''
  });

useEffect(() => {
    const fetchData = async () => {
      // Ambil transaksi
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .eq('created_at', filterDate);

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
        } else {
          // Karena `transactions` di state Anda memiliki `items`,
          // Anda harus mengambilnya juga atau menyesuaikan struktur data.
          // Untuk saat ini, kita ambil data utamanya saja.
          setTransactions(transactionsData || []);
        }

        // Ambil status booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('booking_statuses')
          .select('*')
          .order('booking_date', { ascending: true });

        if (bookingError) {
          console.error('Error fetching booking statuses:', bookingError);
        } else {
          setBookingStatuses(bookingData || []);
        }
      };
      
      fetchData();
}, [filterDate]);


  const getBookedTimes = (date: string): string[] => {
    return bookingStatuses
      .filter(booking => booking.date === date && booking.status !== 'done')
      .map(booking => booking.startTime);
  };

  const validateStudioBooking = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!studioForm.customerName.trim()) {
      newErrors.customerName = 'Nama customer harus diisi';
    }

    if (!studioForm.date) {
      newErrors.date = 'Tanggal harus dipilih';
    } else if (new Date(studioForm.date) < new Date(new Date().toDateString())) {
      newErrors.date = 'Tanggal tidak boleh di masa lalu';
    }

    if (studioForm.selectedTimes.length === 0) {
      newErrors.times = 'Pilih minimal 1 sesi waktu';
    }

    // Check for time conflicts
    const bookedTimes = getBookedTimes(studioForm.date);
    const conflictTimes = studioForm.selectedTimes.filter(time => bookedTimes.includes(time));
    if (conflictTimes.length > 0) {
      newErrors.times = `Waktu ${conflictTimes.join(', ')} sudah dibooking`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addStudioToCart = () => {
    if (!validateStudioBooking()) return;

    const newItems: CartItem[] = studioForm.selectedTimes.map(startTime => {
      const timeSlot = AVAILABLE_TIMES.find(t => t.start === startTime);
      return {
        id: `studio-${Date.now()}-${startTime}`,
        type: 'studio' as const,
        name: `Studio Gegana (${startTime} - ${timeSlot?.end})`,
        price: STUDIO_PRICE,
        quantity: 1,
        details: {
          date: studioForm.date,
          startTime: startTime,
          endTime: timeSlot?.end,
          customerName: studioForm.customerName,
          customerPhone: studioForm.customerPhone || undefined,
          notes: studioForm.notes || undefined
        }
      };
    });

    setCart(prevCart => [...prevCart, ...newItems]);
    
    // Reset form
    setStudioForm({
      date: new Date().toISOString().split('T')[0],
      selectedTimes: [],
      customerName: '',
      customerPhone: '',
      notes: ''
    });
    setErrors({});
  };

  const addProductToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.type === 'product' && item.name === product.name
      );
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          id: `product-${Date.now()}-${product.id}`,
          type: 'product',
          name: product.name,
          price: product.price,
          quantity: 1
        }];
      }
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const validatePayment = (): boolean => {
    const newErrors: Record<string, string> = {};
    const total = getTotalPrice();

    if (paymentForm.paymentType === 'dp') {
      const dpAmount = parseFloat(paymentForm.dpAmount) || 0;
      if (dpAmount < 50000) {
        newErrors.payment = 'DP minimal Rp 50.000';
      } else if (dpAmount >= total) {
        newErrors.payment = 'DP tidak boleh sama atau lebih dari total';
      }
    } else {
      // Full payment validation
      if (paymentForm.paymentMethod === 'cash') {
        const amountPaid = parseFloat(paymentForm.amountPaid) || 0;
        if (amountPaid < total) {
          newErrors.payment = 'Jumlah pembayaran kurang dari total';
        }
      }
    }

    // Check if there's at least one studio booking for customer name
    const studioItems = cart.filter(item => item.type === 'studio');
    if (studioItems.length === 0) {
      const productItems = cart.filter(item => item.type === 'product');
      if (productItems.length > 0 && !studioForm.customerName.trim()) { // ADDED
        newErrors.customer = 'Nama customer harus diisi untuk transaksi produk';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validatePayment() || isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const total = getTotalPrice();
      
      let amountPaid: number;
      let change = 0;
      let dpAmount: number | undefined;
      let remainingAmount: number | undefined;

      if (paymentForm.paymentType === 'dp') {
        dpAmount = parseFloat(paymentForm.dpAmount);
        amountPaid = dpAmount;
        remainingAmount = total - dpAmount;
      } else {
        amountPaid = paymentForm.paymentMethod === 'cash' 
          ? parseFloat(paymentForm.amountPaid) 
          : total;
        change = amountPaid - total;
      }

      // Get customer info from studio booking or use default
      const studioItems = cart.filter(item => item.type === 'studio');
      const customerName = studioItems.length > 0 
        ? studioItems[0].details?.customerName || 'Customer'
        : studioForm.customerName || 'Customer'; // ADDED
      const customerPhone = studioItems.length > 0 
        ? studioItems[0].details?.customerPhone
        : studioForm.customerPhone || undefined; // ADDED

      const { data: newTransactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          total,
          amount_paid: amountPaid,
          change_amount: change,
          payment_method: paymentForm.paymentMethod,
          payment_type: paymentForm.paymentType,
          dp_amount: dpAmount,
          remaining_amount: remainingAmount,
          customer_name: customerName,
          customer_phone: customerPhone,
          created_by: user?.name || 'Unknown',
        }
      ])
      .select() // Penting untuk mendapatkan ID yang dibuat oleh Supabase
      .single();

      if (transactionError || !newTransactionData) {
      console.error('Error adding transaction:', transactionError);
      setErrors({ general: 'Gagal menambahkan transaksi utama.' });
      return;
      }

      const transactionId = newTransactionData.id;

      const transactionItemsToInsert = cart.map(item => ({
        transaction_id: transactionId,
        item_type: item.type,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        details: item.details || null,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItemsToInsert);

      if (itemsError) {
        console.error('Error adding transaction items:', itemsError);
        setErrors({ general: 'Gagal menyimpan detail transaksi.' });
        // Anda mungkin ingin menghapus transaksi utama di sini jika ini gagal
        return;
      }

      const bookingStatusesToInsert = studioItems.map(item => ({
        transaction_id: transactionId,
        booking_date: item.details?.date || '',
        start_time: item.details?.startTime || '',
        end_time: item.details?.endTime || '',
        customer_name: item.details?.customerName || '',
        customer_phone: item.details?.customerPhone,
        notes: item.details?.notes,
        status: 'on_process',
      }));

      if (bookingStatusesToInsert.length > 0) {
        const { error: bookingError } = await supabase
          .from('booking_statuses')
          .insert(bookingStatusesToInsert);
        
        if (bookingError) {
          console.error('Error adding booking statuses:', bookingError);
          setErrors({ general: 'Gagal menyimpan status booking.' });
        }
      }

      setTransactions(prev => [...prev, newTransactionData]);

      // Clear cart dan forms
      setCart([]);
      setPaymentForm({ 
        paymentMethod: 'cash', 
        paymentType: 'full',
        amountPaid: '',
        dpAmount: ''
      });
      setShowPayment(false);

      alert('Transaksi berhasil!');

    } catch (error) {
      console.error('Error processing payment:', error);
      setErrors({ general: 'Gagal memproses pembayaran' });
    } finally {
      setIsSubmitting(false);
    }
  };

      const transaction: Transaction = {
        id: Date.now().toString(),
        items: [...cart],
        total,
        amountPaid,
        change,
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        dpAmount,
        remainingAmount,
        customerName,
        customerPhone,
        createdAt: new Date().toISOString(),
        createdBy: user?.name || 'Unknown'
      };

      // Create booking statuses for studio sessions
      const newBookingStatuses: BookingStatus[] = studioItems.map(item => ({
        id: `booking-${Date.now()}-${item.details?.startTime}`,
        transactionId: transaction.id,
        date: item.details?.date || '',
        startTime: item.details?.startTime || '',
        endTime: item.details?.endTime || '',
        customerName: item.details?.customerName || '',
        customerPhone: item.details?.customerPhone,
        notes: item.details?.notes,
        status: 'on_process' as const,
        createdAt: new Date().toISOString()
      }));

      const newTransactions = [...transactions, transaction];
      const newBookingStatusesAll = [...bookingStatuses, ...newBookingStatuses];

      saveData(newTransactions, newBookingStatusesAll);

      // Clear cart and forms
      setCart([]);
      setPaymentForm({ 
        paymentMethod: 'cash', 
        paymentType: 'full',
        amountPaid: '',
        dpAmount: ''
      });
      setShowPayment(false);

      alert('Transaksi berhasil!');

    } catch (error) {
      console.error('Error processing payment:', error);
      setErrors({ general: 'Gagal memproses pembayaran' });
    } finally {
      setIsSubmitting(false);
    }
  };


     const updateBookingStatus = async (bookingId: string, status: 'on_process' | 'done') => {
      try {
        const { error } = await supabase
          .from('booking_statuses')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', bookingId);

        if (error) {
          throw error;
        }

        setBookingStatuses(prevStatuses =>
          prevStatuses.map(booking =>
            booking.id === bookingId
              ? { ...booking, status, updated_at: new Date().toISOString() }
              : booking
          )
        );
      } catch (error) {
        console.error('Error updating booking status:', error);
        setErrors({ general: 'Gagal mengupdate status booking.' });
      }
    };

  const bookedTimes = getBookedTimes(studioForm.date);
  const availableTimes = AVAILABLE_TIMES.filter(time => !bookedTimes.includes(time.start));

  // 👇 BARU: FILTER TRANSAKSI BERDASARKAN TANGGAL
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = transaction.createdAt.split('T')[0];
    return transactionDate === filterDate;
  });


  return (
    <div className="space-y-8">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{errors.general}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section - Studio Booking & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Studio Booking */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-red-600" />
              Booking Studio Gegana
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    value={studioForm.date}
                    onChange={(e) => setStudioForm(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Customer *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={studioForm.customerName}
                      onChange={(e) => setStudioForm(prev => ({ ...prev, customerName: e.target.value }))}
                      className={`pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.customerName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nama customer"
                      required
                    />
                  </div>
                  {errors.customerName && <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Telepon (Opsional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={studioForm.customerPhone}
                      onChange={(e) => setStudioForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan (Opsional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={studioForm.notes}
                      onChange={(e) => setStudioForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Catatan tambahan"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Sesi Waktu (2 jam per sesi) *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {AVAILABLE_TIMES.map(time => {
                    const isBooked = bookedTimes.includes(time.start);
                    const isSelected = studioForm.selectedTimes.includes(time.start);
                    
                    return (
                      <button
                        key={time.start}
                        type="button"
                        disabled={isBooked}
                        onClick={() => {
                          if (isSelected) {
                            setStudioForm(prev => ({
                              ...prev,
                              selectedTimes: prev.selectedTimes.filter(t => t !== time.start)
                            }));
                          } else {
                            setStudioForm(prev => ({
                              ...prev,
                              selectedTimes: [...prev.selectedTimes, time.start]
                            }));
                          }
                        }}
                        className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                          isBooked
                            ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                            : isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {time.start} - {time.end}
                        {isBooked && <div className="text-xs">Booked</div>}
                      </button>
                    );
                  })}
                </div>
                {errors.times && <p className="text-red-600 text-sm mt-1">{errors.times}</p>}
              </div>

              {studioForm.selectedTimes.length > 0 && (
                <div className="bg-gray-70 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Booking:</div>
                  <div className="text-lg font-semibold text-orange-600">
                    {studioForm.selectedTimes.length} sesi × Rp {STUDIO_PRICE.toLocaleString()} = Rp {(studioForm.selectedTimes.length * STUDIO_PRICE).toLocaleString()}
                  </div>
                </div>
              )}

              <button
                onClick={addStudioToCart}
                disabled={studioForm.selectedTimes.length === 0}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#FF8C00] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah ke Keranjang
              </button>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produk</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {PRODUCTS.map(product => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-lg font-semibold text-green-600">
                      Rp {product.price.toLocaleString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => addProductToCart(product)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Cart */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Keranjang Transaksi
          </h3>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keranjang kosong</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="border-b border-gray-100 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          Rp {item.price.toLocaleString()} × {item.quantity}
                        </p>
                        {item.details && (
                          <div className="text-xs text-gray-400 mt-1">
                            {item.details.date && `${item.details.date} `}
                            {item.details.customerName && `- ${item.details.customerName}`}
                            {item.details.notes && ` (${item.details.notes})`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {item.type === 'product' && (
                          <>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            
                            <span className="w-8 text-center">{item.quantity}</span>
                            
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-semibold text-green-600">
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">Rp {getTotalPrice().toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setShowPayment(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Bayar Sekarang
              </button>
            </>
          )}
        </div>
      </div>

      <hr className="my-8" /> {/* Pemisah bagian */}

      {/* Booking Status List */}
      {bookingStatuses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-red-600" />
              Status Booking
            </h3>
            <div>
              <label htmlFor="filterDate" className="sr-only">Filter Tanggal</label>
              <input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="space-y-4">
            {bookingStatuses
              .filter(booking => booking.date === filterDate)
              .map(booking => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
                        <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                          booking.status === 'done' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status === 'done' ? 'Selesai' : 'Sedang Berlangsung'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <User className="w-4 h-4 mr-1" />
                          {booking.customerName}
                        </div>
                        {booking.customerPhone && (
                          <div className="flex items-center mb-1">
                            <Phone className="w-4 h-4 mr-1" />
                            {booking.customerPhone}
                          </div>
                        )}
                        {booking.notes && (
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {booking.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {booking.status === 'on_process' ? (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'done')}
                          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Selesai
                        </button>
                      ) : (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'on_process')}
                          className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Proses
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 👇 BARU: Bagian Riwayat Transaksi dengan Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Riwayat Transaksi
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Tidak ada transaksi pada tanggal ini.</p>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500">
                      #{transaction.id.slice(-6)} - {transaction.customerName}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      Rp {transaction.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      transaction.paymentType === 'dp' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.paymentType === 'dp' ? 'DP' : 'Lunas'}
                    </p>
                  </div>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mt-2">
                  {transaction.items.map(item => (
                    <li key={item.id}>
                      {item.name} ({item.quantity})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Pembayaran</h3>
              <button
                onClick={() => setShowPayment(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-orange-600">
                    Rp {getTotalPrice().toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'full', label: 'Lunas' },
                    { value: 'dp', label: 'DP' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setPaymentForm(prev => ({ 
                        ...prev, 
                        paymentType: type.value as any,
                        amountPaid: '',
                        dpAmount: ''
                      }))}
                      className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                        paymentForm.paymentType === type.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: 'Tunai' },
                    { value: 'qris', label: 'QRIS' },
                    { value: 'transfer', label: 'Transfer' }
                  ].map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: method.value as any }))}
                      className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                        paymentForm.paymentMethod === method.value
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentForm.paymentType === 'dp' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah DP (Minimal Rp 50.000)
                  </label>
                  <input
                    type="number"
                    value={paymentForm.dpAmount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, dpAmount: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.payment ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="50000"
                    required
                    min={50000}
                    max={getTotalPrice() - 1}
                  />
                  {paymentForm.dpAmount && !isNaN(parseFloat(paymentForm.dpAmount)) && parseFloat(paymentForm.dpAmount) >= 50000 && parseFloat(paymentForm.dpAmount) < getTotalPrice() && (
                    <div className="mt-2 bg-yellow-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Sisa yang harus dibayar:</div>
                      <div className="text-lg font-semibold text-yellow-600">
                        Rp {(getTotalPrice() - parseFloat(paymentForm.dpAmount)).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {errors.payment && <p className="text-red-600 text-sm mt-1">{errors.payment}</p>}
                </div>
              ) : (
                <div>
                  {paymentForm.paymentMethod === 'cash' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah Uang Tunai
                      </label>
                      <input
                        type="number"
                        value={paymentForm.amountPaid}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.payment ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={getTotalPrice().toString()}
                      />
                      {paymentForm.amountPaid && !isNaN(parseFloat(paymentForm.amountPaid)) && parseFloat(paymentForm.amountPaid) >= getTotalPrice() && (
                        <div className="mt-2 bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Kembalian:</div>
                          <div className="text-lg font-semibold text-green-600">
                            Rp {(parseFloat(paymentForm.amountPaid) - getTotalPrice()).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.payment && <p className="text-red-600 text-sm mt-1">{errors.payment}</p>}
              {errors.customer && <p className="text-red-600 text-sm mt-1">{errors.customer}</p>}
            </div>
            
            <div className="border-t p-6 mt-auto">
              <button
                onClick={handlePayment}
                className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting || (paymentForm.paymentType === 'full' && paymentForm.paymentMethod === 'cash' && (parseFloat(paymentForm.amountPaid) < getTotalPrice() || !paymentForm.amountPaid)) || (paymentForm.paymentType === 'dp' && (parseFloat(paymentForm.dpAmount) < 50000 || !paymentForm.dpAmount))}
              >
                {isSubmitting ? 'Memproses...' : 'Selesaikan Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;