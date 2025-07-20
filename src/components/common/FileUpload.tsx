// src/components/common/FileUpload.tsx
import React, { useState, useRef } from 'react';
import axios from 'axios'; // <- Asegúrate de importar axios si usas AxiosError

const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg'
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface FileUploadProps {
    onUpload: (files: FileList) => Promise<void>;
    disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, disabled }) => {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setSuccessMessage(null);
        const files = event.target.files;

        if (files && files.length > 0) {
            let validationError = null;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!ALLOWED_TYPES.includes(file.type)) {
                    validationError = `Tipo de archivo no permitido: ${file.name} (${file.type}). Permitidos: PDF, DOC/DOCX, JPG.`;
                    break;
                }
                if (file.size > MAX_SIZE_BYTES) {
                    validationError = `Archivo demasiado grande: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB). Máximo: ${MAX_SIZE_MB} MB.`;
                    break;
                }
            }

            if (validationError) {
                setError(validationError);
                setSelectedFiles(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                setSelectedFiles(files);
            }
        } else {
            setSelectedFiles(null);
        }
    };

    const handleUploadClick = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            setError("No hay archivos seleccionados para subir.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await onUpload(selectedFiles);
            setSuccessMessage(`¡${selectedFiles.length} archivo(s) subido(s) con éxito!`);
            setSelectedFiles(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: unknown) {
            console.error("Error en subida:", err);

            let errorMessage = "Error al subir los archivos.";
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    console.error("Respuesta del servidor:", err.response);
                    errorMessage = err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
                } else if (err.request) {
                    console.error("No hubo respuesta del servidor:", err.request);
                    errorMessage = "No se recibió respuesta del servidor.";
                } else {
                    errorMessage = err.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }

            setError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="border border-dashed border-gray-300 rounded-md p-4 space-y-3">
            <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                disabled={disabled || isUploading}
            />

            <button
                type="button"
                onClick={triggerFileInput}
                disabled={disabled || isUploading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-4 rounded border border-gray-300 disabled:opacity-50"
            >
                Seleccionar Archivos...
            </button>

            {selectedFiles && selectedFiles.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1">
                    <p className='font-medium'>{selectedFiles.length} archivo(s) seleccionado(s):</p>
                    <ul className='list-disc list-inside'>
                        {Array.from(selectedFiles).map((file, index) => (
                            <li key={index} className='truncate'>
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {selectedFiles && selectedFiles.length > 0 && (
                <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={disabled || isUploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-3 rounded disabled:opacity-50 flex items-center"
                >
                    {isUploading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    )}
                    {isUploading ? 'Subiendo...' : 'Subir Archivos'}
                </button>
            )}

            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            {successMessage && <p className="text-xs text-green-600 mt-1">{successMessage}</p>}
        </div>
    );
};

export default FileUpload;
