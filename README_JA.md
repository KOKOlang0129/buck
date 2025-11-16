# Arcana Editor - AIシナリオエディター

AIを活用した物語制作を支援するモダンなReactアプリケーション。React Router DOMを使用し、美しくレスポンシブなUI/UXデザインを特徴とします。

## 機能

- 🎭 **シナリオエディター**: AIによる補完提案機能付きリッチテキストエディター
- 🔐 **認証**: Firebaseによる安全なユーザー認証
- 📊 **ダッシュボード**: シナリオの管理と整理
- 🎨 **モダンなUI**: Tailwind CSSによる美しくレスポンシブなデザイン
- 🚀 **高速パフォーマンス**: Viteによる最適な開発・ビルドパフォーマンス
- 📱 **モバイル対応**: すべてのデバイスサイズで完璧に動作

## 技術スタック

- **React 18** with TypeScript
- **React Router DOM** によるクライアントサイドルーティング
- **Vite** によるビルドツール
- **Tailwind CSS** によるスタイリング
- **Firebase** による認証とデータストレージ
- **Lucide React** によるアイコン

## セットアップ

### 前提条件

- Node.js 16以上
- npm または yarn

### インストール

1. リポジトリをクローン:
```bash
git clone <repository-url>
cd arcana-editor
```

2. 依存関係をインストール:
```bash
npm install
```

3. Firebase設定:
   - Firebaseプロジェクトを作成
   - AuthenticationとFirestoreを有効化
   - Firebase設定を `src/lib/firebase.ts` にコピー

4. 開発サーバーを起動:
```bash
npm run dev
```

5. ブラウザで `http://localhost:3000` を開く

### 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用ビルド
- `npm run preview` - 本番ビルドのプレビュー
- `npm run lint` - ESLintを実行

## プロジェクト構造

```
src/
├── components/          # 再利用可能なUIコンポーネント
│   ├── editor/         # エディター固有のコンポーネント
│   ├── providers/      # コンテキストプロバイダー
│   └── ui/            # 基本UIコンポーネント
├── pages/             # ページコンポーネント
├── lib/               # ユーティリティライブラリ
├── types/             # TypeScript型定義
└── main.tsx          # アプリケーションエントリーポイント
```

## 機能概要

### シナリオエディター
- リアルタイム統計情報付きリッチテキスト編集
- AIによるコンテンツ提案
- タグ管理システム
- エクスポート/インポート機能
- 自動保存機能

### ダッシュボード
- すべてのシナリオの概要
- 新規シナリオ作成へのクイックアクセス
- 統計情報と分析
- 検索とフィルター機能

### 認証
- メール/パスワード認証
- ユーザープロフィール管理
- 安全なセッション処理

## バックエンドAPI

バックエンドAPIの詳細については、[API設計書](docs/API設計書.md)を参照してください。

### 主要エンドポイント

- `POST /api/login` - ログイン（JWT発行）
- `GET /api/user` - ユーザー情報取得
- `PUT /api/user` - ユーザー情報更新
- `GET /api/whitelist` - ホワイトリスト一覧取得
- `POST /api/whitelist` - ホワイトリストに追加
- `DELETE /api/whitelist/:userId` - ホワイトリストから削除

## アーキテクチャ

システムアーキテクチャの詳細については、[アーキテクチャ概要](docs/architecture.md)を参照してください。

## 開発ガイドライン

### コーディング規約

- TypeScriptの型安全性を最大限に活用
- コンポーネントは関数コンポーネントとReact Hooksを使用
- スタイリングはTailwind CSSを使用
- エラーハンドリングは明示的に実装

### コミットメッセージ

Conventional Commits形式に従います:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他の変更

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## クライアント情報

**PXr LLC** - AIシナリオエディター MVP Phase 1

---

**最終更新日**: 2024年
**バージョン**: 0.1.0

