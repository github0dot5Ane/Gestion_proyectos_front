// src/components/common/FileUpload.test.tsx
import { render, screen } from '@testing-library/react';
import FileUpload from '../FileUpload';
import { vi } from 'vitest';

describe('FileUpload', () => {
  const mockUpload = vi.fn();

  beforeEach(() => {
    mockUpload.mockReset();
  });

  it('renderiza correctamente el botón', () => {
    render(<FileUpload onUpload={mockUpload} />);
    expect(screen.getByText(/Seleccionar Archivos/i)).toBeInTheDocument();
  });


  it('desactiva el input y botones si está en estado disabled', () => {
    render(<FileUpload onUpload={mockUpload} disabled />);
    const seleccionarBtn = screen.getByText(/Seleccionar Archivos/i);
    expect(seleccionarBtn).toBeDisabled();
  });
});
