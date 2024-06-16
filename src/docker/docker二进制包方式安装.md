---
author: Ryan
title: Docker 二进制方式安装
date: 2023-02-04
lastmod: 2023-08-17
tags:
  - docker
categories:
  - docker
expirationReminder:
  enable: false
---



## 1.下载Docker二进制包



**Docker 下载地址：**

https://download.docker.com/win/static/stable/x86_64/

https://mirrors.aliyun.com/docker-ce/linux/static/stable/x86_64/



**Docker-compos 下载地址**：

https://github.com/docker/compose/releases

https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-linux-x86_64

## 2.安装Docker

```bash
tar xvf docker-24.0.5.zip
cp docker/*  /usr/bin
cp containerd.service /lib/systemd/system/containerd.service
cp docker.service  /lib/systemd/system/docker.service
cp docker.socket /lib/systemd/system/docker.socket
cp docker-compose-Linux-x86_64_2.20.3 /usr/bin/docker-compose

groupadd docker && useradd docker -g docker

systemctl  enable containerd.service && systemctl restart containerd.service
systemctl  enable docker.service && systemctl  restart docker.service
systemctl  enable docker.socket && systemctl  restart docker.socket 
```



### 2.1 containerd.service

`containerd` 是 Docker 的核心组件之一，负责管理容器的生命周期、镜像传输以及容器进程的执行,如创建命名空间、控制组、文件系统等。

Docker 在其架构中使用了容器运行时（Container Runtime）来管理容器的生命周期。`containerd` 实现了 OCI（Open Container Initiative）标准，这是一个开放的行业标准，旨在定义容器和容器运行时的规范。这使得 `containerd` 能够与其他符合 OCI 标准的工具和库协同工作。



在 Linux 系统中，`containerd` 以守护进程的形式运行。为了确保 `containerd` 在系统启动时自动启动，并能够受到 systemd（一个常用的初始化系统和服务管理器）的管理，需要创建并配置一个 `containerd.service` 单元。

这个服务单元定义了 `containerd` 守护进程的启动方式、参数以及其他相关设置。

```bash
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target local-fs.target

[Service]
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/bin/containerd

Type=notify
Delegate=yes
KillMode=process
Restart=always
# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNPROC=infinity
LimitCORE=infinity
LimitNOFILE=1048576
# Comment TasksMax if your systemd version does not supports it.
# Only systemd 226 and above support this version.
TasksMax=infinity

[Install]
WantedBy=multi-user.target
```



### 2.2 docker.service

`docker.service` 是一个 Systemd 服务单元，用于管理 Docker 守护进程（`dockerd`）的运行。Systemd 是一个常用的初始化系统和服务管理器，而服务单元则定义了如何启动、停止和管理特定的服务。

在 Docker 的架构中，`dockerd` 是 Docker 守护进程，负责管理容器的创建、运行、停止等任务。`docker.service` 的作用是管理 `dockerd` 进程的生命周期，使得 Docker 守护进程可以在系统启动时自动启动，并在需要时提供管理和监控。

```bash
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
BindsTo=containerd.service
After=network-online.target firewalld.service containerd.service
Wants=network-online.target
Requires=docker.socket

[Service]
Type=notify
# the default is not to use systemd for cgroups because the delegate issues still
# exists and systemd currently does not support the cgroup feature set required
# for containers run by docker
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
ExecReload=/bin/kill -s HUP $MAINPID
TimeoutSec=0
RestartSec=2
Restart=always

# Note that StartLimit* options were moved from "Service" to "Unit" in systemd 229.
# Both the old, and new location are accepted by systemd 229 and up, so using the old location
# to make them work for either version of systemd.
StartLimitBurst=3

# Note that StartLimitInterval was renamed to StartLimitIntervalSec in systemd 230.
# Both the old, and new name are accepted by systemd 230 and up, so using the old name to make
# this option work for either version of systemd.
StartLimitInterval=60s

# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity

# Comment TasksMax if your systemd version does not support it.
# Only systemd 226 and above support this option.
TasksMax=infinity

# set delegate yes so that systemd does not reset the cgroups of docker containers
Delegate=yes

# kill only the docker process, not all processes in the cgroup
KillMode=process

[Install]
WantedBy=multi-user.target
```



- `Description` 提供了关于服务的简要描述。
- `Documentation` 可以提供指向 Docker 文档的链接。
- `ExecStart` 指定了如何启动 `dockerd` 进程，这里的 `-H fd://` 告诉 Docker 守护进程通过文件描述符进行通信。
- `Restart` 规定了在发生错误时如何重启服务。
- `StartLimitIntervalSec` 和 `StartLimitBurst` 规定了在一段时间内尝试启动服务的次数限制，以避免过多的重试。
- `WantedBy=multi-user.target` 表示该服务会在多用户模式下启动，即在系统引导后的一般操作状态下。





### 2.3 docker.socket

`docker.socket` 是一个 Systemd 套接字（socket）单元，用于与 Docker 守护进程（`dockerd`）之间的通信。

具体来说，`docker.socket` 通过监听一个特定的网络端口或者 Unix 域套接字（Unix Domain Socket），等待来自 Docker 客户端的连接请求。一旦有请求连接，`docker.socket` 就会将请求转发给 `dockerd` 进程，然后 `dockerd` 处理这些请求并执行相应的操作，如创建或管理容器。

```bash
[Unit]
Description=Docker Socket for the API
PartOf=docker.service

[Socket]
ListenStream=/var/run/docker.sock
SocketMode=0660
SocketUser=root
SocketGroup=docker

[Install]
WantedBy=sockets.target
```







