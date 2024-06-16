---
author: Ryan
title: 4.Redis共享Session实践
date: 2020-08-04
tags: [Redis]
---




#  应用Redis python-Web Session实践



我们在后面是准备在python web项目中应用redis，所以我们需要在python虚拟环境中安装redis的模块插件，然后才可以正常的应用。redis-py提供两个类Redis和StrictRedis用于实现Redis的命令，StrictRedis用于实现大部分官方的命令，并使用官方的语法和命令，Redis是StrictRedis的子类，用于向后兼容旧版本的redis-py。



### **环境准备**



需要创建一个虚拟环境，为什么要用虚拟环境呢？ 默认情况下在当前操作系统下里面，安装一个版本为3.7的Python 再安装一个版本为3.9的Python 那么就会把之前的版本覆盖掉，那么如果再当前主机中有多个项目时，每个应用都有不同的功能，一个有遗留代码依赖于2.7版本，一个依赖于3.5版本，新的项目要求3.9版本，那么现在如果想要在一个主机把三个app全部运行起来该怎么办？ 那么就需要Python虚拟环境基于目录方式实现多个python版本共存。

![python虚拟环境](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/python%E8%99%9A%E6%8B%9F%E7%8E%AF%E5%A2%83.png)



#### **软件安装**

```
apt install virtualenv 
apt install virtualenvwrapper
定制bash级别的环境变量
cd 
vim .bashrc 
export WORKON_HOME=$HOME/.virtualenvs
source /usr/share/virtualenvwrapper/virtualenvwrapper.sh
```



#### **虚拟环境命令**

```sh
 workon  切换到指定的虚拟环境
 deactivate 退出虚拟环境
 mkvirtualenv  指定python版本创建虚拟环境
 rmvirtualenv  删除指定的python版本
```



#### **创建虚拟环境**

```sh
mkvirtualenv -p /usr/bin/python2.7 python_v2.7
在指定目录下创建对应版本的python
site-packages
mkvirtualenv -p /usr/bin/python3.8 python_v3.8
mkvirtualenv -p /usr/bin/python3.9 python_v3.9
```





### **模块安装** 

```bawsh
pip install redispy
#python工具集
pip install ipython
#查看安装的package
pip list 
```



```python
 WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None)) after connection broken by 'NewConnectionError('<urllib3.connection.VerifiedHTTPSConnection object at 0x7fe6924bdcd0>: Failed to establish a new connection: [Errno 101] Network is unreachable')': /simple/redispy/
```



出现以上告警，更换pip源为国内源



  阿里云 http://mirrors.aliyun.com/pypi/simple/ 
  中国科技大学 https://pypi.mirrors.ustc.edu.cn/simple/ 
  豆瓣(douban) http://pypi.douban.com/simple/ 
  清华大学 https://pypi.tuna.tsinghua.edu.cn/simple/ 
  中国科学技术大学 http://pypi.mirrors.ustc.edu.cn/simple/



```sh
临时使用： 
可以在使用pip的时候在后面加上-i参数，指定pip源

pip install scrapy -i https://pypi.tuna.tsinghua.edu.cn/simple

#注：pip/pip.conf” E212: Cannot open file for writing 问题是要先创建 ~/.pip 文件夹。


永久修改： 
linux: 
修改 ~/.pip/pip.conf (没有就创建一个)， 内容如下：

#增加配置文件
mkdir ~/.pip
vim .pip/pip.conf
[global]
  
index-url = https://pypi.tuna.tsinghua.edu.cn/simple

#pip版本查询
pip --version
pip 20.0.2 from /root/.virtualenvs/python_v3.8/lib/python3.8/site-packages/pip (python 3.8)


windows: 
#直接在user目录中创建一个pip目录，如：C:\Users\xx\pip，在pip 目录下新建文件pip.ini，
#或者按照网友的建议：win+R 打开用户目录%HOMEPATH%，在此目录下创建 pip 文件夹，在 pip 目录下创建 pip.ini 文件, 内容如下


[global]
 
timeout = 6000
 
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
 
trusted-host = pypi.tuna.tsinghua.edu.c
```





#### 简单操作 - 以String为例

```
# 导入模块
import redis
# 方法1
r = redis.Redis(host='127.0.0.1', port=6379, db=2)
# 方法2
r = redis.StrictRedis(host='127.0.0.1', port=6379, db=2)
redis-py使用connection pool来管理对一个redis server的所有连接，避免每次建立、释放连接的开
销。默认，每个Redis实例都会维护一个自己的连接池。当然，我们还可以直接建立一个连接池，然后作为参
数Redis，这样就可以实现多个Redis实例共享一个连接池
# 方法3
pool = redis.ConnectionPool(host='127.0.0.1', port=6379)
r = redis.Redis(connection_pool=pool)
```

![rpy1](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/rpy1.png)

![rpy2](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/rpy2.png)





```python
# 导入模块
import redis
# 创建对象
redis_obj = redis.Redis(host='127.0.0.1',port=6379,db=3)
#调用设置key值
redis_obj.set('key','value')
#获取key值
redis_obj.get('key')
```



```python
#单值实践
r.set('key', 'value', ex=5)
或
r.setex("key1", 5, "value1")
r.get('key')
# 多值实践
r.mset(k1="v1", k2="v2")
r.mset({'k3':"v3", 'k4':"v4"})
r.mget('k1', 'k2')
r.mget(['k3', 'k4'])
# 自增自减
r.set('num',4)
r.get('num')
r.incr('num')
r.incr('num', 6)
r.incrby('num',6)
r.decr('num')
r.decr('num',3) 注意：没有decrby
# 删除操作
r.delete('num')
# 判断存在
r.exists('num')
# 模糊匹配
r.keys()
r.keys('k*')
r.keys('*2')
# 查询数据量
r.dbsize()
```



## 简单实践

对于各种web框架来说，只要涉及到redis，基本上都提供了相关的 属性配置，我们这里以简单的 Flask web框架为例。



#### 安装模块

```python
pip install Flask
pip install flask-session
```



**测试运行框架**

```python
(python_v3.8) root@elkserver:~# vim python_flask.py 

#导入模块
from flask import Flask

# 创建应用对象

app = Flask(__name__)

# 定制路由策略

@app.route('/')
def index():
    return "hello-flask app web"

# 启动应用

if __name__ == '__main__':
    app.run(host='192.168.10.110')
    
(python_v3.8) root@elkserver:~# python python_flask.py
 * Serving Flask app 'python_flask' (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://192.168.10.110:5000/ (Press CTRL+C to quit
```



Flask session 官方文档：https://flask-session.readthedocs.io/en/latest/



**session常用的方法如下**

```
get：用来从session中获取指定值。
pop：从session中删除一个值。
keys：从session中获取所有的键。
items：从session中获取所有的值。
clear：清除当前这个用户的session数据。
flush：删除session并且删除在浏览器中存储的session_id，一般在注销的时候用得比较多。
set_expiry(value)：设置过期时间。
```



#### 代码实现

```python
#导入模块
from flask import Flask, session
from flask_session import Session
import redis

# 创建应用对象

app = Flask(__name__)

app.debug = True
app.secret_key = 'x123asdaczxdasd'
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = False
app.config['SESSION_KEY_PREFIX'] = 'session:'
app.config['SESSION_REDIS'] = redis.Redis(host='127.0.0.1', port='6379', db=4)

Session(app)
# 定制路由策略

@app.route('/')
def index():
    return "hello-flask app web"


@app.route('/set')
def set_key():
        session['user_name'] = "zhangsan"
        return 'ok'


@app.route('/get')
def get_key():
    return session.get('user_name',"没有设置username key")

@app.route('/pop')
def pop_key():
    session.pop('user_name')
    return session.get('user_name','pop key')

@app.route('/clean')
def clean_key():
    session.clear()
    return session.get('user_name', 'clear key')


# 启动应用

if __name__ == '__main__':
    app.run(host='192.168.10.110')
```



**启动flask**

```python
python flask_redis.py
* Serving Flask app "flask_redis" (lazy loading)
* Environment: production
WARNING: This is a development server. Do not use it in a production
deployment.
Use a production WSGI server instead.
* Debug mode: on
* Running on http://0.0.0.0:5000/ (Press CTRL+C to quit)
* Restarting with stat
* Debugger is active!
* Debugger PIN: 170-146-674
...
```

浏览器刷新 http://0.0.0.0:5000/index ，查看效果

```python

http://192.168.10.110:5000/set
http://192.168.10.110:5000/get
127.0.0.1:6379> select 4
OK
127.0.0.1:6379[4]> KEYS *
1) "session:8b6dd8af-fca8-4874-b92e-9ef13936287e"
127.0.0.1:6379[4]> get "session:8b6dd8af-fca8-4874-b92e-9ef13936287e"
"\x80\x04\x95*\x00\x00\x00\x00\x00\x00\x00}\x94(\x8c\n_permanent\x94\x88\x8c\tuser_name\x94\x8c\bzhangsan\x94u."


http://192.168.10.110:5000/pop
get "session:8b6dd8af-fca8-4874-b92e-9ef13936287e"
"\x80\x04\x95\x12\x00\x00\x00\x00\x00\x00\x00}\x94\x8c\n_permanent\x94\x88s."


http://192.168.10.110:5000/clean
127.0.0.1:6379[4]> KEYS *
(empty array)
```



