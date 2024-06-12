---
author: Ryan
sidebar_position: 4
title: 9.运行java应用
date: 2023-01-24
---



本次以jenkins.war 包部署⽅式为例运⾏ ，java war包或jar包，且要求jenkins的数据保存⾄外部存储(NFS或者PVC)，其他java应⽤看实际需求是否需要将数据保存⾄外部存储。  



## 构建镜像

```bash
#Jenkins Version 2.319.3
FROM harbor.ceamg.com/pub-images/jdk8:3411

MAINTAINER zcc zcc@qq.com

ADD jenkins-2.319.3.war /apps/jenkins/
ADD run_jenkins.sh /usr/bin/

EXPOSE 8080

CMD ["/usr/bin/run_jenkins.sh"]
```

```bash
#!/bin/bash
cd /apps/jenkins && jave -server -Xms1024m -Xmx1024m -Xss512k -jar jenkins-2.319.3.war --webroot=/apps/jenkins/jenkins-data --httpPort=8080
```

**查看Jenkins 支持的参数**
```bash
java -jar jenkins.war --help
```


```yaml
#!/bin/bash
docker build -t  harbor.ceamg.com/pub-images/jenkins:v2.319.3 .
echo "镜像制作完成，即将上传至Harbor服务器"
sleep 1
docker push harbor.ceamg.com/pub-images/jenkins:v2.319.3
echo "镜像上传完成"
```


```bash
root@harbor01[16:45:23]/dockerfile/jenkins #:bash build-command.sh 
Sending build context to Docker daemon  72.26MB
Step 1/6 : FROM harbor.ceamg.com/pub-images/jdk8:3411
---> 1328b4d79a67
Step 2/6 : MAINTAINER zcc zcc@qq.com
---> Using cache
---> 35ad6bb5a267
Step 3/6 : ADD jenkins-2.319.3.war /apps/jenkins/
---> d83e0dff6896
Step 4/6 : ADD run_jenkins.sh /usr/bin/
---> 4f60478bd327
Step 5/6 : EXPOSE 8080
---> Running in 84bcd1400981
Removing intermediate container 84bcd1400981
---> d01106084f38
Step 6/6 : CMD ["/usr/bin/run_jenkins.sh"]
---> Running in 9eaaf7204543
Removing intermediate container 9eaaf7204543
---> 0c48f0d81550
Successfully built 0c48f0d81550
Successfully tagged harbor.ceamg.com/pub-images/jenkins:v2.319.3
镜像制作完成，即将上传至Harbor服务器
The push refers to repository [harbor.ceamg.com/pub-images/jenkins]
d74d542bfbb2: Pushed 
ba3e041a4025: Pushed 
3ad8c5bef187: Mounted from pub-images/tomcat-base 
f4442a8d89b4: Mounted from pub-images/tomcat-base 
c185ef053da5: Mounted from pub-images/tomcat-base 
0002c93bdb37: Mounted from pub-images/tomcat-base 
v2.319.3: digest: sha256:fbaa1f61491042ddc6ab2dc3e2183900daaeee1d57ecc772c33ac7dfb39f895a size: 1575
镜像上传完成
```


## 创建pv
```yaml
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: jenkins-datadir-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteOnce
  nfs:
    server: 10.1.0.38
    path: /data/k8s/jenkins/jenkins-data

---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: jenkins-root-datadir-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteOnce
  nfs:
    server: 10.1.0.38
    path: /data/k8s/jenkins/jenkins-root-data

```


### NFS服务器创建应用数据目录
```bash
root@harbor01[16:52:33]/data/k8s #:mkdir /data/k8s/jenkins/jenkins-data -p
root@harbor01[16:52:47]/data/k8s #:mkdir /data/k8s/jenkins/jenkins-root-data -p

vim /etx/exports
/data/k8s/jenkins *(rw,sync,no_root_squash)
root@harbor01[16:54:13]/data/k8s/jenkins #:systemctl restart nfs-server.service
```

```bash
root@master01[16:57:33]~/jenkins-yaml #:kubectl apply -f jenkins-pv.yaml 
persistentvolume/jenkins-datadir-pv created
persistentvolume/jenkins-root-datadir-pv created

root@master01[16:57:38]~/jenkins-yaml #:kubectl get pv 
NAME                      CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                            STORAGECLASS   REASON   AGE
jenkins-datadir-pv        100Gi      RWO            Retain           Available                                                            5s
jenkins-root-datadir-pv   100Gi      RWO            Retain           Available                                                            5s
```


## 创建PVC 
```yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: jenkins-datadir-pvc
  namespace: jenkins-xin
spec:
  volumeName: jenkins-datadir-pv
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 80Gi

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: jenkins-root-datadir-pvc
  namespace: jenkins-xin
spec:
  volumeName: jenkins-root-datadir-pv
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 80Gi
```

```bash
root@master01[16:58:41]~/jenkins-yaml #:kubectl apply -f jenkins-pvc.yaml 
persistentvolumeclaim/jenkins-datadir-pvc created
persistentvolumeclaim/jenkins-root-datadir-pvc created
root@master01[16:58:28]~/jenkins-yaml #:kubectl create namespace jenkins-xin
namespace/jenkins-xin created
root@master01[16:58:52]~/jenkins-yaml #:kubectl get pvc -n jenkins-xin
NAME                       STATUS   VOLUME                    CAPACITY   ACCESS MODES   STORAGECLASS   AGE
jenkins-datadir-pvc        Bound    jenkins-datadir-pv        100Gi      RWO                           23s
jenkins-root-datadir-pvc   Bound    jenkins-root-datadir-pv   100Gi      RWO                           23s
```


## 创建Jenkins Pod服务
```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    app: jenkins-319
  name: jenkins-319-deployment
  namespace: jenkins-xin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jenkins-319
  template:
    metadata:
      labels:
        app: jenkins-319
    spec:
      containers:
      - name: jenkins-319-container
        image: harbor.ceamg.com/pub-images/jenkins:v2.319.3 
        imagePullPolicy: IfNotPresent
        #imagePullPolicy: Always
        ports:
        - containerPort: 8080
          protocol: TCP
          name: http
        volumeMounts:
        - mountPath: "/apps/jenkins/jenkins-data/"
          name: jenkins-app-datadir
        - mountPath: "/root/.jenkins"
          name: jenkins-root-datadir
      volumes:
        - name: jenkins-app-datadir
          persistentVolumeClaim:
            claimName: jenkins-datadir-pvc
        - name: jenkins-root-datadir
          persistentVolumeClaim:
            claimName: jenkins-root-datadir-pvc

---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: jenkins-319
  name: jenkins-319-service
  namespace: jenkins-xin
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 8080
    nodePort: 38080
  selector:
    app: jenkins-319
```


### 验证服务状态
```bash
root@master01[10:36:43]~/jenkins-yaml #:kubectl apply -f jenkins-deployment.yaml 
deployment.apps/jenkins-319-deployment created
service/jenkins-319-service created

root@master01[10:39:03]~/jenkins-yaml #:kubectl get pod -n  jenkins-xin 
NAME                                      READY   STATUS    RESTARTS   AGE
jenkins-319-deployment-67cb4bf4c9-wnvqb   1/1     Running   0          24s
```


### service
```bash
root@master01[10:39:16]~/jenkins-yaml #:kubectl get service -n jenkins-xin 
NAME                  TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
jenkins-319-service   NodePort   10.10.24.94   <none>        80:38080/TCP   41s
```


![](https://cdn1.ryanxin.live/1675140260595-e7f2ee78-f004-4dfd-afb3-ab7473eb824b.png)

获取密码
![获取密码](https://cdn1.ryanxin.live/1675140354511-98828f8d-9a2c-4692-a714-a750401805d7.png)

![](https://cdn1.ryanxin.live/1675150017505-dc2f9866-e03f-47ce-9c94-89f18fc539fb.png)
