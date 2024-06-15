---
author: Ryan
title: Cert-manager + ZeroSSL 的一些配置的研究
date: 2023-02-25
tags: [cert-manager]
---





# Cert-manager + ZeroSSL 的一些配置的研究



## 安装cert-manager 



```sh
helm install \
  cert-manager ./cert-manager-v1.8.2.tgz \
  --namespace cert-manager \
  --create-namespace 
```

```bash
root@k8s-master01:/helm/cert-manager# helm upgrade   cert-manager ./cert-manager-v1.8.2.tgz   --namespace cert-manager   --create-namespace
Release "cert-manager" has been upgraded. Happy Helming!
NAME: cert-manager
LAST DEPLOYED: Fri Oct 13 15:30:56 2023
NAMESPACE: cert-manager
STATUS: deployed
REVISION: 2
TEST SUITE: None
NOTES:
cert-manager v1.8.2 has been deployed successfully!

In order to begin issuing certificates, you will need to set up a ClusterIssuer
or Issuer resource (for example, by creating a 'letsencrypt-staging' issuer).

More information on the different types of issuers and how to configure them
can be found in our documentation:

https://cert-manager.io/docs/configuration/

For information on how to configure cert-manager to automatically provision
Certificates for Ingress resources, take a look at the `ingress-shim`
documentation:

https://cert-manager.io/docs/usage/ingress/

```



## **Values File**

```yaml
ingressShim:
  defaultIssuerName: "zerossl-production"
  defaultIssuerKind: "ClusterIssuer"

installCRDs: true
```







```bash
root@k8s-master01:/helm/cert-manager# helm upgrade   cert-manager ./cert-manager-v1.8.2.tgz   --namespace cert-manager   --create-namespace -f values.yaml
Release "cert-manager" has been upgraded. Happy Helming!
NAME: cert-manager
LAST DEPLOYED: Fri Oct 13 15:32:30 2023
NAMESPACE: cert-manager
STATUS: deployed
REVISION: 3
TEST SUITE: None
NOTES:
cert-manager v1.8.2 has been deployed successfully!

In order to begin issuing certificates, you will need to set up a ClusterIssuer
or Issuer resource (for example, by creating a 'letsencrypt-staging' issuer).

More information on the different types of issuers and how to configure them
can be found in our documentation:

https://cert-manager.io/docs/configuration/

For information on how to configure cert-manager to automatically provision
Certificates for Ingress resources, take a look at the `ingress-shim`
documentation:

https://cert-manager.io/docs/usage/ingress/
```





## **EAB Credentials**

https://app.zerossl.com/developer

![image-20231013164014201](C:\Users\xx9z\AppData\Roaming\Typora\typora-user-images\image-20231013164014201.png)

![image-20231013164120388](C:\Users\xx9z\AppData\Roaming\Typora\typora-user-images\image-20231013164120388.png)



```bash
echo -n "sbp1S7OUASDD12Kci8233vITEWlw7_cCI23XWo3ngD-L8z94gvSDStYLMICXhYjp-CZXC4DDNFLwaz8iTVI0g" | base64 -w 0
```

```sh
kubectl apply -f zero-ssl-eabsecret.yaml -n cert-manager
```





## Cluster issuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: zerossl-production
spec:
  acme:
    # ZeroSSL ACME server
    server: https://acme.zerossl.com/v2/DV90
    email: xx9z@outlook.com

    # name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: zerossl-prod

    # for each cert-manager new EAB credencials are required
    externalAccountBinding:
      keyID: Bkxv--iXeFgLY61uePdMQg
      keySecretRef:
        name: zero-ssl-eabsecret
        key: secret
      keyAlgorithm: HS256

    # ACME DNS-01 provider configurations to verify domain
    solvers:
    - selector: {}
      dns01:
        route53:
          region: us-west-2
          # optional if ambient credentials are available; see ambient credentials documentation
          # see Route53 for >0 issue "letsencrypt.org" and change to >0 issue "sectigo.com"
          accessKeyID: ACCESS_KEY_ID
          secretAccessKeySecretRef:
            name: route53-credentials-secret
            key: secret-access-key
```

![image-20231013163154472](C:\Users\xx9z\AppData\Roaming\Typora\typora-user-images\image-20231013163154472.png)cs

https://www.bsmithio.com/post/cert-manager-zerossl/



![image-20231013163120566](C:\Users\xx9z\AppData\Roaming\Typora\typora-user-images\image-20231013163120566.png)

