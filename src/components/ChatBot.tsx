import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { askAI } from "../services/aiBot";

interface ProductForAI {
  name: string;
  price: number;
}

interface Props {
  products: ProductForAI[];
}

const ChatBot: React.FC<Props> = ({ products }) => {
  const [messages, setMessages] = useState<
    { from: "user" | "bot"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  // Mensaje inicial
  useEffect(() => {
    setMessages([
      {
        from: "bot",
        text: "Hola! Soy Franchesca tu asistente de ventas. ¿En qué puedo ayudarte hoy?",
      },
    ]);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { from: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    const botReply = await askAI(userMsg, products);

    setMessages((prev) => [...prev, { from: "bot", text: botReply }]);
    setLoading(false);
  };

  return (
    <div className="mt-4 bg-white rounded-xl shadow-md border flex flex-col h-[280px]">
      {/* HEADER */}
      <div className="px-4 py-2 border-b font-semibold text-sm text-gray-800">
        Franchesca · Asistente de ventas
      </div>

      {/* CHAT */}
      <div
        ref={chatRef}
        className="flex-1 p-3 overflow-y-auto space-y-3 text-sm"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[75%] ${
                m.from === "user"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-gray-400 text-xs italic">
            Franchesca está escribiendo…
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="p-2 border-t flex items-center gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-600"
          placeholder="Escribí tu consulta…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
