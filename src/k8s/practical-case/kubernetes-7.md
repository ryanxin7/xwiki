---
author: Ryan
sidebar_position: 2
title: 7.Pod的状态和探针
date: 2023-01-17
---




## 一、Pod的状态

![Pod状态](http://img.xinn.cc/1674895053415-2477036f-d642-41c9-90c7-942d1a238360.png)


> **第一阶段**
> 1. **Pending** 正在创建Pod但是Pod中的容器还没有全部被创建完成=[处于此状态的Pod应该检查Pod依赖的存储是否有权限挂载、镜像是否可以下载、调度是否正常等。
> 2. **Failed** Pod中有容器启动失败而导致pod工作异常。
> 3. **Unknown** 由于某种原因无法获得pod的当前状态，通常是由于与pod所在的node节点通信错误。
> 4. **Succeeded** Pod中的所有容器都被成功终止即pod里所有的containers均已terminated.




> **第二阶段**
> 1. **Unschedulable** Pod不能被调度，kube-scheduler没有匹配到合适的node节点。
> 2. **Podscheduled** pod正处于调度中，在kube-scheduler刚开始调度的时候，还没有将pod分配到指定的node，在筛选出合适的节点后就会更新etcd数据，将pod分配到指定的node。
> 3. **Initialized** 所有pod中的初始化容器已经完成了。
> 4. **ImagePullBackoff** Pod所在的node节点下载镜像失败
> 5. **Running** Pod内部的容器已经被创建并且启动。
> 6.  **Ready** 表示pod中的容器已经可以提供访问服务



![](http://img.xinn.cc/1674895376985-f56a789b-45f8-418b-836c-22314b8775f4.png)

```bash
Error: #pod 启动过程中发生错误
NodeLost: #Pod 所在节点失联
Unkown: #Pod 所在节点失联或其它未知异常
waiting: #Pod 等待启动
Pending: #Pod 等待被调度
Terminating: #Pod 正在被销毁
CrashLoopBackoff: #pod，但是kubelet正在将它重启
InvalidImageName: #node节点无法解析镜像名称导致的镜像无法下载
ImageInspectError: #无法校验镜像，镜像不完整导致
ErrImageNeverPull: #策略禁止拉取镜像，镜像中心权限是私有等
ImagePullBackoff: #镜像拉取失败，但是正在重新拉取
RegistryUnavailable: #镜像服务器不可用，网络原因或harbor宕机
ErrImagePull: #镜像拉取出错，超时或下载被强制终止
CreateContainerConfigError: #不能创建kubelet使用的容器配置
CreateContainerError: #创建容器失败
PreStartContainer: #执行prestart hook报错，Pod hook(钩子)是由 Kubernetes 管理的 kubelet 发起的，当容器中的进程启动前或者容器中的进程终止之前运行，比如容器创建完成后里面的服务启动之前可以检查一下依赖的其它服务是否启动，或者容器退出之前可以把容器中的服务先通过命令停止。
PoststartHookError: #执行 poststart hook 报错

RunContainerError: #pod运行失败，容器中没有初始化PID为1的守护进程等
ContainersNotInitialized: #pod没有初始化完毕
ContainersNotReady: #pod没有准备完毕
ContainerCreating: #pod正在创建中
PodInitializing: #pod正在初始化中
DockerDaemonNotReady: #node节点decker服务没有启动
NetworkPluginNotReady: #网络插件还没有完全启动
```







## 二、Pod 探针

[https://kubernetes.io/zh-cn/docs/concepts/workloads/pods/pod-lifecycle/](https://kubernetes.io/zh-cn/docs/concepts/workloads/pods/pod-lifecycle/)


### 2.1 探针简介
在 Kubernetes 中，探针（Probes）是由 kubelet 进行的定期诊断，以确保 Pod 中的容器保持在健康状态。为了执行这些诊断，kubelet 调用由容器内部实现的处理程序（Handlers）。这些处理程序有三种类型：



#### 2.1.1 ExecAction（命令执行动作）
这种处理程序类型会在容器中执行特定的命令。kubelet 将执行指定的命令，并通过进程的退出状态来判断容器的健康状态。如果命令成功执行（返回退出码为0），则探针认为容器是健康的；否则，它将被标记为不健康。



#### 2.1.2 HTTPGetAction（HTTP GET 动作）
这种处理程序类型会向容器中指定的 HTTP 地址发送 GET 请求。如果返回的状态码在一定范围内（通常是 2xx 或 3xx），则探针认为容器是健康的；否则，它将被标记为不健康。

#### 2.1.3 TCPSocketAction（TCP 套接字动作）:
这种处理程序类型会尝试建立到容器中指定端口的 TCP 连接。如果连接成功建立，探针将认为容器是健康的；否则，它将被标记为不健康。





#### 2.1.4 探测结果

在 Kubernetes 中，每次探测都会产生以下三种结果之一：

- **成功（Success）**
当探针成功检测到容器处于健康状态时，将返回成功。这表示容器通过了诊断，可以接收流量或请求。

- **失败（Failure）**
如果探针未能检测到容器处于健康状态，将返回失败。这意味着容器未通过诊断，不能接收流量或请求。

- **未知（Unknown）**
在某些情况下，可能由于无法完成诊断检查或处理程序发生错误，探针无法得出明确的健康状态。在这种情况下，探针会返回未知状态。当探针返回未知状态时，Kubernetes 不会做出任何假设或行动，而是等待下一次探测来确认容器的状态。







### 2.2 探针类型

#### 2.2.1 livenessProbe

> **存活探针** 是 Kubernetes 中一种用于检测容器是否处于运行状态的探针机制。通过配置 livenessProbe，Kubernetes 可以定期检查容器的健康状况，并根据检查结果来决定是否需要重启容器。如果 livenessProbe 失败，则 Kubernetes 的 kubelet 将认为容器不再处于运行状态，并根据其重启策略采取相应的措施。


重启策略是指在容器失败时 Kubernetes 如何处理 Pod。如果容器的存活探针（livenessProbe）失败，kubelet 将视其为容器已经失效，并根据 Pod 的重启策略采取行动。

**Pod 的重启策略通常有以下几种**：

- Always：始终尝试重启容器。无论何时容器退出或崩溃，Kubernetes 都会尝试重新启动容器。
- OnFailure：仅在容器退出代码非零时尝试重启容器。
- Never：从不尝试重启容器。在容器失败时不会重启。


如果容器未提供 **livenessProbe**（存活探针），则默认情况下 kubelet 会假定该容器的状态为成功。这会导致 Kubernetes 将不会周期性地检查容器的健康状态。这意味着 Kubernetes 无法直接了解容器是否在运行。因此，如果容器进入了不健康的状态（例如死锁、无限循环、挂起等），Kubernetes 将不会自动检测到这些问题。

其次这种情况还会导致 Kubernetes 无法及时处理容器故障在缺少存活探针的情况下，如果容器发生故障导致停止运行，Kubernetes 将不会主动进行重启或采取其他措施。这可能会导致服务中断，因为 Kubernetes 不会意识到容器已经停止运行，也无法自动采取纠正措施。




#### 2.2.2 readinessProbe

>**就绪探针**，一种用于检测应用程序是否已经准备好处理请求的健康检查机制，通过定期检查应用程序的状态来确定容器是否已经准备好开始接收流量。
**readinessProbe** 用于控制 Pod 是否被添加至 Service 的端点。就绪探测失败会导致端点控制器将该 Pod 的 IP 从对应的 Service 端点中删除，如果容器没有提供 readinessProbe，则默认情况下该容器的状态将被视为成功。这意味着如果没有明确配置就绪探测，Kubernetes 不会等待容器就绪就开始将流量引导到该容器。


## 三、探针配置



[https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

探针有很多配置字段，可以使用这些字段精确的控制存活和就绪检测的行为。

```
initialDelaySeconds: 120
初始化延迟时间，告诉kubelet在执行第一次探测前应该等待多少秒，默认是0秒，最小值是0

periodseconds: 60
探测周期间隔时间，指定了kubelet应该每多少秒秒执行一次存活探测，默认是 10 秒。最小值是 1

timeoutseconds: 5
单次探测超时时间，探测的超时后等待多少秒，默认值是1秒，最小值是1。

successThreshold: 1
从失败转为成功的重试次数，探测器在失败后，被视为成功的最小连续成功数，默认值是1，存活探测的这个值必须是1，最小值是 1。

failureThreshold: 3 
从成功转为失败的重试次数，当Pod启动了并目探测到失败，Kubernetes的重试次数，存活探测情况下的放弃就意味着重新启动容器，就绪探测情况下的放弃Pod 会被打上未就绪的标签，默认值是3，最小值是1。
```



### 3.1 存活探针（livenessProbe）配置字段

1. **httpGet**：
   - `path`：指定要检查的 HTTP 路径。
   - `port`：指定用于检查的端口号。
2. **tcpSocket**：
   - `port`：指定要检查的 TCP 端口号。
3. **exec**：
   - `command`：执行的命令。如果该命令成功执行（返回退出码为0），则探针认为容器是健康的。
4. **initialDelaySeconds**：
   - 定义容器启动后等待执行第一次探测的时间。
5. **periodSeconds**：
   - 定义探测之间的间隔时间。
6. **timeoutSeconds**：
   - 指定探测超时时间，如果探测在该时间内未返回，则认为探测失败。
7. **successThreshold**：
   - 表示连续成功探测的次数，达到该次数后认为容器是健康的。
8. **failureThreshold**：
   - 表示连续失败探测的次数，达到该次数后认为容器是不健康的。



### 3.2 就绪探针（readinessProbe）配置字段

就绪探针与存活探针类似，但它影响的是容器的就绪状态，而不是其运行状态。它也具有与存活探针类似的配置字段，包括：

- **httpGet**
- **tcpSocket**
- **exec**
- **initialDelaySeconds**
- **periodSeconds**
- **timeoutSeconds**
- **successThreshold**
- **failureThreshold**







### 3.3 HTTP 探测器可以在 httpGet 上配置额外的字段
```bash

host:
#连接使用的主机名，默认是Pod的 IP，也可以在HTTP头中设置 “Host” 来代替

scheme: http
#用于设置连接主机的方式 (HTTP 还是 HTTPS)，默认是 HTTP。

path: /monitor/index.html
#访问 HTTP 服务的路径。

httpHeaders :
#请求中自定义的 HTTP 头，HTTP 头字段允许重复

port: 80
#访问容器的端口号或者端口名，如果数字必须在 1 ~ 65535 之间
```





### 3.4 HTTP探针示例

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
        image: nginx:1.17.5
        ports:
        - containerPort: 80
        #readinessProbe:
        livenessProbe:
          httpGet:
            path: /index.html
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 3
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3

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
    nodePort: 40012
    protocol: TCP
  type: NodePort
  selector:
    app: ng-deploy-80
```

验证http探针： 

![image-20231116172455588](http://img.xinn.cc/image-20231116172455588.png)



### 3.5 TCP 探针示例

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
        image: nginx:1.17.5
        ports:
        - containerPort: 80
        livenessProbe:
        #readinessProbe:
          tcpSocket:
            port: 80
            #port: 8080
          initialDelaySeconds: 5
          periodSeconds: 3
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3

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
    nodePort: 40012
    protocol: TCP
  type: NodePort
  selector:
    app: ng-deploy-80
```





### 3.6 ExecAction探针  

可以基于指定的命令对Pod进⾏特定的状态检查。
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-deploy-6379
  template:
    metadata:
      labels:
        app: redis-deploy-6379
    spec:
      containers:
      - name: redis-deploy-6379
        image: redis
        ports:
        - containerPort: 6379
        livenessProbe:
          exec:
            command:
            - /usr/local/bin/redis-cli
            - quit
          initialDelaySeconds: 5
          periodSeconds: 3
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
---
apiVersion: v1
kind: Service
metadata:
  name: redis-deploy-6379
spec:
  ports:
  - name: http
    port: 6379
    targetPort: 6379
    nodePort: 40016
    protocol: TCP
  type: NodePort
  selector:
    app: redis-deploy-6379
```

如果端⼝检测连续超过指定的三次都没有通过，则Pod状态如下：  ![](http://img.xinn.cc/1674961899934-85e91869-b0af-44bb-ad5b-21f9466b891b.png)







### 3.8  livenessProbe和readinessProbe 结合使用

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-deploy-6379
  template:
    metadata:
      labels:
        app: redis-deploy-6379
    spec:
      containers:
      - name: redis-deploy-6379
        image: redis
        ports:
        - containerPort: 6379
        readinessProbe:
          exec:
            command:
            - /usr/local/bin/redis-cli
            - ping
          initialDelaySeconds: 5
          periodSeconds: 3
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
        livenessProbe:
          exec:
            command:
            - /usr/local/bin/redis-cli
            - ping
          initialDelaySeconds: 5
          periodSeconds: 3
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
```








### 3.7 livenessProbe和readinessProbe的对⽐
> 1. **配置参数⼀样**
> 2. livenessProbe **连续探测失败会重启、重建pod， readinessProbe不会执⾏重启或者重建Pod操作**livenessProbe **连续检测指定次数失败后会将容器置于(Crash Loop BackOff)且不可⽤，readinessProbe不会**
> 3. readinessProbe **连续探测失败会从service的endpointd中删除该Pod， livenessProbe不具备此功能，但是会将容器挂起livenessProbe**

> 4. **livenessProbe⽤户控制是否重启pod， readinessProbe⽤于控制pod是否添加⾄service**

> 
**建议：两个探针都配置 **





## 四、镜像拉取策略

> **IfNotPresent** **node节点没有此镜像就去指定的镜像仓库拉取， node有就使⽤node本地镜像。****Always** **每次重建pod都会重新拉取镜像****Never** **从不到镜像中⼼拉取镜像，只使⽤本地镜像 **

