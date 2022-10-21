# 基于GitHub Webhook自动部署

## 前言

本文记录如何使用Webhook来完成自动部署，最终达成的目标是当`git push`推送代码后，服务器自动执行构建部署。

## Webhook

GitHub Webhook提供了在仓库发生变化后调用给定接口的钩子，其中就有push动作，还有诸如issue变化时的一些动作，感兴趣可以去查阅相关内容，文档有一句话是动作发生后通知你，要做什么全凭你的想象，而我们这里要做的就是当代码推送后，执行构建部署。

## 构建流程

需要对外开放一个接口，该接口要做的是就是部署，作为一名前端也是理所应当使用了node来编写，话不多说，接下来开始介绍部署流程

开始之前先介绍node的`child_process`模块，该模块提供了创建子进程来执行命令的功能，这里不过多介绍用法，相关内容可以查阅文档

1. 进入项目目录执行`git pull`拉取代码
2. 执行构建命令如`npm run build`
3. 构建完毕后将构建出的资源移到服务器目录下

简单三步就完成构建了，以下列出具体步骤对应的代码

第一步执行`git pull`

```javascript
const exec = require('child_process').exec;

const gitPull = () => {
  return new Promise((resolve, reject) => {
    exec('git pull', (err, stdout, stderr) => {
      if (err) reject(err);
      resolve();
    });
  });
}
```

用exec方法在执行`git pull`，这里因为部署的方法也是写在项目内的，所以默认在当前目录执行，因为是异步的所以使用Promise处理，接下来是执行构建

```javascript
const exec = require('child_process').exec;
const path = require('path');

const build = () => {
  return new Promise((resolve, reject) => {
    exec('npm run build', { cwd: path.join(__dirname, '../') }, (err, stdout, stderr) => {
      if (err) reject(err);
      resolve();
    });
  });
}
```

跟上面一样的使用方式，执行`npm run build`命令开始构建，这里需要注意的是传了第二个对象参数，该参数为一些选项，其中`cwd`接收一个路径字符串，用来指定执行命令的目录。接下来将构建出的资源移到服务器目录下

```javascript
const shell = require('shelljs');

// 统一处理同步执行命令的报错信息
const throwSynchronouslyError = ({ code, stderr }) => {
  if (code !== 0) throw stderr;
}

// 拷贝build目录到服务器下
const copy = () => {
  // 判断是否已有build目录，有的话需要删除
  const hasBuildFolder = shell.find('./build').code === 0;
  // shell.rm(选项, 删除的文件或目录)
  if (hasBuildFolder) throwSynchronouslyError(shell.rm('-r', './build'));
  // shell.cp(选项, 要拷贝的文件或目录, 拷贝至哪里)
  throwSynchronouslyError(shell.cp('-r', '../build', './build'));
}
```

拷贝前我们需要先`rm`删除已有的build目录，这里用的是`cp`系统命令来进行拷贝目录，需要注意的是没有使用exec而是引入了一个新的包`shelljs`，因为我使用的是window系统，没有`cp`命令来方便的执行拷贝，`shelljs`提供了各系统（Windows / Linux / macOS）统一的调用Unix命令的简易方法，所以我们这里引入了该工具包来执行命令。到这里部署流程就走完了，现在我们将这些操作串联起来

```javascript
const express = require('express');
const path = require('path');
const app = express();

const deploy = async () => {
  await gitPull();
  await build();
  copy();
}

app.post('/deploy', (req, res) => {
  // 不能等待执行完成再返回数据，执行太久会超时，仅打印出结果日志
  deploy()
    .then(() => console.log({ code: 200, message: 'deploy success' }))
    .catch(err => console.log({ code: 500, message: err.message, error: err }));

  res.json({ code: 200, message: 'deploy start' });
});

app.listen(9000);
```

这里编写了`deploy`部署方法，并且用express来启一个服务，对外开放一个post接口/deploy给到Webhook调用。

## 校验签名

到这里功能就已经实现完毕了，已经有一个接口能够在调用后触发部署方法，但是我们可能仅希望由Webhook调用后才部署，所以这里我们开始做一层判断是否执行。

在设置Webhook的时候需要填一个Secret选项，这个是用来生成签名的，签名会附带在请求头的`X-Hub-Signature`，格式为`sha1=signature`，由此可知是sha1加密算法，但是我用sha1加密出来的跟GitHub发送的不一致，这就奇怪了，故查了一下发现算法是sha1 的 HMAC 16 进制值，这就有点懵了，因为不懂加密算法的相关知识，所以只好找一下有没有现成的加密算法库，然后找到了这个`crypto-js`，这个库提供了各种加密算法，其中我们需要使用到的是`hmac-sha1`方法

本以为大功告成可以开始比对签名了，但是我发现文档上该方法的例子是这样的`CryptoJS.HmacSHA1("Message", "Key")`，我黑人问号脸，Message取值是啥，我只有一个填好的Secret当做Key，只好继续查阅前人留下的脚印，发现Message就是Webhook调用时传来的请求体body，知道了这些后可以正式进行比对了，下面列出修改后的代码

```javascript
const express = require('express');
const path = require('path');
const hmacSha1 = require('crypto-js/hmac-sha1');
const deploy = require('./deploy');
const app = express();

const checkSignature = (message, githubSignature) => {
  // 签名算法为 sha1 的 HMAC 16 进制值
  const localSignature = `sha1=${hmacSha1(message, secret)}`;
  if (localSignature !== githubSignature) return 'invalid secret';
}

app.post('/deploy', (req, res) => {
  // 校验签名，是否为GitHub的Webhook调用
  const checkMessage = checkSignature(
    JSON.stringify(req.body),
    req.get('X-Hub-Signature'),
  );
  if (checkMessage) return res.status(500).json({ error: checkMessage });

  // 不能等待执行完成再返回数据，执行太久会超时，仅打印出结果日志
  deploy()
    .then(() => console.log({ code: 200, message: 'deploy success' }))
    .catch(err => console.log({ code: 500, message: err.message, error: err }));

  res.json({ code: 200, message: 'deploy start' });
});

app.listen(9000);
```

到这里就校验签名就完成了，做的时候最疑惑也是最费时间就是不知道加密用的Message是啥，一开始我搜索的关键字诸如“GitHub Webhook 签名是怎么加密的”，但是这样并没有查到相关的内容，因为这点太细致了，就像是问阿尔卑斯山上的一颗石头下面放着一个蛋，这个蛋是怎么生成的一样。后来我又想想，我直接查阅一下别人的做法就行了，看看他们是怎么加密的，也就是前人留下的脚印，非常感谢

## 结语

完整的自动部署流程已经介绍完了，做了这个我的博客只需要写文章，推代码，服务器就自动更新内容，非常的方便，解放双手。

做这个了解学习了如何使用node去执行命令以及GitHub Webhook的使用，在这里还是感慨一下node真是推进前端发展的一个关键点之一。
