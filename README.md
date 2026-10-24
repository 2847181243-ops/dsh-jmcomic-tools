# dsh-jmcomic-tools

鎸夌紪鍙凤紙杞︾墝鍙凤級涓嬭浇涓€鏈极鐢汇€佹墦鍖呮垚 zip銆佸彧鏌ユ爣棰樺拰浣滆€呯殑灏忓伐鍏烽泦銆傜粰 DeepSeek Harness 鐢ㄧ殑鏈湴鑴氭湰锛屼笉鏄彃浠舵湰浣撱€?
## 渚濊禆

- Node.js 鈮?20
- Python 3.11+锛岃 `py7zr`锛堝彲閫夛紝7z 鎵撳寘鐢級
- 涓嬭浇鍐呮牳鏉ヨ嚜 [dsh-jmcomic](https://www.npmjs.com/package/dsh-jmcomic)锛堝唴缃?jmcomic锛夛紝鏈粨搴撳彧鍋氳杽灏佽

## 鑴氭湰

| 鏂囦欢 | 鐢ㄩ€?|
|---|---|
| `fetch.mjs` | 涓嬫暣鏈?鈫?鍘熷浘鎵撴垚涓€涓?zip锛堣嚜妫€鏉＄洰鏁?璺緞锛夆啋 鍒犳簮鐩綍锛涘綊妗ｅ彧澧炰笉鍒?|
| `packzip.py` | 鐩綍 鈫?zip锛屾墦瀹岃嚜妫€ |
| `title.mjs` | 鍙洖鏍囬鍜屼綔鑰咃紝鍒殑瀛楁涓嶈 |

## 鐢ㄦ硶

```bash
node fetch.mjs 268607 --verbose
node title.mjs 268607
```

`fetch.mjs` 閲屾妸 `ROOT`銆乣PY`銆乣BRIDGE` 涓変釜甯搁噺鏀规垚浣犺嚜宸辨満鍣ㄧ殑璺緞銆?
## 璇存槑

- 鍙仛涓嬭浇鍜屽綊妗ｏ紝涓嶈礋璐ｅ唴瀹瑰垎鍙戙€?- 涓嬭浇鍐呭鐗堟潈褰掑師浣滆€咃紝鑷鍒ゆ柇鐢ㄩ€斻€?
