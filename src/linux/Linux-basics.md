---
author: Ryan
title: Linux的目录结构特点
date: 2019-11-21
lastmod: 2019-11-21
tags: [Linux学习之旅]
---

# Linux的目录结构特点



## 目录结构特点



- 一切从根root 开始

- Linux中每个设备可以挂在任何目录上面
- Linux下面设备没有挂载无法使用
- linux中一切皆文件



## 什么是挂载？

把苹果挂载到树上 `mount`
给磁盘分区 开了一个入口 进入到光盘中 入口=挂载点=目录

**举例：在 linux 系统下面使用光盘**



1. 把光盘放入光驱中

2. 查看光盘 `ll  /dev/cdrom`
3. 使用光盘  `cat` 乱码
4. 把光盘挂载  `mount /dev/cdrom /mnt/  read-only`  只读 `df-h` 查看系统空间谁挂载路径
5. 进入目录使用
6. `cd /mnt` 实际上进入了光盘 可以看到光盘内容 



如果硬盘设备不挂载是没有访问入口的,就像房子没有大门，挂载就像给设备找了一个入口。



`mount /dev/cdrom /mnt`  


设备                   **挂载点(mount point)**


Linux下面设备(磁盘)不挂载是看不到入口的，没有窗户门的屋子，如果要设备被访问就必须有一个入口，这个入口就是挂载点挂载点实质就是目录。




## Linux 目录结构详解


| 目录名称     | 目录介绍                                                     |
| ------------ | ------------------------------------------------------------ |
| /etc         | 配置文件                                                     |
| /home        | 用户的家目录，每一个用户的家目录通常默认为/home/USERNAME     |
| /root        | 管理员的家目录                                               |
| /lib         | 库文件 静态库：单在程序中的库，其他程序不能使用该库文件动态库：在内存中，任何用到该库的程序都可以使用 |
| /lib/modules | 内核模块文件                                                 |
| /media       | 挂载点目录，移动设备。在windows中，插入一张光盘，系统会自动读取光盘，用户可以直接执行，但在linux中，插入光盘后需要在挂载点挂载这个设备之后才可以使用这个设备 |
| /mnt         | 挂载点目录，额外的临时文件系统                               |
| /opt         | 可选目录，第三方程序的安装目录                               |
| /proc        | 伪文件系统，内核映射文件                                     |
| /sys         | 伪文件系统，跟硬件设备相关的属性映射文件                     |
| /tmp         | 临时文件                                                     |
| /var         | 可变化的文件，经常发生变化的文件                             |
| /bin         | 可执行文件，用户命令；其中用到的库文件可能在/lib，配置文件可能在/etc |
| /sbin        | 可执行文件，管理命令；其中用到的库文件可能在/lib，配置文件可能在/etc |
| /usr         | 只读文件，shared read-only                                   |
| /usr/local   | 第三方软件                                                   |
| /boot        | 系统启动相关的文件，如内核、initrd，以及grub（BootLoader）   |


​	



[详细原文](http://www.cnblogs.com/forlive/p/8081515.html)