// API設定部分
const PROPS = PropertiesService.getScriptProperties();
const OPENAI_APIKEY = PROPS.getProperty('OPENAI_APIKEY');
const LINE_ACCESS_TOKEN = PROPS.getProperty('LINE_ACCESS_TOKEN');

// 使用APIエンドポイント
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const CHAT_GPT_URL   = "https://api.openai.com/v1/chat/completions";
const CHAT_GPT_VER   = "gpt-3.5-turbo-1106"; // or gpt-4-0613
// const CHAT_GPT_VER   = "gpt-3.5-turbo-16k"; // 一度のやり取りで16000トークンまで使用可能

// OAuth2.0設定
const OAUTH2_CLIENT_ID = '24122317483-r42md88ujo442nn8skcrv35bdokdus7r.apps.googleusercontent.com';
const OAUTH2_CLIENT_SECRET = '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';
const OAUTH2_REDIRECT_URI = 'https://script.google.com/macros/d/AKfycbzxm8sC2LPIOnhzPbYSVikVXDREcUjqge6feA7o2I48OD6Qaj-J-uXUOQjsa93vXlSwwQ/usercallback'; 

// スプレッドシートの情報
const SS         = SpreadsheetApp.getActiveSpreadsheet();
const SHEET      = SS.getSheetByName('制約');
const SHEET_LOG  = SS.getSheetByName('ログ');
const SHEET_USER = SS.getSheetByName('ユーザー');

const MAX_COUNT_LOG = 10; // 過去のLINEでのメッセージを遡る回数