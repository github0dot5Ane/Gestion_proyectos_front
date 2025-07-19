// src/pages/DashboardPage.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice'; // Ajusta la ruta

const DashboardPage: React.FC = () => {
    const user = useSelector(selectCurrentUser);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            {user ? (
                <p className="text-lg">Bienvenido de nuevo, <span className='font-semibold'>{user.nombre}</span>!</p>
            ) : (
                <p>Cargando información del usuario...</p>
            )}

            {/* Aquí podrías añadir componentes que muestren:
                - Resumen de tareas pendientes (RF11)
                - Resumen de proyectos activos (si es RP)
                - Accesos directos para Admins (RF10)
                - etc.
                Usando llamadas a la API y estado de Redux para Proyectos/Tareas
            */}
            <div className='mt-6 p-4 border rounded shadow-sm bg-white'>
                <h2 className='text-xl font-semibold mb-2'>Accesos Rápidos</h2>
                {/* Links placeholder */}
                <ul className='list-disc list-inside space-y-1'>
                    <li>Ver mis Proyectos</li>
                    <li>Ver mis Tareas</li>
                    {user?.admin && <li>Administrar Usuarios</li>}
                </ul>
            </div>
        </div>
    );
};

export default DashboardPage;