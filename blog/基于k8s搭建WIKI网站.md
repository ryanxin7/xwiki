---
title: "使用K8S搭建一个Wiki"
description: "在Kubernetes（K8s）环境中部署WordPress知识库项目"
date: "2023-11-14"
authors: [Ryan]
tags: [Kubernetes, WordPress]
---

## 部署WordPress知识库项目

![](http://img.xinn.cc/image-20231115162053336.png)

这是一个相当复杂的配置过程，涉及多个步骤和Kubernetes资源的设置,具体的步骤如下：



### 步骤一：创建持久化存储


1. NFS服务器 
    - 配置并启动NFS服务器。
    - 在Kubernetes中创建一个 `PersistentVolume` 和 `PersistentVolumeClaim`，将NFS服务器的存储卷动态绑定到 `PersistentVolumeClaim`（PVC）上。



### 步骤二：部署MySQL数据库


1. **MySQL服务**： 
    - 使用Kubernetes部署MySQL数据库。在`Deployment`或`StatefulSet`中配置MySQL容器。
    - 使用动态PVC将MySQL的数据存储持久化到NFS上。
2. **Secrets管理**： 
    - 创建包含MySQL凭据的Kubernetes Secret，并在MySQL Pod中使用这些凭据。



### 步骤三：部署WordPress


1. **WordPress服务**： 
    - 创建WordPress的Deployment，在Pod中运行WordPress容器。
    - 使用动态PVC将WordPress的数据存储持久化到NFS上。
    - 配置WordPress Pod以使用MySQL服务。
2. **Secrets管理**： 
    - 创建包含WordPress连接MySQL所需的凭据的Kubernetes Secret，并在WordPress Pod中使用这些凭据。

<!-- truncate -->

### 步骤四：部署Nginx代理服务器


1. Nginx服务 
    - 部署Nginx服务器，并配置作为代理服务器。
    - 在Nginx配置中使用upstream模块将流量转发到WordPress Pod服务上。
    - 配置HTTPS服务，使用证书确保安全通信。



### 步骤五：HTTPS配置


1. **SSL/TLS证书**： 
    - 获取有效的SSL/TLS证书（可以使用Let's Encrypt等工具）。
    - 将证书配置到Nginx服务器中。
2. **HTTPS代理**： 
    - 在Nginx配置中启用HTTPS代理，确保WordPress基于HTTPS协议实现交互。



### 步骤六：Wordpress 知识库主题配置


1. **样式调整**： 
    - 调整主题的本地化显示。
    - 增加Logo和banner图片。
2. **文章录入**： 
    - 安装插件解决Markdown格式的文档更好的适配文章编辑器。
    - 安装插件解决代码高亮显示。



## namespace


```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: wp-cluster
```





## mysql deployment


```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wpdb57
spec:
  replicas: 1
  selector:
    matchLabels:
      app: wpdb57
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: wpdb57
    spec:
      securityContext:
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: wpdb57
          image: mysql:5.7
          env:
            - name: TZ
              value: Asia/Shanghai
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: wpdb-secret
                  key: password
            - name: MYSQL_DATABASE
              value: wpdb
            - name: MYSQL_USER
              value: wp_user
            - name: MYSQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: wpdb-secret
                  key: password
          ports:
            - name: mysql
              containerPort: 3306
          volumeMounts:
            - name: mysql-data-volume
              mountPath: /var/lib/mysql
            - name: mysql-log-volume
              mountPath: /var/log/mysql
            - name: wpdb57-config
              mountPath: /etc/mysql/conf.d/custom.cnf
              subPath: custom.cnf
              readOnly: true
          resources:
            requests:
              memory: "2Gi"
              cpu: "1"
            limits:
              memory: "8Gi"
              cpu: "2"
      volumes:
        - name: mysql-data-volume
          persistentVolumeClaim:
            claimName: wpdb-data-pvc
        - name: mysql-log-volume
          persistentVolumeClaim:
            claimName: wpdb-log-pvc
        - name: wpdb57-config
          configMap:
            name: wpdb57-config
            items:
              - key: custom.cnf
                path: custom.cnf

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: wpdb57-config
data:
  custom.cnf: |
    [mysqld]
    default_authentication_plugin=mysql_native_password
    skip-name-resolve
    datadir=/var/lib/mysql
    bind-address=0.0.0.0

    log-error=/var/log/mysql/error.log
    slow_query_log=1
    long_query_time=3
    slow_query_log_file=/var/log/mysql/slow_query.log

    # replication
    log-bin=binlog
    binlog_format=ROW
    server-id=1
    innodb_flush_log_at_trx_commit=1
    sync_binlog=1

    # fulltext index
    ngram_token_size=1

    # required by confluence
    default_storage_engine=InnoDB
    character-set-server=utf8mb4
    collation-server=utf8mb4_bin
    max_allowed_packet=256M
    innodb_log_file_size=2GB
    transaction-isolation=READ-COMMITTED
    binlog_format=row

    # required by quartz
    # will make table name case-insensitive
    lower_case_table_names=1

    # sql mode disable full_group for backward compatibility
    sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION

---
apiVersion: v1
kind: Service
metadata:
  name: mpdb57-nodeport
spec:
  type: NodePort
  ports:
    - name: mysql
      port: 3306
      targetPort: mysql
      nodePort: 30357
      protocol: TCP
  selector:
    app: mpdb57


---
apiVersion: v1
kind: Service
metadata:
  name: mpdb57
spec:
  type: ClusterIP
  ports:
    - name: mysql
      port: 3306
      targetPort: mysql
      protocol: TCP
  selector:
    app: mpdb57
```



```bash
kubectl create secret generic wpdb-secret --from-literal=password=YourMySQLPassword
```



```yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wpdb-data-pvc
  namespace: wp-cluster
spec:
  storageClassName: nfs-wp-cluster
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 150Gi

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wpdb-log-pvc
  namespace: wp-cluster
spec:
  storageClassName: nfs-wp-cluster
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```





## WordPress deployment


```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app: wordpress
  name: wordpress
spec:
  selector:
    app: wordpress
  type: NodePort
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 30388
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
  namespace: wp-cluster
  labels:
    app: wordpress
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress
  template:
    metadata:
      labels:
        app: wordpress
    spec:
      containers:
      - image: wordpress
        name: wordpress
        env:
        - name: WORDPRESS_DB_NAME
          value: wpdb
        - name: WORDPRESS_DB_USER
          value: wp_user
        - name: WORDPRESS_DB_PASSWORD
          value: Ceamg.com
        - name: WORDPRESS_DB_HOST
          value: wpdb57
        volumeMounts:
        - mountPath: "/var/www/html"
          name: wp-data-volume
      volumes:
        - name: wp-data-volume
          persistentVolumeClaim:
            claimName: wp-data-pvc
```



```yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wp-data-pvc
  namespace: wp-cluster
spec:
  storageClassName: nfs-wp-cluster
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 200Gi
```



```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    app: wordpress
  name: wordpress
spec:
  selector:
    app: wordpress
  type: NodePort
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 30388
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
  namespace: wp-cluster
  labels:
    app: wordpress
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress
  template:
    metadata:
      labels:
        app: wordpress
    spec:
      containers:
      - image: wordpress
        name: wordpress
        env:
        - name: WORDPRESS_DB_NAME
          value: wpdb
        - name: WORDPRESS_DB_USER
          value: wp_user
        - name: WORDPRESS_DB_PASSWORD
          value: Ceamg.com
        - name: WORDPRESS_DB_HOST
          value: wpdb57
        volumeMounts:
        - mountPath: "/var/www/html"
          name: wp-data-volume
        volumeMounts:
        - name: phpini-config
          mountPath: /usr/local/etc/php/conf.addition        
      volumes:
        - name: wp-data-volume
          persistentVolumeClaim:
            claimName: wp-data-pvc
      volumes:
        - name: phpini-config
          configMap:
            name: wordpress-php-addition-config
```





## NFS Provisioner Values


```yaml
nfs:
  server: 10.1.0.38
  path: /data/k8s/wp-cluster
  mountOptions:
    - vers=4
#    - minorversion=0
#    - rsize=1048576
#    - wsize=1048576
#    - hard
#    - timeo=600
#    - retrans=2
#    - noresvport

storageClass:
  name: nfs-wp-cluster
  defaultClass: false
  allowVolumeExpansion: true
  reclaimPolicy: Delete
  provisionerName: nfs-wp-cluster
  archiveOnDelete: true
```



```bash
#添加harbor私有仓库
helm repo add --username=xceo --password=Ceamg.com1234 ceamg https://harbor.ceamg.com/chartrepo/chart \
--ca-file /etc/containerd/certs.d/harbor.ceamg.com/ca.crt \
--cert-file  /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.crt \
--key-file /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.key

"ceamg" has been added to your repositories
```



```bash
root@k8s-made-01-32:/yaml/nfs# helm repo list
NAME                            URL
nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
rmxc                            https://harbor.rmxc.tech/chartrepo/charts
ceamg                           https://harbor.ceamg.com/chartrepo/chart
bitnami                         https://charts.bitnami.com/bitnami
jetstack                        https://charts.jetstack.io
```



```bash
helm install -n wp-cluster -f /yaml/nfs/nfs-provisioner.value.yaml nfs-wp-cluster ceamg/nfs-subdir-external-provisioner
```





## helm install


```bash
root@k8s-made-01-32:/yaml/nfs# helm install -n wp-cluster -f /yaml/nfs/nfs-provisioner.value.yaml nfs-wp-cluster ceamg/nfs-subdir-external-provisioner
NAME: nfs-wp-cluster
LAST DEPLOYED: Mon Nov 13 15:46:52 2023
NAMESPACE: wp-cluster
STATUS: deployed
REVISION: 1
TEST SUITE: None
```



```bash
root@k8s-made-01-32:/yaml/wp-cluster# kubectl get pod -n wp-cluster
NAME                                                              READY   STATUS    RESTARTS   AGE
nfs-wp-cluster-nfs-subdir-external-provisioner-77d6fc75dc-hfxrb   1/1     Running   0          51m
```





## 创建wpdb-pvc


```bash
root@k8s-made-01-32:/yaml/wp-cluster# kubectl apply -f wpdb-pvc.yaml
persistentvolumeclaim/wpdb-data-pvc created
persistentvolumeclaim/wpdb-log-pvc created
```





```bash
root@k8s-made-01-32:/yaml/wp-cluster# kubectl get pvc -n wp-cluster
NAME            STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS     AGE
wpdb-data-pvc   Bound    pvc-92a0cbb3-a060-4d5c-9c87-66f87ad802e9   150Gi      RWO            nfs-wp-cluster   19s
wpdb-log-pvc    Bound    pvc-b0811659-797d-4e91-9cb9-6c87ab8a2812   50Gi       RWO            nfs-wp-cluster   19s
```





## 创建wpdata-pvc


```bash
root@k8s-made-01-32:/yaml/wp-cluster# kubectl apply -f wp-data.yaml
persistentvolumeclaim/wp-data-pvc created
```



```bash
root@k8s-made-01-32:/yaml/wp-cluster# kubectl get pvc -n wp-cluster
NAME            STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS     AGE
wp-data-pvc     Bound    pvc-e3e1b943-b567-49e6-a7bf-ed8f0534ab2c   200Gi      RWO            nfs-wp-cluster   3s
wpdb-data-pvc   Bound    pvc-92a0cbb3-a060-4d5c-9c87-66f87ad802e9   150Gi      RWO            nfs-wp-cluster   2m12s
wpdb-log-pvc    Bound    pvc-b0811659-797d-4e91-9cb9-6c87ab8a2812   50Gi       RWO            nfs-wp-cluster   2m12s
```



## 创建mysql-secret


```bash

root@k8s-made-01-32:/yaml/wp-cluster# kubectl create secret generic -n wp-cluster  wpdb-secret --from-literal=password=Ceamg.com
secret/wpdb-secret created

root@k8s-made-01-32:/yaml/wp-cluster# kubectl get secrets -n wp-cluster
NAME                                   TYPE                 DATA   AGE
sh.helm.release.v1.nfs-wp-cluster.v1   helm.sh/release.v1   1      62m
wpdb-secret                            Opaque               1      16s
```



## 创建mysql-pod


```bash
root@k8s-made-01-32:/yaml/wp-cluster# kubectl apply -f wpdb-deploy.yaml
service/wpdb created
deployment.apps/wpdb created
```



## 创建wordpress Pod


```bash
apiVersion: v1
kind: Service
metadata:
  labels:
    app: wordpress
  name: wordpress
spec:
  selector:
    app: wordpress
  type: NodePort
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 30388
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
  namespace: wp-cluster
  labels:
    app: wordpress
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wordpress
  template:
    metadata:
      labels:
        app: wordpress
    spec:
      containers:
      - image: wordpress
        name: wordpress
        env:
        - name: WORDPRESS_DB_NAME
          value: wpdb
        - name: WORDPRESS_DB_USER
          value: wp_user
        - name: WORDPRESS_DB_PASSWORD
          value: Ceamg.com
        - name: WORDPRESS_DB_HOST
          value: wpdb57
        volumeMounts:
        - mountPath: "/var/www/html"
          name: wp-data-volume
      volumes:
        - name: wp-data-volume
          persistentVolumeClaim:
            claimName: wp-data-pvc
```



```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql57
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql57
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: mysql57
    spec:
      securityContext:
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: mysql57
          image: mysql:5.7
          env:
            - name: TZ
              value: Asia/Shanghai
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql57-secrets
                  key: root
            - name: MYSQL_DATABASE
              value: test
            - name: MYSQL_USER
              value: test_user
            - name: MYSQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql57-secrets
                  key: test_user
          ports:
            - name: mysql
              containerPort: 3306
          volumeMounts:
            - name: mysql57-data
              mountPath: /var/lib/mysql
            - name: mysql57-log
              mountPath: /var/log/mysql
            - name: mysql57-config
              mountPath: /etc/mysql/conf.d/custom.cnf
              subPath: custom.cnf
              readOnly: true
          resources:
            requests:
              memory: "2Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "2"
      volumes:
        - name: mysql57-data
          persistentVolumeClaim:
            claimName: mysql57-data
        - name: mysql57-log
          persistentVolumeClaim:
            claimName: mysql57-log
        - name: mysql57-config
          configMap:
            name: mysql57-config
            items:
              - key: custom.cnf
                path: custom.cnf

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql57-config
data:
  custom.cnf: |
    [mysqld]
    default_authentication_plugin=mysql_native_password
    skip-name-resolve
    datadir=/var/lib/mysql
    bind-address=0.0.0.0

    log-error=/var/log/mysql/error.log
    slow_query_log=1
    long_query_time=3
    slow_query_log_file=/var/log/mysql/slow_query.log

    # replication
    log-bin=binlog
    binlog_format=ROW
    server-id=1
    innodb_flush_log_at_trx_commit=1
    sync_binlog=1

    # fulltext index
    ngram_token_size=1

    # required by confluence
    default_storage_engine=InnoDB
    character-set-server=utf8mb4
    collation-server=utf8mb4_bin
    max_allowed_packet=256M
    innodb_log_file_size=2GB
    transaction-isolation=READ-COMMITTED
    binlog_format=row

    # required by quartz
    # will make table name case-insensitive
    lower_case_table_names=1

    # sql mode disable full_group for backward compatibility
    sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION

---
apiVersion: v1
kind: Service
metadata:
  name: mysql57-nodeport
spec:
  type: NodePort
  ports:
    - name: mysql
      port: 3306
      targetPort: mysql
      nodePort: 30357
      protocol: TCP
  selector:
    app: mysql57


---
apiVersion: v1
kind: Service
metadata:
  name: mysql57
spec:
  type: ClusterIP
  ports:
    - name: mysql
      port: 3306
      targetPort: mysql
      protocol: TCP
  selector:
    app: mysql57
```



```bash
exit;

kubectl create secret generic mysql57-secrets \
  --from-literal=root="$(openssl rand -hex 12)" \
  --from-literal=test_user="$(openssl rand -hex 12)"
```



## 访问测试


![](http://img.xinn.cc/image-20231115161831228.png)



## 配置Nginx 代理


编译安装 Nginx 在 Ubuntu 20.04 上相对直接，但是需要注意安装编译所需的依赖项。以下是编译安装 Nginx 的基本步骤：



### 1. 安装编译依赖项


确保您的系统已经安装了编译 Nginx 所需的基本工具和依赖项：



```bash
sudo apt update
sudo apt install -y curl gnupg2 build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev
```



### 2. 下载并解压 Nginx 源代码


您可以从 Nginx 官网下载最新的稳定版或特定版本的源代码：



```bash
cd /tmp
curl -LO https://nginx.org/download/nginx-1.24.0.tar.gz   # 请替换为您希望使用的版本链接
tar -zxvf nginx-1.24.0.tar.gz
cd nginx-1.24.0  # 进入解压后的目录
```



### 配置并编译 Nginx


执行 `configure` 脚本以配置编译参数。这里仅提供了最基本的配置示例：



```bash
./configure --prefix=/usr/local/nginx \
            --with-http_ssl_module \
            --with-http_v2_module \
            --with-http_gzip_static_module \
            --with-http_stub_status_module \
            --with-pcre \
            --with-http_realip_module \
            --with-threads \
            --with-http_sub_module \
            --with-http_secure_link_module \
            --with-stream
```



如果您有其他需要的模块或特定的配置选项，请根据实际需求添加到 `./configure` 命令中。



### 4. 编译和安装


运行以下命令来编译和安装 Nginx：



```bash
make
sudo make install
```



### 5. 启动 Nginx


完成安装后，您可以使用以下命令启动 Nginx：



```bash
sudo /usr/local/nginx/sbin/nginx
```



### 6. 验证安装


在浏览器中输入您服务器的 IP 地址或域名，如果一切正常，您应该能够看到默认的 Nginx 欢迎页面。



### 注意事项


+ 编译安装的 Nginx 默认安装路径为 `/usr/local/nginx`，您可以根据需要修改。
+ 启动 Nginx 后，可以使用 `sudo /usr/local/nginx/sbin/nginx -s stop` 停止它，或者使用 `sudo /usr/local/nginx/sbin/nginx -s reload` 重新加载配置文件。



以下是一些常用的 Nginx 编译参数和其作用：



```bash
--prefix=path

指定安装目录，默认为 /usr/local/nginx。
--with-http_ssl_module

启用 HTTPS 支持，允许使用 SSL/TLS 协议。
--with-http_v2_module

启用 HTTP/2 支持，提升性能和效率。
--with-http_gzip_static_module

启用静态 Gzip 模块，使 Nginx 在传输静态文件时压缩文件。
--with-http_stub_status_module

启用状态页面模块，允许通过特定端点查看 Nginx 的状态和统计信息。
--with-pcre

启用 Perl Compatible Regular Expressions (PCRE) 库，用于支持正则表达式。
--with-http_realip_module

启用 Real IP 模块，用于获取客户端真实 IP 地址。
--with-threads

启用线程支持。
--with-http_sub_module

启用 Substitution 模块，用于在传送响应之前替换响应文本中的字符串。
--with-http_secure_link_module

启用 Secure Link 模块，用于生成和验证安全链接。
--with-stream

启用 Stream 模块，用于 TCP 和 UDP 的负载均衡和代理。
```



这些参数只是一小部分可用选项的示例。根据您的实际需求和项目要求，您可能需要根据需要选择其他模块或特定功能。您可以通过运行 `./configure --help` 命令来查看所有可用的配置选项和模块。



```bash
export PATH=$PATH:/usr/local/nginx/sbin
```



```bash
root@k8s-master01:/usr/local/nginx# vim /etc/profile.d/nginx.sh
root@k8s-master01:/usr/local/nginx# source /etc/profile.d/nginx.sh
root@k8s-master01:/usr/local/nginx#
root@k8s-master01:/usr/local/nginx# nginx -t
nginx: the configuration file /usr/local/nginx/conf/nginx.conf syntax is ok
nginx: configuration file /usr/local/nginx/conf/nginx.conf test is successful
```



## 基于HTTP协议实现


```bash
http {
    upstream backend_servers {
        server 10.1.0.33:30388;
        server 10.1.0.32:30388;
        server 10.1.0.34:30388;
        server 10.1.0.37:30388;
        server 10.1.0.35:30388;
    }

    server {
        listen 80;
        server_name wiki.ceamg.com;

        location / {
            proxy_pass http://backend_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```



## 基于HTTPS 协议实现


```bash
http {
    upstream backend_servers {
        server 10.1.0.33:30388;
        server 10.1.0.32:30388;
        server 10.1.0.34:30388;
        server 10.1.0.37:30388;
        server 10.1.0.35:30388;
    }

    server {
        listen 80;
        server_name wiki.ceamg.com;


        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name wiki.ceamg.com;

        ssl_certificate /path/to/your/fullchain.pem;
        ssl_certificate_key /path/to/your/privkey.pem;

        # SSL 配置，可以根据需求添加其他 SSL 相关配置项

        location / {
            proxy_pass http://backend_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```



## 测试代理访问


![](http://img.xinn.cc/image-20231115162053336.png)



Mysql 8.0 安装 [https://blog.csdn.net/zwqjoy/article/details/112243757](https://blog.csdn.net/zwqjoy/article/details/112243757)



## 后台地址


6e95024f3c54![6e95024f3c54](http://img.xinn.cc/6e95024f3c54.png)