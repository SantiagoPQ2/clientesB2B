import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../config/supabase";

type User = {
  id: string;
  username: string;
  role: "admin" | "cliente";
  name?: string;
  catalogo?: string | null;
  mail?: string | null;
  phone?: string | null;
  password_changed?: boolean;
  mustCompleteProfile?: boolean;
} | null;

type AuthContextType = {
  user: User;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hasValidMail(mail?: string | null) {
  return !!mail && mail.trim() !== "";
}

function hasValidPhone(phone?: string | null) {
  if (!phone) return false;
  const value = phone.trim();
  return value !== "" && value !== "0";
}

function buildUser(data: any) {
  const mustCompleteProfile =
    !data.password_changed ||
    !hasValidMail(data.mail) ||
    !hasValidPhone(data.phone);

  return {
    id: data.id,
    username: data.username,
    role: data.role,
    name: data.name ?? "",
    catalogo: data.catalogo ?? null,
    mail: data.mail ?? "",
    phone: data.phone ?? "",
    password_changed: !!data.password_changed,
    mustCompleteProfile,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    try {
      setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("user");
    }
  }, []);

  const refreshUser = async () => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.id) return;

      const { data, error } = await supabase
        .from("clientes_app")
        .select("id, username, role, name, catalogo, mail, phone, password_changed")
        .eq("id", parsed.id)
        .single();

      if (error || !data) return;

      const u = buildUser(data);
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    } catch {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from("clientes_app")
      .select("id, username, role, name, catalogo, mail, phone, password_changed")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) return false;

    const u = buildUser(data);

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
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
