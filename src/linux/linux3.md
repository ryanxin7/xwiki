---
author: Ryan
title: Keepalived 高可用服务部署
date: 2019-11-25
lastmod: 2019-11-25
tags: [Linux学习之旅]
---


---
# Keepalived 高可用服务部署



​    Keepalived 软件最早是配合 LVS 负载均衡软件而设计的，用来管理并监控LVS集群系统中各个服务节点的状态，后来又加入了VRRP 协议可以实现高可用的功能。

软件主要是通过 VRRP 协议实现高可用功能的,VRRP 是Virtual Router Redundancy Protocol（虚拟路由器冗余协议）的缩写，VRRP出现的目的就是为了解决静态路由单点故障问题的，它能够保证当个别节点宕机时，整个网络可以不间断地运行





##  一、Keepalived 软件工作原理

​      

  启初 VRRP 的出现是为了解决静态路由的单点故障。VRRP 是用过IP多播的方式实现高可用对之间通信的。工作时主服务器节点发包，备服务器节点接包，当备服务器节点接收不到主服务器节点发的数据包的时候，就启动接管程序接管主服务器节点的资源。备服务器节点可以有多个，通过优先级竞选。优先级数值越大优先级越大。





## 二、Keepalived 高可用服务部署





### 1.确认反向代理服务是否工作正常 



在kl1和kl02服务器上测试web服务器是否可以正常（最好有3台反向代理功能的Web服务器）

```bash
  curl -H host:www.rxinxin.org 192.168.10.10/webserver.html
  curl -H host:www.rxinxin.org 192.168.10.11/webserver.html
  curl -H host:www.rxinxin.org 192.168.10.11/webserver.html
  systemctl enable mariadb
```





### 2.在浏览器上测试访问kl1和kl2 域名



解析hosts文件，将域名解析为192.168.10.20，进行测试访问

解析hosts文件，将域名解析为192.168.10.30，进行测试访问



  ```bash
  测试前同步kl1和kl2的 Nginx 配置文件
  scp -rp /app/nginx/conf/nginx.conf 192.168.10.30:/app/nginx/conf/  
  ```

  




## 三、安装 Keepalived 服务软件

  第一步：安装软件
  ```bash
 yum install -y keepalived
  ```


第二步：编写keepalived配置文件

```
vim /etc/keepalived/keepalived.conf
man keepalived.conf   //查看文件说明信息
```
配置文件结构：
```bashba
GLOBAL CONFIGURATION  --- 全局配置
VRRPD CONFIGURATION   --- vrrp配置
LVS CONFIGURATION     --- LVS服务相关配置 （可以删掉不用） 
```

kl1主 负载均衡器配置
```bash
global_defs {    //全局配置
router_id kl1   //定义路由标识信息，相同局域网唯一
       }
       
vrrp_instance klg1 {  //Vrrp 配置
state MASTER    //定义实例中主备状态的角色（MASTER/BACKUP）
interface eth0  //设置主备服务器虚拟IP地址放置网卡位置
virtual_router_id 31 //虚拟路由ID标识，不同实例不同，主备相同
priority 150   //设置抢占优先级，数值越大越优先
advert_int 1  //主备间通讯时间间隔
authentication {  //主备间通过认证建立连接
auth_type PASS
auth_pass 1111
}
virtual_ipaddress {   定义主备服务器之间使用的虚拟IP地址信息
192.168.10.60/24 dev eth0 label eth0:1
           }
}

/etc/init.d/keepalived reload  //平滑重启 Keeplived 
```


kl2备 负载均衡器配置
```	   sh
global_defs {
router_id kl2
       }
vrrp_instance klg1 {
state BACKUP
interface eth0
virtual_router_id 31
priority 100
advert_int 1
authentication {
auth_type PASS
auth_pass 1111
}
virtual_ipaddress {
192.168.10.60/24 dev eth0 label eth0:1
}
}
/etc/init.d/keepalived reload
```

## 四、部署高可用服务时遇到的问题

 同时在keepalived高可用集群中，出现了两个虚拟IP地址信息，这种情况就称为脑裂

  脑裂情况出现原因：
```
  1. 心跳线出现问题
     网卡配置有问题
     交换设备有问题
     线缆连接有问题
  2. 有防火墙软件阻止问题
  3. virtual_router_id
     配置数值不正确  
```
 总之：只要备服务器收不到主服务器发出的组播包，就会成为主服务器，而主服务器资源没有释放，备服务器要篡位就会出现脑裂。




## 五、利用shell脚本实现监控管理
	备设备有 VIP 就是表示不正常

  1. 真正实现主备切换
	2. 出现脑裂情况了
	
```
#!/bin/bash
check_info=$(ip a|grep -c 192.168.10.60) //定义一个参数为VIP地址 .60
if [ $check_info -ne 0 ]  //如果等于 0 
then
echo "keepalived server error!!!" //打印告警提示 keepalived 服务出现错误
fi
```





## 六、Nginx反向代理监听虚拟IP地址

  1. 编写nginx反向代理配置
	
  ```
  server {
  listen      192.168.10.60:80;
  server_name  www.rxinxin.org;
  root   html;
  index  index.html index.htm;
  location / {
  proxy_pass http://xinxin;
  proxy_set_header host $host;
  proxy_set_header X-Forwarded-For $remote_addr;
        }
  }
  server {
  listen       192.168.10.60:80;
  server_name  bbs.rxinxin.org;
  root   html;
  index  index.html index.htm;
  location / {
  proxy_pass http://xinxin;
  proxy_set_header host $host;
  proxy_set_header X-Forwarded-For $remote_addr;
       }
    }
/application/nginx/sbin/nginx -s stop //Nginx 更改ip 一定要重启
/application/nginx/sbin/nginx
netstat -lntup|grep nginx //查看端口
  tcp        0      0 192.168.10.60:80                 0.0.0.0:*                   LISTEN      53334/nginx  虚拟IP地址
  ```


实现监听本地网卡上没有的IP地址

  ```echo 'net.ipv4.ip_nonlocal_bind = 1' >>/etc/sysctl.conf 更改内核``` 
	
  ```sysctl -p```






## 七、将高可用和反向代理服务建立联系

  因为Nginx 反向代理服务处于异常状态下，keepalived服务并没有从主服务器切换到备服务器，所以客户访问网站时反向代理服务一直处于挂了的异常状态导致网站无法正常访问。


实现的目的：Nginx反向代理服务停止，Keepalived服务也停止 
	
  1. 编写脚本

```
#!/bin/bash
web_info=$(ps -ef|grep [n]ginx|wc -l) //当Nginx进程小于2时
if [ $web_info -lt 2 ]
then
/etc/init.d/keepalived stop   //关闭keepalived 服务
fi
```

2.运行脚本，实现监控nginx服务

  编辑keepalived服务配置文件

  ```vrrp_script check_web {
#定义一个监控脚本，脚本必须有执行权限
script "/server/scripts/check_web.sh"    
#指定脚本间隔时间
  interval 2   
  #脚本执行完成，让优先级值和权重值进行运算，从而实现主备切换		
  weight 2                                                                            
  }
  track_script {
  check_web
  }	
  ```

chmod +x check_kls.sh   给予脚本可执行权限





## 八、实现高可用集群架构中双主配置



**互为主备配置配置**  

由于企业实际环境，很少等主服务器挂掉才调用备服务器，所以会将Web服务分配给两节点或多个集群并行使用节约成本。

```  
kl1
vrrp_instance klg1 {
 state MASTER
 interface eth0
 virtual_router_id 31
 priority 150
 advert_int 1
 authentication {
 auth_type PASS
 auth_pass 1111
    }
virtual_ipaddress {
 192.168.10.60/24 dev eth0 label eth0:1
    }
    }
vrrp_instance klg2 {
  state BACKUP
  interface eth0
  virtual_router_id 32
  priority 100
  advert_int 1
  authentication {
  auth_type PASS
  auth_pass 1111
    }
virtual_ipaddress {
  192.168.10.80/24 dev eth0 label eth0:1
    }
    }
```
```shell
  kl2
vrrp_instance klg1 {
  state BACKUP
  interface eth0
  virtual_router_id 31
  priority 100
  advert_int 1
  authentication {
  auth_type PASS
  auth_pass 1111
    }
  virtual_ipaddress {
  192.168.10.60/24 dev eth0 label eth0:1
       }
    }
  vrrp_instance klg2 {
    state MASTER
    interface eth0
    virtual_router_id 32
    priority 150
    advert_int 1
    authentication {
    auth_type PASS
    auth_pass 1111
    }
    virtual_ipaddress {
    192.168.10.80/24 dev eth0 label eth0:1
    }
    }	 
	
```



最后修改 Nginx 反向代理服务配置文件的监听IP地址信息 完成对 Keepalived 互为主备节点的配置部署。