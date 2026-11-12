# JointClear 3D 検証スクリプト

Node版 Playwright（環境にプリインストールの Chromium）で HTML を開き、`page.evaluate` で cfg を設定して
`updateUI(); generate(); draw();` を実行し、items / issues / beamLayerLevels() / cadShapes() を調べる。

## 準備
```
mkdir deps && cd deps && npm init -y && npm i three@0.161.0 rhino3dm@8.35.0   # CDN をローカル配信するため
pip install ezdxf
```
`deps/node_modules` 以外に置く場合は `JC_DEPS=<node_modules のパス>` を指定。
CDN（cdn.jsdelivr.net）への要求は `context.route` でローカルファイルに差し替える。`open(file,{offline:true})` で abort（オフライン試験）。
WebGL は `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`。

## スクリプト
| ファイル | 内容 |
|---|---|
| harness.js | ページを開く `open()`、条件を適用して結果を返す `run()` |
| matrix.js | 条件マトリクス（基礎RC/S、一般部、礎柱、杭、梁、調整、JSON往復）を JSON に保存。`node matrix.js <html> <out.json>` |
| t_baseline.js | 初期モデルの干渉件数と組合せ別内訳 |
| t_unresolved.js | 未解決1〜4の再現（フック高さ・向き、S柱範囲、cornerN、断面不足時のフープ） |
| t_export.js | DXF・3DM出力と3D表示（オンライン／オフライン） |
| t_proto1.js | 未解決1の修正案をページ内で仮に差し替えた試算（ファイルは変更しない） |
| chk_dxf.py | ezdxf の readfile / recover / audit |
| chk_3dm.js | rhino3dm で 3DM を再読込（オブジェクト数・単位・閉形状・レイヤ） |

`baseline/matrix_v1.9.json` は v1.9 の基準結果。修正版との差分比較に使う。
