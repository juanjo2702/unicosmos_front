import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import CountdownMeter from '../components/CountdownMeter'
import QuestionOptions from '../components/QuestionOptions'
import apiClient from '../api/client'
import useAuthStore from '../stores/authStore'
import useGameStore from '../stores/gameStore'
import useReverb from '../hooks/useReverb'

const initialForm = {
  title: '',
  description: '',
  max_teams: 4,
  rounds_count: 3,
  time_per_question: 30,
  response_time_limit: 15,
  category_ids: [],
}

const unwrapCollection = (payload) => {
  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

const PresenterDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    gameId,
    currentGame,
    games,
    teams,
    loading,
    fetchGames,
    createGame,
    startGame,
    nextQuestion,
    loadGameTeams,
    fetchLobby,
    setGameId,
    updateTeamScore,
  } = useGameStore()
  const { buzzerState, resetBuzzer, lockBuzzer, getGameStatus } = useReverb(gameId)
  const [form, setForm] = useState(initialForm)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchGames().catch(() => {
      toast.error('No se pudieron cargar tus juegos')
    })

    apiClient.get('/api/categories')
      .then((response) => setCategories(unwrapCollection(response)))
      .catch(() => toast.error('No se pudieron cargar las categorias'))
  }, [fetchGames])

  const leaderboard = useMemo(
    () => [...teams].sort((a, b) => b.score - a.score),
    [teams],
  )
  const categoriesReady = categories.length > 0
  const canCreateGame = !loading && categoriesReady && form.category_ids.length > 0 && form.title.trim().length > 0

  const currentQuestion = currentGame?.current_question
  const fastestTeam = buzzerState.teamId ? teams.find((team) => String(team.id) === String(buzzerState.teamId)) : null
  const categoryNames = categories
    .filter((category) => currentGame?.category_ids?.includes(category.id))
    .map((category) => category.name)

  const handleSelectGame = async (game) => {
    try {
      setGameId(game.id)
      await loadGameTeams(game.id)
      await fetchLobby(game.id)
      toast.success(`Administrando ${game.name}`)
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo abrir el juego')
    }
  }

  const handleCreateGame = async (event) => {
    event.preventDefault()

    if (!categoriesReady) {
      toast.error('Primero carga las categorias disponibles')
      return
    }

    if (form.category_ids.length === 0) {
      toast.error('Selecciona al menos una categoria')
      return
    }

    try {
      const game = await createGame(form)
      toast.success(`Juego ${game.name} creado`)
      setForm(initialForm)
      await handleSelectGame(game)
      await fetchGames()
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo crear el juego')
    }
  }

  const handleStartGame = async () => {
    if (!currentGame?.id) {
      toast.error('Selecciona un juego primero')
      return
    }

    try {
      await startGame(currentGame.id)
      await getGameStatus()
      await fetchGames()
      toast.success('Juego iniciado')
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo iniciar la partida')
    }
  }

  const handleNextQuestion = async () => {
    if (!currentGame?.id) {
      toast.error('Selecciona un juego primero')
      return
    }

    try {
      const game = await nextQuestion(currentGame.id)
      await fetchLobby(game.id)
      toast.success(game.status === 'finished' ? 'Se terminaron las preguntas' : 'Nueva pregunta en pantalla')
    } catch (error) {
      toast.error(error.data?.message || error.message || 'No se pudo avanzar de pregunta')
    }
  }

  const handleScore = async (teamId, delta) => {
    const result = await updateTeamScore(teamId, delta)
    if (result.success) {
      toast.success(`Puntaje actualizado (${delta > 0 ? '+' : ''}${delta})`)
    } else {
      toast.error(result.error || 'No se pudo actualizar el puntaje')
    }
  }

  const toggleCategory = (categoryId) => {
    setForm((current) => ({
      ...current,
      category_ids: current.category_ids.includes(categoryId)
        ? current.category_ids.filter((id) => id !== categoryId)
        : [...current.category_ids, categoryId],
    }))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-morphism rounded-3xl p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Presentador</p>
          <h2 className="mt-2 text-3xl font-black">Control total del juego</h2>
          <p className="mt-3 text-slate-300">
            {user?.name}, desde aqui ya puedes elegir categorias, lanzar cada pregunta, ver la opcion correcta y controlar los dos temporizadores.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Mis juegos</p>
              <p className="mt-2 text-3xl font-bold">{games.length}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Juego seleccionado</p>
              <p className="mt-2 text-lg font-semibold">{currentGame?.name || 'Ninguno'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Equipos cargados</p>
              <p className="mt-2 text-3xl font-bold">{teams.length}</p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <h3 className="mb-4 text-xl font-bold">Crear nueva partida</h3>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateGame}>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Nombre del juego"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                required
              />
              <input
                type="number"
                min="2"
                max="20"
                value={form.max_teams}
                onChange={(event) => setForm((current) => ({ ...current, max_teams: Number(event.target.value) }))}
                placeholder="Equipos"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Descripcion"
                rows={3}
                className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
              <div className="md:col-span-2">
                <p className="mb-2 text-sm text-slate-300">Categorias</p>
                <p className="mb-3 text-xs text-slate-400">
                  {categoriesReady
                    ? `${form.category_ids.length} categorias seleccionadas`
                    : 'Todavia no hay categorias cargadas para esta partida'}
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {categories.map((category) => {
                    const selected = form.category_ids.includes(category.id)
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
                        <p className="text-sm text-slate-400">{category.description || 'Sin descripcion'}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={form.rounds_count}
                onChange={(event) => setForm((current) => ({ ...current, rounds_count: Number(event.target.value) }))}
                placeholder="Rondas"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
              <input
                type="number"
                min="5"
                max="120"
                value={form.time_per_question}
                onChange={(event) => setForm((current) => ({ ...current, time_per_question: Number(event.target.value) }))}
                placeholder="Tiempo de lectura"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
              <input
                type="number"
                min="5"
                max="120"
                value={form.response_time_limit}
                onChange={(event) => setForm((current) => ({ ...current, response_time_limit: Number(event.target.value) }))}
                placeholder="Tiempo para responder"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
              />
              <button type="submit" className="btn-primary md:col-span-2" disabled={!canCreateGame}>
                {loading ? 'Creando...' : 'Crear partida'}
              </button>
            </form>
          </div>
        </div>

        <div className="glass-morphism rounded-3xl p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">Juegos disponibles</h3>
              <p className="text-slate-300">Selecciona uno para administrarlo.</p>
            </div>
            <button className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10" onClick={() => fetchGames()}>
              Actualizar
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game)}
                className={`rounded-3xl border p-5 text-left transition ${
                  String(currentGame?.id) === String(game.id)
                    ? 'border-cyan-300 bg-cyan-400/10'
                    : 'border-white/10 bg-slate-950/40 hover:bg-white/5'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{game.status}</p>
                <h4 className="mt-2 text-xl font-bold">{game.name}</h4>
                <p className="mt-2 text-sm text-slate-300">Codigo: {game.code}</p>
                <p className="mt-1 text-sm text-slate-300">Equipos: {game.teams_count ?? game.teams?.length ?? 0}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-morphism rounded-3xl p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold">Control de la ronda</h3>
            <p className="text-slate-300">
              {currentGame ? `Codigo para jugadores: ${currentGame.code}` : 'Selecciona un juego para activar el panel.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Pregunta actual</p>
              <p className="mt-2 text-lg font-semibold">{currentQuestion?.question_text || 'Sin pregunta activa'}</p>
              <p className="mt-2 text-sm text-slate-400">
                {currentQuestion?.category?.name || 'Sin categoria'}
              </p>
              <QuestionOptions
                options={currentQuestion?.options}
                correctKey={currentQuestion?.correct_option_key}
                revealCorrect
                className="mt-4"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <CountdownMeter
                label="Lectura"
                seconds={buzzerState.remainingSeconds}
                totalSeconds={buzzerState.countdownSeconds}
                activeText="Se habilita el buzzer al terminar"
                finishedText="Buzzer habilitado"
              />
              <CountdownMeter
                label="Respuesta"
                seconds={buzzerState.responseRemainingSeconds}
                totalSeconds={buzzerState.responseTimeLimit}
                activeText="Tiempo del equipo para responder"
                finishedText="Tiempo agotado"
                accent="amber"
              />
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Equipo mas rapido</p>
              <p className="mt-2 text-2xl font-black">{fastestTeam?.name || 'Esperando buzzer'}</p>
              <p className="mt-2 text-sm text-slate-300">
                {currentQuestion?.correct_option_key
                  ? `Correcta: ${currentQuestion.correct_option_key}. ${currentQuestion.correct_option_text || ''}`
                  : 'Todavia no hay opcion correcta visible'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Categorias activas</p>
              <p className="mt-2 text-sm text-slate-300">{categoryNames.length ? categoryNames.join(', ') : 'Sin datos'}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={handleStartGame} disabled={!currentGame}>
              Iniciar juego
            </button>
            <button className="rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10" onClick={handleNextQuestion} disabled={!currentGame}>
              Siguiente pregunta
            </button>
            <button className="rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10" onClick={() => resetBuzzer()} disabled={!currentGame}>
              Reiniciar buzzer
            </button>
            <button className="rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10" onClick={() => lockBuzzer(!buzzerState.locked)} disabled={!currentGame}>
              {buzzerState.locked ? 'Desbloquear' : 'Bloquear'}
            </button>
            <button className="rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10" onClick={() => getGameStatus()} disabled={!currentGame}>
              Refrescar estado
            </button>
            {currentGame && (
              <button
                className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                onClick={() => navigate(`/display/${currentGame.id}`)}
              >
                Pantalla de preguntas
              </button>
            )}
          </div>
        </div>

        <div className="glass-morphism rounded-3xl p-8">
          <h3 className="mb-6 text-2xl font-bold">Marcador y control</h3>
          {leaderboard.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-300">
              Aun no hay equipos unidos a esta partida.
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((team, index) => (
                <div key={team.id} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl font-bold">
                        {index + 1}
                      </div>
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: team.color || '#38bdf8' }} />
                      <div>
                        <p className="text-xl font-bold">{team.name}</p>
                        <p className="text-sm text-slate-400">{team.players_count ?? team.players?.length ?? 0} integrantes</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl bg-white/5 px-5 py-3 text-2xl font-black">{team.score}</div>
                      <button className="rounded-xl bg-green-500/20 px-4 py-2 text-green-200 hover:bg-green-500/30" onClick={() => handleScore(team.id, 10)}>
                        +10
                      </button>
                      <button className="rounded-xl bg-blue-500/20 px-4 py-2 text-blue-200 hover:bg-blue-500/30" onClick={() => handleScore(team.id, 5)}>
                        +5
                      </button>
                      <button className="rounded-xl bg-red-500/20 px-4 py-2 text-red-200 hover:bg-red-500/30" onClick={() => handleScore(team.id, -5)}>
                        -5
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default PresenterDashboard
