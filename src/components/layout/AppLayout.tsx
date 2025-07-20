import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '../../features/auth/authSlice';
import { AppDispatch } from '../../app/store';

const AppLayout: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const user = useSelector(selectCurrentUser);

    const handleLogout = async () => {
        try {
            console.log("Logging out...");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            dispatch(logout());
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header / Navbar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo y nombre */}
                        <div className="flex items-center">
                            <Link 
                                to="/" 
                                className="flex items-center text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                            >
                                <svg className="h-8 w-8 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                                Gestión Proyectos
                            </Link>
                        </div>

                        {/* Menú de navegación */}
                        <nav className="hidden md:flex items-center space-x-8">
                            <Link 
                                to="/projects" 
                                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Proyectos
                            </Link>
                            <Link 
                                to="/my-tasks" 
                                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Mis Tareas
                            </Link>
                            {user?.admin && (
                                <Link 
                                    to="/admin/users" 
                                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Administración
                                </Link>
                            )}
                        </nav>

                        {/* Área de usuario */}
                        <div className="flex items-center space-x-4">
                            {user && user.nombre && (
                                <div className="hidden md:flex items-center">
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                                        {user.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                        {user.nombre}
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Cerrar Sesión
                                <svg className="ml-1 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} Sistema de Gestión de Proyectos. Todos los derechos reservados.
                        </p>
                        <div className="mt-2 md:mt-0">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                v1.0.0
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AppLayout;
