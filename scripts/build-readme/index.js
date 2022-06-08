const fs = require('fs');
const navConfig = require('../../src/nav.config');

const githubURL = 'https://github.com/Wzijie/';

const getGithubArticlePath = articlePath => {
  return `${githubURL}blog/blob/master/src/article${articlePath}.md`;
}

const getArticleSection = (title, articleList) => {
  return articleList.reduce((prev, { name, path }) => {
    return `${prev}- [${name}](${getGithubArticlePath(path)})\n`
  }, `## ${title}\n\n`);
}

const readmeTitle = '# Blog';

const readmeContent = navConfig
  .filter(({ children }) => children.length > 0)
  .reduce((prev, { name: title, children }) => {
    const articleList = getArticleSection(title, children);
    return `${prev}${articleList}\n`;
  }, '');

const result = `${readmeTitle}

[博客地址 https://weizijie.cc](https://weizijie.cc)

${readmeContent}`;

fs.writeFile('README.md', result, err => {
  if (err) throw err;
});
