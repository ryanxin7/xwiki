---
author: Ryan
title: 12.ingress多域名HTTPS实现案例
date: 2023-02-15
---

---
Author: Ryan
title: 12.
tag: 
    - k8s进阶训练营
category: 
   - k8s
date: 2022-6-12 12:12:22
lastUpdated: true
#sidebar: false
breadcrumb: false
#contributors: false
---


## Ingress和Ingress控制器介绍

在k8s中将一个服务暴露出去通常会使用NodePort或LoadBalancer类型的Service，但随着服务数量的增多，使用NodePort会存在一些问题，可用作NodePort的端口是一个有限的范围，不容易记忆，不好管理。另外， 如果在公有云使用LoadBalancer类型的Service上会产生额外的成本。

所以k8s提供了另一种方式，使用Ingress和Ingress控制器来对外暴露服务，Ingress控制器作为统一的流量入口，管理内部各种必要的服务，并通过Ingress资源来描述如何区分流量及内部的路由逻辑。有了Ingress和Ingress控制器，就可以通过定义路由流量的规则来实现服务发布，而无需创建NodePort或LoadBalancer类型的Service，并且流量也会由Ingress控制器直达Pod，不需要再由Service转发。

:::info
 Ingress资源就是基于HTTP虚拟主机或URL路径的流量转发规则（类似于nginx中的虚拟主机定义或location转发规则定义），它把需要暴露给集群外的每个Service对象，映射为Ingress控制器上的一个虚拟主机或某虚拟主机的一个URL路径。
:::





如下图所示：  

![](http://img.xinn.cc/1675821066302-e7f2e7a2-7032-4d52-b186-470babac7d1b.png)


Ingress官方文档：[https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress/](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress/)Ingress控制器官方文档：[https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress-controllers/](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress-controllers/)



### Ingress控制器
但Ingress资源本身只是一组路由规则定义，这些规则想要真正的生效还需要借助其它功能的辅助，例如监听某套接字、根据路由规则匹配机制将客户端请求进行转发等。实现这些功能的组件就是Ingress控制器(Ingress Controller)。Ingress Controller是Kubernetes的一个附件需要单独部署。





## Ingress Controller部署

目前可选择使用的Ingress控制器有很多，可以参考官方介绍：[https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress-controllers/](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress-controllers/) ，下面以nginx Ingress控制器为例进行部署。

nginx Ingress控制器github地址：[https://github.com/kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx)nginx Ingress控制器官方文档：[https://kubernetes.github.io/ingress-nginx/](https://kubernetes.github.io/ingress-nginx/)







**常用的的Ingress控制器部署方式有两种：  ** 



### 1. 以Deployment方式部署Ingress控制器Pod资源  
通过NodePort或LoadBalancer类型的Service或者通过拥有外部IP地址（externalIP）的Service对象为其接入集群外部的客户端请求流量。这意味着，在生产环境以这种方式部署一个Ingress控制器时，必须在其前端定义一个负载均衡器，这个负载均衡器可以是LoadBalancer类型的Service，也可以是用户自行管理的负载均衡器。


![](http://img.xinn.cc/1675822367503-e4adce9e-bfca-4bb3-9b2f-549eac4f60ed.png)







### 2.以DaemonSet方式部署Ingress控制器
Pod资源Ingress控制器的各Pod分别以单一实例的方式运行在集群的所有节点或部分专用节点之上，并配置这些Pod对象以hostPort或hostNetwork的方式在当前节点接入外部流量。在这种方式下，前端还是需要一个负载均衡器，作为客户端流量的统一入口，然后转发给Ingress控制器Pod

![](http://img.xinn.cc/1675822438502-f95a9c45-e281-47e8-b65f-fce5abecd40a.png)



 在nginx Ingress控制器官方提供的部署文件中，默认使用第一种方式，使用Deployment+NodePort Service来部署。  


### 3. Deployment方式部署

 选定好版本，下载对应的部署文件 

![](http://img.xinn.cc/1675833096495-64fbd3a8-e6ab-4eeb-9c19-063d0909ac07.png)



```bash
wget https://github.com/kubernetes/ingress-nginx/archive/refs/tag/controller-v1.3.1.tar.gz
tar xvf controller-v1.3.1.tar.gz
cd ingress-nginx-controller-v1.3.1/deploy/static/provider/baremetal/
#修改当前目录下的deploy.yaml，将镜像修改未国内镜像源
cat deploy.yaml |grep image
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-ingress-controller:v1.3.1
        imagePullPolicy: IfNotPresent
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/kube-webhook-certgen:v1.3.0
        imagePullPolicy: IfNotPresent
        image: registry.cn-hangzhou.aliyuncs.com/google_containers/kube-webhook-certgen:v1.3.0
        imagePullPolicy: IfNotPresent
```

修改nodeport地址
```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/version: 1.3.1
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - appProtocol: http
    name: http
    port: 80
    protocol: TCP
    targetPort: http
    nodePort: 30020
  - appProtocol: https
    name: https
    port: 443
    protocol: TCP
    targetPort: https
    nodePort: 30021
```

安装
```bash
kubectl apply -f deploy.yaml
amespace/ingress-nginx created
serviceaccount/ingress-nginx created
serviceaccount/ingress-nginx-admission created
role.rbac.authorization.k8s.io/ingress-nginx created
role.rbac.authorization.k8s.io/ingress-nginx-admission created
clusterrole.rbac.authorization.k8s.io/ingress-nginx created
clusterrole.rbac.authorization.k8s.io/ingress-nginx-admission created
rolebinding.rbac.authorization.k8s.io/ingress-nginx created
rolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx created
clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
configmap/ingress-nginx-controller created
service/ingress-nginx-controller created
service/ingress-nginx-controller-admission created
deployment.apps/ingress-nginx-controller created
job.batch/ingress-nginx-admission-create created
job.batch/ingress-nginx-admission-patch created
ingressclass.networking.k8s.io/nginx created
validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission created
```

查看状态
```bash
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-cnccm        0/1     Completed   0          21s
ingress-nginx-admission-patch-j4l68         0/1     Completed   0          21s
ingress-nginx-controller-79658555f4-r2pz5   0/1     Running     0          21s
```

```yaml
root@master01[14:23:04]~ #:kubectl get service -n ingress-nginx
NAME                                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.10.79.136    <none>        80:30020/TCP,443:30021/TCP   74m
ingress-nginx-controller-admission   ClusterIP   10.10.133.115   <none>        443/TCP                      74m
```



 默认情况下，ingress-nginx-controller只有一个副本，可以按需调整  
```yaml
root@master01[14:54:09]~ #:kubectl scale -n ingress-nginx deployment ingress-nginx-controller --replicas=3

root@master01[14:54:09]~ #:kubectl get pod -n ingress-nginx 
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-cnccm        0/1     Completed   0          105m
ingress-nginx-admission-patch-j4l68         0/1     Completed   0          105m
ingress-nginx-controller-79658555f4-gd2zj   1/1     Running     0          22s
ingress-nginx-controller-79658555f4-r2pz5   1/1     Running     0          105m
ingress-nginx-controller-79658555f4-r6l8s   0/1     Running     0          22s
```


```bash
kubectl scale -n ingress-nginx deployment ingress-nginx-controller --replicas=3

root@master01[15:44:40]~ #:kubectl get pod -n ingress-nginx
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-cnccm        0/1     Completed   0          6d2h
ingress-nginx-admission-patch-j4l68         0/1     Completed   0          6d2h
ingress-nginx-controller-79658555f4-gd2zj   1/1     Running     0          6d
ingress-nginx-controller-79658555f4-r2pz5   1/1     Running     0          6d2h
ingress-nginx-controller-79658555f4-r6l8s   1/1     Running     0          6d
```


 在负载均衡器中添加ingress-nginx-controller后端，以haproxy为例  

```bash
cat /etc/haproxy/harpoxy.cfg
#################################
listen ingress-nginx-controller-80
       bind 10.1.0.6:80
       option  tcplog
       mode tcp
       balance source
       server ingress-controller-server1 10.1.0.31:30020 check inter 2000 fall 3 rise 5
       server ingress-controller-server2 10.1.0.32:30020 check inter 2000 fall 3 rise 5

listen ingress-nginx-controller-443
       bind 10.1.0.6:443
       option  tcplog
       mode tcp
       balance source
       server ingress-controller-server1 10.1.0.31:30021 check inter 2000 fall 3 rise 5
       server ingress-controller-server2 10.1.0.32:30021 check inter 2000 fall 3 rise 5
```

![](http://img.xinn.cc/1676361150547-2ea0c07b-1974-4351-9488-f601238b0a2c.png)



### 4.DaemonSet方式部署
 对前面的**deploy.yaml**进行修改，主要修改3个配置  

1. 删除掉ingress-ingress-controller Service资源定义 
2. 将Deployment修改未DaemonSet
3. 配置Pod使用**hostNetwork**和**hostPID**

```bash
apiVersion: apps/v1
kind: DaemonSet		#类型修改为DaemonSet
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/version: 1.3.1
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  minReadySeconds: 0
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app.kubernetes.io/component: controller
      app.kubernetes.io/instance: ingress-nginx
      app.kubernetes.io/name: ingress-nginx
  template:
    metadata:
      labels:
        app.kubernetes.io/component: controller
        app.kubernetes.io/instance: ingress-nginx
        app.kubernetes.io/name: ingress-nginx
    spec:
      hostPID: true		#Pod使用主机PID名称空间
      hostNetwork: true	#Pod使用主机网络
      containers:

```
 同样的，也需要在负载均衡器中添加ingress-nginx-controller后端，以haproxy为例  
```bash
cat /etc/haproxy/harpoxy.cfg
#################################
listen ingress-nginx-controller-80
       bind 10.1.0.6:80
       option  tcplog
       mode tcp
       balance source
       server ingress-controller-server1 10.1.0.31:30020 check inter 2000 fall 3 rise 5
       server ingress-controller-server2 10.1.0.32:30020 check inter 2000 fall 3 rise 5

listen ingress-nginx-controller-443
       bind 10.1.0.6:443
       option  tcplog
       mode tcp
       balance source
       server ingress-controller-server1 10.1.0.31:30021 check inter 2000 fall 3 rise 5
       server ingress-controller-server2 10.1.0.32:30021 check inter 2000 fall 3 rise 5
```


## 3.Ingress示例

### 3.1 Ingress资源规范
 Ingress资源的可用字段和含义如下：  
```bash
apiVersion: networkking.k8s.io/v1
kind: Ingress
metadata:
  name: ...
  namespace: ...
  annotations: 	#资源注解
    kubernetes.io/ingress.class: <string>	#指明此Ingress资源由哪个Ingress控制器来解析，目前也可以使用spec.ingressClassName字段代替
spec:
  rules:	#Ingress路由规则列表
  - host: <string>	#虚拟主机的域名，支持*前缀匹配，但不支持IP，不支持端口
    http:
      paths:	#虚拟主机的PATH路径列表，由path和backend组成
      - path: <string>	#流量匹配的HTTP URL路径，必须以/开头
        pathType: <string>	#URL路径匹配方式，支持Exact(精准匹配)、Prefix(前缀匹配)和ImplementationSpecific，详细介绍可以参考官网文档
        backend:	#匹配到的流量要转发到的后端定义
          service:	#后端关联的Service对象定义
            name: <string>	#Service对象名称
            port:	#Service对象端口
              number: <int>		#端口号
              name: <string>	#端口名称
  tls:	#tls配置，用于指定上边rules字段下哪些host需要使用https
  - hosts: <[]string>	#使用同一组证书的主机名称列表
    secretName: <string>	#保存证书的Secret资源名称
  defaultBackend: <Object>	#默认后端定义，可嵌套使用字段与上面的backend字段相同
  ingressClassName: <string>	#ingressClass资源名称，作用类似于上面的注解信息，用于指定适配的Ingress控制器
```


### 3.2 单域名访问示例

 先创建一下资源，用于测试Ingress功能，部署文件如下，包含两个tomcat-pod和两个对应的Svc  
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tomcat-app1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tomcat-app1
  template:
    metadata:
      labels:
        app: tomcat-app1
    spec:
      containers:
      - name: tomcat
        image: harbor.ceamg.com/xinweb11/tomcat-app1:1.9
        ports:
        - name: http
          containerPort: 8080

---
apiVersion: v1
kind: Service
metadata:
  name: tomcat-app1-svc
spec:
  selector:
    app: tomcat-app1
  ports:
  - name: http
    port: 8080
    targetPort: 8080
    protocol: TCP

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tomcat-app2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tomcat-app2
  template:
    metadata:
      labels:
        app: tomcat-app2
    spec:
      containers:
      - name: tomcat
        image: harbor.ceamg.com/xinweb11/tomcat-app1:1.9
        ports:
        - name: http
          containerPort: 8080

---
apiVersion: v1
kind: Service
metadata:
  name: tomcat-app2-svc
spec:
  selector:
    app: tomcat-app2
  ports:
  - name: http
    port: 8080
    targetPort: 8080
    protocol: TCP

```

 pod创建成功后 到里面创建一个测试页面  
```yaml
--------------------------------tomcat-app1---------------------------------------------------
root@tomcat-app1-6fd79cfbd4-8tg64:/data/tomcat/webapps/myapp1# echo "tomcat app1 ingress" > index.jsp
root@tomcat-app1-6fd79cfbd4-8tg64:/data/tomcat/webapps/myapp1# ls
index.jsp


root@master01[17:13:13]~/ingress-test #:curl 10.10.103.87:8080/myapp1/
tomcat app1 ingress

--------------------------------tomcat-app2---------------------------------------------------

root@tomcat-app2-54b548dfbf-zsgpd:/apps/tomcat/bin# mkdir /data/tomcat/webapps/myapp2 
root@tomcat-app2-54b548dfbf-zsgpd:/apps/tomcat/bin# echo "tomcat app2 ingress" > /data/tomcat/webapps/myapp2/index.jsp

root@tomcat-app2-54b548dfbf-zsgpd:/apps/tomcat/bin# ./catalina.sh stop
root@tomcat-app2-54b548dfbf-zsgpd:/apps/tomcat/bin# ./catalina.sh start

root@master01[17:19:14]~/ingress-test #:curl 10.10.219.108:8080/myapp2/
tomcat app2 ingress
```


#### 3.2.1 单域名 ingress 资源
 将访问www.app1.com 域名的流量转发至tomcat-app1-svc，Ingress部署文件如下：  
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-tomcat-app1
  annotations:
    kubernetes.io/ingress.class: "nginx"   #指定由哪个Ingress Controller解析
    nginx.ingress.kubernetes.io/use-regex: "true" ##指定后面rules定义的path可以使用正则表达式
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600" ##连接超时时间,默认为5s
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600" ##后端服务器回转数据超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600" ##后端服务器响应超时时间,默认为60s
    nginx.ingress.kubernetes.io/proxy-body-size: "50m" ##客户端上传文件，最大大小，默认为20m
    #nginx.ingress.kubernetes.io/rewrite-target: / ##URL重写
    nginx.ingress.kubernetes.io/app-root: /index.html
spec:
  rules:
  - host: www.app1.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tomcat-app1-svc
            port:
              number: 8080
```



#### 3.2.2 多域名 ingress 资源

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-tomcat-app
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    #nginx.ingress.kubernetes.io/rewrite-target: /
    #nginx.ingress.kubernetes.io/app-root: /index.html
spec:
  rules:
  - host: www.myapp1.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tomcat-app1-svc
            port:
              number: 8080
  - host: www.myapp2.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tomcat-app2-svc
            port:
              number: 8080
```

```yaml
root@master01[17:24:26]~/ingress-test #:kubectl apply -f tomcat-app-ingress1-ingress.yaml 
ingress.networking.k8s.io/ingress-tomcat-app1 created

root@master01[17:24:34]~/ingress-test #:kubectl get ingress 
NAME                 CLASS    HOSTS                           ADDRESS               PORTS   AGE
ingress-tomcat-app   <none>   www.myapp1.com,www.myapp2.com   10.1.0.32,10.1.0.33   80      4m34s
```


#### 3.2.3 配置Haproxy+ keepalived 实现负载均衡
```bash
apt install keepalived haproxy -y
```

keepalived 配置文件如下：
```bash
##################################Master##################################
global_defs {
   notification_email {
     123123@qq.com
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id harbor-lvs1
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    garp_master_delay 10
    smtp_alert
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.1.0.100
        10.1.0.101
        10.1.0.102
        10.1.0.103
        10.1.0.104

    }
}

##################################BACKUP##################################
global_defs {
   notification_email {
     123123@qq.com
   }
   notification_email_from Alexandre.Cassen@firewall.loc
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id lvs2
}

vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    garp_master_delay 10
    smtp_alert
    virtual_router_id 51
    priority 99
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.1.0.100
        10.1.0.101
        10.1.0.102
        10.1.0.103
        10.1.0.104

    }
}
```

Haproxy 配置使用VIP代理 **ingress controler service** Haproxy配置如下： 两个节点一样  
```bash
listen k8s-xin-ingress-80
  bind 10.1.0.100:80
  mode tcp
  server k8s1 10.1.0.32:30020 check inter 3s fall 3 rise 5
  server k8s2 10.1.0.33:30020 check inter 3s fall 3 rise 5

listen k8s-xin-ingress-443
  bind 10.1.0.100:443
  mode tcp
  server k8s1 10.1.0.32:30021 check inter 3s fall 3 rise 5
  server k8s2 10.1.0.33:30021 check inter 3s fall 3 rise 5
```



![](http://img.xinn.cc/1676441359881-2d49ba70-9af5-4d2a-b4c4-e5bba389aa3c.png)![](http://img.xinn.cc/1676441343917-040c8c97-7dc3-4f51-ac74-3671a2f8651d.png)



### 3.3 Ingress 配置TLS


#### 3.3.1 创建证书
 首先准备www.myapp1.com 域名的证书，然后将证书保存为Secret  

```bash
mkdir ingress-cert && cd ingress-cert
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 100 \
 -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=www.myapp1.com" \
 -key ca.key \
 -out ca.crt
openssl genrsa -out www.myapp1.com.key 4096
openssl req -sha512 -new \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=www.myapp1.com" \
    -key www.myapp1.com.key \
    -out www.myapp1.com.csr
openssl x509 -req -sha512 -days 3650 \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -in www.myapp1.com.csr \
    -out www.myapp1.com.crt
rm -f www.myapp1.com.csr
kubectl create secret tls cert-www.myapp1.com --cert ./www.myapp1.com.crt --key ./www.myapp1.com.key

```


查看Secret
```bash
root@master01[14:41:14]~/ingress-cert #:kubectl describe secrets cert-www.myapp1.com 
Name:         cert-www.myapp1.com
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  kubernetes.io/tls

Data
====
tls.crt:  1931 bytes
tls.key:  3243 bytes
```


####  3.3.2 Ingress使用TLS证书示例
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-tls-url
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    #nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/app-root: /index.html
spec:
  rules:
  - host: www.myapp1.com
    http:
      paths:
      - path: /tls1
        pathType: Prefix
        backend:
          service:
            name: tomcat-app1-svc
            port:
              number: 8080
      - path: /tls2
        pathType: Prefix
        backend:
          service:
            name: tomcat-app2-svc
            port:
              number: 8080
  tls:	#如果多个域名都使用https，再添加一个列表项即可
  - hosts: ["www.myapp1.com"]		#如果多个域名使用相同的证书，在这里的列表添加一个域名即可
    secretName: cert-www.myapp1.com
```



#### 3.3.3 pod 中创建用于测试的目录和页面
```yaml

mkdir /data/tomcat/webapps/tls1
echo "www.myapp1.com/tls1/index.html" > /data/tomcat/webapps/tls1/index.html


mkdir /data/tomcat/webapps/tls2
echo "www.myapp1.com/tls2/index.html" > /data/tomcat/webapps/tls2/index.html
```



#### 3.3.4 访问测试
![](http://img.xinn.cc/1676444292477-d1741e62-31dd-4c06-8e05-ff85d8fb18e2.png)![](http://img.xinn.cc/1676444442373-03d6e130-fea0-4e91-8f83-7121b860019d.png)


### 3.4 证书更新
 假设网站的https证书即将过期，在不影响业务的前提下，可以直接更新其引用的Secret中保存的证书来实现网站https证书更新。在生产环境需要提前做好计划，并选择合适时间执行。  

 首先重新签发一套证书  
```bash
openssl genrsa -out www.myapp1.com-new.key 4096
openssl req -sha512 -new \
-subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=Personal/CN=www.linux.io" \
-key www.myapp1.com-new.key \
-out www.myapp1.com-new.csr
openssl x509 -req -sha512 -days 100 \
-CA ca.crt -CAkey ca.key -CAcreateserial \
-in www.myapp1.com-new.csr \
-out www.myapp1.com-new.crt
rm -f www.myapp1.com-new.csr

```

 将证书和key的内容进行base64编码，然后编辑相应的Secret对象，修改tls.key和tls.crt的值为编码后的内容  

```bash
root@master-01:~/resources/ingress-cert# base64 www.myapp1.com-new.key -w 0
LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS.............ZLS0tLS0K
root@master-01:~/resources/ingress-cert# base64 www.myapp1.com-new.crt -w 0
LS0tLS1CRUdJTiBDRVJ..............FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
root@master-01:~# kubectl edit secret/cert-www.myapp1.com
```
![](http://img.xinn.cc/1676445008460-e809acd8-60e2-4ef6-ac23-1faa36ddf2cc.png)

 和之前的访问结果进行对比，可以看到证书已经被更新  
