---
author: Ryan
title: Linux 系统的服务课程笔记
date: 2019-11-11
lastmod: 2019-11-11
tags: [Linux学习之旅]
---


# 基于 Linux 系统的服务课程笔记





​           互联网运维是一个融合多学科（网络、系统、开发、安全、应用架构、存储等）的综合性技术岗位，给运维工程师提供了一个很好的个人能力与技术的发展空间。运维工作的相关经验将会变得非常重要，而且也将成为个人的核心竞争力，优秀的运维工程师具备很好的各层面问题的解决能力及方案提供、全局思考的能力等。由于运维岗位所接触的知识面非常广阔，更容易培养或发挥出个人某些方面的特长或爱好，如内核、网络、开发、数据库等方面，可以做得非常深入精通、成为这方面的专家。







## Linux 运维工程师技术图谱



| 运维架构技术类型 |     主要技术关键词     |
| :--------------: | :------------------------------------------------------: |
|     脚本编程     |            **AWK、Sed、Grep、Shell、Python**             |
|     Web服务      |       Apache、**Nginx**、**Tomcat**、JBoss、Resin        |
|     数据传输     |               Rsync、Scp、Inodify/Sersync                |
|     性能分析     | top、free、df、iftop、iostat、vmstat、dstat、sar、sysdig |
|     进程管理     |                        Supervisor                        |
|     网络服务     |         vsftp、nfs、samba、bind、dhcp、postfifix         |
|      数据库      |          **MySQL**、MariaDB、PostgreSQL，Oracle          |
|      NoSQL       |                      Redis、MongoDB                      |
|    消息中间件    |                    RabbitMQ、ActiveMQ                    |
|     版本管理     |                       SVN、**Git**                       |
|     静态缓存     |                Squid、Varnish、**Nginx**                 |
|     负载均衡     |               **LVS**、HAProxy、**Nginx**                |
|    高可用软件    |   **Keepalived**、Heartbeat、DRBD、corosync+pacemaker    |
|   集中管理工具   |           **Ansible**、Saltstack、Chef、Puppet           |
|      虚拟化      |             KVM、Xen、Openstack、Cloudstack              |
|      容器化      |      **Docker**、**Kubernetes**、Rancher、Openshift      |
|     自动装机     |                    Kickstart、Cobbler                    |
|     抓包分析     |                    Tcpdump、Wireshark                    |
|     持续集成     |                   **Jenkins**、Gitlab                    |
|    MySQL代理     |                   Altas、Cobar、Mycat                    |
|     压力测试     |          ab、fifio、sysbench、mysqlslap、Jemter          |
|     日志收集     |                  **ELK Stack**、Graylog                  |
|     监控系统     |           Zabbix、**Prometheus**、Open-falcon            |
|  分布式文件系统  |               **Ceph**、GlusterFS、FastDFS               |





:::tip 课程知识指南

- **Linux** 初始基础阶段需要熟悉 Linux 操作系统安装，目录结构、文件权限、网卡文件等配置、系统启动流程等。

- **系统管理**  主要学习Linux系统，掌握常用的几十个基本管理命令，包括用户管理、磁盘分区、软件包管理、文件权限、文本处理、进程管理、性能分析工具等。

- **网络基础** OSI和TCP/IP模型一定要熟悉。基本的交换机、路由器概念及实现原理要知道。

- **Shell脚本编程基础** 掌握Shell基本语法结构，能编写简单的脚本即可。

- **网络服务**  常见的网络服务要会部署，比如vsftp、nfs、samba、bind、dhcp等。 代码版本管理系统少不了，可以学习下主流的GIT，能部署和简单使用就可以了。 经常在服务器之间传输数据，所以要会使用：rsync和scp。 数据同步：inotify/sersync。 重复性完成一些工作，可写成脚本定时去运行，所以得会配置Linux下的定时任务服务crond。 

- **Web服务** 每个公司基本都会有网站，能让网站跑起来，就需要搭建Web服务平台了。 如果是用PHP语言开发的，通常搭建LNMP网站平台，这是一个技术名词组合的拼写，分开讲就是得会部署Nginx、MySQL和PHP。 如果是JAVA语言开发的，通常使用Tomcat运行项目，为了提高访问速度，可以使用Nginx反向代理Tomcat，Nginx处理静态页面，Tomcat处理动态页面，实现动静分离。 不是会部署这么简单，还要知道HTTP协议工作原理、简单的性能调优。

- **负载均衡器** 单台服务器终究资源有限，抵抗高访问量肯定是无法支撑的，解决此问题最关键的技术就是采用负载均衡器，水平扩展多台Web服务器，同时对外提供服务，这样就成倍扩展性能了。负载均衡器主流开源技术有LVS、HAProxy和Nginx。一定要熟悉一两个！

- **数据库** 数据库选择MySQL，它是世界上使用最为广泛的开源数据库。学它准没错！ 也要会一些简单的SQL语句、用户管理、常用存储引擎、数据库备份与恢复。 想要深入点，必须会主从复制、性能优化、主流集群方案：MHA、MGR等。 NoSQL这么流行当然也少不了，学下Redis、MongoDB这两个就好了。

- **监控系统** 监控必不可少，是及时发现问题和追溯问题的救命稻草。可以选择学习主流的Zabbix、Prometheus开源监控系统，功能丰富，能满足企业级监控需求。监控点包括服务器硬件、服务器性能、API、业务、PV/UV、日志等方面。 也可以弄个仪表盘展示几个实时关键的数据，比如Grafana，会非常炫酷。

- **日志分析系统** 日志也很重要，定期的分析，可发现潜在隐患，提炼出有价值的东西。 主流日志系统：ELK Stack 学会部署使用，能分析日志并可视化，方便故障排查。

- **安全防范** 安全很重要，不要等到系统被攻击了，再做安全策略，此时已晚！所以，当一台服务器上线后应马上做安全访问控制策略，比如使用iptables限制只允许信任源IP访问，关闭一些无用的服务和端口等。 一些常见的攻击类型一定得知道啊，否则怎么对症下药呢！比如CC、DDOS、ARP等。

- **Shell脚本编程进阶** Shell脚本是Linux自动完成工作的利器，必须得熟练编写，所以得进一步学习函数、数组、信号、发邮件等。 文本处理三剑客（grep、sed、awk）得玩6啊，Linux下文本处理就指望它们了。

- **Python/Go 开发基础** Shell脚本只能完成一些基本的任务，想要完成更复杂些的任务，比如调用API、多进程等。就需要学高级语言了。Python是运维领域使用最多的语言，简单易用，学它准没错！此阶段掌握基础就可以了，例如基本语法结构、文件对象操作、函数、迭代对象、异常处理、发邮件、数据库编程等。

  :::







::: warning  版权声明

本站文章来源于互联网与个人学习笔记总结，仅用于技术分享交流使用。未经允许不得转载！

:::

