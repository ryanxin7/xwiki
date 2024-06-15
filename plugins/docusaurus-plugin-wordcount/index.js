const fs = require('fs');
const path = require('path');
const globby = require('globby');

module.exports = function (context, options) {
  return {
    name: 'docusaurus-plugin-wordcount',
    async loadContent() {
      console.log('Loading docusaurus-plugin-wordcount');  // 调试信息
      const docsDir = path.resolve(__dirname, '..', '..', 'docs');
      const files = await globby(['**/*.md'], { cwd: docsDir });
      const wordCounts = {};

      files.forEach((file) => {
        const filePath = path.join(docsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
        wordCounts[file] = wordCount;
      });

      console.log('Word counts:', wordCounts);  // 调试信息
      return wordCounts;
    },
    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;
      setGlobalData({ 'docusaurus-plugin-wordcount': content });
      console.log('Set global data:', content);  // 调试信息
    },
  };
};
