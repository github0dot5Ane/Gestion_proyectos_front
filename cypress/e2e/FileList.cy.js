/// <reference types="cypress" />

describe('FileList Component', () => {
  const mockFiles = [
    {
      id: 1,
      nombre_original: 'document.pdf',
      tipo_archivo: 'application/pdf',
      tamano: 1024
    },
    {
      id: 2,
      nombre_original: 'image.jpg',
      tipo_archivo: 'image/jpeg',
      tamano: 2048
    },
    {
      id: 3,
      nombre_original: 'invalid.exe',
      tipo_archivo: 'application/exe',
      tamano: 3072
    }
  ];

  const mockOnDownload = cy.stub().resolves();
  const mockOnDelete = cy.stub().resolves();


  beforeEach(() => {
    cy.viewport(1024, 768);
  });

  context('Estado de carga', () => {
    it('debe mostrar un spinner cuando isLoading es true', () => {
      cy.mount(
        <FileList 
          isLoading={true}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />
      );

      cy.get('.animate-spin').should('exist');
    });
  });

  context('Estado de error', () => {
    it('debe mostrar un mensaje de error cuando hay un error', () => {
      const errorMessage = 'Error al cargar archivos';
      
      cy.mount(
        <FileList 
          error={errorMessage}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />
      );

      cy.get('[data-testid="error-message"]').should('contain', errorMessage);
      cy.get('.bg-red-50').should('exist');
    });
  });

  context('Sin archivos', () => {
    it('debe mostrar un mensaje cuando no hay archivos', () => {
      cy.mount(
        <FileList 
          files={[]}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />
      );

      cy.contains('No hay archivos asociados').should('exist');
    });

    it('debe mostrar un mensaje cuando solo hay archivos no permitidos', () => {
      cy.mount(
        <FileList 
          files={[mockFiles[2]]} // Solo el archivo inválido
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />
      );

      cy.contains('No hay archivos permitidos').should('exist');
    });
  });

  context('Con archivos válidos', () => {
    beforeEach(() => {
      cy.mount(
        <FileList 
          files={mockFiles}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
          canDelete={mockCanDelete}
        />
      );
    });

    it('debe mostrar solo los archivos permitidos', () => {
      cy.get('li').should('have.length', 2); // Solo PDF y JPG
      cy.contains('document.pdf').should('exist');
      cy.contains('image.jpg').should('exist');
      cy.contains('invalid.exe').should('not.exist');
    });

    it('debe mostrar los iconos correctos para cada tipo de archivo', () => {
      cy.contains('document.pdf').parent().contains('📄').should('exist');
      cy.contains('image.jpg').parent().contains('🖼️').should('exist');
    });

    it('debe mostrar la información del archivo correctamente', () => {
      cy.contains('document.pdf').should('exist');
      cy.contains('application/pdf').should('exist');
      cy.contains('1.0 KB').should('exist');
    });

    it('debe llamar a onDownload al hacer clic en el botón de descarga', () => {
      cy.contains('document.pdf').parent()
        .find('[title="Descargar"]')
        .click()
        .then(() => {
          expect(mockOnDownload).to.have.been.calledWith(1, 'document.pdf');
        });
    });

    it('debe mostrar el botón de eliminar solo cuando canDelete devuelve true', () => {
      // Archivo 1 - canDelete devuelve true
      cy.contains('document.pdf').parent()
        .find('[title="Eliminar"]')
        .should('exist');

      // Archivo 2 - canDelete devuelve false
      cy.contains('image.jpg').parent()
        .find('[title="Eliminar"]')
        .should('not.exist');
    });

    it('debe mostrar un diálogo de confirmación y llamar a onDelete al confirmar', () => {
      cy.stub(window, 'confirm').returns(true);
      
      cy.contains('document.pdf').parent()
        .find('[title="Eliminar"]')
        .click()
        .then(() => {
          expect(window.confirm).to.have.been.calledWith('¿Estás seguro de que quieres eliminar este archivo?');
          expect(mockOnDelete).to.have.been.calledWith(1);
        });
    });

    it('no debe llamar a onDelete si el usuario cancela el diálogo', () => {
      cy.stub(window, 'confirm').returns(false);
      
      cy.contains('document.pdf').parent()
        .find('[title="Eliminar"]')
        .click()
        .then(() => {
          expect(mockOnDelete).not.to.have.been.called;
        });
    });

    it('debe deshabilitar los botones durante las operaciones', () => {
      const processingFileList = [
        { ...mockFiles[0], id: 99 }
      ];

      cy.mount(
        <FileList 
          files={processingFileList}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />
      );

      // Simular que estamos procesando el archivo con id 99
      cy.contains('document.pdf').parent()
        .find('[title="Descargar"]')
        .click()
        .should('be.disabled');
    });
  });
});