// src/components/layout/AppLayout.tsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '../../features/auth/authSlice'; // Ajusta la ruta si es necesario
import { AppDispatch } from '../../app/store'; // Ajusta la ruta si es necesario

const AppLayout: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    //const navigate = useNavigate();
    const user = useSelector(selectCurrentUser); // Obtener datos del usuario del store

    const handleLogout = async () => {
        try {
            // Opcional: Llamar a la API de logout si existe (POST /api/logout)
            // await axiosInstance.post('/logout'); // Asegúrate de importar axiosInstance
            console.log("Logging out...");
        } catch (error) {
            console.error("Logout failed:", error);
            // Igual despachar la acción de logout en el frontend aunque falle la API
        } finally {
            dispatch(logout());
            // No es necesario navigate aquí si ProtectedRoute maneja la redirección
            // navigate('/login'); // Redirigir a login después del logout
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header / Navbar */}
            <header className="bg-indigo-600 text-white shadow-md">
                <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold">
                        Gestión Proyectos
                    </Link>
                    <div className="flex items-center space-x-4">
                        {user && (
                            <span className="text-sm">Hola, {user.nombre}</span>
                        )}
                        {/* Aquí irían otros enlaces de navegación (Proyectos, Mis Tareas, Admin, etc.) */}
                        <Link to="/projects" className="hover:text-indigo-200">Proyectos</Link>
                        <Link to="/my-tasks" className="hover:text-indigo-200">Mis Tareas</Link>
                        {user?.admin && ( // Confirmar que esta condición existe
                            <Link to="/admin/users" className="hover:text-indigo-200">Admin Usuarios</Link>
                        )}

                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto px-4 py-6">
                {/* El contenido de la ruta hija se renderizará aquí */}
                <Outlet />
            </main>

            {/* Footer (Opcional) */}
            <footer className="bg-gray-200 text-center text-sm py-4 mt-auto">
                © {new Date().getFullYear()} Sistema de Gestión de Proyectos
            </footer>
        </div>
    );
};

export default AppLayout;