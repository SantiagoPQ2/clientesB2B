import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { useVersionChecker } from "./hooks/useVersionChecker";
import UpdateBanner from "./components/UpdateBanner";

// B2B Pages
import PromosB2B from "./pages/b2b/PromosB2B";
import CatalogoB2B from "./pages/b2b/Catalogo";
import CarritoB2B from "./pages/b2b/Carrito";
import PedidosB2B from "./pages/b2b/Pedidos";

// Extra Pages
import Info from "./pages/Info";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

// ChatBot
import ChatBubble from "./components/ChatBubble";
import ChatBot from "./components/ChatBot";

function ProtectedApp() {
  const { user } = useAuth();
  const hasUpdate = useVersionChecker(60000);
  const location = useLocation();

  const [openChat, setOpenChat] = useState(false);

  // Usuario NO logueado → ir al login
  if (!user) return <Login />;

  const role = user.role;
  let allowedRoutes;

  // ================================
  // 🚀 ADMIN
  // ================================
  if (role === "admin") {
    allowedRoutes = (
      <Routes>
        <Route path="/" element={<PromosB2B />} />
        <Route path="/b2b/catalogo" element={<CatalogoB2B />} />
        <Route path="/b2b/carrito" element={<CarritoB2B />} />
        <Route path="/b2b/pedidos" element={<PedidosB2B />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/info" element={<Info />} />
        <Route path="*" element={<PromosB2B />} />
      </Routes>
    );
  }

  // ================================
  // 🚀 CLIENTE
  // ================================
  else if (role === "cliente") {
    allowedRoutes = (
      <Routes>
        <Route path="/" element={<PromosB2B />} />
        <Route path="/b2b/catalogo" element={<CatalogoB2B />} />
        <Route path="/b2b/carrito" element={<CarritoB2B />} />
        <Route path="/b2b/pedidos" element={<PedidosB2B />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/info" element={<Info />} />
        <Route path="*" element={<PromosB2B />} />
      </Routes>
    );
  }

  // Cualquier rol desconocido
  else {
    allowedRoutes = (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // Mostrar chatbot solo en páginas B2B y Promos
  const showChatBot =
    location.pathname.startsWith("/b2b") ||
    location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 overflow-hidden">

      {/* NAVIGATION NUEVO */}
      <Navigation />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-hidden">{allowedRoutes}</main>

      {/* FOOTER GLOBAL */}
      <Footer />

      {/* SISTEMA DE ACTUALIZACIÓN */}
      {hasUpdate && (
        <UpdateBanner onReload={() => window.location.reload()} />
      )}

      {/* CHATBOT */}
      {showChatBot && !openChat && (
        <ChatBubble onOpen={() => setOpenChat(true)} />
      )}

      {showChatBot && openChat && (
        <ChatBot onClose={() => setOpenChat(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedApp />
      </Router>
    </AuthProvider>
  );
}

export default App;

