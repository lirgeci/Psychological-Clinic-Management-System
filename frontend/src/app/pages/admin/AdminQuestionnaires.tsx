import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { AdminCrudPage } from '../../components/ui/AdminCrudPage';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

const apiBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

const safeParseQuestions = (value: any) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeQuestionnaire = (record: Record<string, any>) => ({
  id: String(record.Id ?? record.id ?? ''),
  title: String(record.Title ?? record.title ?? ''),
  description: String(record.Description ?? record.description ?? ''),
  type: String(record.Type ?? record.type ?? 'Assessment'),
  questions: safeParseQuestions(record.QuestionsJson ?? record.questionsJson ?? record.questions),
  dateCreated: String(record.CreatedDate ?? record.createdDate ?? record.dateCreated ?? new Date().toISOString()).slice(0, 10),
});

const QuestionnaireForm = ({ initialData, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'Assessment',
    dateCreated: initialData?.dateCreated || new Date().toISOString().split('T')[0],
    questions: initialData?.questions || [],
  });

  useEffect(() => {
    setFormData({
      title: initialData?.title || '',
      description: initialData?.description || '',
      type: initialData?.type || 'Assessment',
      dateCreated: initialData?.dateCreated || new Date().toISOString().split('T')[0],
      questions: initialData?.questions || [],
    });
  }, [initialData]);

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          id: Math.random().toString(36).substr(2, 9),
          text: '',
          type: 'text',
          options: [],
        },
      ],
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      questions: newQuestions,
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({
      ...formData,
      questions: newQuestions,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      questionsJson: formData.questions,
      createdDate: formData.dateCreated,
    });
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
              title: e.target.value,
            })
          }
        />

        <Textarea
          label="Description"
          required
          rows={2}
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
            })
          }
        />

        <Select
          label="Type"
          required
          value={formData.type}
          onChange={(e) =>
            setFormData({
              ...formData,
              type: e.target.value,
            })
          }
          options={[
            { label: 'Assessment', value: 'Assessment' },
            { label: 'Intake', value: 'Intake' },
            { label: 'Feedback', value: 'Feedback' },
          ]}
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900">Questions</h3>
          <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
            <PlusIcon className="h-4 w-4 mr-2" /> Add Question
          </Button>
        </div>

        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
          {formData.questions.map((q: any, idx: number) => (
            <div key={q.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </button>

              <div className="space-y-3 mt-2">
                <Input
                  label={`Question ${idx + 1}`}
                  required
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                />

                <Select
                  label="Answer Type"
                  value={q.type}
                  onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                  options={[
                    { label: 'Text Input', value: 'text' },
                    { label: 'Multiple Choice (Radio)', value: 'radio' },
                    { label: 'Checkboxes', value: 'checkbox' },
                    { label: 'Scale (1-5 etc)', value: 'scale' },
                  ]}
                />

                {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'scale') && (
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
                    }
                  />
                )}
              </div>
            </div>
          ))}

          {formData.questions.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No questions added yet.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Questionnaire</Button>
      </div>
    </form>
  );
};

export function AdminQuestionnaires() {
  const { questionnaires, addEntity, updateEntity, deleteEntity } = useStore();
  const [apiQuestionnaires, setApiQuestionnaires] = useState<Array<Record<string, any>>>([]);

  const loadQuestionnaires = useCallback(async () => {
    if (!apiBaseUrl) {
      setApiQuestionnaires((questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/questionnaires/get-all?page=1&limit=1000`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setApiQuestionnaires([]);
          return;
        }

        throw new Error(result.message || 'Failed to fetch questionnaires.');
      }

      setApiQuestionnaires((result.questionnaires || []).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch questionnaires.';
      toast.error(message);
      setApiQuestionnaires((questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record)));
    }
  }, [questionnaires]);

  useEffect(() => {
    loadQuestionnaires();
  }, [loadQuestionnaires]);

  const questionnairesToShow = apiBaseUrl
    ? apiQuestionnaires
    : (questionnaires as any).map((record: Record<string, any>) => normalizeQuestionnaire(record));

  const columns = [
    {
      header: 'Title',
      accessor: 'title' as keyof (typeof questionnairesToShow)[0],
      sortable: true,
      sortKey: 'title',
    },
    {
      header: 'Type',
      accessor: 'type' as keyof (typeof questionnairesToShow)[0],
    },
    {
      header: 'Questions',
      accessor: (row: any) => (row.questions || []).length,
    },
    {
      header: 'Date Created',
      accessor: 'dateCreated' as keyof (typeof questionnairesToShow)[0],
      sortable: true,
      sortKey: 'dateCreated',
    },
  ];

  const createQuestionnaire = async (data: any) => {
    if (!apiBaseUrl) {
      addEntity('questionnaires', {
        ...data,
        questions: data.questionsJson,
      });
      return true;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/questionnaires/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          type: data.type,
          questionsJson: data.questionsJson,
          createdDate: data.createdDate,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create questionnaire.');
      }

      await loadQuestionnaires();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create questionnaire.';
      toast.error(message);
      return false;
    }
  };

  const updateQuestionnaire = async (id: string, data: any) => {
    if (!apiBaseUrl) {
      updateEntity('questionnaires', id, {
        ...data,
        questions: data.questionsJson,
      });
      return true;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/questionnaires/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          type: data.type,
          questionsJson: data.questionsJson,
          createdDate: data.createdDate,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update questionnaire.');
      }

      await loadQuestionnaires();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update questionnaire.';
      toast.error(message);
      return false;
    }
  };

  const deleteQuestionnaire = async (id: string) => {
    if (!apiBaseUrl) {
      deleteEntity('questionnaires', id);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/questionnaires/delete/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete questionnaire.');
      }

      await loadQuestionnaires();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete questionnaire.';
      toast.error(message);
    }
  };

  return (
    <AdminCrudPage
      title="Questionnaire Templates"
      data={questionnairesToShow as any}
      columns={columns as any}
      searchKey={'title' as any}
      FormComponent={QuestionnaireForm}
      onAdd={createQuestionnaire}
      onUpdate={updateQuestionnaire}
      onDelete={deleteQuestionnaire}
    />
  );
}