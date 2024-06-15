---
author: Ryan
title: HAProxy-基础配置详解 （二）
date: 2023-02-05
---


## 四、基础配置详解

 官方文档：[http://cbonte.github.io/haproxy-dconv/2.6/configuration.html](http://cbonte.github.io/haproxy-dconv/2.6/configuration.html)

 HAProxy 的配置文件**haproxy.cfg**由两大部分组成，分别是**global**和**proxies**部分  

 **global ：全局配置段  **

```bash
进程及安全配置相关的参数
性能调整相关参数
Debug参数
```


** proxies：代理配置段  **

```bash
defaults：为frontend, backend, listen提供默认配置
frontend：前端，相当于nginx中的server {}
backend：后端，相当于nginx中的upstream {}
listen：同时拥有前端和后端配置
```




### 4.1 global配置



#### 4.1.1 global 配置参数说明

官方文档：[http://cbonte.github.io/haproxy-dconv/2.6/configuration.html](http://cbonte.github.io/haproxy-dconv/2.6/configuration.html)

```bash
chroot #锁定运行目录
deamon #以守护进程运行
stats socket /var/lib/haproxy/haproxy.sock mode 600 level admin process 1 #链接本机的socket文件，定义权限方便对负载进行动态调整
user, group, uid, gid  #运行haproxy的用户身份
nbproc    n     #多进程模式，开启worker进程数，建议与cpu个数相同，默认为1。开启时就不在支持线程模式，没开启时，一个进程下面有多个线程
#nbthread  1    #指定每个haproxy进程开启的线程数，默认为每个进程一个线程,和nbproc互斥（版本有关）
#如果同时启用nbproc和nbthread 会出现以下日志的错误，无法启动服务
Apr  7 14:46:23 haproxy haproxy: [ALERT] 097/144623 (1454) : config : cannot enable multiple processes if multiple threads are configured. Please use either nbproc or nbthread but not both.

cpu-map 1 0     #绑定haproxy 进程至指定CPU，将第一个work进程绑定至0号CPU
cpu-map 2 1     #绑定haproxy 进程至指定CPU，将第二个work进程绑定至1号CPU
maxconn  100000      #每个haproxy进程的最大并发连接数
maxsslconn  n   #每个haproxy进程ssl最大连接数,用于haproxy配置了证书的场景下
maxconnrate n   #每个进程每秒创建的最大连接数量
spread-checks n #后端server状态check随机提前或延迟百分比时间，建议2-5(20%-50%)之间，默认值0
pidfile         #指定pid文件路径
log 127.0.0.1  local2 info #定义全局的syslog服务器；日志服务器需要开启UDP协议，最多可以定义两个
```



#### 4.4.2 多进程和线程

 范例：多进程和socket文件  <br />**查看CPU核心数量**

```bash
[root@localhost haproxy]# cat /proc/cpuinfo  | grep "cores" | uniq                                                                       
cpu cores       : 8
```

```bash
[root@centos7 ~]#vim /etc/haproxy/haproxy.cfg
global
maxconn 100000
chroot /apps/haproxy
stats socket /var/lib/haproxy/haproxy.sock1 mode 600 level admin process 1               
stats socket /var/lib/haproxy/haproxy.sock2 mode 600 level admin process 2
uid 99
gid 99
daemon
nbproc 2
[root@centos7 ~]#systemctl restart haproxy
[root@centos7 ~]#pstree -p |grep haproxy
           |-haproxy(2634)-+-haproxy(2637)
           |               `-haproxy(2638)
[root@centos7 ~]#ll /var/lib/haproxy/
total 4
-rw-r--r-- 1 root root 5 Mar 31 18:49 haproxy.pid
srw------- 1 root root 0 Mar 31 18:49 haproxy.sock1
srw------- 1 root root 0 Mar 31 18:49 haproxy.sock2
```



#### 4.4.3  配置HAProxy记录日志到指定日志文件中  

```bash
#在global配置项定义：
log 127.0.0.1  local{1-7} info #基于syslog记录日志到指定设备，级别有(err、warning、info、debug)

listen  web_port
  bind 127.0.0.1:80
  mode http
  log global   #开启当前web_port的日志功能，默认不记录日志
  server web1  127.0.0.1:8080  check inter 3000 fall 2 rise 5

# systemctl  restart haproxy
```



##### **Rsyslog配置**

```bash
vim /etc/rsyslog.conf 
$ModLoad imudp
$UDPServerRun 514

# Save boot messages also to boot.log
local7.*                                                /var/log/boot.log
local5.*                                                /var/log/haproxy.log
local0.*                                                /var/log/haproxy.log
# systemctl  restart rsyslog
```



##### 验证HAProxy日志

 重启syslog服务并访问app页面，然后验证是否生成日志  

```bash
[root@localhost log]# tail -f haproxy.log 
Feb 13 11:11:57 localhost haproxy[3127]: Connect from 172.16.32.242:64058 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:57 localhost haproxy[3127]: Connect from 172.16.32.242:64058 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64058 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64058 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64058 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64058 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64061 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64061 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64061 to 10.1.0.6:30013 (web_port/HTTP)
Feb 13 11:11:59 localhost haproxy[3127]: Connect from 172.16.32.242:64061 to 10.1.0.6:30013 (web_port/HTTP)
```



### 4.2 Proxies配置

 官方文档：[http://docs.haproxy.org/2.6/configuration.html#4](http://docs.haproxy.org/2.6/configuration.html#4)

```bash
defaults [<name>] #默认配置项，针对以下的frontend、backend和listen生效，可以多个name也可以没有name
frontend <name>   #前端servername，类似于Nginx的一个虚拟主机 server和LVS服务集群。
backend  <name>   #后端服务器组，等于nginx的upstream和LVS中的RS服务器
listen   <name>   #将frontend和backend合并在一起配置，相对于frontend和backend配置更简洁，生产常用
```

 **注意：name字段只能使用大小写字母，数字，‘-’(dash)，’_‘(underscore)，’.’ (dot)和 ‘:'(colon)，并且严格区分大小写 ** 



#### 4.2.1 Proxies配置-frontend

**frontend 配置参数：**

```bash
bind：   #指定HAProxy的监听地址，可以是IPV4或IPV6，可以同时监听多个IP或端口，可同时用于listen字段中

#格式：
bind [<address>]:<port_range> [, ...] [param*]

#注意：如果需要绑定在非本机的IP，需要开启内核参数：net.ipv4.ip_nonlocal_bind=1
```

 范例：  

```bash
listen http_proxy                           #监听http的多个IP的多个端口和sock文件
    bind :80,:443,:8801-8810
    bind 10.0.0.1:10080,10.0.0.1:10443
    bind /var/run/ssl-frontend.sock user root mode 600 accept-proxy

listen http_https_proxy                     #https监听
    bind :80
    bind :443 ssl crt /etc/haproxy/site.pem #公钥和私钥公共文件

listen http_https_proxy_explicit            #监听ipv6、ipv4和unix sock文件
    bind ipv6@:80
    bind ipv4@public_ssl:443 ssl crt /etc/haproxy/site.pem
    bind unix@ssl-frontend.sock user root mode 600 accept-proxy

listen external_bind_app1                   #监听file descriptor
    bind "fd@${FD_APP1}"
```

** 生产示例：**

```bash
frontend  magedu_web_port               #可以采用后面形式命名：业务-服务-端口号
    bind :80,:8080
    bind 10.0.0.7:10080,:8801-8810,10.0.0.17:9001-9010
    mode  http|tcp              #指定负载协议类型
    use_backend <backend_name>  #调用的后端服务器组名称
```



#### 4.2.2 Proxies配置-backend

 定义一组后端服务器，backend服务器将被frontend进行调用。  

```bash
mode  http|tcp      #指定负载协议类型,和对应的frontend必须一致
option              #配置选项
server              #定义后端real server
```

 注意：option后面加** httpchk，smtpchk,mysql-check,pgsql-check，ssl-hello-chk**方法，可用于实现更多应用层检测功能。  




##### option 配置

```bash
check               #对指定real进行健康状态检查，如果不加此设置，默认不开启检查
    addr  <IP>        #可指定的健康状态监测IP，可以是专门的数据网段，减少业务网络的流量
    port  <num>   #指定的健康状态监测端口
    inter <num>   #健康状态检查间隔时间，默认2000 ms
    fall  <num>       #后端服务器从线上转为线下的检查的连续失效次数，默认为3
    rise  <num>       #后端服务器从下线恢复上线的检查的连续有效次数，默认为2
weight  <weight>  #默认为1，最大值为256，0表示不参与负载均衡，但仍接受持久连接
backup              #将后端服务器标记为备份状态,只在所有非备份主机down机时提供服务，类似Sorry Server
disabled            #将后端服务器标记为不可用状态，即维护状态，除了持久模式，将不再接受连接
redirect prefix  http://www.baidu.com/      #将请求临时(302)重定向至其它URL，只适用于http模式
redir http://www.baidu.com                  #将请求临时(302)重定向至其它URL，只适用于http模式
maxconn <maxconn>     #当前后端server的最大并发连接数
backlog <backlog> #当前端服务器的连接数达到上限后的后援队列长度，注意：不支持backend
```



#### 4.2.3 frontend+backend配置实例

 范例1：  

```bash
frontend xin-test-http
 bind :80,:8080
 mode tcp
 use_backend magedu-test-http-nodes

backend magedu-test-http-nodes
 mode tcp
 default-server inter 1000 weight 6  
 server web1 10.0.0.17:80 check weight 2 addr 10.0.0.117 port 8080
 server web1 10.0.0.27:80 check
```

 范例2：  

```bash
#官网业务访问入口
frontend  WEB_PORT_80
    bind 10.0.0.7:80
    mode http
    use_backend  web_prot_http_nodes

backend web_prot_http_nodes
    mode  http
    option forwardfor
    server 10.0.0.17 10.0.0.17:8080   check inter 3000 fall 3 rise 5  
    server 10.0.0.27 10.0.0.27:8080   check inter 3000 fall 3 rise 5
```




#### 4.2.4 Proxies配置-listen替代frontend+backend

 使用listen替换上面的frontend和backend的配置方式，可以简化设置，通常只用于TCP协议的应用  

```bash
#官网业务访问入口
listen  WEB_PORT_80 
    bind 10.0.0.7:80  
    mode http
    option  forwardfor
    server web1   10.0.0.17:8080   check inter 3000 fall 3 rise 5
    server web2   10.0.0.27:8080   check inter 3000 fall 3 rise 5
```




### 4.3 使用子配置文件保存配置

 当业务众多时，将所有配置都放在一个配置文件中，会造成维护困难。可以考虑按业务分类，将配置信息拆分，放在不同的子配置文件中，从而达到方便维护的目的。  

```bash
#创建子配置目录
[root@centos7 ~]#mkdir /etc/haproxy/conf.d/

#创建子配置文件，注意：必须为cfg后缀
[root@centos7 ~]#vim  /etc/haproxy/conf.d/test.cfg
listen WEB_PORT_80
    bind 10.0.0.7:80
    mode http
    balance roundrobin
    server web1  10.0.0.17:80  check inter 3000 fall 2 rise 5
    server web2  10.0.0.27:80  check inter 3000 fall 2 rise 5

#添加子配置目录到unit文件中
[root@centos7 ~]#vim  /lib/systemd/system/haproxy.service
[Unit]
Description=HAProxy Load Balancer
After=syslog.target network.target

[Service]
ExecStartPre=/usr/sbin/haproxy -f /etc/haproxy/haproxy.cfg -f /etc/haproxy/conf.d/ -c -q
ExecStart=/usr/sbin/haproxy -Ws -f /etc/haproxy/haproxy.cfg -f /etc/haproxy/conf.d/  -p /var/lib/haproxy/haproxy.pid
ExecReload=/bin/kill -USR2 $MAINPID

[Install]
WantedBy=multi-user.target

[root@centos7 ~]#systemctl daemon-reload 
[root@centos7 ~]#systemctl restart haproxy
```



