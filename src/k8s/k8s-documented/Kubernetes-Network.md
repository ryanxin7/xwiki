---
author: Ryan
title: kubernetes 中的网络实现方式
date: 2024-01-08
---





## 1.kubernetes 网络通信方案简介

Kubernetes 的网络涉及到各种 Pod 之间的通信以及 Pod 与外部网络的连接。而 Kubernetes 的网络实现通常依赖于第三方网络插件，这些插件需要遵循一定的规范，其中最为常见和广泛支持的规范之一就是 CNI（Container Network Interface）。

CNI 是由 CoreOS 和 Google 联合制定的规范，旨在定义容器运行时和网络插件之间的标准接口。这个标准定义了插件应该如何配置网络，并提供了一种统一的方法来实现容器网络的连接和管理。

[CNI简介](https://kubernetes.io/zh/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/)    

[CNI版本](https://github.com/containernetworking/cni/blob/spec-v0.4.0/SPEC.md) 

在 Kubernetes 生态系统中，Calico 和 Flannel 是两个常用的 CNI（Container Network Interface）网络插件，它们都提供了不同的网络方案和功能，适用于不同的场景和需求。

**Flannel**

- 提供简单且易于部署的网络解决方案，基于虚拟网络（Overlay Network）实现 Pod 之间的通信。
- 采用不同的网络后端技术，如 VXLAN、UDP 或者 host-gw 模式，以提供不同的性能和适应不同的网络环境。

**Calico**

- 提供了基于 BGP 的 IP 网络方案，支持高度可扩展的容器网络。

- 支持网络策略（Network Policies），允许对 Pod 之间的通信进行细粒度的控制和限制。

- 支持跨节点的网络互联，可用于多节点的 Kubernetes 集群，并提供了灵活的网络拓扑。

  

在公有云环境中，因为 Calico 通常需要与云提供商的底层网络结合并支持 BGP，而有些云服务商可能限制了 BGP 的使用，因此在这种情况下，部署 Flannel 可能更为方便。



## 2.kubernetes 中Pod通信场景

### 2.1 同一个 Pod 内的不同容器的通信

![](https://cdn1.ryanxin.live/1_-ze224LkGbwRbgIC-7w5dg.webp)







​       Kubernetes中的Pod是调度的最小单位，可包含一个或多个容器。Pod内的多个容器共享相同的网络和存储空间，它们通过本地主机上的localhost接口直接进行本地通信，类似于同一主机上的多个进程间的通信。这种通信方式是通过一个名为pause的基础架构容器来实现的，pause容器管理Pod的网络命名空间，使得容器能够共享网络栈，从而实现高效的本地通信。





### 2.2 分布式 Pod 间的通信

​     分布式 Pod 间的通信以及 Pod 与 Node 间的通信都建立在共享的平面网络上。这个共享的平面网络依赖于容器网络插件（CNI），这些插件允许 Kubernetes 集群中的不同节点上的 Pod 之间直接通信。每个 Pod 对象都有一个虚拟网络接口和一个集群全局唯一的 IP 地址，这个 IP 地址可以直接用于 Pod 之间的通信。运行 Pod 的各个节点也会持有一个属于同一平面网络的 IP 地址，通常是通过桥接设备（例如 cni0 接口）来实现。Node 与 Pod 之间的通信也可以直接在这个共享的网络中进行。因此，不论是 Pod 之间的通信还是 Pod 与 Node 之间的通信，都类似于在同一 IP 网络中的主机间进行的通信。



### 2.3 Pod 和服务Service之间的通信



<img src="https://cdn1.ryanxin.live/1_B0AmH3WpQ0GYSRPw0NMK-g.webp" style="zoom:50%;" />

​      Service与Pod之间的通信发生在称为集群网络的专用网络中。启动kube-apiserver时，需使用`--service-cluster-ip-range`选项指定该网络范围，例如默认值为10.96.0.0/12。在该网络中，每个Service对象都有一个称为Cluster-IP的固定地址。

当管理员或用户创建或修改Service对象时，这些操作会被API Server存储。随后，kube-proxy在每个节点上被触发。根据代理模式的设置，该Service对象会被定义为相应节点上的iptables规则或ipvs规则。Pod或节点客户端发起访问Service对象IP地址的请求时，这些iptables或ipvs规则会进行调度和转发，从而促成Pod与Service之间的通信。



**Pod 与 Kubernetes 外部的网络通信**



<img src="C:\Users\xx9z\Pictures\1_kQEAKUXMcCy5DtysZkiM0A.webp" style="zoom:50%;" />

外部到 Pod（客户端请求）:

使用 Kubernetes 的 Ingress 资源或者 Service 类型为 LoadBalancer/NodePort 的服务，将外部请求路由到集群内部的 Pod。Ingress 允许管理外部访问到集群中的服务。

Pod 到外部（响应报文）:

当 Pod 中的容器需要向外部服务发送响应时，通常情况下，Pod 内的容器可以通过集群外部的服务地址或者外部 IP 地址来实现与外部通信的响应报文。可以创建一个 Service 类型为 ExternalName，将该 Service 映射到集群外部的服务域名或 IP 地址。如果有代理或中间件可以代表 Pod 中的容器访问外部服务，则可以创建一个 Service 类型为 ClusterIP 的服务，并配置代理或中间件来转发请求到外部服务。





## 3.CNI插件三种常见实现方式

![image.png](https://cdn1.ryanxin.live/202304071680855692400423.png)

### 2.1 Overlay 覆盖模式

跨网段的容器通信通过 Overlay 网络进行，这种方式通过在不同节点之间建立隧道，将容器的通信流量封装在数据包中传输。
这种模式不依赖于底层网络，可以在不同的底层网络架构上工作，但因为数据包的封装和解封装过程，可能会带来性能损耗。

![img](https://cdn1.ryanxin.live/245df37eefe424dfb8c17330bf523424.jpg)

#### 2.1.1 Overlay 网络模型



**VxLAN**：VxLAN全称是Visual eXtensible Local Area Network（虚拟扩展本地局域网），主要由Cisco推出，vxlan是一个VLAN的扩展协议，是由IETF定义的NVO3（Network Virtualization over Layer 3）标准技术之一，VXLAN的特点是将L2的以太帧封装到UDP报文（即L2 over L4）中，并在L3网络中传输，即使用MAC in UDP的方法对报文进行重新封装，VxLAN本质上是一种overlay的隧道封装技术，它将L2的以太网帧封装成L4的UDP数据包，然后在L3的网络中传输，效果就像L2的以太网帧在一个广播域中传输一样，实际上L2的以太网帧跨越了L3网络传输，但是却不受L3网络的限制，vxlan采用24位标识vlan ID号，因此可以支持2^24=1677216个vlan，其可扩展性比vlan强大的多，可以技术大规模数据中心的网络需求。



![image-20240110160658360](https://cdn1.ryanxin.live/image-20240110160658360.png)



**VTEP （VXLAN Tunnel Endpoint）**：VTEP 是 VXLAN 网络的边缘设备，作为 VXLAN 隧道的起点和终点，负责 VXLAN 数据包的封装和解封装。VTEP 设备对用户原始数据帧进行 VXLAN 封装（加入 VXLAN 头部）和解封装（去除 VXLAN 头部）。每对 VTEP 地址对应一个 VXLAN 隧道，以实现不同节点间的通信。服务器上的虚拟交换机（隧道 flannel.1 就是VTEP），比如一个虚拟机网络中的多个vxlan就需要多个VTEP对不同网络的报文进行封装与解封装。



**VNI（VXLAN Network Identifier）**：VNI 类似于 VLAN ID，在 VXLAN 中用于标识不同的 VXLAN 段或虚拟网络。每个 VNI 表示一个租户或者一个虚拟网络，允许对不同的虚拟网络进行隔离和标识。VNI 用于区分不同的 VXLAN 段，确保不同 VNI 的虚拟机或容器之间不能直接连接二层通信，实现租户间的隔离。多个终端用户或虚拟机属于同一个 VNI 表示它们属于同一个租户或虚拟网络。



![img](https://cdn1.ryanxin.live/kube-network-model-vxlan.png)



1. **veth1：**veth1是（veth pair）中的一个端点，veth pair 是容器和宿主机网络之间的虚拟以太网设备，由容器运行时（例如 Docker、Containerd 等）在创建容器时自动创建。并将一端附加到容器内部，这个端点通常被命名为 veth1 或类似的名称。同时，另一端会被自动连接到宿主机的网络命名空间中这个虚拟设备允许容器内的网络流量与宿主机的网络进行通信，是宿主机上的容器与宿主机网络之间的桥梁。
2. **cni0：** `cni0` 设备通常是由容器网络插件（CNI 插件）创建的，它用作容器网络中的虚拟网桥或虚拟网络接口。这个虚拟设备（`cni0`）的创建通常是由容器运行时（如 Docker、Containerd 等）与所选的 CNI 插件协作完成的。当容器网络插件被初始化和配置后，它可能会创建 `cni0` 这样的虚拟网桥，用于连接不同的容器和宿主机网络之间的通信。
3. **flannel.1：** `flannel.1` 是 Flannel 网络插件创建的虚拟网络接口，用于实现 Kubernetes 集群中 Pod 之间的通信。Flannel 是一个网络覆盖（overlay）解决方案，通过创建虚拟网络层（例如使用 VXLAN 或者其他技术）实现不同节点上 Pod 之间的直接通信。



#### 2.1.2 VXLAN通信过程 

![image-20240110160949702](https://cdn1.ryanxin.live/image-20240110160949702.png)

VXLAN（Virtual Extensible LAN）是一种网络虚拟化技术，用于扩展虚拟局域网（VLAN）的数量。它主要用于在数据中心网络中创建虚拟网络以实现跨子网的通信。以下是 VXLAN 通信过程的简要描述：

1. **封装（Encapsulation）：**

   - 发送端（源节点）：当源节点的某个设备（例如容器或虚拟机）需要发送数据包给另一个网络中的设备时，首先将数据包封装在 VXLAN 包中。
   - VXLAN 封装包：在封装过程中，会给原始数据包加上 VXLAN 头部信息。这个头部包含了 VXLAN 网络标识符（VNI，VXLAN Network Identifier）和其他元数据信息。

2. **发送（Transmission）：**

   - VXLAN 封装后的数据包通过底层物理网络传输到目标设备所在的节点。这可能需要通过路由器、交换机等设备来进行数据包的传输。

3. **解封装（Decapsulation）：**

   - 接收端（目标节点）：一旦 VXLAN 封装的数据包到达目标节点，目标设备将进行解封装操作。
   - 解封装：目标设备将从接收到的数据包中提取出原始数据，并根据 VNI 识别出数据包的所属虚拟网络。

4. **转发至目标设备：**

   - 解封装后的原始数据包根据其 VNI 进行处理，并交付给目标设备（容器、虚拟机等）。

   

https://www.bilibili.com/video/BV1py4y1a7iE







### 2.2 Routing 路由模式

​    直接路由网络模型不再强调跨主机容器之间在二层（L2）的连通性，而是专注于在三层（L3）通过路由协议提供容器间的通信。这种解决方案更容易集成到现有数据中心的基础设施中，能够方便地连接容器和主机，并且在报文过滤和隔离方面具有更好的扩展能力和更精细的控制模型，因此成为了容器化网络中较流行的解决方案之一。

​    在典型的直接路由解决方案中，每个主机上的各个容器在二层网络中通过网桥进行通信，网关指向当前主机上的网桥接口地址。对于跨主机的容器间通信，需要依据主机上的路由表指示来完成报文的路由。因此，每个主机的物理接口地址都有可能成为另一个主机路由报文中的“下一跳”，这就要求各个主机的物理接口必须位于同一个二层网络中。这种模型的优势在于其能够更好地整合到现有网络基础设施中，提供更灵活、更可控的通信方式，并且更适用于需要精细控制报文流向和过滤的场景。以下是直接路由解决方案的示意图

![img](https://cdn1.ryanxin.live/2719436-20220221111838595-1369378462.png)



 **直接路由的宿主机需要在同一个网段，不能跨网段进行访问，这是直接路由模式的一个硬限制。**

以及在如何在大规模主机集群中维护路由表信息？

**常见的解决方案有：**

- **Flannel host-gw：** Flannel host-gw 模式通过使用存储总线 etcd 并在每个节点上运行的 flanneld 进程，动态地维护路由表信息。这种方式允许容器间的直接路由，将它们与宿主机的路由信息相联系，以便在集群内进行通信。
- **Calico BGP 协议：** Calico 使用 BGP（边界网关协议）在主机集群中自动分发和学习路由信息。与 Flannel host-gw 不同的是，Calico 不会为容器在主机上使用网桥，而是为每个容器生成一对 veth 设备，并在主机上生成目标地址，作为当前容器的路由条目。这种方式更为灵活，并且利用 BGP 协议动态分发路由信息，实现容器间的通信。



### 2.3 Underlay网络模型

![img](https://cdn1.ryanxin.live/2719436-20220221111633223-1852355686.png)

Underlay网络是指底层的物理网络基础设施，包括传统的企业IT网络，由交换机、路由器等物理设备组成，通过以太网、路由协议、VLAN 等技术驱动的网络。它是 Overlay 网络的底层基础，为 Overlay 网络提供基本的数据传输服务。

在容器网络中，Underlay网络是指通过特定的驱动程序将宿主机底层的网络接口直接暴露给容器使用的一种网络构建技术。这种技术允许容器直接访问宿主机底层的网络资源，而不需要通过额外的网络虚拟化层（例如 Overlay 网络）。

常见的容器网络的 Underlay 构建技术包括：

- **MAC VLAN（MAC Virtual LAN）：** 允许将一个或多个容器连接到底层物理网络，为每个容器分配唯一的 MAC 地址。容器的网络流量会直接通过底层物理网络进行传输。
- **IP VLAN（IP Virtual LAN）：** 类似于 MAC VLAN，但在 IP 层面上为容器分配唯一的 IP 地址，并允许容器与物理网络进行直接通信。
- **直接路由（Direct Routing）：** 允许容器直接访问底层物理网络，并通过主机的路由表进行数据转发，使容器的网络流量可以绕过额外的网络虚拟化层。

Underlay 模式依赖底层网络的特性和能力来实现容器间的通信，它会直接利用底层网络的能力打通不同节点或者不同网络的通信。

这种模式对底层网络的要求更高，通常能够获得更好的性能，但它也更强烈地依赖于底层网络的稳定性和可靠性。

---

#### 2.3.1 MAC VLAN

**MAC VLAN有Private、VEPA、Bridge和Passthru几种工作模式，它们各自的工作特性如下**  ：

- Private：禁止构建在同一物理接口上的多个MAC VLAN实例（容器接口）彼此间的通信，即便外部的物理交换机支持“发夹模式”也不行，同一父接口下的子接口之间彼此隔离，不能通信，及时通过外部交换机转发也不行   

- VPEA：允许构建在同一物理接口上的多个MAC VLAN实例（容器接口）彼此间的通信，但需要外部交换机启用发夹模式，或者存在报文转发功能的路由器设备 简单来说：vepa 模式下，子接口之间的通信流量需要导到外部支持802.1Qbg/VPEA 功能的交换机上（可以是物理的或者虚拟的）， 经由外部交换机转发，再绕回来   

- Bridge：将物理接口配置为网桥，从而允许同一物理接口上的多个MAC VLAN实例基于此网桥直接通信，而无须依赖外部的物理交换机来交换报文；此为最常用的模式，甚至还是Docker容器唯一支持的模式 

  简单来说：bridge 模式下，模拟的是Linux bridge 的功能，但比bridge 要好的一点是每个接口的MAC 地址是已知的，不用学习，所以这种模式下，子接口之间就是直接可以通信的   

- Passthru：允许其中一个MAC VLAN实例直接连接物理接口 简单来说：passthru 模式，只允许单个子接口连接父接口   

- source mode: 这种模式，只接收源mac 为指定的mac 地址的报文

由上述工作模式可知，除了Passthru模式外的容器流量将被MAC VLAN过滤而无法与底层主机通信，从而将主机与其运行的容器完全隔离，其隔离级别甚至高于网桥式网络模型，这对于有多租户需求的场景尤为有用。由于各实例都有专用的MAC地址，因此MAC VLAN允许传输广播和多播流量，但它要求物理接口工作于混杂模式，考虑到很多公有云环境中并不允许使用混杂模式，这意味着MAC VLAN更适用于本地网络环境。 需要注意的是，MAC VLAN为每个容器使用一个唯一的MAC地址，这可能会导致具有安全策略以防止MAC欺骗的交换机出现问题，因为这类交换机的每个接口只允许连接一个MAC地址。另外，有些物理网卡存在可支撑的MAC地址数量上限



#### 2.3.2 IP VLAN

IP VLAN（也称为 IP 虚拟化）与 MAC VLAN 类似，它同样在物理网络接口上创建虚拟网络接口，并为每个虚拟接口分配唯一的 IP 地址。不同之处在于，IP VLAN 中每个虚拟接口共享物理接口的 MAC 地址，这样做避免了违反交换机安全策略中防止 MAC 欺骗的问题，并且不需要在物理接口上启用混杂模式。



## 4.Flannel网络插件

官网：https://cores.com/flannel/docs/latest

文档：https://coreos.com/flannel/docs/latest/kubernetes.html

Flannel 主要解决容器跨节点通信问题。它利用虚拟网桥和 veth 设备为每个 Pod 创建虚拟网络接口，通过定义的后端（backend），能够为 Pod 之间提供通信网络。Flannel 支持多种平台，包括 Kubernetes、OpenShift、Cloud Foundry、Mesos、Amazon ECS、Singularity 和 OpenSVC 等。

Flannel 同时支持Overlay和Underlay网络模式，在Overlay模式下 Flannel 主要使用 VXLAN 和 VXLAN+DirectRouting（UDP模式现已不再支持），在Underlay网络模式下Flannel 也支持基于三层路由的 Underlay 网络，可以通过配置选择不同的网络模式来满足需求。

### 4.1 Flannel 配置

在IP地址分配方面，它将预留的一个专用网络（默认为10.244.0.0/16，自定义为172.20.0.0/16）切分成多个子网后作为每个节点的Pod CIDR（Pod IP地址段），而后由节点以IPAM（IP Address Management）插件的host-local形式进行地址分配，并将子网分配信息保存于etcd之中。

可以在`/run/flannel/subnet.env`中查看子网的分配

```bash
#k8s-master1
root@k8s-master:~# cat /run/flannel/subnet.env 
FLANNEL_NETWORK=172.20.0.0/16  #所在网段
FLANNEL_SUBNET=172.20.0.1/24   #分配给容器的IP网段
FLANNEL_MTU=1450
FLANNEL_IPMASQ=true

#k8s-node1(分配的172.20.2.0/24网段)
root@k8s-node1:~# cat /run/flannel/subnet.env 
FLANNEL_NETWORK=172.20.0.0/16  #所在网段
FLANNEL_SUBNET=172.20.2.1/24   #分配给容器的IP网段
FLANNEL_MTU=1450               
FLANNEL_IPMASQ=true

#k8s-node2(分配的172.20.1.0/24网段)
root@k8s-node2:~# cat /run/flannel/subnet.env
FLANNEL_NETWORK=172.20.0.0/16
FLANNEL_SUBNET=172.20.1.1/24
FLANNEL_MTU=1450
FLANNEL_IPMASQ=true
```



Flannel 在每个主机上运行一个名为 flanneld 的二进制代理程序，它负责从预留的网络中按照指定或默认的掩码长度为当前节点申请分配一个子网，并将网络配置、已分配的子网和辅助数据（例如主机的公网IP等）存储在Kubernetes API或etcd之中。

```bash
root@k8s-deploy:~# kubectl get pod -n kube-system -o wide
NAME READY STATUS RESTARTS AGE IP NODE NOMINATED NODE READINESS GATES
coredns-7659f568f5-fz6t2 1/1 Running 2 2d6h 172.20.2.4 192.168.1.102 <none> <none>
kube-flannel-ds-amd64-498cr 1/1 Running 2 2d6h 192.168.1.103 192.168.1.103 <none> <none>
kube-flannel-ds-amd64-78kw5 1/1 Running 1 2d6h 192.168.1.101 192.168.1.101 <none> <none>
kube-flannel-ds-amd64-cvqr7 1/1 Running 2 2d6h 192.168.1.102 192.168.1.102 <none> <none>
```



### 4.2 Flannel 后端容器网络机制简介

**Flannel 使用称为后端的容器网络机制来转发跨节点的 Pod 数据包。**

Flannel 支持多种后端技术，最常见的是 VXLAN 和 VXLAN+DirectRouting。

1. **VXLAN：**使用 Linux 内核中的 VXLAN 模块进行隧道报文的封装，实现 Overlay 网络模型，支持跨节点的 Pod 之间的通信。支持直接路由模式(VXLAN+DirectRouting)，允许在同一二层网络内的节点间直接发送数据包。但是在跨网络的节点间的 Pod 通信仍然使用 VXLAN 隧道协议转发。
2. **Host-gw：**类似于 VXLAN 中的直接路由模式，但不支持跨网络的节点间通信。要求各节点必须在同一个二层网络中，不适用于大规模网络。具有较好的转发性能，易于设置，适用于对报文转发性能要求较高的场景。
3. **UDP：** 使用常规 UDP 报文封装实现隧道转发，性能较前两种方式低。通常用于不支持前两种后端的环境。但值得注意的是，现在已不再支持 UDP 模式。

Flannel使用etcd来存储虚拟IP和主机IP之间的映射，每个节点上运行的flanneld守护进程负责监视etcd中的信息并完成报文路由。默认情况下，Flannel的配置信息保存在etcd存储系统的键名`/coreos.com/network/config`之下。

kubernetes中会定义一个名为`kube-flannel-cfg`的configmaps，它的值是一个JSON格式的字典数据结构，它可以使用的键包含以下几个。

```json
root@k8s-deploy:~# kubectl get configmaps kube-flannel-cfg -n kube-system
NAME               DATA   AGE
kube-flannel-cfg   2      2d6h
root@k8s-deploy:~# kubectl describe configmaps kube-flannel-cfg -n kube-system
Name:         kube-flannel-cfg
Namespace:    kube-system
Labels:       app=flannel
              tier=node
Annotations:  <none>

Data
====
cni-conf.json:
----
{
  "name": "cbr0",
  "cniVersion": "0.3.1",
  "plugins": [
    {
      "type": "flannel",
      "delegate": {
        "hairpinMode": true,
        "isDefaultGateway": true
      }
    },
    {
      "type": "portmap",
      "capabilities": {
        "portMappings": true
      }
    }
  ]
}

net-conf.json:
----
{
  "Network": "172.20.0.0/16",
  "Backend": {
    "Type": "vxlan"
  }
}

Events:  <none>


#1）Network：Flannel在全局使用CIDR格式的IPv4网络，字符串格式，此为必选键，余下的均为可选。
#2）SubnetLen：为全局使用的IPv4网络基于多少位的掩码切割供各节点使用的子网，在全局网络的掩码小于24（例如16）时默认为24位。
#3）SubnetMin：分配给节点使用的起始子网，默认为切分完成后的第一个子网；字符串格式。
#4）SubnetMax：分配给节点使用的最大子网，默认为切分完成后的最大一个子网；字符串格式。
#5）Backend：Flannel要使用的后端类型，以及后端相关的配置，字典格式；不同的后端通常会有专用的配置参数。
```



Flannel预留使用的网络为默认的10.244.0.0/16，我们自定义的172.20.0.0/16，默认使用24位长度的子网掩码为各节点分配切分的子网，因而，它将有172.20.0.0/24～ 172.20.255.0/24范围内的256个子网可用，每个节点最多支持为254个Pod对象各分配一个IP地址。它使用的后端是VXLAN类型，flanneld将监听UDP的8472端口。

```bash
root@k8s-master0:~# netstat -tunlp|grep 8472
udp        0      0 0.0.0.0:8472            0.0.0.0:*                           -    

root@k8s-node1:~# netstat -tunlp|grep 8472
udp        0      0 0.0.0.0:8472            0.0.0.0:*      
```



### 4.3  VXLAN

#### 4.3.1 Flannel 虚拟网桥

Flannel 在集群中的每个运行 flanneld 的节点上都会创建一个名为 `flannel.1` 的虚拟网桥作为本节点隧道的出入口的 **VTEP（VXLAN Tunnel Endpoint）**设备。在这里，`.1` 表示 VXLAN 网络标识符（VNI），因此所有节点上的 VTEP 都属于相同的 VXLAN ，Flannel 的这种设计允许集群中的各个节点在网络上形成一个统一的大二层域，使得 Pod 可以通过 VXLAN 隧道进行透明的跨节点通信。

Flannel 采用了分布式的网关模型。每个节点被视为到达该节点 Pod 子网的二层网关，并且相应的路由信息由 flanneld 自动生成， flanneld 会负责在每个节点上生成路由信息，以确保跨节点的 Pod 通信能够正确进行。当 Pod 需要与其他节点上的 Pod 通信时，相关的流量会经过 VXLAN 隧道，通过 flannel.1 虚拟网桥进行传输。

```bash
root@k8s-node1:~# brctl show
bridge name    bridge id        STP enabled    interfaces
cni0        8000.6a27d0d1f4d3    no        veth1ebbd6d3
docker0        8000.0242c905c787    no        
root@k8s-node1:~# ip route show
default via 192.168.1.1 dev eth0 proto static 
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown 
172.20.0.0/24 via 172.20.0.0 dev flannel.1 onlink 
172.20.1.0/24 via 172.20.1.0 dev flannel.1 onlink 
172.20.2.0/24 dev cni0 proto kernel scope link src 172.20.2.1 
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.102
```



#### 4.3.2 flanneld 守护进程

**flanneld 守护进程的主要职责**

当 flanneld 启动时，它会首先连接到 etcd 存储，通过 HTTP 请求获取保存在 etcd 中的网络配置信息， 在 etcd 中获取 JSON 格式的网络配置信息，这些信息描述了 Flannel 网络的各种参数，如网络类型（通常是 VXLAN）、子网分配范围、VXLAN 的 VNI 等。 接下来 flanneld对获取到的 JSON 格式的网络配置信息进行解析，从中提取出必要的配置参数。根据解析得到的配置信息，flanneld 确定 Flannel 网络的类型，通常是 VXLAN。同时，它确定用于分配子网的 IP 地址范围，即子网池。然后flanneld 根据确定的网络类型和子网范围，进行网络初始化工作。包括为每个节点分配唯一的子网租约、生成路由信息、创建虚拟网桥等操作。



**在与 Kubernetes 结合使用时，Flannel 可以通过 DaemonSet 控制器进行管理**
在 Kubernetes 中，DaemonSet 是一种控制器，用于确保在集群的每个节点上运行一个副本的 Pod。这样可以确保在整个集群中的每个节点都有相同的 Pod 运行。Flannel 项目提供了一个名为 kube-flannel-ds 的 DaemonSet 控制器和其配置清单，其中包含了用于创建 kube-flannel-ds DaemonSet 控制器的 Kubernetes YAML 文件。这个清单定义了需要运行的容器镜像、Pod 的标签选择器、网络配置等信息。

 在 **kube-flannel-ds DaemonSet** 控制器中，定义了一个 Pod 模板，其中包含 flanneld 容器的运行配置。这个 Pod 模板中使用了 hostNetwork: true，表示这些 Pod 共享宿主节点的网络命名空间。这样配置的结果是，flanneld 守护进程在每个节点的根网络命名空间中运行，能够直接影响整个节点的网络配置。

通过这种方式，kube-flannel-ds DaemonSet 控制器确保在每个节点上都运行了 flanneld 守护进程，并使得 Flannel 的网络配置能够在整个 Kubernetes 集群中生效。 https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

```yaml
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  labels:
    app: flannel
    k8s-app: flannel
    tier: node
  name: kube-flannel-ds
  namespace: kube-flannel
spec:
  selector:
    matchLabels:
      app: flannel
      k8s-app: flannel
  template:
    metadata:
      labels:
        app: flannel
        k8s-app: flannel
        tier: node
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      containers:
      - args:
        - --ip-masq
        - --kube-subnet-mgr
        command:
        - /opt/bin/flanneld
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: EVENT_QUEUE_DEPTH
          value: "5000"
        image: docker.io/flannel/flannel:v0.24.0
        name: kube-flannel
        resources:
          requests:
            cpu: 100m
            memory: 50Mi
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
            - NET_RAW
          privileged: false
        volumeMounts:
        - mountPath: /run/flannel
          name: run
        - mountPath: /etc/kube-flannel/
          name: flannel-cfg
        - mountPath: /run/xtables.lock
          name: xtables-lock
      hostNetwork: true
      initContainers:
      - args:
        - -f
        - /flannel
        - /opt/cni/bin/flannel
        command:
        - cp
        image: docker.io/flannel/flannel-cni-plugin:v1.2.0
        name: install-cni-plugin
        volumeMounts:
        - mountPath: /opt/cni/bin
          name: cni-plugin
      - args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        command:
        - cp
        image: docker.io/flannel/flannel:v0.24.0
        name: install-cni
        volumeMounts:
        - mountPath: /etc/cni/net.d
          name: cni
        - mountPath: /etc/kube-flannel/
          name: flannel-cfg
      priorityClassName: system-node-critical
      serviceAccountName: flannel
      tolerations:
      - effect: NoSchedule
        operator: Exists
      volumes:
      - hostPath:
          path: /run/flannel
        name: run
      - hostPath:
          path: /opt/cni/bin
        name: cni-plugin
      - hostPath:
          path: /etc/cni/net.d
        name: cni
      - configMap:
          name: kube-flannel-cfg
        name: flannel-cfg
      - hostPath:
          path: /run/xtables.lock
          type: FileOrCreate
        name: xtables-lock
```



#### 4.3.3 Flannel 基于Vxlan原理解析



下面的路由信息取自k8s-node0节点，它由该节点上的flanneld根据集群中各节点获得的子网信息生成。

```bash
root@k8s-node1:~# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.1.1     0.0.0.0         UG    0      0        0 eth0
172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 docker0
172.20.0.0      172.20.0.0      255.255.255.0   UG    0      0        0 flannel.1
172.20.1.0      172.20.1.0      255.255.255.0   UG    0      0        0 flannel.1
172.20.2.0      0.0.0.0         255.255.255.0   U     0      0        0 cni0
192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 eth0
```

其中，172.20.0.0/24由k8s-master1使用，172.20.1.0/24由k8s-node2节点使用，172.20.2.0/24由k8s-node1节点使用

```bash
#k8s-master
root@k8s-master:~# cat /run/flannel/subnet.env
FLANNEL_NETWORK=172.20.0.0/16
FLANNEL_SUBNET=172.20.0.1/24
FLANNEL_MTU=1450
FLANNEL_IPMASQ=true

#k8s-node1
root@k8s-node1:~# cat /run/flannel/subnet.env
FLANNEL_NETWORK=172.20.0.0/16
FLANNEL_SUBNET=172.20.2.1/24
FLANNEL_MTU=1450
FLANNEL_IPMASQ=true

#k8s-node2
root@k8s-node2:~# cat /run/flannel/subnet.env
FLANNEL_NETWORK=172.20.0.0/16
FLANNEL_SUBNET=172.20.1.1/24
FLANNEL_MTU=1450
FLANNEL_IPMASQ=true
```

这些路由条目恰恰反映了同节点Pod间通信时经由cni0虚拟网桥转发，而跨节点Pod间通信时，报文将经由当前节点（k8s-node01）的flannel.1隧道入口（VTEP设备）外发，隧道出口由“下一跳”信息指定，例如到达172.20.5.0/24网络的报文隧道出口是172.20.5.0指向的接口，它配置在k8s-node03的flannel.1接口之上，该接口正是k8s-node03上的隧道出入口（VTEP设备）。

![img](https://cdn1.ryanxin.live/2719436-20220221214951157-1309738775.png)

VXLAN网络将各VTEP设备作为同一个二层网络上的接口，这些接口设备组成一个虚拟的二层网络。

Pod-1发往Pod-4的IP报文将在流经其所在节点的flannel.1接口时封装成数据帧，源MAC是k8s-node01节点上的flannel.1接口的MAC地址，而目标MAC则是k8s-node02节点上flannel.1接口的MAC地址。

但Flannel并非依赖ARP进行MAC地址学习，而是由节点上的flanneld进程启动时将本地flannel.1接口IP与MAC地址的映射信息上报到etcd中，并由其他各节点上的flanneld来动态生成相应的解析记录。

下面的解析记录取自k8s-node01节点，它们分别指明了集群中的其他节点上的flannel.1接口各自对应的MAC地址，PERMANENT属性表明这些记录均永久有效。

```bash
root@k8s-node1:~# ip neigh show | awk '$3 == "flannel.1"{print $0}'
172.20.0.0 dev flannel.1 lladdr fa:40:5f:2d:8e:40 PERMANENT
172.20.1.0 dev flannel.1 lladdr 5e:b1:10:42:f7:bd PERMANENT
```

VXLAN协议使用UDP报文封装隧道内层数据帧，Pod发出的报文经隧道入口flannel.1封装成数据帧，再由flanneld进程（客户端）封装成UDP报文，之后发往目标Pod对象所在节点的flanneld进程（服务端）。该UDP报文就是所谓的VXLAN隧道，它会在已经生成的帧报文之外再封装一组协议头部，如图10-15所示为VXLAN头部、外层UDP头部、外层IP头部和外层帧头部。

![img](https://cdn1.ryanxin.live/2719436-20220221215632736-823011711.png)



#### 4.3.4 Flannel 基于Vxlan通信流程

```bash

1) 源容器veth0向目标容器发送数据，根据容器内的默认路由，数据首先发送给宿主机的docker0网桥
 
2）宿主机docker0网桥接受到数据后，宿主机查询路由表，pod相关的路由都是交由flannel.1网卡，因此，将其转发给flannel.1虚拟网卡处理
 
3）flannel.1接受到数据后，查询etcd数据库，获取目标pod网段对应的目标宿主机地址、目标宿主机的flannel网卡的mac地址、vxlan vnid等信息。然后对数据进行udp封装如下：
 
udp头封装：
 
source port >1024，target port 8472
 
udp内部封装：
 
  vxlan封装：vxlan vnid等信息
 
  original layer 2 frame封装：source {源 flannel.1网卡mac地址} target{目标flannel.1网卡的mac地址}
 
完成以上udp封装后，将数据转发给物理机的eth0网卡
 
4）宿主机eth0接收到来自flannel.1的udp包，还需要将其封装成正常的通信用的数据包，为它加上通用的ip头、二层头，这项工作在由linux内核来完成。
 
Ethernet Header的信息：
 
source:{源宿主机机网卡的MAC地址}
 
target:{目标宿主机网卡的MAC地址}
 
IP Header的信息：
 
source:{源宿主机网卡的IP地址}
 
target:{目标宿主机网卡的IP地址}
 
通过此次封装，一个真正可用的数据包就封装完成，可以通过物理网络传输了。
 
5）目标宿主机的eth0接收到数据后，对数据包进行拆封，拆到udp层后，将其转发给8472端口的flannel进程
 
6）目标宿主机端flannel拆除udp头、vxlan头，获取到内部的原始数据帧，在原始数据帧内部，解析出源容器ip、目标容器ip，重新封装成通用的数据包，查询路由表，转发给docker0网桥；
 
7）最后，docker0网桥将数据送达目标容器内的veth0网卡，完成容器之间的数据通信
```





### 4.4 DirectRouting 直接路由

​      若集群过于庞大，则避免不了跨网段通信，或者既想使用VxLAN可以跨网段的特性，又想host-gw的高性能，我们可以设置为Directrouting，使其同网段的用host-gw，不同网段的自动使用VxLAN网络叠加。
我们也可以将flannel配置为VxLAN + Directrouting方式，若请求端和回应端在同网段，则使用直接路由模式，若不同网段，则自动降级为VxLAN模式。

在Kubernetes上的Flannel来说，修改kube-system名称空间下的`configmaps/kube-flannel-cfg`资源，为VXLAN后端添加DirectRouting子键，并设置其值为true即可。

k8s集群是使用kubeasz部署的，因此需要修改kubeasz中关于集群网路的配置并重新部署k8s集群

```bash
root@k8s-deploy:~# vim /etc/kubeasz/clusters/k8s-test/config.yml 
......
FLANNEL_BACKEND: "vxlan"
#DIRECT_ROUTING: false
DIRECT_ROUTING: true
......
```

节点上的路由规则也会相应发生变动，到达与本地节点位于同一二层网络中的其他节点，Pod子网的下一跳地址由对端flannel.1接口地址变为了宿主机物理接口的地址，本地用于发出报文的接口从flannel.1变成了本地的物理接口。

Pod与节点通常不在同一网络。Pod间的通信报文需要经由宿主机的物理接口发出，必然会经过iptables/netfilter的forward钩子，为了避免该类报文被防火墙拦截，Flannel必须为其设定必要的放行规则。本集群中的每个节点上iptables filter表的FORWARD链上都会生成如下两条转发规则，以确保由物理接口接收或发送的目标地址或源地址为172.20.0/16网络的所有报文能够正常通过。

```bash
root@k8s-master1:~# iptables -nL
......
ACCEPT     all  --  172.20.0.0/16        anywhere            
ACCEPT     all  --  anywhere             172.20.0.0/16  
......
```

#### 4.4.1 DirectRouting案例

创建2个pod

```bash
root@k8s-deploy:/etc/kubeasz# kubectl run testpod-1 --image=ikubernetes/demoapp:v1.0
pod/testpod-1 created
root@k8s-deploy:/etc/kubeasz# kubectl run testpod-2 --image=ikubernetes/demoapp:v1.0
pod/testpod-2 created
root@k8s-deploy:/etc/kubeasz# kubectl get pod -o wide
NAME        READY   STATUS    RESTARTS   AGE   IP            NODE            NOMINATED NODE   READINESS GATES
testpod-1   1/1     Running   0          40s   172.20.1.6    192.168.1.103   <none>           <none>
testpod-2   1/1     Running   0          31s   172.20.2.10   192.168.1.102   <none>           <none>
```



进入testpod-1

```bash
oot@k8s-deploy:/etc/kubeasz# kubectl exec -it testpod-1 -- sh
[root@testpod-1 /]# traceroute 172.20.2.10
traceroute to 172.20.2.10 (172.20.2.10), 30 hops max, 46 byte packets
 1  172.20.1.1 (172.20.1.1)  0.004 ms  0.002 ms  0.001 ms
 2  192.168.1.102 (192.168.1.102)  0.336 ms  0.121 ms  0.095 ms
 3  172.20.2.10 (172.20.2.10)  0.140 ms  0.239 ms  0.123 ms
#testpod-1访问testpod-2时，不在转发非flannel,而是直接转发给testpod-2所在的node节点
```

这种路由规则无法表达跨二层网络的节点上Pod间通信的诉求，因为到达目标网络（某Pod子网）的下一跳地址无法指向另一个网段的节点地址。因而，集群中的每个节点上依然保留有VXLAN隧道相关的flannel.1设备，以支持那些跨IP网络的节点上的Pod间通信。

以k8s-node1为例子

```bash
root@k8s-node1:~# ip a | grep flannel.1
5: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default 
    inet 172.20.2.0/32 brd 172.20.2.0 scope global flannel.1
```





### 4.5 host-gw

Flannel的host-gw后端通过添加必要的路由信息，并使用节点的二层网络直接发送Pod间的通信报文，其工作方式类似于VXLAN后端中的直接路由功能，但不包括该后端支持的隧道转发能力，这意味着host-gw后端要求各节点必须位于同一个二层网络中。其工作模型示意图如下图所示。因完全不会用到VXLAN隧道，所以使用了host-gw后端的Flannel网络也就无须用到VTEP设备flannel.1。

**注意：**

**直接路由仅node节点在同一网段，不能跨网段。**

![img](https://cdn1.ryanxin.live/2719436-20220221225638132-1663668842.png)



 host-gw后端没有多余的配置参数，直接设定配置文件中的`Backend.Type`键的值为host-gw关键字即可。同样，直接修改kube-system名称空间中的`configmaps/kube-flannel.cfg`配置文件，类似下面配置示例中的内容即可。

```json
net-conf.json: |
    {
      "Network": "172.20.0.0/16",
      "Backend": {
        "Type": "host-gw"
      }
  }
```

配置完成后，集群中的各节点会生成类似VXLAN后端的DirectRouting路由及iptables规则，以转发Pod网络的通信报文，它完全省去了隧道转发模式的额外开销。代价是，对于非同一个二层网络的报文转发，host-gw完全无能为力。相对而言，VXLAN的DirectRouting后端转发模式兼具VXLAN后端和host-gw后端的优势，既保证了传输性能，又具备跨二层网络转发报文的能力。

像host-gw或VXLAN后端的直接路由模式这种使用静态路由实现Pod间通信报文的转发，虽然较之VXLAN Overlay网络有着更低的资源开销和更好的性能表现，但当Kubernetes集群规模较大时，其路由信息的规模也将变得庞大且不易维护。相比较来说，Calico通过BGP协议自动维护路由条目，较之Flannel以etcd为总线以上报、查询和更新配置的工作逻辑更加高效和易于维护，因而更适用于大型网络。

Flannel自身并不具备为Pod网络实施网络策略以实现其网络通信控制的能力，它只能借助Calico这类支持网络策略的插件实现该功能，独立的项目Calico正为此目的而设立。



#### 4.5.1 host-gw案例

```bash
root@k8s-deploy:~# vim /etc/kubeasz/clusters/k8s-test/config.yml 
......
#FLANNEL_BACKEND: "vxlan"
FLANNEL_BACKEND: "host-gw"
#DIRECT_ROUTING: false
#DIRECT_ROUTING: true
......
```



以k8s-node1为例

```bash
root@k8s-node1:~# ip route
default via 192.168.1.1 dev eth0 proto static 
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown 
172.20.0.0/24 via 192.168.1.101 dev eth0 
172.20.1.0/24 via 192.168.1.103 dev eth0 
172.20.2.0/24 dev cni0 proto kernel scope link src 172.20.2.1 
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.102

root@k8s-node1:~# ip a  | grep flannel
root@k8s-node1:~#

#无flannel设备
```





## 5.Calico网络插件
