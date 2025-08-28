# Video-Gen 生产环境配置说明

## 概述
本工程配置为直接在Vercel上运行，通过环境变量连接到生产环境的Manim API服务。

## 部署架构

```
┌─────────────────┐    HTTPS         ┌─────────────────┐    HTTP        ┌─────────────────┐
│   Video-Gen     │ ────────────────→ │     Ngrok       │ ──────────────→ │   Manim API     │
│   (Vercel)      │                  │   (反向代理)    │                │   (本机8000端口) │
└─────────────────┘                  └─────────────────┘                └─────────────────┘
```

## 环境变量配置

### 必需的环境变量

1. **Supabase配置**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Ngrok配置**
   ```bash
   NGROK_URL=https://your-ngrok-url.ngrok.io
   VIDEO_GENERATION_ENDPOINT=https://your-ngrok-url.ngrok.io/generate
   VIDEO_STATUS_ENDPOINT=https://your-ngrok-url.ngrok.io/video
   ```

## 配置步骤

### 1. 自动配置（推荐）
```bash
cd video-gen
./setup-vercel-env.sh
```

### 2. 手动配置
```bash
# 设置Supabase环境变量
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# 设置Ngrok环境变量
npx vercel env add NGROK_URL production
npx vercel env add VIDEO_GENERATION_ENDPOINT production
npx vercel env add VIDEO_STATUS_ENDPOINT production
```

## 部署流程

### 1. 开发环境测试
```bash
# 本地运行
npm run dev

# 测试本地Manim API
curl http://localhost:8000/health
```

### 2. 生产环境部署
```bash
# 部署到Vercel
npx vercel --prod

# 或者推送到GitHub触发自动部署
git push origin main
```

### 3. 验证部署
```bash
# 检查环境变量
npx vercel env ls

# 测试生产环境API
curl https://your-vercel-app.vercel.app/api/health
```

## 生产环境要求

### Ngrok配置
- 确保ngrok服务正常运行
- 检查ngrok URL是否可访问
- 监控ngrok连接状态
- 注意ngrok免费版URL会变化

### 数据库
- Supabase生产环境
- 适当的备份策略
- 性能监控

### 安全性
- API密钥管理
- 请求频率限制
- 输入验证和清理

## 故障排除

### 常见问题

1. **CORS错误**
   - 检查Manim API的CORS配置
   - 确保允许Vercel域名

2. **API连接超时**
   - 检查Manim API服务器状态
   - 验证网络连接和防火墙设置

3. **环境变量未生效**
   - 重新部署应用
   - 检查Vercel环境变量设置

### 调试技巧

1. **查看Vercel日志**
   ```bash
   npx vercel logs
   ```

2. **检查环境变量**
   ```bash
   npx vercel env ls
   ```

3. **本地测试生产配置**
   ```bash
   MANIM_API_URL=https://your-api.com npm run dev
   ```

## 性能优化

### 前端优化
- 图片和视频懒加载
- 代码分割和压缩
- CDN使用

### API优化
- 请求缓存
- 响应压缩
- 连接池管理

## 监控和维护

### 健康检查
- 定期检查API状态
- 监控响应时间
- 错误率统计

### 备份策略
- 数据库定期备份
- 配置文件版本控制
- 部署回滚计划
