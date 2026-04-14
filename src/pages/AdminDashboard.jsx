import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [categories, setCategories] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState({ categories: false, questions: false })
  const [error, setError] = useState({ categories: null, questions: null })
  
  const [newCategory, setNewCategory] = useState('')
  const [newQuestion, setNewQuestion] = useState({ text: '', category: '', difficulty: 'Medium', points: 10 })
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  
  // Cargar datos al montar el componente
  useEffect(() => {
    loadCategories()
    loadQuestions()
  }, [])

  const loadCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }))
    setError(prev => ({ ...prev, categories: null }))
    try {
      const data = await apiClient.get('/api/categories')
      setCategories(data.data || data)
    } catch (err) {
      setError(prev => ({ ...prev, categories: err.message }))
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(prev => ({ ...prev, categories: false }))
    }
  }

  const loadQuestions = async () => {
    setLoading(prev => ({ ...prev, questions: true }))
    setError(prev => ({ ...prev, questions: null }))
    try {
      const data = await apiClient.get('/api/questions')
      setQuestions(data.data || data)
    } catch (err) {
      setError(prev => ({ ...prev, questions: err.message }))
      toast.error('Error al cargar preguntas')
    } finally {
      setLoading(prev => ({ ...prev, questions: false }))
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    
    try {
      const data = await apiClient.post('/api/categories', {
        name: newCategory,
        description: '',
        color: '#3B82F6',
        icon: '📚'
      })
      toast.success('Categoría creada exitosamente')
      setNewCategory('')
      loadCategories() // Recargar lista
    } catch (err) {
      toast.error(err.data?.message || 'Error al crear categoría')
    }
  }

  const handleEditCategory = async (id, newName) => {
    if (!newName.trim()) return
    try {
      await apiClient.put(`/api/categories/${id}`, {
        name: newName
      })
      toast.success('Categoría actualizada exitosamente')
      setEditingCategoryId(null)
      setEditingCategoryName('')
      loadCategories()
    } catch (err) {
      toast.error(err.data?.message || 'Error al actualizar categoría')
    }
  }
  
  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim() || !newQuestion.category) return
    
    try {
      // Encontrar categoría por nombre
      const category = categories.find(cat => cat.name === newQuestion.category)
      if (!category) {
        toast.error('Categoría no encontrada')
        return
      }

      const questionData = {
        category_id: category.id,
        question_text: newQuestion.text,
        type: 'open', // Por defecto, podríamos agregar más tipos después
        points: newQuestion.points || 10,
        time_limit: 30,
        difficulty: newQuestion.difficulty?.toLowerCase() || 'medium',
        correct_answer: newQuestion.text, // Para preguntas abiertas, placeholder
      }

      const data = await apiClient.post('/api/questions', questionData)
      toast.success('Pregunta creada exitosamente')
      setNewQuestion({ text: '', category: '', difficulty: 'Medium', points: 10 })
      loadQuestions() // Recargar lista
    } catch (err) {
      toast.error(err.data?.message || 'Error al crear pregunta')
    }
  }
  
  const handleDeleteCategory = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer.')) return
    
    try {
      await apiClient.delete(`/api/categories/${id}`)
      toast.success('Categoría eliminada exitosamente')
      loadCategories() // Recargar lista
      loadQuestions() // Recargar preguntas por si alguna se desvinculó
    } catch (err) {
      toast.error(err.data?.message || 'Error al eliminar categoría')
    }
  }
  
  const handleDeleteQuestion = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.')) return
    
    try {
      await apiClient.delete(`/api/questions/${id}`)
      toast.success('Pregunta eliminada exitosamente')
      loadQuestions() // Recargar lista
    } catch (err) {
      toast.error(err.data?.message || 'Error al eliminar pregunta')
    }
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-gray-400">Gestiona categorías, preguntas y configuraciones del juego</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Categories Management */}
        <div className="glass-morphism p-6 rounded-2xl">
           <h2 className="text-xl font-semibold mb-4">Gestión de Categorías</h2>
          
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                 placeholder="Nombre de la nueva categoría"
                className="flex-grow px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
              />
               <button
                 onClick={handleAddCategory}
                 className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium"
               >
                 Agregar
               </button>
            </div>
          </div>
          
          {loading.categories ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              <p className="mt-2 text-gray-400">Cargando categorías...</p>
            </div>
          ) : error.categories ? (
            <div className="text-center py-8 text-red-400">
              <p>Error al cargar categorías: {error.categories}</p>
              <button 
                onClick={loadCategories}
                className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Reintentar
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No hay categorías creadas aún.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="p-4 rounded-xl bg-gray-800/50 flex items-center justify-between">
                  {editingCategoryId === category.id ? (
                    <>
                      <div className="flex-grow">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                          autoFocus
                        />
                        <p className="text-sm text-gray-400 mt-1">{category.questions?.length || 0} preguntas</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category.id, editingCategoryName)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategoryId(null)
                            setEditingCategoryName('')
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-400">{category.questions?.length || 0} preguntas</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCategoryId(category.id)
                            setEditingCategoryName(category.name)
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Questions Management */}
        <div className="glass-morphism p-6 rounded-2xl">
           <h2 className="text-xl font-semibold mb-4">Gestión de Preguntas</h2>
          
          <div className="mb-6 space-y-4">
            <div>
              <textarea
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                 placeholder="Texto de la pregunta"
                rows="3"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                >
                   <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                >
                   <option value="Easy">Fácil</option>
                  <option value="Medium">Medio</option>
                  <option value="Hard">Difícil</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-grow">
                 <label className="block text-sm text-gray-400 mb-1">Puntos</label>
                <input
                  type="number"
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value) || 0})}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              
               <button
                 onClick={handleAddQuestion}
                 className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium self-end"
               >
                 Agregar Pregunta
               </button>
            </div>
          </div>
          
          {loading.questions ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              <p className="mt-2 text-gray-400">Cargando preguntas...</p>
            </div>
          ) : error.questions ? (
            <div className="text-center py-8 text-red-400">
              <p>Error al cargar preguntas: {error.questions}</p>
              <button 
                onClick={loadQuestions}
                className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Reintentar
              </button>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No hay preguntas creadas aún.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {questions.map((question) => (
                <div key={question.id} className="p-4 rounded-xl bg-gray-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{question.question_text}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">{question.category?.name || 'Sin categoría'}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          question.difficulty === 'easy' ? 'bg-green-600' :
                          question.difficulty === 'medium' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}>
                          {question.difficulty === 'easy' ? 'Fácil' : question.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                        </span>
                        <span className="px-2 py-1 bg-blue-600 rounded text-xs">{question.points} pts</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Game Settings */}
      <div className="glass-morphism p-6 rounded-2xl">
         <h2 className="text-xl font-semibold mb-4">Configuraciones del Juego</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-gray-800/50">
             <h3 className="font-medium mb-3">Configuración del Buzzer</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <span className="text-gray-400">Tiempo de espera del buzzer</span>
                <span className="font-semibold">5 seconds</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-gray-400">Bloquear después de presionar</span>
                <span className="font-semibold">Enabled</span>
              </div>
              <button className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg">
                Configurar
              </button>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gray-800/50">
             <h3 className="font-medium mb-3">Sistema de Puntuación</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <span className="text-gray-400">Respuesta correcta</span>
                <span className="font-semibold">+10 points</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-gray-400">Respuesta incorrecta</span>
                <span className="font-semibold">-5 points</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-gray-400">Bonificación por rapidez</span>
                <span className="font-semibold">+5 points</span>
              </div>
              <button className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg">
                Configurar
              </button>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gray-800/50">
             <h3 className="font-medium mb-3">Estado del Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <span className="text-gray-400">API Backend</span>
                <span className="text-green-500 font-semibold">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">WebSocket</span>
                <span className="text-green-500 font-semibold">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-gray-400">Base de datos</span>
                <span className="text-green-500 font-semibold">● Connected</span>
              </div>
              <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
                 Ejecutar Verificación
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="glass-morphism p-6 rounded-2xl mt-6">
         <h2 className="text-xl font-semibold mb-4">Estadísticas del Sistema</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800/50 text-center">
            <div className="text-3xl font-bold text-primary-400 mb-2">{categories.length}</div>
             <p className="text-gray-400">Categorías</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{questions.length}</div>
             <p className="text-gray-400">Preguntas</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">4</div>
             <p className="text-gray-400">Equipos Activos</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
             <p className="text-gray-400">Juegos Activos</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard