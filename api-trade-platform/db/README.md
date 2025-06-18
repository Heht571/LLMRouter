# 数据库初始化说明

## 自动初始化

现在数据库表结构会在PostgreSQL容器首次启动时自动创建。`ddl.sql` 文件已经配置为初始化脚本。

## 重新初始化数据库

如果需要重新初始化数据库（清空所有数据并重新创建表结构），请按以下步骤操作：

### 1. 停止并删除现有容器和数据卷

```bash
# 停止容器
docker-compose down

# 删除数据卷（这会清空所有数据）
docker volume rm api-trade-platform_postgres_data
docker volume rm api-trade-platform_redis_data
```

### 2. 重新启动服务

```bash
# 重新启动所有服务
docker-compose up -d
```

### 3. 验证表是否创建成功

```bash
# 检查数据库表
docker exec -it api_trade_postgres psql -U admin -d api_trade_db -c "\\dt"
```

## 注意事项

- 删除数据卷会永久删除所有数据，请谨慎操作
- 在生产环境中，建议使用数据库迁移工具而不是直接删除数据卷
- 初始化脚本只在容器首次创建时执行，如果容器已存在，需要删除数据卷后重新创建