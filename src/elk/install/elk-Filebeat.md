---
author: Ryan
title: ELK组件-beats （二）
date: 2021-10-02
categories: ElasticStack
---


**轻量型数据采集器** Beats 是一个免费且开放的平台，集合了多种单一用途数据采集器。它们从成百上千或成千上万台机器和系统向 Logstash 或 Elasticsearch 发送数据。Beats 是数据采集的得力工具。将 Beats 和您的容器一起置于服务器上，或者将 Beats 作为功能加以部署，然后便可在 Elasticsearch 中集中处理数据。Beats 能够采集符合 [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html) 要求的数据，如果您希望拥有更加强大的处理能力，Beats 能够将数据转发至 Logstash 进行转换和解析。

<!-- more -->

## 基础知识

### 功能简介

根据我们对ELK的经典架构的了解，他的数据收集和处理流程是：beats - logstash -
elasticsearch - kibana。Beats 默认提供了很多中场景的组件，最常见的就是FileBeat

![image-20211116143335268](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116143335268.png)



**运行环境**

```
安装java8环境
apt install openjdk-8-jdk
检查效果
java -version
```



![beats](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/beats.jpg)



### **软件安装**

**apt源码方式**

```shell
获取软件源
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add
-
apt install apt-transport-https
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee
–a /etc/apt/sources.list.d/elastic-7.x.list
apt update
安装软件
apt install filebeat
```



**软件包安装**

```sh
wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.14.0-
amd64.deb
wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.14.0-
amd64.deb.sha512
shasum -a 512 -c filebeat-7.14.0-amd64.deb.sha512
dpkg -i filebeat-7.14.0-amd64.deb
```



**配置查看**

```bash
查看配置文件
# dpkg -L filebeat
/.
/etc
/etc/init.d
/etc/init.d/filebeat
/etc/filebeat
/etc/filebeat/filebeat.yml 核心配置文件
...
/etc/filebeat/filebeat.reference.yml
/etc/filebeat/fields.yml
...
/usr/share/filebeat/bin
/usr/share/filebeat/bin/filebeat
/usr/share/filebeat/bin/filebeat-god
/usr/share/doc
/usr/share/doc/filebeat
/usr/share/doc/filebeat/changelog.gz
/usr/bin
/usr/bin/filebeat
/lib
/lib/systemd
/lib/systemd/system
/lib/systemd/system/filebeat.service 服务启动文件
```





**查看配置文件**

```basic
# grep -Env '#|^$' /etc/filebeat/filebeat.yml
15:filebeat.inputs: 数据的采集
21:- type: log
24: enabled: false 默认该功能没有开启
27: paths:
28: - /var/log/*.log
66:- type: filestream
69: enabled: false
72: paths:
73: - /var/log/*.log
96:filebeat.config.modules:
98: path: ${path.config}/modules.d/*.yml
101: reload.enabled: false
108:setup.template.settings:
109: index.number_of_shards: 1 默认的数据分片个数是 1
145:setup.kibana:
176:output.elasticsearch: 数据的输出
178: hosts: ["localhost:9200"]
204:processors:
205: - add_host_metadata:
206: when.not.contains.tag: forwarded
207: - add_cloud_metadata: ~
208: - add_docker_metadata: ~
209: - add_kubernetes_metadata: ~

结果显示：
filebeat.yml 这就是filebeat的配置文件，里面有12部分的配置，而我们重点关心的就
是"Filebeat inputs" 和 "Outputs",
```



**定制环境变量**

```sh
echo 'export PATH=/usr/share/kibana/bin:$PATH' > /etc/profile.d/kibana.sh
source /etc/profile.d/kibana.sh
```



### 简单实践

定制配置文件

```basic
备份配置文件
cd /etc/filebeat/
cp filebeat.yml filebeat.yml-bak
定制配置文件
filebeat.inputs:
- type: log
paths:
- /var/log/syslog
setup.template.settings:
index.number_of_shards: 5
output.elasticsearch:
hosts: ["192.168.8.12:9200"]
template.name: "filebeat"
属性解析：
enabled: true 表示启用这条配置
template.name 在将数据传入到elasticsearch的时候，自动添加一个索引，名称是filebeat
```







**启动服务**

```basic
启动服务
systemctl start filebeat.service
systemctl status filebeat.service

查看效果
# curl 192.168.8.12:9200/_cat/indices
green open filebeat-7.14.0-2021.08.15-000001 yTq8KQtGSpOyGohS4kcLhQ 5 1 730 0
348.5kb 587b

结果显示：
在elasticsearch中多了好几条索引数据
索引命名格式："自定义索引名-版本号-日期-6位编号"
```



---

**小结：**

- 核心的配置
  	input
  	output
  	modules
  	elasticsearch
  	....
  
- 实践
  	只获取指定文件内部包含 404 的文件内容
  	输出的时候，设定索引名称
  	
  
- 要点
  	如果需要filebeat 定制es的索引名称的话，需要自己设定模板
  
  
  
  
