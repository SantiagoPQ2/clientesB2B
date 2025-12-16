import type { Handler } from "@netlify/functions";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler: Handler = async (event) => {
  try {
    const { message, products } = JSON.parse(event.body || "{}");

    const systemPrompt = `
Sos Franchesca, una asistente de ventas B2B.

Reglas estrictas:
- Respondé SIEMPRE en español.
- Sé clara, breve y comercial.
- No inventes precios ni productos.
- Si no tenés la información exacta, decí:
  "Para más información consulte a su agente de ventas."

Información fija del negocio:
- Las entregas son dentro de las 48 horas hábiles.
- Solo existen las promociones visibles en la página (3 promos).

Productos disponibles (nombre y precio):
${products
  .map((p: any) => `- ${p.name}: $${p.price}`)
  .join("\n")}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.2,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: completion.choices[0].message.content,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        reply: "Para más información consulte a su agente de ventas.",
      }),
    };
  }
};
