const algoliasearch = require('algoliasearch');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const client = algoliasearch('S9YFRHE4AD', '8a506d850f8c4cba4ab85f6ccab9a3ef');
const index = client.initIndex('vk');

const getMarkdownFiles = (src) => {
  return glob.sync(src + '/**/*.md');
};

const docsFiles = getMarkdownFiles('./docs');
const k8sFiles = getMarkdownFiles('./src/k8s');
const allFiles = [...docsFiles, ...k8sFiles];

const getHierarchy = (file) => {
  const relativePath = path.relative('.', file).replace(/\\/g, '/');
  const parts = relativePath.split('/');
  
  if (parts[0] === 'docs') {
    return {
      lvl0: 'Documentation',
      lvl1: parts[1] || '',
      lvl2: parts[2] ? parts[2].replace('.md', '') : ''
    };
  } else if (parts[0] === 'src' && parts[1] === 'k8s') {
    return {
      lvl0: 'Documentation',
      lvl1: 'k8s',
      lvl2: parts[2] ? parts[2].replace('.md', '') : ''
    };
  }
  return {};
};

const baseURL = 'http://localhost:3000'; // 使用本地域名

const records = allFiles.map(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const title = lines.find(line => line.startsWith('# '));
  const textContent = lines.join(' ');

  let relativeUrl = path.relative('.', file).replace(/\\/g, '/').replace('.md', '');
  if (relativeUrl.startsWith('docs')) {
    relativeUrl = relativeUrl.replace('docs/', '');
  }

  return {
    objectID: file,
    title: title ? title.replace('# ', '') : 'Untitled',
    content: textContent,
    url: `${baseURL}/docs/${relativeUrl}`,
    hierarchy: getHierarchy(file),
    language: 'en',
    docusaurus_tag: ['default', 'docs-default-current', 'docs-k8s-current']
  };
});

// 将数据保存到本地文件
fs.writeFileSync('algolia_index_data.json', JSON.stringify(records, null, 2));

// 上传数据到 Algolia
index.saveObjects(records).then(({ objectIDs }) => {
  console.log('Documents indexed:', objectIDs);
}).catch(err => {
  console.error('Error indexing documents:', err);
});
