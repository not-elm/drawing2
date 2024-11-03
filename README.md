# Drawing

![Screenshot](./docs/screenshot.png)

ミニマルなベクタードロイングソフト

## 目標・方針

- [tldraw](https://tldraw.dev/)がラフなイラストに特化しているのに対して、もう少し「堅い図」に特化したい
    - アーキテクチャ図・ネットワーク図
    - 数学的な概念の図

- [Illustrator](https://www.adobe.com/jp/products/illustrator.html)や[figma](https://www.figma.com/)より気軽に使いたい
    - ページにアクセスすればすぐに始められる
    - UIをなるべくシンプルにし圧迫感をなくす

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
