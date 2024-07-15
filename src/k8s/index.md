---
id: index
title: Kubernetes 简介
sidebar_position: 1
tags: [kubernetes]
date: 2023-06-11T21:33:32

---
import WordCount from '@site/src/components/WordCount';

<WordCount />

# Kubernetes 简介

Kubernetes 是一个开源的容器编排平台，主要用于自动化应用程序的部署、扩展和管理。它由 Google 设计并捐赠给云原生计算基金会（CNCF）。以下是 Kubernetes 的详细介绍，包括其核心概念、主要功能和一些实际操作示例。

## 核心概念

### 节点（Node）
节点是 Kubernetes 集群中的一台物理或虚拟机。每个节点都包含运行 Pod 的必要服务，并由控制平面管理。节点分为主节点（Master）和工作节点（Worker）。

- **主节点（Master Node）**：负责管理和控制整个集群，包括 API Server、Scheduler、Controller Manager 和 etcd 等组件。
- **工作节点（Worker Node）**：运行应用容器，由 kubelet、kube-proxy 和容器运行时（如 Docker）组成。

### Pod
Pod 是 Kubernetes 中最小的可部署单元，通常包含一个或多个容器。这些容器共享存储、网络以及如何运行的规范。Pod 内的容器通过 localhost 互相通信，并且共享同一个 IP 地址。

### 服务（Service）
服务是一种抽象，用于定义一组逻辑上的 Pod 以及如何访问它们。服务可以将请求负载均衡到后端的 Pod 上。服务有以下几种类型：

- **ClusterIP**：默认类型，服务只能在集群内部访问。
- **NodePort**：服务可以通过每个节点的 IP 地址和静态端口访问。
- **LoadBalancer**：为服务创建一个外部负载均衡器（通常在云环境中使用）。
- **ExternalName**：通过返回 CNAME 记录，将服务映射到外部的 DNS 名称。

### 部署（Deployment）
部署提供了声明式更新 Pod 和 Replica Set 的方法。可以通过 Deployment 来管理应用的滚动更新和回滚。

### 命名空间（Namespace）
命名空间用于在同一物理集群上支持多个虚拟集群。它们用于逻辑上将资源划分到不同的组中，适用于大型团队或项目的资源隔离。

### ConfigMap 和 Secret
- **ConfigMap**：用于保存非机密的配置信息，如配置文件、命令行参数等。
- **Secret**：用于保存敏感信息，如密码、OAuth 令牌、SSH 密钥等。

### 持久存储（Persistent Storage）
Kubernetes 支持将存储卷挂载到 Pod 上，这些卷可以是本地存储、云存储（如 AWS EBS、GCE Persistent Disk）或网络存储（如 NFS、GlusterFS）。

## 主要功能

### 自动化调度
Kubernetes 自动将容器部署到合适的节点上，以最大化资源利用率和性能。

### 自愈
Kubernetes 能够自动重启失败的容器、替换被终止的容器以及在节点不可用时重新调度容器。

### 横向扩展
Kubernetes 提供了水平扩展功能，可以根据负载需求自动增加或减少应用副本。

### 服务发现与负载均衡
Kubernetes 提供了内置的服务发现和负载均衡机制，无需用户手动配置。

### 存储编排
Kubernetes 允许用户自动挂载他们选择的存储系统，如本地存储、公共云提供商的存储和网络存储系统。

### 声明式配置
Kubernetes 使用声明式配置文件，用户可以描述集群的期望状态，Kubernetes 会自动实现并维护这些状态。

### 滚动更新与回滚
Kubernetes 支持应用的滚动更新，即逐步更新应用的实例而不中断服务。如果更新过程中出现问题，可以轻松地回滚到之前的版本。

### 安全与身份认证
Kubernetes 提供了多种安全特性，包括基于角色的访问控制（RBAC）、Pod 安全策略、网络策略和 TLS 加密。

## 快速开始

### 安装 Minikube
Minikube 是一个可以在本地运行单节点 Kubernetes 集群的工具。适用于学习和开发。

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
minikube start
```

### 部署一个简单的应用
创建一个 Nginx 部署：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

将上面的内容保存为 nginx-deployment.yaml，然后运行以下命令：

``` bash
kubectl apply -f nginx-deployment.yaml
```

### 暴露服务
创建一个服务来暴露 Nginx 部署：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: NodePort
```

将上面的内容保存为 `nginx-service.yaml`，然后运行以下命令：

``` bash
kubectl apply -f nginx-service.yaml
```

### 查看部署状态

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

### 访问应用
使用以下命令获取 Minikube 的 IP 地址和 Nginx 服务的 NodePort：

``` bash
minikube ip
kubectl get svc nginx-service
```

然后在浏览器中访问 `http://<minikube-ip>:<node-port>`，可以看到 Nginx 欢迎页面。

