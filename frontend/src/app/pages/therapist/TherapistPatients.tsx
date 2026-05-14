import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { UsersIcon, EyeIcon } from 'lucide-react';
import { toast } from 'sonner';

type PatientRecord = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationDate: string;
};

const apiBaseUrl =
  ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function TherapistPatients() {
  const {
    currentUser,
    patients,
    appointments,
    diagnoses,
    treatmentPlans,
    sessions,
    questionnaireResponses,
    questionnaires,
  } = useStore();

  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [activeTab, setActiveTab] = useState<
    'diagnoses' | 'plans' | 'sessions' | 'questionnaires'
  >('diagnoses');

  const [apiPatients, setApiPatients] = useState<PatientRecord[]>([]);
  const [apiAppointments, setApiAppointments] = useState<Array<Record<string, unknown>>>([]);
  const [apiDiagnoses, setApiDiagnoses] = useState<Array<Record<string, unknown>>>([]);
  const [apiTreatmentPlans, setApiTreatmentPlans] = useState<Array<Record<string, unknown>>>([]);
  const [apiSessions, setApiSessions] = useState<Array<Record<string, unknown>>>([]);
  const [apiQuestionnaireResponses, setApiQuestionnaireResponses] = useState<Array<Record<string, unknown>>>([]);
  const [apiQuestionnaires, setApiQuestionnaires] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!apiBaseUrl || !currentUser) {
        return;
      }

      try {
        const [
          therapistsResponse,
          patientsResponse,
          diagnosesResponse,
          plansResponse,
          sessionsResponse,
          questionnaireResponsesResponse,
          questionnairesResponse,
        ] =
          await Promise.all([
            fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
            fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
            fetch(`${apiBaseUrl}/diagnoses/get-all?page=1&limit=1000`),
            fetch(`${apiBaseUrl}/treatment-plans/get-all?page=1&limit=1000`),
            fetch(`${apiBaseUrl}/sessions/get-all?page=1&limit=1000`),
            fetch(`${apiBaseUrl}/questionnaire-responses/get-all?page=1&limit=1000`),
            fetch(`${apiBaseUrl}/questionnaires/get-all?page=1&limit=1000`),
          ]);

        const therapistsResult = await therapistsResponse.json();
        const patientsResult = await patientsResponse.json();
        const diagnosesResult = await diagnosesResponse.json();
        const plansResult = await plansResponse.json();
        const sessionsResult = await sessionsResponse.json();
        const questionnaireResponsesResult = await questionnaireResponsesResponse.json();
        const questionnairesResult = await questionnairesResponse.json();

        if (!therapistsResponse.ok && therapistsResponse.status !== 404) {
          throw new Error(therapistsResult.message || 'Failed to load therapists.');
        }
        if (!patientsResponse.ok && patientsResponse.status !== 404) {
          throw new Error(patientsResult.message || 'Failed to load patients.');
        }
        if (!diagnosesResponse.ok && diagnosesResponse.status !== 404) {
          throw new Error(diagnosesResult.message || 'Failed to load diagnoses.');
        }
        if (!plansResponse.ok && plansResponse.status !== 404) {
          throw new Error(plansResult.message || 'Failed to load treatment plans.');
        }
        if (!sessionsResponse.ok && sessionsResponse.status !== 404) {
          throw new Error(sessionsResult.message || 'Failed to load sessions.');
        }
        if (!questionnaireResponsesResponse.ok && questionnaireResponsesResponse.status !== 404) {
          throw new Error(questionnaireResponsesResult.message || 'Failed to load questionnaire responses.');
        }
        if (!questionnairesResponse.ok && questionnairesResponse.status !== 404) {
          throw new Error(questionnairesResult.message || 'Failed to load questionnaires.');
        }

        const therapist = (therapistsResult.therapists || []).find(
          (item: Record<string, unknown>) => String(item.UserId ?? item.userId ?? '') === String(currentUser.id)
        );

        if (therapist) {
          const therapistAppointmentsResponse = await fetch(
            `${apiBaseUrl}/therapists/${String(therapist.Id ?? therapist.id ?? '')}/appointments`
          );
          const therapistAppointmentsResult = await therapistAppointmentsResponse.json();

          if (!therapistAppointmentsResponse.ok && therapistAppointmentsResponse.status !== 404) {
            throw new Error(therapistAppointmentsResult.message || 'Failed to load therapist appointments.');
          }

          setApiAppointments(
            Array.isArray(therapistAppointmentsResult)
              ? therapistAppointmentsResult
              : therapistAppointmentsResult.appointments || []
          );
        } else {
          setApiAppointments([]);
        }

        setApiPatients(
          (patientsResult.patients || []).map((item: Record<string, unknown>) => ({
            id: String(item.Id ?? item.id ?? ''),
            userId: String(item.UserId ?? item.userId ?? ''),
            firstName: String(item.FirstName ?? item.firstName ?? ''),
            lastName: String(item.LastName ?? item.lastName ?? ''),
            email: String(item.Email ?? item.email ?? ''),
            phone: String(item.Phone ?? item.phone ?? ''),
            registrationDate: String(item.createdAt ?? item.CreatedAt ?? '').slice(0, 10),
          }))
        );
        setApiDiagnoses(diagnosesResult.diagnoses || []);
        setApiTreatmentPlans(plansResult.treatmentPlans || []);
        setApiSessions(sessionsResult.sessions || []);
        setApiQuestionnaireResponses(questionnaireResponsesResult.questionnaireResponses || []);
        setApiQuestionnaires(questionnairesResult.questionnaires || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load therapist patient data.';
        toast.error(message);
      }
    };

    loadData();
  }, [currentUser]);

  const myPatientIds = useMemo(() => {
    if (apiBaseUrl && apiAppointments.length > 0) {
      return Array.from(
        new Set(apiAppointments.map((a) => String(a.PatientId ?? a.patientId ?? '')))
      );
    }

    return Array.from(
      new Set(
        appointments
          .filter((a) => a.therapistId === currentUser?.id)
          .map((a) => a.patientId)
      )
    );
  }, [apiAppointments, appointments, currentUser]);

  const myPatients: PatientRecord[] = useMemo(() => {
    if (apiBaseUrl && apiPatients.length > 0) {
      return apiPatients.filter((p) => myPatientIds.includes(p.id));
    }

    return patients
      .filter((p) => myPatientIds.includes(p.userId))
      .map((p) => ({
        id: String(p.id),
        userId: String(p.userId),
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        registrationDate: p.registrationDate,
      }));
  }, [apiPatients, myPatientIds, patients]);

  const columns: Column<PatientRecord>[] = [
    {
      header: 'Name',
      accessor: (row: PatientRecord) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      sortKey: 'firstName',
    },
    {
      header: 'Email',
      accessor: 'email' as keyof PatientRecord,
      sortable: true,
      sortKey: 'email',
    },
    {
      header: 'Phone',
      accessor: 'phone' as keyof PatientRecord,
    },
    {
      header: 'Registration Date',
      accessor: 'registrationDate' as keyof PatientRecord,
      sortable: true,
      sortKey: 'registrationDate',
    },
  ];

  const actions = (row: PatientRecord) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        setSelectedPatient(row);
        setActiveTab('diagnoses');
      }}
    >
      <EyeIcon className="h-4 w-4 mr-2" /> View Details
    </Button>
  );

  const renderTabContent = () => {
    if (!selectedPatient) return null;

    if (activeTab === 'diagnoses') {
      const pDiagnoses = apiBaseUrl
        ? apiDiagnoses.filter(
            (d) => String(d.PatientId ?? d.patientId ?? '') === selectedPatient.id
          )
        : diagnoses.filter((d) => d.patientId === selectedPatient.userId);

      return pDiagnoses.length > 0 ? (
        <div className="space-y-4">
          {pDiagnoses.map((d: any) => (
            <div key={String(d.id ?? d.Id)} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex justify-between">
                <h4 className="font-medium">
                  {String(d.name ?? d.Name)} ({String(d.code ?? d.DiagnosisCode ?? '')})
                </h4>
                <Badge variant={String(d.severity ?? d.Severity) === 'Severe' ? 'error' : 'warning'}>
                  {String(d.severity ?? d.Severity)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-2">{String(d.description ?? d.Description ?? '')}</p>
              <p className="text-xs text-slate-400 mt-2">
                Date: {String(d.date ?? d.DiagnosisDate ?? '').slice(0, 10)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-center py-4">No diagnoses found.</p>
      );
    }

    if (activeTab === 'plans') {
      const pPlans = apiBaseUrl
        ? apiTreatmentPlans.filter(
            (tp) => String(tp.PatientId ?? tp.patientId ?? '') === selectedPatient.id
          )
        : treatmentPlans.filter((tp) => tp.patientId === selectedPatient.userId);

      return pPlans.length > 0 ? (
        <div className="space-y-4">
          {pPlans.map((p: any) => (
            <div key={String(p.id ?? p.Id)} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex justify-between">
                <h4 className="font-medium">{String(p.name ?? p.Name)}</h4>
                <Badge variant={String(p.status ?? p.Status) === 'Active' ? 'success' : 'default'}>
                  {String(p.status ?? p.Status)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                {String(p.objectives ?? p.Objectives ?? '')}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {String(p.startDate ?? p.StartDate ?? '').slice(0, 10)} to {String(p.endDate ?? p.EndDate ?? '').slice(0, 10)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-center py-4">No treatment plans found.</p>
      );
    }

    if (activeTab === 'sessions') {
      const pSessions = (apiBaseUrl
        ? apiSessions.filter(
            (s) => String(s.PatientId ?? s.patientId ?? '') === selectedPatient.id
          )
        : sessions.filter((s) => s.patientId === selectedPatient.userId)
      ).sort((a: any, b: any) => {
        const aDate = String(a.date ?? a.SessionDate ?? '');
        const bDate = String(b.date ?? b.SessionDate ?? '');
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      return pSessions.length > 0 ? (
        <div className="space-y-4">
          {pSessions.map((s: any) => (
            <div
              key={String(s.id ?? s.Id)}
              className="p-4 border rounded-lg bg-slate-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{String(s.date ?? s.SessionDate ?? '').slice(0, 10)}</p>
                <p className="text-sm text-slate-600">
                  {String(s.startTime ?? s.StartTime ?? '')} - {String(s.endTime ?? s.EndTime ?? '')} | {String(s.type ?? s.Type ?? '')}
                </p>
              </div>
              <Badge variant={String(s.status ?? s.Status ?? '') === 'Completed' ? 'success' : 'info'}>
                {String(s.status ?? s.Status ?? '')}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-center py-4">No sessions found.</p>
      );
    }

    const pResponses = apiBaseUrl
      ? apiQuestionnaireResponses.filter(
          (qr) => String(qr.PatientId ?? qr.patientId ?? '') === selectedPatient.id
        )
      : questionnaireResponses.filter((qr) => qr.patientId === selectedPatient.userId);

    return pResponses.length > 0 ? (
      <div className="space-y-4">
        {pResponses.map((r: any) => {
          const q = apiBaseUrl
            ? apiQuestionnaires.find(
                (item) => String(item.Id ?? item.id ?? '') === String(r.QuestionnaireId ?? r.questionnaireId ?? '')
              )
            : questionnaires.find((item) => item.id === r.questionnaireId);
          return (
            <div
              key={String(r.Id ?? r.id)}
              className="p-4 border rounded-lg bg-slate-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {apiBaseUrl ? String(q?.Title ?? q?.title ?? '') : q?.title}
                </p>
                <p className="text-sm text-slate-600">
                  Completed: {String(r.CompletionDate ?? r.dateCompleted ?? '').slice(0, 10)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Score</span>
                <p className="font-bold text-lg text-blue-600">{r.TotalScore ?? r.totalScore}</p>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="text-slate-500 text-center py-4">No questionnaire responses found.</p>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <UsersIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
      </div>

      <DataTable data={myPatients} columns={columns} searchable searchKey="firstName" actions={actions} />

      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={`Patient Details: ${selectedPatient?.firstName ?? ''} ${selectedPatient?.lastName ?? ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div className="flex space-x-1 border-b border-slate-200">
            {['diagnoses', 'plans', 'sessions', 'questionnaires'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="min-h-[300px] max-h-[500px] overflow-y-auto pr-2">{renderTabContent()}</div>
        </div>
      </Modal>
    </div>
  );
}
