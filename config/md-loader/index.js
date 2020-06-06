const hljs = require('highlight.js');
const fs = require('fs');

const createDemoSource = (source, fileName) => {
  fs.writeFile(`demo/${fileName}.js`, source, err => {
    if (err) throw err;
    console.log('save complete');
  });
}

const md = require('markdown-it')({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const code = `<pre class="hljs"><code class="block">${hljs.highlight(lang, str, true).value}</code></pre>`;
        console.log(code, 'code')
        return code;
      } catch (__) { }
    }
    return '<pre class="hljs"><code class="block">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

module.exports = function (source) {
  // return `
  //   import React from 'react';

  //   const Text = () => <p>test</p>;

  //   export default Text;
  // `;
  const content = md.render(source);
  // console.log(content, 'content');
  createDemoSource(`
  import React from 'react';

  export default () => (<div className="md-block" dangerouslySetInnerHTML={{__html: \`${content}\`}} />);
`, 'test');
  const result = `
    import React from 'react';

    export default () => (<div className="md-block" dangerouslySetInnerHTML={{__html: \`${content}\`}} />);
  `

  return result;
}
