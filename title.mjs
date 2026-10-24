#!/usr/bin/env node
// 按编号只回标题和作者，别的一律不读不报（标签、页数、封面、简介、赞数都不碰）。
// 用法: node runtime/comic/title.mjs 268607
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'D:/dsh-private'
const PY = path.join(ROOT, 'runtime/jmcomic-venv/Scripts/python.exe')
const BRIDGE = path.join(ROOT, 'agent-home/dsh-home/profiles/desktop/node_modules/dsh-jmcomic/vendor/scripts/bridge.py')
const LIB = path.join(ROOT, 'data/comic-library')

const id = (process.argv[2] || '').trim()
if (!/^\d+$/.test(id)) {
  console.log('用法: node runtime/comic/title.mjs <编号>')
  process.exit(2)
}
if (!fs.existsSync(PY) || !fs.existsSync(BRIDGE)) {
  console.log('查不了：缺 python 或 bridge')
  process.exit(3)
}

const r = spawnSync(PY, [BRIDGE, 'album', id, '--base-dir', LIB], {
  encoding: 'utf8',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  timeout: 120000,
})
let j = null
try { j = JSON.parse((r.stdout || '').trim()) } catch { /* ignore */ }
if (!j) { console.log('查不了，稍后再试'); process.exit(4) }
if (!j.ok) {
  const e = String(j.error || '')
  if (/MissingAlbumPhotoException|不存在/.test(e)) console.log('这个编号查不到')
  else if (/登录用户|cookies|cookie/i.test(e)) console.log('这本要登录才能看')
  else console.log('查询失败，稍后再试')
  process.exit(5)
}

const d = j.data || {}
const title = String(d.title || '').trim()
const author = String(d.author || '').trim()
console.log(`${d.id ?? id}｜${title || '(无标题)'}`)
console.log(`作者 ${author || '未知'}`)
