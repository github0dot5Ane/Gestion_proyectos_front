// src/app/ProtectedRoute.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthStatus } from '../features/auth/authSlice'; // Ajusta la ruta

interface ProtectedRouteProps {
    children: React.ReactElement; // Espera un único elemento React como hijo (ej: <AppLayout />)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const authStatus = useSelector(selectAuthStatus);
    const location = useLocation(); // Para recordar a dónde quería ir el usuario

    // Si aún estamos comprobando el estado inicial (ej. leyendo de localStorage)
    // podríamos mostrar un spinner o nada temporalmente.
    // Aquí asumimos que 'idle' sin token significa no autenticado inicialmente.
    if (authStatus === 'loading') {
        // Opcional: Mostrar un spinner de carga global mientras se verifica
        return <div className='flex justify-center items-center h-screen'><p>Verificando autenticación...</p></div>;
    }


    if (!isAuthenticated) {
        // Redirigir al login si no está autenticado
        // state={{ from: location }} permite redirigir de vuelta después del login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si está autenticado, renderizar el contenido solicitado (ej: AppLayout con Outlet)
    return children;
};

export default ProtectedRoute;