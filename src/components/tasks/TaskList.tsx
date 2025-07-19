// src/components/tasks/TaskList.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { Task, TaskStatus } from '../../types';
import { updateTask, deleteTask } from '../../features/tasks/taskSlice';
import { selectIsAdmin, selectCurrentUser } from '../../features/auth/authSlice';
import { selectCurrentProject } from '../../features/projects/projectSlice'; // Para permisos de RP
import TaskFilesModal from './TaskFilesModal'; // Importar el modal

interface TaskListProps {
    tasks: Task[];
    isLoading: boolean; // Estado de carga de la lista
    error?: string | null; // Error al cargar la lista
}

const taskStatuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada', 'Bloqueada']; // Reutilizar

const TaskList: React.FC<TaskListProps> = ({ tasks, isLoading, error }) => {
    const dispatch: AppDispatch = useDispatch();
    const isAdmin = useSelector(selectIsAdmin);
    const currentUser = useSelector(selectCurrentUser);
    const currentProject = useSelector(selectCurrentProject); // Proyecto actual (si estamos en ProjectDetails)

    const [editingTaskId, setEditingTaskId] = useState<number | null>(null); // Para saber qué tarea se edita/elimina

    const [selectedTaskForFiles, setSelectedTaskForFiles] = useState<Task | null>(null); // Tarea cuyo modal de archivos está abierto

    // Determinar permisos (simplificado, backend es la autoridad)
    const canEditTaskDetails = (task: Task): boolean => {
        // Admin o RP del proyecto de la tarea
        return !!currentUser && (isAdmin || (currentProject?.id === task.id_proyecto && currentUser.id === currentProject.id_responsable));
    };
    const canChangeStatus = (task: Task): boolean => {
        // Admin, RP del proyecto, o el usuario asignado a la tarea
        return !!currentUser && (canEditTaskDetails(task) || currentUser.id === task.id_usuario);
    };
    const canDeleteTask = (task: Task): boolean => {
        // Admin o RP del proyecto
        return canEditTaskDetails(task); // Misma lógica que editar detalles
    };


    const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
        setEditingTaskId(taskId);
        dispatch(updateTask({ taskId: String(taskId), taskData: { status: newStatus } }))
            .unwrap()
            .catch(err => alert(`Error al actualizar estado: ${err}`))
            .finally(() => setEditingTaskId(null));
    };

    const handleDelete = (taskId: number) => {
        if (window.confirm('¿Seguro que quieres eliminar esta tarea?')) {
            setEditingTaskId(taskId);
            dispatch(deleteTask(String(taskId)))
                .unwrap()
                .catch(err => alert(`Error al eliminar tarea: ${err}`))
                .finally(() => setEditingTaskId(null));
        }
    };

    if (isLoading) return <div className="text-center p-4">Cargando tareas...</div>;
    if (error) return <div className="text-center p-4 text-red-600">Error al cargar tareas: {error}</div>;
    if (tasks.length === 0) return <div className="text-center p-4 text-gray-500">No hay tareas para mostrar.</div>;

    return (
        <> {/* Necesitamos un Fragment para el modal */}
            {/* Modal de Archivos de Tarea */}
            {selectedTaskForFiles && (
                <TaskFilesModal
                    task={selectedTaskForFiles}
                    onClose={() => setSelectedTaskForFiles(null)}
                />
            )}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                        <li key={task.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                {/* Título y Descripción */}
                                <div className="truncate">
                                    <p className="text-md font-medium text-indigo-600 truncate">{task.titulo}</p>
                                    <p className="text-sm text-gray-600">{task.descripcion || 'Sin descripción'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Asignado a: {task.usuario?.nombre ?? `ID: ${task.id_usuario}`} |
                                        Fechas: {new Date(task.fecha_inicio).toLocaleDateString()} - {new Date(task.fecha_finalizacion).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                                    {/* Selector de Estado */}
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                        disabled={!canChangeStatus(task) || editingTaskId === task.id}
                                        className={`text-xs rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${task.status === 'Completada' ? 'bg-green-100 text-green-800' :
                                            task.status === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                                                task.status === 'Bloqueada' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            } disabled:opacity-60`}
                                    >
                                        {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>

                                    {/* Botón Archivos */}
                                    <button
                                        onClick={() => setSelectedTaskForFiles(task)}
                                        title="Gestionar archivos"
                                        className="text-gray-400 hover:text-indigo-600 text-xs p-1"
                                    >
                                        📎 {/* Icono clip */}
                                    </button>

                                    {/* Botón Editar (llevaría a form/modal - no implementado aquí) */}
                                    {canEditTaskDetails(task) && (
                                        <button title="Editar detalles" className="text-gray-400 hover:text-indigo-600 text-xs">✏️</button>
                                    )}

                                    {/* Botón Eliminar */}
                                    {canDeleteTask(task) && (
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            disabled={editingTaskId === task.id}
                                            title="Eliminar tarea"
                                            className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                            {editingTaskId === task.id && <p className='text-xs text-gray-500 text-right mt-1'>Actualizando...</p>}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default TaskList;