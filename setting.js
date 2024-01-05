// API設定部分
const PROPS = PropertiesService.getScriptProperties();
const OPENAI_APIKEY = PROPS.getProperty('OPENAI_APIKEY');
const LINE_ACCESS_TOKEN = PROPS.getProperty('LINE_ACCESS_TOKEN');
// 使用API
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const CHAT_GPT_URL   = "https://api.openai.com/v1/chat/completions";
const CHAT_GPT_VER   = "gpt-4-1106-preview"
// const CHAT_GPT_VER   = "gpt-3.5-turbo-16k"; // 一度のやり取りで16000トークンまで使用可能
// スプレッドシートの情報
const SS         = SpreadsheetApp.getActiveSpreadsheet();
const SHEET      = SS.getSheetByName('制約');
const SHEET_LOG  = SS.getSheetByName('ログ');
const SHEET_USER = SS.getSheetByName('ユーザー');
const MAX_COUNT_LOG =  10; // 過去のLINEでのメッセージを遡る回数