---
author: Ryan
title: kubernetes RBAC鉴权机制与多用户实例
date: 2024-01-04
---

## 1.概述

基于角色的访问控制（**Role-Based Access Control**，**RBAC**）是一种广泛应用的访问控制模型，它基于用户的角色来管理对系统资源的访问权限。在RBAC中，访问控制是根据用户的角色分配的，而不是直接将权限分配给个体用户。



![](http://img.xinn.cc/image.png)

`rbac.authorization.k8s.io`  API组是Kubernetes中用于管理RBAC策略的一部分。

  通过使用这个API组，您可以定义 **角色（Role）、集群角色（ClusterRole）、角色绑定（RoleBinding）、集群角色绑定（ClusterRoleBinding）** 等资源对象，以控制对 Kubernetes API 中不同资源的访问权限。

  要在 Kubernetes 中启用 RBAC，需要在启动 API 服务器时设置 `--authorization-mode` 参数，并确保将 RBAC 作为其中的一个授权模式。

  ```bash
   --authorization-mode=Node,RBAC, --<其他选项> --<其他选项>
  ```




## 2.API 对象
**RBAC API 声明了四种 Kubernetes 对象**：

- **Role（角色）**：Role 对象定义了一组规则，用于指定在单个命名空间内对资源的访问权限。它可以授予特定命名空间内用户或服务账户对资源的访问权限。

- **ClusterRole（集群角色）**：ClusterRole 与 Role 类似，不过它的作用范围不限于单个命名空间。ClusterRole 可以授予对整个集群范围内资源的访问权限。

- **RoleBinding（角色绑定）**：RoleBinding 将 Role 或 ClusterRole 与用户、组、服务账户等主体绑定在一起，赋予它们相应的权限。它用于将角色与实际的用户或实体关联起来，使其能够访问特定的资源。

- **ClusterRoleBinding（集群角色绑定）**：与 RoleBinding 类似，但 ClusterRoleBinding 是将 ClusterRole 与用户、组、服务账户等主体绑定，授予在整个集群范围内的资源访问权限。

通过 kubectl 这样的命令行工具，可以像管理其他 Kubernetes 对象一样来描述、创建、更新或删除 RBAC 对象



### 2.1  Role 和 ClusterRole 的作用范围以及用途

**Role 对象是针对某个特定命名空间（Namespace）内的资源定义访问权限的。** 
创建 Role 时，必须将其绑定到特定的命名空间，并且它只能赋予该命名空间内资源的权限。

在 Role 中定义的规则和权限是在特定命名空间内生效的，例如，可以定义一个 Role 来管理某个命名空间内的 Pod、Service 或其它资源的访问权限。



**ClusterRole 是集群级别的资源，不受限于单个命名空间**。

ClusterRole 可以授予单个或多个命名空间内的用户或服务账户,也可以在整个集群定义针对整个集群范围的资源（例如节点、PersistentVolumes 等）的访问权限。可以被广泛地应用于不同的命名空间，甚至整个集群，赋予对资源更广泛的访问权限。



**Role 用于管理单个命名空间内的资源访问权限，而 ClusterRole 则用于更广泛的授权需求**，例如跨多个命名空间或整个集群的资源管理。

这两种资源的区别在于其作用范围不同，因此在设计 RBAC 策略时，可以根据需要选择使用适当的资源类型来定义和管理权限。



**Role 示例**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: xinn  # 命名空间
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```



``apiVersion`` 指定了 RBAC API 的版本。
``kind`` 指定了要创建的对象类型，这里是一个 Role。
``metadata`` 中包含了元数据信息，其中 namespace 是该 Role 所属的命名空间，name 是该 Role 的名称。
`rules` 列表定义了该 Role 的访问规则：
`apiGroups` 定义了资源所属的 API 组，空字符串表示核心 API 组。
`resources` 是权限所应用的资源类型，这里是 "pods"，表示 Pod 资源。
`verbs` 是允许的操作，这里允许 "get"、"list" 和 "watch" 操作，允许用户读取（获取）、列出和监视 Pod 资源。







**ClusterRole 示例**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch"]
```





### 2.2 RoleBinding 和 ClusterRoleBinding

- RoleBinding 用于将 Role 对象与特定命名空间内的用户、组或服务账户等主体绑定在一起，从而赋予这些主体相应 Role 中定义的权限。



- ClusterRoleBinding 用于将 ClusterRole 对象与集群内的用户、组或服务账户等主体绑定在一起，从而赋予这些主体相应 ClusterRole 中定义的权限。
与 RoleBinding 不同，ClusterRoleBinding 在整个集群范围内生效，而不是针对单个命名空间。


**RoleBinding 示例**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pod-reader-binding
  namespace: your-namespace
subjects:
- kind: User  # 主体类型（User、Group、ServiceAccount 等）
  name: user1  # 主体名称
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role  # 绑定的角色类型（Role 或 ClusterRole）
  name: pod-reader  # 角色名称
  apiGroup: rbac.authorization.k8s.io
```




**ClusterRoleBinding 示例**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: secret-reader-binding
subjects:
- kind: ServiceAccount  # 主体类型（User、Group、ServiceAccount 等）
  name: my-service-account  # 主体名称
  namespace: your-namespace  # 所属命名空间
roleRef:
  kind: ClusterRole  # 绑定的角色类型（ClusterRole）
  name: secret-reader  # 角色名称
  apiGroup: rbac.authorization.k8s.io
```



## 3.引用资源

在 Kubernetes RBAC 中，可以使用资源的名称来引用其子资源。子资源是 Kubernetes API 的一部分，允许对主资源执行特定操作或获取相关信息。RBAC 角色表达子资源时，使用斜线（/）来分隔资源和子资源。


**子资源示例：**
允许特定主体读取 Pod 资源以及访问这些 Pod 的日志子资源

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-and-pod-logs-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
```




**限制访问的具体资源名称示例**
允许特定主体对名为 my-configmap 的 ConfigMap 进行 "update" 和 "get" 操作。
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: configmap-updater
rules:
- apiGroups: [""]
  # 在 HTTP 层面，用来访问 ConfigMap 资源的名称为 "configmaps"
  resources: ["configmaps"]
  resourceNames: ["my-configmap"]
  verbs: ["update", "get"]
```




## 4.多用户实例

创建一个只读账号

### 4.1 创建role只读角色

```bash
kubectl create serviceaccount xinn-user1 -n xinn
serviceaccount/xinn-user1 created
```


### 4.2 创建rolebinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: xinn
  name: xinn-user2-role
rules:
- apiGroups: [""]
  resources: ["pods","pods/exec"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
```


```bash
kubectl apply -f xinn-user2-role.yaml
role.rbac.authorization.k8s.io/xinn-user2-role created
```




### 4.3 将规则与账户进行绑定

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: role-binding-xinn-user2
  namespace: xinn
subjects:
- kind: ServiceAccount
  name: xinn-user2
  namespace: xinn
roleRef:
  kind: Role
  name: xinn-user2-role
  apiGroup: rbac.authorization.k8s.io
```


```bash
root@k8s-made-01-32:~# kubectl apply -f xinn-user2-role-binding.yaml
rolebinding.rbac.authorization.k8s.io/xinn-user2-role-binding created
```


### 4.4 获取Token名称

从 Kubernetes v1.24 版本开始，引入了 [**LegacyServiceAccountTokenNoAutoGeneration** 特性门控](https://kubernetes.io/zh-cn/docs/reference/command-line-tools-reference/feature-gates/#feature-gates-for-graduated-or-deprecated-features)，默认情况下启用以至于 Kubernetes 不会自动为 ServiceAccount 创建与令牌相关的 Secrets。如果需要使用服务账号的令牌进行认证和授权需要手动创建这些 Secrets。




**创建ServiceAccount**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: xinn-user2
  namespace: xinn
```
```bash
# 查看 ServiceAccount 详细信息，发现没有对 Token 进行自动创建
kubectl describe sa -n xinn xinn-user2
Name:                xinn-user2
Namespace:           xinn
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              <none>
Events:              <none>
```



**创建 SA 账号 Secret 并关联**

```yaml
关联apiVersion: v1
kind: Secret
type: kubernetes.io/service-account-token
metadata:
  name: xinn-user2-secret
  namespace: xinn
  annotations:
      kubernetes.io/service-account.name: "xinn-user2" ## 关联SA 账号
```



**再次查看 ServiceAccount 确认已对 Secret 关联**

```bash
kubectl describe sa -n xinn xinn-user2
Name:                xinn-user2
Namespace:           xinn
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              xinn-user2-secret
Events:              <none>
```



**查看 Secret 详细信息**

```bash
root@k8s-made-01-32:~# kubectl describe -n xinn secrets xinn-user2-secret
Name:         xinn-user2-secret
Namespace:    xinn
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: xinn-user2
              kubernetes.io/service-account.uid: b3844090-c036-487a-a07c-b5b6dbe30688

Type:  kubernetes.io/service-account-token

Data
====
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6Il82SWdMUWRGbnlHeGEtQnpReDVvUE9PWW9yWXY4cmg0NWdsT2ZiNTZiY0UifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJ4aW5uIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6Inhpbm4tdXNlcjItc2VjcmV0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6Inhpbm4tdXNlcjIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiJiMzg0NDA5MC1jMDM2LTQ4N2EtYTA3Yy1iNWI2ZGJlMzA2ODgiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6eGlubjp4aW5uLXVzZXIyIn0.dhVVB0_aYhXmJEcgoqa6ZR9jkOvQv5nnDIyfdmTHyfgiNSX7TbDTZD1ncmZOH0uZNVkT4ja7Gpn371upEBuUnIsnnhb8PCS51WyUiKUTGzo7G48u_M6aS4n7tVcZY7YG7TYtG-t5gzaK2gPVX9ipanlsrwg1wxpEXUP5WHKXvkN8fqMw1YAFxs0BJspntC9YcD-sH2GUDoQhNVi4rFp_ye2cAdnzgBRFKdk0og2dm5LhEYy8F_cgztxFk1OUzLiRBi31w5SY1O0AFhHmv--4fWUWjeNIIerqXN7D_rio6_xgE04WEvZDi6G5nb1y7DlXjNlSAIhCo_w7CxdunQzREA
ca.crt:     1310 bytes
namespace:  4 bytes
```





### 4.5 使用base64加密并登录测试

**获取SA Token**

```bash
root@k8s-made-01-32:~# kubectl get secret -n xinn xinn-user2-secret  -o jsonpath={".data.token"} | base64 -d
eyJhbGciOiJSUzI1NiIsImtpZCI6Il82SWdMUWRGbnlHeGEtQnpReDVvUE9PWW9yWXY4cmg0NWdsT2ZiNTZiY0UifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJ4aW5uIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6Inhpbm4tdXNlcjItc2VjcmV0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6Inhpbm4tdXNlcjIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiJiMzg0NDA5MC1jMDM2LTQ4N2EtYTA3Yy1iNWI2ZGJlMzA2ODgiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6eGlubjp4aW5uLXVzZXIyIn0.dhVVB0_aYhXmJEcgoqa6ZR9jkOvQv5nnDIyfdmTHyfgiNSX7TbDTZD1ncmZOH0uZNVkT4ja7Gpn371upEBuUnIsnnhb8PCS51WyUiKUTGzo7G48u_M6aS4n7tVcZY7YG7TYtG-t5gzaK2gPVX9ipanlsrwg1wxpEXUP5WHKXvkN8fqMw1YAFxs0BJspntC9YcD-sH2GUDoQhNVi4rFp_ye2cAdnzgBRFKdk0og2dm5LhEYy8F_cgztxFk1OUzLiRBi31w5SY1O0AFhHmv--4fWUWjeNIIerqXN7D_rio6_xgE04WEvZDi6G5nb1y7DlXjNlSAIhCo_w7CxdunQzREAroot@k8s-made-01-32:~#
```



**Kubernetes Dashboard 登录测试** 

![image-20240104155842003](http://img.xinn.cc/image-20240104155842003.png)

![](http://img.xinn.cc/image-20240104160312671.png)





### 4.6 基于kube-config文件登录

#### 4.6.1 创建csr请求文件

```json
# cat xinn-user2-csr.json
{
  "CN": "xinn-user2",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
```



#### 4.6.2 签发证书

使用 CFSSL 工具根据提供的 CSR 文件 `xinn-user1-csr.json` 生成证书。

```bash
root@k8s-made-01-32:~# ln -sv /etc/kubeasz/bin/cfssl* /usr/bin/
'/usr/bin/cfssl' -> '/etc/kubeasz/bin/cfssl'
'/usr/bin/cfssl-certinfo' -> '/etc/kubeasz/bin/cfssl-certinfo'
'/usr/bin/cfssljson' -> '/etc/kubeasz/bin/cfssljson'

cfssl gencert -ca=/etc/kubernetes/ssl/ca.pem -ca-key=/etc/kubernetes/ssl/ca-key.pem -config=/etc/kubeasz/clusters/xx-prod/ssl/ca-config.json -profile=kubernetes xinn-user2-csr.json | cfssljson -bare xinn-user2

#-ca 指定了 CA 证书的路径。
#-ca-key 指定了 CA 的私钥路径。
#-config 指定了 CA 配置文件的路径，其中包含了 CA 的配置信息和证书配置。
#-profile 指定了使用的证书配置文件中的配置文件。
#使用 cfssljson 命令处理结果，将其输出为 "user1.pem", "user1.csr", "user1-key.pem" 这些文件。
```

 

```bash
ls | grep user2
xinn-user2.csr
xinn-user2-csr.json
xinn-user2-key.pem
xinn-user2.pem
```





#### 4.6.3 生成普通用户kubeconfig文件

```bash
root@k8s-made-01-32:~#  kubectl config set-cluster xx-prod --certificate-authority=/etc/kubernetes/ssl/ca.pem --embed-certs=true --server=https://10.1.0.32:6443,https://10.1.0.33:6443 --kubeconfig=xinn-user2.kubeconfig
Cluster "xx-prod" set.

 #--embed-certs=true为嵌入证书信息
```



```yaml
root@k8s-made-01-32:~# cat xinn-user2.kubeconfig
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURtakNDQW9LZ0F3SUJBZ0lVTnhMZWE2QTZvVC9HL0dnR24rZ01uRDJjR2VBd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNRMDR4RVRBUEJnTlZCQWdUQ0VoaGJtZGFhRzkxTVFzd0NRWURWUVFIRXdKWQpVekVNTUFvR0ExVUVDaE1EYXpoek1ROHdEUVlEVlFRTEV3WlRlWE4wWlcweEZqQVVCZ05WQkFNVERXdDFZbVZ5CmJtVjBaWE10WTJFd0lCY05Nak13TmpFME1EazBPVEF3V2hnUE1qRXlNekExTWpFd09UUTVNREJhTUdReEN6QUoKQmdOVkJBWVRBa05PTVJFd0R3WURWUVFJRXdoSVlXNW5XbWh2ZFRFTE1Ba0dBMVVFQnhNQ1dGTXhEREFLQmdOVgpCQW9UQTJzNGN6RVBNQTBHQTFVRUN4TUdVM2x6ZEdWdE1SWXdGQVlEVlFRREV3MXJkV0psY201bGRHVnpMV05oCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBckNRN2VwV2RqTCtEMXNVY0FacXgKdjcrRGxIZm5aOFlNTmRXN25VNFk2ZHUyN2RUV3FpVFVjTllCK1RLR3RzRmJuODRkbEFtR04wZHpwcTZtNXlrdgppZWowS29SbjJMWDZmZHArNWRacXFKd1dMK0FsQXBycmY1cjYvNlRBaGNabGwvK1NaMnp3OFRldFVZY1ZFdzdzCit6ZDErelV6TkpMV25WdTByUitFeHNyTzNvdy85T0diTkdRaWk5d1RBRFR6MzlDQ09DQzdUZytIUVowQ3g2NGwKUE5IMjVKSmNYbjYxeXBUa0FwWXRiRUR2V29XWC9yYVJTcmZhclZObU1laFdKb2dSd2VsV1gydlM0cnAwVGdHWApyRGt3NHdNTUl0VmI1WmZoT3paTDV4QVRxZDlUcmRxWUVmZkRDSlNZam91c3VPL3FZSlZad1dTaXBxdXQ5V2c3CmVRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQVFZd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlYKSFE0RUZnUVVsbGxrNnl4SEdhTUpMOWtHUHJpV3JDdlY3bGd3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUc0UApIck5TOFpiRmQxTFZnMm5XT1RoTTVrUnZKSkdKZzUwcGlkTm9meTNMWVllVlUxMzZUeDBDZWxiaEZpS2l1SDhOCk9LVFI5cHRVYytXUDlaUlJUQkc0dkxCa3JxSlp3aXUxNUJXVThBT01Pcnhwd05xZlN1OVZFREtaMFRtUVVsWkEKVGxRdEczYk1sVFNpUkNZZXk0NjFQYVlpOE0vNUF1QjJqUDg2N09oUUhTaFdxN3RQUnJXSGFQZE1tekpKODBzUgpTRDNrRlYyUm5aemN5bGEzTFU1cWZaQUhTb20vL0tMb21oK0VlR2N4YWRVRlVwRUl4cDFVN3Z4YnRtRzByT2pKCitjNlJiWExZc2ZWRVNDOVEyUk10MTBUWCtYK1kwSGxzWHdlV0RiNXZOLzIwTlorTGtJR3E4cmNELytBZHhQd0YKcVI4R1hNSUY5TFhpdXk4ZWNjRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    server: https://10.1.0.32:6443,https://10.1.0.33:6443
  name: xx-prod
contexts: null
current-context: ""
kind: Config
preferences: {}
users: null
```





#### 4.6.4 设置用户凭据

```bash
cp *.pem /etc/kubernetes/ssl/
kubectl config set-credentials xinn-user2 \
--client-certificate=/etc/kubernetes/ssl/xinn-user2.pem \
--client-key=/etc/kubernetes/ssl/xinn-user2-key.pem \
--embed-certs=true \
--kubeconfig=xinn-user2.kubeconfig
```

```bash
kubectl config set-credentials xinn-user2: 指定要设置的用户凭据名称为 xinn-user2。
--client-certificate=/etc/kubernetes/ssl/xinn-user2.pem: 指定用户的客户端证书的路径。
--client-key=/etc/kubernetes/ssl/xinn-user2-key.pem: 指定用户的客户端密钥的路径。
--embed-certs=true: 将证书和密钥嵌入到 kubeconfig 文件中，以便在不需要外部文件的情况下进行访问。
--kubeconfig=xinn-user2.kubeconfig: 指定将配置保存到名为 xinn-user2.kubeconfig 的 kubeconfig 文件中。
```



```yaml
root@k8s-made-01-32:~# cat xinn-user2.kubeconfig
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURtakNDQW9LZ0F3SUJBZ0lVTnhMZWE2QTZvVC9HL0dnR24rZ01uRDJjR2VBd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNRMDR4RVRBUEJnTlZCQWdUQ0VoaGJtZGFhRzkxTVFzd0NRWURWUVFIRXdKWQpVekVNTUFvR0ExVUVDaE1EYXpoek1ROHdEUVlEVlFRTEV3WlRlWE4wWlcweEZqQVVCZ05WQkFNVERXdDFZbVZ5CmJtVjBaWE10WTJFd0lCY05Nak13TmpFME1EazBPVEF3V2hnUE1qRXlNekExTWpFd09UUTVNREJhTUdReEN6QUoKQmdOVkJBWVRBa05PTVJFd0R3WURWUVFJRXdoSVlXNW5XbWh2ZFRFTE1Ba0dBMVVFQnhNQ1dGTXhEREFLQmdOVgpCQW9UQTJzNGN6RVBNQTBHQTFVRUN4TUdVM2x6ZEdWdE1SWXdGQVlEVlFRREV3MXJkV0psY201bGRHVnpMV05oCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBckNRN2VwV2RqTCtEMXNVY0FacXgKdjcrRGxIZm5aOFlNTmRXN25VNFk2ZHUyN2RUV3FpVFVjTllCK1RLR3RzRmJuODRkbEFtR04wZHpwcTZtNXlrdgppZWowS29SbjJMWDZmZHArNWRacXFKd1dMK0FsQXBycmY1cjYvNlRBaGNabGwvK1NaMnp3OFRldFVZY1ZFdzdzCit6ZDErelV6TkpMV25WdTByUitFeHNyTzNvdy85T0diTkdRaWk5d1RBRFR6MzlDQ09DQzdUZytIUVowQ3g2NGwKUE5IMjVKSmNYbjYxeXBUa0FwWXRiRUR2V29XWC9yYVJTcmZhclZObU1laFdKb2dSd2VsV1gydlM0cnAwVGdHWApyRGt3NHdNTUl0VmI1WmZoT3paTDV4QVRxZDlUcmRxWUVmZkRDSlNZam91c3VPL3FZSlZad1dTaXBxdXQ5V2c3CmVRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQVFZd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlYKSFE0RUZnUVVsbGxrNnl4SEdhTUpMOWtHUHJpV3JDdlY3bGd3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUc0UApIck5TOFpiRmQxTFZnMm5XT1RoTTVrUnZKSkdKZzUwcGlkTm9meTNMWVllVlUxMzZUeDBDZWxiaEZpS2l1SDhOCk9LVFI5cHRVYytXUDlaUlJUQkc0dkxCa3JxSlp3aXUxNUJXVThBT01Pcnhwd05xZlN1OVZFREtaMFRtUVVsWkEKVGxRdEczYk1sVFNpUkNZZXk0NjFQYVlpOE0vNUF1QjJqUDg2N09oUUhTaFdxN3RQUnJXSGFQZE1tekpKODBzUgpTRDNrRlYyUm5aemN5bGEzTFU1cWZaQUhTb20vL0tMb21oK0VlR2N4YWRVRlVwRUl4cDFVN3Z4YnRtRzByT2pKCitjNlJiWExZc2ZWRVNDOVEyUk10MTBUWCtYK1kwSGxzWHdlV0RiNXZOLzIwTlorTGtJR3E4cmNELytBZHhQd0YKcVI4R1hNSUY5TFhpdXk4ZWNjRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    server: https://10.1.0.32:6443,https://10.1.0.33:6443
  name: xx-prod
contexts: null
current-context: ""
kind: Config
preferences: {}
users:
- name: xinn-user2
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUQyRENDQXNDZ0F3SUJBZ0lVSHFCcXVUdzI2WWhSMUg2WkxtT2ZRbHBTbEhrd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNRMDR4RVRBUEJnTlZCQWdUQ0VoaGJtZGFhRzkxTVFzd0NRWURWUVFIRXdKWQpVekVNTUFvR0ExVUVDaE1EYXpoek1ROHdEUVlEVlFRTEV3WlRlWE4wWlcweEZqQVVCZ05WQkFNVERXdDFZbVZ5CmJtVjBaWE10WTJFd0lCY05NalF3TVRBME1Ea3hNVEF3V2hnUE1qQTNNekV5TWpJd09URXhNREJhTUdVeEN6QUoKQmdOVkJBWVRBa05PTVJBd0RnWURWUVFJRXdkQ1pXbEthVzVuTVJBd0RnWURWUVFIRXdkQ1pXbEthVzVuTVF3dwpDZ1lEVlFRS0V3TnJPSE14RHpBTkJnTlZCQXNUQmxONWMzUmxiVEVUTUJFR0ExVUVBeE1LZUdsdWJpMTFjMlZ5Ck1qQ0NBU0l3RFFZSktvWklodmNOQVFFQkJRQURnZ0VQQURDQ0FRb0NnZ0VCQU1vbnNzRDhtYnRDZWFXMHhaVC8KaGRZUEtlQktwMG9IQ0hLcFRCUndNaVRGdkFkMnErWVJUdlNMOUE4WDM4b25DSnlmRlRDeFZUNUhycGNUTkF4TwpDc1JiYW1PR0psSUp2YkxYWm9VdUZGUHRWd3lzWWRiMUdYblQ1TGxPWkVlcDNiYlN0YmllTVlORkJ3TjRuZERsCnpWMHdGQ2Z5OEFKUTN0cGtYRGprTzgvUlJoM2NVa1FWejZDdStibWU0U1J3VWFDdkk0ZmZwQkRqM1FoWGw2UTcKVER6dzBMN2JNM01BMWlqQUtOeXkycjBEc293UHo4aWUrTUJqR1JRcGtzMTI4RzdlN05CNjYyYlF3ZlRIaGplTwowZFFRVloxTVMzQ2dRSlBLM3ZXbzVvSS9FM1p4NzdVa2dTWWxzaVdwUkxCMHhKNFdYNEsyVlN6ZE9nQ0drSHAxCmRCc0NBd0VBQWFOL01IMHdEZ1lEVlIwUEFRSC9CQVFEQWdXZ01CMEdBMVVkSlFRV01CUUdDQ3NHQVFVRkJ3TUIKQmdnckJnRUZCUWNEQWpBTUJnTlZIUk1CQWY4RUFqQUFNQjBHQTFVZERnUVdCQlJ6NVJUZGZGOGZqNGNENXFYMQppbmdOSVpxSWV6QWZCZ05WSFNNRUdEQVdnQlNXV1dUckxFY1pvd2t2MlFZK3VKYXNLOVh1V0RBTkJna3Foa2lHCjl3MEJBUXNGQUFPQ0FRRUFlVTZTVDN3VCtrb1IzWm85N05welhZbURlVzJhTEdZYXFyb05iSmYvVVM1czhQLysKK1JFdG54cDRhaFNUVGplSnE1ZUkzUzZDMUtqVVhMQUpaOUVvK1FsdlkxVWtLNE52MW1mRmVwM0tLNm1ZVHltRwpmaDBKa25iVGxuSERiWEpWNk9LYWoveGFpWlE2akxNRWdDMVlSREJQbXlLVzc3cEhZanFyRUtINUtpWFc5b0hyCkVsWDNWL0Z4R3hOdy9oV1QvZmpPZWFLRE9xdEZIdzZBRlNEUFNab1ZzTnN6dmJJRU1WMVRUQzVBUTNXSFFNY3UKRHhQYVBmZTd0dmUvVVp0M1dEZngxRUNHSDlobFhIU2J0MUYwT2p4MkdvVy8yTjZadEptb2s3UnBVSDRHMVBpbAowNGFVZ3ZuNUtlTW4rdG8rY29yUGwrc2dDTnJhYTFWcnF0cjEvZz09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBeWlleXdQeVp1MEo1cGJURmxQK0YxZzhwNEVxblNnY0ljcWxNRkhBeUpNVzhCM2FyCjVoRk85SXYwRHhmZnlpY0luSjhWTUxGVlBrZXVseE0wREU0S3hGdHFZNFltVWdtOXN0ZG1oUzRVVSsxWERLeGgKMXZVWmVkUGt1VTVrUjZuZHR0SzF1SjR4ZzBVSEEzaWQwT1hOWFRBVUovTHdBbERlMm1SY09PUTd6OUZHSGR4UwpSQlhQb0s3NXVaN2hKSEJSb0s4amg5K2tFT1BkQ0ZlWHBEdE1QUERRdnRzemN3RFdLTUFvM0xMYXZRT3lqQS9QCnlKNzR3R01aRkNtU3pYYndidDdzMEhyclp0REI5TWVHTjQ3UjFCQlZuVXhMY0tCQWs4cmU5YWptZ2o4VGRuSHYKdFNTQkppV3lKYWxFc0hURW5oWmZnclpWTE4wNkFJYVFlblYwR3dJREFRQUJBb0lCQUdmVy9Ic2xSZEpxMHhITApTYksvam4vbVNoeHNQSUpLR296TGFja1YyS3dLNWdydmFsMURoc3NYR01hbi9NeGFRSkl6SlM5ZDUrdVY1cGl6CnhJaU5qZnBPK3Rja2tZcVNkbDduUmtJaTZVNHpIQVBtaUZ0aWl6T0pKSFFMVUhkL1NlUWZXRGo5Q1hIa2d6WEYKUDB1T3YyNmV3N3ZCam9laUF0Y3J0ak9EQ1RZMTNraklRUGd4UVhlU1ZsUkl5bzI5K1FQdVNOa1hmK0VweUY3awp1UU1iUzZ3Y2tZNEIweGYwc0xJMzhGY3BJNnpaVncrQVd0U0dHbHNJNUF5VFZHbFNCTEh5ZFFTd3RMSnBxa1YyCjlDbFNQTklwbE56T3d1aFkyai9BZHVNZzlJVW01ajBNQzNyQTNwV2Fua0RDMWNnYVp0MHRVM2tSeHNtOUtVS2wKcW9BZzFBRUNnWUVBektGTkxPOUZrWENld0JmdXJlRzlXclltRGtTMGRuK21GWUI5MnFhdUlxYjNzNnNBTm9DYwowR2JSdTlDb0RCNm9Cdmg0VncrRnUwN0xxb2FSTE84ZzZRODFmbi82ei9HbCtDMG5iQndFUDdvbTIybmN4UHZECkpqNjUzZXdJblZxUUNmT01RVS9RcGR2cUIyNXNFUjZKQ2dJM2dzMUNwd1pWd3poUllMb3l2bFVDZ1lFQS9PZFcKbllwMFRteS8wTEw0K0RNUFluWHF6NXY4d0pxb2lTc0pRSlRDR1hmNmwyWnlHUHFhOC9EVTJ1eXpQZWRpZEVVTwpZNkx5YjFJczJtOThaOWM2NlNzcW1EeSs4Tmt4M3RYNU54Qk1lSVEwbmlya0Z4SlhQaWtQblh0VXF5MVF4bytuCnpuYzl3MFZxOStRLzh6NVVmMHZtUjMweTg0bkl4NU1MZVhEWCtLOENnWUFXR05FQnFqRGovTHBYMmYyL0x5SkkKZW1Udm80R3RUaWw4SnV6d1FKR0xVbVpyTTJzSmQ2ZjNaVEwreWhCcmhwLzBhTDV1QUZJYm9PMmpVM2EzMkhiQQpWQkVkd09vdnJGT1UwaU53ckRIVlE5L1FUOFUwVEUrTmdMYUhmV2FNdjJ2UWQwbE5BRFp5d3FXcCtjV1hyNmx5CnVEeVFWbVA5TDFUeGlOSlkxS0tJSlFLQmdRQ0dmZkFONzZkU1hYclVYWmtSUlBZVmdtZlE2RDlObmZHcW9IeFgKSDhUcERtanhRc1hDaXVNRWZ6cHpBaFdBQWlEVmZEUGV3TFQwaGxyYi94WEZreXY4Kzd1M0lmYlkxbWd5L005LwpmT2R0MzhDcnJGdUgrWFR6MVpvOFFXNFJhaFBleEY2VTZjeXFuNnYzRUNjQ0VFK1hNcUhQdXNEeHlvQS93ZThFCk1nSm9lUUtCZ1FDT1B4U3RlZ0owWGlqWmRVeTBoajhWaVlqY2ZScExES1Z2Y1lnMTREYTZXdGRTM2tkUXJLZUoKcURaM3lqc3JPa0tUckp2eHd2cFVIRFhCRmtodU9KbitXNHc0RlNWeG9kYkd5YTlNSkwvbG12dHVZVjJQd2tyOApUK2tUTUF3SjlUZklleWF1NGV2MEdTMzAwS2VXblJmc2Y0K1dTdWpxMkc2Yzgxb1BSWnluTlE9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=
```



#### 4.6.5 设置上下文参数(多集群使用上下文区分)

https://kubernetes.io/zh/docs/concepts/configuration/organize-cluster-access-kubeconfig/

```bash
kubectl config set-context xx-prod \
--cluster=xx-prod \
--user=xinn-user2 \
--namespace=xinn \
--kubeconfig=xinn-user2.kubeconfig
```



```bash
在 Kubernetes 中，上下文（Context）是指向集群、用户和命名空间的指针，允许用户在不同的环境（集群）和身份（用户）之间进行切换。
kubectl config set-context xx-prod: 指定要设置的上下文名称为 xx-prod。
--cluster=xx-prod: 指定该上下文所使用的集群名称为 xx-prod，这个集群名称对应之前设置的集群名称。
--user=xinn-user2: 指定该上下文所使用的用户名称为 xinn-user2，这个用户名称对应之前设置的用户凭据。
--namespace=xinn: 指定该上下文所使用的命名空间为 xinn，这将成为该上下文的默认命名空间。
--kubeconfig=xinn-user2.kubeconfig: 指定将配置保存到名为 xinn-user2.kubeconfig 的 kubeconfig 文件中。
```



```yaml
root@k8s-made-01-32:~# cat xinn-user2.kubeconfig
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURtakNDQW9LZ0F3SUJBZ0lVTnhMZWE2QTZvVC9HL0dnR24rZ01uRDJjR2VBd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNRMDR4RVRBUEJnTlZCQWdUQ0VoaGJtZGFhRzkxTVFzd0NRWURWUVFIRXdKWQpVekVNTUFvR0ExVUVDaE1EYXpoek1ROHdEUVlEVlFRTEV3WlRlWE4wWlcweEZqQVVCZ05WQkFNVERXdDFZbVZ5CmJtVjBaWE10WTJFd0lCY05Nak13TmpFME1EazBPVEF3V2hnUE1qRXlNekExTWpFd09UUTVNREJhTUdReEN6QUoKQmdOVkJBWVRBa05PTVJFd0R3WURWUVFJRXdoSVlXNW5XbWh2ZFRFTE1Ba0dBMVVFQnhNQ1dGTXhEREFLQmdOVgpCQW9UQTJzNGN6RVBNQTBHQTFVRUN4TUdVM2x6ZEdWdE1SWXdGQVlEVlFRREV3MXJkV0psY201bGRHVnpMV05oCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBckNRN2VwV2RqTCtEMXNVY0FacXgKdjcrRGxIZm5aOFlNTmRXN25VNFk2ZHUyN2RUV3FpVFVjTllCK1RLR3RzRmJuODRkbEFtR04wZHpwcTZtNXlrdgppZWowS29SbjJMWDZmZHArNWRacXFKd1dMK0FsQXBycmY1cjYvNlRBaGNabGwvK1NaMnp3OFRldFVZY1ZFdzdzCit6ZDErelV6TkpMV25WdTByUitFeHNyTzNvdy85T0diTkdRaWk5d1RBRFR6MzlDQ09DQzdUZytIUVowQ3g2NGwKUE5IMjVKSmNYbjYxeXBUa0FwWXRiRUR2V29XWC9yYVJTcmZhclZObU1laFdKb2dSd2VsV1gydlM0cnAwVGdHWApyRGt3NHdNTUl0VmI1WmZoT3paTDV4QVRxZDlUcmRxWUVmZkRDSlNZam91c3VPL3FZSlZad1dTaXBxdXQ5V2c3CmVRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQVFZd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlYKSFE0RUZnUVVsbGxrNnl4SEdhTUpMOWtHUHJpV3JDdlY3bGd3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUc0UApIck5TOFpiRmQxTFZnMm5XT1RoTTVrUnZKSkdKZzUwcGlkTm9meTNMWVllVlUxMzZUeDBDZWxiaEZpS2l1SDhOCk9LVFI5cHRVYytXUDlaUlJUQkc0dkxCa3JxSlp3aXUxNUJXVThBT01Pcnhwd05xZlN1OVZFREtaMFRtUVVsWkEKVGxRdEczYk1sVFNpUkNZZXk0NjFQYVlpOE0vNUF1QjJqUDg2N09oUUhTaFdxN3RQUnJXSGFQZE1tekpKODBzUgpTRDNrRlYyUm5aemN5bGEzTFU1cWZaQUhTb20vL0tMb21oK0VlR2N4YWRVRlVwRUl4cDFVN3Z4YnRtRzByT2pKCitjNlJiWExZc2ZWRVNDOVEyUk10MTBUWCtYK1kwSGxzWHdlV0RiNXZOLzIwTlorTGtJR3E4cmNELytBZHhQd0YKcVI4R1hNSUY5TFhpdXk4ZWNjRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    server: https://10.1.0.32:6443,https://10.1.0.33:6443
  name: xx-prod
contexts:
- context:
    cluster: xx-prod
    namespace: xinn
    user: xinn-user2
  name: xx-prod
current-context: ""
kind: Config
preferences: {}
users:
- name: xinn-user2
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUQwekNDQXJ1Z0F3SUJBZ0lVZHdCM0NvRGJpL2JUMFkyc1B6SVhweVFoY1prd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNRMDR4RVRBUEJnTlZCQWdUQ0VoaGJtZGFhRzkxTVFzd0NRWURWUVFIRXdKWQpVekVNTUFvR0ExVUVDaE1EYXpoek1ROHdEUVlEVlFRTEV3WlRlWE4wWlcweEZqQVVCZ05WQkFNVERXdDFZbVZ5CmJtVjBaWE10WTJFd0lCY05NalF3TVRBME1EZ3pNekF3V2hnUE1qQTNNekV5TWpJd09ETXpNREJhTUdBeEN6QUoKQmdOVkJBWVRBa05PTVJBd0RnWURWUVFJRXdkQ1pXbEthVzVuTVJBd0RnWURWUVFIRXdkQ1pXbEthVzVuTVF3dwpDZ1lEVlFRS0V3TnJPSE14RHpBTkJnTlZCQXNUQmxONWMzUmxiVEVPTUF3R0ExVUVBeE1GUTJocGJtRXdnZ0VpCk1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLQW9JQkFRREhPRHZ3ZHJvWExtYXNySSt3cmdXOWJjNzIKY09PQWR0dFpTMGFjNE12NVE4MTR4cWlkS3pEdXpDVDFiSlBZL3E5emdkalo3OWhpNUZmcXJ5cWN1alAzdWZPNApGeE01MVFKbzJIdmVNQ1luZ0NWdDlKd1dqR3prb1M3alliNlowY0kvRVdQWExpMzYwTWFrb2RBdGNXdTdRNlJHCmNGSkh5OXJtY0tOaFY5MTRuTkg3UWN4TllxcXdXT0M2SVVlL3J6aG9Mbmw3d1hvZXlwWjgvNjdRUnhzTHVNaG4KV2YrZ1V3azR1eGpScmx3V1ZvSVVEeGdvVzZjRlRZNEpHcFFjQS9pMUVtTGEzMXpLRWxxbG1vVDV3QkRTbzl2SQp1MEc5OGtkZk9hR1BWS1VZdllZZ3RuelFadjU0SkFaZXl3MlB3b1JDaEszby9Lbks1UktDQWhBRHRDb2JBZ01CCkFBR2pmekI5TUE0R0ExVWREd0VCL3dRRUF3SUZvREFkQmdOVkhTVUVGakFVQmdnckJnRUZCUWNEQVFZSUt3WUIKQlFVSEF3SXdEQVlEVlIwVEFRSC9CQUl3QURBZEJnTlZIUTRFRmdRVXpobmdUeVgweXUyVnkxd1dPNm1oUy9xUQpyV013SHdZRFZSMGpCQmd3Rm9BVWxsbGs2eXhIR2FNSkw5a0dQcmlXckN2VjdsZ3dEUVlKS29aSWh2Y05BUUVMCkJRQURnZ0VCQUlkYmNubnE1TVRTdkpSbHdSVDhVdmFkVDROZGdvWUhuenNTd0tqQjYxWG8wOE53WFhDSjVaSlQKaTF2bm1zaW10dTZGYThZTDF4b01hOGJwaFVUcnlqQnNoS09zNWNzWGxuOTlDcVcydm41THE0WVRPNVNycnJyZgpycjdiaCtsWWFqLzczVTkzaUpxRENKRy9YVExuUlhldjRvMENqQTVsa0R2KzdXQkVqMTI3b3JKRjBJcVdxaW9xCmtpU3NHcGJPOHI5bGdLRXhuRmtuYUxDUlBENlNrTXlwakVnRnBDSXdaU1hCL1JqQmZSc0FjalVHMmZrYk1mN08KM1ozaGY4TzBWbFowQUxGMzBIMHlCTEhueERSWVhmZVBEVXNUVi9SSzhYMnpwQ2ljWXEyT1AyOHZYdUgrTU5Ndgp2NHM0Y1BhMGlNQ2lxaVlMblRwUlN1VkVWYUttQTJvPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBeHpnNzhIYTZGeTVtckt5UHNLNEZ2VzNPOW5EamdIYmJXVXRHbk9ETCtVUE5lTWFvCm5Tc3c3c3drOVd5VDJQNnZjNEhZMmUvWVl1Ulg2cThxbkxvejk3bnp1QmNUT2RVQ2FOaDczakFtSjRBbGJmU2MKRm94czVLRXU0MkcrbWRIQ1B4RmoxeTR0K3RER3BLSFFMWEZydTBPa1JuQlNSOHZhNW5DallWZmRlSnpSKzBITQpUV0txc0ZqZ3VpRkh2Njg0YUM1NWU4RjZIc3FXZlArdTBFY2JDN2pJWjFuL29GTUpPTHNZMGE1Y0ZsYUNGQThZCktGdW5CVTJPQ1JxVUhBUDR0UkppMnQ5Y3loSmFwWnFFK2NBUTBxUGJ5THRCdmZKSFh6bWhqMVNsR0wyR0lMWjgKMEdiK2VDUUdYc3NOajhLRVFvU3Q2UHlweXVVU2dnSVFBN1FxR3dJREFRQUJBb0lCQVFDTHlSQjl4TUVFZlFGOApUY1N4SXhwUjlaZlA0aHd2eXJaVXJIWUtvODFieE5DSzIxSDZuaERDcmltTXI3ZjUvWkxjaUpMQk1RTHpPT2ZiCmV6ZDZLMGxGbkl1L2N5bUJYYzVJQlFhOU82bTU4N2ZQdEdCRmpoam1QNWJuNDNEYSs0ekJ0aEVKTHBVQ3RiVjgKVlRIK2dPUW56T21hcHp1RXR5eU1ueUowcmpOdmFkUGdrbnNVS1o5b3crZHgxWVlmOVJYSTl3eCs3S2Y0bXk3TQplODkrUWkyNDZXbUJ1RVlPanBGcWV2ajhrQUVXMDhtK1JPVVk5SXllSllETS8raTJ6Vi9lOHhHN2UrT2tHTXl0CnNXaUVBMndrZ1JQRlFMVWs0OU9OZGkzQWp3QTJXOEdockJtclBGb1FZMVp2amtrOTZuSzJlMjMrZUJGSTJBQ0UKdjJ6VkdkNVpBb0dCQVBhc2x1ZnREbGpTVUdNb2FWTy9rbWdtcjFiV0FENy80c2NXU1lMWENlNDRpRlVNTHIzbgowM0hXK1Bma0lPdndTSCtsRVVnb1dqUkdsWjIzdXB5VVhFRXZrZHhyTlJIOFhQRndZclVmVWgxT0p5SXlFcnFPCjE2YjNVKzhuejN0YVlTQmJqd2Y0N1praDl1L2FQTzBCTUx0ZDJrVHZpRFhsMmdRdmFhejlGakoxQW9HQkFNN0EKWEc2cDBrbVUxM1hoOGZ2dVI3bkNXaUpmOWNkYnZ5c25RVk5RdjcwamZqS01zRjhNZkJocmUxUi9lY0ZIS0RBbQpVN1d6d3ZTQXlraEw1SmoxY1MydzYyK3JaV0NRcml6UnpTeWIyYy9IRCtlV1NjazlOSm1TMEtRa29qYU9rWEMyCmFKYTdYeWdnNkpTK3l5QlQyYUtLMWRHeVNvbzJvemtqM0Q3bmJUaFBBb0dBTE04alJwUXdkQUFZYkRyT0QxR1EKaGV6cEV3d2kxVTdrWWlmeFNKeEppSVdxZGxDVk9SZ2d0K0JHTDdtNEpVUHIxNHdqdklqZ0Fma0VlcmNDWmlrcApMUW80SStNeHE4ZTlGbnJFNDRRQ0JhTEp4eE56aFlJbk9JUmJNZWw0Ymo3M3Y4b0NESCt5b1l1aThPVWpCaWFlCk5Kc1M2RXplNEhPVmpBY1Uya0RMUkhVQ2dZQm1CSUVYa2ZCVG9vQVdpT0R3b1FqL1hpay9vUDRUMnUrZmlZVXcKYVQzVFJEbzNFempNRGNzRitiTW5aS2RkZVpFWkFUQjVEalI2bFRvN0prZXNPaUFZblozdXdqSUp6aHBEdjFwdwpVbzdOZWJvZFdna2FwWHJZOUpyREE5aU85eFpJK1pqdUY1TENxRXBiYXpHcngvUXh3alB6ZnZoTTd0em5pd3hZCmRiVnMvUUtCZ1FDbmZrZ2MrWUMwZktEUmk3TjJ6Q2xLL3ZHRzlMdTRQV3QxWVJZQUlEbU9GZTN2b01aUVpSQ3oKUGlFdmNQeFVEVC94bUR6dXo5aER1YmVJN1lGYUkyZ0JCUUhILzFJVWhkVlh6WlNYRXIzOEJobTk4RHBYT2UwdgplR0tPUko0dEV5d2hkcUNqSzBqYmxFMmNkK1JaVmZpY09SNXNIZ0ZPNFpzQ2J6UEpxWmMydFE9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=
```





#### 4.6.6  设置默认上下文

```bash
kubectl config use-context xx-prod --kubeconfig=xinn-user2.kubeconfig
```

 ```bash
 kubectl config use-context xx-prod: #将名为 xx-prod 的上下文设置为当前默认上下文。这个上下文应该是之前在 kubeconfig 文件中配置的一个上下文。
 --kubeconfig=xinn-user2.kubeconfig: #指定了要操作的 kubeconfig 文件，这个命令将在这个文件中设置默认上下文。
 ```



#### 4.6.7 获取账号token

```bash
root@k8s-made-01-32:~# kubectl describe secrets -n xinn xinn-user2
Name:         xinn-user2
Namespace:    xinn
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: xinn-user2
              kubernetes.io/service-account.uid: bd3c6967-56d0-4c18-9386-83f2492115a0

Type:  kubernetes.io/service-account-token

Data
====
ca.crt:     1310 bytes
namespace:  4 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6Il82SWdMUWRGbnlHeGEtQnpReDVvUE9PWW9yWXY4cmg0NWdsT2ZiNTZiY0UifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJ4aW5uIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6Inhpbm4tdXNlcjIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoieGlubi11c2VyMiIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6ImJkM2M2OTY3LTU2ZDAtNGMxOC05Mzg2LTgzZjI0OTIxMTVhMCIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDp4aW5uOnhpbm4tdXNlcjIifQ.A5c7l704dYJ10ftkqSEYjhPyO5AX7b-qKFVbAO4bk3xp2z6idfNo8suvZ9JiNhXzmMhIAa99aURbuUPeSZFHuIWBgUiU4lEAGlIfZJdgGbQan0qCxSfJpr9wKfPU3dgKo7PRnXhRyDtBwAFjrarlJu3CmnpJ_Ntz489s_ZIz1yJ4lTmcjqT9zElMj0Hxczm9zqxrt0BWYjQQIm4UgLOjEf2CkvJ-Ln8ucmRZLdZ4Hrvc9h5Sy1GvDIYJUKVCl4y_dnxD26wePmoJdn-WCA-GEYHE-BHsAeN_YdHDi1056NsUk05HZJ2EQNY57_IQctpffUxaQfKK-WRayyHiv1UE2g

```

 

#### 4.6.8 将token写入用户kube-config文件

```yaml
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUQwekNDQXJ1Z0F3SUJBZ0lVZHdCM0NvRGJpL2JUMFkyc1B6SVhweVFoY1prd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNRMDR4RVRBUEJnTlZCQWdUQ0VoaGJtZGFhRzkxTVFzd0NRWURWUVFIRXdKWQpVekVNTUFvR0ExVUVDaE1EYXpoek1ROHdEUVlEVlFRTEV3WlRlWE4wWlcweEZqQVVCZ05WQkFNVERXdDFZbVZ5CmJtVjBaWE10WTJFd0lCY05NalF3TVRBME1EZ3pNekF3V2hnUE1qQTNNekV5TWpJd09ETXpNREJhTUdBeEN6QUoKQmdOVkJBWVRBa05PTVJBd0RnWURWUVFJRXdkQ1pXbEthVzVuTVJBd0RnWURWUVFIRXdkQ1pXbEthVzVuTVF3dwpDZ1lEVlFRS0V3TnJPSE14RHpBTkJnTlZCQXNUQmxONWMzUmxiVEVPTUF3R0ExVUVBeE1GUTJocGJtRXdnZ0VpCk1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLQW9JQkFRREhPRHZ3ZHJvWExtYXNySSt3cmdXOWJjNzIKY09PQWR0dFpTMGFjNE12NVE4MTR4cWlkS3pEdXpDVDFiSlBZL3E5emdkalo3OWhpNUZmcXJ5cWN1alAzdWZPNApGeE01MVFKbzJIdmVNQ1luZ0NWdDlKd1dqR3prb1M3alliNlowY0kvRVdQWExpMzYwTWFrb2RBdGNXdTdRNlJHCmNGSkh5OXJtY0tOaFY5MTRuTkg3UWN4TllxcXdXT0M2SVVlL3J6aG9Mbmw3d1hvZXlwWjgvNjdRUnhzTHVNaG4KV2YrZ1V3azR1eGpScmx3V1ZvSVVEeGdvVzZjRlRZNEpHcFFjQS9pMUVtTGEzMXpLRWxxbG1vVDV3QkRTbzl2SQp1MEc5OGtkZk9hR1BWS1VZdllZZ3RuelFadjU0SkFaZXl3MlB3b1JDaEszby9Lbks1UktDQWhBRHRDb2JBZ01CCkFBR2pmekI5TUE0R0ExVWREd0VCL3dRRUF3SUZvREFkQmdOVkhTVUVGakFVQmdnckJnRUZCUWNEQVFZSUt3WUIKQlFVSEF3SXdEQVlEVlIwVEFRSC9CQUl3QURBZEJnTlZIUTRFRmdRVXpobmdUeVgweXUyVnkxd1dPNm1oUy9xUQpyV013SHdZRFZSMGpCQmd3Rm9BVWxsbGs2eXhIR2FNSkw5a0dQcmlXckN2VjdsZ3dEUVlKS29aSWh2Y05BUUVMCkJRQURnZ0VCQUlkYmNubnE1TVRTdkpSbHdSVDhVdmFkVDROZGdvWUhuenNTd0tqQjYxWG8wOE53WFhDSjVaSlQKaTF2bm1zaW10dTZGYThZTDF4b01hOGJwaFVUcnlqQnNoS09zNWNzWGxuOTlDcVcydm41THE0WVRPNVNycnJyZgpycjdiaCtsWWFqLzczVTkzaUpxRENKRy9YVExuUlhldjRvMENqQTVsa0R2KzdXQkVqMTI3b3JKRjBJcVdxaW9xCmtpU3NHcGJPOHI5bGdLRXhuRmtuYUxDUlBENlNrTXlwakVnRnBDSXdaU1hCL1JqQmZSc0FjalVHMmZrYk1mN08KM1ozaGY4TzBWbFowQUxGMzBIMHlCTEhueERSWVhmZVBEVXNUVi9SSzhYMnpwQ2ljWXEyT1AyOHZYdUgrTU5Ndgp2NHM0Y1BhMGlNQ2lxaVlMblRwUlN1VkVWYUttQTJvPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBeHpnNzhIYTZGeTVtckt5UHNLNEZ2VzNPOW5EamdIYmJXVXRHbk9ETCtVUE5lTWFvCm5Tc3c3c3drOVd5VDJQNnZjNEhZMmUvWVl1Ulg2cThxbkxvejk3bnp1QmNUT2RVQ2FOaDczakFtSjRBbGJmU2MKRm94czVLRXU0MkcrbWRIQ1B4RmoxeTR0K3RER3BLSFFMWEZydTBPa1JuQlNSOHZhNW5DallWZmRlSnpSKzBITQpUV0txc0ZqZ3VpRkh2Njg0YUM1NWU4RjZIc3FXZlArdTBFY2JDN2pJWjFuL29GTUpPTHNZMGE1Y0ZsYUNGQThZCktGdW5CVTJPQ1JxVUhBUDR0UkppMnQ5Y3loSmFwWnFFK2NBUTBxUGJ5THRCdmZKSFh6bWhqMVNsR0wyR0lMWjgKMEdiK2VDUUdYc3NOajhLRVFvU3Q2UHlweXVVU2dnSVFBN1FxR3dJREFRQUJBb0lCQVFDTHlSQjl4TUVFZlFGOApUY1N4SXhwUjlaZlA0aHd2eXJaVXJIWUtvODFieE5DSzIxSDZuaERDcmltTXI3ZjUvWkxjaUpMQk1RTHpPT2ZiCmV6ZDZLMGxGbkl1L2N5bUJYYzVJQlFhOU82bTU4N2ZQdEdCRmpoam1QNWJuNDNEYSs0ekJ0aEVKTHBVQ3RiVjgKVlRIK2dPUW56T21hcHp1RXR5eU1ueUowcmpOdmFkUGdrbnNVS1o5b3crZHgxWVlmOVJYSTl3eCs3S2Y0bXk3TQplODkrUWkyNDZXbUJ1RVlPanBGcWV2ajhrQUVXMDhtK1JPVVk5SXllSllETS8raTJ6Vi9lOHhHN2UrT2tHTXl0CnNXaUVBMndrZ1JQRlFMVWs0OU9OZGkzQWp3QTJXOEdockJtclBGb1FZMVp2amtrOTZuSzJlMjMrZUJGSTJBQ0UKdjJ6VkdkNVpBb0dCQVBhc2x1ZnREbGpTVUdNb2FWTy9rbWdtcjFiV0FENy80c2NXU1lMWENlNDRpRlVNTHIzbgowM0hXK1Bma0lPdndTSCtsRVVnb1dqUkdsWjIzdXB5VVhFRXZrZHhyTlJIOFhQRndZclVmVWgxT0p5SXlFcnFPCjE2YjNVKzhuejN0YVlTQmJqd2Y0N1praDl1L2FQTzBCTUx0ZDJrVHZpRFhsMmdRdmFhejlGakoxQW9HQkFNN0EKWEc2cDBrbVUxM1hoOGZ2dVI3bkNXaUpmOWNkYnZ5c25RVk5RdjcwamZqS01zRjhNZkJocmUxUi9lY0ZIS0RBbQpVN1d6d3ZTQXlraEw1SmoxY1MydzYyK3JaV0NRcml6UnpTeWIyYy9IRCtlV1NjazlOSm1TMEtRa29qYU9rWEMyCmFKYTdYeWdnNkpTK3l5QlQyYUtLMWRHeVNvbzJvemtqM0Q3bmJUaFBBb0dBTE04alJwUXdkQUFZYkRyT0QxR1EKaGV6cEV3d2kxVTdrWWlmeFNKeEppSVdxZGxDVk9SZ2d0K0JHTDdtNEpVUHIxNHdqdklqZ0Fma0VlcmNDWmlrcApMUW80SStNeHE4ZTlGbnJFNDRRQ0JhTEp4eE56aFlJbk9JUmJNZWw0Ymo3M3Y4b0NESCt5b1l1aThPVWpCaWFlCk5Kc1M2RXplNEhPVmpBY1Uya0RMUkhVQ2dZQm1CSUVYa2ZCVG9vQVdpT0R3b1FqL1hpay9vUDRUMnUrZmlZVXcKYVQzVFJEbzNFempNRGNzRitiTW5aS2RkZVpFWkFUQjVEalI2bFRvN0prZXNPaUFZblozdXdqSUp6aHBEdjFwdwpVbzdOZWJvZFdna2FwWHJZOUpyREE5aU85eFpJK1pqdUY1TENxRXBiYXpHcngvUXh3alB6ZnZoTTd0em5pd3hZCmRiVnMvUUtCZ1FDbmZrZ2MrWUMwZktEUmk3TjJ6Q2xLL3ZHRzlMdTRQV3QxWVJZQUlEbU9GZTN2b01aUVpSQ3oKUGlFdmNQeFVEVC94bUR6dXo5aER1YmVJN1lGYUkyZ0JCUUhILzFJVWhkVlh6WlNYRXIzOEJobTk4RHBYT2UwdgplR0tPUko0dEV5d2hkcUNqSzBqYmxFMmNkK1JaVmZpY09SNXNIZ0ZPNFpzQ2J6UEpxWmMydFE9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6Il82SWdMUWRGbnlHeGEtQnpReDVvUE9PWW9yWXY4cmg0NWdsT2ZiNTZiY0UifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJ4aW5uIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6Inhpbm4tdXNlcjIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoieGlubi11c2VyMiIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6ImJkM2M2OTY3LTU2ZDAtNGMxOC05Mzg2LTgzZjI0OTIxMTVhMCIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDp4aW5uOnhpbm4tdXNlcjIifQ.A5c7l704dYJ10ftkqSEYjhPyO5AX7b-qKFVbAO4bk3xp2z6idfNo8suvZ9JiNhXzmMhIAa99aURbuUPeSZFHuIWBgUiU4lEAGlIfZJdgGbQan0qCxSfJpr9wKfPU3dgKo7PRnXhRyDtBwAFjrarlJu3CmnpJ_Ntz489s_ZIz1yJ4lTmcjqT9zElMj0Hxczm9zqxrt0BWYjQQIm4UgLOjEf2CkvJ-Ln8ucmRZLdZ4Hrvc9h5Sy1GvDIYJUKVCl4y_dnxD26wePmoJdn-WCA-GEYHE-BHsAeN_YdHDi1056NsUk05HZJ2EQNY57_IQctpffUxaQfKK-WRayyHiv1UE2g
```

 

#### 4.6.9 登录测试

经测试更改绑定权限是实时生效的

```bash
root@k8s-made-01-32:~# kubectl get pods --kubeconfig=xinn-user2.kubeconfig
NAME                                    READY   STATUS    RESTARTS   AGE
xinn-web1-deployment-6b696577df-j7gbf   1/1     Running   0          31d
xinn-web1-deployment-6b696577df-ttwg8   1/1     Running   0          31d
xinn-web1-deployment-6b696577df-whmq8   1/1     Running   0          31d
```



**dashboard 登录测试**

![image-20240105102007044](http://img.xinn.cc/image-20240105102007044.png)







```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURtakNDQW9LZ0F3SUJBZ0lVTnhMZWE2QTZvVC9HL0dnR24rZ01uRDJjR2VBd0RRWUpLb1pJaHZjTkFRRUwKQlFBd1pERUxNQWtHQTFVRUJoTUNRMDR4RVRBUEJnTlZCQWdUQ0VoaGJtZGFhRzkxTVFzd0NRWURWUVFIRXdKWQpVekVNTUFvR0ExVUVDaE1EYXpoek1ROHdEUVlEVlFRTEV3WlRlWE4wWlcweEZqQVVCZ05WQkFNVERXdDFZbVZ5CmJtVjBaWE10WTJFd0lCY05Nak13TmpFME1EazBPVEF3V2hnUE1qRXlNekExTWpFd09UUTVNREJhTUdReEN6QUoKQmdOVkJBWVRBa05PTVJFd0R3WURWUVFJRXdoSVlXNW5XbWh2ZFRFTE1Ba0dBMVVFQnhNQ1dGTXhEREFLQmdOVgpCQW9UQTJzNGN6RVBNQTBHQTFVRUN4TUdVM2x6ZEdWdE1SWXdGQVlEVlFRREV3MXJkV0psY201bGRHVnpMV05oCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBckNRN2VwV2RqTCtEMXNVY0FacXgKdjcrRGxIZm5aOFlNTmRXN25VNFk2ZHUyN2RUV3FpVFVjTllCK1RLR3RzRmJuODRkbEFtR04wZHpwcTZtNXlrdgppZWowS29SbjJMWDZmZHArNWRacXFKd1dMK0FsQXBycmY1cjYvNlRBaGNabGwvK1NaMnp3OFRldFVZY1ZFdzdzCit6ZDErelV6TkpMV25WdTByUitFeHNyTzNvdy85T0diTkdRaWk5d1RBRFR6MzlDQ09DQzdUZytIUVowQ3g2NGwKUE5IMjVKSmNYbjYxeXBUa0FwWXRiRUR2V29XWC9yYVJTcmZhclZObU1laFdKb2dSd2VsV1gydlM0cnAwVGdHWApyRGt3NHdNTUl0VmI1WmZoT3paTDV4QVRxZDlUcmRxWUVmZkRDSlNZam91c3VPL3FZSlZad1dTaXBxdXQ5V2c3CmVRSURBUUFCbzBJd1FEQU9CZ05WSFE4QkFmOEVCQU1DQVFZd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlYKSFE0RUZnUVVsbGxrNnl4SEdhTUpMOWtHUHJpV3JDdlY3bGd3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUc0UApIck5TOFpiRmQxTFZnMm5XT1RoTTVrUnZKSkdKZzUwcGlkTm9meTNMWVllVlUxMzZUeDBDZWxiaEZpS2l1SDhOCk9LVFI5cHRVYytXUDlaUlJUQkc0dkxCa3JxSlp3aXUxNUJXVThBT01Pcnhwd05xZlN1OVZFREtaMFRtUVVsWkEKVGxRdEczYk1sVFNpUkNZZXk0NjFQYVlpOE0vNUF1QjJqUDg2N09oUUhTaFdxN3RQUnJXSGFQZE1tekpKODBzUgpTRDNrRlYyUm5aemN5bGEzTFU1cWZaQUhTb20vL0tMb21oK0VlR2N4YWRVRlVwRUl4cDFVN3Z4YnRtRzByT2pKCitjNlJiWExZc2ZWRVNDOVEyUk10MTBUWCtYK1kwSGxzWHdlV0RiNXZOLzIwTlorTGtJR3E4cmNELytBZHhQd0YKcVI4R1hNSUY5TFhpdXk4ZWNjRT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    server: https://10.1.0.32:6443
  name: xxcs
contexts:
- context:
    cluster: xxcs
    namespace: xinn
    user: xinn-user2
  name: xinn-prod
current-context: xinn-prod
kind: Config
preferences: {}
users:
- name: xinn-user2
  user:
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6Il82SWdMUWRGbnlHeGEtQnpReDVvUE9PWW9yWXY4cmg0NWdsT2ZiNTZiY0UifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJ4aW5uIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6Inhpbm4tdXNlcjIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoieGlubi11c2VyMiIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6ImJkM2M2OTY3LTU2ZDAtNGMxOC05Mzg2LTgzZjI0OTIxMTVhMCIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDp4aW5uOnhpbm4tdXNlcjIifQ.A5c7l704dYJ10ftkqSEYjhPyO5AX7b-qKFVbAO4bk3xp2z6idfNo8suvZ9JiNhXzmMhIAa99aURbuUPeSZFHuIWBgUiU4lEAGlIfZJdgGbQan0qCxSfJpr9wKfPU3dgKo7PRnXhRyDtBwAFjrarlJu3CmnpJ_Ntz489s_ZIz1yJ4lTmcjqT9zElMj0Hxczm9zqxrt0BWYjQQIm4UgLOjEf2CkvJ-Ln8ucmRZLdZ4Hrvc9h5Sy1GvDIYJUKVCl4y_dnxD26wePmoJdn-WCA-GEYHE-BHsAeN_YdHDi1056NsUk05HZJ2EQNY57_IQctpffUxaQfKK-WRayyHiv1UE2g
```



```yaml
apiVersion: v1：指定了使用的 Kubernetes API 版本。

kind: Config：定义了这是一个配置文件。

current-context: xinn-prod：指定当前使用的上下文为 xinn-prod。上下文包含了一组集群、命名空间和用户的组合，指定了在使用 Kubernetes 命令时所操作的环境。

preferences: {}：偏好设置为空，通常用于配置客户端行为，但在这个配置文件中未定义。

clusters:：定义了集群信息，包括服务器地址和 CA 证书数据等。在你的配置文件中，只有一个集群信息：

name: xxcs：指定集群名称为 xxcs。
cluster: 下包含了集群的详细信息：
certificate-authority-data：该字段包含了 CA 证书的 Base64 编码数据，用于验证连接到 Kubernetes 集群的安全性。
server：指定了 Kubernetes API 服务器的地址。
contexts:：定义了上下文信息，包括集群、命名空间和用户的组合。在你的配置文件中有一个上下文：

name: xinn-prod：指定上下文名称为 xinn-prod。
context: 下包含了该上下文的详细信息：
cluster: xxcs：指定该上下文所使用的集群名称为 xxcs。
namespace: xinn：指定了命名空间为 xinn。
user: xinn-user2：指定了该上下文使用的用户为 xinn-user2。
users:：定义了用户信息，通常包含访问集群所需的凭据。在你的配置文件中有一个用户：

name: xinn-prod：指定用户名称为 xinn-prod。
user: 下包含了用户的详细信息，特别是认证信息：
token：这是一个用于认证的 token，它以 Base64 编码形式表示，用于验证用户的身份并授权其访问 Kubernetes 集群。
```

