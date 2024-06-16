---
author: Ryan
title: 4.zookeeper 分布式锁案例
date: 2021-10-08
tags: [Zookeeper]
---



# ZooKeeper 分布式锁案例

什么叫做分布式锁呢？ 比如说"进程 1"在使用该资源的时候，会先去获得锁，"进程 1"获得锁以后会对该资源保持独占，这样其他进程就无法访问该资源，"进程 1"用完该资源以后就将锁释放掉，让其 他进程来获得锁，那么通过这个锁机制，我们就能保证了分布式系统中多个进程能够有序的 访问该临界资源。那么我们把这个分布式环境下的这个锁叫作分布式锁。



![分布式锁案例](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211221142619853.png)



## Curator 框架实现分布式锁案例



### **原生的 Java API 开发存在的问题** 

1. 会话连接是异步的，需要自己去处理。比如使用 CountDownLatch 
2. Watch 需要重复注册，不然就不能生效 
3. 开发的复杂性还是比较高的 
4. 不支持多节点删除和创建。需要自己去递归 



Curator 是一个专门解决分布式锁的框架，解决了原生 JavaAPI 开发分布式遇到的问题。

 详情请查看官方文档：https://curator.apache.org/index.html 



### Curator 案例实操

**1.添加依赖**

```java
<dependency>
   <groupId>org.apache.curator</groupId>
   <artifactId>curator-framework</artifactId>
   <version>4.3.0</version>
</dependency>
<dependency>
   <groupId>org.apache.curator</groupId>
   <artifactId>curator-recipes</artifactId>
   <version>4.3.0</version>
</dependency>
<dependency>
   <groupId>org.apache.curator</groupId>
   <artifactId>curator-client</artifactId>
   <version>4.3.0</version>
</dependency>
```



**2.代码实现**

```java
package com.atguigu.lock;

import org.apache.curator.RetryPolicy;
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import 
org.apache.curator.framework.recipes.locks.InterProcessLock;
import 
org.apache.curator.framework.recipes.locks.InterProcessMutex;
import org.apache.curator.retry.ExponentialBackoffRetry;

public class CuratorLockTest {
 
   private String rootNode = "/locks";
   
   // zookeeper server 列表
   private String connectString = 
"hadoop102:2181,hadoop103:2181,hadoop104:2181";
 
   // connection 超时时间
 private int connectionTimeout = 2000;
 
 // session 超时时间
 private int sessionTimeout = 2000;
 
 public static void main(String[] args) {
    
    new CuratorLockTest().test();
  }
 
 
  // 测试
  private void test() {

     // 创建分布式锁 1
    final InterProcessLock lock1 = new 
InterProcessMutex(getCuratorFramework(), rootNode);
  
     // 创建分布式锁 2
    final InterProcessLock lock2 = new 
InterProcessMutex(getCuratorFramework(), rootNode);
 
    new Thread(new Runnable() {
        @Override
        public void run() {
            // 获取锁对象
            try {
               lock1.acquire();
               System.out.println("线程 1 获取锁");
               // 测试锁重入
              lock1.acquire();
              System.out.println("线程 1 再次获取锁");
              Thread.sleep(5 * 1000);
              lock1.release();
              System.out.println("线程 1 释放锁");
              lock1.release();
              System.out.println("线程 1 再次释放锁");
           } catch (Exception e) {
              e.printStackTrace();
           }
       }
    }).start();
    new Thread(new Runnable() {
       @Override
       public void run() {
           // 获取锁对象
           try {
              lock2.acquire();
              System.out.println("线程 2 获取锁");
              // 测试锁重入
             lock2.acquire();
             System.out.println("线程 2 再次获取锁");
             Thread.sleep(5 * 1000);
             lock2.release();
             System.out.println("线程 2 释放锁");
             lock2.release();
             System.out.println("线程 2 再次释放锁");
          } catch (Exception e) {
             e.printStackTrace();
          }
      }
  }).start();
}
// 分布式锁初始化
public CuratorFramework getCuratorFramework (){
   //重试策略，初试时间 3 秒，重试 3 次
   RetryPolicy policy = new ExponentialBackoffRetry(3000, 3);
   //通过工厂创建 Curator
   CuratorFramework client = 
  CuratorFrameworkFactory.builder()
               .connectString(connectString)
               .connectionTimeoutMs(connectionTimeout)
               .sessionTimeoutMs(sessionTimeout)
               .retryPolicy(policy).build();
 
      //开启连接
     client.start();
     System.out.println("zookeeper 初始化完成...");
     return client;
    }
}

```

