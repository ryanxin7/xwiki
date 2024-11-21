---
id: 24110052219
author: Ryan
title: 如何在Go语言中实现面向对象的四大特性
date: 2024-11-07
categories: Go
tags: [Go]
---

#  如何在Go语言中实现面向对象的四大特性
 在 Go 语言中，虽然没有传统 OOP 语言的“类”和“继承”等概念，但我们仍然可以通过 **结构体（struct）**、**方法（method）** 和 **接口（interface）** 来实现类似的对象特性：**封装**、**继承**、**多态** 和 **抽象**。  



 下面我们将通过示例代码展示这些特性在 Go 中的实现和使用。  



##  1. 封装 
 在 Go 中，封装主要通过结构体和方法来实现，并通过大写和小写的字段或方法名称来控制访问权限（即公有和私有）。  

小写字母开头的字段或方法是**私有的**，大写字母开头的字段或方法是**公有的**。

这种命名规则控制了访问权限，适用于包（package）范围。  



```go
package main

import (
    "fmt"
)

// Car 结构体
type Car struct {
    Make  string // 公有字段，外部包可以访问
    model string // 私有字段，仅限于当前包访问
}

func (c Car) DisplayInfo() { // 公有方法，外部包可以访问
    fmt.Println("Make:", c.Make, "Model:", c.model)
}

func main() {
    myCar := Car{Make: "Toyota", model: "Corolla"}
    fmt.Println(myCar.Make)   // 可以访问
    // fmt.Println(myCar.model) // 无法访问，编译器会报错
    myCar.DisplayInfo()       // 可以调用
}

```



**示例**：  

```go
package main

import (
    "fmt"
)

// Car 结构体
type Car struct {
    make  string // 私有字段（以小写字母开头）
    model string
    year  int
}

// NewCar 是一个构造函数，用于创建 Car 实例
func NewCar(make, model string, year int) *Car {
    return &Car{make: make, model: model, year: year}
}

// SetMake 是一个方法，用于设置私有字段 make
func (c *Car) SetMake(make string) {
    c.make = make
}

// GetMake 是一个方法，用于获取私有字段 make
func (c *Car) GetMake() string {
    return c.make
}

func main() {
    myCar := NewCar("Toyota", "Corolla", 2020)
    fmt.Println("Make:", myCar.GetMake()) // 通过 GetMake 访问 make 字段
    myCar.SetMake("Honda")                // 通过 SetMake 修改 make 字段
    fmt.Println("New Make:", myCar.GetMake())
}

```



**解释**：

+ `make` 字段是小写开头，因此是私有的，外部无法直接访问它。
+ 通过 `GetMake` 和 `SetMake` 方法来封装对 `make` 字段的访问，这样可以确保数据的安全性和完整性。





##  2. 继承
 Go 中没有传统的类继承机制，但可以通过**结构体嵌套**实现类似的继承效果。这种方式允许我们在结构体中嵌入另一个结构体，从而使得嵌入的结构体的字段和方法可以在外层结构体中使用。  

**示例**：  

```go
package main

import (
    "fmt"
)

// 定义基础结构体 Vehicle
type Vehicle struct {
    make  string
    model string
}

// 为 Vehicle 定义一个方法
func (v *Vehicle) Start() {
    fmt.Println("Starting the vehicle...")
}

// Car 结构体嵌入 Vehicle，表示一种继承关系
type Car struct {
    Vehicle // 嵌入结构体
    year    int
}

func main() {
    //创建一个 Car 类型的实例，实例化该结构体
    myCar := Car{
        Vehicle: Vehicle{make: "Toyota", model: "Corolla"},
        year:    2020,
    }
    myCar.Start() // Car 可以直接使用 Vehicle 的 Start 方法
    fmt.Println("Make:", myCar.make)
    fmt.Println("Model:", myCar.model)
    fmt.Println("Year:", myCar.year)
}

```

****

**解释**：

+ `Car` 结构体通过嵌入 `Vehicle` 结构体，拥有了 `Vehicle` 的 `make` 和 `model` 字段以及 `Start` 方法。
+ `Car` 实例 `myCar` 可以直接调用嵌入的 `Vehicle` 的方法 `Start`，实现了类似继承的功能。





##  3. 多态 
 在 Go 中，多态是通过接口实现的。接口允许不同类型实现相同的方法，从而表现出不同的行为形式。  



**示例**：  

```go
package main

import "fmt"

// 定义一个 Drivable 接口
type Drivable interface {
    Drive()  // 只要求实现 Drive 方法
}

// 定义 Car 结构体
type Car struct {
    Make  string
    Model string
}

// Car 实现了 Drivable 接口
func (c Car) Drive() {
    fmt.Println("Driving the car:", c.Make, c.Model)
}

// 定义 Bike 结构体
type Bike struct {
    Make  string
    Model string
}

// Bike 实现了 Drivable 接口
func (b Bike) Drive() {
    fmt.Println("Riding the bike:", b.Make, b.Model)
}

// startJourney 函数接受一个 Drivable 类型的参数
// 因为 Car 和 Bike 都实现了 Drivable 接口，所以它们的实例可以传递给 startJourney 函数
func startJourney(d Drivable) {
    d.Drive()  // 根据传入的对象类型，调用对应的 Drive 方法
}

func main() {
    myCar := Car{"Toyota", "Corolla"}
    myBike := Bike{"Yamaha", "MT-07"}

    startJourney(myCar)  // 输出：Driving the car: Toyota Corolla
    startJourney(myBike) // 输出：Riding the bike: Yamaha MT-07
}


//当 myCar 被传递给 startJourney 时，Car 类型的 Drive() 方法被调用，输出“Driving the car: Toyota Corolla”。
//当 myBike 被传递给 startJourney 时，Bike 类型的 Drive() 方法被调用，输出“Riding the bike: Yamaha MT-07”。
```



### 详细解析
1. `**Drivable**`** 接口**：
    - `Drivable` 是一个接口类型，它定义了一个方法 `Drive()`，要求实现该接口的类型必须提供一个 `Drive` 方法。
    - 在 Go 中，接口是隐式实现的，我们不需要显式声明某个类型实现了一个接口，只要它提供了接口所要求的方法，它就自动实现了这个接口。
2. `**Car**`** 和 **`**Bike**`** 结构体**：
    - `Car` 和 `Bike` 都是结构体类型，每个结构体都实现了 `Drivable` 接口中的 `Drive()` 方法。
    - `Car` 和 `Bike` 的 `Drive()` 方法分别打印了与汽车和自行车相关的消息，表示这两种不同的行为。
3. `**startJourney(d Drivable)**`** 函数**：
    - `startJourney` 接受一个 `Drivable` 类型的参数 `d`，它表示任何实现了 `Drive()` 方法的类型的实例。
    - `startJourney` 函数内部调用了 `d.Drive()`，根据传入的 `d` 的实际类型（`Car` 或 `Bike`），会调用对应类型的 `Drive()` 方法。
    - 由于 Go 是静态类型语言，尽管 `d` 是 `Drivable` 类型，但在运行时，Go 会根据实际传入的对象来选择调用相应的 `Drive` 方法。
4. **多态性**：
    - `startJourney` 函数展现了 Go 中的**多态性**。通过传递不同类型（如 `Car` 或 `Bike`）的实例给 `startJourney` 函数，`Drive()` 方法会表现出不同的行为。
    - **多态**使得同一个接口方法可以根据传入的不同对象（即不同的类型实例）表现出不同的行为。







##  4. 抽象
 抽象是指通过接口来隐藏具体实现细节，向用户提供简单的操作接口。Go 的接口本身就是一种抽象手段，它定义了对象要实现的方法，而不关心这些方法的具体实现。  



```go
package main

import (
    "fmt"
)

// 定义一个接口 Speaker，用于抽象出“发出声音”的行为
type Speaker interface {
    Speak() string
}

// Dog 类型实现了 Speaker 接口
type Dog struct {
    name string
}

func (d Dog) Speak() string {
    return "Woof!"
}

// Cat 类型实现了 Speaker 接口
type Cat struct {
    name string
}

func (c Cat) Speak() string {
    return "Meow!"
}

// MakeSound 函数接收 Speaker 接口，实现抽象
func MakeSound(s Speaker) {
    fmt.Println(s.Speak())
}

func main() {
    dog := Dog{name: "Buddy"}
    cat := Cat{name: "Whiskers"}

    MakeSound(dog) // 输出：Woof!
    MakeSound(cat) // 输出：Meow!
}

```

****

**解释**：

+ `Speaker` 接口抽象出 `Speak` 方法，而不关心具体的实现。
+ `Dog` 和 `Cat` 类型实现了 `Speaker` 接口，提供各自的 `Speak` 方法。
+ `MakeSound` 函数只接收 `Speaker` 类型，因此无论是 `Dog` 还是 `Cat`，都可以调用 `MakeSound` 来发出声音，而不需要了解 `Dog` 和 `Cat` 的内部实现。





### 抽象与多态的关系
+ **抽象**是指通过接口或抽象类隐藏具体实现，提供统一的接口供外部使用。
+ **多态**是指相同的接口方法在不同类型的对象上表现出不同的行为。

在 Go 中，**抽象和多态经常是一起使用的**。通过接口实现抽象，定义了一组行为，多个类型通过实现这个接口来表现出不同的行为，从而形成了多态。

**总结：**

+ **抽象**是隐藏细节，只暴露关键信息；接口就是抽象的一个体现。
+ **多态**是通过接口让不同的类型实现相同的方法，并根据类型的不同在运行时表现出不同的行为。

