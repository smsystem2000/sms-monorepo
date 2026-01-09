import React, { createContext, useContext, useEffect, useState } from "react";
import TokenService from "../queries/token/tokenService";

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  schoolId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const decoded = TokenService.decodeToken();
    if (decoded && !TokenService.isTokenExpired()) {
      setUser({
        userId: decoded.userId || decoded.adminId || "",
        email: decoded.email || decoded.username || "",
        role: decoded.role,
        schoolId: decoded.schoolId,
      });
    }
  }, []);

  const login = (token: string) => {
    TokenService.setToken(token);

    const decoded = TokenService.decodeToken();
    if (!decoded) return;

    setUser({
      userId: decoded.userId || decoded.adminId || "",
      email: decoded.email || decoded.username || "",
      role: decoded.role,
      schoolId: decoded.schoolId,
    });
  };

  const logout = () => {
    TokenService.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
