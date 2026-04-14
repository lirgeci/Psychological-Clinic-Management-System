import React, { useState, createContext, useContext, ReactNode } from 'react';
import {
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
export function StoreProvider({ children }: {children: ReactNode;}) {
  const [state, setState] = useState<StoreState>({
    currentUser: null,
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
  });
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