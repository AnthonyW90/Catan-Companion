import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { Server } from 'socket.io'
import { getGameState, addPlayer, rollDice } from './gameState'

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => c.text('Catan Companion App Backend'));

app.get('/game-state', (c) => {
  return c.json(getGameState());
});

app.post('/add-player', async (c) => {
  const { name } = await c.req.json();
  const newPlayer = addPlayer(name);
  return c.json(newPlayer);
});

app.post('/roll-dice', (c) => {
  const roll = rollDice();
  return c.json(roll);
})


const server = serve({ fetch: app.fetch, port: 3001 })
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  console.log('A user connected')

  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})

console.log('Server is running on http://localhost:3001')