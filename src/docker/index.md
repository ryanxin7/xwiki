---
sidebar_position: 1
---
# Docker 简介

## 什么是 Docker?

Docker 是一个开源的平台，旨在帮助开发者构建、部署和运行应用程序。Docker 通过将应用程序及其依赖打包在一个称为容器的标准化单元中，实现了应用程序的隔离和独立运行。

## Docker 的核心概念

### 镜像 (Image)
Docker 镜像是一个轻量级、独立的可执行软件包，包含了运行特定应用程序所需的所有内容：代码、运行时、库、环境变量和配置文件。镜像是创建 Docker 容器的基础。

### 容器 (Container)
容器是镜像的运行实例。它是一个轻量级、独立的执行环境，可以在任何支持 Docker 的平台上运行。容器可以快速启动和停止，并且可以方便地进行迁移和复制。

### Dockerfile
Dockerfile 是一个文本文件，包含了构建 Docker 镜像的所有指令。开发者可以通过编写 Dockerfile 来定义镜像的内容和构建过程。

### Docker Hub
Docker Hub 是一个公共的注册表，用于存储和分发 Docker 镜像。开发者可以将自己的镜像推送到 Docker Hub，也可以从 Docker Hub 上拉取其他开发者的镜像。

## Docker 的优势

1. **一致性和可移植性**: Docker 容器在任何环境中都能以相同的方式运行，从而确保了一致性。开发人员可以在本地开发并测试容器，然后将其部署到任何云平台或数据中心。

2. **资源效率**: Docker 容器共享主机操作系统的内核，因此比传统虚拟机更轻量级，占用的资源更少。

3. **快速部署和缩放**: Docker 容器启动和停止速度极快，支持快速部署和弹性扩展。

4. **隔离性**: 每个容器都是独立的，可以避免应用程序之间的相互影响，提高了安全性和稳定性。

## 常用 Docker 命令

### 镜像操作
```bash
# 拉取镜像
docker pull image_name

# 列出本地镜像
docker images

# 删除本地镜像
docker rmi image_name
```

### 容器操作

```bash
# 运行容器
docker run -d --name container_name image_name

# 列出运行中的容器
docker ps

# 停止容器
docker stop container_name

# 删除容器
docker rm container_name
```


### Dockerfile 构建镜像
```bash
# 从 Dockerfile 构建镜像
docker build -t image_name .

# 查看镜像构建历史
docker history image_name

```