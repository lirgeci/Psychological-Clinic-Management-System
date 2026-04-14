import React from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { TargetIcon } from 'lucide-react';
export function AdminTreatmentPlans() {
  const { treatmentPlans, patients, therapists, diagnoses } = useStore();
  const enrichedPlans = treatmentPlans.map((tp) => {
    const p = patients.find((p) => p.userId === tp.patientId);
    const t = therapists.find((t) => t.userId === tp.therapistId);
    const d = diagnoses.find((d) => d.id === tp.diagnosisId);
    return {
      ...tp,
      patientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
      therapistName: t ? `Dr. ${t.lastName}` : 'Unknown',
      diagnosisName: d ? d.name : 'N/A'
    };
  });
  const columns = [
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedPlans)[0],
    sortable: true,
    sortKey: 'patientName' as keyof (typeof enrichedPlans)[0]
  },
  {
    header: 'Therapist',
    accessor: 'therapistName' as keyof (typeof enrichedPlans)[0],
    sortable: true,
    sortKey: 'therapistName' as keyof (typeof enrichedPlans)[0]
  },
  {
    header: 'Plan Name',
    accessor: 'name' as keyof (typeof enrichedPlans)[0],
    sortable: true,
    sortKey: 'name' as keyof (typeof enrichedPlans)[0]
  },
  {
    header: 'Diagnosis',
    accessor: 'diagnosisName' as keyof (typeof enrichedPlans)[0]
  },
  {
    header: 'Start Date',
    accessor: 'startDate' as keyof (typeof enrichedPlans)[0],
    sortable: true,
    sortKey: 'startDate' as keyof (typeof enrichedPlans)[0]
  },
  {
    header: 'End Date',
    accessor: 'endDate' as keyof (typeof enrichedPlans)[0]
  },
  {
    header: 'Status',
    accessor: (row: any) =>
    <Badge
      variant={
      row.status === 'Active' ?
      'success' :
      row.status === 'Completed' ?
      'default' :
      'warning'
      }>
      
          {row.status}
        </Badge>

  }];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <TargetIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          All Treatment Plans (Read-Only)
        </h1>
      </div>

      <DataTable
        data={enrichedPlans}
        columns={columns}
        searchable
        searchKey="patientName" />
      
    </div>);

}