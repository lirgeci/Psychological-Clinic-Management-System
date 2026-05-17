import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import authFetch from '../../utils/authFetch';
import { toast } from 'sonner';
import { useStore } from '../../store/StoreContext';

interface PatientProfile {
  id: string;
  userId: string;
}

interface SessionItem {
  id: string;
  therapistName: string;
  sessionDate: string;
  status: string;
}

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export function PatientFeedback() {
  const { currentUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { rating: string; comment: string }>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        if (!currentUser) {
          return;
        }

        setLoading(true);

        const [patientsResponse, sessionsResponse] = await Promise.all([
          authFetch(`${API_URL}/patients/get-all?page=1&limit=1000`),
          authFetch(`${API_URL}/sessions/get-all?page=1&limit=1000`),
        ]);

        const patientsResult = await patientsResponse.json();
        const sessionsResult = await sessionsResponse.json();

        if (!patientsResponse.ok) {
          throw new Error(patientsResult.message || 'Failed to load patient profile.');
        }

        if (!sessionsResponse.ok) {
          throw new Error(sessionsResult.message || 'Failed to load sessions.');
        }

        const matchedPatient = (patientsResult.patients || []).find((item: Record<string, unknown>) => String(item.UserId ?? item.userId ?? '') === String(currentUser.id));
        if (!matchedPatient) {
          setPatient(null);
          setSessions([]);
          return;
        }

        const mappedPatient: PatientProfile = {
          id: String(matchedPatient.Id ?? matchedPatient.id ?? ''),
          userId: String(matchedPatient.UserId ?? matchedPatient.userId ?? ''),
        };
        setPatient(mappedPatient);

        const mappedSessions: SessionItem[] = (sessionsResult.sessions || [])
          .filter((session: Record<string, unknown>) => String(session.PatientId ?? session.patientId ?? '') === String(mappedPatient.id) && String(session.Status ?? session.status ?? '').toLowerCase() === 'completed')
          .map((session: Record<string, unknown>) => ({
            id: String(session.Id ?? session.id ?? ''),
            therapistName: `${String(session.Therapist?.FirstName ?? session.Therapist?.firstName ?? '')} ${String(session.Therapist?.LastName ?? session.Therapist?.lastName ?? '')}`.trim() || '-',
            sessionDate: String(session.SessionDate ?? session.sessionDate ?? ''),
            status: String(session.Status ?? session.status ?? ''),
          }));

        setSessions(mappedSessions);
        setDrafts((currentDrafts) => {
          const nextDrafts = { ...currentDrafts };
          mappedSessions.forEach((session) => {
            if (!nextDrafts[session.id]) {
              nextDrafts[session.id] = { rating: '5', comment: '' };
            }
          });
          return nextDrafts;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load feedback page.';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [currentUser]);

  const handleDraftChange = (sessionId: string, field: 'rating' | 'comment', value: string) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [sessionId]: {
        rating: currentDrafts[sessionId]?.rating || '5',
        comment: currentDrafts[sessionId]?.comment || '',
        [field]: value,
      },
    }));
  };

  const submitFeedback = async (sessionId: string) => {
    try {
      const draft = drafts[sessionId];
      if (!draft) {
        return;
      }

      setSubmittingId(sessionId);
      const response = await authFetch(`${API_URL}/feedback/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          rating: Number(draft.rating),
          comment: draft.comment,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit feedback.');
      }

      toast.success(result.message || 'Feedback submitted successfully.');
      setSubmittedIds((currentIds) => [...currentIds, sessionId]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit feedback.';
      toast.error(message);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading feedback options...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Session Feedback</h1>

      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => {
            const draft = drafts[session.id] || { rating: '5', comment: '' };
            const alreadySubmitted = submittedIds.includes(session.id);

            return (
              <Card key={session.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{session.therapistName}</h3>
                    <p className="text-sm text-slate-500">Session date: {session.sessionDate}</p>
                  </div>
                  <Badge variant="info">{session.status}</Badge>
                </div>

                {alreadySubmitted ? (
                  <p className="mt-4 text-sm text-green-700">Feedback submitted for this session.</p>
                ) : (
                  <form
                    className="mt-4 grid gap-4 md:grid-cols-2"
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      submitFeedback(session.id);
                    }}>
                    <Select
                      label="Rating"
                      value={draft.rating}
                      onChange={(event) => handleDraftChange(session.id, 'rating', event.target.value)}
                      options={[
                        { label: '1 - Poor', value: '1' },
                        { label: '2 - Fair', value: '2' },
                        { label: '3 - Good', value: '3' },
                        { label: '4 - Very Good', value: '4' },
                        { label: '5 - Excellent', value: '5' },
                      ]}
                    />
                    <div className="md:col-span-2">
                      <Textarea
                        label="Comment"
                        rows={4}
                        value={draft.comment}
                        onChange={(event) => handleDraftChange(session.id, 'comment', event.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" isLoading={submittingId === session.id}>Submit Feedback</Button>
                    </div>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">No completed sessions available for feedback yet.</p>
        </Card>
      )}
    </div>
  );
}