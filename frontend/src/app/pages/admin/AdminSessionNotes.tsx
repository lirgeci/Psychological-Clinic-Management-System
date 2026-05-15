import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import authFetch from '../../utils/authFetch';

interface SessionNoteFormData {
  sessionId: string;
  notes: string;
  progress: string;
  homework: string;
  nextPlan: string;
  createdDate: string;
}

interface ApiSessionNote {
  id: string;
  sessionId: string;
  notes: string;
  progress: string;
  homework: string;
  nextPlan: string;
  createdDate: string;
  patientId: string;
  therapistId: string;
  sessionDate: string;
  patientName: string;
  therapistName: string;
  notesSummary: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const getDisplayName = (record: Record<string, any> | undefined, fallback = 'Unknown') => {
  if (!record) {
    return fallback;
  }

  const firstName = String(record.FirstName ?? record.firstName ?? '').trim();
  const lastName = String(record.LastName ?? record.lastName ?? '').trim();
  const name = `${firstName} ${lastName}`.trim();

  return name || fallback;
};

const mapSessionRecord = (
  record: Record<string, any>,
  lookups: {
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
  }
) => {
  const patientId = String(record.PatientId ?? record.patientId ?? '');
  const therapistId = String(record.TherapistId ?? record.therapistId ?? '');

  const patientRecord =
    record.patient ??
    record.Patient ??
    lookups.patients.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === patientId);
  const therapistRecord =
    record.therapist ??
    record.Therapist ??
    lookups.therapists.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === therapistId);

  return {
    id: String(record.Id ?? record.id ?? ''),
    patientId,
    therapistId,
    date: String(record.SessionDate ?? record.date ?? '').slice(0, 10),
    startTime: String(record.StartTime ?? record.startTime ?? '').slice(0, 5),
    endTime: String(record.EndTime ?? record.endTime ?? '').slice(0, 5),
    type: String(record.SessionType ?? record.type ?? ''),
    status: String(record.Status ?? record.status ?? 'Scheduled'),
    patientName: getDisplayName(patientRecord),
    therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
  };
};

const mapSessionList = (
  records: Array<Record<string, any>>,
  lookups: {
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
  }
) => records.map((record) => mapSessionRecord(record, lookups));

const mapSessionNoteRecord = (
  record: Record<string, any>,
  lookups: {
    sessions: Array<Record<string, any>>;
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
  }
): ApiSessionNote => {
  const sessionId = String(record.SessionId ?? record.sessionId ?? '');
  const sessionRecord =
    record.session ??
    record.Session ??
    lookups.sessions.find((item) => String(item.Id ?? item.id ?? '') === sessionId);

  const patientId = String(sessionRecord?.PatientId ?? sessionRecord?.patientId ?? record.PatientId ?? record.patientId ?? '');
  const therapistId = String(sessionRecord?.TherapistId ?? sessionRecord?.therapistId ?? record.TherapistId ?? record.therapistId ?? '');

  const patientRecord =
    record.patient ??
    lookups.patients.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === patientId);
  const therapistRecord =
    record.therapist ??
    lookups.therapists.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === therapistId);

  const notes = String(record.Notes ?? record.notes ?? '');
  const progress = String(record.Progress ?? record.progress ?? '');
  const homework = String(record.Homework ?? record.homework ?? '');
  const nextPlan = String(record.NextPlan ?? record.nextPlan ?? '');

  return {
    id: String(record.Id ?? record.id ?? ''),
    sessionId,
    notes,
    progress,
    homework,
    nextPlan,
    createdDate: String(record.CreatedDate ?? record.createdDate ?? '').slice(0, 10),
    patientId,
    therapistId,
    sessionDate: String(sessionRecord?.SessionDate ?? sessionRecord?.date ?? '').slice(0, 10),
    patientName: getDisplayName(patientRecord),
    therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
    notesSummary: notes.length > 80 ? `${notes.substring(0, 80)}...` : notes,
  };
};

const mapSessionNoteList = (
  records: Array<Record<string, any>>,
  lookups: {
    sessions: Array<Record<string, any>>;
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
  }
) => records.map((record) => mapSessionNoteRecord(record, lookups));

const mapStoreSessionNotes = (
  sessionNotes: Array<Record<string, any>>,
  sessions: Array<Record<string, any>>,
  patients: Array<Record<string, any>>,
  therapists: Array<Record<string, any>>
) =>
  sessionNotes.map((note) => {
    const sessionId = String(note.sessionId ?? note.SessionId ?? '');
    const sessionRecord = sessions.find((item) => String(item.id ?? item.Id ?? '') === sessionId);
    const patientId = String(note.patientId ?? note.PatientId ?? sessionRecord?.patientId ?? sessionRecord?.PatientId ?? '');
    const therapistId = String(note.therapistId ?? note.TherapistId ?? sessionRecord?.therapistId ?? sessionRecord?.TherapistId ?? '');
    const patientRecord = patients.find((item) => String(item.userId ?? item.id ?? item.Id ?? '') === patientId);
    const therapistRecord = therapists.find((item) => String(item.userId ?? item.id ?? item.Id ?? '') === therapistId);
    const notes = String(note.notes ?? note.Notes ?? note.clinicalObservations ?? '');

    return {
      id: String(note.id ?? note.Id ?? ''),
      sessionId,
      notes,
      progress: String(note.progress ?? note.Progress ?? note.progressNotes ?? ''),
      homework: String(note.homework ?? note.Homework ?? note.homeworkAssigned ?? ''),
      nextPlan: String(note.nextPlan ?? note.NextPlan ?? note.nextStepsPlan ?? ''),
      createdDate: String(note.createdDate ?? note.CreatedDate ?? note.date ?? '').slice(0, 10),
      patientId,
      therapistId,
      sessionDate: String(sessionRecord?.date ?? sessionRecord?.SessionDate ?? note.date ?? '').slice(0, 10),
      patientName: getDisplayName(patientRecord),
      therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
      notesSummary: notes.length > 80 ? `${notes.substring(0, 80)}...` : notes,
    };
  });

export function AdminSessionNotes() {
  const { sessionNotes, sessions, patients, therapists, addEntity, updateEntity, deleteEntity } = useStore();
  const [apiSessionNotes, setApiSessionNotes] = useState<ApiSessionNote[]>([]);
  const [apiSessions, setApiSessions] = useState<Array<Record<string, any>>>([]);
  const [apiPatients, setApiPatients] = useState<Array<Record<string, any>>>([]);
  const [apiTherapists, setApiTherapists] = useState<Array<Record<string, any>>>([]);

  const loadSessionNotes = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiSessionNotes(mapStoreSessionNotes(sessionNotes, sessions, patients, therapists));
      return;
    }

    try {
      const [notesResponse, sessionsResponse, patientsResponse, therapistsResponse] = await Promise.all([
        authFetch(`${apiBaseUrl}/session-notes/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/sessions/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
      ]);

      const notesResult = await notesResponse.json();
      const sessionsResult = await sessionsResponse.json();
      const patientsResult = await patientsResponse.json();
      const therapistsResult = await therapistsResponse.json();

      if (!notesResponse.ok && notesResponse.status !== 404) {
        throw new Error(notesResult.message || 'Failed to fetch session notes.');
      }

      if (!sessionsResponse.ok && sessionsResponse.status !== 404) {
        throw new Error(sessionsResult.message || 'Failed to fetch sessions.');
      }

      if (!patientsResponse.ok && patientsResponse.status !== 404) {
        throw new Error(patientsResult.message || 'Failed to fetch patients.');
      }

      if (!therapistsResponse.ok && therapistsResponse.status !== 404) {
        throw new Error(therapistsResult.message || 'Failed to fetch therapists.');
      }

      const apiSessionsList = mapSessionList(sessionsResult.sessions || [], {
        patients: patientsResult.patients || [],
        therapists: therapistsResult.therapists || [],
      });
      const apiPatientsList = (patientsResult.patients || []).map((patient: Record<string, any>) => patient);
      const apiTherapistsList = (therapistsResult.therapists || []).map((therapist: Record<string, any>) => therapist);

      setApiSessions(apiSessionsList as Array<Record<string, any>>);
      setApiPatients(apiPatientsList);
      setApiTherapists(apiTherapistsList);
      setApiSessionNotes(
        mapSessionNoteList(notesResult.sessionNotes || [], {
          sessions: sessionsResult.sessions || [],
          patients: apiPatientsList,
          therapists: apiTherapistsList,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch session notes.';
      toast.error(message);
      setApiSessionNotes(mapStoreSessionNotes(sessionNotes, sessions, patients, therapists));
      setApiSessions([]);
      setApiPatients([]);
      setApiTherapists([]);
    }
  }, [patients, sessionNotes, sessions, therapists]);

  useEffect(() => {
    loadSessionNotes();
  }, [loadSessionNotes]);

  const sessionOptions = apiBaseUrl ? apiSessions : sessions;
  const patientOptions = apiBaseUrl ? apiPatients : patients;
  const therapistOptions = apiBaseUrl ? apiTherapists : therapists;

  const SessionNoteForm = ({ initialData, onSubmit, onCancel }: any) => {
    const isEditing = Boolean(initialData?.id);
    const [formData, setFormData] = useState<SessionNoteFormData>({
      sessionId: initialData?.sessionId || '',
      notes: initialData?.notes || '',
      progress: initialData?.progress || '',
      homework: initialData?.homework || '',
      nextPlan: initialData?.nextPlan || '',
      createdDate: initialData?.createdDate || new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      const loadSessionNoteById = async () => {
        try {
          const response = await authFetch(`${apiBaseUrl}/session-notes/get-by-id/${initialData.id}`);
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch session note details.');
          }

          setFormData({
            sessionId: String(result.SessionId ?? result.sessionId ?? ''),
            notes: String(result.Notes ?? result.notes ?? ''),
            progress: String(result.Progress ?? result.progress ?? ''),
            homework: String(result.Homework ?? result.homework ?? ''),
            nextPlan: String(result.NextPlan ?? result.nextPlan ?? ''),
            createdDate: String(result.CreatedDate ?? result.createdDate ?? '').slice(0, 10),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load session note details.';
          toast.error(message);
        }
      };

      loadSessionNoteById();
    }, [initialData?.id]);

    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Session"
            required
            disabled={isEditing}
            value={formData.sessionId}
            onChange={(event) => setFormData({ ...formData, sessionId: event.target.value })}
            options={sessionOptions.map((session: any) => ({
              label: `${String(session.sessionDate ?? session.date ?? '').slice(0, 10)} - ${String(session.patientName ?? 'Unknown')}`,
              value: String(session.id ?? session.Id ?? ''),
            }))}
          />

          <Input
            label="Created Date"
            type="date"
            required
            disabled={isEditing}
            value={formData.createdDate}
            onChange={(event) => setFormData({ ...formData, createdDate: event.target.value })}
          />
        </div>

        <Textarea
          label="Clinical Notes"
          rows={5}
          required
          value={formData.notes}
          onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
        />

        <Textarea
          label="Progress"
          rows={3}
          value={formData.progress}
          onChange={(event) => setFormData({ ...formData, progress: event.target.value })}
        />

        <Textarea
          label="Homework"
          rows={3}
          value={formData.homework}
          onChange={(event) => setFormData({ ...formData, homework: event.target.value })}
        />

        <Textarea
          label="Next Plan"
          rows={3}
          value={formData.nextPlan}
          onChange={(event) => setFormData({ ...formData, nextPlan: event.target.value })}
        />

        {isEditing && (
          <p className="text-xs text-slate-500">
            Session and created date stay fixed during edits.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Session Note</Button>
        </div>
      </form>
    );
  };

  const columns: Column<ApiSessionNote>[] = [
    {
      header: 'Session Date',
      accessor: 'sessionDate',
      sortable: true,
      sortKey: 'sessionDate',
    },
    {
      header: 'Patient',
      accessor: 'patientName',
      sortable: true,
      sortKey: 'patientName',
    },
    {
      header: 'Therapist',
      accessor: 'therapistName',
      sortable: true,
      sortKey: 'therapistName',
    },
    {
      header: 'Created',
      accessor: 'createdDate',
      sortable: true,
      sortKey: 'createdDate',
    },
    {
      header: 'Notes Summary',
      accessor: 'notesSummary',
    },
  ];

  const handleAdd = async (data: SessionNoteFormData) => {
    try {
      if (!apiBaseUrl) {
        const selectedSession = sessions.find((session) => session.id === data.sessionId);
        addEntity('sessionNotes', {
          id: Math.random().toString(36).slice(2, 11),
          sessionId: data.sessionId,
          patientId: selectedSession?.patientId || '',
          therapistId: selectedSession?.therapistId || '',
          notes: data.notes,
          progress: data.progress,
          homework: data.homework,
          nextPlan: data.nextPlan,
          createdDate: data.createdDate,
        });
        await loadSessionNotes();
        return true;
      }

      const response = await authFetch(`${apiBaseUrl}/session-notes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: data.sessionId,
          notes: data.notes,
          progress: data.progress,
          homework: data.homework,
          nextPlan: data.nextPlan,
          createdDate: data.createdDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create session note.');
      }

      await loadSessionNotes();
      toast.success(result.message || 'Session note created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session note.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: SessionNoteFormData) => {
    try {
      if (!apiBaseUrl) {
        updateEntity('sessionNotes', id, {
          sessionId: data.sessionId,
          notes: data.notes,
          progress: data.progress,
          homework: data.homework,
          nextPlan: data.nextPlan,
          createdDate: data.createdDate,
        });
        await loadSessionNotes();
        return true;
      }

      const response = await authFetch(`${apiBaseUrl}/session-notes/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: data.notes,
          progress: data.progress,
          homework: data.homework,
          nextPlan: data.nextPlan,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update session note.');
      }

      await loadSessionNotes();
      toast.success(result.message || 'Session note updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update session note.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        deleteEntity('sessionNotes', id);
        await loadSessionNotes();
        return;
      }

      const response = await authFetch(`${apiBaseUrl}/session-notes/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete session note.');
      }

      await loadSessionNotes();
      toast.success(result.message || 'Session note deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete session note.';
      toast.error(message);
    }
  };

  return (
    <AdminCrudPage
      title="Session Note Management"
      data={apiSessionNotes}
      columns={columns}
      searchKey="patientName"
      showAddButton={false}
      FormComponent={SessionNoteForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}