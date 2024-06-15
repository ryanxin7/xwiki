---
author: Ryan
title: 日志处理-Grok正则捕获
date: 2021-10-21
categories: ElasticStack
---

一般系统或服务生成的日志都是一大长串。每个字段之间用空格隔开。logstash在获取日志是整个一串获取，如果把日志中每个字段代表的意思分割开来在传给elasticsearch。这样呈现出来的数据更加清晰，而且也能让kibana更方便的绘制图形。

  Grok 是 Logstash 最重要的插件。它的主要作用就是将文本格式的字符串，转换成为具体的结构化的数据，配合正则表达式使用。

<!-- more -->



# Grok 正则捕获



Grok 支持把预定义的 *grok 表达式* 写入到文件中，官方提供的预定义 grok 表达式见：https://github.com/logstash/logstash/tree/v1.4.2/patterns。





`%{syntax:semantic}`

syntax代表的是正则表达式替代字段，semantic是代表这个表达式对应的字段名，你可以自由命名。这个命名尽量能简单易懂的表达出这个字段代表的意思。



logstash安装时就带有已经写好的正则表达式。路径如下：

`/usr/local/logstash-2.3.4/vendor/bundle/jruby/1.9/gems/logstash-patterns-core-2.0.5/patterns`

或者直接访问[logstash-plugins/logstash-patterns-core · GitHub](https://github.com/logstash-plugins/logstash-patterns-core/blob/main/patterns/ecs-v1/grok-patterns)

上面IPORHOST，USER等都是在里面已经定义好的！当然还有其他的，基本能满足我们的需求。





## **grok-patterns**

```bash
USERNAME [a-zA-Z0-9._-]+
USER %{USERNAME}
EMAILLOCALPART [a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]{1,64}(?:\.[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]{1,62}){0,63}
EMAILADDRESS %{EMAILLOCALPART}@%{HOSTNAME}
INT (?:[+-]?(?:[0-9]+))
BASE10NUM (?<![0-9.+-])(?>[+-]?(?:(?:[0-9]+(?:\.[0-9]+)?)|(?:\.[0-9]+)))
NUMBER (?:%{BASE10NUM})
BASE16NUM (?<![0-9A-Fa-f])(?:[+-]?(?:0x)?(?:[0-9A-Fa-f]+))
BASE16FLOAT \b(?<![0-9A-Fa-f.])(?:[+-]?(?:0x)?(?:(?:[0-9A-Fa-f]+(?:\.[0-9A-Fa-f]*)?)|(?:\.[0-9A-Fa-f]+)))\b

POSINT \b(?:[1-9][0-9]*)\b
NONNEGINT \b(?:[0-9]+)\b
WORD \b\w+\b
NOTSPACE \S+
SPACE \s*
DATA .*?
GREEDYDATA .*
QUOTEDSTRING (?>(?<!\\)(?>"(?>\\.|[^\\"]+)+"|""|(?>'(?>\\.|[^\\']+)+')|''|(?>`(?>\\.|[^\\`]+)+`)|``))
UUID [A-Fa-f0-9]{8}-(?:[A-Fa-f0-9]{4}-){3}[A-Fa-f0-9]{12}
# URN, allowing use of RFC 2141 section 2.3 reserved characters
URN urn:[0-9A-Za-z][0-9A-Za-z-]{0,31}:(?:%[0-9a-fA-F]{2}|[0-9A-Za-z()+,.:=@;$_!*'/?#-])+

# Networking
MAC (?:%{CISCOMAC}|%{WINDOWSMAC}|%{COMMONMAC})
CISCOMAC (?:(?:[A-Fa-f0-9]{4}\.){2}[A-Fa-f0-9]{4})
WINDOWSMAC (?:(?:[A-Fa-f0-9]{2}-){5}[A-Fa-f0-9]{2})
COMMONMAC (?:(?:[A-Fa-f0-9]{2}:){5}[A-Fa-f0-9]{2})
IPV6 ((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?
IPV4 (?<![0-9])(?:(?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5])[.](?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5])[.](?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5])[.](?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5]))(?![0-9])
IP (?:%{IPV6}|%{IPV4})
HOSTNAME \b(?:[0-9A-Za-z][0-9A-Za-z-]{0,62})(?:\.(?:[0-9A-Za-z][0-9A-Za-z-]{0,62}))*(\.?|\b)
IPORHOST (?:%{IP}|%{HOSTNAME})
HOSTPORT %{IPORHOST}:%{POSINT}

# paths (only absolute paths are matched)
PATH (?:%{UNIXPATH}|%{WINPATH})
UNIXPATH (/[[[:alnum:]]_%!$@:.,+~-]*)+
TTY (?:/dev/(pts|tty([pq])?)(\w+)?/?(?:[0-9]+))
WINPATH (?>[A-Za-z]+:|\\)(?:\\[^\\?*]*)+
URIPROTO [A-Za-z]([A-Za-z0-9+\-.]+)+
URIHOST %{IPORHOST}(?::%{POSINT})?
# uripath comes loosely from RFC1738, but mostly from what Firefox doesn't turn into %XX
URIPATH (?:/[A-Za-z0-9$.+!*'(){},~:;=@#%&_\-]*)+
URIQUERY [A-Za-z0-9$.+!*'|(){},~@#%&/=:;_?\-\[\]<>]*
# deprecated (kept due compatibility):
URIPARAM \?%{URIQUERY}
URIPATHPARAM %{URIPATH}(?:\?%{URIQUERY})?
URI %{URIPROTO}://(?:%{USER}(?::[^@]*)?@)?(?:%{URIHOST})?(?:%{URIPATH}(?:\?%{URIQUERY})?)?

# Months: January, Feb, 3, 03, 12, December
MONTH \b(?:[Jj]an(?:uary|uar)?|[Ff]eb(?:ruary|ruar)?|[Mm](?:a|ä)?r(?:ch|z)?|[Aa]pr(?:il)?|[Mm]a(?:y|i)?|[Jj]un(?:e|i)?|[Jj]ul(?:y|i)?|[Aa]ug(?:ust)?|[Ss]ep(?:tember)?|[Oo](?:c|k)?t(?:ober)?|[Nn]ov(?:ember)?|[Dd]e(?:c|z)(?:ember)?)\b
MONTHNUM (?:0?[1-9]|1[0-2])
MONTHNUM2 (?:0[1-9]|1[0-2])
MONTHDAY (?:(?:0[1-9])|(?:[12][0-9])|(?:3[01])|[1-9])

# Days: Monday, Tue, Thu, etc...
DAY (?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)

# Years?
YEAR (?>\d\d){1,2}
HOUR (?:2[0123]|[01]?[0-9])
MINUTE (?:[0-5][0-9])
# '60' is a leap second in most time standards and thus is valid.
SECOND (?:(?:[0-5]?[0-9]|60)(?:[:.,][0-9]+)?)
TIME (?!<[0-9])%{HOUR}:%{MINUTE}(?::%{SECOND})(?![0-9])
# datestamp is YYYY/MM/DD-HH:MM:SS.UUUU (or something like it)
DATE_US %{MONTHNUM}[/-]%{MONTHDAY}[/-]%{YEAR}
DATE_EU %{MONTHDAY}[./-]%{MONTHNUM}[./-]%{YEAR}
ISO8601_TIMEZONE (?:Z|[+-]%{HOUR}(?::?%{MINUTE}))
ISO8601_SECOND %{SECOND}
TIMESTAMP_ISO8601 %{YEAR}-%{MONTHNUM}-%{MONTHDAY}[T ]%{HOUR}:?%{MINUTE}(?::?%{SECOND})?%{ISO8601_TIMEZONE}?
DATE %{DATE_US}|%{DATE_EU}
DATESTAMP %{DATE}[- ]%{TIME}
TZ (?:[APMCE][SD]T|UTC)
DATESTAMP_RFC822 %{DAY} %{MONTH} %{MONTHDAY} %{YEAR} %{TIME} %{TZ}
DATESTAMP_RFC2822 %{DAY}, %{MONTHDAY} %{MONTH} %{YEAR} %{TIME} %{ISO8601_TIMEZONE}
DATESTAMP_OTHER %{DAY} %{MONTH} %{MONTHDAY} %{TIME} %{TZ} %{YEAR}
DATESTAMP_EVENTLOG %{YEAR}%{MONTHNUM2}%{MONTHDAY}%{HOUR}%{MINUTE}%{SECOND}

# Syslog Dates: Month Day HH:MM:SS
SYSLOGTIMESTAMP %{MONTH} +%{MONTHDAY} %{TIME}
PROG [\x21-\x5a\x5c\x5e-\x7e]+
SYSLOGPROG %{PROG:[process][name]}(?:\[%{POSINT:[process][pid]:int}\])?
SYSLOGHOST %{IPORHOST}
SYSLOGFACILITY <%{NONNEGINT:[log][syslog][facility][code]:int}.%{NONNEGINT:[log][syslog][priority]:int}>
HTTPDATE %{MONTHDAY}/%{MONTH}/%{YEAR}:%{TIME} %{INT}

# Shortcuts
QS %{QUOTEDSTRING}

# Log formats
SYSLOGBASE %{SYSLOGTIMESTAMP:timestamp} (?:%{SYSLOGFACILITY} )?%{SYSLOGHOST:[host][hostname]} %{SYSLOGPROG}:

# Log Levels
LOGLEVEL ([Aa]lert|ALERT|[Tt]race|TRACE|[Dd]ebug|DEBUG|[Nn]otice|NOTICE|[Ii]nfo?(?:rmation)?|INFO?(?:RMATION)?|[Ww]arn?(?:ing)?|WARN?(?:ING)?|[Ee]rr?(?:or)?|ERR?(?:OR)?|[Cc]rit?(?:ical)?|CRIT?(?:ICAL)?|[Ff]atal|FATAL|[Ss]evere|SEVERE|EMERG(?:ENCY)?|[Ee]merg(?:ency)?)
```





## 案例实践

**例1**：将下面的日志文件格式拆分为5段  

```sh
2016-09-19T18:19:00 [8.8.8.8:prd] DEBUG this is an example log message
```



- 时间 
- IP地址
- 环境
- 等级
- 信息

使用Grok 默认提供的正则匹配后

```sh
%{TIMESTAMP_ISO8601:timestamp} \[%{IPV4:ip};%{WORD:environment}\] %{LOGLEVEL:log_level} %{GREEDYDATA:message}


这样就会生成结构化结果：
{
  "timestamp": "2016-09-19T18:19:00",
  "ip": "8.8.8.8",
  "environment": "prd",
  "log_level": "DEBUG",
  "message": "this is an example log message"
}
```



`TIMESTAMP_ISO8601`用来匹配时间  

`IPV4`匹配IPV4 IP地址

`WORD`匹配环境

`LOGLEVEL`匹配了日志等级

`GREEDYDATA`匹配后面的所有内容





**例2：**

```sh
220.181.108.96 - - [13/Jun/2015:21:14:28 +0000] "GET /blog/geekery/xvfb-firefox.html HTTP/1.1" 200 10975 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"
```

**转换后：**

```sh
%{IPORHOST:clientip} %{USER:ident} %{USER:auth} \[%{HTTPDATE:timestamp}\] "%{WORD:verb} %{DATA:request} HTTP/%{NUMBER:httpversion}" %{NUMBER:response:int} (?:-|%{NUMBER:bytes:int}) %{QS:referrer} %{QS:agent}
```



**例3：**

```sh
220.181.108.96 - - [13/Jun/2015:21:14:28 +0000] "GET /blog/geekery/xvfb-firefox.html HTTP/1.1" 200 10975 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"
```

**转换后：**

```sh
%{IPORHOST:clientip} %{USER:ident} %{USER:auth} \[%{HTTPDATE:timestamp}\] "%{WORD:verb} %{DATA:request} HTTP/%{NUMBER:httpversion}" %{NUMBER:response:int} (?:-|%{NUMBER:bytes:int}) %{QS:referrer} %{QS:agent}
```



**例4**：假设我们有三个使用“`common_header：payload`”格式的应用程序

```sh
Application 1: '8.8.8.8 process-name[666]: a b 1 2 a lot of text at the end'

Application 2: '8.8.8.8 process-name[667]: a 1 2 3 a lot of text near the end;4'

Application 3: '8.8.8.8 process-name[421]: a completely different format | 1111'
```

**转换后：**

```
grok {  "match" => { "message => [
    '%{IPORHOST:clientip} %{DATA:process_name}\[%{NUMBER:process_id}\]: %{WORD:word_1} %{WORD:word_2} %{NUMBER:number_1} %{NUMBER:number_2} %{DATA:data}',
    '%{IPORHOST:clientip} %{DATA:process_name}\[%{NUMBER:process_id}\]: %{WORD:word_1} %{NUMBER:number_1} %{NUMBER:number_2} %{NUMBER:number_3} %{DATA:data};%{NUMBER:number_4}',
    '%{IPORHOST:clientip} %{DATA:process_name}\[%{NUMBER:process_id}\]: %{DATA:data} | %{NUMBER:number}'
    ] }
}
```



### 下面针对Apache日志来分割处理



```
192.168.10.97 - - [19/Jul/2016:16:28:52 +0800] "GET / HTTP/1.1" 200 23 "-" "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36"
```



日志中每个字段之间空格隔开，分别对应message中的字段。

如：`%{IPORHOST:addre}`  --> 192.168.10.97  



但问题是IPORHOST又不是正则表达式，怎么能匹配IP地址呢？

因为IPPRHOST是grok表达式，它代表的正则表达式如下：



```sh
IPV6 ((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?
IPV4 (?<![0-9])(?:(?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5])[.](?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5])[.](?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5])[.](?:[0-1]?[0-9]{1,2}|2[0-4][0-9]|25[0-5]))(?![0-9])
IP (?:%{IPV6}|%{IPV4})
HOSTNAME \b(?:[0-9A-Za-z][0-9A-Za-z-]{0,62})(?:\.(?:[0-9A-Za-z][0-9A-Za-z-]{0,62}))*(\.?|\b)
IPORHOST (?:%{IP}|%{HOSTNAME})
```

```
IPORHOST代表的是ipv4或者ipv6或者HOSTNAME所匹配的grok表达式。

上面的IPORHOST有点复杂，我们来看看简单点的，如USER

USERNAME [a-zA-Z0-9._-]+     

#USERNAME是匹配由字母，数字，“.”, "_", "-"组成的任意字符

USER %{USERNAME}

#USER代表USERNAME的正则表达式

第一行，用普通的正则表达式来定义一个 grok 表达式；

第二行，通过打印赋值格式，用前面定义好的 grok 表达式来定义另一个 grok 表达式。
```



```shell
filter {
  if [type] == "apache" {
    grok {
      match => ["message" => "%{IPORHOST:addre} %{USER:ident} %{USER:auth} \[%{HTTPDATE:timestamp}\] \"%{WORD:http_method} %{NOTSPACE:request} HTTP/%{NUMBER:httpversion}\" %{NUMBER:status} (?:%{NUMBER:bytes}|-) \"(?:%{URI:http_referer}|-)\" \"%{GREEDYDATA:User_Agent}\""]
      remove_field => ["message"]
    }
    date {
      match => [ "timestamp", "dd/MMM/YYYY:HH:mm:ss Z" ]
    }
  }
}
```





### **Httpd**



```sh
HTTPDUSER %{EMAILADDRESS}|%{USER}
HTTPDERROR_DATE %{DAY} %{MONTH} %{MONTHDAY} %{TIME} %{YEAR}

# Log formats
HTTPD_COMMONLOG %{IPORHOST:clientip} %{HTTPDUSER:ident} %{HTTPDUSER:auth} \[%{HTTPDATE:timestamp}\] "(?:%{WORD:verb} %{NOTSPACE:request}(?: HTTP/%{NUMBER:httpversion})?|%{DATA:rawrequest})" %{NUMBER:response} (?:%{NUMBER:bytes}|-)
HTTPD_COMBINEDLOG %{HTTPD_COMMONLOG} %{QS:referrer} %{QS:agent}

# Error logs
HTTPD20_ERRORLOG \[%{HTTPDERROR_DATE:timestamp}\] \[%{LOGLEVEL:loglevel}\] (?:\[client %{IPORHOST:clientip}\] ){0,1}%{GREEDYDATA:message}
HTTPD24_ERRORLOG \[%{HTTPDERROR_DATE:timestamp}\] \[%{WORD:module}:%{LOGLEVEL:loglevel}\] \[pid %{POSINT:pid}(:tid %{NUMBER:tid})?\]( \(%{POSINT:proxy_errorcode}\)%{DATA:proxy_message}:)?( \[client %{IPORHOST:clientip}:%{POSINT:clientport}\])?( %{DATA:errorcode}:)? %{GREEDYDATA:message}
HTTPD_ERRORLOG %{HTTPD20_ERRORLOG}|%{HTTPD24_ERRORLOG}

# Deprecated
COMMONAPACHELOG %{HTTPD_COMMONLOG}
COMBINEDAPACHELOG %{HTTPD_COMBINEDLOG}
```



### **java**

```sh
JAVACLASS (?:[a-zA-Z$_][a-zA-Z$_0-9]*\.)*[a-zA-Z$_][a-zA-Z$_0-9]*

#Space is an allowed character to match special cases like 'Native Method' or 'Unknown Source'
JAVAFILE (?:[A-Za-z0-9_. -]+)

#Allow special <init>, <clinit> methods
JAVAMETHOD (?:(<(?:cl)?init>)|[a-zA-Z$_][a-zA-Z$_0-9]*)

#Line number is optional in special cases 'Native method' or 'Unknown source'
JAVASTACKTRACEPART %{SPACE}at %{JAVACLASS:class}\.%{JAVAMETHOD:method}\(%{JAVAFILE:file}(?::%{NUMBER:line})?\)

# Java Logs
JAVATHREAD (?:[A-Z]{2}-Processor[\d]+)
JAVACLASS (?:[a-zA-Z0-9-]+\.)+[A-Za-z0-9$]+
JAVAFILE (?:[A-Za-z0-9_.-]+)
JAVALOGMESSAGE (.*)

# MMM dd, yyyy HH:mm:ss eg: Jan 9, 2014 7:13:13 AM
CATALINA_DATESTAMP %{MONTH} %{MONTHDAY}, 20%{YEAR} %{HOUR}:?%{MINUTE}(?::?%{SECOND}) (?:AM|PM)

# yyyy-MM-dd HH:mm:ss,SSS ZZZ eg: 2014-01-09 17:32:25,527 -0800
TOMCAT_DATESTAMP 20%{YEAR}-%{MONTHNUM}-%{MONTHDAY} %{HOUR}:?%{MINUTE}(?::?%{SECOND}) %{ISO8601_TIMEZONE}
CATALINALOG %{CATALINA_DATESTAMP:timestamp} %{JAVACLASS:class} %{JAVALOGMESSAGE:logmessage}

# 2014-01-09 20:03:28,269 -0800 | ERROR | com.example.service.ExampleService - something compeletely unexpected happened...
TOMCATLOG %{TOMCAT_DATESTAMP:timestamp} \| %{LOGLEVEL:level} \| %{JAVACLASS:class} - %{JAVALOGMESSAGE:logmessage}
```







### Grok Debugger

当我们拿到一段日志，按照上面的grok表达式一个个去匹配时，我们如何确定我们匹配的是否正确呢？

http://grokdebug.herokuapp.com/ 这个地址可以满足我们的测试需求。就拿上面apache的日志测试。

![grok-debugger](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/grok-debugger.png)



点击后就出现如下数据，你写的每个grok表达式都获取到值了。为了测试准确，可以多测试几条日志。





效果：

![grok-pz](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/grok-pz.png)



**kibana字段展示**：

![grok-kibana](https://xin997.oss-cn-beijing.aliyuncs.com/xinblogs/webimg-Linux/elks/grok-kibana.png)



**配置文件**：

```sh
# ---------------input 输入模块-----------------------
input {
beats {
port => 5044
}
}

# ---------------filter 过滤模块-----------------------

filter {
    grok {
        match => {
            "message" => "%{TIMESTAMP_ISO8601:times} %{HOSTNAME:hosts} %{USERNAME:logtype}: message repeated %{INT:repetition_times} times: \[ 日志类型:(?<Operation_type>(?<=)(.{4})), (?<Operation_typ1e>(?<=)(.{2})):%{USER:user}\(%{HOSTNAME:connection_method}\)\(%{HOSTNAME:connection_method}\), IP地址:%{IPV4:connection_ip}, 操作对象:%{GREEDYDATA:Action_log}, 操作类型:(?<behaviour_t>(?<=)(.{4})), 描述:(?<Behavior_performance>(?<=)(.{4}))\]"
        }
    }
}

# ---------------output 输出模块-----------------------

output {
elasticsearch {
hosts => ["http://localhost:9200"]
index => "sangfor-af-%{+YYYY.MM.dd}"
#user => "elastic"
#password => "changeme"
}
}
```









## 自定义grok表达式

grok主要有两部分：**自定义正则表达式**和**系统预定义**的模式表达式。

如果你感觉logstash自带的grok表达式不能满足需要，你也可以自己定义

如：

```sh
filter {
  if [type] == "apache" {
    grok {
      patterns_dir => "/usr/local/logstash-2.3.4/ownpatterns/patterns"
      match => {
                "message" => "%{APACHE_LOG}"
                }
      remove_field => ["message"]
    }
    date {
      match => [ "timestamp", "dd/MMM/YYYY:HH:mm:ss Z" ]
    }
  }
}

#patterns_dir为自定义的grok表达式的路径。
#自定义的patterns中按照logstash自带的格式书写。
```





```sh
APACHE_LOG %{IPORHOST:addre} %{USER:ident} %{USER:auth} \[%{HTTPDATE:timestamp}\] \"%{WORD:http_method} %{NOTSPACE:request} HTTP/%{NUMBER:httpversion}\" %{NUMBER:status} (?:%{NUMBER:bytes}|-) \"(?:%{URI:http_referer}|-)\" \"%{GREEDYDATA:User_Agent}\"

#我只是把apache日志匹配的grok表达式写入自定义文件中，简化conf文件。单个字段的正则表达式匹配你可以自己书写测试。
```





### **常用正则**

```
(?<temMsg>(.*)(?=Report)/?) 获取Report之前的字符
(?<temMsg>(?=Report)(.*)/?) 获取Report之后的字符
(?<temMsg>(?<=report).*?(?=msg)) 截取report和msg之间的值 不包含report和msg本身
(?<temMsg>(report).*?(?=msg)) 截取包含report但不包含msg
(?<temMsg>(?<=report).*?(msg)) 截取不包含report但包含msg
(?<temMsg>(report).*?(msg|request)) 输出以report开头,以msg或者以request结尾的所有包含头尾信息
(?<temMsg>(report).*?(?=(msg|request))) 输出以report开头,以msg或者以request结尾的不包含头尾信息
```





### **grok截取字符中指定长度的内容**



要求利用grok截取日志消息中某一指定长度的内容。

Logstatsh需要两个必需参数input、output，以及一个可选参数filter。input用于输入数据的设置，output用于输出数据的设置。filter是实现数据过滤的设置。grok是在filter里面实现数据截取。

项目有一串协议消息如 7e8900000c040116432693324af0010180010005e98e0706000a7e，要求利用grok截取7e后面的四个字符，利用grok正则表达式即可实现。
实现代码如下：

```sh
filter{ 
grok{ match => { 
"message" => "(?<mid>(?<=7e)(.{4}))" }
 } 
}
```

**代码解释**：

`message`：即输入的数据信息。

`mid`：即输出结果的名称

`(?<=7e)`：即表示获取7e后面的字符，但不包括7e

`(.{4})`：即表示获取的字符长度为4个 



---

**引用文章**：

[Grok 正则捕获 | Logstash 最佳实践 (yonyoucloud.com)](https://doc.yonyoucloud.com/doc/logstash-best-practice-cn/filter/grok.html)

[logstash-patterns-core (github.com)](https://github.com/logstash-plugins/logstash-patterns-core/edit/master/patterns/ecs-v1/grok-patterns)

[Logstash 常用正则（grok-patterns）qianghong000_51CTO博客](https://blog.51cto.com/qiangsh/1961434)

https://blog.51cto.com/irow10/1828077

[Logstash Grok详解_叱咤少帅的博客-CSDN博客](https://blog.csdn.net/knight_zhou/article/details/104954098)

[轻松掌握Logstash的grok匹配_全菜工程师小辉的博客-CSDN博客](https://blog.csdn.net/y277an/article/details/104897900) 

[logstash截取指定字符和grok的使用_cai750415222的博客-CSDN博客](https://blog.csdn.net/cai750415222/article/details/86614854)

