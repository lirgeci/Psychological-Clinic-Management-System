import React, { useState } from 'react';
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
export function TherapistSessions() {
  const {
    currentUser,
    appointments,
    patients,
    sessions,
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
    startDate: '',
    endDate: '',
    status: 'Active'
  });
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(
    (a) =>
    a.therapistId === currentUser?.id &&
    a.date === today &&
    a.status === 'Confirmed'
  );
  const todaysSessions = sessions.filter(
    (s) => s.therapistId === currentUser?.id && s.date === today
  );
  const handleStartSession = (apt: any) => {
    const newSession = {
      appointmentId: apt.id,
      patientId: apt.patientId,
      therapistId: currentUser!.id,
      date: today,
      startTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: apt.type,
      status: 'In Progress'
    };
    addEntity('sessions', newSession);
    updateEntity('appointments', apt.id, {
      status: 'Completed'
    });
  };
  const handleEndSession = (session: any) => {
    updateEntity('sessions', session.id, {
      status: 'Completed',
      endTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    });
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
      startDate: today,
      endDate: '',
      status: 'Active'
    });
  };
  const saveNotes = () => {
    if (!notesForm.clinicalObservations || !notesForm.progressNotes) {
      toast.error('Please fill in required note fields.');
      return;
    }
    addEntity('sessionNotes', {
      sessionId: selectedSession.id,
      therapistId: currentUser!.id,
      patientId: selectedSession.patientId,
      ...notesForm,
      date: today
    });
    toast.success('Notes saved successfully');
  };
  const saveDiagnosis = () => {
    if (!diagnosisForm.code || !diagnosisForm.name) {
      toast.error('Please fill in required diagnosis fields.');
      return;
    }
    addEntity('diagnoses', {
      patientId: selectedSession.patientId,
      therapistId: currentUser!.id,
      ...diagnosisForm,
      date: today
    });
    toast.success('Diagnosis saved successfully');
  };
  const savePlan = () => {
    if (!planForm.name || !planForm.objectives) {
      toast.error('Please fill in required plan fields.');
      return;
    }
    addEntity('treatmentPlans', {
      patientId: selectedSession.patientId,
      therapistId: currentUser!.id,
      diagnosisId: 'd1',
      ...planForm
    });
    toast.success('Treatment plan saved successfully');
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
              const patient = patients.find((p) => p.userId === apt.patientId);
              // Check if session already exists for this appointment
              const sessionExists = todaysSessions.some(
                (s) => s.appointmentId === apt.id
              );
              if (sessionExists) return null;
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                  
                    <div>
                      <p className="font-medium text-slate-900">
                        {patient?.firstName} {patient?.lastName}
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
            todaysSessions.some((s) => s.appointmentId === apt.id)
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
              const patient = patients.find(
                (p) => p.userId === session.patientId
              );
              return (
                <div
                  key={session.id}
                  className={`p-4 border rounded-lg shadow-sm ${session.status === 'In Progress' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                  
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {patient?.firstName} {patient?.lastName}
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