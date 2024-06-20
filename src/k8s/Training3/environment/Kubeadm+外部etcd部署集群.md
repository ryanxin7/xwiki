---
id: kubeadm-cluster-deployment-etcd
title: Kubeadm+外部etcd部署集群
#slug: /KubernetesTraining3/LabEnvironment/kubeadm-cluster-deployment-etcd
date: 2024-03-08T10:23:32
---

import WordCount from '@site/src/components/WordCount';

<WordCount />

使用 kubeadm 和外部 etcd 部署 Kubernetes 集群，确保有至少三台服务器，一台用于 Kubernetes 控制平面（Master），另外两台用于 etcd 集群（建议三台以保证高可用性）。

<a name="HQDo8"></a>
## 一、架构图
![222](https://cdn.nlark.com/yuque/0/2024/png/33538388/1710222413861-72067b8a-cb16-49f2-ad0d-a27c2108339b.png#averageHue=%23dcb14e&clientId=u3e7b0f16-9251-4&from=paste&id=uf741a1e0&originHeight=448&originWidth=1088&originalType=url&ratio=1.100000023841858&rotation=0&showTitle=false&status=done&style=none&taskId=u2406c8e6-038f-4024-b1c8-640a0200596&title=)
<a name="rWJIc"></a>
## 二、环境信息
| 主机名 | 系统版本 | 内核版本 | K8S版本 | IP地址 | 备注 |
| --- | --- | --- | --- | --- | --- |
| etcd01,k8s-master-01 | Ubuntu 20.04.3 LTS | 5.4.0-81-generic | 1.24.12 | 192.168.10.96 | etcd节点,master节点 |
| etcd02,k8s-node-01 | Ubuntu 20.04.3 LTS | 5.4.0-81-generic | 1.24.12 | 192.168.10.97 | etcd节点,node节点 |
| etcd03,k8s-node-02 | Ubuntu 20.04.3 LTS | 5.4.0-81-generic | 1.24.12 | 192.168.10.98 | etcd节点,node节点 |


<a name="bxUbD"></a>
## 三、安装和配置先决条件
<a name="S0Dvy"></a>
### 3.1、主机名设置
**说明：分别在对应的节点IP上设置主机名。**
```bash
hostnamectl set-hostname etcd01
hostnamectl set-hostname etcd02
hostnamectl set-hostname etcd03
hostnamectl set-hostname master01
hostnamectl set-hostname node02
```

<a name="WclxD"></a>
### 3.2、配置主机hosts
说明：以下操作无论是master节点和worker节点均需要执行。
```bash
vim /etc/hosts
192.168.10.96 etcd01
192.168.10.97 etcd02
192.168.10.98 etcd03
192.168.10.96 master01
192.168.10.97 node01
192.168.10.98 node02
```

```bash
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
# deb-src http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
# deb-src http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
# deb-src http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse

deb http://security.ubuntu.com/ubuntu/ focal-security main restricted universe multiverse
# deb-src http://security.ubuntu.com/ubuntu/ focal-security main restricted universe multiverse

# 预发布软件源，不建议启用
# deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-proposed main restricted universe multiverse
# # deb-src http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-proposed main restricted universe multiverse
```

<a name="LxZO1"></a>
### 3.3、关闭防火墙
说明：以下操作无论是master节点和worker节点均需要执行。
```bash
ufw status
ufw disable
```

<a name="QAPsu"></a>
### 3.4、关闭selinux
说明：以下操作无论是master节点和worker节点均需要执行。
```bash
apt install selinux-utils -y
apt install policycoreutils -y
sed -i 's#SELINUX=permissive#SELINUX=disabled#g' /etc/selinux/config


sestatus -v
SELinux status:                 disabled

```


说明：如果selinux默认关闭则无需修改。

<a name="cFjLO"></a>
### 3.5、关闭swap分区
**说明：以下操作无论是master节点和worker节点均需要执行。**
```bash
swapoff -a
sed -i 's/^\/swapfile\(.*\)$/#\/swapfile \1/g' /etc/fstab
```


<a name="ZMDgu"></a>
### 3.6、时间时区同步
说明：以下操作无论是master节点和worker节点均需要执行。

1、设置时区为Asia/Shanghai，如果已经是则请忽略
```bash
root@master01:~# timedatectl set-timezone Asia/Shanghai
root@master01:~#
root@master01:~# timedatectl
               Local time: Thu 2024-03-07 15:09:02 CST
           Universal time: Thu 2024-03-07 07:09:02 UTC
                 RTC time: Thu 2024-03-07 07:09:03
                Time zone: Asia/Shanghai (CST, +0800)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```


2、使用chrony同步时间
```bash
apt install chrony -y
vim /etc/chrony/chrony.conf
server ntp.aliyun.com minpoll 4 maxpoll 10 iburst
server ntp1.aliyun.com minpoll 4 maxpoll 10 iburst
#pool ntp.ubuntu.com        iburst maxsources 4
#pool 0.ubuntu.pool.ntp.org iburst maxsources 1
#pool 1.ubuntu.pool.ntp.org iburst maxsources 1
#pool 2.ubuntu.pool.ntp.org iburst maxsources 2

systemctl enable chrony
systemctl restart chronyd.service
systemctl status chronyd.service
```

**然后就是chrony客户端上的一些常用命令：**
```bash
#查看可用的时间同步源
chronyc sources -v
 
#查看时间同步源的状态
chronyc sourcestats -v
 
#对客户端系统时间进行强制同步
chronyc -a makestep
```



<a name="cZXmQ"></a>
### 3.7、修改内核参数
说明：以下操作无论是master节点和worker节点均需要执行。

说明：有一些ipv4的流量不能走iptables链，因为linux内核的一个过滤器，每个流量都会经过他，然后再匹配是否可进入当前应用进程去处理，所以会导致流量丢失。配置k8s.conf文件,如下所示：

```bash
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# 设置所需的sysctl参数，参数在重新启动后保持不变
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 应用sysctl参数而不重新启动
sysctl --system
```

<a name="XuQx8"></a>
### 3.8、启用IPVS模式
说明：以下操作无论是master节点和worker节点均需要执行。

说明：ube-proxy开启ipvs的前提需要加载以下的内核模块

```bash
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh
nf_conntrack_ipv4
```

果出现`modprobe: FATAL: Module nf_conntrack_ipv4 not found in directory /lib/modules/5.15.0-69-generic`错误，这是因为使用了高内核，当前内核版本为5.15.0-69-generic，在高版本内核已经把nf_conntrack_ipv4替换为nf_conntrack了。

```bash
# 1、安装ipvs
apt -y install ipvsadm ipset sysstat conntrack

# 2、加载内核模块脚本
cat > /etc/profile.d/ipvs.modules <<EOF
#!/bin/bash
modprobe -- ip_vs
modprobe -- ip_vs_rr
modprobe -- ip_vs_wrr
modprobe -- ip_vs_sh
modprobe -- nf_conntrack
EOF
chmod 755 /etc/profile.d/ipvs.modules

#3、执行加载模块脚本
bash /etc/profile.d/ipvs.modules && lsmod | grep -e ip_vs -e nf_conntrack_ipv4

```

conntrack 是 Linux 内核的一个连接跟踪工具，用于跟踪和管理网络连接。它可以查看当前活动的连接状态、连接计数等信息，还可以手动添加、删除或修改连接跟踪条目。

<a name="BSsJj"></a>
## 四、安装etcd集群
<a name="Lpapr"></a>
### 4.1、手动生成etcd集群相关证书
**说明**：kubernetes系统各组件需要使用TLS(SSL)证书对通信进行加密，本文档使用CloudFlare的PKI工具集cfssl来生成Certificate Authority (CA) 证书和秘钥文件，CA是自签名的证书，用来签名后续创建的其它TLS证书。<br />**说明**：其中`ca.pem`、`ca-key.pem`、`apiserver-etcd-client.pem`、`apiserver-etcd-client-key.pem`文件是kube-apiserver连接etcd所需证书。这三个证书需要上传到master节点上，需提前创建好证书存放目录，建议目录如下：

| **证书文件** | **秘钥文件** | **建议路径** | **节点** | **说明** |
| --- | --- | --- | --- | --- |
| ca.pem | ca-key.pem | /etc/kubernetes/pki/etcd | master节点 | etcd集群ca根证书 |
| apiserver-etcd-client.pem | apiserver-etcd-client-key.pem | /etc/kubernetes/pki | master节点 | apiserver连接etcd客户端证书 |


<a name="T6nuA"></a>
### 4.2、安装cfssl工具集
**cfssl** 是 Cloudflare 开发的一个工具集，用于配置和管理 TLS/SSL 证书。它提供了一组命令行工具，用于生成、签名和管理 SSL 证书、密钥和证书签名请求 (CSR)。cfssl 还支持从 JSON 配置文件中定义证书颁发机构 (CA) 和证书配置，并可以轻松地集成到自动化工作流程中。

```bash
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.6.3/cfssl_1.6.3_linux_amd64 -o /usr/local/bin/cfssl
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.6.3/cfssljson_1.6.3_linux_amd64  -o /usr/local/bin/cfssljson
curl -L https://github.com/cloudflare/cfssl/releases/download/v1.6.3/cfssl-certinfo_1.6.3_linux_amd64  -o /usr/local/bin/cfssl-certinfo
curl -L https://dl.k8s.io/release/v1.24.12/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl

$ cp cfssl_1.6.3_linux_amd64 /usr/local/bin/cfssl
$ cp cfssljson_1.6.3_linux_amd64 /usr/local/bin/cfssljson
$ cp cfssl-certinfo_1.6.3_linux_amd64  /usr/local/bin/cfssl-certinfo
$ chmod +x /usr/local/bin/cfssl*

chmod +x /usr/local/bin/cfssl* 
```

<a name="OS0zf"></a>
### 4.3、创建CA证书配置文件
**说明：根据K8S集群要求，需要三个CA证书，分别是etcd CA证书、front-proxy CA证书、kubernetes CA证书。这些CA 证书可以共用一个相同的CA证书配置文件。**
<a name="ITU1m"></a>
#### 4.3.1、创建CA证书配置文件目录
```bash
mkdir -p /opt/ssl && cd /opt/ssl
```

```bash
vim ca-config.json
{
    "signing": {
        "default": {
            "expiry": "864000h"
        },
        "profiles": {
            "server": {
                "expiry": "864000h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth"
                ]
            },
            "client": {
                "expiry": "864000h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "client auth"
                ]
            },
            "peer": {
                "expiry": "864000h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            }
        }
    }
}

```

**字段参数详解：**

- **ca-config.json**：可以定义多个profiles，分别指定不同的过期时间、使用场景等参数；后续在签名证书时使用某个profile；
- **signing**：表示该证书可用于签名其它证书；生成的ca.pem证书中CA=TRUE；
- **peer**：双向证书，用于etcd集群成员间通信
- **server auth**：表示client可以用该CA对server提供的证书进行验证；
- **client auth**：表示server可以用该CA对client提供的证书进行验证；

<a name="BRMeU"></a>
### 4.4、生成etcd相关证书
<a name="ZoFwt"></a>
#### 4.4.1、创建证书文件目录
```bash
mkdir -p /opt/ssl/etcd && cd /opt/ssl/etcd
```

<a name="El3bu"></a>
#### 4.4.2、生成 etcd CA 证书
**1、创建**`**etcd-ca-csr.json**`**文件，这是etcd CA证书的签名请求文件**
```bash
vim etcd-ca-csr.json
{
  "CN": "etcd-ca",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Beijing",
      "L": "Beijing",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ],
  "ca": {
    "expiry": "876000h"
  }
}

```

**字段参数详解：**
```bash
CN: Common Name，浏览器使用该字段验证网站是否合法，一般写的是域名。非常重要。浏览器使用该字段验证网站是否合法
C: Country， 国家
ST: State，州，省
L: Locality，地区，城市
O: Organization Name，组织名称，公司名称
OU: Organization Unit Name，组织单位名称，公司部门
```

**2、生成CA证书并复制到etcd各个节点的/etc/kubernetes/pki/etcd目录**
```bash
cfssl gencert -initca etcd-ca-csr.json | cfssljson -bare ca
cp ca.pem ca-key.pem /etc/kubernetes/pki/etcd
```


<a name="AMk4V"></a>
#### 4.4.3、生成etcd server证书
**1、创建etcd-server-csr.json文件，这是etcd server证书的签名请求文件**
```bash
vim etcd-server-csr.json
{
  "CN": "kube-etcd",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Beijing",
      "L": "Beijing",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ]
}

```

**2、生成server证书并复制到etcd各个节点 和 master节点的**`**/etc/kubernetes/pki/etcd**`**目录**
```bash
export etcd_hostname_list="127.0.0.1,etcd01,etcd02,etcd03,192.168.10.96,192.168.10.97,192.168.10.98"
cfssl gencert \
-ca=ca.pem -ca-key=ca-key.pem \
-config=../ca-config.json \
-hostname=${etcd_hostname_list} \
-profile=server \
-loglevel=1 etcd-server-csr.json | cfssljson -bare server
```

```bash
---
root@master01:/opt/ssl/etcd# cfssl gencert \
> -ca=ca.pem -ca-key=ca-key.pem \
> -config=../ca-config.json \
> -hostname=${etcd_hostname_list} \
> -profile=server \
> -loglevel=1 etcd-server-csr.json | cfssljson -bare server
2024/03/07 16:39:27 [INFO] generate received request
2024/03/07 16:39:27 [INFO] received CSR
2024/03/07 16:39:27 [INFO] generating key: rsa-2048

2024/03/07 16:39:27 [INFO] encoded CSR
2024/03/07 16:39:27 [INFO] signed certificate with serial number 419232648468514885186105614358060927394626523270

---
root@master01:/opt/ssl/etcd# ls
ca.csr  ca-key.pem  ca.pem  etcd-ca-csr.json  etcd-server-csr.json  server.csr  server-key.pem  server.pem

cp server.pem server-key.pem /etc/kubernetes/pki/etcd
```


<a name="mSeHz"></a>
#### 4.4.4、生成etcd client证书
**1、创建**`**etcd-client-csr.json**`**文件，这是etcd client证书的签名请求文件**

```bash
vim etcd-client-csr.json
{
  "CN": "kube-etcd-healthcheck-client",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Beijing",
      "L": "Beijing",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ]
}

```


**2、生成client证书并复制到etcd各个节点的**`**/etc/kubernetes/pki/etcd**`**目录**

```bash
cfssl gencert \
-ca=ca.pem -ca-key=ca-key.pem \
-config=../ca-config.json -profile=client \
-loglevel=1 etcd-client-csr.json | cfssljson -bare healthcheck-client
```
```bash
root@master01:/opt/ssl/etcd# cfssl gencert \
> -ca=ca.pem -ca-key=ca-key.pem \
> -config=../ca-config.json -profile=client \
> -loglevel=1 etcd-client-csr.json | cfssljson -bare healthcheck-client
2024/03/07 16:40:50 [INFO] generate received request
2024/03/07 16:40:50 [INFO] received CSR
2024/03/07 16:40:50 [INFO] generating key: rsa-2048
2024/03/07 16:40:50 [INFO] encoded CSR
2024/03/07 16:40:50 [INFO] signed certificate with serial number 695857563543274434659736593339791061583803283439
2024/03/07 16:40:50 [WARNING] This certificate lacks a "hosts" field. This makes it unsuitable for
websites. For more information see the Baseline Requirements for the Issuance and Management
of Publicly-Trusted Certificates, v.1.1.6, from the CA/Browser Forum (https://cabforum.org);
specifically, section 10.2.3 ("Information Requirements").
root@master01:/opt/ssl/etcd# ls
ca.csr      ca.pem            etcd-client-csr.json  healthcheck-client.csr      healthcheck-client.pem  server-key.pem
ca-key.pem  etcd-ca-csr.json  etcd-server-csr.json  healthcheck-client-key.pem  server.csr              server.pem


cp healthcheck-client.pem healthcheck-client-key.pem /etc/kubernetes/pki/etcd
```


<a name="i5Ylv"></a>
#### 4.4.5、生成etcd peer证书
**1、创建**`**etcd-peer-csr.json**`**文件，这是etcd peer证书的签名请求文件**
```bash
vim etcd-peer-csr.json 
{
  "CN": "kube-etcd-peer",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Beijing",
      "L": "Beijing",
      "O": "etcd",
      "OU": "Etcd Security"
    }
  ]
}
```


**2、生成peer证书并复制到etcd各个节点的**`**/etc/kubernetes/pki/etcd**`**目录**

```bash
export etcd_hostname_list="127.0.0.1,etcd01,etcd02,etcd03,192.168.10.96,192.168.10.97,192.168.10.98"
cfssl gencert \
-ca=ca.pem -ca-key=ca-key.pem \
-config=../ca-config.json \
-hostname=${etcd_hostname_list} \
-profile=peer \
-loglevel=1 etcd-peer-csr.json | cfssljson -bare peer

cp peer.pem peer-key.pem /etc/kubernetes/pki/etcd
```


```bash
mkdir /etc/kubernetes/pki/etcd/ -p

#1、etcd各个节点所需证书
scp ca-key.pem ca.pem healthcheck-client.pem healthcheck-client-key.pem peer.pem \
peer-key.pem server.pem server-key.pem root@192.168.10.97:/etc/kubernetes/pki/etcd/

scp ca-key.pem ca.pem healthcheck-client.pem healthcheck-client-key.pem peer.pem \
peer-key.pem server.pem server-key.pem root@192.168.10.98:/etc/kubernetes/pki/etcd/



#2、master节点所需证书
cp /opt/ssl/etcd/ca.pem /opt/ssl/etcd/ca-key.pem /etc/kubernetes/pki/etcd/
cp /opt/ssl/etcd/apiserver-etcd-client.pem /opt/ssl/etcd/apiserver-etcd-client-key.pem /etc/kubernetes/pki/etcd/
cp /opt/ssl/etcd/peer-key.pem /opt/ssl/etcd/peer.pem /etc/kubernetes/pki/etcd/




#master节点所需证书
cp server.pem server-key.pem healthcheck-client.pem healthcheck-client-key.pem peer.pem peer-key.pem apiserver-etcd-client.pem apiserver-etcd-client-key.pem /etc/kubernetes/pki/etcd

```
<br />
<a name="bGmdt"></a>
#### **4.4.6、生成apiserver访问etcd client证书**


**说明：**`**apiserver-etcd-client.pem**`**、**`**apiserver-etcd-client-key.pem**`**用于API服务器安全地连接到etcd的客户端证书。**

**1、创建**`**apiserver-etcd-client-csr.json**`**文件，这是etcd客户端证书的签名请求文件**

```bash
vim apiserver-etcd-client-csr.json
{
  "CN": "kube-apiserver-etcd-client",
  "hosts": [],  
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "Beijing",
      "L": "Beijing",
      "O": "system:masters",
      "OU": "Kubernetes-manual"
    }
  ]
}
```


**2、生成apiserver-etcd-client证书并复制到master节点的**`**/etc/kubernetes/pki**`**目录**

```bash
cfssl gencert \
-ca=/opt/ssl/etcd/ca.pem -ca-key=/opt/ssl/etcd/ca-key.pem \
-config=../ca-config.json \
-profile=client \
-loglevel=1 apiserver-etcd-client-csr.json | cfssljson -bare apiserver-etcd-client

cp apiserver-etcd-client.pem apiserver-etcd-client-key.pem /etc/kubernetes/pki
```


<a name="OjToa"></a>
### **4.5、二进制安装etcd集群**
**4.5.1、下载etcd二进制安装包**
```bash
wget https://github.com/etcd-io/etcd/releases/download/v3.5.6/etcd-v3.5.6-linux-amd64.tar.gz
tar axf /tmp/etcd-v3.5.6-linux-amd64.tar.gz 
mv ./etcd-v3.5.6-linux-amd64/etcd* /usr/bin
```

```bash
root@master01:~# scp etcd-v3.5.6-linux-amd64.tar.gz 192.168.10.97:/tmp
root@master01:~# scp etcd-v3.5.6-linux-amd64.tar.gz 192.168.10.98:/tmp
```


<a name="PYj9N"></a>
#### **4.5.2、创建Service文件**
**etcd01节点**
```bash
root@etcd01:~# cat /etc/systemd/system/etcd.service 
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
Documentation=https://github.com/coreos

[Service]
Type=notify
WorkingDirectory=/var/lib/etcd
ExecStart=/usr/bin/etcd \
  --name=etcd01 \
  --cert-file=/etc/kubernetes/pki/etcd/server.pem \
  --key-file=/etc/kubernetes/pki/etcd/server-key.pem \
  --peer-cert-file=/etc/kubernetes/pki/etcd/peer.pem \
  --peer-key-file=/etc/kubernetes/pki/etcd/peer-key.pem \
  --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.pem \
  --peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.pem \
  --initial-advertise-peer-urls=https://192.168.10.96:2380 \
  --listen-peer-urls=https://192.168.10.96:2380 \
  --listen-client-urls=https://192.168.10.96:2379,http://127.0.0.1:2379 \
  --advertise-client-urls=https://192.168.10.96:2379 \
  --initial-cluster-token=etcd-cluster \
  --initial-cluster="etcd01=https://192.168.10.96:2380,etcd02=https://192.168.10.97:2380,etcd03=https://192.168.10.98:2380" \
  --initial-cluster-state=new \
  --data-dir=/var/lib/etcd \
  --wal-dir="" \
  --snapshot-count=50000 \
  --auto-compaction-retention=1 \
  --auto-compaction-mode=periodic \
  --max-request-bytes=10485760 \
  --quota-backend-bytes=8589934592
Restart=always
RestartSec=15
LimitNOFILE=65536
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target

```

**etcd02节点**
```bash
root@etcd02:~#  cat /etc/systemd/system/etcd.service 
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
Documentation=https://github.com/coreos

[Service]
Type=notify
WorkingDirectory=/var/lib/etcd
ExecStart=/usr/bin/etcd \
  --name=etcd02 \
  --cert-file=/etc/kubernetes/pki/etcd/server.pem \
  --key-file=/etc/kubernetes/pki/etcd/server-key.pem \
  --peer-cert-file=/etc/kubernetes/pki/etcd/peer.pem \
  --peer-key-file=/etc/kubernetes/pki/etcd/peer-key.pem \
  --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.pem \
  --peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.pem \
  --initial-advertise-peer-urls=https://192.168.10.97:2380 \
  --listen-peer-urls=https://192.168.10.97:2380 \
  --listen-client-urls=https://192.168.10.97:2379,http://127.0.0.1:2379 \
  --advertise-client-urls=https://192.168.10.97:2379 \
  --initial-cluster-token=etcd-cluster \
  --initial-cluster="etcd01=https://192.168.10.96:2380,etcd02=https://192.168.10.97:2380,etcd03=https://192.168.10.98:2380" \
  --initial-cluster-state=new \
  --data-dir=/var/lib/etcd \
  --wal-dir="" \
  --snapshot-count=50000 \
  --auto-compaction-retention=1 \
  --auto-compaction-mode=periodic \
  --max-request-bytes=10485760 \
  --quota-backend-bytes=8589934592
Restart=always
RestartSec=15
LimitNOFILE=65536
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target

```

eth03
```bash
root@etcd03:~# cat /etc/systemd/system/etcd.service 
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
Documentation=https://github.com/coreos

[Service]
Type=notify
WorkingDirectory=/var/lib/etcd
ExecStart=/usr/bin/etcd \
  --name=etcd03 \
  --cert-file=/etc/kubernetes/pki/etcd/server.pem \
  --key-file=/etc/kubernetes/pki/etcd/server-key.pem \
  --peer-cert-file=/etc/kubernetes/pki/etcd/peer.pem \
  --peer-key-file=/etc/kubernetes/pki/etcd/peer-key.pem \
  --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.pem \
  --peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.pem \
  --initial-advertise-peer-urls=https://192.168.10.98:2380 \
  --listen-peer-urls=https://192.168.10.98:2380 \
  --listen-client-urls=https://192.168.10.98:2379,http://127.0.0.1:2379 \
  --advertise-client-urls=https://192.168.10.98:2379 \
  --initial-cluster-token=etcd-cluster \
  --initial-cluster="etcd01=https://192.168.10.96:2380,etcd02=https://192.168.10.97:2380,etcd03=https://192.168.10.98:2380" \
  --initial-cluster-state=new \
  --data-dir=/var/lib/etcd \
  --wal-dir="" \
  --snapshot-count=50000 \
  --auto-compaction-retention=1 \
  --auto-compaction-mode=periodic \
  --max-request-bytes=10485760 \
  --quota-backend-bytes=8589934592
Restart=always
RestartSec=15
LimitNOFILE=65536
OOMScoreAdjust=-999

[Install]
WantedBy=multi-user.target

```


<a name="LcAla"></a>
#### 4.5.3、启动etcd服务
注意：必须创建先etcd数据目录和工作目录。

```bash
$ mkdir /var/lib/etcd && chmod 700 /var/lib/etcd
systemctl daemon-reload && systemctl enable etcd && systemctl restart etcd
```

<a name="Wv5zC"></a>
#### 4.5.4、检查etcd集群状态
```bash
root@master01:~# systemctl status etcd.service
● etcd.service - Etcd Server
     Loaded: loaded (/etc/systemd/system/etcd.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2024-03-07 17:22:26 CST; 1min 12s ago
       Docs: https://github.com/coreos
   Main PID: 864881 (etcd)
      Tasks: 13 (limit: 9447)
     Memory: 26.3M
     CGroup: /system.slice/etcd.service
             └─864881 /usr/bin/etcd --name=etcd01 --cert-file=/etc/kubernetes/pki/etcd/server.pem --key-file=/etc/kubernetes/pki/etcd/server-key.pem --peer
```


```bash
etcdctl --endpoints="https://192.168.10.96:2379,https://192.168.10.97:2379,https://192.168.10.98:2379" \
--cacert /etc/kubernetes/pki/etcd/ca.pem --cert /etc/kubernetes/pki/etcd/peer.pem \
--key  /etc/kubernetes/pki/etcd/peer-key.pem endpoint health
```



```bash
etcdctl --endpoints="https://192.168.10.96:2379,https://192.168.10.97:2379,https://192.168.10.98:2379" \
--cacert /etc/kubernetes/pki/etcd/ca.pem --cert /etc/kubernetes/pki/etcd/peer.pem \
--key  /etc/kubernetes/pki/etcd/peer-key.pem endpoint status --write-out table
```

**如下图所示：**<br />![image.png](https://cdn.nlark.com/yuque/0/2024/png/33538388/1709803520352-67ff4038-ef28-4eaa-8322-4d2094e8233b.png#averageHue=%232b2825&clientId=u44e99244-39de-4&from=paste&height=119&id=u78033956&originHeight=119&originWidth=1250&originalType=binary&ratio=1&rotation=0&showTitle=false&size=29217&status=done&style=none&taskId=u91f5b2af-ba6b-449a-b261-16e31227aaa&title=&width=1250)<br />![image.png](https://cdn.nlark.com/yuque/0/2024/png/33538388/1709803586296-e3ef59ec-836f-4419-b2c7-e065deae0b8f.png#averageHue=%23252321&clientId=u44e99244-39de-4&from=paste&height=188&id=u7a52a1c2&originHeight=188&originWidth=1603&originalType=binary&ratio=1&rotation=0&showTitle=false&size=38925&status=done&style=none&taskId=uce4adb36-db7d-43f4-bb05-bd7180111fc&title=&width=1603)


<a name="tdo0G"></a>
#### 4.5.6、[etcd集群备份](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/configure-upgrade-etcd/)
**备份etcd集群可以通过两种方式完成：etcd内置快照和卷快照。**<br />**参考：**[《Kubernetes备份篇：etcd集群数据备份与恢复》](https://blog.csdn.net/m0_37814112/article/details/130502953)



<a name="Ef3L3"></a>
## 五、安装containerd
说明：以下操作无论是master节点和worker节点均需要执行。

kubernetes 1.24.x以后版本默认CRI为containerd，cri称之为容器运行时插件。

方式一、二进制安装<br />方式二、apt工具安装

<a name="eAMgD"></a>
### 5.1、安装软件包
```bash
apt-cache madison containerd
containerd | 1.7.2-0ubuntu1~20.04.1 | http://mirrors.tuna.tsinghua.edu.cn/ubuntu focal-updates/main amd64 Packages
containerd | 1.6.12-0ubuntu1~20.04.3 | http://security.ubuntu.com/ubuntu focal-security/main amd64 Packages
containerd | 1.3.3-0ubuntu2 | http://mirrors.tuna.tsinghua.edu.cn/ubuntu focal/main amd64 Packages

apt install containerd=1.6.12-0ubuntu1~20.04.3
```

<a name="t2qxd"></a>
### 5.2、生成默认配置文件
```bash
mkdir -p /etc/containerd&& containerd config default > /etc/containerd/config.toml
```

<a name="MjMld"></a>
### 5.3、配置systemd cgroup驱动
```bash
sed -i 's#SystemdCgroup = false#SystemdCgroup = true#g' /etc/containerd/config.toml
```

<a name="c8Yhu"></a>
### 5.4、重载沙箱（pause）镜像
```bash
sed -i 's#sandbox_image = "registry.k8s.io/pause:3.6"#sandbox_image = "registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.7"#g' /etc/containerd/config.toml
```

<a name="nGKMF"></a>
### 5.5、重启containerd服务并设置开机自启
```bash
systemctl restart containerd && systemctl enable containerd
```

说明：由于网络问题，无法下载国外的K8S镜像，所以这里使用阿里云的镜像仓库地址`registry.cn-hangzhou.aliyuncs.com/google_containers`代替。如果你有阿里云的账号，可以对 containerd配置镜像加速地址来实现快速下载镜像。

<a name="zeKpC"></a>
### 5.6、下载pause镜像
```bash
ctr image pull --all-platforms registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.7
```

<a name="UIAiO"></a>
### 5.7、配置containerd配置镜像加速
**直接在**`** /etc/containerd/config.toml **`**文件中添加配置，配置好后重启containerd服务：**
```bash
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://zltjecyf.mirror.aliyuncs.com"]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
          endpoint = ["https://registry.aliyuncs.com/k8sxio"]
```


<a name="j8Fjl"></a>
### 5.8、安装crictl命令行工具  
crictl与kubernetes版本对应：<br />[https://github.com/kubernetes-sigs/cri-tools/releases/tag/v1.26.1](https://github.com/kubernetes-sigs/cri-tools/releases/tag/v1.26.1)<br />![image.png](https://cdn.nlark.com/yuque/0/2024/png/33538388/1709864817722-8ebdfdc3-a3f4-4845-94e3-965ca8fd4e78.png#averageHue=%23141a21&clientId=u44e99244-39de-4&from=paste&height=520&id=kND5U&originHeight=520&originWidth=547&originalType=binary&ratio=1&rotation=0&showTitle=false&size=33646&status=done&style=none&taskId=u60aa74da-6a2c-4622-a69f-a084fc2c0ab&title=&width=547)

> **crictl-v1.26.1-linux-amd64.tar.gz**
> 链接：[https://pan.baidu.com/s/1D3wqxUWo6Zz7PHZ_00l9zA?pwd=k8ss](https://pan.baidu.com/s/1D3wqxUWo6Zz7PHZ_00l9zA?pwd=k8ss) 
> 提取码：k8ss 



```bash
tar axf crictl-v1.26.1-linux-amd64.tar.gz -C /usr/local/bin
```

**说明：ctr是containerd自带的CLI命令行工具，crictl是k8s中CRI（容器运行时接口）的客户端，k8s使用该客户端和containerd进行交互。**

<a name="WatNC"></a>
### 5.9、安装nerdctl命令行工具 
**下载安装**
> **nerdctl-1.7.4-linux-amd64.tar.gz**
> **链接：**[**https://pan.baidu.com/s/1hdIp5ltCmr59FISKVlUyhQ?pwd=k8ss**](https://pan.baidu.com/s/1hdIp5ltCmr59FISKVlUyhQ?pwd=k8ss)** **
> **提取码：k8ss **



官方下载地址： [https://github.com/containerd/nerdctl/releases](https://github.com/containerd/nerdctl/releases)，在 Asset 中选择下载精简或者完全安装包。
```bash
tar -xzvf nerdctl-*-linux-amd64.tar.gz -C /usr/local/bin/
```




<a name="wYRVj"></a>
## 六、[安装kubelet、kubeadm和kubectl](https://kubernetes.io/zh-cn/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)
**说明：以下操作无论是master节点和worker节点均需要执行。**
```bash
#1、安装使用Kubernetes apt仓库所需要的包
$ apt install containerd=1.6.12-0ubuntu1~20.04.3

#2、编辑镜像源文件，加入阿里云k8s镜像源配置
cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF

#3、编辑镜像源文件，加入阿里云k8s镜像源配置
$ curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | sudo apt-key add

#更新源
$ apt-get update

#5、安装指定版本kubeadm、kubelet、kubectl
$ apt-get install -y kubelet=1.24.12-00 kubeadm=1.24.12-00 kubectl=1.24.12-00


#设置kubelet开机自启
$ systemctl enable kubelet

#kubectl命令补全
$ echo "source <(kubectl completion bash)" >> /etc/profile.d/k8s.sh
$ source /etc/profile.d/k8s.sh
```


<a name="Ufd5p"></a>
## 七、k8s镜像下载
说明：以下操作无论是master节点和worker节点均需要执行。

需要下载的镜像
```bash
registry.k8s.io/kube-apiserver:v1.24.12
registry.k8s.io/kube-controller-manager:v1.24.12
registry.k8s.io/kube-scheduler:v1.24.12
registry.k8s.io/kube-proxy:v1.24.12
registry.k8s.io/pause:3.7
registry.k8s.io/etcd:3.5.6-0
registry.k8s.io/coredns/coredns:v1.8.6
```

**使用国内源下载相关镜像**
```bash
#!/bin/bash
k8s_version=v1.24.12
pause_version=3.7
etcd_version=3.5.6-0
coredns_version=v1.8.6
registry_address=registry.cn-hangzhou.aliyuncs.com/google_containers
ctr image pull --all-platforms ${registry_address}/kube-apiserver:${k8s_version}
ctr image pull --all-platforms ${registry_address}/kube-controller-manager:${k8s_version}
ctr image pull --all-platforms ${registry_address}/kube-scheduler:${k8s_version}
ctr image pull --all-platforms ${registry_address}/kube-proxy:${k8s_version}
ctr image pull --all-platforms ${registry_address}/pause:${pause_version}
ctr image pull --all-platforms ${registry_address}/etcd:${etcd_version}
ctr image pull --all-platforms ${registry_address}/coredns:${coredns_version}
```

**将镜像并打包成tar.gz格式**
```bash
#!/bin/bash
k8s_version=v1.24.12
pause_version=3.7
etcd_version=3.5.6-0
coredns_version=v1.8.6
registry_address=registry.cn-hangzhou.aliyuncs.com/google_containers
ctr image export --all-platforms kube-apiserver-${k8s_version}.tar.gz ${registry_address}/kube-apiserver:${k8s_version}
ctr image export --all-platforms kube-controller-manager-${k8s_version}.tar.gz ${registry_address}/kube-controller-manager:${k8s_version}
ctr image export --all-platforms kube-scheduler-${k8s_version}.tar.gz \${registry_address}/kube-scheduler:${k8s_version}
ctr image export --all-platforms kube-proxy-${k8s_version}.tar.gz ${registry_address}/kube-proxy:${k8s_version}
ctr image export --all-platforms pause-${pause_version}.tar.gz ${registry_address}/pause:${pause_version}
ctr image export --all-platforms etcd-${etcd_version}.tar.gz ${registry_address}/etcd:${etcd_version}
ctr image export --all-platforms coredns-${coredns_version}.tar.gz ${registry_address}/coredns:${coredns_version}
```

> 说明：由于网络问题，无法访问**registry.k8s.io**镜像仓库地址，这里使用国内阿里云的镜像仓库来下载k8s镜像。如果你的是专网环境，请找一台能访问阿里云镜像仓库的服务器下载然后打包成tar.gz格式，上传到要部署的专网服务器，通过ctr image import命令导入镜像即可。



<a name="aYUyp"></a>
## 八、使用kubeadm init初始化集群
**说明：以下操作仅在master节点执行。**
<a name="BeFa9"></a>
### 8.1、生成默认kubeadm初始化config文件
```bash
$ kubeadm config print init-defaults > kubeadm.yaml
```
<a name="MD7PS"></a>
### 8.2、修改kubeadm默认config文件
```bash
$ vim kubeadm.yaml
```

```yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
localAPIEndpoint:
  advertiseAddress: "192.168.10.96"
  bindPort: 6443
nodeRegistration:
  criSocket: unix:///var/run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
  name: master01
  taints: #给master添加污点，master节点不能调度应用
    - effect: "NoSchedule"
      key: "node-role.kubernetes.io/master"
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
etcd:
  external:  
    endpoints:
    - https://192.168.10.96:2379 
    - https://192.168.10.97:2379
    - https://192.168.10.98:2379
    caFile: /etc/kubernetes/pki/etcd/ca.pem # 连接etcd所需证书
    certFile: /etc/kubernetes/pki/apiserver-etcd-client.pem
    keyFile: /etc/kubernetes/pki/apiserver-etcd-client-key.pem  
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
  podSubnet: 10.244.0.0/16
kubernetesVersion: "v1.24.12"
controlPlaneEndpoint: "192.168.10.96:6443"
apiServer:
  extraArgs:
    service-node-port-range: 30000-36000
  timeoutForControlPlane: 4m0s
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
imageRepository: "registry.cn-hangzhou.aliyuncs.com/google_containers"

---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: ipvs
```

<a name="xkl2w"></a>
### 8.3、 使用kubeadm init初始化集群
```bash
root@master01:~/k8sdata/init# kubeadm init --config=kubeadm.yaml
[init] Using Kubernetes version: v1.24.12
[preflight] Running pre-flight checks
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local master01] and IPs [10.244.0.1 192.168.10.96]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] External etcd mode: Skipping etcd/ca certificate authority generation
[certs] External etcd mode: Skipping etcd/server certificate generation
[certs] External etcd mode: Skipping etcd/peer certificate generation
[certs] External etcd mode: Skipping etcd/healthcheck-client certificate generation
[certs] External etcd mode: Skipping apiserver-etcd-client certificate generation
[certs] Generating "sa" key and public key
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "kubelet.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[apiclient] All control plane components are healthy after 10.503878 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config" in namespace kube-system with the configuration for the kubelets in the cluster
[upload-certs] Skipping phase. Please see --upload-certs
[mark-control-plane] Marking the node master01 as control-plane by adding the labels: [node-role.kubernetes.io/control-plane node.kubernetes.io/exclude-from-external-load-balancers]
[mark-control-plane] Marking the node master01 as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule]
[bootstrap-token] Using token: abcdef.0123456789abcdef
[bootstrap-token] Configuring bootstrap tokens, cluster-info ConfigMap, RBAC Roles
[bootstrap-token] Configured RBAC rules to allow Node Bootstrap tokens to get nodes
[bootstrap-token] Configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstrap-token] Configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstrap-token] Configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[kubelet-finalize] Updating "/etc/kubernetes/kubelet.conf" to point to a rotatable kubelet client certificate and key
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

You can now join any number of control-plane nodes by copying certificate authorities
and service account keys on each node and then running the following as root:

  kubeadm join 192.168.10.96:6443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:fc9ca7c0388b444f80b339e6595fd32feee9da46ea1c9a61528481a69fc3e006 \
        --control-plane

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.10.96:6443 --token abcdef.0123456789abcdef \
        --discovery-token-ca-cert-hash sha256:fc9ca7c0388b444f80b339e6595fd32feee9da46ea1c9a61528481a69fc3e006
```


<a name="ZTGBh"></a>
### 8.4、node01节点加入K8S集群
```bash
root@node01:~# kubeadm join 192.168.10.96:6443 --token abcdef.0123456789abcdef \
>         --discovery-token-ca-cert-hash sha256:fc9ca7c0388b444f80b339e6595fd32feee9da46ea1c9a61528481a69fc3e006
[preflight] Running pre-flight checks
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

<a name="podXg"></a>
### 8.5、node02节点加入K8S集群
```bash
root@node02:~# kubeadm join 192.168.10.96:6443 --token abcdef.0123456789abcdef \
>         --discovery-token-ca-cert-hash sha256:fc9ca7c0388b444f80b339e6595fd32feee9da46ea1c9a61528481a69fc3e006
[preflight] Running pre-flight checks
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```


**查看集群状态**
```bash
$ kubectl get nodes
NAME       STATUS     ROLES           AGE     VERSION
master01   NotReady   control-plane   4m36s   v1.24.12
node01     NotReady   <none>          67s     v1.24.12
node02     NotReady   <none>          41s     v1.24.12
```

因为没有安装**网络插件处于NotReady状态**

<a name="axx6p"></a>
## 九、安装网络组件
这个时候其实集群还不能正常使用，因为还没有安装网络插件，接下来安装网络插件，可以在文档 [https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/) 中选择我们自己的网络插件，这里我们安装 flannel:<br />[https://github.com/flannel-io/flannel](https://github.com/flannel-io/flannel)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  labels:
    k8s-app: flannel
    pod-security.kubernetes.io/enforce: privileged
  name: kube-flannel
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: flannel
  name: flannel
  namespace: kube-flannel
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: flannel
  name: flannel
rules:
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - nodes/status
  verbs:
  - patch
- apiGroups:
  - networking.k8s.io
  resources:
  - clustercidrs
  verbs:
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: flannel
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-flannel
---
apiVersion: v1
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
kind: ConfigMap
metadata:
  labels:
    app: flannel
    k8s-app: flannel
    tier: node
  name: kube-flannel-cfg
  namespace: kube-flannel
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  labels:
    app: flannel
    k8s-app: flannel
    tier: node
  name: kube-flannel-ds
  namespace: kube-flannel
spec:
  selector:
    matchLabels:
      app: flannel
      k8s-app: flannel
  template:
    metadata:
      labels:
        app: flannel
        k8s-app: flannel
        tier: node
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      containers:
      - args:
        - --ip-masq
        - --kube-subnet-mgr
        - --iface=eth0
        command:
        - /opt/bin/flanneld
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: EVENT_QUEUE_DEPTH
          value: "5000"
        image: docker.io/flannel/flannel:v0.24.3
        name: kube-flannel
        resources:
          requests:
            cpu: 100m
            memory: 50Mi
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
            - NET_RAW
          privileged: false
        volumeMounts:
        - mountPath: /run/flannel
          name: run
        - mountPath: /etc/kube-flannel/
          name: flannel-cfg
        - mountPath: /run/xtables.lock
          name: xtables-lock
      hostNetwork: true
      initContainers:
      - args:
        - -f
        - /flannel
        - /opt/cni/bin/flannel
        command:
        - cp
        image: docker.io/flannel/flannel-cni-plugin:v1.4.0-flannel1
        name: install-cni-plugin
        volumeMounts:
        - mountPath: /opt/cni/bin
          name: cni-plugin
      - args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        command:
        - cp
        image: docker.io/flannel/flannel:v0.24.3
        name: install-cni
        volumeMounts:
        - mountPath: /etc/cni/net.d
          name: cni
        - mountPath: /etc/kube-flannel/
          name: flannel-cfg
      priorityClassName: system-node-critical
      serviceAccountName: flannel
      tolerations:
      - effect: NoSchedule
        operator: Exists
      volumes:
      - hostPath:
          path: /run/flannel
        name: run
      - hostPath:
          path: /opt/cni/bin
        name: cni-plugin
      - hostPath:
          path: /etc/cni/net.d
        name: cni
      - configMap:
          name: kube-flannel-cfg
        name: flannel-cfg
      - hostPath:
          path: /run/xtables.lock
          type: FileOrCreate
        name: xtables-lock
```

```bash
$ vim kube-flannel.yml
$ kubectl appl -f  kube-flannel.yml
```


<a name="wKA9d"></a>
## 十、安装Kubernetes-Dashboard

1.24版本的K8S对应dashboard 2.6.1版本<br />具体：[https://github.com/kubernetes/dashboard/releases/tag/v2.6.1](https://github.com/kubernetes/dashboard/releases/tag/v2.6.1)<br />![image.png](https://cdn.nlark.com/yuque/0/2024/png/33538388/1709889395231-0decfd0d-4b5f-4094-ac50-80522266910b.png#averageHue=%2310151c&clientId=u44e99244-39de-4&from=paste&height=605&id=u76adf9fa&originHeight=666&originWidth=1212&originalType=binary&ratio=1&rotation=0&showTitle=false&size=50644&status=done&style=none&taskId=u49b1d07d-e5ff-4a65-8b91-892e20066db&title=&width=1101.8181579369164)

<a name="gApNV"></a>
### 10.1、增加NodePort方式暴露服务
官方部署仪表板的服务没使用nodeport，将yaml文件下载到本地，在service里添加nodeport
```bash
$ wget  https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-rc7/aio/deploy/recommended.yaml
```
如果此方式无法下载可通过浏览器访问自行创建
```yaml
# 编辑文件
$ vim recommended.yaml

# ------------------------
kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  type: NodePort		#新增
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 30000	#新增
  selector:
    k8s-app: kubernetes-dashboard
    
# 部署Dashboard    
kubectl create -f recommended.yaml
```
创建完成后，检查相关服务运行状态
```bash
$ kubectl get deployment kubernetes-dashboard -n kubernetes-dashboard
$ kubectl get pods -n kubernetes-dashboard -o wide
$ kubectl get services -n kubernetes-dashboard
$ netstat -ntlp|grep 30001
```
在浏览器中访问Dashboard

<a name="XQTwP"></a>
### 10.2、创建Dashboard-admin token
```bash
$ kubectl create serviceaccount  dashboard-admin -n kube-system
$ kubectl create clusterrolebinding  dashboard-admin --clusterrole=cluster-admin --serviceaccount=kube-system:dashboard-admin
$ kubectl describe secrets -n kube-system $(kubectl -n kube-system get secret | awk '/dashboard-admin/{print $1}')
```
1.24版本创建不过期token
```bash
$ kubectl create serviceaccount  dashboard-admin -n kube-system
$ kubectl create clusterrolebinding  dashboard-admin --clusterrole=cluster-admin --serviceaccount=kube-system:dashboard-admin
```
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dashboard-admin
  namespace: kube-system
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: dashboard-admin
subjects:
  - kind: ServiceAccount
    name: dashboard-admin
    namespace: kube-system
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
# 上面均为正常的建立ServiceAccount并与集群默认角色cluster-admin进行绑定
# 下面为手动建立secret文件进行永久token建立
apiVersion: v1
kind: Secret
metadata:
  name: secret-admin
  namespace: kube-system
  annotations:
    kubernetes.io/service-account.name: "dashboard-admin"
type: kubernetes.io/service-account-token
```
```bash
# 查看token
$ kubectl describe -n kube-system secret/secret-admin
```
