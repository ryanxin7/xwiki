---
author: Ryan
title: Confluence ceamg
date: 2024-06-26
image: http://img.xinn.cc/xwiki/confluence-2.png
---
## 创建命名空间

```bash
kubectl create ns ceamg-wiki
```


```sql
  CREATE DATABASE IF NOT EXISTS ceamg_wiki CHARACTER SET utf8 COLLATE utf8_bin;
  GRANT ALL PRIVILEGES ON ceamg_wiki.* TO 'confluenceuser'@'%';
  FLUSH PRIVILEGES;
```


```json
jdbc:mysql://mysql.confluence.svc.cluster.local:3306/ceamg_wiki?useUnicode=true&characterEncoding=utf8&useSSL=false
```


```bash
账号: ceamgadmin
密码：Ab3swbHpAbo3gbH
```



```xml
        <Connector port="8090" connectionTimeout="20000" redirectPort="8443"
                   maxThreads="48" minSpareThreads="10"
                   enableLookups="false" acceptCount="10" debug="0" URIEncoding="UTF-8"
                   protocol="org.apache.coyote.http11.Http11NioProtocol"
                   scheme="https" proxyName="feed.rmxc.com.cn" proxyPort="443"/>
```


```bash
RYTSUKJGHDRDVQSK
```

