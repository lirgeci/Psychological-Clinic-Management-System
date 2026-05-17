import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Column, DataTable } from '../../components/ui/DataTable';
import authFetch from '../../utils/authFetch';
import { toast } from 'sonner';

interface AbsenceRequestItem {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  createdAt: string;
  searchText: string;
}

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export function TherapistAbsenceRequests() {
  const [requests, setRequests] = useState<AbsenceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ fromDate: '', toDate: '', reason: '' });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_URL}/absence-requests/my-requests`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load your absence requests.');
      }

      const mappedRequests: AbsenceRequestItem[] = (result.absenceRequests || []).map((item: Record<string, unknown>) => {
        const fromDate = String(item.FromDate ?? item.fromDate ?? '');
        const toDate = String(item.ToDate ?? item.toDate ?? '');
        const reason = String(item.Reason ?? item.reason ?? '');

        return {
          id: String(item.Id ?? item.id ?? ''),
          fromDate,
          toDate,
          reason,
          status: String(item.Status ?? item.status ?? 'Pending'),
          createdAt: String(item.CreatedAt ?? item.createdAt ?? ''),
          searchText: `${fromDate} ${toDate} ${reason}`.trim(),
        };
      });

      setRequests(mappedRequests);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load your absence requests.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await authFetch(`${API_URL}/absence-requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create absence request.');
      }

      toast.success(result.message || 'Absence request created successfully.');
      setFormData({ fromDate: '', toDate: '', reason: '' });
      await loadRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create absence request.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<AbsenceRequestItem>[] = [
    {
      header: 'Period',
      accessor: (row: AbsenceRequestItem) => `${row.fromDate} to ${row.toDate}`,
    },
    {
      header: 'Reason',
      accessor: 'reason',
    },
    {
      header: 'Status',
      accessor: (row: AbsenceRequestItem) => (
        <Badge
          variant={row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'error' : 'warning'}
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Absence Requests</h1>

      <Card title="Submit New Request">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            label="From Date"
            type="date"
            required
            value={formData.fromDate}
            onChange={(event) => setFormData({ ...formData, fromDate: event.target.value })}
          />
          <Input
            label="To Date"
            type="date"
            required
            value={formData.toDate}
            onChange={(event) => setFormData({ ...formData, toDate: event.target.value })}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Reason"
              rows={4}
              required
              value={formData.reason}
              onChange={(event) => setFormData({ ...formData, reason: event.target.value })}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" isLoading={submitting}>Submit Request</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">My Requests</h2>
        {loading ? (
          <div className="w-full rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            Loading your requests...
          </div>
        ) : (
          <DataTable
            data={requests}
            columns={columns}
            searchable
            searchKey="searchText"
            emptyMessage={requests.length === 0 ? 'No absence requests found.' : 'No results match your search.'}
          />
        )}
      </div>
    </div>
  );
}