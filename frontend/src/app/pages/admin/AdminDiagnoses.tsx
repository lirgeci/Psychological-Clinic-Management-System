import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Column } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import authFetch from '../../utils/authFetch';

interface DiagnosisFormData {
  patientId: string;
  therapistId: string;
  diagnosisCode: string;
  name: string;
  description: string;
  severity: string;
  diagnosisDate: string;
}

interface ApiDiagnosis {
  id: string;
  patientId: string;
  therapistId: string;
  code: string;
  name: string;
  description: string;
  severity: string;
  date: string;
  patientName: string;
  therapistName: string;
}

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const getDisplayName = (record: Record<string, any> | undefined, fallback = 'Unknown') => {
  if (!record) {
    return fallback;
  }

  const firstName = String(record.FirstName ?? record.firstName ?? '').trim();
  const lastName = String(record.LastName ?? record.lastName ?? '').trim();
  const name = `${firstName} ${lastName}`.trim();

  return name || fallback;
};

const mapDiagnosisRecord = (
  record: Record<string, any>,
  lookups: {
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
  }
): ApiDiagnosis => {
  const patientId = String(record.PatientId ?? record.patientId ?? '');
  const therapistId = String(record.TherapistId ?? record.therapistId ?? '');

  const patientRecord =
    record.patient ??
    record.Patient ??
    lookups.patients.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === patientId);
  const therapistRecord =
    record.therapist ??
    record.Therapist ??
    lookups.therapists.find((item) => String(item.Id ?? item.id ?? item.userId ?? '') === therapistId);

  return {
    id: String(record.Id ?? record.id ?? ''),
    patientId,
    therapistId,
    code: String(record.DiagnosisCode ?? record.diagnosisCode ?? ''),
    name: String(record.Name ?? record.name ?? ''),
    description: String(record.Description ?? record.description ?? ''),
    severity: String(record.Severity ?? record.severity ?? ''),
    date: String(record.DiagnosisDate ?? record.diagnosisDate ?? '').slice(0, 10),
    patientName: getDisplayName(patientRecord),
    therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
  };
};

const mapDiagnosisList = (
  records: Array<Record<string, any>>,
  lookups: {
    patients: Array<Record<string, any>>;
    therapists: Array<Record<string, any>>;
  }
) => records.map((record) => mapDiagnosisRecord(record, lookups));

const mapStoreDiagnosisList = (
  diagnoses: Array<Record<string, any>>,
  patients: Array<Record<string, any>>,
  therapists: Array<Record<string, any>>
) =>
  diagnoses.map((diagnosis) => {
    const patientId = String(diagnosis.patientId ?? diagnosis.PatientId ?? '');
    const therapistId = String(diagnosis.therapistId ?? diagnosis.TherapistId ?? '');
    const patientRecord = patients.find(
      (item) => String(item.userId ?? item.id ?? item.Id ?? '') === patientId
    );
    const therapistRecord = therapists.find(
      (item) => String(item.userId ?? item.id ?? item.Id ?? '') === therapistId
    );

    return {
      id: String(diagnosis.id ?? diagnosis.Id ?? ''),
      patientId,
      therapistId,
      code: String(diagnosis.code ?? diagnosis.DiagnosisCode ?? ''),
      name: String(diagnosis.name ?? diagnosis.Name ?? ''),
      description: String(diagnosis.description ?? diagnosis.Description ?? ''),
      severity: String(diagnosis.severity ?? diagnosis.Severity ?? ''),
      date: String(diagnosis.date ?? diagnosis.DiagnosisDate ?? '').slice(0, 10),
      patientName: getDisplayName(patientRecord),
      therapistName: `Dr. ${getDisplayName(therapistRecord)}`,
    };
  });

export function AdminDiagnoses() {
  const { diagnoses, patients, therapists, addEntity, updateEntity, deleteEntity } = useStore();
  const [apiDiagnoses, setApiDiagnoses] = useState<ApiDiagnosis[]>([]);
  const [apiPatients, setApiPatients] = useState<Array<Record<string, any>>>([]);
  const [apiTherapists, setApiTherapists] = useState<Array<Record<string, any>>>([]);

  const loadDiagnoses = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiDiagnoses(mapStoreDiagnosisList(diagnoses, patients, therapists));
      return;
    }

    try {
      const [diagnosesResponse, patientsResponse, therapistsResponse] = await Promise.all([
        authFetch(`${apiBaseUrl}/diagnoses/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
        authFetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
      ]);

      const diagnosesResult = await diagnosesResponse.json();
      const patientsResult = await patientsResponse.json();
      const therapistsResult = await therapistsResponse.json();

      if (diagnosesResponse.status === 404) {
        setApiPatients(apiBaseUrl ? (patientsResult.patients || []) : []);
        setApiTherapists(apiBaseUrl ? (therapistsResult.therapists || []) : []);
        setApiDiagnoses([]);
        return;
      }

      if (!diagnosesResponse.ok) {
        throw new Error(diagnosesResult.message || 'Failed to fetch diagnoses.');
      }

      if (!patientsResponse.ok && patientsResponse.status !== 404) {
        throw new Error(patientsResult.message || 'Failed to fetch patients.');
      }

      if (!therapistsResponse.ok && therapistsResponse.status !== 404) {
        throw new Error(therapistsResult.message || 'Failed to fetch therapists.');
      }

      const apiPatientsList = (patientsResult.patients || []).map((patient: Record<string, any>) => patient);
      const apiTherapistsList = (therapistsResult.therapists || []).map((therapist: Record<string, any>) => therapist);

      setApiPatients(apiPatientsList);
      setApiTherapists(apiTherapistsList);
      setApiDiagnoses(
        mapDiagnosisList(diagnosesResult.diagnoses || [], {
          patients: apiPatientsList,
          therapists: apiTherapistsList,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch diagnoses.';
      toast.error(message);
      setApiDiagnoses(mapStoreDiagnosisList(diagnoses, patients, therapists));
      setApiPatients([]);
      setApiTherapists([]);
    }
  }, [diagnoses, patients, therapists]);

  useEffect(() => {
    loadDiagnoses();
  }, [loadDiagnoses]);

  const patientOptions = apiBaseUrl ? apiPatients : patients;
  const therapistOptions = apiBaseUrl ? apiTherapists : therapists;

  const DiagnosisForm = ({ initialData, onSubmit, onCancel }: any) => {
    const isEditing = Boolean(initialData?.id);
    const [formData, setFormData] = useState<DiagnosisFormData>({
      patientId: initialData?.patientId || '',
      therapistId: initialData?.therapistId || '',
      diagnosisCode: initialData?.diagnosisCode || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      severity: initialData?.severity || 'Moderate',
      diagnosisDate: initialData?.diagnosisDate || new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
      if (!initialData?.id || !apiBaseUrl) {
        return;
      }

      const loadDiagnosisById = async () => {
        try {
          const response = await authFetch(`${apiBaseUrl}/diagnoses/get-by-id/${initialData.id}`);
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch diagnosis details.');
          }

          setFormData({
            patientId: String(result.PatientId ?? result.patientId ?? ''),
            therapistId: String(result.TherapistId ?? result.therapistId ?? ''),
            diagnosisCode: String(result.DiagnosisCode ?? result.diagnosisCode ?? ''),
            name: String(result.Name ?? result.name ?? ''),
            description: String(result.Description ?? result.description ?? ''),
            severity: String(result.Severity ?? result.severity ?? 'Moderate'),
            diagnosisDate: String(result.DiagnosisDate ?? result.diagnosisDate ?? '').slice(0, 10),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load diagnosis details.';
          toast.error(message);
        }
      };

      loadDiagnosisById();
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
            onChange={(event) =>
              setFormData({
                ...formData,
                patientId: event.target.value,
              })
            }
            options={patientOptions.map((patient: any) => ({
              label: `${String(patient.firstName ?? patient.FirstName ?? '').trim()} ${String(patient.lastName ?? patient.LastName ?? '').trim()}`.trim(),
              value: String(patient.Id ?? patient.id ?? patient.userId ?? ''),
            }))}
          />

          <Select
            label="Therapist"
            required
            disabled={isEditing}
            value={formData.therapistId}
            onChange={(event) =>
              setFormData({
                ...formData,
                therapistId: event.target.value,
              })
            }
            options={therapistOptions.map((therapist: any) => ({
              label: `Dr. ${String(therapist.lastName ?? therapist.LastName ?? '').trim()}`.trim(),
              value: String(therapist.Id ?? therapist.id ?? therapist.userId ?? ''),
            }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Diagnosis Code"
            required
            value={formData.diagnosisCode}
            onChange={(event) =>
              setFormData({
                ...formData,
                diagnosisCode: event.target.value,
              })
            }
          />

          <Input
            label="Diagnosis Date"
            type="date"
            required
            value={formData.diagnosisDate}
            onChange={(event) =>
              setFormData({
                ...formData,
                diagnosisDate: event.target.value,
              })
            }
          />
        </div>

        <Input
          label="Condition"
          required
          value={formData.name}
          onChange={(event) =>
            setFormData({
              ...formData,
              name: event.target.value,
            })
          }
        />

        <Textarea
          label="Description"
          rows={4}
          value={formData.description}
          onChange={(event) =>
            setFormData({
              ...formData,
              description: event.target.value,
            })
          }
        />

        <Select
          label="Severity"
          required
          value={formData.severity}
          onChange={(event) =>
            setFormData({
              ...formData,
              severity: event.target.value,
            })
          }
          options={[
            { label: 'Mild', value: 'Mild' },
            { label: 'Moderate', value: 'Moderate' },
            { label: 'Severe', value: 'Severe' },
          ]}
        />

        {isEditing && (
          <p className="text-xs text-slate-500">
            Patient and therapist assignment stays fixed during edits.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Diagnosis</Button>
        </div>
      </form>
    );
  };

  const columns: Column<ApiDiagnosis>[] = [
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
      header: 'Code',
      accessor: 'code',
      sortable: true,
      sortKey: 'code',
    },
    {
      header: 'Condition',
      accessor: 'name',
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Severity',
      accessor: (row: ApiDiagnosis) => (
        <Badge
          variant={
            row.severity === 'Severe'
              ? 'error'
              : row.severity === 'Moderate'
                ? 'warning'
                : 'info'
          }
        >
          {row.severity}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      sortKey: 'date',
    },
  ];

  const handleAdd = async (data: DiagnosisFormData) => {
    try {
      if (!apiBaseUrl) {
        addEntity('diagnoses', {
          id: Math.random().toString(36).slice(2, 11),
          patientId: data.patientId,
          therapistId: data.therapistId,
          code: data.diagnosisCode,
          name: data.name,
          description: data.description,
          severity: data.severity,
          date: data.diagnosisDate,
        });
        await loadDiagnoses();
        return true;
      }

      const response = await authFetch(`${apiBaseUrl}/diagnoses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosisCode: data.diagnosisCode,
          name: data.name,
          description: data.description,
          diagnosisDate: data.diagnosisDate,
          severity: data.severity,
          patientId: data.patientId,
          therapistId: data.therapistId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create diagnosis.');
      }

      await loadDiagnoses();
      toast.success(result.message || 'Diagnosis created successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create diagnosis.';
      toast.error(message);
      return false;
    }
  };

  const handleUpdate = async (id: string, data: DiagnosisFormData) => {
    try {
      if (!apiBaseUrl) {
        updateEntity('diagnoses', id, {
          patientId: data.patientId,
          therapistId: data.therapistId,
          code: data.diagnosisCode,
          name: data.name,
          description: data.description,
          severity: data.severity,
          date: data.diagnosisDate,
        });
        await loadDiagnoses();
        return true;
      }

      const response = await authFetch(`${apiBaseUrl}/diagnoses/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosisCode: data.diagnosisCode,
          name: data.name,
          description: data.description,
          diagnosisDate: data.diagnosisDate,
          severity: data.severity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update diagnosis.');
      }

      await loadDiagnoses();
      toast.success(result.message || 'Diagnosis updated successfully.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update diagnosis.';
      toast.error(message);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!apiBaseUrl) {
        deleteEntity('diagnoses', id);
        await loadDiagnoses();
        return;
      }

      const response = await authFetch(`${apiBaseUrl}/diagnoses/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete diagnosis.');
      }

      await loadDiagnoses();
      toast.success(result.message || 'Diagnosis deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete diagnosis.';
      toast.error(message);
    }
  };

  return (
    <AdminCrudPage
      title="Diagnosis Management"
      data={apiDiagnoses}
      columns={columns}
      searchKey="patientName"
      showAddButton={false}
      FormComponent={DiagnosisForm}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}