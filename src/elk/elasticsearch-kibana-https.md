---
author: Ryan
title: 2023-10月最新8.10.4版本ELK集群服务搭建 HTTPS
date: 2023-10-23
categories: ElasticStack
---


## 一、安装Elasticsearch

下载地址：https://www.elastic.co/cn/downloads/elasticsearch

### 1.1 解压软件包

```bash
root@eslg01:/data# tar xf /tmp/elasticsearch-8.10.4-linux-x86_64.tar.gz  -C /data/
root@eslg01:/data# chown  -R essl.essl /data/elasticsearch-8.10.4/
```



### 1.2 启动服务

```bash
#启动
essl@eslg01:/usr/local/es/elasticsearch-8.10.4/bin$ ./elasticsearch
```



```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Elasticsearch security features have been automatically configured!
✅ Authentication is enabled and cluster connections are encrypted.

ℹ️  Password for the elastic user (reset with `bin/elasticsearch-reset-password -u elastic`):
  D0lt4vtzMZCcbcEoHl3g

ℹ️  HTTP CA certificate SHA-256 fingerprint:
  413a6b85658e07dcabc174996e6fa8071eaf9e70340f4f10082ee9cae5a5b485

ℹ️  Configure Kibana to use this cluster:
• Run Kibana and click the configuration link in the terminal when Kibana starts.
• Copy the following enrollment token and paste it into Kibana in your browser (valid for the next 30 minutes):
  eyJ2ZXIiOiI4LjEwLjQiLCJhZHIiOlsiMTkyLjE2OC4xMC4xMDc6OTIwMCJdLCJmZ3IiOiI0MTNhNmI4NTY1OGUwN2RjYWJjMTc0OTk2ZTZmYTgwNzFlYWY5ZTcwMzQwZjRmMTAwODJlZTljYWU1YTViNDg1Iiwia2V5IjoibGZIRWFZc0J1T0FwSVJTODB0dGs6bFhJd2lwSDlUa3V0VUd6R1cwUC01USJ9

ℹ️  Configure other nodes to join this cluster:
• On this node:
  ⁃ Create an enrollment token with `bin/elasticsearch-create-enrollment-token -s node`.
  ⁃ Uncomment the transport.host setting at the end of config/elasticsearch.yml.
  ⁃ Restart Elasticsearch.
• On other nodes:
  ⁃ Start Elasticsearch with `bin/elasticsearch --enrollment-token <token>`, using the enrollment token that you generated.

```



### 1.3 自动生成CA证书

这一步的目的是生成Https配置

```bash
#已经生成CA了
essl@eslg01:/data/elasticsearch-8.10.4/config/certs$ ls -l
total 24
-rw-rw---- 1 essl essl  1915 Oct 26 02:15 http_ca.crt
-rw-rw---- 1 essl essl 10029 Oct 26 02:15 http.p12
-rw-rw---- 1 essl essl  5822 Oct 26 02:15 transport.p12
```



### 1.4 创建Elasticsearch数据目录

```bash
essl@eslg01:/data/elasticsearch-8.10.4/config$ sudo mkdir -p /data/es/data     
essl@eslg01:/data/elasticsearch-8.10.4/config$ sudo mkdir -p /data/es/logs
```



### 1.5 创建私有CA证书

```bash
#CA
essl@eslg01:/data/elasticsearch-8.10.4/bin$ ./elasticsearch-certutil ca --pem --out /data/elasticsearch-8.10.4/config/certs/ca.zip

warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
This tool assists you in the generation of X.509 certificates and certificate
signing requests for use with SSL/TLS in the Elastic stack.

The 'ca' mode generates a new 'certificate authority'
This will create a new X.509 certificate and private key that can be used
to sign certificate when running in 'cert' mode.

Use the 'ca-dn' option if you wish to configure the 'distinguished name'
of the certificate authority

By default the 'ca' mode produces a single PKCS#12 output file which holds:
    * The CA certificate
    * The CA's private key

If you elect to generate PEM format certificates (the -pem option), then the out                                                                                                         put will
be a zip file containing individual files for the CA certificate and private key

```

```bash
essl@eslg01:/data/elasticsearch-8.10.4/bin$ cd ../config/certs/
essl@eslg01:/data/elasticsearch-8.10.4/config/certs$ ls
ca.zip  http_ca.crt  http.p12  transport.p12
#解压
essl@eslg01:/data/elasticsearch-8.10.4/config/certs$ unzip ca.zip
Archive:  ca.zip
   creating: ca/
  inflating: ca/ca.crt
  inflating: ca/ca.key
```





### 1.6 签发Elasticserch节点证书

```bash
#证书
./elasticsearch-certutil cert \
--out /data/elasticsearch-8.10.4/config/certs/elastic.zip \
--name elastic \
--ca-cert /data/elasticsearch-8.10.4/config/certs/ca/ca.crt \
--ca-key /data/elasticsearch-8.10.4/config/certs/ca/ca.key \
--dns elastic.xinn.cc \
--ip 192.168.10.107 \
--pem
```





```bash
root@eslg01:/data/elasticsearch-8.10.4/bin# ./elasticsearch-certutil cert \
> --out /data/elasticsearch-8.10.4/config/certs/elastic.zip \
> --name elastic \
> --ca-cert /data/elasticsearch-8.10.4/config/certs/ca/ca.crt \
> --ca-key /data/elasticsearch-8.10.4/config/certs/ca/ca.key \
> --dns elastic.xinn.cc \
> --ip 192.168.10.107 \
> --pem
warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
This tool assists you in the generation of X.509 certificates and certificate
signing requests for use with SSL/TLS in the Elastic stack.

The 'cert' mode generates X.509 certificate and private keys.
    * By default, this generates a single certificate and key for use
       on a single instance.
    * The '-multiple' option will prompt you to enter details for multiple
       instances and will generate a certificate and key for each one
    * The '-in' option allows for the certificate generation to be automated by describing
       the details of each instance in a YAML file

    * An instance is any piece of the Elastic Stack that requires an SSL certificate.
      Depending on your configuration, Elasticsearch, Logstash, Kibana, and Beats
      may all require a certificate and private key.
    * The minimum required value for each instance is a name. This can simply be the
      hostname, which will be used as the Common Name of the certificate. A full
      distinguished name may also be used.
    * A filename value may be required for each instance. This is necessary when the
      name would result in an invalid file or directory name. The name provided here
      is used as the directory name (within the zip) and the prefix for the key and
      certificate files. The filename is required if you are prompted and the name
      is not displayed in the prompt.
    * IP addresses and DNS names are optional. Multiple values can be specified as a
      comma separated string. If no IP addresses or DNS names are provided, you may
      disable hostname verification in your SSL configuration.


    * All certificates generated by this tool will be signed by a certificate authority (CA)
      unless the --self-signed command line option is specified.
      The tool can automatically generate a new CA for you, or you can provide your own with
      the --ca or --ca-cert command line options.


By default the 'cert' mode produces a single PKCS#12 output file which holds:
    * The instance certificate
    * The private key for the instance certificate
    * The CA certificate

If you specify any of the following options:
    * -pem (PEM formatted output)
    * -multiple (generate multiple certificates)
    * -in (generate certificates from an input file)
then the output will be be a zip file containing individual certificate/key files


Certificates written to /data/elasticsearch-8.10.4/config/certs/elastic.zip

This file should be properly secured as it contains the private key for
your instance.
After unzipping the file, there will be a directory for each instance.
Each instance has a certificate and private key.
For each Elastic product that you wish to configure, you should copy
the certificate, key, and CA certificate to the relevant configuration directory
and then follow the SSL configuration instructions in the product guide.

For client applications, you may only need to copy the CA certificate and
configure the client to trust this certificate.
root@eslg01:/data/elasticsearch-8.10.4/bin# ls -l ../config/certs/
total 36
drwxrwxrwx 2 essl essl  4096 Oct 26 02:28 ca
-rw------- 1 essl essl  2512 Oct 26 02:26 ca.zip
-rw------- 1 root root  2577 Oct 26 02:35 elastic.zip
-rw-rw---- 1 essl essl  1915 Oct 26 02:15 http_ca.crt
-rw-rw---- 1 essl essl 10029 Oct 26 02:15 http.p12
-rw-rw---- 1 essl essl  5822 Oct 26 02:15 transport.p12
```





```bash
## 解压证书
root@eslg01:/data/elasticsearch-8.10.4/config/certs# unzip elastic.zip
Archive:  elastic.zip
   creating: elastic/
  inflating: elastic/elastic.crt
  inflating: elastic/elastic.key
root@eslg01:/data/elasticsearch-8.10.4/config/certs#
```





```bash
# 更改Elasticsearch目录所有者权限
chown -R essl.essl /data/
```



### 1.7 设置Elasticsearch 账号密码

```bash
essl@eslg01:/data/elasticsearch-8.10.4/bin$ ./elasticsearch-reset-password -i -u elastic --url https://elastic.xinn.cc:9200
warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
This tool will reset the password of the [elastic] user.
You will be prompted to enter the password.
Please confirm that you would like to continue [y/N]y


Enter password for [elastic]:
Re-enter password for [elastic]:
Password for the [elastic] user successfully reset.
```



### 1.8  测试连接Elasticsearch

```bash
#测试连接
essl@eslg01:/data/elasticsearch-8.10.4/bin$ curl -X GET -u elastic:Ceamg.com https://elastic.xinn.cc:9200/ --cacert /data/elasticsearch-8.10.4/config/certs/ca/ca.crt
{
  "name" : "eslg01",
  "cluster_name" : "log-es",
  "cluster_uuid" : "t5Bj3xfBRtS95aPSOvBT-g",
  "version" : {
    "number" : "8.10.4",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "b4a62ac808e886ff032700c391f45f1408b2538c",
    "build_date" : "2023-10-11T22:04:35.506990650Z",
    "build_snapshot" : false,
    "lucene_version" : "9.7.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```





## 二、安装Kibana 

```bash
root@eslg02:/data# tar -xf /tmp/kibana-8.10.4-linux-x86_64.tar.gz -C /data/
root@eslg02:/data# chown -R essl.essl /data
root@eslg02:/data/kibana-8.10.4# ls -l
total 1592
drwxr-xr-x   2 essl essl    4096 Oct 11 20:19 bin
drwxr-xr-x   2 essl essl    4096 Oct 11 20:18 config
drwxr-xr-x   2 essl essl    4096 Oct 11 20:18 data
-rw-r--r--   1 essl essl    3860 Oct 11 20:18 LICENSE.txt
drwxr-xr-x   2 essl essl    4096 Oct 11 20:18 logs
drwxr-xr-x   6 essl essl    4096 Oct 11 20:19 node
drwxr-xr-x 743 essl essl   20480 Oct 11 20:18 node_modules
-rw-r--r--   1 essl essl 1560199 Oct 11 20:18 NOTICE.txt
-rw-r--r--   1 essl essl     780 Oct 11 20:18 package.json
drwxr-xr-x   7 essl essl    4096 Oct 11 20:18 packages
drwxr-xr-x   2 essl essl    4096 Oct 11 20:18 plugins
-rw-r--r--   1 essl essl    3966 Oct 11 20:18 README.txt
drwxr-xr-x  11 essl essl    4096 Oct 11 20:18 src
drwxr-xr-x   4 essl essl    4096 Oct 11 20:18 x-pack

```



### 2.1 签发Kibana 证书

```bash
./elasticsearch-certutil cert \
--out /data/elasticsearch-8.10.4/config/certs/kibana.zip \
--name kibana \
--ca-cert /data/elasticsearch-8.10.4/config/certs/ca/ca.crt \
--ca-key /data/elasticsearch-8.10.4/config/certs/ca/ca.key \
--dns kibana.xinn.cc \
--ip 192.168.10.108 \
--pem
```



```bash
essl@eslg01:/data/elasticsearch-8.10.4/bin$ ./elasticsearch-certutil cert \
> --out /data/elasticsearch-8.10.4/config/certs/kibana.zip \
> --name kibana \
> --ca-cert /data/elasticsearch-8.10.4/config/certs/ca/ca.crt \
> --ca-key /data/elasticsearch-8.10.4/config/certs/ca/ca.key \
> --dns kibana.xinn.cc \
> --ip 192.168.10.108 \
> --pem
warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
This tool assists you in the generation of X.509 certificates and certificate
signing requests for use with SSL/TLS in the Elastic stack.

The 'cert' mode generates X.509 certificate and private keys.
    * By default, this generates a single certificate and key for use
       on a single instance.
    * The '-multiple' option will prompt you to enter details for multiple
       instances and will generate a certificate and key for each one
    * The '-in' option allows for the certificate generation to be automated by describing
       the details of each instance in a YAML file

    * An instance is any piece of the Elastic Stack that requires an SSL certificate.
      Depending on your configuration, Elasticsearch, Logstash, Kibana, and Beats
      may all require a certificate and private key.
    * The minimum required value for each instance is a name. This can simply be the
      hostname, which will be used as the Common Name of the certificate. A full
      distinguished name may also be used.
    * A filename value may be required for each instance. This is necessary when the
      name would result in an invalid file or directory name. The name provided here
      is used as the directory name (within the zip) and the prefix for the key and
      certificate files. The filename is required if you are prompted and the name
      is not displayed in the prompt.
    * IP addresses and DNS names are optional. Multiple values can be specified as a
      comma separated string. If no IP addresses or DNS names are provided, you may
      disable hostname verification in your SSL configuration.


    * All certificates generated by this tool will be signed by a certificate authority (CA)
      unless the --self-signed command line option is specified.
      The tool can automatically generate a new CA for you, or you can provide your own with
      the --ca or --ca-cert command line options.


By default the 'cert' mode produces a single PKCS#12 output file which holds:
    * The instance certificate
    * The private key for the instance certificate
    * The CA certificate

If you specify any of the following options:
    * -pem (PEM formatted output)
    * -multiple (generate multiple certificates)
    * -in (generate certificates from an input file)
then the output will be be a zip file containing individual certificate/key files


Certificates written to /data/elasticsearch-8.10.4/config/certs/kibana.zip

This file should be properly secured as it contains the private key for
your instance.
After unzipping the file, there will be a directory for each instance.
Each instance has a certificate and private key.
For each Elastic product that you wish to configure, you should copy
the certificate, key, and CA certificate to the relevant configuration directory
and then follow the SSL configuration instructions in the product guide.

For client applications, you may only need to copy the CA certificate and
configure the client to trust this certificate.
essl@eslg01:/data/elasticsearch-8.10.4/bin$ cd ../config/certs/
essl@eslg01:/data/elasticsearch-8.10.4/config/certs$ unzip kibana.zip
Archive:  kibana.zip
   creating: kibana/
  inflating: kibana/kibana.crt
  inflating: kibana/kibana.key

```



## 2.2 创建证书目录

```bash
root@eslg02:/data/kibana-8.10.4/config# mkdir certs/kibana.xinn.cc -p
root@eslg02:/data/kibana-8.10.4/config# mkdir certs/elastic.xinn.cc -p
```





```bash
# 拷贝证书
essl@eslg01:/data/elasticsearch-8.10.4/config/certs$ sudo scp kibana/kibana.crt 192.168.10.108:/data/kibana-8.10.4/config/certs/kibana.xinn.cc
essl@eslg01:/data/elasticsearch-8.10.4/config/certs$ sudo scp kibana/kibana.key 192.168.10.108:/data/kibana-8.10.4/config/certs/kibana.xinn.cc
essl@eslg01:/data/elasticsearch-8.10.4/config/certs$ sudo scp ca/ca.crt 192.168.10.108:/data/kibana-8.10.4/config/certs/elastic.xinn.cc
```





### 2.3 创建 Kibana Token



用于连接Elasticsearch账号认证

```bash
#kibana Token
essl@eslg01:/data/elasticsearch-8.10.4/bin$ ./elasticsearch-service-tokens create elastic/kibana kibana_token
warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
SERVICE_TOKEN elastic/kibana/kibana_token = AAEAAWVsYXN0aWMva2liYW5hL2tpYmFuYV90b2tlbjoxNnF3NmtGQ1FyZUNhTVlWWDM2ZS1B

#重启elasticsearch
essl@eslg01:/data/elasticsearch-8.10.4/bin$ ./elasticsearch
```



方式一：将token写入kibana配置文件

```bash

elasticsearch.serviceAccountToken: "AAEAAWVsYXN0aWMva2liYW5hL2tpYmFuYV90b2tlbjoxNnF3NmtGQ1FyZUNhTVlWWDM2ZS1B"
```



方式二：将token写入 kibana-keystore

```bash
essl@eslg02:/data/kibana-8.10.4/bin$ ./kibana-keystore create
Kibana is currently running with legacy OpenSSL providers enabled! For details and instructions on how to disable see https://www.elastic.co/guide/en/kibana/8.10/production.html#openssl-legacy-provider
Created Kibana keystore in /data/kibana-8.10.4/config/kibana.keystore

essl@eslg02:/data/kibana-8.10.4/bin$ ./kibana-keystore add elasticsearch.serviceAccountToken
Kibana is currently running with legacy OpenSSL providers enabled! For details and instructions on how to disable see https://www.elastic.co/guide/en/kibana/8.10/production.html#openssl-legacy-provider
Enter value for elasticsearch.serviceAccountToken: ************************************************************************

#创建后出现keystore文件
essl@eslg02:/data/kibana-8.10.4/config$ ll
total 28
drwxr-xr-x  3 essl essl 4096 Oct 26 06:06 ./
drwxr-xr-x 12 essl essl 4096 Oct 26 02:57 ../
drwxr-xr-x  4 root root 4096 Oct 26 03:06 certs/
-rw-rw-r--  1 essl essl  274 Oct 26 06:07 kibana.keystore
-rw-r--r--  1 essl essl 7785 Oct 26 03:29 kibana.yml
-rw-r--r--  1 essl essl  447 Oct 11 20:18 node.options


essl@eslg02:/data/kibana-8.10.4/config$ cat kibana.keystore
1:zmzEt7YorjSemMNLNvcvqBlqWYUQVRHQqC0EPGcmSivLig/2B/vAmleedl8HD4EO4mKj1s05E6Nlmlq+25F3SmKhepQttj3ARyBa68soysXCssoKe1rFF1mRQ0XBhvVCvfR+BmYuXORnPWnZ3QvyBrrWhOkalsmnVlipJZh7JVp1YiXFtC+rTbyunPJmmWaO/M4HuVBtPB3O8NEUhzZYwmKSNl5EzpJaus3pvnViZsvETczMSypONRhnNleViVzF3U3ADc35k7
```



```bash
sudo chown -R essl.essl /data/
```








## 三、 logstash

下载地址:https://www.elastic.co/cn/downloads/logstash




### 3.1 安装Logstash

```bash
tar -xf logstash-8.10.4-linux-x86_64.tar.gz -C /opt/

chrown -R essl.essl /opt/logstash-8.10.4/
```



### 3.2  复制证书


```bash
root@eslg01:/data/elasticsearch-8.10.4/config/certs/ca# scp ca.crt 192.168.10.109:/opt/logstash-8.10.4/config/certs/elastic.xinn.cc
ca.crt

/opt/logstash-8.10.4/config/certs/elastic.xinn.cc/ca.crt
```

### 3.2 对接 Elasticsearch 

```bash
input {
  file {
    path => ["/var/log/rsyslog/10.0.0.*/*"]
    start_position => "beginning"
    type => "server-syslog"
  }
  file {
    path => ["/var/log/rsyslog/10.1.1.*/*"]
    start_position => "beginning"
    type => "server-syslog"
  }
  file {
    path => ["/var/log/rsyslog/10.124.0.18/*"]
    start_position => "beginning"
    type => "sangfor-waf-log"
  }
  file {
    path => ["/var/log/rsyslog/10.123.0.2/*"]
    start_position => "beginning"
    type => "sangfor-af-log"
  }
  file {
    path => ["/var/log/rsyslog/192.168.*/*"]
    start_position => "beginning"
    type => "server-syslog"
  }
}

filter {
  if [type] == "sangfor-waf-log" {
    grok {
      match => {
        "message" => "%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:hostname} %{WORD:log_type}: 日志类型:%{DATA:log_type}, 策略名称:%{DATA:strategy}, 规则ID:%{NUMBER:rule_id}, 源IP:%{IP:source_ip}, 源端口:%{NUMBER:source_port}, 目的IP:%{IP:destination_ip}, 目的端口:%{NUMBER:destination_port}, 攻击类型:%{DATA:attack_type}, 严重级别:%{DATA:severity}, 系统动作:%{DATA:waf-system_action}"
      }
    }
    mutate {
      add_tag => ["sangfor-waf-log-tg"]
    }
    # 其他针对 Sangfor-WAF-log 的过滤操作
  }
  else if [type] == "sangfor-af-log" {
    grok {
      match => {
        "message" => "%{HOSTNAME:hostname} %{WORD:log_type}: 日志类型:%{DATA:log_type}, 策畲名称:%{DATA:strategy}, 用户:%{DATA:user}, 源IP:%{IP:source_ip}, 源端口:%{NUMBER:source_port}, 目的IP:%{IP:destination_ip}, 目的端口:%{NUMBER:destination_port}, 应用类型:%{DATA:app_type}, 应用名称:%{DATA:app_name}, 系统动作:%{GREEDYDATA:fw-system_action}"
      }
    }
    mutate {
      add_tag => ["sangfor-af-log-tg"]
    }
    # 其他针对 Sangfor-AF-log 的过滤操作
  }
}

output {
  if "sangfor-af-log-tg" in [tags] {
    elasticsearch {
      hosts => ["https://elastic.xinn.cc:9200"]
      index => "sangfor-af-log-%{+YYYY.MM.dd}"
      ssl => true
      ssl_certificate_verification => true
      cacert => "/opt/logstash-8.10.4/config/certs/elastic.xinn.cc/ca.crt"
      user => "elastic"
      password => "Ceamg.com"
    }
  }
  else if "sangfor-waf-log-tg" in [tags] {
    elasticsearch {
      hosts => ["https://elastic.xinn.cc:9200"]
      index => "sangfor-waf-log-%{+YYYY.MM.dd}"
      ssl => true
      ssl_certificate_verification => true
      cacert => "/opt/logstash-8.10.4/config/certs/elastic.xinn.cc/ca.crt"
      user => "elastic"
      password => "Ceamg.com"
    }
  }
  else {
    elasticsearch {
      hosts => ["https://elastic.xinn.cc:9200"]
      index => "server-syslog-%{+YYYY.MM.dd}"
      ssl => true
      ssl_certificate_verification => true
      cacert => "/opt/logstash-8.10.4/config/certs/elastic.xinn.cc/ca.crt"
      user => "elastic"
      password => "Ceamg.com"
    }
  }
}


```



### 3.3 Grok 

kibana中有可以调试的工具检测正则是否匹配
```bash
Oct 27 04:06:27 localhost fwlog: 日志类型:服务控制或应用控制, 策略名称:-, 用户:(null), 源IP:113.231.38.30, 源端口:58006, 目的IP:10.1.0.11, 目的端口:80, 应用类型:访问网站, 应用名称:HTTP_GET, 系统动作:允许
```



```json
%{HOSTNAME:hostname} %{WORD:log_type}: 日志类型:%{DATA:log_type}, 策略名称:%{DATA:strategy}, 用户:%{DATA:user}, 源IP:%{IP:source_ip}, 源端口:%{NUMBER:source_port}, 目的IP:%{IP:destination_ip}, 目的端口:%{NUMBER:destination_port}, 应用类型:%{DATA:app_type}, 应用名称:%{DATA:app_name}, 系统动作:%{GREEDYDATA:fw-system_action}
```



![image-20231027175623276](http://img.xinn.cc/image-20231027175623276.png)




## 四、服务常规启动方法


### Elasticsearch 启动

```bash
essl@eslg01:~$ /data/elasticsearch-8.10.4/bin/elasticsearch -d
```



### logstash 启动

```bash
/opt/logstash-8.10.4/bin/logstash -f /opt/logstash-8.10.4/config/lgcs.conf  --config.reload.automatic &
```

### kibana启动

```bash
sudo nohup /data/kibana-8.10.4/bin/kibana &
essl@eslg02:/data/kibana-8.10.4/bin$ nohup /data/kibana-8.10.4/bin/kibana &
[1] 1006570
essl@eslg02:/data/kibana-8.10.4/bin$ nohup: ignoring input and appending output to '/home/essl/nohup.out'
essl@eslg02:/data/kibana-8.10.4/bin$ cd /home/essl/
essl@eslg02:~$ ls
nohup.out
essl@eslg02:~$ tail  -f nohup.out
```



