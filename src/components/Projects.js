import React from 'react';
import styles from './Projects.module.css'; // 引入CSS模块
import projects from '../data/projects'; // 引入项目数据

function Projects() {
  return (
    <section className={`${styles.projectsSection} projects-section`}>
      <div className="container projects-container">
        <div className={styles.sectionTitle}>
          <h2>我的知识库</h2>
        </div>
        <div className={styles.cardContainer}>
          {/* 渲染所有项目 */}
          {projects.map((project) => (
            <div key={project.id} className={styles.card}>
              <div onClick={() => window.location.href = project.link}>
                <div className={styles.cardImage}>
                  <img src={project.imageUrl} alt={project.title} />
                </div>
                <div className={styles.cardBody}>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
