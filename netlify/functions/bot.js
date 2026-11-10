const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 200, body: "NEXORA Bot Active" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const msg = body.message;

    if (msg && msg.text) {
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text.startsWith("/start")) {
        let inviter = "";
        if (text.startsWith("/start nex_")) {
          inviter = text.split("nex_")[1].trim();
        }

        // Netlify App Name ကို အောက်ပါအတိုင်း ချိတ်ဆက်ပါ
        const appUrl = inviter 
          ? `https://${process.env.URL || "nexora-app.netlify.app"}?inviter=${inviter}`
          : `https://${process.env.URL || "nexora-app.netlify.app"}`;

        const welcomeText = 
          "⚡ <b>Welcome to NEXORA Network ($NEX)!</b>\n\n" +
          "🔸 Cloud Mine $NEX automatically 24/7\n" +
          "🔸 Complete Missions to unlock instant allocations\n" +
          "🔸 Invite friends & earn 10% referral yields\n" +
          "🔒 <b>DEX Listing & Withdrawals: January 1, 2027</b>\n\n" +
          "Tap below to launch your mining node!\n👇";

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⚡ Launch NEXORA Node", web_app: { url: appUrl } }],
                [
                  { text: "📦 Community", url: "https://t.me/A_TOOLSx2" },
                  { text: "📢 Channel", url: "https://t.me/A_TOOLSx2" }
                ]
              ]
            }
          })
        });

        return { statusCode: 200, body: "OK" };
      }
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    return { statusCode: 200, body: "Handled" };
  }
}
