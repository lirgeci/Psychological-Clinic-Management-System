import React from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { DollarSignIcon } from 'lucide-react';
export function PatientInvoices() {
  const { currentUser, invoices } = useStore();
  const myInvoices = invoices.filter((i) => i.patientId === currentUser!.id);
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