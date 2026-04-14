import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Enviar a un servicio de logging si es necesario
    if (typeof window !== 'undefined') {
      window._capturedError = { error: error.toString(), errorInfo }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#0f172a',
          color: 'white',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }}>
            ⚠️ Error en la aplicación
          </h1>
          
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Detalles del error:</h2>
            <pre style={{ 
              color: '#f87171',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
            
            {this.state.errorInfo && (
              <>
                <h3 style={{ fontSize: '1.1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>Stack trace:</h3>
                <pre style={{ 
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                marginRight: '1rem'
              }}
            >
              Recargar página
            </button>
            
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Intentar nuevamente
            </button>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#334155', borderRadius: '0.5rem' }}>
            <p>Si el error persiste, verifica la consola del navegador (F12) para más detalles.</p>
            <p>Error relacionado con: "{this.state.error && this.state.error.toString()}"</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary