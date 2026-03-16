import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    age: "",
    phone: "",
    mail: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("clientes_app")
        .select("name, age, phone, mail")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ Error cargando perfil:", error.message);
        return;
      }

      if (data) {
        setProfile({
          name: data.name || "",
          age: data.age?.toString() || "",
          phone: data.phone || "",
          mail: data.mail || "",
        });
      }
    };

    loadProfile();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("clientes_app")
      .update({
        name: profile.name,
        age: profile.age ? parseInt(profile.age) : null,
        phone: profile.phone,
        mail: profile.mail,
      })
      .eq("id", user.id);

    if (error) {
      alert("❌ Error al guardar perfil: " + error.message);
      return;
    }

    await refreshUser();
    alert("✅ Perfil actualizado correctamente");
  };

  const changePassword = async () => {
    if (!user) return;

    if (!newPassword || !confirmPassword) {
      alert("⚠️ Completa ambos campos de contraseña");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("⚠️ Las contraseñas no coinciden");
      return;
    }

    const { error } = await supabase
      .from("clientes_app")
      .update({
        password: newPassword,
        password_changed: true,
      })
      .eq("id", user.id);

    if (error) {
      alert("❌ Error al cambiar contraseña: " + error.message);
      return;
    }

    await refreshUser();
    alert("✅ Contraseña actualizada correctamente");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const enabled = saved === "dark" || (!saved && prefersDark);
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    document.documentElement.classList.toggle("dark", newValue);
    localStorage.setItem("theme", newValue ? "dark" : "light");
  };

  return (
    <div className="max-w-lg mx-auto p-6 rounded shadow space-y-4 mt-6 bg-white dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-xl font-bold">⚙️ Configuración de Usuario</h2>

      <input
        placeholder="Nombre"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600"
      />

      <input
        placeholder="Edad"
        value={profile.age}
        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
        className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600"
      />

      <input
        placeholder="Teléfono"
        value={profile.phone}
        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600"
      />

      <input
        placeholder="Correo electrónico"
        type="email"
        value={profile.mail}
        onChange={(e) => setProfile({ ...profile, mail: e.target.value })}
        className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600"
      />

      <button
        onClick={saveProfile}
        className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded w-full"
      >
        Guardar perfil
      </button>

      <hr className="my-4 border-gray-300 dark:border-gray-600" />

      <h3 className="text-lg font-semibold">🔑 Cambiar contraseña</h3>

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600"
      />

      <input
        type="password"
        placeholder="Confirmar nueva contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600"
      />

      <button
        onClick={changePassword}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Cambiar contraseña
      </button>

      <div className="flex items-center justify-between mt-4 p-3 border rounded dark:border-gray-600">
        <span className="font-medium">🌙 Modo oscuro</span>
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
            darkMode ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform bg-white rounded-full transition ${
              darkMode ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded w-full mt-2"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
