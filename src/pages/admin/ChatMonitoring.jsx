import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { FaRobot, FaUser } from 'react-icons/fa';
import Pagination from '../../components/admin/Pagination';
import FilterBar from '../../components/admin/FilterBar';
import { useToast } from '../../context/ToastContext';

const ChatMonitoring = () => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { showToast } = useToast();
  const limit = 20;

  const fetchChats = useCallback(async (currentPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search,
        fromDate,
        toDate,
      });
      const res = await api.get(`/admin/chats?${params.toString()}`);
      if (res.data.success) {
        setChats(res.data.data);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      showToast('Failed to load chat logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, search, showToast, toDate]);

  useEffect(() => {
    fetchChats(page);
  }, [page, search, fromDate, toDate, fetchChats]);

  return (
    <div className="space-y-6 flex flex-col h-full font-body">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold font-headline text-[var(--color-on-surface)]">Chat Monitoring</h2>
        <FilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search user/message..."
        >
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
        <div className="overflow-auto flex-1 p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex justify-center h-full items-center text-[var(--color-on-surface-variant)] italic">
              No chat logs found in the system.
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {chats.map((c) => (
                <div key={c.id} className="bg-[var(--color-surface-container-low)] p-6 rounded-3xl shadow-sm relative">
                  <div className="flex justify-between items-center mb-6 text-xs text-[var(--color-on-surface-variant)] font-medium">
                    <span className="font-semibold px-3 py-1.5 bg-[var(--color-surface)] shadow-sm rounded border border-[var(--color-outline-variant)]/10 tracking-wide uppercase">
                      {c.user_email || 'Unknown User'}
                    </span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>

                  {/* User Message */}
                  <div className="flex items-start gap-4 mb-6 relative">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)]/30 flex items-center justify-center shrink-0 text-[var(--color-primary)] shadow-inner">
                      <span className="material-symbols-outlined text-[20px] font-medium" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                    <div className="bg-[var(--color-surface)] px-5 py-4 rounded-2xl border border-[var(--color-outline-variant)]/10 flex-1 relative shadow-sm">
                      <p className="text-[15px] font-medium text-[var(--color-on-surface)] leading-relaxed">{c.user_message}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shrink-0 text-[var(--color-on-primary)] relative group shadow-md shadow-[var(--color-primary)]/20">
                      <span className="material-symbols-outlined text-[20px] font-medium" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      {/* Persona Badge */}
                      <span className="absolute -top-3 -right-3 text-[9px] font-bold uppercase tracking-widest bg-[var(--color-tertiary)] text-[var(--color-on-tertiary)] px-2 py-0.5 rounded-full shadow-lg hidden group-hover:block whitespace-nowrap">
                        {c.persona_role}
                      </span>
                    </div>
                    <div className="bg-[var(--color-surface-container-highest)] px-5 py-4 rounded-2xl rounded-tl-none border border-[var(--color-outline-variant)]/20 flex-1 relative">
                      <p className="text-[15px] text-[var(--color-on-surface)] whitespace-pre-wrap leading-relaxed">{c.ai_response}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
    </div>
  );
};

export default ChatMonitoring;
