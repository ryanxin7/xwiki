---
author: Ryan
title: ELK 综合实践-收集Nignx的日志数据 （五）
date: 2021-10-06
categories: ElasticStack
---


# ELK 综合实践



## 实践案例

项目实现效果图

![image-20211116154018274](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116154018274.png)



### 需求简介

 在我们的项目中，日志信息会输出到定制的目录里面了，那么接下来，我们就以nignx的日志数据为对象，使用filebeat来获取这些日志，将其输入到logstash中，logstash接收到数据后，定制显示格式，将其输入到elasticsearch中，kibana从elasticsearch中获取数据，并展示到当前界面。





### 流程分析

1. 确定nginx的日志文件 
2. filebeat 读取本机的nginx日志，并传输到 logstash 
3. logstash 接收到数据后，定制输出格式，将数据转交给 elasticsearch 
4. kibana 根据定制的索引名称，从 elasticsearch中获取数据。



**关键点分析**

**准备工作**：

-  nginx 日志文件径在`/var/log/nginx/access.log`，我们来获取.log格式文件数据

-  filebeat数据收集 

     基于默认的 input 方式确定数据文件，output 方式选择 logstash 

     注意： input 内部的 nabled 必须开启

  

-  logstash传输 

    基于 input 属性获取 filebeat 的内容，基于output属性将数据发送给es 

  

- kibana展示 

    基于索引名称到 elasticsearch 获取数据，然后在discover中确认数据



**实践步骤**

1. 环境还原 清空filebeat程序 关闭kibana程序 清空elasticsearch索引 
2. 定制filebeat  编写配置文件 启动filebeat 
3. 定制logstash  定制logstash文件 启动logstash 
4. 定制kibana 配置查询索引 验证效果





### 项目实践

环境还原

```basic
清除所有的index

for index in $(curl -s http://192.168.8.12:9200/_cat/indices | awk '{print 
$3}')
do
curl -XDELETE 192.168.8.12:9200/$index
done

filebeat主机安装nginx
apt install -y nginx

关闭所有服务
systemctl stop logstash
systemctl stop filebeat
systemctl stop kibana
```



**编写 filebeat 配置文件**

```basic
定制配置文件
# cd /etc/filebeat/
# cat filebeat.yaml 
filebeat.inputs:
- type: log
 paths:
   - /var/log/nginx/*.log
output.logstash:
 hosts: ["192.168.8.13:5044"]
启动filebeat
systemctl start filebeat
```



**编写 logstash 配置文件**

```basic
# cd /etc/logstash/conf.d
# vim logstash.conf
input {
 beats {
   port => 5044
 }
}
output{
 elasticsearch {
   hosts => ["192.168.8.12:9200"]
   index => "nginx-%{+YYYY.MM.dd}"
 }
}
重启logstash
systemctl start logstash
检查效果
curl 192.168.8.12:9200/_cat/indices 
查看日志
tail -f /var/log/logstash/logstash-plain.log
```



**启动 kibana**

```shell
systemctl start kibana
netstat -tnulp
```



浏览器登录到 192.168.8.14:5601，点击左上角的logo图标，进入到home页面



通过以下方式进入：

1.  选择 左边栏的 Stack Management  
2. 点击 kibana 栏的 索引模式

![image-20211116155122354](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155122354.png)

**点击 创建索引模式** 

![image-20211116155136008](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155136008.png)

在索引模式中，输入正则表达式，看是否能够匹配现有的日志，匹配到的话，点击下一步

![image-20211116155146517](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155146517.png)

时间字段选择 默认的 @timestamp 字段，然后点击右下角的 创建索引模式

![image-20211116155156697](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155156697.png)

我们收集到的数据中，包含58个字段，当我们点击某些属性的时候，还会显示简单的排序，到此为止，我们的kibana从elasticsearch中获取数据就配置完毕了



点击左边栏的第一个"Discover"按钮,点击"Add ﬁlter"的下拉框，选择nginx-*索引名，在"Refresh"右侧选择日志的时间范围，就可以实时的查看到说有数据的获取效果

![image-20211116155212628](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155212628.png)





**界面解析**

![image-20211116155244331](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155244331.png)

Filters 部分的规则，其实就是日志中的键名是否包含某些关键信息，等同于 KQL的示例 message is 200。

![image-20211116155305504](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155305504.png)

点开每条记录旁边的">"表示查看该条日志的具体信息

![image-20211116155312321](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211116155312321.png)

