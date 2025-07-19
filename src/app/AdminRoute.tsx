// src/app/AdminRoute.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectIsAdmin, selectAuthStatus } from '../features/auth/authSlice';

interface AdminRouteProps {
    children: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isAdminUser = useSelector(selectIsAdmin);
    const authStatus = useSelector(selectAuthStatus);
    const location = useLocation();

    if (authStatus === 'loading') {
        return <div className='flex justify-center items-center h-screen'><p>Verificando...</p></div>;
    }

    if (!isAuthenticated) {
        // No autenticado -> redirigir a login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdminUser) {
        // Autenticado pero NO admin -> redirigir al dashboard (o mostrar página de "Acceso Denegado")
        // console.warn("Acceso denegado: Ruta solo para administradores.");
        return <Navigate to="/" replace />; // O a una página específica /unauthorized
    }

    // Autenticado y es Admin -> permitir acceso
    return children;
};

export default AdminRoute;