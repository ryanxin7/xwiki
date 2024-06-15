// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';


/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ryan\'s Wiki',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'http://wiki.xinn.cc',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ryanxin7', // Usually your GitHub org/user name.
  projectName: 'xwiki', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        //blog: {
        //  showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
         // editUrl:
          //  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          //  blogSidebarCount: 'ALL',
          //  blogSidebarTitle: 'All posts',
        //},
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'k8s',
        path: 'src/k8s',
        routeBasePath: 'k8s',
        sidebarPath: require.resolve('./sidebars.js'), // 这里需要单独的侧边栏文件
        editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'haproxy',
        path: 'src/haproxy',
        routeBasePath: 'haproxy',
        sidebarPath: require.resolve('./sidebars.js'), // 这里需要单独的侧边栏文件
        editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'ELK',
        path: 'src/elk',
        routeBasePath: 'elk',
        sidebarPath: require.resolve('./sidebars.js'), // 这里需要单独的侧边栏文件
        editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
      },
    ],
    require.resolve('./plugins/word-count-plugin.js'),
    require.resolve('./plugins/docusaurus-plugin-recent-updates'),
  ],


  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Ryan\'s wiki',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          /*{
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Tutorial',
          },*/
          {
            to: 'k8s/',
            activeBasePath: 'k8s',
            label: 'Kubernetes',
            position: 'left',
          },
          {
            to: 'haproxy/haproxy-1',
            activeBasePath: 'haproxy',
            label: 'haproxy',
            position: 'left',
          },
          {
            to: 'elk/elk-Elasticsearch',
            activeBasePath: 'elk',
            label: 'ELK',
            position: 'left',
          },
          //{to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/facebook/docusaurus',
            /*label: 'GitHub',*/
            position: 'right',
            className: "header-github-link",
            "aria-label": "GitHub repository",
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docusaurus',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/docusaurus',
              },
            ],
          },
          {
            title: 'More',
            //items: [
             // {
             //   label: 'Blog',
             //   to: '/blog',
             // },
             // {
             //   label: 'GitHub',
            //    href: 'https://github.com/facebook/docusaurus',
            //  },
            //],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ryan's Wiki, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash'],
      },
      algolia: {
        appId: 'UTHK6Z5YDW',
        apiKey: '674fe85b9c2e2829b4d4179196f6c7df',
        indexName: 'xinn',
        contextualSearch: true,
        searchParameters: {
        facetFilters: [`lang:zh`], // 添加语言过滤器
      },
    },
    }),
};

export default config;
