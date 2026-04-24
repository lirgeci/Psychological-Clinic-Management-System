import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface UserFormProps {
  initialData?: (Partial<UserFormData> & { id?: string });
  onSubmit: (data: UserFormData) => void | Promise<void>;
  onCancel: () => void;
}

interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

const UserForm = ({ initialData, onSubmit, onCancel }: UserFormProps) => {
  const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
  const [formData, setFormData] = useState<UserFormData>({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      ...initialData,
      password: initialData?.password || '',
    });

  useEffect(() => {
    const loadUserById = async () => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/users/get-by-id/${initialData.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch user details.');
        }

        setFormData((prev) => ({
          ...prev,
          firstName: String(result.firstName ?? ''),
          lastName: String(result.lastName ?? ''),
          email: String(result.Email ?? result.email ?? ''),
          phone: String(result.phoneNumber ?? ''),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load user details.';
        toast.error(message);
      }
    };

    loadUserById();
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

      <Input
        label="Password"
        type="password"
        placeholder="Leave blank to keep current password"
        value={formData.password}
        onChange={(e) =>
        setFormData({
          ...formData,
          password: e.target.value
        })
        } />
      <p className="text-xs text-slate-500">If you leave this blank, password remains the same.</p>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save User</Button>
      </div>
    </form>);

};
export function AdminUsers() {
  const { users, addEntity } = useStore();
  const [apiUsers, setApiUsers] = useState<ApiUser[]>(users as ApiUser[]);
  const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

  const loadUsers = useCallback(async () => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/users/get-all`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch users.');
      }

      const mappedUsers = (result.users || []).map((user: Record<string, unknown>) => ({
        id: String(user.Id ?? user.userId ?? ''),
        email: String(user.Email ?? user.email ?? ''),
        firstName: String(user.firstName ?? ''),
        lastName: String(user.lastName ?? ''),
        phone: String(user.phoneNumber ?? '-'),
        role: String(user.role ?? 'Unknown')
      }));

      setApiUsers(mappedUsers);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users.';
      toast.error(message);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpdate = async (id: string, data: UserFormData) => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const payload: Record<string, string> = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      };

      if (data.password.trim() !== '') {
        payload.password = data.password;
      }

      const response = await fetch(`${apiBaseUrl}/users/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user.');
      }

      await loadUsers();
      toast.success(result.message || 'User updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        throw new Error('VITE_API_BASE_URL is not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/users/delete/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete user.');
      }

      await loadUsers();
      toast.success(result.message || 'User deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user.';
      toast.error(message);
    }
  };

  const columns: Column<ApiUser>[] = [
  {
    header: 'Name',
    accessor: (row: ApiUser) => {
      const fullName = `${row.firstName || ''} ${row.lastName || ''}`.trim();
      return fullName || '-';
    },
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
    header: 'Role',
    accessor: (row: ApiUser) =>
    {
      const normalizedRole = row.role.toLowerCase();

      return (
    <Badge
      variant={
      normalizedRole === 'admin' ?
      'error' :
      normalizedRole === 'therapist' ?
      'info' :
      'default'
      }>
          {row.role.toUpperCase()}
        </Badge>
      );
    }

  }];

  return (
    <AdminCrudPage
      title="User Management"
      data={apiUsers}
      columns={columns}
      searchKey="email"
      showAddButton={false}
      FormComponent={UserForm}
      onAdd={(data) => addEntity('users', data)}
      onUpdate={handleUpdate}
      onDelete={handleDelete} />);


}