---
author: Ryan
title: docker 制作 tomcat 基础镜像
date: 2023-12-01
lastmod: 2023-12-01
tags:
  - docker
categories:
  - docker
expirationReminder:
  enable: false
---



## tomcat 基础镜像

```dockerfile
# Use a base image with Java 17 and Tomcat
FROM adoptopenjdk:17-jdk-hotspot

# Tomcat version to be installed
ENV TOMCAT_VERSION 10.1.16

COPY ./apache-tomcat-10.1.16.tar.gz /tmp/

# 在容器中解压缩Tomcat文件
RUN tar -xf /tmp/apache-tomcat-${TOMCAT_VERSION}.tar.gz -C /opt/ && \
    mv /opt/apache-tomcat-${TOMCAT_VERSION} /opt/tomcat && \
    rm apache-tomcat-${TOMCAT_VERSION}.tar.gz

    
# Set environment variables
ENV CATALINA_HOME /opt/tomcat
ENV PATH $CATALINA_HOME/bin:$PATH

# Expose the port that Tomcat runs on
EXPOSE 8080

# Set the working directory inside the container
WORKDIR $CATALINA_HOME

# Start Tomcat
CMD ["catalina.sh", "run"]
```




