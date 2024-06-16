---
Author: Ryan
title: Jenkins安装与基础配置
date: 2023-06-12
---



## Jenkins 安装与基础配置



###  配置java环境



**Jdk下载**：https://www.oracle.com/java/technologies/downloads/

**版本jdk要求**:

![image-20230516165044384](https://cdn1.ryanxin.live/image-20230516165044384.png)



```bash
tar -xf 

#创建软连接
root@etcd02[11:05:51]/apps/Jenkins #:ln -sv /apps/jdk1.8.0_371/ /usr/local/jdk
'/usr/local/jdk' -> '/apps/Jenkins/jdk1.8.0_371/'

root@etcd02[11:07:53]/apps/Jenkins #:ln -sv /apps/jdk1.8.0_371/bin/java /usr/bin/java
'/usr/bin/java' -> '/apps/Jenkins/jdk1.8.0_371/bin/java'
```

```bash
root@server:/apps# ln -sv /apps/jdk-17.0.6/ /usr/local/jdk
'/usr/local/jdk' -> '/apps/jdk-17.0.6/'  
root@server:/apps# ln -sv /apps/jdk-17.0.6/bin/java  /usr/bin/java
'/usr/bin/java' -> '/apps/jdk-17.0.6/bin/java'


apt-get install fontconfig
```





### **配置环境变量**

```bash
vim /etc/profile.d/jdk-bin-path.sh
export JAVA_HOME=/usr/local/jdk
export PATH=$JAVA_HOME/bin:$JAVA_HOME/jre/bin:$PATH
export CLASSPATH=.$CLASSPATH:$JAVA_HOME/lib:$JAVA_HOME/jre/lib:$JAVA_HOME/lib/tools.jar

source /etc/profile.d/jdk-bin-path.sh
```

```bash
root@etcd02[13:55:57]/etc/profile.d #:java -version
java version "1.8.0_371"
Java(TM) SE Runtime Environment (build 1.8.0_371-b11)
Java HotSpot(TM) 64-Bit Server VM (build 25.371-b11, mixed mode)
```





### 安装Jenkins

**Ubuntu 安装包下载：**

https://mirrors.tuna.tsinghua.edu.cn/jenkins/debian-stable/

![image-20230516144314123](https://cdn1.ryanxin.live/image-20230516144314123.png)

#### 安装安装依赖

```bash
apt install net-tools
dpkg -i jenkins_2.361.4_all.deb
```



![image-20230516180049815](https://cdn1.ryanxin.live/image-20230516180049815.png)



#### **获取密码**

![image-20230516202608708](https://cdn1.ryanxin.live/xxlog/image-20230516202608708.png)



#### **设置清华源**

该url是国内的清华大学的镜像地址（建议使用清华大学的镜像服务器，修改后刷新页面即可.

https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json

```bash
find / -name *.UpdateCenter.xml
/var/lib/jenkins/hudson.model.UpdateCenter.xml


vim /var/lib/jenkins/hudson.model.UpdateCenter.xml
<?xml version='1.1' encoding='UTF-8'?>
<sites>
  <site>
    <id>default</id>
    <url>https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json</url>
  </site>
</sites>
```



#### 下载插件

![](https://cdn1.ryanxin.live/xxlog/image-20230516202918543.png)

![](https://cdn1.ryanxin.live/xxlog/image-20230516203918051.png)

![image-20230516203952363](https://cdn1.ryanxin.live/xxlog/image-20230516203952363.png)





