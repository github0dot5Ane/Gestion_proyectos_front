// src/components/common/FileList.tsx
import React, { useState } from 'react';
import { ProjectFile, TaskFile } from '../../types';

// Tipos de archivo permitidos
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg'
];

// Helper para obtener icono y verificar tipo permitido
const getFileInfo = (mimeType: string) => {
    const isAllowed = ALLOWED_FILE_TYPES.includes(mimeType.toLowerCase());
    
    if (!isAllowed) return { icon: '⛔', allowed: false };
    
    if (mimeType.includes('pdf')) return { icon: '📄', allowed: true };
    if (mimeType.includes('word') || mimeType.includes('msword') || mimeType.includes('wordprocessingml')) 
        return { icon: '📝', allowed: true };
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) 
        return { icon: '🖼️', allowed: true };
    
    return { icon: '📁', allowed: false };
};

interface FileListProps {
    files?: (ProjectFile | TaskFile)[];
    onDownload: (fileId: number, filename: string) => Promise<void>;
    onDelete: (fileId: number) => Promise<void>;
    canDelete?: (file: ProjectFile | TaskFile) => boolean;
    isLoading?: boolean;
    error?: string | null;
}

const FileList: React.FC<FileListProps> = ({
    files = [], // ✅ Valor por defecto agregado aquí
    onDownload,
    onDelete,
    canDelete,
    isLoading,
    error
}) => {
    const [processingId, setProcessingId] = useState<number | null>(null);

    const allowedFiles = files.filter(file => {
        const fileInfo = getFileInfo(file.tipo_archivo);
        return fileInfo.allowed;
    });

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

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">Error al cargar archivos: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!files || allowedFiles.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2 text-sm">
                    {files?.length > 0 
                        ? "No hay archivos permitidos (solo PDF, DOC/DOCX, JPG)" 
                        : "No hay archivos asociados"}
                </p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {allowedFiles.map((file) => {
                const showDelete = canDelete ? canDelete(file) : false;
                const isProcessing = processingId === file.id;
                const fileInfo = getFileInfo(file.tipo_archivo);

                return (
                    <li key={file.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center min-w-0">
                            <span className="text-xl mr-3">{fileInfo.icon}</span>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-800 truncate">
                                    {file.nombre_original}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {file.tipo_archivo} • {(file.tamano ? file.tamano / 1024 : 0).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex space-x-3">
                            <button
                                onClick={() => handleDownloadClick(file.id, file.nombre_original)}
                                disabled={isProcessing}
                                className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                title="Descargar"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                            {showDelete && (
                                <button
                                    onClick={() => handleDeleteClick(file.id)}
                                    disabled={isProcessing}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                    title="Eliminar"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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
