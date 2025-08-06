import React, { useState } from 'react';
import { Calendar, ShoppingCart, FileText, Clock, LogOut, Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Transactions from './Transactions';
import Reports from './Reports';
import Attendance from './Attendance';
import logo from '../logo.png';

type TabType = 'transactions' | 'reports' | 'attendance';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'transactions' as TabType, label: 'Transaksi', icon: ShoppingCart },
    { id: 'reports' as TabType, label: 'Laporan', icon: FileText },
    { id: 'attendance' as TabType, label: 'Presensi', icon: Clock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
        return <Transactions />;
      case 'reports':
        return <Reports />;
      case 'attendance':
        return <Attendance />;
      default:
        return <Transactions />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gegana Studio POS</h1>
                <p className="text-sm text-gray-500">Sistem Point of Sale</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.name}</span>
                <span className="text-gray-500 ml-2">({user?.role})</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;