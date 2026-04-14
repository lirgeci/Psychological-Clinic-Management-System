import React, { useState, Component } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
const TherapistForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: '',
      licenseNumber: '',
      qualifications: '',
      bio: '',
      hireDate: new Date().toISOString().split('T')[0]
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
          label="Specialization"
          required
          value={formData.specialization}
          onChange={(e) =>
          setFormData({
            ...formData,
            specialization: e.target.value
          })
          } />
        
        <Input
          label="License Number"
          required
          value={formData.licenseNumber}
          onChange={(e) =>
          setFormData({
            ...formData,
            licenseNumber: e.target.value
          })
          } />
        
      </div>
      <Input
        label="Qualifications"
        required
        value={formData.qualifications}
        onChange={(e) =>
        setFormData({
          ...formData,
          qualifications: e.target.value
        })
        } />
      
      <Input
        label="Hire Date"
        type="date"
        required
        value={formData.hireDate}
        onChange={(e) =>
        setFormData({
          ...formData,
          hireDate: e.target.value
        })
        } />
      
      <Textarea
        label="Bio"
        rows={3}
        value={formData.bio}
        onChange={(e) =>
        setFormData({
          ...formData,
          bio: e.target.value
        })
        } />
      

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Therapist</Button>
      </div>
    </form>);

};
export function AdminTherapists() {
  const { therapists, addEntity, updateEntity, deleteEntity } = useStore();
  const columns = [
  {
    header: 'Name',
    accessor: (row: any) => `Dr. ${row.firstName} ${row.lastName}`,
    sortable: true,
    sortKey: 'firstName'
  },
  {
    header: 'Email',
    accessor: 'email' as keyof (typeof therapists)[0]
  },
  {
    header: 'Specialization',
    accessor: 'specialization' as keyof (typeof therapists)[0]
  },
  {
    header: 'License',
    accessor: 'licenseNumber' as keyof (typeof therapists)[0]
  },
  {
    header: 'Hire Date',
    accessor: 'hireDate' as keyof (typeof therapists)[0],
    sortable: true,
    sortKey: 'hireDate'
  }];

  const handleAdd = (data: any) => {
    const userId = Math.random().toString(36).substr(2, 9);
    addEntity('users', {
      id: userId,
      email: data.email,
      password: 'password123',
      role: 'therapist',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone
    });
    addEntity('therapists', {
      ...data,
      userId
    });
  };
  return (
    <AdminCrudPage
      title="Therapist Management"
      data={therapists}
      columns={columns}
      searchKey="firstName"
      FormComponent={TherapistForm}
      onAdd={handleAdd}
      onUpdate={(id, data) => updateEntity('therapists', id, data)}
      onDelete={(id) => deleteEntity('therapists', id)} />);


}