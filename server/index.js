const express = require('express');
const path = require('path');
const deploy = require('./deploy');
const secret = require('./secret');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.use(express.json());

app.post('/deploy', async (req, res) => {
  if (secret !== req.body.sender.login) return res.status(500).json({ error: 'invalid secret' });

  // 不能等待执行完成再返回数据了，执行太久会超时，仅打印出结果日志
  deploy()
    .then(() => console.log({ code: 200, message: 'deploy success' }))
    .catch(err => console.log({ code: 500, message: err.message, error: err }));

  res.json({ code: 200, message: 'deploy start' });
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(9000);
