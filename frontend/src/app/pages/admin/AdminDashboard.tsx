import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import {
  UsersIcon,
  CalendarIcon,
  ActivityIcon,
  DollarSignIcon,
  HomeIcon
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTherapists: 0,
    todaysAppointments: 0,
    activeSessions: 0,
    pendingInvoices: 0,
    availableRooms: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [patientsRes, therapistsRes, appointmentsRes, sessionsRes, invoicesRes, roomsRes] = await Promise.all([
          fetch(`${API_URL}/patients/get-all`),
          fetch(`${API_URL}/therapists/get-all`),
          fetch(`${API_URL}/appointments/get-all`),
          fetch(`${API_URL}/sessions/get-all`),
          fetch(`${API_URL}/invoices/get-all`),
          fetch(`${API_URL}/rooms/get-all`)
        ]);

        const patients = patientsRes.ok ? (await patientsRes.json()).patients || [] : [];
        const therapists = therapistsRes.ok ? (await therapistsRes.json()).therapists || [] : [];
        const appointments = appointmentsRes.ok ? (await appointmentsRes.json()).appointments || [] : [];
        const sessions = sessionsRes.ok ? (await sessionsRes.json()).sessions || [] : [];
        const invoices = invoicesRes.ok ? (await invoicesRes.json()).invoices || [] : [];
        const rooms = roomsRes.ok ? (await roomsRes.json()).rooms || [] : [];

        const today = new Date().toISOString().split('T')[0];
        const todaysAppointments = appointments.filter((a: any) => a.AppointmentDate === today).length;
        const activeSessions = sessions.filter((s: any) => s.Status === 'In Progress').length;
        const pendingInvoices = invoices.filter((i: any) => i.PaymentStatus === 'Pending').length;
        const availableRooms = rooms.filter((r: any) => r.Status === 'Available').length;

        setStats({
          totalPatients: patients.length || 0,
          totalTherapists: therapists.length || 0,
          todaysAppointments,
          activeSessions,
          pendingInvoices,
          availableRooms
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({
          totalPatients: 0,
          totalTherapists: 0,
          todaysAppointments: 0,
          activeSessions: 0,
          pendingInvoices: 0,
          availableRooms: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const dashboardStats = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: UsersIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      link: '/admin/patients'
    },
    {
      title: 'Total Therapists',
      value: stats.totalTherapists,
      icon: UsersIcon,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      link: '/admin/therapists'
    },
    {
      title: 'Appointments Today',
      value: stats.todaysAppointments,
      icon: CalendarIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
      link: '/admin/appointments'
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: ActivityIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      link: '/admin/sessions'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: DollarSignIcon,
      color: 'text-red-600',
      bg: 'bg-red-100',
      link: '/admin/invoices'
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms,
      icon: HomeIcon,
      color: 'text-teal-600',
      bg: 'bg-teal-100',
      link: '/admin/rooms'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
     
      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            System Administration
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center p-8">
              <p className="text-slate-500">Loading dashboard data...</p>
            </div>
          ) : (
            dashboardStats.map((stat, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: 'currentColor' }}
              >
                <div className="text-slate-900" onClick={() => navigate(stat.link)}>
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <UsersIcon className="h-6 w-6 text-blue-500 mb-2" />
                <h3 className="font-medium text-slate-900">Manage Users</h3>
                <p className="text-xs text-slate-500 mt-1">Create or edit accounts</p>
              </button>
              
              <button
                onClick={() => navigate('/admin/rooms')}
                className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <HomeIcon className="h-6 w-6 text-teal-500 mb-2" />
                <h3 className="font-medium text-slate-900">Manage Rooms</h3>
                <p className="text-xs text-slate-500 mt-1">Assign clinic rooms</p>
              </button>

              <button
                onClick={() => navigate('/admin/questionnaires')}
                className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <ActivityIcon className="h-6 w-6 text-indigo-500 mb-2" />
                <h3 className="font-medium text-slate-900">Questionnaires</h3>
                <p className="text-xs text-slate-500 mt-1">Build templates</p>
              </button>

              <button
                onClick={() => navigate('/admin/invoices')}
                className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <DollarSignIcon className="h-6 w-6 text-green-500 mb-2" />
                <h3 className="font-medium text-slate-900">Billing</h3>
                <p className="text-xs text-slate-500 mt-1">Manage invoices</p>
              </button>
            </div>
          </Card>

          <Card title="System Status">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Database Connection</span>
                <span className="flex items-center text-sm text-green-600">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Email Service</span>
                <span className="flex items-center text-sm text-green-600">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Payment Gateway</span>
                <span className="flex items-center text-sm text-amber-600">
                  <span className="h-2 w-2 bg-amber-500 rounded-full mr-2"></span>
                  Degraded
                </span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}