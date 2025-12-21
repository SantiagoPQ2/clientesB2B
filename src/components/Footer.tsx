import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-white text-gray-700 py-6 border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-2">

        <p className="text-sm font-semibold text-gray-900">
          VaFood Distribuciones – Córdoba, Argentina
        </p>

        <p className="text-xs">
          Dirección: Elpidio Gonzalez 1100,  Villa Allende CP5105
        </p>

        <p className="text-xs">
          Teléfono: (351) 809-4099  
        </p>

        <p className="text-xs">
          CUIT: vafood - 30-71560964-5
        </p>

        <p className="text-[10px] mt-2 text-gray-500">
          © {new Date().getFullYear()} VaFood B2B – Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

