---
author: Ryan
title: 1.Kubernetes 二进制部署
date: 2023-01-06T10:23:32
---

import WordCount from '@site/src/components/WordCount';

<WordCount />

## 前言

  Kubernetes二进制部署相对于使用自动化工具（如kubeadm）而言，涉及更多的手动步骤和配置过程。然而，这种部署方式在一些情境下具有显著的优势。通过手动下载、配置和启动Kubernetes的各个组件，用户能够获得更高程度的定制性和精细控制权，以便根据特定需求进行调整。这种灵活性使用户能够选择所需的Kubernetes版本、特定的组件配置，以及自定义的网络和存储方案。

  同时，通过深入参与每个部署步骤，用户可以更加深入地理解Kubernetes的内部工作机制和组件之间的关系。这种深入了解对于排查问题、优化性能以及实现定制的集群架构至关重要。此外，二进制部署还允许用户在没有网络连接的环境中进行部署，这在某些限制性网络环境下非常有用。对于特殊场景，如需要定制化的认证、授权和网络设置，手动部署能够更好地满足需求。

  然而，需要注意的是，Kubernetes的二进制部署需要更多的时间、技术知识和资源投入。相较于自动化工具，它可能增加了出错的风险，需要更多的监控和维护工作。因此，在选择部署方式时，应该根据自身的技能水平、时间成本和项目需求来选择适合自己的部署方式。



[k8s-实战案例_v1.21.x-部署.pdf](https://www.yuque.com/attachments/yuque/0/2023/pdf/33538388/1672721011349-4455b094-61ee-4956-a375-07ad6fc387a1.pdf)



## 1.基础环境配置


### 1.1 时间同步

```bash
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

cat /etc/default/locale
LANG=en_US.UTF-8
LC_TIME=en_DK.UTF-8 


*/5 * * * * /usr/sbin/ntpdate time1.aliyun.com &> /dev/null && hwclock -w/usr/sbin/ntpdate
```



### 1.2  安裝docker 

```bash
root@master01:/home/ceamg# cd /apps/docker/
root@master01:/apps/docker# tar xvf docker-19.03.15-binary-install.tar.gz
root@master01:/apps/docker# ll
total 153128
drwxr-xr-x 2 root root     4096 Apr 11  2021 ./
drwxr-xr-x 3 root root     4096 Jan  2 03:52 ../
-rw-r--r-- 1 root root      647 Apr 11  2021 containerd.service
-rw-r--r-- 1 root root 78156440 Jan  2 03:57 docker-19.03.15-binary-install.tar.gz
-rw-r--r-- 1 root root 62436240 Feb  5  2021 docker-19.03.15.tgz
-rwxr-xr-x 1 root root 16168192 Jun 24  2019 docker-compose-Linux-x86_64_1.24.1*
-rwxr-xr-x 1 root root     2708 Apr 11  2021 docker-install.sh*
-rw-r--r-- 1 root root     1683 Apr 11  2021 docker.service
-rw-r--r-- 1 root root      197 Apr 11  2021 docker.socket
-rw-r--r-- 1 root root      454 Apr 11  2021 limits.conf
-rw-r--r-- 1 root root      257 Apr 11  2021 sysctl.conf

```

```bash
#!/bin/bash
DIR=`pwd`
PACKAGE_NAME="docker-19.03.15.tgz"
DOCKER_FILE=${DIR}/${PACKAGE_NAME}
centos_install_docker(){
  grep "Kernel" /etc/issue &> /dev/null
  if [ $? -eq 0 ];then
    /bin/echo  "当前系统是`cat /etc/redhat-release`,即将开始系统初始化、配置docker-compose与安装docker" && sleep 1
    systemctl stop firewalld && systemctl disable firewalld && echo "防火墙已关闭" && sleep 1
    systemctl stop NetworkManager && systemctl disable NetworkManager && echo "NetworkManager" && sleep 1
    sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/sysconfig/selinux && setenforce  0 && echo "selinux 已关闭" && sleep 1
    \cp ${DIR}/limits.conf /etc/security/limits.conf
    \cp ${DIR}/sysctl.conf /etc/sysctl.conf

    /bin/tar xvf ${DOCKER_FILE}
    \cp docker/*  /usr/bin

    \cp containerd.service /lib/systemd/system/containerd.service
    \cp docker.service  /lib/systemd/system/docker.service
    \cp docker.socket /lib/systemd/system/docker.socket

    \cp ${DIR}/docker-compose-Linux-x86_64_1.24.1 /usr/bin/docker-compose

    groupadd docker && useradd docker -g docker
    id -u  magedu &> /dev/null
    if [ $? -ne 0 ];then
      useradd magedu
      usermod magedu -G docker
    fi
    systemctl  enable containerd.service && systemctl  restart containerd.service
    systemctl  enable docker.service && systemctl  restart docker.service
    systemctl  enable docker.socket && systemctl  restart docker.socket
  fi
}

ubuntu_install_docker(){
  grep "Ubuntu" /etc/issue &> /dev/null
  if [ $? -eq 0 ];then
    /bin/echo  "当前系统是`cat /etc/issue`,即将开始系统初始化、配置docker-compose与安装docker" && sleep 1
    \cp ${DIR}/limits.conf /etc/security/limits.conf
    \cp ${DIR}/sysctl.conf /etc/sysctl.conf

    /bin/tar xvf ${DOCKER_FILE}
    \cp docker/*  /usr/bin

    \cp containerd.service /lib/systemd/system/containerd.service
    \cp docker.service  /lib/systemd/system/docker.service
    \cp docker.socket /lib/systemd/system/docker.socket

    \cp ${DIR}/docker-compose-Linux-x86_64_1.24.1 /usr/bin/docker-compose
    ulimit  -n 1000000
    /bin/su -c -  ceamg "ulimit -n 1000000"
    /bin/echo "docker 安装完成!" && sleep 1
    id -u  magedu &> /dev/null
    if [ $? -ne 0 ];then
      groupadd  -r docker
      useradd -r -m -g docker docker
    fi
    systemctl  enable containerd.service && systemctl  restart containerd.service
    systemctl  enable docker.service && systemctl  restart docker.service
    systemctl  enable docker.socket && systemctl  restart docker.socket
  fi
}

main(){
  centos_install_docker
  ubuntu_install_docker
}

main

```

```bash
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://lc2kkql3.mirror.aliyuncs.com"],
   "storage-driver": "overlay",
   "data-root": "/data/docker"
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```


```bash
root@master01:~# cat /etc/sysctl.conf 
net.ipv4.ip_forward=1
vm.max_map_count=262144
kernel.pid_max=4194303
fs.file-max=1000000
net.ipv4.tcp_max_tw_buckets=6000
net.netfilter.nf_conntrack_max=2097152

net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
vm.swappiness=0

```

```bash
root@master01:/apps/docker# bash docker-install.sh 
当前系统是Ubuntu 20.04.3 LTS \n \l,即将开始系统初始化、配置docker-compose与安装docker
docker/
docker/dockerd
docker/docker-proxy
docker/containerd-shim
docker/docker-init
docker/docker
docker/runc
docker/ctr
docker/containerd
su: user jack does not exist
docker 安装完成!
Created symlink /etc/systemd/system/multi-user.target.wants/containerd.service → /lib/systemd/system/containerd.service.
Created symlink /etc/systemd/system/multi-user.target.wants/docker.service → /lib/systemd/system/docker.service.
Created symlink /etc/systemd/system/sockets.target.wants/docker.socket → /lib/systemd/system/docker.socket.

reboot
```


### 1.3 安装ansible 
```bash
#部署节点安装ansible
root@master01:~# apt  install python3-pip git
root@master01:~# pip3 install ansible -i https://mirrors.aliyun.com/pypi/simple/
root@master01:~# ansible --version
ansible [core 2.13.7]
  config file = None
  configured module search path = ['/root/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/local/lib/python3.8/dist-packages/ansible
  ansible collection location = /root/.ansible/collections:/usr/share/ansible/collections
  executable location = /usr/local/bin/ansible
  python version = 3.8.10 (default, Nov 14 2022, 12:59:47) [GCC 9.4.0]
  jinja version = 3.1.2
  libyaml = True
```

### 1.4 配置集群免秘钥登录

```bash
#⽣成密钥对

root@k8s-master1:~# ssh-keygen 

#安装sshpass命令⽤于同步公钥到各k8s服务器

# apt-get install sshpass 
#分发公钥脚本：

root@k8s-master1:~# cat scp-key.sh 
```
```bash
#!/bin/bash
#⽬标主机列表
IP="
10.1.0.32
10.1.0.33
10.1.0.34
10.1.0.35
10.1.0.38
"
for node in ${IP};do
  sshpass -p ceamg.com ssh-copy-id ${node} -o StrictHostKeyChecking=no
  if [ $? -eq 0 ];then
   echo "${node} 秘钥copy完成"
  else
   echo "${node} 秘钥copy失败"
  fi
done
```



### 1.5 部署节点下载kubeasz部署项⽬及组件
使⽤ **master01 **作为部署节点<br />[GitHub - easzlab/kubeasz: 使用Ansible脚本安装K8S集群，介绍组件交互原理，方便直接，不受国内网络环境影响](https://github.com/easzlab/kubeasz)
```bash
root@k8s-master1:~# export release=3.3.1
root@k8s-master1:~# curl -C- -fLO --retry 3 https://github.com/easzlab/kubeasz/releases/download/${release}/ezdown
```

```bash
root@master01:~# chmod a+x ezdown 

root@master01:~# ./ezdown -D
2023-01-02 13:28:24 INFO Action begin: download_all
2023-01-02 13:28:24 INFO downloading docker binaries, version 19.03.15
--2023-01-02 13:28:24--  https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/static/stable/x86_64/docker-19.03.15.tgz
Resolving mirrors.tuna.tsinghua.edu.cn (mirrors.tuna.tsinghua.edu.cn)... 101.6.15.130, 2402:f000:1:400::2
Connecting to mirrors.tuna.tsinghua.edu.cn (mirrors.tuna.tsinghua.edu.cn)|101.6.15.130|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 62436240 (60M) [application/octet-stream]
Saving to: ‘docker-19.03.15.tgz’

docker-19.03.15.tgz                                   100%[========================================================================================================================>]  59.54M  11.2MB/s    in 5.5s    

2023-01-02 13:28:29 (10.9 MB/s) - ‘docker-19.03.15.tgz’ saved [62436240/62436240]

2023-01-02 13:28:31 WARN docker is already running.
2023-01-02 13:28:31 INFO downloading kubeasz: 3.3.1
2023-01-02 13:28:31 DEBUG  run a temporary container
Unable to find image 'easzlab/kubeasz:3.3.1' locally
3.3.1: Pulling from easzlab/kubeasz



Status: Image is up to date for easzlab/kubeasz:3.3.1
docker.io/easzlab/kubeasz:3.3.1
2023-01-02 13:41:44 INFO Action successed: download_all


root@master01:~# cd /etc/kubeasz/
root@master01:/etc/kubeasz/down# ll
total 1136932
drwxr-xr-x  2 root root      4096 Jan  2 13:41 ./
drwxrwxr-x 12 root root      4096 Jan  2 13:32 ../
-rw-------  1 root root 383673856 Jan  2 13:35 calico_v3.19.4.tar
-rw-------  1 root root  48941568 Jan  2 13:36 coredns_1.9.3.tar
-rw-------  1 root root 246784000 Jan  2 13:39 dashboard_v2.5.1.tar
-rw-r--r--  1 root root  62436240 Feb  1  2021 docker-19.03.15.tgz
-rw-------  1 root root 106171392 Jan  2 13:37 k8s-dns-node-cache_1.21.1.tar
-rw-------  1 root root 179129856 Jan  2 13:41 kubeasz_3.3.1.tar
-rw-------  1 root root  43832320 Jan  2 13:40 metrics-scraper_v1.0.8.tar
-rw-------  1 root root  65683968 Jan  2 13:41 metrics-server_v0.5.2.tar
-rw-------  1 root root    721408 Jan  2 13:41 pause_3.7.tar
-rw-------  1 root root  26815488 Jan  2 13:32 registry-2.tar


```
 上述脚本运行成功后，所有文件（kubeasz代码、二进制、离线镜像）均已整理好放入目录/etc/kubeasz




## 2.部署 harbor 镜像仓库


### 2.1 创建自签ssl证书
```bash
#本地解析
root@harbor01:~# echo "10.1.0.38 harbor.ceamg.com >> /etc/hosts"


mkdir -p /data/cert
cd /data/cert

#创建ca和harbor证书请求
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 7300 -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=harbor.ceamg.com" -key ca.key -out ca.crt
openssl genrsa -out harbor.ceamg.com.key 4096
openssl req -sha512 -new -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=harbor.ceamg.com" -key harbor.ceamg.com.key -out harbor.ceamg.com.csr


#创建v3文件
cat > v3.ext <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1=harbor.ceamg.com
DNS.2=harbor
DNS.3=ks-allinone
EOF

#使用v3文件签发harbor证书
openssl x509 -req -sha512 -days 7300 -extfile v3.ext -CA ca.crt -CAkey ca.key -CAcreateserial -in harbor.ceamg.com.csr -out harbor.ceamg.com.crt


#转换成cert
openssl x509 -inform PEM -in harbor.ceamg.com.crt -out harbor.ceamg.com.cert


#添加根证书让系统信任证书
root@harbor01:/data/cert# cp harbor.ceamg.com.crt /usr/local/share/ca-certificates/

root@harbor01:/data/cert# update-ca-certificates 
Updating certificates in /etc/ssl/certs...
rehash: warning: skipping ca-certificates.crt,it does not contain exactly one certificate or CRL
1 added, 0 removed; done.
Running hooks in /etc/ca-certificates/update.d...
done.


#update-ca-certificates命令将PEM格式的根证书内容附加到/etc/ssl/certs/ca-certificates.crt ，而/etc/ssl/certs/ca-certificates.crt 包含了系统自带的各种可信根证书.
```

### 2.2 修改harbor配置
```bash
root@harbor01:/apps/harbor/harbor# cp harbor.yml.tmpl harbor.yml
```
```bash
root@harbor01:/apps/harbor/harbor# grep -v "#" harbor.yml | grep -v "^$"
hostname: harbor.ceamg.com
http:
  port: 80
https:
  port: 443
  certificate: /data/cert/harbor.ceamg.com.crt
  private_key: /apps/harbor/certs/harbor.ceamg.com.key
harbor_admin_password: ceamg.com
database:
  password: root123
  max_idle_conns: 100
  max_open_conns: 900
  conn_max_lifetime: 5m
  conn_max_idle_time: 0
data_volume: /data
trivy:
  ignore_unfixed: false
  skip_update: false
  offline_scan: false
  security_check: vuln
  insecure: false
jobservice:
  max_job_workers: 10
notification:
  webhook_job_max_retry: 10
chart:
  absolute_url: disabled
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor
_version: 2.7.0
proxy:
  http_proxy:
  https_proxy:
  no_proxy:
  components:
    - core
    - jobservice
    - trivy
upload_purging:
  enabled: true
  age: 168h
  interval: 24h
  dryrun: false
cache:
  enabled: false
  expire_hours: 24
```


### 2.3 安装harbor
[Harbor &ndash; Reconfigure Harbor and Manage the Harbor Lifecycle](https://goharbor.io/docs/2.3.0/install-config/reconfigure-manage-lifecycle/)<br /> 有扫描`–with-trivy` ,有认证`–with-notary`，有helm charts 模块退出`–with-chartmuseum` 其中`–with-clair`已弃用  

```bash
#更新配置文件

root@harbor01:/apps/harbor/harbor# ./prepare 
root@harbor01:/apps/harbor/harbor# ./install.sh --with-notary --with-trivy --with-chartmuseum

[Step 0]: checking if docker is installed ...

Note: docker version: 19.03.15

[Step 1]: checking docker-compose is installed ...

Note: docker-compose version: 1.24.1

[Step 2]: loading Harbor images ...
8991ee7e1c66: Loading layer [==================================================>]  37.72MB/37.72MB
caef0c5d2fe0: Loading layer [==================================================>]  43.84MB/43.84MB
d0ae0913849c: Loading layer [==================================================>]  66.03MB/66.03MB
d6c3137fc4e6: Loading layer [==================================================>]   18.2MB/18.2MB
db156fb6962c: Loading layer [==================================================>]  65.54kB/65.54kB
578a990cf79f: Loading layer [==================================================>]   2.56kB/2.56kB
9415b3c8b317: Loading layer [==================================================>]  1.536kB/1.536kB
bdb2dfba8b17: Loading layer [==================================================>]  12.29kB/12.29kB
6a1b6c491cd2: Loading layer [==================================================>]  2.613MB/2.613MB
c35c2488b48b: Loading layer [==================================================>]    407kB/407kB
Loaded image: goharbor/prepare:v2.7.0
Loaded image: goharbor/harbor-db:v2.7.0
Loaded image: goharbor/harbor-core:v2.7.0
Loaded image: goharbor/harbor-log:v2.7.0
Loaded image: goharbor/harbor-exporter:v2.7.0
Loaded image: goharbor/nginx-photon:v2.7.0
Loaded image: goharbor/chartmuseum-photon:v2.7.0
Loaded image: goharbor/harbor-portal:v2.7.0
Loaded image: goharbor/harbor-jobservice:v2.7.0
Loaded image: goharbor/harbor-registryctl:v2.7.0
Loaded image: goharbor/registry-photon:v2.7.0
Loaded image: goharbor/notary-server-photon:v2.7.0
Loaded image: goharbor/redis-photon:v2.7.0
Loaded image: goharbor/notary-signer-photon:v2.7.0
Loaded image: goharbor/trivy-adapter-photon:v2.7.0


[Step 3]: preparing environment ...

[Step 4]: preparing harbor configs ...
prepare base dir is set to /apps/harbor/harbor
Generated configuration file: /config/portal/nginx.conf
Generated configuration file: /config/log/logrotate.conf
Generated configuration file: /config/log/rsyslog_docker.conf
Generated configuration file: /config/nginx/nginx.conf
Generated configuration file: /config/core/env
Generated configuration file: /config/core/app.conf
Generated configuration file: /config/registry/config.yml
Generated configuration file: /config/registryctl/env
Generated configuration file: /config/registryctl/config.yml
Generated configuration file: /config/db/env
Generated configuration file: /config/jobservice/env
Generated configuration file: /config/jobservice/config.yml
Generated and saved secret to file: /data/secret/keys/secretkey
Successfully called func: create_root_cert
Generated configuration file: /config/trivy-adapter/env
Generated configuration file: /compose_location/docker-compose.yml
Clean up the input dir


Note: stopping existing Harbor instance ...
Removing network harbor_harbor
WARNING: Network harbor_harbor not found.


[Step 5]: starting Harbor ...
Creating network "harbor_harbor" with the default driver
Creating harbor-log ... done
Creating redis         ... done
Creating harbor-portal ... done
Creating registry      ... done
Creating harbor-db     ... done
Creating registryctl   ... done
Creating trivy-adapter ... done
Creating harbor-core   ... done
Creating harbor-jobservice ... done
Creating nginx             ... done
✔ ----Harbor has been installed and started successfully.----
```


### 2.4 harbor 调试

```bash
#关闭 harbor
$~ sudo docker-compose down -v

#更新配置
vim /apps/harbor.yml
prepare 

#重新生成配置文件,增加上其他chart功能等
sudo prepare --with-notary --with-trivy --with-chartmuseum

#启动 harbor
$~ sudo docker-compose up -d
```









##  3.创建集群配置实例  


### 3.1 ⽣成k8s集群 hosts⽂件
```bash
root@master01:/etc/kubeasz# ./ezctl new k8s-01
2023-01-03 04:52:33 DEBUG generate custom cluster files in /etc/kubeasz/clusters/k8s-01
2023-01-03 04:52:33 DEBUG set versions
2023-01-03 04:52:33 DEBUG cluster k8s-01: files successfully created.
2023-01-03 04:52:33 INFO next steps 1: to config '/etc/kubeasz/clusters/k8s-01/hosts'
2023-01-03 04:52:33 INFO next steps 2: to config '/etc/kubeasz/clusters/k8s-01/config.yml'


```

```bash
# 'NEW_INSTALL': 'true' to install a harbor server; 'false' to integrate with existed one
[harbor]
10.1.0.38 NEW_INSTALL=false

# [optional] loadbalance for accessing k8s from outside
[ex_lb]
#192.168.1.6 LB_ROLE=backup EX_APISERVER_VIP=192.168.1.250 EX_APISERVER_PORT=8443
#192.168.1.7 LB_ROLE=master EX_APISERVER_VIP=192.168.1.250 EX_APISERVER_PORT=8443

# [optional] ntp server for the cluster
[chrony]
#192.168.1.1

[all:vars]
# --------- Main Variables ---------------
# Secure port for apiservers
SECURE_PORT="6443"

# Cluster container-runtime supported: docker, containerd
# if k8s version >= 1.24, docker is not supported
CONTAINER_RUNTIME="containerd"

# Network plugins supported: calico, flannel, kube-router, cilium, kube-ovn
CLUSTER_NETWORK="calico"

# Service proxy mode of kube-proxy: 'iptables' or 'ipvs'
PROXY_MODE="ipvs"

# K8S Service CIDR, not overlap with node(host) networking
SERVICE_CIDR="10.10.0.0/16"

# Cluster CIDR (Pod CIDR), not overlap with node(host) networking
CLUSTER_CIDR="10.20.0.0/16"

# NodePort Range
NODE_PORT_RANGE="30000-65535"

# Cluster DNS Domain
CLUSTER_DNS_DOMAIN="ceamg.local"

# -------- Additional Variables (don't change the default value right now) ---
# Binaries Directory
bin_dir="/usr/local/bin"

# Deploy Directory (kubeasz workspace)
base_dir="/etc/kubeasz"

# Directory for a specific cluster
cluster_dir="{{ base_dir }}/clusters/k8s-01"

# CA and other components cert/key Directory
ca_dir="/etc/kubernetes/ssl"

```


### 3.1 ⽣成k8s集群 config ⽂件
```bash
root@master01:/etc/kubeasz# vim /etc/kubeasz/clusters/k8s-01/config.yml 

############################
# prepare
############################
# 可选离线安装系统软件包 (offline|online)
INSTALL_SOURCE: "online"

# 可选进行系统安全加固 github.com/dev-sec/ansible-collection-hardening
OS_HARDEN: false


############################
# role:deploy
############################
# default: ca will expire in 100 years
# default: certs issued by the ca will expire in 50 years
CA_EXPIRY: "876000h"
CERT_EXPIRY: "438000h"

# kubeconfig 配置参数
CLUSTER_NAME: "cluster1"
CONTEXT_NAME: "context-{{ CLUSTER_NAME }}"

# k8s version
K8S_VER: "1.24.2"

############################
# role:etcd
############################
# 设置不同的wal目录，可以避免磁盘io竞争，提高性能
ETCD_DATA_DIR: "/var/lib/etcd"
ETCD_WAL_DIR: ""


############################
# role:runtime [containerd,docker]
############################
# ------------------------------------------- containerd
# [.]启用容器仓库镜像
ENABLE_MIRROR_REGISTRY: true

# [containerd]基础容器镜像
SANDBOX_IMAGE: "easzlab.io.local:5000/easzlab/pause:3.7"

# [containerd]容器持久化存储目录
CONTAINERD_STORAGE_DIR: "/var/lib/containerd"

# ------------------------------------------- docker
# [docker]容器存储目录
DOCKER_STORAGE_DIR: "/var/lib/docker"

# [docker]开启Restful API
ENABLE_REMOTE_API: false

# [docker]信任的HTTP仓库
INSECURE_REG: '["http://easzlab.io.local:5000"]'


############################
# role:kube-master
############################
# k8s 集群 master 节点证书配置，可以添加多个ip和域名（比如增加公网ip和域名）
MASTER_CERT_HOSTS:
  - "10.1.1.1"
  - "k8s.easzlab.io"
  #- "www.test.com"

# node 节点上 pod 网段掩码长度（决定每个节点最多能分配的pod ip地址）
# 如果flannel 使用 --kube-subnet-mgr 参数，那么它将读取该设置为每个节点分配pod网段
# https://github.com/coreos/flannel/issues/847
NODE_CIDR_LEN: 24


############################
# role:kube-node
############################
# Kubelet 根目录
KUBELET_ROOT_DIR: "/var/lib/kubelet"

# node节点最大pod 数
MAX_PODS: 300

# 配置为kube组件（kubelet,kube-proxy,dockerd等）预留的资源量
# 数值设置详见templates/kubelet-config.yaml.j2
KUBE_RESERVED_ENABLED: "yes"

# k8s 官方不建议草率开启 system-reserved, 除非你基于长期监控，了解系统的资源占用状况；
# 并且随着系统运行时间，需要适当增加资源预留，数值设置详见templates/kubelet-config.yaml.j2
# 系统预留设置基于 4c/8g 虚机，最小化安装系统服务，如果使用高性能物理机可以适当增加预留
# 另外，集群安装时候apiserver等资源占用会短时较大，建议至少预留1g内存
SYS_RESERVED_ENABLED: "no"


############################
# role:network [flannel,calico,cilium,kube-ovn,kube-router]
############################
# ------------------------------------------- flannel
# [flannel]设置flannel 后端"host-gw","vxlan"等
FLANNEL_BACKEND: "vxlan"
DIRECT_ROUTING: false

# [flannel] flanneld_image: "quay.io/coreos/flannel:v0.10.0-amd64"
flannelVer: "v0.15.1"
flanneld_image: "easzlab.io.local:5000/easzlab/flannel:{{ flannelVer }}"

# ------------------------------------------- calico
# [calico]设置 CALICO_IPV4POOL_IPIP=“off”,可以提高网络性能，条件限制详见 docs/setup/calico.md
CALICO_IPV4POOL_IPIP: "Always"

# [calico]设置 calico-node使用的host IP，bgp邻居通过该地址建立，可手工指定也可以自动发现
IP_AUTODETECTION_METHOD: "can-reach={{ groups['kube_master'][0] }}"

# [calico]设置calico 网络 backend: brid, vxlan, none
CALICO_NETWORKING_BACKEND: "brid"

# [calico]设置calico 是否使用route reflectors
# 如果集群规模超过50个节点，建议启用该特性
CALICO_RR_ENABLED: false

# CALICO_RR_NODES 配置route reflectors的节点，如果未设置默认使用集群master节点 
# CALICO_RR_NODES: ["192.168.1.1", "192.168.1.2"]
CALICO_RR_NODES: []

# [calico]更新支持calico 版本: [v3.3.x] [v3.4.x] [v3.8.x] [v3.15.x]
calico_ver: "v3.19.4"

# [calico]calico 主版本
calico_ver_main: "{{ calico_ver.split('.')[0] }}.{{ calico_ver.split('.')[1] }}"

# ------------------------------------------- cilium
# [cilium]镜像版本
cilium_ver: "1.11.6"
cilium_connectivity_check: true
cilium_hubble_enabled: false
cilium_hubble_ui_enabled: false

# ------------------------------------------- kube-ovn
# [kube-ovn]选择 OVN DB and OVN Control Plane 节点，默认为第一个master节点
OVN_DB_NODE: "{{ groups['kube_master'][0] }}"

# [kube-ovn]离线镜像tar包
kube_ovn_ver: "v1.5.3"

# ------------------------------------------- kube-router
# [kube-router]公有云上存在限制，一般需要始终开启 ipinip；自有环境可以设置为 "subnet"
OVERLAY_TYPE: "full"

# [kube-router]NetworkPolicy 支持开关
FIREWALL_ENABLE: true

# [kube-router]kube-router 镜像版本
kube_router_ver: "v0.3.1"
busybox_ver: "1.28.4"


############################
# role:cluster-addon
############################
# coredns 自动安装
dns_install: "no"
corednsVer: "1.9.3"
ENABLE_LOCAL_DNS_CACHE: false
dnsNodeCacheVer: "1.21.1"
# 设置 local dns cache 地址
LOCAL_DNS_CACHE: "169.254.20.10"

# metric server 自动安装
metricsserver_install: "no"
metricsVer: "v0.5.2"

# dashboard 自动安装
dashboard_install: "no"
dashboardVer: "v2.5.1"
dashboardMetricsScraperVer: "v1.0.8"

# prometheus 自动安装
prom_install: "no"
prom_namespace: "monitor"
prom_chart_ver: "35.5.1"

# nfs-provisioner 自动安装
nfs_provisioner_install: "no"
nfs_provisioner_namespace: "kube-system"
nfs_provisioner_ver: "v4.0.2"
nfs_storage_class: "managed-nfs-storage"
nfs_server: "192.168.1.10"
nfs_path: "/data/nfs"

# network-check 自动安装
network_check_enabled: false
network_check_schedule: "*/5 * * * *"

############################
# role:harbor
############################
# harbor version，完整版本号
HARBOR_VER: "v2.1.3"
HARBOR_DOMAIN: "harbor.easzlab.io.local"
HARBOR_TLS_PORT: 8443

# if set 'false', you need to put certs named harbor.pem and harbor-key.pem in directory 'down'
HARBOR_SELF_SIGNED_CERT: true

# install extra component
HARBOR_WITH_NOTARY: false
HARBOR_WITH_TRIVY: false
HARBOR_WITH_CLAIR: false
HARBOR_WITH_CHARTMUSEUM: true

```






## 4.步骤1-基础环境初始化
```bash
root@master01:/etc/kubeasz# ./ezctl help setup
Usage: ezctl setup <cluster> <step>
available steps:
    01  prepare            to prepare CA/certs & kubeconfig & other system settings 
    02  etcd               to setup the etcd cluster
    03  container-runtime  to setup the container runtime(docker or containerd)
    04  kube-master        to setup the master nodes
    05  kube-node          to setup the worker nodes
    06  network            to setup the network plugin
    07  cluster-addon      to setup other useful plugins
    90  all                to run 01~07 all at once
    10  ex-lb              to install external loadbalance for accessing k8s from outside
    11  harbor             to install a new harbor server or to integrate with an existed one

examples: ./ezctl setup test-k8s 01  (or ./ezctl setup test-k8s prepare)
	  ./ezctl setup test-k8s 02  (or ./ezctl setup test-k8s etcd)
          ./ezctl setup test-k8s all
          ./ezctl setup test-k8s 04 -t restart_master

vim playbooks/01.prepare.yml 
#系统基础初始化主机配置

root@master01:/etc/kubeasz# ./ezctl setup k8s-01 01
#准备CA和基础系统设置
```



## 5.步骤2-部署etcd集群

可更改启动脚本路径及版本等⾃定义配置
```bash
root@master01:/etc/kubeasz# ./ezctl setup k8s-01 02
ansible-playbook -i clusters/k8s-01/hosts -e @clusters/k8s-01/config.yml  playbooks/02.etcd.yml
2023-01-03 13:39:13 INFO cluster:k8s-01 setup step:02 begins in 5s, press any key to abort


```


健康检查
```bash
export NODE_IPS="10.1.0.34 10.1.0.35"

root@etcd01:~# for ip in ${NODE_IPS}; do ETCDCTL_API=3 /usr/local/bin/etcdctl --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem endpoint health; done
https://10.1.0.34:2379 is healthy: successfully committed proposal: took = 14.95631ms
https://10.1.0.35:2379 is healthy: successfully committed proposal: took = 15.037491ms

注：以上返回信息表示etcd集群运⾏正常，否则异常！
```





部署containerd

同步docker证书脚本：
```bash
#!/bin/bash
#⽬标主机列表
IP="
10.1.0.32
10.1.0.33
10.1.0.34
10.1.0.35
"

for node in ${IP};do
  sshpass -p ceamg.com ssh-copy-id ${node} -o StrictHostKeyChecking=no
  if [ $? -eq 0 ];then
   echo "${node} 秘钥copy完成"
   echo "${node} 秘钥copy完成,准备环境初始化....."
   ssh ${node} "mkdir /etc/containerd/certs.d/harbor.ceamg.com -p"
   echo "Harbor 证书创建成功!"
   scp /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.cert  /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.crt /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.key /etc/containerd/certs.d/harbor.ceamg.com/ca.crt ${node}:/etc/containerd/certs.d/harbor.ceamg.com/
  echo "Harbor 证书拷贝成功!"
  ssh ${node} "echo "10.1.0.38 harbor.ceamg.com" >> /etc/hosts"
  echo "host 解析添加完成"
#scp -r /root/.docker ${node}:/root/
#echo "Harbor 认证件拷完成!"
else
echo "${node} 秘钥copy失败"
fi
done
#执⾏脚本进⾏证书分发
root@k8s-master1:/etc/kubeasz# bash /root/scp-key.sh
```



## 6.步骤3-部署运行时环境

项目根据k8s版本提供不同的默认容器运行时：

- k8s 版本 < 1.24 时，支持docker containerd 可选
- k8s 版本 >= 1.24 时，仅支持 containerd

### 6.1 kubeasz 集成安装 containerd
<br /> 注意：k8s 1.24以后，项目已经设置默认容器运行时为 containerd，无需手动修改  

```bash
./ezctl setup k8s-01 05
```



### 6.2 配置containerd 对接私有harbor仓库
修改role模板文件
```bash
vim roles/containerd/templates/config.toml.j2
```

主要修改如下：
```bash
 [plugins."io.containerd.grpc.v1.cri".registry]

      [plugins."io.containerd.grpc.v1.cri".registry.auths]

      [plugins."io.containerd.grpc.v1.cri".registry.configs]
        [plugins."io.containerd.grpc.v1.cri".registry.configs."https://harbor.ceamg.com"]
           username = "admin"
           password = "ceamg.com"

        [plugins."io.containerd.grpc.v1.cri".registry.configs."easzlab.io.local:5000".tls]
          insecure_skip_verify = true

        [plugins."io.containerd.grpc.v1.cri".registry.configs."harbor.ceamg.com".tls]
          insecure_skip_verify = true
          ca_file = "/etc/containerd/certs.d/harbor.ceamg.com/ca.crt"
          cert_file = "/etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.cert"
          key_file = "/etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.key"

      [plugins."io.containerd.grpc.v1.cri".registry.headers]

      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."easzlab.io.local:5000"]
          endpoint = ["http://easzlab.io.local:5000"]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."harbor.ceamg.com"]
          endpoint = ["https://harbor.ceamg.com"]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://lc2kkql3.mirror.aliyuncs.com","https://docker.mirrors.ustc.edu.cn", "http://hub-mirror.c.163.com"]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."gcr.io"]
          endpoint = ["https://gcr.mirrors.ustc.edu.cn"]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
          endpoint = ["https://gcr.mirrors.ustc.edu.cn/google-containers/"]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."quay.io"]
          endpoint = ["https://quay.mirrors.ustc.edu.cn"]

      [plugins."io.containerd.grpc.v1.cri".registry.auths."https://harbor.ceamg.com"]

    [plugins."io.containerd.grpc.v1.cri".x509_key_pair_streaming]
      tls_cert_file = ""
      tls_key_file = ""



```



### 6.3 containerd 使用证书对接harbor实现上传下载

#### 6.3.1 使用脚本同步证书到客户端
```bash
#!/bin/bash
#目标主机列表
IP="
10.1.0.32
10.1.0.33
10.1.0.34
10.1.0.35
"

for node in ${IP};do
  sshpass -p ceamg.com ssh-copy-id ${node} -o StrictHostKeyChecking=no
  if [ $? -eq 0 ];then
   echo "${node} 秘钥copy完成"
   echo "${node} 秘钥copy完成,准备环境初始化....."
   ssh ${node} "mkdir /etc/containerd/certs.d/harbor.ceamg.com -p"
   echo "Harbor 证书创建成功!"
   scp /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.cert  /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.crt /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.key /etc/containerd/certs.d/harbor.ceamg.com/ca.crt ${node}:/etc/containerd/certs.d/harbor.ceamg.com/
  echo "Harbor 证书拷贝成功!"
  ssh ${node} "echo "10.1.0.38 harbor.ceamg.com" >> /etc/hosts"
  echo "host 解析添加完成"
#scp -r /root/.docker ${node}:/root/
#echo "Harbor 认证件拷完成!"
else
echo "${node} 秘钥copy失败"
fi
done

```



#### 6.3.2 测试containerd 客户端使用证书登录harbor
推送镜像 <br />[nerdctl.pdf](https://www.yuque.com/attachments/yuque/0/2023/pdf/33538388/1672731322660-c020aeef-2273-40b3-877c-c28089c7d7b0.pdf?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fpdf%2F33538388%2F1672731322660-c020aeef-2273-40b3-877c-c28089c7d7b0.pdf%22%2C%22name%22%3A%22nerdctl.pdf%22%2C%22size%22%3A28536832%2C%22ext%22%3A%22pdf%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22type%22%3A%22application%2Fpdf%22%2C%22mode%22%3A%22title%22%2C%22taskId%22%3A%22u2d812840-191c-45c4-aec0-85144ca300b%22%2C%22taskType%22%3A%22upload%22%2C%22__spacing%22%3A%22both%22%2C%22id%22%3A%22TItzJ%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)
```bash
root@master01:/etc/containerd/certs.d/harbor.ceamg.com# ls
ca.crt  harbor.ceamg.com.cert  harbor.ceamg.com.crt  harbor.ceamg.com.key

root@master01:/etc/containerd/certs.d/harbor.ceamg.com# nerdctl login harbor.ceamg.com
WARNING: Your password will be stored unencrypted in /root/.docker/config.json.
Configure a credential helper to remove this warning. See
https://docs.docker.com/engine/reference/commandline/login/#credentials-store

Login Succeeded


root@master01:/etc/containerd/certs.d/harbor.ceamg.com# nerdctl images
REPOSITORY                        TAG       IMAGE ID        CREATED        PLATFORM       SIZE         BLOB SIZE
nginx                             latest    0047b729188a    4 hours ago    linux/amd64    149.4 MiB    54.2 MiB
harbor.ceamg.com/library/nginx    latest    0047b729188a    3 hours ago    linux/amd64    149.4 MiB    54.2 MiB
root@master01:/etc/containerd/certs.d/harbor.ceamg.com# nerdctl push harbor.ceamg.com/library/nginx
INFO[0000] pushing as a reduced-platform image (application/vnd.docker.distribution.manifest.list.v2+json, sha256:3f727bfae5cee62f35f014637b350dbc1d0b416bdd1717b61c5ce5b036771aa0) 
index-sha256:3f727bfae5cee62f35f014637b350dbc1d0b416bdd1717b61c5ce5b036771aa0:    done           |++++++++++++++++++++++++++++++++++++++| 
manifest-sha256:9a821cadb1b13cb782ec66445325045b2213459008a41c72d8d87cde94b33c8c: done           |++++++++++++++++++++++++++++++++++++++| 
config-sha256:1403e55ab369cd1c8039c34e6b4d47ca40bbde39c371254c7cba14756f472f52:   done           |++++++++++++++++++++++++++++++++++++++| 
elapsed: 1.1 s                                                                    total:  9.3 Ki (8.5 KiB/s)          
```




## 7.步骤4-部署master
```bash
cat playbooks/04.kube-master.yml
- hosts: kube_master
  roles:
  - kube-lb        # 四层负载均衡，监听在127.0.0.1:6443，转发到真实master节点apiserver服务
  - kube-master    #
  - kube-node      # 因为网络、监控等daemonset组件，master节点也推荐安装kubelet和kube-proxy服务
  ... 
```
```bash
root@master01:/etc/kubeasz# ./ezctl setup k8s-01 04
ansible-playbook -i clusters/k8s-01/hosts -e @clusters/k8s-01/config.yml  playbooks/04.kube-master.yml
2023-01-03 14:07:04 INFO cluster:k8s-01 setup step:04 begins in 5s, press any key to abort:

```



**验证 master 集群**

```bash
# 查看进程状态
systemctl status kube-apiserver
systemctl status kube-controller-manager
systemctl status kube-scheduler
# 查看进程运行日志
journalctl -u kube-apiserver
journalctl -u kube-controller-manager
journalctl -u kube-scheduler
```

 执行 `kubectl get componentstatus` 可以看到  
```bash
root@master01:/etc/kubeasz# kubectl get componentstatus
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE                         ERROR
scheduler            Healthy   ok                              
controller-manager   Healthy   ok                              
etcd-1               Healthy   {"health":"true","reason":""}   
etcd-0               Healthy   {"health":"true","reason":""}   

```

## 8.步骤5-部署node节点
**kube_node** 是集群中运行工作负载的节点，前置条件需要先部署好kube_master节点，它需要部署如下组件：  

```bash
cat playbooks/05.kube-node.yml
- hosts: kube_node
  roles:
  - { role: kube-lb, when: "inventory_hostname not in groups['kube_master']" }
  - { role: kube-node, when: "inventory_hostname not in groups['kube_master']" }
```


- kube-lb：由nginx裁剪编译的四层负载均衡，用于将请求转发到主节点的 apiserver服务
- kubelet：kube_node上最主要的组件
- kube-proxy： 发布应用服务与负载均衡

```bash
root@master01:/etc/kubeasz# ./ezctl setup k8s-01 05
ansible-playbook -i clusters/k8s-01/hosts -e @clusters/k8s-01/config.yml  playbooks/05.kube-node.yml
2023-01-04 09:06:25 INFO cluster:k8s-01 setup step:05 begins in 5s, press any key to abort:
```



**验证 node 状态**

```bash
systemctl status kubelet	# 查看状态
systemctl status kube-proxy
journalctl -u kubelet		# 查看日志
journalctl -u kube-proxy 
```
 运行` kubectl get node` 可以看到类似  
```bash
root@worker01:/etc/containerd/certs.d/harbor.ceamg.com# kubectl get nodes
NAME        STATUS                     ROLES    AGE   VERSION
10.1.0.31   Ready,SchedulingDisabled   master   21h   v1.24.2
10.1.0.32   Ready                      node     21h   v1.24.2
10.1.0.33   Ready                      node     21h   v1.24.2

```



## 9.步骤6-部署网络组件

首先回顾下K8S网络设计原则，在配置集群网络插件或者实践K8S 应用/服务部署请牢记这些原则：

- 1.每个Pod都拥有一个独立IP地址，Pod内所有容器共享一个网络命名空间
- 2.集群内所有Pod都在一个直接连通的扁平网络中，可通过IP直接访问 
   - 所有容器之间无需NAT就可以直接互相访问
   - 所有Node和所有容器之间无需NAT就可以直接互相访问
   - 容器自己看到的IP跟其他容器看到的一样
- 3.Service cluster IP只可在集群内部访问，外部请求需要通过NodePort、LoadBalance或者Ingress来访问



 calico 是k8s社区最流行的网络插件之一，也是k8s-conformance test 默认使用的网络插件，功能丰富，支持network policy；是当前kubeasz项目的默认网络插件。  <br /> 如果需要安装calico，请在**clusters/xxxx/hosts**文件中设置变量 `CLUSTER_NETWORK="calico"`


### 9.1 使⽤calico⽹络组件
```bash
vim clusters/k8s-01/config.yml
# ------------------------------------------- calico
# [calico]设置 CALICO_IPV4POOL_IPIP=“off”,可以提高网络性能，条件限制详见 docs/setup/calico.md
CALICO_IPV4POOL_IPIP: "Always"

# [calico]设置 calico-node使用的host IP，bgp邻居通过该地址建立，可手工指定也可以自动发现
IP_AUTODETECTION_METHOD: "can-reach={{ groups['kube_master'][0] }}"

# [calico]设置calico 网络 backend: brid, vxlan, none
CALICO_NETWORKING_BACKEND: "brid"

# [calico]设置calico 是否使用route reflectors
# 如果集群规模超过50个节点，建议启用该特性
CALICO_RR_ENABLED: false

# CALICO_RR_NODES 配置route reflectors的节点，如果未设置默认使用集群master节点 
# CALICO_RR_NODES: ["192.168.1.1", "192.168.1.2"]
CALICO_RR_NODES: []

# [calico]更新支持calico 版本: [v3.3.x] [v3.4.x] [v3.8.x] [v3.15.x]
calico_ver: "v3.19.4"

# [calico]calico 主版本
calico_ver_main: "{{ calico_ver.split('.')[0] }}.{{ calico_ver.split('.')[1] }}"

```
```bash
./ezctl setup k8s-01 06
```


### 9.2 验证calico网络
 执行calico安装成功后可以验证如下：(需要等待镜像下载完成，有时候即便上一步已经配置了docker国内加速，还是可能比较慢，请确认以下容器运行起来以后，再执行后续验证步骤)  


### 9.3 查看所有calico节点状态

```bash
root@master01:/etc/kubeasz# kubectl get pod -A -o wide
NAMESPACE     NAME                                       READY   STATUS    RESTARTS   AGE     IP          NODE        NOMINATED NODE   READINESS GATES
kube-system   calico-kube-controllers-5c8bb696bb-hf2cp   1/1     Running   0          6m10s   10.1.0.33   10.1.0.33   <none>           <none>
kube-system   calico-node-6nlt6                          1/1     Running   0          6m10s   10.1.0.32   10.1.0.32   <none>           <none>
kube-system   calico-node-fd6rj                          1/1     Running   0          6m10s   10.1.0.33   10.1.0.33   <none>           <none>
kube-system   calico-node-lhgh4                          1/1     Running   0          6m10s   10.1.0.31   10.1.0.31   <none>           <none>
```


```bash
root@master01:/etc/kubeasz# calicoctl node status
Calico process is running.

IPv4 BGP status
+--------------+-------------------+-------+----------+-------------+
| PEER ADDRESS |     PEER TYPE     | STATE |  SINCE   |    INFO     |
+--------------+-------------------+-------+----------+-------------+
| 10.1.0.32    | node-to-node mesh | up    | 04:16:44 | Established |
| 10.1.0.33    | node-to-node mesh | up    | 04:16:43 | Established |
+--------------+-------------------+-------+----------+-------------+
```


### 9.4 创建容器测试网络通信
```bash
root@master01:/etc/kubeasz# kubectl run net-test1 --image=harbor.ceamg.com/library/alpine sleep 360000
pod/net-test1 created
root@master01:/etc/kubeasz# kubectl run net-test2 --image=harbor.ceamg.com/library/alpine sleep 360000
pod/net-test2 created
root@master01:/etc/kubeasz# kubectl run net-test3 --image=harbor.ceamg.com/library/alpine sleep 360000
pod/net-test3 created


root@master01:/etc/kubeasz# kubectl get pod -o wide
NAME        READY   STATUS    RESTARTS   AGE   IP            NODE        NOMINATED NODE   READINESS GATES
net-test1   1/1     Running   0          19s   10.20.5.3     10.1.0.32   <none>           <none>
net-test2   1/1     Running   0          15s   10.20.30.67   10.1.0.33   <none>           <none>
net-test3   1/1     Running   0          12s   10.20.30.68   10.1.0.33   <none>           <none>
test        1/1     Running   0          16m   10.20.5.1     10.1.0.32   <none>           <none>

```

```bash
root@master01:/etc/kubeasz# kubectl exec -it net-test1 -- sh
/ # ping 10.20.30.67
PING 10.20.30.67 (10.20.30.67): 56 data bytes
64 bytes from 10.20.30.67: seq=0 ttl=62 time=0.481 ms
^C
--- 10.20.30.67 ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 0.481/0.481/0.481 ms
/ # ping 10.20.30.68
PING 10.20.30.68 (10.20.30.68): 56 data bytes
64 bytes from 10.20.30.68: seq=0 ttl=62 time=0.631 ms
64 bytes from 10.20.30.68: seq=1 ttl=62 time=1.360 ms
64 bytes from 10.20.30.68: seq=2 ttl=62 time=0.420 ms
^C
--- 10.20.30.68 ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max = 0.420/0.803/1.360 ms
/ # ping 223.5.5.5
PING 223.5.5.5 (223.5.5.5): 56 data bytes
64 bytes from 223.5.5.5: seq=0 ttl=114 time=7.597 ms
64 bytes from 223.5.5.5: seq=1 ttl=114 time=7.072 ms
64 bytes from 223.5.5.5: seq=2 ttl=114 time=7.583 ms
^C
--- 223.5.5.5 ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max = 7.072/7.417/7.597 ms
```



## 10.步骤7-安装集群插件-coredns
 DNS 是 k8s 集群首要部署的组件，它为集群中的其他 pods 提供域名解析服务；主要可以解析 集群服务名 SVC 和 Pod hostname；目前建议部署 coredns。  


### 10.1 下载二进制包
[kubernetes/CHANGELOG-1.24.md at master · kubernetes/kubernetes](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.24.md#downloads-for-v1249)

```bash
root@master01:/usr/local/src# ll
total 489740
drwxr-xr-x  2 root root      4096 Jan  4 13:09 ./
drwxr-xr-x 13 root root      4096 Jan  1 13:20 ../
-rw-r--r--  1 root root  30495559 Jan  4 13:09 kubernetes-client-linux-amd64.tar.gz
-rw-r--r--  1 root root 123361203 Jan  4 13:09 kubernetes-node-linux-amd64.tar.gz
-rw-r--r--  1 root root 347075448 Jan  4 13:09 kubernetes-server-linux-amd64.tar.gz
-rw-r--r--  1 root root    532769 Jan  4 13:09 kubernetes.tar.gz

#解压后
root@master01:/usr/local/src/kubernetes# ll
total 36996
drwxr-xr-x 10 root root     4096 Dec  8 18:31 ./
drwxr-xr-x  3 root root     4096 Jan  4 13:11 ../
drwxr-xr-x  2 root root     4096 Dec  8 18:26 addons/
drwxr-xr-x  3 root root     4096 Dec  8 18:31 client/
drwxr-xr-x  9 root root     4096 Dec  8 18:31 cluster/
drwxr-xr-x  2 root root     4096 Dec  8 18:31 docs/
drwxr-xr-x  3 root root     4096 Dec  8 18:31 hack/
-rw-r--r--  1 root root 37826576 Dec  8 18:26 kubernetes-src.tar.gz
drwxr-xr-x  4 root root     4096 Dec  8 18:31 LICENSES/
drwxr-xr-x  3 root root     4096 Dec  8 18:25 node/
-rw-r--r--  1 root root     4443 Dec  8 18:31 README.md
drwxr-xr-x  3 root root     4096 Dec  8 18:31 server/
-rw-r--r--  1 root root        8 Dec  8 18:31 version

#插件目录

root@master01:/usr/local/src/kubernetes/cluster/addons# ll
total 80
drwxr-xr-x 18 root root 4096 Dec  8 18:31 ./
drwxr-xr-x  9 root root 4096 Dec  8 18:31 ../
drwxr-xr-x  2 root root 4096 Dec  8 18:31 addon-manager/
drwxr-xr-x  3 root root 4096 Dec  8 18:31 calico-policy-controller/
drwxr-xr-x  3 root root 4096 Dec  8 18:31 cluster-loadbalancing/
drwxr-xr-x  3 root root 4096 Dec  8 18:31 device-plugins/
drwxr-xr-x  5 root root 4096 Dec  8 18:31 dns/
drwxr-xr-x  2 root root 4096 Dec  8 18:31 dns-horizontal-autoscaler/
drwxr-xr-x  4 root root 4096 Dec  8 18:31 fluentd-gcp/
drwxr-xr-x  3 root root 4096 Dec  8 18:31 ip-masq-agent/
drwxr-xr-x  2 root root 4096 Dec  8 18:31 kube-proxy/
drwxr-xr-x  3 root root 4096 Dec  8 18:31 metadata-agent/
drwxr-xr-x  3 root root 4096 Dec  8 18:31 metadata-proxy/
drwxr-xr-x  2 root root 4096 Dec  8 18:31 metrics-server/
drwxr-xr-x  5 root root 4096 Dec  8 18:31 node-problem-detector/
-rw-r--r--  1 root root  104 Dec  8 18:31 OWNERS
drwxr-xr-x  8 root root 4096 Dec  8 18:31 rbac/
-rw-r--r--  1 root root 1655 Dec  8 18:31 README.md
drwxr-xr-x  8 root root 4096 Dec  8 18:31 storage-class/
drwxr-xr-x  4 root root 4096 Dec  8 18:31 volumesnapshots/


root@master01:/usr/local/src/kubernetes/cluster/addons/dns/coredns# ll
total 44
drwxr-xr-x 2 root root 4096 Dec  8 18:31 ./
drwxr-xr-x 5 root root 4096 Dec  8 18:31 ../
-rw-r--r-- 1 root root 5060 Dec  8 18:31 coredns.yaml.base
-rw-r--r-- 1 root root 5110 Dec  8 18:31 coredns.yaml.in
-rw-r--r-- 1 root root 5112 Dec  8 18:31 coredns.yaml.sed
-rw-r--r-- 1 root root 1075 Dec  8 18:31 Makefile
-rw-r--r-- 1 root root  344 Dec  8 18:31 transforms2salt.sed
-rw-r--r-- 1 root root  287 Dec  8 18:31 transforms2sed.sed


cp coredns.yaml.base /root/

mv /root/coredns.yaml.base  /root/coredns-ceamg.yaml

vim /root/coredns-ceamg.yaml
```


### 10.2 修改配置文件
**主要配置参数：**
```bash
error: #错误⽇志输出到stdout。
health： #CoreDNS的运⾏状况报告为http://localhost:8080/health.
cache： #启⽤coredns缓存。
reload：#配置⾃动重新加载配置⽂件，如果修改了ConfigMap的配置，会在两分钟后⽣效.
loadbalance：#⼀个域名有多个记录会被轮询解析。
cache 30 #缓存时间
kubernetes：#CoreDNS将根据指定的service domain名称在Kubernetes SVC中进⾏域名解析。
forward： #不是Kubernetes集群域内的域名查询都进⾏转发指定的服务器（/etc/resolv.conf）
prometheus：#CoreDNS的指标数据可以配置Prometheus 访问http://coredns svc:9153/metrics 进⾏收集。
ready：#当coredns 服务启动完成后会进⾏在状态监测，会有个URL 路径为/ready返回200状态码，否则返回报错。
```

`kubernetes __DNS__DOMAIN_`是 `clusters/k8s-01/hosts` 中填写的内容`CLUSTER_DNS_DOMAIN`
```bash
# Cluster DNS Domain
CLUSTER_DNS_DOMAIN="ceamg.local"
```

212   `clusterIP: __DNS__SERVER__`是`clusters/k8s-01/hosts` 中填写的内容`SERVICE_CIDR` 第二个IP 也就是 10.10.0.2
```bash
# K8S Service CIDR, not overlap with node(host) networking
SERVICE_CIDR="10.10.0.0/16


/ # cat /etc/resolv.conf 
search default.svc.ceamg.local svc.ceamg.local ceamg.local
nameserver 10.10.0.2

```
修改如下行内容：
```bash
77         kubernetes ceamg.local in-addr.arpa ip6.arpa {
83         forward . 192.168.0.15 {
142         image: harbor.ceamg.com/baseimages/coredns:v1.8.6
145           limits:
146             memory: 2048Mi
147           requests:
148             cpu: 1000m
149             memory: 1024Mi
212   clusterIP: 10.10.0.2


209 spec:
210   type: NodePort
211   selector:
212     k8s-app: kube-dns
213   clusterIP: 10.10.0.2
214   ports:
215   - name: dns
216     port: 53
217     protocol: UDP
218   - name: dns-tcp
219     port: 53
220     protocol: TCP
221   - name: metrics
222     port: 9153
223     protocol: TCP
224     targetPort: 9153
225     nodePort: 30009

```

> 查看资源格式：
> kubectl explain



### 10.3 下载镜像并推送到harbor

```bash
root@master01:/usr/local/src/kubernetes/cluster/addons/dns/coredns# nerdctl pull registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:v1.8.6
root@master01:/usr/local/src/kubernetes/cluster/addons/dns/coredns# nerdctl tag registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:v1.8.6 harbor.ceamg.com/baseimages/coredns:v1.8.6
root@master01:/usr/local/src/kubernetes/cluster/addons/dns/coredns# nerdctl push harbor.ceamg.com/baseimages/coredns:v1.8.6
INFO[0000] pushing as a reduced-platform image (application/vnd.docker.distribution.manifest.list.v2+json, sha256:53011ff05d62cd740ae785a98f646ace63374073b0e564a35d4cea008f040940) 
```



### 10.4 安装coredns 
```bash
root@master01:/usr/local/src/kubernetes/cluster/addons/dns/coredns# kubectl apply -f /root/coredns-ceamg.yaml 
serviceaccount/coredns created
clusterrole.rbac.authorization.k8s.io/system:coredns created
clusterrolebinding.rbac.authorization.k8s.io/system:coredns created
configmap/coredns created
deployment.apps/coredns created
service/kube-dns created

root@master01:~# kubectl get pod -A
NAMESPACE     NAME                                       READY   STATUS    RESTARTS      AGE
default       net-test1                                  1/1     Running   0             25m
default       net-test2                                  1/1     Running   0             25m
default       net-test3                                  1/1     Running   0             25m
default       net-test4                                  1/1     Running   0             49m
kube-system   calico-kube-controllers-5c8bb696bb-hf2cp   1/1     Running   1 (57m ago)   151m
kube-system   calico-node-6nlt6                          1/1     Running   0             151m
kube-system   calico-node-fd6rj                          1/1     Running   0             151m
kube-system   calico-node-lhgh4                          1/1     Running   0             151m
kube-system   coredns-6c496b89f6-hd8vf                   1/1     Running   0             3s
```


### 10.5 启动容器测试域名解析
```bash
root@master01:~# kubectl exec -it net-test1 
error: you must specify at least one command for the container
root@master01:~# kubectl exec -it net-test1  -- sh
/ # 
/ # ping www.baidu.com
PING www.baidu.com (110.242.68.3): 56 data bytes
64 bytes from 110.242.68.3: seq=0 ttl=49 time=9.778 ms

--- www.baidu.com ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 9.778/9.778/9.778 ms
/ # 
/ # cat /etc/resolv.conf 
search default.svc.ceamg.local svc.ceamg.local ceamg.local
nameserver 10.10.0.2
options ndots:5
```


### 10.6 测试 prometheus 监控项
[http://10.1.0.31:30009/metrics](http://10.1.0.31:30009/metrics)<br />![prometheus监控项接口访问](http://img.xinn.cc/1672815227326-157edf5d-ca34-48af-be12-9e8c529e0271.png)




## 11. 步骤8-安装集群插件-dashboard
[https://github.com/kubernetes/dashboard](https://github.com/kubernetes/dashboard)

### 11.1 下载对应kubernetes版本的dashboard

**Compatibility**

| Kubernetes version | 1.21 | 1.22 | 1.23 | 1.24 |
| --- | --- | --- | --- | --- |
| Compatibility | ? | ? | ? | ✓ |

- ✓ Fully supported version range.
- ? Due to breaking changes between Kubernetes API versions, some features might not work correctly in the Dashboard.


![2.6.1版本](http://img.xinn.cc/1672820696762-d1dfdf70-772d-43c6-9047-43d17459f886.png)

```yaml
# Copyright 2017 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

apiVersion: v1
kind: Namespace
metadata:
  name: kubernetes-dashboard

---

apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard

---

kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  ports:
    - port: 443
      targetPort: 8443
  selector:
    k8s-app: kubernetes-dashboard

---

apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-certs
  namespace: kubernetes-dashboard
type: Opaque

---

apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-csrf
  namespace: kubernetes-dashboard
type: Opaque
data:
  csrf: ""

---

apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-key-holder
  namespace: kubernetes-dashboard
type: Opaque

---

kind: ConfigMap
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-settings
  namespace: kubernetes-dashboard

---

kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
rules:
  # Allow Dashboard to get, update and delete Dashboard exclusive secrets.
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["kubernetes-dashboard-key-holder", "kubernetes-dashboard-certs", "kubernetes-dashboard-csrf"]
    verbs: ["get", "update", "delete"]
    # Allow Dashboard to get and update 'kubernetes-dashboard-settings' config map.
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["kubernetes-dashboard-settings"]
    verbs: ["get", "update"]
    # Allow Dashboard to get metrics.
  - apiGroups: [""]
    resources: ["services"]
    resourceNames: ["heapster", "dashboard-metrics-scraper"]
    verbs: ["proxy"]
  - apiGroups: [""]
    resources: ["services/proxy"]
    resourceNames: ["heapster", "http:heapster:", "https:heapster:", "dashboard-metrics-scraper", "http:dashboard-metrics-scraper"]
    verbs: ["get"]

---

kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
rules:
  # Allow Metrics Scraper to get metrics from the Metrics server
  - apiGroups: ["metrics.k8s.io"]
    resources: ["pods", "nodes"]
    verbs: ["get", "list", "watch"]

---

apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: kubernetes-dashboard
subjects:
  - kind: ServiceAccount
    name: kubernetes-dashboard
    namespace: kubernetes-dashboard

---

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kubernetes-dashboard
subjects:
  - kind: ServiceAccount
    name: kubernetes-dashboard
    namespace: kubernetes-dashboard

---

kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      k8s-app: kubernetes-dashboard
  template:
    metadata:
      labels:
        k8s-app: kubernetes-dashboard
    spec:
      securityContext:
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: kubernetes-dashboard
          image: kubernetesui/dashboard:v2.6.1
          imagePullPolicy: Always
          ports:
            - containerPort: 8443
              protocol: TCP
          args:
            - --auto-generate-certificates
            - --namespace=kubernetes-dashboard
            # Uncomment the following line to manually specify Kubernetes API server Host
            # If not specified, Dashboard will attempt to auto discover the API server and connect
            # to it. Uncomment only if the default does not work.
            # - --apiserver-host=http://my-address:port
          volumeMounts:
            - name: kubernetes-dashboard-certs
              mountPath: /certs
              # Create on-disk volume to store exec logs
            - mountPath: /tmp
              name: tmp-volume
          livenessProbe:
            httpGet:
              scheme: HTTPS
              path: /
              port: 8443
            initialDelaySeconds: 30
            timeoutSeconds: 30
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsUser: 1001
            runAsGroup: 2001
      volumes:
        - name: kubernetes-dashboard-certs
          secret:
            secretName: kubernetes-dashboard-certs
        - name: tmp-volume
          emptyDir: {}
      serviceAccountName: kubernetes-dashboard
      nodeSelector:
        "kubernetes.io/os": linux
      # Comment the following tolerations if Dashboard must not be deployed on master
      tolerations:
        - key: node-role.kubernetes.io/master
          effect: NoSchedule

---

kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: dashboard-metrics-scraper
  name: dashboard-metrics-scraper
  namespace: kubernetes-dashboard
spec:
  ports:
    - port: 8000
      targetPort: 8000
  selector:
    k8s-app: dashboard-metrics-scraper

---

kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    k8s-app: dashboard-metrics-scraper
  name: dashboard-metrics-scraper
  namespace: kubernetes-dashboard
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      k8s-app: dashboard-metrics-scraper
  template:
    metadata:
      labels:
        k8s-app: dashboard-metrics-scraper
    spec:
      securityContext:
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: dashboard-metrics-scraper
          image: kubernetesui/metrics-scraper:v1.0.8
          ports:
            - containerPort: 8000
              protocol: TCP
          livenessProbe:
            httpGet:
              scheme: HTTP
              path: /
              port: 8000
            initialDelaySeconds: 30
            timeoutSeconds: 30
          volumeMounts:
          - mountPath: /tmp
            name: tmp-volume
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsUser: 1001
            runAsGroup: 2001
      serviceAccountName: kubernetes-dashboard
      nodeSelector:
        "kubernetes.io/os": linux
      # Comment the following tolerations if Dashboard must not be deployed on master
      tolerations:
        - key: node-role.kubernetes.io/master
          effect: NoSchedule
      volumes:
        - name: tmp-volume
          emptyDir: {}
```


### 11.2 修改service暴露方式
```yaml
32 kind: Service
 33 apiVersion: v1
 34 metadata:
 35   labels:
 36     k8s-app: kubernetes-dashboard
 37   name: kubernetes-dashboard
 38   namespace: kubernetes-dashboard
 39 spec:
 40   type: NodePort
 41   ports:
 42     - port: 443
 43       targetPort: 8443
 44       nodePort: 30010
 45   selector:
 46     k8s-app: kubernetes-dashboard
```


### 11.3 下载镜像推送到harbor
```yaml
root@master01:~# cat k8s-dashboard-ceamg.yml | grep image
          image: kubernetesui/dashboard:v2.6.1
          imagePullPolicy: Always
          image: kubernetesui/metrics-scraper:v1.0.8


root@master01:~#nerdctl pull kubernetesui/dashboard:v2.6.1
root@master01:~# nerdctl pull kubernetesui/metrics-scraper:v1.0.8


root@master01:~# nerdctl tag kubernetesui/dashboard:v2.6.1 harbor.ceamg.com/baseimages/dashboard:v2.6.1
root@master01:~# nerdctl push harbor.ceamg.com/baseimages/dashboard:v2.6.1
INFO[0000] pushing as a reduced-platform image (application/vnd.docker.distribution.manifest.list.v2+json, sha256:f12df071f8bad3e1965b5246095bd3f78df0eb76ceabcc0878d42849d33e4a10) 
index-sha256:f12df071f8bad3e1965b5246095bd3f78df0eb76ceabcc0878d42849d33e4a10:    done           |++++++++++++++++++++++++++++++++++++++| 
manifest-sha256:d95e1adbe846450bf9451f9c95ab33865115909cf3962960af5983bb916cf320: done           |++++++++++++++++++++++++++++++++++++++| 
config-sha256:783e2b6d87ed93a9f9fee34e84c2b029b7a9572b2f41f761437e58af9c26827f:   done           |++++++++++++++++++++++++++++++++++++++| 
elapsed: 3.2 s                                                                    total:  2.5 Ki (814.0 B/s)                                       
root@master01:~# 
root@master01:~# nerdctl tag kubernetesui/metrics-scraper:v1.0.8 harbor.ceamg.com/baseimages/metrics-scraper:v1.0.8
root@master01:~# nerdctl push harbor.ceamg.com/baseimages/metrics-scraper:v1.0.8
INFO[0000] pushing as a reduced-platform image (application/vnd.docker.distribution.manifest.list.v2+json, sha256:9fdef455b4f9a8ee315a0aa3bd71787cfd929e759da3b4d7e65aaa56510d747b) 
index-sha256:9fdef455b4f9a8ee315a0aa3bd71787cfd929e759da3b4d7e65aaa56510d747b:    done           |++++++++++++++++++++++++++++++++++++++| 
manifest-sha256:43227e8286fd379ee0415a5e2156a9439c4056807e3caa38e1dd413b0644807a: done           |++++++++++++++++++++++++++++++++++++++| 
config-sha256:115053965e86b2df4d78af78d7951b8644839d20a03820c6df59a261103315f7:   done           |++++++++++++++++++++++++++++++++++++++| 
elapsed: 0.8 s        total:  2.2 Ki (2.7 KiB/s)                                   
```



### 11.4 修改镜像地址
```yaml
195           image: harbor.ceamg.com/baseimages/dashboard:v2.6.1
280           image: harbor.ceamg.com/baseimages/metrics-scraper:v1.0.8
```



### 11.5 安装dashboard组件
```bash
kubectl apply -f k8s-dashboard-ceamg.yml
```


### 11.6 查看组件运行状态
```yaml
root@master01:~# kubectl get pod -A
NAMESPACE              NAME                                        READY   STATUS    RESTARTS       AGE
default                net-test1                                   1/1     Running   0              99m
default                net-test2                                   1/1     Running   0              99m
default                net-test3                                   1/1     Running   0              99m
default                net-test4                                   1/1     Running   0              123m
kube-system            calico-kube-controllers-5c8bb696bb-hf2cp    1/1     Running   1 (131m ago)   3h45m
kube-system            calico-node-6nlt6                           1/1     Running   0              3h45m
kube-system            calico-node-fd6rj                           1/1     Running   0              3h45m
kube-system            calico-node-lhgh4                           1/1     Running   0              3h45m
kube-system            coredns-6c496b89f6-hd8vf                    1/1     Running   0              73m
kubernetes-dashboard   dashboard-metrics-scraper-8b9c56ffb-tjjc4   1/1     Running   0              14s
kubernetes-dashboard   kubernetes-dashboard-6f9f585c48-vv2pz       1/1     Running   0              14s
```



### 11.7 获取登陆 token
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard


root@master01:~# kubectl apply -f admin-user.yml 
serviceaccount/admin-user created
clusterrolebinding.rbac.authorization.k8s.io/admin-user created
```

:::warning
**注意**：v1.24.0 更新之后进行创建 ServiceAccount 不会自动生成 Secret 需要对其手动创建
:::

```bash
# 创建token
root@master01:~# kubectl -n kubernetes-dashboard create token admin-user --duration 604800s
eyJhbGciOiJSUzI1NiIsImtpZCI6ImptTldRRDRZZVVSdXRhaU1RNUtyQmJUSmVTbW55VThqNHhLU1l6U3B4R28ifQ.eyJhdWQiOlsiYXBpIiwiaXN0aW8tY2EiXSwiZXhwIjoxNjczNDI1MDI3LCJpYXQiOjE2NzI4MjAyMjcsImlzcyI6Imh0dHBzOi8va3ViZXJuZXRlcy5kZWZhdWx0LnN2YyIsImt1YmVybmV0ZXMuaW8iOnsibmFtZXNwYWNlIjoia3ViZXJuZXRlcy1kYXNoYm9hcmQiLCJzZXJ2aWNlYWNjb3VudCI6eyJuYW1lIjoiYWRtaW4tdXNlciIsInVpZCI6IjdhNTAzN2E4LTQ2MGEtNGM3YS05NWQ5LTNjM2JkNGQ0YTUyZSJ9fSwibmJmIjoxNjcyODIwMjI3LCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZXJuZXRlcy1kYXNoYm9hcmQ6YWRtaW4tdXNlciJ9.ciX6c6hUe8NqPHWp7GteAecZ75L50sKL0l0jk6hETJM9xUVkE-knhm-wQWogOCq1vJMWtg_qeYqsyxfFAMbXdnGgXUXH3tuLVe0NcSHfGVa0BBfjUqODODoAcKdEWJJqdTO_QCfzHTTGkBDZoPgqjALBFzMVh_anlUdeSehRtTh6y2L0dsMRbWuEp1YI8phXumRGIbsrRDOenCycfyPh2AUEChMhD_uYS85z2tDVbno-1y4sSoSiPPn-awUEAxo-ly7zIOUz_b6ZiMhM6nGTuJ-7Jyxq4A8f2pj-iyXA_ve3g1Y4AaInd1aaZhCQ_82rOpmHP0Idyzg_lqEneltBaw
```


方式二<br />手动创建secrit 
```bash
root@master01:/zookeeper# kubectl apply -f secrit 
secret/admin-user created

apiVersion: v1
kind: Secret
type: kubernetes.io/service-account-token
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
  annotations:
    kubernetes.io/service-account.name: "admin-user"



root@master01:/zookeeper# kubectl -n kubernetes-dashboard describe sa admin-user
Name:                admin-user
Namespace:           kubernetes-dashboard
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              admin-user
Events:              <none>
root@master01:/zookeeper# kubectl -n kubernetes-dashboard describe secrets admin-user
Name:         admin-user
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: admin-user
              kubernetes.io/service-account.uid: 7a5037a8-460a-4c7a-95d9-3c3bd4d4a52e

Type:  kubernetes.io/service-account-token

Data
====
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6ImptTldRRDRZZVVSdXRhaU1RNUtyQmJUSmVTbW55VThqNHhLU1l6U3B4R28ifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJhZG1pbi11c2VyIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImFkbWluLXVzZXIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiI3YTUwMzdhOC00NjBhLTRjN2EtOTVkOS0zYzNiZDRkNGE1MmUiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZXJuZXRlcy1kYXNoYm9hcmQ6YWRtaW4tdXNlciJ9.YIZ1UepKs7WzebxKMOVIPkmz0KLkIyV59S7D0x4sBpefqseX6lSfV_YbhDjQv0dm6ne9HJ85dHzF1-qmSJEO_EW3m-aNOfmem7jkqr8XDUIgHceeKZimauTodKvApsWWD_Flsk7r2nin-MoNkOJ5mi6g5Pu3iQuKhQINl3G9Wwch5c-5FV0l-RBWR1rw9rVby6fh1jfkAhMWGL7lWKJeAA6fE2dTJVSJ-ZhW_bzwPTTDKNhIlpRsyKEnFXwWmK9Jqoxq8y5H0iJIhbvkYCxwUG2Gjjfi6jIWhJvWo20_kTq5Cy-7BNXafBI5D6VKmFwHFyOLBQcvkntN2IpVRNcfbA
ca.crt:     1302 bytes
```


[https://blog.csdn.net/qq_41619571/article/details/127217339](https://blog.csdn.net/qq_41619571/article/details/127217339)



### 11.8 登录测试

![输入token](http://img.xinn.cc/1672820370137-de794fe7-65da-418b-85a4-b92f3b8b3e42.png)

![界面展示](http://img.xinn.cc/1672820388726-cab07cf9-cbb9-4db3-bb1d-ef6ecfab21ff.png)






## 12. 集群管理
集群管理主要是添加master、添加node、删除master与删除node等节点管理及监控



### 12.1 添加node节点
```bash
./ezctl add-node k8s-01 10.1.0.39
```


### 12.2 添加master 节点
```bash
root@master01:/etc/kubeasz# ./ezctl add-master k8s-01 10.1.0.30
```


master 节点添加后会向 node节点 `/etc/kube-lb/conf/kube-lb.conf` 中添加反向代理节点
```bash
user root;
worker_processes 1;

error_log  /etc/kube-lb/logs/error.log warn;

events {
    worker_connections  3000;
}

stream {
    upstream backend {
        server 10.1.0.30:6443    max_fails=2 fail_timeout=3s;
        server 10.1.0.31:6443    max_fails=2 fail_timeout=3s;
    }

    server {
        listen 127.0.0.1:6443;
        proxy_connect_timeout 1s;
        proxy_pass backend;
    }
}

```





### 12.3 验证当前节点
```bash
root@master02:~# kubectl get nodes
NAME        STATUS                     ROLES    AGE   VERSION
10.1.0.30   Ready,SchedulingDisabled   master   15m   v1.24.2
10.1.0.31   Ready,SchedulingDisabled   master   44h   v1.24.2
10.1.0.32   Ready                      node     44h   v1.24.2
10.1.0.33   Ready                      node     44h   v1.24.2


root@master02:~# calicoctl node status
Calico process is running.

IPv4 BGP status
+--------------+-------------------+-------+----------+-------------+
| PEER ADDRESS |     PEER TYPE     | STATE |  SINCE   |    INFO     |
+--------------+-------------------+-------+----------+-------------+
| 10.1.0.31    | node-to-node mesh | up    | 02:47:43 | Established |
| 10.1.0.32    | node-to-node mesh | up    | 02:47:12 | Established |
| 10.1.0.33    | node-to-node mesh | up    | 02:47:31 | Established |
+--------------+-------------------+-------+----------+-------------+

IPv6 BGP status
No IPv6 peers found.
```






## 13. 集群升级

先升级master 保证集群中至少有一个master节点可用 ，在node节点nginx反向代理中注释掉要升级的master节点。

![1672892592550-0602394c-6d2e-4912-b773-459e3460253a](http://img.xinn.cc/1672892592550-0602394c-6d2e-4912-b773-459e3460253a.jpg)




### 13.1 升级master节点
在各个node节点反向代理配置中注释掉要升级的master节点
```bash
vim /etc/kube-lb/conf/kube-lb.conf

user root;
worker_processes 1;

error_log  /etc/kube-lb/logs/error.log warn;

events {
    worker_connections  3000;
}

stream {
    upstream backend {
        #server 10.1.0.30:6443    max_fails=2 fail_timeout=3s;
        server 10.1.0.31:6443    max_fails=2 fail_timeout=3s;
    }

    server {
        listen 127.0.0.1:6443;
        proxy_connect_timeout 1s;
        proxy_pass backend;
    }
}

#重启服务
root@worker01:~# systemctl restart kube-lb.service
```


node节点升级需要停服务，需要关闭kubelet 和 kube-proxy服务替换二进制文件

- kube-apiserver 
- kube-controller-manager  
- kubectl                 
- kubelet                  
- kube-proxy              
- kube-scheduler

去github找到想要升级的版本下载二进制文件：

[https://github.com/kubernetes/kubernetes/releases](https://github.com/kubernetes/kubernetes/releases)

```bash
root@master01:/usr/local/src# ll
total 489744
drwxr-xr-x  3 root root      4096 Jan  4 13:11 ./
drwxr-xr-x 13 root root      4096 Jan  1 13:20 ../
drwxr-xr-x 10 root root      4096 Dec  8 18:31 kubernetes/
-rw-r--r--  1 root root  30495559 Jan  4 13:09 kubernetes-client-linux-amd64.tar.gz
-rw-r--r--  1 root root 123361203 Jan  4 13:09 kubernetes-node-linux-amd64.tar.gz
-rw-r--r--  1 root root 347075448 Jan  4 13:09 kubernetes-server-linux-amd64.tar.gz
-rw-r--r--  1 root root    532769 Jan  4 13:09 kubernetes.tar.gz
```

二进制文件在/server/bin目录下面
```bash
root@master01:/usr/local/src/kubernetes/server/bin# ll -ls
total 1090008
     4 drwxr-xr-x 2 root root      4096 Dec  8 18:26 ./
     4 drwxr-xr-x 3 root root      4096 Dec  8 18:31 ../
 54176 -rwxr-xr-x 1 root root  55476224 Dec  8 18:26 apiextensions-apiserver*
 43380 -rwxr-xr-x 1 root root  44421120 Dec  8 18:26 kubeadm*
 48408 -rwxr-xr-x 1 root root  49569792 Dec  8 18:26 kube-aggregator*
123032 -rwxr-xr-x 1 root root 125980672 Dec  8 18:26 kube-apiserver*
     4 -rw-r--r-- 1 root root         8 Dec  8 18:25 kube-apiserver.docker_tag
128092 -rw------- 1 root root 131165184 Dec  8 18:25 kube-apiserver.tar
112896 -rwxr-xr-x 1 root root 115605504 Dec  8 18:26 kube-controller-manager*
     4 -rw-r--r-- 1 root root         8 Dec  8 18:25 kube-controller-manager.docker_tag
117960 -rw------- 1 root root 120790016 Dec  8 18:25 kube-controller-manager.tar
 44680 -rwxr-xr-x 1 root root  45752320 Dec  8 18:26 kubectl*
 53796 -rwxr-xr-x 1 root root  55085992 Dec  8 18:26 kubectl-convert*
113376 -rwxr-xr-x 1 root root 116095704 Dec  8 18:26 kubelet*
  1452 -rwxr-xr-x 1 root root   1486848 Dec  8 18:26 kube-log-runner*
 40820 -rwxr-xr-x 1 root root  41799680 Dec  8 18:26 kube-proxy*
     4 -rw-r--r-- 1 root root         8 Dec  8 18:25 kube-proxy.docker_tag
109280 -rw------- 1 root root 111901184 Dec  8 18:25 kube-proxy.tar
 46096 -rwxr-xr-x 1 root root  47202304 Dec  8 18:26 kube-scheduler*
     4 -rw-r--r-- 1 root root         8 Dec  8 18:25 kube-scheduler.docker_tag
 51160 -rw------- 1 root root  52386816 Dec  8 18:25 kube-scheduler.tar
  1380 -rwxr-xr-x 1 root root   1413120 Dec  8 18:26 mounter*
```



```bash
root@master01:/usr/local/src/kubernetes/server/bin# ./kube-apiserver --version
Kubernetes v1.24.9
#当前版本
root@master01:/usr/local/src/kubernetes/server/bin# /etc/kubeasz/bin/kube-apiserver --version
Kubernetes v1.24.2


```

停止服务
```bash
systemctl stop kube-proxy kube-controller-manager kubelet kube-scheduler kube-apiserver
```

替换二进制文件

```bash
root@master01:/usr/local/src/kubernetes/server/bin# scp kube-apiserver kube-controller-manager kubelet kube-scheduler kube-proxy 10.1.0.30:/usr/local/bin
kube-apiserver                                                                                                                                                                              100%  120MB 129.5MB/s   00:00    
kube-controller-manager                                                                                                                                                                     100%  110MB 128.8MB/s   00:00    
kubelet                                                                                                                                                                                     100%  111MB 137.1MB/s   00:00    
kube-scheduler                                                                                                                                                                              100%   45MB 128.5MB/s   00:00    
kube-proxy                                                                                                                                                                                  100%   40MB 132.0MB/s   00:00
```

启动服务
```bash
systemctl start kube-proxy kube-controller-manager kubelet kube-scheduler kube-apiserver
```

验证版本
```bash
root@master02:~# kubectl get nodes
NAME        STATUS                     ROLES    AGE    VERSION
10.1.0.30   Ready,SchedulingDisabled   master   136m   v1.24.9
10.1.0.31   Ready,SchedulingDisabled   master   46h    v1.24.2
10.1.0.32   Ready                      node     46h    v1.24.2
10.1.0.33   Ready                      node     46h    v1.24.2
```


在另外的master节点上重复以上操作

```bash
root@master01:/usr/local/src/kubernetes/server/bin# systemctl stop kube-proxy kube-controller-manager kubelet kube-scheduler kube-apiserver
root@master01:/usr/local/src/kubernetes/server/bin# \cp kube-apiserver kube-controller-manager kubelet kube-scheduler kube-proxy /usr/local/bin


root@master01:/usr/local/src/kubernetes/server/bin# kubectl get nodes
NAME        STATUS                     ROLES    AGE    VERSION
10.1.0.30   Ready,SchedulingDisabled   master   142m   v1.24.9
10.1.0.31   Ready,SchedulingDisabled   master   47h    v1.24.9
10.1.0.32   Ready                      node     46h    v1.24.2
10.1.0.33   Ready                      node     46h    v1.24.2
```

各node节点kube-lb取消upstream注释




### 13.2 升级node节点
node节点只需要替换kubelet 和 kube-proxy 两个

关闭服务
```bash
root@worker01:~# systemctl stop kubelet.service kube-proxy.service

```

替换二进制文件
```bash
root@master01:/usr/local/src/kubernetes/server/bin# scp kubelet kube-proxy 10.1.0.32:/usr/local/bin
kubelet                                                                                                                                                                                     100%  111MB 134.8MB/s   00:00    
kube-proxy      100%   40MB 139.3MB/s   00:00

root@master01:/usr/local/src/kubernetes/server/bin# scp kubelet kube-proxy 10.1.0.33:/usr/local/bin
```

启动服务
```bash
root@worker01:~# systemctl start kubelet.service kube-proxy.service
```


验证版本
```bash
root@master02:~# kubectl get nodes
NAME        STATUS                     ROLES    AGE    VERSION
10.1.0.30   Ready,SchedulingDisabled   master   157m   v1.24.9
10.1.0.31   Ready,SchedulingDisabled   master   47h    v1.24.9
10.1.0.32   Ready                      node     46h    v1.24.9
10.1.0.33   Ready                      node     46h    v1.24.9
```
