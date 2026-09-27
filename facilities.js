// 施設名・住所は、確認・整理した正式版18施設リストを基準にしています。
// 緯度経度は住所とは別管理です。phone は一覧の「電話/FAX」欄の1段目（電話番号）です。

const FACILITIES = [
  { id: 1 ,  name: "おはなくらぶ２", address: "神栖市息栖2287", latitude: 35.88166, longitude: 140.62385, phone: "0299-95-6040" },
  { id: 2 ,  name: "おはなくらぶ", address: "神栖市息栖3040-277、3040-278", latitude: 35.87854, longitude: 140.63037, phone: "0299-95-6040" },
  { id: 3 ,  name: "フレンズサークル神栖", address: "神栖市下幡木4049-75", latitude: 35.91892, longitude: 140.62656, phone: "0299-95-8639" },
  { id: 4 ,  name: "ひまわりくらぶ第３教室", address: "神栖市筒井1273-1", latitude: 35.90576, longitude: 140.62491, phone: "0299-94-2535" },
  { id: 5 ,  name: "多機能型重症児デイ すいんく", address: "神栖市平泉2407", latitude: 35.91089, longitude: 140.63496, phone: "0299-95-7107" },
  { id: 6 ,  name: "指定放課後等デイサービス事業所カラフル", address: "神栖市深芝南1-4-1", latitude: 35.90654, longitude: 140.64688, phone: "0299-77-8202" },
  { id: 7 ,  name: "ゆめキッズ神栖第二教室", address: "神栖市深芝南2-18-4", latitude: 35.90881, longitude: 140.64650, phone: "080-4120-8997" },
  { id: 8 ,  name: "ゆめキッズ神栖第四教室", address: "神栖市深芝南2-18-7", latitude: 35.90881, longitude: 140.64650, phone: "070-8389-1438" },
  { id: 9 ,  name: "ゆめキッズ神栖", address: "神栖市深芝南2-25-11", latitude: 35.90938, longitude: 140.64502, phone: "0299-77-8997" },
  { id: 10, name: "ゆめキッズ神栖第三教室", address: "神栖市深芝南2-25-6", latitude: 35.90938, longitude: 140.64502, phone: "090-8944-8997" },
  { id: 11, name: "シードリーフ神栖", address: "神栖市神栖1-12-23", latitude: 35.89969, longitude: 140.64384, phone: "0299-95-8851" },
  { id: 12, name: "スマイルジョワ神栖教室", address: "神栖市神栖2-4-52 パレスA棟", latitude: 35.90177, longitude: 140.65124, phone: "0299-77-7653" },
  { id: 13, name: "神栖市障害者デイサービスセンターのぞみ", address: "神栖市溝口1746-1（保健・福祉会館内）", latitude: 35.88856, longitude: 140.66317, phone: "0299-93-1063" },
  { id: 14, name: "にこにこハート", address: "神栖市太田4633-1", latitude: 35.84526, longitude: 140.71636, phone: "0479-44-4508" },
  { id: 15, name: "障害者地域支援センター 潮風の郷", address: "神栖市矢田部5258", latitude: 35.81269, longitude: 140.73528, phone: "0479-40-2171" },
  { id: 16, name: "でいサービスみなと", address: "神栖市土合南2-1-21-1", latitude: 35.78845, longitude: 140.77483, phone: "0479-48-0300" },
  { id: 17, name: "太陽の家", address: "神栖市土合南3-6-17", latitude: 35.791359, longitude: 140.770135, phone: "0479-26-4805" },
  { id: 18, name: "にこにこハート土合教室", address: "神栖市土合本町1-9082-18", latitude: 35.78651, longitude: 140.78143, phone: "0479-26-3301" }
];
