import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages & Onboarding Flow
import { WelcomeSplashPage } from './pages/auth/WelcomeSplashPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OtpVerifyPage } from './pages/auth/OtpVerifyPage';
import { StoreSelectionPage } from './pages/auth/StoreSelectionPage';
import { BusinessSetupPage } from './pages/auth/BusinessSetupPage';

// Main App Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PosPage } from './pages/pos/PosPage';
import { SalesListPage } from './pages/sales/SalesListPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { IncompleteOrdersPage } from './pages/orders/IncompleteOrdersPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { PurchasesPage } from './pages/purchases/PurchasesPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { DuePage } from './pages/due/DuePage';
import { OnlineStorePage } from './pages/store/OnlineStorePage';
import { LandingPagesPage } from './pages/landing/LandingPagesPage';
import { CourierPage } from './pages/courier/CourierPage';
import { CustomerRiskPage } from './pages/risk/CustomerRiskPage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SmsPage } from './pages/sms/SmsPage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { StaffPage } from './pages/staff/StaffPage';
import { PersonalDashboardPage } from './pages/personal/PersonalDashboardPage';
import { TelecomPage } from './pages/telecom/TelecomPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { ReturnsPage } from './pages/returns/ReturnsPage';
import { VoiceCallsPage } from './pages/voice/VoiceCallsPage';

// Public Customer Views
import { PublicStoreView } from './pages/public/PublicStoreView';
import { PublicLandingView } from './pages/public/PublicLandingView';

// Protected Route Guard (Redirect unauthenticated to /welcome)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, activeAccountMode, shop } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  // Enforce business setup completion for business mode
  if (activeAccountMode === 'business' && (!shop || !shop.name || !shop.category)) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
};

// Auth Route Guard (Redirect authenticated to /select-store or /setup)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, activeAccountMode, shop } = useAuth();
  if (isAuthenticated) {
    if (activeAccountMode === 'business' && (!shop || !shop.name || !shop.category)) {
      return <Navigate to="/setup" replace />;
    }
    return <Navigate to="/select-store" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            {/* Public Store & Landing Pages for Buyers */}
            <Route path="/store/:slug" element={<PublicStoreView />} />
            <Route path="/landing/:slug" element={<PublicLandingView />} />

            {/* Step 1: Landing / Splash Page (First Screen on Launch) */}
            <Route
              path="/welcome"
              element={
                <AuthRoute>
                  <WelcomeSplashPage />
                </AuthRoute>
              }
            />

            {/* Step 2: Login / New Registration Page */}
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
            />
            <Route
              path="/register"
              element={
                <AuthRoute>
                  <RegisterPage />
                </AuthRoute>
              }
            />
            <Route path="/verify-otp" element={<OtpVerifyPage />} />

            {/* Step 3: Store Selection & Setup Page */}
            <Route
              path="/select-store"
              element={
                <ProtectedRoute>
                  <StoreSelectionPage />
                </ProtectedRoute>
              }
            />
            <Route path="/setup" element={<BusinessSetupPage />} />

            {/* Step 4: Protected Store HomePage / Dashboard Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/sales" element={<SalesListPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/incomplete" element={<IncompleteOrdersPage />} />
              <Route path="/incomplete-orders" element={<Navigate to="/orders/incomplete" replace />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/telecom" element={<TelecomPage />} />
              <Route path="/personal" element={<PersonalDashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/due" element={<DuePage />} />
              <Route path="/voice-calls" element={<VoiceCallsPage />} />
              <Route path="/online-store" element={<OnlineStorePage />} />
              <Route path="/landing-pages" element={<LandingPagesPage />} />
              <Route path="/courier" element={<CourierPage />} />
              <Route path="/risk-analysis" element={<CustomerRiskPage />} />
              <Route path="/risk" element={<Navigate to="/risk-analysis" replace />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/sms" element={<SmsPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/staff" element={<StaffPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
