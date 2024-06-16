---
author: Ryan
title: ceph-common 指定版本安装依赖问题
date: 2023-11-01
lastmod: 2023-11-01
tags: 
    - 分布式存储
categories:
   - Ceph
expirationReminder:
  enable: true
---


缺少依赖：

```bash
 $ dpkg -i ceph-common_16.2.10-1bionic_amd64.deb
 ceph-common depends on librbd1 (= 16.2.10-1bionic); however:
  Package librbd1 is not installed.
 ceph-common depends on python3-cephfs (= 16.2.10-1bionic); however:
  Package python3-cephfs is not installed.
 ceph-common depends on python3-ceph-argparse (= 16.2.10-1bionic); however:
  Package python3-ceph-argparse is not installed.
 ceph-common depends on python3-ceph-common (= 16.2.10-1bionic); however:
  Package python3-ceph-common is not installed.
 ceph-common depends on python3-prettytable; however:
  Package python3-prettytable is not installed.
 ceph-common depends on python3-rados (= 16.2.10-1bionic); however:
  Package python3-rados is not installed.
 ceph-common depends on python3-rbd (= 16.2.10-1bionic); however:
  Package python3-rbd is not installed.
 ceph-common depends on python3-rgw (= 16.2.10-1bionic); however:
  Package python3-rgw is not installed.
 ceph-common depends on libaio1 (>= 0.3.93); however:
  Package libaio1 is not installed.
 ceph-common depends on libbabeltrace1 (>= 1.2.1); however:
  Package libbabeltrace1 is not installed.
 ceph-common depends on libcephfs2; however:
  Package libcephfs2 is not installed.
 ceph-common depends on libgoogle-perftools4; however:
  Package libgoogle-perftools4 is not installed.
 ceph-common depends on libleveldb1v5; however:
  Package libleveldb1v5 is not installed.
 ceph-common depends on liblua5.3-0; however:
  Package liblua5.3-0 is not installed.
 ceph-common depends on liboath0 (>= 1.10.0); however:
  Package liboath0 is not installed.
 ceph-common depends on librabbitmq4 (>= 0.8.0); however:
  Package librabbitmq4 is not installed.
 ceph-common depends on librados2; however:
  Package librados2 is not installed.
 ceph-common depends on libradosstriper1; however:
  Package libradosstriper1 is not installed.
 ceph-common depends on librdkafka1 (>= 0.9.2); however:
  Package librdkafka1 is not installed.
 ceph-common depends on libsnappy1v5; however:

```





# ceph-common 依赖

## libaio1  

> depends on libaio1 (>= 0.3.93)

```bash
root@k8s-master01:/tmp/222# apt-cache madison libaio1
   libaio1 | 0.3.110-5ubuntu0.1 | http://mirrors.aliyun.com/ubuntu bionic-updates/main amd64 Packages
   libaio1 |  0.3.110-5 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages
root@k8s-master01:/tmp/222#
root@k8s-master01:/tmp/222# apt install libaio1
```



## libbabeltrace1

> depends on libbabeltrace1 (>= 1.2.1)

```b ash
root@k8s-master01:/tmp/222# apt-cache madison libbabeltrace1
libbabeltrace1 |    1.5.5-1 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages

apt install -y libbabeltrace1
```





## libgoogle-perftools4 

```bash
root@k8s-master01:/tmp/222# apt-cache madison libgoogle-perftools4
libgoogle-perftools4 | 2.5-2.2ubuntu3 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages

root@k8s-master01:/tmp/222# apt install libgoogle-perftools4
```





## libleveldb1v5

```bash
root@k8s-master01:/tmp/222# apt-cache madison libleveldb1v5
libleveldb1v5 |     1.20-2 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages
root@k8s-master01:/tmp/222#
root@k8s-master01:/tmp/222# apt install libleveldb1v5
```





## liblua5.3-0

```bash
root@k8s-master01:/tmp/222# apt-cache madison liblua5.3-0
liblua5.3-0 | 5.3.3-1ubuntu0.18.04.1 | http://mirrors.aliyun.com/ubuntu bionic-updates/main amd64 Packages
liblua5.3-0 | 5.3.3-1ubuntu0.18.04.1 | http://mirrors.aliyun.com/ubuntu bionic-security/main amd64 Packages
liblua5.3-0 |    5.3.3-1 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages
root@k8s-master01:/tmp/222# apt install liblua5.3-0
```



## liboath0

```bash
root@k8s-master01:/tmp/222# apt-cache madison liboath0
  liboath0 |    2.6.1-1 | http://mirrors.aliyun.com/ubuntu bionic/universe amd64 Packages
root@k8s-master01:/tmp/222# apt install liboath0
```



## librabbitmq4

```bash
root@k8s-master01:/tmp/222# apt-cache madison librabbitmq4
librabbitmq4 | 0.8.0-1ubuntu0.18.04.2 | http://mirrors.aliyun.com/ubuntu bionic-updates/universe amd64 Packages
librabbitmq4 | 0.8.0-1ubuntu0.18.04.2 | http://mirrors.aliyun.com/ubuntu bionic-security/universe amd64 Packages
librabbitmq4 | 0.8.0-1build1 | http://mirrors.aliyun.com/ubuntu bionic/universe amd64 Packages

root@k8s-master01:/tmp/222# apt install librabbitmq4
```





## librbd1_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i librbd1_16.2.10-1bionic_amd64.deb
(Reading database ... 68156 files and directories currently installed.)
Preparing to unpack librbd1_16.2.10-1bionic_amd64.deb ...
Unpacking librbd1 (16.2.10-1bionic) over (16.2.10-1bionic) ...
dpkg: dependency problems prevent configuration of librbd1:
 librbd1 depends on librados2 (= 16.2.10-1bionic); however:
  Package librados2 is not installed.
 librbd1 depends on liblttng-ust0 (>= 2.5.0); however:
  Package liblttng-ust0 is not installed.

dpkg: error processing package librbd1 (--install):
 dependency problems - leaving unconfigured
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
Errors were encountered while processing:
 librbd1
 
 
 ## 依赖librados2
 ## 依赖liblttng-ust0
```



```BASH
## 安装 librados2 、 liblttng-ust0 后
root@k8s-master01:/tmp/223# dpkg -i librados2_16.2.10-1bionic_amd64.deb
Selecting previously unselected package librados2.
(Reading database ... 68246 files and directories currently installed.)
Preparing to unpack librados2_16.2.10-1bionic_amd64.deb ...
Unpacking librados2 (16.2.10-1bionic) ...
Setting up librados2 (16.2.10-1bionic) ...
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
```



###  liblttng-ust0

```bash
root@k8s-master01:/tmp/223# apt install liblttng-ust0
```



### librados2_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i librados2_16.2.10-1bionic_amd64.deb
Selecting previously unselected package librados2.
(Reading database ... 68185 files and directories currently installed.)
Preparing to unpack librados2_16.2.10-1bionic_amd64.deb ...
Unpacking librados2 (16.2.10-1bionic) ...
dpkg: dependency problems prevent configuration of librados2:
 librados2 depends on libibverbs1 (>= 1.1.6); however:
  Package libibverbs1 is not installed.
 librados2 depends on librdmacm1 (>= 1.0.15); however:
  Package librdmacm1 is not installed.

dpkg: error processing package librados2 (--install):
 dependency problems - leaving unconfigured
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
Errors were encountered while processing:
 librados2
 
 ## 依赖 libibverbs1
 ## 依赖 librdmacm1
```



```bash
## 安装 libibverbs1 、librdmacm1 后
root@k8s-master01:/tmp/223# dpkg -i librados2_16.2.10-1bionic_amd64.deb
Selecting previously unselected package librados2.
(Reading database ... 68246 files and directories currently installed.)
Preparing to unpack librados2_16.2.10-1bionic_amd64.deb ...
Unpacking librados2 (16.2.10-1bionic) ...
Setting up librados2 (16.2.10-1bionic) ...
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
```





#### libibverbs1 

```bash
root@k8s-master01:/tmp/223# apt-cache madison libibverbs1
libibverbs1 | 17.1-1ubuntu0.2 | http://mirrors.aliyun.com/ubuntu bionic-updates/main amd64 Packages
libibverbs1 |     17.1-1 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages
root@k8s-master01:/tmp/223# apt install libibverbs1
```

#### librdmacm1 

```bash
root@k8s-master01:/tmp/223# apt-cache madison librdmacm1
librdmacm1 | 17.1-1ubuntu0.2 | http://mirrors.aliyun.com/ubuntu bionic-updates/main amd64 Packages
librdmacm1 |     17.1-1 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages
root@k8s-master01:/tmp/223# apt install librdmacm1
```



## python3-cephfs_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i python3-cephfs_16.2.10-1bionic_amd64.deb
Selecting previously unselected package python3-cephfs.
(Reading database ... 68267 files and directories currently installed.)
Preparing to unpack python3-cephfs_16.2.10-1bionic_amd64.deb ...
Unpacking python3-cephfs (16.2.10-1bionic) ...
dpkg: dependency problems prevent configuration of python3-cephfs:
 python3-cephfs depends on libcephfs2 (= 16.2.10-1bionic); however:
  Package libcephfs2 is not installed.
 python3-cephfs depends on python3-rados (= 16.2.10-1bionic); however:
  Package python3-rados is not installed.
 python3-cephfs depends on python3-ceph-argparse (= 16.2.10-1bionic); however:
  Package python3-ceph-argparse is not installed.

dpkg: error processing package python3-cephfs (--install):
 dependency problems - leaving unconfigured
Errors were encountered while processing:
 python3-cephfs

## 依赖 libcephfs2 、python3-rados 、 python3-ceph-argparse

## 安装完 libcephfs2 、python3-rados 、 python3-ceph-argparse 后再次安装
root@k8s-master01:/tmp/223# dpkg -i python3-cephfs_16.2.10-1bionic_amd64.deb
Selecting previously unselected package python3-cephfs.
(Reading database ... 68282 files and directories currently installed.)
Preparing to unpack python3-cephfs_16.2.10-1bionic_amd64.deb ...
Unpacking python3-cephfs (16.2.10-1bionic) ...
Setting up python3-cephfs (16.2.10-1bionic) ...
```



###  libcephfs2_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i libcephfs2_16.2.10-1bionic_amd64.deb
Selecting previously unselected package libcephfs2.
(Reading database ... 68267 files and directories currently installed.)
Preparing to unpack libcephfs2_16.2.10-1bionic_amd64.deb ...
Unpacking libcephfs2 (16.2.10-1bionic) ...
Setting up libcephfs2 (16.2.10-1bionic) ...
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
```



### python3-rados_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i python3-rados_16.2.10-1bionic_amd64.deb
Selecting previously unselected package python3-rados.
(Reading database ... 68271 files and directories currently installed.)
Preparing to unpack python3-rados_16.2.10-1bionic_amd64.deb ...
Unpacking python3-rados (16.2.10-1bionic) ...
Setting up python3-rados (16.2.10-1bionic) ...
```



### python3-ceph-argparse_16.2.10-1bionic_all.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i python3-ceph-argparse_16.2.10-1bionic_all.deb
Selecting previously unselected package python3-ceph-argparse.
(Reading database ... 68278 files and directories currently installed.)
Preparing to unpack python3-ceph-argparse_16.2.10-1bionic_all.deb ...
Unpacking python3-ceph-argparse (16.2.10-1bionic) ...
Setting up python3-ceph-argparse (16.2.10-1bionic) ...

```



## python3-ceph-argparse_16.2.10-1bionic_all.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i python3-ceph-argparse_16.2.10-1bionic_all.deb
(Reading database ... 68290 files and directories currently installed.)
Preparing to unpack python3-ceph-argparse_16.2.10-1bionic_all.deb ...
Unpacking python3-ceph-argparse (16.2.10-1bionic) over (16.2.10-1bionic) ...
Setting up python3-ceph-argparse (16.2.10-1bionic) ...
```



## python3-ceph-common_16.2.10-1bionic_all.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i python3-ceph-common_16.2.10-1bionic_all.deb
Selecting previously unselected package python3-ceph-common.
(Reading database ... 68290 files and directories currently installed.)
Preparing to unpack python3-ceph-common_16.2.10-1bionic_all.deb ...
Unpacking python3-ceph-common (16.2.10-1bionic) ...
Setting up python3-ceph-common (16.2.10-1bionic) ...
```





## python3-prettytable

```bash
root@k8s-master01:/tmp/223# apt-cache madison python3-prettytable
python3-prettytable |    0.7.2-3 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages

root@k8s-master01:/tmp/223# apt install python3-prettytable
```



## python3-rbd_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i python3-rbd_16.2.10-1bionic_amd64.deb
Selecting previously unselected package python3-rbd.
(Reading database ... 68336 files and directories currently installed.)
Preparing to unpack python3-rbd_16.2.10-1bionic_amd64.deb ...
Unpacking python3-rbd (16.2.10-1bionic) ...
Setting up python3-rbd (16.2.10-1bionic) ...
root@k8s-master01:/tmp/223#
```





## python3-rgw_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i python3-rgw_16.2.10-1bionic_amd64.deb
Selecting previously unselected package python3-rgw.
(Reading database ... 68343 files and directories currently installed.)
Preparing to unpack python3-rgw_16.2.10-1bionic_amd64.deb ...
Unpacking python3-rgw (16.2.10-1bionic) ...
dpkg: dependency problems prevent configuration of python3-rgw:
 python3-rgw depends on librgw2 (>= 16.2.10-1bionic); however:
  Package librgw2 is not installed.
  
  ## 依赖 librgw2
  
  ## 安装完 librgw2 后再次安装
root@k8s-master01:/tmp/223# dpkg -i python3-rgw_16.2.10-1bionic_amd64.deb
(Reading database ... 68347 files and directories currently installed.)
Preparing to unpack python3-rgw_16.2.10-1bionic_amd64.deb ...
Unpacking python3-rgw (16.2.10-1bionic) over (16.2.10-1bionic) ...
Setting up python3-rgw (16.2.10-1bionic) ...
```



### librgw2_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i librgw2_16.2.10-1bionic_amd64.deb
Selecting previously unselected package librgw2.
(Reading database ... 68343 files and directories currently installed.)
Preparing to unpack librgw2_16.2.10-1bionic_amd64.deb ...
Unpacking librgw2 (16.2.10-1bionic) ...
Setting up librgw2 (16.2.10-1bionic) ...
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
```



## libradosstriper1_16.2.10-1bionic_amd64.deb

```bash
root@k8s-master01:/tmp/223# dpkg -i libradosstriper1_16.2.10-1bionic_amd64.deb
Selecting previously unselected package libradosstriper1.
(Reading database ... 68354 files and directories currently installed.)
Preparing to unpack libradosstriper1_16.2.10-1bionic_amd64.deb ...
Unpacking libradosstriper1 (16.2.10-1bionic) ...
Setting up libradosstriper1 (16.2.10-1bionic) ...
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
```



## 安装ceph-common

```bash
root@k8s-master01:/tmp/223# dpkg -i ceph-common_16.2.10-1bionic_amd64.deb
Selecting previously unselected package ceph-common.
(Reading database ... 68358 files and directories currently installed.)
Preparing to unpack ceph-common_16.2.10-1bionic_amd64.deb ...
Unpacking ceph-common (16.2.10-1bionic) ...
Setting up ceph-common (16.2.10-1bionic) ...
Adding group ceph....done
Adding system user ceph....done
Setting system user ceph properties....done
chown: cannot access '/var/log/ceph/*.log*': No such file or directory
Created symlink /etc/systemd/system/multi-user.target.wants/ceph.target → /lib/systemd/system/ceph.target.
Created symlink /etc/systemd/system/multi-user.target.wants/rbdmap.service → /lib/systemd/system/rbdmap.service.
Processing triggers for libc-bin (2.27-3ubuntu1.5) ...
Processing triggers for man-db (2.8.3-2ubuntu0.1) ...


root@k8s-master01:/tmp/223# ceph -v
ceph version 16.2.10 (45fa1a083152e41a408d15505f594ec5f1b4fe17) pacific (stable)
```





整理一下apt 安装的软件包

```bash
$ apt install -y libaio1 libbabeltrace1 libgoogle-perftools4 libleveldb1v5 liblua5.3-0 liboath0 librabbitmq4 liblttng-ust0 librdmacm1 libibverbs1 python3-prettytable librdkafka1
```



需要安装顺序按照以下13各deb软件包：

1. `librados2_16.2.10-1bionic_amd64.deb`
2. `librbd1_16.2.10-1bionic_amd64.deb`
3. `libcephfs2_16.2.10-1bionic_amd64.deb`
4. `python3-rados_16.2.10-1bionic_amd64.deb`
5. `python3-ceph-argparse_16.2.10-1bionic_all.deb`
6. `python3-cephfs_16.2.10-1bionic_amd64.deb`
8. `python3-ceph-common_16.2.10-1bionic_all.deb`
9. `python3-rbd_16.2.10-1bionic_amd64.deb`
10. `librgw2_16.2.10-1bionic_amd64.deb`
11. `python3-rgw_16.2.10-1bionic_amd64.deb`
12. `libradosstriper1_16.2.10-1bionic_amd64.deb`
13. `ceph-common_16.2.10-1bionic_amd64.deb`

