---
title: "Kubernetes中的Hosts解析问题"
description: "在不修改CoreDNS的情况下，在Pod中增加本地解析"
date: "2022-10-04"
authors: [Ryan]
tags: [Kubernetes, CoreDNS]
---

在不修改CoreDNS的情况下，直接在Pod中增加本地解析也是可以实现的，但这种方法有局限性，只适用于特定Pod，而且每次Pod重启或重新创建时需要重新配置。



### 方法1：通过hostAliases设置Pod的/etc/hosts


你可以在Pod的spec中使用`hostAliases`来增加本地解析。这样，当Pod启动时，会自动将指定的主机名和IP地址添加到Pod的`/etc/hosts`文件中。

<!-- truncate -->

下面是一个示例Pod配置：



```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mycontainer
    image: busybox
    command: ["sh", "-c", "sleep 3600"]
  hostAliases:
  - ip: "192.168.1.1"
    hostnames:
    - "internal.example.com"
```



### 方法2：通过Init Container设置Pod的/etc/hosts


如果需要更多的自定义，你可以使用Init Container来修改Pod的`/etc/hosts`文件：



```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  initContainers:
  - name: init-myservice
    image: busybox
    command: ['sh', '-c', 'echo "192.168.1.1 internal.example.com" >> /etc/hosts']
    volumeMounts:
    - name: etc-hosts
      mountPath: /etc/hosts
  containers:
  - name: mycontainer
    image: busybox
    command: ["sh", "-c", "sleep 3600"]
    volumeMounts:
    - name: etc-hosts
      mountPath: /etc/hosts
  volumes:
  - name: etc-hosts
    hostPath:
      path: /etc/hosts
```



在上述配置中，Init Container会在Pod启动时将`internal.example.com`解析到`192.168.1.1`添加到Pod的`/etc/hosts`文件中。



### 方法3：使用自定义DNS配置


你还可以通过设置Pod的DNS配置来实现，但这需要Kubernetes 1.14及以上的版本。你可以在Pod的spec中指定自定义的DNS配置：



```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  dnsPolicy: "None"
  dnsConfig:
    nameservers:
      - 8.8.8.8
    searches:
      - mynamespace.svc.cluster.local
    options:
      - name: ndots
        value: "2"
  containers:
  - name: mycontainer
    image: busybox
    command: ["sh", "-c", "sleep 3600"]
```



### 总结


上述方法可以在不修改CoreDNS配置的情况下实现Pod的本地解析：



1. **hostAliases**：适用于简单场景，直接在Pod spec中定义。
2. **Init Container**：适用于需要更多控制和灵活性的场景，通过Init Container在Pod启动时修改`/etc/hosts`文件。
3. **自定义DNS配置**：适用于需要更改DNS解析设置的场景，但不能直接解决添加静态主机名的问题。



这些方法各有优缺点，选择哪种方法取决于你的具体需求和使用场景。

