import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import useAuthStore from '../stores/authStore'
import useGameStore from '../stores/gameStore'

const emptyCreateForm = {
  title: '',
  description: '',
  max_teams: 4,
  rounds_count: 3,
  time_per_question: 30,
  response_time_limit: 15,
  category_ids: [],
}

const colorChoices = ['#22c55e', '#38bdf8', '#f97316', '#e879f9', '#facc15', '#fb7185']

const unwrapCollection = (payload) => {
  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

const GameLobby = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    games,
    currentGame,
    joinedTeam,
    loading,
    fetchGames,
    createGame,
    joinGame,
    setGameId,
  } = useGameStore()

  const [categories, setCategories] = useState([])
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [joinForm, setJoinForm] = useState({
    code: '',
    team_name: user?.team?.name || `${user?.name || 'Equipo'} Team`,
    team_color: colorChoices[0],
  })

  const canCreateGames = user?.role === 'presenter' || user?.role === 'admin'

  useEffect(() => {
    fetchGames().catch(() => {
      toast.error('No se pudieron cargar los juegos')
    })
  }, [fetchGames])

  useEffect(() => {
    if (!canCreateGames) {
      return
    }

    apiClient.get('/api/categories')
      .then((response) => {
        setCategories(unwrapCollection(response))
      })
      .catch(() => {
        toast.error('No se pudieron cargar las categorías')
      })
  }, [canCreateGames])

  useEffect(() => {
    setJoinForm((current) => ({
      ...current,
      team_name: current.team_name || user?.team?.name || `${user?.name || 'Equipo'} Team`,
    }))
  }, [user?.name, user?.team?.name])

  const accessibleGames = useMemo(() => games.slice(0, 12), [games])
  const categoriesReady = categories.length > 0
  const canSubmitCreateForm = !loading && categoriesReady && createForm.category_ids.length > 0 && createForm.title.trim().length > 0

  const handleCreateGame = async (event) => {
    event.preventDefault()

    if (!categoriesReady) {
      toast.error('Primero carga las categorÃ­as disponibles')
      return
    }

    if (createForm.category_ids.length === 0) {
      toast.error('Selecciona al menos una categoría para la partida')
      return
    }

    try {
      const game = await createGame(createForm)
      toast.success(`Juego ${game.name} creado`)
      setCreateForm(emptyCreateForm)
      navigate('/presenter')
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo crear el juego')
    }
  }

  const handleJoinGame = async (event) => {
    event.preventDefault()

    if (!joinForm.code.trim()) {
      toast.error('Ingresa el código del juego')
      return
    }

    try {
      const result = await joinGame(joinForm.code.trim().toUpperCase(), joinForm)
      setGameId(result.game?.id ?? null)
      toast.success(`Te uniste a ${result.game?.name ?? 'la partida'}`)
      navigate('/play')
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo unir al juego')
    }
  }

  const toggleCategory = (categoryId) => {
    setCreateForm((current) => ({
      ...current,
      category_ids: current.category_ids.includes(categoryId)
        ? current.category_ids.filter((id) => id !== categoryId)
        : [...current.category_ids, categoryId],
    }))
  }

  const handleQuickAccess = (game) => {
    setJoinForm((current) => ({
      ...current,
      code: game.code,
    }))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 0.96, y: 0 }}
          className="glass-morphism rounded-3xl p-8"
        >
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-300">Estado actual</p>
          <h2 className="mb-4 text-4xl font-black leading-tight">
            Ahora la partida puede nacer con categorías elegidas y un flujo real de preguntas.
          </h2>
          <p className="max-w-2xl text-slate-300">
            {canCreateGames
              ? 'Crea la sesión, elige las categorías, comparte el código y luego controla las preguntas y el temporizador desde el panel.'
              : 'Únete con el código del presentador y entra directo a la pantalla donde verás la pregunta y el buzzer.'}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Partidas visibles</p>
              <p className="mt-2 text-3xl font-bold">{accessibleGames.length}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Juego activo local</p>
              <p className="mt-2 text-lg font-semibold">{currentGame?.name || 'Ninguno'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Tu equipo</p>
              <p className="mt-2 text-lg font-semibold">{joinedTeam?.name || user?.team?.name || 'Sin asignar'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-morphism rounded-3xl p-8"
        >
          <h3 className="mb-4 text-2xl font-bold">Unirse a una partida</h3>
          <form className="space-y-4" onSubmit={handleJoinGame}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Código</label>
              <input
                value={joinForm.code}
                onChange={(event) => setJoinForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
                placeholder="Ej: 9A31BC"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Nombre del equipo</label>
              <input
                value={joinForm.team_name}
                onChange={(event) => setJoinForm((current) => ({ ...current, team_name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
                placeholder="Equipo Relámpago"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Color</label>
              <div className="flex flex-wrap gap-3">
                {colorChoices.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setJoinForm((current) => ({ ...current, team_color: color }))}
                    className={`h-10 w-10 rounded-full border-2 transition ${joinForm.team_color === color ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar al juego'}
            </button>
          </form>
        </motion.div>
      </section>

      {canCreateGames && (
        <section className="glass-morphism rounded-3xl p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">Crear nueva partida</h3>
              <p className="text-slate-300">Debes elegir las categorías que formarán el juego.</p>
            </div>
            <button className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10" onClick={() => fetchGames()}>
              Refrescar lista
            </button>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateGame}>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">Nombre del juego</label>
              <input
                value={createForm.title}
                onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
                placeholder="Trivia de la noche"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">Descripción</label>
              <textarea
                value={createForm.description}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
                placeholder="Tema, reglas y observaciones"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">Categorías del juego</label>
              <p className="mb-3 text-xs text-slate-400">
                {categoriesReady
                  ? `${createForm.category_ids.length} categorÃ­as seleccionadas`
                  : 'TodavÃ­a no hay categorÃ­as disponibles para crear la partida'}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {categories.map((category) => {
                  const selected = createForm.category_ids.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        selected ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-slate-400">{category.description || 'Sin descripción'}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Máximo de equipos</label>
              <input
                type="number"
                min="2"
                max="20"
                value={createForm.max_teams}
                onChange={(event) => setCreateForm((current) => ({ ...current, max_teams: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Tiempo de espera antes del buzzer</label>
              <input
                type="number"
                min="5"
                max="120"
                value={createForm.time_per_question}
                onChange={(event) => setCreateForm((current) => ({ ...current, time_per_question: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Tiempo para responder</label>
              <input
                type="number"
                min="5"
                max="120"
                value={createForm.response_time_limit}
                onChange={(event) => setCreateForm((current) => ({ ...current, response_time_limit: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Rondas</label>
              <input
                type="number"
                min="1"
                max="10"
                value={createForm.rounds_count}
                onChange={(event) => setCreateForm((current) => ({ ...current, rounds_count: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full" disabled={!canSubmitCreateForm}>
                {loading ? 'Creando...' : 'Crear y administrar'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="glass-morphism rounded-3xl p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">Partidas disponibles</h3>
            <p className="text-slate-300">Usa el código para entrar o administra la tuya.</p>
          </div>
          <button className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10" onClick={() => fetchGames()}>
            Actualizar
          </button>
        </div>

        {accessibleGames.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-300">
            No hay partidas accesibles todavía.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accessibleGames.map((game) => (
              <div key={game.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{game.status}</p>
                    <h4 className="mt-2 text-xl font-bold">{game.name}</h4>
                  </div>
                  <div className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold">{game.code}</div>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <p>Equipos: {game.teams_count ?? game.teams?.length ?? 0} / {game.max_teams ?? game.settings?.max_teams ?? 10}</p>
                  <p>Creador: {game.creator?.name || 'Sin dato'}</p>
                  <p>Tiempo de espera: {game.time_per_question || 30}s</p>
                  <p>Categorías: {game.category_ids?.length || game.settings?.category_ids?.length || 0}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
                    onClick={() => handleQuickAccess(game)}
                  >
                    Usar código
                  </button>
                  {(user?.role === 'presenter' || user?.role === 'admin') && (
                    <button
                      className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10"
                      onClick={() => {
                        setGameId(game.id)
                        navigate('/presenter')
                      }}
                    >
                      Administrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default GameLobby
