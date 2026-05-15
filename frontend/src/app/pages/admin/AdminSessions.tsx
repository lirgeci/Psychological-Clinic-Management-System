import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ActivityIcon, Edit2Icon, Trash2Icon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import authFetch from '../../utils/authFetch';

interface ApiSession {
  id: string;
  patientId: string;
  therapistId: string;
  appointmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  patientName: string;
  therapistName: string;
  privateNotes?: string;
  patientNotes?: string;
}

interface FormData {
  patientId: string;
  therapistId: string;
  appointmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  privateNotes: string;
  patientNotes: string;
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
    appointmentId: String(record.AppointmentId ?? record.appointmentId ?? ''),
    date: String(record.SessionDate ?? record.date ?? '').slice(0, 10),
    startTime: String(record.StartTime ?? record.startTime ?? '').slice(0, 5),
    endTime: String(record.EndTime ?? record.endTime ?? '').slice(0, 5),
    type: String(record.SessionType ?? record.type ?? ''),
    status: String(record.Status ?? record.status ?? 'Scheduled'),
    patientName: getDisplayName(patientRecord),
    therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
    privateNotes: String(record.PrivateNotes ?? record.privateNotes ?? ''),
    patientNotes: String(record.PatientNotes ?? record.patientNotes ?? ''),
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
  const { sessions, patients, therapists, appointments } = useStore();
  const [apiSessions, setApiSessions] = useState<ApiSession[]>(() =>
    mapSessionList(sessions, { patients, therapists })
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ApiSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    therapistId: '',
    appointmentId: '',
    date: '',
    startTime: '',
    endTime: '',
    type: '',
    status: 'Scheduled',
    privateNotes: '',
    patientNotes: '',
  });

  const loadSessions = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiSessions(mapSessionList(sessions, { patients, therapists }));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authFetch(`${apiBaseUrl}/sessions/get-all?page=1&limit=1000`);
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

  const resetForm = () => {
    setFormData({
      patientId: '',
      therapistId: '',
      appointmentId: '',
      date: '',
      startTime: '',
      endTime: '',
      type: '',
      status: 'Scheduled',
      privateNotes: '',
      patientNotes: '',
    });
    setEditingSession(null);
  };

  const openEditModal = (session: ApiSession) => {
    setEditingSession(session);
    setFormData({
      patientId: session.patientId,
      therapistId: session.therapistId,
      appointmentId: session.appointmentId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      type: session.type,
      status: session.status,
      privateNotes: session.privateNotes || '',
      patientNotes: session.patientNotes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBaseUrl) {
      toast.error('API base URL not configured.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        patientId: parseInt(formData.patientId),
        therapistId: parseInt(formData.therapistId),
        appointmentId: parseInt(formData.appointmentId),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        type: formData.type,
        status: formData.status,
        privateNotes: formData.privateNotes || undefined,
        patientNotes: formData.patientNotes || undefined,
      };

      let response;
      if (editingSession) {
        response = await authFetch(`${apiBaseUrl}/sessions/update/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await authFetch(`${apiBaseUrl}/sessions/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || (editingSession ? 'Failed to update session.' : 'Failed to create session.'));
      }

      toast.success(result.message);
      closeModal();
      loadSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operation failed.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!apiBaseUrl) {
      toast.error('API base URL not configured.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const response = await authFetch(`${apiBaseUrl}/sessions/delete/${sessionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete session.');
      }

      toast.success(result.message);
      loadSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete session.';
      toast.error(message);
    }
  };

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
    {
      header: 'Actions',
      accessor: (row: ApiSession) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit session"
          >
            <Edit2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete session"
          >
            <Trash2Icon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <ActivityIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Therapeutic Sessions</h1>
            <p className="text-sm text-slate-500">
              {isLoading ? 'Loading session records...' : `${apiSessions.length} session(s) found`}
            </p>
          </div>
        </div>
      </div>

      <DataTable data={apiSessions} columns={columns} searchable searchKey="patientName" />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSession ? 'Edit Session' : 'Create Session'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Patient"
            name="patientId"
            value={formData.patientId}
            onChange={handleFormChange}
            required
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.Id} value={p.Id}>
                {getDisplayName(p)}
              </option>
            ))}
          </Select>

          <Select
            label="Therapist"
            name="therapistId"
            value={formData.therapistId}
            onChange={handleFormChange}
            required
          >
            <option value="">Select therapist</option>
            {therapists.map((t) => (
              <option key={t.Id} value={t.Id}>
                Dr. {getDisplayName(t)}
              </option>
            ))}
          </Select>

          <Select
            label="Appointment"
            name="appointmentId"
            value={formData.appointmentId}
            onChange={handleFormChange}
            required
          >
            <option value="">Select appointment</option>
            {(appointments || []).map((a: any) => (
              <option key={a.Id} value={a.Id}>
                {a.AppointmentDate} {a.AppointmentTime}
              </option>
            ))}
          </Select>

          <Input
            label="Session Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleFormChange}
            required
          />

          <Input
            label="Start Time"
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleFormChange}
            required
          />

          <Input
            label="End Time"
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleFormChange}
          />

          <Input
            label="Session Type"
            type="text"
            name="type"
            placeholder="e.g., Individual, Group"
            value={formData.type}
            onChange={handleFormChange}
            required
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleFormChange}
            required
          >
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>

          <Textarea
            label="Private Notes"
            name="privateNotes"
            placeholder="Therapist's private notes..."
            value={formData.privateNotes}
            onChange={handleFormChange}
          />

          <Textarea
            label="Patient Notes"
            name="patientNotes"
            placeholder="Notes for patient..."
            value={formData.patientNotes}
            onChange={handleFormChange}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingSession ? 'Update' : 'Create'} Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
