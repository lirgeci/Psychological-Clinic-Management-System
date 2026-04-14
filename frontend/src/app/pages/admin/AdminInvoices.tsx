import React, { useState, Component } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
const InvoiceForm = ({ initialData, onSubmit, onCancel }: any) => {
  const { patients } = useStore();
  const [formData, setFormData] = useState(
    initialData || {
      patientId: '',
      amount: 150,
      discount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentStatus: 'Pending'
    }
  );
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = Number(formData.amount) - Number(formData.discount);
    onSubmit({
      ...formData,
      amount: Number(formData.amount),
      discount: Number(formData.discount),
      finalAmount
    });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Patient"
        required
        value={formData.patientId}
        onChange={(e) =>
        setFormData({
          ...formData,
          patientId: e.target.value
        })
        }
        options={patients.map((p) => ({
          label: `${p.firstName} ${p.lastName}`,
          value: p.userId
        }))} />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Base Amount ($)"
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(e) =>
          setFormData({
            ...formData,
            amount: e.target.value
          })
          } />
        
        <Input
          label="Discount ($)"
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.discount}
          onChange={(e) =>
          setFormData({
            ...formData,
            discount: e.target.value
          })
          } />
        
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date Issued"
          type="date"
          required
          value={formData.date}
          onChange={(e) =>
          setFormData({
            ...formData,
            date: e.target.value
          })
          } />
        
        <Select
          label="Payment Status"
          required
          value={formData.paymentStatus}
          onChange={(e) =>
          setFormData({
            ...formData,
            paymentStatus: e.target.value
          })
          }
          options={[
          {
            label: 'Pending',
            value: 'Pending'
          },
          {
            label: 'Paid',
            value: 'Paid'
          },
          {
            label: 'Overdue',
            value: 'Overdue'
          }]
          } />
        
      </div>

      <div className="bg-slate-50 p-3 rounded text-right font-medium">
        Final Amount: $
        {(Number(formData.amount) - Number(formData.discount)).toFixed(2)}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Invoice</Button>
      </div>
    </form>);

};
export function AdminInvoices() {
  const { invoices, patients, addEntity, updateEntity, deleteEntity } =
  useStore();
  const enrichedInvoices = invoices.map((inv) => {
    const p = patients.find((p) => p.userId === inv.patientId);
    return {
      ...inv,
      patientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown'
    };
  });
  const columns = [
  {
    header: 'ID',
    accessor: (row: any) => `#${row.id.substring(0, 6).toUpperCase()}`
  },
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedInvoices)[0],
    sortable: true,
    sortKey: 'patientName'
  },
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof enrichedInvoices)[0],
    sortable: true,
    sortKey: 'date'
  },
  {
    header: 'Final Amount',
    accessor: (row: any) => `$${row.finalAmount.toFixed(2)}`,
    sortable: true,
    sortKey: 'finalAmount'
  },
  {
    header: 'Status',
    accessor: (row: any) =>
    <Badge
      variant={
      row.paymentStatus === 'Paid' ?
      'success' :
      row.paymentStatus === 'Overdue' ?
      'error' :
      'warning'
      }>
      
          {row.paymentStatus}
        </Badge>

  }];

  return (
    <AdminCrudPage
      title="Invoice Management"
      data={enrichedInvoices}
      columns={columns}
      searchKey="patientName"
      FormComponent={InvoiceForm}
      onAdd={(data) => addEntity('invoices', data)}
      onUpdate={(id, data) => updateEntity('invoices', id, data)}
      onDelete={(id) => deleteEntity('invoices', id)} />);


}