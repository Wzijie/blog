const express = require('express');
const path = require('path');
const deploy = require('./deploy');
const hmacSha1 = require('crypto-js/hmac-sha1');
const secret = require('./secret');
const app = express();

const checkSignature = (message, githubSignature) => {
  // 签名算法为 sha1 的 HMAC 16 进制值
  const localSignature = `sha1=${hmacSha1(message, secret)}`;
  if (localSignature !== githubSignature) return 'invalid secret';
}

app.use(express.static(path.join(__dirname, 'build')));

app.use(express.json());

app.post('/deploy', async (req, res) => {
  // 校验签名，是否为GitHub的Webhook调用
  const checkMessage = checkSignature(
    JSON.stringify(req.body),
    req.get('X-Hub-Signature'),
  );
  if (checkMessage) return res.status(500).json({ error: checkMessage });

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
