import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CalendarIcon } from 'lucide-react';
export function BookAppointment() {
  const { currentUser, therapists, addEntity } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    therapistId: '',
    date: '',
    time: '',
    type: 'Individual'
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.therapistId || !formData.date || !formData.time) {
      return;
    }
    const appointment = {
      patientId: currentUser!.id,
      therapistId: formData.therapistId,
      date: formData.date,
      time: formData.time,
      duration: 60,
      type: formData.type,
      status: 'Pending'
    };
    addEntity('appointments', appointment);
    navigate('/patient');
  };
  const therapistOptions = therapists.map((t) => ({
    label: `Dr. ${t.firstName} ${t.lastName} - ${t.specialization}`,
    value: t.userId
  }));
  // Generate time slots from 9 AM to 5 PM
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
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Card>
    </div>);

}