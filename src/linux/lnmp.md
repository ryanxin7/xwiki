---
author: Ryan
title: 实战案例-LNMP网站架构
date: 2019-11-28
lastmod: 2019-11-28
tags: [Linux学习之旅]
---

# LNMP网站架构实战

[[toc]]



## 1. 实施步骤说明





:::tip 服务实施步骤

- 了解LNMP架构的组成作用
- 架构的部署
- 架构通讯原理
- LNMP服务之间如何建立管理
- 运维人员代码上线 
- NFS服务器和Web服务器建立联系
- 数据库、存储远端迁移

:::







### 1.1 Nginx 模块回顾



**Nginx 服务的企业应用 (nginx模块)**

- 实现网站页面目录索引功能  (yum仓库搭建)

- 实现网站访问别名功能     server_name







**实现网站页面用户访问监控** 

`keepalived_timeout 65s`

-  HTTP请求报文: 请求头---connection: keepalived.../closed 短连接
-  HTTP响应报文: 响应头---connection: closed 短连接

- VPN---无法访问外网/xshell无法远程连接



   

**实现网站服务日志功能配置** 
     

错误日志: 错误日志级别 

访问日志: 日志的格式信息 自动化分析日志(ELK 三个软件)

  

  

**根据用户访问uri进行匹配处理**

-    `location = xxx`    精确匹配			优先级01

-    `location ^~ xxx`   优先匹配   		    优先级02
-   `location ~`        区分大小写匹配 	优先级03
- ​	 `location ~*`  	   不区分大小写		优先级03
- ​	 `location uri` 	   根据uri进行匹配	优先级03
- ​	 `location /` 	   默认匹配        	     优先级最低

​	

  

  

###  1.2 企业应用: 网站 location应用案例

例如在活动时期打折促销，网站的页面信息和平常不一样。我们不可能把平常的页面为活动直接进行修改，这时我们就需要调用一个专门在活动时上线的页面作为主站广告。
	   

**有两个站点目录:**
	 

- 平常网站的站点目录   `/html/jd-normal`
- 节日网站的站点目录   `/html/jd-teshu`
- ​    `location / { root /html/jd-normal }`
-    `  location / 特殊	 { root /html/jd-teshu }`



  

### 1.3 网站页面跳转功能

​     

第一种方法：

```nginx
server
{
    location / {
        rewrite ^/(.*)$ https://www.ryanxin.com/$1 permanent;
    }
}
```





第二种方法：

```nginx
server
{
    location / {
        return 301 https://www.ryanxin.com;
    }
}
```





## 2.  LNMP 架构介绍


![LNMP-2](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-LinuxLNMP-2.png)






**L  代表 Linux系统**

**注意:**  

-  `selinux`必须关闭  防火墙关闭
- `/tmp 1777 mysql` 服务无法启动



**N 代表 Nginx服务**

**作用:**

处理用户的静态请求 `html` `jpg` `txt` `mp4/avi`







**P  代表  php 服务**

**作用:**

- 处理动态的页面请求

- 负责和数据库建立关系

  

**M  代表  mysql服务部署** 



**作用:**

存储用户的字符串数据信息





## 3. 网站的 LNMP 架构部署



### 3.1创建虚拟用户和根目录



**创建用户**

```shell
useradd -M -s /sbin/nologin www -u 1002
id www
systemctl restart nginx
```





**创建战点根目录**

```shell
mkdir -p /html/bbs/
chown -R www.www /html/bbs/
```





### 3.2 编写 Nginx 配置文件



```nginx
vim /etc/nginx/nginx.conf

server {
server_name    ryanxin.com;
rewrite ^/(.*) http://www.ryanxin.com/$1 permanent;
}

server {
      listen    80;
      server_name   www.ryanxin.com;
      error_page    500 502 503 504 /50x.html;
      location / {
      root  /html/bbs;
      index   index.html;
      }
}
```





### 3.3 安装数据库软件



```shell
yum install mariadb-server mariadb -y

#补充: 数据库初始化过程 mysql_install_db
	
--basedir=path       The path to the MariaDB installation directory.
	                     #指定mysql程序目录
--datadir=path       The path to the MariaDB data directory.
	                     #指定数据信息保存的目录
--user=mysql             #让mysql管理数据目录  700	
```







**创建数据库的密码信息:**

```bash
/application/mysql/bin/mysqladmin -u root      password 'new-password'  # 给本地数据库设置密码
/application/mysql/bin/mysqladmin -u root -h web01 password 'new-password'  # 给远程数据库设置密码

mysqladmin -u root  password 'xin123'    --- 设置密码  	
mysql -u root -pxin123
```



**启动数据库服务**

```shell
systemctl start mariadb.service 
systemctl enable mariadb.service
```







## 4. PHP服务部署流程



### 4.1 更新 源卸载系统自带的PHP软件

​	

```shell
yum remove php-mysql php php-fpm php-common	
rpm -Uvh https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
rpm -Uvh https://mirror.webtatic.com/yum/el7/webtatic-release.rpm
```





### 	4.2 安装 PHP

```bash
yum install -y php71w php71w-cli php71w-common php71w-devel php71w-embedded php71w-gd php71w-mcrypt php71w-mbstring php71w-pdo php71w-xml php71w-fpm php71w-mysqlnd php71w-opcache php71w-pecl-memcached php71w-pecl-redis php71w-pecl-mongodb
```





### 4.3 编写配置文件

```BASH
vim /etc/php-fpm.d/www.conf
user = www  
group = www
#保证nginx进程的管理用户和php服务进程的管理用户保持一致
systemctl start php-fpm 
```





**LNMP 服务间调用图**



![LNMP-1](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-LinuxLNMP-1.png)





Nginx 通过location匹配以PHP结尾的文件，调用Fastcgi接口执行fastcgi_pass 命令发送给PHP的php-fam进程接收，wrapper进程进行处理，处理后在原路返回给nginx最后客户端可以看到动态页面，如果需要调用数据库在通过php解析器解析成sql语句与数据库进行调用数据操作。最后生成动态页面返回给nginx客户端可以看到页面。

 



**调用流程**

用户访问网站 --- > nginx(fastcgi_pass) --  FastCGI-->  (php-fpm -- wrapper) php (php解析器) --->  mysql(读取或写入)



 

 

## 5. 实现 LNMP 架构服务之间建立关系

 

Nginx无法直接 和 数据库建立联系，因此要先和PHP 建立关系。

 

### 5.1 实现 Nginx与 PHP 建立关系



**编写 nginx 配置文件**

```nginx
location ~ \.php$ { 
root /www; 
fastcgi_index index.php;  
fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; 
fastcgi_pass 127.0.0.1:9000; 
include fastcgi_params;  #变量配置文件 
 } 
```

 

```nginx
systemctl nginx restart #重启服务

server {
server_name ryanxin.com
rewrite ^/(.*) http://www.ryanxin.com/$1 permanent;
}

server {
    listen   80;
    server_name www.ryanxin.com;
    error_page  500 502 503 504 /50x.html;
    location /{
        root /html/bbs;
        index index.html;
    }
    
   location ~ \.php$ { 
               root /bbs; 
               fastcgi_index index.php;  
               fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; 
               fastcgi_pass 127.0.0.1:9000; 
               include fastcgi_params;   
    }   
 } 
```



  

### 5.2 编写动态资源文件测试页面

 

```php
vim /html/blog/test_php.php  
<?php 
phpinfo(); 
?> 
```

 

**浏览器输入地址进行访问测试**

[http://www.ryanxin.com/index.php](https://www.ryanxin.com)

**注意** ： 要在本地Host文件手动添加域名地址，才能实现本地域名解析访问。

![LNMP-3](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-LinuxLNMP-3.png)

 

 

## 6. 实现 PHP 与数据库建立关系

 

### 6.1 编写 PHP 连接数据库测试文件  

 

```php
# vim test_mysql.php 

<?php 
$servername = "localhost"; 
$username = "root"; 
$password = "oldboy123"; 
//$link_id=mysql_connect('主机名','用户','密码'); 
//mysql -u用户 -p密码 -h 主机 
$conn = mysqli_connect($servername, $username, $password); 
if($conn) { 
echo "mysql successful by root !\n"; 
}else{ 
die("Connection failed: " . mysqli_connect_error());  
} 
?> 
```

 

 

### 6.2 访问测试

[http://www.ryanxin.com/test_mysql.php](https://www.ryanxin.com/)

**如果连接成功** ：提示 Mysql successful by root！ 

失败则提示报错信息



 

## 7. 部署搭建网站页面 代码上线 

 

### 7.1 常用的开源源码网站

 

- ​	**主站网站页面**: [http://www.dedecms.com/](http://www.dedecms.com/)
- ​	**论坛网站页面**: [http://www.discuz.net/forum.php](http://www.discuz.net/forum.php)
- ​	**博客网站页面**: [https://cn.wordpress.org/](https://cn.wordpress.org/)
- ​	**知乎类型网站页面**: [http://www.wecenter.com/?copyright](http://www.wecenter.com/?copyright)

 

### 7.3 将源码解压后放入到站点目录中

 

这里演示的是 [Wordpress](https://cn.wordpress.org) 博客系统

```shell
tar xf wordpress-5.2.1.tar.gz
mv ./* /html/bbs
```

 

**修改站点目录权限**

```bash
chown -R www.www blog
```

 

 

### 7.4 进行网站页面初始化操作

 



![LNMP-4](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-LinuxLNMP-4.png)



![LNMP-5](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-LinuxLNMP-5.png)


### 7.5 对数据库服务进行配置



```sql
--创建数据库
create databases wordpress;  

--检查
show databases;

--创建数据库管理用户: 
grant all on wordpress.* to 'wordpress'@'localhost' identified by 'xin123';

--检查
select user,host from mysql.user 

--优化: 删除无用的用户信息

delete from mysql.user where user="" and host="localhost";
delete from mysql.user where user="" and host="web01";

flush privileges; 

--刷新
```



**利用blog网站发布博文**



![LNMP-6](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-LinuxLNMP-6.png)



## 8. 常见问题解决


**上传wordpress主题,报413错误,如何解决?**


1.修改nginx配置文件


```shell
vim blog.conf
server {
client_max_body_size 50m;  #指定用户上传数据的大小限制(默认1M)	
}
```


1. 修改php.ini配置文件

```shell
upload_max_filesize = 50M   #使PHP接收用户上传的更大的数据(默认2M)
```



 