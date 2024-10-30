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
            <a href="#" className={styles.socialIcon} >
               <img src="img/yuque.svg" alt="yuque" /> {/* Use an SVG for Xiaohongshu */}
            </a>
            <a href="https://www.instagram.com/rain.sz1?igsh=NTR0bDc1dDF2aWoz&utm_source=qr" className={styles.socialIcon} style={{ backgroundColor: '#E1306C' }}>
              <i className="fab fa-instagram"></i> {/* Instagram icon */}
            </a>    
            <a href="https://www.reddit.com/u/Adventurous-Cat2770/s/BRJZF5CHzg" className={styles.socialIcon} style={{ backgroundColor: '#FF4500' }}>
              <i className="fab fa-reddit-alien"></i> {/* Reddit icon */}
            </a>
            <a href="https://www.xiaohongshu.com/user/profile/620f22950000000021024021?xhsshare=CopyLink&appuid=620f22950000000021024021&apptime=1730278633&share_id=3ea0aafbe8094696ae28c67d52d35f12" className={styles.socialIcon} >
               <img src="img/xiaohongshu-icon.svg" alt="Xiaohongshu" /> {/* Use an SVG for Xiaohongshu */}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeroBanner;
