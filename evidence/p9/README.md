# フェーズ9: 普段使うキーの不足チェック (2026-10-05、開発サーバーで確認)

`src/lib/essential-keys.ts`(必須キー55項目の判定)と、`src/components/editor/LayoutEditor.tsx` の保存前チェックの確認。
確認はヘッドレスChromeを DevTools Protocol で操作するスクリプトで行った(開発サーバーは本番と同じSupabaseにつながっているため、保存したテスト投稿は「一覧に出さない」印付きで本番DBに入った。確認後、人間の承認を得て削除した)。

## 単体テスト

`npm test` 22ファイル182件成功(`src/lib/__tests__/essential-keys.test.ts` 7件を含む)。`npx tsc --noEmit`・`eslint`・`npm run build` も成功。

## 画面での確認

1. `/new?keyboard=orca-echo` でタイトルだけ付けて保存 → 確認(window.confirm)が表示された:
   > 次のキーがこの配列のどこにもありません: `` ` ``、=、[、]、\、;、'、/、BackSpace、Space
   > 普段使うキーボードで使う入力が入っているか確認してください。このまま保存しますか?

   (Orca echoの工場出荷時配列は、Shiftキーで変わる記号・BackSpace・Spaceを印字どおりに記録していないため、これらが不足として出るのは想定どおり)

2. Qキーの表示名を「テスト用」に変更して保存 → 確認に「Q」が追加されて表示された。
3. 確認で「OK」を選ぶと、保存がそのまま続行され、共有URL(`/k/QJz2RfYKfu0`)が発行された(保存はブロックされない)。
4. 保存されたテスト投稿は `is_listed: false`(一覧に出ない)で本番DBに作られたことを確認し、人間の承認を得て削除した。
