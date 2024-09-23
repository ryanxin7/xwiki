---
author: Ryan
title: 5.k8s实战案例-nginx与tomcat实现动静分离
date: 2023-01-16
---



## 自定义镜像-运行nginx与tomcat实现动静分离

![构建流程图](http://img.xinn.cc/1673526070905-fa3a6810-3329-4dbd-9896-e1da10114b61.png)


### 1. 系统基础镜像
```
harbor.ceamg.com/baseimages/centos:7.8.2003
```



### 2. 构建 nginx 基础镜像
```bash
root@harbor01:/dockerfile/web/pub-images# pwd
/dockerfile/web/pub-images
root@harbor01:/dockerfile/web/pub-images# tree
.
├── build-command.sh
├── Dockerfile
└── nginx-1.22.1.tar.gz

0 directories, 3 files

```

```bash
#!/bin/bash
TAG=$1
docker build -t harbor.ceamg.com/pub-images/nginx-base:${TAG}  .
sleep 1
docker push  harbor.ceamg.com/pub-images/nginx-base:${TAG}
```

```bash
#Nginx 1.22.1
FROM harbor.ceamg.com/pub-images/nginx-base:1.22.1

ADD nginx.conf /usr/local/nginx/conf/nginx.conf
ADD app1.tar.gz  /usr/local/nginx/html/webapp/
ADD index.html  /usr/local/nginx/html/index.html

#静态资源挂载路径
RUN mkdir -p /usr/local/nginx/html/webapp/static /usr/local/nginx/html/webapp/images && useradd nginx -u 2023 -s /sbin/nologin -M

EXPOSE 80 443

CMD ["nginx"]
```



### 3. 构建 nginx 业务镜像
```
root@harbor01:/dockerfile/web/xin-01/nginx# pwd
/dockerfile/web/xin-01/nginx
root@harbor01:/dockerfile/web/xin-01/nginx# tree
.
├── app1.tar.gz
├── bulid-command.sh
├── Dockerfile
├── index.html
└── nginx.conf

```

```
#!/bin/bash
TAG=$1
docker build -t harbor.ceamg.com/xinweb11/nginx-web1:${TAG}  .
sleep 1
docker push  harbor.ceamg.com/xinweb11/nginx-web1:${TAG}
```

```
xxx in xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxx /usr/local/nginx/html/index.html xx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
user  nginx nginx;
worker_processes  auto;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;
daemon off;

events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;

upstream  tomcat_webserver {
        server   magedu-tomcat-app1-service.magedu.svc.magedu.local:80;
}

    server {
        listen       80;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        location /webapp {
            root   html;
            index  index.html index.htm;
        }

        location /myapp {
             proxy_pass  http://tomcat_webserver;
             proxy_set_header   Host    $host;
             proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_set_header X-Real-IP $remote_addr;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }


    # another virtual host using mix of IP-, name-, and port-based configuration
    #
    #server {
    #    listen       8000;
    #    listen       somename:8080;
    #    server_name  somename  alias  another.alias;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}


    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

}
```

```
#Nginx 1.22.1
FROM harbor.ceamg.com/pub-images/nginx-base:1.22.1

ADD nginx.conf /usr/local/nginx/conf/nginx.conf
ADD app1.tar.gz  /usr/local/nginx/html/webapp/
ADD index.html  /usr/local/nginx/html/index.html

#静态资源挂载路径
RUN mkdir -p /usr/local/nginx/html/webapp/static /usr/local/nginx/html/webapp/images

EXPOSE 80 443

CMD ["nginx"]
```


#### 测试nginx业务镜像

```bash
root@harbor01:/dockerfile/web/xin-01/nginx# docker run -it --rm -p 8888:80 harbor.ceamg.com/xinweb11/nginx-web1:v1.6
curl http://10.1.0.38:8888
curl http://10.1.0.38:8888/webapp/
```



### 4. ubuntu基础镜像
```bash
docker pull ubuntu:20.04
docker tag docker.io/library/ubuntu:20.04 harbor.ceamg.com/baseimages/ubuntu:20.04
docker push harbor.ceamg.com/baseimages/ubuntu:20.04
```



### 5. 构建jdk8
```bash
root@harbor01:/dockerfile/web/pub-images/jdk# pwd
/dockerfile/web/pub-images/jdk

root@harbor01:/dockerfile/web/pub-images/jdk# tree 
.
├── build-command.sh
├── Dockerfile
├── jdk-8u212-linux-x64.tar.gz
├── jdk-8u341-linux-x64.tar.gz
└── profile


```

```bash
#JDK Base Image
FROM harbor.ceamg.com/baseimages/ubuntu:20.04

MAINTAINER Ryan "ryanxin.com"


ADD jdk-8u341-linux-x64.tar.gz /usr/local/src/
RUN ln -sv /usr/local/src/jdk1.8.0_341 /usr/local/jdk
ADD profile /etc/profile

ENV JAVA_HOME /usr/local/jdk
ENV JRE_HOME $JAVA_HOME/jre
ENV CLASSPATH $JAVA_HOME/lib/:$JRE_HOME/lib/
ENV PATH $PATH:$JAVA_HOME/bin
```


```bash
#!/bin/bash
TAG=$1
docker build -t harbor.ceamg.com/pub-images/jdk8:${TAG} .
sleep 3
docker push  harbor.ceamg.com/pub-images/jdk8:${TAG}
```

```bash
# /etc/profile: system-wide .profile file for the Bourne shell (sh(1))
# and Bourne compatible shells (bash(1), ksh(1), ash(1), ...).

if [ "${PS1-}" ]; then
  if [ "${BASH-}" ] && [ "$BASH" != "/bin/sh" ]; then
    # The file bash.bashrc already sets the default PS1.
    # PS1='\h:\w\$ '
    if [ -f /etc/bash.bashrc ]; then
      . /etc/bash.bashrc
    fi
  else
    if [ "$(id -u)" -eq 0 ]; then
      PS1='# '
    else
      PS1='$ '
    fi
  fi
fi

if [ -d /etc/profile.d ]; then
  for i in /etc/profile.d/*.sh; do
    if [ -r $i ]; then
      . $i
    fi
  done
  unset i
fi

export LANG=en_US.UTF-8
export HISTTIMEFORMAT="%F %T `whoami` "

export JAVA_HOME=/usr/local/jdk
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
export PATH=${JAVA_HOME}/bin:$PATH
```


#### 测试镜像
```bash
root@harbor01:/dockerfile/web/pub-images/jdk# docker run -it --rm harbor.ceamg.com/pub-images/jdk8:3411
root@494e5aeb25af:/# java -v
Unrecognized option: -v
Error: Could not create the Java Virtual Machine.
Error: A fatal exception has occurred. Program will exit.
root@494e5aeb25af:/# java -version
java version "1.8.0_341"
Java(TM) SE Runtime Environment (build 1.8.0_341-b10)
Java HotSpot(TM) 64-Bit Server VM (build 25.341-b10, mixed mode)
```



### 6. 构建 Tomcat 镜像<br /><br />
```bash
root@harbor01:/dockerfile/web/pub-images/tomcat# pwd
/dockerfile/web/pub-images/tomcat

root@harbor01:/dockerfile/web/pub-images/tomcat# tree
.
├── apache-tomcat-8.5.43.tar.gz
├── build-command.sh
└── Dockerfile


```

```bash
#!/bin/bash
docker build -t harbor.ceamg.com/pub-images/tomcat-base:v8.5.43  .
sleep 3
docker push  harbor.ceamg.com/pub-images/tomcat-base:v8.5.43
```

```bash
#Tomcat 8.5.43基础镜像
FROM harbor.ceamg.com/pub-images/jdk8:3411

MAINTAINER Ryanxin ryanxin@outlook.com

RUN mkdir /apps /data/tomcat/webapps /data/tomcat/logs -pv
ADD apache-tomcat-8.5.43.tar.gz  /apps
RUN useradd nginx -u 2022  && ln -sv /apps/apache-tomcat-8.5.43 /apps/tomcat && chown -R nginx.nginx /apps /data -R

```



### 7. 构建Tomcat 业务镜像


```bash
root@harbor01:/dockerfile/web/xin-01/tomcat-app1# tree 
.
├── app1.tar
├── app1.tar.gz
├── build-command.sh
├── catalina.sh
├── Dockerfile
├── run_tomcat.sh
└── server.xml
```


```bash
#tomcat web1
FROM harbor.ceamg.com/pub-images/tomcat-base:v8.5.43.1

ADD catalina.sh /apps/tomcat/bin/catalina.sh
ADD server.xml /apps/tomcat/conf/server.xml
ADD app1.tar /data/tomcat/webapps/myapp/
ADD run_tomcat.sh /apps/tomcat/bin/run_tomcat.sh
RUN  mkdir /home/nginx -p \
 && chmod 755 /home/nginx \
 && cp -a /etc/skel/. /home/nginx \
 && chown -R nginx.nginx /data/ /apps/


EXPOSE 8080 8443

CMD ["/apps/tomcat/bin/run_tomcat.sh"]
```

```bash
#!/bin/bash
#echo "nameserver 223.6.6.6" > /etc/resolv.conf
#echo "192.168.7.248 k8s-vip.example.com" >> /etc/hosts

#/usr/share/filebeat/bin/filebeat -e -c /etc/filebeat/filebeat.yml -path.home /usr/share/filebeat -path.config /etc/filebeat -path.data /var/lib/filebeat -path.logs /var/log/filebeat &
su -c "/apps/tomcat/bin/catalina.sh start" nginx
tail -f /etc/hosts
```

[server.xml](https://www.yuque.com/attachments/yuque/0/2023/xml/33538388/1673854723038-1fb64bbb-a47b-4f74-ac00-bd3214431354.xml?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fxml%2F33538388%2F1673854723038-1fb64bbb-a47b-4f74-ac00-bd3214431354.xml%22%2C%22name%22%3A%22server.xml%22%2C%22size%22%3A6462%2C%22ext%22%3A%22xml%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22type%22%3A%22text%2Fxml%22%2C%22taskId%22%3A%22u139d0bf4-5c28-4279-9691-56c5ddd0557%22%2C%22taskType%22%3A%22upload%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22u87658630%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)

[catalina.sh](https://www.yuque.com/attachments/yuque/0/2023/sh/33538388/1673854730922-84c6b682-5e8c-4bfe-97ad-7cd79f876c34.sh?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fsh%2F33538388%2F1673854730922-84c6b682-5e8c-4bfe-97ad-7cd79f876c34.sh%22%2C%22name%22%3A%22catalina.sh%22%2C%22size%22%3A23611%2C%22ext%22%3A%22sh%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22type%22%3A%22text%2Fx-sh%22%2C%22taskId%22%3A%22u45ebc374-f725-49d7-980e-219328df912%22%2C%22taskType%22%3A%22upload%22%2C%22__spacing%22%3A%22both%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22u54cb5acb%22%2C%22margin%22%3A%7B%22top%22%3Atrue%2C%22bottom%22%3Atrue%7D%2C%22card%22%3A%22file%22%7D)


#### 测试镜像
```bash
docker run -it --rm -p 9900:8080 harbor.ceamg.com/xinweb11/tomcat-app1:1.9
```


![访问测试](http://img.xinn.cc/1673854826003-6af01184-b520-4ed6-b187-ecaf9c803a00.png)



### 在k8s中跑起来
启动tomcat pod 
```yaml
kind: Deployment
#apiVersion: extensions/v1beta1
apiVersion: apps/v1
metadata:
  labels:
    app: xin-tomcat-app1-deployment-label
  name: xin-tomcat-app1-deployment
  namespace: xin-web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: xin-tomcat-app1-selector
  template:
    metadata:
      labels:
        app: xin-tomcat-app1-selector
    spec:
      containers:
      - name: xin-tomcat-app1-container
        image: harbor.ceamg.com/xinweb11/tomcat-app1:1.9
        #command: ["/apps/tomcat/bin/run_tomcat.sh"]
        #imagePullPolicy: IfNotPresent
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          protocol: TCP
          name: http
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "18"
        resources:
          limits:
            cpu: 1
            memory: "512Mi"
          requests:
            cpu: 500m
            memory: "512Mi"
        volumeMounts:
        - name: xin-images
          mountPath: /usr/local/nginx/html/webapp/images
          readOnly: false
        - name: xin-static
          mountPath: /usr/local/nginx/html/webapp/static
          readOnly: false
      volumes:
      - name: xin-images
        nfs:
          server: 10.1.0.38
          path: /data/k8s/web1/images
      - name: xin-static
        nfs:
          server: 10.1.0.38
          path: /data/k8s/web1/static
#      nodeSelector:
#        project: xin
#        app: tomcat
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: xin-tomcat-app1-service-label
  name: xin-tomcat-app1-service
  namespace: xin-web
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 8080
    nodePort: 40003
  selector:
    app: xin-tomcat-app1-selector
```

检测后端Tomcat SVC 连通性
```bash
ping xin-tomcat-app1-service.xin-web.svc.ceamg.local
```
![检测后端TomcatSVC连通性](http://img.xinn.cc/1673869796202-9de30c77-d621-466e-ab4c-e8a5060d9ed9.png)

启动nginx pod 

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  labels:
    app: web1-nginx-deployment-label
  name: web1-nginx-deployment
  namespace: xin-web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web1-nginx-selector
  template:
    metadata:
      labels:
        app: web1-nginx-selector
    spec:
      containers:
      - name: web1-nginx-container
        image: harbor.ceamg.com/xinweb11/nginx-web1:v1.0
        #command: ["/apps/tomcat/bin/run_tomcat.sh"]
        #imagePullPolicy: IfNotPresent
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          protocol: TCP
          name: http
        - containerPort: 443
          protocol: TCP
          name: https
        env:
        - name: "password"
          value: "123456"
        - name: "age"
          value: "20"
        resources:
          limits:
            cpu: 2
            memory: 2Gi
          requests:
            cpu: 500m
            memory: 1Gi

        volumeMounts:
        - name: xin-images
          mountPath: /usr/local/nginx/html/webapp/images
          readOnly: false
        - name: xin-static
          mountPath: /usr/local/nginx/html/webapp/static
          readOnly: false
      volumes:
      - name: xin-images
        nfs:
          server: 10.1.0.38
          path: /data/k8s/web1/images
      - name: xin-static
        nfs:
          server: 10.1.0.38
          path: /data/k8s/web1/static
      #nodeSelector:
      #  group: magedu



---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: web1-nginx-service-label
  name: web1-nginx-service
  namespace: xin-web
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    protocol: TCP
    targetPort: 80
    nodePort: 40002
  - name: https
    port: 443
    protocol: TCP
    targetPort: 443
    nodePort: 40443
  selector:
    app: web1-nginx-selector
```


nginx 配置文件启用location 和 upstream 后端主机
```bash
upstream  tomcat_webserver {
        server   xin-tomcat-app1-service.xin-web.svc.ceamg.local:80;
}

    server {
        listen       80;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        location /webapp {
            root   html;
            index  index.html index.htm;
        }

        location /myapp {
             proxy_pass  http://tomcat_webserver;
             proxy_set_header   Host    $host;
             proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Real-IP $remote_addr;
         }

```


![访问测试](http://img.xinn.cc/1673872226767-dd34b982-4e75-4aa6-b700-eb761d4f4dfd.png)<br />![访问测试](http://img.xinn.cc/1673872214571-9e2fc591-cfbb-4368-8d65-1072d5a9b297.png)



import WordCount from '@site/src/components/WordCount';

<WordCount />