import React, { useState, useEffect } from 'react';
import { Clock, Download, LogOut } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { Attendance as AttendanceType } from '../types';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<AttendanceType[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceType | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gegana_attendances');
    if (saved) {
      const parsedAttendances = JSON.parse(saved);
      setAttendances(parsedAttendances);
      
      // Check if user already clocked in today
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = parsedAttendances.find(
        (a: AttendanceType) => a.userId === user?.id && a.date === today
      );
      setTodayAttendance(todayRecord || null);
    }
  }, [user]);

  const saveAttendances = (newAttendances: AttendanceType[]) => {
    setAttendances(newAttendances);
    localStorage.setItem('gegana_attendances', JSON.stringify(newAttendances));
  };

  const clockOut = () => {
    if (!user || !todayAttendance) return;

    const now = new Date().toISOString();
    const updatedAttendance = {
      ...todayAttendance,
      clockOut: now
    };

    const updatedAttendances = attendances.map(a => 
      a.id === todayAttendance.id ? updatedAttendance : a
    );

    saveAttendances(updatedAttendances);
    setTodayAttendance(updatedAttendance);
    
    alert('Berhasil clock out!');
  };

  const clockIn = () => {
    if (!user) return;

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    const newAttendance: AttendanceType = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      clockIn: now,
      date: today
    };

    const updatedAttendances = [...attendances, newAttendance];
    saveAttendances(updatedAttendances);
    setTodayAttendance(newAttendance);
    
    alert('Berhasil clock in!');
  };

  const exportAttendance = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Header data
    const headerData = [
      ['LAPORAN PRESENSI KARYAWAN'],
      ['Studio Musik Gegana'],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`],
      [],
      ['Tanggal', 'Nama Karyawan', 'Clock In', 'Clock Out', 'Durasi Kerja']
    ];
    
    const attendanceData = [...headerData];
    
    attendances.forEach(attendance => {
      const clockInTime = new Date(attendance.clockIn).toLocaleTimeString('id-ID');
      const clockOutTime = attendance.clockOut 
        ? new Date(attendance.clockOut).toLocaleTimeString('id-ID')
        : '-';
      
      let duration = '-';
      if (attendance.clockOut) {
        const diff = new Date(attendance.clockOut).getTime() - new Date(attendance.clockIn).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m`;
      }
      
      attendanceData.push([
        attendance.date,
        attendance.userName,
        clockInTime,
        clockOutTime,
        duration
      ]);
    });
    
    // Create worksheet and export
    const ws = XLSX.utils.aoa_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Presensi');
    
    const fileName = `Presensi-Gegana-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    const link = document.createElement("a");
    document.body.appendChild(link);
    document.body.removeChild(link);
  };

  const calculateWorkingHours = (clockIn: string, clockOut?: string): string => {
    if (!clockOut) return '-';
    
    const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const recentAttendances = attendances
    .slice(-10)
    .reverse();

  return (
    <div className="space-y-8">
      {/* Clock In/Out Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-red-600" />
          Presensi Karyawan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Hari Ini</h3>
            
            {todayAttendance ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Clock In:</span>
                  <span className="font-medium">
                    {new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID')}
                  </span>
                </div>
                
                {todayAttendance.clockOut ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Clock Out:</span>
                      <span className="font-medium">
                        {new Date(todayAttendance.clockOut).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Durasi Kerja:</span>
                      <span className="font-medium text-green-600">
                        {calculateWorkingHours(todayAttendance.clockIn, todayAttendance.clockOut)}
                      </span>
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                      <p className="text-green-800 font-medium">Sudah Clock Out Hari Ini</p>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={clockOut}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Clock Out
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={clockIn}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clock className="w-5 h-5 mr-2" />
                Clock In
              </button>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Laporan Presensi</h3>
              <button
                onClick={exportAttendance}
                className="flex items-center px-3 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#FF8C00] transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export XLSX
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{attendances.length}</p>
              <p className="text-gray-600">Total Presensi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Riwayat Presensi Terbaru
        </h3>

        {recentAttendances.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada data presensi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Clock In</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Clock Out</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Durasi</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendances.map(attendance => (
                  <tr key={attendance.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{attendance.date}</td>
                    <td className="py-3 px-4">{attendance.userName}</td>
                    <td className="py-3 px-4">
                      {new Date(attendance.clockIn).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      {attendance.clockOut 
                        ? new Date(attendance.clockOut).toLocaleTimeString('id-ID')
                        : '-'
                      }
                    </td>
                    <td className="py-3 px-4">
                      {calculateWorkingHours(attendance.clockIn, attendance.clockOut)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        attendance.clockOut 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {attendance.clockOut ? 'Selesai' : 'Masih Kerja'}
                      </span>
                    </td>
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

export default Attendance;