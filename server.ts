import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes';
import ideaRoutes from './server/routes/ideaRoutes';
import commentRoutes from './server/routes/commentRoutes';
import userRoutes from './server/routes/userRoutes';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Socket.IO real-time connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Attach io instance to app for controllers to emit events
  app.set('io', io);

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'CivicPulse Smart City Engine', timestamp: new Date().toISOString() });
  });

  // SQL Schema Endpoint
  app.get('/api/schema/sql', (req, res) => {
    try {
      const sqlPath = path.join(process.cwd(), 'server', 'schema.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      res.type('text/plain').send(sqlContent);
    } catch (err) {
      res.status(500).json({ error: 'Could not read SQL schema file.' });
    }
  });

  // Backend API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/ideas', ideaRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/users', userRoutes);

  // Serve Frontend via Vite Middleware in Dev or Static files in Prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CivicPulse Smart City Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting CivicPulse server:', err);
});

