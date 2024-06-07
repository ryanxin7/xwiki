import React, { useState, useEffect } from 'react';
import styles from './Projects.module.css'; // 引入CSS模块
import projects from '../data/projects'; // 引入项目数据

function Projects() {
  const pageSize = 6; // 每页显示六个项目
  const [currentPage, setCurrentPage] = useState(1); // 当前页状态
  const [translateX, setTranslateX] = useState(0); // X轴平移距离状态

  const totalPages = Math.ceil(projects.length / pageSize); // 总页数

  // 每当currentPage变化时，更新translateX状态
  useEffect(() => {
    setTranslateX(-(currentPage - 1) * 100);
  }, [currentPage]);

  // 处理分页点击事件
  const handlePageChange = (newPage) => {
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  // 渲染分页圆点
  const renderDots = () => {
    const dots = [];
    for (let i = 1; i <= totalPages; i++) {
      dots.push(
        <span
          key={i}
          className={`${styles.dot} ${i === currentPage ? styles.activeDot : ''}`}
          onClick={() => handlePageChange(i)}
        ></span>
      );
    }
    return dots;
  };

  // 获取当前页显示的项目
  const getVisibleProjects = (pageIndex) => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return projects.slice(startIndex, endIndex);
  };

  return (
    <section className={styles.projectsSection}>
      <div className="container">
        <div className={styles.sectionTitle}>
          <h2>我的知识库</h2>
        </div>
        <div className={styles.cardContainer}>
          <div className={styles.cardsWrapper} style={{ transform: `translateX(${translateX}%)`, width: `${totalPages * 100}%` }}>
            {/* 根据页数渲染每一页的项目 */}
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div key={pageIndex} className={styles.cardsPage}>
                {/* 获取当前页的项目并渲染 */}
                {getVisibleProjects(pageIndex).map((project) => (
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
            ))}
          </div>
        </div>
        <div className={styles.paginationDots}>
          {renderDots()}
        </div>
      </div>
    </section>
  );
}

export default Projects;
