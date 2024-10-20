# Drawing

![Screenshot](./docs/screenshot.png)

キャンバスベースの情報整理ツール

## 目標・方針

以下の要素を満たす、情報整理ツール

- [tldraw](https://tldraw.dev/)よりフォーマルな図をかきたい
    - アーキテクチャ図・ネットワーク図
    - 数学的な概念の図

- [Illustrator](https://www.adobe.com/jp/products/illustrator.html)や[figma](https://www.figma.com/)より気軽に使いたい
    - ページにアクセスすればすぐに始められる
    - UIをなるべくシンプルにし圧迫感をなくす

- [Notion](https://www.notion.so/)や[OneNote](https://www.microsoft.com/microsoft-365/onenote)のような情報集積がしたい
    - ページをリンクし、関連情報を整理する
    - 複数ページを対象にした横断的な検索

## 開発

### 必要ツール

- [bun](https://bun.sh/)

```bash
# 依存パッケージのインストール
$ bun install

# ローカルでの起動
$ cd ./packages/main
$ bun run start
```

## プロジェクトへの協力 / Contribution

- **誰でも歓迎です**
    - [バグ報告](https://github.com/Kiikurage/drawing2/issues/new?assignees=&labels=bug&projects=&template=bug-report---%E3%83%90%E3%82%B0%E5%A0%B1%E5%91%8A.md&title=)
    - [新機能リクエスト](https://github.com/Kiikurage/drawing2/issues/new)
    - コード変更(PR)
        - 新機能追加
        - バグ修正
        - ドキュメント追加
    - 趣味プロジェクトのため設計がコロコロ変わる可能性がありますが許してください
    - ブランチ名のルールやPRのテンプレートとかは無いので好きにやってください
    - 英語でドキュメントを書いたりしていますが基本的に日本語で大丈夫です
