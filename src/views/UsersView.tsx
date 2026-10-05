import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
  SBGModal,
  SBGInput,
} from '../components/ui';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Key,
  Copy,
  Check,
  Edit2,
  Trash2,
  UserX,
  UserCheck as UserCheckIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';
import { UserAccount } from '../core/calculations/types';

interface UsersViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = () => {
  const {
    availableUsers,
    currentUser,
    switchUserRole,
    addUser,
    updateUser,
    deleteUser,
    customers,
  } = useSBG();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STAFF' | 'CLIENT'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    username: string;
    role: 'ADMIN' | 'STAFF' | 'CLIENT';
    password: string;
    status: 'ACTIVE' | 'DISABLED';
    customerId: string;
  }>({
    name: '',
    email: '',
    username: '',
    role: 'STAFF',
    password: 'password',
    status: 'ACTIVE',
    customerId: '',
  });

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      role: 'STAFF',
      password: 'password',
      status: 'ACTIVE',
      customerId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      password: user.password || 'password',
      status: user.status,
      customerId: user.customerId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingUserId) {
      updateUser(editingUserId, {
        name: formData.name,
        email: formData.email,
        username: formData.username || formData.email.split('@')[0],
        role: formData.role,
        password: formData.password || 'password',
        status: formData.status,
        customerId: formData.role === 'CLIENT' ? formData.customerId : undefined,
      });
    } else {
      addUser({
        name: formData.name,
        email: formData.email,
        username: formData.username || formData.email.split('@')[0],
        role: formData.role,
        password: formData.password || 'password',
        status: formData.status,
        customerId: formData.role === 'CLIENT' ? formData.customerId : undefined,
        permissions: {
          customers: true,
          orders: true,
          transactions: true,
          estimates: true,
          settlements: formData.role !== 'CLIENT',
          reports: formData.role === 'ADMIN',
          users: formData.role === 'ADMIN',
          erp: false,
        },
      });
    }

    setIsModalOpen(false);
  };

  const handleCopyPassword = (userId: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = availableUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F5C5B] flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-[#0F5C5B]" /> User Accounts & Access Directory
          </h2>
          <p className="text-xs text-[#647777] mt-0.5">
            Manage system users, login credentials, default passwords, and role privileges
          </p>
        </div>

        <SBGButton
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAddModal}
        >
          Add New User
        </SBGButton>
      </div>

      {/* Filter & Search Toolbar */}
      <SBGCard variant="glass" className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#647777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'ADMIN', 'STAFF', 'CLIENT'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#0F5C5B] text-white shadow-xs'
                  : 'bg-white/80 text-[#647777] hover:bg-white hover:text-[#173333]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </SBGCard>

      {/* User Accounts Table */}
      <SBGCard variant="glass" className="overflow-hidden p-0 border border-[#DCE5E3] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">USER PROFILE</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4">DEFAULT PASSWORD</th>
                <th className="py-3.5 px-4">LINKED ACCOUNT / SCOPE</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">SESSION</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#647777]">
                    <UserCheck className="w-10 h-10 mx-auto text-[#647777]/40 mb-2" />
                    <p className="font-semibold text-sm">No matching users found</p>
                    <p className="text-xs text-[#647777]/70 mt-1">
                      Try adjusting your search criteria or role filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser.id === user.id;
                  const userPassword = user.password || 'password';
                  const linkedCustomer = customers.find((c) => c.id === user.customerId);

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-[#0F5C5B]/5 font-medium'
                          : 'hover:bg-[#FAF9F6]/80'
                      }`}
                    >
                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                            style={{ backgroundColor: user.avatarColor || '#0F5C5B' }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#173333] truncate">
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0F5C5B] text-white">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#647777] truncate">
                              {user.email}
                              {user.username && (
                                <span className="ml-1 opacity-70">(@{user.username})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SBGBadge
                          variant={
                            user.role === 'ADMIN'
                              ? 'gold'
                              : user.role === 'STAFF'
                              ? 'teal'
                              : 'neutral'
                          }
                        >
                          {user.role}
                        </SBGBadge>
                      </td>

                      {/* Default Password */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-[#DCE5E3] text-[#173333]">
                          <Key className="w-3.5 h-3.5 text-[#D9B76C]" />
                          <span className="font-mono font-bold text-xs">{userPassword}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(user.id, userPassword)}
                            className="p-1 rounded hover:bg-[#0F5C5B]/10 text-[#0F5C5B] cursor-pointer transition-colors ml-0.5"
                            title="Copy Password"
                          >
                            {copiedId === user.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Linked Customer / Scope */}
                      <td className="py-3.5 px-4">
                        {user.role === 'CLIENT' ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#0F5C5B]">
                            <LinkIcon className="w-3.5 h-3.5 text-[#D9B76C] shrink-0" />
                            <span className="truncate">
                              {linkedCustomer ? (
                                <>
                                  <strong className="font-bold">{linkedCustomer.name}</strong>{' '}
                                  <span className="text-[#647777]">({linkedCustomer.code})</span>
                                </>
                              ) : (
                                <span className="text-amber-700 italic">Unlinked Customer</span>
                              )}
                            </span>
                          </div>
                        ) : user.role === 'ADMIN' ? (
                          <span className="text-xs text-[#647777] flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#D9B76C]" />
                            Full Admin System Scope
                          </span>
                        ) : (
                          <span className="text-xs text-[#647777]">
                            Staff Operations & Billing
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            updateUser(user.id, {
                              status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                            })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          }`}
                          title={
                            user.status === 'ACTIVE'
                              ? 'Account Active (Click to Disable)'
                              : 'Account Disabled (Click to Activate)'
                          }
                        >
                          {user.status === 'ACTIVE' ? (
                            <>
                              <UserCheckIcon className="w-3 h-3 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" />
                              Disabled
                            </>
                          )}
                        </button>
                      </td>

                      {/* Session State */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2.5 py-1 rounded-full border border-[#0F5C5B]/20">
                            ✓ Active Session
                          </span>
                        ) : (
                          <SBGButton
                            variant="outline"
                            size="sm"
                            className="text-xs py-1 px-2.5"
                            onClick={() => switchUserRole(user.role)}
                          >
                            Switch Profile
                          </SBGButton>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#173333] border border-[#DCE5E3] cursor-pointer transition-colors shadow-2xs"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => deleteUser(user.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors shadow-2xs"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SBGCard>

      {/* Add / Edit User Modal */}
      <SBGModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUserId ? 'Edit User Account' : 'Add New User Account'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <SBGInput
            label="Full Name"
            placeholder="e.g. Rajesh Mehra"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <SBGInput
            label="Email Address / Username"
            type="email"
            placeholder="e.g. rajesh@sbgjewels.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          {/* Role Select */}
          <div>
            <label className="block text-xs font-bold text-[#173333] mb-1 uppercase tracking-wider">
              User Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as any })
              }
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20"
            >
              <option value="ADMIN">ADMIN (Full Access)</option>
              <option value="STAFF">STAFF (Operational Management)</option>
              <option value="CLIENT">CLIENT (Client Self-Service Portal)</option>
            </select>
          </div>

          {/* Password Input (Default: password) */}
          <SBGInput
            label="Default Password"
            type="text"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="password"
            required
          />

          {/* Linked Customer for CLIENT role */}
          {formData.role === 'CLIENT' && (
            <div>
              <label className="block text-xs font-bold text-[#173333] mb-1 uppercase tracking-wider">
                Linked Customer Account
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20"
              >
                <option value="">-- Select Customer from Master --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Select */}
          <div>
            <label className="block text-xs font-bold text-[#173333] mb-1 uppercase tracking-wider">
              Account Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5E3]">
            <SBGButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </SBGButton>
            <SBGButton variant="primary" type="submit">
              {editingUserId ? 'Save Changes' : 'Create User'}
            </SBGButton>
          </div>
        </form>
      </SBGModal>
    </div>
  );
};
