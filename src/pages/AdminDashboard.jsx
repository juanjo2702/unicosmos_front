import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'

const unwrap = (payload) => {
  if (payload?.success && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data
  }

  return payload
}

const extractCollection = (payload) => {
  const data = unwrap(payload)

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

const optionKeys = ['A', 'B', 'C', 'D']

const createEmptyQuestion = () => ({
  category_id: '',
  question_text: '',
  difficulty: 'medium',
  points: 10,
  time_limit: 30,
  correct_option_key: 'A',
  options: optionKeys.map((key) => ({
    key,
    text: '',
  })),
})

const AdminDashboard = () => {
  const [categories, setCategories] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [questionForm, setQuestionForm] = useState(createEmptyQuestion())

  const loadData = async () => {
    setLoading(true)

    try {
      const [categoriesResponse, questionsResponse] = await Promise.all([
        apiClient.get('/api/categories'),
        apiClient.get('/api/questions'),
      ])

      setCategories(extractCollection(categoriesResponse))
      setQuestions(extractCollection(questionsResponse))
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => ({
    categories: categories.length,
    questions: questions.length,
    activeQuestions: questions.filter((question) => question.is_active !== false).length,
  }), [categories, questions])

  const createCategory = async (event) => {
    event.preventDefault()

    try {
      await apiClient.post('/api/categories', {
        ...categoryForm,
        color: '#38bdf8',
        icon: 'book',
      })

      setCategoryForm({ name: '', description: '' })
      toast.success('Categoria creada')
      await loadData()
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo crear la categoria')
    }
  }

  const createQuestion = async (event) => {
    event.preventDefault()

    const hasEmptyOption = questionForm.options.some((option) => !option.text.trim())
    if (hasEmptyOption) {
      toast.error('Completa las cuatro opciones')
      return
    }

    try {
      await apiClient.post('/api/questions', {
        category_id: Number(questionForm.category_id),
        question_text: questionForm.question_text,
        type: 'multiple_choice',
        options: questionForm.options.map((option) => ({
          text: option.text.trim(),
          is_correct: option.key === questionForm.correct_option_key,
        })),
        points: Number(questionForm.points),
        time_limit: Number(questionForm.time_limit),
        difficulty: questionForm.difficulty,
      })

      setQuestionForm(createEmptyQuestion())
      toast.success('Pregunta creada')
      await loadData()
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo crear la pregunta')
    }
  }

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Eliminar esta categoria?')) {
      return
    }

    try {
      await apiClient.delete(`/api/categories/${categoryId}`)
      toast.success('Categoria eliminada')
      await loadData()
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo eliminar la categoria')
    }
  }

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Eliminar esta pregunta?')) {
      return
    }

    try {
      await apiClient.delete(`/api/questions/${questionId}`)
      toast.success('Pregunta eliminada')
      await loadData()
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo eliminar la pregunta')
    }
  }

  const updateOptionText = (key, value) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option) => (
        option.key === key ? { ...option, text: value } : option
      )),
    }))
  }

  const getCorrectOption = (question) => {
    if (!Array.isArray(question.options)) {
      return null
    }

    const index = question.options.findIndex((option) => option.is_correct)
    if (index === -1) {
      return null
    }

    return {
      key: optionKeys[index] || '?',
      text: question.options[index]?.text || '',
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="glass-morphism rounded-3xl p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Administracion</p>
        <h2 className="mt-2 text-3xl font-black">Banco de preguntas y categorias</h2>
        <p className="mt-3 text-slate-300">Ahora las preguntas se cargan como opcion multiple real con cuatro opciones y una sola correcta.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm text-slate-400">Categorias</p>
            <p className="mt-2 text-3xl font-bold">{stats.categories}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm text-slate-400">Preguntas</p>
            <p className="mt-2 text-3xl font-bold">{stats.questions}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm text-slate-400">Activas</p>
            <p className="mt-2 text-3xl font-bold">{stats.activeQuestions}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-morphism rounded-3xl p-8">
          <h3 className="mb-6 text-2xl font-bold">Crear categoria</h3>
          <form className="space-y-4" onSubmit={createCategory}>
            <input
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Nombre"
              required
            />
            <textarea
              value={categoryForm.description}
              onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Descripcion"
            />
            <button type="submit" className="btn-primary w-full">Guardar categoria</button>
          </form>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h4 className="text-xl font-bold">Listado</h4>
              <button className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10" onClick={loadData}>
                {loading ? 'Cargando...' : 'Recargar'}
              </button>
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-slate-400">{category.description || 'Sin descripcion'}</p>
                      <p className="mt-1 text-xs text-slate-500">{category.questions?.length ?? 0} preguntas</p>
                    </div>
                    <button className="rounded-xl bg-red-500/15 px-3 py-2 text-red-200 hover:bg-red-500/25" onClick={() => deleteCategory(category.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-3xl p-8">
          <h3 className="mb-6 text-2xl font-bold">Crear pregunta</h3>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={createQuestion}>
            <select
              value={questionForm.category_id}
              onChange={(event) => setQuestionForm((current) => ({ ...current, category_id: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
              required
            >
              <option value="">Selecciona una categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={questionForm.difficulty}
              onChange={(event) => setQuestionForm((current) => ({ ...current, difficulty: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
            >
              <option value="easy">Facil</option>
              <option value="medium">Media</option>
              <option value="hard">Dificil</option>
            </select>
            <textarea
              value={questionForm.question_text}
              onChange={(event) => setQuestionForm((current) => ({ ...current, question_text: event.target.value }))}
              rows={3}
              className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Texto de la pregunta"
              required
            />

            <div className="md:col-span-2 grid gap-3">
              {questionForm.options.map((option) => (
                <div key={option.key} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={questionForm.correct_option_key === option.key}
                        onChange={() => setQuestionForm((current) => ({ ...current, correct_option_key: option.key }))}
                      />
                      Opcion {option.key}
                    </label>
                    <input
                      value={option.text}
                      onChange={(event) => updateOptionText(option.key, event.target.value)}
                      className="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
                      placeholder={`Texto de la opcion ${option.key}`}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <input
              type="number"
              min="1"
              max="100"
              value={questionForm.points}
              onChange={(event) => setQuestionForm((current) => ({ ...current, points: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Puntos"
            />
            <input
              type="number"
              min="5"
              max="300"
              value={questionForm.time_limit}
              onChange={(event) => setQuestionForm((current) => ({ ...current, time_limit: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Tiempo limite"
            />
            <button type="submit" className="btn-primary md:col-span-2">Guardar pregunta</button>
          </form>

          <div className="mt-8 space-y-3">
            {questions.map((question) => {
              const correctOption = getCorrectOption(question)

              return (
                <div key={question.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <p className="font-semibold">{question.question_text}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-3 py-1">{question.category?.name || 'Sin categoria'}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1">{question.difficulty}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1">{question.points} pts</span>
                        <span className="rounded-full bg-white/10 px-3 py-1">{question.type}</span>
                      </div>

                      {Array.isArray(question.options) && question.options.length > 0 ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          {question.options.map((option, index) => (
                            <div
                              key={`${question.id}-${index}`}
                              className={`rounded-2xl border px-3 py-3 text-sm ${
                                option.is_correct ? 'border-emerald-300 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/5'
                              }`}
                            >
                              <p className="font-semibold">{optionKeys[index] || '?'}</p>
                              <p className="mt-1 text-slate-200">{option.text}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Respuesta: {question.correct_answer}</p>
                      )}

                      {correctOption && (
                        <p className="text-sm font-semibold text-emerald-200">
                          Correcta: {correctOption.key}. {correctOption.text}
                        </p>
                      )}
                    </div>

                    <button className="rounded-xl bg-red-500/15 px-4 py-2 text-red-200 hover:bg-red-500/25" onClick={() => deleteQuestion(question.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
