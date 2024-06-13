const readingTime = require('reading-time');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function getFiles(dir, files = [], baseDir = '') {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return files;
  }

  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files, baseDir ? baseDir + '/' + file : file);
    } else if (file.endsWith('.md')) {
      const relativeFilePath = baseDir ? baseDir + '/' + file : file;
      files.push({
        fullPath: filePath,
        relativePath: relativeFilePath
      });
    }
  });

  return files;
}

function wordCountPlugin(context, options) {
  return {
    name: 'word-count-plugin',
    async contentLoaded({ content, actions }) {
      const docsDir = path.resolve(context.siteDir, './docs');
      const srcDir = path.resolve(context.siteDir, './src');

      const docsFiles = getFiles(docsDir, [], '/docs');
      const srcFiles = getFiles(srcDir, [], '/src');

      const allFiles = [...docsFiles, ...srcFiles];

      const wordCounts = allFiles.reduce((acc, { fullPath, relativePath }) => {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const stats = readingTime(content);

        // 解析 Markdown 文件的前置元数据
        const { data } = matter(content);
        let cleanPath = relativePath.replace(/^\/?src\//, '').replace(/\\/g, '/').replace(/\.md$/, '');
        
        const slug = data.slug ? data.slug.replace(/^\//, '') : null;
        const id = data.id;

        // 使用id替换路径的最后部分
        if (id) {
          const segments = cleanPath.split('/');
          segments[segments.length - 1] = id;
          cleanPath = segments.join('/');
        }

        // 处理 index 文件
        if (cleanPath.endsWith('/index')) {
          cleanPath = cleanPath.replace('/index', '');
        }

        const permalink = slug ? `/${slug}` : `/${cleanPath}`;
        const finalPermalink = permalink.replace(/\/\//g, '/'); // 移除多余的斜杠

        acc[finalPermalink] = { words: stats.words };
        return acc;
      }, {});

      const outputFilePath = path.join(context.siteDir, 'static', 'wordCounts.json');
      fs.writeFileSync(outputFilePath, JSON.stringify(wordCounts, null, 2));
      console.log('Word counts JSON file created:', outputFilePath);
    },
  };
}

module.exports = wordCountPlugin;
