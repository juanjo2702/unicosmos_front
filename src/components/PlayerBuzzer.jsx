import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useReverb from '../hooks/useReverb'
import useGameStore from '../stores/gameStore'
import toast from 'react-hot-toast'

const PlayerBuzzer = () => {
  const { gameId, teams, getTeamById } = useGameStore()
  const {
    isConnected,
    buzzerState,
    pressBuzzer,
    resetBuzzer,
    lockBuzzer
  } = useReverb(gameId)
  
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || 'team-1')
  const [isPressing, setIsPressing] = useState(false)
  const [ripples, setRipples] = useState([])
  const pressStartTime = useRef(null)
  const audioContextRef = useRef(null)
  const oscillatorRef = useRef(null)
  
  // Initialize audio context on user interaction
  const initAudio = () => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }
  
  // Play buzzer sound
  const playBuzzerSound = () => {
    try {
      initAudio()
      
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') return
      
      // Create oscillator for buzzer sound
      oscillatorRef.current = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillatorRef.current.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      // Configure sound
      oscillatorRef.current.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
      oscillatorRef.current.frequency.exponentialRampToValueAtTime(200, audioContextRef.current.currentTime + 0.3)
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3)
      
      oscillatorRef.current.start()
      oscillatorRef.current.stop(audioContextRef.current.currentTime + 0.3)
    } catch (error) {
      console.warn('Audio error:', error)
    }
  }
  
  // Add ripple effect
  const addRipple = () => {
    const newRipple = {
      id: Date.now(),
      x: 50, // Center of button
      y: 50
    }
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 1000)
  }
  
  // Handle buzzer press
  const handlePressStart = () => {
    if (buzzerState.pressed) {
       toast.error('¡El buzzer ya fue presionado!')
      return
    }
    
    initAudio() // Initialize audio on first interaction
    pressStartTime.current = Date.now()
    setIsPressing(true)
    addRipple()
  }
  
  const handlePressEnd = async () => {
    if (!isPressing || buzzerState.pressed) return
    
    setIsPressing(false)
    
    const pressDuration = Date.now() - pressStartTime.current
    pressStartTime.current = null
    
    // Only register as a press if held for at least 50ms (to distinguish from clicks)
    if (pressDuration < 50) {
       toast('Toca y mantén para presionar el buzzer', { icon: '👆' })
      return
    }
    
    try {
      playBuzzerSound()
      
      const result = await pressBuzzer(selectedTeam)
      
      if (result.success) {
        const team = getTeamById(selectedTeam)
         toast.success(`¡${team?.name || 'Equipo'} presionó el buzzer!`, {
          duration: 3000,
          icon: '🎯'
        })
      }
    } catch (error) {
      console.error('Press error:', error)
    }
  }
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space bar for buzzer
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        handlePressStart()
      }
      
      // R key to reset
      if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault()
        resetBuzzer()
      }
      
      // Number keys 1-4 to select team
      if (e.code >= 'Digit1' && e.code <= 'Digit4') {
        const index = parseInt(e.code.charAt(5)) - 1
        if (teams[index]) {
          setSelectedTeam(teams[index].id)
          toast(`Selected ${teams[index].name}`, { icon: '👥' })
        }
      }
    }
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        handlePressEnd()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      
      // Clean up audio
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [selectedTeam, teams, buzzerState.pressed, isPressing])
  
  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    e.preventDefault()
    handlePressStart()
  }
  
  const handleTouchEnd = (e) => {
    e.preventDefault()
    handlePressEnd()
  }
  
  const selectedTeamData = getTeamById(selectedTeam)
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {/* Connection status */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected to game server' : 'Disconnected'}
          </span>
        </div>
        <p className="text-gray-400 text-sm">Game ID: {gameId}</p>
      </div>
      
      {/* Team selection */}
      <div className="mb-8 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4 text-center">Select Your Team</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`p-4 rounded-xl transition-all ${selectedTeam === team.id ? 'ring-2 ring-offset-2 ring-offset-gray-900' : 'hover:bg-white/5'}`}
              style={{
                backgroundColor: selectedTeam === team.id ? `${team.color}20` : '',
                borderColor: selectedTeam === team.id ? team.color : 'transparent',
                borderWidth: '1px'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <div className="text-left">
                  <p className="font-medium">{team.name}</p>
                  <p className="text-sm text-gray-300">Score: {team.score}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main buzzer button */}
      <div className="relative mb-8">
        {/* Ripples */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.div
                key={ripple.id}
                className="absolute w-32 h-32 rounded-full border-2"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderColor: selectedTeamData?.color || '#3B82F6'
                }}
                initial={{ scale: 0.8, opacity: 1 }}
                animate={{ scale: 2.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Buzzer button */}
        <motion.button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={buzzerState.pressed}
          className="relative w-64 h-64 rounded-full focus:outline-none focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: buzzerState.pressed 
              ? `radial-gradient(circle at 30% 30%, ${selectedTeamData?.color || '#3B82F6'}99, ${selectedTeamData?.color || '#3B82F6'}66)`
              : `radial-gradient(circle at 30% 30%, ${selectedTeamData?.color || '#3B82F6'}, ${selectedTeamData?.color || '#2563EB'})`,
            boxShadow: isPressing 
              ? `0 0 60px ${selectedTeamData?.color || '#3B82F6'}80, inset 0 4px 20px rgba(255, 255, 255, 0.3)`
              : `0 20px 60px rgba(0, 0, 0, 0.5), inset 0 4px 20px rgba(255, 255, 255, 0.2)`
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: isPressing ? 0.97 : 1,
            boxShadow: isPressing 
              ? `0 0 80px ${selectedTeamData?.color || '#3B82F6'}80, inset 0 4px 20px rgba(255, 255, 255, 0.3)`
              : `0 20px 60px rgba(0, 0, 0, 0.5), inset 0 4px 20px rgba(255, 255, 255, 0.2)`
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-8 rounded-full bg-white/10 blur-md" />
          
          {/* Button content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <AnimatePresence mode="wait">
              {buzzerState.pressed ? (
                <motion.div
                  key="pressed"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-xl font-bold">BUZZER PRESSED!</p>
                  <p className="text-sm mt-2">
                    {buzzerState.teamId === selectedTeam ? 'You pressed it!' : 'Another team pressed it'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-center"
                >
                  <div className="text-5xl mb-4">🔥</div>
                  <p className="text-2xl font-bold">PRESS BUZZER</p>
                  <p className="text-sm mt-2 opacity-80">
                    {isPressing ? 'Release to confirm...' : 'Hold Space or tap & hold'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
        
        {/* Press status */}
        <div className="mt-6 text-center">
          {buzzerState.pressed ? (
            <div className="space-y-2">
              <p className="text-lg">
                <span className="font-semibold" style={{ color: selectedTeamData?.color }}>
                  {getTeamById(buzzerState.teamId)?.name || 'Team'}
                </span> pressed first!
              </p>
              <p className="text-sm text-gray-400">
                Pressed at {new Date(buzzerState.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">Ready to buzz in...</p>
          )}
        </div>
      </div>
      
      {/* Control buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <button
          onClick={() => resetBuzzer()}
          disabled={!buzzerState.pressed}
          className="btn-secondary px-6 py-3"
        >
          Reset Buzzer
        </button>
        
        <button
          onClick={() => lockBuzzer(!buzzerState.locked)}
          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-semibold rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all"
        >
          {buzzerState.locked ? '🔓 Unlock Buzzer' : '🔒 Lock Buzzer'}
        </button>
        
        <button
          onClick={() => {
            const newGameId = 'game-' + Math.random().toString(36).substr(2, 9)
            useGameStore.getState().setGameId(newGameId)
            toast.success(`New game created: ${newGameId}`)
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all"
        >
          New Game
        </button>
      </div>
      
      {/* Instructions */}
      <div className="mt-12 max-w-2xl text-center text-gray-400">
        <h4 className="font-semibold mb-2 text-gray-300">How to Play</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-2">👆</div>
            <p><strong>Tap & Hold</strong> the buzzer button or press <kbd className="px-2 py-1 bg-gray-800 rounded">Spacebar</kbd></p>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-2">👥</div>
            <p><strong>Select your team</strong> with number keys <kbd className="px-2 py-1 bg-gray-800 rounded">1-4</kbd></p>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="text-2xl mb-2">⚡</div>
            <p><strong>Ultra-low latency</strong> for competitive buzzer response</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerBuzzer