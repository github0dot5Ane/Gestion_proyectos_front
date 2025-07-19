// src/components/common/FileUpload.tsx
import React, { useState, useRef } from 'react';

// Tipos de archivo permitidos (debería coincidir con backend y RFs)
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg'];
const MAX_SIZE_MB = 10; // Ejemplo: Límite de tamaño por archivo
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface FileUploadProps {
    onUpload: (files: FileList) => Promise<void>; // Función que llama al servicio API
    disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, disabled }) => {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null); // Limpiar error anterior
        setSuccessMessage(null);
        const files = event.target.files;
        if (files && files.length > 0) {
            // Validación básica
            let validationError = null;
            for (let i = 0; i < files.length; i++) {
                if (!ALLOWED_TYPES.includes(files[i].type)) {
                    validationError = `Tipo de archivo no permitido: ${files[i].name} (${files[i].type}). Permitidos: PDF, DOC/DOCX, JPG.`;
                    break;
                }
                if (files[i].size > MAX_SIZE_BYTES) {
                    validationError = `Archivo demasiado grande: ${files[i].name} (${(files[i].size / 1024 / 1024).toFixed(2)} MB). Máximo: ${MAX_SIZE_MB} MB.`;
                    break;
                }
            }

            if (validationError) {
                setError(validationError);
                setSelectedFiles(null); // Limpiar selección si hay error
                if (fileInputRef.current) fileInputRef.current.value = ""; // Resetear input
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
            await onUpload(selectedFiles); // Llama a la función pasada por props
            setSuccessMessage(`¡${selectedFiles.length} archivo(s) subido(s) con éxito!`);
            setSelectedFiles(null); // Limpiar selección
            if (fileInputRef.current) fileInputRef.current.value = ""; // Resetear input
        } catch (err: unknown) { // <--- Cambiar 'any' por 'unknown'
            console.error("Error en subida:", err); // Loguear el error original para depuración

            // Verificar el tipo de error antes de acceder a 'message'
            let errorMessage = "Error al subir los archivos."; // Mensaje por defecto
            if (err instanceof Error) {
                errorMessage = err.message; // Si es una instancia de Error, usar su mensaje
            } else if (typeof err === 'string') {
                errorMessage = err; // Si el error es solo un string
            }
            // Podrías añadir más chequeos para otros tipos de error si es necesario

            setError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    // Permite hacer clic en un botón personalizado en lugar del input feo
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="border border-dashed border-gray-300 rounded-md p-4 space-y-3">
            {/* Input oculto real */}
            <input
                type="file"
                multiple // Permitir múltiples archivos
                accept=".pdf,.doc,.docx,.jpg,.jpeg" // Filtro de navegador (no reemplaza validación)
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                disabled={disabled || isUploading}
            />

            {/* Botón visible para seleccionar */}
            <button
                type="button"
                onClick={triggerFileInput}
                disabled={disabled || isUploading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-4 rounded border border-gray-300 disabled:opacity-50"
            >
                Seleccionar Archivos...
            </button>

            {/* Mostrar archivos seleccionados */}
            {selectedFiles && selectedFiles.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1">
                    <p className='font-medium'>{selectedFiles.length} archivo(s) seleccionado(s):</p>
                    <ul className='list-disc list-inside'>
                        {Array.from(selectedFiles).map((file, index) => (
                            <li key={index} className='truncate'>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Botón de Subida */}
            {selectedFiles && selectedFiles.length > 0 && (
                <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={disabled || isUploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-3 rounded disabled:opacity-50 flex items-center"
                >
                    {isUploading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" /* Spinner */></svg>}
                    {isUploading ? 'Subiendo...' : 'Subir Archivos'}
                </button>
            )}

            {/* Mensajes de estado */}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            {successMessage && <p className="text-xs text-green-600 mt-1">{successMessage}</p>}
        </div>
    );
};

export default FileUpload;