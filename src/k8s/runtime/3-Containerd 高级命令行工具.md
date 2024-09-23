---
author: Ryan
title: Containerd 高级命令行工具
date: 2024-04-12T10:54:32       
---

# Containerd 高级命令行工具

前面我们介绍了可以使用 ctr 操作管理 containerd 镜像容器，但是大家都习惯了使用 docker cli，ctr 使用起来可能还是不太顺手，为了能够让大家更好的转到 containerd 上面来，社区提供了一个新的命令行工具：[nerdctl](https://github.com/containerd/nerdctl)。

nerdctl 是一个与 docker cli 风格兼容的 containerd 客户端工具，而且直接兼容 docker compose 的语法的，这就大大提高了直接将 containerd 作为本地开发、测试或者单机容器部署使用的效率。
##  安装 nerdctl
同样直接在 GitHub Release 页面下载对应的压缩包解压到 PATH 路径下即可：

```bash
# 如果没有安装 containerd，则可以下载 nerdctl-full-<VERSION>-linux-amd64.tar.gz 包进行安装
$  wget https://github.com/containerd/nerdctl/releases/download/v0.12.1/nerdctl-0.12.1-linux-amd64.tar.gz
# 如果有限制，也可以替换成下面的 URL 加速下载
# wget https://download.fastgit.org/containerd/nerdctl/releases/download/v0.12.1/nerdctl-0.12.1-linux-amd64.tar.gz
$  mkdir -p /usr/local/containerd/bin/ && tar -zxvf nerdctl-0.12.1-linux-amd64.tar.gz nerdctl && mv nerdctl /usr/local/containerd/bin/
$  ln -s /usr/local/containerd/bin/nerdctl /usr/local/bin/nerdctl
$  nerdctl version
Client:
 Version:       v0.12.1
 Git commit:    c802f934791f83dacf20a041cd1c865f8fac954e

Server:
 containerd:
  Version:      v1.5.5
  Revision:     72cec4be58a9eb6b2910f5d10f1c01ca47d231c0
```
安装完成后接下来学习下 nerdctl 命令行工具的使用。
## nerdctl 命令
### nerdctl Run 运行容器
`nerdctl run` 和 `docker run` 类似可以使用 `nerdctl run` 命令运行容器，例如：

```bash
$  nerdctl run -d -p 80:80 --name=nginx --restart=always nginx:alpine
docker.io/library/nginx:alpine:                                                   resolved       |++++++++++++++++++++++++++++++++++++++|
index-sha256:bead42240255ae1485653a956ef41c9e458eb077fcb6dc664cbc3aa9701a05ce:    done           |++++++++++++++++++++++++++++++++++++++| manifest-sha256:ce6ca11a3fa7e0e6b44813901e3289212fc2f327ee8b1366176666e8fb470f24: done           |++++++++++++++++++++++++++++++++++++++| config-sha256:7ce0143dee376bfd2937b499a46fb110bda3c629c195b84b1cf6e19be1a9e23b:   done           |++++++++++++++++++++++++++++++++++++++| elapsed: 5.3 s                                                                    total:  3.1 Ki (606.0 B/s)                                       6e489777d2f73dda8a310cdf8da9df38353c1aa2021d3c2270b30eff1806bcf8
```
可选的参数使用和 `docker run` 基本一直，比如 `-i`、`-t`、`--cpus`、`--memory `等选项，可以使用 `nerdctl run --help` 获取可使用的命令选项：

```bash
$  nerdctl run --help
NAME:
   nerdctl run - Run a command in a new container

USAGE:
   nerdctl run [command options] [arguments...]

OPTIONS:
   --help                        show help (default: false)
   --tty, -t                     (Currently -t needs to correspond to -i) (default: false)
   --interactive, -i             Keep STDIN open even if not attached (default: false)
   --detach, -d                  Run container in background and print container ID (default: false)
   --restart value               Restart policy to apply when a container exits (implemented values: "no"|"always") (default: "no")
   --rm                          Automatically remove the container when it exits (default: false)
   --pull value                  Pull image before running ("always"|"missing"|"never") (default: "missing")
   --network value, --net value  Connect a container to a network ("bridge"|"host"|"none") (default: "bridge")
   --dns value                   Set custom DNS servers (default: "8.8.8.8", "1.1.1.1")
   --publish value, -p value     Publish a container's port(s) to the host
   --hostname value, -h value    Container host name
   --cpus value                  Number of CPUs (default: 0)
   --memory value, -m value      Memory limit
   --pid value                   PID namespace to use
   --pids-limit value            Tune container pids limit (set -1 for unlimited) (default: -1)
   --cgroupns value              Cgroup namespace to use, the default depends on the cgroup version ("host"|"private") (default: "host")
   --cpuset-cpus value           CPUs in which to allow execution (0-3, 0,1)
   --cpu-shares value            CPU shares (relative weight) (default: 0)
   --device value                Add a host device to the container
   --user value, -u value        Username or UID (format: <name|uid>[:<group|gid>])
   --security-opt value          Security options
   --cap-add value               Add Linux capabilities
   --cap-drop value              Drop Linux capabilities
   --privileged                  Give extended privileges to this container (default: false)
   --runtime value               Runtime to use for this container, e.g. "crun", or "io.containerd.runsc.v1" (default: "io.containerd.runc.v2")
   --sysctl value                Sysctl options
   --gpus value                  GPU devices to add to the container ('all' to pass all GPUs)
   --volume value, -v value      Bind mount a volume
   --read-only                   Mount the container's root filesystem as read only (default: false)
   --rootfs                      The first argument is not an image but the rootfs to the exploded container (default: false)
   --entrypoint value            Overwrite the default ENTRYPOINT of the image
   --workdir value, -w value     Working directory inside the container
   --env value, -e value         Set environment variables
   --env-file value              Set environment variables from file
   --name value                  Assign a name to the container
   --label value, -l value       Set meta data on a container
   --label-file value            Read in a line delimited file of labels
   --cidfile value               Write the container ID to the file
   --shm-size value              Size of /dev/shm
```
### nerdctl exec 执行容器
同样也可以使用 exec 命令执行容器相关命令，例如：
```bash
$  nerdctl exec -it nginx /bin/sh
/ # date
Thu Aug 19 06:43:19 UTC 2021
/ #
```
### 容器管理
#### nerdctl ps 列出容器
使用 `nerdctl ps` 命令可以列出所有容器。
```bash
$  nerdctl ps
CONTAINER ID    IMAGE                             COMMAND                   CREATED           STATUS    PORTS                 NAMES
6e489777d2f7    docker.io/library/nginx:alpine    "/docker-entrypoint.…"    10 minutes ago    Up        0.0.0.0:80->80/tcp    nginx
```
同样可以使用` -a` 选项显示所有的容器列表，默认只显示正在运行的容器，不过需要注意的是 nerdctl ps 命令并没有实现 docker ps 下面的 `--filter`、`--format`、`--last`、`--size` 等选项。

#### nerdctl inspect 获取容器的详细信息
```bash
$  nerdctl inspect nginx
[
    {
        "Id": "6e489777d2f73dda8a310cdf8da9df38353c1aa2021d3c2270b30eff1806bcf8",
        "Created": "2021-08-19T06:35:46.403464674Z",
        "Path": "/docker-entrypoint.sh",
        "Args": [
            "nginx",
            "-g",
            "daemon off;"
        ],
        "State": {
            "Status": "running",
            "Running": true,
            "Paused": false,
            "Pid": 2002,
            "ExitCode": 0,
            "FinishedAt": "0001-01-01T00:00:00Z"
        },
        "Image": "docker.io/library/nginx:alpine",
        "ResolvConfPath": "/var/lib/nerdctl/1935db59/containers/default/6e489777d2f73dda8a310cdf8da9df38353c1aa2021d3c2270b30eff1806bcf8/resolv.conf",
        "LogPath": "/var/lib/nerdctl/1935db59/containers/default/6e489777d2f73dda8a310cdf8da9df38353c1aa2021d3c2270b30eff1806bcf8/6e489777d2f73dda8a310cdf8da9df38353c1aa2021d3c2270b30eff1806bcf8-json.log",
        "Name": "nginx",
        "Driver": "overlayfs",
        "Platform": "linux",
        "AppArmorProfile": "nerdctl-default",
        "NetworkSettings": {
            "Ports": {
                "80/tcp": [
                    {
                        "HostIp": "0.0.0.0",
                        "HostPort": "80"
                    }
                ]
            },
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "IPAddress": "10.4.0.3",
            "IPPrefixLen": 24,
            "MacAddress": "f2:b1:8e:a2:fe:18",
            "Networks": {
                "unknown-eth0": {
                    "IPAddress": "10.4.0.3",
                    "IPPrefixLen": 24,
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "MacAddress": "f2:b1:8e:a2:fe:18"
                }
            }
        }
    }
]
```
可以看到显示结果和 `docker inspect `也基本一致的。

#### nerdctl logs 获取容器日志
查看容器日志是我们平时经常会使用到的一个功能，同样我们可以使用 `nerdctl logs` 来获取日志数据：
```bash
$  nerdctl logs -f nginx
......
2021/08/19 06:35:46 [notice] 1#1: start worker processes
2021/08/19 06:35:46 [notice] 1#1: start worker process 32
2021/08/19 06:35:46 [notice] 1#1: start worker process 33
```
同样支持 `-f`、`-t`、`-n`、`--since`、`--until` 这些选项。

#### nerdctl stop 停止容器
```bash
$  nerdctl stop nginx
nginx
$  nerdctl ps
CONTAINER ID    IMAGE    COMMAND    CREATED    STATUS    PORTS    NAMES
$  nerdctl ps -a
CONTAINER ID    IMAGE                             COMMAND                   CREATED           STATUS    PORTS                 NAMES
6e489777d2f7    docker.io/library/nginx:alpine    "/docker-entrypoint.…"    20 minutes ago    Up        0.0.0.0:80->80/tcp    nginx
```

#### nerdctl rm 删除容器

```bash
$  nerdctl rm nginx
You cannot remove a running container f4ac170235595f28bf962bad68aa81b20fc83b741751e7f3355bd77d8016462d. Stop the container before attempting removal or force remove
$  nerdctl rm -f ginx
nginx
$  nerdctl ps
CONTAINER ID    IMAGE    COMMAND    CREATED    STATUS    PORTS    NAMES
```
要强制删除同样可以使用 `-f` 或 `--force `选项来操作。
### 镜像管理

#### nerdctl images 镜像列表

```bash
$  nerdctl images
REPOSITORY    TAG       IMAGE ID        CREATED           SIZE
alpine        latest    eb3e4e175ba6    6 days ago        5.9 MiB
nginx         alpine    bead42240255    29 minutes ago    16.0 KiB
```
也需要注意的是没有实现 `docker images` 的一些选项，比如 `--all`、`--digests`、`--filter`、`--format`。

#### nerdctl pull 拉取镜像
```bash
$  docker.io/library/busybox:latest:
resolved       |++++++++++++++++++++++++++++++++++++++|
index-sha256:0f354ec1728d9ff32edcd7d1b8bbdfc798277ad36120dc3dc683be44524c8b60:    done           |++++++++++++++++++++++++++++++++++++++| manifest-sha256:dca71257cd2e72840a21f0323234bb2e33fea6d949fa0f21c5102146f583486b: done           |++++++++++++++++++++++++++++++++++++++| config-sha256:69593048aa3acfee0f75f20b77acb549de2472063053f6730c4091b53f2dfb02:   done           |++++++++++++++++++++++++++++++++++++++| layer-sha256:b71f96345d44b237decc0c2d6c2f9ad0d17fde83dad7579608f1f0764d9686f2:    done           |++++++++++++++++++++++++++++++++++++++| elapsed: 5.9 s                                                                    total:  752.8  (127.5 KiB/s)
```

#### nerdctl push 推送镜像
当然在推送镜像之前也可以使用 nerdctl login 命令登录到镜像仓库，然后再执行 push 操作。<br />可以使用 `nerdctl login --username xxx --password xxx `进行登录，使用 `nerdctl logout` 可以注销退出登录。

#### nerdctl tag：镜像标签
使用 tag 命令可以为一个镜像创建一个别名镜像：
```bash
$  nerdctl images
REPOSITORY    TAG                  IMAGE ID        CREATED           SIZE
busybox       latest               0f354ec1728d    6 minutes ago     1.3 MiB
nginx         alpine               bead42240255    41 minutes ago    16.0 KiB
$  nerdctl tag nginx:alpine harbor.k8s.local/course/nginx:alpine
$  nerdctl images
REPOSITORY                       TAG                  IMAGE ID        CREATED           SIZE
busybox                          latest               0f354ec1728d    7 minutes ago     1.3 MiB
nginx                            alpine               bead42240255    41 minutes ago    16.0 KiB
harbor.k8s.local/course/nginx    alpine               bead42240255    2 seconds ago     16.0 KiB
```

#### nerdctl save：导出镜像
使用 save 命令可以导出镜像为一个 tar 压缩包。
```bash
$  nerdctl save -o busybox.tar.gz busybox:latest
$  ls -lh busybox.tar.gz
-rw-r--r-- 1 root root 761K Aug 19 15:19 busybox.tar.gz
```

#### nerdctl rmi：删除镜像

```bash
$  nerdctl rmi busybox
Untagged: docker.io/library/busybox:latest@sha256:0f354ec1728d9ff32edcd7d1b8bbdfc798277ad36120dc3dc683be44524c8b60
Deleted: sha256:5b8c72934dfc08c7d2bd707e93197550f06c0751023dabb3a045b723c5e7b373
```

#### nerdctl load 导入镜像
使用 load 命令可以将上面导出的镜像再次导入：

```bash
$  nerdctl load -i busybox.tar.gz
unpacking docker.io/library/busybox:latest (sha256:0f354ec1728d9ff32edcd7d1b8bbdfc798277ad36120dc3dc683be44524c8b60)...done
```
使用 -i 或 --input 选项指定需要导入的压缩包。
### 镜像构建
镜像构建是平时我们非常重要的一个需求，我们知道 ctr 并没有构建镜像的命令，而现在我们又不使用 Docker 了，那么如何进行镜像构建了，幸运的是 nerdctl 就提供了 `nerdctl build` 这样的镜像构建命令。

#### nerdctl build 从 Dockerfile 构建镜像
比如现在我们定制一个 nginx 镜像，新建一个如下所示的 Dockerfile 文件：
```bash
FROM nginx
RUN echo 'Hello Nerdctl From Containerd' > /usr/share/nginx/html/index.html
```
然后在文件所在目录执行镜像构建命令：

```bash
$  nerdctl build -t nginx:nerdctl -f Dockerfile .
FATA[0000] `buildctl` needs to be installed and `buildkitd` needs to be running, see https://github.com/moby/buildkit: exec: "buildctl": executable file not found in $PATH
```
可以看到有一个错误提示，需要我们安装 buildctl 并运行 buildkitd，这是因为` nerdctl build` 需要依赖` buildkit` 工具。<br />[buildkit](https://github.com/moby/buildkit) 项目也是 Docker 公司开源的一个构建工具包，支持 OCI 标准的镜像构建。它主要包含以下部分:

- 服务端 buildkitd：当前支持 runc 和 containerd 作为 worker，默认是 runc，我们这里使用 containerd
- 客户端 buildctl：负责解析 Dockerfile，并向服务端 buildkitd 发出构建请求

buildkit 是典型的 C/S 架构，客户端和服务端是可以不在一台服务器上，而 nerdctl 在构建镜像的时候也作为 buildkitd 的客户端，所以需要我们安装并运行 buildkitd。<br />所以接下来我们先来安装 buildkit：

```bash
$  wget https://github.com/moby/buildkit/releases/download/v0.9.1/buildkit-v0.9.1.linux-amd64.tar.gz
# 如果有限制，也可以替换成下面的 URL 加速下载
# wget https://download.fastgit.org/moby/buildkit/releases/download/v0.9.1/buildkit-v0.9.1.linux-amd64.tar.gz
$  tar -zxvf buildkit-v0.9.1.linux-amd64.tar.gz -C /usr/local/containerd/
bin/
bin/buildctl
bin/buildkit-qemu-aarch64
bin/buildkit-qemu-arm
bin/buildkit-qemu-i386
bin/buildkit-qemu-mips64
bin/buildkit-qemu-mips64el
bin/buildkit-qemu-ppc64le
bin/buildkit-qemu-riscv64
bin/buildkit-qemu-s390x
bin/buildkit-runc
bin/buildkitd
$  ln -s /usr/local/containerd/bin/buildkitd /usr/local/bin/buildkitd
$  ln -s /usr/local/containerd/bin/buildctl /usr/local/bin/buildctl
```
这里我们使用 Systemd 来管理 buildkitd，创建如下所示的 `systemd unit `文件：

```bash
$  cat /etc/systemd/system/buildkit.service
[Unit]
Description=BuildKit
Documentation=https://github.com/moby/buildkit

[Service]
ExecStart=/usr/local/bin/buildkitd --oci-worker=false --containerd-worker=true

[Install]
WantedBy=multi-user.target
```
然后启动 buildkitd：

```
$  systemctl daemon-reload
$  systemctl enable buildkit --now
Created symlink /etc/systemd/system/multi-user.target.wants/buildkit.service → /etc/systemd/system/buildkit.service.
$  systemctl status buildkit
● buildkit.service - BuildKit
     Loaded: loaded (/etc/systemd/system/buildkit.service; enabled; vendor preset: enabled)
     Memory: 8.6M
     CGroup: /system.slice/buildkit.service
             └─5779 /usr/local/bin/buildkitd --oci-worker=false --containerd-worker=true

Aug 19 16:03:10 ydzsio systemd[1]: Started BuildKit.
Aug 19 16:03:10 ydzsio buildkitd[5779]: time="2021-08-19T16:03:10+08:00" level=warning msg="using host network as the default"
Aug 19 16:03:10 ydzsio buildkitd[5779]: time="2021-08-19T16:03:10+08:00" level=info msg="found worker \"euznuelxhxb689bc5of7pxmbc\", labels>
Aug 19 16:03:10 ydzsio buildkitd[5779]: time="2021-08-19T16:03:10+08:00" level=info msg="found 1 workers, default=\"euznuelxhxb689bc5of7pxm>
Aug 19 16:03:10 ydzsio buildkitd[5779]: time="2021-08-19T16:03:10+08:00" level=warning msg="currently, only the default worker can be used."
Aug 19 16:03:10 ydzsio buildkitd[5779]: time="2021-08-19T16:03:10+08:00" level=info msg="running server on /run/buildkit/buildkitd.sock"
~
```
现在我们再来重新构建镜像：<br />![](http://img.xinn.cc/1712803242889-9f9a259f-0cd4-4f81-96a5-e1a4a26eeeac.png)<br />构建完成后查看镜像是否构建成功：

```bash
$  nerdctl images
WARN[0000] unparsable image name "overlayfs@sha256:d5b9b9e4c930f30340650cb373f62f97c93ee3b92c83f01c6e00b7b87d62c624"
REPOSITORY    TAG        IMAGE ID        CREATED               SIZE
nginx         latest     4d4d96ac750a    4 minutes ago         16.0 KiB
nginx         nerdctl    d5b9b9e4c930    About a minute ago    24.0 KiB
```
我们可以看到已经有我们构建的 `nginx:nerdctl` 镜像了。接下来使用上面我们构建的镜像来启动一个容器进行测试：

```bash
$  nerdctl run -d -p 80:80 --name=nginx --restart=always nginx:nerdctl
f8f639cb667926023231b13584226b2c7b856847e0a25bd5f686b9a6e7e3cacd
$  nerdctl ps
CONTAINER ID    IMAGE                              COMMAND                   CREATED         STATUS    PORTS                 NAMES
f8f639cb6679    docker.io/library/nginx:nerdctl    "/docker-entrypoint.…"    1 second ago    Up        0.0.0.0:80->80/tcp    nginx
$  curl localhost
This is a nerdctl build's nginx image base on containerd
```
这样我们就使用 `nerdctl + buildkitd` 轻松完成了容器镜像的构建。

当然如果你还想在单机环境下使用 Docker Compose，在 containerd 模式下，我们也可以使用 nerdctl 来兼容该功能。<br />同样我们可以使用 `nerdctl compose`、`nerdctl compose up`、`nerdctl compose logs`、`nerdctl compose build`、`nerdctl compose down` 等命令来管理 Compose 服务。<br />这样使用 containerd、nerdctl 结合 buildkit 等工具就完全可以替代 docker 在镜像构建、镜像容器方面的管理功能了。
