# dsh-jmcomic-tools

按编号（车牌号）下载一本漫画、打包成 zip、只查标题和作者的小工具集。给 DeepSeek Harness 用的本地脚本，不是插件本体。

## 依赖

- Node.js ≥ 20
- Python 3.11+，装 `py7zr`（可选，7z 打包用）
- 下载内核来自 [dsh-jmcomic](https://www.npmjs.com/package/dsh-jmcomic)（内置 jmcomic），本仓库只做薄封装

## 脚本

| 文件 | 用途 |
|---|---|
| `fetch.mjs` | 下整本 → 原图打成一个 zip（自检条目数/路径）→ 删源目录；归档只增不删 |
| `packzip.py` | 目录 → zip，打完自检 |
| `title.mjs` | 只回标题和作者，别的字段不读 |

## 用法

```bash
node fetch.mjs 268607 --verbose
node title.mjs 268607
```

`fetch.mjs` 里把 `ROOT`、`PY`、`BRIDGE` 三个常量改成你自己机器的路径。

## 说明

- 只做下载和归档，不负责内容分发。
- 下载内容版权归原作者，自行判断用途。
