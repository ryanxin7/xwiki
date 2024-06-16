---
author: Ryan
title: Ansible批量生成并服务器密码
date: 2023-10-17
---



为了满足三级等保中服务器密码更改周期的要求。通过使用 Ansible 执行密码生成脚本，并将执行结果记录在日志文件中，可以确保密码的自动生成和周期性更改，并在需要时审计密码更改的历史记录。


**生成密码的 Bash 脚本**：

```bash
#!/bin/bash
#Maintainer： Zhangxinxin
#Email: xx9z@outlook.com
#Time: 2023.10

password="XXXXX$(ifconfig | awk '/ether/{print $2}' | md5sum | cut -b -6)"

host=$(ifconfig | awk -F'[: ]+' '/inet /{print $3}' | sed '2d')

user=root

timestamp=$(date +"%Y-%m-%d %H:%M:%S")

if echo "$user:$password" | chpasswd; then
    success_message="[$timestamp] 当前主机: $host, 账号: $user, 密码: $password"
    echo "$success_message"
    #echo "$success_message" | ssh root@192.168.10.109 "cat >> /var/log/Psitems.log"
else
    error_message="[$timestamp] 密码更改失败"
    echo "$error_message"
    exit 1
fi
```





### 安装Ansible 



启用 Ansible PPA 存储库

Ansible 软件包及其依赖项可在 Ubuntu 22.04/20.04 的默认软件包存储库中找到，但这不是最新的 Ansible 版本。因此，要安装最新且稳定的 Ansible，请启用其 PPA 存储库，运行以下命令。

```shell
$ sudo apt install -y software-properties-common
$ sudo add-apt-repository --yes --update ppa:ansible/ansible
```



更新软件包仓库索引

```shell
sudo apt update
```



安装最新版本的 Ansible

在 Ubuntu 20.04 LTS / 22.04 LTS 上安装最新版本的 Ansible，运行 apt 命令

```bash
sudo apt install -y ansible
```



安装成功后，执行命令验证 Ansible 的版本

```bash
root@LogServer03:/ansible-project/Automaticallychangepass/playbooks# ansible --version
ansible [core 2.12.10]
  config file = /etc/ansible/ansible.cfg
  configured module search path = ['/root/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/lib/python3/dist-packages/ansible
  ansible collection location = /root/.ansible/collections:/usr/share/ansible/collections
  executable location = /usr/bin/ansible
  python version = 3.8.10 (default, May 26 2023, 14:05:08) [GCC 9.4.0]
  jinja version = 2.10.1
  libyaml = True
```



### 设置 SSH 密钥并在被管理节点之间共享

免密脚本

再目标主机列表添加相应主机IP地址

```sh
#!/bin/bash
#⽬标主机列表
IP="
192.168.10.32
192.168.10.33
"
for node in ${IP};do
sshpass -p nyqcjt@123 ssh-copy-id ${node} -o StrictHostKeyChecking=no
if [ $? -eq 0 ];then
echo "${node} 秘钥copy完成"
else
echo "${node} 秘钥copy失败"
fi
done
```





###  创建 ansible cfg 和 inventory 文件

通常建议每个项目都有单独的 ansible.cfg 和 inventory 文件。

我使用 Automaticallychangepass 作为项目名称。因此，首先通过运行 mkdir 命令创建项目文件夹。

```bash
mkdir Automaticallychangepass
```



使用以下 wget 命令下载示例 `ansble.cfg` 文件到 `~/demo` 文件夹

```bash
$ cd Automaticallychangepass
$ wget https://raw.githubusercontent.com/ansible/ansible/stable-2.9/examples/ansible.cfg
```

编辑 `~/Automaticallychangepass/ansible.cfg` 文件, 设置如下参数

```bash
vim ~/Automaticallychangepass/ansible.cfg
```



在 default 部分下面

```bash
inventory= /ansible-project/Automaticallychangepass/inventory
remote_user= root
host_key_checking= False
```



在 `privilege_escalation` 部分下面

```bash
become=True
become_method=sudo
become_user=root
become_ask_pass=False
```



现在，让我们创建 `~/demo/ansible.cfg` 文件中定义的 inventory 文件



```bash
vim /ansible-project/Automaticallychangepass/inventory
[qcbdzb]
qcbdzb-server1 ansible_host=192.168.11.2
qcbdzb-server2 ansible_host=192.168.11.3
qcbdzb-server3 ansible_host=192.168.11.4
server4 ansible_host=192.168.11.5
server5 ansible_host=192.168.11.6
server6 ansible_host=192.168.11.7
server7 ansible_host=192.168.11.8
server8 ansible_host=192.168.11.9
server9 ansible_host=10.1.1.104
server10 ansible_host=10.1.1.105
server11 ansible_host=10.1.1.106
server12 ansible_host=10.1.1.102
server13 ansible_host=10.1.1.103

[qcbqcfb]
server1 ansible_host=192.168.10.10
server2 ansible_host=192.168.10.11
server3 ansible_host=10.1.0.2
server4 ansible_host=10.1.0.3
server5 ansible_host=192.168.10.21
server6 ansible_host=192.168.10.2
server7 ansible_host=10.1.0.8
server8 ansible_host=10.1.0.5

[jtrmt]
server1 ansible_host=192.168.10.5
server2 ansible_host=192.168.10.15
server3 ansible_host=192.168.10.13
server4 ansible_host=10.1.0.4
server5 ansible_host=192.168.10.6
server6 ansible_host=192.168.10.8
server7 ansible_host=192.168.10.7
server8 ansible_host=192.168.10.4
server9 ansible_host=192.168.10.1
server10 ansible_host=192.168.10.12
server11 ansible_host=10.1.0.1
server12 ansible_host=192.168.10.17
server13 ansible_host=192.168.10.18
server14 ansible_host=192.168.10.3
server15 ansible_host=192.168.10.9
server16 ansible_host=192.168.10.14
server17 ansible_host=192.168.10.16

[dddl]
server1 ansible_host=192.168.10.20

[webservers]
server1 ansible_host=192.168.10.32
server2 ansible_host=192.168.10.33
server3 ansible_host=10.1.0.10
server4 ansible_host=10.1.0.15
server5 ansible_host=10.1.0.25
server6 ansible_host=10.1.0.21
server7 ansible_host=10.1.0.22
server8 ansible_host=10.1.0.23
server9 ansible_host=192.168.10.36
server10 ansible_host=10.1.1.1
server11 ansible_host=10.1.1.2
server12 ansible_host=10.1.1.3
server13 ansible_host=10.1.0.11
server14 ansible_host=10.1.0.12
server15 ansible_host=10.1.0.13
server16 ansible_host=192.168.10.35
server17 ansible_host=192.168.10.34
server18 ansible_host=192.168.10.31
```





重新执行 `ansible --version` 命令，确认是否设置了新的配置文件

ansible 现在正在读取我们项目的 ansible 配置文件。让我们使用 `ansible ad-hoc` 命令来验证被控节点的连通性

```bash
ansible all -m ping
ansible webservers -i /ansible-project/Automaticallychangepass/inventory/hosts -m ping
```



### 创建一个  Ansible 剧本

```yaml
---
- name: Generate and Sync Password
  hosts: qcbdzb,qcbqcfb,jtrmt,dddl,webservers
  become: yes
  become_user: root
  tasks:
    - name: Generate password
      copy:
        src: /ansible-project/Automaticallychangepass/playbooks/generate-password.sh
        dest: /tmp/generate-password.sh

    - name: Change permissive
      command: chmod a+x /tmp/generate-password.sh

    - name: Change user password
      command: /tmp/generate-password.sh
      register: script_result
      changed_when: false

    - name: Display script output
      debug:
        var: script_result.stdout_lines

    - name: Append to log file
      lineinfile:
        path: /var/log/Psitems.log
        line: "{{ script_result.stdout_lines }}"
      delegate_to: localhost
```



这个Ansible playbook它的工作流程如下：

1. **Generate password (生成密码)**: 首先，Ansible会将脚本文件 `generate-password.sh` 复制到目标主机上的 `/tmp/generate-password.sh`。这确保了目标主机上有脚本文件可供执行。
2. **Change permission (更改权限)**: 接下来，Ansible会使用 `chmod` 命令更改脚本文件的权限，将其设置为可执行。这确保了脚本可以在目标主机上执行。
3. **Change user password (更改用户密码)**: 然后，Ansible执行脚本 `/tmp/generate-password.sh` 以生成密码并将其存储在 `script_result` 变量中。`changed_when: false` 表示即使任务未更改系统状态，也将任务标记为成功。
4. **Display script output (显示脚本输出)**: 此任务使用 `debug` 模块来显示脚本的标准输出，以便您可以查看脚本生成的密码或其他输出。
5. **Append to log file (追加到日志文件)**: 最后，使用 `lineinfile` 模块将 `script_result.stdout_lines` 内容追加到日志文件 `/var/log/Psitems.log` 中。这可以帮助记录脚本执行的结果。







### 执行剧本

```sh
ansible-playbook /ansible-project/Automaticallychangepass/playbooks/main.yaml -i /ansible-project/Automaticallychangepass/inventory/hostssible-project/Automaticallychangepass/inventory/hosts
```





### 第一次执行的一些记录

```bash
root@LogServer03:/ansible-project/Automaticallychangepass/playbooks# ansible-playbook /ansible-project/Automaticallychangepass/playbooks/main.yaml -i /ansible-project/Automaticallychangepass/inventory/hosts

PLAY [Generate and Sync Password] **************************************************************************************************************************

TASK [Gathering Facts] *************************************************************************************************************************************
fatal: [qcbdzb-server2]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: ssh: connect to host 192.168.11.3 port 22: Connection refused", "unreachable": true}
ok: [qcbdzb-server4]
ok: [qcbdzb-server3]
ok: [qcbdzb-server5]
ok: [qcbdzb-server1]
ok: [qcbdzb-server6]
ok: [qcbdzb-server7]
ok: [qcbdzb-server10]
ok: [qcbdzb-server9]
ok: [qcbdzb-server11]
ok: [qcbdzb-server8]
ok: [qcbdzb-server12]
ok: [qcbdzb-server13]
ok: [qcbqcfb-server2]
ok: [qcbqcfb-server3]
ok: [qcbqcfb-server4]
ok: [qcbqcfb-server6]
ok: [qcbqcfb-server5]
ok: [qcbqcfb-server8]
ok: [qcbqcfb-server7]
ok: [qcbqcfb-server1]
ok: [jtrmt-server5]
ok: [jtrmt-server4]
ok: [jtrmt-server3]
ok: [jtrmt-server1]
ok: [jtrmt-server9]
ok: [jtrmt-server6]
ok: [jtrmt-server11]
ok: [jtrmt-server2]
fatal: [jtrmt-server12]: FAILED! => {"msg": "Timeout (12s) waiting for privilege escalation prompt: "}
ok: [jtrmt-server14]
ok: [jtrmt-server7]
ok: [jtrmt-server8]
ok: [jtrmt-server13]
ok: [dddl-server1]
ok: [jtrmt-server10]
ok: [webservers-server1]
ok: [webservers-server3]
ok: [webservers-server4]
ok: [webservers-server5]
ok: [webservers-server6]
ok: [jtrmt-server16]
ok: [webservers-server7]
ok: [webservers-server8]
ok: [webservers-server10]
ok: [webservers-server11]
ok: [webservers-server12]
ok: [webservers-server13]
ok: [jtrmt-server15]
ok: [webservers-server14]
ok: [webservers-server15]
ok: [jtrmt-server17]
ok: [webservers-server18]
ok: [webservers-server2]
ok: [webservers-server9]
fatal: [webservers-server17]: FAILED! => {"msg": "Timeout (12s) waiting for privilege escalation prompt: "}
fatal: [webservers-server16]: FAILED! => {"msg": "Timeout (12s) waiting for privilege escalation prompt: "}

TASK [Generate password] ***********************************************************************************************************************************
ok: [qcbdzb-server3]
ok: [qcbdzb-server4]
ok: [qcbdzb-server5]
ok: [qcbdzb-server1]
ok: [qcbdzb-server6]
ok: [qcbdzb-server8]
ok: [qcbdzb-server10]
ok: [qcbdzb-server7]
ok: [qcbdzb-server9]
ok: [qcbdzb-server11]
ok: [qcbdzb-server13]
ok: [qcbdzb-server12]
changed: [qcbqcfb-server4]
changed: [qcbqcfb-server3]
changed: [qcbqcfb-server2]
changed: [qcbqcfb-server6]
changed: [qcbqcfb-server8]
changed: [qcbqcfb-server7]
changed: [jtrmt-server3]
changed: [qcbqcfb-server1]
changed: [jtrmt-server4]
changed: [jtrmt-server5]
changed: [jtrmt-server6]
changed: [qcbqcfb-server5]
changed: [jtrmt-server9]
changed: [jtrmt-server7]
changed: [jtrmt-server11]
changed: [jtrmt-server2]
changed: [jtrmt-server8]
changed: [jtrmt-server14]
changed: [jtrmt-server1]
changed: [jtrmt-server10]
ok: [dddl-server1]
changed: [webservers-server1]
changed: [jtrmt-server13]
changed: [webservers-server3]
changed: [webservers-server4]
changed: [webservers-server5]
changed: [webservers-server6]
changed: [webservers-server7]
changed: [webservers-server8]
changed: [jtrmt-server16]
changed: [webservers-server10]
changed: [webservers-server11]
changed: [webservers-server12]
changed: [webservers-server13]
changed: [webservers-server14]
changed: [webservers-server15]
changed: [webservers-server18]
changed: [jtrmt-server17]
changed: [webservers-server2]
changed: [webservers-server9]
changed: [jtrmt-server15]

TASK [Change permissive] ***********************************************************************************************************************************
fatal: [qcbdzb-server3]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: ssh: connect to host 192.168.11.4 port 22: Connection refused", "unreachable": true}
changed: [qcbdzb-server4]
changed: [qcbdzb-server1]
changed: [qcbdzb-server7]
changed: [qcbdzb-server5]
changed: [qcbdzb-server6]
changed: [qcbdzb-server8]
changed: [qcbdzb-server10]
changed: [qcbdzb-server12]
changed: [qcbdzb-server9]
changed: [qcbdzb-server11]
changed: [qcbdzb-server13]
changed: [qcbqcfb-server4]
changed: [qcbqcfb-server3]
changed: [qcbqcfb-server2]
changed: [qcbqcfb-server5]
changed: [qcbqcfb-server6]
changed: [jtrmt-server2]
changed: [qcbqcfb-server8]
changed: [jtrmt-server3]
changed: [jtrmt-server5]
changed: [jtrmt-server1]
changed: [jtrmt-server4]
changed: [qcbqcfb-server7]
changed: [jtrmt-server6]
changed: [jtrmt-server9]
changed: [qcbqcfb-server1]
changed: [jtrmt-server11]
changed: [jtrmt-server13]
changed: [jtrmt-server8]
changed: [jtrmt-server14]
changed: [jtrmt-server17]
changed: [jtrmt-server16]
changed: [dddl-server1]
changed: [jtrmt-server7]
changed: [webservers-server1]
changed: [webservers-server3]
changed: [webservers-server4]
changed: [webservers-server5]
changed: [webservers-server6]
changed: [webservers-server7]
changed: [webservers-server8]
changed: [webservers-server9]
changed: [webservers-server10]
changed: [webservers-server12]
changed: [webservers-server11]
changed: [webservers-server13]
changed: [webservers-server14]
changed: [webservers-server18]
changed: [webservers-server15]
changed: [jtrmt-server10]
changed: [jtrmt-server15]
changed: [webservers-server2]

TASK [Change user password] ********************************************************************************************************************************
ok: [qcbdzb-server4]
ok: [qcbdzb-server1]
ok: [qcbdzb-server5]
ok: [qcbdzb-server6]
ok: [qcbdzb-server7]
ok: [qcbdzb-server8]
ok: [qcbdzb-server10]
ok: [qcbdzb-server9]
ok: [qcbdzb-server11]
ok: [qcbdzb-server12]
ok: [qcbdzb-server13]
ok: [qcbqcfb-server4]
ok: [qcbqcfb-server2]
ok: [qcbqcfb-server3]
ok: [qcbqcfb-server5]
ok: [qcbqcfb-server7]
ok: [qcbqcfb-server6]
ok: [qcbqcfb-server8]
ok: [jtrmt-server2]
ok: [qcbqcfb-server1]
ok: [jtrmt-server4]
ok: [jtrmt-server5]
ok: [jtrmt-server7]
ok: [jtrmt-server1]
ok: [jtrmt-server9]
ok: [jtrmt-server3]
ok: [jtrmt-server11]
ok: [jtrmt-server13]
ok: [jtrmt-server6]
ok: [jtrmt-server14]
ok: [jtrmt-server8]
ok: [dddl-server1]
ok: [jtrmt-server17]
ok: [jtrmt-server16]
ok: [webservers-server1]
ok: [webservers-server4]
ok: [webservers-server3]
ok: [webservers-server5]
ok: [webservers-server6]
ok: [webservers-server7]
ok: [webservers-server8]
ok: [webservers-server10]
ok: [webservers-server11]
ok: [webservers-server12]
ok: [webservers-server13]
ok: [jtrmt-server10]
ok: [webservers-server14]
ok: [webservers-server15]
ok: [webservers-server18]
ok: [webservers-server2]
ok: [webservers-server9]
ok: [jtrmt-server15]

TASK [Display script output] *******************************************************************************************************************************
ok: [qcbdzb-server1] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:16] 当前主机: addr, 账号: root, 密码: XXXXXd41d8c"
    ]
}
ok: [qcbdzb-server4] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:16] 当前主机: addr, 账号: root, 密码: XXXXXd41d8c"
    ]
}
ok: [qcbdzb-server5] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: addr, 账号: root, 密码: XXXXXd41d8c"
    ]
}
ok: [qcbdzb-server6] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: addr, 账号: root, 密码: XXXXXd41d8c"
    ]
}
ok: [qcbdzb-server7] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: 192.168.11.8, 账号: root, 密码: XXXXX7b6bfe"
    ]
}
ok: [qcbdzb-server8] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: 192.168.11.9, 账号: root, 密码: XXXXXb3d599"
    ]
}
ok: [qcbdzb-server9] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: 10.1.1.104",
        "192.168.122.1, 账号: root, 密码: XXXXX8fdc02"
    ]
}
ok: [qcbdzb-server10] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: 10.1.1.105",
        "192.168.122.1, 账号: root, 密码: XXXXX9bccaf"
    ]
}
ok: [qcbdzb-server11] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: 10.1.1.106",
        "192.168.122.1, 账号: root, 密码: XXXXX9e7776"
    ]
}
ok: [qcbdzb-server12] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: 10.1.1.102",
        "192.168.122.1, 账号: root, 密码: XXXXX92ea3a"
    ]
}
ok: [qcbdzb-server13] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:17] 当前主机: 10.1.1.103",
        "192.168.122.1, 账号: root, 密码: XXXXX9add3c"
    ]
}
ok: [qcbqcfb-server1] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:20] 当前主机: 192.168.10.10",
        "192.168.122.1, 账号: root, 密码: XXXXX2eb384"
    ]
}
ok: [qcbqcfb-server2] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:18] 当前主机: 192.168.10.11",
        "192.168.122.1, 账号: root, 密码: XXXXXcab605"
    ]
}
ok: [qcbqcfb-server3] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:18] 当前主机: 10.1.0.2",
        "192.168.122.1, 账号: root, 密码: XXXXX5719c2"
    ]
}
ok: [qcbqcfb-server4] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:18] 当前主机: 10.1.0.3",
        "192.168.122.1, 账号: root, 密码: XXXXX605de8"
    ]
}
ok: [qcbqcfb-server5] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:18] 当前主机: 192.168.10.21",
        "192.168.122.1, 账号: root, 密码: XXXXXad29a5"
    ]
}
ok: [qcbqcfb-server6] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:19] 当前主机: 192.168.10.2, 账号: root, 密码: XXXXXbaf182"
    ]
}
ok: [qcbqcfb-server7] => {
    "script_result.stdout_lines": [
        "Changing password for user root.",
        "passwd: all authentication tokens updated successfully.",
        "[2023-10-17 16:52:19] 当前主机: 10.1.0.8",
        "192.168.122.1, 账号: root, 密码: XXXXXd6147d"
    ]
}
ok: [qcbqcfb-server8] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:19] 当前主机: 10.1.0.5",
        "192.168.122.1, 账号: root, 密码: XXXXX07f297"
    ]
}
ok: [jtrmt-server1] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:21] 当前主机: 192.168.10.5",
        "192.168.122.1, 账号: root, 密码: XXXXX68af9a"
    ]
}
ok: [jtrmt-server2] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:19] 当前主机: 192.168.10.15",
        "192.168.122.1, 账号: root, 密码: XXXXX631493"
    ]
}
ok: [jtrmt-server3] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:21] 当前主机: 192.168.10.13",
        "192.168.122.1, 账号: root, 密码: XXXXX5413a1"
    ]
}
ok: [jtrmt-server4] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:19] 当前主机: 10.1.0.4",
        "192.168.122.1, 账号: root, 密码: XXXXX42e302"
    ]
}
ok: [jtrmt-server5] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:20] 当前主机: 192.168.10.6",
        "192.168.122.1, 账号: root, 密码: XXXXX66b89d"
    ]
}
ok: [jtrmt-server6] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:23] 当前主机: 192.168.10.8",
        "192.168.122.1, 账号: root, 密码: XXXXX07980e"
    ]
}
ok: [jtrmt-server7] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:20] 当前主机: 192.168.10.7, 账号: root, 密码: XXXXXb76c7b"
    ]
}
ok: [jtrmt-server8] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:21] 当前主机: 192.168.10.4",
        "192.168.122.1, 账号: root, 密码: XXXXX97c429"
    ]
}
ok: [jtrmt-server9] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:21] 当前主机: 192.168.10.1, 账号: root, 密码: XXXXXdeee32"
    ]
}
ok: [jtrmt-server10] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:34] 当前主机: 192.168.10.12",
        "192.168.122.1, 账号: root, 密码: XXXXXd85e12"
    ]
}
ok: [jtrmt-server11] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:22] 当前主机: 10.1.0.1",
        "192.168.122.1, 账号: root, 密码: XXXXX389683"
    ]
}
ok: [jtrmt-server13] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:22] 当前主机: 172.17.0.1",
        "127.0.0.1",
        "192.168.122.1, 账号: root, 密码: XXXXXb763da"
    ]
}
ok: [jtrmt-server14] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:23] 当前主机: 192.168.10.3, 账号: root, 密码: XXXXXc685c9"
    ]
}
ok: [jtrmt-server15] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:53:00] 当前主机: 192.168.10.9",
        "192.168.122.1, 账号: root, 密码: XXXXX7412fb"
    ]
}
ok: [jtrmt-server16] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:25] 当前主机: 192.168.10.14",
        "192.168.122.1, 账号: root, 密码: XXXXX2f43ce"
    ]
}
ok: [jtrmt-server17] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:25] 当前主机: 192.168.10.16",
        "192.168.122.1, 账号: root, 密码: XXXXXe3db40"
    ]
}
ok: [dddl-server1] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:24] 当前主机: 192.168.10.20",
        "192.168.122.1, 账号: root, 密码: XXXXX1b0660"
    ]
}
ok: [webservers-server1] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:41:47] 当前主机: 192.168.10.32",
        "192.168.122.1, 账号: root, 密码: XXXXXdfd3de"
    ]
}
ok: [webservers-server2] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:48] 当前主机: 192.168.10.33",
        "192.168.122.1, 账号: root, 密码: XXXXX9ac0d9"
    ]
}
ok: [webservers-server3] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:26] 当前主机: 10.1.0.10",
        "192.168.122.1, 账号: root, 密码: XXXXX5ec730"
    ]
}
ok: [webservers-server4] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:27] 当前主机: 10.1.0.15",
        "192.168.122.1, 账号: root, 密码: XXXXXefe11d"
    ]
}
ok: [webservers-server5] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:27] 当前主机: 10.1.0.25",
        "192.168.122.1, 账号: root, 密码: XXXXXf7e909"
    ]
}
ok: [webservers-server6] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:27] 当前主机: 10.1.0.21",
        "192.168.122.1, 账号: root, 密码: XXXXX7bd688"
    ]
}
ok: [webservers-server7] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:28] 当前主机: 10.1.0.22",
        "192.168.122.1, 账号: root, 密码: XXXXX5c5991"
    ]
}
ok: [webservers-server8] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:28] 当前主机: 10.1.0.23",
        "192.168.122.1, 账号: root, 密码: XXXXXabcf87"
    ]
}
ok: [webservers-server9] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:49] 当前主机: 192.168.10.36",
        "192.168.122.1, 账号: root, 密码: XXXXXc5a685"
    ]
}
ok: [webservers-server10] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:29] 当前主机: 10.1.1.1",
        "192.168.122.1, 账号: root, 密码: XXXXX5e2b77"
    ]
}
ok: [webservers-server11] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:30] 当前主机: 10.1.1.2",
        "192.168.122.1, 账号: root, 密码: XXXXX744df2"
    ]
}
ok: [webservers-server15] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:35] 当前主机: 10.1.0.13",
        "192.168.122.1, 账号: root, 密码: XXXXXe55112"
    ]
}
ok: [webservers-server13] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:33] 当前主机: 10.1.0.11",
        "192.168.122.1, 账号: root, 密码: XXXXXd4291f"
    ]
}
ok: [webservers-server12] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:32] 当前主机: 10.1.1.3",
        "192.168.122.1, 账号: root, 密码: XXXXXccd438"
    ]
}
ok: [webservers-server18] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:35] 当前主机: 192.168.10.31, 账号: root, 密码: XXXXXdce61c"
    ]
}
ok: [webservers-server14] => {
    "script_result.stdout_lines": [
        "更改用户 root 的密码 。",
        "passwd：所有的身份验证令牌已经成功更新。",
        "[2023-10-17 16:52:34] 当前主机: 10.1.0.12",
        "192.168.122.1, 账号: root, 密码: XXXXX5a5259"
    ]
}

TASK [Append to log file] **********************************************************************************************************************************
changed: [qcbdzb-server5 -> localhost]
changed: [qcbdzb-server1 -> localhost]
ok: [qcbdzb-server4 -> localhost]
ok: [qcbdzb-server6 -> localhost]
changed: [qcbdzb-server7 -> localhost]
changed: [qcbdzb-server8 -> localhost]
changed: [qcbdzb-server9 -> localhost]
changed: [qcbdzb-server10 -> localhost]
changed: [qcbdzb-server11 -> localhost]
changed: [qcbdzb-server12 -> localhost]
changed: [qcbdzb-server13 -> localhost]
changed: [qcbqcfb-server1 -> localhost]
changed: [qcbqcfb-server2 -> localhost]
changed: [qcbqcfb-server3 -> localhost]
changed: [qcbqcfb-server4 -> localhost]
changed: [qcbqcfb-server5 -> localhost]
changed: [qcbqcfb-server6 -> localhost]
changed: [qcbqcfb-server7 -> localhost]
changed: [qcbqcfb-server8 -> localhost]
changed: [jtrmt-server1 -> localhost]
changed: [jtrmt-server2 -> localhost]
changed: [jtrmt-server3 -> localhost]
changed: [jtrmt-server4 -> localhost]
changed: [jtrmt-server5 -> localhost]
changed: [jtrmt-server6 -> localhost]
changed: [jtrmt-server7 -> localhost]
changed: [jtrmt-server8 -> localhost]
changed: [jtrmt-server9 -> localhost]
changed: [jtrmt-server10 -> localhost]
changed: [jtrmt-server11 -> localhost]
changed: [jtrmt-server13 -> localhost]
changed: [jtrmt-server14 -> localhost]
changed: [jtrmt-server15 -> localhost]
changed: [jtrmt-server16 -> localhost]
changed: [jtrmt-server17 -> localhost]
changed: [dddl-server1 -> localhost]
changed: [webservers-server1 -> localhost]
changed: [webservers-server2 -> localhost]
changed: [webservers-server3 -> localhost]
changed: [webservers-server4 -> localhost]
changed: [webservers-server5 -> localhost]
changed: [webservers-server6 -> localhost]
changed: [webservers-server7 -> localhost]
changed: [webservers-server8 -> localhost]
changed: [webservers-server9 -> localhost]
changed: [webservers-server10 -> localhost]
changed: [webservers-server11 -> localhost]
changed: [webservers-server12 -> localhost]
changed: [webservers-server13 -> localhost]
changed: [webservers-server14 -> localhost]
changed: [webservers-server15 -> localhost]
changed: [webservers-server18 -> localhost]

PLAY RECAP *************************************************************************************************************************************************
dddl-server1               : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server1              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server10             : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server11             : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server12             : ok=0    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0
jtrmt-server13             : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server14             : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server15             : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server16             : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server17             : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server2              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server3              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server4              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server5              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server6              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server7              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server8              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
jtrmt-server9              : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server1             : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server10            : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server11            : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server12            : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server13            : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server2             : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server3             : ok=2    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server4             : ok=6    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server5             : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server6             : ok=6    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server7             : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server8             : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbdzb-server9             : ok=6    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server1            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server2            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server3            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server4            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server5            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server6            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server7            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
qcbqcfb-server8            : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server1         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server10        : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server11        : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server12        : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server13        : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server14        : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server15        : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server16        : ok=0    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0
webservers-server17        : ok=0    changed=0    unreachable=0    failed=1    skipped=0    rescued=0    ignored=0
webservers-server18        : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server2         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server3         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server4         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server5         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server6         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server7         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server8         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
webservers-server9         : ok=6    changed=3    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

