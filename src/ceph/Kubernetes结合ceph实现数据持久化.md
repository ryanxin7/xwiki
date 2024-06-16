---
id: ceph-with-kubernetes
author: Ryan
title: Kubernetes结合ceph实现数据持久化
date: 2023-11-02
---

# Ceph K8s环境RBD,CephFS的使用

让Kubernetes中的Pod能够访问Ceph中的RBD（块设备镜像）作为存储设备，需要在ceph创建rbd并且让k8s node 节点能够通过ceph认证。

> 在使用Ceph作为动态存储卷的时候，确实需要确保Kubernetes集群中的各个组件，包括kube-controller-manager，能够访问Ceph存储集群。为了实现这一点，通常需要在每个Kubernetes节点上同步Ceph的认证文件。



可以根据需求在Kubernetes中选择使用RBD存储或CephFS存储。

RBD（Rados Block Device）通常用于有状态服务，因为它提供了块设备级别的存储，适用于需要持久性和存储卷的应用程序，如数据库或其他有状态服务。RBD卷可以附加到Pod，并且可以在Pod重新调度时保留数据。这使其非常适用于需要持久性数据的应用程序。

CephFS（Ceph文件系统）通常用于无状态服务，因为它提供了一个分布式文件系统，允许多个Pod在同一文件系统上共享数据。这对于需要跨多个Pod之间共享数据的应用程序非常有用，如Web服务器或应用程序日志。



## 1.1 基于rbd结合k8s提供存储卷及动态存储



**查看ceph集群状态**

```bash
ceph health detail | awk '{print $2}' | sed -n '/^2\.*/p' | sed -n '1,50p'
2.3e 2.3f 2.3c 2.3d 2.3a 2.3b 2.38 2.39 2.36 2.37 2.34 2.35 2.32 2.33 2.30 2.31 2.2e 2.2f 2.2c 2.2d 2.2a 2.2b 2.28 2.29 2.26 2.27 2.24
2.25 2.22 2.23 2.20 2.21 2.1b 2.1a 2.19 2.18 2.17 2.16 2.15 2.14 2.13 2.12 2.11 2.10 2.f 2.e 2.d 2.c 2.5 2.6
```



```bash
#!/bin/bash

for i in $(ceph health detail | awk '{print $2}' | sed -n '/^2\.*/p' | sed -n '1,50p'); do
    ceph pg deep-scrub $i
done
```



```bash
root@ceph-mon1[10:16:36]~ #:sh deep-scrub.sh
instructing pg 2.3e on osd.12 to deep-scrub
instructing pg 2.3f on osd.7 to deep-scrub
instructing pg 2.3c on osd.7 to deep-scrub
instructing pg 2.3d on osd.1 to deep-scrub
instructing pg 2.3a on osd.12 to deep-scrub
instructing pg 2.3b on osd.8 to deep-scrub
instructing pg 2.38 on osd.12 to deep-scrub
instructing pg 2.39 on osd.14 to deep-scrub
instructing pg 2.36 on osd.1 to deep-scrub
instructing pg 2.37 on osd.13 to deep-scrub
instructing pg 2.34 on osd.5 to deep-scrub
instructing pg 2.35 on osd.1 to deep-scrub
instructing pg 2.32 on osd.12 to deep-scrub
instructing pg 2.33 on osd.8 to deep-scrub
instructing pg 2.30 on osd.13 to deep-scrub
instructing pg 2.31 on osd.0 to deep-scrub
instructing pg 2.2e on osd.7 to deep-scrub
instructing pg 2.2f on osd.10 to deep-scrub
instructing pg 2.2c on osd.14 to deep-scrub
instructing pg 2.2d on osd.8 to deep-scrub
instructing pg 2.2a on osd.9 to deep-scrub
instructing pg 2.2b on osd.4 to deep-scrub
instructing pg 2.28 on osd.3 to deep-scrub
instructing pg 2.29 on osd.6 to deep-scrub
instructing pg 2.26 on osd.9 to deep-scrub
instructing pg 2.27 on osd.9 to deep-scrub
instructing pg 2.24 on osd.6 to deep-scrub
instructing pg 2.25 on osd.13 to deep-scrub
instructing pg 2.22 on osd.6 to deep-scrub
instructing pg 2.23 on osd.4 to deep-scrub
instructing pg 2.20 on osd.7 to deep-scrub
instructing pg 2.21 on osd.4 to deep-scrub
instructing pg 2.1b on osd.11 to deep-scrub
instructing pg 2.1a on osd.6 to deep-scrub
instructing pg 2.19 on osd.3 to deep-scrub
instructing pg 2.18 on osd.0 to deep-scrub
instructing pg 2.17 on osd.6 to deep-scrub
instructing pg 2.16 on osd.8 to deep-scrub
instructing pg 2.15 on osd.10 to deep-scrub
instructing pg 2.14 on osd.8 to deep-scrub
instructing pg 2.13 on osd.13 to deep-scrub
instructing pg 2.12 on osd.10 to deep-scrub
instructing pg 2.11 on osd.6 to deep-scrub
instructing pg 2.10 on osd.10 to deep-scrub
instructing pg 2.f on osd.11 to deep-scrub
instructing pg 2.e on osd.2 to deep-scrub
instructing pg 2.d on osd.12 to deep-scrub
instructing pg 2.c on osd.12 to deep-scrub
instructing pg 2.5 on osd.12 to deep-scrub
instructing pg 2.6 on osd.1 to deep-scrub
```



再次检查

```bash
root@ceph-mon1[10:24:19]~ #:ceph health detail
HEALTH_OK
```







查看存储池

```bash
xceo@ceph-mon1:~$ ceph osd pool ls
device_health_metrics
xxrbd3
xxrbd2
cephfs-metadata
cephfs-data
.rgw.root
default.rgw.log
default.rgw.control
default.rgw.meta
```



查看存储池使用情况

```bash
xceo@ceph-mon1:~$ ceph df
--- RAW STORAGE ---
CLASS     SIZE    AVAIL     USED  RAW USED  %RAW USED
hdd    1.8 TiB  1.2 TiB  562 GiB   562 GiB      31.23
TOTAL  1.8 TiB  1.2 TiB  562 GiB   562 GiB      31.23

--- POOLS ---
POOL                   ID  PGS   STORED  OBJECTS     USED  %USED  MAX AVAIL
device_health_metrics   1    1      0 B        0      0 B      0    322 GiB
xxrbd3                  3   64   10 MiB       17   31 MiB      0    322 GiB
xxrbd2                  4   64   12 MiB       16   37 MiB      0    322 GiB
cephfs-metadata         5   32  226 MiB      106  679 MiB   0.07    322 GiB
cephfs-data             6   64  183 GiB   47.35k  550 GiB  36.30    322 GiB
.rgw.root               7   32  1.3 KiB        4   48 KiB      0    322 GiB
default.rgw.log         8   32  3.6 KiB      209  408 KiB      0    322 GiB
default.rgw.control     9   32      0 B        8      0 B      0    322 GiB
default.rgw.meta       10   32      0 B        0      0 B      0    322 GiB
```



### 1.1.1 创建存储池

```bash
## 创建存储池 k8s-xrbd-pool1
xceo@ceph-mon1:~$ ceph osd pool create k8s-xrbd-pool1 32 32
pool 'k8s-xrbd-pool1' created

## 验证存储池
xceo@ceph-mon1:~$ ceph osd pool ls
k8s-xrbd-pool1

## 存储池启用rbd块存储功能
xceo@ceph-mon1:~$ ceph osd pool application enable k8s-xrbd-pool1 rbd
enabled application 'rbd' on pool 'k8s-xrbd-pool1'

## 初始化rbd
xceo@ceph-mon1:~$ rbd pool init -p k8s-xrbd-pool1
```



### 1.1.2 创建Image

创建好的rbd不能直接挂载需要创建镜像

```bash
## 创建镜像
xceo@ceph-mon1:~$ rbd create k8s-xrbd-img1 --size 4G --pool k8s-xrbd-pool1 --image-feature layering

## 查看镜像
xceo@ceph-mon1:~$ rbd ls --pool k8s-xrbd-pool1
k8s-xrbd-img1

##验证镜像信息
xceo@ceph-mon1:~$ rbd --image k8s-xrbd-img1 --pool k8s-xrbd-pool1 info
rbd image 'k8s-xrbd-img1':
        size 4 GiB in 1024 objects
        order 22 (4 MiB objects)
        snapshot_count: 0
        id: 12bcae2102c6
        block_name_prefix: rbd_data.12bcae2102c6
        format: 2
        features: layering
        op_features:
        flags:
        create_timestamp: Tue Oct 31 10:44:52 2023
        access_timestamp: Tue Oct 31 10:44:52 2023
        modify_timestamp: Tue Oct 31 10:44:52 2023
```



### 1.1.3 客户端安装ceph-common

分别在K8S Master与各node 节点安装 ceph-common 组件包。

```BASH
## 查看当前主机系统版本
root@k8s-master01:~# lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 18.04.6 LTS
Release:        18.04
Codename:       bionic
```



```bash
## 安装key
wget -q -O- 'https://mirrors.aliyun.com/ceph/keys/release.asc' | sudo apt-key add -

## Ceph pacific Ubuntu 18.04.6 LTS bionic 版本
sudo apt-add-repository 'deb https://mirrors.aliyun.com/ceph/debian-pacific/ bionic main'


## Ceph pacific Ubuntu 20.04.4 LTS focal 版本

sudo apt-add-repository 'deb https://mirrors.aliyun.com/ceph/debian-pacific/ focal main'

sudo apt update

## 查看软件包版本
apt-cache madison ceph-common
ceph-common | 16.2.14-1bionic | https://mirrors.aliyun.com/ceph/debian-pacific bionic/main amd64 Packages
ceph-common | 15.2.17-1bionic | https://mirrors.aliyun.com/ceph/debian-octopus bionic/main amd64 Packages
ceph-common | 12.2.13-0ubuntu0.18.04.11 | http://mirrors.aliyun.com/ubuntu bionic-updates/main amd64 Packages
ceph-common | 12.2.13-0ubuntu0.18.04.11 | http://mirrors.aliyun.com/ubuntu bionic-security/main amd64 Packages
ceph-common | 12.2.4-0ubuntu1 | http://mirrors.aliyun.com/ubuntu bionic/main amd64 Packages
```



因为Ceph集群的版本为16.2.10，Common 的版本尽量和Ceph集群的版本一致，软件包一般只提供最新的版本指定版本的话需要手动下载deb文件进行安装。

16.2.10 版本DEB软件包下载：https://mirrors.aliyun.com/ceph/debian-16.2.10/pool/main/c/ceph/?spm=a2c6h.25603864.0.0.27912add02vFGg



**遇到依赖问题**

解决方法：见 ceph-common-依赖问题

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





```bash
## bionic版本的依赖
apt install -y libaio1 libbabeltrace1 libgoogle-perftools4 libleveldb1v5 liblua5.3-0 liboath0 librabbitmq4 liblttng-ust0 librdmacm1 libibverbs1 librdkafka1 python3-prettytable 
```



`ceph-common-16.2.10.tar.gz` 链接：https://pan.baidu.com/s/1SGCnuB_5YQvLQm8fbnoltQ?pwd=xupq 
提取码：xupq 

```bash
## 解压安装包
tar -xf /tmp/Ceph-Common-16.2.10.tar -C /opt/ceph
```



```bash
## 执行安装脚本
cd /opt/ceph/Ceph-Common-16.2.10
bash ./install-ceph-common-16.2.10.sh 
...
Successfully installed ceph-common_16.2.10-1bionic_amd64.deb
Ceph packages installation completed.
```



```bash
## 验证版本
root@k8s-node01:~# ceph -v
ceph version 16.2.10 (45fa1a083152e41a408d15505f594ec5f1b4fe17) pacific (stable)

root@k8s-node02:~# ceph -v
ceph version 16.2.10 (45fa1a083152e41a408d15505f594ec5f1b4fe17) pacific (stable)
```



**focal 版本的依赖**

```bash
root@k8s-made-01-32:/tmp# dpkg -i ceph-common_16.2.10-1focal_amd64.deb
dpkg: warning: downgrading ceph-common from 16.2.13-1focal to 16.2.10-1focal
(Reading database ... 115415 files and directories currently installed.)
Preparing to unpack ceph-common_16.2.10-1focal_amd64.deb ...
Unpacking ceph-common (16.2.10-1focal) over (16.2.13-1focal) ...
dpkg: dependency problems prevent configuration of ceph-common:
 ceph-common depends on libjaeger (= 16.2.10-1focal); however:
  Version of libjaeger on system is 16.2.13-1focal.
 ceph-common depends on librbd1 (= 16.2.10-1focal); however:
  Version of librbd1 on system is 16.2.13-1focal.
 ceph-common depends on python3-cephfs (= 16.2.10-1focal); however:
  Version of python3-cephfs on system is 16.2.13-1focal.
 ceph-common depends on python3-ceph-argparse (= 16.2.10-1focal); however:
  Version of python3-ceph-argparse on system is 16.2.13-1focal.
 ceph-common depends on python3-ceph-common (= 16.2.10-1focal); however:
  Version of python3-ceph-common on system is 16.2.13-1focal.
 ceph-common depends on python3-rados (= 16.2.10-1focal); however:
  Version of python3-rados on system is 16.2.13-1focal.
 ceph-common depends on python3-rbd (= 16.2.10-1focal); however:
  Version of python3-rbd on system is 16.2.13-1focal.
 ceph-common depends on python3-rgw (= 16.2.10-1focal); however:
  Version of python3-rgw on system is 16.2.13-1focal.
```



```bash
apt install  liboath0 libleveldb1d libgoogle-perftools4  libbabeltrace1  liblua5.3-0 librabbitmq4 librdkafka1 libsnappy1v5 python3-prettytable -y
apt remove librados2 
```



```bash
root@k8s-w-05-37:/tmp# tar xvf ceph-common-16.2.10-focal.tar.gz
./ceph-common-16.2.10-focal/
./ceph-common-16.2.10-focal/ceph-common_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/librados2_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/python3-rados_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/libradosstriper1_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/python3-ceph-argparse_16.2.10-1focal_all.deb
./ceph-common-16.2.10-focal/librgw2_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/python3-rbd_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/librbd1_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/libcephfs2_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/python3-rgw_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/python3-cephfs_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/libjaeger_16.2.10-1focal_amd64.deb
./ceph-common-16.2.10-focal/install-ceph-common-focal-16.2.10.sh
./ceph-common-16.2.10-focal/python3-ceph-common_16.2.10-1focal_all.deb
root@k8s-w-05-37:/tmp#
root@k8s-w-05-37:/tmp# cd ceph-common-16.2.10-focal/
root@k8s-w-05-37:/tmp/ceph-common-16.2.10-focal# ls
ceph-common_16.2.10-1focal_amd64.deb  libradosstriper1_16.2.10-1focal_amd64.deb     python3-cephfs_16.2.10-1focal_amd64.deb
install-ceph-common-focal-16.2.10.sh  librbd1_16.2.10-1focal_amd64.deb              python3-rados_16.2.10-1focal_amd64.deb
libcephfs2_16.2.10-1focal_amd64.deb   librgw2_16.2.10-1focal_amd64.deb              python3-rbd_16.2.10-1focal_amd64.deb
libjaeger_16.2.10-1focal_amd64.deb    python3-ceph-argparse_16.2.10-1focal_all.deb  python3-rgw_16.2.10-1focal_amd64.deb
librados2_16.2.10-1focal_amd64.deb    python3-ceph-common_16.2.10-1focal_all.deb
root@k8s-w-05-37:/tmp/ceph-common-16.2.10-focal#
root@k8s-w-05-37:/tmp/ceph-common-16.2.10-focal# bash install-ceph-common-focal-16.2.10.sh
Selecting previously unselected package librados2.
(Reading database ... 108997 files and directories currently installed.)
Preparing to unpack .../librados2_16.2.10-1focal_amd64.deb ...
Unpacking librados2 (16.2.10-1focal) ...
Setting up librados2 (16.2.10-1focal) ...
Processing triggers for libc-bin (2.31-0ubuntu9.9) ...
Successfully installed librados2_16.2.10-1focal_amd64.deb
Selecting previously unselected package libradosstriper1.
(Reading database ... 109005 files and directories currently installed.)
Preparing to unpack .../libradosstriper1_16.2.10-1focal_amd64.deb ...
Unpacking libradosstriper1 (16.2.10-1focal) ...
Setting up libradosstriper1 (16.2.10-1focal) ...
Processing triggers for libc-bin (2.31-0ubuntu9.9) ...
Successfully installed libradosstriper1_16.2.10-1focal_amd64.deb
Selecting previously unselected package libjaeger.
(Reading database ... 109009 files and directories currently installed.)
Preparing to unpack .../libjaeger_16.2.10-1focal_amd64.deb ...
Unpacking libjaeger (16.2.10-1focal) ...
Setting up libjaeger (16.2.10-1focal) ...
Successfully installed libjaeger_16.2.10-1focal_amd64.deb
Selecting previously unselected package librbd1.
(Reading database ... 109011 files and directories currently installed.)
Preparing to unpack .../librbd1_16.2.10-1focal_amd64.deb ...
Unpacking librbd1 (16.2.10-1focal) ...
Setting up librbd1 (16.2.10-1focal) ...
Processing triggers for libc-bin (2.31-0ubuntu9.9) ...
Successfully installed librbd1_16.2.10-1focal_amd64.deb
Selecting previously unselected package libcephfs2.
(Reading database ... 109024 files and directories currently installed.)
Preparing to unpack .../libcephfs2_16.2.10-1focal_amd64.deb ...
Unpacking libcephfs2 (16.2.10-1focal) ...
Setting up libcephfs2 (16.2.10-1focal) ...
Processing triggers for libc-bin (2.31-0ubuntu9.9) ...
Successfully installed libcephfs2_16.2.10-1focal_amd64.deb
Selecting previously unselected package librgw2.
(Reading database ... 109028 files and directories currently installed.)
Preparing to unpack .../librgw2_16.2.10-1focal_amd64.deb ...
Unpacking librgw2 (16.2.10-1focal) ...
Setting up librgw2 (16.2.10-1focal) ...
Processing triggers for libc-bin (2.31-0ubuntu9.9) ...
Successfully installed librgw2_16.2.10-1focal_amd64.deb
Selecting previously unselected package python3-rados.
(Reading database ... 109032 files and directories currently installed.)
Preparing to unpack .../python3-rados_16.2.10-1focal_amd64.deb ...
Unpacking python3-rados (16.2.10-1focal) ...
Setting up python3-rados (16.2.10-1focal) ...
Successfully installed python3-rados_16.2.10-1focal_amd64.deb
Selecting previously unselected package python3-ceph-argparse.
(Reading database ... 109039 files and directories currently installed.)
Preparing to unpack .../python3-ceph-argparse_16.2.10-1focal_all.deb ...
Unpacking python3-ceph-argparse (16.2.10-1focal) ...
Setting up python3-ceph-argparse (16.2.10-1focal) ...
Successfully installed python3-ceph-argparse_16.2.10-1focal_all.deb
Selecting previously unselected package python3-cephfs.
(Reading database ... 109043 files and directories currently installed.)
Preparing to unpack .../python3-cephfs_16.2.10-1focal_amd64.deb ...
Unpacking python3-cephfs (16.2.10-1focal) ...
Setting up python3-cephfs (16.2.10-1focal) ...
Successfully installed python3-cephfs_16.2.10-1focal_amd64.deb
Selecting previously unselected package python3-ceph-common.
(Reading database ... 109051 files and directories currently installed.)
Preparing to unpack .../python3-ceph-common_16.2.10-1focal_all.deb ...
Unpacking python3-ceph-common (16.2.10-1focal) ...
Setting up python3-ceph-common (16.2.10-1focal) ...
Successfully installed python3-ceph-common_16.2.10-1focal_all.deb
Selecting previously unselected package python3-rbd.
(Reading database ... 109086 files and directories currently installed.)
Preparing to unpack .../python3-rbd_16.2.10-1focal_amd64.deb ...
Unpacking python3-rbd (16.2.10-1focal) ...
Setting up python3-rbd (16.2.10-1focal) ...
Successfully installed python3-rbd_16.2.10-1focal_amd64.deb
Selecting previously unselected package python3-rgw.
(Reading database ... 109093 files and directories currently installed.)
Preparing to unpack .../python3-rgw_16.2.10-1focal_amd64.deb ...
Unpacking python3-rgw (16.2.10-1focal) ...
Setting up python3-rgw (16.2.10-1focal) ...
Successfully installed python3-rgw_16.2.10-1focal_amd64.deb
Selecting previously unselected package ceph-common.
(Reading database ... 109100 files and directories currently installed.)
Preparing to unpack .../ceph-common_16.2.10-1focal_amd64.deb ...
Unpacking ceph-common (16.2.10-1focal) ...
Setting up ceph-common (16.2.10-1focal) ...
Adding group ceph....done
Adding system user ceph....done
Setting system user ceph properties....done
chown: cannot access '/var/log/ceph/*.log*': No such file or directory
Created symlink /etc/systemd/system/multi-user.target.wants/ceph.target → /lib/systemd/system/ceph.target.
Created symlink /etc/systemd/system/multi-user.target.wants/rbdmap.service → /lib/systemd/system/rbdmap.service.
Processing triggers for libc-bin (2.31-0ubuntu9.9) ...
Processing triggers for man-db (2.9.1-1) ...
Successfully installed ceph-common_16.2.10-1focal_amd64.deb
Ceph packages installation completed.

```



```bash
tar -xvf ceph-common-16.2.10-focal.tar.gz
dpkg -i librados2_16.2.10-1focal_amd64.deb
dpkg -i libradosstriper1_16.2.10-1focal_amd64.deb
dpkg -i libjaeger_16.2.10-1focal_amd64.deb
dpkg -i librbd1_16.2.10-1focal_amd64.deb
dpkg -i libcephfs2_16.2.10-1focal_amd64.deb
dpkg -i librgw2_16.2.10-1focal_amd64.deb
dpkg -i python3-rados_16.2.10-1focal_amd64.deb
dpkg -i python3-ceph-argparse_16.2.10-1focal_all.deb
dpkg -i python3-cephfs_16.2.10-1focal_amd64.deb
dpkg -i python3-ceph-common_16.2.10-1focal_all.deb
dpkg -i python3-rbd_16.2.10-1focal_amd64.deb
dpkg -i python3-rgw_16.2.10-1focal_amd64.deb
dpkg -i ceph-common_16.2.10-1focal_amd64.deb

12
```



`ceph-common-16.2.10-focal.tar.gz` 链接：https://pan.baidu.com/s/19lnYalGOcTJyLdMt3AWuxg?pwd=bbk8 
提取码：bbk8 



### 1.1.4 创建Ceph普通用户权限keyring

```bash
xceo@ceph-mon1:~/ceph-cluster$ ceph auth get-or-create client.admk8s-ceamg mon 'allow r' osd 'allow * pool=k8s-xrbd-pool1'
[client.admk8s-ceamg]
        key = AQAhr0hlhZTGCxAAajU0BbOfxO2+oUJ8OkmnXA==
```



```bash
## 验证用户
xceo@ceph-mon1:~/ceph-cluster$ ceph auth get client.admk8s-ceamg
[client.admk8s-ceamg]
        key = AQAhr0hlhZTGCxAAajU0BbOfxO2+oUJ8OkmnXA==
        caps mon = "allow r"
        caps osd = "allow * pool=k8s-xrbd-pool1"
exported keyring for client.admk8s-ceamg
```



```bash 
## 导出用户信息到Keying文件
xceo@ceph-mon1:~/ceph-cluster$ ceph auth get client.admk8s-ceamg -o ceph.client.admk8s-ceamg.keyring
exported keyring for client.admk8s-ceamg

xceo@ceph-mon1:~/ceph-cluster$ cat ceph.client.admk8s-ceamg.keyring
[client.admk8s-ceamg]
        key = AQAhr0hlhZTGCxAAajU0BbOfxO2+oUJ8OkmnXA==
        caps mon = "allow r"
        caps osd = "allow * pool=k8s-xrbd-pool1"

```

```bash
## 同步认证文件到K8s 各master和node节点
xceo@ceph-mon1:~/ceph-cluster$ scp ceph.client.admk8s-ceamg.keyring ceph.conf root@10.1.0.110:/etc/ceph
xceo@ceph-mon1:~/ceph-cluster$ scp ceph.client.admk8s-ceamg.keyring ceph.conf root@10.1.0.111:/etc/ceph
xceo@ceph-mon1:~/ceph-cluster$ scp ceph.client.admk8s-ceamg.keyring ceph.conf root@10.1.0.112:/etc/ceph
```





```bash
## hosts
10.1.0.39 ceph-node1.xx.local ceph-node1
10.1.0.40 ceph-node2.xx.local ceph-node2
10.1.0.41 ceph-node3.xx.local ceph-node3
10.1.0.39 ceph-mon1.xx.local ceph-mon1
10.1.0.40 ceph-mon2.xx.local ceph-mon2
10.1.0.41 ceph-mon3.xx.local ceph-mon3
10.1.0.40 ceph-mgr1.xx.local ceph-mgr1
10.1.0.41 ceph-mgr2.xx.local ceph-mgr2
10.1.0.39 ceph-deploy.xx.local ceph-deploy
```



```bash 
## 在k8s node 节点验证用户权限
root@k8s-node01:/etc/ceph# ceph --user admk8s-ceamg.xx -s
  cluster:
    id:     62be32df-9cb4-474f-8727-d5c4bbceaf97
    health: HEALTH_OK

  services:
    mon: 3 daemons, quorum ceph-mon1,ceph-mon2,ceph-mon3 (age 11h)
    mgr: ceph-mgr1(active, since 5M), standbys: ceph-mgr2
    mds: 1/1 daemons up
    osd: 15 osds: 15 up (since 5M), 15 in (since 5M)
    rgw: 1 daemon active (1 hosts, 1 zones)

  data:
    volumes: 1/1 healthy
    pools:   10 pools, 385 pgs
    objects: 47.71k objects, 184 GiB
    usage:   562 GiB used, 1.2 TiB / 1.8 TiB avail
    pgs:     385 active+clean
```





```bash
## 验证镜像访问权限
root@k8s-node02:/etc/ceph# rbd --id admk8s-ceamg.xx ls --pool=k8s-xrbd-pool1
k8s-xrbd-img1
```



## 1.2  通过Keyring 文件挂载RBD

 k8s环境可以有2种方式挂载rbd.

1. 基于keyring
2. 基于k8s secret



### 1.2.1 通过Kering文件直接挂载-busybox

```yaml
# cat case1-busybox-keyring.yaml 
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - image: busybox 
    command:
      - sleep
      - "3600"
    imagePullPolicy: Always 
    name: busybox
    #restartPolicy: Always
    volumeMounts:
    - name: rbd-data1
      mountPath: /data
  volumes:
    - name: rbd-data1
      rbd:
        monitors:
        - '10.1.0.39:6789'
        - '10.1.0.40:6789'
        - '10.1.0.41:6789'
        pool: k8s-xrbd-pool1
        image: k8s-xrbd-img1
        fsType: ext4
        readOnly: false
        user: admk8s-ceamg
        keyring: /etc/ceph/ceph.client.admk8s-ceamg.keyring


## 部署busybox
# kubectl apply -f case1-busybox-keyring.yaml

Events:
  Type    Reason                  Age   From                     Message
  ----    ------                  ----  ----                     -------
  Normal  Scheduled               14s   default-scheduler        Successfully assigned default/busybox to k8s-node03
  Normal  SuccessfulAttachVolume  15s   attachdetach-controller  AttachVolume.Attach succeeded for volume "rbd-data1"
  Normal  Pulling                 4s    kubelet                  Pulling image "busybox:1.34"
  Normal  Pulled                  3s    kubelet                  Successfully pulled image "busybox:1.34" in 1.841793996s
  Normal  Created                 3s    kubelet                  Created container busybox
  Normal  Started                 2s    kubelet                  Started container busybox


root@k8s-master01:/etc/ceph# kubectl get pod
NAME      READY   STATUS    RESTARTS   AGE
busybox   1/1     Running   0          16s



## 此时busybox已经启动
root@k8s-master01:/etc/ceph# kubectl get pod -o wide
NAME      READY   STATUS    RESTARTS   AGE   IP           NODE         NOMINATED NODE   READINESS GATES
busybox   1/1     Running   0          52s   10.244.1.4   k8s-node03   <none>           <none>
root@k8s-master01:/etc/ceph#
```



测试卷的数据写入

```bash
root@k8s-master01:~# kubectl exec -it busybox -- cp -r /etc /data
root@k8s-master01:~# kubectl exec -it busybox -- ls -l /data
total 20
drwxr-xr-x    3 root     root          4096 Nov  7 02:54 etc
drwx------    2 root     root         16384 Nov  6 09:42 lost+found
```



### 1.2.2  通过Kering文件直接挂载-Nginx  

```yaml
root@k8s-master01:/yaml/ceph# vim case2-nginx-keyring.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels: 
      app: nginx-rbd
  template:
    metadata:
      labels:
        app: nginx-rbd
    spec:
      containers:
      - name: nginx-rbd
        image: nginx
        ports:
        - containerPort: 80
        imagePullPolicy: IfNotPresent
        volumeMounts:
        - name: rbd-data1
          mountPath: /data
      volumes:
        - name: rbd-data1
          rbd:
            monitors:
            - '10.1.0.39:6789'
            - '10.1.0.40:6789'
            - '10.1.0.41:6789'
            pool: k8s-xrbd-pool1
            image: k8s-xrbd-img1
            fsType: ext4
            readOnly: false
            user: admk8s-ceamg
            keyring: /etc/ceph/ceph.client.admk8s-ceamg.keyring
```



```bash
root@k8s-master01:/yaml/ceph# kubectl apply -f case2-nginx-keyring.yaml
```



```bash
Events:
  Type    Reason                  Age   From                     Message
  ----    ------                  ----  ----                     -------
  Normal  Scheduled               84s   default-scheduler        Successfully assigned default/nginx-deployment-7c89bddb49-x2z5z to k8s-node03
  Normal  SuccessfulAttachVolume  85s   attachdetach-controller  AttachVolume.Attach succeeded for volume "rbd-data1"
  Normal  Pulling                 68s   kubelet                  Pulling image "nginx"
  Normal  Pulled                  3s    kubelet                  Successfully pulled image "nginx" in 1m4.788104901s
  Normal  Created                 2s    kubelet                  Created container nginx-rbd
  Normal  Started                 2s    kubelet                  Started container nginx-rbd
```



### 1.2.3 验证RBD挂载



![image-20231107103955428](https://cdn1.ryanxin.live/image-20231107103955428.png)



查看节点对rbd卷的挂载

```bash
root@k8s-node03:~# mount |grep rbd
/dev/rbd0 on /var/lib/kubelet/plugins/kubernetes.io/rbd/mounts/k8s-xrbd-pool1-image-k8s-xrbd-img1 type ext4 (rw,relatime,stripe=1024,data=ordered)
/dev/rbd0 on /var/lib/kubelet/pods/3138919d-d725-4739-a478-7bab02d44c5d/volumes/kubernetes.io~rbd/rbd-data1 type ext4 (rw,relatime,stripe=1024,data=ordered)



root@k8s-node03:~# lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sr0     11:0    1  969M  0 rom
rbd0   251:0    0    4G  0 disk /var/lib/kubelet/pods/3138919d-d725-4739-a478-7bab02d44c5d/volumes/kubernetes.io~rbd/rbd-data1
vda    252:0    0  120G  0 disk
├─vda1 252:1    0    1M  0 part
└─vda2 252:2    0  120G  0 part /

root@k8s-node03:~# rbd showmapped
id  pool            namespace  image          snap  device
0   k8s-xrbd-pool1             k8s-xrbd-img1  -     /dev/rbd0
```





此时在ceph下数据也已经可以看到

![image-20231107104237009](https://cdn1.ryanxin.live/image-20231107104237009.png)



查看 pod 具体挂载使用rbd

```bash
root@k8s-master01:/yaml/ceph# kubectl exec -it nginx-deployment-7c89bddb49-x2z5z  -- df -h /data
Filesystem      Size  Used Avail Use% Mounted on
/dev/rbd0       3.9G   76K  3.9G   1% /data

root@k8s-master01:/yaml/ceph# kubectl exec -it nginx-deployment-7c89bddb49-x2z5z -- mount|grep rbd
/dev/rbd0 on /data type ext4 (rw,relatime,stripe=1024,data=ordered)


root@k8s-master01:/yaml/ceph# kubectl exec -it nginx-deployment-7c89bddb49-x2z5z -- ls -l /data
total 20
drwxr-xr-x 3 root root  4096 Nov  7 02:54 etc
drwx------ 2 root root 16384 Nov  6 09:42 lost+found

```



## 1.3 通过secret挂载rbd

### 1.3.1 创建Secret

先获取base64加密后的auth key

```bash
xceo@ceph-mon1:~$ ceph auth print-key client.admk8s-ceamg | base64
QVFBaHIwaGxoWlRHQ3hBQWFqVTBCYk9meE8yK29VSjhPa21uWEE9PQ==


## 可以用base64解密
xceo@ceph-mon1:~$ echo QVFBaHIwaGxoWlRHQ3hBQWFqVTBCYk9meE8yK29VSjhPa21uWEE9PQ== |base64 -d
AQAhr0hlhZTGCxAAajU0BbOfxO2+oUJ8OkmnXA==xceo@ceph-mon1:~$
```



将这个key写入`secret.yaml`

```bash
vim case3-secret-client-k8s-rbd.yaml 
```



```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ceph-secret-admk8s-ceamg
type: "kubernetes.io/rbd"
data:
  key: QVFBaHIwaGxoWlRHQ3hBQWFqVTBCYk9meE8yK29VSjhPa21uWEE9PQ==
```

```bash
root@k8s-master01:/yaml/ceph# kubectl apply -f case3-secret-client-admk8s-ceamg.yaml
secret/ceph-secret-admk8s-ceamg created
```



验证secret

```bash
root@k8s-master01:/yaml/ceph# kubectl get secrets
NAME                       TYPE                                  DATA   AGE
ceph-secret-admk8s-ceamg   kubernetes.io/rbd                     1      51s
```

### 1.3.2 创建pod

```yaml
#vim case4-nginx-secret.yaml 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ng-deploy-80
  template:
    metadata:
      labels:
        app: ng-deploy-80
    spec:
      containers:
      - name: ng-deploy-80
        image: nginx
        ports:
        - containerPort: 80

        volumeMounts:
        - name: rbd-data1
          mountPath: /usr/share/nginx/html/rbd
      volumes:
        - name: rbd-data1
          rbd:
            monitors:
            - '10.1.0.39:6789'
            - '10.1.0.40:6789'
            - '10.1.0.41:6789'
            pool: k8s-xrbd-pool1
            image: k8s-xrbd-img1
            fsType: ext4
            readOnly: false
            user: admk8s-ceamg
            secretRef:
              name: ceph-secret-admk8s-ceamg
```



查看pod状态

```bash
root@k8s-master01:/yaml/ceph# kubectl apply -f case4-nginx-secret.yaml
root@k8s-master01:/yaml/ceph# kubectl get pod -o wide
NAME                                READY   STATUS    RESTARTS   AGE   IP           NODE         NOMINATED NODE   READINESS GATES
nginx-deployment-5d6854448d-mdxxh   1/1     Running   0          64s   10.244.1.6   k8s-node03   <none>           <none>
```



### 1.3.3 pod验证挂载

验证pod内挂载

```bash
kubectl exec -it nginx-deployment-5d6854448d-mdxxh bash

root@nginx-deployment-5d6854448d-mdxxh:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         118G   12G  100G  11% /
tmpfs            64M     0   64M   0% /dev
tmpfs           7.9G     0  7.9G   0% /sys/fs/cgroup
/dev/vda2       118G   12G  100G  11% /etc/hosts
shm              64M     0   64M   0% /dev/shm
/dev/rbd0       3.9G   76K  3.9G   1% /usr/share/nginx/html/rbd
tmpfs           7.9G   12K  7.9G   1% /run/secrets/kubernetes.io/serviceaccount
tmpfs           7.9G     0  7.9G   0% /proc/acpi
tmpfs           7.9G     0  7.9G   0% /proc/scsi
tmpfs           7.9G     0  7.9G   0% /sys/firmware

## 之前的文件还在
root@nginx-deployment-5d6854448d-mdxxh:/# ls /usr/share/nginx/html/rbd -l
total 20
drwxr-xr-x 3 root root  4096 Nov  7 02:54 etc
drwx------ 2 root root 16384 Nov  6 09:42 lost+found
```



### 1.3.4 宿主机验证挂载

```bash
root@k8s-node03:~# df -Th
Filesystem     Type      Size  Used Avail Use% Mounted on
udev           devtmpfs  7.8G     0  7.8G   0% /dev
tmpfs          tmpfs     1.6G  1.4M  1.6G   1% /run
/dev/vda2      ext4      118G   12G  100G  11% /
tmpfs          tmpfs     7.9G     0  7.9G   0% /dev/shm
tmpfs          tmpfs     5.0M     0  5.0M   0% /run/lock
tmpfs          tmpfs     7.9G     0  7.9G   0% /sys/fs/cgroup
tmpfs          tmpfs     1.6G     0  1.6G   0% /run/user/1000
tmpfs          tmpfs     7.9G   12K  7.9G   1% /var/lib/kubelet/pods/7cab4c31-8887-4540-a4c4-67a7831b4f55/volumes/kubernetes.io~secret/kube-proxy-token-wsx4q
overlay        overlay   118G   12G  100G  11% /var/lib/docker/overlay2/a7ab576226cd8a23813ae769b28a718f7b7038f6bf13e0edd1cd50d5795317d4/merged
shm            tmpfs      64M     0   64M   0% /var/lib/docker/containers/e03108b70f8916d269ec1c59394463f3015bf99baad17e453fa7392a7b6cacdb/mounts/shm
overlay        overlay   118G   12G  100G  11% /var/lib/docker/overlay2/4124657eda569b6417ad130a6f3a2322a0410927e63ab5c68236a3c5a82fa01a/merged
tmpfs          tmpfs     7.9G   12K  7.9G   1% /var/lib/kubelet/pods/a2a7e7aa-860a-43d7-98bc-7f6aa87eddaa/volumes/kubernetes.io~secret/flannel-token-fr9bd
overlay        overlay   118G   12G  100G  11% /var/lib/docker/overlay2/e5d3ce13ed5aa735e4b6af8c1b73fe9dfae21142e571d888cf3d57156cf410e4/merged
shm            tmpfs      64M     0   64M   0% /var/lib/docker/containers/4b537f79c2fc51ed5c7ae19e902707d43649d55bd003e87813d0ddaeae081381/mounts/shm
overlay        overlay   118G   12G  100G  11% /var/lib/docker/overlay2/2d608b763583275b88341a50cd92a65bdf4594297e3aa321a9d1b93ab5087bd5/merged
tmpfs          tmpfs     7.9G   12K  7.9G   1% /var/lib/kubelet/pods/083e57e6-f18c-4fb1-8a40-b9bbdaf06d77/volumes/kubernetes.io~secret/default-token-ldtxc
/dev/rbd0      ext4      3.9G   76K  3.9G   1% /var/lib/kubelet/plugins/kubernetes.io/rbd/mounts/k8s-xrbd-pool1-image-k8s-xrbd-img1
```



## 1.4 动态存储卷供给

### 1.4.1 创建普通用户和admin用户的secret

**admin用户用作创建镜像**

**普通用户用于挂载镜像,就还用刚才创建的k8s-rbd,之前已经创建就不再创建了**



```bash
## 拿到admin的key
# ceph auth print-key client.admin| base64
QVFEZ0ozUmtCS1JVSFJBQVlWbTRZemJqRVF2UnBwOE9SQjFhenc9PQ==
```



配置`case5-secret-admin.yaml`

```yaml
vim case5-secret-admin.yaml
---
apiVersion: v1
kind: Secret
metadata:
  name: ceph-secret-admin
type: "kubernetes.io/rbd"
data:
  key: QVFEZ0ozUmtCS1JVSFJBQVlWbTRZemJqRVF2UnBwOE9SQjFhenc9PQ==
```



创建admin-secret

```bash
kubectl apply -f case5-secret-admin.yaml 
secret/ceph-secret-admin created
```



验证admin-secret

```bash
root@k8s-master01:/yaml/ceph# kubectl get secret
NAME                       TYPE                                  DATA   AGE
ceph-secret-admin          kubernetes.io/rbd                     1      4s
ceph-secret-admk8s-ceamg   kubernetes.io/rbd                     1      4h18m
```



### 1.4.2 创建存储类

镜像自动创建

```yaml
#vim case6-ceph-storage-class.yaml 
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-storage-class-k8s-rbd
  annotations:
    storageclass.kubernetes.io/is-default-class: "false" #设置为默认存储类
provisioner: kubernetes.io/rbd
parameters:
  monitors: 10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789
  adminId: admin
  adminSecretName: ceph-secret-admin
  adminSecretNamespace: default 
  pool: k8s-xrbd-pool1
  userId: admk8s-ceamg
  userSecretName: ceph-secret-admk8s-ceamg
```



```yaml
## 创建存储类
kubectl apply -f case6-ceph-storage-class.yaml
storageclass.storage.k8s.io/ceph-storage-class-k8s-rbd created

## 查看存储类
root@k8s-master01:/yaml/ceph# kubectl get storageclasses.storage.k8s.io
NAME                         PROVISIONER         RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
ceph-storage-class-k8s-rbd   kubernetes.io/rbd   Delete          Immediate           false                  20s

kubectl describe storageclasses.storage.k8s.io ceph-storage-class-k8s-rbd
Name:            ceph-storage-class-k8s-rbd
IsDefaultClass:  No
Annotations:     kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"storage.k8s.io/v1","kind":"StorageClass","metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"},"name":"ceph-storage-class-k8s-rbd"},"parameters":{"adminId":"admin","adminSecretName":"ceph-secret-admin","adminSecretNamespace":"default","monitors":"10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789","pool":"k8s-xrbd-pool1","userId":"admk8s-ceamg","userSecretName":"ceph-secret-admk8s-ceamg"},"provisioner":"kubernetes.io/rbd"}
,storageclass.kubernetes.io/is-default-class=false
Provisioner:           kubernetes.io/rbd
Parameters:            adminId=admin,adminSecretName=ceph-secret-admin,adminSecretNamespace=default,monitors=10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789,pool=k8s-xrbd-pool1,userId=admk8s-ceamg,userSecretName=ceph-secret-admk8s-ceamg
AllowVolumeExpansion:  <unset>
MountOptions:          <none>
ReclaimPolicy:         Delete
VolumeBindingMode:     Immediate
Events:                <none>
```





### 1.4.3 创建基于存储类的pvc

创建pvc时先找存储类(ceph-storage-class-k8s-rbd),到monitors以ceph-secret-admin权限创建,使用的时候用普通用户权限进行挂载



```yaml
cat case7-mysql-pvc.yaml 
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ceph-storage-class-k8s-rbd
  resources:
    requests:
      storage: '5Gi'
```



```bash
kubectl apply -f case7-mysql-pvc.yaml 
persistentvolumeclaim/mysql-data-pvc created
```



**二进制方式部署的K8s集群使用宿主机内核挂载所以可以成功绑定**

```bash
root@k8s-made-01-32:/yaml/ceph# kubectl apply -f case7-mysql-pvc.yaml
persistentvolumeclaim/mysql-data-pvc created
root@k8s-made-01-32:/yaml/ceph#

root@k8s-made-01-32:~# kubectl get pvc
NAME             STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS                 AGE
mysql-data-pvc   Bound    pvc-bfd3fc72-417a-4989-9562-6b5268ec1f44   5Gi        RWO            ceph-storage-class-k8s-rbd   15s
```



此时在ceph节点可以看到,k8s-rbd-pool1下面有一个名字为`kubernetes-dynamic-pvc-f446af2d-f594-49e0-ba59-d32bb3552b97`的image,这个image对应的就是pvc

```bash
root@ceph-mon1[23:39:01]~ #:rbd --pool k8s-xrbd-pool1 ls
k8s-xrbd-img1
kubernetes-dynamic-pvc-f446af2d-f594-49e0-ba59-d32bb3552b97
```



```bash
root@ceph-mon1[23:43:47]~ #:rbd  --pool k8s-xrbd-pool1 --image kubernetes-dynamic-pvc-f446af2d-f594-49e0-ba59-d32bb3552b97 info
rbd image 'kubernetes-dynamic-pvc-f446af2d-f594-49e0-ba59-d32bb3552b97':
        size 5 GiB in 1280 objects
        order 22 (4 MiB objects)
        snapshot_count: 0
        id: 12d86f3c5f13
        block_name_prefix: rbd_data.12d86f3c5f13
        format: 2
        features:
        op_features:
        flags:
        create_timestamp: Wed Nov  8 23:28:50 2023
        access_timestamp: Wed Nov  8 23:28:50 2023
        modify_timestamp: Wed Nov  8 23:28:50 2023
```





#### 1.4.3.1  非二进制部署的K8S集群pvc为Pending状态    

**这里发现为Pending 状态**

```bash
Events:
  Type     Reason              Age                From                         Message
  ----     ------              ----               ----                         -------
  Warning  ProvisioningFailed  11s (x4 over 56s)  persistentvolume-controller  Failed to provision volume with StorageClass "ceph-storage-class-k8s-rbd": failed to create rbd image: executable file not found in $PATH, command output:
```

因为k8s上的kube-controller-manager资源是运行在容器里，它要调用物理机上的ceph操作需要另外在容器上部署一个`rbd-provisioner`才能操作成功,而如果K8S是二进制部署的则不需要该操作。



问题来自gcr.io提供的kube-controller-manager容器镜像未打包ceph-common组件，缺少了rbd命令，因此无法通过rbd命令为pod创建rbd image，查了github的相关文章，目前kubernetes官方在kubernetes-incubator/external-storage项目通过External Provisioners的方式来解决此类问题。



#### 1.4.3.2  k8s与ceph对接方式



1.使用第三方的rbd provisioner，但是由于官方已经不再进行维护因此随着版本越来越高，其对应的rbd provisioner内置的ceph-common版本已经跟不上ceph的版本了，现在其内置的ceph-common版本是m版，如果集群是m版可以考虑使用，**rbd provisioner 镜像内置的系统为CentOS 7 ，从Pacific 版本后已经不支持Centos7了。**

2.使用官方的ceph csi，一直在更新，推荐使用，由于我的ceph集群版本为Pacific 16.2.10 目前没有适配，带有匹配版本后继续进行测试。

3.使用二进制方式部署的K8S集群且宿主机各节点安装ceph-common,使用宿主机内核进行RBD挂载。






**原文链接**：

[超详细的k8s对接ceph RBD存储](https://blog.csdn.net/weixin_42340926/article/details/123931137)

[k8s学习笔记——ceph pv rbd动态挂载](https://blog.csdn.net/shell811127/article/details/119330926)





#### 1.4.3.3 **部署rbd-provisioner**

首先得在kubernetes集群中安装rbd-provisioner，

github仓库：https://github.com/kubernetes-incubator/external-storage



```bash
## 解压
tar -xf /tmp/rbd-provisioner.tar -C ./

cd /ceph/rbd/deploy
ls 
non-rbac  rbac  README.md

## 根据需要，修改rbd-provisioner的namespace
sed -r -i "s/namespace: [^ ]+/namespace: $NAMESPACE/g" ./rbac/clusterrolebinding.yaml ./rbac/rolebinding.yaml
kubectl -n $NAMESPACE apply -f ./rbac
```



```bash
root@k8s-master01:/yaml/ceph/ceph/rbd/deploy# cd ./rbac/
root@k8s-master01:/yaml/ceph/ceph/rbd/deploy/rbac# ls
clusterrolebinding.yaml  clusterrole.yaml  deployment.yaml  rolebinding.yaml  role.yaml  serviceaccount.yaml

## 安装rbd-provisioner yaml文件
root@k8s-master01:/yaml/ceph/ceph/rbd/deploy# kubectl -n $NAMESPACE apply -f ./rbac
clusterrole.rbac.authorization.k8s.io/rbd-provisioner created
clusterrolebinding.rbac.authorization.k8s.io/rbd-provisioner created
deployment.apps/rbd-provisioner created
role.rbac.authorization.k8s.io/rbd-provisioner created
rolebinding.rbac.authorization.k8s.io/rbd-provisioner created
serviceaccount/rbd-provisioner created
```



```bash
## 查看rbd-provisioner状态
root@k8s-master01:/yaml/ceph/ceph/rbd/deploy# kubectl get pod -n kube-system
NAME                                   READY   STATUS    RESTARTS   AGE
coredns-6d56c8448f-2twxm               1/1     Running   0          25d
coredns-6d56c8448f-n6wk9               1/1     Running   0          25d
etcd-k8s-master01                      1/1     Running   0          25d
kube-apiserver-k8s-master01            1/1     Running   0          25d
kube-controller-manager-k8s-master01   1/1     Running   2          25d
kube-proxy-5t6xk                       1/1     Running   0          25d
kube-proxy-bbrrv                       1/1     Running   0          25d
kube-proxy-sskm2                       1/1     Running   0          25d
kube-proxy-zzm95                       1/1     Running   0          25d
kube-scheduler-k8s-master01            1/1     Running   3          25d
rbd-provisioner-76f6bc6669-d4sj9       1/1     Running   0          101s
```



rbd-provisioner已经正常部署



**接上面1.4.2 小结重新创建存储类** 



注意：因为rbd-provisioner创建在命名空间kube-system 中，它无法访问其他命名空间的secret，所以需要把ceph管理员和普通用户的secret创建与rbd-provisioner相同的命名空间。 否则会出现如下错误：

```bash
Events:
  Type     Reason                Age               From                                                                                Message
  ----     ------                ----              ----                                                   -----
  Normal   Provisioning          14s               ceph.com/rbd_rbd-provisioner-76f6bc6669-d4sj9_da9e34c3-7d46-11ee-bdb5-5a5c3fb06299  External provisioner is provisioning volume for claim "default/mysql-data-pvc"
  Warning  ProvisioningFailed    14s               ceph.com/rbd_rbd-provisioner-76f6bc6669-d4sj9_da9e34c3-7d46-11ee-bdb5-5a5c3fb06299  failed to provision volume with StorageClass "ceph-storage-class-k8s-rbd": failed to get admin secret from ["default"/"ceph-secret-admin"]: secrets "ceph-secret-admin" is forbidden: User "system:serviceaccount:kube-system:rbd-provisioner" cannot get resource "secrets" in API group "" in the namespace "default"
  Normal   ExternalProvisioning  9s (x2 over 14s)  persistentvolume-controller                                                         waiting for a volume to be created, either by external provisioner "ceph.com/rbd" or manually created by system administrator
```



```bash
root@k8s-master01:/yaml/ceph/ceph/rbd/deploy# kubectl apply -n kube-system -f /yaml/ceph/case3-secret-client-admk8s-ceamg.yaml
secret/ceph-secret-admk8s-ceamg created

root@k8s-master01:/yaml/ceph/ceph/rbd/deploy# kubectl apply -n kube-system -f /yaml/ceph/case5-secret-admin.yaml
secret/ceph-secret-admin created
```





其他设置和普通的ceph rbd StorageClass一致，但provisioner需要设置为`ceph.com/rbd`，不是默认的`kubernetes.io/rbd`，这样rbd的请求将由rbd-provisioner来处理

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-storage-class-k8s-rbd
  annotations:
    storageclass.kubernetes.io/is-default-class: "false"
provisioner: ceph.com/rbd
parameters:
  monitors: 10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789
  adminId: admin
  adminSecretName: ceph-secret-admin
  adminSecretNamespace: default
  pool: k8s-xrbd-pool1
  userId: admk8s-ceamg
  userSecretName: ceph-secret-admk8s-ceamg
  fsType: ext4
  imageFormat: "2"
  imageFeatures: "layering"
```



```bash
## 创建SC
root@k8s-master01:/yaml/ceph/ceph/rbd/deploy# kubectl apply -f /yaml/ceph/case6-ceph-storage-class.yaml
storageclass.storage.k8s.io/ceph-storage-class-k8s-rbd created

## PROVISIONER 改为  ceph.com/rbd 
root@k8s-master01:/yaml/ceph/ceph/rbd/deploy# kubectl get sc
NAME                         PROVISIONER    RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
ceph-storage-class-k8s-rbd   ceph.com/rbd   Delete          Immediate           false                  3s
```



重新创建PVC

这个报错是说rbd-provisioner需要`ceph.conf`等配置信息，在网上找到临时解决办法是通过docker拷贝将本地/etc/ceph/里的文件拷贝到镜像里去。

```bash
Events:
  Type     Reason              Age   From                                                                                Message
  ----     ------              ----  ----                                                                                -------
  Normal   Provisioning        13s   ceph.com/rbd_rbd-provisioner-76f6bc6669-d4sj9_da9e34c3-7d46-11ee-bdb5-5a5c3fb06299  External provisioner is provisioning volume for claim "default/mysql-data-pvc"
  Warning  ProvisioningFailed  10s   ceph.com/rbd_rbd-provisioner-76f6bc6669-d4sj9_da9e34c3-7d46-11ee-bdb5-5a5c3fb06299  failed to provision volume with StorageClass "ceph-storage-class-k8s-rbd": failed to create rbd image: exit status 13, command output: did not load config file, using default settings.
2023-11-07 08:50:13.812 7fbdd2279900 -1 Errors while parsing config file!
2023-11-07 08:50:13.812 7fbdd2279900 -1 parse_file: cannot open /etc/ceph/ceph.conf: (2) No such file or directory
2023-11-07 08:50:13.812 7fbdd2279900 -1 parse_file: cannot open /root/.ceph/ceph.conf: (2) No such file or directory
2023-11-07 08:50:13.812 7fbdd2279900 -1 parse_file: cannot open ceph.conf: (2) No such file or directory
2023-11-07 08:50:13.812 7fbdd2279900 -1 Errors while parsing config file!
2023-11-07 08:50:13.812 7fbdd2279900 -1 parse_file: cannot open /etc/ceph/ceph.conf: (2) No such file or directory
2023-11-07 08:50:13.812 7fbdd2279900 -1 parse_file: cannot open /root/.ceph/ceph.conf: (2) No such file or directory
2023-11-07 08:50:13.812 7fbdd2279900 -1 parse_file: cannot open ceph.conf: (2) No such file or directory
2023-11-07 08:50:13.844 7fbdd2279900 -1 auth: unable to find a keyring on /etc/ceph/ceph.client.admin.keyring,/etc/ceph/ceph.keyring,/etc/ceph/keyring,/etc/ceph/keyring.bin,: (2) No such file or directory
2023-11-07 08:50:16.848 7fbdd2279900 -1 monclient: get_monmap_and_config failed to get config
2023-11-07 08:50:16.848 7fbdd2279900 -1 auth: unable to find a keyring on /etc/ceph/ceph.client.admin.keyring,/etc/ceph/ceph.keyring,/etc/ceph/keyring,/etc/ceph/keyring.bin,: (2) No such file or directory
rbd: couldn't connect to the cluster!
  Normal  ExternalProvisioning  9s (x3 over 13s)  persistentvolume-controller  waiting for a volume to be created, either by external provisioner "ceph.com/rbd" or manually created by system administrator
```



在`rbd-provisioner.yaml`文件了加载了hostpath将本地目录挂载到容器里，如下：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rbd-provisioner
spec:
  replicas: 1
  selector:
    matchLabels:
      app: rbd-provisioner
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: rbd-provisioner
    spec:
      containers:
      - name: rbd-provisioner
        image: "quay.io/external_storage/rbd-provisioner:latest"
        volumeMounts:
        - name: ceph-conf
          mountPath: /etc/ceph
        env:
        - name: PROVISIONER_NAME
          value: ceph.com/rbd
      serviceAccount: rbd-provisioner
      volumes:
      - name: ceph-conf
        hostPath:
          path: /etc/ceph
```



```bash
root@k8s-master01:/etc/ceph# kubectl delete -n kube-system -f /yaml/ceph/ceph/rbd/deploy/rbac/deployment.yaml
deployment.apps "rbd-provisioner" deleted
root@k8s-master01:/etc/ceph# kubectl apply -n kube-system -f /yaml/ceph/ceph/rbd/deploy/rbac/deployment.yaml
deployment.apps/rbd-provisioner created
```

```bash
root@k8s-master01:/etc/ceph# kubectl get pod -n kube-system
NAME                                   READY   STATUS    RESTARTS   AGE
coredns-6d56c8448f-2twxm               1/1     Running   0          25d
coredns-6d56c8448f-n6wk9               1/1     Running   0          25d
etcd-k8s-master01                      1/1     Running   0          25d
kube-apiserver-k8s-master01            1/1     Running   0          25d
kube-controller-manager-k8s-master01   1/1     Running   2          25d
kube-proxy-5t6xk                       1/1     Running   0          25d
kube-proxy-bbrrv                       1/1     Running   0          25d
kube-proxy-sskm2                       1/1     Running   0          25d
kube-proxy-zzm95                       1/1     Running   0          25d
kube-scheduler-k8s-master01            1/1     Running   3          25d
rbd-provisioner-54ccfd7f5c-kmpvw       1/1     Running   0          27s
```



这时发现没有报错了

但是还是处于pending状态

```bash
Events:
  Type    Reason                Age               From                                                                                Message
  ----    ------                ----              ----                                                                                -------
  Normal  Provisioning          53s               ceph.com/rbd_rbd-provisioner-54ccfd7f5c-kmpvw_13600cb8-7d4c-11ee-b1ca-a2b2060515f6  External provisioner is provisioning volume for claim "default/mysql-data-pvc"
  Normal  ExternalProvisioning  8s (x4 over 53s)  persistentvolume-controller                                                         waiting for a volume to be created, either by external provisioner "ceph.com/rbd" or manually created by system administrator
```



于是查了一下 Centos 7 最后支持的Ceph 版本是Octopus，我现在的集群版本是Pacific ，所以就算升级rbd-provisioner镜像内的Ceph-Common版本也无法对接我的Ceph集群。于是只能使用宿主机方式挂载，或者等官方更新。









### 1.4.4 基于动态存储卷运行mysql并验证

```bash
root@k8s-made-01-32:~# vim /yaml/ceph/case8-mysql-single.yaml
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  selector:
    matchLabels:
      app: mysql
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - image: mysql:5.6.46
        name: mysql
        env:
          # Use secret in real usage
        - name: MYSQL_ROOT_PASSWORD
          value: root123
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-data-pvc 
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: mysql-service-label 
  name: mysql-service
spec:
  type: NodePort
  ports:
  - name: http
    port: 3306
    protocol: TCP
    targetPort: 3306
    nodePort: 33306
  selector:
    app: mysql
```



```bash
root@k8s-made-01-32:~# kubectl apply -f /yaml/ceph/case8-mysql-single.yaml
deployment.apps/mysql created
service/mysql-service created
```



```bash
##查看pod状态
root@k8s-made-01-32:~# kubectl get pod
NAME                                 READY   STATUS    RESTARTS   AGE
mysql-6648cc9c79-48s6r               1/1     Running   0          103s
```



```bash
## 去容器中查看挂载情况
root@k8s-made-01-32:~# kubectl exec -it mysql-6648cc9c79-48s6r -- bash
root@mysql-6648cc9c79-48s6r:/#
root@mysql-6648cc9c79-48s6r:/#
root@mysql-6648cc9c79-48s6r:/# df -Th
Filesystem     Type     Size  Used Avail Use% Mounted on
overlay        overlay  810G   27G  742G   4% /
tmpfs          tmpfs     64M     0   64M   0% /dev
tmpfs          tmpfs    3.9G     0  3.9G   0% /sys/fs/cgroup
/dev/vda4      ext4     810G   27G  742G   4% /etc/hosts
shm            tmpfs     64M     0   64M   0% /dev/shm
/dev/rbd0      ext4     4.9G  116M  4.8G   3% /var/lib/mysql
tmpfs          tmpfs    7.5G   12K  7.5G   1% /run/secrets/kubernetes.io/serviceaccount
tmpfs          tmpfs    3.9G     0  3.9G   0% /proc/acpi
tmpfs          tmpfs    3.9G     0  3.9G   0% /proc/scsi
tmpfs          tmpfs    3.9G     0  3.9G   0% /sys/firmware
```



```bash
## 查看rbd image 信息
root@ceph-mon1[16:42:11]~ #:rbd --pool k8s-xrbd-pool1 --image kubernetes-dynamic-pvc-f446af2d-f594-49e0-ba59-d32bb3552b97 info
rbd image 'kubernetes-dynamic-pvc-f446af2d-f594-49e0-ba59-d32bb3552b97':
        size 5 GiB in 1280 objects
        order 22 (4 MiB objects)
        snapshot_count: 0
        id: 12d86f3c5f13
        block_name_prefix: rbd_data.12d86f3c5f13
        format: 2
        features:
        op_features:
        flags:
        create_timestamp: Wed Nov  8 23:28:50 2023
        access_timestamp: Wed Nov  8 23:28:50 2023
        modify_timestamp: Wed Nov  8 23:28:50 2023
```





```bash
## 查看ceph使用情况
root@ceph-mon1[16:43:40]~ #:ceph df
--- RAW STORAGE ---
CLASS     SIZE    AVAIL     USED  RAW USED  %RAW USED
hdd    1.8 TiB  1.2 TiB  562 GiB   562 GiB      31.23
TOTAL  1.8 TiB  1.2 TiB  562 GiB   562 GiB      31.23

--- POOLS ---
POOL                   ID  PGS   STORED  OBJECTS     USED  %USED  MAX AVAIL
device_health_metrics   1    1      0 B        0      0 B      0    321 GiB
xxrbd3                  3   64   10 MiB       17   31 MiB      0    321 GiB
xxrbd2                  4   64   12 MiB       16   37 MiB      0    321 GiB
cephfs-metadata         5   32  226 MiB      106  679 MiB   0.07    321 GiB
cephfs-data             6   64  183 GiB   47.35k  550 GiB  36.33    321 GiB
.rgw.root               7   32  1.3 KiB        4   48 KiB      0    321 GiB
default.rgw.log         8   32  3.6 KiB      209  408 KiB      0    321 GiB
default.rgw.control     9   32      0 B        8      0 B      0    321 GiB
default.rgw.meta       10   32      0 B        0      0 B      0    321 GiB
k8s-xrbd-pool1         13   32  188 MiB       80  565 MiB   0.06    321 GiB
```



## 1.5  Cephfs使用案例

使用Cephfs实现类似于nginx这样的服务多主机同时挂载。

之前的mysql如果使用主从结构,每个容器都需要自己单独的存储用来持久化数据,那么就比较适合使用rbd的存储.
这里我们要模拟一个deployment下多个副本共用一个存储,这样rbd就不是很适合了,这里我们使用cephfs方式挂载存储实现多pod间数据共享.



准备好cephfs,安装过程见：[Ceph FS](https://www.xinn.cc/posts/ceph/7.-ceph-fs%E4%BD%BF%E7%94%A8/)

```bash
root@ceph-mon1[10:03:49]~ #:ceph osd pool ls
device_health_metrics
xxrbd3
xxrbd2
#cephfs-metadata
#cephfs-data
.rgw.root
default.rgw.log
default.rgw.control
default.rgw.meta
k8s-xrbd-pool1
```

```bash
root@ceph-mon1[10:03:59]~ #:ceph fs ls
name: mycephfs, metadata pool: cephfs-metadata, data pools: [cephfs-data ]
```

```bash
root@ceph-mon1[10:07:54]~ #:ceph mds stat
mycephfs:1 {0=ceph-mon1=up:active}
```



创建CephFS客户端账户

```bash
#创建账户
$ ceph auth add client.xxfs mon 'allow r' mds 'allow rw' osd 'allow rwx pool=cephfs-data'

root@ceph-mon1[10:32:21]~ #:ceph auth add client.xxfs mon 'allow r' mds 'allow rw' osd 'allow rwx pool=cephfs-data'
added key for client.xxfs

#验证用户的keyring文件
root@ceph-mon1[10:32:23]~ #:ceph auth get client.xxfs
[client.xxfs]
        key = AQA2lk1lCpnQMhAA2KmjS7uNINgp/xCep/wcSA==
        caps mds = "allow rw"
        caps mon = "allow r"
        caps osd = "allow rwx pool=cephfs-data"
exported keyring for client.xxfs


#创建用keyring文件
[ceph@ceph-deploy ceph-cluster]$ceph auth get client.yanyan -o ceph.client.yanyan.keyring

#创建key文件:
$ ceph auth print-key client.xxfs | base64
QVFBMmxrMWxDcG5RTWhBQTJLbWpTN3VOSU5ncC94Q2VwL3djU0E9PQ==
```









### 1.5.1 创建CephFS客户端账户Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cephfs-secret
type: kubernetes.io/cephfs
data:
  key: QVFBMmxrMWxDcG5RTWhBQTJLbWpTN3VOSU5ncC94Q2VwL3djU0E9PQ==
```



```bash
root@k8s-made-01-32:~# kubectl apply -f /yaml/ceph/cephfs-secret.yaml
secret/cephfs-secret created
root@k8s-made-01-32:~# kubectl get secrets
NAME                          TYPE                             DATA   AGE
ceph-secret-admin             kubernetes.io/rbd                1      37h
ceph-secret-admk8s-ceamg      kubernetes.io/rbd                1      37h
cephfs-secret                 kubernetes.io/cephfs             1      8s
```





### 1.5.2 创建pod

```yaml
#case9-nginx-cephfs.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-cephfs
spec:
  replicas: 3
  selector:
    matchLabels: 
      app: nginx-cs-80
  template:
    metadata:
      labels:
        app: nginx-cs-80
    spec:
      containers:
      - name: nginx-cs-80
        image: nginx
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-cephfs 
          mountPath: /usr/share/nginx/html/cephfs
      volumes:
        - name: nginx-cephfs
          cephfs:
            monitors:
            - '10.1.0.39:6789'
            - '10.1.0.40:6789'
            - '10.1.0.41:6789'
            path: /
            user: xxfs
            secretRef:
              name: cephfs-secret

---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: nginx-cs-80-service-label
  name: nginx-cs-80-service
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 33380
  selector:
    app: nnginx-cs-80
```



```bash
root@k8s-made-01-32:/yaml/ceph# kubectl apply -f case9-nginx-cephfs.yaml
deployment.apps/nginx-cephfs created
service/nginx-cs-80-service created
```



```bash
## 验证pod状态
root@k8s-made-01-32:/yaml/ceph# kubectl get pod
NAME                                 READY   STATUS    RESTARTS   AGE
busybox                              1/1     Running   0          148d
cert-nginx-deploy-59449496d7-jpztj   1/1     Running   0          147d
mysql-6648cc9c79-48s6r               1/1     Running   0          19h
nginx-cephfs-767f7dc6d9-9ssh7        1/1     Running   0          32s
nginx-cephfs-767f7dc6d9-pmdpz        1/1     Running   0          32s
nginx-cephfs-767f7dc6d9-s4nl4        1/1     Running   0          32s
redis-79df5f8996-k2zx9               1/1     Running   0          127d
```





### 1.5.3 验证pod挂载

进入容器查看cephfs挂载情况

```bash
root@k8s-made-01-32:/yaml/ceph# kubectl exec -it nginx-cephfs-767f7dc6d9-9ssh7 bash
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.

## 这里可以看到cephfs已经被挂载到了/usr/share/nginx/html/cephfs目录
root@nginx-cephfs-767f7dc6d9-9ssh7:/# df -Th
Filesystem                                     Type     Size  Used Avail Use% Mounted on
overlay                                        overlay  810G   28G  741G   4% /
tmpfs                                          tmpfs     64M     0   64M   0% /dev
tmpfs                                          tmpfs    3.9G     0  3.9G   0% /sys/fs/cgroup
/dev/vda4                                      ext4     810G   28G  741G   4% /etc/hosts
shm                                            tmpfs     64M     0   64M   0% /dev/shm
10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789:/ ceph     505G  184G  322G  37% /usr/share/nginx/html/cephfs
tmpfs                                          tmpfs    7.5G   12K  7.5G   1% /run/secrets/kubernetes.io/serviceaccount
tmpfs                                          tmpfs    3.9G     0  3.9G   0% /proc/acpi
tmpfs                                          tmpfs    3.9G     0  3.9G   0% /proc/scsi
tmpfs                                          tmpfs    3.9G     0  3.9G   0% /sys/firmware
```



可以看到之前CephFS中存储的文件

```bash
root@nginx-cephfs-767f7dc6d9-pmdpz:/# cd /usr/share/nginx/html/cephfs/
root@nginx-cephfs-767f7dc6d9-pmdpz:/usr/share/nginx/html/cephfs# ls
alist  emby  fd  file3  jellyfin  softs
```







### 1.5.4 pod多副本挂载验证

```bash
kubectl exec -it nginx-cephfs-767f7dc6d9-pmdpz bash
cd /usr/share/nginx/html/cephfs
echo xxxxxxxxxxxfs > index.html
```



依次访问查看

![image-20231110111453319](https://cdn1.ryanxin.live/image-20231110111453319.png)

![image-20231110111555350](https://cdn1.ryanxin.live/image-20231110111555350.png)

![image-20231110111627656](https://cdn1.ryanxin.live/image-20231110111627656.png)



### 1.5.5 宿主机验证

```bash
root@k8s-made-01-32:/yaml/ceph# kubectl get pod -o wide
NAME                                 READY   STATUS    RESTARTS   AGE    IP              NODE        NOMINATED NODE   READINESS GATES
busybox                              1/1     Running   0          148d   10.48.35.130    10.1.0.34   <none>           <none>
cert-nginx-deploy-59449496d7-jpztj   1/1     Running   0          147d   10.48.245.18    10.1.0.35   <none>           <none>
mysql-6648cc9c79-48s6r               1/1     Running   0          19h    10.48.150.125   10.1.0.37   <none>           <none>
nginx-cephfs-767f7dc6d9-9ssh7        1/1     Running   0          109s   10.48.35.151    10.1.0.34   <none>           <none>
nginx-cephfs-767f7dc6d9-pmdpz        1/1     Running   0          109s   10.48.150.126   10.1.0.37   <none>           <none>
nginx-cephfs-767f7dc6d9-s4nl4        1/1     Running   0          109s   10.48.245.63    10.1.0.35   <none>           <none>
redis-79df5f8996-k2zx9               1/1     Running   0          127d   10.48.150.82    10.1.0.37   <none>           <none>
```







```bash
## 10.1.0.35
root@k8s-w-04-35:~# df -h
Filesystem                                                                                            Size  Used Avail Use% Mounted on
192.168.10.26:/nfs-server/k8s/jtcs-prod-log-pvc-3a655d84-a20e-4f18-8aa9-49006bbf78b3                  492G   48G  419G  11% 
10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789:/                                                        505G  184G  322G  37% 
```





```bash
## 10.1.0.34
kuroot@k8s-we-03-34:~# df -Th | grep nginx
192.168.10.26:/nfs-server/k8s/jtcs-prod-fe-nginx-data-pvc-2c82bbdc-ebee-4838-a7d7-67daa1a9d362       nfs4      492G   48G  419G  11% /var/lib/kubelet/pods/11336c8a-e02f-44b1-9349-e3044dcd3bfa/volumes/kubernetes.io~nfs/pvc-2c82bbdc-ebee-4838-a7d7-67daa1a9d362
192.168.10.26:/nfs-server/k8s/jtcs-prod-fe-nginx-log-pvc-5453fe13-0f1c-4c07-9fbd-b847d1caea8d        nfs4      492G   48G  419G  11% /var/lib/kubelet/pods/11336c8a-e02f-44b1-9349-e3044dcd3bfa/volumes/kubernetes.io~nfs/pvc-5453fe13-0f1c-4c07-9fbd-b847d1caea8d
10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789:/                                                       ceph      505G  184G  322G  37% /var/lib/kubelet/pods/68562d03-3927-42d6-8cdd-f4e52550921e/volumes/kubernetes.io~cephfs/nginx-cephfs
```





```bash
## 10.1.0.37
root@k8s-w-05-37:~#  df -Th | grep nginx
10.1.0.39:6789,10.1.0.40:6789,10.1.0.41:6789:/                                                            ceph      505G  184G  322G  37% /var/lib/kubelet/pods/4b438f25-c40e-40af-bb6c-75f895319170/volumes/kubernetes.io~cephfs/nginx-cephfs
```









