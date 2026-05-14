import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

interface TreatmentPlanFormData {
  patientId: string;
  therapistId: string;
  diagnosisId: string;
  name: string;
  objectives: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface ApiTreatmentPlan {
  id: string;
  patientId: string;
  therapistId: string;
  diagnosisId: string;
  name: string;
  objectives: string;
  startDate: string;
  endDate: string;
  status: string;
  patientName: string;
  therapistName: string;
  diagnosisName: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const getDisplayName = (record: Record<string, any> | undefined, fallback = 'Unknown') => {
  if (!record) {
    return fallback;
  }

  const firstName = String(record.FirstName ?? record.firstName ?? '').trim();
  const lastName = String(record.LastName ?? record.lastName ?? '').trim();
  const name = `${firstName} ${lastName}`.trim();

  return name || fallback;
};

const mapTreatmentPlanRecord = (
  record: Record<string, any>,
  lookups: {
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
    diagnoses: Array<Record<string, any>>;
  }
): ApiTreatmentPlan => {
  const patientId = String(record.PatientId ?? record.patientId ?? '');
  const therapistId = String(record.TherapistId ?? record.therapistId ?? '');
  const diagnosisId = String(record.DiagnosisId ?? record.diagnosisId ?? '');

  const patientRecord =
    record.patient ??
    record.Patient ??
    lookups.patients.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === patientId);
  const therapistRecord =
    record.therapist ??
    record.Therapist ??
    lookups.therapists.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === therapistId);
  const diagnosisRecord =
    record.diagnosis ??
    record.Diagnosis ??
    lookups.diagnoses.find((item) => String(item.Id ?? item.id ?? '') === diagnosisId);

  return {
    id: String(record.Id ?? record.id ?? ''),
    patientId,
    therapistId,
    diagnosisId,
    name: String(record.Name ?? record.name ?? ''),
    objectives: String(record.Objectives ?? record.objectives ?? ''),
    startDate: String(record.StartDate ?? record.startDate ?? '').slice(0, 10),
    endDate: String(record.EndDate ?? record.endDate ?? '').slice(0, 10),
    status: String(record.Status ?? record.status ?? ''),
    patientName: getDisplayName(patientRecord),
    therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
    diagnosisName: String(diagnosisRecord?.Name ?? diagnosisRecord?.name ?? diagnosisRecord?.DiagnosisCode ?? diagnosisRecord?.diagnosisCode ?? 'N/A'),
  };
};

const mapTreatmentPlanList = (
  records: Array<Record<string, any>>,
  lookups: {
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
    diagnoses: Array<Record<string, any>>;
  }
) => records.map((record) => mapTreatmentPlanRecord(record, lookups));

const mapStoreTreatmentPlanList = (
  treatmentPlans: Array<Record<string, any>>,
  patients: Array<Record<string, any>>,
  therapists: Array<Record<string, any>>,
  diagnoses: Array<Record<string, any>>
) =>
  treatmentPlans.map((plan) => {
    const patientId = String(plan.patientId ?? plan.PatientId ?? '');
    const therapistId = String(plan.therapistId ?? plan.TherapistId ?? '');
    const diagnosisId = String(plan.diagnosisId ?? plan.DiagnosisId ?? '');
    const patientRecord = patients.find((item) => String(item.userId ?? item.id ?? item.Id ?? '') === patientId);
    const therapistRecord = therapists.find((item) => String(item.userId ?? item.id ?? item.Id ?? '') === therapistId);
    const diagnosisRecord = diagnoses.find((item) => String(item.id ?? item.Id ?? '') === diagnosisId);

    return {
      id: String(plan.id ?? plan.Id ?? ''),
      patientId,
      therapistId,
      diagnosisId,
      name: String(plan.name ?? plan.Name ?? ''),
      objectives: String(plan.objectives ?? plan.Objectives ?? ''),
      startDate: String(plan.startDate ?? plan.StartDate ?? '').slice(0, 10),
      endDate: String(plan.endDate ?? plan.EndDate ?? '').slice(0, 10),
      status: String(plan.status ?? plan.Status ?? ''),
      patientName: getDisplayName(patientRecord),
      therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
      diagnosisName: String(diagnosisRecord?.name ?? diagnosisRecord?.Name ?? diagnosisRecord?.code ?? diagnosisRecord?.DiagnosisCode ?? 'N/A'),
    };
  });

export function AdminTreatmentPlans() {
  const { treatmentPlans, patients, therapists, diagnoses, addEntity, updateEntity, deleteEntity } = useStore();
  const [apiTreatmentPlans, setApiTreatmentPlans] = useState<ApiTreatmentPlan[]>([]);
  const [apiPatients, setApiPatients] = useState<Array<Record<string, any>>>([]);
  const [apiTherapists, setApiTherapists] = useState<Array<Record<string, any>>>([]);
  const [apiDiagnoses, setApiDiagnoses] = useState<Array<Record<string, any>>>([]);

  const loadTreatmentPlans = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiTreatmentPlans(mapStoreTreatmentPlanList(treatmentPlans, patients, therapists, diagnoses));
      return;
    }

    try {
      const [plansResponse, patientsResponse, therapistsResponse, diagnosesResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/treatment-plans/get-all?page=1&limit=1000`),
        fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
        fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
        fetch(`${apiBaseUrl}/diagnoses/get-all?page=1&limit=1000`),
      ]);

      const plansResult = await plansResponse.json();
      const patientsResult = await patientsResponse.json();
      const therapistsResult = await therapistsResponse.json();
      const diagnosesResult = await diagnosesResponse.json();

      if (plansResponse.status === 404) {
        setApiTreatmentPlans([]);
        setApiPatients((patientsResult.patients || []).map((patient: Record<string, any>) => patient));
        setApiTherapists((therapistsResult.therapists || []).map((therapist: Record<string, any>) => therapist));
        setApiDiagnoses((diagnosesResult.diagnoses || []).map((diagnosis: Record<string, any>) => diagnosis));
        return;
      }

      if (!plansResponse.ok) {
        throw new Error(plansResult.message || 'Failed to fetch treatment plans.');
      }

      if (!patientsResponse.ok && patientsResponse.status !== 404) {
        throw new Error(patientsResult.message || 'Failed to fetch patients.');
      }

      if (!therapistsResponse.ok && therapistsResponse.status !== 404) {
        throw new Error(therapistsResult.message || 'Failed to fetch therapists.');
      }

      if (!diagnosesResponse.ok && diagnosesResponse.status !== 404) {
        throw new Error(diagnosesResult.message || 'Failed to fetch diagnoses.');
      }

      const apiPatientsList = (patientsResult.patients || []).map((patient: Record<string, any>) => patient);
      const apiTherapistsList = (therapistsResult.therapists || []).map((therapist: Record<string, any>) => therapist);
      const apiDiagnosesList = (diagnosesResult.diagnoses || []).map((diagnosis: Record<string, any>) => diagnosis);

      setApiPatients(apiPatientsList);
      setApiTherapists(apiTherapistsList);
      setApiDiagnoses(apiDiagnosesList);
      setApiTreatmentPlans(
        mapTreatmentPlanList(plansResult.treatmentPlans || [], {
          patients: apiPatientsList,
          therapists: apiTherapistsList,
          diagnoses: apiDiagnosesList,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch treatment plans.';
      toast.error(message);
      setApiTreatmentPlans(mapStoreTreatmentPlanList(treatmentPlans, patients, therapists, diagnoses));
      setApiPatients([]);
      setApiTherapists([]);
      setApiDiagnoses([]);
    }
  }, [diagnoses, patients, therapists, treatmentPlans]);

  useEffect(() => {
    loadTreatmentPlans();
  }, [loadTreatmentPlans]);

  const patientOptions = apiBaseUrl ? apiPatients : patients;
  const therapistOptions = apiBaseUrl ? apiTherapists : therapists;
  const diagnosisOptions = apiBaseUrl ? apiDiagnoses : diagnoses;

  const TreatmentPlanForm = ({ initialData, onSubmit, onCancel }: any) => {
    const isEditing = Boolean(initialData?.id);
    const [formData, setFormData] = useState<TreatmentPlanFormData>({
      patientId: initialData?.patientId || '',
      therapistId: initialData?.therapistId || '',
      diagnosisId: initialData?.diagnosisId || '',
      name: initialData?.name || '',
      objectives: initialData?.objectives || '',
      startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
      endDate: initialData?.endDate || '',
      status: initialData?.status || 'Active',
    });

    useEffect(() => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      const loadTreatmentPlanById = async () => {
        try {
          const response = await fetch(`${apiBaseUrl}/treatment-plans/get-by-id/${initialData.id}`);
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch treatment plan details.');
          }

          setFormData({
            patientId: String(result.PatientId ?? result.patientId ?? ''),
            therapistId: String(result.TherapistId ?? result.therapistId ?? ''),
            diagnosisId: String(result.DiagnosisId ?? result.diagnosisId ?? ''),
            name: String(result.Name ?? result.name ?? ''),
            objectives: String(result.Objectives ?? result.objectives ?? ''),
            startDate: String(result.StartDate ?? result.startDate ?? '').slice(0, 10),
            endDate: String(result.EndDate ?? result.endDate ?? '').slice(0, 10),
            status: String(result.Status ?? result.status ?? 'Active'),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load treatment plan details.';
          toast.error(message);
        }
      };

      loadTreatmentPlanById();
    }, [initialData?.id]);

    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Patient"
            required
            disabled={isEditing}
            value={formData.patientId}
            onChange={(event) => setFormData({ ...formData, patientId: event.target.value })}
            options={patientOptions.map((patient) => ({
              label: `${String(patient.firstName ?? patient.FirstName ?? '').trim()} ${String(patient.lastName ?? patient.LastName ?? '').trim()}`.trim(),
              value: String(patient.Id ?? patient.id ?? patient.userId ?? ''),
            }))}
          />

          <Select
            label="Therapist"
            required
            disabled={isEditing}
            value={formData.therapistId}
            onChange={(event) => setFormData({ ...formData, therapistId: event.target.value })}
            options={therapistOptions.map((therapist) => ({
              label: `Dr. ${String(therapist.lastName ?? therapist.LastName ?? '').trim()}`.trim(),
              value: String(therapist.Id ?? therapist.id ?? therapist.userId ?? ''),
            }))}
          />
        </div>

        <Select
          label="Diagnosis"
          required
          disabled={isEditing}
          value={formData.diagnosisId}
          onChange={(event) => setFormData({ ...formData, diagnosisId: event.target.value })}
          options={diagnosisOptions.map((diagnosis) => ({
            label: `${String(diagnosis.code ?? diagnosis.DiagnosisCode ?? '').trim()} - ${String(diagnosis.name ?? diagnosis.Name ?? '').trim()}`.trim(),
            value: String(diagnosis.id ?? diagnosis.Id ?? ''),
          }))}
        />

        <Input
          label="Plan Name"
          required
          value={formData.name}
          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
        />

        <Textarea
          label="Objectives"
          rows={4}
          value={formData.objectives}
          onChange={(event) => setFormData({ ...formData, objectives: event.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            required
            value={formData.startDate}
            onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
          />

          <Input
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(event) => setFormData({ ...formData, endDate: event.target.value })}
          />
        </div>

        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(event) => setFormData({ ...formData, status: event.target.value })}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Completed', value: 'Completed' },
            { label: 'On Hold', value: 'On Hold' },
          ]}
        />

        {isEditing && (
          <p className="text-xs text-slate-500">
            Patient, therapist, and diagnosis assignment stays fixed during edits.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Treatment Plan</Button>
        </div>
      </form>
    );
  };

  const columns: Column<ApiTreatmentPlan>[] = [
    {
      header: 'Patient',
      accessor: 'patientName',
      sortable: true,
      sortKey: 'patientName',
    },
    {
      header: 'Therapist',
      accessor: 'therapistName',
      sortable: true,
      sortKey: 'therapistName',
    },
    {
      header: 'Plan Name',
      accessor: 'name',
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Diagnosis',
      accessor: 'diagnosisName',
    },
    {
      header: 'Start Date',
      accessor: 'startDate',
      sortable: true,
      sortKey: 'startDate',
    },
    {
      header: 'End Date',
      accessor: 'endDate',
    },
    {
      header: 'Status',
      accessor: (row: ApiTreatmentPlan) => (
        <Badge
          variant={
            row.status === 'Active' ? 'success' : row.status === 'Completed' ? 'default' : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const handleAdd = async (data: TreatmentPlanFormData) => {
    try {
      if (!apiBaseUrl) {
        addEntity('treatmentPlans', {
          id: Math.random().toString(36).slice(2, 11),
          patientId: data.patientId,
          therapistId: data.therapistId,
          diagnosisId: data.diagnosisId,
          name: data.name,
          objectives: data.objectives,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        });
        await loadTreatmentPlans();
        return true;
      }

      const response = await fetch(`${apiBaseUrl}/treatment-plans/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          objectives: data.objectives,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          patientId: data.patientId,
          therapistId: data.therapistId,
          diagnosisId: data.diagnosisId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create treatment plan.');
      }

      await loadTreatmentPlans();
      toast.success(result.message || 'Treatment plan created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create treatment plan.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: TreatmentPlanFormData) => {
    try {
      if (!apiBaseUrl) {
        updateEntity('treatmentPlans', id, {
          patientId: data.patientId,
          therapistId: data.therapistId,
          diagnosisId: data.diagnosisId,
          name: data.name,
          objectives: data.objectives,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        });
        await loadTreatmentPlans();
        return true;
      }

      const response = await fetch(`${apiBaseUrl}/treatment-plans/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          objectives: data.objectives,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update treatment plan.');
      }

      await loadTreatmentPlans();
      toast.success(result.message || 'Treatment plan updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update treatment plan.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        deleteEntity('treatmentPlans', id);
        await loadTreatmentPlans();
        return;
      }

      const response = await fetch(`${apiBaseUrl}/treatment-plans/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete treatment plan.');
      }

      await loadTreatmentPlans();
      toast.success(result.message || 'Treatment plan deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete treatment plan.';
      toast.error(message);
    }
  };

  return (
    <AdminCrudPage
      title="Treatment Plan Management"
      data={apiTreatmentPlans}
      columns={columns}
      searchKey="patientName"
      showAddButton={false}
      FormComponent={TreatmentPlanForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}