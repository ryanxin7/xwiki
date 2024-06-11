// src/pages/index.js
import React from 'react';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import styles from './index.module.css';
import Projects from '../components/Projects';
import RecentUpdates from '../components/RecentUpdates';
import HeroBanner from '../components/HeroBanner'; // 引入 HeroBanner 组件

function Home() {
  return (
    <Layout title="Home" description="Description of your site">
      <HeroBanner />
      <main className={styles.mainContent}>
        <Projects />
        <RecentUpdates />
      </main>
    </Layout>
  );
}

export default Home;
