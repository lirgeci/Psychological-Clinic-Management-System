import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

interface RoomFormData {
  name: string;
  floor: string;
  type: string;
  capacity: string;
  equipment: string;
  status: string;
}

interface RoomFormProps {
  initialData?: Partial<RoomFormData> & { id?: string };
  onSubmit: (data: RoomFormData) => void | Promise<void>;
  onCancel: () => void;
}

interface ApiRoom {
  id: string;
  name: string;
  floor: string;
  type: string;
  capacity: string;
  equipment: string;
  status: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const mapRoomRecord = (record: Record<string, any>): ApiRoom => ({
  id: String(record.Id ?? record.id ?? ''),
  name: String(record.Name ?? record.name ?? ''),
  floor: String(record.Floor ?? record.floor ?? ''),
  type: String(record.Type ?? record.type ?? ''),
  capacity: String(record.Capacity ?? record.capacity ?? ''),
  equipment: String(record.Equipment ?? record.equipment ?? ''),
  status: String(record.Status ?? record.status ?? 'Available'),
});

const mapRoomList = (records: Record<string, any>[]) => records.map(mapRoomRecord);

const RoomForm = ({ initialData, onSubmit, onCancel }: RoomFormProps) => {
  const [formData, setFormData] = useState<RoomFormData>({
    name: initialData?.name || '',
    floor: initialData?.floor || '',
    type: initialData?.type || 'Therapy',
    capacity: initialData?.capacity || '2',
    equipment: initialData?.equipment || '',
    status: initialData?.status || 'Available',
  });

  useEffect(() => {
    setFormData({
      name: initialData?.name || '',
      floor: initialData?.floor || '',
      type: initialData?.type || 'Therapy',
      capacity: initialData?.capacity || '2',
      equipment: initialData?.equipment || '',
      status: initialData?.status || 'Available',
    });
  }, [initialData]);

  useEffect(() => {
    const loadRoomById = async () => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/rooms/get-by-id/${initialData.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch room details.');
        }

        setFormData({
          name: String(result.Name ?? result.name ?? ''),
          floor: String(result.Floor ?? result.floor ?? ''),
          type: String(result.Type ?? result.type ?? 'Therapy'),
          capacity: String(result.Capacity ?? result.capacity ?? '2'),
          equipment: String(result.Equipment ?? result.equipment ?? ''),
          status: String(result.Status ?? result.status ?? 'Available'),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load room details.';
        toast.error(message);
      }
    };

    loadRoomById();
  }, [initialData?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacity: String(Number(formData.capacity) || 0),
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
              name: e.target.value,
            })
          }
        />

        <Input
          label="Floor"
          required
          value={formData.floor}
          onChange={(e) =>
            setFormData({
              ...formData,
              floor: e.target.value,
            })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          required
          value={formData.type}
          onChange={(e) =>
            setFormData({
              ...formData,
              type: e.target.value,
            })
          }
          options={[
            { label: 'Therapy', value: 'Therapy' },
            { label: 'Group Therapy', value: 'Group Therapy' },
            { label: 'Assessment', value: 'Assessment' },
          ]}
        />

        <Input
          label="Capacity"
          type="number"
          required
          min="1"
          value={formData.capacity}
          onChange={(e) =>
            setFormData({
              ...formData,
              capacity: e.target.value,
            })
          }
        />
      </div>

      <Input
        label="Equipment (comma separated)"
        required
        value={formData.equipment}
        onChange={(e) =>
          setFormData({
            ...formData,
            equipment: e.target.value,
          })
        }
      />

      <Select
        label="Status"
        required
        value={formData.status}
        onChange={(e) =>
          setFormData({
            ...formData,
            status: e.target.value,
          })
        }
        options={[
          { label: 'Available', value: 'Available' },
          { label: 'Occupied', value: 'Occupied' },
          { label: 'Maintenance', value: 'Maintenance' },
        ]}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Room</Button>
      </div>
    </form>
  );
};

export function AdminRooms() {
  const { rooms, addEntity, updateEntity, deleteEntity } = useStore();
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>(() => mapRoomList(rooms));

  const loadRooms = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiRooms(mapRoomList(rooms));
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/rooms/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setApiRooms([]);
          return;
        }

        throw new Error(result.message || 'Failed to fetch rooms.');
      }

      setApiRooms(mapRoomList(result.rooms || []));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch rooms.';
      toast.error(message);
      setApiRooms(mapRoomList(rooms));
    }
  }, [rooms]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!apiBaseUrl) {
      setApiRooms(mapRoomList(rooms));
    }
  }, [apiBaseUrl, rooms]);

  const handleAdd = async (data: RoomFormData) => {
    try {
      if (!apiBaseUrl) {
        addEntity('rooms', {
          name: data.name,
          floor: data.floor,
          type: data.type,
          capacity: Number(data.capacity) || 0,
          equipment: data.equipment,
          status: data.status,
        });
        return true;
      }

      const response = await fetch(`${apiBaseUrl}/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          floor: data.floor,
          type: data.type,
          capacity: Number(data.capacity),
          equipment: data.equipment,
          status: data.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create room.');
      }

      await loadRooms();
      toast.success(result.message || 'Room created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create room.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: RoomFormData) => {
    try {
      if (!apiBaseUrl) {
        updateEntity('rooms', id, {
          name: data.name,
          floor: data.floor,
          type: data.type,
          capacity: Number(data.capacity) || 0,
          equipment: data.equipment,
          status: data.status,
        });
        return true;
      }

      const response = await fetch(`${apiBaseUrl}/rooms/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          floor: data.floor,
          type: data.type,
          capacity: Number(data.capacity),
          equipment: data.equipment,
          status: data.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update room.');
      }

      await loadRooms();
      toast.success(result.message || 'Room updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update room.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        deleteEntity('rooms', id);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/rooms/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete room.');
      }

      await loadRooms();
      toast.success(result.message || 'Room deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete room.';
      toast.error(message);
    }
  };

  const columns: Column<ApiRoom>[] = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Floor',
      accessor: 'floor',
    },
    {
      header: 'Type',
      accessor: 'type',
    },
    {
      header: 'Capacity',
      accessor: 'capacity',
    },
    {
      header: 'Status',
      accessor: (row: ApiRoom) => (
        <Badge
          variant={
            row.status === 'Available'
              ? 'success'
              : row.status === 'Occupied'
                ? 'warning'
                : 'error'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <AdminCrudPage
      title="Rooms"
      data={apiRooms}
      columns={columns}
      searchKey="name"
      FormComponent={RoomForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}