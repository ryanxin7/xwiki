---
author: Ryan
title: Grafana 简介与安装
date: 2024-01-25
tags: [Grafana]
categories: Prometheus
---



## 简介

Grafana 是一个流行的开源可视化工具，用于创建和分享动态仪表板。它可以集成多种数据源，包括 Prometheus、MySQL、InfluxDB、Elasticsearch 等，允许用户通过创建仪表板来实时监控和可视化数据。

- 
  多数据源支持： Grafana 支持多种数据源，可以从不同类型的数据库中获取数据。Prometheus 是一个常见的数据源，用于监控和报警，但你还可以连接到其他数据库，如 MySQL、InfluxDB 等。

- 可视化仪表板： Grafana 提供了丰富的可视化选项，包括折线图、柱状图、表格、仪表盘等。用户可以根据需要定制图表，使其更具信息价值。

- 灵活的查询语言： Grafana 具有强大的查询语言，允许用户以灵活的方式从数据源中检索信息。对于 Prometheus 数据源，你可以使用 PromQL（Prometheus Query Language）。

- 警报和通知： Grafana 具有内置的警报和通知功能，可以根据定义的规则对仪表板上的数据进行监控，并在满足特定条件时发送通知。

- 社区支持和插件： 由于其广泛的用户基础，Grafana 有一个庞大的社区，用户可以分享和下载仪表板模板，以及安装各种插件扩展功能。

https://grafana.com/docs/# 官方文档






##  1.部署 Grafana

grafana是一个可视化组件，用于接收客户端浏览器的请求并连接到prometheus查询数据，最后经过渲染并在浏览器进行体系化显示，需要注意的是，grafana查询数据类似于zabbix-样需要自定义模板,模板可以手动制作也可以导入已有模板。

下载：[Download Grafana | Grafana Labs](https://grafana.com/grafana/download?pg=get&plcmt=selfmanaged-box1-cta1)

模板：[Dashboards | Grafana Labs](https://grafana.com/grafana/dashboards/)

插件：[Grafana Plugins - extend and customize your Grafana | Grafana Labs](https://grafana.com/grafana/plugins/)


![](https://cdn1.ryanxin.live/1695797621991)

### 1.1 安装 grafana server

下载地址：[Download Grafana | Grafana Labs](https://grafana.com/grafana/download)

安装文档：[Install Grafana | Grafana documentation](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)

部署环境：可以和 Prometheus Server 安装在一起，也可以分开安装（网络互通即可）。

![image-20240125104222583](https://cdn1.ryanxin.live/image-20240125104222583.png)


```bash
root@promethues-server:~# apt-get install -y adduser libfontconfig1
root@prometheus-server:~# dpkg -i grafana-enterprise_9.4.3_amd64.deb
```

### 1.2 grafana server 配置文件

路径：`/etc/grafana/grafana.ini`

```bash
[server]
# Protocol (http, https, h2, socket)
protocol = http

# The ip address to bind to, empty will bind to all interfaces
http_addr = 0.0.0.0

# The http port  to use
http_port = 3000
```

### 1.3 启动 grafana

```bash
root@prometheus-server:~# systemctl restart grafana-server.service && systemctl enable grafana-server.service 
Synchronizing state of grafana-server.service with SysV service script with /lib/systemd/systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable grafana-server
Created symlink /etc/systemd/system/multi-user.target.wants/grafana-server.service → /lib/systemd/system/grafana-server.service.
root@prometheus-server:~# ss -anptl | grep 3000
LISTEN    0         4096                     *:3000                   *:*        users:(("grafana",pid=136786,fd=11))                                           
```



### 1.4 验证 web 界面

默认账户密码：admin/admin

![image-20240125110130210](https://cdn1.ryanxin.live/image-20240125110130210.png)

### 1.5 添加 Prometheus 数据源

进入主界面后，点击左下角的设置，选择 “ Data sources”，再选择 Prometheus。

![image-20240125110238982](https://cdn1.ryanxin.live/image-20240125110238982.png)

![image-20240125110448889](https://cdn1.ryanxin.live/image-20240125110448889.png)

![image-20240125110516029](https://cdn1.ryanxin.live/image-20240125110516029.png)

检查与Prometheus能否连通







### 1.6 导入node exporter模板 

模板仓库：[Dashboards | Grafana Labs](https://grafana.com/grafana/dashboards/)

推荐使用：[1 Node Exporter for Prometheus Dashboard EN 20201010 | Grafana Labs](https://grafana.com/grafana/dashboards/11074-node-exporter-for-prometheus-dashboard-en-v20201010/)

![image-20240125110610473](https://cdn1.ryanxin.live/image-20240125110610473.png)



点击 Import

![image-20240125110646728](https://cdn1.ryanxin.live/image-20240125110646728.png)

输入模板ID

![image-20240125110720638](https://cdn1.ryanxin.live/image-20240125110720638.png)

选择数据源

![image-20240125110811133](https://cdn1.ryanxin.live/image-20240125110811133.png)

验证模板图形信息

![image-20240125110902165](https://cdn1.ryanxin.live/image-20240125110902165.png)





### 1.7 导入 blackbox exporter模板

模板-9719

![image-20240126161618929](https://cdn1.ryanxin.live/image-20240126161618929.png)

![image-20240126161710803](https://cdn1.ryanxin.live/image-20240126161710803.png)



![image-20240126161755092](https://cdn1.ryanxin.live/image-20240126161755092.png)



### 1.7 插件管理

插件仓库：[Grafana Plugins - extend and customize your Grafana | Grafana Labs](https://grafana.com/grafana/plugins/)

本例安装饼图插件：

插件保存目录：`/var/lib/grafana/plugins`

```bash
# 在线安装
root@prometheus-server:~# grafana-cli plugins install grafana-piechart-panel
✔ Downloaded and extracted grafana-piechart-panel v1.6.4 zip successfully to /var/lib/grafana/plugins/grafana-piechart-panel

Please restart Grafana after installing plugins. Refer to Grafana documentation for instructions if necessary.
```



```bash
# 离线安装
wget -nv https://grafana.com/api/plugins/grafana-piechart-panel/versions/latest/download -O /tmp/grafana-piechart-panel.zip
unzip -q /tmp/grafana-piechart-panel.zip -d /tmp
mv /tmp/grafana-piechart-panel-* /var/lib/grafana/plugins/grafana-piechart-panel
sudo service grafana-server restart
```

```bash
# 您可以将此repo直接克隆到插件目录中。然后重新启动grafana服务器，插件将被自动检测并使用。
git clone https://github.com/grafana/piechart-panel.git --branch release-1.6.2
sudo service grafana-server restart
```

![image-20230303143432271](https://cdn1.ryanxin.live/6996b9be22c66525cd2f1f47cf5db669.png)







