import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FileTextIcon } from 'lucide-react';
export function AdminSessionNotes() {
  const { sessionNotes, sessions, patients, therapists } = useStore();
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const enrichedNotes = sessionNotes.map((n) => {
    const s = sessions.find((s) => s.id === n.sessionId);
    const p = patients.find((p) => p.userId === n.patientId);
    const t = therapists.find((t) => t.userId === n.therapistId);
    return {
      ...n,
      sessionDate: s?.date || 'N/A',
      patientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
      therapistName: t ? `Dr. ${t.lastName}` : 'Unknown',
      progressSummary:
      n.progressNotes.length > 80 ?
      n.progressNotes.substring(0, 80) + '...' :
      n.progressNotes
    };
  });
  const columns = [
  {
    header: 'Session Date',
    accessor: 'sessionDate' as keyof (typeof enrichedNotes)[0],
    sortable: true,
    sortKey: 'sessionDate' as keyof (typeof enrichedNotes)[0]
  },
  {
    header: 'Therapist',
    accessor: 'therapistName' as keyof (typeof enrichedNotes)[0],
    sortable: true,
    sortKey: 'therapistName' as keyof (typeof enrichedNotes)[0]
  },
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedNotes)[0],
    sortable: true,
    sortKey: 'patientName' as keyof (typeof enrichedNotes)[0]
  },
  {
    header: 'Date',
    accessor: 'date' as keyof (typeof enrichedNotes)[0],
    sortable: true,
    sortKey: 'date' as keyof (typeof enrichedNotes)[0]
  },
  {
    header: 'Progress Summary',
    accessor: 'progressSummary' as keyof (typeof enrichedNotes)[0]
  }];

  const actions = (row: any) =>
  <Button size="sm" variant="ghost" onClick={() => setSelectedNote(row)}>
      View Full Notes
    </Button>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <FileTextIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Session Notes (Admin Only)
          </h1>
          <p className="text-sm text-slate-500">
            Confidential clinical notes — never visible to patients
          </p>
        </div>
      </div>

      {enrichedNotes.length > 0 ?
      <DataTable
        data={enrichedNotes}
        columns={columns}
        searchable
        searchKey="patientName"
        actions={actions} /> :


      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-12 text-center">
          <FileTextIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No session notes recorded yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Notes will appear here after therapists document their sessions.
          </p>
        </div>
      }

      <Modal
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={`Session Notes — ${selectedNote?.patientName}`}
        maxWidth="lg">
        
        {selectedNote &&
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Patient
                </p>
                <p className="font-medium text-slate-900">
                  {selectedNote.patientName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Therapist
                </p>
                <p className="font-medium text-slate-900">
                  {selectedNote.therapistName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Date
                </p>
                <p className="font-medium text-slate-900">
                  {selectedNote.date}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Clinical Observations
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">
                {selectedNote.clinicalObservations || 'Not provided'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Progress Notes
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">
                {selectedNote.progressNotes || 'Not provided'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Homework Assigned
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">
                {selectedNote.homeworkAssigned || 'Not provided'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Next Steps / Plan
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">
                {selectedNote.nextStepsPlan || 'Not provided'}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button onClick={() => setSelectedNote(null)}>Close</Button>
            </div>
          </div>
        }
      </Modal>
    </div>);

}