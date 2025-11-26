import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../config/supabase";

type User = {
  id: string;
  username: string;
  role: "admin" | "cliente";
  name?: string;
} | null;

type AuthContextType = {
  user: User;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from("usuarios_app") 
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) return false;

    const u = {
      id: data.id,
      username: data.username,
      role: data.role,
      name: data.name,
    };

    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
    return true;
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
