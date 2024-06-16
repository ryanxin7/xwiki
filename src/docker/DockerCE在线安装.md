---
author: Ryan
id: DockerCE-Package-install
title: DockerCE软件仓库在线安装方式
date: 2023-12-25
lastmod: 2023-12-25
tags:
  - docker
categories:
  - docker
expirationReminder:
  enable: false
---


## 1.环境准备

如果你过去安装过 docker，先删掉：

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do apt-get remove $pkg; done
```

安装依赖：
```bash
apt-get update
apt-get install ca-certificates curl gnupg
```


## 2.添加仓库镜像源

信任 Docker 的 GPG 公钥并添加仓库：

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] http://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
```


## 3.安装
```bash
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```