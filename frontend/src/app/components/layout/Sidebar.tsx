import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  ActivityIcon,
  ClipboardListIcon,
  SettingsIcon,
  LogOutIcon,
  DollarSignIcon,
  ClockIcon } from
'lucide-react';
import { useStore } from '../../store/StoreContext';
export function Sidebar() {
  const { currentUser, setCurrentUser } = useStore();
  const navigate = useNavigate();
  if (!currentUser) return null;
  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };
  const patientLinks = [
  {
    to: '/patient',
    icon: HomeIcon,
    label: 'Dashboard'
  },
  {
    to: '/patient/appointments',
    icon: CalendarIcon,
    label: 'Book Appointment'
  },
  {
    to: '/patient/questionnaires',
    icon: ClipboardListIcon,
    label: 'Questionnaires'
  },
  {
    to: '/patient/sessions',
    icon: ClockIcon,
    label: 'Session History'
  },
  {
    to: '/patient/invoices',
    icon: DollarSignIcon,
    label: 'My Invoices'
  },
  {
    to: '/patient/reviews',
    icon: FileTextIcon,
    label: 'Clinical Records'
  }];

  const therapistLinks = [
  {
    to: '/therapist',
    icon: HomeIcon,
    label: 'Dashboard'
  },
  {
    to: '/therapist/schedule',
    icon: CalendarIcon,
    label: 'Schedule & Appointments'
  },
  {
    to: '/therapist/sessions',
    icon: ActivityIcon,
    label: 'Active Sessions'
  },
  {
    to: '/therapist/patients',
    icon: UsersIcon,
    label: 'My Patients'
  }];

  const adminLinks = [
  {
    to: '/admin',
    icon: HomeIcon,
    label: 'Dashboard'
  },
  {
    to: '/admin/users',
    icon: UsersIcon,
    label: 'Users & Roles'
  },
  {
    to: '/admin/patients',
    icon: UsersIcon,
    label: 'Patients'
  },
  {
    to: '/admin/therapists',
    icon: UsersIcon,
    label: 'Therapists'
  },
  {
    to: '/admin/appointments',
    icon: CalendarIcon,
    label: 'Appointments'
  },
  {
    to: '/admin/rooms',
    icon: HomeIcon,
    label: 'Rooms'
  },
  {
    to: '/admin/sessions',
    icon: ActivityIcon,
    label: 'Sessions'
  },
  {
    to: '/admin/diagnoses',
    icon: FileTextIcon,
    label: 'Diagnoses'
  },
  {
    to: '/admin/treatment-plans',
    icon: FileTextIcon,
    label: 'Treatment Plans'
  },
  {
    to: '/admin/session-notes',
    icon: FileTextIcon,
    label: 'Session Notes'
  },
  {
    to: '/admin/invoices',
    icon: DollarSignIcon,
    label: 'Invoices'
  },
  {
    to: '/admin/questionnaires',
    icon: ClipboardListIcon,
    label: 'Questionnaires'
  },
  {
    to: '/admin/questionnaire-responses',
    icon: ClipboardListIcon,
    label: 'Responses'
  }];

  let links = [];
  if (currentUser.role === 'patient') links = patientLinks;
  if (currentUser.role === 'therapist') links = therapistLinks;
  if (currentUser.role === 'admin') links = adminLinks;
  return (
    <div className="w-64 bg-slate-800 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ActivityIcon className="h-6 w-6 text-blue-400" />
          MindCare Clinic
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          {currentUser.firstName} {currentUser.lastName}
          <span className="block text-xs uppercase text-blue-400 mt-1">
            {currentUser.role}
          </span>
        </p>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {links.map((link) =>
          <li key={link.to}>
              <NavLink
              to={link.to}
              end={link.to === `/${currentUser.role}`}
              className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`
              }>
              
                <link.icon className="h-5 w-5" />
                {link.label}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
          
          <LogOutIcon className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>);

}