import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from 'sonner';
import {
  UserIcon,
  CalendarIcon,
  ClipboardListIcon,
  MapPinIcon,
  EditIcon,
} from 'lucide-react';

interface ApiTherapist {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  hireDate: string;
  bio: string;
}

interface ApiAppointment {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  roomId?: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function TherapistDashboard() {
  const {
    currentUser,
    therapists,
    patients,
    appointments,
    rooms,
    questionnaireResponses,
    questionnaires,
    updateEntity,
  } = useStore();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [apiTherapist, setApiTherapist] = useState<ApiTherapist | null>(null);
  const [apiAppointments, setApiAppointments] = useState<ApiAppointment[]>([]);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    bio: '',
  });

  useEffect(() => {
    const loadTherapistData = async () => {
      if (!currentUser || !apiBaseUrl) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch therapist profile.');
        }

        const matchedTherapist = (result.therapists || []).find((therapist: Record<string, unknown>) => {
          return String(therapist.UserId ?? therapist.userId ?? '') === String(currentUser.id);
        });

        if (!matchedTherapist) {
          setApiTherapist(null);
          setApiAppointments([]);
          return;
        }

        const mappedTherapist: ApiTherapist = {
          id: String(matchedTherapist.Id ?? matchedTherapist.id ?? ''),
          userId: String(matchedTherapist.UserId ?? matchedTherapist.userId ?? ''),
          firstName: String(matchedTherapist.FirstName ?? matchedTherapist.firstName ?? ''),
          lastName: String(matchedTherapist.LastName ?? matchedTherapist.lastName ?? ''),
          email: String(matchedTherapist.Email ?? matchedTherapist.email ?? currentUser.email ?? ''),
          phone: String(matchedTherapist.Phone ?? matchedTherapist.phone ?? ''),
          specialization: String(matchedTherapist.Specialization ?? matchedTherapist.specialization ?? ''),
          licenseNumber: String(matchedTherapist.LicenseNumber ?? matchedTherapist.licenseNumber ?? ''),
          qualifications: String(matchedTherapist.Qualifications ?? matchedTherapist.qualifications ?? ''),
          hireDate: String(matchedTherapist.EmploymentDate ?? matchedTherapist.hireDate ?? '').slice(0, 10),
          bio: String(matchedTherapist.Biography ?? matchedTherapist.bio ?? ''),
        };

        setApiTherapist(mappedTherapist);
        setEditForm({
          firstName: mappedTherapist.firstName,
          lastName: mappedTherapist.lastName,
          phone: mappedTherapist.phone,
          specialization: mappedTherapist.specialization,
          bio: mappedTherapist.bio,
        });

        const appointmentResponse = await fetch(`${apiBaseUrl}/therapists/${mappedTherapist.id}/appointments`);
        const appointmentResult = await appointmentResponse.json();

        if (!appointmentResponse.ok) {
          throw new Error(appointmentResult.message || 'Failed to fetch therapist appointments.');
        }

        const mappedAppointments: ApiAppointment[] = (appointmentResult || []).map(
          (appointment: Record<string, unknown>) => ({
            id: String(appointment.Id ?? appointment.id ?? ''),
            patientId: String(appointment.PatientId ?? appointment.patientId ?? ''),
            therapistId: String(appointment.TherapistId ?? appointment.therapistId ?? ''),
            date: String(appointment.AppointmentDate ?? appointment.date ?? ''),
            time: String(appointment.AppointmentTime ?? appointment.time ?? ''),
            duration: Number(appointment.DurationMinutes ?? appointment.duration ?? 60),
            type: String(appointment.Type ?? appointment.type ?? 'Individual'),
            status: String(appointment.Status ?? appointment.status ?? 'Pending'),
            roomId: String(appointment.RoomId ?? appointment.roomId ?? '') || undefined,
          })
        );

        setApiAppointments(mappedAppointments);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load therapist data.';
        toast.error(message);
      }
    };

    loadTherapistData();
  }, [apiBaseUrl, currentUser]);

  const therapist = useMemo(() => {
    const storeTherapist = therapists.find((t) => String(t.userId) === String(currentUser?.id));
    return apiTherapist || storeTherapist || null;
  }, [apiTherapist, therapists, currentUser?.id]);

  const today = new Date().toISOString().split('T')[0];
  const scheduleSource = apiAppointments.length > 0 ? apiAppointments : appointments;

  const todaysAppointments = scheduleSource
    .filter(
      (appointment) =>
        String(appointment.therapistId) === String(therapist?.userId ?? currentUser?.id) &&
        appointment.date === today &&
        (appointment.status === 'Confirmed' || appointment.status === 'Pending')
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const todaysRooms = Array.from(
    new Set(
      todaysAppointments
        .filter((appointment) => appointment.status === 'Confirmed' && appointment.roomId)
        .map((appointment) => appointment.roomId)
    )
  )
    .map((roomId) => rooms.find((room) => room.id === roomId))
    .filter(Boolean);

  const myPatientIds = Array.from(
    new Set(
      scheduleSource
        .filter((appointment) => String(appointment.therapistId) === String(therapist?.userId ?? currentUser?.id))
        .map((appointment) => appointment.patientId)
    )
  );

  const recentResponses = questionnaireResponses
    .filter((response) => myPatientIds.includes(response.patientId))
    .sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime())
    .slice(0, 5);

  const handleSaveProfile = async () => {
    if (!therapist || !currentUser) {
      return;
    }

    if (apiTherapist && apiBaseUrl) {
      try {
        const response = await fetch(`${apiBaseUrl}/therapists/update/${apiTherapist.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            phone: editForm.phone,
            specialization: editForm.specialization,
            biography: editForm.bio,
            email: apiTherapist.email,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to update therapist profile.');
        }

        setApiTherapist((prev) =>
          prev
            ? {
                ...prev,
                ...editForm,
              }
            : prev
        );
        toast.success(result.message || 'Profile updated successfully.');
        setIsEditProfileOpen(false);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update profile.';
        toast.error(message);
        return;
      }
    }

    updateEntity('therapists', therapist.id, {
      ...therapist,
      ...editForm,
    });
    updateEntity('users', currentUser.id, {
      ...currentUser,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      phone: editForm.phone,
    });
    setIsEditProfileOpen(false);
  };

  if (!currentUser) {
    return <div className="p-10 text-center text-slate-500">Loading user session...</div>;
  }

  if (!therapist) {
    return <div className="p-10 text-center text-slate-500">Loading therapist profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Therapist Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title="My Profile"
          action={
            <Button variant="ghost" size="sm" onClick={() => setIsEditProfileOpen(true)}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <UserIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  Dr. {therapist.firstName} {therapist.lastName}
                </h3>
                <p className="text-sm text-slate-500">{therapist.specialization}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span className="block text-slate-500">Email</span>
                <span className="font-medium text-slate-900">{therapist.email}</span>
              </div>
              <div>
                <span className="block text-slate-500">Phone</span>
                <span className="font-medium text-slate-900">{therapist.phone}</span>
              </div>
              <div>
                <span className="block text-slate-500">License Number</span>
                <span className="font-medium text-slate-900">{therapist.licenseNumber}</span>
              </div>
              <div>
                <span className="block text-slate-500">Hire Date</span>
                <span className="font-medium text-slate-900">{therapist.hireDate}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">Qualifications</span>
                <span className="font-medium text-slate-900">{therapist.qualifications}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">Bio</span>
                <span className="font-medium text-slate-900">{therapist.bio}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Today's Schedule">
          {todaysAppointments.length > 0 ? (
            <div className="space-y-4">
              {todaysAppointments.map((appointment) => {
                const patient = patients.find((candidate) => candidate.userId === appointment.patientId);
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {appointment.time} ({appointment.duration} min) - {appointment.type}
                        </p>
                      </div>
                    </div>
                    <Badge variant={appointment.status === 'Confirmed' ? 'success' : 'warning'}>
                      {appointment.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No appointments scheduled for today.</p>
          )}
        </Card>

        <Card title="Assigned Rooms (Today)">
          {todaysRooms.length > 0 ? (
            <div className="space-y-4">
              {todaysRooms.map(
                (room) =>
                  room && (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {room.name} (Floor {room.floor})
                          </p>
                          <p className="text-sm text-slate-500">
                            {room.type} - Capacity: {room.capacity}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Equipment: {room.equipment}</p>
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No rooms assigned for today.</p>
          )}
        </Card>

        <Card title="Recent Questionnaire Results">
          {recentResponses.length > 0 ? (
            <div className="space-y-4">
              {recentResponses.map((response) => {
                const patient = patients.find((candidate) => candidate.userId === response.patientId);
                const questionnaire = questionnaires.find((candidate) => candidate.id === response.questionnaireId);
                return (
                  <div
                    key={response.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() =>
                      setSelectedResponse({
                        response,
                        patient,
                        questionnaire,
                      })
                    }
                  >
                    <div className="flex items-start gap-3">
                      <ClipboardListIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{questionnaire?.title}</p>
                        <p className="text-xs text-slate-400 mt-1">Completed: {response.dateCompleted}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-slate-500">Score</span>
                      <span className="font-bold text-slate-900 text-lg">{response.totalScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No recent questionnaire responses.</p>
          )}
        </Card>
      </div>

      <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  firstName: e.target.value,
                })
              }
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  lastName: e.target.value,
                })
              }
            />
          </div>
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                phone: e.target.value,
              })
            }
          />
          <Input
            label="Specialization"
            value={editForm.specialization}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                specialization: e.target.value,
              })
            }
          />
          <Textarea
            label="Bio"
            rows={4}
            value={editForm.bio}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                bio: e.target.value,
              })
            }
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {selectedResponse && (
      <Modal
        isOpen={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        title={`Response: ${selectedResponse.questionnaire?.title}`}
        maxWidth="lg">
        
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm text-slate-500">Patient</p>
                <p className="font-medium text-slate-900">
                  {selectedResponse.patient?.firstName}{' '}
                  {selectedResponse.patient?.lastName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Score</p>
                <p className="font-bold text-blue-600 text-xl">
                  {selectedResponse.response.totalScore}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {selectedResponse.questionnaire?.questions.map(
              (q: any, idx: number) =>
              <div
                key={q.id}
                className="bg-slate-50 p-3 rounded border border-slate-100">
                
                    <p className="font-medium text-slate-800 text-sm mb-2">
                      {idx + 1}. {q.text}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {Array.isArray(selectedResponse.response.answers[q.id]) ?
                  selectedResponse.response.answers[q.id].join(', ') :
                  selectedResponse.response.answers[q.id] ||
                  'No answer provided'}
                    </p>
                  </div>

            )}
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setSelectedResponse(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}