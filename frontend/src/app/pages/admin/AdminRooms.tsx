import React, { useState, Component } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
const RoomForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      floor: '',
      type: 'Therapy',
      capacity: 2,
      equipment: '',
      status: 'Available'
    }
  );
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacity: Number(formData.capacity)
    });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Room Name"
          required
          value={formData.name}
          onChange={(e) =>
          setFormData({
            ...formData,
            name: e.target.value
          })
          } />
        
        <Input
          label="Floor"
          required
          value={formData.floor}
          onChange={(e) =>
          setFormData({
            ...formData,
            floor: e.target.value
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
            label: 'Therapy',
            value: 'Therapy'
          },
          {
            label: 'Group Therapy',
            value: 'Group Therapy'
          },
          {
            label: 'Assessment',
            value: 'Assessment'
          }]
          } />
        
        <Input
          label="Capacity"
          type="number"
          required
          min="1"
          value={formData.capacity}
          onChange={(e) =>
          setFormData({
            ...formData,
            capacity: e.target.value
          })
          } />
        
      </div>
      <Input
        label="Equipment (comma separated)"
        required
        value={formData.equipment}
        onChange={(e) =>
        setFormData({
          ...formData,
          equipment: e.target.value
        })
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
          label: 'Available',
          value: 'Available'
        },
        {
          label: 'Occupied',
          value: 'Occupied'
        },
        {
          label: 'Maintenance',
          value: 'Maintenance'
        }]
        } />
      

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Room</Button>
      </div>
    </form>);

};
export function AdminRooms() {
  const { rooms, addEntity, updateEntity, deleteEntity } = useStore();
  const columns = [
  {
    header: 'Name',
    accessor: 'name' as keyof (typeof rooms)[0],
    sortable: true,
    sortKey: 'name'
  },
  {
    header: 'Floor',
    accessor: 'floor' as keyof (typeof rooms)[0]
  },
  {
    header: 'Type',
    accessor: 'type' as keyof (typeof rooms)[0]
  },
  {
    header: 'Capacity',
    accessor: 'capacity' as keyof (typeof rooms)[0]
  },
  {
    header: 'Status',
    accessor: (row: any) =>
    <Badge
      variant={
      row.status === 'Available' ?
      'success' :
      row.status === 'Occupied' ?
      'warning' :
      'error'
      }>
      
          {row.status}
        </Badge>

  }];

  return (
    <AdminCrudPage
      title="Room Management"
      data={rooms}
      columns={columns}
      searchKey="name"
      FormComponent={RoomForm}
      onAdd={(data) => addEntity('rooms', data)}
      onUpdate={(id, data) => updateEntity('rooms', id, data)}
      onDelete={(id) => deleteEntity('rooms', id)} />);


}