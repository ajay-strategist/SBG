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

      {/* User Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((user) => {
          const isCurrent = currentUser.id === user.id;
          const userPassword = user.password || 'password';
          const linkedCustomer = customers.find((c) => c.id === user.customerId);

          return (
            <SBGCard
              key={user.id}
              variant={isCurrent ? 'teal' : 'glass'}
              className="p-5 relative overflow-hidden flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                {/* User Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: user.avatarColor || '#0F5C5B' }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${isCurrent ? 'text-white' : 'text-[#173333]'}`}>
                        {user.name}
                      </h4>
                      <p className={`text-xs ${isCurrent ? 'text-white/70' : 'text-[#647777]'}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>

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
                </div>

                {/* Account Details & Password Pill */}
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 space-y-2 text-xs">
                  {/* Default Password Card */}
                  <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isCurrent ? 'bg-white/10 border-white/20 text-white' : 'bg-white/80 border-[#DCE5E3] text-[#173333]'}`}>
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-[#D9B76C]" />
                      <div>
                        <span className="text-[9px] uppercase tracking-wider block opacity-70">Default Password</span>
                        <span className="font-mono font-bold">{userPassword}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyPassword(user.id, userPassword)}
                      className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isCurrent ? 'hover:bg-white/20 text-white' : 'hover:bg-[#0F5C5B]/10 text-[#0F5C5B]'
                      }`}
                      title="Copy Default Password"
                    >
                      {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Linked Customer info for CLIENT role */}
                  {user.role === 'CLIENT' && (
                    <div className={`p-2 rounded-xl text-[11px] flex items-center gap-1.5 ${isCurrent ? 'bg-white/10 text-white/80' : 'bg-[#0F5C5B]/5 text-[#0F5C5B]'}`}>
                      <LinkIcon className="w-3 h-3 text-[#D9B76C]" />
                      <span>Linked Account: <strong>{linkedCustomer ? `${linkedCustomer.name} (${linkedCustomer.code})` : 'Unlinked Customer'}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                {isCurrent ? (
                  <span className="text-xs font-bold text-[#D9B76C] block w-full text-center py-1">
                    ✓ Currently Active Profile
                  </span>
                ) : (
                  <>
                    <SBGButton
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => switchUserRole(user.role)}
                    >
                      Switch Profile
                    </SBGButton>

                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-2 rounded-xl bg-white/60 hover:bg-white text-[#173333] border border-[#DCE5E3] cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        updateUser(user.id, {
                          status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                        })
                      }
                      className={`p-2 rounded-xl border cursor-pointer ${
                        user.status === 'ACTIVE'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                      title={user.status === 'ACTIVE' ? 'Account Active (Click to Disable)' : 'Account Disabled (Click to Activate)'}
                    >
                      {user.status === 'ACTIVE' ? <UserCheckIcon className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </SBGCard>
          );
        })}
      </div>

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
