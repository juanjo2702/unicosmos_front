# Trivia UNITEPC - Frontend

React frontend for the Trivia UNITEPC interactive quiz system with real-time buzzer functionality.

## Features

- Real-time buzzer interface with ultra-low latency using Laravel Echo
- Zustand state management for authentication and game state
- Responsive design with Tailwind CSS and Framer Motion animations
- Three user roles: Admin, Presenter, and Player/Teams
- Game lobby, player buzzer, presenter dashboard, and admin panel

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend repository)
- Laravel Reverb WebSocket server running

## Setup

1. Clone this repository
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Update environment variables in `.env.local`:
   - `VITE_API_URL`: URL of your Laravel backend (default: http://localhost:8000)
   - `VITE_REVERB_*`: WebSocket configuration for Laravel Reverb

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Docker Deployment

For containerized deployment, use the `docker-compose.yml` file in the backend repository which orchestrates both frontend and backend services.

## Project Structure

```
src/
├── api/           # API client with authentication handling
├── components/    # Reusable React components
├── hooks/         # Custom React hooks (useReverb for WebSockets)
├── pages/         # Page components (Login, GameLobby, etc.)
├── stores/        # Zustand stores (authStore, gameStore)
└── echo.js        # Laravel Echo configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:8000 |
| VITE_REVERB_APP_KEY | Laravel Reverb app key | app-key |
| VITE_REVERB_HOST | WebSocket host | localhost |
| VITE_REVERB_PORT | WebSocket port | 8080 |
| VITE_REVERB_SCHEME | WebSocket scheme (ws/wss) | http |

## Authentication

The frontend uses token-based authentication with Laravel Sanctum. Tokens are automatically included in API requests via the `ApiClient` class.

## Real-time Features

- **Laravel Echo**: Handles WebSocket connections for real-time events
- **useReverb hook**: Custom hook for subscribing to channels and listening to events
- **Events**: Buzzer presses, game state changes, team updates

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint (requires configuration)
- `npm run preview` - Preview production build

## Backend Integration

This frontend is designed to work with the [Trivia UNITEPC Backend](https://github.com/juanjo2702/unicosmos_back.git). Ensure the backend is running and configured correctly.

## License

Proprietary - Universidad Tecnológica de Pereira (UNITEPC)