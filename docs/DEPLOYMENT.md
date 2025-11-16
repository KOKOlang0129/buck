# DEPLOYMENT GUIDE --- Vercel + Route53 + GitHub

本ドキュメントは、本プロジェクトを
Vercel（Hobby）プラン上で公開するための手順、および\
Route53で管理する独自ドメインの設定、GitHub連携、自動デプロイ運用の詳細をまとめています。

## 1. 前提条件

-   GitHubリポジトリが作成されていること
-   プロジェクトが Next.js など Vercel 対応構成であること
-   AWS Route53 にて独自ドメインが取得済みであること
-   必要な環境変数（OpenAIキー等）が整理されていること

## 2. Vercel プロジェクトの作成

### 2.1 アカウント作成

-   https://vercel.com\
-   GitHubアカウントでログイン\
-   GitHubリポジトリへのアクセスを許可

### 2.2 GitHub リポジトリを Import

-   Vercel Dashboard → Add New → Project\
-   対象の GitHub リポジトリを選択\
-   Framework は自動で Next.js / Node.js と判定\
-   「Import」を押す

### 2.3 プロジェクト設定

#### 2.3.1 Build & Output

通常は編集不要。

例（Next.js）:

    Build Command: npm run build
    Output Directory: .next

#### 2.3.2 Environment Variables（重要）

Project Settings → Environment Variables にて設定。

  Key                 Value   Target
  ------------------- ------- ------------------------------------
  OPENAI_API_KEY      xxxxx   Production / Preview / Development
  SUPABASE_URL        xxxxx   同上
  SUPABASE_ANON_KEY   xxxxx   同上

※ `.env` を GitHub に push しないこと。

### 2.4 Deploy

-   「Deploy」ボタンを押す\
-   Vercel が自動でビルド\
-   公開URLが発行される（例：`https://project-name.vercel.app`）

## 3. GitHub と自動デプロイ連携

### 3.1 Production デプロイ

main / master に push → 自動デプロイ。

### 3.2 Preview デプロイ

PR 作成時にプレビューURLが自動発行\
例：`https://pr-15.project-name.vercel.app`

## 4. Route53 での独自ドメイン設定

### 4.1 Vercel 側の設定

Vercel → Project → Settings → Domains\
独自ドメインを登録 → DNS設定が表示される。

### 4.2 Route53 Hosted Zone 設定

-   Aレコード\
-   CNAME（www使用時）

### 4.3 Xserver 併用時

Xserver DNSに Route53 のNSを設定。

## 5. プロジェクト構成

    /
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── lib/
    │   └── styles/
    ├── public/
    ├── .env.local
    ├── package.json
    └── vercel.json (必要な場合)

## 6. vercel.json（必要な場合）

    {
      "version": 2,
      "builds": [
        { "src": "next.config.js", "use": "@vercel/next" }
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }

## 7. トラブルシューティング

-   ビルドログ確認\
-   DNS伝播\
-   環境変数の漏れ確認

## 8. Hobby プランの制限

  項目             内容
  ---------------- --------------------
  Build            制限あり
  Edge Functions   利用可（制限あり）
  Cron Jobs        不可
  Analytics        基本のみ
  地域             US固定

## 9. ワークフロー

1.  ローカル開発\
2.  GitHub push\
3.  Vercel 自動デプロイ\
4.  Preview確認\
5.  mainマージ → Production更新

## 10. まとめ

-   GitHub → Vercel の自動連携が便利\
-   Route53設定はVercel指示どおり\
-   環境変数はVercel管理\
-   Hobbyプランで十分
