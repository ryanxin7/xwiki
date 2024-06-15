---
author: Ryan
title: kubernetes pod、container与namespace资源限制
date: 2023-12-28
---

## 1.kubernetes中资源限制概括

CPU 以核心为单位,1C =1000 豪核，例如24核心48线程就是 48x1000 = 4800豪核
memory 以字节为单位， 1G = 1x1024x1024
requests 为kubernetes scheduler执行pod调度时node节点至少需要拥有的资源；
limits 为pod运行成功后最多可以使用的资源上限；

## 2.kubernetes对单个容器的CPU及memory实现资源限制

官方文档https://kubernetes.io/zh/docs/tasks/configure-pod-container/assign-memory-resource/



**对单个容器的CPU及memory实现资源限制示例**：

`case1-pod-memory-limit.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: limit-test-deployment
  namespace: xinn
spec:
  replicas: 1
  selector:
    matchLabels: 
      app: limit-test-pod
  template:
    metadata:
      labels:
        app: limit-test-pod
    spec:
      containers:
      - name: limit-test-container
        image: lorel/docker-stress-ng
        resources:
          limits:
            memory: "200Mi"  #pod运行成功后最多使用200M内存
            cpu: 500m #pod运行成功后最多使用500豪核CPU
          requests:
            memory: "100Mi" #scheduler执行pod调度时node节点至少需要"100Mi" 内存
        args: ["--vm", "2", "--vm-bytes", "256M"]
```



**推荐规格**：

nginx 2C 2G 、微服务 2C 2G/3G 、 mysql/ES 4C 6G  / 4C 8G

**限制单个容器 CPU与内存资源示例：**

`case2-pod-memory-and-cpu-limit.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: limit-test-deployment
  namespace: xinn
spec:
  replicas: 1
  selector:
    matchLabels:
      app: limit-test-pod
  template:
    metadata:
      labels:
        app: limit-test-pod
    spec:
      containers:
      - name: limit-test-container
        image: lorel/docker-stress-ng
        resources:
          limits:
            cpu: "1.2"
            memory: "512Mi"
          requests:
            memory: "100Mi"
            cpu: "500m"
        #command: ["stress"]
        args: ["--vm", "2", "--vm-bytes", "256M"]
      #nodeSelector:
      #  env: group1
```





## 3.kubernetes对单个pod的CPU及memory实现资源限制

使用 **Limit Range**是对具体某个Pod或容器的资源使用进行限制
官方资料https://kubernetes.io/zh/docs/concepts/policy/limit-range/



- 限制namespace中每个Pod或容器的最小与最大计算资源
- 限制namespace中每个Pod或容器计算资源request、limit之间的比例
- 限制namespace中每个存储卷声明（PersistentVolumeClaim）可使用的最小与最大存储空间
- 设置namespace中容器默认计算资源的request、limit，并在运行时自动注入到容器中
- 设置namespace中每个Pod的资源配额和限制范围的默认值



`case3-LimitRange.yaml`

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: limitrange-xinn
  namespace: xinn
spec:
  limits:
  - type: Container       #限制的资源类型
    max:
      cpu: "2"            #限制单个容器的最大CPU
      memory: "2Gi"       #限制单个容器的最大内存
    min:
      cpu: "500m"         #限制单个容器的最小CPU
      memory: "512Mi"     #限制单个容器的最小内存
    default:
      cpu: "500m"         #默认单个容器的CPU限制
      memory: "512Mi"     #默认单个容器的内存限制
    defaultRequest:
      cpu: "500m"         #默认单个容器的CPU创建请求
      memory: "512Mi"     #默认单个容器的内存创建请求
    maxLimitRequestRatio:
      cpu: 2              #限制CPU limit/request比值最大为2 
      memory: 2         #限制内存limit/request比值最大为1.5
  - type: Pod
    max:
      cpu: "4"            #限制单个Pod的最大CPU
      memory: "4Gi"       #限制单个Pod最大内存
  - type: PersistentVolumeClaim
    max:
      storage: 50Gi        #限制PVC最大的requests.storage
    min:
      storage: 30Gi        #限制PVC最小的requests.storage
```

```bash
root@k8s-made-01-32:/yaml/k8s-limit# kubectl apply -f case3-LimitRange.yaml
limitrange/limitrange-xinn created
```







**测试超过LimitRange 限制CPU limit/request比值示例：**

`case4-pod-RequestRatio-limit.yaml`

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    app: xinn-wordpress-deployment-label
  name: xinn-wordpress-deployment
  namespace: xinn
spec:
  replicas: 1
  selector:
    matchLabels:
      app: xinn-wordpress-selector
  template:
    metadata:
      labels:
        app: xinn-wordpress-selector
    spec:
      containers:
      - name: xinn-wordpress-nginx-container
        image: nginx:1.16.1
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "18"
        resources:
          limits:
            cpu: 2
            memory: 3Gi
          requests:
            cpu: 2 #CPU limit/request比值最大为2 这里为1不会报错，如果改为4就会报错
            memory: 1.5Gi
 
      - name: xinn-wordpress-php-container
        image: php:5.6-fpm-alpine
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "18"
        resources:
          limits:
            cpu: 1
            #cpu: 2
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
 
 
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: xinn-wordpress-service-label
  name: xinn-wordpress-service
  namespace: xinn
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 8080
    nodePort: 30063
  selector:
    app: xinn-wordpress-selector
```



发现没起来

```bash
root@k8s-made-01-32:/yaml/k8s-limit# kubectl get deployments.apps -n xinn xinn-wordpress-deployment
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
xinn-wordpress-deployment   0/1     0            0           68s
```





查看报错 "is forbidden: maximum memory usage per Container is 2Gi, but limit is 3Gi"

```bash
root@k8s-made-01-32:/yaml/k8s-limit# kubectl get deployments.apps -n xinn xinn-wordpress-deployment -o json

                "message": "pods \"xinn-wordpress-deployment-55c9c75f5c-z25m8\" is forbidden: maximum memory usage per Container is 2Gi, but limit is 3Gi",
                "reason": "FailedCreate",
                "status": "True",
                "type": "ReplicaFailure"
            }
        ],

```



修改内存限制

```yaml
      app: xinn-wordpress-selector
  template:
    metadata:
      labels:
        app: xinn-wordpress-selector
    spec:
      containers:
      - name: xinn-wordpress-nginx-container
        image: nginx:1.16.1
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "18"
        resources:
          limits:
            cpu: 2 #原来是3改为2
            memory: 2Gi
          requests:
            cpu: 2 #CPU limit/request比值最大为2 这里为1会报错
            memory: 1.5Gi
```





Pod可以创建了

```bash
root@k8s-made-01-32:/yaml/k8s-limit# kubectl get pod -n xinn
NAME                                         READY   STATUS    RESTARTS   AGE
xinn-web1-deployment-6b696577df-j7gbf        1/1     Running   0          24d
xinn-web1-deployment-6b696577df-ttwg8        1/1     Running   0          24d
xinn-web1-deployment-6b696577df-whmq8        1/1     Running   0          24d
xinn-wordpress-deployment-54675cb4cf-s77dw   2/2     Running   0          77s
```







**测试超过LimitRange 限制CPU核数示例：**

`case5-pod-cpu-limit.yaml`

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    app: xinn-wordpress-deployment-label
  name: xinn-wordpress-deployment
  namespace: xinn
spec:
  replicas: 1
  selector:
    matchLabels:
      app: xinn-wordpress-selector
  template:
    metadata:
      labels:
        app: xinn-wordpress-selector
    spec:
      containers:
      - name: xinn-wordpress-nginx-container
        image: nginx:1.16.1
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "18"
        resources:
          limits:
            cpu: 1
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
 
      - name: xinn-wordpress-php-container
        image: php:5.6-fpm-alpine
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "18"
        resources:
          limits:
            #cpu: 2.8 最大数量为2000豪核
            cpu: 2
            memory: 1Gi
          requests:
            cpu: 1.5
            memory: 512Mi
 
 
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: xinn-wordpress-service-label
  name: xinn-wordpress-service
  namespace: xinn
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 8080
    nodePort: 30033
  selector:
    app: xinn-wordpress-selector
```



```bash
root@k8s-made-01-32:/yaml/k8s-limit# kubectl get deployments.apps -n xinn xinn-wordpress-deployment -o json
"message": "pods \"xinn-wordpress-deployment-66b4db784d-8j4dm\" is forbidden: maximum cpu usage per Container is 2, but limit is 2800m",
                "reason": "FailedCreate",
                "status": "True",
                "type": "ReplicaFailure"

```



## 4.kubernetes对整个namespace的CPU及memory实现资源限制

使用 **resource-quotas** 对整个namespace的CPU及memory实现资源限制

官方资料https://kubernetes.io/zh/docs/concepts/policy/resource-quotas/

- 限定某个对象类型（如Pod、service）可创建对象的总数；
- 限定某个对象类型可消耗的计算资源（CPU、内存）与存储资源（存储卷声明）总数

**对整个namespace的CPU及memory实现资源限制示例：**

`case6-ResourceQuota-xinn.yaml`



```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota-xinn
  namespace: xinn
spec:
  hard:
    requests.cpu: "46"
    limits.cpu: "46"
    requests.memory: 120Gi
    limits.memory: 120Gi
    requests.nvidia.com/gpu: 4
    pods: "20"
    services: "20"
```



- `requests.cpu: "46"` 和 `limits.cpu: "46"`：指定了 CPU 资源的请求和限制，分别为 46 个 CPU 核心。这意味着在该命名空间中的所有 Pods 的 CPU 请求和限制总和不得超过 46 个 CPU 核心。
- `requests.memory: 120Gi` 和 `limits.memory: 120Gi`：指定了内存资源的请求和限制，分别为 120GB。这表示在该命名空间中的所有 Pods 的内存请求和限制总和不得超过 120GB。
- `requests.nvidia.com/gpu: 4`：限制了命名空间中使用的 NVIDIA GPU 数量为 4 个。这确保在该命名空间中最多只能使用 4 个 NVIDIA GPU。
- `pods: "20"`：限制了在该命名空间中可以创建的 Pods 的数量为 20 个。
- `services: "20"`：限制了在该命名空间中可以创建的 Services 的数量为 20 个。



**测试pod数量限制**

`case7-namespace-pod-limit-test.yaml`

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    app: xinn-nginx-deployment-label
  name: xinn-nginx-deployment
  namespace: xinn
spec:
  replicas: 25
  selector:
    matchLabels:
      app: xinn-nginx-selector
  template:
    metadata:
      labels:
        app: xinn-nginx-selector
    spec:
      containers:
      - name: xinn-nginx-container
        image: nginx:1.16.1
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "18"
        resources:
          limits:
            cpu: 1
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
 
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: xinn-nginx-service-label
  name: xinn-nginx-service
  namespace: xinn
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 30033
  selector:
    app: xinn-nginx-selector
```





