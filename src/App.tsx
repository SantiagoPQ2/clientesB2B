import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Promos from "./pages/b2b/Promos";
import Catalogo from "./pages/b2b/Catalogo";
import Carrito from "./pages/b2b/Carrito";
import Pedidos from "./pages/b2b/Pedidos";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

import Navigation from "./components/Navigation";
import ChatBubble from "./components/ChatBubble";
import ChatBot from "./components/ChatBot";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const [openChat, setOpenChat] = useState(false);

  // Si está logueado y está en login → redirigir a Promos
  if (user && location.pathname === "/login") {
    return <Navigate to="/promos" replace />;
  }

  return (
    <>
      {user && <Navigation />}

      <main>
        <Routes>
          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* PÁGINA PRINCIPAL */}
          <Route
            path="/promos"
            element={
              <ProtectedRoute>
                <Promos />
              </ProtectedRoute>
            }
          />

          {/* B2B */}
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
          <Route path="*" element={<Navigate to="/promos" replace />} />
        </Routes>
      </main>

      {/* CHATBOT */}
      {user && !openChat && (
        <ChatBubble onOpen={() => setOpenChat(true)} />
      )}

      {user && openChat && (
        <ChatBot onClose={() => setOpenChat(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
