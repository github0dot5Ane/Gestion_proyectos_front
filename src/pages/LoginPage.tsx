// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthStatus, selectAuthError, selectIsAuthenticated, clearAuthError } from '../features/auth/authSlice'; // Importar thunk y selectores
import { AppDispatch } from '../app/store'; // Importar tipos del store

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // Para obtener la ruta previa si venimos de ProtectedRoute
    const authStatus = useSelector(selectAuthStatus);
    const authError = useSelector(selectAuthError);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const isLoading = authStatus === 'loading';
    const from = location.state?.from?.pathname || "/"; // Ruta a la que ir después del login

    // Limpiar errores al montar/desmontar o al cambiar de ruta
    useEffect(() => {
        // Limpia el error cuando el componente se monta, por si quedó de antes
        dispatch(clearAuthError());
        return () => {
            // Opcional: limpiar al desmontar si prefieres
            // dispatch(clearAuthError());
        };
    }, [dispatch]);

    // Redirigir si el login es exitoso
    useEffect(() => {
        if (isAuthenticated) { // Chequear si ya estamos autenticados (puede ser por el estado inicial o después del login)
            console.log(`Login successful, navigating to: ${from}`);
            navigate(from, { replace: true }); // replace: true para no poder volver al login con el botón atrás
        }
    }, [isAuthenticated, navigate, from]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Limpiar error previo antes de intentar de nuevo
        dispatch(clearAuthError());
        console.log('Login attempt with:', { email, password });
        dispatch(loginUser({ email, password }));
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>

                {/* Mostrar Error de Autenticación */}
                {authStatus === 'failed' && authError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {authError}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading} // Deshabilitar input mientras carga
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading} // Deshabilitar input mientras carga
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            placeholder="********"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading} // Deshabilitar botón mientras carga
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex justify-center items-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    ¿No tienes cuenta?{' '}
                    <Link
                        to="/register"
                        className={`font-medium text-indigo-600 hover:text-indigo-500 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                        onClick={() => dispatch(clearAuthError())} // Limpiar error al navegar a registro
                    >
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;