import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ClipboardListIcon } from 'lucide-react';
import { toast } from 'sonner';
import authFetch from '../../utils/authFetch';

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const safeParseQuestions = (value: any) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeQuestionnaire = (record: Record<string, any>) => ({
  id: String(record.Id ?? record.id ?? ''),
  title: String(record.Title ?? record.title ?? ''),
  description: String(record.Description ?? record.description ?? ''),
  type: String(record.Type ?? record.type ?? 'Assessment'),
  questions: safeParseQuestions(record.QuestionsJson ?? record.questionsJson ?? record.questions),
  dateCreated: String(record.CreatedDate ?? record.createdDate ?? record.dateCreated ?? new Date().toISOString()).slice(0, 10),
});

const normalizeResponse = (record: Record<string, any>) => ({
  id: String(record.Id ?? record.id ?? ''),
  patientId: String(record.PatientId ?? record.patientId ?? ''),
  questionnaireId: String(record.QuestionnaireId ?? record.questionnaireId ?? ''),
  answers: record.ResponsesJson ?? record.responsesJson ?? record.answers ?? {},
  totalScore: record.TotalScore ?? record.totalScore ?? null,
  dateCompleted: String(record.CompletionDate ?? record.completionDate ?? record.dateCompleted ?? new Date().toISOString()).slice(0, 10),
  patient: record.patient ?? record.Patient,
  questionnaire: record.questionnaire
    ? normalizeQuestionnaire(record.questionnaire)
    : record.Questionnaire
      ? normalizeQuestionnaire(record.Questionnaire)
      : undefined,
});

const getDisplayName = (record: Record<string, any> | undefined, fallback = 'Unknown') => {
  if (!record) {
    return fallback;
  }

  const firstName = String(record.FirstName ?? record.firstName ?? '').trim();
  const lastName = String(record.LastName ?? record.lastName ?? '').trim();
  const name = `${firstName} ${lastName}`.trim();
  return name || fallback;
};

export function AdminQuestionnaireResponses() {
  const { questionnaireResponses, questionnaires, patients } = useStore();
  const [apiResponses, setApiResponses] = useState<Array<Record<string, any>>>([]);
  const [apiQuestionnaires, setApiQuestionnaires] = useState<Array<Record<string, any>>>([]);
  const [apiPatients, setApiPatients] = useState<Array<Record<string, any>>>([]);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

  const loadResponses = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiQuestionnaires((questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
      setApiResponses((questionnaireResponses as any).map((record: Record<string, any>) => normalizeResponse(record)));
      setApiPatients(patients as any);
      return;
    }

    try {
      const [responsesResponse, questionnairesResponse, patientsResponse] = await Promise.all([
        authFetch(`${apiBaseUrl}/questionnaire-responses/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/questionnaires/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
      ]);

      const [responsesResult, questionnairesResult, patientsResult] = await Promise.all([
        responsesResponse.json(),
        questionnairesResponse.json(),
        patientsResponse.json(),
      ]);

      if (!responsesResponse.ok && responsesResponse.status !== 404) {
        throw new Error(responsesResult.message || 'Failed to fetch questionnaire responses.');
      }

      if (!questionnairesResponse.ok && questionnairesResponse.status !== 404) {
        throw new Error(questionnairesResult.message || 'Failed to fetch questionnaires.');
      }

      if (!patientsResponse.ok && patientsResponse.status !== 404) {
        throw new Error(patientsResult.message || 'Failed to fetch patients.');
      }

      setApiResponses((responsesResult.questionnaireResponses || []).map((record: Record<string, any>) => normalizeResponse(record)));
      setApiQuestionnaires((questionnairesResult.questionnaires || []).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
      setApiPatients((patientsResult.patients || []).map((record: Record<string, any>) => record));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch questionnaire responses.';
      toast.error(message);
      setApiQuestionnaires((questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
      setApiResponses((questionnaireResponses as any).map((record: Record<string, any>) => normalizeResponse(record)));
      setApiPatients(patients as any);
    }
  }, [patients, questionnaireResponses, questionnaires]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  const enrichedResponses = (apiBaseUrl
    ? apiResponses
    : (questionnaireResponses as any).map((record: Record<string, any>) => normalizeResponse(record))
  ).map((response: Record<string, any>) => {
    const questionnaire = apiQuestionnaires.find((item: Record<string, any>) => String(item.id) === String(response.questionnaireId));
    const patient = apiPatients.find(
      (item: Record<string, any>) => String(item.Id ?? item.id ?? item.UserId ?? item.userId ?? '') === String(response.patientId)
    );

    return {
      ...response,
      patientName: getDisplayName(response.patient || patient),
      questionnaireTitle: questionnaire?.title || response.questionnaire?.title || 'Unknown',
      questionnaire: response.questionnaire || questionnaire,
    };
  });

  const columns = [
    {
      header: 'Patient',
      accessor: 'patientName' as keyof (typeof enrichedResponses)[0],
      sortable: true,
      sortKey: 'patientName' as keyof (typeof enrichedResponses)[0],
    },
    {
      header: 'Questionnaire',
      accessor: 'questionnaireTitle' as keyof (typeof enrichedResponses)[0],
      sortable: true,
      sortKey: 'questionnaireTitle' as keyof (typeof enrichedResponses)[0],
    },
    {
      header: 'Total Score',
      accessor: (row: any) => <span className="font-bold text-blue-600">{row.totalScore ?? 'N/A'}</span>,
    },
    {
      header: 'Date Completed',
      accessor: 'dateCompleted' as keyof (typeof enrichedResponses)[0],
      sortable: true,
      sortKey: 'dateCompleted' as keyof (typeof enrichedResponses)[0],
    },
  ];

  const actions = (row: any) => (
    <Button size="sm" variant="ghost" onClick={() => setSelectedResponse(row)}>
      View Response
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ClipboardListIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Questionnaire Responses</h1>
      </div>

      {enrichedResponses.length > 0 ? (
        <DataTable
          data={enrichedResponses as any}
          columns={columns as any}
          searchable
          searchKey="patientName"
          actions={actions}
        />
      ) : (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-12 text-center">
          <ClipboardListIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No questionnaire responses submitted yet.</p>
        </div>
      )}

      <Modal
        isOpen={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        title={`Response: ${selectedResponse?.questionnaireTitle}`}
        maxWidth="lg"
      >
        {selectedResponse && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <p className="text-sm text-slate-500">Patient</p>
                <p className="font-medium text-slate-900">{selectedResponse.patientName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Score</p>
                <p className="font-bold text-blue-600 text-xl">{selectedResponse.totalScore ?? 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-4">
              {(selectedResponse.questionnaire?.questions || []).map((question: any, index: number) => (
                <div key={question.id} className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="font-medium text-slate-800 text-sm mb-2">
                    {index + 1}. {question.text}
                  </p>
                  <p className="text-slate-600 text-sm">
                    {Array.isArray(selectedResponse.answers?.[question.id])
                      ? selectedResponse.answers[question.id].join(', ')
                      : selectedResponse.answers?.[question.id] || 'No answer provided'}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button onClick={() => setSelectedResponse(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}