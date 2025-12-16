import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProductModalProvider } from "./context/ProductModalContext";
import { useVersionChecker } from "./hooks/useVersionChecker";
import UpdateBanner from "./components/UpdateBanner";

// B2B PAGES
import PromosB2B from "./pages/b2b/PromosB2B";
import CatalogoB2B from "./pages/b2b/Catalogo";
import CarritoB2B from "./pages/b2b/Carrito";
import PedidosB2B from "./pages/b2b/Pedidos";

// Extras
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Info from "./pages/Info";

function ProtectedApp() {
  const { user } = useAuth();
  const hasUpdate = useVersionChecker(60000);

  if (!user) return <Login />;

  const role = user.role;

  let allowedRoutes;

  if (role === "admin" || role === "cliente") {
    allowedRoutes = (
      <Routes>
        <Route path="/" element={<PromosB2B />} />
        <Route path="/b2b/catalogo" element={<CatalogoB2B />} />
        <Route path="/b2b/carrito" element={<CarritoB2B />} />
        <Route path="/b2b/pedidos" element={<PedidosB2B />} />
        <Route path="/info" element={<Info />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<PromosB2B />} />
      </Routes>
    );
  } else {
    allowedRoutes = (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* NAVIGATION */}
      <Navigation />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-hidden">
        {allowedRoutes}
      </main>

      {/* FOOTER */}
      <Footer />

      {/* UPDATE BANNER */}
      {hasUpdate && (
        <UpdateBanner onReload={() => window.location.reload()} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProductModalProvider>
        <Router>
          <ProtectedApp />
        </Router>
      </ProductModalProvider>
    </AuthProvider>
  );
}

export default App;
