---
author: Ryan
title: PromQL 语句
date: 2024-01-26
lastmod: 2024-01-26
tags:
  - 监控系统
  - 可视化
  - PromQL
categories:
  - Prometheus
expirationReminder:
  enable: true
---



## 1.PromQL 简介

Prometheus Query Language（PromQL）是 Prometheus 使用的查询语言，它允许用户实时地查找、聚合和操作时间序列数据。通过 PromQL，用户可以从 Prometheus 数据库中检索和处理监控数据，并将结果用于创建图表、仪表板，以及在其他上下文中使用。



## 2. PromQL 基本查询：

```bash
node_memory_MemTotal_bytes #査询 node 节点总内存大小
node_memory_MemFree_bytes #査询 node 节点剩余可用内存
node_memory_MemTotal_bytes{instance="10.1.0.34:9100"} #查询指定节点的总内存
node_memory_MemFree_bytes{instance="10.1.0.35:9100"} #查询指定节点的可用内存
```



![image-20240126100923091](https://cdn1.ryanxin.live/image-20240126100923091.png)

![image-20240126101128703](https://cdn1.ryanxin.live/image-20240126101128703.png)

将 `node_memory_MemFree_bytes` 查询结果从字节（bytes）转换为更大的单位，比如千兆字节（Gigabytes，GB）

```bash
node_memory_MemFree_bytes{instance="10.1.0.35:9100"} / (1024 * 1024 * 1024)
```

![image-20240126101445113](https://cdn1.ryanxin.live/image-20240126101445113.png)



```bash
node_disk_io_time_seconds_total{device="sda"}#查询指定磁盘的每秒磁盘 
ionode_filesystem_free_bytes{device="/dev/sda1",fstype="xfs",mountpoint=""} #査看指定磁盘的磁盘剩余空间
# HELP node_load1 1m load average.#CPU 负载
# TYPE node_load1 gauge
node_load1 0.1

# HELP node_load15 15m load average.
# TYPE node_load15 gauge
node_load15 0.17
# HELP node_load5 5m load average.
# TYPE node load5 gauge
node_load5 0.13


node_load1 表示 1 分钟的平均负载，其值是 0.1。
node_load15 表示 15 分钟的平均负载，其值是 0.17。
node_load5 表示 5 分钟的平均负载，其值是 0.13。
```



##  3. PromQL 数据类型

PromQL（Prometheus Query Language）定义了几种数据类型:

**瞬时向量（Instant Vector）:**

- 由一组时间序列组成，每个时间序列包含单个数据样本。
- 例如，`node_memory_MemTotal_bytes` 查询当前剩余内存就是一个瞬时向量。这样的表达式返回一个包含该时间序列中最新样本值的瞬时向量。

```bash
#查询当前系统中所有实例的 CPU 使用率。 瞬时向量
cpu_usage_percent
```





**范围向量（Range Vector）:**

- 在任何给定的时间范围内，包含抓取的所有度量指标数据。
- 例如，你可以使用范围向量来获取最近一天的网卡流量趋势图。

```bash
#查询最近一小时内的每分钟的 HTTP 请求总数。 
sum(rate(http_requests_total[1h]))
```







**标量（Scalar）:**

- 是一个浮点数类型的数据值。
- 例如，使用 `node_load1` 获取到的是一个瞬时向量，但是可以使用内置函数 `scalar()` 将瞬时向量转换为标量。



**字符串（String）:**

- 字符串类型的数据，目前在监控和查询中使用相对较少。



向量是一组时间序列的集合，每个序列包含时间戳和数值。向量可以是瞬时的（包含每个时间序列的最新数据点）或者是范围的（包含某个时间范围内的所有数据点）。

标量是一个单一的数据点，包含时间戳和数值，用于表示某个指标在某个时刻的具体数值。



## 4. PromQL 匹配器



```bash
=:选择与提供的字符串完全相同的标签。

{job="api-server"}

!=:选择与提供的字符串不相同的标签,

{instance!="web-server-1"}

=~:选择正则表达式与提供的字符串(或子字符串)相匹配的标签。

{job=~"web.*"}


!~:选择正则表达式与提供的字符串(或子字符串)不匹配的标签

{instance!~"db.*"}
```



**使用AND和OR组合匹配器**

```bash
# 选择具有job标签等于"api-server"和instance标签等于"web-server-1:9090"的时间序列

{job="api-server", instance="web-server-1:9090"}

#选择具有job标签等于"api-server"或"db-server"的时间序列
{job="api-server"} OR {job="db-server"}

#选择具有job标签等于"api-server"和instance标签匹配正则表达式"web.*"的时间序列
{job="api-server"} AND {instance=~"web.*"}
```





## 5.PromQL 时间范围



```bash
s- 秒
m- 分钟
h- 小时
d- 天
w- 周
y- 年


node_memory_MemTotal_bytes{}# 瞬时向量表达式，选择当前最新的数据
node_memory_MemTotal_bytes{}[5m]# 区间向量表达式，选择以当前时间为基准，5 分钟内的数据
node_memory_MemTotal_bytes{instance="10.1.0.35:9100"}[5m]
```

![image-20240126153306695](https://cdn1.ryanxin.live/image-20240126153306695.png)







## 6.PromQL 运算符

**算术运算符（Arithmetic Operators）:**

- **`+`：** 加法
- **`-`：** 减法
- **`\*`：** 乘法
- **`/`：** 除法

```bash
node_memory_MemFree_bytes/1024/1024 #将内存进行单位转换
```

![image-20240126153654045](https://cdn1.ryanxin.live/image-20240126153654045.png)



```bash
node_disk_read_bytes_total{device="vda"}+ node_disk_written_bytes_total{device="vda"}
```

![image-20240126154447530](https://cdn1.ryanxin.live/image-20240126154447530.png)



```bash
#过去1分钟内每秒钟的平均瞬时读取速率
irate(node_disk_read_bytes_total{device="vda", instance="10.1.0.34:9100", job="prometheus-k8s-node"}[1m])
```



![image-20240126160440798](https://cdn1.ryanxin.live/image-20240126160440798.png)



## 7.  PromQL 聚合运算

```bash
sum (求和)
min (最小值)
max(最大值)
avg(平均值)
stddev(标准差)
stdvar(标准差异)
count(计数)
count_values(对 value 进行计数)
bottomk(样本值最小的k个元素)
topk(样本值最大的k个元素)
quantile(分布统计)


max(node_memory_MemFree_bytes)#某个指标数据的最大值
sum(http_requests_total) #计算 http requests total 最近的请求总量
```

![image-20240126161149728](https://cdn1.ryanxin.live/image-20240126161149728.png)