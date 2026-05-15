import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
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
  questionnaire: record.questionnaire
    ? normalizeQuestionnaire(record.questionnaire)
    : record.Questionnaire
      ? normalizeQuestionnaire(record.Questionnaire)
      : undefined,
});

  const resolvePatientId = (records: Array<Record<string, any>>, currentUser: Record<string, any>) => {
    const currentEmail = String(currentUser.email ?? currentUser.Email ?? '').trim().toLowerCase();
    const currentUserId = String(currentUser.id ?? currentUser.Id ?? '').trim();

    const matchingRecord = records.find((patient: Record<string, any>) => {
      const patientEmail = String(
        patient.Email ??
          patient.email ??
          patient.user?.Email ??
          patient.user?.email ??
          ''
      ).trim().toLowerCase();
      const patientUserId = String(patient.UserId ?? patient.userId ?? patient.id ?? patient.Id ?? '').trim();

      return (
        (currentEmail && patientEmail === currentEmail) ||
        (currentUserId && (patientUserId === currentUserId || String(patient.Id ?? patient.id ?? '').trim() === currentUserId))
      );
    });

    return String(matchingRecord?.Id ?? matchingRecord?.id ?? matchingRecord?.UserId ?? matchingRecord?.userId ?? '');
  };

export function PatientQuestionnaires() {
  const { currentUser, questionnaires, questionnaireResponses, patients, addEntity } = useStore();
  const [apiQuestionnaires, setApiQuestionnaires] = useState<Array<Record<string, any>>>([]);
  const [apiResponses, setApiResponses] = useState<Array<Record<string, any>>>([]);
  const [currentPatientId, setCurrentPatientId] = useState<string>('');
  const [selectedQ, setSelectedQ] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const loadQuestionnaireData = useCallback(async () => {
    if (!currentUser) {
      setApiQuestionnaires([]);
      setApiResponses([]);
      setCurrentPatientId('');
      return;
    }

    if (!apiBaseUrl) {
      setApiQuestionnaires((questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
      setApiResponses((questionnaireResponses as any).map((record: Record<string, any>) => normalizeResponse(record)));

      setCurrentPatientId(resolvePatientId(patients as any, currentUser as any) || String(currentUser.id ?? ''));
      return;
    }

    try {
      const [questionnairesResponse, responsesResponse, patientsResponse] = await Promise.all([
        authFetch(`${apiBaseUrl}/questionnaires/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/questionnaire-responses/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
      ]);

      const [questionnairesResult, responsesResult, patientsResult] = await Promise.all([
        questionnairesResponse.json(),
        responsesResponse.json(),
        patientsResponse.json(),
      ]);

      const apiPatients = Array.isArray(patientsResult.patients) ? patientsResult.patients : [];
      setCurrentPatientId(resolvePatientId(apiPatients, currentUser as any) || String(currentUser.id ?? ''));

      if (!questionnairesResponse.ok && questionnairesResponse.status !== 404) {
        throw new Error(questionnairesResult.message || 'Failed to fetch questionnaires.');
      }

      if (!responsesResponse.ok && responsesResponse.status !== 404) {
        throw new Error(responsesResult.message || 'Failed to fetch questionnaire responses.');
      }

      setApiQuestionnaires((questionnairesResult.questionnaires || []).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
      setApiResponses((responsesResult.questionnaireResponses || []).map((record: Record<string, any>) => normalizeResponse(record)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch questionnaires.';
      toast.error(message);
      setApiQuestionnaires((questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
      setApiResponses((questionnaireResponses as any).map((record: Record<string, any>) => normalizeResponse(record)));

      setCurrentPatientId(resolvePatientId(patients as any, currentUser as any) || String(currentUser.id ?? ''));
    }
  }, [currentUser, patients, questionnaireResponses, questionnaires]);

  useEffect(() => {
    loadQuestionnaireData();
  }, [loadQuestionnaireData]);

  const questionnaireList = apiBaseUrl
    ? apiQuestionnaires
    : (questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record));

  const responseList = apiBaseUrl
    ? apiResponses
    : (questionnaireResponses as any).map((record: Record<string, any>) => normalizeResponse(record));

  const completedQIds = responseList
    .filter((response: Record<string, any>) => String(response.patientId) === String(currentPatientId || currentUser?.id || ''))
    .map((response: Record<string, any>) => response.questionnaireId);

  const pendingQs = questionnaireList.filter((questionnaire: Record<string, any>) => !completedQIds.includes(questionnaire.id));
  const completedQs = questionnaireList.filter((questionnaire: Record<string, any>) => completedQIds.includes(questionnaire.id));

  const handleOpen = (questionnaire: any) => {
    setSelectedQ(questionnaire);
    setAnswers({});
  };

  const handleSubmit = async () => {
    if (!selectedQ) {
      return;
    }

    const requiredQuestions = selectedQ.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions < requiredQuestions) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    let score = 0;
    selectedQ.questions.forEach((question: any) => {
      if (question.type === 'scale' && answers[question.id] && Array.isArray(question.options)) {
        score += question.options.indexOf(answers[question.id]);
      }
    });

    const payload = {
      patientId: currentPatientId,
      questionnaireId: selectedQ.id,
      responsesJson: answers,
      totalScore: score,
      completionDate: new Date().toISOString().split('T')[0],
    };

    try {
      if (!apiBaseUrl) {
        addEntity('questionnaireResponses', {
          patientId: currentPatientId || currentUser!.id,
          questionnaireId: selectedQ.id,
          answers,
          totalScore: score,
          dateCompleted: new Date().toISOString().split('T')[0],
        });
        await loadQuestionnaireData();
        setSelectedQ(null);
        return;
      }

      const response = await authFetch(`${apiBaseUrl}/questionnaire-responses/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit questionnaire response.');
      }

      await loadQuestionnaireData();
      setSelectedQ(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit questionnaire response.';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ClipboardListIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Questionnaires & Assessments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Pending Questionnaires">
          {pendingQs.length > 0 ? (
            <div className="space-y-4">
              {pendingQs.map((questionnaire: Record<string, any>) => (
                <div
                  key={questionnaire.id}
                  className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900">{questionnaire.title}</h3>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{questionnaire.description}</p>
                  <Button size="sm" onClick={() => handleOpen(questionnaire)}>
                    Start Assessment
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <ClipboardListIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No pending questionnaires.</p>
            </div>
          )}
        </Card>

        <Card title="Completed Assessments">
          {completedQs.length > 0 ? (
            <div className="space-y-4">
              {completedQs.map((questionnaire: Record<string, any>) => {
                const response = responseList.find(
                  (item: Record<string, any>) => item.questionnaireId === questionnaire.id && String(item.patientId) === String(currentPatientId || currentUser?.id || '')
                );

                return (
                  <div key={questionnaire.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-slate-900">{questionnaire.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">Completed: {response?.dateCompleted}</p>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-slate-500">No completed assessments yet.</p>
          )}
        </Card>
      </div>

      {selectedQ && (
        <Modal isOpen={!!selectedQ} onClose={() => setSelectedQ(null)} title={selectedQ.title} maxWidth="2xl">
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">{selectedQ.description}</div>

            <div className="space-y-8">
              {selectedQ.questions.map((question: any, index: number) => (
                <div key={question.id} className="space-y-3">
                  <p className="font-medium text-slate-900">
                    {index + 1}. {question.text}
                  </p>

                  {question.type === 'text' && (
                    <textarea
                      className="w-full border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      rows={3}
                      value={answers[question.id] || ''}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [question.id]: e.target.value,
                        })
                      }
                      placeholder="Type your answer here..."
                    />
                  )}

                  {(question.type === 'radio' || question.type === 'scale') && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => (
                        <label
                          key={optionIndex}
                          className="flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={() =>
                              setAnswers({
                                ...answers,
                                [question.id]: option,
                              })
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span className="text-sm text-slate-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkbox' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => {
                        const currentValue = Array.isArray(answers[question.id]) ? answers[question.id] : [];
                        const isChecked = currentValue.includes(option);

                        return (
                          <label
                            key={optionIndex}
                            className="flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  setAnswers({
                                    ...answers,
                                    [question.id]: [...currentValue, option],
                                  });
                                  return;
                                }

                                setAnswers({
                                  ...answers,
                                  [question.id]: currentValue.filter((item: string) => item !== option),
                                });
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                            />
                            <span className="text-sm text-slate-700">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedQ(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Submit Answers</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}