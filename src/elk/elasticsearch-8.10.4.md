---
author: Ryan
title: Elasticsearch-8.10.4 
date: 2023-10-23
categories: ElasticStack
---

## 1.环境准备

### 1.1 集群规划

| 服务器                | 角色            |
| --------------------- | --------------- |
| 192.168.10.107,eslg01 | master/data节点 |
| 192.168.10.108,eslg02 | master/data节点 |
| 192.168.10.109,eslg03 | master/data节点 |



>es各节点均为master，Elasticsearch-8版本部署的集群无主模式,这里使用了三台全新的机器，考虑到es版本8对java的要求相对较高，如机器部署的应用较多，避免java环境混乱以及应用之间相互影响，所以es8不建议使用在已经部署较多java环境的应用机器。





**ES各版本和JVM版本的需求：**

根据 **Elasticsearch 和 JVM 支持一览表** :https://www.elastic.co/cn/support/matrix#matrix_jvm 

    ES 7.x 及之前版本：选择 OpenJDK 8
    ES 8.4.x 至 8.6.x 支持 OpenJDK17 和 OpenJDK18
    ES 8.10.x 支持 OpenJDK 17 、OpenJDK 20、OpenJDK 21 （建议使用OpenJDK 17,因为对应版本的 Logstash 不支持 Java 20或21）



**Logstash 各版本和 JVM版本的需求:**

- Logstash 8.10.x 仅支持OpenJDK 11 和 OpenJDK17
- Logstash 8.4.x 至 8.6.x  支持OpenJDK 11 和 OpenJDK17 、OpenJDK18 



【注意】

```bash
Java 9、Java 10、Java 12、Java 13、Java 14、Java 15 和 Java 16 均为官方公布的短期版本，ES各版本均不推荐使用这几个
Elasticsearch项目的jdk目录下现在已经内置了openjdk18，也可以直接使用,8.10.4版本默认使用openjdk21
```



由于es和jdk是一个强依赖的关系，所以当我们在新版本的ElasticSearch压缩包中包含有自带的jdk，但是当我们的Linux中已经安装了jdk之后，就会发现启动es的时候优先去找的是Linux中已经装好的jdk，此时如果jdk的版本不一致，就会造成jdk不能正常运行，报错如下：

```bash
warning: usage of JAVA_HOME is deprecated, use ES_JAVA_HOME
Future versions of Elasticsearch will require Java 11; your Java version from [/usr/local/jdk1.8.0_291/jre] does not meet this requirement. Consider switching to a distribution of Elasticsearch with a bundled JDK. If you are already using a distribution with a bundled JDK, ensure the JAVA_HOME environment variable is not set.

```



注：如果Linux服务本来没有配置jdk，则会直接使用es目录下默认的jdk，反而不会报错





OpenJDK下载地址：https://jdk.java.net/archive/

![image-20231024144224335](http://img.xinn.cc/image-20231024144224335.png)



**添加配置解决jdk版本问题**

```bash
#进入bin目录
cd /usr/local/elasticsearch-7.15.2/bin
vim ./elasticsearch 
```



```bash
# 将jdk修改为es中自带jdk的配置目录
export JAVA_HOME=/usr/local/softwore/elasticsearch-7.15.2/jdk
export PATH=$JAVA_HOME/bin:$PATH

if [ -x "$JAVA_HOME/bin/java" ]; then
        JAVA="/usr/local/softwore/elasticsearch-7.15.2/jdk/bin/java"
else
        JAVA=`which java`
fi
```



### 1.2 各节点设置主机名

```bash
#192.168.10.107 
hostnamectl set-hostname eslg01

#192.168.10.107 
hostnamectl set-hostname eslg02

#192.168.10.107 
hostnamectl set-hostname eslg03
```



### 1.3 各节点创建普通用户

>ES不能使用root用户来启动，否则会报错，使用普通用户来安装启动。创建一个普通用户以及定义一些常规目录用于存放我们的数据文件以及安装包等
```bash
# 3台机器都需要执行
useradd essl && echo "essl:Ceamg.com" | chpasswd
sudo usermod -s /bin/bash essl
```



### 1.4 各节点将普通用户权限提高

```bash
# visudo
vim /etc/sudoers
# 增加一行普通用户权限内容
essl ALL=(ALL) NOPASSWD:ALL
```

>NOPASSWD 允许用户在执行被授权的命令时，不需要输入密码验证。这通常用于简化特定任务的自动化，但需要特别小心，确保仅分配给受信任的用户。




### 1.5 各节点添加hosts主机名解析
```bash
vim /etc/hosts
192.168.10.107 eslg01
192.168.10.108 eslg02
192.168.10.109 eslg03
```
如果在各节点的/etc/hosts中都配置了节点的ip解析，那后续在配置文件中，相关的ip配置都可以用解析名代替






### 1.6 安装包准备

Releases: https://www.elastic.co/cn/downloads/past-releases#elasticsearch

<img src="http://img.xinn.cc/image-20231020133656380.png" alt="image-20231020133656380" />





### 1.7 各节点环境优化(各节点)
注意环境优化为各节点均要执行的实施操作，需要自行在每个节点去执行命令

#### 1.7.1 优化1：最大文件数
系统允许 Elasticsearch 打开的最大文件数需要修改成65536
```bash
[root@es01 ~]# vim /etc/security/limits.conf
# End of file
* soft nofile 65536
* hard nofile 131072
* soft nproc 2048
* hard nproc 65536

# 断开重连会话
[root@es01 ~]# ulimit -n
65536

```

>如果这个配置不优化后续启动服务会出现：
[error] max file descriptors [4096] for elasticsearch process likely too low, increase to at least [65536] elasticsearch



#### 1.7.2 优化2：最大进程数

允许最大进程数配置修该成4096；不是4096则需要修改优化

```bash
[root@es01 ~]# vim /etc/security/limits.d/20-nproc.conf
# Default limit for number of user's processes to prevent
# accidental fork bombs.
# See rhbz #432903 for reasoning.

*          soft    nproc     4096
root       soft    nproc     unlimited
```



>这个配置不优化启动服务会出现：
> [error]max number of threads [1024] for user [judy2] likely too low, increase to at least [4096]



#### 1.7.3 优化3：虚拟内存

```bash
# 增加配置项vm.max_map_count
[root@es01 ~]# vim /etc/sysctl.conf 
vm.max_map_count=262144
# 重载配置
[root@es01 ~]# sysctl -p
net.core.rmem_default = 33554432
net.core.rmem_max = 33554432
vm.max_map_count = 262144
```



>这个配置不优化启动服务会出现：
> [error]max virtual memory areas vm.max_map_count [65530] likely too low, increase to at least [262144]





## 2.安装Elasticsearch

### 2.1 解压安装

```sh
mkdir /opt/es/ -p
chown -R essl.essl /opt/es/
tar -xf /tmp/elasticsearch-8.10.4-linux-x86_64.tar.gz -C /opt/es/
chown -R essl.essl /opt/es/elasticsearch-8.10.4
[root@es01 ~]# cd /opt/module/elasticsearch-8.3.2/
root@eslg01:/opt/es/elasticsearch-8.10.4# ls -l
total 2220
drwxr-xr-x  2 essl essl    4096 Oct 11 22:10 bin
drwxr-xr-x  3 essl essl    4096 Oct 24 07:53 config
drwxr-xr-x  8 essl essl    4096 Oct 11 22:10 jdk
drwxr-xr-x  5 essl essl    4096 Oct 11 22:10 lib
-rw-r--r--  1 essl essl    3860 Oct 11 22:03 LICENSE.txt
drwxr-xr-x  2 essl essl    4096 Oct 11 22:05 logs
drwxr-xr-x 76 essl essl    4096 Oct 11 22:10 modules
-rw-r--r--  1 essl essl 2231504 Oct 11 22:05 NOTICE.txt
drwxr-xr-x  2 essl essl    4096 Oct 11 22:05 plugins
-rw-r--r--  1 essl essl    8157 Oct 11 22:03 README.asciidoc
```



### 2.2 配置环境变量

```sh
 vim /etc/profile

export JAVA_HOME=/opt/module/elasticsearch-8.3.2/jdk
export ES_HOME=/opt/module/elasticsearch-8.3.2
export PATH=$PATH:$ES_HOME/bin

vim /etc/profile.d/elasticsearch.sh
export JAVA_HOME=/softws/jdk-17.0.2
# ES
export ES_HOME=/softws/elasticsearch-8.10.4
export PATH=$JAVA_HOME/bin:$PATH
export PATH=$ES_HOME/bin:$PATH

# 引用
source /etc/profile.d/elasticsearch.sh

root@eslg01:/opt/es/elasticsearch-8.10.4# /softws/jdk-17.0.2/bin/java -version
openjdk version "17.0.2" 2022-01-18
OpenJDK Runtime Environment (build 17.0.2+8-86)
OpenJDK 64-Bit Server VM (build 17.0.2+8-86, mixed mode, sharing)
```



### 2.3 创建es相关目录

```bash



# 创建数据文件目录
root@eslg01:~# mkdir -p /opt/es/elasticsearch-8.10.4/data
# 创建证书生成目录
root@eslg01:~# mkdir -p /opt/es/elasticsearch-8.10.4/config/certs

# 目录有改动，重新刷一下权限
root@eslg01:~# chown -R essl:essl /opt/es/elasticsearch-8.10.4/

# 分发至eslg02、eslg03

# 新建目录
[root@eslg02 ~]# mkdir -p /opt/es
[root@eslg03 ~]# mkdir -p /opt/es

# 分发到其他节点,并在02 03上查看操作文件权限
root@eslg01:~# scp -r /opt/es/elasticsearch-8.10.4/ eslg02:/opt/es/elasticsearch-8.10.4
root@eslg01:~# scp -r /opt/es/elasticsearch-8.10.4/ eslg03:/opt/es/elasticsearch-8.10.4

# 目录文件权限刷用户所属
root@eslg02:~# chown -R essl:essl /opt/es/elasticsearch-8.10.4/
root@eslg03:~# chown -R essl:essl /opt/es/elasticsearch-8.10.4/
```



### 2.4 证书签发

```bash
# 在第一台服务器节点es01 设置集群多节点通信密钥
# 切换普通用户实施
[root@es01 module]# su - essl
essl@eslg02:~$ cd /opt/es/elasticsearch-8.10.4/bin/

essl@eslg02:/opt/es/elasticsearch-8.10.4/bin$ ./elasticsearch-certutil ca
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

If you elect to generate PEM format certificates (the -pem option), then the output will
be a zip file containing individual files for the CA certificate and private key

Please enter the desired output file [elastic-stack-ca.p12]: # 回车即可
Enter password for elastic-stack-ca.p12 :  # 回车即可




# 用 ca 证书签发节点证书，过程中需按三次回车键,生成目录：es的home:/opt/elasticsearch-8.3.2/
essl@eslg02:/opt/es/elasticsearch-8.10.4/bin$ ./elasticsearch-certutil cert --ca elastic-stack-ca.p12
warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
This tool assists you in the generation of X.509 certificates and certificate
signing requests for use with SSL/TLS in the Elastic stack.

By default the 'cert' mode produces a single PKCS#12 output file which holds:
    * The instance certificate
    * The private key for the instance certificate
    * The CA certificate

If you specify any of the following options:
    * -pem (PEM formatted output)
    * -multiple (generate multiple certificates)
    * -in (generate certificates from an input file)
then the output will be be a zip file containing individual certificate/key files

Enter password for CA (elastic-stack-ca.p12) :  # 回车即可
Please enter the desired output file [elastic-certificates.p12]:  # 回车即可
Enter password for elastic-certificates.p12 :  # 回车即可

Certificates written to /opt/es/elasticsearch-8.10.4/elastic-certificates.p12

This file should be properly secured as it contains the private key for
your instance.
This file is a self contained file and can be copied and used 'as is'
For each Elastic product that you wish to configure, you should copy
this '.p12' file to the relevant configuration directory
and then follow the SSL configuration instructions in the product guide.

For client applications, you may only need to copy the CA certificate and
configure the client to trust this certificate.


# 将生成的证书文件移动到 config/certs 目录中
essl@eslg02:/opt/es/elasticsearch-8.10.4$ ls -l | grep "elastic-"
-rw-------  1 essl essl    3596 Oct 24 08:40 elastic-certificates.p12
-rw-------  1 essl essl    2672 Oct 24 08:39 elastic-stack-ca.p12


essl@eslg02:/opt/es/elasticsearch-8.10.4$ mv elastic-certificates.p12 config/certs/
essl@eslg02:/opt/es/elasticsearch-8.10.4$ mv elastic-stack-ca.p12 config/certs/
```



### 2.5 设置集群多节点 HTTP 证书

```bash
# 签发 Https 证书
[wangting@es01 elasticsearch-8.3.2]$ cd /opt/module/elasticsearch-8.3.2/bin/
[wangting@es01 bin]$ ./elasticsearch-certutil http
warning: ignoring JAVA_HOME=/opt/module/elasticsearch-8.3.2/jdk; using bundled JDK

## Elasticsearch HTTP Certificate Utility
The 'http' command guides you through the process of generating certificates
for use on the HTTP (Rest) interface for Elasticsearch.
This tool will ask you a number of questions in order to generate the right
set of files for your needs.
## Do you wish to generate a Certificate Signing Request (CSR)?
A CSR is used when you want your certificate to be created by an existing
Certificate Authority (CA) that you do not control (that is, you do not have
access to the keys for that CA). 
If you are in a corporate environment with a central security team, then you
may have an existing Corporate CA that can generate your certificate for you.
Infrastructure within your organisation may already be configured to trust this
CA, so it may be easier for clients to connect to Elasticsearch if you use a
CSR and send that request to the team that controls your CA.
If you choose not to generate a CSR, this tool will generate a new certificate
for you. That certificate will be signed by a CA under your control. This is a
quick and easy way to secure your cluster with TLS, but you will need to
configure all your clients to trust that custom CA.
######################################################
# 是否生成CSR，选择 N ，不需要                           #
######################################################
Generate a CSR? [y/N]N

## Do you have an existing Certificate Authority (CA) key-pair that you wish to use to sign your certificate?

If you have an existing CA certificate and key, then you can use that CA to
sign your new http certificate. This allows you to use the same CA across
multiple Elasticsearch clusters which can make it easier to configure clients,
and may be easier for you to manage.

If you do not have an existing CA, one will be generated for you.
######################################################
# 是否使用已经存在的CA证书，选择 y ，因为已经创建签发好了CA    #
######################################################
Use an existing CA? [y/N]y

## What is the path to your CA?
Please enter the full pathname to the Certificate Authority that you wish to
use for signing your new http certificate. This can be in PKCS#12 (.p12), JKS
(.jks) or PEM (.crt, .key, .pem) format.
######################################################
# 指定CA证书的路径地址，CA Path:后写绝对路径               #
######################################################
CA Path: /opt/es/elasticsearch-8.10.4/config/certs/elastic-stack-ca.p12
Reading a PKCS12 keystore requires a password.
It is possible for the keystore's password to be blank,
in which case you can simply press <ENTER> at the prompt

######################################################
# 设置密钥库的密码，直接 回车 即可                         #
######################################################
Password for elastic-stack-ca.p12:

## How long should your certificates be valid?

Every certificate has an expiry date. When the expiry date is reached clients
will stop trusting your certificate and TLS connections will fail.
Best practice suggests that you should either:
(a) set this to a short duration (90 - 120 days) and have automatic processes
to generate a new certificate before the old one expires, or
(b) set it to a longer duration (3 - 5 years) and then perform a manual update
a few months before it expires.

You may enter the validity period in years (e.g. 3Y), months (e.g. 18M), or days (e.g. 90D)
######################################################
# 设置证书的失效时间，这里的y表示年，5y则代表失效时间5年       #
######################################################
For how long should your certificate be valid? [5y] 5y

## Do you wish to generate one certificate per node?

If you have multiple nodes in your cluster, then you may choose to generate a
separate certificate for each of these nodes. Each certificate will have its
own private key, and will be issued for a specific hostname or IP address.

Alternatively, you may wish to generate a single certificate that is valid
across all the hostnames or addresses in your cluster.

If all of your nodes will be accessed through a single domain
(e.g. node01.es.example.com, node02.es.example.com, etc) then you may find it
simpler to generate one certificate with a wildcard hostname (*.es.example.com)
and use that across all of your nodes.

However, if you do not have a common domain name, and you expect to add
additional nodes to your cluster in the future, then you should generate a
certificate per node so that you can more easily generate new certificates when
you provision new nodes.

######################################################
# 是否需要为每个节点都生成证书，选择 N 无需每个节点都配置证书   #
######################################################
Generate a certificate per node? [y/N]N

## Which hostnames will be used to connect to your nodes?
These hostnames will be added as "DNS" names in the "Subject Alternative Name"
(SAN) field in your certificate.
You should list every hostname and variant that people will use to connect to
your cluster over http.
Do not list IP addresses here, you will be asked to enter them later.

If you wish to use a wildcard certificate (for example *.es.example.com) you
can enter that here.

Enter all the hostnames that you need, one per line.
######################################################
# 输入需连接集群节点主机名信息，一行输入一个IP地址，空行回车结束 #
######################################################
When you are done, press <ENTER> once more to move on to the next step.

eslg01
eslg02
eslg03

You entered the following hostnames.

 - eslg01
 - eslg02
 - eslg03

####################################################
# 确认以上是否为正确的配置，输入 Y 表示信息正确            #
####################################################
Is this correct [Y/n]Y

## Which IP addresses will be used to connect to your nodes?
If your clients will ever connect to your nodes by numeric IP address, then you
can list these as valid IP "Subject Alternative Name" (SAN) fields in your
certificate.

If you do not have fixed IP addresses, or not wish to support direct IP access
to your cluster then you can just press <ENTER> to skip this step.

Enter all the IP addresses that you need, one per line.
####################################################
# 输入需连接集群节点IP信息，一行输入一个IP地址，空行回车结束 #
####################################################
When you are done, press <ENTER> once more to move on to the next step.

192.168.10.107
192.168.10.108
192.168.10.109

You entered the following IP addresses.

 - 192.168.10.107
 - 192.168.10.108
 - 192.168.10.109

####################################################
# 确认以上是否为正确的配置，输入 Y 表示信息正确            #
####################################################
Is this correct [Y/n]Y

## Other certificate options
The generated certificate will have the following additional configuration
values. These values have been selected based on a combination of the
information you have provided above and secure defaults. You should not need to
change these values unless you have specific requirements.

Key Name: eslg01
Subject DN: CN=eslg01
Key Size: 2048

####################################################
# 是否要更改以上这些选项，选择 N ，不更改证书选项配置       #
####################################################
Do you wish to change any of these options? [y/N]N

## What password do you want for your private key(s)?

Your private key(s) will be stored in a PKCS#12 keystore file named "http.p12".
This type of keystore is always password protected, but it is possible to use a
blank password.

####################################################
# 是否要给证书加密，不需要加密，两次 回车 即可             #
####################################################
If you wish to use a blank password, simply press <enter> at the prompt below.
Provide a password for the "http.p12" file:  [<ENTER> for none]

## Where should we save the generated files?
A number of files will be generated including your private key(s),
public certificate(s), and sample configuration options for Elastic Stack products.
These files will be included in a single zip archive.
What filename should be used for the output zip file? [/opt/es/elasticsearch-8.10.4/elasticsearch-ssl-http.zip]
Zip file written to /opt/es/elasticsearch-8.10.4/elasticsearch-ssl-http.zip
```



### 2.6 解压证书并分发

```bash
# 解压
essl@eslg02:/ cd /opt/es/elasticsearch-8.10.4/
essl@eslg02:/opt/es/elasticsearch-8.10.4$ unzip elasticsearch-ssl-http.zip
Archive:  elasticsearch-ssl-http.zip
   creating: elasticsearch/
  inflating: elasticsearch/README.txt
  inflating: elasticsearch/http.p12
  inflating: elasticsearch/sample-elasticsearch.yml
   creating: kibana/
  inflating: kibana/README.txt
  inflating: kibana/elasticsearch-ca.pem
  inflating: kibana/sample-kibana.yml


# 移动证书
essl@eslg02:/opt/es/elasticsearch-8.10.4$ mv ./elasticsearch/http.p12 config/certs/
essl@eslg02:/opt/es/elasticsearch-8.10.4$ mv ./kibana/elasticsearch-ca.pem config/certs/

# 将证书分发到其他节点02 03
essl@eslg02:/opt/es/elasticsearch-8.10.4$ cd config/certs/
essl@eslg02:/opt/es/elasticsearch-8.10.4/config/certs$ ls -l
total 16
-rw------- 1 essl essl 3596 Oct 24 08:40 elastic-certificates.p12
-rw-rw-r-- 1 essl essl 1200 Oct 24 08:53 elasticsearch-ca.pem
-rw------- 1 essl essl 2672 Oct 24 08:39 elastic-stack-ca.p12
-rw-rw-r-- 1 essl essl 3652 Oct 24 08:53 http.p12

scp -r * eslg02:/opt/es/elasticsearch-8.10.4/config/certs
scp -r * eslg03:/opt/es/elasticsearch-8.10.4/config/certs
```



> 如果提示：-bash: unzip: command not found，使用yum安装即可
>
> [wangting@es01 elasticsearch-8.3.2]$ sudo yum install -y unzip



### 2.7 配置文件修改配置

```bash
essl@eslg02:/opt/es/elasticsearch-8.10.4/config/certs$ cd ..
essl@eslg02:/opt/es/elasticsearch-8.10.4/config$ egrep -v "^$|^#" elasticsearch.yml
cluster.name: logs-es
node.name: es-lg01
path.data: /opt/es/elasticsearch-8.10.4/data
path.logs: /opt/es/elasticsearch-8.10.4/logs
network.host: 0.0.0.0
http.port: 9200
discovery.seed_hosts: ["eslg01"]
cluster.initial_master_nodes: ["es-lg01", "es-lg02", "es-lg03"]
xpack.security.enabled: true
xpack.security.enrollment.enabled: true
xpack.security.http.ssl:
 enabled: true
 keystore.path: /opt/es/elasticsearch-8.10.4/config/certs/http.p12
 truststore.path: /opt/es/elasticsearch-8.10.4/config/certs/http.p12
xpack.security.transport.ssl:
 enabled: true
 verification_mode: certificate
 keystore.path: /opt/es/elasticsearch-8.10.4/config/certs/elastic-certificates.p12
 truststore.path: /opt/es/elasticsearch-8.10.4/config/certs/elastic-certificates.p12
http.host: [_local_, _site_]
ingest.geoip.downloader.enabled: false
xpack.security.http.ssl.client_authentication: none

```



【注意】：

`xpack.security.http.ssl` & `xpack.security.transport.ssl`后的子配置需要空一格，遵循yml的格式要求

如果不需要后续的http证书认证或者用户密码认证可以将xpack.security相关的功能falase关闭掉



```bash
xpack.security.http.ssl:
 enabled: false
xpack.security.transport.ssl:
 enabled: false
```



有些业务使用场景中，可能会遇到跨域问题，当elasticsearch需要涉及到跨域问题时，可以在配置文件中最后增加配置：

```bash
http.cors.enabled: true
http.cors.allow-origin: "*"
```



### 2.8 修改其余节点的配置文件

```bash
essl@eslg02:/opt/es/elasticsearch-8.10.4$ scp config/elasticsearch.yml eslg02:/opt/es/elasticsearch-8.10.4/config/
essl@eslg02:/opt/es/elasticsearch-8.10.4$ scp config/elasticsearch.yml eslg03:/opt/es/elasticsearch-8.10.4/config/

# eslg02修改 config/elasticsearch.yml
root@eslg02:~# vim /opt/es/elasticsearch-8.10.4/config/elasticsearch.yml
# 设置节点名称
node.name: es-lg02

# eslg03修改 config/elasticsearch.yml
root@eslg03:~# vim /opt/es/elasticsearch-8.10.4/config/elasticsearch.yml
# 设置节点名称
node.name: es-lg03
```





### 2.9 启动集群

每台节点依次启动（无顺序要求，只要多于2台，就可以启动集群，这就是es的无主模式，自动识别集群，选举master）：

```bash
essl@eslg01:/$ /opt/es/elasticsearch-8.10.4/bin/elasticsearch -d
essl@eslg02:/$ /opt/es/elasticsearch-8.10.4/bin/elasticsearch -d
essl@eslg03:/$ /opt/es/elasticsearch-8.10.4/bin/elasticsearch -d
```

```bash
warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
Oct 24, 2023 9:22:58 AM sun.util.locale.provider.LocaleProviderAdapter <clinit>
WARNING: COMPAT locale provider will be removed in a future release
[2023-10-24T09:22:58,999][INFO ][o.a.l.u.VectorUtilPanamaProvider] [es-lg01] Java vector incubator API enabled; uses preferredBitSize=128
[2023-10-24T09:22:59,768][INFO ][o.e.n.Node               ] [es-lg01] version[8.10.4], pid[1260815], build[tar/b4a62ac808e886ff032700c391f45f1408b2538c/2023-10-11T22:04:35.506990650Z], OS[Linux/5.4.0-81-generic/amd64], JVM[Oracle Corporation/OpenJDK 64-Bit Server VM/21/21+35-2513]
[2023-10-24T09:22:59,770][INFO ][o.e.n.Node               ] [es-lg01] JVM home [/opt/es/elasticsearch-8.10.4/jdk], using bundled JDK [true]
[2023-10-24T09:22:59,770][INFO ][o.e.n.Node               ] [es-lg01] JVM arguments [-Des.networkaddress.cache.ttl=60, -Des.networkaddress.cache.negative.ttl=10, -Djava.security.manager=allow, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -XX:-OmitStackTraceInFastThrow, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Dlog4j2.formatMsgNoLookups=true, -Djava.locale.providers=SPI,COMPAT, --add-opens=java.base/java.io=org.elasticsearch.preallocate, -XX:+UseG1GC, -Djava.io.tmpdir=/tmp/elasticsearch-7146833578560053763, --add-modules=jdk.incubator.vector, -XX:+HeapDumpOnOutOfMemoryError, -XX:+ExitOnOutOfMemoryError, -XX:HeapDumpPath=data, -XX:ErrorFile=logs/hs_err_pid%p.log, -Xlog:gc*,gc+age=trace,safepoint:file=logs/gc.log:utctime,level,pid,tags:filecount=32,filesize=64m, -Xms3980m, -Xmx3980m, -XX:MaxDirectMemorySize=2086666240, -XX:G1HeapRegionSize=4m, -XX:InitiatingHeapOccupancyPercent=30, -XX:G1ReservePercent=15, -Des.distribution.type=tar, --module-path=/opt/es/elasticsearch-8.10.4/lib, --add-modules=jdk.net, --add-modules=org.elasticsearch.preallocate, -Djdk.module.main=org.elasticsearch.server]
[2023-10-24T09:23:03,887][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [repository-url]
[2023-10-24T09:23:03,888][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [rest-root]
[2023-10-24T09:23:03,888][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-core]
[2023-10-24T09:23:03,889][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-redact]
[2023-10-24T09:23:03,889][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [ingest-user-agent]
[2023-10-24T09:23:03,889][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-async-search]
[2023-10-24T09:23:03,889][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-monitoring]
[2023-10-24T09:23:03,890][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [repository-s3]
[2023-10-24T09:23:03,890][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-analytics]
[2023-10-24T09:23:03,890][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-ent-search]
[2023-10-24T09:23:03,891][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-autoscaling]
[2023-10-24T09:23:03,891][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [lang-painless]
[2023-10-24T09:23:03,891][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-ml]
[2023-10-24T09:23:03,891][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [lang-mustache]
[2023-10-24T09:23:03,892][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [legacy-geo]
[2023-10-24T09:23:03,892][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-ql]
[2023-10-24T09:23:03,892][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [rank-rrf]
[2023-10-24T09:23:03,893][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [analysis-common]
[2023-10-24T09:23:03,893][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [transport-netty4]
[2023-10-24T09:23:03,893][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [aggregations]
[2023-10-24T09:23:03,893][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [ingest-common]
[2023-10-24T09:23:03,894][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [frozen-indices]
[2023-10-24T09:23:03,894][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-identity-provider]
[2023-10-24T09:23:03,894][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-text-structure]
[2023-10-24T09:23:03,895][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-shutdown]
[2023-10-24T09:23:03,895][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [snapshot-repo-test-kit]
[2023-10-24T09:23:03,895][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [ml-package-loader]
[2023-10-24T09:23:03,896][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [kibana]
[2023-10-24T09:23:03,896][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [constant-keyword]
[2023-10-24T09:23:03,896][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-logstash]
[2023-10-24T09:23:03,897][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-graph]
[2023-10-24T09:23:03,897][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-ccr]
[2023-10-24T09:23:03,897][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [parent-join]
[2023-10-24T09:23:03,898][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-enrich]
[2023-10-24T09:23:03,898][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [repositories-metering-api]
[2023-10-24T09:23:03,898][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [transform]
[2023-10-24T09:23:03,898][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [repository-azure]
[2023-10-24T09:23:03,898][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [repository-gcs]
[2023-10-24T09:23:03,899][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [spatial]
[2023-10-24T09:23:03,899][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [mapper-extras]
[2023-10-24T09:23:03,899][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [mapper-version]
[2023-10-24T09:23:03,899][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [apm]
[2023-10-24T09:23:03,900][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-rollup]
[2023-10-24T09:23:03,900][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [percolator]
[2023-10-24T09:23:03,900][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-stack]
[2023-10-24T09:23:03,900][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [data-streams]
[2023-10-24T09:23:03,900][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [rank-eval]
[2023-10-24T09:23:03,901][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [reindex]
[2023-10-24T09:23:03,901][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-security]
[2023-10-24T09:23:03,901][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [blob-cache]
[2023-10-24T09:23:03,901][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [searchable-snapshots]
[2023-10-24T09:23:03,901][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-slm]
[2023-10-24T09:23:03,901][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [snapshot-based-recoveries]
[2023-10-24T09:23:03,902][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-watcher]
[2023-10-24T09:23:03,902][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [old-lucene-versions]
[2023-10-24T09:23:03,902][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-ilm]
[2023-10-24T09:23:03,902][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-voting-only-node]
[2023-10-24T09:23:03,902][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-deprecation]
[2023-10-24T09:23:03,903][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-fleet]
[2023-10-24T09:23:03,903][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-profiling]
[2023-10-24T09:23:03,903][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-aggregate-metric]
[2023-10-24T09:23:03,903][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-downsample]
[2023-10-24T09:23:03,904][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [ingest-geoip]
[2023-10-24T09:23:03,904][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-write-load-forecaster]
[2023-10-24T09:23:03,904][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [search-business-rules]
[2023-10-24T09:23:03,904][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [ingest-attachment]
[2023-10-24T09:23:03,905][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [wildcard]
[2023-10-24T09:23:03,905][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-sql]
[2023-10-24T09:23:03,905][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [unsigned-long]
[2023-10-24T09:23:03,905][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-async]
[2023-10-24T09:23:03,905][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [runtime-fields-common]
[2023-10-24T09:23:03,906][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [vector-tile]
[2023-10-24T09:23:03,906][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [lang-expression]
[2023-10-24T09:23:03,906][INFO ][o.e.p.PluginsService     ] [es-lg01] loaded module [x-pack-eql]
[2023-10-24T09:23:07,827][INFO ][o.e.e.NodeEnvironment    ] [es-lg01] using [1] data paths, mounts [[/ (/dev/vda2)]], net usable_space [943.2gb], net total_space [1006.9gb], types [ext4]
[2023-10-24T09:23:07,827][INFO ][o.e.e.NodeEnvironment    ] [es-lg01] heap size [3.8gb], compressed ordinary object pointers [true]
[2023-10-24T09:23:07,835][INFO ][o.e.n.Node               ] [es-lg01] node name [es-lg01], node ID [e3aozGV5QiSySo-ZJRVf7w], cluster name [logs-es], roles [data_hot, ml, data_frozen, ingest, data_cold, data, remote_cluster_client, master, data_warm, data_content, transform]
[2023-10-24T09:23:12,502][INFO ][o.e.x.m.p.l.CppLogMessageHandler] [es-lg01] [controller/1260874] [Main.cc@123] controller (64 bit): Version 8.10.4 (Build 92832804c6da01) Copyright (c) 2023 Elasticsearch BV
[2023-10-24T09:23:12,731][INFO ][o.e.x.s.Security         ] [es-lg01] Security is enabled
[2023-10-24T09:23:13,599][INFO ][o.e.x.s.a.s.FileRolesStore] [es-lg01] parsed [0] roles from file [/opt/es/elasticsearch-8.10.4/config/roles.yml]

[2023-10-24T09:23:14,462][INFO ][o.e.x.p.ProfilingPlugin  ] [es-lg01] Profiling is enabled
[2023-10-24T09:23:14,484][INFO ][o.e.x.p.ProfilingPlugin  ] [es-lg01] profiling index templates will not be installed or reinstalled
[2023-10-24T09:23:15,477][INFO ][o.e.t.n.NettyAllocator   ] [es-lg01] creating NettyAllocator with the following configs: [name=elasticsearch_configured, chunk_size=1mb, suggested_max_allocation_size=1mb, factors={es.unsafe.use_netty_default_chunk_and_page_size=false, g1gc_enabled=true, g1gc_region_size=4mb}]
[2023-10-24T09:23:15,529][INFO ][o.e.i.r.RecoverySettings ] [es-lg01] using rate limit [40mb] with [default=40mb, read=0b, write=0b, max=0b]
[2023-10-24T09:23:15,592][INFO ][o.e.d.DiscoveryModule    ] [es-lg01] using discovery type [multi-node] and seed hosts providers [settings]
[2023-10-24T09:23:17,572][INFO ][o.e.n.Node               ] [es-lg01] initialized
[2023-10-24T09:23:17,573][INFO ][o.e.n.Node               ] [es-lg01] starting ...
[2023-10-24T09:23:17,601][INFO ][o.e.x.s.c.f.PersistentCache] [es-lg01] persistent cache index loaded
[2023-10-24T09:23:17,603][INFO ][o.e.x.d.l.DeprecationIndexingComponent] [es-lg01] deprecation component started
[2023-10-24T09:23:17,775][INFO ][o.e.t.TransportService   ] [es-lg01] publish_address {192.168.10.107:9300}, bound_addresses {[::]:9300}
[2023-10-24T09:23:17,952][INFO ][o.e.b.BootstrapChecks    ] [es-lg01] bound or publishing to a non-loopback address, enforcing bootstrap checks
[2023-10-24T09:23:17,958][INFO ][o.e.c.c.ClusterBootstrapService] [es-lg01] this node has not joined a bootstrapped cluster yet; [cluster.initial_master_nodes] is set to [es-lg01, es-lg02, es-lg03]
[2023-10-24T09:23:19,268][INFO ][o.e.c.c.Coordinator      ] [es-lg01] setting initial configuration to VotingConfiguration{5IFPa2grR_ee-WjMtwoR-g,KFPhT7e3TMi7qQqjYZ-Jkw,e3aozGV5QiSySo-ZJRVf7w}
[2023-10-24T09:23:19,385][INFO ][o.e.c.c.CoordinationState] [es-lg01] cluster UUID set to [CywmfOGGTHazzuVafX4Ztw]
[2023-10-24T09:23:19,415][WARN ][o.e.c.c.Coordinator      ] [es-lg01] received cluster state from {es-lg03}{5IFPa2grR_ee-WjMtwoR-g}{DxqhRisLQ6-nOcLCchoGuA}{es-lg03}{192.168.10.109}{192.168.10.109:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}{ml.max_jvm_size=4173332480, ml.allocated_processors_double=8.0, ml.allocated_processors=8, ml.machine_memory=8347463680, transform.config_version=10.0.0, xpack.installed=true, ml.config_version=10.0.0} with a different cluster uuid NuMqztvZR9SrDHcMbTkpWQ than local cluster uuid CywmfOGGTHazzuVafX4Ztw, rejecting
[2023-10-24T09:23:19,415][INFO ][o.e.c.s.ClusterApplierService] [es-lg01] master node changed {previous [], current [{es-lg02}{KFPhT7e3TMi7qQqjYZ-Jkw}{gesjLOfGQCqjvFe4DOGVgA}{es-lg02}{192.168.10.108}{192.168.10.108:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}]}, added {{es-lg02}{KFPhT7e3TMi7qQqjYZ-Jkw}{gesjLOfGQCqjvFe4DOGVgA}{es-lg02}{192.168.10.108}{192.168.10.108:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}}, term: 2, version: 1, reason: ApplyCommitRequest{term=2, version=1, sourceNode={es-lg02}{KFPhT7e3TMi7qQqjYZ-Jkw}{gesjLOfGQCqjvFe4DOGVgA}{es-lg02}{192.168.10.108}{192.168.10.108:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}{ml.max_jvm_size=4173332480, ml.allocated_processors_double=8.0, ml.allocated_processors=8, ml.machine_memory=8347463680, xpack.installed=true, transform.config_version=10.0.0, ml.config_version=10.0.0}}
[2023-10-24T09:23:19,441][INFO ][o.e.c.c.JoinHelper       ] [es-lg01] failed to join {es-lg03}{5IFPa2grR_ee-WjMtwoR-g}{DxqhRisLQ6-nOcLCchoGuA}{es-lg03}{192.168.10.109}{192.168.10.109:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}{ml.max_jvm_size=4173332480, ml.allocated_processors_double=8.0, ml.allocated_processors=8, ml.machine_memory=8347463680, transform.config_version=10.0.0, xpack.installed=true, ml.config_version=10.0.0} with JoinRequest{sourceNode={es-lg01}{e3aozGV5QiSySo-ZJRVf7w}{pmQqW-IlSRysgJpeBz2zQg}{es-lg01}{192.168.10.107}{192.168.10.107:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}{ml.max_jvm_size=4173332480, ml.allocated_processors_double=8.0, ml.allocated_processors=8, ml.machine_memory=8347463680, transform.config_version=10.0.0, xpack.installed=true, ml.config_version=10.0.0}, transportVersion=8500061, minimumTerm=0, optionalJoin=Optional[Join{term=1, lastAcceptedTerm=0, lastAcceptedVersion=0, sourceNode={es-lg01}{e3aozGV5QiSySo-ZJRVf7w}{pmQqW-IlSRysgJpeBz2zQg}{es-lg01}{192.168.10.107}{192.168.10.107:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}{ml.max_jvm_size=4173332480, ml.allocated_processors_double=8.0, ml.allocated_processors=8, ml.machine_memory=8347463680, transform.config_version=10.0.0, xpack.installed=true, ml.config_version=10.0.0}, targetNode={es-lg03}{5IFPa2grR_ee-WjMtwoR-g}{DxqhRisLQ6-nOcLCchoGuA}{es-lg03}{192.168.10.109}{192.168.10.109:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}{ml.max_jvm_size=4173332480, ml.allocated_processors_double=8.0, ml.allocated_processors=8, ml.machine_memory=8347463680, transform.config_version=10.0.0, xpack.installed=true, ml.config_version=10.0.0}}]}org.elasticsearch.transport.NodeDisconnectedException: [es-lg03][192.168.10.109:9300][internal:cluster/coordination/join] disconnected

See logs for more details.

[2023-10-24T09:23:19,444][INFO ][o.e.h.AbstractHttpServerTransport] [es-lg01] publish_address {192.168.10.107:9200}, bound_addresses {[::1]:9200}, {127.0.0.1:9200}, {192.168.10.107:9200}
[2023-10-24T09:23:19,445][INFO ][o.e.n.Node               ] [es-lg01] started {es-lg01}{e3aozGV5QiSySo-ZJRVf7w}{pmQqW-IlSRysgJpeBz2zQg}{es-lg01}{192.168.10.107}{192.168.10.107:9300}{cdfhilmrstw}{8.10.4}{7000099-8100499}{ml.max_jvm_size=4173332480, ml.allocated_processors_double=8.0, ml.allocated_processors=8, ml.machine_memory=8347463680, transform.config_version=10.0.0, xpack.installed=true, ml.config_version=10.0.0}

```



> 登录网页，都与之前的密码一致：elastic/bigdata
>
> https://es01:9200/_cat/nodes?v



【注意】

如果不留神使用root修改过目录下文件，则文件权限会变成root所属主，所以需要修改回普通用户



```bash
sudo chown -R essl.essl /opt/es/
```



ES服务启动后有2个端口

- 9200为客户端访问es的http协议RESTFUL端口
- 9300为ES集群之间组件的通信端口







### 2-10 修改HTTP登录密码

```bash
# 手工指定elastic的新密码 (-i参数)
essl@eslg01:/opt/es/elasticsearch-8.10.4/config/certs$ /opt/es/elasticsearch-8.10.4/bin/elasticsearch-reset-password -u elastic -i
warning: ignoring JAVA_HOME=/softws/jdk-17.0.2; using bundled JDK
This tool will reset the password of the [elastic] user.
You will be prompted to enter the password.
Please confirm that you would like to continue [y/N]y


Enter password for [elastic]:
Re-enter password for [elastic]:
Password for the [elastic] user successfully reset.
```



```
# 也可以不加-i参数让系统随机给个字符串密码，但是很难记住，很少使用
# 为elastic账号自动生成新的随机密码，输出至控制台；不加参数
[wangting@es01 ~]$ /opt/module/elasticsearch-8.3.2/bin/elasticsearch-reset-password -u elastic
```



### 2.11 页面访问验证

> https://ip:9200 (注意是https)
>
> 账号密码为上面创建的：elastic / elastic的密码

![image-20231024173138345](http://img.xinn.cc/image-20231024173138345.png)



### 2.12 集群启动|停止

- 启动服务方式

```bash
essl@eslg01:/$ /opt/es/elasticsearch-8.10.4/bin/elasticsearch -d
```



> 【注意】：
>
> 1. -d 为后台运行，不加-d只能前台运行，关了会话窗口服务也会同时终止
> 2. 3台机器都需要启动elasticsearch
> 3. 运行日志没有配置定义，默认在服务目录下：elasticsearch-8.3.2/logs/ ，有异常可以先查看日志



- 停止服务方式

```bash
essl@eslg01:/opt/es/$ ps -ef | grep elasticsearch|grep -vE "grep|controller" |awk -F" " '{print $2}'  | xargs kill -9
```



脚本

```bash
# 需先配置免密登录
essl@eslg01:/$ mkdir -p /home/essl/.ssh/
mkdir: cannot create directory ‘/home/essl’: Permission denied
essl@eslg01:/$ sudo mkdir -p /home/essl/.ssh/
essl@eslg01:/$
essl@eslg01:/$ ssh-keygen -t rsa
Generating public/private rsa key pair.
Enter file in which to save the key (/home/essl/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Saving key "/home/essl/.ssh/id_rsa" failed: Permission denied
essl@eslg01:/$ sudo ssh-keygen -t rsa
Generating public/private rsa key pair.
Enter file in which to save the key (/root/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /root/.ssh/id_rsa
Your public key has been saved in /root/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:im/FsPEYAlJraiFWkT5Igk7UjLf7Vsx7oPmXUiEvFgo root@eslg01
The key's randomart image is:
+---[RSA 3072]----+
|oo=oo            |
|++o*             |
|*+*..            |
|o=.E. +o .       |
|..  +.+OS .      |
|.  . ooO+o       |
|    o *.= .      |
|     *.o +       |
|    ..o.+        |
+----[SHA256]-----+
essl@eslg01:/$
essl@eslg01:/$ sudo ssh-copy-id eslg01
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_rsa.pub"
The authenticity of host 'eslg01 (192.168.10.107)' can't be established.
ECDSA key fingerprint is SHA256:lhRjKQBhgEhjbqcfKBb6oyle8C9EIOzu48QUoaeISIE.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@eslg01's password:

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'eslg01'"
and check to make sure that only the key(s) you wanted were added.

essl@eslg01:/$ sudo ssh-copy-id eslg02
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_rsa.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@eslg02's password:

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'eslg02'"
and check to make sure that only the key(s) you wanted were added.

essl@eslg01:/$ sudo ssh-copy-id eslg03
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_rsa.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@eslg03's password:

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'eslg03'"
and check to make sure that only the key(s) you wanted were added.


# 编写脚本
essl@eslg01:/opt/es/elasticsearch-8.10.4$ vim es-service.sh
#! /bin/bash
if (($#==0)); then
  echo -e "请输入参数：\n start  启动elasticsearch集群;\n stop  停止elasticsearch集群;\n" && exit
fi


case $1 in
  "start")
    for host in eslg01 eslg02 eslg03
      do
        echo "---------- $1 $host 的elasticsearch ----------"
        ssh $host "/opt/es/elasticsearch-8.10.4/bin/elasticsearch -d >/dev/null 2>&1"
      done
      ;;
  "stop")
    for host in eslg01 eslg02 eslg03
      do
        echo "---------- $1 $host 的elasticsearch ----------"
        ssh $host "ps -ef | grep elasticsearch|grep -v grep|grep -v controller |awk '{print $2}' | xargs kill -9" > /dev/null 2>&1
      done
      ;;
    *)
        echo -e "---------- 请输入正确的参数 ----------\n"
        echo -e "start  启动elasticsearch集群;\n stop  停止elasticsearch集群;\n" && exit
      ;;
esac

```



**启动集群：**

等待脚本执行结束

```shell
$ bash es-service.sh start
```

**停止集群：**

```shell
$ bash es-service.sh stop
```



