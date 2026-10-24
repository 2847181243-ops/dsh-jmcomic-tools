#!/usr/bin/env node
// 下整本 → 压缩 → 确认 → 挪进归档目录；归档里只留最新一本，上一个任务连同临时目录一起清掉。
// 只给白本人用。用法: node runtime/comic/fetch.mjs 268607 [--verbose]
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = 'D:/dsh-private'
const PY = path.join(ROOT, 'runtime/jmcomic-venv/Scripts/python.exe')
const BRIDGE = path.join(ROOT, 'agent-home/dsh-home/profiles/desktop/node_modules/dsh-jmcomic/vendor/scripts/bridge.py')
const LIB = path.join(ROOT, 'data/comic-library')
const ARCHIVE = path.join(ROOT, 'data/comic-archive')
// runtime/ 下对沙箱子进程可能不可写，临时输出固定放系统临时目录
const TMP = os.tmpdir()

// 沙箱里 node 的 spawnSync 用默认 pipe 抓子进程输出会 EPERM（named pipe 被禁）。
// 所以把 stdout/stderr 重定向到临时文件（fd 继承，不是 pipe），再从文件读 JSON。
function runPython(scriptArgs, timeout) {
  const tag = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const outFile = path.join(TMP, `jmcomic-${tag}.out`)
  const errFile = path.join(TMP, `jmcomic-${tag}.err`)
  const fdOut = fs.openSync(outFile, 'w')
  const fdErr = fs.openSync(errFile, 'w')
  let status = null
  try {
    const r = spawnSync(PY, scriptArgs, {
      stdio: ['ignore', fdOut, fdErr],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      timeout,
    })
    status = r.status
    if (r.error) fs.appendFileSync(errFile, `\nspawn error: ${r.error.message}\n`)
  } finally {
    fs.closeSync(fdOut)
    fs.closeSync(fdErr)
  }
  let stdout = ''
  let stderr = ''
  try { stdout = fs.readFileSync(outFile, 'utf8') } catch { /* ignore */ }
  try { stderr = fs.readFileSync(errFile, 'utf8') } catch { /* ignore */ }
  try { fs.rmSync(outFile, { force: true }); fs.rmSync(errFile, { force: true }) } catch { /* ignore */ }
  return { status, stdout, stderr }
}

// 日志行和 JSON 可能混在同一个流里，只认最后一个能解析出 ok 字段的 JSON 行
function pickJson(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith('{'))
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const j = JSON.parse(lines[i])
      if (j && typeof j === 'object') return j
    } catch { /* ignore */ }
  }
  return null
}

function wipeDir(dir) {
  let n = 0
  if (!fs.existsSync(dir)) return n
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    fs.rmSync(path.join(dir, e.name), { recursive: true, force: true })
    n++
  }
  return n
}

// 库目录下现有的子目录名（下载前后对比，用来认出“刚下的那本”）
function subDirs() {
  try {
    return fs.readdirSync(LIB, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}

const args = process.argv.slice(2)
const verbose = args.includes('--verbose')
const levelIdx = args.indexOf('--level')
const level = levelIdx >= 0 ? String(args[levelIdx + 1] || '5') : '5'
const id = (args.find((a) => /^\d+$/.test(a)) || '').trim()
if (!id) {
  console.log('用法: node runtime/comic/fetch.mjs <编号>')
  process.exit(2)
}

// 1. 下载
const before = subDirs()
const r = runPython([BRIDGE, 'download', id, '--base-dir', LIB], 1800000)
const j = pickJson(r.stdout) || pickJson(r.stderr)
if (!j || !j.ok) {
  console.log(`下不了 ${id}`)
  if (verbose && r.stderr) console.log(String(r.stderr).slice(0, 300))
  process.exit(5)
}
console.log(`下好了 ${id}`)

// 2. 刚下的这本落在哪：先看 bridge 报的路径，再比目录差集（标题里有换行，猜名字不可靠），最后才按标题猜
const d = j.data || {}
let albumDir = null
const sp = String(d.save_path || '')
if (sp && fs.existsSync(sp)) albumDir = fs.statSync(sp).isDirectory() ? sp : path.dirname(sp)
if (!albumDir) {
  const after = subDirs()
  const fresh = after.filter((n) => !before.includes(n))
  const pool = fresh.length ? fresh : after
  const cands = pool
    .map((n) => path.join(LIB, n))
    .map((p) => ({ p, t: (() => { try { return fs.statSync(p).mtimeMs } catch { return 0 } })() }))
    .sort((a, b) => b.t - a.t)
  if (cands.length) albumDir = cands[0].p
}
if (!albumDir) {
  const guess = path.join(LIB, String(d.title || '').replace(/[\\/:*?"<>|\r\n\t]/g, '_'))
  if (fs.existsSync(guess)) albumDir = guess
}
if (!albumDir || path.resolve(albumDir) === path.resolve(LIB) || !fs.existsSync(albumDir)) {
  console.log('找不到刚下的目录，没动别的')
  process.exit(6)
}

// 3. 原图直接打成一个 zip（脚本内部自检：能解、条目数对得上、路径不含 ..，通过才删源目录）
fs.mkdirSync(ARCHIVE, { recursive: true })
const out = path.join(ARCHIVE, path.basename(albumDir) + '.zip')
const pack = runPython([path.join(ROOT, 'runtime/comic/packzip.py'), albumDir, out], 3600000)
const p = pickJson(pack.stdout)
if (!p || !p.ok) {
  console.log('打包没成功，源目录留着')
  if (verbose) console.log(String(pack.stderr || pack.stdout || '').slice(0, 300))
  process.exit(7)
}
if (verbose) console.log(`打包 ${p.files} 个文件 → ${(p.bytes / 1048576).toFixed(1)} MB`)

// 4. 归档里只增不删：旧的 zip 全留着（白 2026-10-24 定），下载目录里剩下的也不动
if (verbose) {
  const kept = fs.readdirSync(ARCHIVE).filter((n) => path.resolve(path.join(ARCHIVE, n)) !== path.resolve(out))
  console.log(`归档 ${path.basename(out)}；归档里还有 ${kept.length} 个旧包没动`)
}
