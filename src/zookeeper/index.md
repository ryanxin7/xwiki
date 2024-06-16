---
sidebar_position: 1
---
# Zookeeper 简介


Apache Zookeeper 是一个分布式协调服务，用于管理大型分布式系统中的数据。它通过提供简单的原语来实现分布式系统中的协调、同步和配置管理。

## Zookeeper 的核心概念

### 节点 (Node)
Zookeeper 中的节点称为 ZNode。ZNode 是 Zookeeper 数据结构的基本单元，类似于文件系统中的文件和目录。每个 ZNode 可以存储数据，并可以有子节点。

### 数据模型
Zookeeper 采用层次化的数据模型，数据存储在路径命名的 ZNode 中。路径以斜杠 (/) 分隔，例如 `/app/config`。ZNode 分为两种类型：持久节点和临时节点。

- **持久节点 (Persistent Node)**: 节点在客户端断开连接后仍然存在。
- **临时节点 (Ephemeral Node)**: 节点在客户端断开连接后被自动删除。

### 版本号
每个 ZNode 有一个版本号，记录节点数据的变更次数。Zookeeper 使用版本号来确保数据的一致性和完整性。

### 监听 (Watch)
Zookeeper 支持对节点进行监听。客户端可以对特定的 ZNode 设置 Watch，当该 ZNode 的数据或子节点发生变化时，Zookeeper 会通知客户端。

## Zookeeper 的特点

1. **强一致性**: Zookeeper 保证在单一时间点所有客户端看到的数据是一致的。

2. **高可用性**: Zookeeper 通过集群部署，实现了高可用性和故障容错。

3. **顺序性**: Zookeeper 保证客户端的更新请求按顺序执行。

4. **原子性**: 更新操作要么全部成功，要么全部失败，不存在部分成功的情况。

## Zookeeper 的使用场景

1. **配置管理**: Zookeeper 可以存储和管理分布式系统的配置数据，实现动态配置管理。

2. **服务发现**: 通过 Zookeeper 注册和发现服务，实现分布式系统中各服务的自动发现和连接。

3. **分布式锁**: 利用 Zookeeper 的原子性和顺序性，实现分布式系统中的锁机制。

4. **集群管理**: Zookeeper 可以管理和监控集群中的节点状态，实现故障检测和恢复。

## 常用 Zookeeper 命令

### 基本操作
```bash
# 启动 Zookeeper 服务
zkServer.sh start

# 停止 Zookeeper 服务
zkServer.sh stop

# 查看 Zookeeper 服务状态
zkServer.sh status
```

## CLI 客户端操作

```bash

# 连接 Zookeeper 服务
zkCli.sh -server host:port

# 创建节点
create /path data

# 获取节点数据
get /path

# 设置节点数据
set /path new_data

# 删除节点
delete /path

# 查看节点列表
ls /
```

## Zookeeper 配置文件
Zookeeper 的配置文件通常命名为 zoo.cfg，包含以下主要配置项：

```bash

tickTime=2000
dataDir=/var/lib/zookeeper
clientPort=2181
initLimit=5
syncLimit=2
server.1=zookeeper1:2888:3888
server.2=zookeeper2:2888:3888
server.3=zookeeper3:2888:3888
tickTime: Zookeeper 使用的基本时间单位（毫秒）。
dataDir: 存储快照和事务日志的目录。
clientPort: 客户端连接 Zookeeper 服务器的端口。
initLimit: Follower 初始化连接到 Leader 的时间限制。
syncLimit: Follower 与 Leader 之间同步的时间限制。
server.X: 集群中每个 Zookeeper 服务器的配置。
```