import React from "react";
import { useAuth } from "../../context/AuthContext";

const B2BSettings: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>

      <p className="text-gray-700 mb-6">
        Usuario actual: <strong>{user?.username}</strong>
      </p>

      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default B2BSettings;
