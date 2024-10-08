// src/components/HeroBanner.js
import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import { useColorMode } from '@docusaurus/theme-common';
import styles from '../pages/index.module.css';

function HeroBanner() {
  const { colorMode } = useColorMode();

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner, {
      [styles.heroBannerDark]: colorMode === 'dark'
    })}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className="hero__title">Ryan's Wiki</h1>
            <p className="hero__subtitle">
            这是一个装满“比我熬夜还多”知识的仓库！，希望这些内容对你有所帮助，也能为你带来一些乐趣和启发。
            </p>
            <div className={styles.buttons}>
              <Link className="button button--secondary button--lg" to="/k8s">
                马上开始
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            {colorMode === 'dark' ? (
              <img src="/img/creativity.png" alt="Creativity Illustration" className={styles.heroImg} />
            ) : (
              <object type="image/svg+xml" data="http://img.xinn.cc/xwiki/saas-3.svg" aria-label="SaaS Illustration"className={styles.heroSvg}></object>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeroBanner;
