import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../config/supabase";
import bcrypt from "bcryptjs";

export default function ResetPassword() {
  const { token } = useParams();
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      const { data, error } = await supabase
        .from("reset_tokens")
        .select("id, user_id, expires_at, used")
        .eq("token", token)
        .single();

      if (!data || error) return setErr("Token inválido");

      if (data.used) return setErr("Este enlace ya fue usado");

      if (new Date(data.expires_at) < new Date())
        return setErr("El enlace venció");

      setValid(true);
    };

    validateToken();
  }, [token]);

  const handleReset = async () => {
    if (password !== confirm) return setErr("Las contraseñas no coinciden");

    const hashed = await bcrypt.hash(password, 10);

    // obtener usuario
    const { data: tokenRow } = await supabase
      .from("reset_tokens")
      .select("user_id")
      .eq("token", token)
      .single();

    await supabase
      .from("usuarios_app")
      .update({ password: hashed })
      .eq("id", tokenRow.user_id);

    // marcar token como usado
    await supabase
      .from("reset_tokens")
      .update({ used: true })
      .eq("token", token);

    setDone(true);
  };

  if (!valid && !err) return <p>Cargando...</p>;

  if (err)
    return (
      <div className="p-6 text-center text-red-600 font-bold text-lg">
        {err}
      </div>
    );

  if (done)
    return (
      <div className="p-6 text-center text-green-700 text-xl font-semibold">
        ✔ Contraseña actualizada. Ya podés iniciar sesión.
      </div>
    );

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Restablecer contraseña</h2>

      <input
        type="password"
        placeholder="Nueva contraseña"
        className="w-full border p-2 rounded mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirmar contraseña"
        className="w-full border p-2 rounded mb-4"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}

      <button
        onClick={handleReset}
        className="w-full bg-red-700 text-white py-2 rounded"
      >
        Guardar nueva contraseña
      </button>
    </div>
  );
}
