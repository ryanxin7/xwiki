#  Go语言标准库 `net/url` 包详解 
`net/url` 包是 Go 标准库中用于处理 URL 的包，提供了一系列工具来解析、构建和操作 URL。这包括分解 URL 的各个部分（如协议、主机、路径、查询参数等），以及对查询参数进行编码和解码。`net/url` 包特别适合用于 Web 编程和网络请求处理中。  



## 1. 主要功能
1. **解析 URL 字符串**：将 URL 字符串解析为 `url.URL` 结构体，可以轻松获取 URL 的各个部分。
2. **构建 URL**：通过修改 `url.URL` 的字段重新生成新的 URL。
3. **处理查询参数**：使用 `url.Values` 对象添加、删除和编码 URL 的查询参数。



## 2.`url.URL` 结构体
`url.URL` 结构体是 Go 标准库中内置的，用于存储 URL 的各个组成部分，比如协议（scheme）、主机（host）、路径（path）、查询参数（query）等。

这个结构体的设计使得程序可以方便地解析、构建和修改 URL。  



### 2.1 结构体的定义 
 在 `net/url` 包中，`URL` 结构体的定义大致如下：  

```go
package url

type URL struct {
    Scheme   string    // 协议（如 "http"、"https"）
    Opaque   string    // 不透明的 URI
    User     *Userinfo // 用户信息
    Host     string    // 主机名和端口（如 "example.com" 或 "example.com:8080"）
    Path     string    // 路径（如 "/search"）
    RawPath  string    // 原始路径（编码前的路径）
    ForceQuery bool    // 是否强制添加查询
    RawQuery string    // 查询参数（如 "q=golang&page=2"）
    Fragment string    // URL 的片段（锚点，通常是 "#" 后的部分）
}

```





## 3. 主要函数  
### 3.1  url.Parse  
用于解析一个 URL 字符串，并返回一个 `*url.URL` 对象。

如果解析失败，则返回错误信息。

```go
func Parse(rawurl string) (*URL, error)
```



示例

```go
package main

import (
	"fmt"
	"net/url"
)

func main() {
	rawURL := "https://example.com:8080/search?q=golang&page=2#section1"
	u, err := url.Parse(rawURL)
	if err != nil {
		fmt.Println("解析 URL 出错:", err)
		return
	}
	fmt.Println("协议:", u.Scheme)      // 输出: https
	fmt.Println("主机:", u.Host)        // 输出: example.com:8080
	fmt.Println("路径:", u.Path)        // 输出: /search
	fmt.Println("查询参数:", u.RawQuery) // 输出: q=golang&page=2
	fmt.Println("片段:", u.Fragment)    // 输出: section1
}

```





### 3.2  url.ParseRequestURI  
+ 类似于 `Parse` 函数，但 `ParseRequestURI` 会更加严格地检查 URL 格式，通常用于解析 HTTP 请求中的 URL。
+ 它会解析 `rawurl`，并返回一个 `*url.URL` 指针，表示解析后的 URL 对象。

```go
func ParseRequestURI(rawurl string) (*URL, error)

```





### 3.3  url.Values  
`url.Values` 是一个映射类型 map  ，定义为 `map[string][]string`。它用于存储 URL 的查询参数，支持一个键对应多个值的情况。

**常用方法**：

+ `Set`：设置或替换某个键的值。
+ `Add`：添加一个值到某个键（不会替换原有值）。
+ `Get`：获取某个键的第一个值。
+ `Encode`：将查询参数编码成 URL 查询字符串格式。

```go
package main

import (
	"fmt"
	"net/url"
)

func main() {
	// 创建一个空的 url.Values 对象
	params := url.Values{}

	// 设置查询参数
	params.Set("q", "golang")
	params.Set("page", "2")
	params.Add("sort", "asc")

	// 将参数编码为查询字符串
	queryString := params.Encode()
	fmt.Println("查询字符串:", queryString) // 输出: q=golang&page=2&sort=asc
}

```

###   
##  如何使用 `net/url` 包解析并构建完整 URL  
`net/url` 包提供了 URL 的解析和构建工具，是处理 Web 请求中 URL 和查询参数的标准工具。

`**url.URL**`** 结构体**：用于表示和操作 URL 的各个组成部分。

`**url.Values**`：用于构建和管理 URL 查询参数，特别适用于动态生成查询参数的场景。

```go
package main

import (
	"fmt"
	"net/url"
)

func main() {
	// 定义基础 URL
	baseURL := "https://example.com/search"
	
	// 使用 url.Parse 解析基础 URL
	u, err := url.Parse(baseURL)
	if err != nil {
		fmt.Println("解析 URL 出错:", err)
		return
	}

	// 设置查询参数
	params := url.Values{}
	params.Set("q", "golang")
	params.Set("page", "2")
	u.RawQuery = params.Encode() // 将查询参数编码并设置到 RawQuery 字段

	// 输出完整 URL
	fmt.Println("完整的 URL:", u.String())
}

```

### 
**输出**：

```go
完整的 URL: https://example.com/search?q=golang&page=2
```



