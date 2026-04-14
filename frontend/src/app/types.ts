export type Role = 'patient' | 'therapist' | 'admin';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Patient extends User {
  userId: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  address: string;
  emergencyContact: string;
  registrationDate: string;
}

export interface Therapist extends User {
  userId: string;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  hireDate: string;
  bio: string;
}

export type AppointmentStatus =
'Pending' |
'Confirmed' |
'Rejected' |
'Completed' |
'Cancelled';
export type AppointmentType = 'Individual' | 'Couple' | 'Family';

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: AppointmentType;
  status: AppointmentStatus;
  roomId?: string;
  cancellationReason?: string;
}

export type SessionStatus = 'In Progress' | 'Completed';

export interface Session {
  id: string;
  appointmentId: string;
  patientId: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: AppointmentType;
  status: SessionStatus;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  therapistId: string;
  patientId: string;
  clinicalObservations: string;
  progressNotes: string;
  homeworkAssigned: string;
  nextStepsPlan: string;
  date: string;
}

export type Severity = 'Mild' | 'Moderate' | 'Severe';

export interface Diagnosis {
  id: string;
  patientId: string;
  therapistId: string;
  code: string;
  name: string;
  description: string;
  severity: Severity;
  date: string;
}

export type PlanStatus = 'Active' | 'Completed' | 'On Hold';

export interface TreatmentPlan {
  id: string;
  patientId: string;
  therapistId: string;
  diagnosisId: string;
  name: string;
  objectives: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
}

export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface Room {
  id: string;
  name: string;
  floor: string;
  type: string;
  capacity: number;
  equipment: string;
  status: RoomStatus;
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  patientId: string;
  sessionId?: string;
  amount: number;
  discount: number;
  finalAmount: number;
  date: string;
  paymentStatus: PaymentStatus;
}

export type QuestionType = 'text' | 'radio' | 'checkbox' | 'scale';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  type: string;
  questions: Question[];
  dateCreated: string;
}

export interface QuestionnaireResponse {
  id: string;
  patientId: string;
  questionnaireId: string;
  answers: Record<string, any>;
  totalScore?: number;
  dateCompleted: string;
}