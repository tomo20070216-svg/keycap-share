<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — この地図の使い方

これは「百科事典」ではなく「案内図」です。詳しい内容は他のファイルにあります。
**どのAI(Claude Code、他のAIツール、人間)が読んでも、この順番で読めば作業を再開できます。**

## 0. 用語（初心者向け）

- **ハーネス**: AIが迷わず・暴走せず・引き継げるように作業手順とルールをまとめた仕組みのこと。
- **成果物 (evidence)**: 「できました」という発言ではなく、実際のファイル・テスト結果・スクリーンショットなど、確認できる証拠のこと。
- **フェーズ**: `plan.md` に書かれた作業の区切り(フェーズ0〜6)。

## 1. 最初に読む順番

1. `docs/safety.md` — 何が禁止で、何に人間の許可が要るか(最初に確認。事故防止のため)
2. `progress.md` — 最後に誰が何をしたか(一番下=最新)
3. `tasks.json` — 今どのタスクが `in_progress` か
4. `plan.md`(プロジェクト直下) — 仕様の正本(最終的な正しい情報源)
5. `docs/requirements.md` — `plan.md` を作業用に噛み砕いた版
6. `docs/mission.md` — 何のために作るか、譲れない方針
7. `docs/voice.md` — 画面の文言・共有文のトーン
8. `evals/acceptance.md` — 各フェーズの合格基準と確認方法
9. `docs/keyboards/orca-echo.md` — Orca echo の実機情報(人間が確認したキー数・並び)

## 2. 正しい情報源(信頼できる情報の順位)

矛盾が起きたときは、上にあるものを優先します。

1. `plan.md`(プロジェクト直下) — 仕様の最終決定。**人間だけが書き換えてよい。**
2. `docs/safety.md` — 安全ルール。**人間の承認なしにAIが書き換えてはいけない。**
3. `docs/keyboards/*.md` の「人間が確認済み」と書かれた項目 — 実機の事実。AIが推測で上書きしてはいけない。
4. `docs/requirements.md` / `docs/mission.md` / `docs/voice.md` — 上記と矛盾しない範囲でAIが更新してよい。
5. `tasks.json` の `passes`(合格条件) — **AIは追加はできるが、既存の条件を削除・弱体化してはいけない。** 変更には人間の承認が要る。
6. AI自身の発言・チャット履歴 — 情報源として扱わない(消えるため)。

## 3. 役割(最大3つ、詳細は各ドキュメント末尾および本ファイル末尾)

| 役割 | 担当 | 詳細 |
|---|---|---|
| 計画役 Planner | タスク分解・優先順位・質問の整理 | 本ファイル末尾参照 |
| 実行役 Executor | 実装・テスト実行・証拠の記録 | 本ファイル末尾参照 |
| 評価役 Reviewer | 合格判定・検品 | 本ファイル末尾参照 |

1人のAI(あなた)が全役割を兼任してよいですが、**役割を切り替えるときは「今から評価役として確認します」のように宣言してください。** 実行役が自分の仕事を自分で合格判定しない(自己採点しない)ためです。

## 4. セッションが切れた場合の引き継ぎ手順

新しいAI(または新しいセッション)は、必ず次の手順で再開してください。

1. `docs/safety.md` を読み、禁止事項を把握する。
2. `progress.md` の最新エントリを読み、直前に何が起きたかを把握する。
3. `tasks.json` で `status: "in_progress"` のタスクを探す。
   - あれば: そのタスクの `evidence` を確認し、完了しているように見えても、証拠が揃っていなければ完了と見なさず続きから行う。
   - なければ: `status: "todo"` かつ `dependencies` がすべて `done` のタスクの中から最小のIDのものに着手する。
4. `progress.md` に新しいエントリを追記してから作業を始める(「引き継ぎました」の1行でよい)。
5. 不明点があれば、推測で進めずに人間に質問する(`plan.md` 2章の方針6、`docs/safety.md` 参照)。

## 5. 失敗したときの戻し方

- コードの失敗: 直前の正常なコミットに `git revert`(履歴を残す取り消し)で戻す。`git reset --hard` は使わない(履歴が消えるため)。
- データベース(Supabase)の失敗: 本番に反映済みなら人間に報告し、指示を待つ(**人間の承認が必要な操作**)。ローカル/開発環境のみなら、マイグレーションを戻すか作り直す。
- 判断に迷う失敗: `tasks.json` の該当タスクを `status: "blocked"` にし、`evidence` に失敗内容(エラーメッセージ、再現手順)を記録し、`progress.md` に報告して人間の判断を待つ。
- どの戻し方も、`docs/safety.md` の「絶対に行ってはいけない操作」に反しないことを確認してから実行する。

## 6. 改善の蓄積方法

- 作業中に気づいた「次はこうした方がいい」は、`progress.md` の各エントリ末尾の「学び」欄に書く。
- 同じ学びが2回以上出てきたら、計画役がそれをルール化し、`docs/voice.md`(文言のルール)か `docs/safety.md`(安全のルール)に昇格させる(この昇格には人間の承認が要る。安全ルールの変更のため)。
- `plan.md` 自体の方針変更が必要だと分かった場合は、AIが書き換えるのではなく、人間に変更案を提示する。

## 7. 役割の詳細定義

### 計画役 (Planner)
- **担当**: `plan.md` を読み `tasks.json` にタスクを追加・並べ替える。次に着手すべきタスクを1つ提案する。不明点を質問としてまとめる。
- **担当しない**: コードの実装。合格判定。
- **最初に読む資料**: `plan.md`, `docs/requirements.md`, `tasks.json`, `progress.md`
- **使える道具**: ファイル読み書き(`tasks.json`, `progress.md`, `docs/*.md` の追記のみ)。コード実行はしない。
- **返す成果物**: 更新された `tasks.json`、次の1タスクの提案、質問リスト(あれば)。
- **完了条件**: 次に着手可能なタスクが1つ以上 `todo` 状態で存在し、それぞれに `passes`(合格条件)が書かれている。

### 実行役 (Executor)
- **担当**: `tasks.json` の1タスクを実装し、テスト・動作確認を行い、証拠を集めて `evidence` に記録する。
- **担当しない**: タスクの合否判定(自己採点しない)。`passes`(合格条件)の変更。`docs/safety.md` で人間承認が必要とされる操作の実行。
- **最初に読む資料**: 着手する `tasks.json` の該当エントリ、`docs/requirements.md`、`docs/voice.md`(画面文言を書く場合)、`docs/safety.md`
- **使える道具**: コード編集、テスト実行、ローカルでのビルド・起動確認、`git commit`(ローカルのみ。`git push` は人間の承認が必要)。
- **返す成果物**: 実装差分、テスト結果ログ、`tasks.json` の `evidence` 更新(`status` は `in_progress` → `review待ち` に相当する状態にし、`done` にはしない)。
- **完了条件**: `passes` に書かれた条件をすべて満たす証拠を `evidence` に記録し終えた状態。

### 評価役 (Reviewer)
- **担当**: 実行役が出した `evidence` が `passes`(合格条件)を満たすか確認し、`tasks.json` の `status` を `done` または `blocked` に更新する。
- **担当しない**: 実装。タスクの追加・削除。
- **最初に読む資料**: 該当タスクの `passes` と `evidence`、`evals/acceptance.md`
- **使える道具**: テストの再実行、ビルド確認、`evals/acceptance.md` に書かれた確認手順の実施。ファイルの書き換えは `tasks.json` の `status` 欄のみ。
- **返す成果物**: 合否判定と理由、不合格の場合は不足している証拠の具体的な指摘。
- **完了条件**: `tasks.json` の `status` が `done`(証拠が十分)または `blocked`(不足点を明記)に更新されている。
