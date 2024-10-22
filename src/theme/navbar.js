import React from 'react';
import OriginalNavbar from '@theme-original/Navbar';
import './navbar.css'; // 导入新的导航栏 CSS 文件

export default function CustomNavbar(props) {
  return <OriginalNavbar {...props} />;
}
