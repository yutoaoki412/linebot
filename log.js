// 大元のシートの「ログ」に追加
function debugLog(userId, text, replyText) {
  const UserData = findUser(userId); // ユーザーシートにデータがあるか確認
  typeof UserData === "undefined" ? addUser(userId) : userUseChat(userId); // ユーザーシートにデータがなければユーザー追加、あれば投稿数だけ追加
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  SHEET_LOG.appendRow([userId, UserData, text, replyText, date]); // ログシートに情報追加
  dataSort(SHEET_LOG, 5); // E列の日付順に並び替え
}

// 個別のシートの「ログ」に追加
function debugLogIndividual(sheetId, text, replyText) {
  const individualSheetLog = SpreadsheetApp.openById(sheetId).getSheetByName('ログ');
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  individualSheetLog.appendRow([text, replyText, date]); // ログシートに情報追加
  dataSort(individualSheetLog, 3); // C列の日付順に並び替え
}

function addUser(userId) {
  const userName = getUserDisplayName(userId);
  const userIMG  = getUserDisplayIMG(userId);
  const sheetId = sheetCopy(userName);
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  SHEET_USER.appendRow([userId, userName, userIMG, 0, sheetId, date, date]);
  return;
}

// ユーザーのプロフィール名取得
function getUserDisplayName(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const userProfile = UrlFetchApp.fetch(url,{
    'headers': {
      'Authorization' : `Bearer ${LINE_ACCESS_TOKEN}`,
    },
  });
  return JSON.parse(userProfile).displayName;
}

// ユーザーのプロフィール画像取得 
function getUserDisplayIMG(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId
  const userProfile = UrlFetchApp.fetch(url,{
    'headers': {
      'Authorization' : `Bearer ${LINE_ACCESS_TOKEN}`,
    },
  });
  return JSON.parse(userProfile).pictureUrl;
}

// スプレッドシートを並び替え(対象のシートのカラムを降順に変更)
function dataSort(sortSheet,columnNumber) {
  const numColumn = sortSheet.getLastColumn(); // 最後列の列番号を取得
  const numRow    = sortSheet.getLastRow()-1;  // 最後行の行番号を取得
  const dataRange = sortSheet.getRange(2, 1, numRow, numColumn);
  dataRange.sort([{column: columnNumber, ascending: false}]); // 降順に並び替え
}

// ユーザーのシートを更新 
function userUseChat(userId) {
  // 送信したユーザー先のユーザーを検索
  const textFinder = SHEET_USER.createTextFinder(userId);
  const ranges = textFinder.findAll();
  // ユーザーが存在しない場合エラー
  if (!ranges[0])
    SHEET_USER.appendRow([userId, "???", '', 1]);
  // 投稿数プラス１
  const timesFinder = SHEET_USER.createTextFinder('投稿数');
  const timesRanges = timesFinder.findAll();
  const timesRow    = ranges[0].getRow();
  const timesColumn = timesRanges[0].getColumn();
  const times = SHEET_USER.getRange(timesRow, timesColumn).getValue() + 1;
  SHEET_USER.getRange(timesRow, timesColumn).setValue(times);
  // 更新日時を更新
  const updateDateFinder = SHEET_USER.createTextFinder('更新日時');
  const updateDateRanges = updateDateFinder.findAll();
  const updateDateRow    = ranges[0].getRow();
  const updateDateColumn = updateDateRanges[0].getColumn();
  const updateDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  SHEET_USER.getRange(updateDateRow, updateDateColumn).setValue(updateDate);
  
  // 更新順に並び替え
  const numColumn = SHEET_USER.getLastColumn(); // 最後列の列番号を取得
  const numRow    = SHEET_USER.getLastRow()-1;  // 最後行の行番号を取得
  const dataRange = SHEET_USER.getRange(2, 1, numRow, numColumn);
  dataRange.sort([{column: updateDateColumn, ascending: false}]); // 更新日付順に並び替え
}

// メンバーとしてユーザー登録されているか検索
function findUser(uid) {
  return getUserData().reduce(function(uuid, row) { return uuid || (row.key === uid && row.value); }, false) || undefined;
}

// ユーザー情報取得
function getUserData() {
  const data = SHEET_USER.getDataRange().getValues();
  return data.map(function(row) { return {key: row[0], value: row[1]}; });
}

// 過去の履歴を取得
function chatGPTLog(sheetId, postMessage) {
  const individualSheetLog = SpreadsheetApp.openById(sheetId).getSheetByName('ログ');
  const values = individualSheetLog.getDataRange().getValues();
  let totalMessages = [];
  for (i in values) {
    if (i == 0)
      continue; // 最初の1行目はスキップ
    if (i > MAX_COUNT_LOG)
      break; // 過去の履歴を遡る回数を超えたらfor文の処理を終了
    totalMessages.unshift({"role": "assistant", "content": values[i][1]});
    totalMessages.unshift({"role": "user", "content": values[i][0]});
  }
  totalMessages.push({"role": "user", "content": postMessage});
  console.log(totalMessages);
  return totalMessages;
}

// シートをコピー
function sheetCopy(userName) {
  // そのスプレッドシートのコピーを作成
  const ssCopy = SS.copy(`[${userName}] ${SS.getName()}`);
  // そのスプレッドシートのIDを取得
  const sheetIdCopy = ssCopy.getId();
  // コピーしたシートのユーザー情報部分は削除
  const sheetLogCopy = ssCopy.getSheetByName('ログ');
  sheetLogCopy.deleteColumns(1, 2)
  const sheetUserCopy = ssCopy.getSheetByName('ユーザー');
  ssCopy.deleteSheet(sheetUserCopy);
  const sheetOneCopy = ssCopy.getSheetByName('シート1');
  ssCopy.deleteSheet(sheetOneCopy);
  // シートのログデータは全て削除
  const numColumn = sheetLogCopy.getLastColumn(); // 最後列の列番号を取得
  const numRow    = sheetLogCopy.getLastRow()-1;  // 最後行の行番号を取得
  if (numRow != 0) {
    sheetLogCopy.getRange(2, 1, numRow, numColumn).clear();
  }
  console.log(sheetIdCopy)
  return sheetIdCopy;
}

// ユーザーのスプシを検索
function findSheetId(uid) {
  return getSheetId().reduce(function(uuid, row) { return uuid || (row.key === uid && row.value); }, false) || undefined;
}

// ユーザーのスプシ情報取得
function getSheetId() {
  const data = SHEET_USER.getDataRange().getValues();
  return data.map(function(row) { return {key: row[0], value: row[4]}; });
}

function addAUser(userId, replyToken) {
  const userName = getUserDisplayName(userId);
  const userIMG  = getUserDisplayIMG(userId);
  const sheetId = sheetCopy(userName);
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss'); // 現在の日付を取得
  SHEET_USER.appendRow([userId, userName, userIMG, 0, sheetId, date, date]);
  sendMessage(replyToken, `${userName}さん、初めまして！`);
  return;
}
