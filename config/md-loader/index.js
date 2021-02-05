const hljs = require('highlight.js');
const fs = require('fs');
const moment = require('moment');

// 整片文章是用反引号``包裹的，所以如果文章内再出现``的话需要进行处理，比如代码块内
// 具体就是将`abc${console.log(1)}`这样的文本转换成\`abc${'console.log(1)'}\`
// ${}内的代码直接转成字符以及对反引号转义
// const codeFormat = mdContent => {
//   return mdContent.replace(/`.{0,}`/g, match => {
//     const code = match.replace(/\$\{(.{0,})\}/g, (_, group) => `\${"${group}"}`);
//     return `\\\`${code.slice(1, -1)}\\\``;
//   });
// }

// 将代码字符中的反引号"`"以及${xxx}的"$"前面加上"\"字符进行转义
const codeFormat = mdContent => {
  // 将`xxxxx`替换为 \`xxxxx`\
  const format1 = mdContent.replace(/`(.{0,})`/g, '\\`$1\\`');
  // 将${xxxxx}替换为/${xxxxx}，2个$$变量表示插入一个"$"，$1为第一个捕获内容
  const format2 = format1.replace(/\$(\{.{0,}\})/g, '\\$$$1');
  return format2;
}

// 将要传递给babel-loader编译的React字符串模板写入到demo目录下，主要是调试用
const createDemoSource = (source, resourcePath) => {
  const fileName = resourcePath.slice(resourcePath.lastIndexOf('\\'), resourcePath.lastIndexOf('.'));
  fs.writeFile(`demo/${fileName}.js`, source, err => {
    if (err) throw err;
  });
}

// 获取文件信息，主要是创建时间和修改时间
const getFileInfo = path => {
  return new Promise(resolve => {
    fs.stat(path, (err, stats) => {
      if (err) resolve([err]);
      resolve([err, stats]);
    });
  });
}

const md = require('markdown-it')({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      const code = `<pre class="hljs"><code class="block">${hljs.highlight(lang, str, true).value}</code></pre>`;
      return code;
    }
    return '<pre class="hljs"><code class="block">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

module.exports = async function (source) {
  const callback = this.async();

  let content = md.render(source);

  const [err, fileInfo = {}] = await getFileInfo(this.resourcePath);

  if (err) {
    this.emitError(err);
  } else {
    const { mtime, birthtime } = fileInfo;
    const timeInfo = `<p class="time-info">
      <span>创建于 ${moment(birthtime).format('YYYY-MM-DD HH:mm')}</span>
      <span>编辑于 ${moment(mtime).format('YYYY-MM-DD HH:mm')}</span>
    </p>`;
    content = `${content}${timeInfo}`;
  }

  const result = `
    import React from 'react';

    export default () => (<div className="md-block" dangerouslySetInnerHTML={{__html: \`${codeFormat(content)}\`}} />);
  `;

  process.env.MD_TEST && createDemoSource(result, this.resourcePath);

  callback(null, result);
}
