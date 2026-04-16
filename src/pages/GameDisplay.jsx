import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import CountdownMeter from '../components/CountdownMeter'
import QuestionOptions from '../components/QuestionOptions'
import useGameStore from '../stores/gameStore'
import useReverb from '../hooks/useReverb'

const GameDisplay = () => {
  const { gameId } = useParams()
  const { currentGame, fetchLobby } = useGameStore()
  const { buzzerState } = useReverb(gameId)

  useEffect(() => {
    if (gameId) {
      fetchLobby(gameId).catch(() => {})
    }
  }, [fetchLobby, gameId])

  const question = currentGame?.current_question

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#164e63,transparent_35%),radial-gradient(circle_at_bottom,#1d4ed8,transparent_25%),linear-gradient(180deg,#020617,#0f172a)] px-8 py-10 text-white">
      <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-between gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">Pantalla principal</p>
            <h1 className="mt-3 text-5xl font-black">{currentGame?.name || 'Partida en curso'}</h1>
            <p className="mt-3 text-xl text-slate-300">Codigo: {currentGame?.code || gameId}</p>
          </div>

          <div className="grid w-full gap-4 lg:max-w-xl lg:grid-cols-2">
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
        </div>

        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">
            {question?.category?.name || 'Pregunta actual'}
          </p>
          <h2 className="mt-6 text-5xl font-black leading-tight">
            {question?.question_text || 'Todavia no hay una pregunta activa'}
          </h2>
          <QuestionOptions options={question?.options} className="mt-8" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white/5 p-6">
            <p className="text-sm text-slate-400">Estado del buzzer</p>
            <p className="mt-3 text-2xl font-bold">
              {buzzerState.locked ? 'Bloqueado' : buzzerState.pressed ? 'Equipo respondiendo' : 'En espera'}
            </p>
          </div>
          <div className="rounded-3xl bg-white/5 p-6">
            <p className="text-sm text-slate-400">Pregunta</p>
            <p className="mt-3 text-2xl font-bold">
              {currentGame?.settings?.current_question_index >= 0
                ? currentGame.settings.current_question_index + 1
                : 0}
            </p>
          </div>
          <div className="rounded-3xl bg-white/5 p-6">
            <p className="text-sm text-slate-400">Equipo mas rapido</p>
            <p className="mt-3 text-2xl font-bold">
              {currentGame?.teams?.find((team) => String(team.id) === String(buzzerState.teamId))?.name || 'Sin respuesta'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameDisplay
