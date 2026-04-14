import React, { useState, Component } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
const PatientForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'Prefer not to say',
      address: '',
      emergencyContact: ''
    }
  );
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          required
          value={formData.firstName}
          onChange={(e) =>
          setFormData({
            ...formData,
            firstName: e.target.value
          })
          } />
        
        <Input
          label="Last Name"
          required
          value={formData.lastName}
          onChange={(e) =>
          setFormData({
            ...formData,
            lastName: e.target.value
          })
          } />
        
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(e) =>
          setFormData({
            ...formData,
            email: e.target.value
          })
          } />
        
        <Input
          label="Phone"
          required
          value={formData.phone}
          onChange={(e) =>
          setFormData({
            ...formData,
            phone: e.target.value
          })
          } />
        
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          required
          value={formData.dateOfBirth}
          onChange={(e) =>
          setFormData({
            ...formData,
            dateOfBirth: e.target.value
          })
          } />
        
        <Select
          label="Gender"
          value={formData.gender}
          onChange={(e) =>
          setFormData({
            ...formData,
            gender: e.target.value
          })
          }
          options={[
          {
            label: 'Male',
            value: 'Male'
          },
          {
            label: 'Female',
            value: 'Female'
          },
          {
            label: 'Other',
            value: 'Other'
          },
          {
            label: 'Prefer not to say',
            value: 'Prefer not to say'
          }]
          } />
        
      </div>
      <Input
        label="Address"
        required
        value={formData.address}
        onChange={(e) =>
        setFormData({
          ...formData,
          address: e.target.value
        })
        } />
      
      <Input
        label="Emergency Contact"
        required
        value={formData.emergencyContact}
        onChange={(e) =>
        setFormData({
          ...formData,
          emergencyContact: e.target.value
        })
        } />
      

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Patient</Button>
      </div>
    </form>);

};
export function AdminPatients() {
  const { patients, addEntity, updateEntity, deleteEntity } = useStore();
  const columns = [
  {
    header: 'Name',
    accessor: (row: any) => `${row.firstName} ${row.lastName}`,
    sortable: true,
    sortKey: 'firstName'
  },
  {
    header: 'Email',
    accessor: 'email' as keyof (typeof patients)[0],
    sortable: true,
    sortKey: 'email'
  },
  {
    header: 'Phone',
    accessor: 'phone' as keyof (typeof patients)[0]
  },
  {
    header: 'DOB',
    accessor: 'dateOfBirth' as keyof (typeof patients)[0]
  },
  {
    header: 'Reg. Date',
    accessor: 'registrationDate' as keyof (typeof patients)[0],
    sortable: true,
    sortKey: 'registrationDate'
  }];

  const handleAdd = (data: any) => {
    const userId = Math.random().toString(36).substr(2, 9);
    addEntity('users', {
      id: userId,
      email: data.email,
      password: 'password123',
      role: 'patient',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone
    });
    addEntity('patients', {
      ...data,
      userId,
      registrationDate: new Date().toISOString().split('T')[0]
    });
  };
  return (
    <AdminCrudPage
      title="Patient Management"
      data={patients}
      columns={columns}
      searchKey="firstName"
      FormComponent={PatientForm}
      onAdd={handleAdd}
      onUpdate={(id, data) => updateEntity('patients', id, data)}
      onDelete={(id) => deleteEntity('patients', id)} />);


}