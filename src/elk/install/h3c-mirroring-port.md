---
author: Ryan
title: H3C-7506E核心交换机数据引流
date: 2021-09-29
categories: ElasticStack
---


# 核心交换机数据引流



### 镜像源 

镜像源是指被监控的对象，该对象可以是端口或单板上的 CPU，我们将之依次称为源端口和源 CPU。 经由被监控的对象收发的报文会被复制一份到与数据监测设备相连的端口，用户就可以对这些报文 （称为镜像报文）进行监控和分析了。镜像源所在的设备就称为源设备。 



### 镜像目的

 镜像目的是指镜像报文所要到达的目的地，即与数据监测设备相连的那个端口，我们称之为目的端口，目的端口所在的设备就称为目的设备。目的端口会将镜像报文转发给与之相连的数据监测设备。 由于一个目的端口可以同时监控多个镜像源，因此在某些组网环境下，目的端口可能收到对同一报 文的多份拷贝。例如，目的端口 Port 1 同时监控同一台设备上的源端口 Port 2 和 Port 3 收发的报文， 如果某报文从 Port 2 进入该设备后又从 Port 3 发送出去，那么该报文将被复制两次给 Port 1。 



### 镜像方向 

镜像方向是指在镜像源上可复制哪些方向的报文： 

- 入方向：是指仅复制镜像源收到的报文。 
- 出方向：是指仅复制镜像源发出的报文。 
- 双向：是指对镜像源收到和发出的报文都进行复制。



### 镜像组 

镜像组是一个逻辑上的概念，镜像源和镜像目的都要属于某一个镜像组。根据具体的实现方式不同， 镜像组可分为本地镜像组、远程源镜像组和远程目的镜像组三类。



### 反射端口、出端口和远程镜像VLAN 

反射端口、出端口和远程镜像VLAN都是在二层远程端口镜像的实现过程中用到的概念。远程镜像 VLAN是将镜像报文从源设备传送至目的设备的专用VLAN；反射端口和出端口都位于源设备上，都 用来将镜像报文发送到远程镜像VLAN中。



###  端口镜像的分类和实现方式

根据镜像源与镜像目的是否位于同一台设备上，可以将端口镜像分为本地端口镜像和远程端口镜像 两大类。 

1. 本地端口镜像 当源设备与数据监测设备直接相连时，源设备可以同时作为目的设备，即由本设备将镜像报文转发 至数据检测设备，这种方式实现的端口镜像称为本地端口镜像。对于本地端口镜像，镜像源和镜像 目的属于同一台设备上的同一个镜像组，该镜像组称为本地镜像组。

2. 远程端口镜像 当源设备与数据监测设备不直接相连时，与数据监测设备直接相连的设备作为目的设备，源设备需 要将镜像报文复制一份至目的设备，然后由目的设备将镜像报文转发至数据监测设备，这种方式实 现的端口镜像称为远程端口镜像。对于远程端口镜像，镜像源和镜像目的分属于不同设备上的不同 镜像组：镜像源所在的镜像组称为远程源镜像组，镜像目的所在的镜像组称为远程目的镜像组，而 位于源设备与目的设备之间的设备则统称为中间设备。 

根据源设备与目的设备之间的连接关系，又可将远程端口镜像细分为：

 • 二层远程端口镜像：源设备与目的设备之间通过二层网络进行连接。

 • 三层远程端口镜像：源设备与目的设备之间通过三层网络进行连接。 



### 二层远程端口镜像 

二层远程端口镜像的实现方式包括：反射端口方式和出端口方式。 

• **反射端口方式**：

源设备将进入源端口（或源 CPU）的报文复制一份给反射端口，再由该端口 将镜像报文在远程镜像 VLAN 中广播，最终镜像报文经由中间设备转发至目的设备。目的设 1-3  备收到该报文后判别其 VLAN ID，若与远程镜像 VLAN 的 VLAN ID 相同，就将镜像报文通过 目的端口转发给数据监测设备。过程如下图所示。

![反射端口方式](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211229142927190.png)

- **出端口方式**：

  源设备将进入源端口（或源 CPU）的报文复制一份给出端口，该端口将镜像报 文转发给中间设备，再由中间设备在远程镜像 VLAN 中广播，最终到达目的设备。目的设备 收到该报文后判别其 VLAN ID，若与远程镜像 VLAN 的 VLAN ID 相同，就将镜像报文通过目 的端口转发给数据监测设备。过程如下图所示。

![出端口方式](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211229143016134.png)





### 配置实战

现有两套态势感知设备需要接入内部网络，需要将办公网、内外网业务流量进行收集汇总后将流量复制一份到与态势感知设备。

**对接设备**：

- H3C框式 核心交换机

- 奇安信 天眼新一代威胁感知系统
- 深信服 安全感知平台SIP





#### 核心交换机配置

**本地端口镜像方式**

```sh
mirroring-group 1 local
mirroring-group 1 mirroring-port g1/1/0/1 to g1/1/0/8 both
mirroring-group 1 monitor-port g1/1/0/10

//引g1/1/0/1到8口的流量到 g1/1/0/10
dis mirroring-group all
Mirroring group 1:
    Type: local
    Status: Active
    Mirroring port:
        GigabitEthernet1/1/0/1  Both
        GigabitEthernet1/1/0/2  Both
        GigabitEthernet1/1/0/3  Both
        GigabitEthernet1/1/0/4  Both
        GigabitEthernet1/1/0/5  Both
        GigabitEthernet1/1/0/6  Both
        GigabitEthernet1/1/0/7  Both
        GigabitEthernet1/1/0/8  Both
    Monitor-port: GigabitEthernet1/1/0/10
```



**远程端口镜像方式**

```sh
mirroring-group 2 remote-source
mirroring-group 2 mirroring-port g2/2/0/1 to g2/2/0/8 both
mirroring-group 2 reflector-port g2/2/0/10  //反射端口
vlan 130   //镜像数据广播VLAN
port g2/2/0/11 to g2/2/0/12  //审计设备互联接口
mirroring-group 2 remote-probe vlan 130

dis mirroring-group all
Mirroring group 1:
    Type: Remote source
    Status: Active
    Mirroring port:
        GigabitEthernet2/2/0/1  Both
        GigabitEthernet2/2/0/2  Both
        GigabitEthernet2/2/0/3  Both
        GigabitEthernet2/2/0/4  Both
        GigabitEthernet2/2/0/5  Both
        GigabitEthernet2/2/0/6  Both
        GigabitEthernet2/2/0/7  Both
        GigabitEthernet2/2/0/8  Both
    Reflector port: GigabitEthernet1/4/0/10
    Remote probe VLAN: 130
```





#### 设备接口调整

![安全感知平台SIP](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211229152453185.png)



![天眼新一代威胁感知系统](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211229152552258.png)



### 效果验证

数据成功引入

![镜像流量](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211229153923313.png)

