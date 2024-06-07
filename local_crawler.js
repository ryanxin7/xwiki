const puppeteer = require('puppeteer');
const algoliasearch = require('algoliasearch');
const fs = require('fs');

const client = algoliasearch('S9YFRHE4AD', '8a506d850f8c4cba4ab85f6ccab9a3ef');
const index = client.initIndex('vk');

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/');

  const records = await page.evaluate(() => {
    const toRemove = (sel) => document.querySelectorAll(sel).forEach(el => el.remove());

    toRemove('script');
    toRemove('style');

    const articles = document.querySelectorAll('article');
    console.log('Articles found:', articles.length); // 输出找到的文章数量

    const extractRecords = (helpers) => {
      const activeNav = document.querySelector('.menu__link.menu__link--sublist.menu__link--active, .navbar__item.navbar__link--active');
      const lvl0 = activeNav ? activeNav.innerText : 'Documentation';

      return helpers.docsearch({
        recordProps: {
          lvl0: {
            selectors: '',
            defaultValue: lvl0,
          },
          lvl1: ['header h1', 'article h1'],
          lvl2: 'article h2',
          lvl3: 'article h3',
          lvl4: 'article h4',
          lvl5: 'article h5, article td:first-child',
          lvl6: 'article h6',
          content: 'article p, article li, article td:last-child',
        },
        indexHeadings: true,
        aggregateContent: true,
        recordVersion: 'v3',
      });
    };

    const helpers = {
      docsearch: ({ recordProps }) => {
        const records = [];
        document.querySelectorAll('article').forEach(article => {
          const record = {};
          for (const [key, props] of Object.entries(recordProps)) {
            const element = props.selectors ? article.querySelector(props.selectors) : null;
            record[key] = element ? element.innerText : props.defaultValue;
          }
          record.content = article.innerText;
          record.url = window.location.href;
          console.log('Record:', record); // 输出每个记录的详细信息
          records.push(record);
        });
        return records;
      },
    };

    return extractRecords(helpers);
  });

  console.log('Extracted records:', records);

  fs.writeFileSync('algolia_index_data.json', JSON.stringify(records, null, 2));

  if (records.length > 0) {
    index.saveObjects(records).then(({ objectIDs }) => {
      console.log('Documents indexed:', objectIDs);
    }).catch(err => {
      console.error('Error indexing documents:', err);
    });
  } else {
    console.log('No records to index.');
  }

  await browser.close();
}

run();
