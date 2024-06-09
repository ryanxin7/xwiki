import React from 'react';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './RecentUpdates.module.css';

const RecentUpdates = () => {
  const { recentUpdates } = usePluginData('docusaurus-plugin-recent-updates') || [];

  return (
    <div className={styles.recentUpdatesSection}>
      <h2>最近更新</h2>
      <div className={styles.recentUpdates}>
        {recentUpdates.map((update, index) => (
          <div key={index} className={styles.updateItem}>
            <div className={styles.updateHeaderContent}>
              <div className={styles.updateHeader}>
                <div className={styles.updateDot}></div>
                <div className={styles.updateDate}>{new Date(update.date).toLocaleString()}</div>
              </div>
              <div className={styles.updateContent}>
                <div className={styles.updateText}>
                  <h3 className={styles.updateTitle}><a href={update.path}>{update.title}</a></h3>
                  <p className={styles.updateExcerpt}>{update.excerpt}</p>
                  <a href={update.path} className={styles.readMore}>查看原文</a>
                </div>
                <div className={styles.updateImageContainer}>
                  {update.image && <img src={update.image} alt={update.title} className={styles.updateImage} />}
                </div>
              </div>
            </div>
          </div>
        ))}
        {recentUpdates.length > 0 && (
          <div className={styles.noMoreUpdates}>
            <p>找不到更早的更新了，就让以前随风而逝吧…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentUpdates;
