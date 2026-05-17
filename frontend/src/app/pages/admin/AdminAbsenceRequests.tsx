import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Column, DataTable } from '../../components/ui/DataTable';
import authFetch from '../../utils/authFetch';
import { toast } from 'sonner';

interface AbsenceRequestItem {
  id: string;
  therapistName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  createdAt: string;
  searchText: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

export function AdminAbsenceRequests() {
  const [requests, setRequests] = useState<AbsenceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!apiBaseUrl) {
      setRequests([]);
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(`${apiBaseUrl}/absence-requests/get-all`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to load absence requests.');
      }

      const mappedRequests: AbsenceRequestItem[] = (result.absenceRequests || []).map((item: Record<string, unknown>) => {
        const therapist = item['Therapist'] as Record<string, unknown> | undefined;
        const firstName = String(therapist?.['FirstName'] ?? therapist?.['firstName'] ?? '');
        const lastName = String(therapist?.['LastName'] ?? therapist?.['lastName'] ?? '');
        const reason = String(item['Reason'] ?? item['reason'] ?? '');

        return {
          id: String(item.Id ?? item.id ?? ''),
          therapistName: `${firstName} ${lastName}`.trim() || '-',
          fromDate: String(item.FromDate ?? item.fromDate ?? ''),
          toDate: String(item.ToDate ?? item.toDate ?? ''),
          reason,
          status: String(item.Status ?? item.status ?? 'Pending'),
          createdAt: String(item.CreatedAt ?? item.createdAt ?? ''),
          searchText: `${firstName} ${lastName} ${reason}`.trim(),
        };
      });

      setRequests(mappedRequests);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load absence requests.';
      toast.error(message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const response = await authFetch(`${apiBaseUrl}/absence-requests/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update absence request.');
      }

      toast.success(result.message || 'Absence request updated successfully.');
      await loadRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update absence request.';
      toast.error(message);
    }
  };

  const columns: Column<AbsenceRequestItem>[] = [
    {
      header: 'Therapist',
      accessor: 'therapistName',
    },
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
          variant={
            row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'error' : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Absence Requests</h1>
      </div>

      {loading ? (
        <div className="w-full rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          Loading absence requests...
        </div>
      ) : (
        <DataTable
          data={requests}
          columns={columns}
          searchable
          searchKey="searchText"
          emptyMessage={requests.length === 0 ? 'No absence requests found.' : 'No results match your search.'}
          actions={(row) =>
            row.status === 'Pending' ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => updateStatus(row.id, 'Approved')}>
                  Approve
                </Button>
                <Button variant="danger" size="sm" onClick={() => updateStatus(row.id, 'Rejected')}>
                  Reject
                </Button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">No action available</span>
            )
          }
        />
      )}
    </div>
  );
}