---
author: Ryan
title: Harbor 镜像仓库迁移
date: 2024-07-08
image: https://cdn1.ryanxin.live/xwiki/harbor.png
---

## 原因

集团服务器存储卷满了，导致 harbor 出现故障。

迁移思路：
将PostgreSQL数据库由Harbor内置改为独立运行，同步数据库数据到新的PostgreSQL数据库中。
更改Harbor Chart文件，连接外部PostgreSQL，重新安装Chart 包并同步镜像数据。


![b4b81008401e37c7558dfd24cf8472f.png](https://cdn1.ryanxin.live/1720599901704-1969fff5-0717-40f0-90a9-81413f56a3c9.png)



## 问题

harbor-databases 数据库起不来<br />![5d2d12650156cdaf19b89d2d77e53b9.png](https://cdn1.ryanxin.live/1720599579694-590546b4-faa7-465b-b8fb-e05bb9ee3953.png)


## 解决
将 postgreSQL 数据库由 Harbor  K8S 内置改为 docker 单独部署。<br />if external database is used, set "`type`" to "`external`"
```yaml
database:
  # if external database is used, set "type" to "external"
  # and fill the connection informations in "external" section
  type: external
  internal:
    # set the service account to be used, default if left empty
    serviceAccountName: ""
    # mount the service account token
    automountServiceAccountToken: false
    image:
      repository: goharbor/harbor-db
      tag: v2.3.0
    # The initial superuser password for internal database
    password: "changeit"
    # The size limit for Shared memory, pgSQL use it for shared_buffer
    # More details see:
    # https://github.com/goharbor/harbor/issues/15034
    shmSizeLimit: 512Mi
    # resources:
    #  requests:
    #    memory: 256Mi
    #    cpu: 100m
    nodeSelector: {}
    tolerations: []
    affinity: {}
    ## The priority class to run the pod as
    priorityClassName:
    initContainer:
      migrator: {}
      # resources:
      #  requests:
      #    memory: 128Mi
      #    cpu: 100m
      permissions: {}
      # resources:
      #  requests:
      #    memory: 128Mi
      #    cpu: 100m
  external:
    host: "10.1.0.87"
    port: "15432"
    username: "postgres"
    password: "a68367f6ef66c9136c8facb3"
    coreDatabase: "registry"
```
### 测试启动一个postgreSQL 实例
```bash
# 启动 PostgreSQL 容器
docker run --name rmxc-harbor-postgresdb \
  -e POSTGRES_DB=rmxc-harbor-database \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=changeit \
  -p 15432:5432 \
  -v /postgresql-data:/var/lib/postgresql/data \
  -d postgres:13

# 进入 PostgreSQL 容器
docker exec -it rmxc-harbor-postgresdb

# 连接到 PostgreSQL
psql -U rmxc

# 在 PostgreSQL 中创建数据库
CREATE DATABASE registry;
CREATE DATABASE notary_server;
CREATE DATABASE notary_signer;

# 验证数据库创建
\l
```

##  旧Harbro数据导出
harbor 的数据主要分为 postgreSQL 数据库数据和 Registry 镜像数据。<br />那么我们要做的是把数据库的数据导出。

### PostgreSQL 数据库导出
导出PostgreSQL数据库的常用工具有以下几种：

1. **pg_dump**：官方提供的命令行工具，可以导出整个数据库或指定的表。支持多种格式，包括纯文本、压缩、目录和自定义格式。
2. **pg_dumpall**：用于导出所有数据库以及全局对象（如用户和权限），只支持纯文本格式。
3. **psql**：通过SQL语句直接导出数据。可以结合COPY命令将表导出为CSV或其他格式。
4. **pgAdmin**：图形化管理工具，适合不熟悉命令行的用户。提供导出向导，可以选择导出整个数据库或部分表。支持多种格式，包括SQL、CSV等。

我们这里使用**pg_dump**官方提供的命令行工具导出数据

#### 将旧数据库数据导出
```bash
pg_dump -U postgres -h localhost -p 5432 -d postgres -F c -b -v -f /var/lib/postgresql/data/pgdata/pg13/bck/postgres.backup
pg_dump -U postgres -h localhost -p 5432 -d template1 -F c -b -v -f /var/lib/postgresql/data/pgdata/pg13/bck/template1.backup
pg_dump -U postgres -h localhost -p 5432 -d template0 -F c -b -v -f /var/lib/postgresql/data/pgdata/pg13/bck/template0.backup
pg_dump -U postgres -h localhost -p 5432 -d notaryserver -F c -b -v -f /var/lib/postgresql/data/pgdata/pg13/bck/notaryserver.backup
pg_dump -U postgres -h localhost -p 5432 -d notarysigner -F c -b -v -f /var/lib/postgresql/data/pgdata/pg13/bck/notarysigner.backup
pg_dump -U postgres -h localhost -p 5432 -d registry -F c -b -v -f /var/lib/postgresql/data/pgdata/pg13/bck/registry.backup


```
#### 将旧数据库数据导入
```bash
pg_restore -U postgres -h localhost -p 5432 -d postgres --clean --create -v /var/lib/postgresql/data/pgdata/pg13/postgres.backup
pg_restore -U postgres -h localhost -p 5432 -d template1 --clean --create -v /var/lib/postgresql/data/pgdata/pg13/template1.backup
pg_restore -U postgres -h localhost -p 5432 -d template0  --clean --create -v /var/lib/postgresql/data/pgdata/pg13/template0.backup
createdb -U postgres -h localhost -p 5432 notaryserver
pg_restore -U postgres -h localhost -p 5432 -d notaryserver --clean --create -v /var/lib/postgresql/data/notaryserver.backup
pg_restore -U postgres -h localhost -p 5432 -d notarysigner --clean --create -v /var/lib/postgresql/data/notarysigner.backup
pg_restore -U postgres -h localhost -p 5432 -d registry --clean --create -v /var/lib/postgresql/data/pgdata/pg13/registry.backup

```
```sql
root@21f1db677353:/# pg_restore -U postgres -h localhost -p 5432 -d postgres --clean --create -v /var/lib/postgresql/data/registry.backup
pg_restore: connecting to database for restore
pg_restore: dropping DATABASE registry
pg_restore: while PROCESSING TOC:
pg_restore: from TOC entry 2928; 1262 16388 DATABASE registry postgres
pg_restore: error: could not execute query: ERROR:  database "registry" does not exist
Command was: DROP DATABASE registry;
pg_restore: creating DATABASE "registry"
pg_restore: connecting to new database "registry"
pg_restore: creating FUNCTION "public.update_update_time_at_column()"
pg_restore: creating TABLE "public.access"
...
...
pg_restore: creating FK CONSTRAINT "public.tag tag_artifact_id_fkey"
pg_restore: creating FK CONSTRAINT "public.task task_execution_id_fkey"
pg_restore: warning: errors ignored on restore: 1
```

#### 导入出问题了
导入 notarysigner 和notaryserver 库出现问题了，原因是 `ERROR:  role "signer" does not exist`
```bash
root@21f1db677353:/# pg_restore -U postgres -h localhost -p 5432 -d postgres --clean --create -v /var/lib/postgresql/data/notarysigner.backup
pg_restore: connecting to database for restore
pg_restore: dropping DATABASE notarysigner
pg_restore: while PROCESSING TOC:
pg_restore: from TOC entry 2198; 1262 16386 DATABASE notarysigner postgres
pg_restore: error: could not execute query: ERROR:  database "notarysigner" does not exist
Command was: DROP DATABASE notarysigner;
pg_restore: creating DATABASE "notarysigner"
pg_restore: connecting to new database "notarysigner"
pg_restore: creating ACL "DATABASE notarysigner"
pg_restore: from TOC entry 2199; 0 0 ACL DATABASE notarysigner postgres
pg_restore: error: could not execute query: ERROR:  role "signer" does not exist
Command was: GRANT ALL ON DATABASE notarysigner TO signer;


pg_restore: warning: errors ignored on restore: 2




root@21f1db677353:/# pg_restore -U postgres -h localhost -p 5432 -d postgres --clean --create -v /var/lib/postgresql/data/notaryserver.backup
pg_restore: connecting to database for restore
pg_restore: dropping DATABASE notaryserver
pg_restore: while PROCESSING TOC:
pg_restore: from TOC entry 2198; 1262 16384 DATABASE notaryserver postgres
pg_restore: error: could not execute query: ERROR:  database "notaryserver" does not exist
Command was: DROP DATABASE notaryserver;
pg_restore: creating DATABASE "notaryserver"
pg_restore: connecting to new database "notaryserver"
pg_restore: creating ACL "DATABASE notaryserver"
pg_restore: from TOC entry 2199; 0 0 ACL DATABASE notaryserver postgres
pg_restore: error: could not execute query: ERROR:  role "server" does not exist
Command was: GRANT ALL ON DATABASE notaryserver TO server;


pg_restore: warning: errors ignored on restore: 2

```


**解决** ：<br />创建相应角色
```bash
root@21f1db677353:/# psql -U postgres -h localhost -p 5432 -c "CREATE ROLE server WITH LOGIN;"
CREATE ROLE

root@21f1db677353:/# pg_restore -U postgres -h localhost -p 5432 -d postgres --clean --create -v /var/lib/postgresql/data/notaryserver.backup
pg_restore: connecting to database for restore
pg_restore: dropping DATABASE notaryserver
pg_restore: creating DATABASE "notaryserver"
pg_restore: connecting to new database "notaryserver"
pg_restore: creating ACL "DATABASE notaryserver"

---------------------------------------------------------------------------------------------------------------------------------------

root@21f1db677353:/# psql -U postgres -h localhost -p 5432 -c "CREATE ROLE signer WITH LOGIN;"
CREATE ROLE

root@21f1db677353:/# pg_restore -U postgres -h localhost -p 5432 -d postgres --clean --create -v /var/lib/postgresql/data/notarysigner.backup
pg_restore: connecting to database for restore
pg_restore: dropping DATABASE notarysigner
pg_restore: creating DATABASE "notarysigner"
pg_restore: connecting to new database "notarysigner"
pg_restore: creating ACL "DATABASE notarysigner"

```

### 使用pg_basebackup 物理备份
```bash
postgres [ / ]$ pg_basebackup  -U postgres -D /var/lib/postgresql/data/pgdata/pg13/ccc -Fp -Xs -P -R
152244/152244 kB (100%), 1/1 tablespace
```

查看备份文件
```bash
root@bck-01:/k8sdata/nfs-client-speed/harbor-database-data-rmxc-harbor-database-0-pvc-f990fb8a-2b21-488c-bb1c-17305f063567/pgdata/pg13/ccc# ls
backup_label     bck     pg_commit_ts  pg_ident.conf  pg_notify    pg_snapshots  pg_subtrans  PG_VERSION  postgresql.auto.conf   standby.signal
backup_manifest  ccc     pg_dynshmem   pg_logical     pg_replslot  pg_stat       pg_tblspc    pg_wal      postgresql_backup.sql
base             global  pg_hba.conf   pg_multixact   pg_serial    pg_stat_tmp   pg_twophase  pg_xact     postgresql.conf
```

```bash
rsync -av /k8sdata/nfs-client-speed/harbor-database-data-rmxc-harbor-database-0-pvc-f990fb8a-2b21-488c-bb1c-17305f063567/pgdata/pg13/ccc/ /postgres-data/
```

## Harbor Registry 镜像数据同步

查看 Helm Chart
```bash
$ helm ls -n harbor-registry
NAME                    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
rmxc-harbor-registry    harbor-registry 1               2024-07-11 11:36:23.28107706 +0800 CST  deployed        harbor-1.7.0    2.3.0
```

### 需要同步的 PVC
旧的 Harbor PVC
```bash
rmxc-base-data-harbor-redis-0-pvc-517daba2-001a-4131-8798-4540fa612229
rmxc-base-data-harbor-trivy-0-pvc-aab78dc9-4fd2-40e8-b3a5-5d53685cbd38
rmxc-base-harbor-chartmuseum-pvc-d4087c75-9980-4bbd-8094-7db5d2b944b3
rmxc-base-harbor-jobservice-pvc-407692c8-c70d-4559-ad51-c78a3f747d3a
rmxc-base-harbor-registry-pvc-d6f97765-3167-4644-a2b9-0b5f972c81d2
```

新的 Harbor PVC
```bash
harbor-registry-data-rmxc-harbor-registry-redis-0-pvc-651dc07a-aa63-4fb7-b46a-edff2bc7af04/
harbor-registry-data-rmxc-harbor-registry-trivy-0-pvc-f5316683-ca62-44e9-b42a-bea592ca26bb/
harbor-registry-rmxc-harbor-registry-chartmuseum-pvc-daf27589-104b-41ee-940d-64c896a6ec64/
harbor-registry-rmxc-harbor-registry-jobservice-pvc-9dc814b0-f0d7-4a94-a8b1-7f911b4dc8d9/
harbor-registry-rmxc-harbor-registry-registry-pvc-5e45d284-64ba-4bd6-b656-e4f04812003f/
```
### chartmuseum-pvc 同步chart 数据
```bash
$ rsync -avP --partial --append-verify /k8sdata/k8s-data/rmxc-base-harbor-chartmuseum-pvc-d4087c75-9980-4bbd-8094-7db5d2b944b3 harbor-registry-rmxc-harbor-registry-chartmuseum-pvc-daf27589-104b-41ee-940d-64c896a6ec64/
```
### registry-pvc 同步镜像数据
```bash
$ rsync -avP --partial --append-verify /k8sdata/nfs-client/harbor-rmxc-harbor-registry-pvc-b07caf4b-3e0d-4bbc-94f9-5d3d6e975fe6/ /k8sdata/nfs-client/k8sdata/nfs-client/harbor-registry-rmxc-harbor-registry-registry-pvc-5e45d284-64ba-4bd6-b656-e4f04812003f/
```
### harbor-jobservice-pvc
```bash
$ rsync -avP --partial --append-verify /k8sdata/k8s-data/rmxc-base-harbor-jobservice-pvc-407692c8-c70d-4559-ad51-c78a3f747d3a harbor-registry-rmxc-harbor-registry-jobservice-pvc-9dc814b0-f0d7-4a94-a8b1-7f911b4dc8d9/
```



## 解决账号密码和权限问题
```bash
2024-07-10 13:30:08.428 UTC [108] FATAL:  password authentication failed for user "postgres"
2024-07-10 13:30:08.428 UTC [108] DETAIL:  Password does not match for user "postgres".
        Connection matched pg_hba.conf line 99: "host all all all md5"
2024-07-10 13:30:18.427 UTC [109] FATAL:  password authentication failed for user "postgres"
2024-07-10 13:30:18.427 UTC [109] DETAIL:  Password does not match for user "postgres".
        Connection matched pg_hba.conf line 99: "host all all all md5"
2024-07-10 13:30:28.427 UTC [110] FATAL:  password authentication failed for user "postgres"
2024-07-10 13:30:28.427 UTC [110] DETAIL:  Password does not match for user "postgres".
        Connection matched pg_hba.conf line 99: "host all all all md5"
2024-07-10 13:30:38.428 UTC [112] FATAL:  password authentication failed for user "postgres"
2024-07-10 13:30:38.428 UTC [112] DETAIL:  Password does not match for user "postgres".
        Connection matched pg_hba.conf line 99: "host all all all md5"
2024-07-10 13:30:48.428 UTC [113] FATAL:  password authentication failed for user "postgres"
2024-07-10 13:30:48.428 UTC [113] DETAIL:  Password does not match for user "postgres".
        Connection matched pg_hba.conf line 99: "host all all all md5"

```
![图片.png](https://cdn1.ryanxin.live/1720621398728-6fa1c670-be18-4def-bea7-9b23b23e81a8.png)

这个问题主要是出现在 habor-core 组件连接 datebases 时的密码不对，需要修改 Harbor-Chart 中的 Value 文件配置。
### 修改 Harbor Chart 内容
```yaml
    certSource: secret
      secretName: "cert-harbor2.rmxc.tech"
      #notarySecretName: "cert-notary.harbor.rmxc.tech"
      core: harbor2.rmxc.tech
      #notary: notary.harbor.rmxc.tech
      kubernetes.io/ingress.class: "nginx"
      cert-manager.io/cluster-issuer: letsencrypt-prod
    #notary:
     # annotations: {}
      #notaryPort: 4443
      #notary:
      #  port: 4443
      #  nodePort: 30004
      #notaryPort: 4443
externalURL: https://harbor2.rmxc.tech
      storageClass: "nfs-client"
      size: 500Gi
      storageClass: "nfs-client"
      storageClass: "nfs-client"
      size: 10Gi
      storageClass: "nfs-client-speed"
      size: 10Gi
      storageClass: "nfs-client"
      size: 10Gi
      storageClass: "nfs-client"
secretKey: "GMDUWvdnxRxPNYVb"
  enabled: false
  type: external
    host: "10.1.0.87"
    port: "15432"
    username: "postgres"
    password: "changeit"
    #password: "a68367f6ef66c9136c8facb3"
  maxIdleConns: 150

```




## 遇到的问题

在拉取镜像时出现`not found: manifest unknown: manifest unknown`
```bash
$ docker pull harbor2.rmxc.tech/jn-prod/pplmc-biz-for-pt@sha256:5149655a5feb7d74e082b20fececbc1a9f5b9458a27e54379e9cc31a1fd4d025
Error response from daemon: manifest for harbor2.rmxc.tech/jn-prod/pplmc-biz-for-pt@sha256:5149655a5feb7d74e082b20fececbc1a9f5b9458a27e54379e9cc31a1fd4d025 not found: manifest unknown: manifest unknown

```

查看 harbor-registry 组件日志 
```bash
time="2024-07-11T02:52:57.020737446Z" level=error msg="response completed with error" auth.user.name="harbor_registry_user" err.code="manifest unknown" err.detail="unknown manifest name=library/confluence revision=sha256
" err.message="manifest unknown" go.version=go1.15.12 http.request.host=harbor2.rmxc.tech http.request.id=2df5dab8-933b-4b23-9bbd-91eb314bb9b9 http.request.method=GET http.request.remoteaddr=10.244.0.0 http.request.uri="/v2/library/confluence/manifests/sha256
" http.request.useragent="docker/24.0.5 go/go1.20.6 git-commit/a61e2b4 kernel/5.4.0-173-generic os/linux arch/amd64 UpstreamClient(Docker-Client/24.0.5 
linux)" http.response.contenttype="application/json; charset=utf-8" http.response.duration=83.721647ms http.response.status=404 http.response.written=194 vars.name="library/confluence" vars.reference="sha256
"
```

也是提示找不到镜像**manifest**

查看业务 PVC发现没有数据
```bash
root@bck-01:/k8sdata/nfs-client# cd harbor-registry-rmxc-harbor-registry-registry-pvc-5e45d284-64ba-4bd6-b656-e4f04812003f/
root@bck-01:/k8sdata/nfs-client/harbor-registry-rmxc-harbor-registry-registry-pvc-5e45d284-64ba-4bd6-b656-e4f04812003f# ls
```

我之前同步数据了，数据去哪了？ 是不是同步到类似的目录去了，还真是
```bash
root@bck-01:/k8sdata/nfs-client# ls | grep "registry-pvc"
harbor-registry-rmxc-harbor-registry-pvc-2eaaa2f2-0409-4cfd-bf48-a742d7d93691
harbor-registry-rmxc-harbor-registry-registry-pvc-5e45d284-64ba-4bd6-b656-e4f04812003f
harbor-rmxc-harbor-registry-pvc-b07caf4b-3e0d-4bbc-94f9-5d3d6e975fe6
root@bck-01:/k8sdata/nfs-client#
root@bck-01:/k8sdata/nfs-client# ls | grep "chart"
harbor-registry-rmxc-harbor-chartmuseum-pvc-b6876234-7562-49ed-85c4-7ae6720e74a4
harbor-registry-rmxc-harbor-registry-chartmuseum-pvc-daf27589-104b-41ee-940d-64c896a6ec64
harbor-rmxc-harbor-chartmuseum-pvc-bd9d6d19-ad30-4692-a04c-31ec19e8f5d7
root@bck-01:/k8sdata/nfs-client#
root@bck-01:/k8sdata/nfs-client# mv harbor-registry-rmxc-harbor-chartmuseum-pvc-b6876234-7562-49ed-85c4-7ae6720e74a4/charts harbor-registry-rmxc-harbor-registry-chartmuseum-pvc-daf27589-104b-41ee-940d-64c896a6ec64/charts
root@bck-01:/k8sdata/nfs-client#
root@bck-01:/k8sdata/nfs-client# mv harbor-registry-rmxc-harbor-chartmuseum-pvc-b6876234-7562-49ed-85c4-7ae6720e74a4/charts harbor-registry-rmxc-harbor-registry-chartmuseum-pvc-daf27589-104b-41ee-940d-64c896a6ec64/charts

```

重启 Harbor Pod 之后再拉取镜像测试一下，这下正常了
```bash
$ docker pull harbor2.rmxc.tech/jn-prod/pplmc-biz-for-pt@sha256:5149655a5feb7d74e082b20fececbc1a9f5b9458a27e54379e9cc31a1fd4d025
harbor2.rmxc.tech/jn-prod/pplmc-biz-for-pt@sha256:5149655a5feb7d74e082b20fececbc1a9f5b9458a27e54379e9cc31a1fd4d025: Pulling from jn-prod/pplmc-biz-for-pt
d836772a1c1f: Pulling fs layer
66a9e63c657a: Downloading [=>                                                 ]    161kB/5.156MB
d1989b6e74cf: Downloading [>                                                  ]  111.9kB/10.88MB
c28818711e1e: Waiting
0dec79474efa: Waiting
b65b2dac0304: Waiting
665102702477: Waiting
fad73e31a991: Waiting
2613dcf7ae1d: Waiting
4aa69a1ad42e: Waiting
^C

```

## PostgreSQL 常用命令

### 登录数据库
```bash
psql -U postgres -h localhost -p 5432
```

### 切换数据库
```sql
\c registry
```
### 更改用户密码
```bash
postgres=# ALTER USER postgres WITH PASSWORD 'a68367f6ef66c9136c8facb3';
```

### 查看所有库
```bash
postgres=# \l
                                       List of databases
         Name         |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges
----------------------+----------+----------+-------------+-------------+-----------------------
 notaryserver         | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =Tc/postgres         +
                      |          |          |             |             | postgres=CTc/postgres+
                      |          |          |             |             | server=CTc/postgres
 notarysigner         | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =Tc/postgres         +
                      |          |          |             |             | postgres=CTc/postgres+
                      |          |          |             |             | signer=CTc/postgres
 postgres             | postgres | UTF8     | en_US.utf8  | en_US.utf8  |
 registry             | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 rmxc-harbor-database | postgres | UTF8     | en_US.utf8  | en_US.utf8  |
 template0            | postgres | UTF8     | en_US.utf8  | en_US.utf8  | =c/postgres          +
                      |          |          |             |             | postgres=CTc/postgres
 template1            | postgres | UTF8     | en_US.utf8  | en_US.utf8  | =c/postgres          +
                      |          |          |             |             | postgres=CTc/postgres
(7 rows)

```


### 备份数据库
```bash
pg_dump -U postgres -h localhost -p 5432 -d postgres -F c -b -v -f /var/lib/postgresql/data/pgdata/pg13/bck/postgres.backup
```


### 还原数据库
`pg_restore` 命令需要指定数据库名称或者输出文件。<br />如果 想要使用 `--create` 来创建数据库并恢复备份，可以指定数据库名称为 `postgres`，这是一个常见的模板数据库。这样，`pg_restore` 可以在连接到 `postgres` 数据库之后创建新的数据库。  
```bash
pg_restore -U postgres -h localhost -p 5432 -d postgres --clean --create -v /var/lib/postgresql/data/notaryserver.backup
```


### 查看指定库数据
```sql
root@21f1db677353:/# psql -U postgres -h localhost -p 5432 -d registry
psql (13.5 (Debian 13.5-1.pgdg110+1))
Type "help" for help.

registry=# \dt
                    List of relations
 Schema |            Name             | Type  |  Owner
--------+-----------------------------+-------+----------
 public | access                      | table | postgres
 public | alembic_version             | table | postgres
 public | artifact                    | table | postgres
 public | artifact_blob               | table | postgres
 public | artifact_reference          | table | postgres
 public | artifact_trash              | table | postgres
 public | audit_log                   | table | postgres
 public | blob                        | table | postgres
 public | cve_allowlist               | table | postgres
 public | data_migrations             | table | postgres
 public | execution                   | table | postgres
 public | harbor_label                | table | postgres
 public | harbor_resource_label       | table | postgres
 public | harbor_user                 | table | postgres
 public | immutable_tag_rule          | table | postgres
 public | job_log                     | table | postgres
 public | label_reference             | table | postgres
 public | notification_job            | table | postgres
 public | notification_policy         | table | postgres
 public | oidc_user                   | table | postgres
 public | p2p_preheat_instance        | table | postgres
 public | p2p_preheat_policy          | table | postgres
 public | permission_policy           | table | postgres
 public | project                     | table | postgres
 public | project_blob                | table | postgres
 public | project_member              | table | postgres
 public | project_metadata            | table | postgres
 public | properties                  | table | postgres
 public | quota                       | table | postgres
 public | quota_usage                 | table | postgres
 public | registry                    | table | postgres
 public | replication_policy          | table | postgres
 public | report_vulnerability_record | table | postgres
 public | repository                  | table | postgres
 public | retention_policy            | table | postgres
 public | robot                       | table | postgres
 public | role                        | table | postgres
 public | role_permission             | table | postgres
 public | scan_report                 | table | postgres
 public | scanner_registration        | table | postgres
 public | schedule                    | table | postgres
 public | schema_migrations           | table | postgres
 public | tag                         | table | postgres
 public | task                        | table | postgres
 public | user_group                  | table | postgres
 public | vulnerability_record        | table | postgres
(46 rows)

```


### 退出数据库
```bash
registry=# \q
```
