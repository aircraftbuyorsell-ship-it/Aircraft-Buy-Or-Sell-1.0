import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { isCompanyAccount } from "@/lib/companyAccess";

export default function CompanyRoute({ children }) {
  const location = useLocation();
  const { user, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        <span className="sr-only">Checking company access</span>
      </div>
    );
  }

  if (!isCompanyAccount(user?.email)) {
    return <Navigate to="/company-access-required" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}