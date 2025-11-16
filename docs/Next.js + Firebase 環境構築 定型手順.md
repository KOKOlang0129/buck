# Next.js + Firebase 環境構築 定型手順

## 1. 開発環境概要
本プロジェクトでは、Next.js と Firebase を統合し、以下3層構成にて開発・運用を行います。

| 環境 | 目的 | URL / 実行環境 | 備考 |
|------|------|----------------|------|
| 開発環境 | ローカル開発・動作検証 | http://localhost:3000 | .env.local を使用 |
| ステージング環境 | クライアントレビュー・動作確認 | https://stg.example.web.app | Firebase Hosting ステージング用 |
| 本番環境 | 実稼働 | https://example.web.app | Firebase Hosting 本番用 |

---

## 2. 前提条件・必要ツール

###   開発者ローカル環境要件
| 項目 | バージョン | 備考 |
|------|-------------|------|
| Node.js | 20.x 以上 | nvmで固定 |
| npm | 10.x 以上 | |
| Firebase CLI | 最新版 | npm install -g firebase-tools |
| Git | 2.40 以上 | |
| VSCode | 推奨 | ESLint / Prettier / Firebase 拡張推奨 |

###  Firebase プロジェクト構成
- Firebase Hosting  
- Firebase Authentication  
- Cloud Firestore  
- Firebase Storage  
- Cloud Functions（必要に応じて）

---

## 3. 環境構築手順

### (1) リポジトリのクローン
```bash
git clone https://github.com/[organization]/[repository].git
cd [repository]
```

### (2) パッケージのインストール
```bash
npm install
```

### (3) Firebase CLI のログインと初期化
```bash
firebase login
firebase use [project-alias]   # stg または prod
```

### (4) 環境変数の設定
```bash
cp .env.example .env.local
```

主な環境変数：
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=xxxxxxx
```

### (5) 開発サーバー起動
```bash
npm run dev
```

---

## 4. ディレクトリ構成
```
/project-root
├─ /src
│   ├─ /app
│   ├─ /components
│   ├─ /lib
│   ├─ /hooks
│   ├─ /types
│   ├─ /styles
│   └─ /utils
├─ /public
├─ .env.local
├─ firebase.json
├─ firestore.rules
├─ package.json
└─ README.md
```

---

## 5. Firebase デプロイ手順
```bash
firebase login
firebase use stg   # ステージング用
firebase use prod  # 本番用
npm run build
firebase deploy
```

---

## 6. CI/CD 設定（GitHub Actions）
```yaml
name: Deploy to Firebase
on:
  push:
    branches:
      - main
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: w9jds/firebase-action@v2.2.2
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## 7. テスト環境
| テスト種別 | 使用ツール | 実行コマンド |
|-------------|--------------|----------------|
| 単体テスト | Jest | npm run test |
| E2Eテスト | Playwright / Cypress | npm run test:e2e |
| Lint | ESLint | npm run lint |
| 型チェック | TypeScript | npm run type-check |

---

## 8. セキュリティ
- `.env.local`、Firebase秘密鍵は Git非管理  
- Firestoreルールは最小権限原則  
- Firebase IAM権限は「Editor」まで

---

## 9. トラブルシューティング
| 現象 | 対応 |
|------|------|
| Firebase接続エラー | `.env.local`の値を確認 |
| npm install失敗 | Nodeバージョン固定（nvm use 20） |
| ESLint警告多数 | npm run lint --fix |
| デプロイ失敗 | Firebase CLIログイン・プロジェクト選択確認 |

---

## 10. ドキュメント共有
- `README.md` に手順記載  
- Firebase Console / GitHub / Figma 共有  
- 更新履歴をWikiで管理  
