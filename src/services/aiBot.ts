import { supabase } from "../config/supabase";
import { addToCart, removeFromCart, setCartQty } from "./cartActions";

const API_KEY = import.meta.env.VITE_OPENAI_KEY;

export async function askAI(userMessage: string): Promise<string> {
  try {
    // 1️⃣ Catálogo real desde Supabase
    const { data: productos, error } = await supabase
      .from("z_productos")
      .select("id, nombre, marca, categoria, precio");

    if (error || !productos) {
      return "No pude acceder al catálogo en este momento.";
    }

    const catalogo = productos
      .map(
        (p) =>
          `• ${p.nombre} – $${p.precio.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}`
      )
      .join("\n");

    // 2️⃣ Prompt de sistema (anti-alucinación)
    const systemPrompt = `
# ROLE
You are Franchesca a highly competent B2B Sales support assistant for a Consumer goods distribution company (VAFOOD)
# TASK
Answer client questions clearly, briefly, and professionally. This task is critical and you must strictly follow the rules below.
# RULES
1.	Always respond in Spanish.
2.	Use only the official product catalog provided.
3.	Do not assume or invent products, prices, stock, or promotions.
4.	All deliveries are within 48 hours after order confirmation.
5.	The only valid promotions are those shown on the page.
o	If asked for others, reply exactly:
“No hay más promociones que las visibles en la página. Para más información consulte a su Ejecutivo de Ventas.”
6.	If information is unavailable, reply exactly:
“No tengo esa información, para más detalle comunícate con tu Ejecutivo de Ventas.”
7.	Always encourage clients to visit the catalog and mention the exclusive ONLINE discount of 12%.
# CONTEXT
You interact with current clients who already know the company and its products.
# EXAMPLES
## Example 1
Client: “hola en cuanto me llega el pedido”
Franchesca: “Todas nuestras entregas son a 48hs de confirmado el pedido”
## Example 2
Client: “hola, no veo una promo que compro siempre”
Franchesca: “En la pagina solo manejamos esas promociones. Y también tenemos un descuento ON LINE del 12% y entrega a 48hs. Para cualquier otra promoción o consulta comunícate con tu ejecutivo de ventas”
## Example 3
Client: “hola, no veo el alma mora dulce para pedir”
Franchesca: “En la pagina solo manejamos esas productos. Y también tenemos un descuento ON LINE del 12% y entrega a 48hs. Para cualquier otra promoción o consulta comunícate con tu ejecutivo de ventas”

FORMAT:
• Nombre del producto – $precio

CATÁLOGO OFICIAL:
${catalogo}
`;

    // 3️⃣ Llamada a OpenAI
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await res.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No pude entender tu consulta.";

    // 4️⃣ Interpretar acciones de carrito
    await interpretarAcciones(userMessage, productos);

    return reply;
  } catch (err) {
    console.error("askAI error:", err);
    return "Hubo un error procesando tu mensaje.";
  }
}

// ============================================================
// 🛒 Acciones de carrito por lenguaje natural
// ============================================================
async function interpretarAcciones(
  msg: string,
  productos: any[]
) {
  const texto = msg.toLowerCase();

  const producto = buscarProducto(texto, productos);
  if (!producto) return;

  const cantidad = extraerNumero(texto) || 1;

  if (
    texto.includes("agrega") ||
    texto.includes("agregá") ||
    texto.includes("sumá") ||
    texto.includes("añadí") ||
    texto.includes("poneme")
  ) {
    addToCart(producto.id, cantidad);
  }

  if (
    texto.includes("sacá") ||
    texto.includes("eliminá") ||
    texto.includes("quitá")
  ) {
    removeFromCart(producto.id);
  }

  if (
    texto.includes("poné") ||
    texto.includes("ajustá") ||
    texto.includes("setea")
  ) {
    if (cantidad) setCartQty(producto.id, cantidad);
  }
}

// ============================================================
// 🔢 Extraer número del mensaje
// ============================================================
function extraerNumero(texto: string): number | null {
  const match = texto.match(/\b\d+\b/);
  return match ? parseInt(match[0]) : null;
}

// ============================================================
// 🔍 Match de producto real
// ============================================================
function buscarProducto(texto: string, productos: any[]) {
  return (
    productos.find((p) =>
      texto.includes(p.nombre.toLowerCase())
    ) ||
    productos.find(
      (p) =>
        p.marca &&
        texto.includes(p.marca.toLowerCase())
    ) ||
    productos.find(
      (p) =>
        p.categoria &&
        texto.includes(p.categoria.toLowerCase())
    ) ||
    null
  );
}
