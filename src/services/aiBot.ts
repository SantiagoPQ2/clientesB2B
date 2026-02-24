import { supabase } from "../config/supabase";
import { addToCart, removeFromCart, setCartQty } from "./cartActions";

const API_KEY = import.meta.env.VITE_OPENAI_KEY;

function getCatalogoCliente(): string {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const u = JSON.parse(raw);
    return String(u?.catalogo || "").toUpperCase().trim();
  } catch {
    return "";
  }
}

export async function askAI(userMessage: string): Promise<string> {
  try {
    const catalogoCliente = getCatalogoCliente();

    if (!catalogoCliente) {
      return "No tengo un catálogo asignado para tu usuario. Contactá a tu Ejecutivo de Ventas.";
    }

    // 1️⃣ Catálogo real desde Supabase (FILTRADO por catalogo y stock)
    const { data: productos, error } = await supabase
      .from("z_productos")
      .select("id, articulo, nombre, marca, categoria, precio, stock")
      .eq("activo", true)
      .eq("catalogo", catalogoCliente)
      .gte("stock", 50);

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
1. Always respond in Spanish.
2. Use only the official product catalog provided.
3. Do not assume or invent products, prices, stock, or promotions.
4. All deliveries are within 48 hours after order confirmation.
5. The only valid promotions are those shown on the page.
   - If asked for others, reply exactly:
“No hay más promociones que las visibles en la página. Para más información consulte a su Ejecutivo de Ventas.”
6. If information is unavailable, reply exactly:
“No tengo esa información, para más detalle comunícate con tu Ejecutivo de Ventas.”
7. Always encourage clients to visit the catalog and mention the exclusive ONLINE discount of 12%.
# CONTEXT
You interact with current clients who already know the company and its products.

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
async function interpretarAcciones(msg: string, productos: any[]) {
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
    return;
  }

  if (
    texto.includes("saca") ||
    texto.includes("sacá") ||
    texto.includes("quita") ||
    texto.includes("quitá") ||
    texto.includes("borra")
  ) {
    removeFromCart(producto.id);
    return;
  }

  if (texto.includes("pone") || texto.includes("poné")) {
    setCartQty(producto.id, cantidad);
    return;
  }
}

function buscarProducto(texto: string, productos: any[]) {
  // Busca por nombre o articulo
  return productos.find((p) => {
    const n = String(p.nombre || "").toLowerCase();
    const a = String(p.articulo || "").toLowerCase();
    return (n && texto.includes(n)) || (a && texto.includes(a));
  });
}

function extraerNumero(texto: string) {
  const m = texto.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
