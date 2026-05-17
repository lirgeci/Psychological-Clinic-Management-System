import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { SearchIcon } from 'lucide-react';
import authFetch from '../../utils/authFetch';
import { toast } from 'sonner';

interface FeedbackItem {
  id: string;
  patientName: string;
  therapistName: string;
  sessionDate: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadFeedback = useCallback(async () => {
    if (!apiBaseUrl) {
      setFeedback([]);
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(`${apiBaseUrl}/feedback/get-all`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load feedback.');
      }

      const mappedFeedback: FeedbackItem[] = (result.feedback || []).map((item: Record<string, unknown>) => ({
        id: String(item.Id ?? item.id ?? ''),
        patientName: `${String(item.Patient?.FirstName ?? item.Patient?.firstName ?? '')} ${String(item.Patient?.LastName ?? item.Patient?.lastName ?? '')}`.trim() || '-',
        therapistName: `${String(item.Therapist?.FirstName ?? item.Therapist?.firstName ?? '')} ${String(item.Therapist?.LastName ?? item.Therapist?.lastName ?? '')}`.trim() || '-',
        sessionDate: String(item.Session?.SessionDate ?? item.Session?.sessionDate ?? ''),
        rating: Number(item.Rating ?? item.rating ?? 0),
        comment: String(item.Comment ?? item.comment ?? ''),
        createdAt: String(item.CreatedAt ?? item.createdAt ?? ''),
      }));

      setFeedback(mappedFeedback);
      setFilteredFeedback(mappedFeedback);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load feedback.';
      toast.error(message);
      setFeedback([]);
      setFilteredFeedback([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    const filtered = feedback.filter(
      (item) =>
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.therapistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.comment.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFeedback(filtered);
  }, [searchTerm, feedback]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Feedback</h1>
      </div>

      <Card>
        <div className="-m-6">
          <div className="border-b border-slate-200 bg-slate-50/50 p-4">
            <div className="relative max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <p className="p-4 text-sm text-slate-500">Loading feedback...</p>
          ) : filteredFeedback.length > 0 ? (
            <div className="space-y-3 p-4">
              {filteredFeedback.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.patientName} · {item.therapistName}
                      </h3>
                      <p className="text-sm text-slate-500">Session date: {item.sessionDate || '-'}</p>
                    </div>
                    <Badge variant={item.rating >= 4 ? 'success' : item.rating >= 3 ? 'warning' : 'error'}>
                      Rating {item.rating}/5
                    </Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {item.comment || 'No comment provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">
              {feedback.length === 0 ? 'No feedback found.' : 'No results match your search.'}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}