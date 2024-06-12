---
author: Ryan
title: 11.基于zookeeper实现微服务动态注册和发现
date: 2023-01-31
---




 Apache Dubbo 最初在 2008 年由 Alibaba 捐献开源，很快成为了国内开源服务框架选型的事实标准框架 ，得到了各行各业的广泛应用。在 2017 年，Dubbo 正式捐献到 Apache 软件基金会并成为 Apache 顶级项目 。

 Apache Dubbo 是一款 RPC 服务开发框架，用于解决微服务架构下的服务治理与通信问题，官方提供了 Java、Golang 等多语言 SDK 实现。使用 Dubbo 开发的微服务原生具备相互之间的远程地址发现与通信能力， 利用 Dubbo 提供的丰富服务治理特性，可以实现诸如服务发现、负载均衡、流量调度等服务治理诉求。Dubbo 被设计为高度可扩展，用户可以方便的实现流量拦截、选址的各种定制逻辑。  

**dubbo 简介** 

**dubbo 架构 **

 



![dubbo 架构](https://cdn1.ryanxin.live/1675737775849-f438cf10-e5c5-4a72-a68f-6206a722476f.png)



## 1.构建Provider镜像
```bash
#Dubbo provider
FROM harbor.ceamg.com/pub-images/jdk8:3411
MAINTAINER XXXXXXXX
RUN mkdir -p /apps/dubbo/provider
ADD dubbo-demo-provider-2.1.5/ /apps/dubbo/provider/
ADD run_java.sh /apps/dubbo/provider/bin/
RUN useradd nginx -u 2023
RUN chown -R nginx.nginx /apps/ && chmod +x /apps/dubbo/provider/bin/*.sh

CMD ["/apps/dubbo/provider/bin/run_java.sh"]
```

 dubbo-demo-consumer-2.1.5是dubbo consumer的代码，也需要修改下配置，指定zookeeper的地址：  
```yaml
##
# Copyright 1999-2011 Alibaba Group.
#  
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#  
#      http://www.apache.org/licenses/LICENSE-2.0
#  
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
##
dubbo.container=log4j,spring
dubbo.application.name=demo-provider
dubbo.application.owner=
dubbo.registry.address=zookeeper://zookeeper1.xin-zk.svc.ceamg.local:2181 | zookeeper://zookeeper2.xin-zk.svc.ceamg.local:2181 | zookeeper://zookeeper3.xin-zk.svc.ceamg.local:2181
#dubbo.registry.address=zookeeper://127.0.0.1:2181
#dubbo.registry.address=redis://127.0.0.1:6379
#dubbo.registry.address=dubbo://127.0.0.1:9090
dubbo.monitor.protocol=registry
dubbo.protocol.name=dubbo
dubbo.protocol.port=20880
dubbo.log4j.file=logs/dubbo-demo-provider.log
dubbo.log4j.level=WARN
```

zk集群测试连通性
```yaml

--- zookeeper1.xin-zk.svc.ceamg.local:2181 ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.076/0.097/0.118 ms
bash-4.3# ping zookeeper2.xin-zk.svc.ceamg.local:2181
PING zookeeper2.xin-zk.svc.ceamg.local:2181 (10.10.101.183): 56 data bytes
64 bytes from 10.10.101.183: seq=0 ttl=64 time=0.059 ms
64 bytes from 10.10.101.183: seq=1 ttl=64 time=0.134 ms
^C
--- zookeeper2.xin-zk.svc.ceamg.local:2181 ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.059/0.096/0.134 ms
bash-4.3# ping zookeeper3.xin-zk.svc.ceamg.local:2181
PING zookeeper3.xin-zk.svc.ceamg.local:2181 (10.10.176.183): 56 data bytes
64 bytes from 10.10.176.183: seq=0 ttl=64 time=0.049 ms
64 bytes from 10.10.176.183: seq=1 ttl=64 time=0.151 ms

--- zookeeper3.xin-zk.svc.ceamg.local:2181 ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.049/0.100/0.151 ms
```


 run_java.sh内容如下：  
```bash
#!/bin/bash
su - nginx -c "/apps/dubbo/provider/bin/start.sh"
tail -f /etc/hosts
```

```bash
#!/bin/bash
TAG=$1
docker  build -t harbor.ceamg.com/pub-images/dubbo-provider:${TAG} .
docker push harbor.ceamg.com/pub-images/dubbo-provider:${TAG}
```

```bash
root@harbor01[21:28:43]~/dubbo/dubbo-demo-consumer-2.1.5/conf #:chmod +x ./*.sh
```

 执行构建，上传镜像  
```bash
root@harbor01[21:37:19]~/dubbo/provider #:bash build_image_command.sh v1
Sending build context to Docker daemon  11.56MB
Step 1/8 : FROM harbor.ceamg.com/pub-images/jdk8:3411
 ---> 1328b4d79a67
Step 2/8 : MAINTAINER XXXXXXXX
 ---> Using cache
 ---> d68f684b20d3
Step 3/8 : RUN mkdir -p /apps/dubbo/provider
 ---> Using cache
 ---> 1eee7aae68c2
Step 4/8 : ADD dubbo-demo-provider-2.1.5/ /apps/dubbo/provider/
 ---> Using cache
 ---> 7d305495d592
Step 5/8 : ADD run_java.sh /apps/dubbo/provider/bin/
 ---> 93a53e745acc
Step 6/8 : RUN useradd nginx -u 2023
 ---> Running in 6ce3cb1b6065
Removing intermediate container 6ce3cb1b6065
 ---> 5f0402802b5c
Step 7/8 : RUN chown -R nginx.nginx /apps/ && chmod +x /apps/dubbo/provider/bin/*.sh
 ---> Running in 5e52acec648e
Removing intermediate container 5e52acec648e
 ---> 464dd347a8e2
Step 8/8 : CMD ["/apps/dubbo/provider/bin/run_java.sh"]
 ---> Running in 3ae6dd4ef0d7
Removing intermediate container 3ae6dd4ef0d7
 ---> c79f2c1a9fd3
Successfully built c79f2c1a9fd3
Successfully tagged harbor.ceamg.com/pub-images/dubbo-provider:v1
The push refers to repository [harbor.ceamg.com/pub-images/dubbo-provider]
78a2523488ca: Pushed 
aff40275a217: Pushed 
66f589639a2b: Pushed 
b7202c657fb7: Mounted from pub-images/dubbo-consumer 
6ee4ed148d1c: Mounted from pub-images/dubbo-consumer 
3ad8c5bef187: Mounted from pub-images/dubbo-consumer 
f4442a8d89b4: Mounted from pub-images/dubbo-consumer 
c185ef053da5: Mounted from pub-images/dubbo-consumer 
0002c93bdb37: Mounted from pub-images/dubbo-consumer 
v1: digest: sha256:27dc6e2e303f3d1eca2f330cedcb94669dbe78d31d4f2b25987f59a3177c393a size: 2202
```

```bash
root@harbor01[21:41:25]~/dubbo/consumer #:bash build_image_command.sh v1
Sending build context to Docker daemon  11.56MB
Step 1/8 : FROM harbor.ceamg.com/pub-images/jdk8:3411
 ---> 1328b4d79a67
Step 2/8 : MAINTAINER XXXXXXXX
 ---> Using cache
 ---> d68f684b20d3
Step 3/8 : RUN mkdir -p /apps/dubbo/consumer
 ---> Running in ae689963be67
Removing intermediate container ae689963be67
 ---> fd9b9c30a5c5
Step 4/8 : ADD dubbo-demo-consumer-2.1.5/ /apps/dubbo/consumer/
 ---> da8c837a310c
Step 5/8 : ADD run_java.sh /apps/dubbo/consumer/bin/
 ---> 6eab14874e6e
Step 6/8 : RUN useradd nginx -u 2023
 ---> Running in 8b0ecedc3298
Removing intermediate container 8b0ecedc3298
 ---> c6c031c2ad4d
Step 7/8 : RUN chown -R nginx.nginx /apps/ && chmod +x /apps/dubbo/consumer/bin/*.sh
 ---> Running in 1adf89e8a909
Removing intermediate container 1adf89e8a909
 ---> 0098b88d6f9d
Step 8/8 : CMD ["/apps/dubbo/consumer/bin/run_java.sh"]
 ---> Running in 315c79bd237b
Removing intermediate container 315c79bd237b
 ---> b2c7e5669a85
Successfully built b2c7e5669a85
Successfully tagged harbor.ceamg.com/pub-images/dubbo-consumer:v1
The push refers to repository [harbor.ceamg.com/pub-images/dubbo-consumer]
d0363e8f5978: Pushed 
142934daf2de: Pushed 
30b2759bc06d: Pushed 
449c2b429c70: Pushed 
ed197bc00295: Pushed 
3ad8c5bef187: Layer already exists 
f4442a8d89b4: Layer already exists 
c185ef053da5: Layer already exists 
0002c93bdb37: Layer already exists 
v1: digest: sha256:cbae406a2442c8682f23106383bdd8a681697336c7d896504d1ab21c42628a17 size: 2202
```


部署应用


```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dubbo-provider
  namespace: dubbo-xin
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dubbo-provider
  template:
    metadata:
      labels:
        app: dubbo-provider
    spec:
      containers:
      - name: dubbo-provider
        image: harbor.ceamg.com/pub-images/dubbo-provider:v1
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 20880

---
apiVersion: v1
kind: Service
metadata:
  name: dubbo-provider-svc
  namespace: dubbo-xin
spec:
  selector:
    app: dubbo-provider
  type: NodePort
  ports:
  - name: http
    port: 20880
    targetPort: 20880
    protocol: TCP

```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dubbo-consumer
  namespace: dubbo-xin
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dubbo-consumer
  template:
    metadata:
      labels:
        app: dubbo-consumer
    spec:
      containers:
      - name: dubbo-consumer
        image: harbor.ceamg.com/pub-images/dubbo-consumer:v1
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: dubbo-consumer-svc
  namespace: dubbo-xin
spec:
  selector:
    app: dubbo-consumer
  type: NodePort
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
```

```yaml
root@master01[21:46:40]~/dubbo-yaml #:kubectl apply -f dubbo-provider.yaml 
deployment.apps/dubbo-provider created
service/dubbo-provider-svc created
root@master01[21:46:46]~/dubbo-yaml #:kubectl apply -f dubbo-consumer.yaml 
deployment.apps/dubbo-consumer created
service/dubbo-consumer-svc created
```

查看pod svc状态

```yaml
root@master01[21:50:12]~/dubbo-yaml #:kubectl create namespace dubbo-xin
namespace/dubbo-xin created


root@master01[21:50:52]~/dubbo-yaml #:kubectl get pod -n dubbo-xin
NAME                              READY   STATUS    RESTARTS   AGE
dubbo-consumer-5dff546c9c-74qr5   1/1     Running   0          7s
dubbo-consumer-5dff546c9c-plpx7   1/1     Running   0          7s
dubbo-provider-768546b6b4-7r94p   1/1     Running   0          13s
dubbo-provider-768546b6b4-nb46c   1/1     Running   0          13s

root@master01[21:50:59]~/dubbo-yaml #:kubectl get svc -n dubbo-xin
NAME                 TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)           AGE
dubbo-consumer-svc   NodePort   10.10.242.171   <none>        80:51934/TCP      18s
dubbo-provider-svc   NodePort   10.10.1.12      <none>        20880:41214/TCP   24s
```



测试consumer
```yaml
root@master01[21:54:17]~/dubbo-yaml #:kubectl exec -it dubbo-consumer-5dff546c9c-74qr5 -n dubbo-xin -- bash
root@dubbo-consumer-5dff546c9c-74qr5:/# cd /apps/dubbo/consumer/logs/
root@dubbo-consumer-5dff546c9c-74qr5:/apps/dubbo/consumer/logs# ls
dubbo-demo-consumer.log  stdout.log
root@dubbo-consumer-5dff546c9c-74qr5:/apps/dubbo/consumer/logs# tail -f -n 10 stdout.log 
[13:54:28] Hello world106, response form provider: 10.20.30.147:20880
[13:54:30] Hello world107, response form provider: 10.20.5.3:20880
[13:54:32] Hello world108, response form provider: 10.20.30.147:20880
[13:54:34] Hello world109, response form provider: 10.20.5.3:20880
[13:54:36] Hello world110, response form provider: 10.20.30.147:20880
[13:54:38] Hello world111, response form provider: 10.20.5.3:20880
[13:54:40] Hello world112, response form provider: 10.20.30.147:20880
[13:54:42] Hello world113, response form provider: 10.20.5.3:20880
[13:54:44] Hello world114, response form provider: 10.20.30.147:20880
[13:54:46] Hello world115, response form provider: 10.20.5.3:20880
[13:54:48] Hello world116, response form provider: 10.20.30.147:20880
[13:54:50] Hello world117, response form provider: 10.20.5.3:20880
```


 扩容两个dubbo provider，验证dubbo consumer能否获取到新的provider地址并访问  
```bash
root@master01[21:56:43]~ #:kubectl scale deployment dubbo-provider -n dubbo-xin --replicas=3                
deployment.apps/dubbo-provider scaled                                                                       
root@master01[21:56:53]~ #:kubectl scale deployment dubbo-provider -n dubbo-xin --replicas=5                
deployment.apps/dubbo-provider scaled
```


```bash
root@master01[21:58:13]~/dubbo-yaml #:kubectl get pod -n dubbo-xin
NAME                              READY   STATUS    RESTARTS   AGE
dubbo-consumer-5dff546c9c-74qr5   1/1     Running   0          7m31s
dubbo-consumer-5dff546c9c-plpx7   1/1     Running   0          7m31s
dubbo-provider-768546b6b4-7mw8w   1/1     Running   0          75s
dubbo-provider-768546b6b4-7r94p   1/1     Running   0          7m37s
dubbo-provider-768546b6b4-jq29n   1/1     Running   0          90s
dubbo-provider-768546b6b4-nb46c   1/1     Running   0          7m37s
dubbo-provider-768546b6b4-rh9fl   1/1     Running   0          75s
```


 查看日志可以访问到新的provider  
```yaml
root@dubbo-consumer-5dff546c9c-74qr5:/apps/dubbo/consumer/logs# tail -f -n 10 stdout.log 
[13:55:43] Hello world143, response form provider: 10.20.5.3:20880
[13:55:45] Hello world144, response form provider: 10.20.30.147:20880
[13:55:47] Hello world145, response form provider: 10.20.5.3:20880
[13:55:49] Hello world146, response form provider: 10.20.30.147:20880
[13:55:51] Hello world147, response form provider: 10.20.5.3:20880
[13:55:53] Hello world148, response form provider: 10.20.30.147:20880
[13:55:55] Hello world149, response form provider: 10.20.5.3:20880
[13:55:57] Hello world150, response form provider: 10.20.30.147:20880
[13:55:59] Hello world151, response form provider: 10.20.5.3:20880
[13:56:01] Hello world152, response form provider: 10.20.30.147:20880
[13:56:03] Hello world153, response form provider: 10.20.5.3:20880
[13:56:05] Hello world154, response form provider: 10.20.30.147:20880
[13:56:07] Hello world155, response form provider: 10.20.5.3:20880
[13:56:09] Hello world156, response form provider: 10.20.30.147:20880
[13:56:11] Hello world157, response form provider: 10.20.5.3:20880
[13:56:13] Hello world158, response form provider: 10.20.30.147:20880
[13:56:15] Hello world159, response form provider: 10.20.5.3:20880
[13:56:17] Hello world160, response form provider: 10.20.30.147:20880
[13:56:19] Hello world161, response form provider: 10.20.5.3:20880
[13:56:21] Hello world162, response form provider: 10.20.30.147:20880
[13:56:23] Hello world163, response form provider: 10.20.5.3:20880
[13:56:25] Hello world164, response form provider: 10.20.30.147:20880
[13:56:27] Hello world165, response form provider: 10.20.5.3:20880
[13:56:29] Hello world166, response form provider: 10.20.30.147:20880
[13:56:31] Hello world167, response form provider: 10.20.5.3:20880
[13:56:33] Hello world168, response form provider: 10.20.30.147:20880
[13:56:35] Hello world169, response form provider: 10.20.5.3:20880
[13:56:37] Hello world170, response form provider: 10.20.30.147:20880
[13:56:39] Hello world171, response form provider: 10.20.5.3:20880
[13:56:41] Hello world172, response form provider: 10.20.30.147:20880
[13:56:43] Hello world173, response form provider: 10.20.5.3:20880
[13:56:45] Hello world174, response form provider: 10.20.30.147:20880
[13:56:47] Hello world175, response form provider: 10.20.5.3:20880
[13:56:49] Hello world176, response form provider: 10.20.30.147:20880
[13:56:51] Hello world177, response form provider: 10.20.5.3:20880
[13:56:53] Hello world178, response form provider: 10.20.30.147:20880
[13:56:55] Hello world179, response form provider: 10.20.5.3:20880
[13:56:57] Hello world180, response form provider: 10.20.30.147:20880
[13:56:59] Hello world181, response form provider: 10.20.30.156:20880
[13:57:01] Hello world182, response form provider: 10.20.5.3:20880
[13:57:03] Hello world183, response form provider: 10.20.30.147:20880
[13:57:05] Hello world184, response form provider: 10.20.30.156:20880
[13:57:07] Hello world185, response form provider: 10.20.5.3:20880
[13:57:09] Hello world186, response form provider: 10.20.30.147:20880
[13:57:11] Hello world187, response form provider: 10.20.30.156:20880
[13:57:13] Hello world188, response form provider: 10.20.5.30:20880
[13:57:15] Hello world189, response form provider: 10.20.5.3:20880
[13:57:17] Hello world190, response form provider: 10.20.30.131:20880
[13:57:19] Hello world191, response form provider: 10.20.30.147:20880
[13:57:21] Hello world192, response form provider: 10.20.30.156:20880
[13:57:23] Hello world193, response form provider: 10.20.5.30:20880
[13:57:25] Hello world194, response form provider: 10.20.5.3:20880
[13:57:27] Hello world195, response form provider: 10.20.30.131:20880
[13:57:29] Hello world196, response form provider: 10.20.30.147:20880
[13:57:31] Hello world197, response form provider: 10.20.30.156:20880
[13:57:33] Hello world198, response form provider: 10.20.5.30:20880
[13:57:35] Hello world199, response form provider: 10.20.5.3:20880
[13:57:37] Hello world200, response form provider: 10.20.30.131:20880
[13:57:39] Hello world201, response form provider: 10.20.30.147:20880
```
