# 默认列出可用的 recipe.
[private]
default:
    @just --list

# just install
# 安装项目依赖.
install:
    pnpm install

# just typecheck
# 执行 TypeScript 类型检查, 不生成文件.
typecheck:
    pnpm run typecheck

# just build-host
# 构建 Host ESM bundle, Client bundle 和类型声明.
build-host:
    pnpm run build

# just build-client
# 构建 Client bundle, Host bundle 和类型声明.
build-client:
    pnpm run build

# just build
# 构建全部发布产物.
build:
    pnpm run build

# just test
# 执行项目测试套件.
test:
    pnpm run test

# just verify
# 执行类型检查, 构建, 测试和发布内容预览.
verify:
    just typecheck
    just build
    just test
    pnpm pack --dry-run
    node -e "const fs = require('node:fs'); const text = fs.readFileSync('lib/client.js', 'utf8'); if (!text.includes(\"id: 'dsh-cmd-send'\")) process.exit(1)"

# just clean
# 删除生成的构建产物.
clean:
    rm -rf node_modules/
    rm -rf .tmp/
