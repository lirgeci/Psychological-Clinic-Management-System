import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreProvider } from './store/StoreContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
// Patient Pages
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard').then((m) => ({ default: m.PatientDashboard })));
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment').then((m) => ({ default: m.BookAppointment })));
const PatientQuestionnaires = lazy(() => import('./pages/patient/PatientQuestionnaires').then((m) => ({ default: m.PatientQuestionnaires })));
const PostSessionReview = lazy(() => import('./pages/patient/PostSessionReview').then((m) => ({ default: m.PostSessionReview })));
const PatientInvoices = lazy(() => import('./pages/patient/PatientInvoices').then((m) => ({ default: m.PatientInvoices })));
const PatientSessionHistory = lazy(() => import('./pages/patient/PatientSessionHistory').then((m) => ({ default: m.PatientSessionHistory })));
// Therapist Pages
const TherapistDashboard = lazy(() => import('./pages/therapist/TherapistDashboard').then((m) => ({ default: m.TherapistDashboard })));
const TherapistSchedule = lazy(() => import('./pages/therapist/TherapistSchedule').then((m) => ({ default: m.TherapistSchedule })));
const TherapistSessions = lazy(() => import('./pages/therapist/TherapistSessions').then((m) => ({ default: m.TherapistSessions })));
const TherapistPatients = lazy(() => import('./pages/therapist/TherapistPatients').then((m) => ({ default: m.TherapistPatients })));
// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminPatients = lazy(() => import('./pages/admin/AdminPatients').then((m) => ({ default: m.AdminPatients })));
const AdminTherapists = lazy(() => import('./pages/admin/AdminTherapists').then((m) => ({ default: m.AdminTherapists })));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments').then((m) => ({ default: m.AdminAppointments })));
const AdminRooms = lazy(() => import('./pages/admin/AdminRooms').then((m) => ({ default: m.AdminRooms })));
const AdminSessions = lazy(() => import('./pages/admin/AdminSessions').then((m) => ({ default: m.AdminSessions })));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices').then((m) => ({ default: m.AdminInvoices })));
const AdminQuestionnaires = lazy(() => import('./pages/admin/AdminQuestionnaires').then((m) => ({ default: m.AdminQuestionnaires })));
const AdminDiagnoses = lazy(() => import('./pages/admin/AdminDiagnoses').then((m) => ({ default: m.AdminDiagnoses })));
const AdminTreatmentPlans = lazy(() => import('./pages/admin/AdminTreatmentPlans').then((m) => ({ default: m.AdminTreatmentPlans })));
const AdminSessionNotes = lazy(() => import('./pages/admin/AdminSessionNotes').then((m) => ({ default: m.AdminSessionNotes })));
const AdminQuestionnaireResponses = lazy(() => import('./pages/admin/AdminQuestionnaireResponses').then((m) => ({ default: m.AdminQuestionnaireResponses })));

const LoadingFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
    Loading...
  </div>
);

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
);
export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={<DashboardLayout allowedRole="patient" />}>
            <Route index element={withSuspense(<PatientDashboard />)} />
            <Route path="appointments" element={withSuspense(<BookAppointment />)} />
            <Route path="questionnaires" element={withSuspense(<PatientQuestionnaires />)} />
            <Route path="sessions" element={withSuspense(<PatientSessionHistory />)} />
            <Route path="invoices" element={withSuspense(<PatientInvoices />)} />
            <Route path="reviews" element={withSuspense(<PostSessionReview />)} />
          </Route>

          {/* Therapist Routes */}
          <Route
            path="/therapist"
            element={<DashboardLayout allowedRole="therapist" />}>
            <Route index element={withSuspense(<TherapistDashboard />)} />
            <Route path="schedule" element={withSuspense(<TherapistSchedule />)} />
            <Route path="sessions" element={withSuspense(<TherapistSessions />)} />
            <Route path="patients" element={withSuspense(<TherapistPatients />)} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<DashboardLayout allowedRole="admin" />}>
            <Route index element={withSuspense(<AdminDashboard />)} />
            <Route path="users" element={withSuspense(<AdminUsers />)} />
            <Route path="patients" element={withSuspense(<AdminPatients />)} />
            <Route path="therapists" element={withSuspense(<AdminTherapists />)} />
            <Route path="appointments" element={withSuspense(<AdminAppointments />)} />
            <Route path="rooms" element={withSuspense(<AdminRooms />)} />
            <Route path="sessions" element={withSuspense(<AdminSessions />)} />
            <Route path="diagnoses" element={withSuspense(<AdminDiagnoses />)} />
            <Route path="treatment-plans" element={withSuspense(<AdminTreatmentPlans />)} />
            <Route path="session-notes" element={withSuspense(<AdminSessionNotes />)} />
            <Route path="invoices" element={withSuspense(<AdminInvoices />)} />
            <Route path="questionnaires" element={withSuspense(<AdminQuestionnaires />)} />
            <Route
              path="questionnaire-responses"
              element={withSuspense(<AdminQuestionnaireResponses />)} />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>);

}