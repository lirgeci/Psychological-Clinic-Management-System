import React, { useState, Component } from 'react';
import { DataTable, Column } from './DataTable';
import { Button } from './Button';
import { Modal } from './Modal';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
interface AdminCrudPageProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  searchKey: keyof T;
  FormComponent: React.FC<{
    initialData?: T;
    onSubmit: (data: any) => void;
    onCancel: () => void;
  }>;
  onAdd: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}
export function AdminCrudPage<
  T extends {
    id: string;
  }>(
{
  title,
  data,
  columns,
  searchKey,
  FormComponent,
  onAdd,
  onUpdate,
  onDelete
}: AdminCrudPageProps<T>) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const handleCreate = () => {
    setSelectedItem(undefined);
    setIsFormOpen(true);
  };
  const handleEdit = (item: T) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteOpen(true);
  };
  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setIsDeleteOpen(false);
      setItemToDelete(null);
    }
  };
  const handleSubmit = (formData: any) => {
    if (selectedItem) {
      onUpdate(selectedItem.id, formData);
    } else {
      onAdd(formData);
    }
    setIsFormOpen(false);
  };
  const actions = (row: T) =>
  <div className="flex justify-end gap-2">
      <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
        <EditIcon className="h-4 w-4 text-blue-600" />
      </Button>
      <Button
      size="sm"
      variant="ghost"
      onClick={() => handleDeleteClick(row.id)}>
      
        <TrashIcon className="h-4 w-4 text-red-600" />
      </Button>
    </div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <Button onClick={handleCreate}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add New
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        searchable
        searchKey={searchKey}
        actions={actions} />
      

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
        selectedItem ?
        `Edit ${title.slice(0, -1)}` :
        `Create New ${title.slice(0, -1)}`
        }
        maxWidth="lg">
        
        <FormComponent
          initialData={selectedItem}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)} />
        
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Deletion"
        maxWidth="sm">
        
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete this record? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>);

}