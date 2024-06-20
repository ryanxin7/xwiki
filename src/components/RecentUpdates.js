import React, { useEffect, useState } from 'react';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './RecentUpdates.module.css';

const truncateText = (text, length) => {
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length) + '...';
};

const cleanText = (text) => {
  // 使用正则表达式清理特定字符串和Markdown符号
  return text.replace(/import WordCount from '@site\/src\/components\/WordCount';\s*<WordCount \/>/g, '')
             .replace(/<a name=".*"><\/a>/g, '') // 移除 <a name="*"></a> 标签
             .replace(/[#*`]/g, '') // 移除 # * ` 等符号
             .replace(/!\[.*\]\(.*?\)/g, '') // 移除 Markdown 图片链接
             .trim();
};

const RecentUpdates = () => {
  const { recentUpdates } = usePluginData('docusaurus-plugin-recent-updates') || [];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  // Limit the number of recent updates to a maximum of 15
  const limitedRecentUpdates = recentUpdates.slice(0, 15);

  return (
    <div className={styles.recentUpdatesSection}>
      <h2>最近更新</h2>
      <div className={styles.recentUpdates}>
        {limitedRecentUpdates.map((update, index) => (
          <div key={index} className={`${styles.updateItem} ${!update.image ? styles.noImage : ''}`}>
            <div className={styles.updateHeaderContent}>
              <div className={styles.updateHeader}>
                <div className={styles.updateDot}></div>
                <div className={styles.updateDate}>{new Date(update.date).toLocaleString()}</div>
              </div>
              <div className={styles.updateContent}>
                <div className={styles.updateText}>
                  <h3 className={styles.updateTitle}><a href={update.path}>{update.title}</a></h3>
                  <p className={styles.updateExcerpt}>
                    {isMobile ? truncateText(cleanText(update.excerpt), 100) : cleanText(update.excerpt)}
                  </p>
                  <a href={update.path} className={styles.readMore}>查看原文</a>
                </div>
                {update.image && (
                  <div className={styles.updateImageContainer}>
                    <img src={update.image} alt={update.title} className={styles.updateImage} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {recentUpdates.length > 20 && (
          <div className={styles.noMoreUpdates}>
            <p>找不到更早的更新了，就让以前随风而逝吧…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentUpdates;
