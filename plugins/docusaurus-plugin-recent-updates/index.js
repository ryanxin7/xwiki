const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

module.exports = function(context, options) {
  return {
    name: 'docusaurus-plugin-recent-updates',

    async loadContent() {
      // 定义多个目录路径，支持加载 ../../src 和 ../../blog
      const contentPaths = [path.resolve(__dirname, '../../src'), path.resolve(__dirname, '../../blog')];
      const allArticles = [];

      // 从每个目录加载内容
      for (let contentPath of contentPaths) {
        const files = getAllFiles(contentPath, []);
        files.forEach((file) => {
          if (file.endsWith('.md') || file.endsWith('.mdx')) {
            const fileContent = fs.readFileSync(file, 'utf-8');
            const { data, content } = matter(fileContent);

            if (data.date) {
              let relativePath = file.replace(contentPath, '').replace(/\\/g, '/').replace(/.mdx?$/, '');
              let articlePath;

              // 如果是 /blog 目录，前面加上 /blog
              if (contentPath.includes('blog')) {
                if (data.id) {
                  // 使用 id 来构建路径
                  articlePath = '/blog/' + data.id;
                } else {
                  // 没有 id 时，使用文件的相对路径
                  articlePath = '/blog' + relativePath;
                }
              } else {
                // 如果是 /src 目录，直接用相对路径生成
                if (data.id) {
                  // 使用 id 来构建路径，替换路径的最后部分为 data.id
                  const pathParts = relativePath.split('/');
                  pathParts[pathParts.length - 1] = data.id;  // 替换最后部分为 id
                  articlePath = '/' + pathParts.join('/');
                } else {
                  // 没有 id 时，使用文件的相对路径
                  articlePath = '/' + relativePath;
                }
              }

              // 确保路径以斜杠开头
              if (!articlePath.startsWith('/')) {
                articlePath = '/' + articlePath;
              }

              // 去除不需要的多余部分，只保留所需路径
              articlePath = articlePath.replace(/^\/+/, '/'); // 去掉开头的多个斜杠

              allArticles.push({
                title: data.title || path.basename(file, path.extname(file)),
                date: new Date(data.date),
                image: data.image || null,
                excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                path: articlePath,
              });
            }
          }
        });
      }

      // 按日期排序
      allArticles.sort((a, b) => b.date - a.date);

      return allArticles;
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
