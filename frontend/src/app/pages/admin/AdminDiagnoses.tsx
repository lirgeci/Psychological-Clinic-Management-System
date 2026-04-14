import React from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { FileTextIcon } from 'lucide-react';
export function AdminDiagnoses() {
  const { diagnoses, patients, therapists } = useStore();
  const enrichedDiagnoses = diagnoses.map((d) => {
    const p = patients.find((p) => p.userId === d.patientId);
    const t = therapists.find((t) => t.userId === d.therapistId);
    return {
      ...d,
      patientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
      therapistName: t ? `Dr. ${t.lastName}` : 'Unknown'
    };
  });
  const columns = [
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedDiagnoses)[0],
    sortable: true,
    sortKey: 'patientName' as keyof (typeof enrichedDiagnoses)[0]
  },
  {
    header: 'Therapist',
    accessor: 'therapistName' as keyof (typeof enrichedDiagnoses)[0],
    sortable: true,
    sortKey: 'therapistName' as keyof (typeof enrichedDiagnoses)[0]
  },
  {
    header: 'Code',
    accessor: 'code' as keyof (typeof enrichedDiagnoses)[0],
    sortable: true,
    sortKey: 'code' as keyof (typeof enrichedDiagnoses)[0]
  },
  {
    header: 'Condition',
    accessor: 'name' as keyof (typeof enrichedDiagnoses)[0],
    sortable: true,
    sortKey: 'name' as keyof (typeof enrichedDiagnoses)[0]
  },
  {
    header: 'Severity',
    accessor: (row: any) =>
    <Badge
      variant={
      row.severity === 'Severe' ?
      'error' :
      row.severity === 'Moderate' ?
      'warning' :
      'info'
      }>
      
          {row.severity}
        </Badge>

  },
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof enrichedDiagnoses)[0],
    sortable: true,
    sortKey: 'date' as keyof (typeof enrichedDiagnoses)[0]
  }];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <FileTextIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          All Diagnoses (Read-Only)
        </h1>
      </div>

      <DataTable
        data={enrichedDiagnoses}
        columns={columns}
        searchable
        searchKey="patientName" />
      
    </div>);

}