import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Column } from '../../components/ui/DataTable';
import { toast } from 'sonner';

interface ApiInvoice {
  id: string;
  patientId: string;
  sessionId?: string;
  amount: number;
  discount: number;
  finalAmount: number;
  date: string;
  paymentStatus: 'Pending' | 'Paid' | 'Overdue';
  patientName: string;
}

interface ApiPatient {
  Id?: string;
  id?: string;
  userId?: string;
  FirstName?: string;
  firstName?: string;
  LastName?: string;
  lastName?: string;
}

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const mapInvoiceRecord = (record: Record<string, any>, patients: ApiPatient[]): ApiInvoice => {
  const patientId = String(record.PatientId ?? record.patientId ?? '');
  const patientRecord = patients.find(
    (patient) => String(patient.Id ?? patient.id ?? patient.userId ?? '') === patientId
  );

  const firstName = String(patientRecord?.FirstName ?? patientRecord?.firstName ?? '').trim();
  const lastName = String(patientRecord?.LastName ?? patientRecord?.lastName ?? '').trim();

  return {
    id: String(record.Id ?? record.id ?? ''),
    patientId,
    sessionId: String(record.SessionId ?? record.sessionId ?? ''),
    amount: Number(record.Amount ?? record.amount ?? 0),
    discount: Number(record.Discount ?? record.discount ?? 0),
    finalAmount: Number(record.FinalAmount ?? record.finalAmount ?? 0),
    date: String(record.InvoiceDate ?? record.invoiceDate ?? record.date ?? '').slice(0, 10),
    paymentStatus: String(record.PaymentStatus ?? record.paymentStatus ?? 'Pending') as ApiInvoice['paymentStatus'],
    patientName: `${firstName} ${lastName}`.trim() || 'Unknown',
  };
};

const mapStoreInvoice = (record: Record<string, any>, patients: Array<Record<string, any>>): ApiInvoice => {
  const patientId = String(record.patientId ?? record.PatientId ?? '');
  const patientRecord = patients.find((patient) => String(patient.userId ?? patient.id ?? patient.Id ?? '') === patientId);
  const firstName = String(patientRecord?.firstName ?? patientRecord?.FirstName ?? '').trim();
  const lastName = String(patientRecord?.lastName ?? patientRecord?.LastName ?? '').trim();

  return {
    id: String(record.id ?? record.Id ?? ''),
    patientId,
    sessionId: String(record.sessionId ?? record.SessionId ?? ''),
    amount: Number(record.amount ?? record.Amount ?? 0),
    discount: Number(record.discount ?? record.Discount ?? 0),
    finalAmount: Number(record.finalAmount ?? record.FinalAmount ?? 0),
    date: String(record.date ?? record.InvoiceDate ?? '').slice(0, 10),
    paymentStatus: String(record.paymentStatus ?? record.PaymentStatus ?? 'Pending') as ApiInvoice['paymentStatus'],
    patientName: `${firstName} ${lastName}`.trim() || 'Unknown',
  };
};

const InvoiceForm = ({ initialData, onSubmit, onCancel }: any) => {
  const { patients } = useStore();
  const [apiPatients, setApiPatients] = useState<ApiPatient[]>([]);
  const [formData, setFormData] = useState(
    initialData || {
      patientId: '',
      amount: 120,
      discount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentStatus: 'Pending'
    }
  );

  useEffect(() => {
    if (!apiBaseUrl) {
      return;
    }

    const loadPatients = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`);
        const result = await response.json();

        if (!response.ok && response.status !== 404) {
          throw new Error(result.message || 'Failed to load patients.');
        }

        setApiPatients((result.patients || []).map((patient: ApiPatient) => patient));
      } catch {
        setApiPatients([]);
      }
    };

    loadPatients();
  }, []);

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
        options={(apiBaseUrl ? apiPatients : patients).map((p: any) => ({
          label: `${String(p.firstName ?? p.FirstName ?? '')} ${String(p.lastName ?? p.LastName ?? '')}`.trim(),
          value: String(p.id ?? p.Id ?? p.userId ?? '')
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
  const { invoices, patients, addEntity, updateEntity, deleteEntity } = useStore();
  const [apiInvoices, setApiInvoices] = useState<ApiInvoice[]>([]);

  const loadInvoices = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiInvoices(invoices.map((invoice) => mapStoreInvoice(invoice as any, patients as any)));
      return;
    }

    try {
      const [invoiceResponse, patientResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/invoices/get-all?page=1&limit=1000`),
        fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
      ]);

      const invoiceResult = await invoiceResponse.json();
      const patientResult = await patientResponse.json();

      if (!invoiceResponse.ok) {
        if (invoiceResponse.status === 404) {
          setApiInvoices([]);
          return;
        }

        throw new Error(invoiceResult.message || 'Failed to fetch invoices.');
      }

      if (!patientResponse.ok && patientResponse.status !== 404) {
        throw new Error(patientResult.message || 'Failed to fetch patients.');
      }

      const apiPatients = (patientResult.patients || []) as ApiPatient[];
      setApiInvoices((invoiceResult.invoices || []).map((record: Record<string, any>) => mapInvoiceRecord(record, apiPatients)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch invoices.';
      toast.error(message);
      setApiInvoices(invoices.map((invoice) => mapStoreInvoice(invoice as any, patients as any)));
    }
  }, [invoices, patients]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const enrichedInvoices = apiBaseUrl ? apiInvoices : invoices.map((inv) => mapStoreInvoice(inv as any, patients as any));
  const columns: Column<ApiInvoice>[] = [
  {
    header: 'ID',
    accessor: (row: any) => `#${row.id.substring(0, 6).toUpperCase()}`
  },
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedInvoices)[0],
    sortable: true,
    sortKey: 'patientName' as keyof ApiInvoice
  },
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof enrichedInvoices)[0],
    sortable: true,
    sortKey: 'date' as keyof ApiInvoice
  },
  {
    header: 'Final Amount',
    accessor: (row: any) => `$${row.finalAmount.toFixed(2)}`,
    sortable: true,
    sortKey: 'finalAmount' as keyof ApiInvoice
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
      showAddButton={!apiBaseUrl}
      onAdd={async (data) => {
        if (apiBaseUrl) {
          toast.error('Invoices are generated automatically from completed sessions.');
          return false;
        }

        addEntity('invoices', data);
        return true;
      }}
      onUpdate={async (id, data) => {
        if (apiBaseUrl) {
          const response = await fetch(`${apiBaseUrl}/invoices/update/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.message || 'Failed to update invoice.');
          }

          await loadInvoices();
          return true;
        }

        updateEntity('invoices', id, data);
        return true;
      }}
      onDelete={async (id) => {
        if (apiBaseUrl) {
          const response = await fetch(`${apiBaseUrl}/invoices/delete/${id}`, {
            method: 'DELETE',
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete invoice.');
          }

          await loadInvoices();
          return;
        }

        deleteEntity('invoices', id);
      }} />);


}