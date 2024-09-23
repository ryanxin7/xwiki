---
author: Ryan
title: Prometheus-简介与安装
date: 2024-01-23
tags: [Prometheus,exporter]
---






## 一、Prometheus 简介
官网：https://prometheus.io/

Prometheus是基于go语言开发的一套开源的监控、报警和时间序列数据库的组合，是由SoundCloud公司开发的开源监控系统，Prometheus于201 6年加入CNCF （Cloud Native Computing Foundation,云原生计算基金会），2018年8月9日prometheus成为CNCF继kubernetes之后毕业的第二二个项目，prometheus在 容器和微服务领域中得到了广泛的应用，其特点主要如下:


```bash
使用key-value的多维度格式保存数据： Prometheus使用标签（labels）来实现多维度的数据存储，允许您更灵活地查询和过滤数据。

使用时序数据库： Prometheus使用时序数据库（TSDB）来存储和查询时间序列数据，这有助于高效地处理大量的指标数据。

支持第三方dashboard： Prometheus可以与第三方仪表板工具集成，例如Grafana，以实现更丰富和可视化的图形界面，提供用户友好的监控仪表板。

组件模块化： Prometheus的组件被设计为模块化的，这使得它易于定制和扩展，同时提高了系统的灵活性。

不依赖传统数据库： Prometheus不使用传统的关系型数据库（如MySQL），而是采用自己的时序数据库，简化了部署和维护过程。

每个采样点仅占3.5字节： Prometheus对数据的高效存储使其能够处理大规模的指标数据，同时节省存储空间。

支持服务自动化发现： Prometheus支持通过诸如Consul等方式进行服务自动发现，使得监控目标的管理更加灵活和自动化。

强大的查询语句功能（PromQL）： Prometheus Query Language（PromQL）提供了强大的查询语言，可以对时间序列数据执行灵活的查询和分析。

数据直接进行算术运算： PromQL允许用户对指标数据进行算术运算，从而更灵活地分析和汇总监控数据。

易于横向伸缩： Prometheus的架构支持横向扩展，可以通过添加更多的实例来处理更多的数据和负载。

众多官方和第三方exporter： Prometheus提供了许多官方和第三方的exporter，这些exporter负责从各种服务和系统中收集指标数据，实现了广泛的数据源覆盖。
```



### 为什么使用 Prometheus？

容器监控的实现方对比虚拟机或者物理机来说比大的区别，比如容器在k8s环境中可以任意横向扩容与缩容，那么就需要监控服务能够自动对新创建的容器进行监控，当容器删除后又能够及时的从监控服务中删除，而传统的zabbix的监控方式需要在每一个容器中安装启动agent， 并且在容器自动发现注册及模板关联方面并没有比较好的实现方式。

Prometheus 更适合监控 Kubernetes，主要是因为以下几个原因：

1. 自动服务发现：Prometheus 可以通过 Kubernetes 的服务发现机制自动发现集群中的服务，不需要手动配置监控目标，这使得在 Kubernetes 中使用 Prometheus 更加方便和易用。

2. 标签化监控：Prometheus 可以通过标签化监控来对 Kubernetes 中的不同组件进行分类和监控，例如可以对同一应用的不同实例进行分类和聚合，并提供对不同实例之间的比较和分析功能。

3. Kubernetes 监控指标：Prometheus 提供了一些特定于 Kubernetes 的监控指标，例如 kubelet、kube-proxy、kube-scheduler 等组件的监控指标，这些指标可以帮助用户更好地了解 Kubernetes 集群和应用程序的健康状况。

4. 容器化：Prometheus 是一个本身就运行在容器中的监控系统，因此它可以很好地与 Kubernetes 的容器化部署模型进行集成。

5. Kubernetes 官方推荐：Kubernetes 官方文档中推荐使用 Prometheus 进行 Kubernetes 监控，并提供了 Prometheus Operator 等工具和库，以帮助用户更轻松地在 Kubernetes 中部署和管理 Prometheus。

   

### Prometheus  组件

```bash
Prometheus Server
#主服务，接受外部HTTP请求,负责收集、存储和查询指标数据。使用PromQL进行数据查询和分析,可以配置告警规则，用于监测和通知异常情况。

Prometheus Targets
#态收集的目标服务数据,Prometheus服务器定期从这些目标中拉取指标数据。

Service Discovery
#于动态发现服务,Prometheus支持多种服务发现机制，例如Consul、Kubernetes、EC2等，使新的目标能够自动加入监控。

Prometheus Alerting
#于配置和管理告警规则。当规则匹配到异常情况时，可以触发告警通知。支持配置多种告警通知方式，如电子邮件、Slack等。

Push Gateway
#据收集代理服务器，类似于Zabbix Proxy的角色。允许短暂的服务（例如批处理作业）将指标推送到Push Gateway，而不需要直接与Prometheus Server通信。对于短暂生命周期的任务，Push Gateway可以更方便地处理指标数据。

Data Visualization and Export
#于数据可视化和导出的组件。可以使用第三方工具如Grafana连接到Prometheus，创建仪表板以实时监视和分析数据。
```





![img](http://img.xinn.cc/1200756-20220929093158606-1647337583.png)



## 二、部署 Prometheus
可以通过不同的方式安装部署prometheus监控环境，虽然以下的多种安装方式演示了不同的部署方式，但是实际生产环境只需要根据实际需求选择其中一种方式部署即可， 不过无论是使用哪一种方式安装部署的prometheus server，以后的使用都是一样的，后续的课程大部分以二进制安装环境为例，其它会做简单的对应介绍。

- apt 安装  
- docker-ompose 安装 
- 二进制安装





### 2.1 docker-compose部署Prometheus Server

https://github.com/mohamadhoseinmoradi/Docker-Compose-Prometheus-and-Grafana

![image-20240122101201441](http://img.xinn.cc/image-20240122101201441.png)



安装 docker compose

https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64



```bash
# 安装好docker后，将项目clone到本地
root@prometheus-server:~# git clone https://github.com/mohamadhoseinmoradi/Docker-Compose-Prometheus-and-Grafana.git
Cloning into 'Docker-Compose-Prometheus-and-Grafana'...
remote: Enumerating objects: 40, done.
remote: Counting objects: 100% (8/8), done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 40 (delta 1), reused 0 (delta 0), pack-reused 32
Unpacking objects: 100% (40/40), 2.90 MiB | 4.47 MiB/s, done.

# 进入目录执行
root@prometheus-server:/apps/docker-compose/Docker-Compose-Prometheus-and-Grafana-master# docker-compose up -d
[+] Running 7/7
 ✔ Container pushgateway   Running                                                                                                                      0.0s
 ✔ Container grafana       Started                                                                                                                      0.5s
 ✔ Container prometheus    Started                                                                                                                      0.6s
 ✔ Container cadvisor      Running                                                                                                                      0.0s
 ✔ Container alertmanager  Running                                                                                                                      0.0s
 ✔ Container nodeexporter  Running                                                                                                                      0.0s
 ✔ Container caddy         Started          
```

![](http://img.xinn.cc/image-20240122143521141.png)



grafana 账户密码默认是admin/admin

![image-20240122143620417](http://img.xinn.cc/image-20240122143620417.png)



### 2.2 operator 部署 Prometheus

Operator部署器是基于已经编写好的yaml文件，可以将prometheus server、alertmanager、grafana、 node-exporter等组件一键批量部署。

部署环境：在当前已有的 kubernetes 里部署



![image-20240122143823108](http://img.xinn.cc/image-20240122143823108.png)



#### 2.2.1 clone 项目并部署

https://github.com/prometheus-operator/kube-prometheus

其中这两个镜像无法下载，需要替换成国内源



**创建命名空间和 CRDs**

```bash
root@k8s-made-01-32:/softs/kube-prometheus-release-0.13# kubectl apply --server-side -f manifests/setup
customresourcedefinition.apiextensions.k8s.io/alertmanagerconfigs.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/alertmanagers.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/podmonitors.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/probes.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/prometheuses.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/prometheusagents.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/prometheusrules.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/scrapeconfigs.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/servicemonitors.monitoring.coreos.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/thanosrulers.monitoring.coreos.com serverside-applied
namespace/monitoring serverside-applied


kubectl wait \
	--for condition=Established \
	--all CustomResourceDefinition \
	--namespace=monitoring
```





```bash
#指定命名空间 "monitoring" 中的 CustomResourceDefinition (CRD) 已经达到了 "Established" 的条件。
#condition met 表示指定的条件已经被满足，资源处于期望的状态
root@k8s-made-01-32:/softs/kube-prometheus-release-0.13# kubectl wait \
> --for condition=Established \
> --all CustomResourceDefinition \
> --namespace=monitoring
customresourcedefinition.apiextensions.k8s.io/alertmanagerconfigs.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/alertmanagers.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/certificaterequests.cert-manager.io condition met
customresourcedefinition.apiextensions.k8s.io/certificates.cert-manager.io condition met
customresourcedefinition.apiextensions.k8s.io/challenges.acme.cert-manager.io condition met
customresourcedefinition.apiextensions.k8s.io/clusterissuers.cert-manager.io condition met
customresourcedefinition.apiextensions.k8s.io/issuers.cert-manager.io condition met
customresourcedefinition.apiextensions.k8s.io/orders.acme.cert-manager.io condition met
customresourcedefinition.apiextensions.k8s.io/podmonitors.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/probes.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/prometheusagents.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/prometheuses.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/prometheusrules.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/scrapeconfigs.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/servicemonitors.monitoring.coreos.com condition met
customresourcedefinition.apiextensions.k8s.io/thanosrulers.monitoring.coreos.com condition met
```



替换镜像

```bash
root@k8s-made-01-32:/softs/kube-prometheus-release-0.13/manifests# grep "registry.k8s.io" ./ -R
./kubeStateMetrics-deployment.yaml:        image: registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.9.2
./prometheusAdapter-deployment.yaml:        image: registry.k8s.io/prometheus-adapter/prometheus-adapter:v0.11.1
```







```bash
# 执行构建
kubectl apply -f manifests/
```



#### 2.2.2 验证 Pod 状态

![image-20240123153007196](http://img.xinn.cc/image-20240123153007196.png)

```bash
root@k8s-made-01-32:~# kubectl get pod -n monitoring
NAME                                   READY   STATUS    RESTARTS   AGE
alertmanager-main-0                    2/2     Running   0          20s
blackbox-exporter-59dddb7bb6-582fm     3/3     Running   0          25s
grafana-79f47474f7-r2qb8               1/1     Running   0          24s
kube-state-metrics-744f9b758f-8lrkz    3/3     Running   0          23s
node-exporter-594n4                    2/2     Running   0          23s
node-exporter-5wvgg                    2/2     Running   0          23s
node-exporter-7plwc                    2/2     Running   0          23s
node-exporter-ldzrk                    2/2     Running   0          23s
node-exporter-rjgc6                    2/2     Running   0          23s
prometheus-adapter-69c6c87f9b-m9v2x    1/1     Running   0          22s
prometheus-adapter-69c6c87f9b-qc6t2    1/1     Running   0          22s
prometheus-k8s-0                       2/2     Running   0          18s
prometheus-k8s-1                       2/2     Running   0          18s
prometheus-operator-57cf88fbcb-m2mc7   2/2     Running   0          22s
root@k8s-made-01-32:~# kubectl get statefulsets.apps -n monitoring
NAME                READY   AGE
alertmanager-main   1/1     32s
prometheus-k8s      2/2     30s
```





维护 Prometheus 和 grafana 的配置文件

后期运维主要是维护 Prometheus 和 grafana 的配置文件它们通过 configmap 形式挂载到 kubernetes 里，所以要修改配置就是编辑 configmap

![image-20240123165304463](http://img.xinn.cc/image-20240123165304463.png)



#### 2.2.3 从外部访问 Prometheus

##### 2.2.3.1 暴露端口

没有暴露端口，所以无法从外部访门 Prometheus

![image-20240123165423326](http://img.xinn.cc/image-20240123165423326.png)



编辑配置：`/root/kube-prometheus/manifests/prometheus-service.yaml`

![image-20240123170319474](http://img.xinn.cc/image-20240123170319474.png)

```yaml
spec:
  type: NodePort #新增
  ports:
  - name: web
    port: 9090
    targetPort: web
    nodePort: 39090 # 新增
```

同理，想要从外部访问 grafana ，也要将端口暴露出来，修改这个文件：`/root/kube-prometheus/manifests/grafana-service.yaml`

![image-20240123165947468](http://img.xinn.cc/image-20240123165947468.png)



##### 2.2.3.2 修改 NetworkPolicy

上文将端口暴露出来后依然无法从外部访问，那是因为加了 NetworkPolicy ，我们将关于 Prometheus 和 grafana 的 networkpolicy 删除：

![image-20240123170047904](http://img.xinn.cc/image-20240123170047904.png)

![image-20240123170146894](http://img.xinn.cc/image-20240123170146894.png)

![image-20240123170402356](http://img.xinn.cc/image-20240123170402356.png)

之后就能从外部访问了：

![image-20240123170905441](http://img.xinn.cc/image-20240123170905441.png)



![image-20240123171046830](http://img.xinn.cc/image-20240123171046830.png)



### 2.3 二进制部署 Prometheus Server



![preview](http://img.xinn.cc/view)

二进制从官网下载：[Download | Prometheus](https://prometheus.io/download/#prometheus)

#### 2.3.1 解压二进制

https://github.com/prometheus/prometheus/releases/download/v2.37.6/prometheus-2.37.6.linux-amd64.tar.gz

```bash
root@promethues-server:~# tar xf prometheus-2.37.6.linux-amd64.tar.gz
root@promethues-server:~# mkdir /apps
root@promethues-server:~# mv  prometheus-2.37.6.linux-amd64 /apps/
root@promethues-server:/apps# ln -s prometheus-2.37.6.linux-amd64/ /apps/prometheus
root@promethues-server:/apps/prometheus# ll
total 208932
drwxr-xr-x 4 1001  123      4096 Feb 20  2023 ./
drwxr-xr-x 3 root root      4096 Jan 24 09:03 ../
-rw-r--r-- 1 1001  123     11357 Feb 20  2023 LICENSE
-rw-r--r-- 1 1001  123      3773 Feb 20  2023 NOTICE
drwxr-xr-x 2 1001  123      4096 Feb 20  2023 console_libraries/
drwxr-xr-x 2 1001  123      4096 Feb 20  2023 consoles/
-rwxr-xr-x 1 1001  123 111052375 Feb 20  2023 prometheus*      # prometheus服务可执行程序
-rw-r--r-- 1 1001  123       934 Feb 20  2023 prometheus.yml   # prometheus配置文件
-rwxr-xr-x 1 1001  123 102850693 Feb 20  2023 promtool*        


# 测试工具，用于检查配置prometheus配置文件、检测metrics数据等
root@promethues-server:/apps/prometheus# ./promtool check config prometheus.yml
Checking prometheus.yml
 SUCCESS: prometheus.yml is valid prometheus config file syntax
```

#### 2.3.2 创建prometheus service启动脚本

```bash
# 该选项类似 nginx 的 reload，当启用该选项时，Prometheus允许您通过HTTP请求执行优雅关闭或重新加载其配置。
./prometheus --help | grep "enable-lifecycle"
      --web.enable-lifecycle     Enable shutdown and reload via HTTP request.
```

```bash
vim /etc/systemd/system/prometheus.service

[Unit]
Description=Prometheus Server
Documentation=https://prometheus.io/docs/introduction/overview/
After=network.target

[Service]
Restart=on-failure
WorkingDirectory=/apps/prometheus/
ExecStart=/apps/prometheus/prometheus --config.file=/apps/prometheus/prometheus.yml --web.enable-lifecycle

[Install]
WantedBy=multi-user.target
```



#### 2.3.3 配置时间同步

```bash
timedatectl set-timezone Asia/Shanghai
apt install chrony
```





#### 2.3.4 启动 prometheus 服务

```bash
root@promethues-server:/apps/prometheus# systemctl restart prometheus.service &&                                                   systemctl enable prometheus.service
Created symlink /etc/systemd/system/multi-user.target.wants/prometheus.service →                                                        /etc/systemd/system/prometheus.service.
```



#### 2.3.5 验证web界面

![image-20240124173131467](http://img.xinn.cc/image-20240124173131467.png)

#### 2.3.6 动态（热）加载配置

```bash
root@promethues-server:/apps/prometheus# vim /etc/systemd/system/prometheus.service
--web.enable-lifecycle

root@promethues-server:/apps/prometheus# systemctl daemon-reload && systemctl restart prometheus.service

root@promethues-server:/apps/prometheus# curl -X POST http://192.168.29.71:9090/-/reload
```





### 2.4 二进制安装node-exporter

k8s各node节点使用二进制或者daemonset方式安装node_ exporter，用于收集各k8s node节点宿主机的监控指标数据，默认监听端口为9100。



![img](http://img.xinn.cc/1394626-20230608155048421-817186731.png)



#### 2.4.1 解压二进制程序

下载地址：[Download | Prometheus](https://prometheus.io/download/#node_exporter)

```bash
root@k8s-made-01-32:/softs# tar xf node_exporter-1.5.0.linux-amd64.tar.gz
root@k8s-made-01-32:/softs/node_exporter-1.5.0.linux-amd64# mkdir /apps
root@k8s-made-01-32:/apps# mv /softs/node_exporter-1.5.0.linux-amd64/ ./
root@k8s-made-01-32:/apps# ln -sv node_exporter-1.5.0.linux-amd64/ /apps/node_exporter
'/apps/node_exporter' -> 'node_exporter-1.5.0.linux-amd64/'
root@k8s-made-01-32:/apps#
root@k8s-made-01-32:/apps# ls node_exporter
LICENSE  node_exporter  NOTICE
```





#### 2.4.2 创建node-exporter service启动文件

```bash
root@node01:/apps# vim /etc/systemd/system/node-exporter.service

[Unit]
Description=Prometheus Node Exporter
After=network.target

[Service]
ExecStart=/apps/node_exporter/node_exporter

[Install]
WantedBy=multi-user.target
```



#### 2.4.3 启动node exporter服务

```bash
# 默认监听在9100端口
root@k8s-made-01-32:/apps# ./node_exporter/node_exporter --help | grep 9100
      --web.listen-address=:9100 ...
```

```bash
root@k8s-made-01-32:/apps# systemctl daemon-reload && systemctl restart node-exporter.service && systemctl enable node-exporter.service
Created symlink /etc/systemd/system/multi-user.target.wants/node-exporter.servic                                                                             e → /etc/systemd/system/node-exporter.service.
root@k8s-made-01-32:/apps#
root@k8s-made-01-32:/apps#
root@k8s-made-01-32:/apps# systemctl status node-exporter.service
● node-exporter.service - Prometheus Node Exporter
     Loaded: loaded (/etc/systemd/system/node-exporter.service; enabled; vendor>
     Active: active (running) since Thu 2024-01-25 10:11:35 CST; 11s ago
   Main PID: 495132 (node_exporter)
      Tasks: 6 (limit: 19101)
     Memory: 3.0M
     CGroup: /system.slice/node-exporter.service
             └─495132 /apps/node_exporter/node_exporter

Jan 25 10:11:35 k8s-made-01-32 node_exporter[495132]: ts=2024-01-25T02:11:35.06>
Jan 25 10:11:35 k8s-made-01-32 node_exporter[495132]: ts=2024-01-25T02:11:35.06>
Jan 25 10:11:35 k8s-made-01-32 node_exporter[495132]: ts=2024-01-25T02:11:35.06>
Jan 25 10:11:35 k8s-made-01-32 node_exporter[495132]: ts=2024-01-25T02:11:35.06>
Jan 25 10:11:35 k8s-made-01-32 node_exporter[495132]: ts=2024-01-25T02:11:35.06>
```



#### 2.4.4 验证web页面

![image-20240125101239529](http://img.xinn.cc/image-20240125101239529.png)





#### 2.4.5 node-exporter指标数据
[4.5.2. kubernetes-cadvisor — 新溪-gordon V1.7.0 documentation (zhaoweiguo.com)](https://knowledge.zhaoweiguo.com/build/html/cloudnative/prometheus/metrics/kubernetes-cadvisor.html)

```bash
root@promethues-server:~# curl 10.1.0.32:9100/metrics

常见指标：
node_boot_time: 系统自启动以后的总结时间
node_cpu：系统CPU使用量
node_disk*：磁盘IO
node_filesystem*: 系统文件系统用量
node_load1: 系统CPU负载
node_memeory*: 内存使用量
node_network*:网络带宽指标
node_time: 当前系统时间
go_*: node exporter中go相关指标
process_ *: node exporter 自身进程相关运行指标
```

至此node节点（10.1.0.32）已经安装了node-exporter，将另外一个node节点（10.1.0.33）也安装node-exporter。



### 2.5 配置prometheus server收集node-exporter指标数据

部署好prometheus server后，它只收集了自身的指标数据，那么怎么让它也收集node-exporter指标数据？

![image-20240125102939550](http://img.xinn.cc/image-20240125102939550.png)

#### 2.5.1 prometheus 默认配置文件

```bash
root@prometheus02:/apps# vim /apps/prometheus/prometheus.yml 

# my global config
global:
  scrape_interval: 15s # 数据收集间隔时间，如果不配置默认为一分钟
  evaluation_interval: 15s # 规则扫描间隔时间，如果不配置默认为一分钟
  # scrape_timeout is set to the global default (10s).

# Alertmanager configuration
alerting:  # 报警通知配置
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:  # 规则配置
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:  # 数据采集目标配置
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: "prometheus"

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
      - targets: ["localhost:9090"]
```

#### 2.5.2 添加 node节点数据收集

```bash
root@promethues-server:~# vim /apps/prometheus/prometheus.yml
# 末尾添加
  - job_name: "prometheus-k8s-node"
    static_configs:
      - targets: ["10.1.0.35:9100","10.1.0.34:9100","10.1.0.37:9100"]
```

#### 2.5.3 动态加载配置并验证prometheus server状态

```bash
root@promethues-server:~# curl -X POST http://192.168.29.71:9090/-/reload
```



![image-20240125103817173](http://img.xinn.cc/image-20240125103817173.png)

已经接收到数据了





### 2.6 安装 blackbox exporter 

https://prometheus.io/download/#blackbox_exporter

`blackbox_exporter` 是由 Prometheus 社区提供的一个官方 exporter，用于进行对端点的黑盒探测。它主要通过执行各种网络层协议（HTTP、HTTPS、DNS、TCP、ICMP等）来监控和收集有关被监控节点的数据。

```bash
HTTP(S) 监控： 通过发送 HTTP 或 HTTPS 请求并检查响应的方式来监控服务的可用性和性能。
DNS 监控： 通过 DNS 查询检查域名解析的状态和响应时间。
TCP 监控： 建立 TCP 连接并检查端口的可用性。
ICMP 监控： 使用 ICMP Echo 请求（类似于 Ping）来检查主机的可达性。
```



#### 2.6.1 下载二进制包

```bash
wget  https://github.com/prometheus/blackbox_exporter/releases/download/v0.19.0/blackbox_exporter-0.19.0.linux-amd64.tar.gz
```



#### 2.6.2 准备配置文件

```bash
vim /etc/systemd/system/blackbox-exporter.service
[Unit]
Description=Prometheus Blackbox Exporter
After=network.target


[Service]
Type=simple
User=root
Group=root
ExecStart=/apps/blackbox_exporter \
    --config.file=/apps/blackbox_exporter/blackbox.yml \
    --web.listen-address=:9115
Restart=on-failure

[Install]
WantedBy=multi-user.target

```

#### 2.6.3 启动服务

```bash
root@promethues-server:/apps# systemctl daemon-reload && systemctl restart blackbox-exporter.service && systemctl enable blackbox-exporter.service
```



#### 2.6.4 查看服务状态

```bash
root@promethues-server:/apps# systemctl status blackbox-exporter.service
● blackbox-exporter.service - Prometheus Blackbox Exporter
   Loaded: loaded (/etc/systemd/system/blackbox-exporter.service; enabled; vendor preset: enabled)
   Active: active (running) since Thu 2024-01-25 16:23:55 CST; 4s ago
 Main PID: 55495 (blackbox_export)
    Tasks: 9 (limit: 4629)
   CGroup: /system.slice/blackbox-exporter.service
           └─55495 /apps/blackbox_exporter/blackbox_exporter --config.file=/apps/blackbox_exporter/blackbox.yml --web.listen-address=:9115

Jan 25 16:23:55 promethues-server systemd[1]: Started Prometheus Blackbox Exporter.
Jan 25 16:23:55 promethues-server blackbox_exporter[55495]: level=info ts=2024-01-25T08:23:55.048Z caller=main.go:224 msg="Starting blackbox_exporter" versio
Jan 25 16:23:55 promethues-server blackbox_exporter[55495]: level=info ts=2024-01-25T08:23:55.049Z caller=main.go:225 build_context="(go=go1.16.4, user=root@
Jan 25 16:23:55 promethues-server blackbox_exporter[55495]: level=info ts=2024-01-25T08:23:55.049Z caller=main.go:237 msg="Loaded config file"
Jan 25 16:23:55 promethues-server blackbox_exporter[55495]: level=info ts=2024-01-25T08:23:55.049Z caller=main.go:385 msg="Listening on address" address=:911
Jan 25 16:23:55 promethues-server blackbox_exporter[55495]: level=info ts=2024-01-25T08:23:55.050Z caller=tls_config.go:191 msg="TLS is disabled." http2=fals
```





验证 web 界面

![image-20240125162525774](http://img.xinn.cc/image-20240125162525774.png)

### 2.7 blackbox exporter 实现URL监控

prometheus 调用 blackbox exporter 实现对 URL/ICMP 的监控。

需要指定 `blackbox_exporter` 对哪些目标执行探测，以及如何执行这些探测。通常通过 Prometheus 的 `scrape_configs` 配置中的 `static_configs` 或 `file_sd_configs` 来完成。在这些配置中定义了被监控节点的地址、端口、以及要执行的探测类型等信息。



- `scrape_configs` 是主要的抓取目标配置部分，可以包含多个作业，每个作业可以包含多个抓取目标。
- `relabel_configs` 用于在运行时修改或处理目标标签，它通常与 `scrape_configs` 结合使用。
- `file_sd_configs` 允许从文件中动态发现抓取目标，这提供了一种自动发现服务实例的机制。
- `static_configs` 用于静态地定义抓取目标，适用于不经常变化的目标。



#### 2.7.1 URL 监控配置  

```bash
vim /apps/prometheus/prometheus.yml
   # 网站监控
  - job_name: 'http_status'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets: ['https://www.rmxc.com.cn']
        labels:
          instance: http_status
          group: web
    relabel_configs:
      - source_labels: [__address__] #从原始的标签 __address__ 中提取值。
        target_label: __param_target #将提取的值放入新标签 __param_target 中。
      - source_labels: [__param_target] #从新的标签 __param_target 中提取值。
        target_label: url #将提取的值放入新的标签 url 中
      - target_label: __address__ #将目标地址的值放回原始标签 __address__ 中。
        replacement: 192.168.29.71:9115
```



**验证 Prometheus 配置文件的语法**

```bash
/apps/prometheus/promtool check config /apps/prometheus/prometheus.yml
Checking /apps/prometheus/prometheus.yml
 SUCCESS: /apps/prometheus/prometheus.yml is valid prometheus config file syntax
```



**重启Prometheus服务生效**

```bash
root@promethues-server:/apps# curl -X POST http://192.168.29.71:9090/-/reload
```





#### 2.7.2 prometheus 验证数据

![image-20240125170258048](http://img.xinn.cc/image-20240125170258048.png)





#### 2.7.3 blackbox exporter 界面验证数据

![image-20240125171155160](http://img.xinn.cc/image-20240125171155160.png)









### 2.8 blackbox exporter 实现ICMP监控

```bash
   # ping 检测
  - job_name: 'ping_status'
    metrics_path: /probe
    params:
      module: [icmp]
    static_configs:
      - targets: ['10.1.0.32']
        labels:
          instance: 'ping_status'
          group: 'icmp'
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: ping
      - target_label: __address__
        replacement: 192.168.29.71:9115
```





**验证 Prometheus 配置文件的语法**

```bash
/apps/prometheus/promtool check config /apps/prometheus/prometheus.yml
Checking /apps/prometheus/prometheus.yml
 SUCCESS: /apps/prometheus/prometheus.yml is valid prometheus config file syntax
```





#### 2.8.1 验证数据



![image-20240125170258048](http://img.xinn.cc/image-20240125170258048.png)



#### 2.8.2 blackbox exporter 界面验证数据

![image-20240125171155160](http://img.xinn.cc/image-20240125171155160.png)







### 2.9 blackbox exporter 实现端口监控



```bash
   # 端口监控
  - job_name: 'port_status'
    metrics_path: /probe
    params:
      module: [tcp_connect]
    static_configs:
      - targets: ['110.242.68.3:80']
        labels:
          instance: 'port_status'
          group: 'port'
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: port
      - target_label: __address__
        replacement: 192.168.29.71:9115
```







**验证 Prometheus 配置文件的语法**

```bash
/apps/prometheus/promtool check config /apps/prometheus/prometheus.yml
Checking /apps/prometheus/prometheus.yml
 SUCCESS: /apps/prometheus/prometheus.yml is valid prometheus config file syntax
```





#### 2.9.1 验证数据

![image-20240125170258048](http://img.xinn.cc/image-20240125170258048.png)



#### 2.9.2 blackbox exporter 界面验证数据



![image-20240125171155160](http://img.xinn.cc/image-20240125171155160.png)

