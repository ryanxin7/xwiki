import React from 'react';
import { DocSearch } from '@docsearch/react';
import '@docsearch/css';

function Search() {
  return (
    <DocSearch
      appId="S9YFRHE4AD"
      apiKey="e2a71a2d47a9a2f159ab3335ed26dd4f"
      indexName="vk"
      transformItems={items => {
        console.log(items); // 打印搜索结果以进行调试
        return items.map(item => {
          return {
            ...item,
            url: item.url.replace('http://localhost:3000', ''),
            title: item._highlightResult?.title?.value || item.title,
            content: item._snippetResult?.content?.value || item.content
          };
        });
      }}
      hitComponent={({ hit }) => (
        <div>
          <a href={hit.url}>
            <h2 dangerouslySetInnerHTML={{ __html: hit.title }} />
          </a>
          <p dangerouslySetInnerHTML={{ __html: hit.content }} />
        </div>
      )}
    />
  );
}

export default Search;
