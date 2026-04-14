import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ClipboardListIcon } from 'lucide-react';
export function AdminQuestionnaireResponses() {
  const { questionnaireResponses, questionnaires, patients } = useStore();
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const enrichedResponses = questionnaireResponses.map((r) => {
    const q = questionnaires.find((q) => q.id === r.questionnaireId);
    const p = patients.find((p) => p.userId === r.patientId);
    return {
      ...r,
      patientName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
      questionnaireTitle: q?.title || 'Unknown',
      questionnaire: q
    };
  });
  const columns = [
  {
    header: 'Patient',
    accessor: 'patientName' as keyof (typeof enrichedResponses)[0],
    sortable: true,
    sortKey: 'patientName' as keyof (typeof enrichedResponses)[0]
  },
  {
    header: 'Questionnaire',
    accessor: 'questionnaireTitle' as keyof (typeof enrichedResponses)[0],
    sortable: true,
    sortKey: 'questionnaireTitle' as keyof (typeof enrichedResponses)[0]
  },
  {
    header: 'Total Score',
    accessor: (row: any) =>
    <span className="font-bold text-blue-600">
          {row.totalScore ?? 'N/A'}
        </span>

  },
  {
    header: 'Date Completed',
    accessor: 'dateCompleted' as keyof (typeof enrichedResponses)[0],
    sortable: true,
    sortKey: 'dateCompleted' as keyof (typeof enrichedResponses)[0]
  }];

  const actions = (row: any) =>
  <Button size="sm" variant="ghost" onClick={() => setSelectedResponse(row)}>
      View Response
    </Button>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ClipboardListIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Questionnaire Responses
        </h1>
      </div>

      {enrichedResponses.length > 0 ?
      <DataTable
        data={enrichedResponses}
        columns={columns}
        searchable
        searchKey="patientName"
        actions={actions} /> :


      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-12 text-center">
          <ClipboardListIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            No questionnaire responses submitted yet.
          </p>
        </div>
      }

      <Modal
        isOpen={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        title={`Response: ${selectedResponse?.questionnaireTitle}`}
        maxWidth="lg">
        
        {selectedResponse &&
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <p className="text-sm text-slate-500">Patient</p>
                <p className="font-medium text-slate-900">
                  {selectedResponse.patientName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Total Score</p>
                <p className="font-bold text-blue-600 text-xl">
                  {selectedResponse.totalScore ?? 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedResponse.questionnaire?.questions?.map(
              (q: any, idx: number) =>
              <div
                key={q.id}
                className="bg-slate-50 p-3 rounded border border-slate-100">
                
                    <p className="font-medium text-slate-800 text-sm mb-2">
                      {idx + 1}. {q.text}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {Array.isArray(selectedResponse.answers[q.id]) ?
                  selectedResponse.answers[q.id].join(', ') :
                  selectedResponse.answers[q.id] ||
                  'No answer provided'}
                    </p>
                  </div>

            )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button onClick={() => setSelectedResponse(null)}>Close</Button>
            </div>
          </div>
        }
      </Modal>
    </div>);

}