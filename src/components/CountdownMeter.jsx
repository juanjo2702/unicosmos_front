const clampPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

const CountdownMeter = ({
  label,
  seconds = 0,
  totalSeconds = 0,
  activeText,
  finishedText,
  accent = 'cyan',
}) => {
  const safeSeconds = Math.max(0, seconds ?? 0)
  const safeTotal = Math.max(0, totalSeconds ?? 0)
  const progress = safeTotal > 0 ? clampPercentage((safeSeconds / safeTotal) * 100) : 0
  const isCritical = safeSeconds <= Math.max(3, Math.floor(safeTotal * 0.25))

  const palette = accent === 'amber'
    ? {
        ring: isCritical ? 'from-rose-500 via-orange-400 to-amber-300' : 'from-amber-500 via-yellow-400 to-orange-300',
        bar: isCritical ? 'from-rose-500 to-orange-400' : 'from-amber-400 to-yellow-300',
      }
    : {
        ring: isCritical ? 'from-rose-500 via-orange-400 to-amber-300' : 'from-cyan-500 via-sky-400 to-blue-300',
        bar: isCritical ? 'from-rose-500 to-orange-400' : 'from-cyan-400 to-blue-300',
      }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-300">{label}</p>
      <div className={`mt-4 rounded-[1.75rem] bg-gradient-to-br ${palette.ring} p-[1px]`}>
        <div className="rounded-[1.7rem] bg-slate-950/90 px-6 py-5 text-center">
          <p className={`text-5xl font-black tabular-nums ${isCritical ? 'animate-pulse text-orange-200' : 'text-white'}`}>
            {safeSeconds}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {safeSeconds > 0 ? activeText : finishedText}
          </p>
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${palette.bar} transition-[width] duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default CountdownMeter
