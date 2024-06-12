---
author: Ryan
title: 14.K8S持续集成与部署
date: 2023-02-17
---


## 1.发布方式解读
### 1.1 金丝雀发布

金丝雀发布这个术语源自20世纪初期，当时英国的煤矿工人在下井采矿之前，会把笼养的金丝雀携带到矿井中，如果矿井中一氧化碳等有毒气体的浓度过高，在影响矿工之前，金丝雀相比人类表现的更加敏感快速，金丝雀中毒之后，煤矿工人就知道该立刻撤离。金丝雀发布是在将整个软件的新版本发布给所有用户之前，先发布给部分用户，用真实的客户流量来测试，以保证软件不会出现严重问题，降低发布风险。

在实践中，金丝雀发布一般会先发布到一个小比例的机器，比如 2% 的服务器做流量验证，然后从中快速获得反馈，根据反馈决定是扩大发布还是回滚。金丝雀发布通常会结合监控系统，通过监控指标，观察金丝雀机器的健康状况。如果金丝雀测试通过，则把剩余的机器全部升级成新版本，否则回滚代码。

优势：

1. 对用户体验影响较小，在金丝雀发布过程中，只有少量用户会受影响
2. 发布安全能够得到保障

劣势：

1. 金丝雀的机器数量比较少, 有一些问题并不能够暴露出来

适用场景：

1. 监控比较完备且与发布系统集成

![金丝雀发布](https://cdn1.ryanxin.live/1676623429005-57e87756-d254-44eb-b6ba-1681e04b6679.png)

### 1.2 灰度/滚动发布
灰度发布是金丝雀发布的延伸，是将发布分成不同的阶段/批次，每个阶段/批次的用户数量逐级增加。如果新版本在当前阶段没有发现问题，就再增加用户数量进入下一个阶段，直至扩展到全部用户。

灰度发布可以减小发布风险，是一种零宕机时间的发布策略。它通过切换线上并存版本之间的路由权重，逐步从一个版本切换为另一个版本。整个发布过程会持续比较长的时间, 在这段时间内，新旧代码共存，所以在开发过程中，需要考虑版本之间的兼容性，新旧代码共存不能影响功能可用性和用户体验。当新版本代码出现问题时，灰度发布能够比较快的回滚到老版本的代码上。

结合特性开关等技术，灰度发布可以实现更复杂灵活的发布策略。

![滚动发布](https://cdn1.ryanxin.live/1676623454891-4883876b-4022-447f-bd8c-3a8b5f848104.png)

优势：

1. 用户体验影响比较小, 不需要停机发布
2. 能够控制发布风险

劣势：

1. 发布时间会比较长
2. 需要复杂的发布系统和负载均衡器
3. 需要考虑新旧版本共存时的兼容性

适用场景：

1. 适合可用性较高的生产环境发布

### 1.3 滚动发布

kubernetes默认的更新策略也就是主流发布方案是滚动更新。

每次只升级一个或多个服务，升级完成后加入生产环境， 不断执行这个过程，直到集群中的全部旧版升级新版本。

Kubernetes的默认发布策略。

特点：用户无感知，平滑过渡

缺点：

- 部署周期长（需要健康检查，等它准备就绪，然后升级下一个，健康检查还是需要花费一些时间的）
- 发布策略较复杂
- 不易回滚
-  有影响范围较大

![滚动发布](https://cdn1.ryanxin.live/1676623521344-a5370e0c-871d-4c52-b3a8-0eeb9d42c93e.png)



## 2. K8S 基于Jenkins CICD

### 2.1 安装Gitlab

#### 2.1.1准备环境

#####  2.1.1.1 创建nfs共享目录

在nfs服务器创建共享目录，部署的gitlib使用共享目录来进行持久化

```bash
$ mkdir -p /data/k8s/gitlab/config
$ mkdir -p /data/k8s/gitlab/logs
$ mkdir -p /data/k8s/gitlab/data
```



##### 2.1.1.2 添加到共享目录

```bash
$ vim /etc/exports
/data/k8s/gitlab/config 10.1.0.0/8(rw,sync,no_root_squash)
/data/k8s/gitlab/logs 10.1.0.0/8(rw,sync,no_root_squash)
/data/k8s/gitlab/data 10.1.0.0/8(rw,sync,no_root_squash)
```



##### 2.1.1.2 重启服务

```bash
$ /data/k8s/gitlab #:systemctl restart nfs-server.service
#或者
$ exportfs -r
```



#### 2.1.2 部署Gitlab

##### 2.1.2.1 准备部署yaml文件

```yaml
apiVersion: v1
kind: Service
metadata:
  name: gitlab-cicd
  namespace: cicd
spec:
  type: NodePort
  ports:
  # Port上的映射端口
  - port: 443
    targetPort: 34443
    name: gitlab443
  - port: 80
    targetPort: 38880
    name: gitlab80
  - port: 22
    targetPort: 32220
    name: gitlab22
  selector:
    app: gitlab
 
---
 
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-deploy
spec:
  selector:
    matchLabels:
      app: gitlab
  revisionHistoryLimit: 2 #revisionHistoryLimit 可以定义保留的升级记录数。
  template:
    metadata:
      labels:
        app: gitlab
    spec:
      containers:
      # 应用的镜像
      - image: harbor.ceamg.com/k8s-base/gitlab-ce:15.6.8
        name: gitlab
        imagePullPolicy: IfNotPresent
        # 应用的内部端口
        ports:
        - containerPort: 443
          name: gitlab443
        - containerPort: 80
          name: gitlab80
        - containerPort: 22
          name: gitlab22
        volumeMounts:
        # gitlab持久化
        - name: gitlab-persistent-config
          mountPath: /etc/gitlab
        - name: gitlab-persistent-logs
          mountPath: /var/log/gitlab
        - name: gitlab-persistent-data
          mountPath: /var/opt/gitlab

      volumes:
      # 使用nfs互联网存储
      - name: gitlab-persistent-config
        nfs:
          server: 10.1.0.38
          path: /data/k8s/gitlab/config
      - name: gitlab-persistent-logs
        nfs:
          server: 10.1.0.38
          path: /data/k8s/gitlab/logs
      - name: gitlab-persistent-data
        nfs:
          server: 10.1.0.38
          path: /data/k8s/gitlab/data
```



##### 2.1.2.2 执行部署

```bash
$ kubectl apply -f gitlib-ce.yaml
```



##### 2.1.2.3 查看部署结果

```bash
$ kubectl get svc -n cicd
NAME                         TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                                   AGE
gitlab-cicd                  NodePort   10.10.138.150   <none>        443:34443/TCP,80:38880/TCP,22:32220/TCP   16s
update-tomcat-app1-service   NodePort   10.10.31.155    <none>        80:30022/TCP                              6d23h
```





http://10.1.0.31:38880/users/sign_in

![gitlab](https://cdn1.ryanxin.live/image-20230227155127621.png)

##### 2.1.2.4  初始用户名和密码

初始用户名为root，初始密码gitlib自动创建，在如下文件中：

```bash
$ cat /etc/gitlab/initial_root_password
```



由于是容器部署，所以，需要进入到容器中，找到对应文件，拷贝密码进行登录。文件内容类似：

![初始用户名和密码](https://cdn1.ryanxin.live/image-20230227155649965.png)



```
# WARNING: This value is valid only in the following conditions
#          1. If provided manually (either via `GITLAB_ROOT_PASSWORD` environment variable or via `gitlab_rails['initial_root_password']` setting in `gitlab.rb`, it was provided before database was seeded for the first time (usually, the first reconfigure run).
#          2. Password hasn't been changed manually, either via UI or via command line.
#
#          If the password shown here doesn't work, you must reset the admin password following https://docs.gitlab.com/ee/security/reset_user_password.html#reset-your-root-password.

Password: F5o6JeW+jH2qmgyc/yXwlp++DiKX0XchafdYvKB7cdo=

# NOTE: This file will be automatically deleted in the first reconfigure run after 24 hours
```



进入后修改admin密码

![修改密码](https://cdn1.ryanxin.live/image-20230227155828572.png)









#### 3.1.2 deb包安装

##### 3.1.2.1 下载deb包

![](https://cdn1.ryanxin.live/image-20230306152500322.png)



#####  3.1.2.2 修改配置文件

```bash
$ dpkg -i gitlab-ce_15.7.8-ce.0_amd64.deb 
$ vim /etc/gitlab/gitlab.rb
external_url 'http://10.1.0.35'



#生成配置
$ gitlab-ctl reconfigure

Notes:
Default admin account has been configured with following details:
Username: root
Password: You didn't opt-in to print initial root password to STDOUT.
Password stored to /etc/gitlab/initial_root_password. This file will be cleaned up in first reconfigure run after 24 hours.

NOTE: Because these credentials might be present in your log files in plain text, it is highly recommended to reset the password following https://docs.gitlab.com/ee/security/reset_user_password.html#reset-your-root-password.

gitlab Reconfigured!

#查看密码
$ cat /etc/gitlab/initial_root_password
# WARNING: This value is valid only in the following conditions
#          1. If provided manually (either via `GITLAB_ROOT_PASSWORD` environment variable or via `gitlab_rails['initial_root_password']` setting in `gitlab.rb`, it was provided before database was seeded for the first time (usually, the first reconfigure run).
#          2. Password hasn't been changed manually, either via UI or via command line.
#
#          If the password shown here doesn't work, you must reset the admin password following https://docs.gitlab.com/ee/security/reset_user_password.html#reset-your-root-password.

Password: HepNFhKpXwvQo4rHpYF0t4/ijMMa8CXfghj55frY7b0=

# NOTE: This file will be automatically deleted in the first reconfigure run after 24 hours.


#登录名是root
```



![](https://cdn1.ryanxin.live/image-20230306153348145.png)







### 3.2 安装Jenkins

#### 3.2.1 jenkins 介绍

Jenkins 是一款著名的可扩展的用于自动化部署的开源 CI/CD 工具。Jenkins 是完全用 Java 编写的，是在 MIT 许可下发布的。它有一组强大的功能，可以将软件的构建、测试、部署、集成和发布等相关任务自动化。

这款用于测试的自动化 CI/CD 工具可以在 macOS、Windows 和各种 UNIX 版本（例如  OpenSUSE、Ubuntu、Red Hat 等）系统上使用。除了通过本地安装包安装，它还可以使用war包在任何安装过 Java  运行时环境（Java Runtime Environment，JRE）的机器上单独安装或者作为一个 Docker 安装。

Jenkins 团队已经开发了近 1000 个插件，使得应用程序可以与其它熟悉的技术混合使用。除此之外，还可以使用 Credentials Command 之类的插件。这使得向脚本中添加隐藏的身份验证凭证等变得简单可行。一旦 Jenkins pipeline  开始运行，你还可以验证每个阶段通过与否以及每个阶段的总数。但是，你不能在提供的图形化概览中检查特定作业的状态。你可以做的是跟踪终端中的作业进度。



**环境需求**

```bash
最小硬件需求：256M、1G磁盘空间，通常根据需要Jenkins服务器至少1G内存，50G+的磁盘空间。
软件需求：由于jenkins是使用java语言编写的，所以需要安装java运行时环境(jdk)
```







#### 3.2.2 安装JDK

从 Jenkins 2.357 版本开始，Jenkins只支持**Java 11** 和 **Java 17**

![JDK需求](https://cdn1.ryanxin.live/image-20230228131827753.png)



##### 3.2.2.1 下载源码包

**JDK 下载地址**：

11：https://www.oracle.com/java/technologies/downloads/#java11

17：https://www.oracle.com/java/technologies/downloads/#java17



![版本选择](https://cdn1.ryanxin.live/image-20230228143025864.png)



##### 3.2.2.2 解压压缩包

```bash
root@etcd01[13:24:27]~ #:mkdir /apps/jdk17 -p
root@etcd01[13:24:37]~ #:cd /apps/jdk17
root@etcd01[13:25:06]/apps/jdk17 #:tar -zxvf jdk-17_linux-x64_bin.tar.gz -C /apps/jdk17/
```



##### 3.2.2.3 配置环境变量

```bash
vim /etc/profile.d/jdk11.sh
export JAVA_HOME=/jdk11/jdk-11.0.18
export PATH=/jdk11/jdk-11.0.18/bin:$PATH
source /etc/profile.d/jdk11.sh
```



##### 3.2.2.4 测试java

```bash
root@etcd01[13:40:02]/jdk11 #:java --version
java 17.0.6 2023-01-17 LTS
Java(TM) SE Runtime Environment (build 17.0.6+9-LTS-190)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.6+9-LTS-190, mixed mode, sharing)
```



#### 3.2.3 war形式安装启动Jenkins

##### 3.2.3.1 下载war包

![版本选择](https://cdn1.ryanxin.live/image-20230228134158814.png)

##### 3.2.3.2 指定Jenkins文件保存路径

如果不设置该变量，Jenkins配置文件等都保存在 `~/.jenkins/` 目录下，不推荐

```bash
vim /etc/profile.d/jenkins.sh
export JENKINS_HOME=/data/jenkins
source /etc/profile.d/jenkins.sh 
```





##### 3.2.3.3 启动Jenkins

```bash
root@etcd01[13:46:22]/data #:mkdir /apps/jenkins -p
root@etcd01[13:46:22]/data #:mkdir -p /data/jenkins/log
nohup java -jar -Xms512m -Xmx2048m  /apps/jenkins/jenkins.war --httpPort=8181 > /data/jenkins/log/jenkins.log 2>&1 &

#nohup 英文全称 no hang up（不挂起），用于在系统后台不挂断地运行命令，退出终端不会影响程序的运行。
#-Xms 指定jvm运行最小运行堆内存，默认为物理内存1/64，用法 ：-Xmx512m 注意：Xmx和512m中间不用添加空格
#-Xmx 指定jvm运行最大运行堆内存，认物理内存1/4，用法： -Xmx1024m 注意：Xmx和1024m中间不用添加空格
#--server.port 指定jar运行的port端口，用法：--server.port=8085
```



##### 3.2.3.4 检查服务启动情况

```bash
#查看端口是否启动
root@etcd01[13:56:40]/data/jenkins #:lsof -i :8181
COMMAND     PID USER   FD   TYPE    DEVICE SIZE/OFF NODE NAME
java    1914938 root  109u  IPv6 290105770      0t0  TCP *:8181 (LISTEN)

# 查看日志
root@etcd01[13:56:52]/data/jenkins #:tail -f /data/jenkins/log/jenkins.log 
        at Main.main(Main.java:117)
WARNING: An illegal reflective access operation has occurred
WARNING: Illegal reflective access by org.codehaus.groovy.vmplugin.v7.Java7$1 (file:/data/jenkins/war/WEB-INF/lib/groovy-all-2.4.21.jar) to constructor java.lang.invoke.MethodHandles$Lookup(java.lang.Class,int)
WARNING: Please consider reporting this to the maintainers of org.codehaus.groovy.vmplugin.v7.Java7$1
WARNING: Use --illegal-access=warn to enable warnings of further illegal reflective access operations
WARNING: All illegal access operations will be denied in a future release
2023-02-28 05:56:43.644+0000 [id=1]     INFO    o.e.j.s.handler.ContextHandler#doStart: Started w.@68ac9ec5{Jenkins v2.346.3,/,file:///data/jenkins/war/,AVAILABLE}{/data/jenkins/war}
2023-02-28 05:56:43.670+0000 [id=1]     INFO    o.e.j.server.AbstractConnector#doStart: Started ServerConnector@6492fab5{HTTP/1.1, (http/1.1)}{0.0.0.0:8181}
2023-02-28 05:56:43.671+0000 [id=1]     INFO    org.eclipse.jetty.server.Server#doStart: Started @3925ms
2023-02-28 05:56:43.672+0000 [id=24]    INFO    winstone.Logger#logInternal: Winstone Servlet Engine running: controlPort=disabled
```



##### 3.2.3.5 浏览器访问查看

http://10.1.0.34:8181

::: warning



AWT is not properly configured on this server. Perhaps you need to run  your container with "-Djava.awt.headless=true"? See also:  https://www.jenkins.io/redirect/troubleshooting/java.awt.headless\

:::



![](https://cdn1.ryanxin.live/image-20230228141015641.png)



由于缺少AWT相关文件导致Jenkins报错，在该参考链接（https://wiki.jenkins.io/display/JENKINS/Jenkins+got+java.awt.headless+problem）中，给出的解决方案是安装ttf-dejavu字体。



![ttf](https://cdn1.ryanxin.live/image-20230228140851725.png)







**解决方法：**

安装**fontconfig**和字体 **ttf-dejavu**

```
sudo apt-get install fontconfig ttf-dejavu
```







**重启jvm进程来让其生效**



```bash
root@etcd01[14:11:30]/data/jenkins #:ps -ef | grep java
root     1914938 1654781  1 13:56 pts/0    00:00:13 java -jar -Xms512m -Xmx2048m /apps/jenkins/jenkins.war --httpPort=8181
root     1995311 1654781  0 14:12 pts/0    00:00:00 grep --color=auto java

root@etcd01[14:12:21]/data/jenkins #:kill 9 1914938
root@etcd01[14:12:21]/data/jenkins #:sudo apt-get install fontconfig ttf-dejavu
root@etcd01[14:12:31]/data/jenkins #:nohup java -jar -Xms512m -Xmx2048m /apps/jenkins/jenkins.war --httpPort=8181 > /data/jenkins/log/jenkins.log 2>&1
```



再次访问

好了，终于出现熟悉而正常的页面了。稍等片刻就可以继续了。

![](https://cdn1.ryanxin.live/image-20230228145503677.png)

##### 3.2.3.5 初始化Jenkins

![](https://cdn1.ryanxin.live/image-20230228153103526.png)



获取密码

```
root@etcd01[14:13:21]~ #:cat /data/jenkins/secrets/initialAdminPassword 
100b1b877f0f4ae3ab1b0f543416c66a
```





**如果出现以下情况**

![](https://cdn1.ryanxin.live/1461466-20220905180926789-1769783018.png)



将url中的数据改为国内清华源：https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json 

修改配置文件（`$JENKINS_HOME/hudson.model.UpdateCenter.xml`），然后重启Jenkins

```xml
vim /data/jenkins/hudson.model.UpdateCenter.xml 
<?xml version='1.1' encoding='UTF-8'?>
<sites>
  <site>
    <id>default</id>
    <url>https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json </url>
  </site>
</sites>
```



**安装插件**

![](https://cdn1.ryanxin.live/image-20230228155707831.png)

**创建用户**



![](https://cdn1.ryanxin.live/image-20230228155519214.png)



**完成安装**

![](https://cdn1.ryanxin.live/image-20230228160122539.png)





##### 3.2.3.6 离线方式安装插件

插件库镜像：http://mirror.xmission.com/jenkins/plugins/
清华源：https://mirrors.tuna.tsinghua.edu.cn/jenkins/plugins/



**插件库下载需要的插件**

![](https://cdn1.ryanxin.live/image-20230228160333483.png)



![](https://cdn1.ryanxin.live/image-20230228160443692.png)

![更换升级中心](https://cdn1.ryanxin.live/image-20230228160528892.png)





**上传插件**

![上传插件](https://cdn1.ryanxin.live/image-20230228160705653.png)



##### 3.2.3.7 忘记Jenkins密码

1. 打开`$JENKINS_HOME/users/admin_11282843175228848240/config.xml`
2. 将`passwordHash`替换为 123456 的哈希值：`#jbcrypt:$2a$10$MiIVR0rr/UhQBqT.bBq0QehTiQVqgNpUGyWW2nJObaVAM/2xSQdSq`
3. 重启 Jenkins

```bash
vim /data/jenkins/users/jenkins_3715012869271617135/config.xml
```



![](https://cdn1.ryanxin.live/image-20230228161235971.png)





### 3.3 对接Jenkins拉取代码



#### 3.3.1 服务器之间免密

**需求**：服务器之间免密

**目的**：拉取代码时免密
 导出Jenkins服务器秘钥到gitlab服务器中。

```bash
root@etcd01[16:20:31]~ #:ssh-keygen -t rsa -q -P "" -f ~/.ssh/id_rsa
root@etcd01[16:20:31]~ #:cat /root/.ssh/id_rsa.pub 
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCvFuqsriXcIcyRQG7KpYbwtM+Fn5BSyJSvfGdDIbOymHt7eFlWPQ/qmsnzdey2V28InALJIBJkQcfRwjmG3OTPsYpcP+ea0jhQ1GJHcamERwDJDxcg7jyk+r+dRwGhxLlWeHdiORGZGdqM2LPp7L3FqkDIKko0WMoL490kmAUMgjICrd3pjAQ7iV66YHxB2Y+w9EdWdj3d3GewtYhfnBlrn1bSaEx73y1KBhf3oy4pNOTeFPb2R5IIBllKiuD1r6J7AznRpVxihiQUadYLVFU4eCnXBHTRgiFTtd8oCghRxfrWgFpm0liBikeaawxM0wDQfYoWjZmKobxgvi47+OxS9xhvOn+yy4Iif2MqbH+V0go+eoAKwUE/FiaqqG0P/J5b6ZKx3ZrBF1FS6JztjI5PnzufizbgetvCqHf58+P4MKl8SuKHEI6SXbVzdf9KNmEpiK15m/flQUmYYIUba1nOiBiRFmZ+bLGvRRqUKLf+4P9XZTU1a0zIYXRaseq9QzU= root@etcd01
```







![](https://cdn1.ryanxin.live/image-20230306153936964.png)



**测试免密克隆项目代码**

![](https://cdn1.ryanxin.live/image-20230228162255183.png)



![](https://cdn1.ryanxin.live/image-20230306154053941.png)









#### 3.3.2 测试免密克隆


**使用http方式克隆**

```bash
root@etcd01[15:42:17]/pr #:git clone http://10.1.0.35/cy1/test.git
Cloning into 'test'...
Username for 'http://10.1.0.35': ryanxin
Password for 'http://ryanxin@10.1.0.35': 
remote: Enumerating objects: 3, done.
remote: Counting objects: 100% (3/3), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 0), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (3/3), 2.77 KiB | 2.77 MiB/s, done.
```





**使用ssh 方式克隆**

```bash
root@etcd01[15:43:37]/pr #:git clone git@10.1.0.35:cy1/test.git
Cloning into 'test'...
The authenticity of host '10.1.0.35 (10.1.0.35)' can't be established.
ECDSA key fingerprint is SHA256:lhRjKQBhgEhjbqcfKBb6oyle8C9EIOzu48QUoaeISIE.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.1.0.35' (ECDSA) to the list of known hosts.
remote: Enumerating objects: 3, done.
remote: Counting objects: 100% (3/3), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 0), reused 0 (delta 0), pack-reused 0
Receiving objects: 100% (3/3), done.
```









## 使用Jenkins对前端工程vue代码打包

### 安装npm 

![选择长期维护版本](https://cdn1.ryanxin.live/image-20230303150036697.png)



国内淘宝源

https://registry.npmmirror.com/binary.html?path=node/

```bash
$ tar -zxvf node-v18.14.2-linux-x64.tar.gz  
$ ln -s  node-v18.14.2-linux-x64 node
$ vim /etc/profile.d/npm.sh
export PATH=$PATH:/software/npm/node/bin


$ source /etc/profile.d/npm.sh 
$ npm -v 
9.5.0

#替换npm仓库地址为淘宝镜像地址（推荐）
$ npm config set registry https://registry.npm.taobao.org
$ npm config get registry
https://registry.npm.taobao.org/


npm config set registry http://r.cnpmjs.org

#配置后可通过下面方式来验证是否成功
npm config get registry

# 或者
npm info express


#故需要国内可靠的npm源可以使用
一、国内镜像

1、淘宝NPM镜像

搜索地址：http://npm.taobao.org
registry地址：http://registry.npm.taobao.org

2、cnpmjs镜像

搜索地址：http://cnpmjs.org
registry地址：http://r.cnpmjs.org
```





测试前端工程编译

```bash
cd /xxlog
git init 
Initialized empty Git repository in /xxlog/.git/

git config --global user.name ryanxin7
git config --global user.email xinxincn0506@outlook.com
git remote add origin git@github.com:ryanxin7/xxlog.git

root@etcd01[15:18:55]/xxlog #:cat /root/.ssh/id_rsa.pub 
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCvFuqsriXcIcyRQG7KpYbwtM+Fn5BSyJSvfGdDIbOymHt7eFlWPQ/qmsnzdey2V28InALJIBJkQcfRwjmG3OTPsYpcP+ea0jhQ1GJHcamERwDJDxcg7jyk+r+dRwGhxLlWeHdiORGZGdqM2LPp7L3FqkDIKko0WMoL490kmAUMgjICrd3pjAQ7iV66YHxB2Y+w9EdWdj3d3GewtYhfnBlrn1bSaEx73y1KBhf3oy4pNOTeFPb2R5IIBllKiuD1r6J7AznRpVxihiQUadYLVFU4eCnXBHTRgiFTtd8oCghRxfrWgFpm0liBikeaawxM0wDQfYoWjZmKobxgvi47+OxS9xhvOn+yy4Iif2MqbH+V0go+eoAKwUE/FiaqqG0P/J5b6ZKx3ZrBF1FS6JztjI5PnzufizbgetvCqHf58+P4MKl8SuKHEI6SXbVzdf9KNmEpiK15m/flQUmYYIUba1nOiBiRFmZ+bLGvRRqUKLf+4P9XZTU1a0zIYXRaseq9QzU= root@etcd01
```



![](https://cdn1.ryanxin.live/image-20230303152055911.png)



拉取代码

```bash
$ git pull origin main
The authenticity of host 'github.com (20.205.243.166)' can't be established.
ECDSA key fingerprint is SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'github.com,20.205.243.166' (ECDSA) to the list of known hosts.
remote: Enumerating objects: 1219, done.
remote: Counting objects: 100% (1219/1219), done.
remote: Compressing objects: 100% (794/794), done.
remote: Total 1219 (delta 532), reused 1073 (delta 397), pack-reused 0
Receiving objects: 100% (1219/1219), 16.95 MiB | 5.16 MiB/s, done.
Resolving deltas: 100% (532/532), done.
From github.com:ryanxin7/xxlog
 * branch            main       -> FETCH_HEAD
 * [new branch]      main       -> origin/main
 
 
$ git checkout main
Branch 'main' set up to track remote branch 'main' from 'origin'.
Switched to a new branch 'main'
root@etcd01[15:22:34]/xxlog #:git branch -a 
* main
  master
  remotes/origin/main
  
  
  
 #初始化项目所需的node模块
$ npm install -g cnpm 
npm WARN deprecated @npmcli/move-file@2.0.1: This functionality has been moved to @npmcli/fs

changed 420 packages in 2m

11 packages are looking for funding
  run `npm fund` for details
  
$ npm install 

up to date in 3s

122 packages are looking for funding
  run `npm fund` for details
  
$ ls
LICENSE  node_modules  package.json  package-lock.json  README.md  src 


#测试运行
$ npm run docs:dev 

> xxlog@2.0.0 docs:dev
> vuepress dev src

✔ Initializing and preparing data - done in 3.95s

  vite v4.0.4 dev server running at:

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://10.1.0.34:8080/
```

