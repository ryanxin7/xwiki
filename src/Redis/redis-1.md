---
author: Ryan
title: 1.Redis基础-数据分类
date: 2020-08-01
tags: [Redis]
categories: Reids
---


用户访问的过程中会产生各种各样的数据，为了让网站能够正常的运行，并且高效的让用户精准的看到相应的数据，我们就会在不同业务功能场景中采用各种各样的数据类型来进行承载。


# **数据分类**

用户访问的过程中会产生各种各样的数据，为了让网站能够正常的运行，并且高效的让用户精准的看到相应的数据，我们就会在不同业务功能场景中采用各种各样的数据类型来进行承载。

按照我们的项目场景落地的实现方式分为三种类型：

- 结构化数据
- 半结构化数据
- 非结构化数据



## 结构化数据

所谓的结构化数据，指的是数据的表现样式有一定的(横竖)结构,一般情况下，这种数据是以二维表的方式来实现数据的存储和逻辑关系的表达。

-- 数据以行为单位，一行数据表示一个实体的信息，每一行数据的属性是相同的。

这些数据在存储的时候，为了实现数据的统一存储，往往对数据存储的格式和长度规范都进行了一定程度的限制，这些数据的具体存储主要是以关系型数据库软件来实现。

结构化数据，是指由二维表结构来逻辑表达和实现的数据，严格地遵循数据格式与长度规范，主要通过关系型数据库进行存储和管理。

结构化数据的存储和排列是很有规律的，所以这些数据在查询或修改等操作的时候非常方便，但是由于数据在存储的时候，有一定的关联关系，所以在数据扩充属性或者收缩属性的时候不太方便 -- 扩展性不好。



数据在存储的过程中本身是有强关联的，在储存数据本身有相应的数据结构来进行限制，两个不同业务场景之中的数据，一旦他们之间有相应关联的话，我们会基于数据存储软件本身的特性将这些数据关联在一起。对于数据完整的整体来说他们之间是强关联的有相应的结构。



**结构化数据表现样式如下**：

| ID   | 姓名 | 性别 | 电话        | 籍贯 |
| ---- | ---- | ---- | ----------- | ---- |
| 1    | 张三 | 男   | 13382261344 | 山西 |
| 2    | 李四 | 女   | 18612388412 | 山东 |



对于某一条数据来说，它的内部有相应数据存储格式，对于数据整体来说由大量数据整合一起。

对于行来说是由多个具体的数据组合在一起的具有特殊的含义，对于每一列来说对数据的属性、长度

是否可以为空等等都有相应的限制。可以通过查看表结构查看相应的属性。如 mysql 中 `desc user;`



![关系型数据库-多表关联](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/%E5%85%B3%E7%B3%BB%E5%9E%8B%E6%95%B0%E6%8D%AE%E5%BA%93-%E5%A4%9A%E8%A1%A8%E5%85%B3%E8%81%94.png)

## 半结构化数据



所谓的半结构化数据，应用数据使用的时候有一定的关联、层次， 但是这些数据在存储的时候没有像关系型数据有数据属性、长度、是否为空、数据唯一性的限制。但在存储的时候有一定业务关联。

半结构化数据的存储一般是以文件的方式来实现的，比较常见的文件样式有：json、XML等。

在json存储过程中，会构造字典然后按照固定格式进行存储里面的数据自由获取。

![半结构化数据](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/%E5%8D%8A%E7%BB%93%E6%9E%84%E5%8C%96%E6%95%B0%E6%8D%AE.png)

**Json数据**

```json
{
"status": 200,
"message": {
"person": [
{
"id": 1,
"name": "张三",
"gender": "男",
"address": {
"Country": "中国",
"Province": "北京市",
"city": "北京市",
"district": "丰台区",
"town": "五里店"
},
},
],
}
}
数据关系
[]中括号代表的是一个数组或列表
{}大括号代表的是一个数据对象
双引号“”表示的是属性值
冒号：代表的是前后之间的关系，冒号前面是属性的名称，后面是属性的值
```



**XML 数据**

```xml
<?xml version="1.0" encoding="gb2312"?>
<namelist>
<name1>
<ID>01</ID>
<name>张三</name>
<sex>男</sex>
<address>北京市市丰台区五里店</address>
</name1>
<namelist>
数据关系
存储格式是以节点为主,一个节点衍生出另外的子节点
每个节点遵循html的风格，但是里面的标签属性是我们自定义的。
```

XML 主要用于测试，如测试网页功能



将成功的数据和不成功的数据全部罗列出来，以XML的样式单独实现，在测试的时候基于对应的测试软件框架加载定制好的测试数据以自动化的方式，把所有的功能全部测试出来。

测试的数据仅仅是为了功能测试时使用的，没有必要存储下来，所以我们就用简单的Html场景当中的数据单独存储xml格式来进行存储。

数据本身存储没有强关联，但是应用的时候有一定的关联结构。这种数据被称之为半结构化数据。



## 非结构化数据

所谓非结构化数据，在存储的时候数据和数据之间没有所谓的强关联，应用场景也没有所谓的整体一起使用。 用的时候直接调用就可以了。

非结构化数据，其实就是没有固定结构的数据 -- 即结构化数据之外的一切数据。它们常以 图片、视频、音频等 样式存在。对于这类数据，我们一般直接整体进行存储，而且一般存储为二进制的数据格式。



**非结构化数据一般有两种生成方式**：

- 人为手工生成 - 文本文件、图片、视频、音频、业务应用程序等。

- 机器自动生成 - 卫星图形、科学数据、数据监控、传感数据等

  一般情况下，非结构化数据存储在非关系数据库中，并使用NoSQL进行查询。工作生活，非结构化数据是越来越多，占比远远的超出结构化数据。

![非结构化数据](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/%E9%9D%9E%E7%BB%93%E6%9E%84%E5%8C%96%E6%95%B0%E6%8D%AE.jpg)





![image-20211124163735729](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211124163735729.png)

资料来源：https://db-engines.com/en/ranking

![DB-Engines Ranking](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/image-20211124163537597.png)



**数据软件的应用**

目前 结构化软件还是占据绝对的位置
		 非结构化数据软件，在特定场景中，占据一席地位
		
目前所有的软件，都有一个趋同的发展 “我是结构化数据软件，但是能做对方的事情“



---



**小结**

```bash
结构化数据
	1 数据存储本身是有意义的 -- 强关联和存储约束
	2 数据存储的整体，在业务场景中也有关联
		-- 一对多、多对一、一对一等
半结构化数据
	1 开发场景：
		页面的展示 和 展示的数据 分开 
			数据本身没有意义，但是组合在一起能够使用
			- json
	2 测试场景；
		自动化测试 -- 构造大量的测试数据单独保存
		- xml
		非结构化数据
		数据本身存储和业务场景存储没有所谓的关联
		-- 但是我要的时候，必须给我
			kv
			
```

注意：
	这里的结构 不是 数据结构与算法里面 数据存储应用到的结构
		指的是 业务场景中的数据关联存储
		

