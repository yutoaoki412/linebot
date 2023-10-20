function chatGPT(totalMessages) {
  const constraints = SHEET.getRange(1, 1).getValue(); // 制約
  totalMessages.unshift({"role": "system", "content": constraints});
  const requestOptions = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer "+ OPENAI_APIKEY
    },
    "payload": JSON.stringify({
      "model": CHAT_GPT_VER,
      "messages": totalMessages,
    "functions": [
          {
            "name": "send_email", // function name
            "description": "メールを送信する",
            "parameters": {
                "type": "object",
                "properties": {
                    "email": {
                        "type": "string",
                        "description": "メールアドレス",
                    },
                    "body": {
                      "type": "string",
                      "description": "本文",
                    },
                    "subject": {
                      "type": "string",
                      "description": "件名",
                    }
                },
                "required": ["email"],
            },
          },
          {
            "name": "register_schedule", // function name
            "description": "予約する",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "タイトル",
                    },
                    "email": {
                      "type": "string",
                      "description": "メールアドレス",
                    },
                    "start_year": {
                      "type": "number",
                      "description": "開始時間の年 (例:2023)",
                    },
                    "start_month": {
                      "type": "number",
                      "description": "開始時間の月 (例:8)",
                    },
                    "start_day": {
                      "type": "number",
                      "description": "開始時間の日にち (例:15)",
                    },
                    "start_hour": {
                      "type": "number",
                      "description": "開始時間の時間部分 (例:18)",
                    },
                    "start_minute": {
                      "type": "number",
                      "description": "開始時間の分 (例:30)",
                    },
                    "end_year": {
                      "type": "number",
                      "description": "終了時間の年 (例:2023)",
                    },
                    "end_month": {
                      "type": "number",
                      "description": "終了時間の月 (例:8)",
                    },
                    "end_day": {
                      "type": "number",
                      "description": "終了時間の日にち (例:15)",
                    },
                    "end_hour": {
                      "type": "number",
                      "description": "終了時間の時間部分 (例:18)",
                    },
                    "end_minute": {
                      "type": "number",
                      "description": "終了時間の分 (例:30)",
                    },
                    "description": {
                      "type": "string",
                      "description": "詳細",
                    }
                },
                "required": ["title", "email", "start_year", "start_month", "start_day", "end_year", "end_month", "end_day"],
            },
          }
        ],
        "function_call": "auto"
    })
  }
  const response = UrlFetchApp.fetch(CHAT_GPT_URL, requestOptions)
  const responseText = response.getContentText()
  const json = JSON.parse(responseText)
  if (json.choices[0].message.function_call) {
    const function_name = json.choices[0].message.function_call.name
    const function_arguments = JSON.parse(json.choices[0].message.function_call.arguments)
    if (function_name === 'send_email')
      return_text = send_email(function_arguments.email, function_arguments.body, function_arguments.subject) // function calling でメール送信
    else if (function_name === 'register_schedule')
      return_text = register_schedule(function_arguments.title, function_arguments.email, function_arguments.start_year, function_arguments.start_month - 1, function_arguments.start_day, function_arguments.start_hour, function_arguments.start_minute, function_arguments.end_year, function_arguments.end_month - 1, function_arguments.end_day, function_arguments.end_hour, function_arguments.end_minute, function_arguments.description) // function calling で予定を追加
  } else {
    // function calling が実行されなかった場合、ChatGPTの返答として返す。
    return_text = json['choices'][0]['message']['content'].trim();
  }
  // console.log(return_text);
  return (return_text);
}

// メール送信
function send_email(email, body, subject) {
  const options = {name: "智ちゃんBotからのお知らせ"} // オプション
  MailApp.sendEmail(email, subject, body, options) // 送信
  const text = `「${subject}」ってメールを ${email} に送っておいたよ`
  return (text)
}

// Googleカレンダーに予約
function register_schedule(title, email, start_year, start_month, start_day, start_hour, start_minute, end_year, end_month, end_day, end_hour, end_minute, description) {
  let start_time, end_time
  if (start_minute)
    start_time = new Date(start_year, start_month, start_day, start_hour, start_minute)
  else if (start_hour)
    start_time = new Date(start_year, start_month, start_day, start_hour)
  else
    start_time = new Date(start_year, start_month, start_day)
  if (end_minute)
    end_time = new Date(end_year, end_month, end_day, end_hour, end_minute)
  else if (end_hour)
    end_time = new Date(end_year, end_month, end_day, end_hour)
  else
    end_time = new Date(end_year, end_month, end_day)
  const Calendar = CalendarApp.getDefaultCalendar()
  const options = {description: `${description}\n\n智ちゃんBotからの追加`} // 説明文
  Calendar.createEvent(title, start_time, end_time, options)
  const text = `${email}に「${title}」って予定を追加しておいたよ\n開始時間：${Utilities.formatDate(start_time, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm')}\n終了時間：${Utilities.formatDate(end_time, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm')}`
  return (text)
}
