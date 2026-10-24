# -*- coding: utf-8 -*-
"""把一整部漫画目录打成一个 zip（原图原样进包，不重编码），打完自检再删源目录。

用法: python packzip.py <源目录> <输出.zip> [--keep]
输出一行 JSON 给上游解析。
"""
import argparse
import json
import os
import shutil
import sys
import zipfile


def count_files(root):
    n = 0
    for _r, _d, files in os.walk(root):
        n += len(files)
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--keep', action='store_true')
    a = ap.parse_args()

    if not os.path.isdir(a.src):
        print(json.dumps({'ok': False, 'error': 'not a dir: ' + a.src}, ensure_ascii=False))
        return 2
    src_files = count_files(a.src)
    if src_files == 0:
        print(json.dumps({'ok': False, 'error': 'empty dir'}, ensure_ascii=False))
        return 3

    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    tmp = a.out + '.part'
    if os.path.exists(tmp):
        os.remove(tmp)
    base = os.path.basename(a.src)

    try:
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for root, _dirs, files in os.walk(a.src):
                for f in sorted(files):
                    full = os.path.join(root, f)
                    rel = os.path.relpath(full, a.src).replace('\\', '/')
                    z.write(full, arcname=base + '/' + rel)
    except Exception as e:  # noqa: BLE001
        try:
            os.remove(tmp)
        except OSError:
            pass
        print(json.dumps({'ok': False, 'error': type(e).__name__ + ': ' + str(e)[:160]}, ensure_ascii=False))
        return 4

    # 自检：能打开、文件条目数对得上、路径不含 ..
    try:
        with zipfile.ZipFile(tmp, 'r') as z:
            infos = [i for i in z.infolist() if not i.is_dir()]
            bad = z.testzip()
        if bad:
            raise RuntimeError('损坏条目 ' + bad)
        if len(infos) != src_files:
            raise RuntimeError('条目数不符 %d != %d' % (len(infos), src_files))
        for i in infos:
            if '..' in i.filename.split('/'):
                raise RuntimeError('可疑路径 ' + i.filename)
    except Exception as e:  # noqa: BLE001
        try:
            os.remove(tmp)
        except OSError:
            pass
        print(json.dumps({'ok': False, 'error': 'verify failed: ' + str(e)[:160]}, ensure_ascii=False))
        return 5

    os.replace(tmp, a.out)
    size = os.path.getsize(a.out)
    removed = False
    if not a.keep:
        shutil.rmtree(a.src, ignore_errors=True)
        removed = not os.path.exists(a.src)

    print(json.dumps({
        'ok': True,
        'archive': a.out,
        'files': src_files,
        'bytes': size,
        'sourceRemoved': removed,
    }, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
