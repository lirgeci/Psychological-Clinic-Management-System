import React from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { ClockIcon } from 'lucide-react';
export function PatientSessionHistory() {
  const { currentUser, sessions, therapists } = useStore();
  const mySessions = sessions.
  filter((s) => s.patientId === currentUser!.id && s.status === 'Completed').
  sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const enrichedSessions = mySessions.map((session) => {
    const therapist = therapists.find((t) => t.userId === session.therapistId);
    return {
      ...session,
      therapistName: therapist ? `Dr. ${therapist.lastName}` : 'Unknown'
    };
  });
  const columns = [
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof enrichedSessions)[0],
    sortable: true,
    sortKey: 'date' as keyof (typeof enrichedSessions)[0]
  },
  {
    header: 'Time',
    accessor: (row: any) => `${row.startTime} - ${row.endTime}`
  },
  {
    header: 'Therapist',
    accessor: 'therapistName' as keyof (typeof enrichedSessions)[0],
    sortable: true,
    sortKey: 'therapistName' as keyof (typeof enrichedSessions)[0]
  },
  {
    header: 'Type',
    accessor: 'type' as keyof (typeof enrichedSessions)[0]
  },
  {
    header: 'Status',
    accessor: (row: any) => <Badge variant="success">{row.status}</Badge>
  }];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ClockIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Session History</h1>
      </div>

      <DataTable
        data={enrichedSessions}
        columns={columns}
        searchable
        searchKey="therapistName"
        emptyMessage="No completed sessions yet." />
      
    </div>);

}