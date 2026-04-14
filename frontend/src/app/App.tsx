import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreProvider } from './store/StoreContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { BookAppointment } from './pages/patient/BookAppointment';
import { PatientQuestionnaires } from './pages/patient/PatientQuestionnaires';
import { PostSessionReview } from './pages/patient/PostSessionReview';
import { PatientInvoices } from './pages/patient/PatientInvoices';
import { PatientSessionHistory } from './pages/patient/PatientSessionHistory';
// Therapist Pages
import { TherapistDashboard } from './pages/therapist/TherapistDashboard';
import { TherapistSchedule } from './pages/therapist/TherapistSchedule';
import { TherapistSessions } from './pages/therapist/TherapistSessions';
import { TherapistPatients } from './pages/therapist/TherapistPatients';
// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPatients } from './pages/admin/AdminPatients';
import { AdminTherapists } from './pages/admin/AdminTherapists';
import { AdminAppointments } from './pages/admin/AdminAppointments';
import { AdminRooms } from './pages/admin/AdminRooms';
import { AdminSessions } from './pages/admin/AdminSessions';
import { AdminInvoices } from './pages/admin/AdminInvoices';
import { AdminQuestionnaires } from './pages/admin/AdminQuestionnaires';
import { AdminDiagnoses } from './pages/admin/AdminDiagnoses';
import { AdminTreatmentPlans } from './pages/admin/AdminTreatmentPlans';
import { AdminSessionNotes } from './pages/admin/AdminSessionNotes';
import { AdminQuestionnaireResponses } from './pages/admin/AdminQuestionnaireResponses';
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
            
            <Route index element={<PatientDashboard />} />
            <Route path="appointments" element={<BookAppointment />} />
            <Route path="questionnaires" element={<PatientQuestionnaires />} />
            <Route path="sessions" element={<PatientSessionHistory />} />
            <Route path="invoices" element={<PatientInvoices />} />
            <Route path="reviews" element={<PostSessionReview />} />
          </Route>

          {/* Therapist Routes */}
          <Route
            path="/therapist"
            element={<DashboardLayout allowedRole="therapist" />}>
            
            <Route index element={<TherapistDashboard />} />
            <Route path="schedule" element={<TherapistSchedule />} />
            <Route path="sessions" element={<TherapistSessions />} />
            <Route path="patients" element={<TherapistPatients />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<DashboardLayout allowedRole="admin" />}>
            
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="therapists" element={<AdminTherapists />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="sessions" element={<AdminSessions />} />
            <Route path="diagnoses" element={<AdminDiagnoses />} />
            <Route path="treatment-plans" element={<AdminTreatmentPlans />} />
            <Route path="session-notes" element={<AdminSessionNotes />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="questionnaires" element={<AdminQuestionnaires />} />
            <Route
              path="questionnaire-responses"
              element={<AdminQuestionnaireResponses />} />
            
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>);

}