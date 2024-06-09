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
            let relativePath = file.replace(contentPath, '').replace(/\\/g, '/').replace(/.mdx?$/, '');
            let articlePath;

            // 动态获取文件的根目录
            const relativePathParts = relativePath.split('/').filter(Boolean);
            let rootDir = '';
            if (relativePathParts.length > 0) {
              rootDir = relativePathParts[0];
            }

            console.log("relativePathParts:", relativePathParts);
            console.log("rootDir:", rootDir);

            // 动态调整目录结构
            if (data.slug) {
              const slugLevels = data.slug.split('/').filter(Boolean).length;
              const basePath = relativePathParts.slice(1, -slugLevels).join('/');
              console.log("slug basePath:", basePath);
              articlePath = path.join('/', rootDir, basePath, data.slug).replace(/\\/g, '/');
            } else if (data.id) {
              // 使用 id 替换路径中的最后一个部分，确保 id 是字符串
              const basePath = relativePathParts.slice(0, -1).join('/');
              console.log("id basePath:", basePath);
              articlePath = path.join('/', basePath, String(data.id)).replace(/\\/g, '/');
            } else {
              // 没有 slug 和 id 的情况下
              const basePath = relativePathParts.slice(1).join('/');
              console.log("default basePath:", basePath);
              articlePath = path.join('/', rootDir, basePath).replace(/\\/g, '/');
            }

            console.log("articlePath before ensuring leading slash:", articlePath);

            // 确保路径以斜杠开头
            if (!articlePath.startsWith('/')) {
              articlePath = '/' + articlePath;
            }

            console.log("final articlePath:", articlePath);

            articles.push({
              title: data.title || path.basename(file, path.extname(file)),
              date: new Date(data.date),
              image: data.image || null,
              excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
              path: articlePath,
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
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}
