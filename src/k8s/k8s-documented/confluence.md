---
author: Ryan
title: Confluence 部署
date: 2024-06-25
image: http://img.xinn.cc/xwiki/confluence-5.png
---

# 1.Confluence镜像构建

## 创建响应文件
为了使 Confluence 安装过程无交互化，需要创建一个响应文件。新建一个名为 response.varfile 的文件，内容如下：

```ini
# install4j response file for Confluence
app.install.service$Boolean=false
existingInstallationDir=/opt/atlassian/confluence
sys.confirmedUpdateInstallationString=false
sys.languageId=en
sys.installationDir=/opt/atlassian/confluence
```

##  Dockerfile

```docker
FROM openjdk:8-jdk

# 设置环境变量
ENV CONFLUENCE_HOME=/var/atlassian/application-data/confluence
ENV CONFLUENCE_INSTALL=/opt/atlassian/confluence
ENV CONFLUENCE_VERSION=6.12.4

# 创建必要的目录
RUN mkdir -p ${CONFLUENCE_HOME} \
    && mkdir -p ${CONFLUENCE_INSTALL}

# 复制安装文件到容器中
COPY atlassian-confluence-${CONFLUENCE_VERSION}-x64.bin /tmp/confluence-installer.bin
COPY mysql-connector-java-5.1.46-bin.jar /tmp/mysql-connector-java-5.1.46-bin.jar

# 设置权限并运行安装程序
RUN chmod +x /tmp/confluence-installer.bin \
    && /tmp/confluence-installer.bin -q -varfile /tmp/response.varfile

# 将 MySQL 驱动复制到 Confluence lib 目录
RUN cp /tmp/mysql-connector-java-5.1.46-bin.jar ${CONFLUENCE_INSTALL}/confluence/WEB-INF/lib/

# 配置 Confluence 主目录
RUN echo confluence.home=${CONFLUENCE_HOME} > ${CONFLUENCE_INSTALL}/confluence/WEB-INF/classes/confluence-init.properties

# 暴露必要的端口
EXPOSE 8090 8091

# 设置启动命令
CMD ["/opt/atlassian/confluence/bin/start-confluence.sh", "-fg"]

```

## 构建 Docker 镜像
将 `atlassian-confluence-6.12.0-x64.bin` 文件复制到 confluence-docker 目录中，然后在该目录中运行以下命令以构建 Docker 镜像：
```bash
root@harbor01[15:19:12]/dockerfile/confluence #:ls
atlassian-confluence-6.12.0-x64.bin  Dockerfile  mysql-connector-java-5.1.46-bin.jar  response.varfile

root@harbor01[15:19:13]/dockerfile/confluence #:docker build -t registry.cn-beijing.aliyuncs.com/xxk8s/confluence:6.12.0 .

root@harbor01[15:21:16]/dockerfile/confluence #:docker push registry.cn-beijing.aliyuncs.com/xxk8s/confluence:6.12.0
The push refers to repository [registry.cn-beijing.aliyuncs.com/xxk8s/confluence]
6a21f326a87e: Pushed
84dc8d449990: Pushed
64fd8c5ed56b: Pushed
cf5e779d98a6: Pushed
008a79ddabc4: Pushed
81db3665122d: Pushed
85a39f35ef2f: Pushed
6b5aaff44254: Pushed
53a0b163e995: Pushed
b626401ef603: Pushed
9b55156abf26: Pushed
293d5db30c9f: Pushed
03127cdb479b: Pushed
9c742cd6c7a5: Pushed
6.12.0: digest: sha256:271ecda67585a281b99671c7ad4790ad469a38607e2d5f509f97814ad98009c8 size: 3263
```


## 启动 Confluence 容器
构建完成后，可以使用以下命令启动 Confluence 容器：

```bash
docker run -v /data/confluence:/var/atlassian/application-data/confluence \
  -p 8090:8090 -p 8091:8091 \
  --name confluence \
  -d confluence:6.12.0
```

`-v /data/confluence:/var/atlassian/application-data/confluence`：将主机的 `/data/confluence` 目录挂载到容器中的`/var/atlassian/` `application-data/confluence`，用于持久化数据。

`-p 8090:8090`：映射 Confluence 的主端口。
`-p 8091:8091`：映射 Confluence 的控制端口。
`--name confluence`：指定容器名称为 confluence。
`-d`：在后台运行容器。






# 2.Mysql57部署
为了为 Confluence 部署一个 MySQL 数据库到 Kubernetes.

## 创建confluence namespace

```bash
root@master-01:/confluence# kubectl create ns confluence
namespace/confluence created
```

## 创建 ConfigMap 数据库初始化脚本
创建一个 `mysql-initdb-configmap.yaml` 文件，内容如下：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-initdb-config
data:
  initdb.sql: |
    CREATE DATABASE IF NOT EXISTS confluence CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
    CREATE USER IF NOT EXISTS 'confluenceuser'@'%' IDENTIFIED BY 'confluencepassword';
    GRANT ALL PRIVILEGES ON confluence.* TO 'confluenceuser'@'%';
    FLUSH PRIVILEGES;

```
使用环境变量和配置文件自动运行初始化脚本的方法是利用 MySQL 容器的内置功能。当 MySQL 容器启动时，它会自动执行挂载在 `/docker-entrypoint-initdb.d` 目录中的任何 .sql 文件。我们可以利用这一特性，将初始化脚本挂载到该目录，并在 MySQL 容器启动时自动运行这些脚本。


## 创建MySQL Secret存储凭据
创建一个 Kubernetes Secret 来存储 MySQL 的密码：



```bash
root@master-01:/confluence# MYSQL_ROOT_PASSWORD=$(openssl rand -base64 10)
MYSQL_PASSWORD=$(openssl rand -base64 10)
echo "Root password: $MYSQL_ROOT_PASSWORD"
echo "Confluence password: $MYSQL_PASSWORD"
Root password: 42QRbA1U56k5wg==
Confluence password: 66s06HuxQZzG1A==
```

```bash
kubectl create secret -n confluence generic mysql-secret -n confluence \
  --from-literal=mysql-root-password=$MYSQL_ROOT_PASSWORD \
  --from-literal=mysql-user=confluenceuser \
  --from-literal=mysql-password=$MYSQL_PASSWORD
```

```bash
echo 'NjZzMDZIdXhRWnpHMUE9PQ==' | base64 --decode
echo 'NDJRUmJBMVU1Nms1d2c9PQ==' | base64 --decode
```




## 在 MySQL 部署文件增加Init Container
更新 `mysql-deployment.yaml` 文件，添加 Init Container 来执行初始化脚本： （第一次执行这个，后面就不需要Init Container删掉 ）
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  selector:
    matchLabels:
      app: mysql
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: mysql
    spec:
      initContainers:
      - name: init-mysql
        image: registry.cn-beijing.aliyuncs.com/xxk8s/mysql:5.7
        command: ['sh', '-c', 'while ! mysqladmin ping -h 127.0.0.1 --silent; do sleep 1; done && mysql -u root -p"$MYSQL_ROOT_PASSWORD" < /docker-entrypoint-initdb.d/initdb.sql']
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-root-password
        volumeMounts:
        - name: initdb
          mountPath: /docker-entrypoint-initdb.d
      containers:
      - image: registry.cn-beijing.aliyuncs.com/xxk8s/mysql:5.7
        name: mysql
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-root-password
        - name: MYSQL_DATABASE
          value: confluence
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-user
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-password
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
        - name: initdb
          mountPath: /docker-entrypoint-initdb.d
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
      - name: initdb
        configMap:
          name: mysql-initdb-config

```


## mysql-configMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
  namespace: confluence
data:
  my.cnf: |
    [mysqld]
    character-set-server=utf8
    collation-server=utf8_bin
    transaction-isolation = READ-COMMITTED

    [client]
    default-character-set=utf8
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-initdb-config
data:
  initdb.sql: |
    CREATE DATABASE IF NOT EXISTS confluence CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
    CREATE USER IF NOT EXISTS 'confluenceuser'@'%' IDENTIFIED BY 'confluencepassword';
    GRANT ALL PRIVILEGES ON confluence.* TO 'confluenceuser'@'%';
    FLUSH PRIVILEGES;
```


## mysql-pvc

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: nfs-client
```


## mysql-svc

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
    - port: 3306
      targetPort: 3306
      protocol: TCP
      nodePort: 30636
  type: NodePort
```

## mysql-deployment

创建 `mysql-deployment.yaml` 文件，内容如下：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: confluence
spec:
  selector:
    matchLabels:
      app: mysql
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - image: registry.cn-beijing.aliyuncs.com/xxk8s/mysql:5.7
        name: mysql
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-root-password
        - name: MYSQL_DATABASE
          value: confluence
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-user
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-password
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
        - name: initdb
          mountPath: /docker-entrypoint-initdb.d
        - name: config-volume
          mountPath: /etc/mysql/my.cnf
          subPath: my.cnf
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
      - name: initdb
        configMap:
          name: mysql-initdb-config
      - name: config-volume
        configMap:
          name: mysql-config
```


## mysql可能遇到的问题

Confluence 不支持数据库排序规则 `utf8_general_ci`。 您需要使用 `utf8_bin`

![img](https://oss.rmxc.com.cn/wiki/2024/xcimg/1719219658188-750c510c-47e6-4148-9c05-7707ea43f20d.png)

修改 MySQL 数据库字符集和排序规则
```sql
kubectl exec -it mysql -n confluence -- /bin/bash

#登录
mysql -u root -p
#输入密码后，修改数据库和表的字符集和排序规则：
ALTER DATABASE confluence CHARACTER SET utf8 COLLATE utf8_bin;

#确保所有表和列使用 utf8 字符集和 utf8_bin 排序规则：

USE confluence;

SELECT CONCAT('ALTER TABLE ', table_name, ' CONVERT TO CHARACTER SET utf8 COLLATE utf8_bin;') 
FROM information_schema.tables 
WHERE table_schema = 'confluence';

```


**您的数据库必须使用'READ-COMMITTED'作为默认隔离级别**

解决方法是修改MySQL 配置文件，之前没有配置现在以configMap形式加到Pod中

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
  namespace: confluence
data:
  my.cnf: |
    [mysqld]
    character-set-server=utf8
    collation-server=utf8_bin
    transaction-isolation = READ-COMMITTED

    [client]
    default-character-set=utf8
```

重新创建 MySQL Pod 后

```sql
#进入 MySQL 容器运行以下命令以验证默认事务隔离级别

SHOW VARIABLES LIKE 'transaction_isolation';

+-----------------------+-----------------+
| Variable_name         | Value           |
+-----------------------+-----------------+
| transaction_isolation | READ-COMMITTED  |
+-----------------------+-----------------+

```


**测试数据库连接**

```sql
jdbc:mysql://mysql:3306/confluence?useUnicode=true&characterEncoding=utf8&useSSL=false
```



# 3.Confluence部署


## 创建confluence PVC

### 创建confluence 数据目录PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: confluence-pvc
  namespace: confluence
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Gi
  storageClassName: nfs-client
```

### 创建confluence 安装目录PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: confluence-opt-pvc
  namespace: confluence
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: nfs-client
```


## 初始化

因为新建的PVC为空目录，此时如果挂载到PVC，Confluence数据会被覆盖，所有需要`initContainer`先将镜像中的数据拷贝到PVC中。

因此我们在第一次安装时，执行带有`initContainer` 容器的清单，安装之后我们再去掉`initContainer`  容器配置。


`confluence-deployment-init.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: confluence
spec:
  replicas: 1
  selector:
    matchLabels:
      app: confluence
  template:
    metadata:
      labels:
        app: confluence
    spec:
      initContainers:
      - name: init-confluence
        image: harbor2.rmxc.tech/library/confluence:6.12.4
        command: ["/bin/sh", "-c"]
        args:
          - |
            cp -r /opt/atlassian/confluence/* /confluence-install/;
            cp -r /var/atlassian/application-data/confluence/* /confluence-data/;
            chown -R 1000:1000 /confluence-install /confluence-data;
            chmod -R 755 /confluence-install /confluence-data;
        securityContext:
          runAsUser: 0
        volumeMounts:
          - name: confluence-install
            mountPath: /confluence-install
          - name: confluence-data
            mountPath: /confluence-data
      containers:
      - name: confluence
        image:  harbor2.rmxc.tech/library/confluence:6.12.4
        ports:
          - containerPort: 8090
          - containerPort: 8091
        env:
          - name: ATL_DB_TYPE
            value: mysql
          - name: ATL_JDBC_URL
            value: jdbc:mysql://mysql:3306/confluence?useUnicode=true&characterEncoding=utf8&useSSL=false
          - name: ATL_JDBC_USER
            valueFrom:
              secretKeyRef:
                name: mysql-secret
                key: mysql-user
          - name: ATL_JDBC_PASSWORD
            valueFrom:
              secretKeyRef:
                name: mysql-secret
                key: mysql-password
          - name: TZ
            value: "Asia/Shanghai"
        resources:
          limits:
            memory: "4Gi"
            cpu: "1000m"
          requests:
            memory: "2048Mi"
            cpu: "500m"
        volumeMounts:
          - name: confluence-install
            mountPath: /opt/atlassian/confluence
          - name: confluence-data
            mountPath: /var/atlassian/application-data/confluence
      volumes:
        - name: confluence-install
          persistentVolumeClaim:
            claimName: confluence-opt-pvc
        - name: confluence-data
          persistentVolumeClaim:
            claimName: confluence-pvc
      imagePullSecrets:
        - name: harbor-registry


```




`confluence-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: confluence
spec:
  replicas: 1
  selector:
    matchLabels:
      app: confluence
  template:
    metadata:
      labels:
        app: confluence
    spec:
      containers:
      - name: confluence
        image:  harbor2.rmxc.tech/library/confluence:6.12.4
        ports:
          - containerPort: 8090
          - containerPort: 8091
        env:
          - name: ATL_DB_TYPE
            value: mysql
          - name: ATL_JDBC_URL
            value: jdbc:mysql://mysql:3306/confluence?useUnicode=true&characterEncoding=utf8&useSSL=false
          - name: ATL_JDBC_USER
            valueFrom:
              secretKeyRef:
                name: mysql-secret
                key: mysql-user
          - name: ATL_JDBC_PASSWORD
            valueFrom:
              secretKeyRef:
                name: mysql-secret
                key: mysql-password
          - name: TZ
            value: "Asia/Shanghai"
        resources:
          limits:
            memory: "4Gi"
            cpu: "1000m"
          requests:
            memory: "2048Mi"
            cpu: "500m"
        volumeMounts:
          - name: confluence-install
            mountPath: /opt/atlassian/confluence
          - name: confluence-data
            mountPath: /var/atlassian/application-data/confluence
      volumes:
        - name: confluence-install
          persistentVolumeClaim:
            claimName: confluence-opt-pvc
        - name: confluence-data
          persistentVolumeClaim:
            claimName: confluence-pvc
      imagePullSecrets:
        - name: harbor-registry

```

## 软件绿化操作

绿化工具下载： https://pan.baidu.com/s/1FTgS7aW4uU2CDb9q9OX_Iw
提取码：asn9

```bash
1： /opt/atlassian/confluence/confluence/WEB-INF/lib/atlassian-extras-decoder-v2-3.4.1.jar文件到本地
2：本地重命名为atlassian-extras-2.4.jar
3：打开破解工具confluence_keygen.jar（本地需先安装java）
4：选择.patch!找atlassian-extras-2.4.jar打开
5：可以看到atlassian-extras-2.4.jar和atlassian-extras-2.4.bak两个文件，这里atlassian-extras-2.4.jar已经是破解好的了，将atlassian-extras-2.4.jar名字改回来atlassian-extras-decoder-v2-3.4.1.jar
6：将atlassian-extras-decoder-v2-3.4.1.jar上传到服务器原目录
```



安装Confluence 

![confluence安装1](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence安装1.png)



![confluence-2](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-2.png)

![confluence-3](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-3.png)

![confluence-4](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-4.png)

![confluence-5](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-5.png)

![confluence-6](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-6.png)

![confluence-7](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-7.png)

![img](https://oss.rmxc.com.cn/wiki/2024/xcimg/1719220776405-2593721b-04a2-4422-8681-2691cfcc5916.png)

![confluence-9](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-9.png)

![confluence-12](https://oss.rmxc.com.cn/wiki/2024/xcimg/confluence-12.png)



## 配置 Confluence

启动容器后，可以通过浏览器访问 `http://<你的服务器IP>:8090` 来配置 Confluence。根据向导完成初始化设置，包括选择数据库类型（内置数据库或外部数据库）等。

通过这些步骤，您可以使用 atlassian-confluence-6.12.0-x64.bin 文件通过 Docker 部署和运行 Confluence。


## svc

```yaml
apiVersion: v1
kind: Service
metadata:
  name: confluence
  namespace: confluence
spec:
  selector:
    app: confluence
  type: NodePort
  ports:
    - port: 8090
      targetPort: 8090
      protocol: TCP
      nodePort: 31090  # 固定的 NodePort 端口
      name: http
    - port: 8091
      targetPort: 8091
      protocol: TCP
      nodePort: 31091  # 固定的 NodePort 端口
      name: control
```



## 导入数据

```bash
rsync -avz /k8sdata/nfs-client/rmxc-base-wiki-data-pvc-a7200e28-87ef-4f34-a03d-fc4777ebf9a9/application-data/confluence/ /k8sdata/nfs-client/confluence-confluence-pvc-pvc-9d47f688-fc2c-48c0-8966-085e69738837/
```



## ingress

```yaml
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: confluence-ingress
  namespace: confluence
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "false"

spec:
  tls:
    - hosts:
        - zz.rmxc.tech
      secretName: zz.rmxc.tech
  rules:
    - host: zz.rmxc.tech
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: confluence
                port:
                  number: 8090
```

# confluence 还原密码



运行此sql 找到你的管理员帐户：

```sql
select u.id, u.user_name, u.active from cwd_user u  
join cwd_membership m on u.id=m.child_user_id join cwd_group g on m.parent_id=g.id join cwd_directory d on d.id=g.directory_id  
where g.group_name = 'confluence-administrators' and d.directory_name='Confluence Internal Directory'; 
```



并记住管理员帐户的id



运行此sql, 恢复管理员密码为 **admin**

 ```sql
 update cwd_user set credential =  
 'x61Ey612Kl2gpFL56FT9weDnpSo4AV8j8+qx2AuTHdRyY036xxzTTrw10Wq3+4qQyB+XURPWx1ONxp3Y3pB37A=='  
 where id=xxxxxx;  
 ```

注意此处**xxxxxx** 为上一步的 id



如果你的密码是`**{PKCS5S2}**`前缀开头的，则用下面这个sql:

```sql
update cwd_user set credential =  
'{PKCS5S2}ltrb9LlmZ0QDCJvktxd45WgYLOgPt2XTV8X7av2p0mhPvIwofs9bHYVz2OXQ6/kF'  
where id=xxxxxx;  
```

这个管理员密码为 **Ab123456**



 如果使用hsql，请用下面语句登录hsql数据库

```
java -cp /opt/atlassian/confluence/WEB-INF/lib/hsqldb-2.3.0.jar org.hsqldb.util.DatabaseManager -user sa -url jdbc:hsqldb:/data/confluence/data/database/confluencedb


java -cp hsqldb-2.3.0.jar org.hsqldb.util.DatabaseManager -user sa -url jdbc:hsqldb:confluencedb
```


```sql
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| ceamg_wiki         |
| confluence         |
| mysql              |
| performance_schema |
| sys                |
| wiki.rmxc.tech     |
+--------------------+
7 rows in set (0.00 sec)

mysql> CREATE USER 'wiki_rmxc_tech_user'@'%' IDENTIFIED BY 'bmUpdpFyaZy45l1jDR';
Query OK, 0 rows affected (0.09 sec)

mysql> GRANT ALL PRIVILEGES ON wiki_rmxc_tech.* TO 'wiki_rmxc_tech_user'@'%';
Query OK, 0 rows affected (0.00 sec)

mysql> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.02 sec)

mysql> SHOW GRANTS FOR 'wiki_rmxc_tech_user'@'%';
+-------------------------------------------------------------------------+
| Grants for wiki_rmxc_tech_user@%                                        |
+-------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'wiki_rmxc_tech_user'@'%'                         |
| GRANT ALL PRIVILEGES ON `wiki_rmxc_tech`.* TO 'wiki_rmxc_tech_user'@'%' |
+-------------------------------------------------------------------------+
2 rows in set (0.00 sec)

```

```bash
  <property name="hibernate.connection.password">bmUpdpFyaZy45l1jDR</property>
    <property name="hibernate.connection.url">jdbc:mysql://mysql.confluence:3306/wiki_rmxc_tech?useUnicode=true&amp;characterEncoding=utf8&amp;useSSL=false</property>
    <property name="hibernate.connection.username">wiki_rmxc_tech_user</property>

```


**参考：**

- https://www.cnblogs.com/ios9/p/14473523.html
- https://www.cnblogs.com/linn/p/4647327.html