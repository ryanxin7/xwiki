---
author: Ryan
title: 5.Redis 持久复制
date: 2020-08-05
tags: [Redis]
---



#  Redis 持久复制



Redis虽然是一个内存级别的缓存程序，但是其可以将内存的数据按照一定的策略保存到硬盘上，从而实现数据持久保存的目的。



目前，redis支持两种不同方式的数据持久化保存机制：



**RDB**

- 基于时间，生成某个时间点的快照文件，默认只保留最近的一次快照。

- 恢复速度非常快，但是可能丢失之前的快照数据，非实时同步。

  

**AOF**

- AppendOnlyFile(日志追加模式),基于Redis协议格式保存信息到指定日志文件的末尾
- 基于写时复制的机制，每隔x秒将新执行的命令同步到对应的文件中
- 默认是禁用的，需要开启数据保存全，时间过长导致文件过大，恢复时候速度比RDB慢。



数据保存时有两个命令，

实践效果，先执行一个bgsave把同步过后的文件拷贝到一个临时文件里面，然后再当前环境下做一些操作，把redis 关闭，然后把之前保存的文件拷贝到redis 数据目录，redis在启动的时候会读取db文件，由于这个文件是拷贝回来的所以还原的数据应该是没有执行操作之前的数据。





### RDB原理

Redis从master主进程中创建一个子进程，基于写时复制机制，子进程将内存的数据保存到.rdb文件中，数据保存完毕后，再将上次保存的rdb文件覆盖替换掉，最后关闭子进程。
Redis提供了手工的机制，我们可以执行命令实现文件的保存



![redis-RDB](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/redis-RDB.jpg)

![redis-RDB2](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/redis-RDB2.jpg)





### **AOF 原理** 

AOF 以协议文本的方式，将所有对数据库进行过写入的命令（及其参数）记录到 AOF 文件，以此达到记录数据库状态的目的。



![redis-AOF](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/redis-AOF.jpg)





```sh
rdb
	优势：
        - 基于数据的快照来进行存储
        - 数据完整
        - 策略非常灵活
	劣势：
		- 数据量大的时候，快照文件也大
		- bgsave的时候，会以覆盖的方式同步数据，有可能导致部分数据丢失
			对于此我们可以借助于 定时备份的方式将数据额外保存
aof
	优势：
		- 基于操作命令的方式进行数据的存储
		- 容量非常小
	劣势：
		- 对于基础的数据有一定的依赖
		
使用场景：
	rdb 做基础数据的备份
	aof 做实时数据的备份
```



## 简单实践

#### RDB 实践

RDB配置解析

```sh
自动保存机制
root@python-auto:~# grep -Env '#|^$' /etc/redis/redis.conf
...
save '' 关闭该功能
381:save 3600 1  # 3600秒内提交一次数据
382:save 300 100
383:save 60 10000
398:stop-writes-on-bgsave-error yes
404:rdbcompression yes
413:rdbchecksum yes
431:dbfilename dump.rdb  #保存文件名
444:rdb-del-sync-files no
454:dir /var/lib/redis #保存路径
```



**RDB持久化命令**

```python
# 数据同步操作，执行时候，会导致其他命令无法执行
127.0.0.1:6379> help SAVE
SAVE -
summary: Synchronously save the dataset to disk
since: 1.0.0
group: server

# 异步方式后台执行数据的同步，不影响其他命令的执行
127.0.0.1:6379> help BGSAVE
BGSAVE [SCHEDULE]
summary: Asynchronously save the dataset to disk
since: 1.0.0
group: server
```



**简单测试**

```sh
# 执行备份前查看效果
root@python-auto:~# ll -h /var/lib/redis/*.rdb
-rw-rw---- 1 redis redis 268 7月 28 18:31 /var/lib/redis/dump.rdb
# 执行备份
127.0.0.1:6379> bgsave

Background saving started

# 执行备份后查看效果
root@python-auto:~# ll -h /var/lib/redis/*.rdb
-rw-rw---- 1 redis redis 268 7月 29 09:38 /var/lib/redis/dump.rdb

# 备份文件
root@python-auto:/var/lib/redis# cp dump.rdb /tmp

# 在做一些操作
127.0.0.1:6379> set xxx xxx
...
# 关闭redis
systemctl stop redis

查看效果
root@python-auto:~# ll -h /var/lib/redis/*.rdb
-rw-rw---- 1 redis redis 488 7月 29 09:41 /var/lib/redis/dump.rdb

还原配置文件
cp /tmp/dump.rdb ./

启动redis
systemctl start redis

查看效果
127.0.0.1:6379> keys *
```



#### AOF实践

**配置解析**

```sh
root@python-auto:~# grep -Env '#|^$' /etc/redis/redis.conf
...
1252:appendonly no
1256:appendfilename "appendonly.aof"
1282:appendfsync everysec
1304:no-appendfsync-on-rewrite no
1323:auto-aof-rewrite-percentage 100
1324:auto-aof-rewrite-min-size 64mb
1348:aof-load-truncated yes
1359:aof-use-rdb-preamble yes
...
```



AOF持久化命令

```sh
# 数据同步操作，执行时候，会导致其他命令无法执行
127.0.0.1:6379> help BGREWRITEAOF


BGREWRITEAOF -
summary: Asynchronously rewrite the append-only file
since: 1.0.0
group: server
```



简单测试

```sh
# 检查现状
127.0.0.1:6379> CONFIG GET appendonly
1) "appendonly"
2) "no"
root@python-auto:~# ll -h /var/lib/redis/*.rdb
-rw-rw---- 1 redis redis 92 7月 29 10:06 /var/lib/redis/dump.rdb

# 修改持久化模式
127.0.0.1:6379> CONFIG SET appendonly yes
OK

# 确认效果
root@python-auto:~# ll -h /var/lib/redis/
总用量 16K
-rw-rw---- 1 redis redis 92 7月 29 10:09 appendonly.aof
-rw-rw---- 1 redis redis 92 7月 29 10:06 dump.rdb

# 开始备份
127.0.0.1:6379> MSET a1 v1 a2 v2 a3 v3
OK
127.0.0.1:6379> BGREWRITEAOF
Background append only file rewriting started


# 检查效果
root@python-auto:~# ll -h /var/lib/redis/*.aof
-rw-rw---- 1 redis redis 118 7月 29 10:11 /var/lib/redis/appendonly.aof
```

