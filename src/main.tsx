// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { router } from './app/router';
import './styles/index.css';

async function enableMocking() {
  if (typeof window === 'undefined') {
    return;
  }

  // Usar la variable de entorno para decidir si iniciar MSW
  // Convertir el string 'true'/'false' a booleano
  const shouldEnableMSW = import.meta.env.VITE_ENABLE_MSW === 'true';

  if (!shouldEnableMSW) { // Si no está 'true', no iniciar MSW
    console.log("MSW explicitly disabled via VITE_ENABLE_MSW.");
    return;
  }

  // Asegurarse de que también esté en modo desarrollo si se quiere esa restricción adicional
  if (import.meta.env.MODE !== 'development' && shouldEnableMSW) {
    console.warn("MSW is set to be enabled, but it's not development mode. MSW will not start.");
    return;
  }


  console.log("Attempting to start MSW...");
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest(req, print) {
      if (req.url.includes('/api/')) {
        print.warning();
      }
    },
    quiet: false,
  });
}

// Llama a enableMocking y luego renderiza la app
enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </React.StrictMode>,
  );
}).catch(error => {
  console.error("Failed to start MSW:", error);
  // Considera renderizar un mensaje de error o la app sin mocks si falla
  // Renderizar de todas formas para que la app no se rompa completamente:
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </React.StrictMode>,
  );
});