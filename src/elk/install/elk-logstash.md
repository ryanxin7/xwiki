---
author: Ryan
title: ELK组件-Logstash （三）
date: 2021-10-03
categories: ElasticStack
---


**Logstash** 能够动态地采集、转换和传输数据，不受格式或复杂度的影响。Logstash 采用可插拔框架，拥有 200 多个插件。您可以将不同的输入选择、过滤器和输出选择混合搭配、精心安排，让它们在管道中和谐地运行。利用 Grok 从非结构化数据中派生出结构，从 IP 地址解码出地理坐标，匿名化或排除敏感字段，并简化整体处理过程。Logstash 提供[众多输出选择](https://www.elastic.co/guide/en/logstash/current/output-plugins.html)，您可以将数据发送到您要指定的地方，并且能够灵活地解锁众多下游用例。

<!-- more -->

## 基础知识

### 功能简介

logstash 就是借助于大量的功能插件，实现从数据源获取数据，然后将数据传输到elasticsearch。

![ELK-logstash](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/ELK-logstash.jpg)





在图中我们可以明显看到，logstash组件至少包含两个插件：input和output，这两个主要用于信息的接入和输出。

**注意：**
logstash 软件本身无序安装，它仅仅是一个软件运行命令程序，但是该软件的运行依赖于java环境



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
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee –a /etc/apt/sources.list.d/elastic-7.x.list
apt update

安装软件
apt install logstash
```



**软件包安装**

```sh
wget https://artifacts.elastic.co/downloads/logstash/logstash-7.14.0-amd64.deb
wget https://artifacts.elastic.co/downloads/logstash/logstash-7.14.0-
amd64.deb.sha512
shasum -a 512 -c logstash-7.14.0-amd64.deb.sha512
dpkg -i logstash-7.14.0-amd64.deb
```



**配置查看**

```bash
dpkg -L logstash
/.
/usr
/usr/share
/usr/share/logstash
...
/etc
/etc/logstash
/etc/logstash/conf.d
/etc/logstash/log4j2.properties
/etc/logstash/startup.options 服务启动环境变量文件
/etc/logstash/jvm.options jvm相关配置
/etc/logstash/logstash.yml 服务配置文件
/etc/logstash/logstash-sample.conf 应用配置文件模板
/etc/logstash/pipelines.yml
...
/usr/share/logstash/bin
/usr/share/logstash/bin/benchmark.bat
/usr/share/logstash/bin/benchmark.sh
/usr/share/logstash/bin/cpdump
/usr/share/logstash/bin/dependencies-report
/usr/share/logstash/bin/ingest-convert.bat
/usr/share/logstash/bin/ingest-convert.sh
/usr/share/logstash/bin/logstash
/usr/share/logstash/bin/logstash-keystore
/usr/share/logstash/bin/logstash-keystore.bat
/usr/share/logstash/bin/logstash-plugin
/usr/share/logstash/bin/logstash-plugin.bat
/usr/share/logstash/bin/logstash.bat
/usr/share/logstash/bin/logstash.lib.sh
/usr/share/logstash/bin/pqcheck
/usr/share/logstash/bin/pqcheck.bat
/usr/share/logstash/bin/pqrepair
/usr/share/logstash/bin/pqrepair.bat
/usr/share/logstash/bin/ruby
/usr/share/logstash/bin/setup.bat
/usr/share/logstash/bin/system-install 生成系统管理配置文件
...
```





**定制环境变量**

```sh
echo 'export PATH=/usr/share/logstash/bin:$PATH' > /etc/profile.d/logstash.sh
source /etc/profile.d/logstash.sh
```



### 简单实践

命令格式

```basic
logstash -e '启动参数'
启动参数：
input {
stdin {}
}
output {
stdout {}
}

参数解析：
input {} 用于接受信息的输入
output {} 用于对内部的数据输出
stdin {} 表示屏幕上的标准输入
stdout {} 表示屏幕的标准输出
```





**实践1 - 简单的输入输出测试**

```basic
# logstash -e 'input { stdin { } } output { stdout {} }'
...
[INFO ] 2021-08-15 18:03:54.011 [Api Webserver] agent - Successfully started
Logstash API endpoint {:port=>9600}
# 看到上面准备好的信息后，接下来我们在屏幕上随便输入一段信息

nihao logstash
# 信息输入完毕后，他会自动格式化的输出一些内容

{
"host" => "ubuntu", # 当前的主机信息
"@timestamp" => 2021-08-15T10:04:32.873Z, # 该条信息的时间戳
"message" => "nihao logstash", # 我们输入的内容
"@version" => "1" # 版本信息
}

结果展示：
信息展示出来的内容，其实包含两部分： index(搜索数据时候的索引)和value(具体的数据内容)
```



**实践2 - 信息传递到es**

```
配置logstash将信息输出到es中
# logstash -e 'input { stdin{} } output { elasticsearch { hosts =>
["192.168.10.106:9200"] index => "message" } }'
...
[2021-08-15 18:07:51.678][INFO ][logstash.agent ] Successfully started
Logstash API endpoint {:port=>9600}
# 看到上面准备好的信息后，接下来我们在屏幕上随便输入一段信息
hello elasticsearch


     结果展示：
           因为我们将信息输入到es中了，所以这里看不到信息输入



es检查查看效果
# curl 192.168.10.106:9200/_cat/indices
green open message x3JlhXwBQsmGYITwOnlWEw 1 1 1 0 10.8kb 5.3kb


# curl 192.168.10.106:9200/message?pretty
{

"message" : {
...,
        "number_of_shards" : "1",
        "provided_name" : "message",
        "creation_date" : "1629022162762",
        "number_of_replicas" : "1",
        "uuid" : "x3JlhXwBQsmGYITwOnlWEw",
        "version" : {
        "created" : "7140099"
          }
        }
      }
   }
}

查看内容信息
# curl 192.168.10.106:9200/message/_search?pretty
{
"took" : 88,
"timed_out" : false,
"_shards" : {
"total" : 1,
"successful" : 1,
"skipped" : 0,
"failed" : 0
},
"hits" : {
"total" : {
"value" : 1,
"relation" : "eq"
},
"max_score" : 1.0,
"hits" : [
{
"_index" : "message",
"_type" : "_doc",
"_id" : "3UZJSXsBvfqpwa_-kJ8V",
"_score" : 1.0,
"_source" : {
"host" : "python-auto",
"@timestamp" : "2021-08-15T10:09:22.359Z",
"message" : "hello elasticsearch",
"@version" : "1"
              }
             }
           ]
         }
       }
```



**实践3 - 读取日志文件到es**

```
模块简介
    logstash的信息采集模块支持file模块，可以通过指定日志文件，直接从文件中读取相关信息。

参考资料：
    https://www.elastic.co/guide/en/logstash/7.14/plugins-inputs-file.html

基本属性：
    path 指定文件路径
    start_position 设定从文件的那个位置开始读取，可选值 -- beginning, end(默认)
    type 传递信息的时候，增加一个额外的属性字段

配置示例：
    file {
       path => "/var/log/syslog"
       start_position => "beginning"
       type => "elasticsearch"
}

从系统日志文件中读取信息，输出到es中
# logstash -e 'input { file{path => "/var/log/syslog" start_position =>
"beginning" type => "elasticsearch"} } output { elasticsearch { hosts =>
["192.168.10.106"] index => "message" } }'
...
[INFO ] 2021-08-15 18:32:50.789 [[main]-pipeline-manager] elasticsearch - New
Elasticsearch output {:class=>"LogStash::Outputs::ElasticSearch", :hosts=>
["//192.168.8.12:9200"]}
...
[INFO ] 2021-08-15 18:32:54.992 [[main]-pipeline-manager] file - No sincedb_path
set, generating one based on the "path" setting
{:sincedb_path=>"/usr/share/logstash/data/plugins/inputs/file/.sincedb_f5fdf6ea0
ea92860c6a6b2b354bfcbbc", :path=>["/var/log/syslog"]}


在head插件中查看日志效果
```





### 服务文件方式

  生成配置文件

​    以命令行的方式来进行启动太繁琐，我们最好还是以配置文件的方式来进行服务的启动管理，对于
logstash来说，它提供好了一个专门用于生成配置文件的命令 `system-install`，我们只需要按照既定的
配置文件规则，定制应用配置，最后执行该命令，即可实现服务脚本的配置。





**服务启动参数**

```
进入应用目录
cd /etc/logstash
编辑启动参数文件

# vim startup.options
...
# Arguments to pass to logstash
LS_OPTS="--path.settings ${LS_SETTINGS_DIR} -f /etc/logstash/conf.d"
     注意： -f 指定的是 logstash的应用配置文件(比如 logstash.conf)存放到的目录
```



**定制配置文件信息输入到es的配置文件**

```basic
生成配置文件
cp logstash-sample.conf conf.d/logstash.conf


修改配置文件 conf.d/logstash.conf
# Sample Logstash configuration for creating a simple
# Beats -> Logstash -> Elasticsearch pipeline.


#输入部分
input {
# beats {
# port => 5044
# }

#插件
file {
path => ["/var/log/syslog"]
start_position => "beginning"
type => "elasticsearch"
}
}

#输出部分
output {
elasticsearch {
hosts => ["http://192.168.8.12:9200"]
index => "logstash-test-%{+YYYY.MM.dd}"
}
}
```



**生成配置文件**

```basic
以root用户执行下面的命令
system-install


查看生成的服务配置文件
# ls /etc/systemd/system/logstash.service
/etc/systemd/system/logstash.service


查看服务配置文件内容
# cat /etc/systemd/system/logstash.service
[Unit]
Description=logstash
[Service]
Type=simple
User=logstash
Group=logstash
# Load env vars from /etc/default/ and /etc/sysconfig/ if they exist.
# Prefixing the path with '-' makes it try to load, but if the file doesn't
# exist, it continues onward.
EnvironmentFile=-/etc/default/logstash
EnvironmentFile=-/etc/sysconfig/logstash
ExecStart=/usr/share/logstash/bin/logstash "--path.settings" "/etc/logstash" "-
f" "/etc/logstash/conf.d"
Restart=always
WorkingDirectory=/
Nice=19
LimitNOFILE=16384
# When stopping, how long to wait before giving up and sending SIGKILL?
# Keep in mind that SIGKILL on a process can cause data loss.
TimeoutStopSec=infinity
[Install]
WantedBy=multi-user.target

注意：
由于服务启动的时候，用户名和用户组都是 logstash ，所以，我们采集数据的文件必须是具备查看的权限
```





**启动服务**

```basic
重载服务
systemctl daemon-reload


启动服务
systemctl start logstash.service
systemctl status logstash.service


查看效果
# netstat -tnulp | egrep 'Add|java'
Proto Recv-Q Send-Q Local Address Foreign Address State PID/Program
name
tcp6 0 0 127.0.0.1:9600 :::* LISTEN 88794/java
tcp6 0 0 :::9200 :::* LISTEN 87210/java
tcp6 0 0 :::9300 :::* LISTEN 87210/java


结果显示：
logstash的默认端口是 9600


查看日志
tail -f /var/log/logstash/logstash-plain.log


可以看到默认报错：
[2021-08-15T18:44:08,643][WARN ]
[filewatch.tailmode.handlers.createinitial][main]
[cc34021140e2525e95d5755b6135b9801f3595239bcda82a1cca03a1d0f857d6] failed to
open file {:path=>"/var/log/syslog", :exception=>Errno::EACCES,
:message=>"Permission denied - /var/log/syslog"}


临时增加一个 logstash 允许访问的权限
chown logstash.logstash /var/log/syslog
```



**通过head插件查看数据传递效果**



---



**小结：**

- 定位
  	数据的采集和传递
- 组成：
  	核心：input - filter - output
  	辅助：codec 
- 特点：
  	每个部分都有对应业务场景的插件来实现功能



- **守护进程方式运行logstash**
  定制服务的启动参数
  system-install 生成服务启动文件
  应用服务启动文件



- **临时测试文件的方式**
  logstash -f xxx.conf


