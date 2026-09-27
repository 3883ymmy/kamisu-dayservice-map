const APP_CONFIG = {
  /*
    通常の画面表示で使用するラスタ背景地図です。
    GitHub Pagesではリポジトリ内の相対パスで読み込みます。
  */
  mapImage: "assets/kamisu-map.png",

  /*
    印刷時のみ使用するベクター背景地図です。
    通常表示では読み込まず、印刷操作時に切り替えます。
  */
  printMapImage: "assets/kamisu-map-print.svg",

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
    住所検索は国土地理院の地理院地図・地名検索APIへ
    ブラウザから直接問い合わせます。入力住所はGitHubへ保存しません。
  */
  geocoder: {
    provider: "gsi",
    endpoint: "https://msearch.gsi.go.jp/address-search/AddressSearch",
    defaultPrefix: "茨城県神栖市",
    searchArea: {
      north: 35.98,
      south: 35.72,
      west: 140.53,
      east: 140.90
    }
  }
};
