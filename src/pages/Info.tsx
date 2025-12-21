import React from "react";

const Info: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 bg-white mt-6 rounded-xl shadow-md border border-gray-100">

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Sobre Nosotros</h1>

      <p className="text-gray-700 leading-relaxed mb-4">
        Somos <strong>VaFood</strong>, la mayor distribuidora de alimentos de Córdoba, Argentina.
        Trabajamos hace más de 5 años abasteciendo comercios, supermercados Y
        mayoristas de toda la provincia.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">¿Cómo funciona nuestra plataforma?</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        • Navegá nuestro catálogo completo dividido por categorías. <br />
        • Seleccioná los productos y agrega la cantidad que desees al carrito. <br />
        • Una vez confirmado tu pedido, nuestro equipo lo preparará inmediatamente. <br />
        • Podés ver tus pedidos en la sección <strong>Pedidos B2B</strong>.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Despachos y Entregas</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        La entrega se realiza <strong>en un plazo máximo de 2 días hábiles</strong> desde la confirmación del pedido.  
        Nuestro equipo logístico coordinará el horario de entrega con vos o tu negocio.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Promoción Vigente</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        Por tiempo limitado, ofrecemos un <strong>12% de descuento en todos los productos del catálogo</strong>,
        aplicado automáticamente en el carrito.
      </p>

      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Contacto</h2>
      <p className="text-gray-700 leading-relaxed">
        📍 Dirección: Elpidio Gonzalez 1100, Villa Allende CP5105<br />
        ☎️ Teléfono: (351) 809-4099<br />
        🧾 CUIT: 30-71560964-5<br />
        ✉️ Email: comercial@vafood.com.ar
      </p>

    </div>
  );
};

export default Info;
