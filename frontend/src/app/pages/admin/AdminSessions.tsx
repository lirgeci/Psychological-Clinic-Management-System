import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ActivityIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ApiSession {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  patientName: string;
  therapistName: string;
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
    patients: Record<string, any>[];
    therapists: Record<string, any>[];
  }
): ApiSession => {
  const patientId = String(record.PatientId ?? record.patientId ?? '');
  const therapistId = String(record.TherapistId ?? record.therapistId ?? '');

  const patientRecord =
    record.Patient ??
    record.patient ??
    lookups.patients.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === patientId);
  const therapistRecord =
    record.Therapist ??
    record.therapist ??
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
  records: Record<string, any>[],
  lookups: {
    patients: Record<string, any>[];
    therapists: Record<string, any>[];
  }
) => records.map((record) => mapSessionRecord(record, lookups));

export function AdminSessions() {
  const { sessions, patients, therapists } = useStore();
  const [apiSessions, setApiSessions] = useState<ApiSession[]>(() =>
    mapSessionList(sessions, { patients, therapists })
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiSessions(mapSessionList(sessions, { patients, therapists }));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/sessions/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setApiSessions([]);
          return;
        }

        throw new Error(result.message || 'Failed to fetch sessions.');
      }

      setApiSessions(mapSessionList(result.sessions || [], { patients, therapists }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch sessions.';
      toast.error(message);
      setApiSessions(mapSessionList(sessions, { patients, therapists }));
    } finally {
      setIsLoading(false);
    }
  }, [patients, sessions, therapists]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!apiBaseUrl) {
      setApiSessions(mapSessionList(sessions, { patients, therapists }));
    }
  }, [apiBaseUrl, patients, sessions, therapists]);

  const columns: Column<ApiSession>[] = [
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      sortKey: 'date',
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
      header: 'Time',
      accessor: (row: ApiSession) => `${row.startTime || '-'} - ${row.endTime || 'Ongoing'}`,
    },
    {
      header: 'Type',
      accessor: 'type',
    },
    {
      header: 'Status',
      accessor: (row: ApiSession) => (
        <Badge variant={row.status === 'Completed' ? 'success' : 'info'}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
          <p className="text-sm text-slate-500">
            {isLoading ? 'Loading session records...' : 'Read-only session list from the API.'}
          </p>
        </div>
      </div>

      <DataTable data={apiSessions} columns={columns} searchable searchKey="patientName" />
    </div>
  );
}