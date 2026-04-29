import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ApiTherapistOption {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function BookAppointment() {
  const { currentUser, therapists, addEntity } = useStore();
  const navigate = useNavigate();
  const [apiTherapists, setApiTherapists] = useState<ApiTherapistOption[]>([]);
  const [patientEntityId, setPatientEntityId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    therapistId: '',
    date: '',
    time: '',
    type: 'Individual'
  });

  useEffect(() => {
    const loadLookupData = async () => {
      if (!currentUser || !apiBaseUrl) {
        return;
      }

      try {
        const [patientsResponse, therapistsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/patients/get-all?page=1&limit=1000`),
          fetch(`${apiBaseUrl}/therapists/get-all?page=1&limit=1000`),
        ]);

        const [patientsResult, therapistsResult] = await Promise.all([
          patientsResponse.json(),
          therapistsResponse.json(),
        ]);

        if (patientsResponse.ok) {
          const matchedPatient = (patientsResult.patients || []).find((patient: Record<string, unknown>) =>
            String(patient.UserId ?? patient.userId ?? '') === String(currentUser.id)
          );

          if (matchedPatient) {
            setPatientEntityId(String(matchedPatient.Id ?? matchedPatient.id ?? ''));
          }
        }

        if (therapistsResponse.ok) {
          const mappedTherapists = (therapistsResult.therapists || []).map(
            (therapist: Record<string, unknown>) => ({
              id: String(therapist.Id ?? therapist.id ?? ''),
              userId: String(therapist.UserId ?? therapist.userId ?? ''),
              firstName: String(therapist.FirstName ?? therapist.firstName ?? ''),
              lastName: String(therapist.LastName ?? therapist.lastName ?? ''),
              specialization: String(therapist.Specialization ?? therapist.specialization ?? ''),
            })
          );

          setApiTherapists(mappedTherapists);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load booking data.';
        toast.error(message);
      }
    };

    loadLookupData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      return;
    }

    if (!formData.therapistId || !formData.date || !formData.time) {
      return;
    }

    setIsSubmitting(true);

    const appointmentPayload = {
      patientId: patientEntityId || currentUser.id,
      therapistId: formData.therapistId,
      date: formData.date,
      time: formData.time,
      durationMinutes: 60,
      type: formData.type,
      status: 'Pending'
    };

    try {
      if (!apiBaseUrl) {
        addEntity('appointments', {
          ...appointmentPayload,
          duration: 60,
        });
        navigate('/patient');
        return;
      }

      if (!patientEntityId) {
        throw new Error('Could not find patient profile for this account.');
      }

      const response = await fetch(`${apiBaseUrl}/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit appointment request.');
      }

      toast.success(result.message || 'Appointment request submitted successfully.');
      navigate('/patient');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit appointment request.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const therapistOptions = (
    apiTherapists.length > 0
      ? apiTherapists
      : therapists.map((therapist) => ({
          id: String(therapist.id ?? therapist.userId),
          userId: String(therapist.userId),
          firstName: String(therapist.firstName),
          lastName: String(therapist.lastName),
          specialization: String(therapist.specialization),
        }))
  ).map((therapist) => ({
    label: `Dr. ${therapist.firstName} ${therapist.lastName} - ${therapist.specialization}`,
    value: therapist.id
  }));

  const timeSlots = [];
  for (let i = 9; i <= 17; i++) {
    const hour = i.toString().padStart(2, '0');
    timeSlots.push({
      label: `${hour}:00`,
      value: `${hour}:00`
    });
    if (i !== 17)
      timeSlots.push({
        label: `${hour}:30`,
        value: `${hour}:30`
      });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Request Appointment
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Select Therapist"
            required
            value={formData.therapistId}
            onChange={(e) =>
              setFormData({
                ...formData,
                therapistId: e.target.value
              })
            }
            options={therapistOptions} />


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Date"
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={formData.date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value
                })
              } />


            <Select
              label="Time Slot"
              required
              value={formData.time}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  time: e.target.value
                })
              }
              options={timeSlots} />

          </div>

          <Select
            label="Session Type"
            required
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value
              })
            }
            options={[
              {
                label: 'Individual Therapy',
                value: 'Individual'
              },
              {
                label: 'Couples Therapy',
                value: 'Couple'
              },
              {
                label: 'Family Therapy',
                value: 'Family'
              }]
            } />


          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/patient')}>

              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>Submit Request</Button>
          </div>
        </form>
      </Card>
    </div>);

}