---
author: Ryan
title: NFS-网络共享存储服务
date: 2019-09-13
lastmod: 2019-11-26
tags: [Linux学习之旅]
---




# nfs共享存储

## 1.NFS基本概述

### 1.1 什么是NFS?
NFS是Network File System的缩写及网络文件系统。[ 通常我们称NFS为共享存储]




### 1.2 NFS能干什么?
NFS的主要功能是通过局域网络让不同主机系统之间可以共享目录。





### 1.3 为什么要使用NFS?
在网站集群架构中如果没有共享存储的情况如下:
1. A用户上传图片经过负载均衡，负载均衡将上传请求调度至WEB1服务器上。
2. B用户访问A用户上传的图片，此时B用户被负载均衡调度至WEB2_上，因为WEB2_ 上没有这张图片，所以B用户无法看到A用户传的图片。




![为什么要使用NFS](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/为什么要使用NFS.jpg)




在网站集群架构中如果有共享存储的情况如下:
1.  A用户上传图片无论被负载均衡调度至WEB1还是WEB2,最终数据都被写入至共享存储
2.  B用户访问A用户上传图片时，无论调度至WEB1还是WEB2，最终都会上共享存储访问对应的文件，这样就可以访问到资源了

![为什么要使用NFS2](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/为什么要使用NFS2.jpg)






### 1.4 使用NFS共享存储能解决集群架构的什么问题?
- 解决多台web静态资源的共享(所有客户端都挂载服务端，看到的数据都- -样)
- 解决多台web静态资源-致性(如果客户端A删除NFS服务上的test文件，客户端B. 上也会看不见test文件)
- 解决多台web磁盘空间的浪费





### 1.5 企业使用NFS注意事项
1. 由于用户请求静态资源每次都需要web连接NFS服务获取，那么势必会带来-定的网络开销、以及网络延时、所以增加NFS服务并不能给网站带来访问速度的提升。
2. 如果希望对上传的图片、附件等静资源进行加速，建议将静态资源统-存放至NFS服务端。这样便于后期统一推送至CDN, 以此来实现资源的加速。






## 2.NFS原理

![nfs原理](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/nfs原理.jpg)


### 2.1 本地文件操作方式
1. 当用户执行mkdir命令, BashShell无法完成该命令操作，会将其翻译给内核。
2. Kernel内核解析完成后会驱动对应的磁盘设备，完成创建目录的操作。


### NFS实现原理

需要先了解 程序|进程|线程


1. NFS客户端执行增、删等操作，客户端会使用不同的函数对该操作进行封装。
2. NFS客户端会通过TCP/IP的方式传递给NFS服务端。
3. NFS服务端接收到请求后，会先 调用portmap进程进行端C映射。
4. nfsd进程用于判断NFS客户端是否拥有权限连接NFS服务端。
5. Rpc.mount进程判断客户端是否有对应的权限进行验证。
6. idmap进程实现用户映射和压缩。
7. 最后NFS服务端会将客户端的函数转换为本地能执行的命令，然后将命令传递至内核，由内核


**驱动硬件** 
**注意**:rpc是 一个远程过程调用，那么使用nfs必须有rpc服务





## 3.NFS服务安装



| 服务器系统 | 角色      | 外网IP         | 内网IP           |
| ---------- | --------- | -------------- | ---------------- |
| CentOS 7.6 | NFS服务端 | eth0:10.0.0.31 | eth1:172.16.1.31 |
| CentOS 7.6 | NFS客户端 | eth0:10.0.0.41 | eth1:172.16.1.41 |




### 3.1 环境配置
```sh
#关闭Firewalld防火墙
[root@nfs ~]# systemctL disable firewalld
[root@nfs ~]# systemctl stop firewalld

#关闭selinux
[root@nfs ~]# sed -ri ' #^SEL INUX=#cSEL INUX=Disabled' /etc/selinux/config
[root@nfs ~]# setenforce 0

#安装nfs-server服务
yum -y install nfs-utils

```





### 3.2配置nfs服务

nfs服务程序的配置文件为`/etc/exports`，需要严格按照共享目录的路径允许访问的NFS客户端(共享权限参数)格式书写，
定义要共享的目录与相应的权限，具体书写方式如下图所示。





### 3.3.使用场景

将nfs服务端的 `/data` 目录共享给 `172.16.1.0/24` 网段内的所有主机

1. 所有客户端主机都拥有读写权限
2. 在将数据写入到NFS服务器的硬盘中后才会结束操作，最大限度保证数据不丢失
3. 将所有用户映射为本地的匿名用户(nfsnobody)

```sh
#NFS客户端地址与权限之间没有空格
[root@nfs ~]# vim /etc/exports
/data
172.16.1.0/24(rw, sync , all_ squash)

#在NFS服务器上建立用于NFS文件共享的目录，并设置对应权限
[root@nfs ~]# mkdir /data
[root@nfs ~]# chown -R nfsnobody. nfsnobody /data
#NFS共享目录会记录至/var/lib/nfs/etab,如果该目录不存在共享信息，请检查/etc/exports是否配置错误
```






### 3.4 安装RPC 

在使用NFS服务进行文件共享之前，需要使用RPC (Remote Procedure Call 远程过程调用服务
将NFS服务器的IP地址和端口号信息发送给客户端。因此，在启动NFS服务之前，需要先重启并.



启用rpcbind服务程序,同时都加入开机自启动

```sh
#加入开机自启
[root@nfs ~]# systemctL enable rpcbind nfs -server
#启动服务
[root@nfs ~]# systemctl restart rpcbind nfs-server
```



## 4.NFS客户端挂载卸载

### 4.1 查看远程共享目录


NFS客户端的配置步骤也+分简单。先使用showmount命令，查询NFS服务器的远程共享信息，其输出格式为“`共享的目录名称允许使用客户端地址`”。




```sh
#安装客户端工具，安装nfs-utils即可， 会自动启动rpcbind服务。
[root@nfs-client ~]# yum -y install nfs-utils
#客户端使用showmount -e查看远程服务器rpc提供的可挂载nfs信息.
[root@nfs-client ~]# showmount -e 172.16.1.31
Export list for 172.16.1.31:
/data 172.16.1.0/24
```


### 4.2 挂载远程共享目录

在NFS客户端创建一个挂载目录,使用`mount`命令并结合`-t`参数,指定要挂载的文件系统的类型,并在命令后面写上服务器的IP地址,以及服务器上的共享目录,最后需要写上要挂载到本地系统(客户端)的目录。

```sh
[root@nfs-client ~]# mkdir /nfsdir
[root@nfs-client ~]# mount -t nfs 172. 16.1.31:/data /nfsdir
#查看挂载信息(mount也可以查看)
[root@nfs-client ~]# df -h
Filesystem   Size  Used Avail Use% Mounted on
/dev/sda3    62G   845M  58G   2%   
/tmpfs       244M   0    244M  0%  /dev/shm
/dev/sda1    190M  26M   155M  14% /boot
172. 16.1.31:/data 62G  880M  58G  2% /nfsdir

```




### 4.3 客户端远程共享目录操作

挂载成功后可以进行增删改操作

```sh
#使用客户端往nfs存储写入
[root@nfs-client ~]# echo "nfs-client" >> /mnt/test. txt


#检查nfs服务端是否存在客户端创建的新文件
[root@nfs-client ~]# cat /data/test. txt
nfs-client

#如果希望NFS文件共享服务能一直有效，则需要将其写入到fstab文件中
[root@nfs-client ~]# vim /etc/fstab
172.16.1.31: /data /nfsdir nfs defaults 0 0
```



### 4.4 客户端卸载

如果不希望使用NFS共享,可进行卸载

```sh
umount /nfsdir
#注意:卸载的时候如果提示”umount. nfs: /nfsdir: device is busy”
#切换至其他目录，然后在进行卸载。

#NFS Server宕机，强制卸载
umount -lf /nfsdir
```



### 4.5 客户端安全参数

在企业工作场景，通常情况NFS服务器共享的只是普通静态数据(图片、附件、视频)，不需
要执行suid、exec 等权限，挂载的这个文件系统只能作为数据存取之用，无法执行程序，对于
客户端来讲增加了安全性。



例如:很多木马篡改站点文件都是由上传入口上传的程序到存储目录。然后执行的。

```sh
#通过mount -o指定挂载参数，禁止使用suid, exec, 增加安全性能
[root@nfs-client ~]# mount -t nfs -。 nosuid, noexec, nodev 172. 16. 1.31:/data /mnt
```

有时也需要考虑性能相关参数[可选]
```sh

#通过mount -o指定挂载参数，禁止更新目录及文件时间戳挂载
[root@nfs-client ~]# mount -t nfs -0 noatime, nodiratime 172. 16.1.31:/data /mnt
```




## 5.NFS配置详解




|nfs共享参数|参数作用|
|--|--|
|rw*|读写权限|
|ro|只读权限|
|root_ squash|当NFS客户端以root管理员访问时，映射为NFS服务器的匿名用户(不常用)|
|no_ root_ squash|当NFS客户端以root管理员访问时，映射为NFS服务器的root管理员(不常用)|
|all squash|无论NFS客户端使用什么账户访问，均映射为NFS服务器的匿名用户(常用)|
|no_ all squash|无论NFS客户端使用什么账户访问，都不进行压缩|
|sync*|同时将数据写入到内存与硬盘中，保证不丢失数据|
|async|优先将数据保存到内存，然后再写入硬盘; 这样效率更高，但可能会丢失数据
|anonuid*|配置all_ squash使用,指定NFS的用户UID,必须存在系统|
|anongid*|配置all_ squash使用，指定NFS的用户UID,必须存在系统|




## 6.NFS权限实践


### 6.1 验证ro权限实践

```sh

#服务端修改rw为ro参数
[root@nfs ~]# cat /etc/exports
/data 172.16.1. 0/24(ro, sync ,all_ squash)
[root@nfs ~]# systemctl restart nfs -server


#客户端验证
[root@nfs-client ~]# mount -t nfs 172. 16.1.31:/data /mnt
[root@nfs-client ~]# df -h
Filesystem
Size
Used Avail Use% Mounted on
172.16.1.31: /data 98G  1.7G 97G  2% /mnt

#发现无法正常写入文件
[root@backup mnt]# touch file
touch: cannot touch 'file' : Read-only file system

```


### 6.2 验证all squash、anonuid、 anongid权限

```sh
#NFS服务端配置
[root@nfs ~]# cat /etc/exports
/data 172.16.1.0/24(rw,sync,all_squash,anonuid=666,anongid=666)

#服务端需要创建对应的用户
[root@nfs ~]# groupadd -g 666 ww
[root@nfs ~]# useradd -u 666 -g 666 www
[root@nfs ~]# id www
uid=666(www) gid=666(www) groups=666(www)

#重载nfs-server
[root@nfs ~]# systemctl restart nfs -server
[root@nfs ~]# cat /var/lib/nfs/etab
/data    172.16.1.0/ 24(rw, sync,wdelay,hide,nocrossmnt,secure,root_squash,all_squash,
no_subtree_check,secure_locks,acl,no_ pnfs,anonuid=666,anongid=666,sec=sys,secure,ro 
ot_squash,all_squash)


#授权共享目录为www
[root@nfs ~]# chown -R www. www
/data/
[root@nfs ~]# ll -d /data/
drwxr-xr-x 3 wwW WWW 53 Sep 3 02:08 /data/

#客户端验证
[root@backup ~]# umount /mnt/
[root@backup ~]# mount -t nfs 172. 16.1.31:/data /mnt

#客户端查看到的文件，身份是666
[root@backup ~]# Ll /mnt/
drwxr-xr-x 2 666 666 6 Sep3 02:08 rsync_ dir-rw-r--r-- 1 666 666 0 Sep 3 02:08 rsync_ file
#客户端依旧能往/mnt目录下写文件
[root@backup mnt]# touch fff
[root@backup mnt]# mkdir 111
[root@backup mnt]# ll
drwxr-xr-x 2 666 666 6 Sep3 03:05 111 
-rw-r--r-- 1 666 666 0 Sep3 03:05 fff
#建议:将客户端也创建一个uid为666, gid为666， 统一身份,避免后续出现权限不足的情况
[root@backup mnt]# groupadd -g 666 Www
[root@backup mnt]# useradd -g 666 -u 666 Www
[root@backup mnt]# id www
uid=666(www) gid=666(www) groups=666( www)

#最后检查文件的身份
[root@backup mnt]# ll /mnt/
total 4
drwxr-xr-x 2 wwW WWW 6 Sep 3 03:05 111
-rw-r--r-- 1 WwW wwW 0 Sep 3 03:05 fff

```




## 7.NFS存储总结
1. NFS存储优点
- NFS简单易用、方便部署数据可靠、服务稳定、满足中小企业需求。
- NFS的数据都在文件系统之上，所有数据都是能看得见。

2. NFS存储局限
- 存在单点故障,如果构建高可用维护麻烦web- >nfs( )- >backup
- NFS数据都是明文，并不对数据 做任何校验，也没有密码验证(强烈建议内网使用)。

3. NFS应用建议
- 生产场景应将静态数据(ipg\png\mp4\av\cssjs)尽可能放置CDN场景进行环境以此来减少后端存储压力
- 如果没有缓存或架构、代码等,本身历史遗留问题太大，在多存储也没意义

