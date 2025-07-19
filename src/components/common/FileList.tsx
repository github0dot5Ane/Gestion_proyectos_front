// src/components/common/FileList.tsx
import React, { useState } from 'react';
import { ProjectFile, TaskFile } from '../../types'; // Usar tipo unión o genérico si es necesario

// Helper para obtener un icono simple basado en tipo
const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄'; // PDF
    if (mimeType.includes('word')) return '📝'; // DOC/DOCX
    if (mimeType.includes('image')) return '🖼️'; // JPG/Image
    return '📁'; // Default
};

interface FileListProps {
    files: (ProjectFile | TaskFile)[];
    onDownload: (fileId: number, filename: string) => Promise<void>;
    onDelete: (fileId: number) => Promise<void>;
    canDelete?: (file: ProjectFile | TaskFile) => boolean; // Función para determinar si se puede borrar
    isLoading?: boolean; // Para indicar carga/eliminación
    error?: string | null;
}

const FileList: React.FC<FileListProps> = ({ files, onDownload, onDelete, canDelete, isLoading, error }) => {
    const [processingId, setProcessingId] = useState<number | null>(null); // ID del archivo descargando/eliminando

    const handleDownloadClick = async (fileId: number, filename: string) => {
        setProcessingId(fileId);
        try {
            await onDownload(fileId, filename);
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(`Error al descargar: ${err.message || 'Error desconocido'}`);
            } else if (typeof err === 'string') {
                alert(`Error al descargar: ${err || 'Error desconocido'}`);
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteClick = async (fileId: number) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar este archivo?`)) {
            setProcessingId(fileId);
            try {
                await onDelete(fileId);
                // La actualización de la lista la maneja el componente padre
            } catch (err: unknown) {
                if (err instanceof Error) {
                    alert(`Error al eliminar: ${err.message || 'Error desconocido'}`);
                } else if (typeof err === 'string') {
                    alert(`Error al eliminar: ${err || 'Error desconocido'}`);
                }
            } finally {
                setProcessingId(null);
            }
        }
    };

    if (isLoading) return <p className="text-sm text-gray-500">Cargando archivos...</p>;
    if (error) return <p className="text-sm text-red-500">Error al cargar archivos: {error}</p>;
    if (!files || files.length === 0) return <p className="text-sm text-gray-500">No hay archivos asociados.</p>;

    return (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {files.map((file) => {
                const showDelete = canDelete ? canDelete(file) : false; // Determinar si se puede borrar
                const isProcessing = processingId === file.id;
                return (
                    <li key={file.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm hover:bg-gray-50">
                        <div className="w-0 flex-1 flex items-center">
                            <span className='mr-2 text-xl'>{getFileIcon(file.tipo_archivo)}</span>
                            <span className="ml-2 flex-1 w-0 truncate">{file.nombre_original}</span>
                            <span className='ml-2 text-gray-400 text-xs'>({(file.tamano ? file.tamano / 1024 : 0).toFixed(1)} KB)</span>
                        </div>
                        <div className="ml-4 flex-shrink-0 space-x-2">
                            <button
                                onClick={() => handleDownloadClick(file.id, file.nombre_original)}
                                disabled={isProcessing}
                                className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                                title="Descargar"
                            >
                                {isProcessing ? '...' : '↓'}
                            </button>
                            {showDelete && (
                                <button
                                    onClick={() => handleDeleteClick(file.id)}
                                    disabled={isProcessing}
                                    className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                                    title="Eliminar"
                                >
                                    {isProcessing ? '...' : '🗑️'}
                                </button>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default FileList;