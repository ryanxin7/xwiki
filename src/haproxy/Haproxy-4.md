---
author: Ryan
title: HAProxy-https实现（四）
date: 2023-02-07
categories: HAProxy
---



## 六、HAProxy https实现

```bash
#配置HAProxy支持https协议，支持ssl会话；
bind *:443 ssl crt /PATH/TO/SOME_PEM_FILE   

#crt 后证书文件为PEM格式，且同时包含证书和所有私钥   
 cat  demo.crt demo.key > demo.pem 

#把80端口的请求重向定443
bind *:80
redirect scheme https if !{ ssl_fc }    

#向后端传递用户请求的协议和端口（frontend或backend）
http_request set-header X-Forwarded-Port %[dst_port]
http_request add-header X-Forwared-Proto https if { ssl_fc }
```




### 6.1 证书制作

```bash
#方法1
[root@centos7 ~]mkdir /etc/haproxy/certs/
[root@centos7 ~]cd /etc/haproxy/certs/
[root@centos7 certs]#openssl  genrsa -out haproxy.key 2048
[root@centos7 certs]#openssl  req -new -x509 -key haproxy.key  -out haproxy.crt -subj "/CN=www.xinblog.org"
#或者用下一条命令实现
[root@centos7 certs]#openssl req  -x509 -newkey rsa:2048 -subj "/CN=www.magedu.org" -keyout haproxy.key -nodes -days 365 -out haproxy.crt

[root@centos7 certs]#cat haproxy.key  haproxy.crt  > haproxy.pem
[root@centos7 certs]#openssl  x509 -in  haproxy.pem -noout -text        #查看证书
```



### 6.2 https配置示例

```bash
[root@centos7 ~]#cat  /etc/haproxy/conf.d/test.cfg
frontend  magedu_http_port
  bind 10.0.0.7:80
  bind 10.0.0.7:443 ssl crt /etc/haproxy/certs/haproxy.pem
  redirect scheme https if !{ ssl_fc }        # 注意{ }内的空格
  http-request  set-header  X-forwarded-Port   %[dst_port]
  http-request  add-header  X-forwarded-Proto  https if { ssl_fc } 
  mode http
  balance  roundrobin
  log global
  option httplog
###################### acl setting ###############################
  acl mobile_domain hdr_dom(host)   -i mobile.magedu.org
###################### acl hosts #################################
  default_backend pc_hosts 
################### backend hosts #################################
backend mobile_hosts
  mode http
  server web1 10.0.0.17:80 check inter 2000 fall 3 rise 5

backend pc_hosts
  mode http
  #http-request  set-header  X-forwarded-Port   %[dst_port] 也可加在此处
  #http-request  add-header  X-forwarded-Proto  https if { ssl_fc } 
  server web2 10.0.0.27:80 check inter 2000 fall 3 rise 5

[root@centos7 ~]#ss -ntl
State      Recv-Q Send-Q          Local Address:Port   Peer Address:Port              
LISTEN     0      100                 127.0.0.1:25                 *:*                  
LISTEN     0      128                  10.0.0.7:443                *:*                  
LISTEN     0      128                         *:9999               *:*                  
LISTEN     0      128                  10.0.0.7:80                 *:*                  
LISTEN     0      128                         *:22                 *:*                  
LISTEN     0      128                      [::]:22                 [::]:*   
```

```bash
global
    maxconn 100000
    chroot /var/lib/haproxy
    stats socket /var/lib/haproxy/haproxy.sock mode 600 level admin
    #uid 99
    #gid 99
    user  haproxy
    group haproxy
    daemon
    #nbproc 4
    #cpu-map 1 0
    #cpu-map 2 1
    #cpu-map 3 2
    #cpu-map 4 3
    pidfile /var/lib/haproxy/haproxy.pid
    log 127.0.0.1 local2 info

defaults
    option http-keep-alive
    maxconn 100000
    option  forwardfor
    mode http
    timeout connect 300000ms
    timeout client  300000ms
    timeout server  300000ms

listen stats
    mode http
    bind 0.0.0.0:9999
    stats enable
    log global
    stats uri     /haproxy-status
    stats auth    haadmin:123456


listen http_80
    mode http
    bind 10.1.0.6:30013
    bind 10.1.0.6:443 ssl crt /etc/haproxy/certs/haproxy.pem
    redirect scheme https if !{ ssl_fc }
    http-request set-header X-forwarded-Port %[dst_port]
    http-request add-header X-forwarded-Proto https if { ssl_fc }
    balance roundrobin
    log global
    option  forwardfor

    server web1 10.1.0.31:30013 check inter 2000 fall 3 rise 5
    server web2 10.1.0.32:30013 check inter 2000 fall 3 rise 5
```


![](http://img.xinn.cc/1676360033704-f88d33b8-5094-44d7-af63-0e04b1a88ae1.png)