---
author: Ryan
title: docker批量删除 Exited 状态的容器
date: 2023-12-01
lastmod: 2023-12-01
tags:
  - docker
categories:
  - docker
expirationReminder:
  enable: false
---



## docker 批量删除  Exited  状态的容器

```
docker rm $(docker ps -a -q -f status=exited)
```

这个命令会列出所有处于 Exited 状态的容器，并将其删除。



- `docker ps -a`：列出所有的容器，包括正在运行的和已经停止的。
- `-q`：这个选项用于静默输出容器的 ID（而不是完整的容器信息）。
- `-f status=exited`：这是一个过滤条件，它筛选出状态为 Exited 的容器。
- `docker rm`：这个命令用于删除容器。它接收的参数是一个容器 ID 或者多个容器 ID 的列表。