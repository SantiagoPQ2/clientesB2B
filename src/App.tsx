import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// B2B pages
import Catalogo from "./pages/b2b/Catalogo";
import Carrito from "./pages/b2b/Carrito";
import Pedidos from "./pages/b2b/Pedidos";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

// Navigation
import Navigation from "./components/Navigation";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  // Ya logueado → no volver al login
  if (user && window.location.pathname === "/login") {
    return <Navigate to="/catalogo" replace />;
  }

  return (
    <>
      {/* Navigation arriba solo si hay usuario */}
      {user && <Navigation />}

      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PROTEGIDAS */}
        <Route
          path="/catalogo"
          element={
            <ProtectedRoute>
              <Catalogo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <Carrito />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pedidos"
          element={
            <ProtectedRoute>
              <Pedidos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/catalogo" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
