---
author: Ryan
title: 3.Redis环境部署
date: 2020-08-03
tags: [Redis]
---



# Redis 基础知识



Redis 是 Remote Dictionary Server(远程数据服务)的缩写，由意大利人 antirez(Salvatore
Sanfilippo) 开发的一款 内存高速缓存数据库，该软件使用 C 语言编写,它的数据模型为 key-value。



**官方介绍**：

Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache, and message broker. Redis provides data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams. Redis has built-in replication, Lua scripting, LRU eviction, transactions, and different levels of on-disk persistence, and provides high availability via Redis Sentinel and automatic partitioning with Redis Cluster.



Redis是一个开源（BSD许可）的内存数据结构存储，被用作数据库、缓存和消息代理。Redis提供的数据结构包括：字符串、哈希值、列表、集合、带范围查询的排序集合、位图、超日志、地理空间索引和流。Redis有内置的复制、Lua脚本、LRU驱逐、事务和不同级别的磁盘持久性，并通过Redis Sentinel和Redis Cluster的自动分区提供高可用性。



**关键点**：
开源、基于内存的数据结构存储、可以作为数据库、缓存、消息代理
提供了 九种+ 的数据结构。

支持各种功能
            - 复制、内部检测、事务操作、数据持久化、高可用功能(高可用、高扩展)

**趋势**：

![Redis趋势图1](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/Redis%E8%B6%8B%E5%8A%BF%E5%9B%BE1.jpg)



![Redis趋势图2](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/Redis%E8%B6%8B%E5%8A%BF%E5%9B%BE2.jpg)



资料来源：https://db-engines.com/en/ranking/key-value+store/all



## 应用场景

我们直接从几种数据本身的应用特性来描述一下该软件的应用场景：



- Sort Set (有序集合)

  有序集合在普通集合的基础上做了分数比较的特性，所以主要用来做一些分类排序等功能

  比如：排行榜应用，取 top n 操作

- List (列表)

  列表本身具有排序、切片等特性，因为redis的基于内存的分布式特性，它主要来做一些数据筛选、排序等功能

  比如：获得最新 N 个数据 或 某个分类的最新数据等



- String (字符串)

  字符串的其实就是数据的临时存储，借助于redis的内存特性，主要做一些共享之类的功能。

  比如：计数器应用、会话共享、购物车状态数据等



- Set (集合)

  集合主要是数据的统计，由于数据本身具有权重的特性，所以判断数据是否存在的特性要比list好很多。

  比如：获得共同数据、安全防御的ip判断、社交好友等





```
以数据存储本身的角度来说场景
		有序集合	- 各种排行、topn
		list 	   - 数据的排布，顺序
		sort集合    - 范围数据列表
		string     - 数据的存储
		hash字典	  - 数据分类(子分类)
```



只要你有丰富的想象力，redis你想着么用就怎么用。



## Redis 部署

**Redis** 的安装有两种方式，一个是多主机环境下使用、一个是单台主机部署方便实验测试。



**通过软件源安装**

```sh
# 安装源仓库
add-apt-repository ppa:redislabs/redis
apt-get update

# 查看软件版本
apt info redis
apt info redis-server
# 安装软件
apt install redis
注意：会自动安装 redis-server、redis-tools 依赖软件

# 服务管理
systemctl stop redisredis-server
systemctl disable redis-server
systemctl start redis-server

# 默认启动的端口号6379

# 进入redis数据库
redis-cli

# 查看信息
info
```



**手工安装方式**

```sh
# 下载软件
mkdir /data/softs && cd /data/softs
wget https://download.redis.io/releases/redis-6.2.5.tar.gz

# 解压文件
tar xf redis-6.2.5.tar.gz
cd redis-6.2.5/

# 确认安装效果
grep 'make PREF' -B 2 README.md
% make install

# 指定安装路径
You can use `make PREFIX=/some/other/directory install` if you wish to use a

# 编译安装
make PREFIX=/data/server/redis install
# 此命令已经将make编译安装的步骤整合在一起

# 查看效果
# tree /data/server/redis/
/data/server/redis/
└── bin
├── redis-benchmark
├── redis-check-aof -> redis-server
├── redis-check-rdb -> redis-server
├── redis-cli
├── redis-sentinel -> redis-server
└── redis-server
1 directory, 6 files

# 配置环境变量
echo 'PATH=/data/server/redis/bin:$PATH' > /etc/profile.d/redis.sh
source /etc/profile.d/redis.sh

# 创建基本目录
mkdir /data/server/redis/{etc,log,data,run} -p
# 因为redis service 里面指定这几个路径因此要创建出来用于服务存放数据
cp redis.conf /data/server/redis/etc/
```



**启动命令**

![Redis启动命令](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/Redis%E5%90%AF%E5%8A%A8%E5%91%BD%E4%BB%A4.jpg)



**前台方式启动 redis**

```sh
redis-server /data/server/redis/etc/redis.conf
```

![Redis前台方式启动](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/Redis%E5%89%8D%E5%8F%B0%E6%96%B9%E5%BC%8F%E5%90%AF%E5%8A%A8.jpg)

检查效果

![Redis启动端口](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/Redis%E5%90%AF%E5%8A%A8%E7%AB%AF%E5%8F%A3.jpg)

redis在可以基于同一个配置文件启动多个程序

```sh
# 启动多个实例
redis-server /data/server/redis/etc/redis.conf --port 6666
redis-server /data/server/redis/etc/redis.conf --port 7777
redis-server /data/server/redis/etc/redis.conf --port 8888
redis-server /data/server/redis/etc/redis.conf --port 9999
# 查看效果
netstat -tnulp | grep redis
```

![Redis多实例](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/Redis%E5%A4%9A%E5%AE%9E%E4%BE%8B.jpg)



**后台方式启动**



```sh
# 定制redis配置文件
root@python-auto:~# vim /data/server/redis/etc/redis.conf

# daemonize no 将redis的启动设定为后台启动
daemonize yes
bind 10.0.0.12 127.0.0.1 
#增加本地IP地址

# 启动redis服务
/data/server/redis/bin/redis-server /data/server/redis/etc/redis.conf

# 查看效果
netstat -tnulp | grep redis

# 关闭服务
redis-cli shutdown
#注意此命令是将本机中的所有实例进程全部关闭
redis-cli -h 127.0.0.1 -p 6666
#访问进程
kill -9 $(lsof -Pti :6379)

#启动多实例

redis-server /data/server/redis/etc/redis.conf --port 6380
redis-server /data/server/redis/etc/redis.conf --port 6381
redis-server /data/server/redis/etc/redis.conf --port 6382
redis-server /data/server/redis/etc/redis.conf --port 6383

#伪集群效果
```





## 简单实践

### 查看配置

```sh
root@python-auto:/etc/redis# grep -Env '#|^$' redis.conf
75:bind 127.0.0.1 -::1 绑定地址
94:protected-mode yes
98:port 6379 暴露端口
107:tcp-backlog 511 连接队列
119:timeout 0
136:tcp-keepalive 300
257:daemonize yes 后台启动
275:supervised auto
289:pidfile /run/redis/redis-server.pid
297:loglevel notice
302:logfile /var/log/redis/redis-server.log
327:databases 16 默认16个数据库
336:always-show-logo no
341:set-proc-title yes
358:proc-title-template "{title} {listen-addr} {server-mode}"
398:stop-writes-on-bgsave-error yes
404:rdbcompression yes
413:rdbchecksum yes
431:dbfilename dump.rdb 数据文件名称
444:rdb-del-sync-files no
454:dir /var/lib/redis 数据文件所在目录
...
```



### 常用操作命令

```sh
# 连接数据库
root@python-auto:/etc/redis# redis-cli 精简连接格式
127.0.0.1:6379>
root@python-auto:/etc/redis# redis-cli -h localhost -p 6379 标准连接格式
localhost:6379>
root@python-auto:~# redis-cli --raw 中文连接格式
127.0.0.1:6379>
# 测试效果
127.0.0.1:6379> ping
PONG
# 退出效果
127.0.0.1:6379[5]> quit
```



#### **查看帮助信息**：

​	

```sh
127.0.0.1:6379> help
redis-cli 6.2.5
To get help about Redis commands type:
"help @<group>" to get a list of commands in <group>
"help <command>" for help on <command>
"help <tab>" to get a list of possible help topics
"quit" to exit
To set redis-cli preferences:
":set hints" enable online hints
":set nohints" disable online hints
Set your preferences in ~/.redisclirc
注意：
历史操作命令在 ~/.rediscli_history 文件中
```



#### 命令组解析

```sh
redis将大量的命令进行了简单的分组操作，对于6.2.5来说，他有 15个命令组
@generic 通用的命令组
@string 字符相关命令组
@list 列表相关命令组
@set 集合相关命令组
@sorted_set 有序集合相关命令组
@hash hash相关命令组
@pubsub 发布订阅相关命令组
@transactions 事务相关命令组
@connection 连接相关命令组
@server 服务相关命令组
@scripting 脚本相关命令组
@hyperloglog 超级日志相关命令组
@cluster 集群相关命令组
@geo 基因类数据相关命令组
@stream 流数据相关命令组

——————————————————————————————————
#查看命令组
127.0.0.1:6379> help @generic
#查看组中单独命令帮助
127.0.0.1:6379> help ECHO
ECHO message
summary: Echo the given string
since: 1.0.0
group: connection
```



**简单实践**

```sh
# 选择数据库
127.0.0.1:6379> select 5
OK
127.0.0.1:6379[5]>
# 查看所有属性信息
127.0.0.1:6379[5]> info
...
# 查看部分属性信息
127.0.0.1:6379[5]> info cpu
# CPU
used_cpu_sys:1.222606
used_cpu_user:0.905046
used_cpu_sys_children:0.000000
used_cpu_user_children:0.000000
used_cpu_sys_main_thread:1.221889
used_cpu_user_main_thread:0.904515
# 获取配置属性
127.0.0.1:6379[5]> CONFIG GET bind
1) "bind"
2) "127.0.0.1 -::1"
```

#### **Key 相关命令**

```sh
# 获取所有的key信息
127.0.0.1:6379> help KEYS
KEYS pattern
summary: Find all keys matching the given pattern
since: 1.0.0
group: generic
# 判断一个key是否存在
127.0.0.1:6379> help EXISTS
EXISTS key [key ...]
summary: Determine if a key exists
since: 1.0.0
group: generic
# 设置一个key
127.0.0.1:6379> help set
SET key value [EX seconds|PX milliseconds|EXAT timestamp|PXAT millisecondstimestamp|
KEEPTTL] [NX|XX] [GET]
summary: Set the string value of a key
since: 1.0.0
group: string
# 获取一个key
127.0.0.1:6379> help get
GET key
summary: Get the value of a key
since: 1.0.0
group: string
# 删除一个key
127.0.0.1:6379> help DEL
DEL key [key ...]
summary: Delete a key
since: 1.0.0
group: generic
# 查看key的类型
127.0.0.1:6379> help TYPE
TYPE key
summary: Determine the type stored at key
since: 1.0.0
group: generic
# 设置一个有过期期限的key
127.0.0.1:6379> help EXPIRE
EXPIRE key seconds
summary: Set a key's time to live in seconds
since: 1.0.0
group: generic
# 查看一个key的有效时间
127.0.0.1:6379> help TTL
TTL key
summary: Get the time to live for a key
since: 1.0.0
group: generic
# 删除当前库的所有key
127.0.0.1:6379> help FLUSHDB
FLUSHDB [ASYNC|SYNC]
summary: Remove all keys from the current database
since: 1.0.0
group: server
# 删除当前数据库所有的数据
127.0.0.1:6379> help FLUSHALL
FLUSHALL [ASYNC|SYNC]
summary: Remove all keys from all databases
since: 1.0.0
group: server
```



### String 

string类型是实战中应用最多的数据类型，可以用于各种其他类型数据的值的存储，非常方便

**特点**：
	

- 其他数据类型的数据表现样式
- 简单的数据存储
  	

**示例**：
		cookie、session、校验码等



**简单实践**

#### 设定key

```sh
设定一个普通的key
set key value

设定一个有过期时间的key

setex key seconds value

同时设定多个值
mset key1 value1 key2 value2 ...
```



#### 获取key

```sh
获取一个key
get key

获取多个key
mget key1 key2 ...
```



#### 删除key

```sh
删除一个key
del key1

删除多个key
del key1 key2 ...
```



### List 

list 是一个string类型的 列表，redis的每个list都可以存储 2^32 -1 个元素，列表的元素方便排
序、获取、统计等相关操作。

各种各样的列表场景都可以

![lish类型数据](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/lish%E7%B1%BB%E5%9E%8B%E6%95%B0%E6%8D%AE.jpg)



#### 设定key

```sh
左侧添加数据
lpush key value1 value2
右侧添加数据
rpush key value1 value2
插入指定元素
linsert key before|after 现有元素 新元素
```



#### 获取key

```sh
获取列表数据
lrange key start stop
注意：start 是从 0开始、stop如果为 -1的话，代表最后一个。

获取key指定位置的值
LINDEX key index

获取key列表的值的数量
LLEN key

根据key获取在当前列表的位置
LPOS key 
```



#### 删除key

```sh
从key中删除指定的value
lrem key count value

注意：
count > 0: 从头往尾移除指定数量个 value
count < 0: 从尾往头移除指定数量个 value
count = 0: 移除所有的 value


从key的左侧删除指定个数的 value
LPOP key [count]


从key的右侧删除指定个数的 value
RPOP key [count]


保留范围数据，范围之外的都删除
LTRIM key 起始索引 结束索引



实践：
lpush mylist e b e b e b  在左侧插入 ebebebe
lrang mylist 0 -1 显示
lrem mylist 3 e 从左侧开始删除3个e
lrem mylist 3 b 从左侧开始删除3个b
lrem mylist -1 3 从尾部右侧删除1个3
lrem mylist 0 a   =0删除所有的a 
ltrim mylist 2 3 只保留2到3 其他的都删除
```



### set

set 是一个string类型的 集合，redis的每个list都可以存储 2^32 -1 个元素，集合元素无序且不重
复，可以进行各种排序统计场景。

场景：
	内容不重复的任何场景都可以





**无序集合**



#### 设定key

```sh
添加数据
SADD key member [member ...]

注意：
因为是无序的，所以查看的时候，没有顺序
如果key中已经存在 member，那么不会重复增加

合并多个key
SUNION key [key ...]
将多个key的内容合并在一起，相同的member只会存在一个
```



**获取key**

```sh
获取set数据
SMEMBERS key

获取set中的member个数
SCARD key

获取多个key相同的内容 -- 取交集
SINTER key [key ...]

获取多个key不相同的内容 -- 取差集
SDIFF key [key ...]
```

#### 删除key

```
从key中删除指定的member
SREM key member [member ...]

从key的随机删除指定个数的 member
SPOP key [count]

```



### Sort set

set 是一个string类型的 集合，redis的每个list都可以存储 2^32 -1 个元素，集合元素无序且不重
复，可以进行各种排序统计场景。

**有序集合 sortset**



场景：
	排行榜、topN



#### 设定key

```
添加数据
ZADD key score member [score member ...]

注意：
因为每个member有score，所以查看的时候，有会按照score的值进行排序
如果key中已经存在 member，那么不会重复增加
```



#### 获取key

```
获取有序集合数据
ZRANGE key min max [REV]

注意：
min 是从 0开始、max如果为 -1的话，代表最后一个。
rev 代表反序

获取有序集合中的指定分数范围的元素
ZRANGEBYSCORE key min max

获取有序集合元素的权重
ZSCORE key member

获取有序集合元素个数
ZCARD key
```



#### 删除key

```
从key中删除指定的member
ZREM key member [member ...]

从key的随机删除指定个数的 member
ZREMRANGEBYSCORE key min max
```

```
sortset 实践

添加数据
zadd mysortset 89 zhangsan 67 lisi 76 wangwu 91 madong 100 chunpeng

正序查看
zrange mysortset 0 -1
倒序查看
zrange mysortset 0 -1 rev
查看有序集合key个数
zcard mysortset 
查看66-89对应范围的人
zrangebyscore mysortset 66 89
删除指定 zhangsan lisi
zrem mysortset lishi zhangsan
删除指定分数范围的key，删除60分以上的人
zremrangebyscore mysortset 60 100
```



### Hash

hash 是一个string类型的 字段和值 的关联表，redis的每个hash都可以存储 2^32 -1 个键值对，非
常适合于存储对象场景。



![hash](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/hash.jpg)

```
使用场景：
	某个对象的特定属性：
		person: {
			username: zhangsan,
			password: 123456,
			address: beijign,
			xxx: xxx
		}
```





#### 设定 key

```
添加数据
HSET key field value [field value ...]

注意：在实践的时候、hset 也可以实现添加多个数据对的效果
添加多个数据
HMSET key field value [field value ...]
```



#### **获取 key**

```
获取所有属性
HKEYS key

获取多个属性的值
HMGET key field [field ...]
```



**删除 key**

```
从key中删除指定的value
HDEL key field [field ...]

直接删除key所有的内容
del key
```





```
实践：
增加数据
hset person username zhangsan age 36 weight 140 height 1789 wife hanmeimei
查看集合
HKEYS person

HMGET person username age wife
晒选删除字段
hdel person wife
```

