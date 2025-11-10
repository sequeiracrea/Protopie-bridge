let clients = [];
let currentPos = { x: 0, y: 0 };

// SSE
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);
  console.log(`🟢 Nouvel abonné SSE, total : ${clients.length}`);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
    console.log(`🔴 Client SSE déconnecté, total : ${clients.length}`);
  });
});

// Diffusion vers tous les clients SSE
function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach(c => c.write(`data: ${payload}\n\n`));
  console.log('📩 Données diffusées :', data);
}

// POST X
app.post('/api/x', (req, res) => {
  const x = Number(req.body.value);
  if (isNaN(x)) return res.status(400).send('x must be a number');
  currentPos.x = x;
  broadcast(currentPos);
  res.sendStatus(200);
});

// POST Y
app.post('/api/y', (req, res) => {
  const y = Number(req.body.value);
  if (isNaN(y)) return res.status(400).send('y must be a number');
  currentPos.y = y;
  broadcast(currentPos);
  res.sendStatus(200);
});

// Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
