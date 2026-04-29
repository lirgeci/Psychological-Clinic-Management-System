import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ApiAppointmentRow {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  cancellationReason?: string;
  patientName: string;
}

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function TherapistSchedule() {
  const { currentUser, appointments, patients, updateEntity } = useStore();
  const [apiAppointments, setApiAppointments] = useState<ApiAppointmentRow[]>([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fallbackAppointments = useMemo(() => {
    return appointments.
      filter((appointment) => appointment.therapistId === currentUser?.id).
      map((appointment) => {
        const patient = patients.find((item) => item.userId === appointment.patientId);
        return {
          id: appointment.id,
          patientId: appointment.patientId,
          therapistId: appointment.therapistId,
          date: appointment.date,
          time: appointment.time,
          duration: appointment.duration,
          type: appointment.type,
          status: appointment.status,
          cancellationReason: appointment.cancellationReason,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'
        };
      });
  }, [appointments, currentUser?.id, patients]);

  const loadTherapistAppointments = async () => {
    if (!currentUser || !apiBaseUrl) {
      setApiAppointments([]);
      return;
    }

    try {
      const [therapistsResponse, patientsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
        fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
      ]);

      const [therapistsResult, patientsResult] = await Promise.all([
        therapistsResponse.json(),
        patientsResponse.json(),
      ]);

      if (!therapistsResponse.ok) {
        throw new Error(therapistsResult.message || 'Failed to load therapist profile.');
      }

      const matchedTherapist = (therapistsResult.therapists || []).find((therapist: Record<string, unknown>) =>
        String(therapist.UserId ?? therapist.userId ?? '') === String(currentUser.id)
      );

      if (!matchedTherapist) {
        setApiAppointments([]);
        return;
      }

      const therapistId = String(matchedTherapist.Id ?? matchedTherapist.id ?? '');

      const appointmentsResponse = await fetch(`${apiBaseUrl}/therapists/${therapistId}/appointments`);
      const appointmentsResult = await appointmentsResponse.json();

      if (!appointmentsResponse.ok) {
        throw new Error(appointmentsResult.message || 'Failed to load appointments.');
      }

      const patientList = patientsResponse.ok ? patientsResult.patients || [] : [];

      const mappedAppointments = (appointmentsResult || []).map((appointment: Record<string, unknown>) => {
        const patientId = String(appointment.PatientId ?? appointment.patientId ?? '');
        const matchedPatient = patientList.find((patient: Record<string, unknown>) =>
          String(patient.Id ?? patient.id ?? '') === patientId
        );

        const patientFirstName = String(matchedPatient?.FirstName ?? matchedPatient?.firstName ?? 'Unknown');
        const patientLastName = String(matchedPatient?.LastName ?? matchedPatient?.lastName ?? '');

        return {
          id: String(appointment.Id ?? appointment.id ?? ''),
          patientId,
          therapistId: String(appointment.TherapistId ?? appointment.therapistId ?? therapistId),
          date: String(appointment.AppointmentDate ?? appointment.date ?? '').slice(0, 10),
          time: String(appointment.AppointmentTime ?? appointment.time ?? '').slice(0, 5),
          duration: Number(appointment.DurationMinutes ?? appointment.duration ?? 60),
          type: String(appointment.Type ?? appointment.type ?? 'Individual'),
          status: String(appointment.Status ?? appointment.status ?? 'Pending'),
          cancellationReason: String(appointment.CancellationReason ?? appointment.cancellationReason ?? '') || undefined,
          patientName: `${patientFirstName} ${patientLastName}`.trim(),
        };
      });

      setApiAppointments(mappedAppointments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load appointments.';
      toast.error(message);
      setApiAppointments([]);
    }
  };

  useEffect(() => {
    loadTherapistAppointments();
  }, [currentUser]);

  const myAppointments = apiAppointments.length > 0 ? apiAppointments : fallbackAppointments;

  const handleAccept = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        updateEntity('appointments', id, {
          status: 'Confirmed'
        });
        return;
      }

      const response = await fetch(`${apiBaseUrl}/appointments/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Confirmed',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to accept appointment.');
      }

      toast.success(result.message || 'Appointment accepted.');
      await loadTherapistAppointments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept appointment.';
      toast.error(message);
    }
  };

  const handleReject = async () => {
    if (!selectedAptId || !rejectReason) {
      return;
    }

    try {
      if (!apiBaseUrl) {
        updateEntity('appointments', selectedAptId, {
          status: 'Rejected',
          cancellationReason: rejectReason
        });
      } else {
        const response = await fetch(`${apiBaseUrl}/appointments/update/${selectedAptId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'Rejected',
            cancellationReason: rejectReason,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to reject appointment.');
        }

        toast.success(result.message || 'Appointment rejected.');
        await loadTherapistAppointments();
      }

      setRejectModalOpen(false);
      setRejectReason('');
      setSelectedAptId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject appointment.';
      toast.error(message);
    }
  };

  const columns: Column<ApiAppointmentRow>[] = [
  {
    header: 'Patient',
    accessor: 'patientName',
    sortable: true,
    sortKey: 'patientName'
  },
  {
    header: 'Date',
    accessor: 'date',
    sortable: true,
    sortKey: 'date'
  },
  {
    header: 'Time',
    accessor: 'time',
    sortable: true,
    sortKey: 'time'
  },
  {
    header: 'Duration',
    accessor: (row: ApiAppointmentRow) => `${row.duration} min`
  },
  {
    header: 'Type',
    accessor: 'type'
  },
  {
    header: 'Status',
    accessor: (row: ApiAppointmentRow) =>
    <Badge
      variant={
      row.status === 'Confirmed' ?
      'success' :
      row.status === 'Pending' ?
      'warning' :
      row.status === 'Rejected' ?
      'error' :
      'default'
      }>
      
          {row.status}
        </Badge>

  }];

  const actions = (row: ApiAppointmentRow) => {
    if (row.status === 'Pending') {
      return (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => handleAccept(row.id)}>
            
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => {
              setSelectedAptId(row.id);
              setRejectModalOpen(true);
            }}>
            
            Reject
          </Button>
        </div>);

    }
    return null;
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Schedule & Appointments
        </h1>
      </div>

      <DataTable
        data={myAppointments}
        columns={columns}
        searchable
        searchKey="patientName"
        actions={actions} />
      

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Appointment">
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please provide a reason for rejecting this appointment request. This
            will be visible to the patient.
          </p>
          <Textarea
            label="Cancellation Reason"
            required
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason}>
              
              Reject Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>);

}