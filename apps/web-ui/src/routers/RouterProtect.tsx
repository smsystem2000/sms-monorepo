import { Navigate, Outlet } from "react-router-dom";
import TokenService from "../queries/token/tokenService";
import DashboardLayout from "../components/Dashboard/DashboardLayout";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = TokenService.getToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (TokenService.isTokenExpired()) {
    TokenService.removeToken();
    return <Navigate to="/" replace />;
  }

  const userRole = TokenService.getRole();

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
