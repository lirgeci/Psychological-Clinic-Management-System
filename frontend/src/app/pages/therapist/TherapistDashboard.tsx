import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import {
  UserIcon,
  CalendarIcon,
  ClipboardListIcon,
  MapPinIcon,
  EditIcon } from
'lucide-react';
export function TherapistDashboard() {
  const {
    currentUser,
    therapists,
    patients,
    appointments,
    rooms,
    questionnaireResponses,
    questionnaires,
    updateEntity
  } = useStore();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const therapist = therapists.find((t) => t.userId === currentUser?.id);
  const [editForm, setEditForm] = useState({
    firstName: therapist?.firstName || '',
    lastName: therapist?.lastName || '',
    phone: therapist?.phone || '',
    specialization: therapist?.specialization || '',
    bio: therapist?.bio || ''
  });
  if (!therapist) return <div>Loading...</div>;
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.
  filter(
    (a) =>
    a.therapistId === therapist.userId &&
    a.date === today && (
    a.status === 'Confirmed' || a.status === 'Pending')
  ).
  sort((a, b) => a.time.localeCompare(b.time));
  // Get unique rooms for today's confirmed appointments
  const todaysRooms = Array.from(
    new Set(
      todaysAppointments.
      filter((a) => a.status === 'Confirmed' && a.roomId).
      map((a) => a.roomId)
    )
  ).
  map((roomId) => rooms.find((r) => r.id === roomId)).
  filter(Boolean);
  // Get recent questionnaire responses from patients assigned to this therapist
  // (Assuming patients assigned to this therapist are those who have an appointment with them)
  const myPatientIds = Array.from(
    new Set(
      appointments.
      filter((a) => a.therapistId === therapist.userId).
      map((a) => a.patientId)
    )
  );
  const recentResponses = questionnaireResponses.
  filter((qr) => myPatientIds.includes(qr.patientId)).
  sort(
    (a, b) =>
    new Date(b.dateCompleted).getTime() -
    new Date(a.dateCompleted).getTime()
  ).
  slice(0, 5);
  const handleSaveProfile = () => {
    updateEntity('therapists', therapist.id, {
      ...therapist,
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
        <h1 className="text-2xl font-bold text-slate-900">
          Therapist Dashboard
        </h1>
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
                  Dr. {therapist.firstName} {therapist.lastName}
                </h3>
                <p className="text-sm text-slate-500">
                  {therapist.specialization}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span className="block text-slate-500">Email</span>
                <span className="font-medium text-slate-900">
                  {therapist.email}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Phone</span>
                <span className="font-medium text-slate-900">
                  {therapist.phone}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">License Number</span>
                <span className="font-medium text-slate-900">
                  {therapist.licenseNumber}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Hire Date</span>
                <span className="font-medium text-slate-900">
                  {therapist.hireDate}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">Qualifications</span>
                <span className="font-medium text-slate-900">
                  {therapist.qualifications}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">Bio</span>
                <span className="font-medium text-slate-900">
                  {therapist.bio}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card title="Today's Schedule">
          {todaysAppointments.length > 0 ?
          <div className="space-y-4">
              {todaysAppointments.map((apt) => {
              const patient = patients.find((p) => p.userId === apt.patientId);
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-300 transition-colors">
                  
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {apt.time} ({apt.duration} min) - {apt.type}
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
              No appointments scheduled for today.
            </p>
          }
        </Card>

        {/* Assigned Rooms */}
        <Card title="Assigned Rooms (Today)">
          {todaysRooms.length > 0 ?
          <div className="space-y-4">
              {todaysRooms.map(
              (room) =>
              room &&
              <div
                key={room.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {room.name} (Floor {room.floor})
                          </p>
                          <p className="text-sm text-slate-500">
                            {room.type} - Capacity: {room.capacity}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Equipment: {room.equipment}
                          </p>
                        </div>
                      </div>
                    </div>

            )}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No rooms assigned for today.
            </p>
          }
        </Card>

        {/* Patient Questionnaire Results */}
        <Card title="Recent Questionnaire Results">
          {recentResponses.length > 0 ?
          <div className="space-y-4">
              {recentResponses.map((response) => {
              const patient = patients.find(
                (p) => p.userId === response.patientId
              );
              const questionnaire = questionnaires.find(
                (q) => q.id === response.questionnaireId
              );
              return (
                <div
                  key={response.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() =>
                  setSelectedResponse({
                    response,
                    patient,
                    questionnaire
                  })
                  }>
                  
                    <div className="flex items-start gap-3">
                      <ClipboardListIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {questionnaire?.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Completed: {response.dateCompleted}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-slate-500">
                        Score
                      </span>
                      <span className="font-bold text-slate-900 text-lg">
                        {response.totalScore}
                      </span>
                    </div>
                  </div>);

            })}
            </div> :

          <p className="text-slate-500 text-center py-4">
              No recent questionnaire responses.
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
            label="Specialization"
            value={editForm.specialization}
            onChange={(e) =>
            setEditForm({
              ...editForm,
              specialization: e.target.value
            })
            } />
          
          <Textarea
            label="Bio"
            rows={4}
            value={editForm.bio}
            onChange={(e) =>
            setEditForm({
              ...editForm,
              bio: e.target.value
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

      {selectedResponse &&
      <Modal
        isOpen={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        title={`Response: ${selectedResponse.questionnaire?.title}`}
        maxWidth="lg">
        
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm text-slate-500">Patient</p>
                <p className="font-medium text-slate-900">
                  {selectedResponse.patient?.firstName}{' '}
                  {selectedResponse.patient?.lastName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Score</p>
                <p className="font-bold text-blue-600 text-xl">
                  {selectedResponse.response.totalScore}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {selectedResponse.questionnaire?.questions.map(
              (q: any, idx: number) =>
              <div
                key={q.id}
                className="bg-slate-50 p-3 rounded border border-slate-100">
                
                    <p className="font-medium text-slate-800 text-sm mb-2">
                      {idx + 1}. {q.text}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {Array.isArray(selectedResponse.response.answers[q.id]) ?
                  selectedResponse.response.answers[q.id].join(', ') :
                  selectedResponse.response.answers[q.id] ||
                  'No answer provided'}
                    </p>
                  </div>

            )}
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setSelectedResponse(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      }
    </div>);

}