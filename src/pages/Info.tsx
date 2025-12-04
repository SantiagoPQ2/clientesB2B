const Info = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Sobre VaFood</h1>

      <p className="text-gray-600 leading-relaxed mb-4">
        Somos la <strong>mayor distribuidora de alimentos de Córdoba, Argentina</strong>,
        abasteciendo comercios, restaurantes, mayoristas y autoservicios con la mayor
        variedad de productos congelados y refrigerados del mercado.
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
        ¿Cómo funciona este portal B2B?
      </h2>

      <ul className="list-disc pl-6 text-gray-600 space-y-2">
        <li>Navegá por el catálogo o buscá productos directamente desde el buscador superior.</li>
        <li>Agregá la cantidad deseada de cada producto a tu carrito.</li>
        <li>Confirmá tu pedido y el sistema lo procesará automáticamente.</li>
        <li>Vas a poder ver el historial y estado de tus pedidos en la pestaña "Pedidos".</li>
      </ul>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
        Entrega y Descuentos
      </h2>

      <p className="text-gray-600">
        La entrega se realiza en un plazo de <strong>48 horas hábiles</strong>.  
        Por tiempo limitado, disfrutá de un <strong>12% de descuento en todos los productos.</strong>
      </p>

      <p className="text-xs text-gray-400 mt-6">
        Si necesitás ayuda, comunicate con nuestro equipo desde la sección de soporte.
      </p>
    </div>
  );
};

export default Info;
