// src/pages/MyTasksPage.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store';
import { fetchTasks, clearTasks, selectAllTasks, selectTasksStatus, selectTasksError } from '../features/tasks/taskSlice';
import TaskList from '../components/tasks/TaskList';

const MyTasksPage: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const tasks = useSelector(selectAllTasks);
    const status = useSelector(selectTasksStatus);
    const error = useSelector(selectTasksError);

    useEffect(() => {
        dispatch(fetchTasks({ assignedTo: 'me' }));
        return () => {
            dispatch(clearTasks());
        };
    }, [dispatch]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Encabezado - Ahora con los mismos tamaños que Gestión de Usuarios */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mis Tareas Asignadas</h1> {/* Cambiado de text-2xl a text-3xl */}
                        <p className="mt-2 text-base text-gray-500"> {/* Cambiado de text-sm a text-base */}
                            Lista de todas las tareas asignadas a ti
                        </p>
                    </div>
                    {/* Espacio para futuros filtros */}
                    <div className="flex space-x-2">
                        {/* Puedes añadir filtros aquí */}
                    </div>
                </div>
            </div>

            {/* Mensaje de error - Tamaños igualados */}
            {status === 'failed' && error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700"> {/* Mantenemos text-sm para errores */}
                                <span className="font-medium">Error:</span> {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenido principal */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {status === 'loading' && tasks.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <>
                        <TaskList
                            tasks={tasks}
                            isLoading={status === 'loading'}
                            error={error}
                        />
                        {tasks.length === 0 && status !== 'loading' && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="mt-2 text-lg font-medium text-gray-900">No hay tareas asignadas</h3> {/* Cambiado de text-sm a text-lg */}
                                <p className="mt-1 text-base text-gray-500"> {/* Cambiado de text-sm a text-base */}
                                    No se encontraron tareas asignadas a tu usuario.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyTasksPage;