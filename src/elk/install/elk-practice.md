---
author: Ryan
title: 等保2.0项目-日志收集实践
date: 2021-10-21
categories: ElasticStack
---


 在等保2.0 测评单位对业务系统进行评测后，给出整改意见中提出：

应启用安全审计功能，审计覆盖到每个用户，对重要的用户行为和重要安全事件进行审计；建议对启用安全审计功能，对所有用户操作行为及系统安全事件进行审计记录。

应对审计记录进行保护，定期备份，避免受到未预期的删除、修改或覆盖等。建议定期对审计记录进行备份，保证审计记录不会受到未预期的删除、修改或覆盖。

<!-- more -->



# 搭建ELK平台收集各系统日志



## 应用场景



要收集的设备清单如下：

- 深信服防火墙设备
- H3C 核心交换机
- 深信服SSL VPN 设备
- 业务通用服务器



### 思路



因为日志量不大所以使用四台服务器搭建ELK，部署情况如下：

```
192.168.10.106  部署ES + head 插件 用来处理日志数据

192.168.10.107  部署Logstash 收集filebeat数据并将数据传送给ES 

192.168.10.108  部署Kibana 将数据从ES中读取出进行可视化展示

192.168.10.109  部署rsyslog + filebeat 收集汇总各系统日志文件并将日志文件传送给logstash

系统版本为：Ubuntu 20.04.3 LTS 
ELK组件版本：7.14.x
```





## Rsyslog 部署



rsyslog用于收集对端系统的日志推送



```sh
#替换源
vim /etc/apt/sources.list
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse

deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse

#安装rsyslog
sudo apt-get install rsyslog

#编辑配置文件
vim /etc/rsyslog.conf

#设置日志收集目录，以主机名+IP+时间的格式 并排除本机的日志
$template Remote,"/var/log/attack-syslog/%hostname%_%fromhost-ip%/log_%$YEAR%-%$MONTH%-%$DAY%.log"   #定义模板，接受日志文件路径，区分了不同主机的日志                                   
:fromhost-ip, !isequal, "127.0.0.1" ?Remote       # 过滤server 本机的日志

#开启udp tcp 传输
$ModLoad imudp
$UDPServerRun 514
 
$ModLoad imtcp
$InputTCPServerRun 514

#然后,以root身份修改rsyslog启动配置文件(Ubuntu在/etc/default/rsyslog下)
# Options to syslogd
# -m 0 disables 'MARK' messages.
# -r enables logging from remote machines
# -x disables DNS lookups on messages recieved with -r //禁用掉dns记录项不够齐全或其他的日志中心的日志

# See syslogd(8) for more details
# 
SYSLOGD_OPTIONS="-r" 
#SYSLOGD_OPTIONS="-r -x -m 180" 
# 加 -r 选项以允许接受外来日志消息
# 加 -x 禁用掉dns记录项不够齐全或其他的日志中心的日志# 
# 加 -m 修改syslog的内部mark消息写入间隔时间（0为关闭）。例如-m 180，表示每隔180分钟（每天8次）在日志文件里增加一行时间戳消息
# 加 -h 默认情况下，syslog不会发送从远端接受过来的消息到其他主机，而使用该选项，则把该开关打开，所有接受到的信息都可根据syslog.conf中定义的@主机转发过去。
# Options to klogd
# -2 prints all kernel oops messages twice; once for klogd to decode, and
#    once for processing with 'ksymoops'
# -x disables all klogd processing of oops messages entirely
# See klogd(8) for more detailsKLOGD_OPTIONS="-x"
#SYSLOG_UMASK=077# set this to a umask value to use for all log files as in umask(1).
# By default, all permissions are removed for "group" and "other". 

#重启rsyslog
service rsyslog restart

#查看其是否启动
netstat -nultp | grep 514

#验证
#在rsyslog server端,用tail动态查看
tail -f /var/log/host/'hostname'_'ip'/log_'y'_'m'_'d'.log
```



![rsyslog](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/rsyslog.png)



### 对端深信服防火墙配置

`版本号：AF 8.0.45`

在监控—> 日志—>设置 中开启行为审计日志选项，配置对端syslog服务器地址和端口号。

![image-20211119143240455](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119143240455.png)

![image-20211119142929809](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119142929809.png)



### 对端深信服SSL VPN配置

`版本号： SSL 7.6.9R1`

在系统设置—> 系统配置—> 数据中心中启用Syslog 设置添加对端服务器地址

![image-20211119143328696](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119143328696.png)

![image-20211119143710182](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119143710182.png)

点击测试连通性测试对端服务器连接状况

![image-20211119143907307](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119143907307.png)

设置日志输出类型，注意根据实际需求选择相应日志等级，避免不必要的资源浪费。



### 对端H3C核心交换机配置

`设备型号：H3C S7503E-M `

[详情见交换机配置手册-15-信息中心配置-新华三集团-H3C](https://www.h3c.com/cn/d_202109/1466386_30005_0.htm)

```
[Intranet-CSW-S7503E]info-center enable 
#开启信息中心
[Intranet-CSW-S7503E]info-center loghost 192.168.10.109 port 514 facility 
local5
#配置发送日志信息到IP地址为192.168.10.109端口为514的日志主机，日志主机记录工具为local5。
[Intranet-CSW-S7503E]info-center source default loghost deny
# 关闭loghost方向所有模块日志信息的输出开关。
[Intranet-CSW-S7503E]info-center source ftp loghost level notification
# 配置输出规则：允许FTP模块的、等级高于等于notification的日志信息输出到日志主机（注意：允许输出信息的模块由产品决定）。
```

![image-20211119144942011](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119144942011.png)



由于系统对各方向允许输出的日志信息的缺省情况不一样，所以配置前必须将所有模块的需求方向（本例为loghost）上日志信息的输出开关关闭，再根据当前的需求配置输出规则，以免输出太多不需要的信息。

![image-20211119150315381](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119150315381.png)





完成对端设备日志的推送设置后，相关日志保存在109本地服务器对应目录下的。



![image-20211119151217426](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119151217426.png)

可见 防火墙日志中记录了之前在服务器中指定收集的日志类型

![image-20211119151333025](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119151333025.png)



至此rsyslog收集工作结束



## Filebeat 组件配置



**环境变量配置**

```bash
vim /etc/profile.d/filebeat.sh
#/bin/bash
export PATH=/usr/share/filebeat/bin:$PATH
```



经过配置rsyslog服务，已经收集到了各业务系统的日志文件，下一步工作就是收集到的文件通过ELK中的Filebeat组件对日志进行初步加工。

```yaml
#编辑配置文件
vim /etc/filebeat/filebeat.yml


#filebeat inputs 部分 设置日志的所在目录位置
#一定要注意格式 特别是插件前后顺序和-的位置。
#经过实践踩坑大部分问题都是因为格式导致的。 

filebeat.inputs:

- type: log

  # Change to true to enable this input configuration.
  enabled: true

  # Paths that should be crawled and fetched. Glob based paths.
  paths:
    - /var/log/attack-syslog/localhost_10.123.0.2/*.log
  fields:
   logtype1: "sangfor-af"
    #- c:\programdata\elasticsearch\logs\*

- type: log
  enabled: true
  paths:
    - /var/log/attack-syslog/sslvpn_10.123.0.27/*.log
  fields:
   logtype1: "sangfor-sslvpn"

- type: log
  enabled: true
  paths:
    - /var/log/attack-syslog/sslvpn_10.123.0.28/*.log
  fields:
   logtype1: "sangfor-sslvpn"

- type: log
  enabled: true
  paths:
    - /var/log/attack-syslog/2021_192.168.10.254/*.log
  fields:
   logtype1: "hc-nwhx"

#抓取数据并对日志进行打标签，后续通过标签建立独自的索引



#Outputs部分
#注释 Elasticsearch Output 配置Logstash Output
output.logstash:
  # The Logstash hosts
  hosts: ["192.168.10.107:5044"]

#可选项
  # Optional SSL. By default is off.
  # List of root certificates for HTTPS server verifications
  #ssl.certificate_authorities: ["/etc/pki/root/ca.pem"]

  # Certificate for SSL client authentication
  #ssl.certificate: "/etc/pki/client/cert.pem"

  # Client Certificate Key
  #ssl.key: "/etc/pki/client/cert.key"
  
  #启动
  systemctl start filebeat
```



### Filebeat 组件排错方法

   在发生错误时，服务仍在运行状态时使用`systemctl status filebeat` 能看到的错误信息很少，通过前端手动指定运行日志的方式更易于问题的定位。

```sh
filebeat -c /etc/filebeat/filebeat.yml -path.home /usr/share/filebeat -path.config /etc/filebeat -path.data /var/lib/filebeat -path.logs /var/log/filebeat
```

![image-20211119155142314](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119155142314.png)







### Logstash 组件配置





**环境变量定制**

```bash
echo 'export PATH=/usr/share/logstash/bin:$PATH' > /etc/profile.d/logstash.sh
source /etc/profile.d/logstash.sh
```



**生成配置文件**

以命令行的方式来进行启动太繁琐，我们最好还是以配置文件的方式来进行服务的启动管理，对于 logstash来说，它提供好了一个专门用于生成配置文件的命令 system-install，我们只需要按照既定的 配置文件规则，定制应用配置，最后执行该命令，即可实现服务脚本的配置。

```bash
#进入应用目录
cd /etc/logstash
#编辑启动参数文件
# vim startup.options
...
# Arguments to pass to logstash
LS_OPTS="--path.settings ${LS_SETTINGS_DIR} -f /etc/logstash/conf.d"
 #注意： -f 指定的是 logstash的应用配置文件(比如 logstash.conf)存放到的目录
```





```shell
#以root用户执行下面的命令
system-install
#查看生成的服务配置文件
# ls /etc/systemd/system/logstash.service
/etc/systemd/system/logstash.service
#查看服务配置文件内容
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

#注意：
# 由于服务启动的时候，用户名和用户组都是 logstash ，所以，我们采集数据的文件必须是具备查看的
#权限
```





日志在经过filebeat组件的初步改造，将各系统收集到的日志打上了type类型，Logstash根据类型创建不同的索引文件。这里通过grok插件对日志进行了字段自定义改造。以便后续在kibana中更好的绘图展示。[详情见 grok插件用法](http://localhost:4000/2021/10/21/Grok-patterns/)

```bash
vim /etc/logstash/conf.d/logstash.conf

#input 部分 
#读取filebeat主机推送到5044端口的数据

input {
beats {
port => 5044
}
}

filter {
    grok {
        match => {
            "message" => "%{TIMESTAMP_ISO8601:times} %{HOSTNAME:hosts} %{USERNAME:logtype}: message repeated %{INT:repetition_times} times: \[ 日志类型:(?<Operation_type>(?<=)(.{4})), (?<Operation_typ1e>(?<=)(.{2})):%{USER:user}\(%{HOSTNAME:connection_method}\)\(%{HOSTNAME:connection_method}\), IP地址:%{IPV4:connection_ip}, 操作对象:%{GREEDYDATA:Action_log}, 操作类型:(?<behaviour_t>(?<=)(.{4})), 描述:(?<Behavior_performance>(?<=)(.{4}))\]"
        }
    }
}

#output 部分


#注意if后需要加 [fields]并添加之前filebeat中定制的字段[logtype1]，经测试直接加logtype1不好使。
output {
if [fields][logtype1] == "sangfor-af" {
elasticsearch {
hosts => ["http://localhost:9200"]
index => "sangfor-af01-%{+YYYY.MM.dd}"
}
}

if [fields][logtype1] == "hc-nwhx" {
elasticsearch {
hosts => ["http://localhost:9200"]
index => "hc-nwhx-%{+YYYY.MM.dd}"
}
}

if [fields][logtype1] == "sangfor-sslvpn" {
elasticsearch {
hosts => ["http://localhost:9200"]
index => "sangfor-sslvpn-%{+YYYY.MM.dd}"
}
}
}
```



**启动服务**

```shell
重载服务
systemctl daemon-reload
启动服务
systemctl start logstash.service
systemctl status logstash.service
查看效果
# netstat -tnulp | egrep 'Add|java'
Proto Recv-Q Send-Q Local Address     Foreign Address   State       PID/Program 
name  
tcp6       0     0 127.0.0.1:9600   :::*               LISTEN     88794/java 
       
tcp6       0     0 :::9200           :::*               LISTEN     87210/java 
       
tcp6       0     0 :::9300           :::*               LISTEN     87210/java

结果显示：
 logstash的默认端口是 9600 

```



### logstash 排错

```sh
#查看日志：
tail -f /var/log/logstash/logstash-plain.log
 
#可以看到默认报错：
 [2021-08-15T18:44:08,643][WARN ]
[filewatch.tailmode.handlers.createinitial][main]
[cc34021140e2525e95d5755b6135b9801f3595239bcda82a1cca03a1d0f857d6] failed to 
open file {:path=>"/var/log/syslog", :exception=>Errno::EACCES, 
:message=>"Permission denied - /var/log/syslog"}
 
 
#临时增加一个 logstash 允许访问的权限
chown logstash.logstash /var/log/syslog
```



**通过head插件查看数据传递效果**

![image-20211119161952112](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119161952112.png)

![SSL VPN日志索引](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119162040416.png)



![防火墙日志索引](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119162131164.png)



![交换机日志索引](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211119162152721.png)



