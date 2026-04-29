import { useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import {
  UserIcon,
  CalendarIcon,
  TargetIcon,
  FileTextIcon,
  EditIcon
} from 'lucide-react';

interface ApiPatient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
}

interface ApiAppointment {
  id: string;
  therapistId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
}

export function PatientDashboard() {
  const {
    currentUser,
    patients,
    therapists,
    appointments,
    treatmentPlans,
    invoices,
    updateEntity,
  } = useStore();
  const apiBaseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [apiPatient, setApiPatient] = useState<ApiPatient | null>(null);
  const [apiAppointments, setApiAppointments] = useState<ApiAppointment[]>([]);

  if (!currentUser) return <div className="p-10 text-center text-slate-500">Loading user session...</div>;

  const foundPatient = patients.find((p) => String(p.userId) === String(currentUser.id));

  const patient = apiPatient || foundPatient || {
    id: 'temp-id',
    userId: currentUser.id,
    firstName: currentUser.firstName || currentUser.email.split('@')[0],
    lastName: currentUser.lastName || '',
    email: currentUser.email,
    phone: currentUser.phone || 'Not provided',
    dateOfBirth: 'N/A',
    gender: 'N/A',
    address: 'N/A',
    emergencyContact: 'N/A'
  };

  const [editForm, setEditForm] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    address: patient.address,
    emergencyContact: patient.emergencyContact
  });

  useEffect(() => {
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
    });
  }, [
    patient.firstName,
    patient.lastName,
    patient.phone,
    patient.address,
    patient.emergencyContact,
  ]);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!currentUser || !apiBaseUrl) {
        return;
      }

      try {
        const patientListResponse = await fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`);
        const patientListResult = await patientListResponse.json();

        if (!patientListResponse.ok) {
          if (patientListResponse.status === 404) {
            setApiPatient(null);
            setApiAppointments([]);
            return;
          }

          throw new Error(patientListResult.message || 'Failed to fetch patient profile.');
        }

        const matchedPatient = (patientListResult.patients || []).find((p: Record<string, unknown>) => {
          return String(p.UserId ?? p.userId ?? '') === String(currentUser.id);
        });

        if (!matchedPatient) {
          setApiPatient(null);
          setApiAppointments([]);
          return;
        }

        const mappedPatient: ApiPatient = {
          id: String(matchedPatient.Id ?? matchedPatient.id ?? ''),
          userId: String(matchedPatient.UserId ?? matchedPatient.userId ?? ''),
          firstName: String(matchedPatient.FirstName ?? matchedPatient.firstName ?? ''),
          lastName: String(matchedPatient.LastName ?? matchedPatient.lastName ?? ''),
          email: String(matchedPatient.Email ?? matchedPatient.email ?? currentUser.email ?? ''),
          phone: String(matchedPatient.Phone ?? matchedPatient.phone ?? ''),
          dateOfBirth: String(matchedPatient.DateOfBirth ?? matchedPatient.dateOfBirth ?? '').slice(0, 10),
          gender: String(matchedPatient.Gender ?? matchedPatient.gender ?? ''),
          address: String(matchedPatient.Address ?? matchedPatient.address ?? ''),
          emergencyContact: String(matchedPatient.EmergencyContact ?? matchedPatient.emergencyContact ?? ''),
        };

        setApiPatient(mappedPatient);

        const appointmentResponse = await fetch(
          `${apiBaseUrl}/patients/${mappedPatient.id}/appointments`
        );
        const appointmentResult = await appointmentResponse.json();

        if (!appointmentResponse.ok) {
          throw new Error(appointmentResult.message || 'Failed to fetch appointments.');
        }

        const mappedAppointments: ApiAppointment[] = (appointmentResult || []).map(
          (appointment: Record<string, unknown>) => ({
            id: String(appointment.Id ?? appointment.id ?? ''),
            therapistId: String(appointment.TherapistId ?? appointment.therapistId ?? ''),
            date: String(appointment.AppointmentDate ?? appointment.date ?? ''),
            time: String(appointment.AppointmentTime ?? appointment.time ?? ''),
            duration: Number(appointment.DurationMinutes ?? appointment.duration ?? 60),
            type: String(appointment.Type ?? appointment.type ?? 'Individual'),
            status: String(appointment.Status ?? appointment.status ?? 'Pending'),
          })
        );

        setApiAppointments(mappedAppointments);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load patient data.';
        toast.error(message);
      }
    };

    loadPatientData();
  }, [apiBaseUrl, currentUser]);

  const effectiveAppointments = apiAppointments.length > 0 ? apiAppointments : appointments.filter(
    (a) => String(a.patientId) === String(patient.userId)
  );

  const myAppointments = effectiveAppointments.filter(
    (a) => new Date(a.date) >= new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const myPlans = treatmentPlans.filter(
    (tp) => String(tp.patientId) === String(patient.userId) && tp.status === 'Active'
  );

  const myInvoices = invoices.filter(
    (i) => String(i.patientId) === String(patient.userId) && i.paymentStatus === 'Pending'
  );

  const handleSaveProfile = async () => {
    if (apiPatient && apiBaseUrl) {
      try {
        const response = await fetch(`${apiBaseUrl}/patients/update/${apiPatient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...editForm,
            email: apiPatient.email,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to update patient profile.');
        }

        setApiPatient((prev) => prev ? {
          ...prev,
          ...editForm,
        } : prev);
        toast.success(result.message || 'Profile updated successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update profile.';
        toast.error(message);
        return;
      }
    }

    if (foundPatient) {
      updateEntity('patients', foundPatient.id, {
        ...foundPatient,
        ...editForm
      });
    }
    updateEntity('users', currentUser.id, {
      ...currentUser,
      ...editForm
    });

    setIsEditProfileOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Patient Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title="My Profile"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          }>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <UserIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm text-slate-500">{patient.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span className="block text-slate-500">Phone</span>
                <span className="font-medium text-slate-900">{patient.phone}</span>
              </div>
              <div>
                <span className="block text-slate-500">Date of Birth</span>
                <span className="font-medium text-slate-900">{patient.dateOfBirth}</span>
              </div>
              <div>
                <span className="block text-slate-500">Gender</span>
                <span className="font-medium text-slate-900">{patient.gender}</span>
              </div>
              <div>
                <span className="block text-slate-500">Emergency Contact</span>
                <span className="font-medium text-slate-900">{patient.emergencyContact}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">Address</span>
                <span className="font-medium text-slate-900">{patient.address}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Upcoming Appointments">
          {myAppointments.length > 0 ? (
            <div className="space-y-4">
              {myAppointments.map((apt) => {
                const therapist = therapists.find((t) => t.userId === apt.therapistId);
                return (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Dr. {therapist?.lastName || 'Therapist'}</p>
                        <p className="text-sm text-slate-500">{apt.date} at {apt.time} ({apt.duration} min)</p>
                        <p className="text-xs text-slate-400 mt-1">{apt.type} Session</p>
                      </div>
                    </div>
                    <Badge variant={apt.status === 'Confirmed' ? 'success' : 'warning'}>{apt.status}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No upcoming appointments.</p>
          )}
        </Card>

        <Card title="Active Treatment Plans">
          {myPlans.length > 0 ? (
            <div className="space-y-4">
              {myPlans.map((plan) => (
                <div key={plan.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-3">
                    <TargetIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-slate-900">{plan.name}</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">Started: {plan.startDate}</p>
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Objectives & Homework</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap bg-white p-3 rounded border border-slate-200">{plan.objectives}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No active treatment plans.</p>
          )}
        </Card>

        <Card title="Pending Invoices">
          {myInvoices.length > 0 ? (
            <div className="space-y-4">
              {myInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-3">
                    <FileTextIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Invoice #{invoice.id.substring(0, 6).toUpperCase()}</p>
                      <p className="text-sm text-slate-500">Date: {invoice.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${invoice.finalAmount.toFixed(2)}</p>
                    <Badge variant="error" className="mt-1">Pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No pending invoices.</p>
          )}
        </Card>
      </div>

      <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
            <Input label="Last Name" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
          </div>
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          <Input label="Emergency Contact" value={editForm.emergencyContact} onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}