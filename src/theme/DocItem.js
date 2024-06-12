import React from 'react';
import DocItem from '@theme-original/DocItem';
import { usePluginData } from '@docusaurus/useGlobalData';
import { useLocation } from '@docusaurus/router';

function WordCount() {
  const pluginData = usePluginData('docusaurus-plugin-content-docs');
  const { pathname } = useLocation();
  let docId = pathname.replace(/^\//, '').replace(/\/$/, '') + '.md';

  // 使用正斜杠
  docId = '/' + docId.replace(/\\/g, '/');

  const wordCounts = pluginData.wordCounts || {};
  const wordCount = wordCounts[docId];

  console.log('Document ID:', docId);
  console.log('Word Count:', wordCount);

  return wordCount ? <p>Word Count: {wordCount}</p> : null;
}

export default function DocItemWrapper(props) {
  return (
    <>
      <DocItem {...props} />
      <WordCount />
    </>
  );
}
