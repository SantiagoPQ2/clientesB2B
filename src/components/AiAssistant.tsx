import { useEffect, useState, useRef } from "react";

type Message = {
  sender: "user" | "bot";
  text: string;
};

type Product = {
  name: string;
  price: number;
};

interface Props {
  products: Product[];
}

export default function AiAssistant({ products }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: "Hola! Soy Franchesca tu asistente de ventas. ¿En qué puedo ayudarte hoy?",
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage },
    ]);

    setLoading(true);

    const res = await fetch("/.netlify/functions/ai-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        products,
      }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: data.reply },
    ]);

    setLoading(false);
  };

  return (
    <div className="mt-4 w-full rounded-xl border bg-white shadow-sm flex flex-col h-[280px]">
      <div className="px-4 py-2 border-b font-semibold text-sm">
        Franchesca · Asistente de ventas
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] ${
              m.sender === "user"
                ? "ml-auto bg-red-500 text-white"
                : "bg-gray-100"
            } rounded-lg px-3 py-2`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 rounded-lg px-3 py-2 w-fit">
            Escribiendo…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-2 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
          placeholder="Escribí tu consulta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-red-600 text-white px-4 rounded-lg text-sm"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
