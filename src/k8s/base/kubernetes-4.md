---
author: Ryan
title: 4.kubernetesAPI资源对象
date: 2023-01-12
---

import WordCount from '@site/src/components/WordCount';

<WordCount />


![资源对象](https://cdn1.ryanxin.live/1673335368520-3d26b509-0ef8-42a6-8744-fcce0df96dee.png)



## 常用命令
![常用命令](https://cdn1.ryanxin.live/1673335468699-d16c69d0-45ec-4c1e-8088-800238d2db49.png)




## K8S的几个重要概念

1.用什么和k8s打交道？  通过k8s声明式API 调用K8S资源对象。<br />2.怎么打交道？  通过写yaml文件调用声明式API。<br />3.怎么声明？  yaml中必需的字段：

- apiVersion - 创建该对象所使用的Kubernetes API的版本
- kind- 想要创建的对象的类型
- metadata- 帮助识别对象唯一性的数据， 包括一个name名称、可选的namespace
- spec 期望状态
- status (Pod创建完成后k8s自动生成status状态)

**spec和status的区别:**<br />spec是期望状态<br />status是实际状态



### Pod 概述

1. pod是k8s中的最小单元。
2. 一个pod中可以运行一个容器， 也可以运行多个容器。
3. 运行多个容器的话，这些容器是一起被调度的。
4. Pod的生命周期是短暂的， 不会自愈， 是用完就销毁的实体。
5. 一般我们是通过Controller来创建和管理pod的。



#### Pod生命周期
初始化容器、启动前操作、就绪探针、存活探针、删除pod操作<br />![生命周期](https://cdn1.ryanxin.live/1673336189572-84786ce3-c99e-464f-aafa-b05287a15d02.png)


#### livenessProbe和readinessProbe 探针

-  **livenessProbe**：存活探针，检测应用发生故障时使用，不能提供服务、超时等检测失败重启pod
-  **readinessProbe**：就绪探针，检测pod启动之后应用是否就绪，是否可以提供服务，检测成功，pod才开始接收流量。


#### Controller 控制器

**Replication Controller**   第一代pod副本控制器<br />**ReplicaSet  ** 第二代pod副本控制器<br />**Deployment**    第三代pod控制器



#### Rc,Rs 和Deployment 区别：

**Replication Controller**：副本控制器（selector = !=）<br />[https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/replicationcontroller/](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/replicationcontroller/)<br />• [https://kubernetes.io/zh/docs/concepts/overview/working-with-objects/labels/](https://kubernetes.io/zh/docs/concepts/overview/working-with-objects/labels/)

**ReplicaSet**：副本控制集，和副本控制器的区别是：对选择器的支持（selector 还支持in notin）<br />• [https://kubernetes.io/zh/docs/concepts/workloads/controllers/replicaset/](https://kubernetes.io/zh/docs/concepts/workloads/controllers/replicaset/)

**Deployment**：比rs更高一级的控制器，除了有rs的功能之外，还有很多高级功能,，比如说最重要的：滚动升级、回滚等<br />• [https://kubernetes.io/zh/docs/concepts/workloads/controllers/deployment/](https://kubernetes.io/zh/docs/concepts/workloads/controllers/deployment/)

**以下是 Deployments 的典型用例：**

:::tip
[创建 Deployment 以将 ReplicaSet 上线](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/#creating-a-deployment)。ReplicaSet 在后台创建 Pod。 检查 ReplicaSet 的上线状态，查看其是否成功。
:::

1. 通过更新 Deployment 的 PodTemplateSpec，[声明 Pod 的新状态](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/#updating-a-deployment) 。 新的 ReplicaSet 会被创建，Deployment 以受控速率将 Pod 从旧 ReplicaSet 迁移到新 ReplicaSet。 每个新的 ReplicaSet 都会更新 Deployment 的修订版本。

2. 如果 Deployment 的当前状态不稳定，[回滚到较早的 Deployment 版本](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment)。 每次回滚都会更新 Deployment 的修订版本。
3. [扩大 Deployment 规模以承担更多负载](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/#scaling-a-deployment)。
4. [暂停 Deployment 的上线](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/#pausing-and-resuming-a-deployment) 以应用对 PodTemplateSpec 所作的多项修改， 然后恢复其执行以启动新的上线版本。
5. [使用 Deployment 状态](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/#deployment-status)来判定上线过程是否出现停滞。
6. [清理较旧的不再需要的 ReplicaSet](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/#clean-up-policy) 。
:::




### Service
pod重启后ip地址就变了，如何保证pod间访问不受影响？

通过声明一个service对象，服务和应用进行解耦。

**一般常用的有两种：**

1. k8s集群内的service：selector指定pod，自动创建Endpoints
2. k8s集群外的service：手动创建Endpoints，指定外部服务的ip，端口和协议


#### kube-proxy和service的关系
kube-proxy 监听着**k8s-apiserver**，一旦service资源发生变化（调用k8s-api修改service信息），kube-proxy就会生成对应的负载调度的调整，这样就保证service的最新状态。

**kube-proxy有三种调度模型：**

- **userspace**：k8s1.1之前
- **iptables**：1.2-k8s1.11之前
- **ipvs**：k8s 1.11之后，如果没有开启ipvs，则自动降级为iptables



### 

### Volume 

k8s 抽象出的一个对象，用来保存数据，解耦数据和镜像（数据存镜像里面每次更新镜像会特别大），实现容器间数据共享。

**常用的几种卷：**

- **emptyDir**：本地临时卷
- **hostPath**：本地卷
- **nfs**等：共享卷
- **configmap**: 配置文件

[https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/](https://kubernetes.io/zh-cn/docs/concepts/storage/volumes/)




#### emptyDir
当 Pod 被分配给节点时，首先创建 emptyDir 卷，并且只要该Pod 在该节点上运行，该卷就会存在。正如卷的名字所述，它最初是空的。<br />Pod 中的容器可以读取和写入 emptyDir 卷中的相同文件，尽管该卷可以挂载到每个容器中的相同或不同路径上。<br />当出于任何原因从节点中删除 Pod 时，emptyDir 中的数据将被永久删除。


#### hostPath
hostPath 卷将主机节点的文件系统中的文件或目录挂载到集群中，pod删除的时候，卷不会被删除，但是pod可能调度到不同的node 数据会出现丢失。


#### nfs等共享存储
nfs 卷允许将现有的 NFS（网络文件系统）共享挂载到您的容器中。<br />不像 emptyDir，当删除 Pod 时，nfs 卷的内容被保留，卷仅仅是被卸载。<br />这意味着 NFS 卷可以预填充数据，并且可以在 pod 之间“切换”数据。 NFS可以被多个写入者同时挂载。



##### 创建多个pod测试挂载同一个NFS

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
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
        - mountPath: /usr/share/nginx/html/mysite
          name: my-nfs-volume
      volumes:
      - name: my-nfs-volume
        nfs:
          server: 172.31.7.109
          path: /data/magedu/n56
---
apiVersion: v1
kind: Service
metadata:
  name: ng-deploy-80
spec:
  ports:
  - name: http
    port: 81
    targetPort: 80
    nodePort: 30016
    protocol: TCP
  type: NodePort
  selector:
    app: ng-deploy-80
```


##### 创建多个pod测试每个pod挂载多个NFS

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
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
        - mountPath: /usr/share/nginx/html/mysite
          name: my-nfs-volume
        - mountPath: /usr/share/nginx/html/js
          name: my-nfs-js
      volumes:
      - name: my-nfs-volume
        nfs:
          server: 172.31.7.109
          path: /data/magedu/n56
      - name: my-nfs-js
        nfs:
          server: 172.31.7.109
          path: /data/magedu/js
---
apiVersion: v1
kind: Service
metadata:
  name: ng-deploy-80
spec:
  ports:
  - name: http
    port: 81
    targetPort: 80
    nodePort: 30016
    protocol: TCP
  type: NodePort
  selector:
    app: ng-deploy-80
```






重点：

service 访问流程：

k8s内部服务对外发布一般有两种方式，nodeport和ingress ，如果使用nodeport方式就会在每台node节点都会监听一个端口通常是30000以上，nodeport为什么不直接转发给pod ？ 因为维护nodeport和pod绑定关系比较难，通过需要service进行转发，service相当于k8s内部的负载均衡器负责转发，基于label标签匹配和筛选那些具有标签的pod。 默认使用轮询调度方式

![svc访问流程](https://cdn1.ryanxin.live/1673402165869-231b571d-0e9f-46fa-bb0c-8931d2a1cc9d.png)


### configmap
**功能**：将配置信息和镜像解耦<br />将配置信息放到**configmap**对象中，然后在pod的对象中导入configmap对象，实现导入配置文件的操作。<br />yaml声明一个ConfigMap的对象，作为Volume挂载到pod中


#### 使用 Configmap 挂载nginx 配置文件
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
 default: |
    server {
       listen       80;
       server_name  www.mysite.com;
       index        index.html;

       location / {
           root /data/nginx/html;
           if (!-e $request_filename) {
               rewrite ^/(.*) /index.html last;
           }
       }
    }


---
#apiVersion: extensions/v1beta1
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
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
        - mountPath: /data/nginx/html
          name: nginx-static-dir
        - name: nginx-config
          mountPath:  /etc/nginx/conf.d
      volumes:
      - name: nginx-static-dir
        hostPath:
          path: /data/nginx/linux39
      - name: nginx-config
        configMap:
          name: nginx-config
          items:
             - key: default
               path: mysite.conf

---
apiVersion: v1
kind: Service
metadata:
  name: ng-deploy-80
spec:
  ports:
  - name: http
    port: 81
    targetPort: 80
    nodePort: 30019
    protocol: TCP
  type: NodePort
  selector:
    app: ng-deploy-80

```


#### 使用 Configmap 挂载环境变量到pod
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  username: user1


---
#apiVersion: extensions/v1beta1
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ng-deploy-80
  template:
    metadata:
      labels:
        app: ng-deploy-80
    spec:
      containers:
      - name: ng-deploy-80
        image: nginx 
        env:
        - name: MY_PASSWD
          value: "123123"
        - name: MY_USERNAME
          valueFrom:
            configMapKeyRef:
              name: nginx-config
              key: username
        ports:
        - containerPort: 80

```


###  Statefulset  

**功能**： 为了解决有状态服务的问题  <br />无状态服务（有主从关系、集群部署 ）

 它所管理的Pod拥有固定的Pod名称，主机名，启停顺序  <br />和 [Deployment](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment/) 类似， StatefulSet 管理基于相同容器规约的一组 Pod。但和 Deployment 不同的是， StatefulSet 为它们的每个 Pod 维护了一个有粘性的 ID。这些 Pod 是基于相同的规约来创建的， 但是不能相互替换：无论怎么调度，每个 Pod 都有一个永久不变的 ID。


[https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/statefulset/](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/statefulset/)



### DaemonSet



### PV/PVC

对存储抽象 不直接存储数据而是在k8s层面做了一个隔离，权限控制、业务隔离，把不同是pod数据分开 

用nfs挂载 那么每个pod都能看到相同数据，如何做数据隔离？

在存储和k8s直接封装一层 PV/PVC 

![pv](https://cdn1.ryanxin.live/1673413439244-b1ef9fc6-ac17-42c4-8bbd-92d13d4a6504.png)

**PV是对底层⽹络存储的抽象，即将⽹络存储定义为⼀种存储资源**，将⼀个整体的存储资源拆分成多份后给不同的业务使用。   PV是由管理员添加的的⼀个存储的描述，是⼀个全局资源即**不⾪属于任何namespace**，包含存储的类型，存储的⼤⼩和访问模式等，它的⽣命周期独⽴于Pod，例如当使⽤它的Pod销毁时对PV没有影响。  

**PersistentVolumeClaim（PVC）**是⽤户存储的请求，它类似于pod，Pod消耗节点资源，PVC消耗存储资源， 就像 pod可以请求特定级别的资源（CPU和内存），PVC是namespace中的资源，可以设置特定的空间大小和访问模式。   pod是通过PVC将数据保存⾄PV，PV在保存⾄存储。  <br /> <br />![pvc](https://cdn1.ryanxin.live/1673420707945-cbb3d3e9-e20f-4a43-9e5d-57aeef5dfc16.png)



####  PersistentVolume参数：  

##### 访问模式 accessModes
PersistentVolume 卷可以用资源提供者所支持的任何方式挂载到宿主系统上。 如下表所示，提供者（驱动）的能力不同，每个 PV 卷的访问模式都会设置为对应卷所支持的模式值。<br /> 例如，NFS 可以支持多个读写客户，但是某个特定的 NFS PV 卷可能在服务器上以只读的方式导出。<br /> 每个 PV 卷都会获得自身的访问模式集合，描述的是特定 PV 卷的能力。

**访问模式有：**<br />**ReadWriteOnce**<br />卷可以被一个节点以读写方式挂载。 ReadWriteOnce 访问模式也允许运行在同一节点上的多个 Pod 访问卷。<br />**ReadOnlyMany**<br />卷可以被多个节点以只读方式挂载。<br />**ReadWriteMany**<br />卷可以被多个节点以读写方式挂载。<br />**ReadWriteOncePod**

```bash
# kubectl explain PersistentVolume
Capacity： #当前PV空间⼤⼩，kubectl explain PersistentVolume.spec.capacity
accessModes ：访问模式，#kubectl explain PersistentVolume.spec.accessModes
ReadWriteOnce – PV只能被单个节点以读写权限挂载，RWO
ReadOnlyMany – PV以可以被多个节点挂载但是权限是只读的,ROX
ReadWriteMany – PV可以被多个节点是读写⽅式挂载使⽤,RWX
```
[https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#access-modes](https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#access-modes)

**官⽅提供的基于各后端存储创建的PV⽀持的访问模式**

![⽀持的访问模式](https://cdn1.ryanxin.live/1673421868807-b85faeed-f417-408f-8c0b-92bb351f28e4.png)



##### 回收机制 persistentVolumeReclaimPolicy
```bash
persistentVolumeReclaimPolicy #删除机制即删除存储卷卷时候，已经创建好的存储卷由以下删除操作：

#kubectl explain PersistentVolume.spec.persistentVolumeReclaimPolicy
 Retain – 删除PV后保持原装，最后需要管理员⼿动删除
 Recycle – 空间回收，及删除存储卷上的所有数据(包括⽬录和隐藏⽂件),⽬前仅⽀持NFS和hostPath
 Delete – ⾃动删除存储卷


mountOptions #附加的挂载选项列表，实现更精细的权限控制
 ro #等
```

[https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#reclaim-policy](https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#reclaim-policy)

##### 卷模式
针对 PV 持久卷，Kubernetes 支持两种卷模式（volumeModes）：Filesystem（文件系统） 和 Block（块）。 volumeMode 是一个可选的 API 参数。 如果该参数被省略，默认的卷模式是 Filesystem。<br />volumeMode 属性设置为 Filesystem 的卷会被 Pod **挂载（Mount）** 到某个目录。 如果卷的存储来自某块设备而该设备目前为空，Kuberneretes 会在第一次挂载卷之前在设备上创建文件系统。

```bash
volumeMode #卷类型
kubectl explain PersistentVolume.spec.volumeMode
定义存储卷使⽤的⽂件系统是块设备还是⽂件系统，默认为⽂件系统
```

[https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#volume-mode](https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#volume-mode)


##### 

![](https://cdn1.ryanxin.live/1673421245380-7d31902c-15fe-438e-bbb0-903154cceac9.png)


####  PersistentVolumeClaim 参数
```bash
#kubectl explain PersistentVolumeClaim

accessModes ：PVC 访问模式，#kubectl explain PersistentVolumeClaim.spec.volumeMode
ReadWriteOnce – PVC只能被单个节点以读写权限挂载，RWO
ReadOnlyMany – PVC以可以被多个节点挂载但是权限是只读的,ROX
ReadWriteMany – PVC可以被多个节点是读写⽅式挂载使⽤,RWX

resources： #定义PVC创建存储卷的空间⼤⼩
selector： #标签选择器，选择要绑定的PV

 matchLabels #匹配标签名称
 matchExpressions #基于正则表达式匹配

volumeName #要绑定的PV名称

volumeMode #卷类型
定义PVC使⽤的⽂件系统是块设备还是⽂件系统，默认为⽂件系统
```



####  PV及PVC实战案例之zookeeper集群  
 基于PV和PVC作为后端存储，实现zookeeper集群  


##### 1.下载JDK 镜像<br /><br />
[https://www.oracle.com/java/technologies/javase/javase8u211-later-archive-downloads.html#license-lightbox](https://www.oracle.com/java/technologies/javase/javase8u211-later-archive-downloads.html#license-lightbox)

```bash
docker pull elevy/slim_java:8
docker tag elevy/slim_java:8 harbor.ceamg.com/baseimages/slim_java:8
docker push harbor.ceamg.com/baseimages/slim_java:8
```




##### 2.构建zookeeper 镜像
![zookeeper镜像](https://cdn1.ryanxin.live/1673486581523-20c135bc-2fde-45aa-bc2b-c3fb840e5e15.png)

```bash
chmod a+x *.sh
chmod a+x bin/*.sh
bash build-command.sh  bash build-command.sh 2022-1-12_9_16_32
```

```bash
#FROM harbor-linux38.local.com/linux38/slim_java:8 
FROM harbor.ceamg.com/baseimages/slim_java:8

ENV ZK_VERSION 3.4.14
ADD repositories /etc/apk/repositories 
# Download Zookeeper
COPY zookeeper-3.4.14.tar.gz /tmp/zk.tgz
COPY zookeeper-3.4.14.tar.gz.asc /tmp/zk.tgz.asc
COPY KEYS /tmp/KEYS
RUN apk add --no-cache --virtual .build-deps \
      ca-certificates   \
      gnupg             \
      tar               \
      wget &&           \
    #
    # Install dependencies
    apk add --no-cache  \
      bash &&           \
    #
    #
    # Verify the signature
    export GNUPGHOME="$(mktemp -d)" && \
    gpg -q --batch --import /tmp/KEYS && \
    gpg -q --batch --no-auto-key-retrieve --verify /tmp/zk.tgz.asc /tmp/zk.tgz && \
    #
    # Set up directories
    #
    mkdir -p /zookeeper/data /zookeeper/wal /zookeeper/log && \
    #
    # Install
    tar -x -C /zookeeper --strip-components=1 --no-same-owner -f /tmp/zk.tgz && \
    #
    # Slim down
    cd /zookeeper && \
    cp dist-maven/zookeeper-${ZK_VERSION}.jar . && \
    rm -rf \
      *.txt \
      *.xml \
      bin/README.txt \
      bin/*.cmd \
      conf/* \
      contrib \
      dist-maven \
      docs \
      lib/*.txt \
      lib/cobertura \
      lib/jdiff \
      recipes \
      src \
      zookeeper-*.asc \
      zookeeper-*.md5 \
      zookeeper-*.sha1 && \
    #
    # Clean up
    apk del .build-deps && \
    rm -rf /tmp/* "$GNUPGHOME"

COPY conf /zookeeper/conf/
COPY bin/zkReady.sh /zookeeper/bin/
COPY entrypoint.sh /

ENV PATH=/zookeeper/bin:${PATH} \
    ZOO_LOG_DIR=/zookeeper/log \
    ZOO_LOG4J_PROP="INFO, CONSOLE, ROLLINGFILE" \
    JMXPORT=9010

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "zkServer.sh", "start-foreground" ]

EXPOSE 2181 2888 3888 9010
```

```bash
#!/bin/bash

echo ${MYID:-1} > /zookeeper/data/myid

if [ -n "$SERVERS" ]; then
	IFS=\, read -a servers <<<"$SERVERS"
	for i in "${!servers[@]}"; do 
		printf "\nserver.%i=%s:2888:3888" "$((1 + $i))" "${servers[$i]}" >> /zookeeper/conf/zoo.cfg
	done
fi

cd /zookeeper
exec "$@"

```

```bash
https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.6/main/
https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.6/community/
```

```bash
#!/bin/bash
TAG=$1
docker build -t harbor.ceamg.com/baseimages/zookeeper:${TAG} .
sleep 1
docker push  harbor.ceamg.com/baseimages/zookeeper:${TAG}
```


##### 测试镜像
```bash
root@harbor01:~/zookeeper# docker run -it --rm -p 2181:2181 harbor.ceamg.com/baseimages/zookeeper:2023-1-12_10_58_34
ZooKeeper JMX enabled by default
ZooKeeper remote JMX Port set to 9010
ZooKeeper remote JMX authenticate set to false
ZooKeeper remote JMX ssl set to false
ZooKeeper remote JMX log4j set to true
Using config: /zookeeper/bin/../conf/zoo.cfg
2023-01-12 03:07:17,632 [myid:] - INFO  [main:QuorumPeerConfig@136] - Reading configuration from: /zookeeper/bin/../conf/zoo.cfg
2023-01-12 03:07:17,638 [myid:] - INFO  [main:DatadirCleanupManager@78] - autopurge.snapRetainCount set to 3
2023-01-12 03:07:17,638 [myid:] - INFO  [main:DatadirCleanupManager@79] - autopurge.purgeInterval set to 1
2023-01-12 03:07:17,640 [myid:] - WARN  [main:QuorumPeerMain@116] - Either no config or no quorum defined in config, running  in standalone mode
2023-01-12 03:07:17,640 [myid:] - INFO  [PurgeTask:DatadirCleanupManager$PurgeTask@138] - Purge task started.
2023-01-12 03:07:17,641 [myid:] - INFO  [main:QuorumPeerConfig@136] - Reading configuration from: /zookeeper/bin/../conf/zoo.cfg
2023-01-12 03:07:17,642 [myid:] - INFO  [main:ZooKeeperServerMain@98] - Starting server
........
2023-01-12 03:07:17,654 [myid:] - INFO  [PurgeTask:DatadirCleanupManager$PurgeTask@144] - Purge task completed.
2023-01-12 03:07:17,654 [myid:] - INFO  [main:Environment@100] - Server environment:user.dir=/zookeeper
2023-01-12 03:07:17,657 [myid:] - INFO  [main:ZooKeeperServer@836] - tickTime set to 2000
2023-01-12 03:07:17,657 [myid:] - INFO  [main:ZooKeeperServer@845] - minSessionTimeout set to -1
2023-01-12 03:07:17,658 [myid:] - INFO  [main:ZooKeeperServer@854] - maxSessionTimeout set to -1
2023-01-12 03:07:17,666 [myid:] - INFO  [main:ServerCnxnFactory@117] - Using org.apache.zookeeper.server.NIOServerCnxnFactory as server connection factory
2023-01-12 03:07:17,671 [myid:] - INFO  [main:NIOServerCnxnFactory@89] - binding to port 0.0.0.0/0.0.0.0:2181
```



##### k8s 运行zookeeper服务


##### 通过yaml⽂件将zookeeper集群服务运⾏k8s环境  <br /><br />

##### 编写yaml文件



##### nfs服务

```bash
vim /etc/exports 
/data/k8s/xinzk *(rw,sync,no_root_squash)

root@harbor01:~# systemctl start nfs-kernel-server.service


root@harbor01:~# showmount -e
Export list for harbor01:
/data/k8s/xinzk *


root@master01:~# showmount -e 10.1.0.38
Export list for 10.1.0.38:
/data/k8s/xinzk *


测试挂载
root@master01:~# mount 10.1.0.38:/data/k8s/xinzk /mnt


root@harbor01:/data/k8s/xinzk# mkdir zookeeper-datadir-1
root@harbor01:/data/k8s/xinzk# mkdir zookeeper-datadir-2
root@harbor01:/data/k8s/xinzk# mkdir zookeeper-datadir-3

```


- `/data/k8s/xinzk`：指示要共享的目录；“`/data/k8s/xinzk`”目录需要自己创建。
- `*`：代表允许所有的网络段访问。
- `rw`：指示具有可读写的权限。
- `sync`：指示资料同步写入内存和硬盘
- `no_root_squash`：是 Ubuntu nfs 客户端分享目录使用者的权限。
- 例如：如果客户端使用的是 root 用户，那么对于该共享目录而言，该客户端就具有 root 权限。




##### 创建pv

```yaml
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: zookeeper-datadir-pv-1
spec:
  capacity:
    storage: 20Gi
  accessModes:
    - ReadWriteOnce 
  nfs:
    server: 10.1.0.38
    path: /data/k8s/xinzk/zookeeper-datadir-1 

---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: zookeeper-datadir-pv-2
spec:
  capacity:
    storage: 20Gi
  accessModes:
    - ReadWriteOnce
  nfs:
    server: 10.1.0.38 
    path: /data/k8s/xinzk/zookeeper-datadir-2 

---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: zookeeper-datadir-pv-3
spec:
  capacity:
    storage: 20Gi
  accessModes:
    - ReadWriteOnce
  nfs:
    server: 10.1.0.38
    path: /data/k8s/xinzk/zookeeper-datadir-3
```


```bash
root@master01:/zookeeper# kubectl apply -f zookeeper-persistentvolume.yaml 
persistentvolume/zookeeper-datadir-pv-1 created
persistentvolume/zookeeper-datadir-pv-2 created
persistentvolume/zookeeper-datadir-pv-3 created

```


##### 验证pv

```yaml
root@master01:/zookeeper# kubectl get pv 
NAME                     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
zookeeper-datadir-pv-1   20Gi       RWO            Retain           Available                                   101s
zookeeper-datadir-pv-2   20Gi       RWO            Retain           Available                                   101s
zookeeper-datadir-pv-3   20Gi       RWO            Retain           Available                                   101s
```


##### 创建pvc

```yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: zookeeper-datadir-pvc-1
  namespace: xin-zk
spec:
  accessModes:
    - ReadWriteOnce
  volumeName: zookeeper-datadir-pv-1
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: zookeeper-datadir-pvc-2
  namespace: xin-zk
spec:
  accessModes:
    - ReadWriteOnce
  volumeName: zookeeper-datadir-pv-2
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: zookeeper-datadir-pvc-3
  namespace: xin-zk
spec:
  accessModes:
    - ReadWriteOnce
  volumeName: zookeeper-datadir-pv-3
  resources:
    requests:
      storage: 10Gi
```

```bash
root@master01:/zookeeper# kubectl create ns xin-zk
namespace/xin-zk created
root@master01:/zookeeper# kubectl apply -f zookeeper-persistentvolumeclaim.yaml 
persistentvolumeclaim/zookeeper-datadir-pvc-1 created
persistentvolumeclaim/zookeeper-datadir-pvc-2 created
persistentvolumeclaim/zookeeper-datadir-pvc-3 created

```

##### 验证pvc

```bash
root@master01:/zookeeper# kubectl get pvc -n xin-zk
NAME                      STATUS   VOLUME                   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
zookeeper-datadir-pvc-1   Bound    zookeeper-datadir-pv-1   20Gi       RWO                           16s
zookeeper-datadir-pvc-2   Bound    zookeeper-datadir-pv-2   20Gi       RWO                           16s
zookeeper-datadir-pvc-3   Bound    zookeeper-datadir-pv-3   20Gi       RWO                           16s

```


##### 运行zookeeper集群

```bash
root@master01:/zookeeper# kubectl apply -f zookeeper.yaml 
service/zookeeper1 created
service/zookeeper2 created
service/zookeeper3 created
deployment.apps/zookeeper1 created
deployment.apps/zookeeper2 created
deployment.apps/zookeeper3 created
```



##### 验证zookeeper集群  


```bash
root@master01:/zookeeper# kubectl get svc -A
NAMESPACE              NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                                        AGE
default                kubernetes                  ClusterIP   10.10.0.1       <none>        443/TCP                                        8d
kube-system            kube-dns                    NodePort    10.10.0.2       <none>        53:65421/UDP,53:65421/TCP,9153:30009/TCP       7d22h
kubernetes-dashboard   dashboard-metrics-scraper   ClusterIP   10.10.123.158   <none>        8000/TCP                                       7d20h
kubernetes-dashboard   kubernetes-dashboard        NodePort    10.10.92.205    <none>        443:30010/TCP                                  7d20h
xin-zk                 zookeeper1                  NodePort    10.10.233.13    <none>        2181:42181/TCP,2888:44954/TCP,3888:65337/TCP   28s
xin-zk                 zookeeper2                  NodePort    10.10.101.183   <none>        2181:42182/TCP,2888:51171/TCP,3888:60008/TCP   27s
xin-zk                 zookeeper3                  NodePort    10.10.176.183   <none>        2181:42183/TCP,2888:47408/TCP,3888:39107/TCP   27s


root@master01:/zookeeper# kubectl get deployments.apps -A
NAMESPACE              NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
kube-system            calico-kube-controllers     1/1     1            1           8d
kube-system            coredns                     1/1     1            1           7d22h
kubernetes-dashboard   dashboard-metrics-scraper   1/1     1            1           7d21h
kubernetes-dashboard   kubernetes-dashboard        1/1     1            1           7d21h
xin-zk                 zookeeper1                  1/1     1            1           31m
xin-zk                 zookeeper2                  1/1     1            1           31m
xin-zk                 zookeeper3                  1/1     1            1           31m


```


![](https://cdn1.ryanxin.live/1673500958747-eff6d385-4fe1-40ed-b37f-7cf55130f909.png)

![zookeeper测试](https://cdn1.ryanxin.live/1673501722922-ecbd4d14-94cb-4e72-a577-8cdb28e7450e.png)
