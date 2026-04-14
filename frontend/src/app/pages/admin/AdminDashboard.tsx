import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import {
  UsersIcon,
  CalendarIcon,
  ActivityIcon,
  DollarSignIcon,
  HomeIcon } from
'lucide-react';
export function AdminDashboard() {
  const { patients, therapists, appointments, sessions, invoices, rooms } =
  useStore();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter((a) => a.date === today).length;
  const activeSessions = sessions.filter(
    (s) => s.status === 'In Progress'
  ).length;
  const pendingInvoices = invoices.filter(
    (i) => i.paymentStatus === 'Pending'
  ).length;
  const availableRooms = rooms.filter((r) => r.status === 'Available').length;
  const stats = [
  {
    title: 'Total Patients',
    value: patients.length,
    icon: UsersIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    link: '/admin/patients'
  },
  {
    title: 'Total Therapists',
    value: therapists.length,
    icon: UsersIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    link: '/admin/therapists'
  },
  {
    title: 'Appointments Today',
    value: todaysAppointments,
    icon: CalendarIcon,
    color: 'text-green-600',
    bg: 'bg-green-100',
    link: '/admin/appointments'
  },
  {
    title: 'Active Sessions',
    value: activeSessions,
    icon: ActivityIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    link: '/admin/sessions'
  },
  {
    title: 'Pending Invoices',
    value: pendingInvoices,
    icon: DollarSignIcon,
    color: 'text-red-600',
    bg: 'bg-red-100',
    link: '/admin/invoices'
  },
  {
    title: 'Available Rooms',
    value: availableRooms,
    icon: HomeIcon,
    color: 'text-teal-600',
    bg: 'bg-teal-100',
    link: '/admin/rooms'
  }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          System Administration
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) =>
        <Card
          key={idx}
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
          style={{
            borderLeftColor: 'currentColor'
          }}>
          
            <div
            className={`text-slate-900`}
            onClick={() => navigate(stat.link)}>
            
              <div className="flex items-center justify-between p-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors">
              
              <UsersIcon className="h-6 w-6 text-blue-500 mb-2" />
              <h3 className="font-medium text-slate-900">Manage Users</h3>
              <p className="text-xs text-slate-500 mt-1">
                Create or edit system accounts
              </p>
            </button>
            <button
              onClick={() => navigate('/admin/rooms')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors">
              
              <HomeIcon className="h-6 w-6 text-teal-500 mb-2" />
              <h3 className="font-medium text-slate-900">Manage Rooms</h3>
              <p className="text-xs text-slate-500 mt-1">
                Assign rooms to appointments
              </p>
            </button>
            <button
              onClick={() => navigate('/admin/questionnaires')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors">
              
              <ActivityIcon className="h-6 w-6 text-indigo-500 mb-2" />
              <h3 className="font-medium text-slate-900">Questionnaires</h3>
              <p className="text-xs text-slate-500 mt-1">
                Build assessment templates
              </p>
            </button>
            <button
              onClick={() => navigate('/admin/invoices')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors">
              
              <DollarSignIcon className="h-6 w-6 text-green-500 mb-2" />
              <h3 className="font-medium text-slate-900">Billing</h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage patient invoices
              </p>
            </button>
          </div>
        </Card>

        <Card title="System Status">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-sm font-medium text-slate-700">
                Database Connection
              </span>
              <span className="flex items-center text-sm text-green-600">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                Online
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-sm font-medium text-slate-700">
                Email Service
              </span>
              <span className="flex items-center text-sm text-green-600">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                Operational
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-sm font-medium text-slate-700">
                Payment Gateway
              </span>
              <span className="flex items-center text-sm text-amber-600">
                <span className="h-2 w-2 bg-amber-500 rounded-full mr-2"></span>
                Degraded
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>);

}