module.exports = function (context, options) {
    return {
      name: 'docusaurus-plugin-simple',
      async loadContent() {
        console.log('Simple plugin loaded');
        return {};
      },
      async contentLoaded({ content, actions }) {
        const { setGlobalData } = actions;
        setGlobalData({ 'docusaurus-plugin-simple': content });
        console.log('Set simple global data');
      },
    };
  };
  