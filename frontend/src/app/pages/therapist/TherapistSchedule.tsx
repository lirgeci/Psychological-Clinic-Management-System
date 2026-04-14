import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { CalendarIcon } from 'lucide-react';
export function TherapistSchedule() {
  const { currentUser, appointments, patients, updateEntity } = useStore();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const myAppointments = appointments.
  filter((a) => a.therapistId === currentUser?.id).
  map((apt) => {
    const patient = patients.find((p) => p.userId === apt.patientId);
    return {
      ...apt,
      patientName: patient ?
      `${patient.firstName} ${patient.lastName}` :
      'Unknown'
    };
  });
  const handleAccept = (id: string) => {
    updateEntity('appointments', id, {
      status: 'Confirmed'
    });
  };
  const handleReject = () => {
    if (selectedAptId && rejectReason) {
      updateEntity('appointments', selectedAptId, {
        status: 'Rejected',
        cancellationReason: rejectReason
      });
      setRejectModalOpen(false);
      setRejectReason('');
      setSelectedAptId(null);
    }
  };
  const columns = [
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof myAppointments)[0],
    sortable: true,
    sortKey: 'patientName' as keyof (typeof myAppointments)[0]
  },
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof myAppointments)[0],
    sortable: true,
    sortKey: 'date' as keyof (typeof myAppointments)[0]
  },
  {
    header: 'Time',
    accessor: 'time' as keyof (typeof myAppointments)[0],
    sortable: true,
    sortKey: 'time' as keyof (typeof myAppointments)[0]
  },
  {
    header: 'Duration',
    accessor: (row: any) => `${row.duration} min`
  },
  {
    header: 'Type',
    accessor: 'type' as keyof (typeof myAppointments)[0]
  },
  {
    header: 'Status',
    accessor: (row: any) =>
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

  const actions = (row: any) => {
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