---
author: Ryan
title: ELK组件-Kibana （四）
date: 2021-10-05
categories: ElasticStack
---





**一张图片胜过千万行日志**，Kibana 让您能够自由地选择如何呈现自己的数据。Kibana 是一个免费且开放的用户界面，能够让您对 Elasticsearch 数据进行可视化，并让您在 Elastic Stack 中进行导航。您可以进行各种操作，从跟踪查询负载，到理解请求如何流经您的整个应用，都能轻松完成。


<!-- more -->

## 基础知识

### 功能简介

Kibana 是一个开源的分析和可视化平台，设计用于和Elasticsearch一起工作。Kibana来搜索，查看，并和存储在Elasticsearch索引中的数据进行交互。可以轻松地执行高级数据分析，并且以各种图标、表格和地图的形式可视化数据。Kibana使得理解大量数据变得很容易。它简单的、基于浏览器的界面使你能够快速创建和共享动态仪表板，实时显示Elasticsearch查询的变化。

![kabina](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/kabina.jpg)



**运行环境**

```
安装java8环境
apt install openjdk-8-jdk
检查效果
java -version
```





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
apt install kibana
```



**软件包安装**

```sh
wget https://artifacts.elastic.co/downloads/kibana/kibana-7.14.0-amd64.deb
wget https://artifacts.elastic.co/downloads/kibana/kibana-7.14.0-
amd64.deb.sha512
shasum -a 512 -c kibana-7.14.0-amd64.deb.sha512
dpkg -i kibana-7.14.0-amd64.deb
```



**配置查看**

```bash
# dpkg -L kibana
/.
/etc
/etc/default
/etc/default/kibana
/etc/init.d
/etc/init.d/kibana
/etc/kibana kibana家目录
/etc/kibana/kibana.yml
/etc/kibana/node.options
/etc/systemd
/etc/systemd/system
/etc/systemd/system/kibana.service 服务启动文件
/usr
/usr/share
/usr/share/kibana
...
/usr/share/kibana/bin 执行命令目录文件
/usr/share/kibana/bin/kibana-encryption-keys
/usr/share/kibana/bin/kibana-plugin
/usr/share/kibana/bin/kibana
/usr/share/kibana/bin/kibana-keystore
```





**定制环境变量**

```sh
echo 'export PATH=/usr/share/kibana/bin:$PATH' > /etc/profile.d/kibana.sh
source /etc/profile.d/kibana.sh
```



### 简单实践

命令格式

```basic
修改配置文件
# vim /etc/kibana/kibana.yml
# 设定kibana对外开放的通信端口
server.port: 5601
# 设定可以访问kibana的主机地址
server.host: "0.0.0.0"
# 设定elasticsearch的主机地址
elasticsearch.hosts: ["http://192.168.8.12:9200"]
# 设定kibana的数据索引
kibana.index: ".kibana"
# 设定中文显示格式
i18n.locale: "zh-CN"
```







**启动服务**

```basic
启动服务
systemctl start kibana.service
systemctl status kibana.service

查看端口
# netstat -tnulp | egrep 'Add|node'
Proto Recv-Q Send-Q Local Address Foreign Address State
PID/Program name
tcp 0 0 0.0.0.0:5601 0.0.0.0:* LISTEN
31992/node

结果显示：
kibana默认端口是 5601
```



**浏览器查看效果** http://192.168.10.108:5601



![ka](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/ka.jpg)



kibana默认帮我们提供了非常多的示例数据

![ka1](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/ka1.jpg)



---

**小结：**

- 定位
  	数据的可视化平台
  
- 部署
  	安装软件
  	配置文件
  	启动查看效果
  
- 注意：
  	默认的地图虽然支持中文，但是国家地图有问题，
  
- 核心点：
  	1 数据采集
  	2 数据可视化
  
  
