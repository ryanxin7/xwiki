---
author: Ryan
title: 17.Harbor自签证书
date: 2023-02-22
---




## 1、安装docker 

harbor依赖于docker 和docker-compose

## 2、安装docker-compose


```bash
wget  https://github.com/docker/compose/releases/download/v2.17.3/docker-compose-linux-x86_64
[root@harbor ~]# cp docker-compose-linux-x86_64 /usr/local/bin/docker-compose
[root@harbor ~]# chmod +x /usr/local/bin/docker-compose
```


## 3、安装harbor

[https://github.com/goharbor/harbor/releases](https://github.com/goharbor/harbor/releases)

```bash
解压harbor

tar -xvf harbor-offline-installer-v2.6.1.tgz -C /apps/harbor
```




## 4、自签证书
[https://goharbor.io/docs/2.4.0/install-config/configure-https/](https://goharbor.io/docs/2.4.0/install-config/configure-https/)


如果使用containerd部署容器使用harbor则需要参考官网说明，与传统docker部署的Harbor自签发 SSL证书不同需要使用SAN包含多域名签发对象：


### 4.1 生成证书颁发机构证书
**创建证书保存目录**
```bash
$ mkdir -p /apps/harbor/certs && cd /apps/harbor/certs
```

**生成CA证书私钥**
```bash
openssl genrsa -out ca.key 4096
```

**基于CA证书私钥生成CA证书**
```bash
openssl req -x509 -new -nodes -sha512 -days 3650 \
-subj "/C=CN/ST=Beijing/L=Beijing/O=ceamg/OU=it/CN=harbor.ceamg.com" \
-key ca.key \
-out ca.crt
```

```bash
C，Country，代表国家
ST，STate，代表省份
L，Location，代表城市
O，Organization，代表组织，公司
OU，Organization Unit，代表部门
CN，Common Name，代表服务器域名
emailAddress，代表联系人邮箱地址。
```


### 4.2 生成服务证书

**创建证书私钥**
```bash
openssl genrsa -out harbor.ceamg.com.key 4096
```

**基于服务证书私钥生成证书签名请求CSR**
```bash
openssl req -sha512 -new \
-subj "/C=CN/ST=Hanan/L=Zhengzhou/O=cib/OU=it/CN=harbor.ceamg.com" \
-key harbor.ceamg.com.key \
-out harbor.ceamg.com.csr
```

**生成x509 v3扩展文件**
```bash
cat > v3.ext <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1=harbor.ceamg.com
DNS.2=harbor.ceamg
DNS.3=harbor01
EOF
```

**使用v3文件为harbor签发证书**
```bash
openssl x509 -req -sha512 -days 3650 \
-extfile v3.ext \
-CA ca.crt -CAkey ca.key -CAcreateserial \
-in harbor.ceamg.com.csr \
-out harbor.ceamg.com.crt
```



## 5、配置证书

### 5.1 修改harbor配置文件
修改域名和https SSL签发的私钥和证书路径
```yaml
# Configuration file of Harbor

# The IP address or hostname to access admin UI and registry service.
# DO NOT use localhost or 127.0.0.1, because Harbor needs to be accessed by external clients.
hostname: harbor.ceamg.com

# http related config
http:
  # port for http, default is 80. If https enabled, this port will redirect to https port
  port: 80

# https related config
https:
  # https port for harbor, default is 443
  port: 443
  # The path of cert and key files for nginx
  certificate: /data/cert/harbor.ceamg.com.crt
  private_key: /data/cert/harbor.ceamg.com.key
```


### 5.2 根据新配置重新生成各类资源和配置
```bash
./prepare --with-notary --with-trivy --with-chartmuseum
```



### 5.3 启动服务
```bash
docker-compose up -d
```


### 5.4 查看证书
![image.png](https://cdn.nlark.com/yuque/0/2023/png/33538388/1686217694997-cd503b47-c58e-46c6-abe4-34716128e710.png#averageHue=%23fefefe&clientId=u5fdbaac9-ac3b-4&from=paste&height=709&id=u38ffd803&originHeight=709&originWidth=809&originalType=binary&ratio=1&rotation=0&showTitle=false&size=31867&status=done&style=none&taskId=u0e8ece9e-36a6-4223-b3e1-3a4c5874ad1&title=&width=809)




### 六、配置containerd使用证书访问harbor


### 6.1 HOSTS方式对接
直接在`config.toml`中配置相关的证书参数对于Containerd默认使用的ctr是不生效的因为ctr不使用CRI；


因此它不读取配置中`[plugins."io.containerd.grpc.v1.cri]`配置的认证内容

我们可以使用Containerd支持的hosts方式去进行配置，可以实现ctr和nerdctl去对接Harbor

创建hosts.toml文件或者证书文件存储的目录，注意这个创建的目录名称**必须是Harbor的域名**(如果不是则报x509)；然后将证书文件或者`hosts.toml`文件放入该目录下才会生效。

**containerd节点创建证书存储目录**
```bash
mkdir -p /etc/containerd/certs.d/harbor.ceamg.com/
```

**创建**`**hosts.toml**`**文件**

```bash
[host."https://harbor.ceamg.com"]
  capabilities = ["pull", "resolve","push"]
  ca = ["harbor.ceamg.com.crt"]
```

**将harbor服务证书发送到containerd节点**

```bash
#!/bin/bash
#目标主机列表
IP="
10.1.0.32
10.1.0.33
"

for node in ${IP};do
  sshpass -p ceamg.com ssh-copy-id ${node} -o StrictHostKeyChecking=no
  if [ $? -eq 0 ];then
   echo "${node} 秘钥copy完成"
   echo "${node} 秘钥copy完成,准备环境初始化....."
   ssh ${node} "mkdir /etc/containerd/certs.d/harbor.ceamg.com -p"
   echo "Harbor 证书创建成功!"
   scp /etc/containerd/certs.d/harbor.ceamg.com/harbor.ceamg.com.crt  ${node}:/etc/containerd/certs.d/harbor.ceamg.com/
  echo "Harbor 证书拷贝成功!"
  ssh ${node} "echo "10.1.0.38 harbor.ceamg.com" >> /etc/hosts"
  echo "host 解析添加完成"
#scp -r /root/.docker ${node}:/root/
#echo "Harbor 认证件拷完成!"
else
echo "${node} 秘钥copy失败"
fi
done
```


```bash
scp /apps/harbor/certs/harbor.ceamg.com.crt k8s-master-01:/etc/containerd/certs.d/harbor.ceamg.com/
```





