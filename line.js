// LINEからのメッセージ受信 (ここからスタート)
function doPost(e) {
  const data = JSON.parse(e.postData.contents).events[0]; // 情報取得
  if (!data)
    return SS.getSheetByName('シート1').appendRow(["Webhook 検証OK"]);
  const replyToken = data.replyToken; // リプレイトークン
  const lineUserId = data.source.userId; // LINE ユーザーID 追加
  const sheetId    = findSheetId(lineUserId); // ユーザー個別のシート
  const dataType   = data.type; // データのタイプ
  // フォロー時に新しく個別のシートを作成
  if (dataType == "follow" && typeof sheetId == "undefined")
    return addAUser(lineUserId, replyToken);
  else if (dataType == "follow")
    return ;
  const postMessage = data.message.text; // 送信されたメッセージ
  // テキスト以外だった時（スタンプや写真など）
  if (postMessage === undefined)
    return sendMessage(replyToken, "僕わかんない‼なになに❓わかんない❗️");
  // データ生成＆LINEに送信
  const totalMessages = chatGPTLog(sheetId, postMessage);
  const replyText = chatGPT(totalMessages);
  sendMessage(replyToken, replyText);
  // ログに追加
  debugLog(lineUserId, postMessage, replyText);// 大元の「ログ」シートに追加
  debugLogIndividual(sheetId, postMessage, replyText); // 個別の「ログ」シートに追加
  return;
}

// LINEに返答
function sendMessage(replyToken, replyText) {
  const postData = {
    "replyToken" : replyToken,
    "messages" : [
      {
        "type" : "text",
        "text" : replyText
      }
    ]
  };  
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    "Authorization" : `Bearer ${LINE_ACCESS_TOKEN}`
  };
  const options = {
    "method" : "POST",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  };
  return UrlFetchApp.fetch(LINE_REPLY_URL, options);
}