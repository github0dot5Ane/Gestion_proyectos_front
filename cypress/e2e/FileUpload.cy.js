/// <reference types="cypress" />

describe('FileUpload Component', () => {
  const mockOnUpload = cy.stub().resolves();
  const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
  const mockLargeFile = new File([new ArrayBuffer(MAX_SIZE_BYTES + 1)], 'large.pdf', { type: 'application/pdf' });
  const mockInvalidFile = new File(['content'], 'script.exe', { type: 'application/exe' });

  beforeEach(() => {
    cy.viewport(1024, 768);
    mockOnUpload.reset();
  });

  context('Comportamiento básico', () => {
    it('debe renderizar correctamente', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.contains('Seleccionar Archivos...').should('exist');
      cy.get('input[type="file"]').should('exist');
      cy.get('input[type="file"]').should('not.be.visible');
    });

    it('debe abrir el selector de archivos al hacer clic en el botón', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      const clickStub = cy.stub();
      cy.document().then((doc) => {
        cy.stub(doc.querySelector('input[type="file"]'), 'click').callsFake(clickStub);
      });

      cy.contains('Seleccionar Archivos...').click().then(() => {
        expect(clickStub).to.have.been.calledOnce;
      });
    });
  });

  context('Selección de archivos', () => {
    it('debe mostrar los archivos seleccionados válidos', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockFile], { force: true });
      
      cy.contains('1 archivo(s) seleccionado(s):').should('exist');
      cy.contains('document.pdf').should('exist');
      cy.contains('0.0 KB').should('exist');
      cy.contains('Subir Archivos').should('exist');
    });

    it('debe mostrar error con archivos no permitidos', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockInvalidFile], { force: true });
      
      cy.contains('Tipo de archivo no permitido').should('exist');
      cy.contains('script.exe').should('exist');
      cy.contains('Subir Archivos').should('not.exist');
    });

    it('debe mostrar error con archivos demasiado grandes', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockLargeFile], { force: true });
      
      cy.contains('Archivo demasiado grande').should('exist');
      cy.contains('large.pdf').should('exist');
      cy.contains('Subir Archivos').should('not.exist');
    });

    it('debe permitir selección múltiple de archivos válidos', () => {
      const mockFile2 = new File(['content2'], 'image.jpg', { type: 'image/jpeg' });
      
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockFile, mockFile2], { force: true });
      
      cy.contains('2 archivo(s) seleccionado(s):').should('exist');
      cy.contains('document.pdf').should('exist');
      cy.contains('image.jpg').should('exist');
    });
  });

  context('Subida de archivos', () => {
    it('debe llamar a onUpload con los archivos seleccionados', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockFile], { force: true });
      cy.contains('Subir Archivos').click().then(() => {
        expect(mockOnUpload).to.have.been.calledOnce;
        const files = mockOnUpload.args[0][0];
        expect(files).to.be.instanceOf(FileList);
        expect(files[0].name).to.equal('document.pdf');
      });
    });

    it('debe mostrar mensaje de éxito después de subida exitosa', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockFile], { force: true });
      cy.contains('Subir Archivos').click();
      
      cy.contains('¡1 archivo(s) subido(s) con éxito!').should('exist');
      cy.contains('document.pdf').should('not.exist');
    });

    it('debe mostrar error cuando no hay archivos seleccionados al intentar subir', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} />);
      
      cy.contains('Subir Archivos').should('not.exist');
      // Simulamos intento de subida sin archivos (no debería ser posible en UI real)
      cy.get('button').contains('Subir Archivos').click({ force: true });
      
      cy.contains('No hay archivos seleccionados para subir.').should('exist');
    });
  });

  context('Manejo de errores', () => {
    it('debe mostrar error de servidor cuando la subida falla', () => {
      const errorMessage = 'Error de servidor: 500';
      const rejectedOnUpload = cy.stub().rejects({
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: errorMessage }
        }
      });
      
      cy.mount(<FileUpload onUpload={rejectedOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockFile], { force: true });
      cy.contains('Subir Archivos').click();
      
      cy.contains(errorMessage).should('exist');
    });

    it('debe mostrar error genérico cuando la subida falla sin respuesta', () => {
      const rejectedOnUpload = cy.stub().rejects(new Error('Error de red'));
      
      cy.mount(<FileUpload onUpload={rejectedOnUpload} />);
      
      cy.get('input[type="file"]').selectFile([mockFile], { force: true });
      cy.contains('Subir Archivos').click();
      
      cy.contains('Error al subir los archivos.').should('exist');
      cy.contains('Error de red').should('exist');
    });
  });

  context('Estado deshabilitado', () => {
    it('debe deshabilitar los controles cuando disabled es true', () => {
      cy.mount(<FileUpload onUpload={mockOnUpload} disabled={true} />);
      
      cy.contains('Seleccionar Archivos...').should('be.disabled');
      cy.get('input[type="file"]').should('be.disabled');
    });


  });
});