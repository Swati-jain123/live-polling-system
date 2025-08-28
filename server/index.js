require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path'); // <-- added
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Poll = require('./models/Poll');

const app = express();
app.use(express.json());
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || '*').split(','),
  credentials: true
}));

// --- Serve React build ---
const clientDistPath  = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath ));

// --- Health & Poll API ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/polls', async (req, res) => {
  const polls = await Poll.find().sort({ createdAt: -1 }).limit(20).lean();
  res.json(polls);
});

app.get('/polls/:id', async (req, res) => {
  const poll = await Poll.findById(req.params.id).lean();
  if (!poll) return res.status(404).json({ error: 'Not found' });
  res.json(poll);
});

// --- Serve React for all other routes ---
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath , 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_ORIGIN || '*').split(','),
    methods: ['GET','POST']
  }
});

// --- Runtime state & helpers ---
let activePoll = null;
let activeTimer = null;
let expectedRespondents = 0;
const students = new Map();
const responded = new Set();

const nowSec = () => Math.floor(Date.now() / 1000);

function broadcastResults() {
  if (!activePoll) return;
  const counts = activePoll.options.map(o => o.count);
  io.emit('poll:update', {
    pollId: activePoll._id.toString(),
    counts,
    responded: responded.size,
    expected: expectedRespondents
  });
}

function broadcastParticipants() {
  const list = Array.from(students.values())
    .filter(s => s.role === 'student')
    .map(s => s.name);
  io.emit('chat:participants', list);
}

async function endPoll(reason = 'timeout') {
  if (!activePoll) return;
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = null;

  activePoll.isActive = false;
  await activePoll.save();

  const finalData = {
    pollId: activePoll._id.toString(),
    question: activePoll.question,
    options: activePoll.options.map(o => o.text),
    counts: activePoll.options.map(o => o.count),
    totalResponses: responded.size,
    expected: expectedRespondents,
    reason
  };

  io.emit('poll:ended', finalData);

  activePoll = null;
  expectedRespondents = 0;
  responded.clear();
}

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('register', ({ name, role }) => {
    students.set(socket.id, { name: name?.trim() || 'Guest', role: role || 'student' });
    broadcastParticipants();

    if (activePoll) {
      const expiresAtSec = Math.floor(new Date(activePoll.expiresAt).getTime()/1000);
      socket.emit('poll:started', {
        pollId: activePoll._id.toString(),
        question: activePoll.question,
        options: activePoll.options.map(o => o.text),
        expiresAtSec,
        expected: expectedRespondents
      });
      broadcastResults();
    }
  });

  socket.on('teacher:createPoll', async ({ question, options, durationSec = 60 }) => {
    const sender = students.get(socket.id);
    if (!sender || sender.role !== 'teacher') return;
    if (activePoll) return socket.emit('error:info', { message: 'A poll is already active.' });

    const cleaned = (options || []).map(o => String(o).trim()).filter(Boolean);
    if (!question || cleaned.length < 2) return socket.emit('error:info', { message: 'Question and at least 2 options are required.' });

    const expiresAt = new Date(Date.now() + durationSec * 1000);
    const poll = await Poll.create({
      question: question.trim(),
      options: cleaned.map(text => ({ text, count: 0 })),
      isActive: true,
      expiresAt,
      createdBy: sender.name || 'Teacher',
      responses: []
    });

    activePoll = poll;
    responded.clear();
    expectedRespondents = Array.from(students.values()).filter(s => s.role === 'student').length;

    const payload = {
      pollId: poll._id.toString(),
      question: poll.question,
      options: poll.options.map(o => o.text),
      expiresAtSec: Math.floor(expiresAt.getTime()/1000),
      expected: expectedRespondents
    };
    io.emit('poll:started', payload);

    broadcastResults();

    activeTimer = setTimeout(() => endPoll('timeout'), durationSec * 1000);
  });

  socket.on('student:submitAnswer', async ({ optionIndex }) => {
    if (!activePoll) return;
    const info = students.get(socket.id);
    if (!info || info.role !== 'student') return;
    if (responded.has(socket.id)) return;

    const idx = Number(optionIndex);
    if (Number.isNaN(idx) || idx < 0 || idx >= activePoll.options.length) return;

    responded.add(socket.id);
    activePoll.options[idx].count += 1;
    activePoll.responses.push({
      studentId: socket.id,
      name: info.name,
      optionIndex: idx,
      submittedAt: new Date()
    });
    await activePoll.save();

    broadcastResults();
    if (expectedRespondents > 0 && responded.size >= expectedRespondents) endPoll('all-answered');
  });

  socket.on('teacher:endPoll', () => {
    const sender = students.get(socket.id);
    if (!sender || sender.role !== 'teacher') return;
    endPoll('manual');
  });

  socket.on('chat:message', (data) => {
    const payload = {
      sender: data?.sender || 'Anonymous',
      message: String(data?.message || '').slice(0, 500),
      role: data?.role || 'student',
      at: Date.now()
    };
    io.emit('chat:message', payload);
  });

  socket.on('chat:kick', (userName) => {
    const sender = students.get(socket.id);
    if (!sender || sender.role !== 'teacher') return;
    const target = [...students.entries()].find(([id, s]) => s.name === userName);
    if (target) {
      const [targetId] = target;
      io.to(targetId).emit('chat:kicked');
      setTimeout(() => {
        io.sockets.sockets.get(targetId)?.disconnect(true);
        students.delete(targetId);
        broadcastParticipants();
      }, 500);
    }
  });

  socket.on('disconnect', () => {
    students.delete(socket.id);
    broadcastParticipants();
    console.log('Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { dbName: 'live_polls' })
  .then(() => {
    server.listen(PORT, () => console.log('Server listening on ' + PORT));
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message);
    server.listen(PORT, () => console.log('Server listening without DB on ' + PORT));
  });
