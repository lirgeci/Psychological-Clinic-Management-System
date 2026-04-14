import React from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ActivityIcon } from 'lucide-react';
export function AdminSessions() {
  const { sessions, patients, therapists } = useStore();
  const enrichedSessions = sessions.map((s) => {
    const p = patients.find((p) => p.userId === s.patientId);
    const t = therapists.find((t) => t.userId === s.therapistId);
    return {
      ...s,
      patientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
      therapistName: t ? `Dr. ${t.lastName}` : 'Unknown'
    };
  });
  const columns = [
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof enrichedSessions)[0],
    sortable: true,
    sortKey: 'date'
  },
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedSessions)[0],
    sortable: true,
    sortKey: 'patientName'
  },
  {
    header: 'Therapist',
    accessor: 'therapistName' as keyof (typeof enrichedSessions)[0],
    sortable: true,
    sortKey: 'therapistName'
  },
  {
    header: 'Time',
    accessor: (row: any) => `${row.startTime} - ${row.endTime || 'Ongoing'}`
  },
  {
    header: 'Type',
    accessor: 'type' as keyof (typeof enrichedSessions)[0]
  },
  {
    header: 'Status',
    accessor: (row: any) =>
    <Badge variant={row.status === 'Completed' ? 'success' : 'info'}>
          {row.status}
        </Badge>

  }];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          All Sessions (Read-Only)
        </h1>
      </div>

      <DataTable
        data={enrichedSessions}
        columns={columns}
        searchable
        searchKey="patientName" />
      
    </div>);

}