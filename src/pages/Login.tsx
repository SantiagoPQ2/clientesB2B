import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mail, setMail] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "recover" | "success">("login");

  // ============================================================
  // 🔹 LOGIN NORMAL
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);

    if (!ok) {
      setError("❌ Usuario o contraseña incorrectos");
    } else {
      window.location.href = "/";
    }
  };

  // ============================================================
  // 🔹 RECUPERAR CONTRASEÑA → EDGE FUNCTION
  // ============================================================
  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mail) {
      setError("⚠️ Ingresá tu correo para recuperar la contraseña");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enviar_reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: mail }),
        }
      );

      if (!res.ok) {
        setError("❌ No existe ese correo en nuestros registros");
        return;
      }

      setMode("success");
      setError("");
    } catch (err) {
      setError("❌ Error enviando el correo");
    }
  };

  // ============================================================
  // 🔹 ESTILOS Y UI
  // ============================================================
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-100 to-red-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-[380px] border border-gray-200 transition-all hover:shadow-xl duration-300">

        {/* LOGO + TITULO */}
        <div className="text-center mb-6">
          <img
            src="/image.png"
            alt="VaFood Logo"
            className="mx-auto h-20 w-20 rounded-full shadow-md"
          />

          <h2 className="text-3xl font-bold text-red-700 mt-4 tracking-tight">
            {mode === "login"
              ? "Bienvenido"
              : mode === "recover"
              ? "Recuperar Contraseña"
              : "Correo enviado"}
          </h2>

          {mode !== "success" && (
            <p className="text-gray-500 mt-1 text-sm">
              Accedé a tu cuenta de VaFood
            </p>
          )}

          {mode === "success" && (
            <p className="text-gray-600 text-sm">
              Revisá tu correo electrónico para continuar.
            </p>
          )}
        </div>

        {/* ============================ */}
        {/*    FORMULARIO LOGIN         */}
        {/* ============================ */}

        {mode === "login" && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <div>
              <label className="text-xs text-gray-600 font-medium ml-1">
                Usuario
              </label>
              <input
                type="text"
                placeholder="Tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-red-600 outline-none text-gray-800"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 font-medium ml-1">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-red-600 outline-none text-gray-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold transition shadow"
            >
              Entrar
            </button>

            <p className="text-center text-sm text-gray-700 mt-3">
              ¿Olvidaste tu contraseña?{" "}
              <button
                type="button"
                className="text-red-700 font-semibold hover:underline"
                onClick={() => {
                  setMode("recover");
                  setError("");
                }}
              >
                Recuperar
              </button>
            </p>
          </form>
        )}

        {/* ============================ */}
        {/* RECUPERAR CONTRASEÑA         */}
        {/* ============================ */}

        {mode === "recover" && (
          <form onSubmit={handleRecover} className="space-y-4 animate-fadeIn">
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <div>
              <label className="text-xs text-gray-600 font-medium ml-1">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="ejemplo@mail.com"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-red-600 outline-none text-gray-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold transition shadow"
            >
              Enviar correo de recuperación
            </button>

            <p className="text-center text-sm text-gray-700 mt-3">
              ¿Recordaste tu contraseña?{" "}
              <button
                type="button"
                className="text-red-700 font-semibold hover:underline"
                onClick={() => {
                  setMode("login");
                  setMail("");
                  setError("");
                }}
              >
                Volver al inicio
              </button>
            </p>
          </form>
        )}

        {/* ============================ */}
        {/*    CORREO ENVIADO (OK)       */}
        {/* ============================ */}

        {mode === "success" && (
          <div className="text-center space-y-4 animate-fadeIn">

            <div className="flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m0 8V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-red-700">
              ¡Correo enviado!
            </h2>

            <p className="text-gray-600 text-sm px-4">
              Te enviamos un correo con las instrucciones para restablecer tu contraseña.
              Revisá tu bandeja de entrada o spam.
            </p>

            <button
              onClick={() => {
                setMode("login");
                setMail("");
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold transition shadow mt-4"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
