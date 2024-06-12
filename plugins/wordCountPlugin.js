const readingTime = require('reading-time');
const fs = require('fs');
const path = require('path');

function getFiles(dir, files = [], baseDir = '') {
  if (!fs.existsSync(dir)) {
    return files;
  }

  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files, baseDir ? baseDir + '/' + file : file);
    } else if (file.endsWith('.md')) {
      files.push({
        fullPath: filePath,
        relativePath: baseDir ? baseDir + '/' + file : file
      });
    }
  });
  return files;
}

function wordCountPlugin(context, options) {
  return {
    name: 'docusaurus-word-count-plugin',
    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;

      const docsDirs = [
        {dir: path.resolve(context.siteDir, './docs'), base: '/docs'},
        {dir: path.resolve(context.siteDir, './src/k8s'), base: '/k8s'},
        {dir: path.resolve(context.siteDir, './src/haproxy'), base: '/haproxy'},
      ];

      const files = docsDirs.flatMap(({dir, base}) => getFiles(dir, [], base));

      const wordCounts = files.reduce((acc, {fullPath, relativePath}) => {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const stats = readingTime(content);
        const cleanPath = relativePath.replace(/\\/g, '/'); // 使用正斜杠
        acc[cleanPath] = stats.words;
        return acc;
      }, {});

      console.log('Word Counts:', wordCounts);

      setGlobalData({
        'docusaurus-plugin-content-docs': { wordCounts },
      });
    },
  };
}

module.exports = wordCountPlugin;
