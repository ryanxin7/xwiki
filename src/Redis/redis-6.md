---
author: Ryan
title: 6.Redis主从同步
date: 2020-08-06
tags: [Redis]
---




#  Redis 主从同步



redis 作为一个分布式的数据缓存平台，我们可以借助于redis的多实例机制，让多个实例间的数据，
达成一个同步的效果，这样即使某个实例出现异常，也不影响数据整体的使用。



### 基础知识



#### 复制特性



- redis 如果想要实现主从复制的效果，我们需要为它划分 主角色和从角色，实现数据 由主向从的单向传递。
- 对于 从redis，一旦发现 主redis 更换了，那么将本地数据清空，从新主上同步数据。
- 如果 从redis 仅仅是断开了 主redis，那么不会删除已经同步过的数据。



#### 实践要点

把多个主机节点，关联在一起让这些主机节点当中有一个主角色，专门负载数据的写、删除、更新
剩下的两个从节点只用于读数据。因为在大部分场景下都是读多写少。

所以通过从节点做到大范围的读操作，运行三台redis 通过一条命令把从库挂到主库上。

谁是我的老大？



```
1 主角色redis 必须开启持久化功能
2 从角色redis 指定谁是主，以及自己作为从的唯一标识。

redis4.0之前用 slaveof
redis4.0之后用 replicaof

我是谁的副本 谁是我的老大

relicaof <masterip> <msterport>
```





### 实践操作

#### 复制命令方式同步

```
127.0.0.1:6379> help SLAVEOF
SLAVEOF host port
summary: Make the server a replica of another instance, or promote it as
master. Deprecated starting with Redis 5. Use REPLICAOF instead.
since: 1.0.0
group: server
127.0.0.1:6379> help REPLICAOF
REPLICAOF host port
summary: Make the server a replica of another instance, or promote it as
master.
since: 5.0.0
group: server
注意：
关闭复制关系可以通过 replicaof no one 命令
```



默认情况下，任何一个redis实例启动时候，会自动将自己作为主角色而存在

```sh
127.0.0.1:6379> info Replication
# Replication
role:master
connected_slaves:0
```

##### **同步实践**

```
#开启一个redis实例
redis-server /data/server/redis/etc/redis.conf --port 6666 --daemonize yes

#连接新实例查看效果

# redis-cli -h 127.0.0.1 -p 6666
> info replication
# Replication
role:master
connected_slaves:0
...

#新实例同步主角色

# 设置主角色
127.0.0.1:6666> REPLICAOF 127.0.0.1 6379
OK

# 查看状态
127.0.0.1:6666> info replication
# Replication
role:slave
master_host:127.0.0.1
master_port:6379
master_link_status:up
master_last_io_seconds_ago:3
master_sync_in_progress:0
slave_repl_offset:0
slave_priority:100
...

# 查看同步效果
127.0.0.1:6666> KEYS *
1) "a1"
2) "a3"
3) "a2"
结果显示：
数据同步成功
```



##### 效果验证



从角色只能查看数据，不能修改数据



```sh
127.0.0.1:6666> FLUSHALL
(error) READONLY You can't write against a read only replica.
# 主角色删除数据
127.0.0.1:6379> keys *
1) "a2"
2) "a1"
3) "a3"


127.0.0.1:6379> DEL a1
(integer) 1

# 从角色查看效果
127.0.0.1:6666> keys *
1) "a3"
2) "a2"
结果显示：
自动同步成功。


#同步状态查看

# 同步后主角色查看效果
127.0.0.1:6379> info Replication
# Replication
role:master
connected_slaves:1
slave0:ip=127.0.0.1,port=6666,state=online,offset=1038,lag=0
master_failover_state:no-failover
master_replid:571bcaecc7eeb590326fc5a9262df569f3623b36
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:1038 # 同步的偏移量
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:1038
# 同步后从角色查看效果
127.0.0.1:6666> info replication
# Replication
role:slave
master_host:127.0.0.1
master_port:6379
master_link_status:up
master_last_io_seconds_ago:10
master_sync_in_progress:0
slave_repl_offset:1038 # 同步的偏移量
slave_priority:100
slave_read_only:1
replica_announced:1
connected_slaves:0
master_failover_state:no-failover
master_replid:571bcaecc7eeb590326fc5a9262df569f3623b36
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:1038
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:1038
```







#### 配置文件方式主从同步



```sh
简介
对于主从同步来说，
      主角色不用做任何配置
         - 开放自己的怀抱即可



从角色需要做两个方面的配置


1 bind 开放本机的ip
2 replicaof 指定主角色

修改redis.conf 文件中

relicaof <masterip> <msterport>


relicaof 主 IP 端口

实践
       主角色
           数据的增删改查
       从角色
           从主角色主机里获取数据
           
           数据的查看


特点：
如果从角色主机故障，那么主角色主机中的从主机状态会自动消除
如果主角色主机故障，那么整个集群就崩溃了(相对于数据更改来说)
```

