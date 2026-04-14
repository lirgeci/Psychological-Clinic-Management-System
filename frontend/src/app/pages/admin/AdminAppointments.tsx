import React, { useState, Component } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
const AppointmentForm = ({ initialData, onSubmit, onCancel }: any) => {
  const { patients, therapists, rooms } = useStore();
  const [formData, setFormData] = useState(
    initialData || {
      patientId: '',
      therapistId: '',
      date: '',
      time: '',
      duration: 60,
      type: 'Individual',
      status: 'Pending',
      roomId: ''
    }
  );
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
          patientId: e.target.value
        })
        }
        options={patients.map((p) => ({
          label: `${p.firstName} ${p.lastName}`,
          value: p.userId
        }))} />
      
      <Select
        label="Therapist"
        required
        value={formData.therapistId}
        onChange={(e) =>
        setFormData({
          ...formData,
          therapistId: e.target.value
        })
        }
        options={therapists.map((t) => ({
          label: `Dr. ${t.firstName} ${t.lastName}`,
          value: t.userId
        }))} />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          required
          value={formData.date}
          onChange={(e) =>
          setFormData({
            ...formData,
            date: e.target.value
          })
          } />
        
        <Input
          label="Time"
          type="time"
          required
          value={formData.time}
          onChange={(e) =>
          setFormData({
            ...formData,
            time: e.target.value
          })
          } />
        
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          required
          value={formData.type}
          onChange={(e) =>
          setFormData({
            ...formData,
            type: e.target.value
          })
          }
          options={[
          {
            label: 'Individual',
            value: 'Individual'
          },
          {
            label: 'Couple',
            value: 'Couple'
          },
          {
            label: 'Family',
            value: 'Family'
          }]
          } />
        
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(e) =>
          setFormData({
            ...formData,
            status: e.target.value
          })
          }
          options={[
          {
            label: 'Pending',
            value: 'Pending'
          },
          {
            label: 'Confirmed',
            value: 'Confirmed'
          },
          {
            label: 'Completed',
            value: 'Completed'
          },
          {
            label: 'Cancelled',
            value: 'Cancelled'
          }]
          } />
        
      </div>
      <Select
        label="Assign Room (Optional)"
        value={formData.roomId || ''}
        onChange={(e) =>
        setFormData({
          ...formData,
          roomId: e.target.value
        })
        }
        options={rooms.map((r) => ({
          label: `${r.name} (${r.type})`,
          value: r.id
        }))} />
      

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Appointment</Button>
      </div>
    </form>);

};
export function AdminAppointments() {
  const {
    appointments,
    patients,
    therapists,
    rooms,
    addEntity,
    updateEntity,
    deleteEntity
  } = useStore();
  const enrichedAppointments = appointments.map((apt) => {
    const p = patients.find((p) => p.userId === apt.patientId);
    const t = therapists.find((t) => t.userId === apt.therapistId);
    const r = rooms.find((r) => r.id === apt.roomId);
    return {
      ...apt,
      patientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
      therapistName: t ? `Dr. ${t.lastName}` : 'Unknown',
      roomName: r ? r.name : 'Unassigned'
    };
  });
  const columns = [
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedAppointments)[0],
    sortable: true,
    sortKey: 'patientName'
  },
  {
    header: 'Therapist',
    accessor: 'therapistName' as keyof (typeof enrichedAppointments)[0],
    sortable: true,
    sortKey: 'therapistName'
  },
  {
    header: 'Date/Time',
    accessor: (row: any) => `${row.date} ${row.time}`,
    sortable: true,
    sortKey: 'date'
  },
  {
    header: 'Room',
    accessor: 'roomName' as keyof (typeof enrichedAppointments)[0]
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
      'default'
      }>
      
          {row.status}
        </Badge>

  }];

  return (
    <AdminCrudPage
      title="Appointment Management"
      data={enrichedAppointments}
      columns={columns}
      searchKey="patientName"
      FormComponent={AppointmentForm}
      onAdd={(data) => addEntity('appointments', data)}
      onUpdate={(id, data) => updateEntity('appointments', id, data)}
      onDelete={(id) => deleteEntity('appointments', id)} />);


}