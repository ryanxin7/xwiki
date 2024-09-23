---
author: Ryan
sidebar_position: 1
title: 6.k8s实战案例-nginx与tomcat实现动静分离
date: 2023-01-16
---



## rbd结合k8s提供存储卷及动态存储卷使用案例

> **目的：**
> 让k8s 中的 pod 可以访问 ceph中rbd 提供的镜像作为存储设备。



需要在 ceph 创建rbd并且让 k8s node 节点能够通过 ceph 的认证k8s在使用 ceph 作为动态存储卷的时候，需要 **kube-controller-manager **组件能够访问ceph，因此需要在包括k8s master及 node节点在内的每一个node 同步认证文件。



## 1.创建初始化RBD
```bash
#创建新的rbd
[ceph@ceph-deploy ~]$ ceph osd pool create shijie-rbd-pool1 32 32
pool'xin-rbd-pool1' created

#验证存储池:
[ceph@ceph-deploy ~]$ ceph osd pool ls
mypool
myrdb1
.rgw.root
default.rgw.controldefault.rgw.meta
default.rgw.log
cephfs-metadata
cephfs-datarbd-data1
xin-rbd-pool1 

#确认存储池已经存在

#存储池启用rbd
ceph@ceph-deploy ~]$ ceph osd pool application enable xin-rbd-pool1 
rbd enabled application 'rbd' on pool 'xin-rbd-pool1
#初始化
rbdceph@ceph-deploy ~]$ rbd pool init -p xin-rbd-pool1
```

## 2 创建image
```bash
#创建镜像
[ceph@ceph-deploy -]$ rbd create xin-img-img1 --size 3G --pool xin-rbd-pool1 --image-format 2 --image-feature layering

#验证镜像
[ceph@ceph-deploy ~]$ rbd ls --pool xin-rbd-pool1 
shijie-img-img1


#验证镜像信息
[ceph@ceph-deploy ~]$ rbd --image xin-img-img1 --pool xin-rbd-pool1 
inforbd image 'xin-img-img1':

   size 3 GiBin 768 objects
   order 22 (4 MiB objects)
   id:1e7356b8b4567b
   lock_name_prefix:rbd_data.1e7356b8b4567
   format: 2
   features: layering
   op_features:
   flags:
   create timestamp: Wed Jan 611:01:51 2021
```



## 客户端安装ceph-common



分别在 k8s master 与各 node 节点安装 ceph-common 组件包
```bash
#下载key文件
root@k8s-master1:$ wget -q -0- 'https://download.ceph.com/keys/release.asc' | sudo apt-key add -
root@k8s-master2:$ wget -q -0- 'https://download.ceph.com/keys/release.asc' | sudo apt-key add -
root@k8s-worker1:$ wget -q -0- 'https://download.ceph.com/keys/release.asc' | sudo apt-key add -
root@k8s-worker2:$ wget -q -0- 'https://download.ceph.com/keys/release.asc' | sudo apt-key add -


#各 master与node 节点配置apt源

root@k8s-master1:~$ cat /etc/apt/sources.list
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse


#更新软件源
root@k8s-node3:~$ apt update

#验证 ceph 版本
root@k8s-master1:~$ apt-cache madison ceph-common

#各节点安装和当前 ceph 集群相同版本的 ceph-common

root@k8s-node3:~$ apt install ceph-common=13.2.10-1bionic
```



## 创建ceph 用户与授权

```bash
ceph@ceph-deploy ceph-clusterl$ ceph auth get-or-create client.xinceph-zcc mon 'allow r' osd 'allow * pool=xin-rbd-pool1' 
client.xinceph-zcc]
    key=AQB4L79g/he7HBAAvJQ7sl3zdSsTUL21Nx6zLQ==


#验证用户
[ceph@ceph-deploy ceph-cluster]$ ceph auth get client.xinceph-zcc
exported keyring for client.xinceph-zcc 
[clientmagedu-shijie]
   key= AQB4L79g/he7HBAAvJQ7sl3zdSsTUL21Nx6zLQ==
   caps mon ="allow r"
   caps osd ="allow* pool=xin-rbd-pool1"

#导出用户信息至keyring文件
ceph@ceph-deploy ceph-cluster]$ceph auth get client.xinceph-zcc -o client.xinceph-zcc.keyring 
exported keyring for client.xinceph-zcc


#同步认证文件到 k8s各master 及node节点
ceph@ceph-deploy ceph-cluster]$ scp ceph.conf ceph.client.xinceph-zcc.keyring root@10.1.0.30:/etc/ceph
ceph@ceph-deploy ceph-cluster]$ scp ceph.conf ceph.client.xinceph-zcc.keyring root@10.1.0.31:/etc/ceph
ceph@ceph-deploy ceph-cluster]$ scp ceph.conf ceph.client.xinceph-zcc.keyring root@10.1.0.32:/etc/ceph
ceph@ceph-deploy ceph-cluster]$ scp ceph.conf ceph.client.xinceph-zcc.keyring root@10.1.0.33:/etc/ceph

#添加hosts

172.31.6.101 ceph-node1.jie.local ceph-node1
172.31.6.102 ceph-node2.jie.ocal ceph-node2
172.31.6.103 ceph-node3.jie.ocal ceph-node3
172.31.6.104 ceph-mon1.jie.local ceph-mon1
172.31.6.105 ceph-mon2.jie.local ceph-mon2
172.31.6.106 ceph-mon3.jie.local ceph-mon3
172.31.6.107 ceph-mgr1.jie.local ceph-mgr1
172.31.6.108 ceph-mgr2.jie.local ceph-mgr2
172.31.6.109 ceph-deploy.jie.local ceph-deploy


#在k8snode节点验证用户权限
root@k8s-node1:~$ ceph --user xinceph-zcc -s 



```




## 通过 keyring 文件挂载 rbd
基于 ceph 提供的rbd 实现存储卷的动态提供，**由两种实现方式，一是通过宿主机的 keyring文件挂载rbd**，另外**一个是通过将 keyring 中key 定义为 k8s中的 secret**,然后 pod 通过secret 挂载 rbd。


### 通过 keyring 文件直接挂载-busybox
```yaml
#podyaml文件
root@k8s-master1:/opt/ceph-case# cat case1-busybox-keyring.yaml

apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - image: busybox 
    command:
      - sleep
      - "3600"
    imagePullPolicy: Always 
    name: busybox
    #restartPolicy: Always
    volumeMounts:
    - name: rbd-data1
      mountPath: /data
  volumes:
    - name: rbd-data1
      rbd:
        monitors:
        - '172.31.6.101:6789'
        - '172.31.6.102:6789'
        - '172.31.6.103:6789'
        pool: xin-rbd-pool1
        image: xin-img-img1
        fsType: ext4
        readOnly: false
        user: xinceph-zcc
        keyring: /etc/ceph/ceph.client.xinceph-zcc.keyring



#创建 pod
root@k8s-master1:/opt/ceph-case# kubectl apply -f case1-busybox-keyring.yamlpod/busybox created
pod/busybox created
#到pod验证rbd是否挂载成功


```

![验证挂载](http://img.xinn.cc/1674889936820-b1e98d87-5f4b-4363-870d-770e69014658.png)



## 通过secret 挂载rbd

将key定义为secret ，然后在挂载至pod，每个k8s node 就不用保存keyring文件了。

### 创建secret 
首先创建secret ，secret中主要就是包含ceph中被授权用户的keyring文件中的key,需要将key内容通过 base64编码后即可创建secret。

```bash
#将 key 进行编码

ceph auth print-key client.xinceph-zcc
AQB4L79g/he7HBAAvJQ7sl3zdSsTUL21Nx6zLQ==

ceph auth print-key client.xinceph-zcc | base64
QVFDbm1HSmg2L0dCTGhBQWtXQlRUTmg2R1RHWGpreXFtdFo5RHc9PQo=

```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ceph-secret-xinceph-zcc
type: "kubernetes.io/rbd"
data:
  key: QVFDbm1HSmg2L0dCTGhBQWtXQlRUTmg2R1RHWGpreXFtdFo5RHc9PQo= 
```

```bash
#查看secret
root@k8s-master1:~/ceph-case$ kubectl get secrets
NAME                     TYPE                                DATA          AGE
ceph-secret-xinceph-zcc  kubernetes.io/service-account-token 1             3s

```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels: #rs or deployment
      app: ng-deploy-80
  template:
    metadata:
      labels:
        app: ng-deploy-80
    spec:
      containers:
      - name: ng-deploy-80
        image: nginx
        ports:
        - containerPort: 80

        volumeMounts:
        - name: rbd-data1
          mountPath: /data
      volumes:
        - name: rbd-data1
          rbd:
            monitors:
            - '172.31.6.101:6789'
            - '172.31.6.102:6789'
            - '172.31.6.103:6789'
            pool: xin-rbd-pool1
            image: xin-img-img1
            fsType: ext4
            readOnly: false
            user: xinceph-zcc
            secretRef:
              name: ceph-secret-xinceph-zcc
```


查看pod挂载情况


![查看pod挂载情况](http://img.xinn.cc/xxlog/1674891101243-0f2488ce-778a-4dda-87b4-90b3c1b1cf9a.png)





## ceph 持久化存储

**admin secret** 用于k8s master 节点 连接到ceph 自动创建pv ，并关联pvc提供给pod 使用。uer  secret 用于pod挂载。

![后端存储流程图](http://img.xinn.cc/1674891447209-73e1dade-be4a-4a07-bbfe-f4c1ecb67858.png)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ceph-secret-admin
type: "kubernetes.io/rbd"
data:
  key: QVFBM2RoZGhNZC9VQUJBQXIyU05wSitoY0sxZEQ1bDJIajVYTWc9PQo= 
```



### 创建存储类

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-storage-class-xin
  annotations:
    storageclass.kubernetes.io/is-default-class: "true" #设置为默认存储类
provisioner: kubernetes.io/rbd
parameters:
  monitors: 172.31.6.101:6789,172.31.6.102:6789,172.31.6.103:6789
  adminId: admin
  adminSecretName: ceph-secret-admin
  adminSecretNamespace: default 
  pool: xin-rbd-pool1
  userId: xinceph-zcc
  userSecretName: ceph-secret-xinceph-zcc
```




### 创建 secret
```bash
root@k8s-master1:~/ceph-cease$ kubectl apply -f case3-secret-client-shijie.yaml
root@k8s-master1:~/ceph-cease$ kubectl apply -f case4-secret-client-admin.yaml
```



### 创建pvc
关联

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ceph-storage-class-xin 
  resources:
    requests:
      storage: '5Gi'



#查看pvc

root@k8s-master1:~/ceph-cease$ kubectl get pvc 
```


```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  selector:
    matchLabels:
      app: mysql
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - image: mysql:5.6.46 
        name: mysql
        env:
          # Use secret in real usage
        - name: MYSQL_ROOT_PASSWORD
          value: 123456
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-data-pvc 


---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: mysql-service-label 
  name: mysql-service
spec:
  type: NodePort
  ports:
  - name: http
    port: 3306
    protocol: TCP
    targetPort: 3306
    nodePort: 43306
  selector:
    app: mysql
```


查看ceph使用空间
```bash
ceph df 
```



## cephFs
实现多主机的挂载共享数据 


### 配置cephfs
步骤如下：[https://www.yuque.com/ryanxx/ga3673/bz0645hbae3emovp](https://www.yuque.com/ryanxx/ga3673/bz0645hbae3emovp)



### 创建nginx pod同时挂载cephfs
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels: #rs or deployment
      app: ng-deploy-80
  template:
    metadata:
      labels:
        app: ng-deploy-80
    spec:
      containers:
      - name: ng-deploy-80
        image: nginx
        ports:
        - containerPort: 80

        volumeMounts:
        - name: xinceph-staticdata-cephfs 
          mountPath: /usr/share/nginx/html/ 
      volumes:
        - name: xinceph-staticdata-cephfs
          cephfs:
            monitors:
            - '172.31.6.101:6789'
            - '172.31.6.102:6789'
            - '172.31.6.103:6789'
            path: /
            user: admin
            secretRef:
              name: ceph-secret-admin
```
