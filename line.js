// OAuth2認証サービスの設定
function getOAuthService() {
  return OAuth2.createService('MultiAPIService')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(OAUTH2_CLIENT_ID)
    .setClientSecret(OAUTH2_CLIENT_SECRET)
    .setRedirectUri(OAUTH2_REDIRECT_URI)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/gmail.send ' +
          'https://www.googleapis.com/auth/spreadsheets ' +
          'https://www.googleapis.com/auth/calendar')
    .setParam('access_type', 'offline')
    .setParam('approval_prompt', 'force');
}

// 認証URLを生成する関数
function getAuthUrl() {
  var service = getOAuthService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('認証を開始するにはこのURLにアクセスしてください: %s', authorizationUrl);
    return authorizationUrl;
  }
}

// 認証が完了した後のコールバック関数
function authCallback(request) {
  sendPushMessage(userId, request);
  sendPushMessage(userId, 'ここまでは実装されてます');
  var service = getOAuthService();
  sendPushMessage(userId, '認証確認準備中！');
  var isAuthorized = service.handleCallback(request);
  sendPushMessage(userId, '認証確認のための値を取得しました！');
  if (isAuthorized) {
    // 認証に成功した場合のユーザーのLINE IDを取得するためのコードが必要です
    var userId = getUserIdFromService(service);
    // 認証成功メッセージをユーザーに送信
    sendPushMessage(userId, '認証に成功しました！');
    return HtmlService.createHtmlOutput('認証に成功しました！');
  } else {
    return HtmlService.createHtmlOutput('認証に失敗しました。');
  }
}

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

  // 認証を要求する特定のメッセージを受け取った場合
  if (postMessage === '認証して') {
    const authUrl = getAuthUrl(); // 認証URLを生成
    var userId = data.source.userId; // LINEのイベントオブジェクトからuserIdを取得
    saveUserId(userId); // ユーザーIDを保存する
    sendPushMessage(userId, 'あなたのLINEIDを取得しました！');
    sendPushMessage(userId, userId);
    sendMessage(replyToken, `以下のリンクから認証を行ってください: ${authUrl}`);
    return;
  }  

  // const postMessage = data.message.text; // 送信されたメッセージ

  // // 認証を要求する特定のメッセージを受け取った場合
  // if (postMessage === '認証して') {
  //   // デバッグログ：認証URL生成関数を呼び出す前
  //   Logger.log('認証プロセス開始：メッセージ受信 - ' + postMessage);

  //   const authUrl = getAuthUrl(); // 認証URLを生成

  //   // デバッグログ：認証URLを生成した後
  //   if (authUrl) {
  //     Logger.log('認証URL生成：' + authUrl);
  //   } else {
  //     Logger.log('認証URL生成に失敗しました。');
  //   }

  //   // 認証URLをLINEユーザーに送信する
  //   const result = sendMessage(replyToken, `以下のリンクから認証を行ってください: ${authUrl}`);

  //   // デバッグログ：LINEへの送信結果
  //   if (result) {
  //     Logger.log('LINEへのメッセージ送信成功：' + result);
  //   } else {
  //     Logger.log('LINEへのメッセージ送信失敗');
  //   }

  //   return;
  // }

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

// ーーーーーー
// ユーザーIDを保存する関数
function saveUserId(userId) {
  // ユーザーのプロパティにユーザーIDを保存
  PropertiesService.getUserProperties().setProperty('userId', userId);
}

// OAuth2サービスからユーザーのIDを取得する関数
function getUserIdFromService(service) {
  // ユーザーのプロパティからユーザーIDを取得
  return PropertiesService.getUserProperties().getProperty('userId');
}


// ( 個別 )ユーザーにメッセージを送信する関数
function sendPushMessage(userId, messageText) {
  var postData = {
    to: userId,
    messages: [
      {
        type: 'text',
        text: messageText
      }
    ]
  };
  var headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + LINE_ACCESS_TOKEN
  };
  var options = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(postData),
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  Logger.log(response.getContentText());
}