import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Capturar errores globales
if (typeof window !== 'undefined') {
  window.addEventListener('error', function(event) {
    console.error('Error global capturado:', event.error)
    console.error('En:', event.filename, 'línea', event.lineno, 'columna', event.colno)
    
    // Mostrar en pantalla para diagnóstico
    const errorDiv = document.getElementById('global-error')
    if (!errorDiv) {
      const div = document.createElement('div')
      div.id = 'global-error'
      div.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ef4444;
        color: white;
        padding: 1rem;
        font-family: monospace;
        z-index: 9999;
        border-bottom: 2px solid #7f1d1d;
      `
      div.innerHTML = `
        <strong>Error JavaScript:</strong> ${event.error?.message || event.message}
        <br><small>Ver consola (F12) para detalles</small>
        <button onclick="this.parentElement.remove()" style="float:right; background:white; color:#ef4444; border:none; padding:0.25rem 0.5rem; border-radius:0.25rem; cursor:pointer;">
          Cerrar
        </button>
      `
      document.body.appendChild(div)
    }
  })
  
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Promesa rechazada no manejada:', event.reason)
  })
}

// Componente de diagnóstico simple
function DiagnosticApp() {
  return React.createElement('div', {
    style: {
      backgroundColor: '#0f172a',
      color: 'white',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'monospace'
    }
  }, [
    React.createElement('h1', { 
      key: 'title',
      style: { color: '#60a5fa', fontSize: '2rem', marginBottom: '1rem' }
    }, '🎯 Trivia UNITEPC - Diagnóstico React'),
    React.createElement('p', { key: 'status' }, 'React está funcionando correctamente.'),
    React.createElement('button', {
      key: 'button',
      onClick: () => window.location.href = '/',
      style: {
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        marginTop: '1rem'
      }
    }, 'Volver a la aplicación')
  ])
}

try {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  
  // Para diagnóstico rápido, cambiar a DiagnosticApp
  // root.render(<React.StrictMode><DiagnosticApp /></React.StrictMode>)
  
  // Aplicación principal con ErrorBoundary
  root.render(<React.StrictMode><App /></React.StrictMode>)
  
  console.log('✅ React aplicación montada correctamente')
} catch (error) {
  console.error('❌ Error crítico al renderizar React:', error)
  
  // Mostrar error en pantalla
  const rootEl = document.getElementById('root')
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="background-color: #0f172a; color: white; padding: 2rem; font-family: monospace; min-height: 100vh;">
        <h1 style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;">❌ Error crítico de React</h1>
        <div style="background-color: #1e293b; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem;">
          <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Detalles del error:</h2>
          <pre style="color: #f87171; font-size: 0.875rem; white-space: pre-wrap;">${error.toString()}</pre>
          ${error.stack ? `<h3 style="font-size: 1.1rem; margin-top: 1rem;">Stack trace:</h3><pre style="font-size: 0.75rem; color: #94a3b8;">${error.stack}</pre>` : ''}
        </div>
        <p>Verifica la consola del navegador (F12 → Console) para más detalles.</p>
        <button onclick="window.location.reload()" style="background-color: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; margin-right: 1rem;">
          Recargar página
        </button>
        <button onclick="document.getElementById('root').innerHTML = ''; window.location.href = '/?diagnostic=simple'" style="background-color: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem;">
          Modo diagnóstico
        </button>
      </div>
    `
  }
}