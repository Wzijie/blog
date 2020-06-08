const hljs = require('highlight.js');
const fs = require('fs');

// 将要传递给babel-loader编译的React字符串模板写入到demo目录下，主要是调试用
const createDemoSource = (source, fileName) => {
  fs.writeFile(`demo/${fileName}.js`, source, err => {
    if (err) throw err;
  });
}

const md = require('markdown-it')({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const code = `<pre class="hljs"><code class="block">${hljs.highlight(lang, str, true).value}</code></pre>`;
        return code;
      } catch (__) { }
    }
    return '<pre class="hljs"><code class="block">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

module.exports = function (source) {
  const content = md.render(source);

  const result = `
    import React from 'react';

    export default () => (<div className="md-block" dangerouslySetInnerHTML={{__html: \`${content}\`}} />);
  `;

  createDemoSource(result, 'test');

  return result;
}
