import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

interface TherapistFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  bio: string;
  hireDate: string;
  password: string;
}

interface TherapistFormProps {
  initialData?: Partial<TherapistFormData> & { id?: string };
  onSubmit: (data: TherapistFormData) => void | Promise<void>;
  onCancel: () => void;
}

interface ApiTherapist {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  hireDate: string;
  bio: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const mapStoreTherapist = (therapist: any): ApiTherapist => ({
  id: String(therapist.id ?? therapist.Id ?? ''),
  userId: String(therapist.userId ?? therapist.UserId ?? ''),
  firstName: String(therapist.firstName ?? therapist.FirstName ?? ''),
  lastName: String(therapist.lastName ?? therapist.LastName ?? ''),
  email: String(therapist.email ?? therapist.Email ?? ''),
  phone: String(therapist.phone ?? therapist.Phone ?? ''),
  specialization: String(therapist.specialization ?? therapist.Specialization ?? ''),
  licenseNumber: String(therapist.licenseNumber ?? therapist.LicenseNumber ?? ''),
  qualifications: String(therapist.qualifications ?? therapist.Qualifications ?? ''),
  hireDate: String(therapist.hireDate ?? therapist.EmploymentDate ?? '').slice(0, 10),
  bio: String(therapist.bio ?? therapist.Biography ?? ''),
});

const TherapistForm = ({ initialData, onSubmit, onCancel }: TherapistFormProps) => {
  const [formData, setFormData] = useState<TherapistFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    qualifications: '',
    bio: '',
    hireDate: new Date().toISOString().split('T')[0],
    password: '',
    ...initialData,
  });

  useEffect(() => {
    const loadTherapistById = async () => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/therapists/get-by-id/${initialData.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch therapist details.');
        }

        setFormData((prev) => ({
          ...prev,
          firstName: String(result.FirstName ?? result.firstName ?? ''),
          lastName: String(result.LastName ?? result.lastName ?? ''),
          email: String(result.Email ?? result.email ?? ''),
          phone: String(result.Phone ?? result.phone ?? ''),
          specialization: String(result.Specialization ?? result.specialization ?? ''),
          licenseNumber: String(result.LicenseNumber ?? result.licenseNumber ?? ''),
          qualifications: String(result.Qualifications ?? result.qualifications ?? ''),
          hireDate: String(result.EmploymentDate ?? result.hireDate ?? '').slice(0, 10),
          bio: String(result.Biography ?? result.bio ?? ''),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load therapist details.';
        toast.error(message);
      }
    };

    loadTherapistById();
  }, [initialData?.id]);

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
              firstName: e.target.value,
            })
          }
        />
        <Input
          label="Last Name"
          required
          value={formData.lastName}
          onChange={(e) =>
            setFormData({
              ...formData,
              lastName: e.target.value,
            })
          }
        />
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
              email: e.target.value,
            })
          }
        />
        <Input
          label="Phone"
          required
          value={formData.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone: e.target.value,
            })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Specialization"
          required
          value={formData.specialization}
          onChange={(e) =>
            setFormData({
              ...formData,
              specialization: e.target.value,
            })
          }
        />
        <Input
          label="License Number"
          required
          value={formData.licenseNumber}
          onChange={(e) =>
            setFormData({
              ...formData,
              licenseNumber: e.target.value,
            })
          }
        />
      </div>

      <Input
        label="Qualifications"
        required
        value={formData.qualifications}
        onChange={(e) =>
          setFormData({
            ...formData,
            qualifications: e.target.value,
          })
        }
      />

      <Input
        label="Hire Date"
        type="date"
        required
        value={formData.hireDate}
        onChange={(e) =>
          setFormData({
            ...formData,
            hireDate: e.target.value,
          })
        }
      />

      <Textarea
        label="Bio"
        rows={3}
        value={formData.bio}
        onChange={(e) =>
          setFormData({
            ...formData,
            bio: e.target.value,
          })
        }
      />

      <Input
        label="Password"
        type="password"
        placeholder="Leave blank to keep current password"
        value={formData.password}
        onChange={(e) =>
          setFormData({
            ...formData,
            password: e.target.value,
          })
        }
      />
      <p className="text-xs text-slate-500">
        Required when creating a new therapist. Leave blank when editing to keep the current password.
      </p>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Therapist</Button>
      </div>
    </form>
  );
};

export function AdminTherapists() {
  const { therapists, addEntity } = useStore();
  const [apiTherapists, setApiTherapists] = useState<ApiTherapist[]>(
    therapists.map(mapStoreTherapist)
  );

  const loadTherapists = useCallback(async () => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch therapists.');
      }

      const mappedTherapists = (result.therapists || []).map((therapist: Record<string, any>) => ({
        id: String(therapist.Id ?? therapist.id ?? ''),
        userId: String(therapist.UserId ?? therapist.userId ?? ''),
        firstName: String(therapist.FirstName ?? therapist.firstName ?? ''),
        lastName: String(therapist.LastName ?? therapist.lastName ?? ''),
        email: String(
          therapist.Email ?? therapist.email ?? therapist.user?.Email ?? therapist.user?.email ?? ''
        ),
        phone: String(therapist.Phone ?? therapist.phone ?? ''),
        specialization: String(therapist.Specialization ?? therapist.specialization ?? ''),
        licenseNumber: String(therapist.LicenseNumber ?? therapist.licenseNumber ?? ''),
        qualifications: String(therapist.Qualifications ?? therapist.qualifications ?? ''),
        hireDate: String(therapist.EmploymentDate ?? therapist.hireDate ?? '').slice(0, 10),
        bio: String(therapist.Biography ?? therapist.bio ?? ''),
      }));

      setApiTherapists(mappedTherapists);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch therapists.';
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    loadTherapists();
  }, [loadTherapists]);

  const columns = [
    {
      header: 'Name',
      accessor: (row: ApiTherapist) => `Dr. ${row.firstName} ${row.lastName}`,
      sortable: true,
      sortKey: 'firstName' as keyof ApiTherapist,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof ApiTherapist,
    },
    {
      header: 'Specialization',
      accessor: 'specialization' as keyof ApiTherapist,
    },
    {
      header: 'License',
      accessor: 'licenseNumber' as keyof ApiTherapist,
    },
    {
      header: 'Hire Date',
      accessor: 'hireDate' as keyof ApiTherapist,
      sortable: true,
      sortKey: 'hireDate' as keyof ApiTherapist,
    },
  ];

  const handleAdd = async (data: TherapistFormData) => {
    try {
      if (!apiBaseUrl) {
        const userId = Math.random().toString(36).substr(2, 9);
        addEntity('users', {
          id: userId,
          email: data.email,
          password: data.password || 'password123',
          role: 'therapist',
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        });
        addEntity('therapists', {
          ...data,
          userId,
        });
        return true;
      }

      if (!data.password.trim()) {
        throw new Error('Password is required when creating a therapist.');
      }

      const response = await fetch(`${apiBaseUrl}/therapists/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          qualifications: data.qualifications,
          employmentDate: data.hireDate,
          biography: data.bio,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create therapist.');
      }

      await loadTherapists();
      toast.success(result.message || 'Therapist created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create therapist.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: TherapistFormData) => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const payload: Record<string, string> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        qualifications: data.qualifications,
        employmentDate: data.hireDate,
        biography: data.bio,
      };

      if (data.password.trim() !== '') {
        payload.password = data.password;
      }

      const response = await fetch(`${apiBaseUrl}/therapists/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update therapist.');
      }

      await loadTherapists();
      toast.success(result.message || 'Therapist updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update therapist.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/therapists/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete therapist.');
      }

      await loadTherapists();
      toast.success(result.message || 'Therapist deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete therapist.';
      toast.error(message);
    }
  };

  return (
    <AdminCrudPage
      title="Therapist Management"
      data={apiTherapists}
      columns={columns}
      searchKey="firstName"
      FormComponent={TherapistForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
