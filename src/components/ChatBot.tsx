import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { askAI } from "../services/aiBot";

const ChatBot: React.FC = () => {
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

    const msg = input;
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text: msg }]);
    setLoading(true);

    const reply = await askAI(msg);

    setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    setLoading(false);
  };

  return (
    <div className="mt-4 bg-white rounded-xl shadow-md border flex flex-col h-[300px]">
      <div className="px-4 py-2 border-b font-semibold text-sm">
        Franchesca · Asistente de ventas
      </div>

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
          <div className="text-xs text-gray-400 italic">
            Franchesca está escribiendo…
          </div>
        )}
      </div>

      <div className="border-t p-2 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
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
