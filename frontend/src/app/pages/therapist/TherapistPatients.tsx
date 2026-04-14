import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { UsersIcon, EyeIcon } from 'lucide-react';
export function TherapistPatients() {
  const {
    currentUser,
    patients,
    appointments,
    diagnoses,
    treatmentPlans,
    sessions,
    questionnaireResponses,
    questionnaires
  } = useStore();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'diagnoses' | 'plans' | 'sessions' | 'questionnaires'>(
    'diagnoses');
  // Get unique patients assigned to this therapist (based on appointments)
  const myPatientIds = Array.from(
    new Set(
      appointments.
      filter((a) => a.therapistId === currentUser?.id).
      map((a) => a.patientId)
    )
  );
  const myPatients = patients.filter((p) => myPatientIds.includes(p.userId));
  const columns = [
  {
    header: 'Name',
    accessor: (row: any) => `${row.firstName} ${row.lastName}`,
    sortable: true,
    sortKey: 'firstName'
  },
  {
    header: 'Email',
    accessor: 'email' as keyof (typeof myPatients)[0],
    sortable: true,
    sortKey: 'email'
  },
  {
    header: 'Phone',
    accessor: 'phone' as keyof (typeof myPatients)[0]
  },
  {
    header: 'Registration Date',
    accessor: 'registrationDate' as keyof (typeof myPatients)[0],
    sortable: true,
    sortKey: 'registrationDate'
  }];

  const actions = (row: any) =>
  <Button
    size="sm"
    variant="ghost"
    onClick={() => {
      setSelectedPatient(row);
      setActiveTab('diagnoses');
    }}>
    
      <EyeIcon className="h-4 w-4 mr-2" /> View Details
    </Button>;

  const renderTabContent = () => {
    if (!selectedPatient) return null;
    if (activeTab === 'diagnoses') {
      const pDiagnoses = diagnoses.filter(
        (d) => d.patientId === selectedPatient.userId
      );
      return pDiagnoses.length > 0 ?
      <div className="space-y-4">
          {pDiagnoses.map((d) =>
        <div key={d.id} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex justify-between">
                <h4 className="font-medium">
                  {d.name} ({d.code})
                </h4>
                <Badge variant={d.severity === 'Severe' ? 'error' : 'warning'}>
                  {d.severity}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-2">{d.description}</p>
              <p className="text-xs text-slate-400 mt-2">Date: {d.date}</p>
            </div>
        )}
        </div> :

      <p className="text-slate-500 text-center py-4">No diagnoses found.</p>;

    }
    if (activeTab === 'plans') {
      const pPlans = treatmentPlans.filter(
        (tp) => tp.patientId === selectedPatient.userId
      );
      return pPlans.length > 0 ?
      <div className="space-y-4">
          {pPlans.map((p) =>
        <div key={p.id} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex justify-between">
                <h4 className="font-medium">{p.name}</h4>
                <Badge variant={p.status === 'Active' ? 'success' : 'default'}>
                  {p.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                {p.objectives}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {p.startDate} to {p.endDate}
              </p>
            </div>
        )}
        </div> :

      <p className="text-slate-500 text-center py-4">
          No treatment plans found.
        </p>;

    }
    if (activeTab === 'sessions') {
      const pSessions = sessions.
      filter((s) => s.patientId === selectedPatient.userId).
      sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return pSessions.length > 0 ?
      <div className="space-y-4">
          {pSessions.map((s) =>
        <div
          key={s.id}
          className="p-4 border rounded-lg bg-slate-50 flex justify-between items-center">
          
              <div>
                <p className="font-medium">{s.date}</p>
                <p className="text-sm text-slate-600">
                  {s.startTime} - {s.endTime} | {s.type}
                </p>
              </div>
              <Badge variant={s.status === 'Completed' ? 'success' : 'info'}>
                {s.status}
              </Badge>
            </div>
        )}
        </div> :

      <p className="text-slate-500 text-center py-4">No sessions found.</p>;

    }
    if (activeTab === 'questionnaires') {
      const pResponses = questionnaireResponses.filter(
        (qr) => qr.patientId === selectedPatient.userId
      );
      return pResponses.length > 0 ?
      <div className="space-y-4">
          {pResponses.map((r) => {
          const q = questionnaires.find((q) => q.id === r.questionnaireId);
          return (
            <div
              key={r.id}
              className="p-4 border rounded-lg bg-slate-50 flex justify-between items-center">
              
                <div>
                  <p className="font-medium">{q?.title}</p>
                  <p className="text-sm text-slate-600">
                    Completed: {r.dateCompleted}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Score</span>
                  <p className="font-bold text-lg text-blue-600">
                    {r.totalScore}
                  </p>
                </div>
              </div>);

        })}
        </div> :

      <p className="text-slate-500 text-center py-4">
          No questionnaire responses found.
        </p>;

    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <UsersIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
      </div>

      <DataTable
        data={myPatients}
        columns={columns}
        searchable
        searchKey="firstName"
        actions={actions} />
      

      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={`Patient Details: ${selectedPatient?.firstName} ${selectedPatient?.lastName}`}
        maxWidth="2xl">
        
        <div className="space-y-6">
          <div className="flex space-x-1 border-b border-slate-200">
            {['diagnoses', 'plans', 'sessions', 'questionnaires'].map((tab) =>
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )}
          </div>

          <div className="min-h-[300px] max-h-[500px] overflow-y-auto pr-2">
            {renderTabContent()}
          </div>
        </div>
      </Modal>
    </div>);

}