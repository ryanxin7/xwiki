---
author: Ryan
title: 網卡文件配置文件詳解
date: 2019-11-20
lastmod: 2019-11-20
tags: [Linux学习之旅]
---


# 网卡文件配置文件详解
##### 文件路径：
```
//etc/sysconfig/network-scripts/ifcfg-eth0  为网卡文件路径 
```




| 配置参数                                  | 参数详解                                           |
| ----------------------------------------- | -------------------------------------------------- |
| DEVICE=eth0                               | 网卡名字                                           |
| **HWADDR=00:0c:29:bc:1f:24**              | Hardware address 硬件地址                          |
| **TYPE=Ethernet**                         | 网络类型 因特网                                    |
| UUID=1c340c4c-e0ec-4672-81e7-a5f4110dd1f9 | UUID系统中唯一的标识                               |
| ONBOOT=yes                                | boot on 在重启时候是否开启网卡 自动运行            |
| NM_CONTROLLED=yes                         | 是否通过network软件进行管理                        |
| BOOTPROTO=none                            | 网卡获取IP地址的方式 static ip地址固 dhcp 自动获取 |
| IPADDR=10.0.0.200                         | IP地址                                             |
| NETMASK=255.255.255.0                     | 子网掩码                                           |
| GATEWAY=10.0.0.2                          | 网关 默认的出口                                    |
| USERCTL=no                                | 是否允许普通用户管理网卡  开 关 重启               |
| PEERDNS=yes                               | DNS 优先性                                         |
| IPV6INIT=no                               | IPv6                                               |
| DNS1=223.5.5.5                            | DNS地址                                            |
| DNS2=223.6.6.6                            | DNS地址                                            |