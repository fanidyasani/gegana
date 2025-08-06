import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Transaction, BookingStatus } from '../types';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [, setBookingStatuses] = useState<BookingStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem('gegana_transactions');
      const savedBookingStatuses = localStorage.getItem('gegana_booking_statuses');
      
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
      if (savedBookingStatuses) {
        setBookingStatuses(JSON.parse(savedBookingStatuses));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt).toISOString().split('T')[0];
      return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });
  };

  const getTodayTransactions = () => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt).toISOString().split('T')[0];
      return transactionDate === today;
    });
  };

  const calculateStats = () => {
    const filteredTransactions = getFilteredTransactions();
    const todayTransactions = getTodayTransactions();
    
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    
    const studioSessions = filteredTransactions.reduce((count, t) => {
      return count + t.items.filter(item => item.type === 'studio').length;
    }, 0);
    
    const productsSold = filteredTransactions.reduce((count, t) => {
      return count + t.items.filter(item => item.type === 'product').reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    return {
      totalRevenue,
      todayRevenue,
      totalTransactions: filteredTransactions.length,
      todayTransactions: todayTransactions.length,
      studioSessions,
      productsSold
    };
  };

  const exportToExcel = () => {
  const filteredTransactions = getFilteredTransactions();

  if (filteredTransactions.length === 0) {
    alert("Tidak ada transaksi untuk diekspor.");
    return;
  }

  const exportData = filteredTransactions.map(transaction => {
    const bookingItems = transaction.items.filter(item => item.type === 'studio');
    const studioDetail = bookingItems.map(item => `${item.name} - ${item.time || ''} (${item.quantity} sesi)`).join(', ');

    return {
      'ID Transaksi': transaction.id,
      'Tanggal': new Date(transaction.createdAt).toLocaleString('id-ID'),
      'Tipe': 'Booking Studio',
      'Detail': studioDetail,
      'Total': transaction.total,
      'Diterima': transaction.amountPaid,
      'Metode Pembayaran': transaction.paymentMethod === 'cash' ? 'Tunai' : transaction.paymentMethod.toUpperCase(),
      'Kembalian': transaction.paymentType === 'dp'
        ? `Sisa: ${transaction.remainingAmount || 0}`
        : transaction.change,
      'Kasir': transaction.createdBy
    };
  });

  // Ringkasan
  const stats = calculateStats();
  const summary = {
    'Total': stats.totalRevenue,
  };
  exportData.push(summary);

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Auto width columns
  const colWidths = Object.keys(exportData[0]).map(key => {
    const maxLength = exportData.reduce((max, row) => {
      const val = row[key] ?? '';
      return Math.max(max, val.toString().length);
    }, key.length);
    return { wch: maxLength + 4 }; // + padding
  });
  worksheet['!cols'] = colWidths;

  // Buat workbook dan simpan
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Studio');
  const fileName = `Laporan-Studio-Gegana-${dateRange.start}-sampai-${dateRange.end}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};


  const stats = calculateStats();
  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-8">
      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-red-600" />
          Filter Laporan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export XLSX
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendapatan Hari Ini</p>
              <p className="text-2xl font-bold text-green-600">
                Rp {stats.todayRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pendapatan</p>
              <p className="text-2xl font-bold text-blue-600">
                Rp {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sesi Studio</p>
              <p className="text-2xl font-bold text-purple-600">{stats.studioSessions}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transaksi Hari Ini</p>
              <p className="text-2xl font-bold text-orange-600">{stats.todayTransactions}</p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaksi Terbaru ({filteredTransactions.length} transaksi)
        </h3>

        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Tidak ada transaksi dalam periode ini</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left font-medium text-base text-gray-800 border-b-2 border-gray-300">
                  <th className="font-medium py-3 px-4">ID</th>
                  <th className="font-medium py-3 px-4">Tanggal</th>
                  <th className="font-medium py-3 px-4">Customer</th>
                  <th className="font-medium py-3 px-4">Items</th>
                  <th className="font-medium py-3 px-4">Total</th>
                  <th className="font-medium py-3 px-4">Metode</th>
                  <th className="font-medium py-3 px-4">Kasir</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(-20).reverse().map(transaction => (
                  <tr
                    key={transaction.id}
                    className="bg-white shadow-sm rounded-xl"
                  >
                    <td className="py-3 px-4 font-mono text-xs">{transaction.id.slice(-8)}</td>
                    <td className="py-4 px-6 text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleTimeString('id-ID')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div>{transaction.customerName}</div>
                      {transaction.customerPhone && (
                        <div className="text-xs text-gray-500">{transaction.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {transaction.items.map((item, index) => (
                        <div key={index} className="text-xs">
                          {item.name} ({item.quantity}x)
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-6 font-semibold text-green-600 text-sm">
                      Rp {transaction.total.toLocaleString()}
                      {transaction.paymentType === 'dp' && (
                        <div className="text-xs text-orange-600">
                          DP: Rp {transaction.amountPaid.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.paymentMethod === 'cash' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.paymentMethod === 'qris'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {transaction.paymentMethod.toUpperCase()}
                      </span>
                      {transaction.paymentType === 'dp' && (
                        <div className="text-xs text-orange-600 mt-1">DP</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs">{transaction.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;