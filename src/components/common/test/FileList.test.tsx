/// <reference types="vitest" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileList from '../FileList';
import { vi } from 'vitest';

import { TaskFile } from '../../../types';

// Función helper para crear un archivo simulado con los campos requeridos por TaskFile
const createMockTaskFile = (overrides: Partial<TaskFile> = {}): TaskFile => ({
  id: 1,
  id_tarea: 10,
  nombre_original: 'archivo.pdf',
  nombre_archivo: 'archivo_guardado.pdf',
  ruta: '/archivos/archivo_guardado.pdf',        // ← obligatorio
  tipo_archivo: 'application/pdf',
  tamano: 2048,
  created_at: '2024-01-01T00:00:00Z',             // ← obligatorio
  ...overrides,
});


// Mocks de funciones
const mockOnDownload = vi.fn(() => Promise.resolve());
const mockOnDelete = vi.fn(() => Promise.resolve());
const mockCanDelete = vi.fn(() => true);

describe('FileList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra solo archivos permitidos con íconos correctos', () => {
    const files: TaskFile[] = [
      createMockTaskFile({ id: 1, nombre_original: 'doc1.pdf', tipo_archivo: 'application/pdf' }),
      createMockTaskFile({ id: 2, nombre_original: 'doc2.docx', tipo_archivo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      createMockTaskFile({ id: 3, nombre_original: 'invalido.exe', tipo_archivo: 'application/x-msdownload' }), // no permitido
    ];

    render(
      <FileList
        files={files}
        onDownload={mockOnDownload}
        onDelete={mockOnDelete}
        canDelete={mockCanDelete}
      />
    );

    expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
    expect(screen.getByText('doc2.docx')).toBeInTheDocument();
    expect(screen.queryByText('invalido.exe')).not.toBeInTheDocument();

    expect(screen.getAllByText('📄')[0]).toBeInTheDocument(); // PDF
    expect(screen.getAllByText('📝')[0]).toBeInTheDocument(); // DOCX
  });

  it('llama onDownload al hacer clic en el botón de descarga', async () => {
    const files = [createMockTaskFile({ id: 5, nombre_original: 'descargar.pdf' })];

    render(
      <FileList
        files={files}
        onDownload={mockOnDownload}
        onDelete={mockOnDelete}
        canDelete={mockCanDelete}
      />
    );

    const downloadButton = screen.getByTitle('Descargar');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockOnDownload).toHaveBeenCalledWith(5, 'descargar.pdf');
    });
  });

  it('llama onDelete al confirmar la eliminación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const files = [createMockTaskFile({ id: 7, nombre_original: 'eliminar.pdf' })];

    render(
      <FileList
        files={files}
        onDownload={mockOnDownload}
        onDelete={mockOnDelete}
        canDelete={mockCanDelete}
      />
    );

    const deleteButton = screen.getByTitle('Eliminar');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(7);
    });
  });

  it('muestra mensaje cuando no hay archivos permitidos', () => {
    const files = [createMockTaskFile({ tipo_archivo: 'application/x-msdownload', nombre_original: 'malware.exe' })];

    render(
      <FileList
        files={files}
        onDownload={mockOnDownload}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/no hay archivos permitidos/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error si hay error', () => {
    render(
      <FileList
        files={[]}
        onDownload={mockOnDownload}
        onDelete={mockOnDelete}
        error="Fallo de red"
      />
    );

    expect(screen.getByText(/error al cargar archivos/i)).toBeInTheDocument();
    expect(screen.getByText(/fallo de red/i)).toBeInTheDocument();
  });
});
