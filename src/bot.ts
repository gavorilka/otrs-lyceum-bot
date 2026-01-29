import {Bot, GrammyError, HttpError, InlineKeyboard, session} from "grammy";
import {botToken} from "./config/vars";
import {MyContext, SessionData} from "./types/bot.interface";
import otrsApiService from "./services/otrsApi.service";
import {authMiddleware} from "./middlewares/auth.middleware";
import userService from "./services/user.service";

const bot = new Bot<MyContext>(botToken);


console.log("Токен:", botToken);

bot.use(session({ initial: (): SessionData => ({ state: null, tmpLogin: null }) }));

const publicCommands = [
  { command: "start", description: "Начало работы" },
  { command: "login", description: "Войти в OTRS" },
];

const privateCommands = [
  //{ command: "me", description: "Мой профиль" },
  { command: "tickets", description: "Мои тикеты" },
  { command: "logout", description: "Выйти" },
];

bot.command("start", authMiddleware, async (ctx) => {

  if (ctx.user) {
    await ctx.api.setMyCommands(privateCommands, {
      scope: { type: "chat", chat_id: ctx.chat!.id },
    });

    await ctx.reply(`С возвращением, ${ctx.user.otrsLogin}!`);
  } else {
    await ctx.api.setMyCommands(publicCommands, {
      scope: {type: "chat", chat_id: ctx.chat!.id},
    });
    await ctx.reply(`Привет, ${ctx.from?.first_name}! Отправь /login чтобы связать Telegram с аккаунтом OTRS.`);
  }
  //await ctx.reply("Привет! Вот меню:", { reply_markup: menu });
  console.log(ctx);
});

bot.command('login', async (ctx) => {
  ctx.session.state = 'WAITING_LOGIN';
  await ctx.reply('Введи логин OTRS:');
});

bot.command('tickets', authMiddleware, async (ctx) => {
  try {
    const response = await otrsApiService.getTicketList();
    if (!('Tickets' in response)) {
      return new Error("Response does not contain Tickets")
    }

    const ticketList = new InlineKeyboard()

    for (const  ticket of response.Tickets) {
      ticketList.text(ticket.Title, `ticket:${ticket.TicketID}`).row()
    }

    await ctx.reply(`Твои заявки: `, { reply_markup: ticketList });
  } catch (error) {

  }
});

bot.command("logout", authMiddleware, async (ctx) => {
  // await userService.delete({
  //   telegramUserId: ctx.from!.id,
  // });

  console.log(await otrsApiService.logout())

  await ctx.api.setMyCommands(publicCommands, {
    scope: { type: "chat", chat_id: ctx.chat!.id },
  });

  await ctx.reply("👋 Ты вышел из системы. Используй /login для входа.");
});

bot.callbackQuery(/^ticket:(\d+)$/, async (ctx) => {
  const ticketId = Number(ctx.match[1]);  // извлекаем номер тикета из callback_data

  await ctx.answerCallbackQuery(`Загружаю тикет ${ticketId}`);

  try {
    // тут можно загрузить детали тикета по номеру
    const ticketDetails = await otrsApiService.getTicketWithArticles(ticketId);
    console.log(ticketDetails)

    if(!ticketDetails.ticket) {
      await ctx.reply(`Тикет #${ticketId} не найден.`);
      return;
    }

    //await ctx.reply(`Детали тикета #${ticketId}:\n ${JSON.stringify(ticketDetails, null, 2)}`);
  } catch (error) {
    if (error instanceof Object && 'message' in error)
      await ctx.reply(`Ошибка загрузки тикета #${ticketId}: ${error.message}`);
    else
      console.log(error);
  }
});

// обработка текстов в зависимости от state
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();

  if (ctx.session.state === 'WAITING_LOGIN') {
    ctx.session.tmpLogin = text;
    ctx.session.state = 'WAITING_PASSWORD';
    await ctx.reply('Теперь введи пароль OTRS:');
    return;
  }

  if (ctx.session.state === 'WAITING_PASSWORD') {
    const login = ctx.session.tmpLogin;
    const password = text;
    ctx.session.state = null;
    ctx.session.tmpLogin = null;

    await ctx.reply('Пробую войти в OTRS...');

    try {
      const { SessionValue, ChallengeToken, Me } = await otrsApiService.login(login!, password);

      await userService.upsertByTelegramId({
        TelegramUserId: ctx.from!.id,
        OtrsLogin: Me.UserLogin,
        SessionValue,
        ChallengeToken
      });

      await ctx.reply(
          `Успешный вход в OTRS как ${Me.UserLogin}.\nТеперь этот Telegram‑аккаунт привязан к OTRS пользователю.`
      );

      await ctx.api.setMyCommands(privateCommands, {
        scope: { type: "chat", chat_id: ctx.chat!.id },
      });
    } catch (e: any) {
      console.error(e);
      await ctx.reply(`Не удалось войти в OTRS: ${e.message}`);
    }
    return;
  }
});

bot.catch((err) => {
  const ctx = err.ctx
  console.error(`Error while handling update ${ctx.update.update_id}:`)
  const e = err.error
  if (e instanceof GrammyError) 
    console.error("Error in request:", e.description)
  else if (e instanceof HttpError) 
    console.error("Could not contact Telegram:", e)
  else
    console.error("Unknown error:", e)
})

// Экспортируем для запуска
export default bot;
