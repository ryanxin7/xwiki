---
author: Ryan
title: kubernetes配置imagePullSecrets秘钥来拉取镜像
date: 2024-01-22
---

**imagePullSecrets 简介**

在Kubernetes中，imagePullSecrets是一个用于指定用于从私有Docker仓库拉取镜像的凭据的字段。私有Docker仓库通常需要身份验证才能拉取镜像，而imagePullSecrets允许你将认证信息存储在Kubernetes集群中，并在Pod规范中引用这些凭据。


在Kubernetes中创建一个Secret对象，其中包含连接到私有Docker仓库所需的凭据。这通常包括用户名、密码和邮箱等信息。

**方式1：** 

```bash
kubectl create secret docker-registry <secret-name> --docker-server=<your-registry-server> --docker-username=<your-name> --docker-password=<your-pword>
```




**方式2：** 通过现存的docker认证文件来创建Secret

```bash
kubectl create secret generic xxx-key \
    --from-file=.dockerconfigjson=/root/.docker/config.json> \
    --type=kubernetes.io/dockerconfigjson
```

注意：config.json文件需要在主机上通过docker login 的方式登录后，才会生成。这种方式有一个好处，就是如果有多个镜像仓库，都先存在于一个config.json文件中，然后通过命令打入Secret。





**最后在yaml文件中使用这个创建出来的Secret：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-deployment
spec:
  template:
    spec:
      imagePullSecrets:
      - name: your-secret-name
  replicas: 1
  selector:
    matchLabels:
      app: your-app
  template:
    metadata:
      labels:
        app: your-app
    spec:
      containers:
      - name: your-container
        image: your-image:latest
```