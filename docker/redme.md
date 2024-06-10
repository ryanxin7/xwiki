# 构建Docker镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/xxk8s/vk:$(date +%Y%m%d%H%M%S) .

docker push  registry.cn-hangzhou.aliyuncs.com/xxk8s/vk:$(date +%Y%m%d%H%M%S)


# 运行Docker容器
docker run -p 80:80 my-docusaurus-site


docker push  registry.cn-hangzhou.aliyuncs.com/xxk8s/vk:v0.0.1

docker run -d -p 80:80 --rm registry.cn-hangzhou.aliyuncs.com/xxk8s/vk:v0.0.1

docker run -d --name wiki -p 80:80 registry.cn-hangzhou.aliyuncs.com/xxk8s/vk:20240609154408

docker run -d --name wiki -p 80:80 registry.cn-hangzhou.aliyuncs.com/xxk8s/vk:20240609155730