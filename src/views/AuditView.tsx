import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
} from '../components/ui';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface AuditViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onNavigate }) => {
  const { auditLogs } = useSBG();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesMod = selectedModule === 'ALL' || log.module === selectedModule;
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesMod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F5C5B] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#0F5C5B]" /> Audit Trail & Data Integrity
          </h2>
          <p className="text-xs text-[#647777] mt-0.5">
            Immutable tracking of ledger transactions, estimates, settlements, and financial rate updates
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold bg-[#0F5C5B]/10 text-[#0F5C5B] px-3 py-1.5 rounded-xl">
          <Activity className="w-4 h-4" /> {auditLogs.length} Events Logged
        </div>
      </div>

      {/* Filter */}
      <SBGCard variant="glass" className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#647777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, user name, or detail description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-[#DCE5E3] focus:outline-none"
          />
        </div>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="text-xs bg-white border border-[#DCE5E3] rounded-xl px-3 py-2"
        >
          <option value="ALL">All Modules</option>
          <option value="LEDGER">LEDGER</option>
          <option value="ESTIMATES">ESTIMATES</option>
          <option value="SETTLEMENTS">SETTLEMENTS</option>
          <option value="CUSTOMERS">CUSTOMERS</option>
          <option value="ORDERS">ORDERS</option>
          <option value="ERP">ERP</option>
          <option value="USERS">USERS</option>
          <option value="SETTINGS">SETTINGS</option>
        </select>
      </SBGCard>

      {/* Audit Log Timeline */}
      <SBGCard variant="glass" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F5C5B]/5 text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Record Ref</th>
                <th className="py-3.5 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E3]/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/60">
                  <td className="py-3.5 px-4 font-mono text-[#647777] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#173333]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0F5C5B]" />
                      {log.userName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <SBGBadge variant="teal" size="sm">{log.module}</SBGBadge>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0F5C5B]">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#173333]">
                    {log.recordRef || log.recordId}
                  </td>
                  <td className="py-3.5 px-4 text-[#647777] max-w-md">
                    {log.details || 'Action completed successfully.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SBGCard>
    </div>
  );
};
