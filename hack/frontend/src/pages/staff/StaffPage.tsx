import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Mail, UserCheck, Trash2, Edit2, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Staff } from '../../types';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Brightloop@2026');
  const [department, setDepartment] = useState('Billing Operations');
  const [designation, setDesignation] = useState('Senior Operations Associate');
  const [permissions, setPermissions] = useState('ALL');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      if (res.data?.success) setStaffList(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/staff', {
        name,
        email,
        password,
        department,
        designation,
        permissions,
      });
      if (res.data?.success) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        fetchStaff();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete staff');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Staff Account Administration</h3>
          <p className="text-xs text-slate-500">Only ADMIN can provision staff logins and configure operations permissions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Permissions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading staff directory...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {s.employeeId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.user?.name}</p>
                      <p className="text-[11px] text-slate-400">{s.user?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{s.designation}</p>
                      <span className="text-[10px] text-slate-500">{s.department}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-700">
                        {s.permissions}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.user?.status || 'ACTIVE'} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Remove Staff Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New Staff Member">
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">{errorMsg}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Krishnan"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@brightloop.io"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              >
                <option value="Billing Operations">Billing Operations</option>
                <option value="Sales & Quotations">Sales & Quotations</option>
                <option value="Customer Success">Customer Success</option>
                <option value="Finance & Tax">Finance & Tax</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Account Executive"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Initial Password * (Complexity enforced)</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must be at least 9 characters with 1 uppercase, 1 lowercase, and 1 special character.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {formLoading ? 'Provisioning...' : 'Provision Staff Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
