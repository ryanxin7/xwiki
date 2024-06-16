---
author: Ryan
title: Kafka 集群实战与原理分析线上问题优化
date: 2021-12-04
lastmod: 2021-12-04
tags: [Zookeeper,Kafka]
categories: Kafka
---



# Kafka 集群实战与原理分析线上问题优化

## 一、为什么使用消息队列?

### 1.Kafka知识点思维导图



![Kafka集群实战](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-LinuxKafka集群实战.jpg)

以电商为业务背景

消息队列解决的具体问题是什么？  -- 通信问题。



### 2.使用同步的通讯方式来解决多个服务之间的通讯


![订单场景](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux订单场景.png)

同步的通讯方式会存在性能和稳定性的问题。




### 3.使用异步通讯方式



在业务的上游与下游间加入  通讯模块 （消息队列 存储消息的队列） 

![消息队列通讯方式](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux消息队列通讯方式.png)


**最终一致性**

针对同步的通讯方式来说，异步的方式，可以让上游快速成功，极大提高了系统的吞吐量。而且在分布式系统中，通过下游多个服务的分布式事务保障，也能保证业务执行之后的最终一致性。













## 二、消息队列的流派


### 1.什么是MQ ？


Message Queue（MQ），消息队列中间件。
很多人都说：
MQ 通过将消息的发送和接收分离来实现应用程序的异步和解偶，这个给人的直觉是——MQ 是异步的，用来解耦的，但是这个只是 MQ 的效果而不是目的。


MQ 真正的目的是为了通讯，屏蔽底层复杂的通讯协议，定义了一套应用层的、更加简单的通讯协议。

一个分布式系统中两个模块之间通讯要么是 HTTP，要么是自己开发的 TCP，但是这两种协议其实都是原始的协议。
HTTP 协议很难实现两端通讯——模块 A 可以调用 B，B 也可以主动调用 A，如果要做到这个两端都要背上 WebServer，而且还不支持长连接（HTTP 2.0 的库根本找不到）。
TCP 就更加原始了，粘包、心跳、私有的协议，想一想头皮就发麻。

MQ 所要做的就是在这些协议之上构建一个简单的“协议”——生产者/消费者模型。

MQ 带给我的“协议”不是具体的通讯协议，而是更高层次通讯模型。
它定义了两个对象——发送数据的叫生产者，接收数据的叫消费者；
提供一个 SDK 让我们可以定义自己的生产者和消费者实现消息通讯而无视底层通讯协议。




### 2.中间件选型

目前消息队列的中间件选型有很多种：

rabbit MQ：内部可玩性（功能性）是非常强的

rocket MQ  :阿里内部大神根据Kafka的内部执行原理，手写的一个消息中间件。性能比肩kafka，除此之外，在功能上封装了更多的功能。（消息的逆序）
kafka：全球消息处理性能最快的一款MQ（纯粹）

zeroMQ

这些消息队列中间件有什么区别？


我们把消息队列分为两种

MQ，分为有Broker的MQ，和没有Broker的MQ。
Broker，代理，经纪人的意思。





#### 2.1有broker


有broker的MQ
这个流派通常有一台服务器作为Broker，所有的消息都通过它中转。生产者把消息发送给它就结束自己的任务了，Broker则把消息主动推送给消费者（或者消费者主动轮询）。



![有broker](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux有broker.png)


重topic：Kafka 、RocketMQ 、 ActiveMQ
   整个broker，依据topic来进行消息的中转，在重topic的消息队列里必然需要topic的存在


  轻topic：RabbitMQ
  topic只是其一种中转模式。
  

#### 2.2无broker

在生产者和消费者之间没有使用broker，例如zeroMQ，直接使用socket进行通信

无broker的MQ代表是ZeroMQ，该作者非常睿智，他非常敏锐的意识到--MQ是更高级的Socket

它是解决通信问题的。所以ZeroMQ被设计成了一个“库”而不是一个中间件，这种实现也可以达到--没有Broker的目的。

![无broker](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux无broker.png)


  


## 三、Kafka的基本知识

Kafka是最初由Linkedin公司开发，是一个分布式、支持分区的（partition）、多副本的（replica），基于zookeeper协调的分布式消息系统.  
它的最大的特性就是可以实时的处理大量数据以满足各种需求场景：  
比如基于hadoop的批处理系统、低延迟的实时系统、storm/Spark流式处理引擎，web/nginx日志、访问日志，消息服务等等，用scala语言编写，Linkedin于2010年贡献给了Apache基金会并成为顶级开源项目。  



### 3.1  Kafka的特性:

- 高吞吐量、低延迟：kafka每秒可以处理几十万条消息，它的延迟最低只有几毫秒，每个topic可以分多个partition, consumer group 对partition进行consume操作。

- 可扩展性：kafka集群支持热扩展
- 持久性、可靠性：消息被持久化到本地磁盘，并且支持数据备份防止数据丢失
- 容错性：允许集群中节点失败（若副本数量为n,则允许n-1个节点失败）
- 高并发：支持数千个客户端同时读写




### 3.2 Kafka的使用场景

- 日志收集：一个公司可以用Kafka可以收集各种服务的log，通过kafka以统一接口服务的方式开放给各种consumer，例如hadoop、Hbase、Solr等。

- 消息系统：解耦和生产者和消费者、缓存消息等。

- 用户活动跟踪：Kafka经常被用来记录web用户或者app用户的各种活动，如浏览网页、搜索、点击等活动，这些活动信息被各个服务器发布到kafka的topic中，然后订阅者通过订阅这些topic来做实时的监控分析，或者装载到hadoop、数据仓库中做离线分析和挖掘。

- 运营指标：Kafka也经常用来记录运营监控数据。包括收集各种分布式应用的数据，生产各种操作的集中反馈，比如报警和报告。




### 3.2 基本概念

kafka是一个分布式的，分区的消息(官方称之为commit log)服务。它提供一个消息系统应该具备的功能，但是确有着独特的设计。

首先，让我们来看一下基础的消息(Message)相关术语：


kafka 中有这么些复杂的概念



| 名称          | 解释                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Broker        | 消息中间件处理节点，一个kafka节点就是一个broker，一个或多个Broker可以组成一个kafka集群。                                               |
| Topic         | kafka根据Topic对消息进行分类，发布到kafka集群的每条消息都需要指定一个Topic                                                             |
| Producer      | 消息生产者，向Broker发送消息的客户端                                                                                                   |
| Consumer      | 消息消费者，从Broker读取消息的客户端                                                                                                   |
| ConsumerGroup | 每个consumer属于一个特定的Consumer Group，一条消息可以被多个不同的Consumer消费，但是一个Consumer Group中只能有一个consumer能消费该消息 |
| Partition     | 物理上的概念，一个topic可以分为多个partition，每个partition内部消息是有序的                                                            |



![kafka基本概念](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka基本概念.png)



### 3.3 创建主题topic

**topic kafka消息逻辑的划分**


topic是什么概念? topic可以实现消息的分类，不同消费者订阅不同的topic。

![20220111104851](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux20220111104851.png)

执行以下命令创建名为"test"的topic，这个topic只有一个partition，并且备份因子也设置为1;

```sh
./kafka-topics.sh --create --zookeeper 172.16.253.35:2181 --replication-factor 1 --partitions 1 --topic test
```


查看当前kafka内有哪些topic
```sh
./ kafka-topics.sh --list --zookeeper 172.16.253.35:2181
```



### 3.4 发送消息

kafka自带了一个producer命令客户端，可以从本地文件中读取内容，或者我们也可以以命令行中直接输入内容，并将这些内容以消息的形式发送到kafka集群中。在默认情况下，每一个行会被当做成一个独立的消息。

使用kafka的发送消息的客户端，指定发送到的kafka服务器地址和topic

```sh
./kafka-console-producer.sh --broker-list 10.31.167.10:9092 --topic test
```


### 3.5 消费消息

对于consumer, kafka同样也携带了一个命令行客户端，会将获取到内容在命令中进行输出，默认是消费最新的消息。使用kafka的消费者消息的客户端，从指定kafka服务器的指定topic中消费消息




- 方式一:从当前主题中最后一条消息的offset（偏移量）+1开始消费
  
```sh
./kafka-console-consumer.sh --bootstrap-server 10.31.167.10:9092 --topic test
```

- 方式二∶从当前主题中的第一条消息开始消费

```sh
./kafxa-console-consumer.sh --bootstrap-server 10.31.167.10:9092 --from-beginning --topic test
```


### 3.6 关于消息的细节

![kafka消费细节](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka消费细节.png)

1. 生产者将消息发送给broker，broker会将消息保存在本地的日志文件中
`/usr/ local/kafka/data/kafka-logs/主题-分区/0000000o.log`

2. 消息的保存是有序的，通过offset偏移量来描述消息的有序性

3. 消费者消费消息时也是通过offset来描述当前要消费的那条消息的位置
   



### 3.7单播消息

在一个kafka的topic中，启动两个消费者，一个生产者，问:生产者发送消息，这条消息是否同时会被两个消费者消费?

如果多个消费者在同一个消费组，那么只有一个消费者可以收到订阅的topic中的消息。换言之，同一个消费组中只能有一个消费者收到一个topic中的消息。
```sh
./kafka-console-consumer.sh --bootstrap-server 172.16.253.38:9092--consumer-property group.id=testGroup --topic test
```



### 3.8 多播消息

不同的消费组订阅同一个topic，那么不同的消费组中只有一个消费者能收到消息。实际上也是多个消费组中的多个消费者收到了同一个消息。
```sh
./kafka-console-consumer.sh --bootstrap-server 172.16.253.38:9092--consumer-property group.id=testGroupl --topic test
```
```sh
./kafka-console-consumer.sh --bootstrap-server 172.16.253.38:9092--consumer-property group.id=testGroup2 --topic test
```
**下图就是描述多播和单播消息的区别:**

![kafka多播与单播消息的区别](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka多播与单播消息的区别.png)



### 3.9 查看消费组的详细信息

通过以下命令可以查看到消费组的相信信息︰

```
./kafka-consumer-groups.sh --bootstrap-server 172.16.253.38:9092 --describe --group testGroup
```


![kafka查看消费组详细信息](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka查看消费组详细信息.png)



**重点关注以下几个信息∶**

- current-offset:最后被消费的消息的偏移量
- Log-end-offset:消息总量(最后一条消息的偏移量) 
- Lag:积压了多少条消息




## 四、Kafka 中主题和分区的概念


### 4.1 主题Topic

主题-topic在kafka中是一个逻辑的概念，kafka通过topic将消息进行分类。不同的topic会被订阅该topic的消费者消费。

但是有一个问题，如果说这个topic中的消息非常非常多，多到需要几T来存，因为消息是会被保存到log日志文件中的。为了解决这个文件过大的问题, kafka提出了Partition分区的概念



### 4.2 partition 分区


![kafka分区](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka分区.png)



**1)分区的概念**

通过partition将一个topic中的消息分区来存储。

这样的好处有多个:


- 分区存储，可以解决统一存储文件过大的问题

- 提供了读写的吞吐量:读和写可以同时在多个分区中进行




**2)创建多分区的主题**

```sh
./kafka-topics.sh --create --zokeeper 172.16.253.35:2181 --replication-factor l --partitions 2 --topic test1
```



### 4.3 kafka 中消息日志文件中保存的内容

`. 00000.log:`这个文件中保存的就是消息
`_consumer_offsets-49`

kafka内部自己创建了_consumer_offsets主题包含了50个分区。这个主题用来存放消费者消费某个主题的偏移量。

因为每个消费者都会自己维护着消费的主题的偏移量，也就是说每个消费者会把消费的主题的偏移量自主上报给kafka中的默认主题`consumer_offsets`。因此kafka为了提升这个主题的并发性，默认设置了50个分区。(可以通过offsets.topic.num.paritions设置)，这样可以通过加机器的方式抗大并发。


- 提交到哪个分区︰通过hash函数: hash(consumerGroupld) %_consumer_offsets主题的分区数
- 提交到该主题中的内容是: key是consumerGroupld+topic+分区号，value就是当前offset的值

- 文件中保存的消息，kafka会定期清理topic里的消息，最后就保留最新的那条数据默认保存7天。七天到后消息会被删除。


![kafka-offsets50默认主题](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka-offsets50默认主题.png)



## 五、Kafka集群操作

### 5.1 搭建kafka集群（三个broker）




创建三个`server.properties`文件

```sh
#0 1 2
broker.id=2

#9092 9093 9094
listeners=PLAINTEXT ://192.168.65.60:9094

#kafka-logs kafka-logs-1 kafka-logs-2
log.dir=/usr/ local/ data/ kafka-logs-2

```

通过命令来启动三台broker

```sh
./ kafka-server-start.sh -daemon ../config/server.properties
./ kafka-server-start.sh -daemon ../config/server1.properties
./ kafka-server-start.sh -daemon ../config/server2.properties
```



校验是否启动成功
```sh
进入到zk中查看/brokers/ids中过是否有三个znode (0,1,2)
```



### 5.2 副本的概念

在创建主题时，除了指明了主题的分区数以外，还指明了副本数，那么副本是一个什么概念呢?

副本是为了为主题中的分区创建多个备份，多个副本在kafka集群的多个broker中，会有一个副本作为leader，其他是follower。 生产者与消费者只会与leader交互消息，而follower只会与leader保持同步以备不时之需。



![kafka副本概念](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka副本概念.png)



- leader: kafka的写和读的操作，都发生在leader上。leader负责把数据同步给follower。当leader挂了，经过主从选举，从多个follower中选举产生一个新的leader

- follower： 接收leader的同步的数据

- isr:  可以同步和已同步的节点会被存入到isr集合中。这里有一个细节︰如果isr中的节点性能较差，会被提出isr集合。)

**理解:** 集群中有多个broker，创建主题时可以指明主题有多个分区(把消息拆分到不同的分区中存储)，可以为分区创建多个副本，不同的副本存放在不同的broker里。



### 5.3 关于集群消费

1. 向集群发送消息∶

```sh
./kafka-console-consumer . sh --bootstrap-server 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094 --from-beginning --consumer-property group.id=testGroupl --topic my-replicated-topic
```


2. 从集群中消费消息
```sh
./kafka-console-producer .sh --broker-list 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094 --topicmy-replicated-topic
```
3. 指定消费组来消费消息
```sh
./kafka-console-consumer .sh --bootstrap-server 172.16.253.38∶9092,172.16.253.38:9093,172.16.253.38:9094 --from-beginning --consumer-property group.id=testGroupl --topic my-replicated-topic
```


### 5.4 分区分消费组的集群消费中的细节


![kafka分区分消费组的集群消费中的细节](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka分区分消费组的集群消费中的细节.png)


1. 一个partition只能被一个消费组中的一个消费者消费，目的是为了保证消费的顺序性，但是多个partion的多个消费者消费的总的顺序性是得不到保证的，那怎么做到消费的总顺序性呢?
2. partition的数量决定了消费组中消费者的数量，建议同一个消费组中消费者的数量不要超过partition的数量，否则多的消费者消费不到消息
3. 如果消费者挂了，那么会触发rebalance机制（后面介绍)，会让其他消费者来消费该分区




## 六、专题1  Kafka 集群Controller 、Rebalance 和HW 


### 1.controller

**集群中谁来充当controller** 

每个broker启动时会向zk创建一个临时序号节点，获得的序号最小的那个broker将会作为集群中的controller，负责这么几件事:

1. 当集群中有一个副本的leader挂掉，需要在集群中选举出一个新的leader，选举的规则是从isr集合中最左边获得。

2. 当集群中有broker新增或减少，controller会同步信息给其他broker

3. 当集群中有分区新增或减少，controller会同步信息给其他broker


### 2.rebalance机制

**前提**:消费组中的消费者没有指明分区来消费 

**触发的条件**:当消费组中的消费者和分区的关系发生变化的时候 


![kafka-rebalance机制](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka-rebalance机制.png)



**分区分配的策略**:在rebalance之前， 分区怎么分配会有这么三种策略

- range: 根据公示计算得到每个消费消费哪几个分区:前面的消费者是分区总数/消费
者数量+1,之后的消费者是分区总数/消费者数量.

- 轮询:大家轮着来

- sticky: 粘合策略，如果需要rebalance, 会在之前已分配的基础上调整，不会改变之前的分配情况。如果这个策略没有开，那么就要进行全部的重新分配。建议开启。






## 七、专题2 Kafka中的优化问题(面试问题)




###  1.如何防止消息丢失

 ⽣产者：
1. 使⽤同步发送 
2. 把ack设成1（leader 成功写入）或者all(所有broker完成同步)，并且设置同步的分区数>=2 

消费者：把⾃动提交改成⼿动提交



### 2.如何防⽌重复消费

在防⽌消息丢失的⽅案中，如果⽣产者发送完消息后，因为⽹络抖动，没有收到ack，但实际 上broker已经收到了。 

此时⽣产者会进⾏重试，于是broker就会收到多条相同的消息，⽽造成消费者的重复消费。 


**怎么解决**：

⽣产者关闭重试：会造成丢消息（不建议） 
消费者解决⾮幂等性消费问题： 所谓的幂等性：多次访问的结果是⼀样的。

对于rest的请求（get（幂等）、post（⾮幂 等）、put（幂等）、delete（幂等））

幂等：多次访问的结果是一样的



**解决⽅案**： 
在数据库中创建联合主键，防⽌相同的主键 创建出多条记录 
使⽤分布式锁，以业务id为锁。保证只有⼀条记录能够创建成功

![kafka如何防⽌重复消费](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka如何防⽌重复消费.png)


### 3.如何做到消息的顺序消费

- ⽣产者：保证消息按顺序消费，且消息不丢失——使⽤同步的发送，ack设置成⾮0的 值。 

- 消费者：主题只能设置⼀个分区，消费组中只能有⼀个消费者

kafka的顺序消费使⽤场景不多，因为牺牲掉了性能，但是⽐如rocketmq在这⼀块有专⻔的功能已设计好




![kafka如何做到消息的顺序消费](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka如何做到消息的顺序消费.png)






### 4.如何解决消息积压问题

1）消息积压问题的出现 

消息的消费者的消费速度远赶不上⽣产者的⽣产消息的速度，导致kafka中有⼤量的数据没有被消费。

随着没有被消费的数据堆积越多，消费者寻址的性能会越来越差，最后导致整个 kafka对外提供的服务的性能很差，从⽽造成其他服务也访问速度变慢，造成服务雪崩。




![kafka消息积压问题的出现](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka消息积压问题的出现.png)



2）消息积压的解决⽅案 

1. 在这个消费者中，使⽤多线程，充分利⽤机器的性能进⾏消费消息。

2. 通过业务的架构设计，提升业务层⾯消费的性能。

3. 创建多个消费组，多个消费者，部署到其他机器上，⼀起消费，提⾼消费者的消费速度

创建⼀个消费者，该消费者在kafka另建⼀个主题，配上多个分区，多个分区再配上多个 消费者。该消费者将poll下来的消息，不进⾏消费，直接转发到新建的主题上。此时，新 的主题的多个分区的多个消费者就开始⼀起消费了。——不常⽤






![kafka消息积压的解决⽅案](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka消息积压的解决⽅案.png)






### 5.实现延时队列的效果

1）应⽤场景 订单创建后，超过30分钟没有⽀付，则需要取消订单，这种场景可以通过延时队列来实现 

2）具体⽅案

![kafka实现延时队列的效果](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka实现延时队列的效果.png)


1. kafka中创建创建相应的主题

2. 消费者消费该主题的消息(轮询)

3. 消费者消费消息时判断消息的创建时间和当前时间是否超过30分钟(前提是订单没支付) 

4. 如果是:去数据库中修改订单状态为已取消

5. 如果否:记录当前消息的offset,并不再继续消费之后的消息。等待1分钟后，再次向kafka拉取该offset及之后的消
息，继续进行判断，以此反复。





## 八、Kafka-eagle监控平台


### 1.搭建 

去kafka-eagle官⽹下载压缩包
 http://download.kafka-eagle.org/ 

分配⼀台虚拟机
 虚拟机中安装jdk 
解压缩kafka-eagle的压缩包 
给kafka-eagle配置环境变量

```bash

export KE_HOME=/usr/local/kafka-eagle 
export PATH=$PATH:$KE_HOME/bin
```

需要修改kafka-eagle内部的配置⽂件： 
vim system-config.properties 
修改⾥⾯的zk的地址和mysql的地址 
进⼊到bin中，通过命令来启动

```bash
./ke.sh start
```



### 1.使用



kafka-eagle 监控面板

![kafka-eagle-监控面板](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka-eagle-监控面板.PNG)



kafka-监控查看节点信息

![kafka-监控查看节点信息](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka-监控查看节点信息.PNG)



kafka-eagle查看消费组与消费主题信息

![kafka-eagle查看消费组消费主题信息](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka-eagle查看消费组消费主题信息.PNG)



kafka-eagle查看消息积压情况

![kafka-eagle查看消息积压情况](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linuxkafka-eagle查看消息积压情况.PNG)

