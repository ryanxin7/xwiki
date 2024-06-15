---
author: Ryan
title: HAProxy-调度算法(三)
date: 2023-02-06
---



## 五、HAProxy调度算法

 HAProxy通过固定参数  **balance ** 指明对后端服务器的调度算法，该参数可以配置在listen或backend选项中。    HAProxy的调度算法分为静态和动态调度算法，但是有些算法可以根据参数在静态和动态算法中相互转换。  

 官方文档：[http://cbonte.github.io/haproxy-dconv/2.6/configuration.html#balance](http://cbonte.github.io/haproxy-dconv/2.6/configuration.html#balance)



### 5.1 静态算法

:::info
** 静态算法**：按照事先定义好的规则轮询公平调度，不关心后端服务器的当前负载、链接数和响应速度等，且无法实时修改权重，只能靠重启HAProxy生效。  
:::

 可以利用 **socat**工具对服务器动态权重和其它状态的调整，Socat 是 Linux 下的一个多功能的网络工具，名字来由是Socket CAT，Socat 的主要特点就是在两个数据流之间建立通道，且支持众多协议和链接方式。如 IP、TCP、 UDP、IPv6、Socket文件等  

 **利用工具socat 对服务器动态权重调整 ** 

```bash
[root@centos7 ~]#yum -y install socat

[root@centos7 ~]#echo "show info" | socat stdio /var/lib/haproxy/haproxy.sock
Name: HAProxy
Version: 2.1.3
Release_date: 2020/02/12
Nbthread: 4
Nbproc: 1
Process_num: 1
Pid: 2279
Uptime: 0d 0h46m07s
Uptime_sec: 2767
Memmax_MB: 0
PoolAlloc_MB: 0
PoolUsed_MB: 0
PoolFailed: 0
Ulimit-n: 200041
Maxsock: 200041
Maxconn: 100000
Hard_maxconn: 100000
CurrConns: 0
CumConns: 1
CumReq: 1
MaxSslConns: 0
CurrSslConns: 0
CumSslConns: 0
Maxpipes: 0
PipesUsed: 0
PipesFree: 0
ConnRate: 0
ConnRateLimit: 0
MaxConnRate: 0
SessRate: 0
SessRateLimit: 0
MaxSessRate: 0
SslRate: 0
SslRateLimit: 0
MaxSslRate: 0
SslFrontendKeyRate: 0
SslFrontendMaxKeyRate: 0
SslFrontendSessionReuse_pct: 0
SslBackendKeyRate: 0
SslBackendMaxKeyRate: 0
SslCacheLookups: 0
SslCacheMisses: 0
CompressBpsIn: 0
CompressBpsOut: 0
CompressBpsRateLim: 0
ZlibMemUsage: 0
MaxZlibMemUsage: 0
Tasks: 19
Run_queue: 1
Idle_pct: 100
node: centos7.wangxiaochun.com
Stopping: 0
Jobs: 7
Unstoppable Jobs: 0
Listeners: 6
ActivePeers: 0
ConnectedPeers: 0
DroppedLogs: 0
BusyPolling: 0
FailedResolutions: 0
TotalBytesOut: 0
BytesOutRate: 0
DebugCommandsIssued: 0



[root@centos7 ~]#echo "show servers state" | socat stdio /var/lib/haproxy/haproxy.sock1
# be_id be_name srv_id srv_name srv_addr srv_op_state srv_admin_state srv_uweight srv_iweight srv_time_since_last_change srv_check_status srv_check_result srv_check_health srv_check_state srv_agent_state bk_f_forced_id srv_f_forced_id srv_fqdn srv_port srvrecord
2 magedu-test-80 1 web1 10.0.0.17 2 0 2 1 812 6 3 7 6 0 0 0 - 80 -
2 magedu-test-80 2 web2 10.0.0.27 2 0 2 3 812 6 3 4 6 0 0 0 - 80 -
4 web_port 1 web1 127.0.0.1 0 0 1 1 810 8 2 0 6 0 0 0 - 8080 -


[root@centos7 ~]#echo "get weight magedu-test-80/web2" | socat stdio /var/lib/haproxy/haproxy.sock
3 (initial 3)

#修改weight，注意只针对单进程有效
[root@centos7 ~]#echo "set weight magedu-test-80/web2 2" | socat stdio /var/lib/haproxy/haproxy.sock

[root@centos7 ~]#echo "get weight magedu-test-80/web2" | socat stdio /var/lib/haproxy/haproxy.sock
2 (initial 3)


#将后端服务器禁用，注意只针对单进程有效
[root@centos7 ~]#echo "disable server magedu-test-80/web2" | socat stdio /var/lib/haproxy/haproxy.sock

#将后端服务器软下线，即weight设为0
[root@centos7 ~]#echo "set weight magedu-test-80/web1 0" | socat stdio /var/lib/haproxy/haproxy.sock


#将后端服务器禁用，针对多进程
[root@centos7 ~]#vim /etc/haproxy/haproxy.cfg
......
stats socket /var/lib/haproxy/haproxy1.sock mode 600 level admin process 1
stats socket /var/lib/haproxy/haproxy2.sock mode 600 level admin process 2               nbproc 2
.....

[root@centos7 ~]#echo "disable server  magedu-test-80/web2" | socat stdio /var/lib/haproxy/haproxy1.sock
[root@centos7 ~]#echo "disable server  magedu-test-80/web2" | socat stdio /var/lib/haproxy/haproxy2.sock

[root@haproxy ~]#for i in {1..2};do echo "set weight magedu-test-80/web$i 10" | socat stdio /var/lib/haproxy/haproxy$i.sock;done

#如果静态算法，如:static-rr，可以更改weight为0或1，但不支持动态更改weight为其它值，否则会提示下面信息
[root@centos7 ~]#echo "set weight magedu-test-80/web1 0" | socat stdio /var/lib/haproxy/haproxy.sock
[root@centos7 ~]#echo "set weight magedu-test-80/web1 1" | socat stdio /var/lib/haproxy/haproxy.sock

[root@centos7 ~]#echo "set weight magedu-test-80/web1 2" | socat stdio /var/lib/haproxy/haproxy.sock
Backend is using a static LB algorithm and only accepts weights '0%' and '100%'.
```




#### 5.1.1 static-rr

:::info
 static-rr：基于权重的轮询调度，不支持权重的运行时利用socat进行动态调整及后端服务器慢启动，其后端主机数量没有限制，相当于LVS中的 wrr  
:::

```bash
listen  web_host
  bind 10.0.0.7:80,:8801-8810,10.0.0.7:9001-9010
  mode http
  log global
  balance static-rr
  server web1  10.0.0.17:80 weight 1 check inter 3000 fall 2 rise 5
  server web2  10.0.0.27:80 weight 2 check inter 3000 fall 2 rise 5
```





#### 5.1.2 first

:::warning
 first：根据服务器在列表中的位置，自上而下进行调度，但是其只会当第一台服务器的连接数达到上限，新请求才会分配给下一台服务，因此会忽略服务器的权重设置，此方式使用较少  
:::

```bash
listen  web_host
  bind 10.0.0.7:80,:8801-8810,10.0.0.7:9001-9010
  mode http
  log global
  balance first
  server web1  10.0.0.17:80 maxconn 2 weight 1 check inter 3000 fall 2 rise 5
  server web2  10.0.0.27:80 weight 1 check inter 3000 fall 2 rise 5
```




### 5.2 动态算法

:::success
 动态算法：基于后端服务器状态进行调度适当调整，优先调度至当前负载较低的服务器，且权重可以在haproxy运行时动态调整无需重启。  
:::




#### 5.2.1 roundrobin

 roundrobin：基于权重的轮询动态调度算法，支持权重的运行时调整，不同于lvs中的rr轮训模式，HAProxy中的roundrobin支持慢启动(新加的服务器会逐渐增加转发数)，其每个后端backend中**最多支持4095个real server**，支持对real server权重动态调整，**roundrobin为默认调度算法。**

```bash
listen web_host
  bind 10.0.0.7:80,:8801-8810,10.0.0.7:9001-9010
  mode http
  log global
  balance roundrobin
  server web1  10.0.0.17:80 weight 1  check inter 3000 fall 2 rise 5
  server web2  10.0.0.27:80 weight 2  check inter 3000 fall 2 rise 5
```

**支持动态调整权重:**

```bash
# echo "get weight web_host/web1" | socat stdio /var/lib/haproxy/haproxy.sock 
1 (initial 1)

# echo "set weight web_host/web1 3" | socat stdio /var/lib/haproxy/haproxy.sock 

# echo "get weight web_host/web1" | socat stdio /var/lib/haproxy/haproxy.sock 
3 (initial 1)
```



#### 5.2.2 leastconn

 leastconn加权的最少连接的动态，支持权重的运行时调整和慢启动，即当前后**端服务器连接最少的优先调度**(新客户端连接)，**比较适合长连接的场景使用**，比如：MySQL等场景。  

```bash
listen  web_host
  bind 10.0.0.7:80,:8801-8810,10.0.0.7:9001-9010
  mode http
  log global
  balance leastconn
  server web1  10.0.0.17:80 weight 1  check inter 3000 fall 2 rise 5
  server web2  10.0.0.27:80 weight 1  check inter 3000 fall 2 rise 5
```



#### 5.2.3 random

在1.9版本开始增加一个叫做random的负载平衡算法，其**基于随机数作为一致性hash的key**，随机负载平衡对于大型服务器场或经常添加或删除服务器非常有用，支持weight的动态调整，weight较大的主机有更大概率获取新请求。

```bash
listen  web_host
  bind 10.0.0.7:80,:8801-8810,10.0.0.7:9001-9010
  mode http
  log global
  balance  random
  server web1  10.0.0.17:80 weight 1  check inter 3000 fall 2 rise 5
  server web2  10.0.0.27:80 weight 1  check inter 3000 fall 2 rise 5
```



### 5.3 其他算法

 其它算法即可作为静态算法，又可以通过选项成为动态算法  



#### 5.3.1 source

源地址hash，**基于用户源地址hash并将请求转发到后端服务器，后续同一个源地址请求将被转发至同一个后端web服务器。** 此方式当后端服务器数据量发生变化时，会导致很多用户的请求转发至新的后端服务器，默认为静态方式，但是可以通过hash-type支持的选项更改。 这个算法一般是在不插入Cookie的TCP模式下使用，也可给拒绝会话cookie的客户提供最好的会话粘性，适用于session会话保持但不支持cookie和缓存的场景 源地址有两种转发客户端请求到后端服务器的服务器选取计算方式，分别是取模法和一致性hash



#### 5.3.2 map-base取模法

 map-based：取模法，对source地址进行hash计算，再基于服务器总权重的取模，最终结果决定将此请求转发至对应的后端服务器。 此方法是静态的，即不支持在线调整权重，不支持慢启动，可实现对后端服务器均衡调度。 **缺点是当服务器的总权重发生变化时，即有服务器上线或下线，都会因总权重发生变化而导致调度结果整体改变**，hash-type 指定的默认值为此算法  。

> 所谓取模运算，就是计算两个数相除之后的余数，**10%7=3, 7%4=3 **
> map-based算法：基于权重取模，hash(source_ip)%所有后端服务器相加的总权重

```bash
listen  web_host
  bind 10.0.0.7:80,:8801-8810,10.0.0.7:9001-9010
  mode tcp
  log global
  balance source
  hash-type map-based 
  server web1  10.0.0.17:80 weight 1  check inter 3000 fall 2 rise 3
  server web2  10.0.0.27:80 weight 1  check inter 3000 fall 2 rise 3

[root@haproxy ~]#echo "set weight web_host/10.0.0.27 10" | socat stdio /var/lib/haproxy/haproxy.sock 
Backend is using a static LB algorithm and only accepts weights '0%' and '100%'.

[root@haproxy ~]#echo "set weight web_host/10.0.0.27 0" | socat stdio /var/lib/haproxy/haproxy.sock 

[root@haproxy conf.d]#echo "get weight web_host/10.0.0.27" | socat stdio /var/lib/haproxy/haproxy.sock 
0 (initial 1)
```



#### 5.3.3 一致性hash

 一致性哈希，**当服务器的总权重发生变化时，对调度结果影响是局部的，不会引起大的变动**，hash（o）mod n ，该hash算法是动态的，支持使用 socat等工具进行在线权重调整，支持慢启动 。

 算法：  

```bash
1、key1=hash(source_ip)%(2^32)  [0---4294967295]
2、keyA=hash(后端服务器虚拟ip)%(2^32)
3、将key1和keyA都放在hash环上，将用户请求调度到离key1最近的keyA对应的后端服务器
```

** hash环偏斜问题 ** 

```bash
增加虚拟服务器IP数量，比如：一个后端服务器根据权重为1生成1000个虚拟IP，再hash。而后端服务器权重为2则生成2000的虚拟IP，再hash,最终在hash环上生成3000个节点，从而解决hash环偏斜问题
```


hash对象

 Hash对象到后端服务器的映射关系：   ![](https://cdn1.ryanxin.live/1676269845062-cd498fcb-971f-4446-b3a5-524a0ab84182.png)


一致性hash示意图 后端服务器在线与离线的调度方式 ![](https://cdn1.ryanxin.live/1676269866029-afd24654-75c6-4b26-9d9d-5e7a37d18737.png)


一致性hash配置示例

```bash
listen  web_host
  bind 10.0.0.7:80,:8801-8810,10.0.0.7:9001-9010
  mode tcp
  log global
  balance source
  hash-type consistent
  server web1  10.0.0.17:80 weight 1  check inter 3000 fall 2 rise 5
  server web2  10.0.0.27:80 weight 1  check inter 3000 fall 2 rise 5
```



