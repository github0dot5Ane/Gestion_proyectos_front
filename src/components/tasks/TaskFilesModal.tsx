// src/components/tasks/TaskFilesModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskFile } from '../../types';
import { getTaskFiles, uploadTaskFiles, deleteTaskFile, downloadTaskFile } from '../../api/fileService';
import FileUpload from '../common/FileUpload';
import FileList from '../common/FileList';
import { useSelector } from 'react-redux';
import { selectIsAdmin, selectCurrentUser } from '../../features/auth/authSlice';
import { selectCurrentProject } from '../../features/projects/projectSlice'; // Para permiso de RP

interface TaskFilesModalProps {
    task: Task;
    onClose: () => void;
}

const TaskFilesModal: React.FC<TaskFilesModalProps> = ({ task, onClose }) => {
    const [files, setFiles] = useState<TaskFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = useSelector(selectIsAdmin);
    const currentUser = useSelector(selectCurrentUser);
    const currentProject = useSelector(selectCurrentProject); // Asume que estamos en contexto de proyecto

    // Permisos: Admin, RP del proyecto, o usuario asignado a la tarea
    const canManageTaskFiles = currentUser && (
        isAdmin ||
        (currentProject?.id === task.id_proyecto && currentUser.id === currentProject.id_responsable) ||
        currentUser.id === task.id_usuario
    );

    const loadFiles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedFiles = await getTaskFiles(String(task.id));
            setFiles(fetchedFiles);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "Error al cargar archivos de tarea.");

            } else if (typeof err === 'string') {
                alert(`Error al eliminar: ${err || 'Error desconocido'}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [task.id]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleUpload = async (selectedFiles: FileList) => {
        if (!canManageTaskFiles) return;
        try {
            await uploadTaskFiles(String(task.id), selectedFiles);
            loadFiles(); // Recargar lista
        } catch (err: unknown) {
            console.error("Task file upload failed:", err);
            throw err; // Relanzar para FileUpload
        }
    };

    const handleDelete = async (fileId: number) => {
        if (!canManageTaskFiles) return;
        try {
            await deleteTaskFile(String(task.id), fileId);
            setFiles(prev => prev.filter(f => f.id !== fileId)); // Actualizar localmente
        } catch (err: unknown) {
            console.error("Task file delete failed:", err);
            throw err; // Relanzar para FileList
        }
    };

    const handleDownload = async (fileId: number, filename: string) => {
        try {
            await downloadTaskFile(String(task.id), fileId, filename);
        } catch (err: unknown) {
            console.error("Task file download failed:", err);
            throw err; // Relanzar para FileList
        }
    };


    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-semibold">Archivos de Tarea: "{task.titulo}"</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">×</button>
                </div>

                {/* Sección de Subida */}
                {canManageTaskFiles && (
                    <div className='mb-4'>
                        <FileUpload onUpload={handleUpload} disabled={isLoading} />
                    </div>
                )}


                {/* Sección de Lista */}
                <h4 className='text-md font-medium mb-2'>Archivos Adjuntos</h4>
                <FileList
                    files={files}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    canDelete={() => canManageTaskFiles ?? false}
                    isLoading={isLoading}
                    error={error}
                />

                <div className='text-right mt-4'>
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded-md text-sm">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskFilesModal;