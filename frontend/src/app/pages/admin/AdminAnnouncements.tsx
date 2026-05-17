import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import authFetch from '../../utils/authFetch';

interface AnnouncementFormData {
  title: string;
  message: string;
  expiresAt: string;
}

interface AnnouncementFormProps {
  initialData?: Partial<AnnouncementFormData> & { id?: string };
  onSubmit: (data: AnnouncementFormData) => void | Promise<void>;
  onCancel: () => void;
}

interface ApiAnnouncement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  expiresAt: string | null;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const mapAnnouncementRecord = (record: Record<string, any>): ApiAnnouncement => ({
  id: String(record.Id ?? record.id ?? ''),
  title: String(record.Title ?? record.title ?? ''),
  message: String(record.Message ?? record.message ?? ''),
  createdAt: String(record.CreatedAt ?? record.createdAt ?? ''),
  expiresAt: record.ExpiresAt ? String(record.ExpiresAt) : record.expiresAt ? String(record.expiresAt) : null,
});

const mapAnnouncementList = (records: Record<string, any>[]) => records.map(mapAnnouncementRecord);

const AnnouncementForm = ({ initialData, onSubmit, onCancel }: AnnouncementFormProps) => {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: initialData?.title || '',
    message: initialData?.message || '',
    expiresAt: initialData?.expiresAt || '',
  });

  useEffect(() => {
    setFormData({
      title: initialData?.title || '',
      message: initialData?.message || '',
      expiresAt: initialData?.expiresAt || '',
    });
  }, [initialData]);

  useEffect(() => {
    const loadAnnouncementById = async () => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      try {
        const response = await authFetch(`${apiBaseUrl}/announcements/get-by-id/${initialData.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch announcement details.');
        }

        setFormData({
          title: String(result.Title ?? result.title ?? ''),
          message: String(result.Message ?? result.message ?? ''),
          expiresAt: result.ExpiresAt ? String(result.ExpiresAt).slice(0, 10) : result.expiresAt ? String(result.expiresAt).slice(0, 10) : '',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load announcement details.';
        toast.error(message);
      }
    };

    loadAnnouncementById();
  }, [initialData?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        required
        value={formData.title}
        onChange={(e) =>
          setFormData({
            ...formData,
            title: e.target.value,
          })
        }
      />

      <Textarea
        label="Message"
        required
        rows={6}
        value={formData.message}
        onChange={(e) =>
          setFormData({
            ...formData,
            message: e.target.value,
          })
        }
      />

      <Input
        label="Expires At"
        type="date"
        value={formData.expiresAt}
        onChange={(e) =>
          setFormData({
            ...formData,
            expiresAt: e.target.value,
          })
        }
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Announcement</Button>
      </div>
    </form>
  );
};

export function AdminAnnouncements() {
  const { addEntity } = useStore();
  const [apiAnnouncements, setApiAnnouncements] = useState<ApiAnnouncement[]>([]);

  const loadAnnouncements = useCallback(async () => {
    if (!apiBaseUrl) {
      return;
    }

    try {
      const response = await authFetch(`${apiBaseUrl}/announcements/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setApiAnnouncements([]);
          return;
        }

        throw new Error(result.message || 'Failed to fetch announcements.');
      }

      setApiAnnouncements(mapAnnouncementList(result.announcements || []));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch announcements.';
      toast.error(message);
      setApiAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleAdd = async (data: AnnouncementFormData) => {
    try {
      if (!apiBaseUrl) {
        addEntity('announcements', {
          title: data.title,
          message: data.message,
          expiresAt: data.expiresAt || null,
        });
        return true;
      }

      const response = await authFetch(`${apiBaseUrl}/announcements/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          message: data.message,
          expiresAt: data.expiresAt || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create announcement.');
      }

      await loadAnnouncements();
      toast.success(result.message || 'Announcement created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create announcement.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: AnnouncementFormData) => {
    try {
      if (!apiBaseUrl) {
        return true;
      }

      const response = await authFetch(`${apiBaseUrl}/announcements/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          message: data.message,
          expiresAt: data.expiresAt || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update announcement.');
      }

      await loadAnnouncements();
      toast.success(result.message || 'Announcement updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update announcement.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        return;
      }

      const response = await authFetch(`${apiBaseUrl}/announcements/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete announcement.');
      }

      await loadAnnouncements();
      toast.success(result.message || 'Announcement deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete announcement.';
      toast.error(message);
    }
  };

  const columns: Column<ApiAnnouncement>[] = [
    {
      header: 'Title',
      accessor: 'title',
      sortable: true,
      sortKey: 'title',
    },
    {
      header: 'Message',
      accessor: (row: ApiAnnouncement) => {
        const preview = row.message.substring(0, 50);
        return preview.length < row.message.length ? `${preview}...` : preview;
      },
    },
    {
      header: 'Created',
      accessor: (row: ApiAnnouncement) => {
        return new Date(row.createdAt).toLocaleDateString();
      },
    },
    {
      header: 'Expires',
      accessor: (row: ApiAnnouncement) => {
        return row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : 'No expiry';
      },
    },
  ];

  return (
    <AdminCrudPage
      title="Announcements"
      data={apiAnnouncements}
      columns={columns}
      searchKey="title"
      FormComponent={AnnouncementForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}