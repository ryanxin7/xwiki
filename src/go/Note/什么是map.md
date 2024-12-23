---
id: 24110071706
author: Ryan
title: 什么是 map？
date: 2024-11-07
categories: Go
tags: [Go]
---

## 什么是 map？
`map` 是 Go 语言中的一种**内置数据结构**，用于存储键值对（key-value pairs）。在其他编程语言中，它可能被称为“字典”或“哈希表”。`map` 允许通过键来快速查找对应的值，适合用于存储和检索关联数据。  



### 1.`map` 的定义  
 在 Go 中，`map` 的定义和使用方式如下：  

```go
map[KeyType]ValueType

```

**KeyType**：表示键的类型，必须是支持相等比较的类型，例如 `string`、`int`、`float` 等（不能是切片、函数等）。

**ValueType**：表示值的类型，可以是任何类型，包括结构体、切片等。





### 2. 创建 `map`
可以使用 `make` 函数创建一个空的 `map`，也可以使用字面量创建并初始化一个 `map`。

示例 1：使用 `make` 函数创建 `map`

```go
myMap := make(map[string]int) // 创建一个键为 string，值为 int 的 map
```



 示例 2：使用字面量创建并初始化 `map`

```go
myMap := map[string]int{
    "Alice": 25,
    "Bob":   30,
}
```



 在这个例子中，`myMap` 是一个 `map[string]int` 类型的映射，表示键为 `string` 类型，值为 `int` 类型。`"Alice"` 的值是 `25`，`"Bob"` 的值是 `30`。  





###  Map 常用操作 
####  1. 添加或更新键值对  
```go
myMap["Charlie"] = 35 // 添加键 "Charlie"，值为 35
```



####  2. 访问值  
 通过键来访问对应的值：  

```go
age := myMap["Alice"] // 获取 "Alice" 的值，即 25
```





#### 3. 删除键值对 
 使用 `delete` 函数可以从 `map` 中删除一个键值对：  

```go
delete(myMap, "Bob") // 删除键 "Bob"
```





####  4. 检查键是否存在 
 访问 `map` 中不存在的键会返回该类型的零值。可以使用多返回值的形式来检查键是否存在：  

```go
value, exists := myMap["Charlie"]
if exists {
    fmt.Println("Charlie 的值:", value)
} else {
    fmt.Println("Charlie 不存在")
}

```



####  5. 遍历 `map`
 可以使用 `for range` 循环遍历 `map` 中的所有键值对：  

```go
for key, value := range myMap {
    fmt.Println(key, value)
}
```





#### 6.小实践
```go
package main

import (
    "fmt"
)

func main() {
    // 创建并初始化 map
    ages := map[string]int{
        "Alice": 25,
        "Bob":   30,
    }

    // 添加新键值对
    ages["Charlie"] = 35

    // 访问并打印某个键的值
    fmt.Println("Alice 的年龄:", ages["Alice"])

    // 删除键值对
    delete(ages, "Bob")

    // 遍历 map
    fmt.Println("所有人的年龄:")
    for name, age := range ages {
        fmt.Println(name, age)
    }
}

```

 运行结果  

```go
Alice 的年龄: 25
所有人的年龄:
Alice 25
Charlie 35

```

