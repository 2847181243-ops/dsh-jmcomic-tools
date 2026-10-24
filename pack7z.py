# -*- coding: utf-8 -*-
"""把一整部漫画目录打成一个 .7z，打完自检（能列目录、条目数对得上），再报结果。

用法: python pack7z.py <源目录> <输出.7z> [--level 5] [--keep]
输出一行 JSON 给上游解析。--keep 表示打包后不删源目录。
"""
import argparse
import json
import os
import sys

import py7zr


def count_files(root):
    n = 0
    for _r, _d, files in os.walk(root):
        n += len(files)
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--level', type=int, default=5)
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

    try:
        filters = [{'id': py7zr.FILTER_LZMA2, 'preset': a.level}]
        with py7zr.SevenZipFile(tmp, 'w', filters=filters) as z:
            z.writeall(a.src, arcname=os.path.basename(a.src))
    except Exception as e:  # noqa: BLE001
        try:
            os.remove(tmp)
        except OSError:
            pass
        print(json.dumps({'ok': False, 'error': type(e).__name__ + ': ' + str(e)[:160]}, ensure_ascii=False))
        return 4

    # 自检：能打开、文件条目数对得上、路径不含 ..
    try:
        with py7zr.SevenZipFile(tmp, 'r') as z:
            infos = z.list()
        names = [i.filename for i in infos]
        file_entries = [i for i in infos if not i.is_directory]
        if len(file_entries) != src_files:
            raise RuntimeError('条目数不符 %d != %d' % (len(file_entries), src_files))
        for n in names:
            if '..' in n.replace('\\', '/').split('/'):
                raise RuntimeError('可疑路径 ' + n)
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
        import shutil
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
