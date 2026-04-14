import useAuthStore from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Cliente HTTP personalizado con manejo automático de tokens de autenticación
 */
class ApiClient {
  constructor() {
    this.baseURL = API_URL
  }

  /**
   * Obtiene los headers con autenticación si está disponible
   */
  getHeaders(customHeaders = {}) {
    const token = useAuthStore.getState().token
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...customHeaders
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Maneja la respuesta de fetch
   */
  async handleResponse(response) {
    const data = await response.json().catch(() => null)
    
    if (!response.ok) {
      const error = new Error(data?.message || `HTTP error ${response.status}`)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  }

  /**
   * Método GET
   */
  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options.headers),
      credentials: 'omit',
      ...options
    })

    return this.handleResponse(response)
  }

  /**
   * Método POST
   */
  async post(endpoint, body = {}, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    let headers = this.getHeaders(options.headers)
    let requestBody
    
    if (body instanceof FormData) {
      // Para FormData, el navegador establecerá el Content-Type con boundary
      // No agregamos Content-Type manualmente
      delete headers['Content-Type']
      requestBody = body
    } else {
      // Para objetos simples, usamos JSON
      requestBody = JSON.stringify(body)
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBody,
      credentials: 'omit',
      ...options
    })

    return this.handleResponse(response)
  }

  /**
   * Método PUT
   */
  async put(endpoint, body = {}, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    let headers = this.getHeaders(options.headers)
    let requestBody
    
    if (body instanceof FormData) {
      delete headers['Content-Type']
      requestBody = body
    } else {
      requestBody = JSON.stringify(body)
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: requestBody,
      credentials: 'omit',
      ...options
    })

    return this.handleResponse(response)
  }

  /**
   * Método DELETE
   */
  async delete(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(options.headers),
      credentials: 'omit',
      ...options
    })

    return this.handleResponse(response)
  }

  /**
   * Método PATCH
   */
  async patch(endpoint, body = {}, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    let headers = this.getHeaders(options.headers)
    let requestBody
    
    if (body instanceof FormData) {
      delete headers['Content-Type']
      requestBody = body
    } else {
      requestBody = JSON.stringify(body)
    }
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: requestBody,
      credentials: 'omit',
      ...options
    })

    return this.handleResponse(response)
  }

  /**
   * Upload de archivos (sin Content-Type automático)
   */
  async upload(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = this.getHeaders({})
    delete headers['Content-Type'] // Dejar que el navegador establezca el boundary

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        ...options.headers
      },
      body: formData,
      credentials: 'omit',
      ...options
    })

    return this.handleResponse(response)
  }
}

// Instancia única del cliente
const apiClient = new ApiClient()

export default apiClient