#!/bin/bash
# 保德方言词典 - 一键启动脚本
# 用法: bash start.sh

export PATH="/Users/cuishuandong/.workbuddy/binaries/node/versions/22.22.2/bin:$PATH"
cd "$(dirname "$0")"

# 杀掉旧进程
pkill -f "node.*server/src/index.js" 2>/dev/null
sleep 1

# 如果前端没构建过，先构建
if [ ! -f "web/dist/index.html" ]; then
  echo "首次运行，正在构建前端..."
  cd web && npm run build && cd ..
fi

# 启动服务器（前端+API 同一个端口）
echo "正在启动..."
nohup /Users/cuishuandong/.workbuddy/binaries/node/versions/22.22.2/bin/node server/src/index.js > /tmp/baode.log 2>&1 &
disown
sleep 3

# 验证
if curl --noproxy '*' -s --max-time 3 http://localhost:8787/api/health | grep -q "ok"; then
  echo ""
  echo "✅ 启动成功！"
  echo "   网站地址: http://localhost:8787"
  echo "   后台登录: http://localhost:8787/admin/login"
  echo "   账号: admin  密码: admin123"
  echo ""
else
  echo "❌ 启动失败，查看日志: cat /tmp/baode.log"
fi
