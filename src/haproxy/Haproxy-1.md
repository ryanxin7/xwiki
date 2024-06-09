---
id: haproxy-1
author: Ryan
title: HAProxy-安装及基础配置
date: 2024-06-07T12:33
---

<a name="45409794"></a>
## 三、HAProxy安装及基础配置

介绍HAProxy的基础安装及基础配置

<a name="b62d7d45"></a>
### 3.1 源码包安装

官方提供了Ubuntu和Debian的包，没有Centos的包<br />![](https://cdn1.ryanxin.live/1675997727329-efbe55ed-cb1e-4446-b7d2-40fd13d1031b.png#alt=)

---

![](https://cdn1.ryanxin.live/xxlog/1675997822880-a7a98a7a-9d66-4040-902e-4575f17bcaf5.png#alt=image.png)

<a name="0aa51ed0"></a>
#### ubuntu 安装

```yaml
apt-get install --no-install-recommends software-properties-common 
#--no-install-recommends 参数来避免安装非必须的文件，从而减小镜像的体积
add-apt-repository ppa:vbernat/haproxy-2.6
apt-get install haproxy=2.6.\*
```

```bash
#安装常用软件包
apt-get install --no-install-recommends software-properties-common -y
#--no-install-recommends 参数来避免安装非必须的文件，从而减小镜像的体积


#安装源
root@etcd01[11:10:22]~ #:add-apt-repository ppa:vbernat/haproxy-2.6
 HAProxy is a free, very fast and reliable solution offering high availability, load balancing, and proxying for TCP and HTTP-based applications. It is particularly suited for web sites crawling under very high loads while needing persistence or Layer7 processing. Supporting tens of thousands of connections is clearly realistic with todays hardware. Its mode of operation makes its integration into existing architectures very easy and riskless, while still offering the possibility not to expose fragile web servers to the Net.

This PPA contains packages for HAProxy 2.6.
 More info: https://launchpad.net/~vbernat/+archive/ubuntu/haproxy-2.6
Press [ENTER] to continue or Ctrl-c to cancel adding it.

Get:1 http://ppa.launchpad.net/vbernat/haproxy-2.6/ubuntu focal InRelease [23.8 kB]
Hit:2 http://cn.archive.ubuntu.com/ubuntu focal InRelease 
Hit:3 http://cn.archive.ubuntu.com/ubuntu focal-updates InRelease
Hit:4 http://cn.archive.ubuntu.com/ubuntu focal-backports InRelease
Hit:5 http://cn.archive.ubuntu.com/ubuntu focal-security InRelease         
Get:6 http://ppa.launchpad.net/vbernat/haproxy-2.6/ubuntu focal/main amd64 Packages [1,000 B]
Get:7 http://ppa.launchpad.net/vbernat/haproxy-2.6/ubuntu focal/main Translation-en [704 B]
Fetched 25.5 kB in 2s (14.0 kB/s)                     
Reading package lists... Done


#查看可用版本
root@etcd01[11:11:01]~ #:apt-cache madison haproxy
   haproxy | 2.6.8-1ppa1~focal | http://ppa.launchpad.net/vbernat/haproxy-2.6/ubuntu focal/main amd64 Packages
   haproxy | 2.0.29-0ubuntu1.1 | http://cn.archive.ubuntu.com/ubuntu focal-updates/main amd64 Packages
   haproxy | 2.0.29-0ubuntu1.1 | http://cn.archive.ubuntu.com/ubuntu focal-security/main amd64 Packages
   haproxy |   2.0.13-2 | http://cn.archive.ubuntu.com/ubuntu focal/main amd64 Packages

#安装2.6
apt-get install haproxy=2.6.\* -y


#验证haproxy版本
root@etcd01[13:50:48]~ #:haproxy -v
HAProxy version 2.6.8-1ppa1~focal 2023/01/24 - https://haproxy.org/
Status: long-term supported branch - will stop receiving fixes around Q2 2027.
Known bugs: http://www.haproxy.org/bugs/bugs-2.6.8.html
Running on: Linux 5.4.0-135-generic #152-Ubuntu SMP Wed Nov 23 20:19:22 UTC 2022 x86_64
```

<a name="f1c7cd61"></a>
#### Centos安装

在centos系统上通过yum、编译等多种安装方式。<br />**默认yum源**<br />默认的base仓库中包含haproxy的安装包文件，但是版本比较旧，是1.5.18的版本，距离当前版本已经有较长时间没有更新，由于版本比较旧所以有很多功能不支持，如果对功能和性能没有要求可以使用此版本，否则推荐使用新版本。

```bash
# yum install haproxy -y
#验证haproxy版本
# haproxy -v
HA-Proxy version 1.5.18 2016/05/10
Copyright 2000-2016 Willy Tarreau <willy@haproxy.org>
```

<a name="ce56c46c"></a>
### 3.2 编译安装HAProxy

编译安装HAProxy 2.0 LTS版本，源码包下载地址：[http://www.haproxy.org/download/](http://www.haproxy.org/download/)

<a name="5ffc492b"></a>
#### 3.2.1 解决lua环境

HAProxy支持基于lua实现功能扩展，lua是一种小巧的脚本语言，于1993年由巴西里约热内卢天主教大学（Pontiﬁcal Catholic University of Rio de Janeiro）里的一个研究小组开发，其设计目的是为了嵌入应用程序中，从而为应用程序提供灵活的扩展和定制功能。

Lua 官网：www.lua.org

```bash
Lua应用场景
游戏开发
独立应用脚本
Web应用脚本
扩展和数据库插件，如MySQL Proxy
安全系统，如入侵检测系统
```

---

**Centos 环境**：<br />由于centos自带的lua版本比较低并不符合HAProxy要求的lua最低版本(5.3)的要求，因此需要编译安装较新版本的lua环境，然后才能编译安装HAProxy，过程如下：

```bash
#当前系统版本
[root@centos7 ~]#lua -v 
Lua 5.1.4  Copyright (C) 1994-2008 Lua.org, PUC-Rio

#安装基础命令及编译依赖环境
[root@centos7 ~]# yum install gcc readline-devel
[root@centos7 ~]# wget http://www.lua.org/ftp/lua-5.3.5.tar.gz
[root@centos7 ~]# tar xvf  lua-5.3.5.tar.gz -C /usr/local/src
[root@centos7 ~]# cd /usr/local/src/lua-5.3.5
[root@centos7 lua-5.3.5]# make linux test


[root@localhost lua-5.3.5]# make linux test
cd src && make linux
make[1]: 进入目录“/usr/local/src/lua-5.3.5/src”
make all SYSCFLAGS="-DLUA_USE_LINUX" SYSLIBS="-Wl,-E -ldl -lreadline"
make[2]: 进入目录“/usr/local/src/lua-5.3.5/src”
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lapi.o lapi.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lcode.o lcode.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lctype.o lctype.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o ldebug.o ldebug.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o ldo.o ldo.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o ldump.o ldump.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lfunc.o lfunc.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lgc.o lgc.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o llex.o llex.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lmem.o lmem.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lobject.o lobject.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lopcodes.o lopcodes.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lparser.o lparser.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lstate.o lstate.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lstring.o lstring.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o ltable.o ltable.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o ltm.o ltm.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lundump.o lundump.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lvm.o lvm.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lzio.o lzio.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lauxlib.o lauxlib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lbaselib.o lbaselib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lbitlib.o lbitlib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lcorolib.o lcorolib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o ldblib.o ldblib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o liolib.o liolib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lmathlib.o lmathlib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o loslib.o loslib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lstrlib.o lstrlib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o ltablib.o ltablib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lutf8lib.o lutf8lib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o loadlib.o loadlib.c
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o linit.o linit.c
ar rcu liblua.a lapi.o lcode.o lctype.o ldebug.o ldo.o ldump.o lfunc.o lgc.o llex.o lmem.o lobject.o lopcodes.o lparser.o lstate.o lstring.o ltable.o ltm.o lundump.o lvm.o lzio.o lauxlib.o lbaselib.o lbitlib.o lcorolib.o ldblib.o liolib.o lmathlib.o loslib.o lstrlib.o ltablib.o lutf8lib.o loadlib.o linit.o 
ranlib liblua.a
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o lua.o lua.c
gcc -std=gnu99 -o lua   lua.o liblua.a -lm -Wl,-E -ldl -lreadline 
gcc -std=gnu99 -O2 -Wall -Wextra -DLUA_COMPAT_5_2 -DLUA_USE_LINUX    -c -o luac.o luac.c
gcc -std=gnu99 -o luac   luac.o liblua.a -lm -Wl,-E -ldl -lreadline 
make[2]: 离开目录“/usr/local/src/lua-5.3.5/src”
make[1]: 离开目录“/usr/local/src/lua-5.3.5/src”
src/lua -v
Lua 5.3.5  Copyright (C) 1994-2018 Lua.org, PUC-Rio


#查看编译安装的版本
[root@localhost lua-5.3.5]# ./src/lua -v 
Lua 5.3.5  Copyright (C) 1994-2018 Lua.org, PUC-Rio
```

---

**Ubuntu 基础环境**

```bash
#安装基础命令及编译依赖环境
$ apt  install gcc iproute2  ntpdate  tcpdump telnet traceroute nfs-kernel-server nfs-common  lrzsz tree  openssl libssl-dev libpcre3 libpcre3-dev zlib1g-dev  openssh-server  libreadline-dev libsystemd-dev

$ cd /usr/local/src
$ wget http://www.lua.org/ftp/lua-5.3.5.tar.gz
$ tar xvf  lua-5.3.5.tar.gz
$ cd lua-5.3.5
$ make linux test

$ pwd
/usr/local/src/lua-5.3.5
$ ./src/lua -v
Lua 5.3.5  Copyright (C) 1994-2018 Lua.org, PUC-Rio

#或安装系统自带的lua
$ apt install  lua5.3=5.3.3-1ubuntu0.18.04.1
$ lua5.3  -v
Lua 5.3.3  Copyright (C) 1994-2016 Lua.org, PUC-Rio
```

<a name="2ebe16a6"></a>
#### 3.2.2 开始编译安装

**Centos 环境**<br />**ubuntu 系统推荐使用包管理器安装**

```bash
#HAProxy  1.8及1.9版本编译参数：
make  ARCH=x86_64 TARGET=linux2628 USE_PCRE=1 USE_OPENSSL=1 USE_ZLIB=1 USE_SYSTEMD=1  USE_CPU_AFFINITY=1  PREFIX=/usr/local/haproxy 

#HAProxy 2.0以上版本编译参数：
[root@centos7 ~]$ yum -y install gcc openssl-devel pcre-devel systemd-devel
已安装:
  openssl-devel.x86_64 1:1.0.2k-25.el7_9                              systemd-devel.x86_64 0:219-78.el7_9.7                             

作为依赖被安装:
  keyutils-libs-devel.x86_64 0:1.5.8-3.el7       krb5-devel.x86_64 0:1.15.1-55.el7_9        libcom_err-devel.x86_64 0:1.42.9-19.el7      
  libkadm5.x86_64 0:1.15.1-55.el7_9              libselinux-devel.x86_64 0:2.5-15.el7       libsepol-devel.x86_64 0:2.5-10.el7           
  libverto-devel.x86_64 0:0.2.5-4.el7           

作为依赖被升级:
  e2fsprogs.x86_64 0:1.42.9-19.el7            e2fsprogs-libs.x86_64 0:1.42.9-19.el7         krb5-libs.x86_64 0:1.15.1-55.el7_9         
  libcom_err.x86_64 0:1.42.9-19.el7           libgudev1.x86_64 0:219-78.el7_9.7             libss.x86_64 0:1.42.9-19.el7               
  openssl.x86_64 1:1.0.2k-25.el7_9            openssl-libs.x86_64 1:1.0.2k-25.el7_9         systemd.x86_64 0:219-78.el7_9.7            
  systemd-libs.x86_64 0:219-78.el7_9.7        systemd-python.x86_64 0:219-78.el7_9.7        systemd-sysv.x86_64 0:219-78.el7_9.7 


------------------------------------------------------------------

[root@centos7 ~]$ tar xvf haproxy-2.6.8.tar.gz -C /usr/local/src/
[root@centos7 ~]$ cd /usr/local/src/haproxy-2.6.8/
[root@centos7 haproxy-2.6.8]$ cat README 

The HAProxy documentation has been split into a number of different files for
ease of use.

Please refer to the following files depending on what you're looking for :

  - INSTALL for instructions on how to build and install HAProxy
  - BRANCHES to understand the project's life cycle and what version to use
  - LICENSE for the project's license
  - CONTRIBUTING for the process to follow to submit contributions

The more detailed documentation is located into the doc/ directory :

  - doc/intro.txt for a quick introduction on HAProxy
  - doc/configuration.txt for the configuration's reference manual
  - doc/lua.txt for the Lua's reference manual
  - doc/SPOE.txt for how to use the SPOE engine
  - doc/network-namespaces.txt for how to use network namespaces under Linux
  - doc/management.txt for the management guide
  - doc/regression-testing.txt for how to use the regression testing suite
  - doc/peers.txt for the peers protocol reference
  - doc/coding-style.txt for how to adopt HAProxy's coding style
  - doc/internals for developer-specific documentation (not all up to date)

----------------------------------------------------------------------------

[root@centos7 haproxy-2.6.8]$ cat INSTALL




#参考INSTALL文件进行编译安装
$ make  ARCH=x86_64 TARGET=linux-glibc  USE_PCRE=1 USE_OPENSSL=1 USE_ZLIB=1  USE_SYSTEMD=1 USE_CPU_AFFINITY=1 USE_LUA=1 LUA_INC=/usr/local/src/lua-5.3.5/src/  LUA_LIB=/usr/local/src/lua-5.3.5/src/ PREFIX=/usr/local/haproxy
  CC      src/ev_poll.o
  CC      src/ev_epoll.o
  CC      src/cpuset.o
  CC      src/ssl_sample.o
  CC      src/ssl_sock.o
  CC      src/ssl_crtlist.o
  CC      src/ssl_ckch.o
  CC      src/ssl_utils.o
  CC      src/cfgparse-ssl.o
  CC      src/jwt.o
  CC      src/hlua.o
  CC      src/hlua_fcn.o
  CC      src/namespace.o
  CC      src/mux_h2.o
  CC      src/mux_fcgi.o
  CC      src/mux_h1.o
  CC      src/tcpcheck.o
  CC      src/stream.o
  CC      src/stats.o
  CC      src/http_ana.o
  CC      src/server.o
  CC      src/stick_table.o
  CC      src/sample.o
  CC      src/flt_spoe.o
  CC      src/tools.o
  CC      src/log.o
  CC      src/cfgparse.o
  CC      src/peers.o
  CC      src/backend.o
  CC      src/resolvers.o
  CC      src/cli.o
  CC      src/connection.o
  CC      src/proxy.o
  CC      src/http_htx.o
  CC      src/cfgparse-listen.o
  CC      src/pattern.o
  CC      src/check.o
  CC      src/haproxy.o
  CC      src/cache.o
  CC      src/stconn.o
  CC      src/http_act.o
  CC      src/http_fetch.o
  CC      src/http_client.o
  CC      src/listener.o
  CC      src/dns.o
  CC      src/vars.o
  CC      src/debug.o
  CC      src/tcp_rules.o
  CC      src/sink.o
  CC      src/h1_htx.o
  CC      src/task.o
  CC      src/mjson.o
  CC      src/h2.o
  CC      src/filters.o
  CC      src/server_state.o
  CC      src/payload.o
  CC      src/fcgi-app.o
  CC      src/map.o
  CC      src/htx.o
  CC      src/h1.o
  CC      src/pool.o
  CC      src/cfgparse-global.o
  CC      src/trace.o
  CC      src/tcp_sample.o
  CC      src/flt_http_comp.o
  CC      src/mux_pt.o
  CC      src/flt_trace.o
  CC      src/mqtt.o
  CC      src/acl.o
  CC      src/sock.o
  CC      src/mworker.o
  CC      src/tcp_act.o
  CC      src/ring.o
  CC      src/session.o
  CC      src/proto_tcp.o
  CC      src/fd.o
  CC      src/channel.o
  CC      src/activity.o
  CC      src/queue.o
  CC      src/lb_fas.o
  CC      src/http_rules.o
  CC      src/extcheck.o
  CC      src/thread.o
  CC      src/http.o
  CC      src/lb_chash.o
  CC      src/applet.o
  CC      src/compression.o
  CC      src/raw_sock.o
  CC      src/ncbuf.o
  CC      src/frontend.o
  CC      src/errors.o
  CC      src/uri_normalizer.o
  CC      src/http_conv.o
  CC      src/lb_fwrr.o
  CC      src/sha1.o
  CC      src/proto_sockpair.o
  CC      src/mailers.o
  CC      src/lb_fwlc.o
  CC      src/ebmbtree.o
  CC      src/cfgcond.o
  CC      src/action.o
  CC      src/xprt_handshake.o
  CC      src/protocol.o
  CC      src/proto_uxst.o
  CC      src/proto_udp.o
  CC      src/lb_map.o
  CC      src/fix.o
  CC      src/ev_select.o
  CC      src/arg.o
  CC      src/sock_inet.o
  CC      src/mworker-prog.o
  CC      src/hpack-dec.o
  CC      src/cfgparse-tcp.o
  CC      src/sock_unix.o
  CC      src/shctx.o
  CC      src/proto_uxdg.o
  CC      src/fcgi.o
  CC      src/eb64tree.o
  CC      src/clock.o
  CC      src/chunk.o
  CC      src/cfgdiag.o
  CC      src/signal.o
  CC      src/regex.o
  CC      src/lru.o
  CC      src/eb32tree.o
  CC      src/eb32sctree.o
  CC      src/cfgparse-unix.o
  CC      src/hpack-tbl.o
  CC      src/ebsttree.o
  CC      src/ebimtree.o
  CC      src/base64.o
  CC      src/auth.o
  CC      src/uri_auth.o
  CC      src/time.o
  CC      src/ebistree.o
  CC      src/dynbuf.o
  CC      src/wdt.o
  CC      src/pipe.o
  CC      src/init.o
  CC      src/http_acl.o
  CC      src/hpack-huff.o
  CC      src/hpack-enc.o
  CC      src/dict.o
  CC      src/freq_ctr.o
  CC      src/ebtree.o
  CC      src/hash.o
  CC      src/dgram.o
  CC      src/version.o
  LD      haproxy
  CC      dev/flags/flags.o
  LD      dev/flags/flags

$ make install PREFIX=/usr/local/haproxy
$ ln -s /usr/local/haproxy/sbin/haproxy /usr/sbin/


#验证版本

[root@localhost haproxy]# haproxy -v
HAProxy version 2.6.8-ab6ee7f 2023/01/24 - https://haproxy.org/
Status: long-term supported branch - will stop receiving fixes around Q2 2027.
Known bugs: http://www.haproxy.org/bugs/bugs-2.6.8.html
Running on: Linux 3.10.0-1127.8.2.el7.x86_64 #1 SMP Tue May 12 16:57:42 UTC 2020 x86_64
```

<a name="3d87368c"></a>
#### 3.2.3 HAProxy启动脚本

```bash
vim   /usr/lib/systemd/system/haproxy.service
[Unit]
Description=HAProxy Load Balancer
After=syslog.target network.target

[Service]
ExecStartPre=/usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg  -c -q
ExecStart=/usr/sbin/haproxy -Ws -f /etc/haproxy/haproxy.cfg -p /var/lib/haproxy/haproxy.pid
ExecReload=/bin/kill -USR2 $MAINPID

[Install]
WantedBy=multi-user.target
```

<a name="ca1a39af"></a>
#### 3.2.4 创建配置文件

```bash
mkdir  /etc/haproxy
vim /etc/haproxy/haproxy.cfg

global
    maxconn 100000
    chroot /apps/haproxy
    stats socket /var/lib/haproxy/haproxy.sock mode 600 level admin
    #uid 99
    #gid 99
    user  haproxy
    group haproxy
    daemon
    #nbproc 4
    #cpu-map 1 0
    #cpu-map 2 1
    #cpu-map 3 2
    #cpu-map 4 3
    pidfile /var/lib/haproxy/haproxy.pid
    log 127.0.0.1 local2 info

defaults
    option http-keep-alive
    option  forwardfor
    maxconn 100000
    mode http
    timeout connect 300000ms
    timeout client  300000ms
    timeout server  300000ms

listen stats
    mode http
    bind 0.0.0.0:9999
    stats enable
    log global
    stats uri     /haproxy-status
    stats auth    haadmin:123456

listen  web_port
    bind 10.1.0.6:30013
    mode http
    option forwardfor
    log global
    server web1  10.1.0.31:30013  check inter 3000 fall 2 rise 5
```

<a name="8da5a3ae"></a>
#### 3.2.5  启动haproxy

```bash
mkdir  /var/lib/haproxy
chown  -R 99.99 /var/lib/haproxy/ 

useradd -r -s /sbin/nologin -d /var/lib/haproxy haproxy
systemctl daemon-reload

systemctl start haproxy
systemctl enable haproxy
systemctl status haproxy
```

<a name="b02a49a0"></a>
### 3.3 验证haproxy状态

<a name="309825cc"></a>
#### 3.3.1 验证监听端口

```bash
[root@localhost haproxy]# ss -tnl
State       Recv-Q Send-Q          Local Address:Port      Peer Address:Port              
LISTEN      0      128                 127.0.0.1:631                  *:*                  
LISTEN      0      100                         *:8088                 *:*                  
LISTEN      0      3                   127.0.0.1:31769                *:*                  
LISTEN      0      100                 127.0.0.1:25                   *:*                  
LISTEN      0      128                         *:1883                 *:*                  
LISTEN      0      128                         *:30013                *:*                  
LISTEN      0      50                          *:8161                 *:*                  
LISTEN      0      1                   127.0.0.1:8005                 *:*                  
LISTEN      0      128                         *:5672                 *:*                  
LISTEN      0      50                          *:43178                *:*                  
LISTEN      0      128                         *:6379                 *:*                  
LISTEN      0      128                         *:61613                *:*                  
LISTEN      0      50                          *:61614                *:*                  
LISTEN      0      128                         *:9999                 *:*
```

<a name="af73fc56"></a>
#### 3.3.2 查看haproxy的状态页面

浏览器访问：[http://haproxy-server:9999/haproxy-status](http://www.yunweipai.com/go?_=84a56fb1feaHR0cDovL2hhcHJveHktc2VydmVyOjk5OTkvaGFwcm94eS1zdGF0dXM%3D)<br />![](https://cdn1.ryanxin.live/1676021477593-8a91dd15-dde3-4cc1-a009-f117f39f08f9.png#alt=)

<a name="fa61ee46"></a>
#### 3.3.3 测试转发

10.1.0.6:30013 转发到 10.1.0.31:30013 ✅

![](https://cdn1.ryanxin.live/1676254179452-d15ddfd6-e6e2-4d2c-8d3a-691d48309fcf.png#alt=)
