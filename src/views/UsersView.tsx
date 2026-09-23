import React from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
} from '../components/ui';
import {
  UserCheck,
  Shield,
  Check,
  X,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface UsersViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ onNavigate }) => {
  const { availableUsers, currentUser, switchUserRole } = useSBG();

  const permissionList = [
    { key: 'customers', label: 'Customers Master' },
    { key: 'orders', label: 'Order Management' },
    { key: 'transactions', label: 'Ledger & Calculations' },
    { key: 'estimates', label: 'Estimates & Cost Sheets' },
    { key: 'settlements', label: 'Gold & Cash Settlements' },
    { key: 'reports', label: 'Commercial Reports' },
    { key: 'erp', label: 'ERP Reconciliation' },
    { key: 'users', label: 'User & Access Admin' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F5C5B] flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-[#0F5C5B]" /> User Accounts & Role-Based Access
          </h2>
          <p className="text-xs text-[#647777] mt-0.5">
            Module permission matrix and profile management for SBG Commercial suite
          </p>
        </div>
      </div>

      {/* User Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableUsers.map((user) => {
          const isCurrent = currentUser.id === user.id;

          return (
            <SBGCard
              key={user.id}
              variant={isCurrent ? 'teal' : 'glass'}
              className="p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: user.avatarColor || '#0F5C5B' }}
                >
                  {user.name.charAt(0)}
                </div>

                <SBGBadge variant={isCurrent ? 'gold' : 'neutral'}>
                  {user.role}
                </SBGBadge>
              </div>

              <div>
                <h4 className={`font-bold text-sm ${isCurrent ? 'text-white' : 'text-[#173333]'}`}>
                  {user.name}
                </h4>
                <p className={`text-xs ${isCurrent ? 'text-white/70' : 'text-[#647777]'}`}>
                  {user.email}
                </p>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-white/10">
                {isCurrent ? (
                  <span className="text-xs font-bold text-[#D9B76C] block text-center py-1">
                    ✓ Currently Active Profile
                  </span>
                ) : (
                  <SBGButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => switchUserRole(user.role)}
                  >
                    Switch to {user.role}
                  </SBGButton>
                )}
              </div>
            </SBGCard>
          );
        })}
      </div>

      {/* Role Permission Matrix Table */}
      <SBGCard variant="glass" className="p-0 overflow-hidden space-y-3">
        <div className="p-4 bg-[#0F5C5B]/5 border-b border-[#DCE5E3] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0F5C5B]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
            Role-Based Access Control (RBAC) Permissions Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">System Module</th>
                <th className="py-3 px-4 text-center">ADMIN</th>
                <th className="py-3 px-4 text-center">ACCOUNTANT</th>
                <th className="py-3 px-4 text-center">MANAGER</th>
                <th className="py-3 px-4 text-center">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E3]/60">
              {permissionList.map((perm) => (
                <tr key={perm.key} className="hover:bg-white/60">
                  <td className="py-3.5 px-4 font-semibold text-[#173333]">{perm.label}</td>
                  {['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER'].map((role) => {
                    const user = availableUsers.find((u) => u.role === role);
                    const hasPerm = user?.permissions[perm.key as keyof typeof user.permissions];

                    return (
                      <td key={role} className="py-3.5 px-4 text-center">
                        {hasPerm ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#3E8B68]/15 text-[#2A6E51]">
                            <Check className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                            <X className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SBGCard>
    </div>
  );
};
