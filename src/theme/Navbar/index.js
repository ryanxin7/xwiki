import React from 'react';
import OriginalNavbar from '@theme-original/Navbar';
import Link from '@docusaurus/Link';
import './navbar.css'; // 引入样式

export default function CustomNavbar(props) {
  return (
    <div className="custom-navbar">
      <OriginalNavbar {...props} />

    </div>
  );
}
