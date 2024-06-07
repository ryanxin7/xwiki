import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './index.module.css';
import Projects from '../components/Projects';
import RecentUpdates from '../components/RecentUpdates'; // 新增：引入最近更新组件

function Home() {
  return (
    <Layout title="Home" description="Description of your site">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className="hero__title">知识库&帮助中心</h1>
              <p className="hero__subtitle">
                Baklib是一款集在线编辑+存储+展现分享为一体的知识管理工具。支持Markdown、表格、代码块等专业编辑能力，支持多种格式的文档、视频上传，让你专注于创作。
              </p>
              <div className={styles.buttons}>
                <Link
                  className="button button--secondary button--lg"
                  to="/docs/intro">
                  马上开始
                </Link>
              </div>
            </div>
            <div className={styles.heroImage}>
              <object type="image/svg+xml" data="/img/saas-3.svg" aria-label="SaaS Illustration"></object>
            </div>
          </div>
        </div>
      </header>
      <main className={styles.mainContent}>
        <Projects />
        {/* 新增：最近更新模块 */}
        <RecentUpdates />
      </main>
    </Layout>
  );
}

export default Home;
