import { useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { ActivityIcon, PlayIcon, SquareIcon, FileEditIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ApiAppointment {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
}

interface ApiSession {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: string;
  status: string;
}

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const formatTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

const SESSION_BASE_RATES: Record<string, number> = {
  Individual: 120,
  Couple: 140,
  Family: 160,
};

const calculateInvoiceAmount = (sessionType: string) => {
  return SESSION_BASE_RATES[sessionType] || SESSION_BASE_RATES.Individual;
};

const mapSessionFromApi = (session: Record<string, unknown>, fallback: Record<string, unknown>) => ({
  id: String(session.Id ?? session.id ?? fallback.id ?? ''),
  appointmentId: String(fallback.appointmentId ?? ''),
  patientId: String(session.PatientId ?? session.patientId ?? fallback.patientId ?? ''),
  therapistId: String(session.TherapistId ?? session.therapistId ?? fallback.therapistId ?? ''),
  date: String(session.SessionDate ?? session.date ?? fallback.date ?? ''),
  startTime: String(session.StartTime ?? session.startTime ?? fallback.startTime ?? ''),
  endTime: session.EndTime ?? session.endTime ?? fallback.endTime,
  type: String(session.SessionType ?? session.type ?? fallback.type ?? ''),
  status: String(session.Status ?? session.status ?? fallback.status ?? '')
});

export function TherapistSessions() {
  const {
    currentUser,
    appointments,
    patients,
    diagnoses,
    sessions,
    invoices,
    addEntity,
    updateEntity
  } = useStore();
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [notesForm, setNotesForm] = useState({
    clinicalObservations: '',
    progressNotes: '',
    homeworkAssigned: '',
    nextStepsPlan: ''
  });
  const [diagnosisForm, setDiagnosisForm] = useState({
    code: '',
    name: '',
    description: '',
    severity: 'Moderate'
  });
  const [planForm, setPlanForm] = useState({
    name: '',
    objectives: '',
    diagnosisId: '',
    startDate: '',
    endDate: '',
    status: 'Active'
  });
  const [apiAppointments, setApiAppointments] = useState<ApiAppointment[]>([]);
  const [apiSessions, setApiSessions] = useState<ApiSession[]>([]);
  const [apiPatients, setApiPatients] = useState<Array<Record<string, unknown>>>([]);
  const [apiDiagnoses, setApiDiagnoses] = useState<Array<Record<string, unknown>>>([]);
  const [therapistApiId, setTherapistApiId] = useState<string | null>(null);
  // Use local date to avoid timezone misalignment
  const today = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

  const getPatientDisplayName = (patientId: string) => {
    if (apiBaseUrl) {
      const patient = apiPatients.find(
        (item) => String(item.Id ?? item.id ?? item.UserId ?? item.userId ?? '') === String(patientId)
      );

      if (patient) {
        return `${String(patient.FirstName ?? patient.firstName ?? '')} ${String(patient.LastName ?? patient.lastName ?? '')}`.trim();
      }
    }

    const storePatient = patients.find((p) => String(p.userId) === String(patientId));
    return `${storePatient?.firstName || ''} ${storePatient?.lastName || ''}`.trim() || 'Unknown Patient';
  };

  const loadApiReferenceData = async () => {
    if (!apiBaseUrl) {
      setApiPatients([]);
      setApiDiagnoses([]);
      return;
    }

    try {
      const [patientsResponse, diagnosesResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
        fetch(`${apiBaseUrl}/diagnoses/get-all?page=1&limit=1000`),
      ]);

      const patientsResult = await patientsResponse.json();
      const diagnosesResult = await diagnosesResponse.json();

      if (!patientsResponse.ok && patientsResponse.status !== 404) {
        throw new Error(patientsResult.message || 'Failed to load patients.');
      }

      if (!diagnosesResponse.ok && diagnosesResponse.status !== 404) {
        throw new Error(diagnosesResult.message || 'Failed to load diagnoses.');
      }

      setApiPatients((patientsResult.patients || []).map((patient: Record<string, unknown>) => patient));
      setApiDiagnoses((diagnosesResult.diagnoses || []).map((diagnosis: Record<string, unknown>) => diagnosis));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load clinical references.';
      toast.error(message);
    }
  };

  const loadTherapistAppointments = async () => {
    if (!currentUser || !apiBaseUrl) {
      setApiAppointments([]);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load therapist profile.');
      }

      const matchedTherapist = (result.therapists || []).find((therapist: Record<string, unknown>) =>
        String(therapist.UserId ?? therapist.userId ?? '') === String(currentUser.id)
      );

      if (!matchedTherapist) {
        setApiAppointments([]);
        setTherapistApiId(null);
        return;
      }

      const therapistId = String(matchedTherapist.Id ?? matchedTherapist.id ?? '');
      setTherapistApiId(therapistId);
      const appointmentsResponse = await fetch(`${apiBaseUrl}/therapists/${therapistId}/appointments`);
      const appointmentsResult = await appointmentsResponse.json();

      if (!appointmentsResponse.ok) {
        throw new Error(appointmentsResult.message || 'Failed to load appointments.');
      }

      const mappedAppointments: ApiAppointment[] = (appointmentsResult || []).map(
        (appointment: Record<string, unknown>) => ({
          id: String(appointment.Id ?? appointment.id ?? ''),
          patientId: String(appointment.PatientId ?? appointment.patientId ?? ''),
          therapistId: String(appointment.TherapistId ?? appointment.therapistId ?? ''),
          date: String(appointment.AppointmentDate ?? appointment.date ?? '').slice(0, 10),
          time: String(appointment.AppointmentTime ?? appointment.time ?? '').slice(0, 5),
          duration: Number(appointment.DurationMinutes ?? appointment.duration ?? 60),
          type: String(appointment.Type ?? appointment.type ?? 'Individual'),
          status: String(appointment.Status ?? appointment.status ?? 'Pending')
        })
      );

      setApiAppointments(mappedAppointments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load appointments.';
      toast.error(message);
      setApiAppointments([]);
      setTherapistApiId(null);
    }
  };

  const loadTherapistSessions = async (therapistId: string) => {
    if (!apiBaseUrl) {
      setApiSessions([]);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/sessions/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load sessions.');
      }

      const mappedSessions = (result.sessions || []).map((session: Record<string, unknown>) =>
        mapSessionFromApi(session, {})
      );

      const filteredSessions = mappedSessions.filter(
        (session: ApiSession) => String(session.therapistId) === String(therapistId)
      );

      setApiSessions(filteredSessions);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sessions.';
      toast.error(message);
      setApiSessions([]);
    }
  };

  useEffect(() => {
    loadTherapistAppointments();
  }, [currentUser]);

  useEffect(() => {
    loadApiReferenceData();
  }, []);

  useEffect(() => {
    if (therapistApiId) {
      loadTherapistSessions(therapistApiId);
    } else {
      setApiSessions([]);
    }
  }, [therapistApiId]);

  const scheduleSource = apiAppointments.length > 0 ? apiAppointments : appointments;
  const todaysAppointments = scheduleSource.filter((appointment) => {
    const matchesTherapist = apiAppointments.length > 0 || appointment.therapistId === currentUser?.id;
    // Normalize date comparison to handle both YYYY-MM-DD and datetime strings
    const appointmentDate = String(appointment.date).slice(0, 10);
    return matchesTherapist && appointmentDate === today && appointment.status === 'Confirmed';
  });
  const todaysSessions = (apiSessions.length > 0 ? apiSessions : sessions).filter(
    (session) => session.date === today
  );
  const handleStartSession = async (apt: any) => {
    const startTime = formatTime();
    const payload = {
      patientId: apt.patientId,
      therapistId: apt.therapistId,
      date: today,
      startTime,
      type: apt.type,
      status: 'In Progress'
    };

    if (!apiBaseUrl) {
      addEntity('sessions', {
        appointmentId: apt.id,
        ...payload
      });
      updateEntity('appointments', apt.id, {
        status: 'Completed'
      });
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to start session.');
      }

      const createdSession = mapSessionFromApi(result.session || result, {
        appointmentId: apt.id,
        ...payload
      });

      addEntity('sessions', createdSession);
      setApiAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === apt.id ? { ...appointment, status: 'Completed' } : appointment
        )
      );
      if (therapistApiId) {
        await loadTherapistSessions(therapistApiId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start session.';
      toast.error(message);
    }
  };

  const handleEndSession = async (session: any) => {
    const endTime = formatTime();

    if (!apiBaseUrl) {
      updateEntity('sessions', session.id, {
        status: 'Completed',
        endTime
      });

      const invoiceExists = invoices.some(
        (invoice) => String(invoice.sessionId) === String(session.id)
      );

      if (!invoiceExists) {
        const amount = calculateInvoiceAmount(String(session.type));

        addEntity('invoices', {
          patientId: session.patientId,
          sessionId: session.id,
          amount,
          discount: 0,
          finalAmount: amount,
          date: today,
          paymentStatus: 'Pending'
        });
      }

      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/sessions/update/${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endTime,
          status: 'Completed'
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to end session.');
      }

      const updatedSession = mapSessionFromApi(result.session || result, {
        ...session,
        endTime,
        status: 'Completed'
      });

      updateEntity('sessions', session.id, updatedSession);
      if (therapistApiId) {
        await loadTherapistSessions(therapistApiId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end session.';
      toast.error(message);
    }
  };
  const openDocumentation = (session: any) => {
    setSelectedSession(session);
    setDocModalOpen(true);
    setNotesForm({
      clinicalObservations: '',
      progressNotes: '',
      homeworkAssigned: '',
      nextStepsPlan: ''
    });
    setDiagnosisForm({
      code: '',
      name: '',
      description: '',
      severity: 'Moderate'
    });
    setPlanForm({
      name: '',
      objectives: '',
      diagnosisId: '',
      startDate: today,
      endDate: '',
      status: 'Active'
    });
  };
  const saveNotes = async () => {
    if (!notesForm.clinicalObservations || !notesForm.progressNotes) {
      toast.error('Please fill in required note fields.');
      return;
    }

    if (!apiBaseUrl) {
      addEntity('sessionNotes', {
        sessionId: selectedSession.id,
        therapistId: currentUser!.id,
        patientId: selectedSession.patientId,
        ...notesForm,
        date: today
      });
      toast.success('Notes saved successfully');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/session-notes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          notes: notesForm.clinicalObservations,
          progress: notesForm.progressNotes,
          homework: notesForm.homeworkAssigned,
          nextPlan: notesForm.nextStepsPlan,
          createdDate: today,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save session notes.');
      }

      toast.success(result.message || 'Notes saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save notes.';
      toast.error(message);
    }
  };
  const saveDiagnosis = async () => {
    if (!diagnosisForm.code || !diagnosisForm.name) {
      toast.error('Please fill in required diagnosis fields.');
      return;
    }

    if (!apiBaseUrl) {
      addEntity('diagnoses', {
        patientId: selectedSession.patientId,
        therapistId: currentUser!.id,
        ...diagnosisForm,
        date: today
      });
      toast.success('Diagnosis saved successfully');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/diagnoses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosisCode: diagnosisForm.code,
          name: diagnosisForm.name,
          description: diagnosisForm.description,
          diagnosisDate: today,
          severity: diagnosisForm.severity,
          patientId: selectedSession.patientId,
          therapistId: selectedSession.therapistId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save diagnosis.');
      }

      await loadApiReferenceData();
      setPlanForm((prev) => ({
        ...prev,
        diagnosisId: String(result?.diagnosis?.Id ?? result?.diagnosis?.id ?? prev.diagnosisId),
      }));
      toast.success(result.message || 'Diagnosis saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save diagnosis.';
      toast.error(message);
    }
  };
  const savePlan = async () => {
    if (!planForm.name || !planForm.objectives || !planForm.diagnosisId) {
      toast.error('Please fill in required plan fields.');
      return;
    }

    if (!apiBaseUrl) {
      addEntity('treatmentPlans', {
        ...planForm,
        patientId: selectedSession.patientId,
        therapistId: currentUser!.id
      });
      toast.success('Treatment plan saved successfully');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/treatment-plans/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: planForm.name,
          objectives: planForm.objectives,
          startDate: planForm.startDate || today,
          endDate: planForm.endDate || null,
          status: planForm.status,
          patientId: selectedSession.patientId,
          therapistId: selectedSession.therapistId,
          diagnosisId: planForm.diagnosisId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save treatment plan.');
      }

      toast.success(result.message || 'Treatment plan saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save treatment plan.';
      toast.error(message);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Active Sessions</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ready to Start */}
        <Card title="Ready to Start (Today's Confirmed)">
          {todaysAppointments.length > 0 ?
          <div className="space-y-4">
              {todaysAppointments.map((apt) => {
              const patientName = getPatientDisplayName(String(apt.patientId));
              // Check if any session exists for this appointment (completed or in-progress) - prevent duplicate sessions
              const sessionExists = todaysSessions.some(
                (s) => String(s.patientId) === String(apt.patientId) && 
                       String(s.therapistId) === String(apt.therapistId)
              );
              if (sessionExists) return null;
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                  
                    <div>
                      <p className="font-medium text-slate-900">
                        {patientName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {apt.time} ({apt.duration} min) - {apt.type}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleStartSession(apt)}>
                      <PlayIcon className="h-4 w-4 mr-2" /> Start Session
                    </Button>
                  </div>);

            })}
              {todaysAppointments.every((apt) =>
            todaysSessions.some((s) => String(s.patientId) === String(apt.patientId) && 
                                       String(s.therapistId) === String(apt.therapistId))
            ) &&
            <p className="text-slate-500 text-center py-4">
                  All today's appointments have been started.
                </p>
            }
            </div> :

          <p className="text-slate-500 text-center py-4">
              No confirmed appointments ready to start.
            </p>
          }
        </Card>

        {/* Active & Completed Sessions */}
        <Card title="Today's Sessions">
          {todaysSessions.length > 0 ?
          <div className="space-y-4">
              {todaysSessions.map((session) => {
              const patientName = getPatientDisplayName(String(session.patientId));
              return (
                <div
                  key={session.id}
                  className={`p-4 border rounded-lg shadow-sm ${session.status === 'In Progress' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                  
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {patientName}
                        </p>
                        <p className="text-sm text-slate-500">
                          Started: {session.startTime}{' '}
                          {session.endTime ? `| Ended: ${session.endTime}` : ''}
                        </p>
                      </div>
                      <Badge
                      variant={
                      session.status === 'In Progress' ? 'info' : 'success'
                      }>
                      
                        {session.status}
                      </Badge>
                    </div>

                    <div className="flex justify-end gap-2">
                      {session.status === 'In Progress' ?
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleEndSession(session)}>
                      
                          <SquareIcon className="h-4 w-4 mr-2" /> End Session
                        </Button> :

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDocumentation(session)}>
                      
                          <FileEditIcon className="h-4 w-4 mr-2" /> Clinical
                          Documentation
                        </Button>
                    }
                    </div>
                  </div>);

            })}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No sessions started today.
            </p>
          }
        </Card>
      </div>

      {/* Clinical Documentation Modal */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Clinical Documentation"
        maxWidth="2xl">
        
        <div className="space-y-8">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
            <strong>Confidentiality Notice:</strong> Session notes are private
            clinical records and will never be visible to the patient. Diagnoses
            and Treatment Plans will be visible to the patient.
          </div>

          {/* Session Notes Form */}
          <div className="space-y-4 border border-slate-200 p-4 rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold text-slate-900 border-b pb-2">
              1. Private Session Notes
            </h3>
            <Textarea
              label="Clinical Observations *"
              required
              rows={3}
              value={notesForm.clinicalObservations}
              onChange={(e) =>
              setNotesForm({
                ...notesForm,
                clinicalObservations: e.target.value
              })
              } />
            
            <Textarea
              label="Progress Notes *"
              required
              rows={3}
              value={notesForm.progressNotes}
              onChange={(e) =>
              setNotesForm({
                ...notesForm,
                progressNotes: e.target.value
              })
              } />
            
            <Textarea
              label="Homework Assigned"
              rows={2}
              value={notesForm.homeworkAssigned}
              onChange={(e) =>
              setNotesForm({
                ...notesForm,
                homeworkAssigned: e.target.value
              })
              } />
            
            <Textarea
              label="Next Steps / Plan"
              rows={2}
              value={notesForm.nextStepsPlan}
              onChange={(e) =>
              setNotesForm({
                ...notesForm,
                nextStepsPlan: e.target.value
              })
              } />
            
            <div className="flex justify-end">
              <Button size="sm" onClick={saveNotes}>
                Save Notes
              </Button>
            </div>
          </div>

          {/* Diagnosis Form */}
          <div className="space-y-4 border border-slate-200 p-4 rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold text-slate-900 border-b pb-2">
              2. Add Diagnosis (Visible to Patient)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ICD/DSM Code *"
                required
                value={diagnosisForm.code}
                onChange={(e) =>
                setDiagnosisForm({
                  ...diagnosisForm,
                  code: e.target.value
                })
                } />
              
              <Input
                label="Condition Name *"
                required
                value={diagnosisForm.name}
                onChange={(e) =>
                setDiagnosisForm({
                  ...diagnosisForm,
                  name: e.target.value
                })
                } />
              
            </div>
            <Textarea
              label="Description"
              rows={2}
              value={diagnosisForm.description}
              onChange={(e) =>
              setDiagnosisForm({
                ...diagnosisForm,
                description: e.target.value
              })
              } />
            
            <Select
              label="Severity"
              options={[
              {
                label: 'Mild',
                value: 'Mild'
              },
              {
                label: 'Moderate',
                value: 'Moderate'
              },
              {
                label: 'Severe',
                value: 'Severe'
              }]
              }
              value={diagnosisForm.severity}
              onChange={(e) =>
              setDiagnosisForm({
                ...diagnosisForm,
                severity: e.target.value
              })
              } />
            
            <div className="flex justify-end">
              <Button size="sm" onClick={saveDiagnosis}>
                Save Diagnosis
              </Button>
            </div>
          </div>

          {/* Treatment Plan Form */}
          <div className="space-y-4 border border-slate-200 p-4 rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold text-slate-900 border-b pb-2">
              3. Treatment Plan (Visible to Patient)
            </h3>
            <Input
              label="Plan Name *"
              required
              value={planForm.name}
              onChange={(e) =>
              setPlanForm({
                ...planForm,
                name: e.target.value
              })
              } />

            <Select
              label="Diagnosis *"
              required
              value={planForm.diagnosisId}
              onChange={(e) =>
                setPlanForm({
                  ...planForm,
                  diagnosisId: e.target.value
                })
              }
              options={(apiBaseUrl ? apiDiagnoses : diagnoses)
                .filter((diagnosis: any) =>
                  String(diagnosis.PatientId ?? diagnosis.patientId ?? '') === String(selectedSession?.patientId)
                )
                .map((diagnosis: any) => ({
                  label: `${String(diagnosis.DiagnosisCode ?? diagnosis.code ?? '')} - ${String(diagnosis.Name ?? diagnosis.name ?? '')}`,
                  value: String(diagnosis.Id ?? diagnosis.id ?? '')
                }))} />
            
            <Textarea
              label="Objectives & Goals *"
              required
              rows={3}
              value={planForm.objectives}
              onChange={(e) =>
              setPlanForm({
                ...planForm,
                objectives: e.target.value
              })
              } />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={planForm.startDate}
                onChange={(e) =>
                setPlanForm({
                  ...planForm,
                  startDate: e.target.value
                })
                } />
              
              <Input
                label="End Date"
                type="date"
                value={planForm.endDate}
                onChange={(e) =>
                setPlanForm({
                  ...planForm,
                  endDate: e.target.value
                })
                } />
              
            </div>
            <Select
              label="Status"
              options={[
              {
                label: 'Active',
                value: 'Active'
              },
              {
                label: 'Completed',
                value: 'Completed'
              },
              {
                label: 'On Hold',
                value: 'On Hold'
              }]
              }
              value={planForm.status}
              onChange={(e) =>
              setPlanForm({
                ...planForm,
                status: e.target.value
              })
              } />
            
            <div className="flex justify-end">
              <Button size="sm" onClick={savePlan}>
                Save Plan
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setDocModalOpen(false)}>
              Close Documentation
            </Button>
          </div>
        </div>
      </Modal>
    </div>);

}