import React, { useMemo, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon } from
'lucide-react';
import { Input } from './Input';
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: keyof T;
}
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKey?: keyof T;
  itemsPerPage?: number;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}
export function DataTable<
  T extends {
    id: string | number;
  }>(
{
  data,
  columns,
  searchable = true,
  searchKey,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
  actions
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
    sortConfig &&
    sortConfig.key === key &&
    sortConfig.direction === 'asc')
    {
      direction = 'desc';
    }
    setSortConfig({
      key,
      direction
    });
  };
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    return data.filter((item) => {
      const val = item[searchKey];
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchKey]);
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  return (
    <div className="w-full bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {searchable && searchKey &&
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10" />
          
          </div>
        </div>
      }

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col, idx) =>
              <th
                key={idx}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                onClick={() =>
                col.sortable && col.sortKey && handleSort(col.sortKey)
                }>
                
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortable &&
                  col.sortKey &&
                  sortConfig?.key === col.sortKey && (
                  sortConfig.direction === 'asc' ?
                  <ChevronUpIcon className="h-4 w-4" /> :

                  <ChevronDownIcon className="h-4 w-4" />)
                  }
                  </div>
                </th>
              )}
              {actions &&
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                
                  Actions
                </th>
              }
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedData.length > 0 ?
            paginatedData.map((row) =>
            <tr
              key={row.id}
              className="hover:bg-slate-50 transition-colors">
              
                  {columns.map((col, idx) =>
              <td
                key={idx}
                className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                
                      {typeof col.accessor === 'function' ?
                col.accessor(row) :
                row[col.accessor] as React.ReactNode}
                    </td>
              )}
                  {actions &&
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {actions(row)}
                    </td>
              }
                </tr>
            ) :

            <tr>
                <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-6 py-8 text-center text-slate-500">
                
                  {emptyMessage}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 &&
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, sortedData.length)}
            </span>{' '}
            of <span className="font-medium">{sortedData.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50">
            
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50">
            
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      }
    </div>);

}