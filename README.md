# Dynamic Trading Dashboard

An AI-powered trading dashboard that allows users to build and customize their portfolio views through natural language interaction.

## Features

- AI-powered dashboard creation through chat
- Real-time market data visualization
- Multi-currency support
- Customizable components
- Real-time updates
- Responsive design

## Tech Stack

### Backend
- FastAPI
- PostgreSQL
- Redis
- Celery
- OpenAI API

### Frontend
- Next.js
- Tailwind CSS
- Chart.js
- Socket.io
- React Query

## Getting Started

1. Clone the repository
2. Set up environment variables
3. Install dependencies
4. Run the development servers

## Development

```bash
# Start backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Start frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `.env` files in both backend and frontend directories with the following variables:

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## License

MIT 