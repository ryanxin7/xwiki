---
author: Ryan
title: docker 构建JDK17 镜像
date: 2023-12-01
lastmod: 2023-12-01
tags:
  - docker
categories:
  - docker
expirationReminder:
  enable: false
---

## 构建JDK17 镜像



## 1.下载JDK17程序包

![image-20231129103240413](https://cdn1.ryanxin.live/image-20231129103240413.png)



## 2.准备JDK17 Dockerfile

```dockerfile
FROM ubuntu:latest
MAINTAINER xinn.cc
WORKDIR /usr/local/java17
ADD ./jdk-17.0.9_linux-x64.tar.gz  /usr/local/java17/
ENV JAVA_HOME=/usr/local/java17/jdk-17.0.9
ENV CLASSPATH=.:$JAVA_HOME/lib/jrt-fs.jar
ENV PATH=$PATH:$JAVA_HOME/bin
```



## 3. 构建脚本

```bash
#!/bin/bash
TAG=$1
docker  build -t harbor.ceamg.com/baseimages/jdk17_0.9:${TAG} .
docker push harbor.ceamg.com/baseimages/jdk17_0.9:${TAG}
```





## 4.构建JDK17.0.9 镜像

```bash
root@harbor01[11:10:31]/dockerfile/jdk-17.0.9 #:ls
build_image_command.sh  Dockerfile  jdk-17.0.9_linux-x64.tar.gz
root@harbor01[11:10:33]/dockerfile/jdk-17.0.9 #:
root@harbor01[11:10:33]/dockerfile/jdk-17.0.9 #:sh build_image_command.sh x1
DEPRECATED: The legacy builder is deprecated and will be removed in a future release.
            Install the buildx component to build images with BuildKit:
            https://docs.docker.com/go/buildx/

Sending build context to Docker daemon  182.5MB
Step 1/7 : FROM ubuntu:latest
 ---> 6b7dfa7e8fdb
Step 2/7 : MAINTAINER xinn.cc
 ---> Running in 3aed1c94bf06
Removing intermediate container 3aed1c94bf06
 ---> 4d15526cf2a0
Step 3/7 : WORKDIR /usr/local/java17
 ---> Running in a86d42bd6a1a
Removing intermediate container a86d42bd6a1a
 ---> d7c03d0d10cd
Step 4/7 : ADD ./jdk-17.0.9_linux-x64.tar.gz  /usr/local/java17/
 ---> 881b04611e31
Step 5/7 : ENV JAVA_HOME=/usr/local/java/jdk-17.0.9
 ---> Running in 6703b928fb0d
Removing intermediate container 6703b928fb0d
 ---> dbb88d39fcb0
Step 6/7 : ENV CLASSPATH=.:$JAVA_HOME/lib/jrt-fs.jar
 ---> Running in 2ee6e6746a43
Removing intermediate container 2ee6e6746a43
 ---> a89b458baee1
Step 7/7 : ENV PATH=$PATH:$JAVA_HOME/bin
 ---> Running in 6feaa6d5e20c
Removing intermediate container 6feaa6d5e20c
 ---> 13b6bed2c720
Successfully built 13b6bed2c720
Successfully tagged harbor.ceamg.com/baseimages/jdk17_0.9:x1
The push refers to repository [harbor.ceamg.com/baseimages/jdk17_0.9]
c807951d4c31: Pushed
b524ae647412: Pushed
6515074984c6: Mounted from baseimages/ubuntu
x1: digest: sha256:e43e2bf6ff777ea917f274f26abcc060a369be765ecba6be46e4aa89ff7a17ad size: 949
```



## 5. 测试镜像

```bash
##临时运行容器
docker run -it harbor.ceamg.com/baseimages/jdk17_0.9:x1
```



```bash
##进入容器查看java版本
root@17b96c96a4aa:/usr/local/java17# java -version
java version "17.0.9" 2023-10-17 LTS
Java(TM) SE Runtime Environment (build 17.0.9+11-LTS-201)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.9+11-LTS-201, mixed mode, sharing)
```



