import React, { useState, Component } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
const UserForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'patient',
      password: ''
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
      
      <Select
        label="Role"
        required
        value={formData.role}
        onChange={(e) =>
        setFormData({
          ...formData,
          role: e.target.value
        })
        }
        options={[
        {
          label: 'Patient',
          value: 'patient'
        },
        {
          label: 'Therapist',
          value: 'therapist'
        },
        {
          label: 'Admin',
          value: 'admin'
        }]
        } />
      
      {!initialData &&
      <Input
        label="Password"
        type="password"
        required
        value={formData.password}
        onChange={(e) =>
        setFormData({
          ...formData,
          password: e.target.value
        })
        } />

      }
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save User</Button>
      </div>
    </form>);

};
export function AdminUsers() {
  const { users, addEntity, updateEntity, deleteEntity } = useStore();
  const columns = [
  {
    header: 'Name',
    accessor: (row: any) => `${row.firstName} ${row.lastName}`,
    sortable: true,
    sortKey: 'firstName'
  },
  {
    header: 'Email',
    accessor: 'email' as keyof (typeof users)[0],
    sortable: true,
    sortKey: 'email'
  },
  {
    header: 'Phone',
    accessor: 'phone' as keyof (typeof users)[0]
  },
  {
    header: 'Role',
    accessor: (row: any) =>
    <Badge
      variant={
      row.role === 'admin' ?
      'error' :
      row.role === 'therapist' ?
      'info' :
      'default'
      }>
      
          {row.role.toUpperCase()}
        </Badge>

  }];

  return (
    <AdminCrudPage
      title="User Management"
      data={users}
      columns={columns}
      searchKey="email"
      FormComponent={UserForm}
      onAdd={(data) => addEntity('users', data)}
      onUpdate={(id, data) => updateEntity('users', id, data)}
      onDelete={(id) => deleteEntity('users', id)} />);


}