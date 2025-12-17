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
Sos Franchesca, la asistente de ventas B2B de VaFood.

REGLAS ESTRICTAS:
- Respondé SIEMPRE en español.
- Usá SOLO el catálogo provisto.
- NO inventes productos ni precios.
- Si el producto no existe, decí: "Este producto no esta disponible para la venta online, comunicate con tu asesor comercial para poder pedirlo."
- Las entregas son dentro de las 48 horas hábiles.
- No hay más promociones que las visibles en la página. Si consulta por más, decí: "Para mas información consultele a su Ejecutivo de Ventas"
- Si no sabes algo, siempre decí: "No tengo esa información, para más detalle consultele a su Ejecutivo de Ventas"
- Sé breve, clara y profesional.

FORMATO:
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
