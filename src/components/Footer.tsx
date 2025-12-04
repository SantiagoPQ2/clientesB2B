import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-gray-300 py-6 mt-10">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-2">

        <p className="text-sm font-semibold text-white">
          VaFood Distribuciones – Córdoba, Argentina
        </p>

        <p className="text-xs">
          Dirección: Av. Industria 1520, Parque Empresarial Córdoba
        </p>

        <p className="text-xs">
          Teléfono: (0351) 482-9000  
        </p>

        <p className="text-xs">
          CUIT: 30-70908740-9
        </p>

        <p className="text-[10px] mt-2 text-gray-500">
          © {new Date().getFullYear()} VaFood B2B – Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
