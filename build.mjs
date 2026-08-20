/**
 * dsh-cmd-send 单文件构建: Host 端 ESM + Client 端 CJS bundle.
 *
 * web server 为每个插件只提供一份文件 (/plugins/dsh-cmd-send/client.js),
 * 因此 client 半部是包裹在 ModuleLoader factory 握手里的 CJS bundle;
 * @deepseek-ai/dsh-* 与 react 保持外部 (由 app 的模块系统提供). Host 半部
 * 为纯 ESM, 面向 Node, 外部化 @deepseek-ai/dsh-* 与 cordis, 打包 schemastery
 * (Loader 会以 schema 校验 Config).
 */
import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'

mkdirSync('lib', { recursive: true })

const dshExternal = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-*']

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  sourcemap: true,
  external: dshExternal,
  logLevel: 'info',
})

await build({
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  jsx: 'automatic',
  external: [...dshExternal, 'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
  banner: {
    js: "window.__ModuleLoader__.load({ id: 'dsh-cmd-send', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
  },
  footer: {
    js: 'return module.exports; } });',
  },
  logLevel: 'info',
})

import { execFileSync } from 'node:child_process'
execFileSync('node_modules/.bin/tsc', ['-p', 'tsconfig.json'], { stdio: 'inherit' })
