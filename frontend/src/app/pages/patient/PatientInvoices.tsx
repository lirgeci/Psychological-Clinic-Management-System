import { useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { DollarSignIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ApiPatient {
  Id?: string;
  id?: string;
  userId?: string;
  UserId?: string;
}

interface ApiInvoice {
  id: string;
  patientId: string;
  date: string;
  finalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Overdue';
}

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const mapInvoiceRecord = (record: Record<string, any>): ApiInvoice => ({
  id: String(record.Id ?? record.id ?? ''),
  patientId: String(record.PatientId ?? record.patientId ?? ''),
  date: String(record.InvoiceDate ?? record.invoiceDate ?? record.date ?? '').slice(0, 10),
  finalAmount: Number(record.FinalAmount ?? record.finalAmount ?? 0),
  paymentStatus: String(record.PaymentStatus ?? record.paymentStatus ?? 'Pending') as ApiInvoice['paymentStatus'],
});

export function PatientInvoices() {
  const { currentUser, patients, invoices } = useStore();
  const [apiInvoices, setApiInvoices] = useState<ApiInvoice[]>([]);
  const [patientEntityId, setPatientEntityId] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!currentUser || !apiBaseUrl) {
        setApiInvoices([]);
        return;
      }

      try {
        const [patientResponse, invoiceResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
          fetch(`${apiBaseUrl}/invoices/get-all?page=1&limit=1000`),
        ]);

        const patientResult = await patientResponse.json();
        const invoiceResult = await invoiceResponse.json();

        if (!patientResponse.ok && patientResponse.status !== 404) {
          throw new Error(patientResult.message || 'Failed to load patient data.');
        }

        if (!invoiceResponse.ok) {
          if (invoiceResponse.status === 404) {
            setApiInvoices([]);
            return;
          }

          throw new Error(invoiceResult.message || 'Failed to load invoices.');
        }

        const matchedPatient = (patientResult.patients || []).find((patient: Record<string, any>) =>
          String(patient.UserId ?? patient.userId ?? '') === String(currentUser.id)
        );

        const matchedPatientId = String(matchedPatient?.Id ?? matchedPatient?.id ?? '');
        setPatientEntityId(matchedPatientId || null);
        setApiInvoices((invoiceResult.invoices || []).map((record: Record<string, any>) => mapInvoiceRecord(record)));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load invoices.';
        toast.error(message);
        setApiInvoices([]);
        setPatientEntityId(null);
      }
    };

    loadInvoices();
  }, [currentUser]);

  const fallbackPatientId = patients.find((patient) => String(patient.userId) === String(currentUser?.id))?.userId;
  const activePatientId = patientEntityId || fallbackPatientId || String(currentUser?.id ?? '');

  const myInvoices = (apiBaseUrl ? apiInvoices : invoices.map((invoice) => ({
    id: String(invoice.id),
    patientId: String(invoice.patientId),
    date: String(invoice.date),
    finalAmount: Number(invoice.finalAmount),
    paymentStatus: invoice.paymentStatus,
  }))).filter((invoice) => String(invoice.patientId) === String(activePatientId));
  const columns = [
  {
    header: 'Invoice ID',
    accessor: (row: any) => `#${row.id.substring(0, 8).toUpperCase()}`
  },
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof myInvoices)[0],
    sortable: true,
    sortKey: 'date' as keyof (typeof myInvoices)[0]
  },
  {
    header: 'Amount',
    accessor: (row: any) => `$${row.finalAmount.toFixed(2)}`,
    sortable: true,
    sortKey: 'finalAmount' as keyof (typeof myInvoices)[0]
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
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <DollarSignIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">My Invoices</h1>
      </div>

      <DataTable
        data={myInvoices}
        columns={columns}
        searchable
        searchKey="date"
        emptyMessage="No invoices found." />
      
    </div>);

}