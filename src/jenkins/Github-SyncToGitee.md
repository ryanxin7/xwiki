---
author: Ryan
title: Github Actions 自动同步到 Gitee
date: 2023-06-12
lastmod: 2023-08-18
tags: 
    - CI/CD
    - 持续集成
category: 
   - Github
   - Gitee
expirationReminder:
  enable: true
---







## 1. 开通 Github Aciton 

上传代码一般已Github仓库为主，但Jenkins由于网络原因经常无法拉取Github上的代码，于是考虑将Github仓库自动同步到Gitee上，拉取国内仓库代码进行自动部署。



### 1.1 在Github仓库下开通Actions的功能

点击Actions选项卡→ 点击右下角Create a new workflow，命名为**SyncToGitee.yml**即可



### 1.2 编写workflow的yml代码

可以复制如下代码到自己yml中，需要更改的地方，在代码中已经标出。

```yaml
name: SyncToGitee
on:
  push:
    branches:
      - main
jobs:
  repo-sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source codes
        uses: actions/checkout@v3

      - name: Mirror the Github organization repos to Gitee.
        uses: Yikun/hub-mirror-action@master
        with:
          src: 'github/ryanxin7'    					# 这里改为自己github账号名称，如github/ryanxin7
          dst: 'gitee/ryanxin'     						# 这里改为gitee上账号名称，如gitee/ryanxin
          dst_key: ${{ secrets.GITEE_PRIVATE_KEY }}  	# 这是本地生成的私钥，Github拿着私钥调用Gitee公钥
          dst_token:  ${{ secrets.GITEE_TOKEN }}     	# 这是gitee上生成的token，下面会讲
          force_update: true
          static_list: "xxlog"   					# 同步的仓库名称，这里为xxlog，意思是会自动同步该仓库到gitee下同名仓库
          debug: true
```





## 2.配置公钥私钥和Gitee Token   

### 2.1 配置Gitee私钥

配置公钥和私钥：公钥是Gitee这里拿着，私钥是Github拿着。因为是Github这里要同步到Gitee.     

生成私钥和公钥：`ssh-kengen -t ed25529 -C xxxx@xxx.com `，具体可参见：[生成/添加SSH公钥](https://gitee.com/help/articles/4181#article-header0)



生成完之后，会在指定目录下有两个文件：`id_ed25519`和`id_ed25519.public`，前者是私钥，后者是公钥

将`id_ed25519`用记事本打开，复制里面内容，粘贴到Github个人仓库下的secret中。

步骤：点击仓库首页选项卡setting，会看到如下图，点击新建**New repository secret**：



![](https://cdn1.ryanxin.live/image-20230518172856867.png)



输入Name为**GITEE_PRIVATE_KEY**, Value为复制`id_ed25519`的私钥内容

![](https://cdn1.ryanxin.live/image-20230518173101453.png)



### 2.2 配置Gitee 公钥

![](https://cdn1.ryanxin.live/image-20230518173908815.png)





输入标题为**GITEE_PUB_KEY**, Value为复制`id_ed25519.pub`的私钥内容



### 2.3 配置私人令牌

打开Gitee个人账号的设置页面 → 点击**安全设置**下的**私人令牌** → 右上角**生成新令牌**，如下图所示：

需要添加以下权限：

![](https://cdn1.ryanxin.live/image-20230518174125709.png)



点击提交之后，会得到类似下图所示的私人令牌，将其复制，并配置到Github的secret界面，类似上一步的私钥那样。



![](https://cdn1.ryanxin.live/image-20230518174340775.png)



配置到Github的secret界面

![](https://cdn1.ryanxin.live/image-20230518174429321.png)



最终Github这里配置的Actions secrets如下：

![](https://cdn1.ryanxin.live/image-20230518174527545.png)



### 3.查看同步状态

成功同步

![](https://cdn1.ryanxin.live/image-20230518174631708.png)
