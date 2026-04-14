import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ClipboardListIcon } from 'lucide-react';
import { toast } from 'sonner';
export function PatientQuestionnaires() {
  const { currentUser, questionnaires, questionnaireResponses, addEntity } =
  useStore();
  const [selectedQ, setSelectedQ] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Filter out questionnaires the patient has already completed
  const completedQIds = questionnaireResponses.
  filter((r) => r.patientId === currentUser!.id).
  map((r) => r.questionnaireId);
  const pendingQs = questionnaires.filter((q) => !completedQIds.includes(q.id));
  const completedQs = questionnaires.filter((q) => completedQIds.includes(q.id));
  const handleOpen = (q: any) => {
    setSelectedQ(q);
    setAnswers({});
  };
  const handleSubmit = () => {
    // Basic validation
    const requiredQuestions = selectedQ.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions < requiredQuestions) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    // Calculate a mock score for scales
    let score = 0;
    selectedQ.questions.forEach((q: any) => {
      if (q.type === 'scale' && answers[q.id]) {
        score += q.options.indexOf(answers[q.id]);
      }
    });
    addEntity('questionnaireResponses', {
      patientId: currentUser!.id,
      questionnaireId: selectedQ.id,
      answers,
      totalScore: score,
      dateCompleted: new Date().toISOString().split('T')[0]
    });
    setSelectedQ(null);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <ClipboardListIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Questionnaires & Assessments
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Pending Questionnaires">
          {pendingQs.length > 0 ?
          <div className="space-y-4">
              {pendingQs.map((q) =>
            <div
              key={q.id}
              className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
              
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900">{q.title}</h3>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{q.description}</p>
                  <Button size="sm" onClick={() => handleOpen(q)}>
                    Start Assessment
                  </Button>
                </div>
            )}
            </div> :

          <div className="text-center py-8 text-slate-500">
              <ClipboardListIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No pending questionnaires.</p>
            </div>
          }
        </Card>

        <Card title="Completed Assessments">
          {completedQs.length > 0 ?
          <div className="space-y-4">
              {completedQs.map((q) => {
              const response = questionnaireResponses.find(
                (r) =>
                r.questionnaireId === q.id &&
                r.patientId === currentUser!.id
              );
              return (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {q.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Completed: {response?.dateCompleted}
                        </p>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                  </div>);

            })}
            </div> :

          <p className="text-center py-8 text-slate-500">
              No completed assessments yet.
            </p>
          }
        </Card>
      </div>

      {selectedQ &&
      <Modal
        isOpen={!!selectedQ}
        onClose={() => setSelectedQ(null)}
        title={selectedQ.title}
        maxWidth="2xl">
        
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
              {selectedQ.description}
            </div>

            <div className="space-y-8">
              {selectedQ.questions.map((q: any, index: number) =>
            <div key={q.id} className="space-y-3">
                  <p className="font-medium text-slate-900">
                    {index + 1}. {q.text}
                  </p>

                  {q.type === 'text' &&
              <textarea
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                rows={3}
                value={answers[q.id] || ''}
                onChange={(e) =>
                setAnswers({
                  ...answers,
                  [q.id]: e.target.value
                })
                }
                placeholder="Type your answer here..." />

              }

                  {(q.type === 'radio' || q.type === 'scale') && q.options &&
              <div className="space-y-2">
                      {q.options.map((opt: string, i: number) =>
                <label
                  key={i}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                  
                          <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() =>
                    setAnswers({
                      ...answers,
                      [q.id]: opt
                    })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                  
                          <span className="text-sm text-slate-700">{opt}</span>
                        </label>
                )}
                    </div>
              }

                  {q.type === 'checkbox' && q.options &&
              <div className="space-y-2">
                      {q.options.map((opt: string, i: number) => {
                  const isChecked = (answers[q.id] || []).includes(opt);
                  return (
                    <label
                      key={i}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                      
                            <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = answers[q.id] || [];
                          if (e.target.checked) {
                            setAnswers({
                              ...answers,
                              [q.id]: [...current, opt]
                            });
                          } else {
                            setAnswers({
                              ...answers,
                              [q.id]: current.filter(
                                (item: string) => item !== opt
                              )
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                      
                            <span className="text-sm text-slate-700">
                              {opt}
                            </span>
                          </label>);

                })}
                    </div>
              }
                </div>
            )}
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedQ(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Submit Answers</Button>
            </div>
          </div>
        </Modal>
      }
    </div>);

}