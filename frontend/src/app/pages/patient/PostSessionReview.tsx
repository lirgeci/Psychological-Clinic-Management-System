import React from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { FileTextIcon, ActivityIcon, TargetIcon } from 'lucide-react';
export function PostSessionReview() {
  const { currentUser, diagnoses, treatmentPlans } = useStore();
  const myDiagnoses = diagnoses.filter((d) => d.patientId === currentUser!.id);
  const myPlans = treatmentPlans.filter(
    (tp) => tp.patientId === currentUser!.id
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <FileTextIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Clinical Records & History
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Diagnoses */}
        <Card title="Clinical Diagnoses">
          {myDiagnoses.length > 0 ?
          <div className="space-y-4">
              {myDiagnoses.map((diag) =>
            <div
              key={diag.id}
              className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-slate-900">
                        {diag.name}{' '}
                        <span className="text-slate-500 font-normal text-sm">
                          ({diag.code})
                        </span>
                      </h3>
                    </div>
                    <Badge
                  variant={
                  diag.severity === 'Severe' ?
                  'error' :
                  diag.severity === 'Moderate' ?
                  'warning' :
                  'info'
                  }>
                  
                      {diag.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    {diag.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-3">
                    Diagnosed on: {diag.date}
                  </p>
                </div>
            )}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No diagnoses recorded.
            </p>
          }
        </Card>

        {/* Treatment Plans */}
        <Card title="Treatment Plans">
          {myPlans.length > 0 ?
          <div className="space-y-4">
              {myPlans.map((plan) =>
            <div
              key={plan.id}
              className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <TargetIcon className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-slate-900">
                        {plan.name}
                      </h3>
                    </div>
                    <Badge
                  variant={
                  plan.status === 'Active' ?
                  'success' :
                  plan.status === 'Completed' ?
                  'default' :
                  'warning'
                  }>
                  
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {plan.objectives}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>Start: {plan.startDate}</span>
                    <span>End: {plan.endDate}</span>
                  </div>
                </div>
            )}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No treatment plans found.
            </p>
          }
        </Card>
      </div>
    </div>);

}