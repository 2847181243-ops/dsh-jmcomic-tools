# dsh-jmcomic-tools

按编号下载一本漫画、把原图打成一个 zip、只查标题和作者的小工具集。当前适配 **DeepSeek Harness 0.2.2-rc.3**（兼容声明为 `>=0.2.0-rc.2 <0.3.0`）。

## 依赖

- Node.js ≥ 22.19（DSH 0.2.2 的运行时要求）
- Python 3.11+，装 `py7zr`（可选，7z 打包用）
- 下载内核来自 [dsh-jmcomic](https://www.npmjs.com/package/dsh-jmcomic)（内置 jmcomic），本仓库只做薄封装

## 安装

```bash
dsh plugin --profile desktop add link:<本仓库绝对路径>
```

装完重启 DSH。插件壳只负责加载；下载和查询仍走下面的 CLI / skills。

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

默认路径还是旧工作区 `D:/dsh-private`，但不再写死在代码里，换机器时用环境变量覆盖：

| 变量 | 作用 |
|---|---|
| `DSH_JMCOMIC_ROOT` | 工作区根目录 |
| `DSH_JMCOMIC_PYTHON` | Python 解释器 |
| `DSH_JMCOMIC_BRIDGE` | `dsh-jmcomic/vendor/scripts/bridge.py` |
| `DSH_JMCOMIC_LIBRARY` | 下载目录 |
| `DSH_JMCOMIC_ARCHIVE` | zip 归档目录 |
| `DSH_JMCOMIC_PACKZIP` | `packzip.py` 路径（默认取包内文件） |

两个脚本都改成临时文件继承 fd，避免 DSH 沙箱里 `spawnSync` 默认 pipe 触发 EPERM。

## 说明

- 只做下载和归档，不负责内容分发。
- 下载内容版权归原作者，自行判断用途。
