import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <div className="text-9xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          404
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back to the game!
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-8 py-3"
          >
            Go to Home
          </button>
          <button
            onClick={() => navigate('/play')}
            className="btn-secondary px-8 py-3"
          >
            Player Buzzer
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all"
          >
            Go Back
          </button>
        </div>
        
        <div className="mt-12 p-6 rounded-2xl glass-morphism max-w-lg">
          <h3 className="font-semibold mb-3">Available Pages</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left"
            >
              <span className="font-medium">Game Lobby</span>
              <p className="text-sm text-gray-400">Start or join games</p>
            </button>
            <button
              onClick={() => navigate('/play')}
              className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left"
            >
              <span className="font-medium">Player Buzzer</span>
              <p className="text-sm text-gray-400">Interactive buzzer</p>
            </button>
            <button
              onClick={() => navigate('/presenter')}
              className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left"
            >
              <span className="font-medium">Presenter</span>
              <p className="text-sm text-gray-400">Game controls</p>
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all text-left"
            >
              <span className="font-medium">Admin</span>
              <p className="text-sm text-gray-400">System settings</p>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFound