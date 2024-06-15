---
author: Ryan
title: Elasticsearch
date: 2021-10-02
categories: ElasticStack
tags: [日志收集]
---



两三年前ELK还是一套日志分析平台的解决方案 ，它是由Elastic公司开发，管理和维护的三款开源产品Elasticsearch，Logstash和Kibana的首字母缩写，随着该套解决方案的软件生态逐渐壮大，其组件和功能也渐渐多了起来，尤其是Beats组件的引入，逐渐形成了这个系列的四大支柱，然后公司将这套解决方案重新命名为：Elastic Stack，最新版本7.X。


<!-- more -->



# ELK日志收集系统

## 基础知识

**简介**

```
    所谓的 搜索引擎(Search Engine)，通常指的是收集了 几千万到几十亿个条数据，为了方便后续精
确查询，我们为这些数据的多个词(关键词)进行索引，建立索引数据库的全文搜索引擎。
    这样，当用户查找某个关键词的时候，所有在页面内容中包含了该关键词的网页都将作为搜索结果被搜出来。再经过复杂的算法进行排序(或者包含商业化的竞价排名、商业推广或者广告)后，这些结果将按照与搜索关键词的相关度高低（或与相关度毫无关系），依次排列。
```





**应用场景**

```
搜索与推荐:
搜索 - 用户在网上，主动根据关键字去搜索相关的数据
推荐 - 网站程序，根据用户日常的搜索习惯，通过分析用户的行为数据，主动推送一些用户感兴趣的事情。


搜索领域：
门户网站 - 提供各种用户感兴趣的网站入口，便于用户快速获取相关信息，一般是爬虫爬取的数据。
定向搜索 - 搜索特定领域的内容，一般是网站自身根据产品设计的样式，结构化存储的数据。

搜索功能：
智能搜索 - 根据用户搜索的历史或者关键字，自动弹出或者扩展类似的关键字，提高用户搜索的效率。
普通搜索 - 用户输入数据然后正常的搜索。
相关搜索 - 默认提供的其他关联网站的入口。
```





## 数据流程

**数据采集** 

```
物理层：文件、设备等
代理层：nginx、haproxy等
web层：nginx、apache、tomcat等
数据库层：mysql、mongodb、redis等
存储层：ceph、k8s、docker等
...
```



### **流程解析**

要完成一次完整的数据采集与处理至少需要有以下几方面来组成：

![ELK](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/ELK.jpg)



```
① 数据采集：根据业务的特性，采取多种方式，进行对一些针对性的数据进行采集
② 数据整理：对上报后的数据源进行收集、清洗、整理
③ 实时分析：对某些重要的核心的业务数据，进行实时分析
④ 离线分析：对普通的数据、非紧急的业务数据进行存储，后续进行相应的分析
⑤ 结果输出：将实时分析和离线分析后的数据结果展现出来，供决策参考
⑥ 问题决策：根据当前业务情况，人工或者自动方式对输出的结构进行分析，并判定下一步的行动(警告或修
复)，
同时将其决策记录保存下来，以便为后序决策提供依据
也就是说：采集、传输、存储、分析、警告这几部分是非常必要的。
```



### **方案梳理**

在这个流程图中涉及到两种场景：实时分析与离线分析，如果需要使用市面
上的开源解决方案来实现的话，有两套方案比较有优势：

- 方案一：ELK + Kafka + 分布式存储
  中数据量场景下，实时的数据多一些
- 方案二：Spark + Flume + Kafka + Hadoop(Hive + HBase)
  大数据量场景下，离线的数据多一些





## 快速入门

### ELK简介

```
两三年前ELK还是一套日志分析平台的解决方案 ，它是由Elastic公司开发，管理和维护的三款开源产品
Elasticsearch，Logstash和Kibana的首字母缩写，随着该套解决方案的软件生态逐渐壮大，其组件和功
能也渐渐多了起来，尤其是Beats组件的引入，逐渐形成了这个系列的四大支柱，然后公司将这套解决方案重
新命名为：Elastic Stack，最新版本7.X。
```



**官方介绍**

```
The products in the Elastic Stack are designed to be used together and releases
are
synchronized to simplify the installation and upgrade process. The full stack
consists
of:
Beats 7.14 APM Server 7.14 Elasticsearch Hadoop 7.14
Kibana 7.14 Elasticsearch 7.14 Logstash 7.14
```



**开发语言**

```
java：Elasticsearch、Logstash、Kibana
go：FileBeats
```



**组件发展**

![ELKfz](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/ELKfz.jpg)



**相关网站**

```
官方网站：https://www.elastic.co
github：https://github.com/elastic
示例网站：https://demo.elastic.co
```



### **架构组件**

```
四个组件：
  Beats是安装在边缘主机上的轻型代理，可收集不同类型的数据以转发到堆栈中
  Logstash是一个日志聚合器，可从各种输入源收集数据，执行不同的转换和增强功能，然后将数据发送
到各种受支持的输出目标
  Elasticsearch是基于Apache Lucene搜索引擎的开源全文搜索和分析引擎
  Kibana是在Elasticsearch之上工作的可视化层，为用户提供了分析和可视化数据的能力

这四个组件在官方的介绍主要分成了两组势力：数据收集和展示

- 数据收集和处理：Beats和Logstash负责数据收集和处理。
- 数据搜索和展示：Elasticsearch索引并存储数据，Kibana提供了用于查询数据和可视化数据的用户界面

  这些组件在设计的时候，组件间的交流就非常简单，所以我们只需要简单的几条配置，就可以将不同的组件组
  合起来实现一个简单而强大的解决方案。而且还可以基于应用场景的不同随意组合，比如日志管理、日志分
  析、应用监控、故障排除和保护IT环境等。
```



**对于小型的应用项目开发环境，ELK的四个组件可以实现一个非常经典的组合：**



![ELKzj](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/ELKzj.jpg)



**对于中大型场景，ELK基于丰富灵活的信息接口将非常多的功能整合到经典组合中，以提高其架构弹性和安全性：**

![ELKzdxjg](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/ELKzdxjg.jpg)



## 安装部署



**要点**

	1 组件间如何联通
	2 组件如何在不同场景中使用对应插件
	
			elasticsearch	实践术语及分片实践
			logstash		组件(插件)实现数据的转移及转移过程中对数据的封装
			filebeat		采集数据集转移
			kibana			可视化的流程及大量可视化实践



### **环境**

```
前提：
	java环境很重要，但是很可惜，elasticsearch软件内部已经有了java环境，
	默认情况下，elasticsearch 软件包里面已经包含了java环境，而且是最新版的 JDK-16.0.1

环境布局
	10.0.0.12  elasticsearch   elasticsearch_head
	10.0.0.13  elasticsearch   logstash
	10.0.0.14  kibana
	10.0.0.15  filebeat + 项目代码
```



**定位**

```
日志分析平台解决方案 - 大量小方案的整合
	Store, Search, and Analyze
	
组成
	Elasticsearch		- 数据的存储和分析
	Logstash			- 数据采集和传输(*)
	Kibana				- 数据的可视化(二次处理)  KQL
	Beats				- 数据采集(*)和传输
	
中小场景方案
	Beats - Logstash - elasticsearch - kibana
	
中大场景方案
	Beats - 消息队列 - Logstash - 消息队列 - elasticsearch - kibana(Nginx)
```



**基本环境**

```
安装java8环境
apt install openjdk-8-jdk
检查效果
java -version
注意:
默认情况下，elasticsearch 软件包里面已经包含了java环境，而且是最新版的 JDK-16.0.1
```



### **软件安装**

**apt 源码安装方式**

```shell
获取软件源
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
apt install apt-transport-https
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee
–a /etc/apt/sources.list.d/elastic-7.x.list
apt update

安装软件
apt install elasticsearch
```



**软件安装方法2 - 包安装**

```shell
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.14.0-
amd64.deb

wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.14.0-
amd64.deb.sha512

shasum -a 512 -c elasticsearch-7.14.0-amd64.deb.sha512
dpkg -i elasticsearch-7.14.0-amd64.deb

注意：
这里推荐 两台服务器来部署 elasticsearch
```



**基本配置**

```bash
查看配置结构
#dpkg -L elasticsearch
/usr
/usr/share
/usr/share/elasticsearch
/usr/share/elasticsearch/bin
/usr/share/elasticsearch/bin/elasticsearch-geoip
...
/etc
/etc/elasticsearch
/etc/elasticsearch/elasticsearch.yml 核心配置文件
/etc/elasticsearch/log4j2.properties 日志相关的配置
/etc/elasticsearch/roles.yml
/etc/elasticsearch/jvm.options jvm相关的配置
/etc/elasticsearch/role_mapping.yml
/etc/elasticsearch/users_roles
/etc/elasticsearch/users
/etc/default
/etc/default/elasticsearch 环境变量配置文件
/usr/lib
/usr/lib/tmpfiles.d
/usr/lib/tmpfiles.d/elasticsearch.conf
/usr/lib/systemd
/usr/lib/systemd/system
/usr/lib/systemd/system/elasticsearch.service 服务启动文件
...
```



**环境变量定制**

```bash
echo 'export PATH=/usr/share/elasticsearch/bin:$PATH' >
/etc/profile.d/elasticsearch.sh
source /etc/profile.d/elasticsearch.sh
```



### **简单实践**

```sh
修改配置文件
vim /etc/elasticsearch/elasticsearch.yml

# 设定elasticsearch集群的名称
cluster.name: elastic.example.com

# 设定集群master界面的名称
node.name: 192.168.8.12

# 设定elasticsearch的存储目录，包括数据目录和日志目录
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

# 允许所有主机都能访问我们的elasticsearch
network.host: 0.0.0.0

# 设置elasticsearch对外的访问端口
http.port:9200

# 设定主机发现
discovery.seed_hosts: ["192.168.10.106","192.168.10.107"]
cluster.initial_master_nodes: ["192.168.10.106"]

# 开启跨域访问支持，默认为false
http.cors.enabled: true

# 跨域访问允许的域名地址，(允许所有域名)以上使用正则
http.cors.allow-origin: "*"

注意：
对于 node 主机只需要更改一处 node.name 即可
如果是重新还原es集群，启动前将 path.data 和 path.logs 目录下的数据清空，避免数据不一致
```



**重启服务**

```sh
重启es服务
systemctl start elasticsearch

检查效果
# netstat -tnulp | egrep 'Add|java'
Proto Recv-Q Send-Q Local Address Foreign Address State
PID/Program name
tcp6 0 0 :::9300 :::* LISTEN
12004/java
tcp6 0 0 :::9200 :::* LISTEN
12004/java

结果显示
默认elasticsearch开启了两个端口，
9200 elasticsearch对外提供服务的接口
9300 集群节点间的通信端口
先启动 9300，然后再开启9200
```



![image-20211115144835005](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211115144835005.png)



**常用地址**

```
查看集群状态
curl -XGET 192.168.10.106:9200/_cat/health
curl -XGET 192.168.10.107:9200/_cat/health?v
注意：在所有的地址后面，增加 ? 和 ?v ，会逐渐显示更多的详细内容

查看集群节点
curl -XGET 192.168.10.106:9200/_cat/nodes

查看索引
curl -XGET 192.168.10.106:9200/_cat/indices

创建索引
curl -XPUT 192.168.10.106:9200/index_test
curl -XGET 192.168.10.106:9200/_cat/indices

格式化展示
curl 192.168.8.12:9200/index_test?pretty

删除索引
curl -XDELETE 192.168.10.106:9200/index_test
curl -XGET 192.168.10.106:9200/_cat/indices

批量删除
curl -s http://192.168.10.106:9200/_cat/indices | awk '{print $3}'
for index in $(curl -s http://192.168.10.106:9200/_cat/indices | awk '{print
$3}')
do
curl -XDELETE 192.168.10.106:9200/$index
done

修改切片属性
curl -X PUT 192.168.10.106:9200/index_test -H 'Content-Type:application/json' -d'
{
   "settings" : {
   "number_of_shards" : 3,
   "number_of_replicas" : 1
   }
}'
curl 192.168.10.107:9200/index_test?pretty
注意：
在设置切片属性的时候，一定要注意在历史数据中，最好不要存在同名的索引，否则报错
```



### **功能插件**

插件管理

```
elasticsearch最擅长的场景就是索引的操作，而索引的使用场景在不同的公司非常不同，所以
elasticsearch的索引场景可以基于不同的插件来实现对应的功能，而插件也是ELK非常重要的属性。

elasticsearch提供了两种插件的管理方式：
- 专用的插件管理可以使用命令 elasticsearch-plugin，它可以对默认的插件进行管理；
- 定制的插件管理可以基于离线方式安装插件。
 
常见插件：
  分词插件：analysis-icu、analysis-ik、等
  管理插件：head、kopf、bigdest、等
 
注意：
  随着elasticsearch的版本更新，很多之前可以直接安装的插件，目前无法直接安装了，
  需要采取自定义的方式来安装
  
旧的插件地址
  https://www.elastic.co/guide/en/elasticsearch/plugins/2.4/management.html
  
官方地址
  https://www.elastic.co/guide/en/elasticsearch/plugins/current/index.html
```



**安装插件命令**

```
在线方式：
elasticsearch-plugin install [plugin_name]/[version]

离线方式：
方法1：elasticsearch-plugin install file:///path/to/plugin.zip
方法2：将下载的插件解压到elasticsearch的plugins目录即可

查看已安装插件
elasticsearch-plugin list

删除插件
elasticsearch-plugin remove [plugin_name]

注意：
删除插件的时候，推荐先关闭结点，然后再关闭。
```



安装默认的插件

```
安装中文语法分析后重启服务
elasticsearch-plugin install analysis-smartcn
elasticsearch-plugin install analysis-icu
systemctl restart elasticsearch.service

检查效果
# elasticsearch-plugin list
analysis-icu
analysis-smartcn

# ls /usr/share/elasticsearch/
bin jdk lib modules NOTICE.txt plugins README.asciidoc

# ls /usr/share/elasticsearch/plugins/
analysis-icu analysis-smartcn

简单测试
# curl -X POST 'http://192.168.10.106_analyze?pretty=true' -H 'content-type:

application/json' -d '{
"analyzer": "icu_analyzer",
"text": "中华人民共和国国歌"
}'
---- 下面是显示的内容
{
"tokens" : [
{
"token" : "中华",
"start_offset" : 0,
"end_offset" : 2,
"type" : "<IDEOGRAPHIC>",
"position" : 0
},
{
"token" : "人民",
"start_offset" : 2,
"end_offset" : 4,
"type" : "<IDEOGRAPHIC>",
"position" : 1
},
{
"token" : "共和国",
"start_offset" : 4,
head插件安装
"end_offset" : 7,
"type" : "<IDEOGRAPHIC>",
"position" : 2
},
{
"token" : "国歌",
"start_offset" : 7,
"end_offset" : 9,
"type" : "<IDEOGRAPHIC>",
"position" : 3
}
]
}

# curl -X POST 'http://192.168.10.106:9200/_analyze?pretty=true' -H 'content-type:

application/json' -d '{
"analyzer": "smartcn",
"text": "中华人民共和国国歌"
}'
---- 下面是显示的内容
{
"tokens" : [
{
"token" : "中华人民共和国",
"start_offset" : 0,
"end_offset" : 7,
"type" : "word",
"position" : 0
},
{
"token" : "国歌",
"start_offset" : 7,
"end_offset" : 9,
"type" : "word",
"position" : 1
}
]
}
```



### **head插件安装**

```
简介

  head插件，在elasticsearch中，应用的还算可以，但是自动2.x之后的版本，就不再支持了，需要我们自己来进行独立的部署。
 
  代码资料：https://github.com/mobz/elasticsearch-head

准备工作
apt install npm git -y

安装插件
mkdir /data/server/elasticsearch/plugins -p
cd /data/server/elasticsearch/plugins
git clone git://github.com/mobz/elasticsearch-head.git
cd elasticsearch-head
npm config set registry https://registry.npm.taobao.org
npm install --force

配置软件的访问地址

# vim Gruntfile.js
...
connect: {
server: {
options: {
hostname: '*', # 增加这一行
port: 9100,
base: '.',
keepalive: true
}
}
}
...
配置插件访问es

# vim _site/app.js
...
4372 this._super();
4373 this.prefs = services.Preferences.instance();
4374 this.base_uri = this.config.base_uri ||
this.prefs.get("app-base_uri") || " http://192.168.10.106:9200"; # 修改连接es的连接地址
...
启动服务
npm run start >>/dev/null 2>&1 &
检查效果

# netstat -tnulp | egrep 'Add|grunt'
Proto Recv-Q Send-Q Local Address Foreign Address State
PID/Program name
tcp6 0 0 :::9100 :::* LISTEN
19818/grunt
```



**head插件图**

![image-20211115150016025](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211115150016025.png)

```
属性解析：
一定要先保证连接按钮左侧的es地址是正确的，然后再来点击"连接"
* 代表索引es的主节点，黑色加粗的方框0表示，索引的主副本。
  黄色代表有从分片丢失，但是没有主分片数据丢失，即当前没有数据丢失。
  红色代表主分配丢失，即有数据丢失；绿色代表所有主分片和从分片的数据正常
```



**服务启动脚本**





**启动脚本**

```
# cat /data/scripts/elasticsearch_head.sh
#!/bin/bash
# 启动elasticsearch 脚本
cd /data/server/elasticsearch/plugins/elasticsearch-head
npm run start >>/dev/null 2>&1
# vim /lib/systemd/system/elasticsearch_head.service
[Unit]
Description= elasticsearch head server project
[Service]
User=root
ExecStart=/bin/bash /data/scripts/elasticsearch_head.sh
TimeoutStopSec=10
Restart=on-failure
RestartSec=5
[Install]
WantedBy=multi-user.target
启动服务
systemctl daemon-reload
systemctl start elasticsearch_head.service
systemctl status elasticsearch_head.service
```



---



小结

```
elasticsearch 几乎所有的特色功能都是以插件的样式来整合的
elasticsearch-plugin install | remove | list

默认情况下，这些插件安装在了 
/usr/share/elasticsearch/plugins
	
这些插件安装完毕后，需要重新启动环境，才会生效

关键插件
head插件，是需要独立部署的，可以不安装到 plugins
```

