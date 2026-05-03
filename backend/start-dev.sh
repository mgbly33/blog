#!/bin/bash
# 开发环境启动脚本
# 自动设置 Java 17 并以 dev profile 启动后端

# 设置 Java 17 路径
cd ~
JAVA_HOME="$(pwd)/.jdks/corretto-17.0.12-1"
PATH="$JAVA_HOME/bin:/h/apache-maven-3.5.3/bin:$PATH"

# 切换到后端目录
cd "E:/接单/WebstormProjects/blog/backend"

echo "使用 Java 版本:"
java -version

echo ""
echo "启动后端 (dev profile)..."
echo ""

# 以 dev profile 启动
mvn spring-boot:run -Dspring-boot.run.profiles=dev
