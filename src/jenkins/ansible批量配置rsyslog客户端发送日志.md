---
author: Ryan
title: Ansible批量配置rsyslog客户端
date: 2023-10-20
lastmod: 2023-10-20
tags: 
    - 日志收集
    - rsyslog
categories:
   - ElasticStack
   - Ansible
expirationReminder:
  enable: true
---

由于等保要求，需要收集所有服务器的日志，但是服务器这么多每个都配置工作量太大了，所以使用ansible 批量管理工具，配置并启用各个节点服务器的rsyslog客户端，然后将日志发送到一个集中的日志服务端，达到日志收集的目的。

ansible 安装和配置见Ansible 批量生成并服务器密码




## 创建Ansible项目

```shell
mkdir -p /ansible-project/log-sync/playbooks
mkdir -p /ansible-project/log-sync/inventory
```



### 创建Hosts文件

```yaml
vim inventory/hosts
[qcbdzb]
qcbdzb-server1 ansible_host=192.168.11.2
qcbdzb-server2 ansible_host=192.168.11.3
qcbdzb-server3 ansible_host=192.168.11.4
qcbdzb-server4 ansible_host=192.168.11.5
qcbdzb-server5 ansible_host=192.168.11.6
qcbdzb-server6 ansible_host=192.168.11.7
qcbdzb-server7 ansible_host=192.168.11.8
qcbdzb-server8 ansible_host=192.168.11.9
qcbdzb-server9 ansible_host=10.1.1.104
qcbdzb-server10 ansible_host=10.1.1.105
qcbdzb-server11 ansible_host=10.1.1.106
qcbdzb-server12 ansible_host=10.1.1.102
qcbdzb-server13 ansible_host=10.1.1.103

[qcbqcfb]
qcbqcfb-server1 ansible_host=192.168.10.10
qcbqcfb-server2 ansible_host=192.168.10.11
qcbqcfb-server3 ansible_host=10.1.0.2
qcbqcfb-server4 ansible_host=10.1.0.3
qcbqcfb-server5 ansible_host=192.168.10.21
qcbqcfb-server6 ansible_host=192.168.10.2
qcbqcfb-server7 ansible_host=10.1.0.8
qcbqcfb-server8 ansible_host=10.1.0.5

[jtrmt]
jtrmt-server1 ansible_host=192.168.10.5
jtrmt-server2 ansible_host=192.168.10.15
jtrmt-server3 ansible_host=192.168.10.13
jtrmt-server4 ansible_host=10.1.0.4
jtrmt-server5 ansible_host=192.168.10.6
jtrmt-server6 ansible_host=192.168.10.8
jtrmt-server7 ansible_host=192.168.10.7
jtrmt-server8 ansible_host=192.168.10.4
jtrmt-server9 ansible_host=192.168.10.1
jtrmt-server10 ansible_host=192.168.10.12
jtrmt-server11 ansible_host=10.1.0.1
jtrmt-server12 ansible_host=192.168.10.17
jtrmt-server13 ansible_host=192.168.10.18
jtrmt-server14 ansible_host=192.168.10.3
jtrmt-server15 ansible_host=192.168.10.9
jtrmt-server16 ansible_host=192.168.10.14
jtrmt-server17 ansible_host=192.168.10.16

[dddl]
dddl-server1 ansible_host=192.168.10.20

[webservers]
webservers-server1 ansible_host=192.168.10.32
webservers-server2 ansible_host=192.168.10.33
webservers-server3 ansible_host=10.1.0.10
webservers-server4 ansible_host=10.1.0.15
webservers-server5 ansible_host=10.1.0.25
webservers-server6 ansible_host=10.1.0.21
webservers-server7 ansible_host=10.1.0.22
webservers-server8 ansible_host=10.1.0.23
webservers-server9 ansible_host=192.168.10.36
webservers-server10 ansible_host=10.1.1.1
webservers-server11 ansible_host=10.1.1.2
webservers-server12 ansible_host=10.1.1.3
webservers-server13 ansible_host=10.1.0.11
webservers-server14 ansible_host=10.1.0.12
webservers-server15 ansible_host=10.1.0.13
webservers-server16 ansible_host=192.168.10.35
webservers-server17 ansible_host=192.168.10.34
webservers-server18 ansible_host=192.168.10.31
```





### 创建Playbook

Playbook 执行以下步骤：

备份当前的 rsyslog.conf 文件，将新的 rsyslog 配置文件复制到目标服务器，检查新的配置文件是否存在，并在进行更改时重新启动 rsyslog 服务。

```yaml
vim /ansible-project/log-sync/playbooks/main.yaml
---
- name: Sync Servers logs file
  hosts: qcbdzb,qcbqcfb,jtrmt,dddl,webservers
  become: yes
  become_user: root
  tasks:
    - name: Backup rsyslog.conf file
      command: cp /etc/rsyslog.conf /etc/rsyslog.conf.{{ ansible_date_time.date }}

    - name: Copy rsyslog.conf
      copy:
        src: /ansible-project/log-sync/playbooks/rsyslog.conf
        dest: /etc/rsyslog.conf
      notify: Start_rsyslog

    - name: Check rsyslog.conf for changes
      stat:
        path: /etc/rsyslog.conf
      register: rsyslog_conf

  handlers:
    - name: Start_rsyslog
      systemd:
        name: rsyslog
        state: restarted
      when: rsyslog_conf.stat.exists and rsyslog_conf.stat.isreg
```



**解析：**

1. **备份 rsyslog.conf 文件**：
   - `name: Backup rsyslog.conf file` 是任务的描述。
   - 使用 `command` 模块运行一个 shell 命令。在这种情况下，它通过复制将当前的 rsyslog.conf 文件创建了一个带有时间戳的备份文件。使用 `ansible_date_time.date` 变量获取当前日期。
2. **复制 rsyslog.conf**：
   - `name: Copy rsyslog.conf` 是另一个任务描述。
   - 使用 `copy` 模块将新的 rsyslog 配置文件从 Ansible 控制节点（本地）复制到目标服务器。源文件位于 `/ansible-project/log-sync/playbooks/rsyslog.conf`，并将其复制到目标服务器的 `/etc/rsyslog.conf`。复制后，它触发名为 `Start_rsyslog` 的处理程序。
3. **检查 rsyslog.conf 是否有更改**：
   - `name: Check rsyslog.conf for changes` 描述了任务。
   - 使用 `stat` 模块来检查新的 rsyslog.conf 文件是否存在于服务器上，以及它是否是一个常规文件（而不是目录或符号链接）。检查的结果存储在名为 `rsyslog_conf` 的变量中。

4. **handlers** ：Start_rsyslog

-    当 `rsyslog_conf` 变量指示新的 rsyslog.conf 文件存在且是常规文件时，将触发此处理程序。

-    它使用 `systemd` 模块来重新启动 rsyslog 服务，以确保新的配置生效。





## 执行过程

```yaml
root@LogServer03:/ansible-project/log-sync/playbooks# ansible-playbook  /ansible-project/log-sync/playbooks/main.yaml -i /ansible-project/log-sync/inventory/hosts

PLAY [Sync Servers logs file] ************************************************************************************************************************************

TASK [Gathering Facts] *******************************************************************************************************************************************
ok: [qcbdzb-server3]
ok: [qcbdzb-server2]
ok: [qcbdzb-server4]
ok: [qcbdzb-server5]
ok: [qcbdzb-server1]
fatal: [qcbdzb-server9]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: root@10.1.1.104: Permission denied (publickey,password,keyboard-interactive).", "unreachable": true}
fatal: [qcbdzb-server10]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: root@10.1.1.105: Permission denied (publickey,password,keyboard-interactive).", "unreachable": true}
fatal: [qcbdzb-server11]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: root@10.1.1.106: Permission denied (publickey,password,keyboard-interactive).", "unreachable": true}
fatal: [qcbdzb-server12]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: root@10.1.1.102: Permission denied (publickey,password,keyboard-interactive).", "unreachable": true}
fatal: [qcbdzb-server13]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: root@10.1.1.103: Permission denied (publickey,password,keyboard-interactive).", "unreachable": true}
ok: [qcbdzb-server7]
ok: [qcbdzb-server6]
ok: [qcbqcfb-server2]
ok: [qcbdzb-server8]
ok: [qcbqcfb-server4]
ok: [qcbqcfb-server3]
ok: [qcbqcfb-server6]
ok: [qcbqcfb-server5]
ok: [jtrmt-server2]
ok: [jtrmt-server3]
ok: [qcbqcfb-server8]
ok: [jtrmt-server4]
ok: [jtrmt-server5]
ok: [jtrmt-server6]
ok: [qcbqcfb-server1]
ok: [jtrmt-server9]
ok: [qcbqcfb-server7]
ok: [jtrmt-server1]
ok: [jtrmt-server11]
ok: [jtrmt-server7]
ok: [jtrmt-server14]
ok: [jtrmt-server13]
ok: [jtrmt-server10]
ok: [jtrmt-server8]
ok: [jtrmt-server16]
ok: [dddl-server1]
ok: [webservers-server1]
ok: [webservers-server3]
ok: [webservers-server4]
ok: [webservers-server5]
ok: [webservers-server6]
ok: [webservers-server7]
ok: [webservers-server8]
ok: [webservers-server9]
ok: [webservers-server10]
ok: [webservers-server11]
ok: [webservers-server12]
ok: [webservers-server13]
ok: [webservers-server14]
ok: [webservers-server15]
ok: [webservers-server2]
ok: [jtrmt-server17]
ok: [webservers-server18]
ok: [jtrmt-server12]
ok: [jtrmt-server15]
fatal: [webservers-server16]: FAILED! => {"msg": "Timeout (12s) waiting for privilege escalation prompt: "}
fatal: [webservers-server17]: FAILED! => {"msg": "Timeout (12s) waiting for privilege escalation prompt: "}

TASK [Backup rsyslog.conf file] **************************************************************************************************                                ********************************
changed: [qcbdzb-server4]
changed: [qcbdzb-server3]
changed: [qcbdzb-server2]
changed: [qcbdzb-server5]
changed: [qcbdzb-server1]
changed: [qcbdzb-server6]
changed: [qcbdzb-server8]
changed: [qcbdzb-server7]
changed: [qcbqcfb-server2]
changed: [qcbqcfb-server1]
changed: [qcbqcfb-server4]
changed: [qcbqcfb-server3]
changed: [qcbqcfb-server6]
changed: [qcbqcfb-server7]
changed: [qcbqcfb-server8]
changed: [jtrmt-server1]
changed: [jtrmt-server2]
changed: [jtrmt-server5]
changed: [jtrmt-server7]
changed: [jtrmt-server6]
changed: [jtrmt-server4]
changed: [jtrmt-server3]
changed: [jtrmt-server11]
changed: [jtrmt-server9]
changed: [jtrmt-server10]
changed: [jtrmt-server14]
changed: [jtrmt-server13]
changed: [jtrmt-server16]
changed: [jtrmt-server8]
changed: [dddl-server1]
changed: [qcbqcfb-server5]
changed: [jtrmt-server17]
changed: [webservers-server1]
changed: [webservers-server3]
changed: [webservers-server4]
changed: [webservers-server6]
changed: [webservers-server5]
changed: [webservers-server7]
changed: [webservers-server8]
changed: [webservers-server10]
changed: [webservers-server9]
changed: [webservers-server11]
changed: [webservers-server12]
changed: [webservers-server13]
changed: [webservers-server14]
changed: [webservers-server15]
changed: [webservers-server18]
changed: [jtrmt-server15]
changed: [webservers-server2]
fatal: [jtrmt-server12]: FAILED! => {"msg": "Timeout (12s) waiting for privilege escalation prompt: "}

TASK [Copy rsyslog.conf] *****************************************************************************************************************************************
changed: [qcbdzb-server2]
changed: [qcbdzb-server3]
changed: [qcbdzb-server4]
changed: [qcbdzb-server5]
changed: [qcbdzb-server1]
changed: [qcbdzb-server8]
changed: [qcbdzb-server7]
changed: [qcbdzb-server6]
changed: [qcbqcfb-server2]
changed: [qcbqcfb-server4]
changed: [qcbqcfb-server3]
changed: [qcbqcfb-server6]
changed: [qcbqcfb-server8]
changed: [jtrmt-server2]
changed: [jtrmt-server3]
changed: [jtrmt-server4]
changed: [jtrmt-server5]
changed: [jtrmt-server1]
changed: [qcbqcfb-server5]
changed: [jtrmt-server6]
changed: [jtrmt-server9]
changed: [qcbqcfb-server7]
changed: [jtrmt-server11]
changed: [qcbqcfb-server1]
changed: [jtrmt-server7]
changed: [jtrmt-server14]
changed: [jtrmt-server8]
changed: [jtrmt-server16]
changed: [dddl-server1]
changed: [webservers-server1]
changed: [jtrmt-server13]
changed: [webservers-server3]
changed: [webservers-server4]
changed: [webservers-server5]
changed: [webservers-server6]
changed: [webservers-server7]
changed: [webservers-server8]
changed: [jtrmt-server10]
changed: [webservers-server10]
changed: [webservers-server11]
changed: [webservers-server12]
changed: [webservers-server13]
changed: [webservers-server9]
changed: [jtrmt-server17]
changed: [webservers-server14]
changed: [webservers-server15]
changed: [webservers-server18]
changed: [webservers-server2]
changed: [jtrmt-server15]

TASK [Check rsyslog.conf for changes] ****************************************************************************************************************************
ok: [qcbdzb-server2]
ok: [qcbdzb-server3]
ok: [qcbdzb-server4]
ok: [qcbdzb-server1]
ok: [qcbdzb-server5]
ok: [qcbdzb-server8]
ok: [qcbdzb-server7]
ok: [qcbdzb-server6]
ok: [qcbqcfb-server2]
ok: [qcbqcfb-server4]
ok: [qcbqcfb-server3]
ok: [qcbqcfb-server6]
ok: [jtrmt-server1]
ok: [jtrmt-server2]
ok: [jtrmt-server3]
ok: [jtrmt-server4]
ok: [qcbqcfb-server1]
ok: [jtrmt-server5]
ok: [jtrmt-server6]
ok: [qcbqcfb-server5]
ok: [jtrmt-server9]
ok: [qcbqcfb-server8]
ok: [jtrmt-server11]
ok: [jtrmt-server7]
ok: [jtrmt-server14]
ok: [qcbqcfb-server7]
ok: [jtrmt-server10]
ok: [jtrmt-server8]
ok: [dddl-server1]
ok: [jtrmt-server16]
ok: [webservers-server1]
ok: [webservers-server3]
ok: [jtrmt-server17]
ok: [webservers-server4]
ok: [webservers-server5]
ok: [webservers-server6]
ok: [jtrmt-server13]
ok: [webservers-server7]
ok: [webservers-server8]
ok: [webservers-server10]
ok: [webservers-server9]
ok: [webservers-server11]
ok: [webservers-server12]
ok: [webservers-server14]
ok: [webservers-server13]
ok: [webservers-server15]
ok: [webservers-server18]
ok: [jtrmt-server15]
ok: [webservers-server2]

RUNNING HANDLER [Start_rsyslog] **************************************************************************************************                                ********************************
changed: [qcbdzb-server2]
changed: [qcbdzb-server3]
changed: [qcbdzb-server5]
changed: [qcbdzb-server1]
changed: [qcbdzb-server4]
changed: [qcbdzb-server8]
changed: [qcbdzb-server7]
changed: [qcbdzb-server6]
changed: [qcbqcfb-server4]
changed: [qcbqcfb-server2]
changed: [qcbqcfb-server3]
changed: [qcbqcfb-server6]
changed: [qcbqcfb-server8]
changed: [jtrmt-server5]
changed: [jtrmt-server4]
changed: [jtrmt-server3]
changed: [jtrmt-server6]
changed: [jtrmt-server9]
changed: [jtrmt-server1]
changed: [jtrmt-server11]
changed: [jtrmt-server7]
changed: [qcbqcfb-server7]
changed: [jtrmt-server14]
changed: [jtrmt-server8]
changed: [jtrmt-server16]
changed: [dddl-server1]
changed: [jtrmt-server2]
changed: [qcbqcfb-server1]
changed: [webservers-server1]
changed: [webservers-server3]
changed: [jtrmt-server13]
changed: [webservers-server4]
changed: [webservers-server6]
changed: [webservers-server5]
changed: [webservers-server7]
changed: [webservers-server8]
changed: [webservers-server10]
changed: [webservers-server11]
changed: [webservers-server12]
changed: [webservers-server13]
changed: [webservers-server9]
changed: [qcbqcfb-server5]
changed: [jtrmt-server10]
changed: [jtrmt-server17]
changed: [webservers-server14]
changed: [webservers-server15]
changed: [webservers-server18]
changed: [webservers-server2]
changed: [jtrmt-server15]

PLAY RECAP *******************************************************************************************************************************************************
dddl-server1               : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server1              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server10             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server11             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server12             : ok=1    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0
jtrmt-server13             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server14             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server15             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server16             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server17             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server2              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server3              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server4              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server5              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server6              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server7              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server8              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server9              : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server1             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server10            : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server11            : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server12            : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server13            : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server2             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server3             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server4             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server5             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server6             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server7             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server8             : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server9             : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server1            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server2            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server3            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server4            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server5            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server6            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server7            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server8            : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server1         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server10        : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server11        : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server12        : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server13        : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server14        : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server15        : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server16        : ok=0    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0
webservers-server17        : ok=0    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0
webservers-server18        : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server2         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server3         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server4         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server5         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server6         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server7         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server8         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server9         : ok=5    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```





## 查看日志已经收到了

```bash
root@LogServer03:/var/log/rsyslog# ls
10.1.0.1   10.1.0.21  10.1.0.8     10.123.0.22  10.124.0.24  10.124.0.31  10.126.0.3     192.168.10.13  192.168.10.21  192.168.10.5  192.168.11.4
10.1.0.10  10.1.0.22  10.1.1.1     10.123.0.27  10.124.0.25  10.124.0.32  10.126.0.4     192.168.10.14  192.168.10.3   192.168.10.6  192.168.11.5
10.1.0.11  10.1.0.23  10.1.1.2     10.123.0.28  10.124.0.26  10.124.0.33  10.126.0.6     192.168.10.15  192.168.10.31  192.168.10.7  192.168.11.6
10.1.0.12  10.1.0.25  10.1.1.3     10.124.0.10  10.124.0.27  10.124.0.34  192.168.10.1   192.168.10.16  192.168.10.32  192.168.10.8  192.168.11.7
10.1.0.13  10.1.0.3   10.123.0.13  10.124.0.11  10.124.0.28  10.124.0.35  192.168.10.10  192.168.10.18  192.168.10.33  192.168.10.9  192.168.11.8
10.1.0.15  10.1.0.4   10.123.0.18  10.124.0.17  10.124.0.29  10.124.0.36  192.168.10.11  192.168.10.2   192.168.10.36  192.168.11.2  192.168.11.9
10.1.0.2   10.1.0.5   10.123.0.2   10.124.0.18  10.124.0.30  10.126.0.1   192.168.10.12  192.168.10.20  192.168.10.4   192.168.11.3
```

