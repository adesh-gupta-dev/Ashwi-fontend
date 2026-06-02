import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { FaCheck, FaBan, FaTrash } from 'react-icons/fa';
import FilterBar from '../../components/admin/FilterBar';
import Pagination from '../../components/admin/Pagination';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async (currentPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search: searchTerm,
        status,
      });
      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load users.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, searchTerm, showToast, status]);

  useEffect(() => {
    fetchUsers(page);
  }, [page, searchTerm, status, fetchUsers]);

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/users/${id}/block`, { isActive: !currentStatus });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: !currentStatus } : u)));
      showToast(`User ${currentStatus ? 'blocked' : 'unblocked'} successfully.`, 'success');
    } catch {
      showToast('Failed to update user status.', 'error');
    }
  };

  const updateUserRole = async (id, role) => {
    try {
      const res = await api.patch(`/admin/users/${id}/role`, { role });
      const updated = res.data?.data;
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: updated.role } : u)));
      }
      showToast('User role updated.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user role.', 'error');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to soft-delete this user? They will lose access immediately.")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('User deleted successfully.', 'success');
    } catch {
      showToast('Failed to delete user.', 'error');
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full font-body">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold font-headline text-[var(--color-on-surface)]">User Management</h2>
        <FilterBar
          search={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          placeholder="Search by email..."
        >
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 text-[var(--color-on-surface)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </FilterBar>
      </div>

      <div className="flex-1 bg-[var(--color-surface-container-lowest)] rounded-[2rem] overflow-hidden flex flex-col border border-[var(--color-outline-variant)]/10 shadow-sm mt-4">
        <div className="overflow-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--color-surface-container-low)] sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-[var(--color-on-surface-variant)] border-b border-[var(--color-outline-variant)]/10">Email</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-[var(--color-on-surface-variant)] border-b border-[var(--color-outline-variant)]/10">Role</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-[var(--color-on-surface-variant)] border-b border-[var(--color-outline-variant)]/10">Status</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-[var(--color-on-surface-variant)] text-right border-b border-[var(--color-outline-variant)]/10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]/5">
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-[var(--color-surface-container-low)] transition-colors">
                    <td className="p-4 text-sm font-semibold text-[var(--color-on-surface)]">{u.email}</td>
                    <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        disabled={currentUser?.id === u.id}
                        className="px-2 py-1 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/20 text-[var(--color-on-surface)]"
                        title={currentUser?.id === u.id ? 'You cannot change your own role.' : 'Change role'}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 gap-1 rounded-full text-[10px] font-bold uppercase ${u.is_active ? 'bg-[var(--color-tertiary-fixed-dim)]/20 text-[var(--color-tertiary)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>
                        {u.is_active ? <FaCheck className="text-[10px]" /> : <FaBan className="text-[10px]" />} {u.is_active ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      {u.role !== 'admin' && (
                        <>
                          <button 
                            onClick={() => toggleUserStatus(u.id, u.is_active)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              u.is_active 
                                ? 'border-[var(--color-error)]/20 text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-[var(--color-on-error)]' 
                                : 'border-[var(--color-tertiary)]/20 text-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)] hover:text-[var(--color-on-tertiary)]'
                            }`}
                          >
                            {u.is_active ? 'Suspend' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => deleteUser(u.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--color-error)]/20 text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-[var(--color-on-error)] transition-all flex items-center gap-1"
                          >
                            <FaTrash className="text-[10px]" /> Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-[var(--color-on-surface-variant)] italic">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
    </div>
  );
};

export default UserManagement;
