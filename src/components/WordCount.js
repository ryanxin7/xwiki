import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

const WordCount = () => {
  const [wordCounts, setWordCounts] = useState({});
  const location = useLocation(); // 获取当前路径

  // 仅在类别页面上使用 useCurrentSidebarCategory
  let currentCategory;
  try {
    currentCategory = useCurrentSidebarCategory();
  } catch (error) {
    console.warn('useCurrentSidebarCategory should only be used on category index pages.');
  }

  const docPath = location.pathname.replace(/\/$/, '');

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

  if (Object.keys(wordCounts).length === 0) {
    return <p>Loading word count...</p>;
  }

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
