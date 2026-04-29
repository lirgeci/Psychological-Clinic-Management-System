import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

interface AppointmentFormData {
  patientId: string;
  therapistId: string;
  date: string;
  time: string;
  durationMinutes: string;
  type: string;
  status: string;
  roomId: string;
}

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormData> & { id?: string };
  onSubmit: (data: AppointmentFormData) => void | Promise<void>;
  onCancel: () => void;
}

interface ApiAppointment {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  time: string;
  durationMinutes: string;
  type: string;
  status: string;
  roomId: string;
  patientName: string;
  therapistName: string;
  roomName: string;
}

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const getDisplayName = (record: Record<string, any> | undefined, fallback = 'Unknown') => {
  if (!record) {
    return fallback;
  }

  const firstName = String(record.FirstName ?? record.firstName ?? '').trim();
  const lastName = String(record.LastName ?? record.lastName ?? '').trim();
  const name = `${firstName} ${lastName}`.trim();
  return name || fallback;
};

const mapAppointmentRecord = (
  record: Record<string, any>,
  lookups: {
    patients: Record<string, any>[];
    therapists: Record<string, any>[];
    rooms: Record<string, any>[];
  }
): ApiAppointment => {
  const patientId = String(record.PatientId ?? record.patientId ?? '');
  const therapistId = String(record.TherapistId ?? record.therapistId ?? '');
  const roomId = String(record.RoomId ?? record.roomId ?? '');

  const patientRecord =
    record.Patient ??
    record.patient ??
    lookups.patients.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === patientId);
  const therapistRecord =
    record.Therapist ??
    record.therapist ??
    lookups.therapists.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === therapistId);
  const roomRecord =
    record.room ??
    record.Room ??
    lookups.rooms.find((item) => String(item.Id ?? item.id ?? '') === roomId);

  return {
    id: String(record.Id ?? record.id ?? ''),
    patientId,
    therapistId,
    date: String(record.AppointmentDate ?? record.date ?? '').slice(0, 10),
    time: String(record.AppointmentTime ?? record.time ?? '').slice(0, 5),
    durationMinutes: String(record.DurationMinutes ?? record.durationMinutes ?? record.duration ?? ''),
    type: String(record.Type ?? record.type ?? ''),
    status: String(record.Status ?? record.status ?? 'Pending'),
    roomId,
    patientName: getDisplayName(patientRecord),
    therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
    roomName: String(roomRecord?.Name ?? roomRecord?.name ?? 'Unassigned'),
  };
};

const mapAppointmentList = (
  records: Record<string, any>[],
  lookups: {
    patients: Record<string, any>[];
    therapists: Record<string, any>[];
    rooms: Record<string, any>[];
  }
) => records.map((record) => mapAppointmentRecord(record, lookups));

const AppointmentForm = ({ initialData, onSubmit, onCancel }: AppointmentFormProps) => {
  const { patients: storePatients, therapists: storeTherapists, rooms: storeRooms } = useStore();
  const [patients, setPatients] = useState<Record<string, any>[]>(storePatients);
  const [therapists, setTherapists] = useState<Record<string, any>[]>(storeTherapists);
  const [rooms, setRooms] = useState<Record<string, any>[]>(storeRooms);
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: initialData?.patientId || '',
    therapistId: initialData?.therapistId || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    durationMinutes: initialData?.durationMinutes || '60',
    type: initialData?.type || 'Individual',
    status: initialData?.status || 'Pending',
    roomId: initialData?.roomId || '',
  });

  useEffect(() => {
    setFormData({
      patientId: initialData?.patientId || '',
      therapistId: initialData?.therapistId || '',
      date: initialData?.date || '',
      time: initialData?.time || '',
      durationMinutes: initialData?.durationMinutes || '60',
      type: initialData?.type || 'Individual',
      status: initialData?.status || 'Pending',
      roomId: initialData?.roomId || '',
    });
  }, [initialData]);

  useEffect(() => {
    if (!apiBaseUrl) {
      setPatients(storePatients);
      setTherapists(storeTherapists);
      setRooms(storeRooms);
      return;
    }

    const loadLookupData = async () => {
      try {
        const [patientsResponse, therapistsResponse, roomsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
          fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
          fetch(`${apiBaseUrl}/rooms/get-all?page=1&limit=1000`),
        ]);

        const [patientsResult, therapistsResult, roomsResult] = await Promise.all([
          patientsResponse.json(),
          therapistsResponse.json(),
          roomsResponse.json(),
        ]);

        setPatients(patientsResponse.ok ? (patientsResult.patients || []) : storePatients);
        setTherapists(therapistsResponse.ok ? (therapistsResult.therapists || []) : storeTherapists);
        setRooms(roomsResponse.ok ? (roomsResult.rooms || []) : storeRooms);
      } catch {
        setPatients(storePatients);
        setTherapists(storeTherapists);
        setRooms(storeRooms);
      }
    };

    loadLookupData();
  }, [storePatients, storeRooms, storeTherapists]);

  useEffect(() => {
    const loadAppointmentById = async () => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/appointments/get-by-id/${initialData.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch appointment details.');
        }

        setFormData({
          patientId: String(result.PatientId ?? result.patientId ?? ''),
          therapistId: String(result.TherapistId ?? result.therapistId ?? ''),
          date: String(result.AppointmentDate ?? result.date ?? '').slice(0, 10),
          time: String(result.AppointmentTime ?? result.time ?? '').slice(0, 5),
          durationMinutes: String(result.DurationMinutes ?? result.durationMinutes ?? result.duration ?? '60'),
          type: String(result.Type ?? result.type ?? 'Individual'),
          status: String(result.Status ?? result.status ?? 'Pending'),
          roomId: String(result.RoomId ?? result.roomId ?? ''),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load appointment details.';
        toast.error(message);
      }
    };

    loadAppointmentById();
  }, [initialData?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Patient"
        required
        value={formData.patientId}
        onChange={(e) =>
          setFormData({
            ...formData,
            patientId: e.target.value,
          })
        }
        options={patients.map((patient) => ({
          label: getDisplayName(patient),
          value: String(patient.Id ?? patient.id ?? patient.userId ?? ''),
        }))}
      />

      <Select
        label="Therapist"
        required
        value={formData.therapistId}
        onChange={(e) =>
          setFormData({
            ...formData,
            therapistId: e.target.value,
          })
        }
        options={therapists.map((therapist) => ({
          label: `Dr. ${getDisplayName(therapist)}`,
          value: String(therapist.Id ?? therapist.id ?? therapist.userId ?? ''),
        }))}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          required
          value={formData.date}
          onChange={(e) =>
            setFormData({
              ...formData,
              date: e.target.value,
            })
          }
        />

        <Input
          label="Time"
          type="time"
          required
          value={formData.time}
          onChange={(e) =>
            setFormData({
              ...formData,
              time: e.target.value,
            })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Duration (minutes)"
          type="number"
          min="1"
          value={formData.durationMinutes}
          onChange={(e) =>
            setFormData({
              ...formData,
              durationMinutes: e.target.value,
            })
          }
        />

        <Select
          label="Type"
          required
          value={formData.type}
          onChange={(e) =>
            setFormData({
              ...formData,
              type: e.target.value,
            })
          }
          options={[
            { label: 'Individual', value: 'Individual' },
            { label: 'Couple', value: 'Couple' },
            { label: 'Family', value: 'Family' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value,
            })
          }
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Confirmed', value: 'Confirmed' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
        />

        <Select
          label="Assign Room (Optional)"
          value={formData.roomId}
          onChange={(e) =>
            setFormData({
              ...formData,
              roomId: e.target.value,
            })
          }
          options={rooms.map((room) => ({
            label: `${String(room.Name ?? room.name ?? 'Room')} (${String(room.Type ?? room.type ?? '')})`,
            value: String(room.Id ?? room.id ?? ''),
          }))}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Appointment</Button>
      </div>
    </form>
  );
};

export function AdminAppointments() {
  const { appointments, patients, therapists, rooms, addEntity, updateEntity, deleteEntity } = useStore();
  const [apiAppointments, setApiAppointments] = useState<ApiAppointment[]>(() =>
    mapAppointmentList(appointments, {
      patients,
      therapists,
      rooms,
    })
  );

  const loadAppointments = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiAppointments(
        mapAppointmentList(appointments, {
          patients,
          therapists,
          rooms,
        })
      );
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/appointments/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setApiAppointments([]);
          return;
        }

        throw new Error(result.message || 'Failed to fetch appointments.');
      }

      setApiAppointments(
        mapAppointmentList(result.appointments || [], {
          patients,
          therapists,
          rooms,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch appointments.';
      toast.error(message);
      setApiAppointments(
        mapAppointmentList(appointments, {
          patients,
          therapists,
          rooms,
        })
      );
    } finally {
      // No-op
    }
  }, [appointments, patients, rooms, therapists]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (!apiBaseUrl) {
      setApiAppointments(
        mapAppointmentList(appointments, {
          patients,
          therapists,
          rooms,
        })
      );
    }
  }, [apiBaseUrl, appointments, patients, rooms, therapists]);

  const handleAdd = async (data: AppointmentFormData) => {
    try {
      if (!apiBaseUrl) {
        addEntity('appointments', {
          patientId: data.patientId,
          therapistId: data.therapistId,
          date: data.date,
          time: data.time,
          duration: Number(data.durationMinutes) || 60,
          type: data.type,
          status: data.status,
          roomId: data.roomId || undefined,
        });
        return true;
      }

      const payload: Record<string, string | number> = {
        patientId: data.patientId,
        therapistId: data.therapistId,
        date: data.date,
        time: data.time,
        type: data.type,
        status: data.status,
      };

      const durationMinutes = Number(data.durationMinutes);
      if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
        payload.durationMinutes = durationMinutes;
      }

      if (data.roomId) {
        payload.roomId = data.roomId;
      }

      const response = await fetch(`${apiBaseUrl}/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create appointment.');
      }

      await loadAppointments();
      toast.success(result.message || 'Appointment created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create appointment.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: AppointmentFormData) => {
    try {
      if (!apiBaseUrl) {
        updateEntity('appointments', id, {
          patientId: data.patientId,
          therapistId: data.therapistId,
          date: data.date,
          time: data.time,
          duration: Number(data.durationMinutes) || 60,
          type: data.type,
          status: data.status,
          roomId: data.roomId || undefined,
        });
        return true;
      }

      const payload: Record<string, string | number | null> = {
        patientId: data.patientId,
        therapistId: data.therapistId,
        date: data.date,
        time: data.time,
        type: data.type,
        status: data.status,
      };

      const durationMinutes = Number(data.durationMinutes);
      if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
        payload.durationMinutes = durationMinutes;
      }

      payload.roomId = data.roomId || null;

      const response = await fetch(`${apiBaseUrl}/appointments/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update appointment.');
      }

      await loadAppointments();
      toast.success(result.message || 'Appointment updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update appointment.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        deleteEntity('appointments', id);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/appointments/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete appointment.');
      }

      await loadAppointments();
      toast.success(result.message || 'Appointment deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete appointment.';
      toast.error(message);
    }
  };

  const columns: Column<ApiAppointment>[] = [
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
      header: 'Date',
      accessor: 'date',
      sortable: true,
      sortKey: 'date',
    },
    {
      header: 'Time',
      accessor: 'time',
    },
    {
      header: 'Duration',
      accessor: (row: ApiAppointment) => `${row.durationMinutes || '-'} min`,
    },
    {
      header: 'Room',
      accessor: 'roomName',
    },
    {
      header: 'Status',
      accessor: (row: ApiAppointment) => (
        <Badge
          variant={
            row.status === 'Confirmed'
              ? 'success'
              : row.status === 'Pending'
                ? 'warning'
                : row.status === 'Completed'
                  ? 'info'
                  : 'default'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <AdminCrudPage
      title="Appointments"
      data={apiAppointments}
      columns={columns}
      searchKey="patientName"
      FormComponent={AppointmentForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}