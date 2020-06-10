const exec = require('child_process').exec;
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');

const spinner = ora('deploying...');

// 统一处理同步执行命令的报错信息
const throwSynchronouslyError = ({ code, stderr }) => {
  if (code !== 0) {
    spinner.stop();
    throw stderr;
  }
}

const gitPull = () => {
  return new Promise((resolve, reject) => {
    exec('git pull', (err, stdout, stderr) => {
      if (err) {
        spinner.stop();
        reject(err)
      }
      resolve();
    });
  });
}

const build = () => {
  return new Promise((resolve, reject) => {
    exec('npm run build', { cwd: path.join(__dirname, '../') }, (err, stdout, stderr) => {
      if (err) {
        spinner.stop();
        reject(err)
      }
      resolve();
    });
  });
}

// 拷贝build目录到服务器下
const copy = () => {
  // 判断是否已有build目录，有的话需要删除
  const hasBuildFolder = shell.find('./build').code === 0;
  if (hasBuildFolder) {
    throwSynchronouslyError(shell.rm('-r', './build'));
  }
  throwSynchronouslyError(shell.cp('-r', '../build', './build'));
}

const deploy = async () => {
  spinner.start();
  await gitPull();
  await build();
  copy();
  spinner.stop();
}

module.exports = deploy;
