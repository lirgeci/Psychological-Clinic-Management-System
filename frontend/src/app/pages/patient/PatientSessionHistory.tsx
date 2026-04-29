import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ClockIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ApiSessionRow {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  therapistName: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function PatientSessionHistory() {
  const { currentUser, sessions, therapists } = useStore();
  const [apiSessions, setApiSessions] = useState<ApiSessionRow[]>([]);

  const fallbackSessions = useMemo(() => {
    const mySessions = sessions.
      filter((session) => session.patientId === currentUser!.id && session.status === 'Completed').
      sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return mySessions.map((session) => {
      const therapist = therapists.find((t) => t.userId === session.therapistId);
      return {
        id: session.id,
        patientId: session.patientId,
        therapistId: session.therapistId,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime || '',
        type: session.type,
        status: session.status,
        therapistName: therapist ? `Dr. ${therapist.lastName}` : 'Unknown'
      };
    });
  }, [currentUser, sessions, therapists]);

  useEffect(() => {
    const loadSessions = async () => {
      if (!currentUser || !apiBaseUrl) {
        setApiSessions([]);
        return;
      }

      try {
        const [patientsResponse, sessionsResponse, therapistsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
          fetch(`${apiBaseUrl}/sessions/get-all?page=1&limit=1000`),
          fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
        ]);

        const [patientsResult, sessionsResult, therapistsResult] = await Promise.all([
          patientsResponse.json(),
          sessionsResponse.json(),
          therapistsResponse.json(),
        ]);

        if (!patientsResponse.ok) {
          throw new Error(patientsResult.message || 'Failed to load patient profile.');
        }

        if (!sessionsResponse.ok) {
          if (sessionsResponse.status === 404) {
            setApiSessions([]);
            return;
          }
          throw new Error(sessionsResult.message || 'Failed to load session history.');
        }

        const matchedPatient = (patientsResult.patients || []).find((patient: Record<string, unknown>) =>
          String(patient.UserId ?? patient.userId ?? '') === String(currentUser.id)
        );

        if (!matchedPatient) {
          setApiSessions([]);
          return;
        }

        const patientId = String(matchedPatient.Id ?? matchedPatient.id ?? '');
        const therapistList = therapistsResponse.ok ? therapistsResult.therapists || [] : [];

        const mappedSessions = (sessionsResult.sessions || [])
          .filter((session: Record<string, unknown>) =>
            String(session.PatientId ?? session.patientId ?? '') === patientId &&
            String(session.Status ?? session.status ?? '') === 'Completed'
          )
          .map((session: Record<string, unknown>) => {
            const therapistId = String(session.TherapistId ?? session.therapistId ?? '');
            const therapistRecord = (session.Therapist as Record<string, unknown> | undefined) ||
              therapistList.find((therapist: Record<string, unknown>) =>
                String(therapist.Id ?? therapist.id ?? '') === therapistId
              );

            const therapistLastName = String(
              therapistRecord?.LastName ?? therapistRecord?.lastName ?? 'Unknown'
            );

            return {
              id: String(session.Id ?? session.id ?? ''),
              patientId,
              therapistId,
              date: String(session.SessionDate ?? session.date ?? '').slice(0, 10),
              startTime: String(session.StartTime ?? session.startTime ?? '').slice(0, 5),
              endTime: String(session.EndTime ?? session.endTime ?? '').slice(0, 5),
              type: String(session.SessionType ?? session.type ?? ''),
              status: String(session.Status ?? session.status ?? 'Completed'),
              therapistName: `Dr. ${therapistLastName}`,
            };
          })
          .sort((a: ApiSessionRow, b: ApiSessionRow) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setApiSessions(mappedSessions);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load session history.';
        toast.error(message);
        setApiSessions([]);
      }
    };

    loadSessions();
  }, [currentUser]);

  const dataSource = apiSessions.length > 0 ? apiSessions : fallbackSessions;

  const columns: Column<ApiSessionRow>[] = [
  {
    header: 'Date',
    accessor: 'date',
    sortable: true,
    sortKey: 'date'
  },
  {
    header: 'Time',
    accessor: (row: ApiSessionRow) => `${row.startTime} - ${row.endTime || 'N/A'}`
  },
  {
    header: 'Therapist',
    accessor: 'therapistName',
    sortable: true,
    sortKey: 'therapistName'
  },
  {
    header: 'Type',
    accessor: 'type'
  },
  {
    header: 'Status',
    accessor: (row: ApiSessionRow) => <Badge variant="success">{row.status}</Badge>
  }];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ClockIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Session History</h1>
      </div>

      <DataTable
        data={dataSource}
        columns={columns}
        searchable
        searchKey="therapistName"
        emptyMessage="No completed sessions yet." />
      
    </div>);

}