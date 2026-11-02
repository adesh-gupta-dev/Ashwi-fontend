import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import FilterBar from '../../components/admin/FilterBar';
import Pagination from '../../components/admin/Pagination';
import { useToast } from '../../context/ToastContext';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showToast } = useToast();
  const limit = 20;

  const fetchLogs = useCallback(async (currentPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search,
        action,
        fromDate,
        toDate,
      });
      const res = await api.get(`/admin/logs?${params.toString()}`);
      setLogs(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      showToast('Failed to load system logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [action, fromDate, limit, page, search, showToast, toDate]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, search, action, fromDate, toDate, fetchLogs]);

  return (
    <div className="space-y-6 flex flex-col h-full font-body">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold font-headline text-[var(--color-on-surface)]">System Logs</h2>
        <FilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search action or user..."
        >
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 text-[var(--color-on-surface)]"
          >
            <option value="all">All actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_SIGNUP">USER_SIGNUP</option>
            <option value="UPDATE_USER_STATUS">UPDATE_USER_STATUS</option>
            <option value="CHAT_MESSAGE_SENT">CHAT_MESSAGE_SENT</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 text-[var(--color-on-surface)]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 text-[var(--color-on-surface)]"
          />
        </FilterBar>
      </div>

      <div className="flex-1 bg-[var(--color-surface-container-lowest)] rounded-[2rem] overflow-hidden flex flex-col border border-[var(--color-outline-variant)]/10 shadow-sm mt-4">
        <div className="overflow-auto flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
             <div className="text-gray-500 italic p-4">No system logs available.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#2d2d2d] sticky top-0 z-10 shadow-sm rounded-t-lg shadow-black/50">
                <tr>
                  <th className="p-3 font-semibold text-gray-300 w-48">Timestamp</th>
                  <th className="p-3 font-semibold text-gray-300 w-40">Action</th>
                  <th className="p-3 font-semibold text-gray-300 w-48">User</th>
                  <th className="p-3 font-semibold text-gray-300">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d3d3d]">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#2a2d33] transition-colors group">
                    <td className="p-3 text-gray-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-3"><span className="text-[#569cd6] font-bold">{l.action}</span></td>
                    <td className="p-3 text-[#ce9178] truncate max-w-[200px]">{l.user_email || `ID: ${l.user_id}`}</td>
                    <td className="p-3 text-[#9cdcfe]">
                      {l.details ? JSON.stringify(l.details) : '{}'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
    </div>
  );
};

export default SystemLogs;
