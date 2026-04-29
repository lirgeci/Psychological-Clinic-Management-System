import { useState, createContext, useContext, ReactNode } from 'react';
import {
  Role,
  User,
  Patient,
  Therapist,
  Appointment,
  Session,
  SessionNote,
  Diagnosis,
  TreatmentPlan,
  Room,
  Invoice,
  Questionnaire,
  QuestionnaireResponse } from
'../types';
import * as mockData from './mockData';
import { toast } from 'sonner';
interface StoreState {
  currentUser: User | null;
  users: User[];
  patients: Patient[];
  therapists: Therapist[];
  appointments: Appointment[];
  sessions: Session[];
  sessionNotes: SessionNote[];
  diagnoses: Diagnosis[];
  treatmentPlans: TreatmentPlan[];
  rooms: Room[];
  invoices: Invoice[];
  questionnaires: Questionnaire[];
  questionnaireResponses: QuestionnaireResponse[];
}
interface StoreContextType extends StoreState {
  setCurrentUser: (user: User | null) => void;
  // Generic CRUD
  addEntity: <K extends keyof Omit<StoreState, 'currentUser'>>(
  entityType: K,
  item: any)
  => void;
  updateEntity: <K extends keyof Omit<StoreState, 'currentUser'>>(
  entityType: K,
  id: string,
  item: any)
  => void;
  deleteEntity: <K extends keyof Omit<StoreState, 'currentUser'>>(
  entityType: K,
  id: string)
  => void;
}
const StoreContext = createContext<StoreContextType | undefined>(undefined);

const getCookieValue = (name: string) => {
  const cookieEntry = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  return cookieEntry ? cookieEntry.substring(name.length + 1) : null;
};

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const getInitialCurrentUser = () => {
  const token = getCookieValue('token');

  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.roleId) {
    return null;
  }

  const role: Role =
    payload.roleId === 1 ? 'admin' : payload.roleId === 2 ? 'therapist' : 'patient';
  const matchingUser = mockData.mockUsers.find(
    (user) => String(user.id) === String(payload.userId)
  );

  if (matchingUser) {
    return matchingUser;
  }

  return {
    id: String(payload.userId ?? ''),
    email: '',
    role,
    firstName: '',
    lastName: '',
    phone: '',
  };
};

export function StoreProvider({ children }: {children: ReactNode;}) {
  const [state, setState] = useState<StoreState>(() => ({
    currentUser: getInitialCurrentUser(),
    users: mockData.mockUsers,
    patients: mockData.mockPatients,
    therapists: mockData.mockTherapists,
    appointments: mockData.mockAppointments,
    sessions: mockData.mockSessions,
    sessionNotes: [],
    diagnoses: mockData.mockDiagnoses,
    treatmentPlans: mockData.mockTreatmentPlans,
    rooms: mockData.mockRooms,
    invoices: mockData.mockInvoices,
    questionnaires: mockData.mockQuestionnaires,
    questionnaireResponses: []
  }));
  const setCurrentUser = (user: User | null) => {
    setState((prev) => ({
      ...prev,
      currentUser: user
    }));
  };
  const addEntity = <K extends keyof Omit<StoreState, 'currentUser'>,>(
  entityType: K,
  item: any) =>
  {
    const newItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    };
    setState((prev) => ({
      ...prev,
      [entityType]: [...prev[entityType], newItem]
    }));
    toast.success('Record created successfully');
  };
  const updateEntity = <K extends keyof Omit<StoreState, 'currentUser'>,>(
  entityType: K,
  id: string,
  item: any) =>
  {
    setState((prev) => ({
      ...prev,
      [entityType]: prev[entityType].map((existing: any) =>
      existing.id === id ?
      {
        ...existing,
        ...item
      } :
      existing
      )
    }));
    toast.success('Record updated successfully');
  };
  const deleteEntity = <K extends keyof Omit<StoreState, 'currentUser'>,>(
  entityType: K,
  id: string) =>
  {
    setState((prev) => ({
      ...prev,
      [entityType]: prev[entityType].filter(
        (existing: any) => existing.id !== id
      )
    }));
    toast.success('Record deleted successfully');
  };
  return (
    <StoreContext.Provider
      value={{
        ...state,
        setCurrentUser,
        addEntity,
        updateEntity,
        deleteEntity
      }}>
      
      {children}
    </StoreContext.Provider>);

}
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}