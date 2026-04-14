import {
  User,
  Patient,
  Therapist,
  Appointment,
  Room,
  Invoice,
  Questionnaire,
  TreatmentPlan,
  Diagnosis,
  Session } from
'../types';

export const mockUsers: User[] = [
{
  id: 'u1',
  email: 'admin@clinic.com',
  password: 'admin123',
  role: 'admin',
  firstName: 'System',
  lastName: 'Admin',
  phone: '555-0000'
},
{
  id: 'u2',
  email: 'therapist@clinic.com',
  password: 'therapist123',
  role: 'therapist',
  firstName: 'Sarah',
  lastName: 'Jenkins',
  phone: '555-0001'
},
{
  id: 'u3',
  email: 'patient@clinic.com',
  password: 'patient123',
  role: 'patient',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-0002'
}];


export const mockPatients: Patient[] = [
{
  ...mockUsers[2],
  userId: 'u3',
  dateOfBirth: '1990-05-15',
  gender: 'Male',
  address: '123 Main St, Cityville',
  emergencyContact: 'Jane Doe (555-0003)',
  registrationDate: '2023-01-10'
}];


export const mockTherapists: Therapist[] = [
{
  ...mockUsers[1],
  userId: 'u2',
  specialization: 'Cognitive Behavioral Therapy',
  licenseNumber: 'LIC-987654',
  qualifications: 'Ph.D. in Clinical Psychology',
  hireDate: '2020-06-01',
  bio: 'Dr. Jenkins specializes in anxiety and depression treatment using CBT methodologies.'
}];


export const mockRooms: Room[] = [
{
  id: 'r1',
  name: 'Room A',
  floor: '1',
  type: 'Therapy',
  capacity: 3,
  equipment: 'Couches, Whiteboard',
  status: 'Available'
},
{
  id: 'r2',
  name: 'Room B',
  floor: '1',
  type: 'Therapy',
  capacity: 2,
  equipment: 'Armchairs',
  status: 'Available'
},
{
  id: 'r3',
  name: 'Group Room',
  floor: '2',
  type: 'Group Therapy',
  capacity: 15,
  equipment: 'Circle Seating, Projector',
  status: 'Available'
}];


export const mockAppointments: Appointment[] = [
{
  id: 'a1',
  patientId: 'u3',
  therapistId: 'u2',
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  duration: 60,
  type: 'Individual',
  status: 'Confirmed',
  roomId: 'r1'
},
{
  id: 'a2',
  patientId: 'u3',
  therapistId: 'u2',
  date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  time: '14:00',
  duration: 60,
  type: 'Individual',
  status: 'Pending'
}];


export const mockSessions: Session[] = [];

export const mockDiagnoses: Diagnosis[] = [
{
  id: 'd1',
  patientId: 'u3',
  therapistId: 'u2',
  code: 'F41.1',
  name: 'Generalized Anxiety Disorder',
  description:
  'Excessive anxiety and worry occurring more days than not for at least 6 months.',
  severity: 'Moderate',
  date: '2023-02-15'
}];


export const mockTreatmentPlans: TreatmentPlan[] = [
{
  id: 'tp1',
  patientId: 'u3',
  therapistId: 'u2',
  diagnosisId: 'd1',
  name: 'Anxiety Management Plan',
  objectives:
  '1. Identify triggers\n2. Practice mindfulness\n3. Reduce panic attacks',
  startDate: '2023-02-20',
  endDate: '2023-08-20',
  status: 'Active'
}];


export const mockInvoices: Invoice[] = [
{
  id: 'i1',
  patientId: 'u3',
  amount: 150,
  discount: 0,
  finalAmount: 150,
  date: '2023-10-01',
  paymentStatus: 'Pending'
}];


export const mockQuestionnaires: Questionnaire[] = [
{
  id: 'q1',
  title: 'PHQ-9 Depression Scale',
  description:
  'Patient Health Questionnaire for assessing depression severity.',
  type: 'Assessment',
  dateCreated: '2023-01-01',
  questions: [
  {
    id: 'qq1',
    text: 'Little interest or pleasure in doing things',
    type: 'scale',
    options: [
    'Not at all',
    'Several days',
    'More than half the days',
    'Nearly every day']

  },
  {
    id: 'qq2',
    text: 'Feeling down, depressed, or hopeless',
    type: 'scale',
    options: [
    'Not at all',
    'Several days',
    'More than half the days',
    'Nearly every day']

  }]

}];