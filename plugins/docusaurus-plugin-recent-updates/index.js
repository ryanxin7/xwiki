const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

module.exports = function(context, options) {
  return {
    name: 'docusaurus-plugin-recent-updates',

    async loadContent() {
      const contentPath = path.resolve(__dirname, '../../src');
      const files = getAllFiles(contentPath, []);
      const articles = [];

      files.forEach((file) => {
        if (file.endsWith('.md') || file.endsWith('.mdx')) {
          const fileContent = fs.readFileSync(file, 'utf-8');
          const { data, content } = matter(fileContent);
          if (data.date) {
            articles.push({
              title: data.title || path.basename(file, path.extname(file)),
              date: new Date(data.date),
              image: data.image || null,
              excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
              path: file.replace(contentPath, '').replace(/\\/g, '/').replace(/.mdx?$/, ''),
            });
          }
        }
      });

      // 按日期排序
      articles.sort((a, b) => b.date - a.date);

      console.log("Loaded articles:", articles); // Debug: 输出加载的文章信息

      return articles;
    },

    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;
      setGlobalData({ recentUpdates: content });
    },
  };
};

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrayOfFiles;
}
