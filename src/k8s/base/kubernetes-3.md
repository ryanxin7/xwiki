---
author: Ryan
title: 3.yaml文件语法基础
date: 2023-01-12
---


## 1. yaml格式
```bash
人员名单:
  张三:
    年龄: 18 #
    职业: Linux运维工程师
    爱好:
      - 看书
      - 学习
      - 加班
     
  李四:
    年龄: 20
    职业: Java开发工程师 # 这是职业
    爱好:
      - 开源技术
      - 微服务
      - 分布式存储


大小写敏感
使用缩进表示层级关系
 缩进时不允许使用Tal键，只允许使用空格
 缩进的空格数目不重要，只要相同层级的元素左侧对齐即可
 使用”#” 表示注释，从这个字符一直到行尾，都会被解析器忽略
 比json更适用于配置文件
```


###  yaml文件主要特性
k8s中的yaml文件以及其他场景的yaml文件， 大部分都是以下类型：
```bash
上下级关系列表
键值对(也称为maps， 即key：value格式的键值对数据)
```

容器在运行时是基于宿主机的内核的namespace隔离环境 pid ，如果只有环境没有服务就退出了


## 2.yaml与json对比
在线yaml与json编辑器：[http://www.bejson.com/validators/yaml_editor/](http://www.bejson.com/validators/yaml_editor/)<br />**json格式**
```yaml
{ '人员名单': 
	{ '张三': { '年龄': 18, '职业': 'Linux运维工程师', '爱好': [ '看书', '学习', '加班' ] },
	  '李四': { '年龄': 20, '职业': 'Java开发工程师', '爱好': [ '开源技术', '微服务', '分布式存 储' ] } } 
}
```


### json特点
<br />json 不能注释<br />json 可读性较差<br />json 语法很严格<br />比较适用于API 返回值，也可用于配置文件


## 3. 实践-4创建namespace yaml文件
```yaml
#cat namespaces.yaml 
apiVersion：v1 #API版本
kind：Namespace #类型为namespac 
metadata： #定义元数据
  name：xin-k8s #namespace名称
--------------------------------------
root@master02:~# mkdir /xin-yaml
root@master02:~# cd /xin-yaml/
root@master02:/xin-yaml# vim namespaces.yaml
root@master02:/xin-yaml# kubectl apply -f namespaces.yaml 
namespace/xin-k8s created
root@master02:/xin-yaml# 
root@master02:/xin-yaml# kubectl get ns 
NAME                   STATUS   AGE
default                Active   2d20h
kube-node-lease        Active   2d20h
kube-public            Active   2d20h
kube-system            Active   2d20h
kubernetes-dashboard   Active   42h
xin-k8s                Active   7s
```





## 4.nginx yaml文件详解
<br />

可以使用kubectl explain deployment 查看版本信息
```bash
root@master02:/xin-yaml# kubectl explain deploy
KIND:     Deployment
VERSION:  apps/v1

DESCRIPTION:
     Deployment enables declarative updates for Pods and ReplicaSets.
```
```yaml
# cat nginx.yaml 
kind: Deployment  #类型，是deployment控制器，kubectl explain  Deployment
apiVersion: extensions/v1  #API版本，# kubectl explain  Deployment.apiVersion
metadata: #pod的元数据信息，kubectl explain  Deployment.metadata
  labels: #自定义pod的标签，# kubectl explain  Deployment.metadata.labels
    app: xin01-nginx-deployment-label #标签名称为app值为linux36-nginx-deployment-label，后面会用到此标签 
  name: xin01-nginx-deployment #pod的名称
  namespace: xin-01 #pod的namespace，默认是defaule
spec: #定义deployment中容器的详细信息，kubectl explain  Deployment.spec
  replicas: 3 #创建出的pod的副本数，即多少个pod，默认值为1
  selector: #定义标签选择器
    matchLabels: #定义匹配的标签，必须要设置
      app: xin01-nginx-deployment-label #匹配的目标标签，
  template: #定义模板，必须定义，模板是起到描述要创建的pod的作用
    metadata: #定义模板元数据
      labels: #定义模板label，Deployment.spec.template.metadata.labels
        app: xin01-nginx-deployment-label #定义标签，等于Deployment.spec.selector.matchLabels
    spec: #定义pod信息
      containers: #定义pod中容器列表，可以多个至少一个，pod不能动态增减容器
      - name: xin-nginx-container #容器名称
        image: nginx:1.20.1 #镜像地址
        #command: ["/apps/tomcat/bin/run_tomcat.sh"] #容器启动执行的命令或脚本
        #imagePullPolicy: IfNotPresent
        imagePullPolicy: Always #拉取镜像策略
        ports: #定义容器端口列表
        - containerPort: 80 #定义一个端口
          protocol: TCP #端口协议
          name: http #端口名称
        - containerPort: 443 #定义一个端口
          protocol: TCP #端口协议
          name: https #端口名称
        env: #配置环境变量
        - name: "password" #变量名称。必须要用引号引起来
          value: "123456" #当前变量的值
        - name: "age" #另一个变量名称
          value: "18" #另一个变量的值
        resources: #对资源的请求设置和限制设置
          limits: #资源限制设置，上限
            cpu: 500m  #cpu的限制，单位为core数，可以写0.5或者500m等CPU压缩值
            memory: 1Gi #内存限制，单位可以为Mib/Gib，将用于docker run --memory参数
          requests: #资源请求的设置
            cpu: 200m #cpu请求数，容器启动的初始可用数量,可以写0.5或者500m等CPU压缩值
            memory: 512Mi #内存请求大小，容器启动的初始可用数量，用于调度pod时候使用
    
          
---
kind: Service #类型为service
apiVersion: v1 #service API版本， service.apiVersion
metadata: #定义service元数据，service.metadata
  labels: #自定义标签，service.metadata.labels
    app: xin01-nginx #定义service标签的内容
  name: xin01-nginx-spec #定义service的名称，此名称会被DNS解析
  namespace: xin-01 #该service隶属于的namespaces名称，即把service创建到哪个namespace里面
spec: #定义service的详细信息，service.spec
  type: NodePort #service的类型，定义服务的访问方式，默认为ClusterIP， service.spec.type
  ports: #定义访问端口， service.spec.ports
  - name: http #定义一个端口名称
    port: 80 #service 80端口
    protocol: TCP #协议类型
    targetPort: 80 #目标pod的端口
    nodePort: 30001 #node节点暴露的端口
  - name: https #SSL 端口
    port: 443 #service 443端口
    protocol: TCP #端口协议
    targetPort: 443 #目标pod端口
    nodePort: 30043 #node节点暴露的SSL端口
  selector: #service的标签选择器，定义要访问的目标pod
    app: xin01-nginx-deployment-label #将流量路到选择的pod上，须等于Deployment.spec.selector.matchLabels
```



## 5.pod 资源清单详细解读

```yaml

apiVersion: v1 #版本号，例如 v1
kind: Pod #资源类型，如 Pod
metadata: #元数据
 name: string # Pod 名字
 namespace: string # Pod 所属的命名空间
 labels: #自定义标签
 - name: string #自定义标签名字
 annotations: #自定义注释列表
 - name: string
spec: # Pod 中容器的详细定义
 containers: # Pod 中容器列表
 - name: string #容器名称
 image: string #容器的镜像名称
 imagePullPolicy: [Always | Never | IfNotPresent] #获取镜像的策略 Alawys 表示下载镜像 IfnotPresent 表示优先使用本地镜像，否则下载镜像，Nerver 表示仅使用本地镜像
 command: [string] #容器的启动命令列表，如不指定，使用打包时使用的启动命令
 args: [string] #容器的启动命令参数列表
 workingDir: string #容器的工作目录
 volumeMounts: #挂载到容器内部的存储卷配置
 - name: string #引用 pod 定义的共享存储卷的名称，需用 volumes[]部分定义的的卷名
 mountPath: string #存储卷在容器内 mount 的绝对路径，应少于 512 字符
 readOnly: boolean #是否为只读模式
 ports: #需要暴露的端口库号
 - name: string #端口号名称
 containerPort: int #容器需要监听的端口号
 hostPort: int #容器所在主机需要监听的端口号，默认与 Container 相同
 protocol: string #端口协议，支持 TCP 和 UDP，默认 TCP
 env: #容器运行前需设置的环境变量列表
 - name: string #环境变量名称
 value: string #环境变量的值
 resources: #资源限制和请求的设置
 limits: #资源限制的设置
 cpu: string #cpu 的限制，单位为 core 数
 memory: string #内存限制，单位可以为 Mib/Gib
 requests: #资源请求的设置
 cpu: string #cpu 请求，容器启动的初始可用数量
 memory: string #内存请求，容器启动的初始可用内存
 livenessProbe: #对 Pod 内个容器健康检查的设置，当探测无响应几次后将自动重启该容器，检查方法有 exec、httpGet 和 tcpSocket，对一个容器只需设置其中一种方法即可
 exec: #对 Pod 容器内检查方式设置为 exec 方式
 command: [string] #exec 方式需要制定的命令或脚本
 httpGet: #对 Pod 内个容器健康检查方法设置为 HttpGet，需要制定 Path、port
 path: string
 port: number
 host: string
 scheme: string
 HttpHeaders:
 - name: string
 value: string
 tcpSocket: #对 Pod 内个容器健康检查方式设置为 tcpSocket 方式
 port: number
 initialDelaySeconds: 0 #容器启动完成后首次探测的时间，单位为秒
 timeoutSeconds: 0 #对容器健康检查探测等待响应的超时时间，单位秒，默认 1 秒
 periodSeconds: 0 #对容器监控检查的定期探测时间设置，单位秒，默认 10 秒一次
 successThreshold: 0
 failureThreshold: 0
 securityContext:
 privileged:false
 restartPolicy: [Always | Never | OnFailure]#Pod 的重启策略，Always 表示一旦不管以何种方式终止运行，kubelet 都将重启，OnFailure 表示只有 Pod 以非 0 退出码退出才重启，Nerver 表示不再重启该 Pod
 nodeSelector: obeject #设置 NodeSelector 表示将该 Pod 调度到包含这个 label 的 node上，以 key：value 的格式指定
 imagePullSecrets: #Pull 镜像时使用的 secret 名称，以 key：secretkey 格式指定
 - name: string
 hostNetwork:false #是否使用主机网络模式，默认为 false，如果设置为 true，表示使用宿主机网络
 volumes: #在该 pod 上定义共享存储卷列表
 - name: string #共享存储卷名称 （volumes 类型有很多种）
 emptyDir: {} #类型为 emtyDir 的存储卷，与 Pod 同生命周期的一个临时目录。为空值
 hostPath: string #类型为 hostPath 的存储卷，表示挂载 Pod 所在宿主机的目录
 path: string #Pod 所在宿主机的目录，将被用于同期中 mount 的目录
 secret: #类型为 secret 的存储卷，挂载集群与定义的 secre 对象到容器内部
 scretname: string 
 items: 
 - key: string
 path: string
 configMap: #类型为 configMap 的存储卷，挂载预定义的 configMap 对象到容器内部
 name: string
 items:
 - key: string
 path: string


```

```yaml
#test-pod 
apiVersion: v1 #指定api版本，此值必须在kubectl apiversion中   
kind: Pod #指定创建资源的角色/类型   
metadata: #资源的元数据/属性   
  name: test-pod #资源的名字，在同一个namespace中必须唯一   
  labels: #设定资源的标签 
    k8s-app: apache   
    version: v1   
    kubernetes.io/cluster-service: "true"   
  annotations:            #自定义注解列表   
    - name: String        #自定义注解名字   
spec: #specification of the resource content 指定该资源的内容   
  restartPolicy: Always #表明该容器一直运行，默认k8s的策略，在此容器退出后，会立即创建一个相同的容器   
  nodeSelector:     #节点选择，先给主机打标签kubectl label nodes kube-node1 zone=node1   
    zone: node1   
  containers:   
  - name: test-pod #容器的名字   
    image: 10.192.21.18:5000/test/chat:latest #容器使用的镜像地址   
    imagePullPolicy: Never #三个选择Always、Never、IfNotPresent，每次启动时检查和更新（从registery）images的策略， 
                           # Always，每次都检查 
                           # Never，每次都不检查（不管本地是否有） 
                           # IfNotPresent，如果本地有就不检查，如果没有就拉取 
    command: ['sh'] #启动容器的运行命令，将覆盖容器中的Entrypoint,对应Dockefile中的ENTRYPOINT   
    args: ["$(str)"] #启动容器的命令参数，对应Dockerfile中CMD参数   
    env: #指定容器中的环境变量   
    - name: str #变量的名字   
      value: "/etc/run.sh" #变量的值   
    resources: #资源管理 
      requests: #容器运行时，最低资源需求，也就是说最少需要多少资源容器才能正常运行   
        cpu: 0.1 #CPU资源（核数），两种方式，浮点数或者是整数+m，0.1=100m，最少值为0.001核（1m） 
        memory: 32Mi #内存使用量   
      limits: #资源限制   
        cpu: 0.5   
        memory: 1000Mi   
    ports:   
    - containerPort: 80 #容器开发对外的端口 
      name: httpd  #名称 
      protocol: TCP   
    livenessProbe: #pod内容器健康检查的设置 
      httpGet: #通过httpget检查健康，返回200-399之间，则认为容器正常   
        path: / #URI地址   
        port: 80   
        #host: 127.0.0.1 #主机地址   
        scheme: HTTP   
      initialDelaySeconds: 180 #表明第一次检测在容器启动后多长时间后开始   
      timeoutSeconds: 5 #检测的超时时间   
      periodSeconds: 15  #检查间隔时间   
      #也可以用这种方法   
      #exec: 执行命令的方法进行监测，如果其退出码不为0，则认为容器正常   
      #  command:   
      #    - cat   
      #    - /tmp/health   
      #也可以用这种方法   
      #tcpSocket: //通过tcpSocket检查健康    
      #  port: number    
    lifecycle: #生命周期管理   
      postStart: #容器运行之前运行的任务   
        exec:   
          command:   
            - 'sh'   
            - 'yum upgrade -y'   
      preStop:#容器关闭之前运行的任务   
        exec:   
          command: ['service httpd stop']   
    volumeMounts:  #挂载持久存储卷 
    - name: volume #挂载设备的名字，与volumes[*].name 需要对应     
      mountPath: /data #挂载到容器的某个路径下   
      readOnly: True   
  volumes: #定义一组挂载设备   
  - name: volume #定义一个挂载设备的名字   
    #meptyDir: {}   
    hostPath:   
      path: /opt #挂载设备类型为hostPath，路径为宿主机下的/opt,这里设备类型支持很多种 
    #nfs
```
