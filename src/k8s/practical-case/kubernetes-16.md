---
author: Ryan
title: 16.Cert-Manager证书自动续签
date: 2023-02-21
---



## 前言

说到免费的SSL证书，大家首先想到的肯定是Let’s Encrypt，而使用过Let’s Encrypt的同学应该也知道，其有效期只有三个月，三个月后要重新续期。github上也有类似的脚本可以做到自动续期。那如果是在k8s上使用该免费证书，又如何操作的呢？这里cert-manager就派上用场了。



## 什么是cert-manager ?



### 1.简介

cert-manager 是一个云原生证书管理开源项目，它简化了在 Kubernetes 集群中web服务管理Https证书的过程。

支持从多种证书签发机构申请证书，包括 Let's Encrypt、HashiCorp Vault 和 Venafi。

它将证书和证书颁发机构添加为 Kubernetes  资源类型，并且简化获取、更新和使用这些证书，并在证书到期前的尝试续订证书，确保证书有效并及时更新。



在Kubernetes集群中使用 HTTPS 协议，需要一个证书管理器、一个证书自动签发服务，主要通过 Ingress 来发布 HTTPS 服务，因此需要Ingress Controller并进行配置，启用 HTTPS 及其路由。



![](http://img.xinn.cc/high-level-overview.svg)



角色

- **Issuer/ClusterIssuer**: 用于指示 cert-manager 用什么方式签发证书，本文主要讲解签发免费证书的 ACME 方式。ClusterIssuer 与 Issuer 的唯一区别就是 Issuer 只能用来签发自己所在 namespace 下的证书，ClusterIssuer 可以签发任意 namespace 下的证书。
- **Certificate**: 用于告诉 cert-manager 我们想要什么域名的证书以及签发证书所需要的一些配置，包括对 Issuer/ClusterIssuer 的引用。







### 2. 设计理念

Cert-Manager 是将 TLS 证书视为一种资源，就像 Pod、Service 和 Deployment 一样，可以使用 Kubernetes API 进行管理。它使用了自定义资源定义（CRD）机制，通过扩展 Kubernetes API，为证书的生命周期提供了标准化的管理方式。



### 3.架构设计

Cert-Manager 的架构分为两层：控制层和数据层。

- 控制层: 负责证书的管理，包括证书的创建、更新和删除等；

- 数据层: 负责存储证书相关的数据，包括证书的私钥、证书请求、证书颁发机构等。

- Cert-Manager 支持多种证书颁发机构，包括**自签名证书selfSigned**、Let's Encrypt、HashiCorp Vault、Venafi 等。它还支持多种验证方式，包括 HTTP 验证、DNS 验证和 TLS-SNI 验证等。这些验证方式可以帮助确保证书的颁发机构是可信的，并且确保证书的私钥不会泄露。





### 4.签发流程

在 Kubernetes 中，cert-manager 通过以下流程创建资源对象以签发证书：



1. 创建一个 **CertificateRequest** 对象，包含证书的相关信息，例如证书名称、域名等。该对象指定了使用的 **Issuer 或 ClusterIssuer**，以及证书签发完成后，需要存储的 **Secret** 的名称。
2. Issuer 或 ClusterIssuer 会根据证书请求的相关信息，创建一个 Order 对象，表示需要签发一个证书。该对象包含了签发证书所需的域名列表、证书签发机构的名称等信息。
3. 证书签发机构根据 Order 对象中的信息创建一个或多个 **Challenge** 对象，用于验证证书申请者对该域名的控制权。Challenge 对象包含一个 DNS 记录或 HTTP 服务，证明域名的所有权。
4. cert-manager 接收到 Challenge 对象的回应ChallengeResponse后，会将其更新为已解决状态。证书签发机构会检查所有的 Challenge 对象，如果全部通过验证，则会签发证书。
5. 签发证书完成后，证书签发机构会将证书信息写入 Secret 对象，同时将 Order 对象标记为已完成。证书信息现在可以被其他部署对象使用。



```sh
+-------------+
              |             |
              |   Ingress/  |
              | annotations |
              |             |
              +------+------+
                     |
                     | watch ingress change
                     |
                     v
              +-------------+
              |             |
              |   Issuer/   |
              | ClusterIssuer |
              |             |
              +------+------+
                     |
                     | Create CertificateRequest
                     |
                     v
              +------+------+
              |             |
              |CertificateRequest|
              |             |
              +------+------+
                     |
                     | Create Order
                     |
                     v
              +------+------+
              |             |
              |      Order  |
              |             |
              +------+------+
                     |
                     | Create Challenges
                     |
                     v
              +------+------+
              |             |
              |  Challenge  |
              |             |
              +------+------+
                     |
                     | Respond to Challenge
                     |
                     v
              +------+------+
              |             |
              |ChallengeResponse|
              |             |
              +------+------+
                     |
                     | Issue Certificate
                     |
                     v
              +------+------+
              |             |
              |     Secret  |
              |             |
              +------+------+
```







## 一、安装cert-manager

https://cert-manager.io/docs/installation/

```bash
wget https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
```



查看yaml文件中的镜像

```bash
quay.io/jetstack/cert-manager-cainjector:v1.12.0
quay.io/jetstack/cert-manager-webhook:v1.12.0
quay.io/jetstack/cert-manager-controller:v1.12.0
quay.io/jetstack/cert-manager-acmesolver:v1.12.0
```



### 1.替换镜像文件

```bash
sed -i 's#quay.io\/jetstack#harbor.ceamg.com\/baseimages#g' /yaml/cert-manager/cert-manager.yaml
```



### 2.执行yaml文件安装

```
kubectl apply -f cert-manager.yaml
```



### 3.查看pod运行情况

```bash
root@k8s-made-01-32:/yaml/cert-manager# kubectl get pod -n cert-manager
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-5c458b9858-gkxzv              1/1     Running   0          21s
cert-manager-cainjector-6fd86f6d9d-w4vhv   1/1     Running   0          21s
cert-manager-webhook-5f6c479b6b-mcs4r      1/1     Running   0          21s
```





## 二、创建 cert-manager 的证书颁发实体对象



cert-manager 的 `Issuer` 和 `ClusterIssuer` 都是用来定义证书颁发的实体的资源对象。

- `Issuer` 是命名空间级别的资源，用于在命名空间内颁发证书。例如，当您需要使用自签名证书来保护您的服务，或者使用 Let's Encrypt 等公共证书颁发机构来颁发证书时，可以使用 Issuer。
- `ClusterIssuer` 是集群级别的资源，用于在整个集群内颁发证书。例如，当您需要使用公司的内部 CA 来颁发证书时，可以使用 ClusterIssuer。



知道两者之间的区别之后，你就可以根据自己的使用情况来决定自己的 issuer 的类型。

这里列出几种常用的 issuer 使用模板：



### 1.创建 staging 环境的证书颁发者 issuer

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    # The ACME server URL
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    # Email address used for ACME registration
    email: xxx@qq.com #此处填写你的邮箱地址
    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: letsencrypt-staging
    # Enable the HTTP-01 challenge provider
    solvers:
      - http01:
          ingress:
            class:  nginx
```



> 使用 staging 环境颁发的证书无法正常在公网使用，需要本地添加受信任根证书



### 2.创建 prod 环境的证书颁发者 issuer

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # The ACME server URL
    server: https://acme-v02.api.letsencrypt.org/directory
    # Email address used for ACME registration 欢迎关注·云原生生态圈
    email: xxx@qq.com
    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: letsencrypt-prod
    # Enable the HTTP-01 challenge provider
    solvers:
      - http01:
          ingress:
            class: nginx
```



### 3.创建 staging 环境的证书颁发者 ClusterIssuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    # The ACME server URL
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    # Email address used for ACME registration 欢迎关注·云原生生态圈
    email: xxx@qq.com
    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: letsencrypt-staging
    # Enable the HTTP-01 challenge provider
    solvers:
      - http01:
          ingress:
            class:  nginx
```





### 4.创建 Prod 环境的证书颁发者 ClusterIssuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # The ACME server URL
    server: https://acme-v02.api.letsencrypt.org/directory
    # Email address used for ACME registration 欢迎关注·云原生生态圈
    email: xxx@qq.com
    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: letsencrypt-prod
    # Enable the HTTP-01 challenge provider
    solvers:
      - http01:
          ingress:
            class: nginx
```



## 三、应用实践测试



### 1.创建一个集群级的签发机构

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod1234
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: zxx@ceamg.com
    privateKeySecretRef:
      name: letsencrypt-prod1234
    solvers:
    - http01:
        ingress:
          class: nginx
```



**说明**：

- `metadata.name` 是我们创建的签发机构的名称，后面我们创建证书的时候会引用它
- `spec.acme.email` 是你自己的邮箱，证书快过期的时候会有邮件提醒，不过 cert-manager 会利用 acme 协议自动给我们重新颁发证书来续期
- `spec.acme.server` 是 acme 协议的服务端，我们这里用 Let’s Encrypt，这个地址就写死成这样就行
- `spec.acme.privateKeySecretRef` 指示此签发机构的私钥将要存储到哪个 Secret 对象中，名称不重要
- `spec.acme.http01` 这里指示签发机构使用 HTTP-01 的方式进行 acme 协议 (还可以用 DNS 方式，acme 协议的目的是证明这台机器和域名都是属于你的，然后才准许给你颁发证书)



**执行发布命令**

```bash
kubectl apply -f cluster-issuer.yaml
```





### 2.配置dns域名解析



![image-20230616164228233](http://img.xinn.cc/image-20230616164228233.png)

### 3. 创建证书资源

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: k8s-ceamg-com-cert
  namespace: default
  annotations:
    cert-manager.io/issue-temporary-certificate: "true"
spec:
  secretName: k8s-ceamg-com-tls
  issuerRef:
    name: letsencrypt-prod1234
    kind: ClusterIssuer
  duration: 2160h
  renewBefore: 360h
  dnsNames:
  - k8s.ceamg.com
```



**说明**：

- `spec.secretName` 指示证书最终存到哪个 Secret 中

- `spec.issuerRef.kind` 值为 ClusterIssuer 说明签发机构不在本 namespace 下，而是在全局

- `spec.issuerRef.name` 我们创建的签发机构的名称 (ClusterIssuer.metadata.name)

- `spec.dnsNames` 指示该证书的可以用于哪些域名,与域名解析的一致

- `renewBefore` 字段来控制证书到期前多久会被更新

- `duration`字段来指定自签名证书的期限

  

  ```bash
  kubectl apply -f Certificate.yaml
  ```

  

### 4. 查看cert-manager运行情况

```bash
kubectl logs -f $(kubectl get pods -n cert-manager | grep cert-manager | grep -v 'cainjector\|webhook' | awk '{print $1}') -n cert-manager
```



**当然，也可以查看临时生成的专门验证证书的 Ingress 对象的运行情况**

临时对象`cm-acme-http-solver-xxxx`从创建到消亡的过程

```
kubectl get pod -A | grep "cm*"
```





**查看certificate创建结果**

```shell
root@k8s-made-01-32:/etc/kubeasz/clusters/xx-prod# kubectl get certificate
NAME                 READY   SECRET              AGE
k8s-ceamg-com-cert   True    k8s-ceamg-com-tls   1h
```



当READY为True时即为成功，详细可看cert-manager运行日志。





### 5.问题排查

#### **问题1：**

```bash
kubectl logs -n cert-manager cert-manager-webhook-5f6c479b6b-mcs4r
I0616 06:12:56.720433       1 logs.go:59] http: TLS handshake error from 10.48.87.0:34244: EOF
```



**解决方法**

在Ingress 或 Certificate resource 添加声明

```yaml
cert-manager.io/issue-temporary-certificate: "true"
acme.cert-manager.io/http01-edit-in-place: "true"

#颁发一个临时的自签名证书在，供ingress controller 在颁发实际证书之前使用
```



#### **问题2：**

```
kubectl logs -n cert-manager cert-manager-5c458b9858-gkxzv
E0616 06:12:27.072543       1 sync.go:190] "cert-manager/challenges: propagation check failed" err="failed to perform self check GET request 'http://k8s.ceamg.com/.well-known/acme-challenge/OvQFFmEAO5016nAu1YC20RcgDtU2CsCPuoporE13ekw': Get \"http://k8s.ceamg.com/.well-known/acme-challenge/OvQFFmEAO5016nAu1YC20RcgDtU2CsCPuoporE13ekw\": dial tcp 10.1.0.32:80: connect: connection refused" resource_name="k8s-ceamg-com-cert-9rw4s-2953330747-2092136088" resource_namespace="default" resource_kind="Challenge" resource_version="v1" dnsName="k8s.ceamg.com" type=HTTP-01
```



**解决方法**

1.排查DNS解析

![](http://img.xinn.cc/image-20230616173738013.png)





2.排查容器内DNS是否可以解析到域名

```
#启用一个busybox pod 测试pod环境内是否可以解析到域名
kubectl run --image=busybox:1.28.1 --rm -it -- sh
/ # ping k8s.ceamg.com
PING k8s.ceamg.com (10.1.0.91): 56 data bytes
64 bytes from 10.1.0.91: seq=0 ttl=63 time=0.377 ms
64 bytes from 10.1.0.91: seq=1 ttl=63 time=0.366 ms
```





3.排查外网防火墙NAT地址转换策略

![image-20230616173901963](http://img.xinn.cc/image-20230616173901963.png)



将公网地址转发到后端Haproxy代理节点，且有匹配数。



4.排查WAF防火墙端口策略

![](http://img.xinn.cc/image-20230616174217817.png)

ACME 认证只需要放通80和443端口即可



5.依次检查certificate、challenges、certificaterequests 

```
 kubectl describe certificate k8s-ceamg-com-cert
```

```
kubectl describe challenges.acme.cert-manager.io
```

```
kubectl describe certificaterequests.cert-manager.io
```



### 6.部署一个服务测试证书



#### 1.安装ingress-nginx

[Ingress-nginx详细安装过程](http://www.ryanxin.live/k8s/log/kubernetes-12.html)



这里因为k8s版本为1.26.2所以选择 V1.71版本

![image-20230619104014430](http://img.xinn.cc/xxlog/image-20230619104014430.png)

```sh
wget https://github.com/kubernetes/ingress-nginx/archive/refs/tag/controller-v1.7.1.tar.gz
tar xvf controller-v1.7.1.tar.gz
cd ingress-nginx-controller-v1.7.1/deploy/static/provider/baremetal/
#修改当前目录下的deploy.yaml，将镜像修改未国内镜像源

cat deploy.yaml |grep image
        image: harbor.ceamg.com/k8s-base/ingress-nginx-controller:v1.7.1
        image: harbor.ceamg.com/k8s-base/kube-webhook-certgen:v20230312
        image: harbor.ceamg.com/k8s-base/kube-webhook-certgen:v20230312
```



##### 1.1 指定控制器NodePort地址

```yaml
vim deploy.yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
    app.kubernetes.io/version: 1.7.1
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



##### 1.2 执行安装

```sh
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



##### 1.3 查看pod状态

```sh
root@k8s-made-01-32:/etc/kubeasz/clusters/xx-prod# kubectl get pod -n ingress-nginx
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-qhk5g        0/1     Completed   0          12s
ingress-nginx-admission-patch-qn9kc         0/1     Completed   0          12s
ingress-nginx-controller-589f4f6875-drvlp   1/1     Running     0          12s
```

```sh
root@k8s-made-01-32:/etc/kubeasz/clusters/xx-prod# kubectl get svc -n ingress-nginx
NAME                                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.68.201.220   <none>        80:30020/TCP,443:30021/TCP   15s
ingress-nginx-controller-admission   ClusterIP   10.68.72.129    <none>        443/TCP                      15s
```



##### 1.4 调整controller 副本数

默认情况下，ingress-nginx-controller只有一个副本，可以按需调整。

```sh
kubectl scale -n ingress-nginx deployment ingress-nginx-controller --replicas=3
deployment.apps/ingress-nginx-controller scaled

--------------------------------------------------
kubectl get pod -n ingress-nginx
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-qhk5g        0/1     Completed   0          74s
ingress-nginx-admission-patch-qn9kc         0/1     Completed   0          74s
ingress-nginx-controller-589f4f6875-drvlp   1/1     Running     0          74s
ingress-nginx-controller-589f4f6875-kw5t6   1/1     Running     0          34s
ingress-nginx-controller-589f4f6875-pj6g2   1/1     Running     0          74s
```



**查看pod 运行位置分布情况**

```sh
kubectl get pod -n ingress-nginx -o wide
NAME                                        READY   STATUS      RESTARTS   AGE     IP             NODE        NOMINATED NODE   READINESS GATES
ingress-nginx-admission-create-qhk5g        0/1     Completed   0          3d12h   10.48.150.71   10.1.0.37   <none>           <none>
ingress-nginx-admission-patch-qn9kc         0/1     Completed   0          3d12h   10.48.245.19   10.1.0.35   <none>           <none>
ingress-nginx-controller-589f4f6875-drvlp   1/1     Running     0          2d22h   10.48.150.72   10.1.0.37   <none>           <none>
ingress-nginx-controller-589f4f6875-kw5t6   1/1     Running     0          5m22s   10.48.245.21   10.1.0.35   <none>           <none>
ingress-nginx-controller-589f4f6875-pj6g2   1/1     Running     0          3d12h   10.48.35.142   10.1.0.34   <none>           <none>
```

**ingress-nginx-controller** 服务分布在 10.1.0.34 、10.1.0.35 、10.1.0.37 这三个节点上





##### 1.5 在负载均衡器中添加后端节点

在负载均衡器中添加ingress-nginx-controller后端，以haproxy为例。

详见 [Haproxy 安装及配置讲解](http://www.ryanxin.live/haproxy/log/Haproxy-1.html)



haproxy使用子配置文件保存配置

当业务众多时，将所有配置都放在一个配置文件中，会造成维护困难。可以考虑按业务分类，将配置信息拆分，放在不同的子配置文件中，从而达到方便维护的目的。

```sh
#创建子配置目录
mkdir /etc/haproxy/conf.d/

#创建子配置文件，注意：必须为cfg后缀
vim  /etc/haproxy/conf.d/cert-test.cfg
listen ingress-nginx-controller-80
       bind 10.1.0.91:80
       option  tcplog
       mode tcp
       balance source #后端节点
       server ingress-controller-server1 10.1.0.34:30020 check inter 2000 fall 3 rise 5
       server ingress-controller-server2 10.1.0.35:30020 check inter 2000 fall 3 rise 5
       server ingress-controller-server3 10.1.0.37:30020 check inter 2000 fall 3 rise 5

listen ingress-nginx-controller-443
       bind 10.1.0.91:443
       option  tcplog
       mode tcp
       balance source #后端节点
       server ingress-controller-server1 10.1.0.34:30021 check inter 2000 fall 3 rise 5
       server ingress-controller-server2 10.1.0.35:30021 check inter 2000 fall 3 rise 5
       server ingress-controller-server3 10.1.0.37:30021 check inter 2000 fall 3 rise 5
```



**添加子配置目录到unit文件中**



```bash
[Unit]
Description=HAProxy Load Balancer
Documentation=man:haproxy(1)
Documentation=file:/usr/share/doc/haproxy/configuration.txt.gz
After=network-online.target rsyslog.service
Wants=network-online.target

[Service]
EnvironmentFile=-/etc/default/haproxy
EnvironmentFile=-/etc/sysconfig/haproxy
BindReadOnlyPaths=/dev/log:/var/lib/haproxy/dev/log
Environment="CONFIG=/etc/haproxy/haproxy.cfg" "CONFIGDIR=/etc/haproxy/conf.d/" "PIDFILE=/run/haproxy.pid" "EXTRAOPTS=-S /run/haproxy-master.sock" #声明了一下子配置文件路径
ExecStart=/usr/sbin/haproxy -Ws -f $CONFIG -f $CONFIGDIR -p $PIDFILE $EXTRAOPTS #添加变量
ExecReload=/usr/sbin/haproxy -Ws -f $CONFIG -c -q $EXTRAOPTS
ExecReload=/bin/kill -USR2 $MAINPID
KillMode=mixed
Restart=always
SuccessExitStatus=143
Type=notify

# The following lines leverage SystemD's sandboxing options to provide
# defense in depth protection at the expense of restricting some flexibility
# in your setup (e.g. placement of your configuration files) or possibly
# reduced performance. See systemd.service(5) and systemd.exec(5) for further
# information.

# NoNewPrivileges=true
# ProtectHome=true
# If you want to use 'ProtectSystem=strict' you should whitelist the PIDFILE,
# any state files and any other files written using 'ReadWritePaths' or
# 'RuntimeDirectory'.
# ProtectSystem=true
# ProtectKernelTunables=true
# ProtectKernelModules=true
# ProtectControlGroups=true
# If your SystemD version supports them, you can add: @reboot, @swap, @sync
# SystemCallFilter=~@cpu-emulation @keyring @module @obsolete @raw-io

[Install]
WantedBy=multi-user.target
```



##### 1.6 测试访问ingress控制器

80端口

![](http://img.xinn.cc/xxlog/image-20230619110149057.png)

443端口

![](http://img.xinn.cc/xxlog/image-20230619110233665.png)





#### **2.发布一个nginx服务验证证书**



##### 2.1 创建nginx服务deploy文件

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cert-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cert-nginx
  template:
    metadata:
      labels:
        app: cert-nginx
    spec:
      containers:
      - name: nginx
        image: harbor.ceamg.com/baseimages/nginx:1.21.1
        ports:
        - name: http
          containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: cert-nginx-svc
spec:
  selector:
    app: cert-nginx
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
```



##### 2.2 创建ingress yaml文件

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-cert-ingress
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
  tls:
  - hosts:
      - k8s.ceamg.com
    secretName: k8s-ceamg-com-tls
  rules:
  - host: k8s.ceamg.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cert-nginx-svc
            port:
              number: 80
```



##### 2.3 查看服务运行情况



```sh
#nginx服务运行情况
kubectl get pod
NAME                                 READY   STATUS    RESTARTS   AGE
busybox                              1/1     Running   0          4d16h
cert-nginx-deploy-59449496d7-jpztj   1/1     Running   0          14s
```

```sh
#svc运行情况
kubectl get svc  -o wide
NAME             TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE     SELECTOR
cert-nginx-svc   ClusterIP   10.68.149.26   <none>        80/TCP    30s   app=cert-nginx
```

```sh
#ingress运行情况
kubectl get ingress -o wide
NAME               CLASS    HOSTS           ADDRESS                         PORTS     AGE
tls-cert-ingress   <none>   k8s.ceamg.com   10.1.0.34,10.1.0.35,10.1.0.37   80, 443   20s
```





### 7.通过域名访问测试

![](http://img.xinn.cc/xxlog/image-20230619111343825.png)







[Cert-Manager 实现 K8s 服务域名证书自动化续签]: https://blog.51cto.com/bkmaster/6094343

