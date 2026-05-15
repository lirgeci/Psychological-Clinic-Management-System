import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { FileTextIcon, ActivityIcon, TargetIcon } from 'lucide-react';
import { toast } from 'sonner';
import authFetch from '../../utils/authFetch';

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function PostSessionReview() {
  const { currentUser, diagnoses, treatmentPlans } = useStore();
  const [apiPatientId, setApiPatientId] = useState<string | null>(null);
  const [apiDiagnoses, setApiDiagnoses] = useState<Array<Record<string, unknown>>>([]);
  const [apiTreatmentPlans, setApiTreatmentPlans] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const loadClinicalData = async () => {
      if (!apiBaseUrl || !currentUser) {
        return;
      }

      try {
        const patientsResponse = await authFetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`);
        const patientsResult = await patientsResponse.json();

        if (!patientsResponse.ok && patientsResponse.status !== 404) {
          throw new Error(patientsResult.message || 'Failed to load patient profile.');
        }

        const patient = (patientsResult.patients || []).find(
          (item: Record<string, unknown>) => String(item.UserId ?? item.userId ?? '') === String(currentUser.id)
        );

        if (!patient) {
          setApiPatientId(null);
          setApiDiagnoses([]);
          setApiTreatmentPlans([]);
          return;
        }

        const patientId = String(patient.Id ?? patient.id ?? '');
        setApiPatientId(patientId);

        const [diagnosesResponse, plansResponse] = await Promise.all([
          authFetch(`${apiBaseUrl}/diagnoses/get-all?page=1&limit=1000`),
          authFetch(`${apiBaseUrl}/treatment-plans/get-all?page=1&limit=1000`),
        ]);

        const diagnosesResult = await diagnosesResponse.json();
        const plansResult = await plansResponse.json();

        if (!diagnosesResponse.ok && diagnosesResponse.status !== 404) {
          throw new Error(diagnosesResult.message || 'Failed to load diagnoses.');
        }

        if (!plansResponse.ok && plansResponse.status !== 404) {
          throw new Error(plansResult.message || 'Failed to load treatment plans.');
        }

        setApiDiagnoses(diagnosesResult.diagnoses || []);
        setApiTreatmentPlans(plansResult.treatmentPlans || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load clinical records.';
        toast.error(message);
      }
    };

    loadClinicalData();
  }, [currentUser]);

  const myDiagnoses = useMemo(() => {
    if (apiBaseUrl && apiPatientId) {
      return apiDiagnoses.filter(
        (d) => String(d.PatientId ?? d.patientId ?? '') === apiPatientId
      );
    }

    return diagnoses.filter((d) => d.patientId === currentUser?.id);
  }, [apiDiagnoses, apiPatientId, currentUser, diagnoses]);

  const myPlans = useMemo(() => {
    if (apiBaseUrl && apiPatientId) {
      return apiTreatmentPlans.filter(
        (tp) => String(tp.PatientId ?? tp.patientId ?? '') === apiPatientId
      );
    }

    return treatmentPlans.filter((tp) => tp.patientId === currentUser?.id);
  }, [apiPatientId, apiTreatmentPlans, currentUser, treatmentPlans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <FileTextIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Clinical Records & History</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="Clinical Diagnoses">
          {myDiagnoses.length > 0 ? (
            <div className="space-y-4">
              {myDiagnoses.map((diag: any) => (
                <div
                  key={String(diag.id ?? diag.Id)}
                  className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-slate-900">
                        {String(diag.name ?? diag.Name)}{' '}
                        <span className="text-slate-500 font-normal text-sm">
                          ({String(diag.code ?? diag.DiagnosisCode ?? '')})
                        </span>
                      </h3>
                    </div>
                    <Badge
                      variant={
                        String(diag.severity ?? diag.Severity) === 'Severe'
                          ? 'error'
                          : String(diag.severity ?? diag.Severity) === 'Moderate'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {String(diag.severity ?? diag.Severity)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    {String(diag.description ?? diag.Description ?? '')}
                  </p>
                  <p className="text-xs text-slate-400 mt-3">
                    Diagnosed on: {String(diag.date ?? diag.DiagnosisDate ?? '').slice(0, 10)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No diagnoses recorded.</p>
          )}
        </Card>

        <Card title="Treatment Plans">
          {myPlans.length > 0 ? (
            <div className="space-y-4">
              {myPlans.map((plan: any) => (
                <div
                  key={String(plan.id ?? plan.Id)}
                  className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <TargetIcon className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-slate-900">{String(plan.name ?? plan.Name)}</h3>
                    </div>
                    <Badge
                      variant={
                        String(plan.status ?? plan.Status) === 'Active'
                          ? 'success'
                          : String(plan.status ?? plan.Status) === 'Completed'
                          ? 'default'
                          : 'warning'
                      }
                    >
                      {String(plan.status ?? plan.Status)}
                    </Badge>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                    {String(plan.objectives ?? plan.Objectives ?? '')}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>Start: {String(plan.startDate ?? plan.StartDate ?? '').slice(0, 10)}</span>
                    <span>End: {String(plan.endDate ?? plan.EndDate ?? '').slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No treatment plans found.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
