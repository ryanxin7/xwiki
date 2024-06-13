import React, { useEffect, useState } from 'react';
import { useDoc } from '@docusaurus/theme-common/internal';

const WordCount = () => {
  const [wordCounts, setWordCounts] = useState({});
  const { metadata } = useDoc(); // 获取当前文档的元数据

  useEffect(() => {
    const fetchWordCounts = async () => {
      try {
        const response = await fetch('/wordCounts.json');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setWordCounts(data);
      } catch (error) {
        console.error('Error loading wordCounts.json:', error);
      }
    };

    fetchWordCounts();
  }, []);

  // 确保 wordCounts 已经被设置
  if (Object.keys(wordCounts).length === 0) {
    return <p>Loading word count...</p>;
  }

  // 获取文档的路径信息
  const docPath = metadata.permalink.replace(/\/$/, ''); // 去除末尾的斜杠

  console.log('Document Path:', docPath); // 打印 docPath

  const wordCount = wordCounts[docPath]?.words;

  if (wordCount !== undefined) {
    return (
      <div>
        <p>Word Count: {wordCount}</p>
      </div>
    );
  } else {
    console.warn(`No word count found for document path: ${docPath}`);
    return <p>No word count available for this document.</p>;
  }
};

export default WordCount;
