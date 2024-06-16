---
author: Ryan
title: 2.zookeeper 集群部署
date: 2021-10-06
tags: [Zookeeper]
categories: Zookeeper
---


# 集群部署

Zookeeper为了更好的实现生产的业务场景，一般都会采用分布式的集群架构。集群通常由2n+1台Server节点组成，每个Server都知道彼此的存在。每个server都维护的内存状态镜像以及持久化存储的事务日志和快照。



对于2n+1台server，只要有>=(n+1)台server节点可用，整个Zookeeper系统保持可用。

为了维护集群内部所有主机信息的一致性，他们自己参考Paxos协议自己设计了一个更加轻量级的协议:Zab(Zookeeper Atomic Broadcast)来解决集群数据一致性的问题。


这个协议主要包括两部分：领导选举、日常通信，这两步就组成了Zookeeper的集群流程。





![1111](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211228124522223.png)




![222](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211228125341175.png)



## 集群流程

集群流程主要包括两阶段组成：Leader选举和日常操作。

Leader选举阶段：
Leader选举主要有两种场景：集群启动、Leader恢复。

集群启动：当Zookeeper集群启动时候，将会选择一台server节点为为Leader，其它的server节点
就作为follower(暂不考虑observer)，接着就进入日常操作阶段。



Leader恢复：当集群Leader主机服务重启或者崩溃后，当Zookeeper集群中所有Server主机基于
Zab协议选举新的Leader者，接着就进入日常操作阶段。然后其他Server主机和新的Leader主机进行数据
信息同步，当状态同步完成以后，
日常操作阶段：
日常操作阶段主要有两种场景：主机间心跳监测和数据操作。


主机间心跳监测：
当Leader选举完毕后，就进入日常操作阶段，第一步就是所有集群节点都互相保持通信，
然后Leader和Follower节点间进行数据同步，确保所有主机节点都是相同的状态，
当所有Follower节点和新的Leader主机完成数据信息同步以后，就开始进行日常的数据操作。


数据操作：
follower来接收client的请求，对于不改变系统一致性状态的读操作，
由follower的本地内存数据库直接给client返回结果；对于会改变Zookeeper系统状态的更新
操作，
则转交由Leader进行提议处理，处理完毕后，将成功的结果给client。





## 通信机制

对于Zookeeper集群来说，我们要考虑的内容主要有三大块：客户端连接、主机通信、选举Leader。


客户端连接： 客户端连接服务端功能，进行相关请求操作
主机通信： 集群各服务节点进行信息交流的功能
选举Leader： 集群中各服务节点共同选举主节点的功能

**格式**：


```
server.<myid>=<server_ip>:<LF_Port>:<L_Port>
```


为了同时满足这三者的要求，Zookeeper分别将这三种功能以三个常见端口对外提供服务：

- 客户端操作： 2181

- 主机通信： 2182
- 选举Leader： 2183




注意：
这三端口都是自定义的，在生产中，因为每台主机都有独立的ip，所以三个端口一般都设置一样。






## 集群部署

Zookeeper集群使用多个独立的主机，每个主机上都部署同样环境的Zookeeper环境，基于内部的Zab协议达到数据的一致性，然后统一对外提供服务。客户端连接任意一节点，效果都一样。



|   节点   |   主机IP   |   通信端口   | 心跳端口 | 选举端口 | 软件存放目录 | `myid` |
| :--: | ---- | ---- | ---- | ---- | ---- | ---: |
| zk1 | 192.168.10.126 | 2181 | 2182 | 2183 | `/data/server/zk1/{data,logs}` | 1 |
| zk2 | 192.168.10.127 | 2181 | 2182     | 2183 | `/data/server/zk2/{data,logs}` | 2 |
| zk3 | 192.168.10.128 | 2181 | 2182     | 2183 | `/data/server/zk3/{data,logs}` | 3 |



### 软件安装

分别在三个不同的Zookeeper目录中执行软件安装
安装三个节点

```sh
tar xf /data/softs/apache-zookeeper-3.7.0.tar.gz -C /data/server/
mv /data/server/apache-zookeeper-3.7.0 /data/server/zk1
mkdir /data/softs/zk/{data,log} -p
```

注意：
三个节点执行同样的操作，唯一的区别是数字不一致，分别是1-2-3



### 配置管理

```sh
准备配置文件
cd /data/server/
mv zk1/conf/zoo_sample.cfg zk1/conf/zoo.cfg

修改配置文件
# grep -ni '^[a-Z]' zk1/conf/zoo.cfg
2:tickTime=2000
5:initLimit=10
8:syncLimit=5
12:dataDir=/data/server/zk1/data
13:dataLogDir=/data/server/zk1/log
15:clientPort=2181
30:server.1=192.168.10.126:2182:2183
31:server.2=192.168.10.127:2282:2283
32:server.3=192.168.10.128:2382:2383

设置myid文件
echo 1 > zk1/data/myid

注意：
三个节点执行同样的操作，唯一的区别是绿色背景的字体不一致，分别是1-2-3
```



### 启动服务

以上三个节点内容都配置完毕后，我们就可以启动集群了。

```
与单机模式的启动方法一致，只需一次启动所有Zookeeper节点即可启动整个集群。我们还可以一个一
个的手工启动，当然了我们还可以使用脚本方式一次启动所有Zookeeper主机服务。
启动服务
/data/server/zk1/bin/zkServer.sh start
/data/server/zk2/bin/zkServer.sh start
/data/server/zk3/bin/zkServer.sh start
```

#### 服务启动停止脚本 

```
#!/bin/bash 
case $1 in 
"start"){ 
   for i in zk1 zk2 zk3
   do 
      echo ---------- zookeeper $i 启动 ------------
      ssh   $i   "/opt/module/zookeeper-3.5.7/bin/zkServer.sh start" 
   done 
 };; 
 "stop"){ 
   for i in zk1 zk2 zk3
   do 
      echo ---------- zookeeper $i 停止 ------------
      ssh   $i   "/opt/module/zookeeper-3.5.7/bin/zkServer.sh stop" 
   done 
 };; 
 "status"){ 
    for i in zk1 zk2 zk3
    do 
       echo ---------- zookeeper $i 状态 ------------
       ssh  $i   "/opt/module/zookeeper-3.5.7/bin/zkServer.sh status" 
    done 
  };; 
  esac 
  
  #增加脚本执行权限
  $ chmod u+x zk.sh
  #执行 Zookeeper 集群启动脚本
  $ zk.sh start
  Zookeeper 集群停止脚本
  $ zk.sh stop
```



### 服务检查

检查集群服务一般有两类方法：检查端口和检查集群服务状态

```
检查端口
netstat -tnulp | grep 218


查看集群服务状态
[root@controller ~]# /data/server/zk1/bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /data/server/zk1/bin/../conf/zoo.cfg
Mode: follower

[root@controller ~]# /data/server/zk2/bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /data/server/zk2/bin/../conf/zoo.cfg
Mode: leader


[root@controller ~]# /data/server/zk3/bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /data/server/zk3/bin/../conf/zoo.cfg
Mode: follower

结果显示：
查看集群状态，关键就是看Mode:的值，我们可以看到，目前Zookeeper三节点集群中，处于leader的
是zk2节点，其他两个节点是follower角色。
同时连接多个server的方法
bin/zkCli -server <zk1_ip>:<zk1_port>,<zk2_ip>:<zk2_port>,<zk3_ip>:<zk3_port>

注意：
同时连接多个server节点的时候，彼此间使用逗号隔开
使用任意一个zkCli.sh连接三个Zookeeper节点
cd /data/server/zk2/bin/
./zkCli.sh -server 192.168.10.126:2181,192.168.10.127:2281,192.168.10.128:2381
```



### 专用检测

因为使用telnet方法来检查集群的节点状态信息比较繁琐，而且经常中断，所以生产中我们一般使用nc软件
来检查Zookeeper集群状态.



nc全称NetCat，在网络工具中有“瑞士军刀”美誉，支持Windows和Linux。因为它短小精悍(不过25k)、功
能实用，被设计为一个简单、可靠的网络工具，可通过TCP或UDP协议传输读写数据。同时，它还是一个网络应用Debug分析器，因为它可以根据需要创建各种不同类型的网络连接。

```
安装软件
apt-get -y install netcat-traditional
使用方式
echo "命令" | nc <server_ip> <server_port>
检查集群状态
echo stat | nc 192.168.10.126 2181
echo stat | nc 192.168.10.127 2281
echo stat | nc 192.168.10.128 2381
```



## 集群操作命令

### 常见命令

| 命令 | 内容                                                    |
| ---- | ------------------------------------------------------- |
| conf | 输出相关服务配置的详细信息                              |
| cons | 列出所有连接到服务器的客户端的完全的连接/会话的详细信息 |
| envi | 输出关于服务环境的详细信息                              |
| dump | 列出未经处理的会话和临时节点                            |
| stat | 查看哪个节点被选择作为 Follower 或者 Leader             |
| ruok | 测试是否启动了该 Server，若回复 imok 表示已经启动       |
| mntr | 输出一些运行时信息                                      |
| reqs | 列出未经处理的请求                                      |
| wchs | 列出服务器 watch 的简要信息                             |
| wchc | 通过 session 列出服务器 watch 的详细信息                |
| wchp | 通过路径列出服务器 watch 的详细信息                     |
| srvr | 输出服务的所有信息                                      |
| srst | 重置服务器统计信息                                      |
| kill | 关掉 Server                                             |
| isro | 查看该服务的节点权限信息                                |





ZooKeeper 支持某些特定的四字命令字母与其的交互。它们大多是查询命令，用来获取 ZooKeeper
服务的当前状态及相关信息。用户在客户端可以通过 telnet 或 nc 向 ZooKeeper 提交相应的命令。
默认情况下，这些4字命令有可能会被拒绝，发送如下报错
`xxx is not executed because it is not in the whitelist.`
解决办法：向 zoo.cfg 文件中添加如下配置
`4lw.commands.whitelist=*`





### 命令实践

```
查看节点服务状态
echo stat | nc 127.0.0.1 2281

查看节点服务配置
echo conf | nc 127.0.0.1 2281

查看节点服务环境
echo envi | nc 127.0.0.1 2281

查看节点服务会话
echo cons | nc 127.0.0.1 2281
echo dump | nc 127.0.0.1 2281
```



#### 基本安全

```
在这么多的服务状态查看命令中有很多存在隐患的命令，所以为了避免生产中因为这些命令的安全隐患，所以
我们要对这些命令进行一些安全限制，只需要编辑服务的zoo.cfg文件即可

# vim /data/server/zk1/conf/zoo.cfg
4lw.commands.whitelist=stat, ruok, conf, isro

重启服务后
/data/server/zk1/bin/zkServer.sh restart
查看允许通过的命令效果
echo isro | nc 127.0.0.1 2181
echo conf | nc 127.0.0.1 2181
echo stat | nc 127.0.0.1 2181

检查不允许通过的命令
[root@controller bin]# echo dump | nc 127.0.0.1 2181
dump is not executed because it is not in the whitelist.

测试没有设置命令过滤的节点
[root@controller bin]# echo dump | nc 127.0.0.1 2281
SessionTracker dump:
Session Sets (0):
ephemeral nodes dump:
Sessions with Ephemerals (0):
所以生产中，我们一定要把不知道或者不想用的命令全部过滤掉，这样才能保证基本的安全。
```





## 集群管理

#### 状态监控

在Zookeeper服务端的操作中，有一个命令非常有用就是mntr，可以查看节点服务的所有运行时信息，这些
信息就是我们平常要监控到的内容。

```sh
命令效果
# echo mntr | nc 127.0.0.1 2281
zk_version 3.7.0-39d3a4f269333c922ed3db283be479f9deacaa0f, built on 03/23/2021
10:13 GMT
zk_avg_latency 0
zk_max_latency 0
zk_min_latency 0
zk_packets_received 8
zk_packets_sent 7
zk_num_alive_connections 1
zk_outstanding_requests 0
zk_server_state leader
zk_znode_count 4
zk_watch_count 0
zk_ephemerals_count 0
zk_approximate_data_size 27
zk_open_file_descriptor_count 36
zk_max_file_descriptor_count 4096
zk_followers 2
zk_synced_followers 2
zk_pending_syncs 0
```

#### 指标分类

```sh
网络响应延迟信息
zk_avg_latency、zk_max_latency、zk_min_latency

网络请求(数据包和连接状态数量)

数据包相关：zk_packets_received、zk_packets_sent
连接状态相关：zk_num_alive_connections(活跃连接)、zk_outstanding_requests

节点数量信息：
zk_znode_count、zk_watch_count、zk_ephemerals_count(临时节点数)

服务状态
zk_server_state、zk_open_file_descriptor_count、zk_max_file_descriptor_count

Leader特有：
zk_followers、zk_synced_followers(同步数量)、zk_pending_syncs(阻塞数量)
```

#### 集群优化

##### 文件隔离

```
生产中Zookeeper的dataDir 和 dataLogDir 应该分开部署，因为事务日志非常重要而且内容比较多，
所以在配置的时候，dataLogDir所在的目录，要保证目录空间足够大，并挂载到单独的磁盘上，如果可以的
话，磁盘应该开启实时刷新功能。
```

##### 日志滚动

```
默认情况下，一般日志是放在一个文件中，为了更好的查看日志效果，我们一般会将日志进行切割，接下来我
们配置一下日志的切割功能。

Zookeeper的默认日志切割配置文件是 项目目录的conf/log4j.properties,和切割配置主要相关的是：
log4j.appender.ROLLINGFILE=org.apache.log4j.RollingFileAppender
如果想按天进行日志切割的话，可以修改为 DaliyRollingFileAppender


Zookeeper使用日志切割功能
# vim /data/server/zk1/bin/zkServer.sh
...
30 # 增加 ZOO_LOG_DIR 配置
31 ZOO_LOG_DIR="$ZOOBINDIR/../log4j"
...
# vim /data/server/zk1/bin/zkEnv.sh
59 if [ "x${ZOO_LOG4J_PROP}" = "x" ]
60 then
61 ZOO_LOG4J_PROP="INFO,ROLLINGFILE" # 注意：原CONSOLE 修改为
ROLLINGFILE
62 fi
```



##### 日志清理

```
自动清理：自从Zookeeper 3.4.0版本之后，配置文件中多了两个和日志自动清理相关的配置
autopurge.purgeInterval：指定清理频率，单位为小时(默认是0，表示不开启自动清理)
autopurge.snapRetainCount：和purgeInterval配合使用，指定需要保留的文件数目

注意：
Zookeeper 重启会自动清除 zookeeper-root-server-python-auto.out 日志，如果有排错需要，则应先备份好日志文件


配置效果：
# vim /data/server/zk1/conf/zoo.cfg
...
autopurge.purgeInterval=1
autopurge.snapRetainCount=3

手工清理：
如果发现单事务日志量过大，导致定时清理无法及时处理，我们可以基于自定义脚本或者 zookeeper提供的 zkCleanup.sh 进行 结合 定时任务来实现自动清理的任务。


#!/bin/bash
# 定制日志目录
zookeeperDir='/data/server/zookeeper'
dataDir="$zookeeperDir/data/version-2"
dataLogDir=$zookeeperDir/logs/version-2

# 保留文件60
count=60
count=$[$count+1] # 从61行开始删除
ls -t $dataLogDir/log.* | tail -n +$count | xargs rm -f
ls -t $dataDir/snapshot.* | tail -n +$count | xargs rm -f

注意：
ls -t 是顺序排列，
tail -n +5 是从第 5 个至最新文件
```



##### 节点扩展

```sh
在Zookeeper集群中有一个角色是observer，它主要的作用仅仅是增加额外的接收客户端请求的扩展
节点，将接收到的请求，转交给Leader处理，不会影响集群的其他任何操作。
我们只需要在Observe节点的zoo.cfg配置文件中添加如下配置即可

peerType=observer
server.n:localhost:2181:3181:observer

修改配置文件
Zk1节点：
vim /data/server/zk1/conf/zoo.cfg
# 修改如下配置
server.3=192.168.8.14:2382:2383:observer
Zk2节点：
vim /data/server/zk2/conf/zoo.cfg
# 修改如下配置
server.3=192.168.8.14:2382:2383:observer
Zk3节点：
vim /data/server/zk3/conf/zoo.cfg
# 增加如下配置
peerType=observer
# 修改如下配置
server.3=192.168.8.14:2382:2383:observer
重启相关服务
/data/server/zk1/bin/zkServer.sh restart
/data/server/zk2/bin/zkServer.sh restart
/data/server/zk3/bin/zkServer.sh restart

再次查看集群状态
/data/server/zk3/bin/zkServer.sh status
/data/server/zk2/bin/zkServer.sh status
/data/server/zk1/bin/zkServer.sh status
可以看到：
zk3的集群角色就变成了观察者
验证observer是否参与选举
/data/server/zk2/bin/zkServer.sh stop
查看集群状态
/data/server/zk1/bin/zkServer.sh status
可以看到：
集群节点有三个，zk3是观察者，真正提供服务的是两个，我们关闭了一个，集群服务就崩溃了，所以
observer没 有参与集群的选举工作。
```

