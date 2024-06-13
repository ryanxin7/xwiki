---
author: Ryan
title: 2.etcd 客户端使用、数据备份与恢复
date: 2023-01-05
---

import WordCount from '@site/src/components/WordCount';

<WordCount />

etcd是CoreOS团队于2013年6月发起的开源项目，它的目标是构建一个高可用的分 布式键值(key-value)数据库。etcd内部采用raft协议作为-致性算法，etcd基于Go语言实现。

官方网站：[https://etcd.io](https://etcd.io)<br />github地址: [https://github.com/etcd-io/etcd](https://github.com/etcd-io/etcd)<br />官方硬件推荐：[https://etcd.io/docs/v3.4/op-guide/hardware/](https://etcd.io/docs/v3.4/op-guide/hardware/) 

为什么k8s使用etcd？ <br />**Etcd 特有优势**
> **完全复制:** 集群中的每个节点都可以使用完整的存档<br />**高可用性**:  Etcd可用于避免硬件的单点故障或网络问题<br />**一致性**: 每次读取都会返回跨多主机的最新写入<br />**简单**: 包括一个定义良好、面向用户的API (gRPC)<br />**安全**: 实现了带有可选的客户端证书身份验证的自动化TLS<br />**快速**: 每秒10000次写入的基准速度<br />**可靠**: 使用Raft算法实现了存储的合理分布Etcd的工作原理


etcd 存储这k8s整个集群的数据，一定要做好定期备份

因为etcd数据存储在硬盘上，读写IO速度关系着集群中pod的运行，etcd集群最好使用固态硬盘并且内存要大一点。

```bash
中间件：
复制式集群
   mysql 集群 zookeeper etcd redis 哨兵
 
分片式：
   redis cluster kafka elasticsearch
```



**启动脚本参数:**
```bash
root@k8s-etcd1:-# cat /etc/systemd/system/etcd. service
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
Documentation=https://github.com/coreos
[Service]
Type=notify
WorkingDirectory=/var/lib/etcd/ #数据保存目录ExecStart=/usr/local/bin/etcd \ #二进制文件路径
--name=etcd1 \ #当前node 名称
--cert-file=/etc/etcd/ssl/etcd.pem
--key-file=/etc/etcd/ssl/etcd-key.pem
--peer-cert-file=/etc/etcd/ssl/etcd.pem
--peer-key-file=/etc/etcd/ssl/etcd-key.pem
--trusted-ca-file=/etc/kubernetes/ssl/ca.pem
--peer-trusted-ca-file=/etc/kubernetes/ssl/ca.pem
--initial-advertise-peer-urls=https://192.168.7.101:2380 \ #通告自己的集群端口
--listen-peer-urls=https://192.168.7.101:2380 \ #集群之间通讯端口
--listen-client-urls=https://192.168.7.101:2379,http://127.0.0.1:2379 \ #客户端访问地址
--advertise-client-urls=https://192.168.7.101:2379 \ #通告自己的客户端端口
--initial-cluster-token=etcd-cluster-0 \ #创建集群使用的token，一个集群内的节点保持一致
--initial-cluster=etcd1=https://192.168.7.101:2380,etcd2=https://192.168.7.102:2380,etcd3=https://192.168.7.103:2380 \ #集群所有的节点信息 
--initial-cluster-state=new \ #新建集群的时候的值为new,如果是已经存在的集群为existing。
--data-dir=/var/lib/etcd #数据目录路径
Restart=on-failure
RestartSec=5
LimitNOFILE=65536


[Install]
WantedBy=multi-user.target
```


###  验证当前etcd所有成员状态


#### 1.心跳信息

```bash
#export NODE_IPS="172.31.7.101 172.31.7.102 172.31.7.103"
# for ip in ${NODE_IPS}; do   ETCDCTL_API=3 /usr/local/bin/etcdctl   --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem   --cert=/etc/kubernetes/ssl/etcd.pem   --key=/etc/kubernetes/ssl/etcd-key.pem   endpoint health; done

```


####  2. 显示集群成员信息  
```bash
ETCDCTL_API=3 /usr/local/bin/etcdctl --write-out=table member list   --endpoints=https://172.31.7.101:2379 --cacert=/etc/kubernetes/ssl/ca.pem   --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem
```

#### 3.以表格方式显示节点详细状态
```bash
export NODE_IPS="172.31.7.101 172.31.7.102 172.31.7.103"
for ip in ${NODE_IPS}; do ETCDCTL_API=3 /usr/local/bin/etcdctl --write-out=table endpoint status --endpoints=https://${ip}:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/etcd.pem --key=/etc/kubernetes/ssl/etcd-key.pem; done

```




## 查看etcd数据信息
查看etcd集群中保存的数据

### 1.查看所有key
```bash
ETCDCTL_API=3 etcdctl get / --prefix --keys-only #以路径的方式所有key信息

#pod信息
ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep  pod

#namespace信息
ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep namespaces

#控制器信息
ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep deployment

#calico组件信息
ETCDCTL_API=3 etcdctl get / --prefix --keys-only | grep calico

```


### 2.查看指定key
```bash
root@etcd01:~# ETCDCTL_API=3 etcdctl get /calico/ipam/v2/assignment/ipv4/block/10.20.241.64-26
/calico/ipam/v2/assignment/ipv4/block/10.20.241.64-26
{"cidr":"10.20.241.64/26","affinity":"host:master01","allocations":[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unallocated":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63],"attributes":[{"handle_id":"ipip-tunnel-addr-master01","secondary":{"node":"master01","type":"ipipTunnelAddress"}}],"deleted":false}

```


### 3.查看所有calico的数据
```bash
root@etcd01:~# ETCDCTL_API=3 etcdctl get /calico --keys-only --prefix | grep calico
```



### etcd增删改查数据
```bash
#添加数据

root@etcd01:~# etcdctl put /name "xin"

#查询数据
root@etcd01:~# etcdctl get /name
/name
xin

#直接覆盖就是更新数据
root@etcd01:~# etcdctl get /name
/name
xxx

#删除数据
root@etcd01:~# etcdctl del /name
1
root@etcd01:~# etcdctl get /name

#删除pod
root@etcd01:~# etcdctl del /registry/pods/default/net-test1
1

root@master02:~# kubectl get pods -A |grep net-test1
default                net-test1                                   1/1     Running   0             24h
root@master02:~# kubectl get pods -A |grep net-test1

```




##  etcd数据watch机制
 基于不断监看数据，发生变化就主动触发通知客户端，Etcd v3 的watch机制支持watch某个固定的key，也支持watch一个范围。  

 在etcd node1上watch一个key  ，在etcdnode2修改数据，验证etcdnode1是否能够发现数据变化  
```bash
root@etcd02:~# etcdctl put /data/name xin123
OK
root@etcd01:~# etcdctl watch /data/name 
PUT
/data/name
xin123
```



## etcd 数据手动备份与恢复<br /><br />
WAL是**write ahead log**的缩写，顾名思义，也就是在执行真正的写操作之前先写一个日志，预写日志。<br />**wal**: 存放预写式日志,最大的作用是记录了整个数据变化的全部历程。<br />在etcd中，所有数据的修改在提交前，都要先写入到WAL中。


### <br />
```bash
#V3版本备份数据
root@etcd01:~# ETCDCTL_API=3 etcdctl snapshot save etcd-xin-0105.db
{"level":"info","ts":"2023-01-05T15:15:28.192+0800","caller":"snapshot/v3_snapshot.go:65","msg":"created temporary db file","path":"etcd-xin-0105.db.part"}
{"level":"info","ts":"2023-01-05T15:15:28.195+0800","logger":"client","caller":"v3/maintenance.go:211","msg":"opened snapshot stream; downloading"}
{"level":"info","ts":"2023-01-05T15:15:28.195+0800","caller":"snapshot/v3_snapshot.go:73","msg":"fetching snapshot","endpoint":"127.0.0.1:2379"}
{"level":"info","ts":"2023-01-05T15:15:28.227+0800","logger":"client","caller":"v3/maintenance.go:219","msg":"completed snapshot read; closing"}
{"level":"info","ts":"2023-01-05T15:15:28.245+0800","caller":"snapshot/v3_snapshot.go:88","msg":"fetched snapshot","endpoint":"127.0.0.1:2379","size":"3.0 MB","took":"now"}
{"level":"info","ts":"2023-01-05T15:15:28.245+0800","caller":"snapshot/v3_snapshot.go:97","msg":"saved","path":"etcd-xin-0105.db"}
Snapshot saved at etcd-xin-0105.db

#V3版本数据恢复
--data-dir 数据存储目录
root@etcd01:~# ETCDCTL_API=3 etcdctl snapshot restore etcd-xin-0105.db --data-dir=/tmp/etcd

root@etcd01:~# mkdir /data/etcd-backup-dir/ -p
root@etcd01:~# cat  script.sh 
#!/bin/bash
source /etc/profile
DATE=`date +%Y-%m-%d_%H-%M-%S`
ETCDCTL_API=3 /usr/local/bin/etcdctl  snapshot save  /data/etcd-backup-dir/etcd-snapshot-${DATE}.db

0  */12 * * * /bin/bash /root/etcd-backup.sh &> /dev/null
```


### 使用kubeasz 备份与恢复数据
**恢复数据期间master 节点 **kube-apiserver/scheduler/controller-manager 服务**不可用**
```bash
./ezctl backup k8s-01

kubectl delete pod net-test1

./ezctl restore k8s-01
```


### ETCD 数据恢复流程
 当etcd集群宕机数量超过集群总节点数一半以上的时候(如总数为三台宕机两台)，就会导致整合集群宕机，后期需要重新恢复数据，则恢复流程如下:  

1. 恢复服务器系统
2. 重新部署ETCD集群
3. 停止`kube-apiserver/controller-manager/scheduler/kubelet/kube-proxy`
4. 停止ETCD集群
5. 各ETCD节点恢复同一份备份数据
6. 启动各节点并验证ETCD集群
7. 启动`kube-apiserver/controller-manager/scheduler/kubelet/kube-proxy`
8. 验证k8s master状态及pod数据

