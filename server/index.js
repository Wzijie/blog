const express = require('express');
const path = require('path');
const deploy = require('./deploy');
const secret = require('./secret');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.use(express.json());

app.post('/deploy', async (req, res) => {
  if (secret !== req.body.secret) return res.status(500).json({ error: 'invalid secret' });

  deploy()
    .then(() => res.json({ code: 200, message: 'deploy success' }))
    .catch(err => res.status(500).json({ code: 500, message: err.message, error: err }))
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(9000);
