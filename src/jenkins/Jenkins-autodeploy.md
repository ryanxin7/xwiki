---
author: Ryan
title: Jenkins实践-自动构建并发布前端项目
date: 2023-06-12
lastmod: 2023-08-18
tags: 
    - CI/CD
    - 持续集成
category: 
   - Jenkins
   - Git
   - Vue
expirationReminder:
  enable: false
---




## 1.安装插件

### 1.1 安装NodeJS插件

点击系统管理,然后点击插件管理,在可选插件里面搜索NodeJS插件,然后安装

![](https://cdn1.ryanxin.live/image-20230517144020337.png)





### 1.2 安装连接SSH的插件

Publish Over SSH用于连接远程服务器

![](https://cdn1.ryanxin.live/image-20230517144326164.png)





### 1.3 安装把应用发布到远程服务器的插件

**Deploy to container **插件用于把打包的应用发布到远程服务

![](https://cdn1.ryanxin.live/image-20230517144416905.png)





## 2. 配置git和NodeJS环境

### 2.1 安装配置git

```bash
#安装git
root@server:~# apt install git 
root@server:~# whereis git 

#查看git的执行文件位置, 默认是在 /usr/bin/git
whereis git
git: /usr/bin/git /usr/share/man/man1/git.1.gz
```



![](https://cdn1.ryanxin.live/image-20230517144940156.png)



### 2.2 安装配置NodeJS



NodeJs 下载地址：https://nodejs.org/dist/



```bash
cd /apps
tar -zxvf node-v16.18.1-linux-x64.tar.gz
#创建软连接
ln -sv node-v16.18.1-linux-x64/  /usr/local/node
```



填写本地node路径

![](https://cdn1.ryanxin.live/image-20230517150947230.png)



## 3. 新建项目部署信息

### 3.1  源码管理

![](https://cdn1.ryanxin.live/image-20230517151201485.png)



填写项目仓库地址

![image-20230518161509712](https://cdn1.ryanxin.live/image-20230518161509712.png)

配置免密公钥认证

![ss](https://cdn1.ryanxin.live/image-20230518162443881.png)

### 3.2 构建触发器

定时每五分钟检查一次代码仓库有没有新的提交，如果有新的提交就自动构建项目并发布到目标前端服务器。

![](https://cdn1.ryanxin.live/image-20230518162525400.png)





### 3.3 构建环境

![image-20230518162814972](https://cdn1.ryanxin.live/image-20230518162814972.png)





#### 3.4 执行Shell命令

```bash
npm config get registry 
npm install --legacy-peer-deps
npm run docs:build
cd src/.vuepress/dist
export DIST_NAME="dist-v"$(date +"%Y%m%d%H%M%S")""
tar -zcf $WORKSPACE/deployment/$DIST_NAME.tar.gz ./*
\cp $WORKSPACE/deployment/$DIST_NAME.tar.gz $WORKSPACE/deployment/dist-latest.tar.gz
rm -rf $WORKSPACE/src/.vuepress/dist
```





### 3.5 构建后操作

用到**SSH Publishers** 插件，将项目代码文件推送到目标主机。

**SSH Publishers 配置**

系统管理—> 系统配置 —> Publish over SSH

![image-20230518163252080](https://cdn1.ryanxin.live/image-20230518163252080.png)

 

![image-20230518163357826](https://cdn1.ryanxin.live/image-20230518163357826.png)



`Passphrase`: 公钥密码 

`Name`:目标服务器名称

`Hostname`：目标服务器IP地址

`Username`: 目标主机用户名

`Remote Directory`：目标主机存放目录





## 4.测试项目自动发布

### 4.1 测试手动构建发布

**立即构建**

![image-20230518165104498](https://cdn1.ryanxin.live/image-20230518165104498.png)



**控制台输出查看任务进度**

![image-20230518164918778](https://cdn1.ryanxin.live/image-20230518164918778.png)

**构建成功**

![image-20230518164846503](https://cdn1.ryanxin.live/image-20230518164846503.png)



**前端服务器目录下验证**

![image-20230518165232579](https://cdn1.ryanxin.live/image-20230518165232579.png)





### 4.2 测试自动构建发布

代码更新后自动构建并发布

![](https://cdn1.ryanxin.live/image-20230518170955693.png)



![](https://cdn1.ryanxin.live/image-20230518171204946.png)

