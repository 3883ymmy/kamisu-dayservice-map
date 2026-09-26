const APP_CONFIG = {
  /*
    Workウオの背景地図を書き出したら、このパスへ置きます。
    GitHub Pagesではリポジトリ内の相対パスで読み込みます。
  */
  mapImage: "assets/kamisu-map.png",

  /*
    背景地図の実際の緯度経度範囲を設定します。
    north/south/west/east が揃うまでは、地図への正確なピン表示は行いません。
  */
  mapBounds: {
    north: null,
    south: null,
    west: null,
    east: null
  },

  /*
    住所検索サービスは未選定です。
    利用者住所を外部送信することになるため、プライバシーと利用規約を確認してから接続します。
  */
  geocoder: {
    provider: null,
    endpoint: null
  }
};
