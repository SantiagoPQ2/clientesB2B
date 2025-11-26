import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import NavigationB2B from "./components/NavigationB2B";

import Login from "./pages/Login";

// B2B pages
import Promos from "./pages/b2b/Promos";
import CatalogoB2B from "./pages/b2b/Catalogo";
import CarritoB2B from "./pages/b2b/Carrito";
import PedidosB2B from "./pages/b2b/Pedidos";
import SettingsB2B from "./pages/b2b/Settings";

import ChatBubble from "./components/ChatBubble";
import ChatBot from "./components/ChatBot";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

function ProtectedApp() {
  const { user } = useAuth();
  const [openChat, setOpenChat] = useState(false);
  const location = useLocation();

  if (!user) return <Login />;

  const isB2B = true; // siempre B2B en este proyecto

  const showChatBot =
    location.pathname.startsWith("/b2b") &&
    !openChat;

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <NavigationB2B />

      <main className="flex-1">
        <Routes>
          {/* Inicio → Promos */}
          <Route path="/" element={<Navigate to="/b2b/promos" />} />
          <Route path="/b2b/promos" element={<Promos />} />
          <Route path="/b2b/catalogo" element={<CatalogoB2B />} />
          <Route path="/b2b/carrito" element={<CarritoB2B />} />
          <Route path="/b2b/pedidos" element={<PedidosB2B />} />
          <Route path="/b2b/settings" element={<SettingsB2B />} />
        </Routes>
      </main>

      {/* BURBUJA CHAT */}
      {showChatBot && !openChat && (
        <ChatBubble onOpen={() => setOpenChat(true)} />
      )}

      {showChatBot && openChat && (
        <ChatBot onClose={() => setOpenChat(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ProtectedApp />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
