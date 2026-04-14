import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  UserIcon,
  CalendarIcon,
  TargetIcon,
  FileTextIcon,
  EditIcon } from
'lucide-react';
import { toast } from 'sonner';
export function PatientDashboard() {
  const {
    currentUser,
    patients,
    therapists,
    appointments,
    treatmentPlans,
    invoices,
    updateEntity
  } = useStore();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const patient = patients.find((p) => p.userId === currentUser?.id);
  const [editForm, setEditForm] = useState({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    phone: patient?.phone || '',
    address: patient?.address || '',
    emergencyContact: patient?.emergencyContact || ''
  });
  if (!patient) return <div>Loading...</div>;
  const myAppointments = appointments.
  filter(
    (a) => a.patientId === patient.userId && new Date(a.date) >= new Date()
  ).
  sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const myPlans = treatmentPlans.filter(
    (tp) => tp.patientId === patient.userId && tp.status === 'Active'
  );
  const myInvoices = invoices.filter(
    (i) => i.patientId === patient.userId && i.paymentStatus === 'Pending'
  );
  const handleSaveProfile = () => {
    updateEntity('patients', patient.id, {
      ...patient,
      ...editForm
    });
    updateEntity('users', currentUser!.id, {
      ...currentUser,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      phone: editForm.phone
    });
    setIsEditProfileOpen(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Patient Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card
          title="My Profile"
          action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditProfileOpen(true)}>
            
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          }>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <UserIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm text-slate-500">{patient.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span className="block text-slate-500">Phone</span>
                <span className="font-medium text-slate-900">
                  {patient.phone}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Date of Birth</span>
                <span className="font-medium text-slate-900">
                  {patient.dateOfBirth}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Gender</span>
                <span className="font-medium text-slate-900">
                  {patient.gender}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Emergency Contact</span>
                <span className="font-medium text-slate-900">
                  {patient.emergencyContact}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">Address</span>
                <span className="font-medium text-slate-900">
                  {patient.address}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card title="Upcoming Appointments">
          {myAppointments.length > 0 ?
          <div className="space-y-4">
              {myAppointments.map((apt) => {
              const therapist = therapists.find(
                (t) => t.userId === apt.therapistId
              );
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">
                          Dr. {therapist?.lastName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {apt.date} at {apt.time} ({apt.duration} min)
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {apt.type} Session
                        </p>
                      </div>
                    </div>
                    <Badge
                    variant={
                    apt.status === 'Confirmed' ? 'success' : 'warning'
                    }>
                    
                      {apt.status}
                    </Badge>
                  </div>);

            })}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No upcoming appointments.
            </p>
          }
        </Card>

        {/* Active Treatment Plans */}
        <Card title="Active Treatment Plans">
          {myPlans.length > 0 ?
          <div className="space-y-4">
              {myPlans.map((plan) =>
            <div
              key={plan.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              
                  <div className="flex items-start gap-3">
                    <TargetIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium text-slate-900">
                          {plan.name}
                        </p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Started: {plan.startDate}
                      </p>
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Objectives & Homework
                        </p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap bg-white p-3 rounded border border-slate-200">
                          {plan.objectives}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            )}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No active treatment plans.
            </p>
          }
        </Card>

        {/* Pending Invoices */}
        <Card title="Pending Invoices">
          {myInvoices.length > 0 ?
          <div className="space-y-4">
              {myInvoices.map((invoice) =>
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              
                  <div className="flex items-start gap-3">
                    <FileTextIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Invoice #{invoice.id.substring(0, 6).toUpperCase()}
                      </p>
                      <p className="text-sm text-slate-500">
                        Date: {invoice.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ${invoice.finalAmount.toFixed(2)}
                    </p>
                    <Badge variant="error" className="mt-1">
                      Pending
                    </Badge>
                  </div>
                </div>
            )}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No pending invoices.
            </p>
          }
        </Card>
      </div>

      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Profile">
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) =>
              setEditForm({
                ...editForm,
                firstName: e.target.value
              })
              } />
            
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) =>
              setEditForm({
                ...editForm,
                lastName: e.target.value
              })
              } />
            
          </div>
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) =>
            setEditForm({
              ...editForm,
              phone: e.target.value
            })
            } />
          
          <Input
            label="Address"
            value={editForm.address}
            onChange={(e) =>
            setEditForm({
              ...editForm,
              address: e.target.value
            })
            } />
          
          <Input
            label="Emergency Contact"
            value={editForm.emergencyContact}
            onChange={(e) =>
            setEditForm({
              ...editForm,
              emergencyContact: e.target.value
            })
            } />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsEditProfileOpen(false)}>
              
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>);

}