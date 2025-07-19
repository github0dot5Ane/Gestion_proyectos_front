// src/pages/MyTasksPage.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store';
import { fetchTasks, clearTasks, selectAllTasks, selectTasksStatus, selectTasksError } from '../features/tasks/taskSlice';
import TaskList from '../components/tasks/TaskList'; // Reutilizar TaskList

const MyTasksPage: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const tasks = useSelector(selectAllTasks);
    const status = useSelector(selectTasksStatus);
    const error = useSelector(selectTasksError);

    // Cargar tareas asignadas a 'me' al montar
    useEffect(() => {
        dispatch(fetchTasks({ assignedTo: 'me' }));
        // Limpiar al desmontar
        return () => {
            dispatch(clearTasks());
        };
    }, [dispatch]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Mis Tareas Asignadas</h1>

            {/* Usar TaskList para mostrar las tareas */}
            <TaskList
                tasks={tasks}
                isLoading={status === 'loading'}
                error={error}
            />
            {/* Podríamos añadir filtros aquí (por proyecto, por estado) */}
        </div>
    );
};

export default MyTasksPage;