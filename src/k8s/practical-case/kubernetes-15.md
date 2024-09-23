---
author: Ryan
title: 15.K8S集群证书更新
date: 2023-02-17
---


## 更新证书

为了更新的安全性，更新之前可以将所有 Master 节点的配置目录做一个备份：

```bash
cp -r /etc/kubernetes /etc/kubernetes_$(date +%F)
cp -r /var/lib/etcd /var/lib/etcd_$(date +%F)
```



**通过执行证书更新命令查看：**

```bash
kubeadm certs renew --help
```



**可以看到证书更新是支持更新指定服务的证书，也可以更新单个服务的证书，但都是集群服务的证书。**

```bash
# 所有 Master 节点更新所有证书
kubeadm certs renew all
```

![](http://img.xinn.cc/824941-20221010172857637-35455519.png)

可以看到提示让重启 `kube-apiserver`, `kube-controller-manager`, `kube-scheduler` 和 `etcd` 服务证书才能生效。



**重启组件脚本**

```bash
#重启组件
for i in $(kubectl get pods -A | grep -E "etcd|kube-apiserver|kube-controller-manager|kube-scheduler" | awk '{print $2}');do
    kubectl delete pod $i -n kube-system
    sleep 3
done

#重启服务
systemctl restart kubelet
systemctl restart containerd
```



**查看组件运行情况**

```bash
kubectl get pods -A | grep -E "etcd|kube-apiserver|kube-controller-manager|kube-scheduler"
kube-system     etcd-tj-master-01                                             1/1     Running   32         15m
kube-system     kube-apiserver-tj-master-01                                   1/1     Running   39         15m
kube-system     kube-controller-manager-tj-master-01                          1/1     Running   163        15m
kube-system     kube-scheduler-tj-master-01   
```



**可以看到证书时间已经更新**

![](http://img.xinn.cc/1684504977403-0ce1a21d-265c-40b2-9d22-465fafc66a5a.png)



同时，由于在初始化 Master 集群的时候采用的是设置环境变量 `export KUBECONFIG=/etc/kubernetes/admin.conf` 的方法，不需要再更新该文件。如果不是该方法，还需要使用新的 `admin.conf` 替换掉复制的 `/root/.kube/config` 配置文件。



```sh
cp /etc/kubernetes/admin.conf /root/.kube/config
```





**重启containerd 运行镜像**

![](http://img.xinn.cc/image-20230515164716199.png)

```bash
crictl stop 9731cb9e5b723
crictl stop 977896873866e
crictl stop 24430601db1d1
crictl stop 7a7bad1c7dd70
```



**重启后,查看相关日志**



![](http://img.xinn.cc/image-20230515164818560.png)



