import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useStore } from '../../store/StoreContext';
interface DashboardLayoutProps {
  allowedRole: 'patient' | 'therapist' | 'admin';
}
export function DashboardLayout({ allowedRole }: DashboardLayoutProps) {
  const { currentUser } = useStore();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  if (currentUser.role !== allowedRole) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>);

}