const QuestionOptions = ({
  options = [],
  correctKey = null,
  revealCorrect = false,
  className = '',
}) => {
  if (!Array.isArray(options) || options.length === 0) {
    return null
  }

  return (
    <div className={`grid gap-3 md:grid-cols-2 ${className}`.trim()}>
      {options.map((option) => {
        const isCorrect = revealCorrect && correctKey && option.key === correctKey

        return (
          <div
            key={`${option.key}-${option.text}`}
            className={`rounded-3xl border px-5 py-4 transition ${
              isCorrect
                ? 'border-emerald-300 bg-emerald-500/15 shadow-[0_0_30px_rgba(52,211,153,0.2)]'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black ${
                isCorrect ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-cyan-200'
              }`}
              >
                {option.key}
              </div>
              <div className="pt-1">
                <p className="text-lg font-semibold leading-snug">{option.text}</p>
                {isCorrect && (
                  <p className="mt-2 text-sm font-semibold text-emerald-200">Respuesta correcta</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default QuestionOptions
