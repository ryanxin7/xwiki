#!/bin/bash

# 获取当前日期时间戳
TAG=$(date +%Y%m%d%H%M%S)

# 定义镜像名称
IMAGE_NAME="registry.cn-hangzhou.aliyuncs.com/xxk8s/vk:$TAG"

# 构建 Docker 镜像
docker build -t $IMAGE_NAME .

# 检查构建是否成功
if [ $? -ne 0 ]; then
  echo "Docker build failed"
  exit 1
fi

# 推送 Docker 镜像
docker push $IMAGE_NAME

# 检查推送是否成功
if [ $? -ne 0 ]; then
  echo "Docker push failed"
  exit 1
fi

echo "Docker image $IMAGE_NAME built and pushed successfully"