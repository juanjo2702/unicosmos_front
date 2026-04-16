import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import CountdownMeter from './CountdownMeter'
import QuestionOptions from './QuestionOptions'
import useAuthStore from '../stores/authStore'
import useGameStore from '../stores/gameStore'
import useReverb from '../hooks/useReverb'

const PlayerBuzzer = () => {
  const { user } = useAuthStore()
  const { gameId, currentGame, teams, joinedTeam, getTeamById, loadGameTeams } = useGameStore()
  const { isConnected, buzzerState, pressBuzzer, resetBuzzer, lockBuzzer } = useReverb(gameId)
  const [selectedTeam, setSelectedTeam] = useState(joinedTeam?.id || user?.team_id || null)
  const [isHolding, setIsHolding] = useState(false)
  const [ripples, setRipples] = useState([])
  const holdStartedAt = useRef(null)

  useEffect(() => {
    if (gameId && teams.length === 0) {
      loadGameTeams(gameId).catch(() => {})
    }
  }, [gameId, teams.length, loadGameTeams])

  useEffect(() => {
    if (joinedTeam?.id) {
      setSelectedTeam(joinedTeam.id)
      return
    }

    if (user?.team_id) {
      setSelectedTeam(user.team_id)
      return
    }

    if (teams[0]?.id && !selectedTeam) {
      setSelectedTeam(teams[0].id)
    }
  }, [joinedTeam?.id, user?.team_id, teams, selectedTeam])

  const addRipple = () => {
    const ripple = { id: Date.now() }
    setRipples((current) => [...current, ripple])
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== ripple.id))
    }, 700)
  }

  const beginPress = useCallback(() => {
    if (!selectedTeam) {
      toast.error('Primero elige tu equipo')
      return
    }

    if (buzzerState.pressed || buzzerState.locked || !buzzerState.acceptingBuzzers) {
      return
    }

    holdStartedAt.current = Date.now()
    setIsHolding(true)
    addRipple()
  }, [selectedTeam, buzzerState.pressed, buzzerState.locked, buzzerState.acceptingBuzzers])

  const finishPress = useCallback(async () => {
    if (!isHolding) {
      return
    }

    setIsHolding(false)

    if (Date.now() - holdStartedAt.current < 60) {
      toast('Manten presionado un instante para evitar pulsaciones falsas')
      return
    }

    const result = await pressBuzzer(selectedTeam)
    if (result.success) {
      const team = getTeamById(selectedTeam)
      toast.success(`${team?.name || 'Equipo'} pulso primero`)
    }
  }, [getTeamById, isHolding, pressBuzzer, selectedTeam])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault()
        beginPress()
      }
    }

    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        event.preventDefault()
        finishPress()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [beginPress, finishPress])

  const selectedTeamData = getTeamById(selectedTeam)
  const leaderTeam = buzzerState.teamId ? getTeamById(buzzerState.teamId) : null
  const canControl = user?.role === 'presenter' || user?.role === 'admin'
  const currentQuestion = currentGame?.current_question

  if (!gameId) {
    return (
      <div className="glass-morphism rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-bold">Todavia no estas en una partida</h2>
        <p className="mt-3 text-slate-300">Unete desde el lobby con un codigo valido para activar el buzzer.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-morphism rounded-3xl p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Partida</p>
          <h2 className="mt-2 text-3xl font-black">{currentGame?.name || `Juego ${gameId}`}</h2>
          <p className="mt-2 text-slate-300">Codigo: {currentGame?.code || 'Cargando...'}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <CountdownMeter
              label="Lectura"
              seconds={buzzerState.remainingSeconds}
              totalSeconds={buzzerState.countdownSeconds}
              activeText="Se habilita el buzzer al terminar"
              finishedText="Ya puedes pulsar"
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

          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-slate-400">Conectividad</p>
              <p className="mt-1 font-semibold">{isConnected ? 'Tiempo real conectado' : 'Modo estable con sincronizacion por API'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-slate-400">Estado del buzzer</p>
              <p className="mt-1 font-semibold">
                {buzzerState.locked
                  ? 'Bloqueado'
                  : buzzerState.pressed
                    ? `Responde ${leaderTeam?.name || 'otro equipo'}`
                    : buzzerState.acceptingBuzzers
                      ? 'Listo para jugar'
                      : 'Esperando fin del temporizador'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-slate-400">Tu equipo actual</p>
              <p className="mt-1 font-semibold">{selectedTeamData?.name || 'Sin elegir'}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold">Equipos</h3>
            <div className="grid gap-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    String(selectedTeam) === String(team.id)
                      ? 'border-cyan-300 bg-cyan-400/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color || '#38bdf8' }} />
                      <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-xs text-slate-400">{team.players_count ?? team.players?.length ?? 0} integrantes</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{team.score}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-3xl p-6">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Zona de respuesta</p>
            <h3 className="mt-2 text-2xl font-bold">Buzzer principal</h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{currentQuestion?.category?.name || 'Pregunta actual'}</p>
            <p className="mt-4 text-2xl font-black leading-tight">{currentQuestion?.question_text || 'Todavia no hay una pregunta activa'}</p>
            <QuestionOptions options={currentQuestion?.options} className="mt-6" />
          </div>

          <div className="relative mx-auto mt-8 flex min-h-[360px] max-w-xl items-center justify-center">
            <div className="pointer-events-none absolute inset-0">
              <AnimatePresence>
                {ripples.map((ripple) => (
                  <motion.div
                    key={ripple.id}
                    initial={{ scale: 0.3, opacity: 0.7 }}
                    animate={{ scale: 1.7, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{ borderColor: selectedTeamData?.color || '#38bdf8' }}
                  />
                ))}
              </AnimatePresence>
            </div>

            <motion.button
              onMouseDown={beginPress}
              onMouseUp={finishPress}
              onMouseLeave={finishPress}
              onTouchStart={beginPress}
              onTouchEnd={finishPress}
              disabled={!selectedTeam || buzzerState.locked || buzzerState.pressed || !buzzerState.acceptingBuzzers}
              whileTap={{ scale: 0.96 }}
              className="relative h-72 w-72 rounded-full text-white shadow-2xl transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${selectedTeamData?.color || '#38bdf8'}, #082f49)`,
                boxShadow: isHolding
                  ? `0 0 70px ${selectedTeamData?.color || '#38bdf8'}80`
                  : '0 25px 70px rgba(0, 0, 0, 0.45)',
              }}
            >
              <div className="absolute inset-6 rounded-full bg-white/10 blur-md" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
                {buzzerState.pressed ? (
                  <>
                    <p className="text-5xl">STOP</p>
                    <p className="mt-4 text-xl font-bold">{leaderTeam?.name || 'Otro equipo'} tomo el turno</p>
                    <p className="mt-2 text-sm text-slate-100/80">
                      {buzzerState.responseRemainingSeconds > 0
                        ? `Tiene ${buzzerState.responseRemainingSeconds}s para responder`
                        : 'Esperando decision del presentador'}
                    </p>
                  </>
                ) : buzzerState.locked ? (
                  <>
                    <p className="text-5xl">LOCK</p>
                    <p className="mt-4 text-xl font-bold">El presentador bloqueo el buzzer</p>
                  </>
                ) : !buzzerState.acceptingBuzzers ? (
                  <>
                    <p className="text-5xl">{buzzerState.remainingSeconds ?? 0}</p>
                    <p className="mt-4 text-xl font-bold">Espera el conteo para responder</p>
                    <p className="mt-2 text-sm text-slate-100/80">Lee las opciones y preparate</p>
                  </>
                ) : (
                  <>
                    <p className="text-5xl">{isHolding ? 'YA' : 'PRESIONA'}</p>
                    <p className="mt-4 text-xl font-bold">{selectedTeamData?.name || 'Selecciona un equipo'}</p>
                    <p className="mt-2 text-sm text-slate-100/80">Manten clic o la barra espaciadora para responder</p>
                  </>
                )}
              </div>
            </motion.button>
          </div>

          {canControl && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10" onClick={() => resetBuzzer()}>
                Reiniciar buzzer
              </button>
              <button className="rounded-xl bg-white/5 px-4 py-2 hover:bg-white/10" onClick={() => lockBuzzer(!buzzerState.locked)}>
                {buzzerState.locked ? 'Desbloquear' : 'Bloquear'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default PlayerBuzzer
