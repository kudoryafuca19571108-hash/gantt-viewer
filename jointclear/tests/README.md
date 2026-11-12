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
| t_v20.js | v2.0 固有の確認（旧JSON読込、通し／定着、フック方向、定着長警告、選択の不具合、cornerN=3 対称性、UI） |
| t_touch.js | CDP タッチ（1本指ドラッグ、2本目の指で取消＋ピンチ）、3DM 連続出力、3D スクリーンショット |
| diff_matrix.js | 2つの matrix JSON の差分（干渉ペア・線分座標・躯体形状・段レベル・警告） |
| cmp_dxf.py | 2つの DXF の幾何（レイヤ別の線・円・ポリライン・文字）を比較 |
| chk_dxf.py | ezdxf の readfile / recover / audit |
| chk_3dm.js | rhino3dm で 3DM を再読込（オブジェクト数・単位・閉形状・レイヤ） |

`baseline/matrix_v1.9.json`・`baseline/matrix_v2.0.json` は各版の基準結果。`node diff_matrix.js baseline/matrix_v1.9.json baseline/matrix_v2.0.json` で差分を確認する。

注意：matrix.js は DEFAULT に条件を上書きして実行するため、v2.0 で一般部RCの初期値（下部柱レベル・通し）が変わった影響は G-RC 系の条件に現れる。
