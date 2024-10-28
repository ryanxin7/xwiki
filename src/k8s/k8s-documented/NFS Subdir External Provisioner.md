---
author: Ryan
title: 基于NFS Subdir External Provisioner插件提供K8S存储
date: 2023-07-24
---





## 一、简介

NFS Subdir External Provisioner 是 Kubernetes 的一个外部存储供应者（External Provisioner），专门用于处理 NFS 存储卷的动态创建。

 在 Kubernetes 中，存储供应者是一种机制，用于动态创建持久卷（Persistent Volumes）以及与之关联的持久卷声明（Persistent Volume Claims）。而外部存储供应者是指这样的供应者，它并非 Kubernetes 核心组件的一部分，而是由社区或第三方提供的插件。

**NFS-subdir-external-provisioner**可动态为kubernetes提供pv卷，是Kubernetes的简易NFS的外部provisioner，本身不提供NFS，需要现有的NFS服务器提供存储。<br />

持久卷目录的命名规则为: `${namespace}-${pvcName}-${pvName}`



### 1.1 原理

NFS Subdir External Provisioner 通常与 Kubernetes 中的 StorageClass 一起使用。在 Kubernetes 中，StorageClass 是用于定义动态存储卷（PV）的模板的对象。StorageClass 允许管理员定义存储的属性，如访问模式、卷的大小和特定的存储插件（如 NFS Subdir External Provisioner）等。

NFS Subdir External Provisioner 通过 StorageClass 来配置其行为。在配置 StorageClass 时，你会指定 NFS Subdir External Provisioner 的相关信息，例如 NFS 服务器的地址、导出路径等。Pod 可以通过创建 Persistent Volume Claim（PVC）并引用这个 StorageClass 来请求动态分配的 NFS 存储。



### 1.2 作用

NFS Subdir External Provisioner 的主要作用是简化 Kubernetes 中 NFS 存储的管理。它的名字中的 "Subdir" 意味着它会在 NFS 服务器的指定子目录中创建卷。它允许管理员通过定义简单的存储类（StorageClass）和持久卷声明（Persistent Volume Claims），而不必手动创建和管理 NFS 卷。



使用 **Kubernetes NFS Subdir External Provisioner** 插件对接后端NFS存储



 项目地址:

https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner/tree/master



### 1.3 配置案例

`nfs-client-speed.yaml` Kubernetes提供了一套可以自动创建PV的机制,即:Dynamic Provisioning.

而这个机制的核心在于:StorageClass这个API对象.  

```bash
nfs:
  server: xxxxxxxxx.cn-beijing.extreme.nas.aliyuncs.com    #NFS 服务器的主机名（必填）
  path: /share  #要使用的挂载点的基本路径
  mountOptions: #安装选项（例如“nfs.vers=3”）
    - vers=3
    - noacl
    - nolock
    - proto=tcp
    - rsize=1048576
    - wsize=1048576
    - hard
    - timeo=600
    - retrans=2
    - noresvport

storageClass: 
  name: nfs-client-speed  # 存储类的名称
  defaultClass: false #设置为默认 StorageClass
  allowVolumeExpansion: true #允许扩大卷
  reclaimPolicy: Delete #回收策略
  provisionerName: nfs-client-speed #动态卷分配者名称，必须和创建的"provisioner"变量中设置的name一致
  archiveOnDelete: true ##设置为"false"时删除PVC不会保留数据,"true"则保留数据 
```






### 1.4 StorageClass 回收策略

 由 StorageClass 动态创建的 PersistentVolume 会在类的 [reclaimPolicy](https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#reclaiming) 字段中指定回收策略，可以是 Delete 或者 Retain。 如果 StorageClass 对象被创建时没有指定 reclaimPolicy，它将默认为 Delete。  

[https://kubernetes.io/docs/concepts/storage/storage-classes/](https://kubernetes.io/docs/concepts/storage/storage-classes/)


[https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#reclaiming](https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#reclaiming)

#### 回收（Reclaiming）
当用户不再使用其存储卷时，他们可以从 API 中将 PVC 对象删除， 从而允许该资源被回收再利用。PersistentVolume 对象的回收策略告诉集群， 当其被从申领中释放时如何处理该数据卷。 目前，数据卷可以被 Retained（保留）、Recycled（回收）或 Deleted（删除）。
#### 保留（Retain）
回收策略 Retain 使得用户可以手动回收资源。当 PersistentVolumeClaim 对象被删除时，PersistentVolume 卷仍然存在，对应的数据卷被视为"已释放（released）"。 由于卷上仍然存在这前一申领人的数据，该卷还不能用于其他申领。 管理员可以通过下面的步骤来手动回收该卷：

1. 删除 PersistentVolume 对象。与之相关的、位于外部基础设施中的存储资产 （例如 AWS EBS、GCE PD、Azure Disk 或 Cinder 卷）在 PV 删除之后仍然存在。
2. 根据情况，手动清除所关联的存储资产上的数据。
3. 手动删除所关联的存储资产。

如果你希望重用该存储资产，可以基于存储资产的定义创建新的 PersistentVolume 卷对象。
#### 删除（Delete）
对于支持 Delete 回收策略的卷插件，删除动作会将 PersistentVolume 对象从 Kubernetes 中移除，同时也会从外部基础设施（如 AWS EBS、GCE PD、Azure Disk 或 Cinder 卷）中移除所关联的存储资产。 动态制备的卷会继承[其 StorageC](https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#reclaim-policy)[lass 中设置的回收策略](https://kubernetes.io/zh-cn/docs/concepts/storage/persistent-volumes/#reclaim-policy)， 该策略默认为 Delete。管理员需要根据用户的期望来配置 StorageClass； 否则 PV 卷被创建之后必须要被编辑或者修补。 参阅[更改 PV 卷的回收策略](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/change-pv-reclaim-policy/)。  





## 二、实现基于NFS Subdir External Provisioner插件提供K8S存储

### 1. 搭建NFS服务器

```bash
sudo apt update
sudo apt install nfs-kernel-server
```
一旦安装完成， NFS 服务将会自动启动。

默认情况下，在 Ubuntu 18.04 上禁用 NFS 版本 2。 版本 3 和 4 已启用。 您可以通过运行以下 cat 命令来验证：

```bash
sudo cat /proc/fs/nfsd/versions
-2 +3 +4 +4.1 +4.2
```

#### 1.1 检查服务状态
 使用下面命令检查nfs-server是否已经启动：  
```bash
root@fileServer:/srv# sudo systemctl status nfs-server
● nfs-server.service - NFS server and services
     Loaded: loaded (/lib/systemd/system/nfs-server.service; enabled; vendor preset: enabled)
     Active: active (exited) since Sat 2023-03-25 13:15:36 CST; 3 months 3 days ago
   Main PID: 534 (code=exited, status=0/SUCCESS)
      Tasks: 0 (limit: 4609)
     Memory: 0B
     CGroup: /system.slice/nfs-server.service

Mar 25 13:15:34 fileServer systemd[1]: Starting NFS server and services...
Mar 25 13:15:36 fileServer systemd[1]: Finished NFS server and services.

```


#### 1.2 创建NFS共享目录

 NFS 会将 **client** 上的任何 **root** 操作转换为 `nobody:nogroup` 凭据作为安全措施。因此,我们需要更改目录所有权以匹配这些凭据。  

```bash
mkdir /nfs-server
chown nobody:nogroup /nfs-server
chmod 755 /nfs-server
```




#### 1.3 发布共享目录
 通过编辑`/etc/exports`配置文件，来允许哪些客户端可以访问该共享。  
```bash
vim /etc/exports
/nfs-server  *(rw,sync,no_subtree_check,insecure,no_root_squash)
```

配置文件中的权限解释：![eba3c43b08c94377b44465059a0a7bb3.png](http://img.xinn.cc/1687918792849-fd5dd6db-e1b3-4ed8-b7dc-573208f425a0.png)

 使用下面命令将共享文件夹启用并生效：  
```bash
exportfs -arv
exporting *:/nfs-server
```
```bash
# 查看NFS服务端状态
nfsstat -s
# 查看NFS客户端状态
nfsstat -c
# 查看服务端和客户端状态
nfsstat
```

#### 1.4 配置客户端
```bash
# 在Ubuntu20.04中安装客户端：nfs-common
bob@ubuntu-20-04:~$ sudo apt install nfs-common
# 在Centos8中安装客户端：nfs-utils
[root@localhost ~]# yum -y install nfs-utils
```


使用`showmount -e`查看是否可以看到共享目录：
```bash
root@k8s-w-04-35:~# showmount -e 192.168.10.26
Export list for 192.168.10.26:
/nfs-server *
```


#### 1.5 测试挂载
```bash
mkdir -p /mnt/test
mount -t nfs nfs-server:/nfs-server /mnt/test
```
### 2. 修改 NFS Subdir External Provisioner chart文件 

 helm hub地址：[https://artifacthub.io/packages/helm/nfs-subdir-external-provisioner/nfs-subdir-external-provisioner](https://artifacthub.io/packages/helm/nfs-subdir-external-provisioner/nfs-subdir-external-provisioner)

#### 2.1 安装helm
1. 选择下载版本 [https://github.com/helm/helm/releases](https://github.com/helm/helm/releases)
2. 解压
3. 在解压目录中找到helm程序，移动到需要的目录中

```bash
root@k8s-made-01-32:/softs# tar -zxvf  helm-v3.11.3-linux-amd64.tar.gz
linux-amd64/
linux-amd64/LICENSE
linux-amd64/README.md
linux-amd64/helm


mv linux-amd64/helm /usr/local/bin/helm
#查看版本
root@k8s-made-01-32:/softs# helm version
version.BuildInfo{Version:"v3.11.3", GitCommit:"323249351482b3bbfc9f5004f65d400aa70f9ae7", GitTreeState:"clean", GoVersion:"go1.20.3"}
```
#### 2.2 Helm方式
 添加helm仓库  
```bash
$ helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
```


 使用 `helm search repo` 命令，你可以从你所添加的仓库中查找chart的名字  
```bash
root@k8s-made-01-32:/softs# helm search repo nfs-subdir-external-provisioner
NAME                                                    CHART VERSION   APP VERSION     DESCRIPTION
nfs-subdir-external-provisioner/nfs-subdir-exte...      4.0.18          4.0.2           nfs-subdir-external-provisioner is an automatic...

```


 从仓库下载并（可选）在本地目录解压。  
```bash
# helm pull [chart URL | repo/chartname] [...] [flags]
# 仅下载
helm pull nfs-subdir-external-provisioner/nfs-subdir-external-provisioner
# 下载并解压到当前目录
helm pull nfs-subdir-external-provisioner/nfs-subdir-external-provisioner --untar
```

#### 2.3 比对rmxc和官方chart包
```bash
root@k8s-made-01-32:/softs# tree nfs-subdir-external-provisioner/
nfs-subdir-external-provisioner/
├── Chart.yaml
├── ci
│   └── test-values.yaml
├── README.md
├── templates
│   ├── clusterrolebinding.yaml
│   ├── clusterrole.yaml
│   ├── deployment.yaml
│   ├── _helpers.tpl
│   ├── persistentvolumeclaim.yaml
│   ├── persistentvolume.yaml
│   ├── poddisruptionbudget.yaml
│   ├── podsecuritypolicy.yaml
│   ├── rolebinding.yaml
│   ├── role.yaml
│   ├── serviceaccount.yaml
│   └── storageclass.yaml
└── values.yaml

tree rmxc/nfs-subdir-external-provisioner/
nfs-subdir-external-provisioner/
├── Chart.yaml
├── ci
│   └── test-values.yaml
├── README.md
├── templates
│   ├── clusterrolebinding.yaml
│   ├── clusterrole.yaml
│   ├── deployment.yaml
│   ├── _helpers.tpl
│   ├── persistentvolumeclaim.yaml
│   ├── persistentvolume.yaml
│   ├── podsecuritypolicy.yaml
│   ├── rolebinding.yaml
│   ├── role.yaml
│   ├── serviceaccount.yaml
│   └── storageclass.yaml
└── values.yaml

```

```bash
helm repo add --username=zxx --password="xxxxxxxxxxx" rmxc https://harbor.rmxc.tech/chartrepo/charts
"rmxc" has been added to your repositories


root@k8s-made-01-32:/softs/nfs-subdir-external-provisioner# helm search repo rmxc
NAME                                    CHART VERSION   APP VERSION     DESCRIPTION
rmxc/app-chart                          0.1.0           0.0.1           A Helm chart for applications with log direcotr...
rmxc/clickhouse                         0.1.0           1               deploy clickhouse on kubernetes
rmxc/descheduler                        0.23.1          0.23.0          Descheduler for Kubernetes is used to rebalance...
rmxc/harbor                             1.7.0           2.3.0           An open source trusted cloud native registry th...
rmxc/ingress-nginx                      4.1.4           1.2.1           Ingress controller for Kubernetes using NGINX a...
rmxc/mysql                              0.1.0           1               deploy mysql on kubernetes
rmxc/mysql57                            0.1.0           5.7             deploy mysql-5.7 on kubernetes
rmxc/nfs-subdir-external-provisioner    4.0.16          4.0.2           nfs-subdir-external-provisioner is an automatic...
rmxc/redis                              0.1.0           1               deploy redis on kubernetes
rmxc/springboot-chart                   0.1.0           0.0.1           A Helm chart for Spring Boot applications
rmxc/springboot-jib-chart               0.1.0           0.0.1           A Helm chart for Spring Boot applications
rmxc/zookeeper                          7.0.4           3.7.0           A centralized service for maintaining configura...


helm pull rmxc/nfs-subdir-external-provisioner --untar
```

#### 2.4 安装前自定义 chart
```bash
root@k8s-made-01-32:/softs# helm show values nfs-subdir-external-provisioner/nfs-subdir-external-provisioner
replicaCount: 1
strategyType: Recreate

image:
  repository: registry.k8s.io/sig-storage/nfs-subdir-external-provisioner
  tag: v4.0.2
  pullPolicy: IfNotPresent
imagePullSecrets: []

nfs:
  server:
  path: /nfs-storage
  mountOptions:
  volumeName: nfs-subdir-external-provisioner-root
  # Reclaim policy for the main nfs volume
  reclaimPolicy: Retain

# For creating the StorageClass automatically:
storageClass:
  create: true

  # Set a provisioner name. If unset, a name will be generated.
  # provisionerName:

  # Set StorageClass as the default StorageClass
  # Ignored if storageClass.create is false
  defaultClass: false

  # Set a StorageClass name
  # Ignored if storageClass.create is false
  name: nfs-client

  # Allow volume to be expanded dynamically
  allowVolumeExpansion: true

  # Method used to reclaim an obsoleted volume
  reclaimPolicy: Delete

  # When set to false your PVs will not be archived by the provisioner upon deletion of the PVC.
  archiveOnDelete: true

  # If it exists and has 'delete' value, delete the directory. If it exists and has 'retain' value, save the directory.
  # Overrides archiveOnDelete.
  # Ignored if value not set.
  onDelete:

  # Specifies a template for creating a directory path via PVC metadata's such as labels, annotations, name or namespace.
  # Ignored if value not set.
  pathPattern:

  # Set access mode - ReadWriteOnce, ReadOnlyMany or ReadWriteMany
  accessModes: ReadWriteOnce

  # Set volume bindinng mode - Immediate or WaitForFirstConsumer
  volumeBindingMode: Immediate

  # Storage class annotations
  annotations: {}

leaderElection:
  # When set to false leader election will be disabled
  enabled: true

## For RBAC support:
rbac:
  # Specifies whether RBAC resources should be created
  create: true

# If true, create & use Pod Security Policy resources
# https://kubernetes.io/docs/concepts/policy/pod-security-policy/
podSecurityPolicy:
  enabled: false

# Deployment pod annotations
podAnnotations: {}

## Set pod priorityClassName
# priorityClassName: ""

podSecurityContext: {}

securityContext: {}

serviceAccount:
  # Specifies whether a ServiceAccount should be created
  create: true

  # Annotations to add to the service account
  annotations: {}

  # The name of the ServiceAccount to use.
  # If not set and create is true, a name is generated using the fullname template
  name:

resources: {}
  # limits:
  #  cpu: 100m
  #  memory: 128Mi
  # requests:
  #  cpu: 100m
  #  memory: 128Mi

nodeSelector: {}

tolerations: []

affinity: {}

# Additional labels for any resource created
labels: {}

podDisruptionBudget:
  enabled: false
  maxUnavailable: 1

```





经过对比信产chart包只修改了镜像地址为信产的harbor仓库


修改**nfs-subdir-external-provisioner **chart包的`values.yaml`文件中的镜像地址为私有仓库的镜像地址
```bash
registry.k8s.io/sig-storage/nfs-subdir-external-provisioner:v4.0.2
harbor.ceamg.com/k8s-base/nfs-subdir-external-provisioner:v4.0.2
```






### 3. 实现helm本地自定义Chart包上传到harbor保存
[https://cloud.tencent.com/developer/article/2295992](https://cloud.tencent.com/developer/article/2295992)

#### 3.1 harbor开启支持helm chart
1、修改harbor配置文件
```bash
# 将absolute_url的值更改为enabled可以在图表中启用绝对url
vim harbor.yml
chart:
  # Change the value of absolute_url to enabled can enable absolute url in chart
  absolute_url: enabled
```
####  3.2 停止harbor服务  
```bash
docker-compose stop
```


#### 3.3  注入配置  
```bash
./prepare 
```

#### 3.4 安装chartmuseum
在执行install.sh安装脚本时，通过`--with-chartmuseum`参数安装chart插件。

```bash
./install.sh  --with-notary --with-trivy --with-chartmuseum
```


![image.png](https://cdn.nlark.com/yuque/0/2023/png/33538388/1688021188616-50ea6fde-cb14-4acd-b6e5-0bd6fdb0e556.png#averageHue=%23f7f7f7&clientId=uec2f54c9-a53d-4&from=paste&height=859&id=u67a118ba&originHeight=859&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=76997&status=done&style=none&taskId=u67ddd064-fcd8-4531-8fdd-5114a423318&title=&width=1920)



#### 3.5 添加harbor作为chart仓库
创建用户

```bash
xceo
2q=~Dc8$DUg~Qcq
```


![image.png](https://cdn.nlark.com/yuque/0/2023/png/33538388/1688025574214-f58b9a1f-5aa1-49f4-a8ad-7782ee04565c.png#averageHue=%23fdfdfd&clientId=uec2f54c9-a53d-4&from=paste&height=473&id=u748665aa&originHeight=473&originWidth=568&originalType=binary&ratio=1&rotation=0&showTitle=false&size=16120&status=done&style=none&taskId=u20fc3dd4-9edd-4d31-ab8b-25a7bc9d877&title=&width=568)

```bash
#登录harbor私有仓库
root@k8s-made-01-32:/chart# HELM_EXPERIMENTAL_OCI=3 helm registry login -u xceo https://harbor.ceamg.com/chartrepo/chart -p Ceamg.com1234 --ca-file /etc/containerd/certs.d/harbor.ceamg.com/ca.crt  --cert-file  /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.crt --key-file /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.key
WARNING: Using --password via the CLI is insecure. Use --password-stdin.
Login Succeeded
```
```bash
#添加harbor私有仓库
helm repo add --username=xceo --password=Ceamg.com1234 ceamg https://harbor.ceamg.com/chartrepo/chart \
--ca-file /etc/containerd/certs.d/harbor.ceamg.com/ca.crt \
--cert-file  /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.crt \
--key-file /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.key

"ceamg" has been added to your repositories
```


```bash
#查看当前repo仓库
root@k8s-made-01-32:/chart# helm repo list
NAME                            URL
nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
rmxc                            https://harbor.rmxc.tech/chartrepo/charts
ceamg                           https://harbor.ceamg.com/chartrepo/chart

```



#### 3.6 打包chart 并发布到私有habor仓库中
```bash
#打包chart
helm package nfs-subdir-external-provisioner 
```

![image.png](http://img.xinn.cc/1688092478072-a7c0bbd7-dd48-4fd2-8142-74e73673355d.png)

查看文件![image.png](http://img.xinn.cc/1688092422149-fee14d56-c703-4523-8aaf-aa6b6a1b4867.png)

```bash

$ helm install nfs-subdir-external-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
    --set nfs.server=x.x.x.x \
    --set nfs.path=/exported/path
```



### 4. 在K8S集群部署NFS Subdir External Provisioner



#### 4.1 添加私有chartrepo仓库

```bash
helm repo add --username=xceo --password=Ceamg.com1234 ceamg https://harbor.ceamg.com/chartrepo/chart \
--ca-file /etc/containerd/certs.d/harbor.ceamg.com/ca.crt \
--cert-file  /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.crt \
--key-file /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.key

"ceamg" has been added to your repositories
```



#### 4.2 新建NFS服务器Values文件

```yaml
nfs:
  server: 192.168.10.26
  path: /nfs-server/k8s
  mountOptions:
    - vers=4
    - minorversion=0
    - rsize=1048576
    - wsize=1048576
    - hard
    - timeo=600
    - retrans=2
    - noresvport

storageClass:
  name: nfs-client
  defaultClass: true
  allowVolumeExpansion: true
  reclaimPolicy: Delete
  provisionerName: nfs-client
  archiveOnDelete: true
```



#### 4.3 helm安装自定义的Chart包

```bash
helm install -n kube-system -f nfs-client.values.yaml nfs-client ceamg/nfs-subdir-external-provisioner
#-n 命名空间
#-f 指定values文件
#nfs-client helm项目名字
# rmxc/nfs-subdir-external-provisioner CHART文件
```



#### 4.4 查看组件pod状态

```bash
root@k8s-made-01-32:/softs# helm  history -n kube-system nfs-client
REVISION        UPDATED                         STATUS          CHART                                   APP VERSION     DESCRIPTION
1               Fri Jun 30 10:59:03 2023        deployed        nfs-subdir-external-provisioner-4.0.18  4.0.2           Install complete
```

```bash
root@k8s-made-01-32:/softs# kubectl get pod -n kube-system
NAME                                                         READY   STATUS    RESTARTS   AGE
calico-kube-controllers-7bbb6b796b-chx8p                     1/1     Running   0          15d
calico-node-2fq2b                                            1/1     Running   0          15d
calico-node-6qdd4                                            1/1     Running   0          15d
calico-node-6qgk7                                            1/1     Running   0          15d
calico-node-86j52                                            1/1     Running   0          15d
calico-node-rv7rt                                            1/1     Running   0          15d
coredns-6665999d97-vvkk4                                     1/1     Running   0          15d
dashboard-metrics-scraper-57566685b4-zb2m5                   1/1     Running   0          15d
kubernetes-dashboard-57db9bfd5b-dx8fz                        1/1     Running   0          15d
metrics-server-6bd9f986fc-6qlq8                              1/1     Running   0          15d
nfs-client-nfs-subdir-external-provisioner-b64b4fbf9-z6x4w   1/1     Running   0          3m22s
node-local-dns-9g2kr                                         1/1     Running   0          15d
node-local-dns-9v4dw                                         1/1     Running   0          15d
node-local-dns-pt6r8                                         1/1     Running   0          15d
node-local-dns-tgqjr                                         1/1     Running   0          15d
node-local-dns-xkzms                                         1/1     Running   0          15d

```
```bash
root@k8s-made-01-32:/softs# kubectl get sc
NAME                   PROVISIONER   RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
nfs-client (default)   nfs-client    Delete          Immediate           true                   4m8s
```



### 5.验证NFS动态存储类

#### 5.1 创建wordpress应用进行验证

 示例1：创建一个wordpress应用进行验证，其中wordpress以及mariadb引用了持久化存储  
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami

helm install wordpress bitnami/wordpress \
  --namespace=wordpress \
  --create-namespace \
  --set global.storageClass=nfs-client \
  --set wordpressUsername=admin \
  --set wordpressPassword=H6ZPTRoUsR7Ln3vQa\
  --set replicaCount=2 \
  --set service.type=NodePort \
  --set service.nodePorts.http=30808 \
  --set persistence.enabled=true \
  --set persistence.size=100Gi \
  --set volumePermissions.enabled=true \
  --set mariadb.enabled=true \
  --set mariadb.architecture=standalone \
  --set mariadb.auth.rootPassword=8GYol4rsXGm1-0oGCSqf \
  --set mariadb.auth.password=8GYol4rsXGm1-0oGCSqf \
  --set mariadb.primary.persistence.enabled=true \
  --set mariadb.primary.persistence.size=80Gi \
  --set memcached.enabled=true \
  --set wordpressConfigureCache=true

```


```bash
NAME: wordpress
LAST DEPLOYED: Fri Jun 30 11:27:15 2023
NAMESPACE: wordpress
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
CHART NAME: wordpress
CHART VERSION: 16.1.21
APP VERSION: 6.2.2

** Please be patient while the chart is being deployed **

Your WordPress site can be accessed through the following DNS name from within your cluster:

    wordpress.wordpress.svc.cluster.local (port 80)

To access your WordPress site from outside the cluster follow the steps below:

1. Get the WordPress URL by running these commands:

   export NODE_PORT=$(kubectl get --namespace wordpress -o jsonpath="{.spec.ports[0].nodePort}" services wordpress)
   export NODE_IP=$(kubectl get nodes --namespace wordpress -o jsonpath="{.items[0].status.addresses[0].address}")
   echo "WordPress URL: http://$NODE_IP:$NODE_PORT/"
   echo "WordPress Admin URL: http://$NODE_IP:$NODE_PORT/admin"

2. Open a browser and access WordPress using the obtained URL.

3. Login with the following credentials below to see your blog:

  echo Username: admin
  echo Password: $(kubectl get secret --namespace wordpress wordpress -o jsonpath="{.data.wordpress-password}" | base64 -d)
root@k8s-made-01-32:/softs# export NODE_PORT=$(kubectl get --namespace wordpress -o jsonpath="{.spec.ports[0].nodePort}" services wordpress)
root@k8s-made-01-32:/softs# export NODE_IP=$(kubectl get nodes --namespace wordpress -o jsonpath="{.items[0].status.addresses[0].address}")
root@k8s-made-01-32:/softs# echo "WordPress URL: http://$NODE_IP:$NODE_PORT/"
WordPress URL: http://10.1.0.32:30808/
root@k8s-made-01-32:/softs# echo "WordPress Admin URL: http://$NODE_IP:$NODE_PORT/admin"
WordPress Admin URL: http://10.1.0.32:30808/admin
root@k8s-made-01-32:/softs# echo Password: $(kubectl get secret --namespace wordpress wordpress -o jsonpath="{.data.wordpress-password}" | base64 -d)
Password: H6ZPTRoUsR7Ln3vQa
```



#### 5.2 查看创建的pod及service:  

```bash
root@k8s-made-01-32:/softs# kubectl -n wordpress get pods
NAME                                   READY   STATUS    RESTARTS   AGE
wordpress-5c5cc6b584-ghzwf             1/1     Running   0          40m
wordpress-5c5cc6b584-pw7n4             1/1     Running   0          40m
wordpress-mariadb-0                    1/1     Running   0          40m
wordpress-memcached-7b78d6bb5b-46275   1/1     Running   0          40m

NAME                  TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
wordpress             NodePort    10.68.2.53      <none>        80:30808/TCP,443:53657/TCP   41m
wordpress-mariadb     ClusterIP   10.68.119.215   <none>        3306/TCP                     41m
wordpress-memcached   ClusterIP   10.68.228.225   <none>        11211/TCP                    41m

```


#### 5.3 查看自动创建的pvc及pv  

```bash
root@k8s-made-01-32:/softs# kubectl -n wordpress get pvc
NAME                       STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
data-wordpress-mariadb-0   Bound    pvc-6e7c281f-945d-4cb4-aa15-7b492b6a18f3   80Gi       RWO            nfs-client     41m
wordpress                  Bound    pvc-6ac1671f-030f-4f24-960c-2dbebb6da614   100Gi      RWO            nfs-client     41m

root@k8s-made-01-32:/softs# kubectl -n wordpress get pv
NAME                                            CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                                                        STORAGECLASS   REASON   AGE
pv-nfs-client-nfs-subdir-external-provisioner   10Mi       RWO            Retain           Bound    kube-system/pvc-nfs-client-nfs-subdir-external-provisioner                           70m
pvc-6ac1671f-030f-4f24-960c-2dbebb6da614        100Gi      RWO            Delete           Bound    wordpress/wordpress                                          nfs-client              41m
pvc-6e7c281f-945d-4cb4-aa15-7b492b6a18f3        80Gi       RWO            Delete           Bound    wordpress/data-wordpress-mariadb-0                           nfs-client              41m

```


#### 5.4 验证NFS本地数据 

连接到NFS 服务器查看本地数据  

```bash
root@fileServer:/nfs-server/k8s# ll
total 16
drwxr-xr-x 4 root   root    4096 Jun 30 11:27 ./
drwxr-xr-x 3 nobody nogroup 4096 Jun 30 10:55 ../
drwxrwxrwx 3 root   root    4096 Jun 30 11:30 wordpress-data-wordpress-mariadb-0-pvc-6e7c281f-945d-4cb4-aa15-7b492b6a18f3/
drwxrwxrwx 3 root   root    4096 Jun 30 11:28 wordpress-wordpress-pvc-6ac1671f-030f-4f24-960c-2dbebb6da614/

```



#### 5.5 浏览器访问测试

浏览器访问测试wordpress应用 

![image.png](http://img.xinn.cc/1688098249213-b50f2628-671a-472d-a21e-135acbf18f09.png)


---

引用：

[kubernetes部署nfs-subdir-external-provisioner_freesharer的博客-CSDN博客](https://blog.csdn.net/networken/article/details/86697018?spm=1001.2101.3001.6650.2&utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-2-86697018-blog-120181223.235%5Ev38%5Epc_relevant_sort_base2&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-2-86697018-blog-120181223.235%5Ev38%5Epc_relevant_sort_base2&utm_relevant_index=5)

[使用 Helm Cli 将 chart 推送到 Harbor](https://zhuanlan.zhihu.com/p/585736479)
