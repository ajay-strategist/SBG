import React, { useState } from 'react';
import { SBGProvider, useSBG } from './store/sbgStore';
import { AppShell, ActiveTab } from './components/layout/AppShell';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { CustomerProfileView } from './views/CustomerProfileView';
import { OrdersView } from './views/OrdersView';
import { OrderDetailsView } from './views/OrderDetailsView';
import { LedgerView } from './views/LedgerView';
import { NewTransactionView } from './views/NewTransactionView';
import { EstimatesView } from './views/EstimatesView';
import { NewEstimateView } from './views/NewEstimateView';
import { EstimateDetailsView } from './views/EstimateDetailsView';
import { SettlementsView } from './views/SettlementsView';
import { NewSettlementView } from './views/NewSettlementView';
import { ReportsView } from './views/ReportsView';
import { ERPReconciliationView } from './views/ERPReconciliationView';
import { AuditView } from './views/AuditView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useSBG();
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>();

  const handleNavigate = (tab: ActiveTab, entityId?: string) => {
    setCurrentTab(tab);
    if (entityId !== undefined) {
      setSelectedEntityId(entityId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, show luxury Login page
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setCurrentTab('dashboard')} />;
  }

  return (
    <AppShell
      currentTab={currentTab}
      onNavigate={handleNavigate}
      selectedEntityId={selectedEntityId}
    >
      {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
      {currentTab === 'customers' && <CustomersView onNavigate={handleNavigate} />}
      {currentTab === 'customer-profile' && (
        <CustomerProfileView
          customerId={selectedEntityId || 'cust-101'}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'orders' && <OrdersView onNavigate={handleNavigate} />}
      {currentTab === 'order-details' && (
        <OrderDetailsView
          orderId={selectedEntityId || 'ord-201'}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'ledger' && <LedgerView onNavigate={handleNavigate} />}
      {currentTab === 'new-transaction' && (
        <NewTransactionView
          preselectedCustomerId={selectedEntityId}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'estimates' && <EstimatesView onNavigate={handleNavigate} />}
      {(currentTab === 'new-estimate' || currentTab === 'edit-estimate') && (
        <NewEstimateView
          targetId={selectedEntityId}
          isEditMode={currentTab === 'edit-estimate'}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'estimate-details' && (
        <EstimateDetailsView
          estimateId={selectedEntityId || 'est-301'}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'settlements' && <SettlementsView onNavigate={handleNavigate} />}
      {currentTab === 'new-settlement' && (
        <NewSettlementView
          preselectedCustomerId={selectedEntityId}
          onNavigate={handleNavigate}
        />
      )}
      {currentTab === 'reports' && <ReportsView onNavigate={handleNavigate} />}
      {currentTab === 'erp' && <ERPReconciliationView onNavigate={handleNavigate} />}
      {currentTab === 'audit' && <AuditView onNavigate={handleNavigate} />}
      {currentTab === 'users' && <UsersView onNavigate={handleNavigate} />}
      {currentTab === 'settings' && <SettingsView onNavigate={handleNavigate} />}
    </AppShell>
  );
};

export function App() {
  return (
    <SBGProvider>
      <MainApp />
    </SBGProvider>
  );
}

export default App;
