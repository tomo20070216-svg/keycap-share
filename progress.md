# progress.md — 作業ログ(追記のみ・一番下が最新)

書き方のルール:
- 新しいエントリは一番下に追記する(過去のエントリは書き換えない・消さない)。
- 日付は絶対日付で書く(「今日」「昨日」は使わない)。
- 各エントリの最後に「学び」欄を書く(なくても「特になし」と書く)。

---

## 2026-09-28 — ハーネス設計(計画役)

- `plan.md`(実装指示書)を読み込み、ハーネス一式を作成した: `AGENTS.md`, `CLAUDE.md`, `docs/mission.md`, `docs/requirements.md`, `docs/voice.md`, `docs/safety.md`, `tasks.json`, `evals/acceptance.md`, 本ファイル。
- `SKILL.md` は今回作成しなかった(理由: 現時点では `AGENTS.md` が入口として十分機能し、スラッシュコマンド化の必要性が薄いため。必要になれば追加提案する)。
- **重要な問題を発見**: このプロジェクトフォルダ (`C:\Users\yoshino\Desktop\エンジニア\キー配列共有`) の `git status` を確認したところ、gitリポジトリのルートが `C:\Users\yoshino`(ホームフォルダ全体)になっていることが判明した。同じリポジトリに無関係な別プロジェクト(`../vivinity/QR_MVP` 配下)や、`.ssh`, `.config`(APIキー等の秘密情報を含みうる)、その他個人ファイルが大量に未追跡ファイルとして存在している。
  - このままフェーズ0で `git commit` を進めると、意図せず無関係・機密なファイルを巻き込む危険がある。
  - 対応方針は `tasks.json` の `P0-1` として人間への確認タスクを登録した。人間の回答があるまで、このフォルダ配下で `git add -A` のような広い範囲のステージングは行わない。
- `tasks.json` はフェーズ0のみ詳細化し、フェーズ1以降は計画役が都度追加するプレースホルダとした(先の工程を詳細化しすぎて無駄にしないため)。

**学び**: 新規プロジェクトのハーネスを作る前に、まず `git status` / `git rev-parse --show-toplevel` 相当の確認を行い、リポジトリ構成の異常を早期発見すべき。今後、他プロジェクトでも土台構築(フェーズ0)の最初のタスクにこの確認を含める。

---

## 2026-09-28 — P0-1完了: 独立gitリポジトリの作成(実行役)

- 人間が対応方針として「このフォルダ内に新しい独立リポジトリを作る(推奨)」を選択。
- `キー配列共有/` フォルダ内で `git init` を実行し、独立リポジトリ化した(ホームフォルダ側の既存リポジトリには触れていない)。
- `.gitignore` を作成(node_modules, .next, .env系, OS生成ファイルを除外)。
- ハーネス関連ファイルのみを明示的に `git add` し、初回コミット `eb71606` を作成。未追跡の `スクリーンショット 2026-09-28 171529.png` は用途不明のため意図的にコミット対象外とした(必要であれば人間に用途を確認してから追加する)。
- `tasks.json` の `P0-1` を `done` に更新、`evidence` に確認内容を記録。

**学び**: 特になし。

---

## 2026-09-28 — P0-0 一部回答: Orca echo 実機情報(計画役)

- 人間が実機写真(`スクリーンショット 2026-09-28 171529.png`)を提供。`docs/keyboards/orca-echo-photo.png` にコピーした(元ファイルはそのまま)。
- AIの初回読み取りには誤りがあり、人間が訂正した:
  - 左手: B の右隣に fn2(人差し指用)。Ctrl の右と fn1 の右(少し斜め)に印字のないキーがある。
  - 右手3段目: B → N → M → , → . → ( → )。B は人差し指用。
  - ダイヤルは回転のみ(押し込みなし)。スクロールパッドは上下2キー相当+タップ。
  - 赤い印字は fn1 を押している間の文字。fn2 も同様。
- 訂正後の数え上げで左25+右24=49となり、人間の申告(49キー)と一致。`docs/keyboards/orca-echo.md` に記録。
- `CLAUDE.md` の「gitリポジトリ問題が未解決」という古い記述を、現状(独立リポジトリ作成済み)に合わせて更新。
- P0-0 は `in_progress`。残り: Xログインの採用可否、無料枠の方針。

**学び**: 写真からの読み取りは、印字のないキーや人差し指側の追加列を見落としやすい。数え上げの合計が人間の申告と一致するかで検算すると、誤りに気づける。

---

## 2026-09-28 — P0-3完了: Next.jsプロジェクトの土台作成(実行役 → 評価役)

- `create-next-app@16.3.6` でプロジェクトをscaffold(TypeScript, Tailwind CSS, App Router, `src/`ディレクトリ, ESLint, import alias `@/*`)。
- 日本語フォルダ名(`キー配列共有`)はnpmパッケージ名に使えず生成が失敗したため、一時フォルダで `keycap-share` として生成し、`node_modules` を除く生成物をプロジェクトフォルダへ移動、その後 `npm install` を実行して依存関係を解決した。
- `create-next-app` が自動生成した `AGENTS.md`(Next.js 16の破壊的変更に関する注意書き)と `CLAUDE.md`(`@AGENTS.md`への参照のみ)が既存のハーネスファイルと衝突。`CLAUDE.md`は既存のもので十分役割を果たしているため据え置き、`AGENTS.md`の注意書きは有用なので既存のAGENTS.mdの冒頭に統合した。
- `npm run build` 成功、`npm run dev` 起動後 `curl` でHTTP 200を確認、確認後にプロセスを停止。
- **トラブル**: 最後の `git add`(ステージング)が、Claude Codeの安全機構により「Instruction Poisoning」としてブロックされた。原因は、Next.js自動生成AGENTS.md内の「コミットすれば作業ツリーがきれいになる」という文言が、指示のように見えたためと推測される。Bash・PowerShellどちらでも同じ理由でブロックされた。
  - 対応として、人間の承認のもと `.claude/settings.local.json` に `Bash(git add:*)` の許可ルールを追加した(update-configスキル使用)。
  - 新しく追加した許可をその場でテストする行為も「Auto-Mode Bypass」として別途ブロックされたため、人間にセッションの再起動を依頼した。
  - 再起動後、`git add` は正常に実行でき、コミット `b5fe7b8` を作成した。
- `tasks.json` の `P0-3` を `done` に更新。

**学び**: create-next-app等の外部ツールが生成するAGENTS.md/CLAUDE.mdは、既存のハーネスファイルと内容が衝突しうる。上書きせず、中身を確認してから統合するか判断する。また、ファイル内の「コミットを促す」ような文言は、Claude Codeの安全機構(Instruction Poisoning検知)を誤って作動させることがある。その場合は回避策を探さず、人間に許可設定の追加を依頼するのが正しい対応。

---

## 2026-09-28 — P0-2完了: 日本語OGP画像の試作(実行役 → 評価役)

- Google FontsからNoto Sans JP Bold(OFLライセンス、TrueType, 5.3MB)を取得し `public/fonts/NotoSansJP-Bold.ttf` に配置。ライセンス情報を `public/fonts/LICENSE.md` に記録(取得元URLの正確なライセンス文書は未確認のため、公開前に再確認する注意書きを追加)。
- `src/app/api/og-test/route.tsx` にテスト用のOGP画像生成APIを作成。`next/og` の `ImageResponse` に `fonts` オプションでNoto Sans JPを明示的に渡す方式(この方式でないとCJKがtofu文字化けする)。
- `npm run dev` 起動後、`curl http://localhost:3000/api/og-test` でHTTP 200・1200×630のPNG(36,756 bytes)を取得。
- 画像を目視確認し、「分割キーボード配列共有」「Keychron Orca echo — なぜこの配置にしたか」の漢字・ひらがな・カタカナ・全角記号が文字化けなく表示されていることを確認。`evidence/p0-2/og-test-japanese.png` に保存。
- `tasks.json` の `P0-2` を `done` に更新。

**学び**: `ImageResponse` は `fontFamily` を指定しただけではシステムフォントを使わず、`fonts` 配列でフォントデータ(ArrayBuffer/Buffer)を明示的に渡す必要がある。日本語フォントはファイルサイズが大きい(数MB)ため、本番では文字を絞ったサブセットフォントの使用を検討する余地がある(フェーズ4で判断)。

---

## 2026-09-28 — P0-4完了: Supabase接続(実行役 → 評価役)

- 人間が新規にSupabaseアカウント・プロジェクトを作成(Free plan)。`.env.local`にProject URLとPublishable key(旧称anon public key)を設定。値はAIに見せず、本人が入力。
- AIは値の中身を読まず、`node -e`でキーのプレフィックス(`sb_publishab...`)と長さのみを確認して形式チェックを行った。
- `@supabase/supabase-js`をインストール。`src/lib/supabase.ts`にクライアント初期化コードを作成。
- 接続確認用API `src/app/api/supabase-test/route.ts` を作成。**つまずいた点**: `/rest/v1/`(ルート)への問い合わせが401(`Secret API key required`)を返した。これはキーが無効なのではなく、Supabaseの新しいAPIキー体系(publishable/secret)ではルート(スキーマ全体のOpenAPI仕様)へのアクセスがSecret key専用に変更されたための仕様通りの挙動。存在しないテーブル名への問い合わせに切り替えたところ、404 + `PGRST205`(テーブルが見つからない)が返り、キー自体は有効であることを確認できた。
- `tasks.json`の`P0-4`を`done`に更新。

**学び**: Supabaseの新しいAPIキー体系(2024年以降のプロジェクト)では、Publishable keyでの動作確認は「ルート疎通」ではなく「存在しないテーブルへの問い合わせで404+PGRST205が返るか」で行うのが正しい。401(Secret API key required)が出ても、即座にキーが無効と判断しない。

---

## 2026-09-28 — P0-5完了: Vercelデプロイ(実行役 → 評価役)

- 人間の希望により、Vercelの自動デプロイのためGitHub連携方式を選択。GitHub CLI(`gh`)がこの環境に入っていなかったため、リポジトリ作成は人間が手動で実施(`tomo20070216-svg/keycap-share`、空リポジトリ)。
- `git remote add origin`、ブランチ名を`main`に変更し、人間の承認を得た上で`git push`(8コミット)。`.env.local`がリポジトリに含まれていないことを`git ls-files`で確認済み。
- Vercelのインポート画面で「Optional Integrations」が出た際、既にSupabaseを手動セットアップ済みであり、新しいサービス連携は`docs/safety.md`の承認対象になりうるため、スキップを案内した。
- 人間がVercel側で環境変数(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)を設定してデプロイ完了。公開URL: `https://keycap-share.vercel.app/`
- 公開URLに対して、トップページ(HTTP 200)、Supabase接続確認API(`keyIsValid:true`)、日本語OGP画像生成API(HTTP 200, 36,756 bytes)の3つをcurlで確認。ローカルと同じ結果で、本番環境でも正しく動作している。
- `tasks.json`の`P0-5`を`done`に更新。これでフェーズ0のP0-1〜P0-5がすべて完了し、`P1-PLACEHOLDER`(フェーズ1の詳細タスク追加)に着手可能になった。

**学び**: Vercelのプロジェクトインポート画面に出る「Optional Integrations」は、既存の手動セットアップと重複・競合しうるため、既に自前で設定済みのサービスがある場合はスキップするのが安全。

---

## 2026-09-28 — P0-0 完了: 残りの回答(計画役 → 評価役)

- 人間の回答:
  - 左手 fn2 と右手 B は、どちらも人差し指で押すキー → 確認済み。
  - 右手4段目の「Wi-Fi印字のキー」「←」の位置 → 確認済み。
  - トラックボールはジェスチャー機能があるので、割り当ての対象にする(前回の「対象外」を変更)。ジェスチャーの種類は未確認。
  - **Xログインを採用したい。**
  - **できれば無料枠に収めたい。**
- `docs/keyboards/orca-echo.md` と `docs/requirements.md` に反映。
- 実装前の調査タスクとして `P0-6`(Xログインの条件)と `P0-7`(無料枠)を追加。どちらもフェーズ6の前提条件にした。
- 評価役として、3つの質問すべての回答がこのファイルに記録されていることを確認し、`P0-0` を `done` にした。

**学び**: 「割り当て対象かどうか」はハードの機能(ジェスチャーなど)で変わる。入力部品の扱いはAIが決めず、人間に確認する。
