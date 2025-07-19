// src/pages/RegisterPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectAuthStatus, selectAuthError, clearAuthError } from '../features/auth/authSlice'; // Importar thunk y selectores
import { AppDispatch } from '../app/store'; // Importar tipo AppDispatch

const RegisterPage: React.FC = () => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [clientError, setClientError] = useState<string | null>(null); // Para errores locales (ej: passwords no coinciden)
    const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Para mostrar mensaje de éxito

    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const authStatus = useSelector(selectAuthStatus);
    const authError = useSelector(selectAuthError); // Error del backend

    const isLoading = authStatus === 'loading';

    // Limpiar errores al montar/desmontar
    useEffect(() => {
        dispatch(clearAuthError());
        return () => {
            // dispatch(clearAuthError()); // Opcional
        };
    }, [dispatch]);

    // Manejar éxito del registro
    useEffect(() => {
        if (authStatus === 'succeeded' && !authError && !isLoading) {
            // Mostrar mensaje y redirigir después de un tiempo
            setShowSuccessMessage(true);
            const timer = setTimeout(() => {
                navigate('/login'); // Redirigir a login después de mostrar mensaje
            }, 3000); // Esperar 3 segundos
            return () => clearTimeout(timer); // Limpiar timer si el componente se desmonta
        }
    }, [authStatus, authError, isLoading, navigate]);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // Limpiar errores previos
        setClientError(null);
        dispatch(clearAuthError());
        setShowSuccessMessage(false);

        // Validación simple de contraseña
        if (password !== confirmPassword) {
            setClientError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 8) { // Ejemplo: mínimo 8 caracteres (debería coincidir con backend)
            setClientError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        console.log('Register attempt with:', { nombre, email, telefono, password });
        dispatch(registerUser({ nombre, email, telefono, password }));
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h2>

                {/* Mensaje de Éxito */}
                {showSuccessMessage && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        ¡Registro exitoso! Serás redirigido a la página de inicio de sesión.
                    </div>
                )}

                {/* Mostrar Error (del Cliente o del Backend) */}
                {(clientError || (authStatus === 'failed' && authError)) && !showSuccessMessage && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {clientError || authError}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input type="text" id="name" name="name" required value={nombre} onChange={e => setNombre(e.target.value)} disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            placeholder="Tu Nombre Completo" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="email" name="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            placeholder="tu@email.com" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className='text-xs text-gray-500'>(Opcional)</span></label>
                        <input type="tel" id="phone" name="phone" value={telefono} onChange={e => setTelefono(e.target.value)} disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            placeholder="Tu número de teléfono" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input type="password" id="password" name="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            placeholder="Mínimo 8 caracteres" />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            placeholder="Repite la contraseña" />
                    </div>

                    <button type="submit" disabled={isLoading || showSuccessMessage}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex justify-center items-center">
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /* SVG Spinner */></svg>
                        ) : (
                            'Registrarse'
                        )}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    ¿Ya tienes cuenta?{' '}
                    <Link
                        to="/login"
                        className={`font-medium text-indigo-600 hover:text-indigo-500 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                        onClick={() => dispatch(clearAuthError())} // Limpiar error al navegar a login
                    >
                        Inicia Sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;