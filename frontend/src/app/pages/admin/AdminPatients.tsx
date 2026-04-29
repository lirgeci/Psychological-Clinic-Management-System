import React, { useCallback, useEffect, useState } from 'react';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  password?: string;
}

interface ApiPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  registrationDate: string;
  userId?: string;
}
const PatientForm = ({ initialData, onSubmit, onCancel }: {
  initialData?: Partial<PatientFormData> & { id?: string };
  onSubmit: (data: PatientFormData) => void | Promise<void>;
  onCancel: () => void;
}) => {
  const apiBaseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
  const [formData, setFormData] = useState<PatientFormData>(
    initialData ? {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      dateOfBirth: initialData.dateOfBirth || '',
      gender: initialData.gender || 'Prefer not to say',
      address: initialData.address || '',
      emergencyContact: initialData.emergencyContact || '',
      password: '',
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'Prefer not to say',
      address: '',
      emergencyContact: '',
      password: ''
    }
  );

  useEffect(() => {
    const loadPatientById = async () => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/patients/get-by-id/${initialData.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch patient details.');
        }

        setFormData({
          firstName: String(result.FirstName ?? result.firstName ?? ''),
          lastName: String(result.LastName ?? result.lastName ?? ''),
          email: String(result.Email ?? result.email ?? ''),
          phone: String(result.Phone ?? result.phone ?? ''),
          dateOfBirth: String(result.DateOfBirth ?? result.dateOfBirth ?? '').slice(0, 10),
          gender: String(result.Gender ?? result.gender ?? 'Prefer not to say'),
          address: String(result.Address ?? result.address ?? ''),
          emergencyContact: String(result.EmergencyContact ?? result.emergencyContact ?? ''),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load patient details.';
        toast.error(message);
      }
    };

    loadPatientById();
  }, [apiBaseUrl, initialData?.id]);

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
      
      <Input
        label="Password"
        type="password"
        required={!initialData}
        placeholder={initialData ? "Leave blank to keep current password" : "Enter patient password"}
        value={formData.password || ''}
        onChange={(e) =>
        setFormData({
          ...formData,
          password: e.target.value
        })
        } />
      {initialData && (
        <p className="text-xs text-slate-500">Leave password blank if you don't want to change it.</p>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Patient</Button>
      </div>
    </form>);

};
export function AdminPatients() {
  const [apiPatients, setApiPatients] = useState<ApiPatient[]>([]);
  const apiBaseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

  const loadPatients = useCallback(async () => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setApiPatients([]);
          return;
        }

        throw new Error(result.message || 'Failed to fetch patients.');
      }

      const mappedPatients: ApiPatient[] = (result.patients || []).map((patient: Record<string, unknown>) => ({
        id: String(patient.Id ?? patient.id ?? ''),
        firstName: String(patient.FirstName ?? patient.firstName ?? ''),
        lastName: String(patient.LastName ?? patient.lastName ?? ''),
        email: String(patient.Email ?? patient.email ?? ''),
        phone: String(patient.Phone ?? patient.phone ?? ''),
        dateOfBirth: String(patient.DateOfBirth ?? patient.dateOfBirth ?? '').slice(0, 10),
        gender: String(patient.Gender ?? patient.gender ?? ''),
        address: String(patient.Address ?? patient.address ?? ''),
        emergencyContact: String(patient.EmergencyContact ?? patient.emergencyContact ?? ''),
        registrationDate: String(patient.RegistrationDate ?? patient.registrationDate ?? '').slice(0, 10),
        userId: String(patient.UserId ?? patient.userId ?? ''),
      }));

      setApiPatients(mappedPatients);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch patients.';
      toast.error(message);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const columns: Column<ApiPatient>[] = [
  {
    header: 'Name',
    accessor: (row: ApiPatient) => `${row.firstName} ${row.lastName}`,
    sortable: true,
    sortKey: 'firstName'
  },
  {
    header: 'Email',
    accessor: 'email',
    sortable: true,
    sortKey: 'email'
  },
  {
    header: 'Phone',
    accessor: 'phone'
  },
  {
    header: 'DOB',
    accessor: 'dateOfBirth'
  },
  {
    header: 'Reg. Date',
    accessor: 'registrationDate',
    sortable: true,
    sortKey: 'registrationDate'
  }];

  const handleAdd = async (data: PatientFormData) => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      if (!data.password || data.password.trim() === '') {
        throw new Error('Password is required for new patients.');
      }

      const response = await fetch(`${apiBaseUrl}/patients/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create patient.');
      }

      await loadPatients();
      toast.success(result.message || 'Patient created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create patient.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: PatientFormData) => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const { password, ...updateData } = data;
      const payload = password && password.trim() !== ''
        ? { ...updateData, password }
        : updateData;

      const response = await fetch(`${apiBaseUrl}/patients/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update patient.');
      }

      await loadPatients();
      toast.success(result.message || 'Patient updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update patient.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/patients/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete patient.');
      }

      await loadPatients();
      toast.success(result.message || 'Patient deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete patient.';
      toast.error(message);
    }
  };

  return (
    <AdminCrudPage
      title="Patient Management"
      data={apiPatients}
      columns={columns}
      searchKey="firstName"
      FormComponent={PatientForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete} />);


}