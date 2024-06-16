---
sidebar_position: 1
---
# Ceph 简介

Ceph 是一个开源的分布式存储系统，旨在提供高性能、高可用性和高可扩展性的存储解决方案。Ceph 可以在统一的平台上同时支持对象存储、块存储和文件系统存储。

## Ceph 的核心概念

### Ceph 存储集群
Ceph 存储集群由多个存储节点组成，这些节点通过网络连接，形成一个高可用和可扩展的存储系统。集群中的数据通过分布式算法进行存储和管理。

### OSD (Object Storage Daemon)
OSD 是 Ceph 存储节点的核心组件，每个 OSD 守护进程管理一个存储设备。OSD 负责存储数据、处理数据复制、恢复、回填和重平衡等操作。

### MON (Monitor)
Monitor 节点负责集群的状态管理，包括维护集群的拓扑结构、节点状态、数据的主副本位置等。MON 提供一致性和高可用的元数据服务。

### MDS (Metadata Server)
MDS 负责管理 Ceph 文件系统的元数据，包括目录结构、文件权限等。MDS 使得 Ceph 文件系统能够高效地处理文件操作请求。

### CRUSH (Controlled Replication Under Scalable Hashing)
CRUSH 是 Ceph 的数据分布算法，用于决定数据在集群中的存储位置。CRUSH 算法根据配置规则和集群拓扑，确保数据的高可用性和负载均衡。

## Ceph 的特点

1. **高可用性**: 通过多副本和自我修复机制，Ceph 确保数据的高可用性和可靠性。
2. **高性能**: 采用分布式架构和 CRUSH 算法，提供高效的数据读写性能。
3. **高扩展性**: 支持从几台节点到数千台节点的线性扩展，满足不同规模的存储需求。
4. **统一存储**: 在同一个集群中支持对象存储、块存储和文件系统存储，提供多样化的存储服务。

## Ceph 的使用场景

1. **云存储**: 提供高可用、高性能和可扩展的存储服务，支持云计算平台的存储需求。
2. **大数据分析**: 通过高吞吐量和低延迟的存储能力，支持大数据分析和处理。
3. **备份和恢复**: 提供可靠的数据存储和快速的恢复能力，适用于企业数据备份和灾难恢复。
4. **容器存储**: 与容器编排平台（如 Kubernetes）集成，提供持久存储解决方案。

## 常用 Ceph 命令

### 集群管理
```bash
# 查看集群状态
ceph status

# 查看集群健康状态
ceph health

# 列出所有 OSD
ceph osd ls
```

## 存储池管理
```bash
# 创建存储池
ceph osd pool create pool_name 128

# 删除存储池
ceph osd pool delete pool_name pool_name --yes-i-really-really-mean-it

# 列出存储池
ceph osd pool ls

```



## 用户和权限管理
```bash
# 创建用户
ceph auth get-or-create client.user mon 'allow r' osd 'allow rw pool=pool_name'

# 列出所有用户
ceph auth list

```