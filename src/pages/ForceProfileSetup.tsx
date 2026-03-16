import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";

export default function ForceProfileSetup() {
  const { user, refreshUser, logout } = useAuth();

  const [mail, setMail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    setMail(user.mail || "");
    setPhone(user.phone || "");
  }, [user]);

  const validate = () => {
    if (!mail.trim()) return "Completá el correo electrónico";
    if (!/\S+@\S+\.\S+/.test(mail.trim())) return "Ingresá un correo válido";

    if (!phone.trim() || phone.trim() === "0") {
      return "Completá el teléfono";
    }

    if (!newPassword.trim()) return "Ingresá una nueva contraseña";
    if (newPassword.trim().length < 4) {
      return "La contraseña debe tener al menos 4 caracteres";
    }

    if (newPassword !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }

    return "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const { error: updateError } = await supabase
        .from("clientes_app")
        .update({
          mail: mail.trim(),
          phone: phone.trim(),
          password: newPassword.trim(),
          password_changed: true,
        })
        .eq("id", user.id);

      if (updateError) {
        setError("Error al guardar los datos: " + updateError.message);
        return;
      }

      await refreshUser();
      setSuccess("Datos actualizados correctamente");

      setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (err) {
      setError("Ocurrió un error al actualizar los datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-red-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-6">
          <img
            src="/image.png"
            alt="VaFood Logo"
            className="mx-auto h-20 w-20 rounded-full shadow-md"
          />

          <h1 className="text-2xl font-bold text-red-700 mt-4">
            Completá tu acceso
          </h1>

          <p className="text-sm text-gray-600 mt-2">
            Antes de usar la app necesitás completar tu correo, teléfono y
            cambiar tu contraseña.
          </p>

          {user?.name && (
            <p className="text-sm text-gray-500 mt-2">
              Usuario: <span className="font-semibold">{user.username}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </div>
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

          <div>
            <label className="text-xs text-gray-600 font-medium ml-1">
              Teléfono
            </label>
            <input
              type="text"
              placeholder="Tu teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-red-600 outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium ml-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-red-600 outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium ml-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              placeholder="Repetí la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-red-600 outline-none text-gray-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2.5 rounded-lg font-semibold transition shadow"
          >
            {loading ? "Guardando..." : "Guardar y continuar"}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-lg font-semibold transition"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
