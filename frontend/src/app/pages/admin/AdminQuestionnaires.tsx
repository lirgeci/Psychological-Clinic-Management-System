import React, { useState, Component } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { PlusIcon, TrashIcon } from 'lucide-react';
const QuestionnaireForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '',
      description: '',
      type: 'Assessment',
      dateCreated: new Date().toISOString().split('T')[0],
      questions: []
    }
  );
  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
      ...formData.questions,
      {
        id: Math.random().toString(36).substr(2, 9),
        text: '',
        type: 'text',
        options: []
      }]

    });
  };
  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };
  const removeQuestion = (index: number) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Title"
          required
          value={formData.title}
          onChange={(e) =>
          setFormData({
            ...formData,
            title: e.target.value
          })
          } />
        
        <Textarea
          label="Description"
          required
          rows={2}
          value={formData.description}
          onChange={(e) =>
          setFormData({
            ...formData,
            description: e.target.value
          })
          } />
        
        <Select
          label="Type"
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
            label: 'Assessment',
            value: 'Assessment'
          },
          {
            label: 'Intake',
            value: 'Intake'
          },
          {
            label: 'Feedback',
            value: 'Feedback'
          }]
          } />
        
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900">Questions</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addQuestion}>
            
            <PlusIcon className="h-4 w-4 mr-2" /> Add Question
          </Button>
        </div>

        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
          {formData.questions.map((q: any, idx: number) =>
          <div
            key={q.id}
            className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
            
              <button
              type="button"
              onClick={() => removeQuestion(idx)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700">
              
                <TrashIcon className="h-4 w-4" />
              </button>
              <div className="space-y-3 mt-2">
                <Input
                label={`Question ${idx + 1}`}
                required
                value={q.text}
                onChange={(e) => updateQuestion(idx, 'text', e.target.value)} />
              
                <Select
                label="Answer Type"
                value={q.type}
                onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                options={[
                {
                  label: 'Text Input',
                  value: 'text'
                },
                {
                  label: 'Multiple Choice (Radio)',
                  value: 'radio'
                },
                {
                  label: 'Checkboxes',
                  value: 'checkbox'
                },
                {
                  label: 'Scale (1-5 etc)',
                  value: 'scale'
                }]
                } />
              
                {(q.type === 'radio' ||
              q.type === 'checkbox' ||
              q.type === 'scale') &&
              <Input
                label="Options (comma separated)"
                required
                value={q.options?.join(', ') || ''}
                onChange={(e) =>
                updateQuestion(
                  idx,
                  'options',
                  e.target.value.split(',').map((s: string) => s.trim())
                )
                } />

              }
              </div>
            </div>
          )}
          {formData.questions.length === 0 &&
          <p className="text-sm text-slate-500 text-center py-4">
              No questions added yet.
            </p>
          }
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Questionnaire</Button>
      </div>
    </form>);

};
export function AdminQuestionnaires() {
  const { questionnaires, addEntity, updateEntity, deleteEntity } = useStore();
  const columns = [
  {
    header: 'Title',
    accessor: 'title' as keyof (typeof questionnaires)[0],
    sortable: true,
    sortKey: 'title'
  },
  {
    header: 'Type',
    accessor: 'type' as keyof (typeof questionnaires)[0]
  },
  {
    header: 'Questions',
    accessor: (row: any) => row.questions.length
  },
  {
    header: 'Date Created',
    accessor: 'dateCreated' as keyof (typeof questionnaires)[0],
    sortable: true,
    sortKey: 'dateCreated'
  }];

  return (
    <AdminCrudPage
      title="Questionnaire Templates"
      data={questionnaires}
      columns={columns}
      searchKey="title"
      FormComponent={QuestionnaireForm}
      onAdd={(data) => addEntity('questionnaires', data)}
      onUpdate={(id, data) => updateEntity('questionnaires', id, data)}
      onDelete={(id) => deleteEntity('questionnaires', id)} />);


}