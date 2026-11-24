# Listener Tools

個人用のYouTube・Twitch視聴ツール。公開先はCloudflare Workers。Cloudflare Accessで本番ホスト全体を所有者に制限し、プレビューURLを無効にする。

| パス | 用途 |
| --- | --- |
| / | 配信中一覧。タイトルを選ぶとYouTubeを別タブで開く |
| /zapping/ | 配信中の候補をランダム再生。一覧とチャットを切り替えられる |
| /multi/ | YouTube・Twitchを手入力で追加する複窓 |

## 配信取得

対象は data/channels.json で管理する。各チャンネルの直近5投稿から配信中の動画を抽出し、一覧とザッピングで120秒間キャッシュを共有する。古い配信は検出対象から外れる場合がある。動画の再生・チャットは各サービスの埋め込みを使用する。

## ビルドと運用

Node.jsで `node scripts/build.mjs` を実行する。dist内のworker.jsをエントリーモジュール、assets.jsとchannels.jsを追加ESモジュールとして同じWorkerにデプロイする。Secret名は `YOUTUBE_API_KEY`。YouTube Data API v3を有効にしたサーバー用キーを使う。以前公開したブラウザ用キーは移行後に失効させる。

別ホストでは複窓のsessionStorageは引き継がれない。配信リストやアクセス許可のメールアドレス、APIキーの変更は別々に管理する。
