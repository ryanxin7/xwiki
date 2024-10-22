import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './index.module.css';

function HeroBanner() {
  return (
    <header className={clsx(styles.hero, 'homepage')}>
      <div className={styles.heroContainer}>
        {/* 左侧头像部分 */}
        <div className={styles.circleBackground}>
          <img src="/img/im-image.png" alt="Profile" className={styles.profileImg} />
        </div>

        {/* 右侧文本部分 */}
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Hey, I'm Ryan</h1>
          <p className={styles.greeting}>一名云原生运维工程师，热衷于构建开源项目，分享云原生技术实践。</p>
          <p className={styles.greeting}>在这里，你可以浏览我的文章与笔记，了解我的学习成长之旅。</p>
          <p className={styles.heroDescription}>
          
          </p>

          {/* 社交图标部分 */}
          <div className={styles.socialIcons}>
            <a href="#" className={styles.socialIcon} style={{ backgroundColor: '#4267B2' }}>
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className={styles.socialIcon} style={{ backgroundColor: '#1DA1F2' }}>
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className={styles.socialIcon} style={{ backgroundColor: '#0077B5' }}>
              <i className="fab fa-linkedin-in"></i>
            </a>
            <a href="#" className={styles.socialIcon} style={{ backgroundColor: '#DB4437' }}>
              <i className="fab fa-google-plus-g"></i>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeroBanner;
