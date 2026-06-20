import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import APIPortal from './pages/APIPortal';
import Report from './pages/Report';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import Pricing from './pages/Pricing';
import ATIQuickScore from './pages/ATIQuickScore';
import ATIVerify from './pages/ATIVerify';
import MyAccount from './pages/MyAccount';
import ATIFullReport from './pages/ATIFullReport';
import Valuation from './pages/Valuation';
import OpexCalculator from './pages/OpexCalculator';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/ati-quick-score" element={<ATIQuickScore />} />
        <Route path="/ati-verify" element={<ATIVerify />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/ati-full-report" element={<ATIFullReport />} />
        <Route path="/valuation" element={<Valuation />} />
        <Route path="/opex-calculator" element={<OpexCalculator />} />
        <Route path="/api-portal" element={<APIPortal />} />
        <Route path="/report/:nNumber" element={<Report />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        {/* Add your page Route elements here */}
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App