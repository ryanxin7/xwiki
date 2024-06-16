---
sidebar_position: 1
---
# Prometheus 简介


Prometheus 是一个开源的系统监控和报警工具包。最初由 SoundCloud 开发，并于 2012 年作为一个社区项目发布。Prometheus 以其强大的数据模型和灵活的查询语言（PromQL）广受欢迎，广泛应用于云原生监控。

## Prometheus 的核心概念

### 时间序列数据库
Prometheus 是一个时间序列数据库，专门用于处理时间序列数据，即按时间顺序排列的一系列数据点。

### 数据模型
Prometheus 使用多维度的数据模型，时间序列由指标名称（Metric Name）和一组键值对（Labels）标识。每个数据点包括一个时间戳、一个指标名称和多个标签。

### PromQL
Prometheus 查询语言（PromQL）是一个功能强大的查询语言，用于实时查询和分析时间序列数据。它支持聚合、过滤和多种函数操作。

### Exporter
Exporter 是一个暴露应用程序或系统指标的服务。Prometheus 通过 HTTP 协议定期抓取 Exporter 提供的指标数据。常见的 Exporter 包括 Node Exporter、Cadvisor 和 Blackbox Exporter。

### Alertmanager
Alertmanager 是 Prometheus 的报警管理组件。它接收 Prometheus 发出的报警，执行分组、抑制和路由等操作，并将报警发送到指定的接收器（如电子邮件、Slack 等）。

## Prometheus 的架构

Prometheus 的架构由以下组件组成：

1. **Prometheus Server**: 核心组件，负责抓取和存储时间序列数据，并处理查询请求。
2. **Exporters**: 数据收集器，暴露系统或应用程序的指标。
3. **Pushgateway**: 用于短期作业的指标收集，允许作业在完成时推送指标数据。
4. **Alertmanager**: 报警管理器，处理和分发报警。
5. **Grafana**: 可视化工具，通常与 Prometheus 集成，用于创建和查看监控仪表板。

## Prometheus 的优势

1. **强大的数据模型**: 支持多维度数据标签，灵活的数据查询和聚合。
2. **高性能**: 专为处理高频率、高维度的时间序列数据而设计，性能优异。
3. **自动化**: 通过服务发现和动态配置，实现监控目标的自动化管理。
4. **报警功能**: 内置报警机制，支持复杂报警规则和分发策略。
5. **生态系统**: 丰富的 Exporter 和集成工具，广泛支持各种系统和应用。

## 常用 Prometheus 配置

### Prometheus 配置文件
Prometheus 的配置文件通常为 `prometheus.yml`，包含抓取配置、报警规则和全局设置等。

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
