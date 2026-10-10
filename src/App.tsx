import React, { useState, Suspense, lazy } from 'react';
import { SBGProvider, useSBG } from './store/sbgStore';
import { AppShell, ActiveTab } from './components/layout/AppShell';
import { LoginView } from './views/LoginView';

// Route-level Code Splitting for ultra-fast page load times
const DashboardView = lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })));
const CustomersView = lazy(() => import('./views/CustomersView').then((m) => ({ default: m.CustomersView })));
const CustomerProfileView = lazy(() => import('./views/CustomerProfileView').then((m) => ({ default: m.CustomerProfileView })));
const OrdersView = lazy(() => import('./views/OrdersView').then((m) => ({ default: m.OrdersView })));
const OrderDetailsView = lazy(() => import('./views/OrderDetailsView').then((m) => ({ default: m.OrderDetailsView })));
const LedgerView = lazy(() => import('./views/LedgerView').then((m) => ({ default: m.LedgerView })));
const NewTransactionView = lazy(() => import('./views/NewTransactionView').then((m) => ({ default: m.NewTransactionView })));
const EstimatesView = lazy(() => import('./views/EstimatesView').then((m) => ({ default: m.EstimatesView })));
const NewEstimateView = lazy(() => import('./views/NewEstimateView').then((m) => ({ default: m.NewEstimateView })));
const EstimateDetailsView = lazy(() => import('./views/EstimateDetailsView').then((m) => ({ default: m.EstimateDetailsView })));
const SettlementsView = lazy(() => import('./views/SettlementsView').then((m) => ({ default: m.SettlementsView })));
const NewSettlementView = lazy(() => import('./views/NewSettlementView').then((m) => ({ default: m.NewSettlementView })));
const ReportsView = lazy(() => import('./views/ReportsView').then((m) => ({ default: m.ReportsView })));
const AuditView = lazy(() => import('./views/AuditView').then((m) => ({ default: m.AuditView })));
const UsersView = lazy(() => import('./views/UsersView').then((m) => ({ default: m.UsersView })));
const SettingsView = lazy(() => import('./views/SettingsView').then((m) => ({ default: m.SettingsView })));

const ViewSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse p-4">
    <div className="h-8 bg-[#0F5C5B]/10 rounded-xl w-1/4" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-24 bg-gray-100 rounded-2xl border border-[#DCE5E3]/60" />
      <div className="h-24 bg-gray-100 rounded-2xl border border-[#DCE5E3]/60" />
      <div className="h-24 bg-gray-100 rounded-2xl border border-[#DCE5E3]/60" />
      <div className="h-24 bg-gray-100 rounded-2xl border border-[#DCE5E3]/60" />
    </div>
    <div className="h-80 bg-gray-50 rounded-2xl border border-[#DCE5E3]/60" />
  </div>
);

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
      <Suspense fallback={<ViewSkeleton />}>
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
        {currentTab === 'audit' && <AuditView onNavigate={handleNavigate} />}
        {currentTab === 'users' && <UsersView onNavigate={handleNavigate} />}
        {currentTab === 'settings' && <SettingsView onNavigate={handleNavigate} />}
      </Suspense>
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
