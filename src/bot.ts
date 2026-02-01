import {Bot, GrammyError, HttpError, InlineKeyboard, session} from "grammy";
import {botToken, otrsBaseUrl} from "./config/vars";
import {MyContext, SessionData} from "./shared/types/bot.interface";
import otrsApiService from "./services/otrsApi.service";
import {authMiddleware} from "./middlewares/auth.middleware";
import userService from "./services/user.service";
import {ticketsWithArticlesToReply} from "./utils/ticketsWithArticlesToReply";
import {TicketListResponse} from "./shared/types/otrsResponse.interface";
import {TicketState} from "./shared/types/otrs.enum";
import {TicketStateLabelRu} from "./shared/const/otrs.consts";

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
});

bot.command('login', async (ctx) => {
  ctx.session.state = 'WAITING_LOGIN';
  await ctx.reply('Введи логин OTRS:');
});

bot.command('tickets', authMiddleware, async (ctx) => {
  try {
    const response = await otrsApiService.getTicketList({
      Limit:10
    });
    if (!('Tickets' in response)) {
      return new Error("Response does not contain Tickets")
    }

    const ticketList = new InlineKeyboard()

    for (const  ticket of response.Tickets) {
      ticketList.text(ticket.Title, `ticket:${ticket.TicketID}`).row()
    }

    await ctx.reply(`Твои заявки: `, { reply_markup: ticketList });
  } catch (error: any) {
    await ctx.reply(error.message);
  }
});

bot.command("logout", authMiddleware, async (ctx) => {
  // await userService.delete({
  //   telegramUserId: ctx.from!.id,
  // });

  await otrsApiService.logout()

  await ctx.api.setMyCommands(publicCommands, {
    scope: { type: "chat", chat_id: ctx.chat!.id },
  });

  await ctx.reply("👋 Ты вышел из системы. Используй /login для входа.");
});

bot.callbackQuery(/^ticket:(\d+)$/, authMiddleware, async (ctx) => {
  const ticketId = Number(ctx.match[1]);  // извлекаем номер тикета из callback_data

  await ctx.answerCallbackQuery(`Загружаю тикет ${ticketId}`);

  try {
    // тут можно загрузить детали тикета по номеру
    const ticketDetails = await otrsApiService.getTicketWithArticles(ticketId);

    if(!ticketDetails.ticket) {
      await ctx.reply(`Тикет #${ticketId} не найден.`);
      return;
    }
    const commandsTicketList = new InlineKeyboard()
        .url("Смотреть в OTRS", `${otrsBaseUrl}/otrs/index.pl?Action=AgentTicketZoom;TicketID=${ticketDetails.ticket.TicketID}`).row()
        .text("Сменить статус ", `changeState:${ticketDetails.ticket.TicketID}Number:${ticketDetails.ticket.TicketNumber}`).row()

    await ctx.api.sendMessage(
        ctx.chat!.id,
        ticketsWithArticlesToReply(ticketDetails),
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: commandsTicketList
        } as any
    );
  } catch (error) {
    if (error instanceof Object && 'message' in error)
      await ctx.reply(`Ошибка загрузки тикета Id ${ticketId}: ${error.message}`);
    else
      console.log(error);
  }
});

bot.callbackQuery(/^changeState:(\d+)Number:(\d+)$/, authMiddleware, async (ctx) => {
  const ticketId = Number(ctx.match[1]);
  const ticketNumber = Number(ctx.match[2]);

  await ctx.answerCallbackQuery(`Готовлю список статусов`);

  const stateList = new InlineKeyboard();

  (Object.values(TicketState) as TicketState[])
      .filter(v => typeof v === 'number')
      .forEach(stateId => {
        const label = TicketStateLabelRu[stateId];
        stateList.text(label, `state:${stateId}Id:${ticketId}Number:${ticketNumber}`).row();
      });

  await ctx.reply(`Выбери статус заявки #Номер_${ticketNumber}`,{reply_markup: stateList});
})

bot.callbackQuery(/^state:(\d+)Id:(\d+)Number:(\d+)$/, authMiddleware, async (ctx) => {
  const stateId = Number(ctx.match[1]);
  const ticketId = Number(ctx.match[2]);
  const ticketNumber = Number(ctx.match[3]);

  await ctx.answerCallbackQuery(`Меняю статус у заявки ${ticketNumber}`);

  try {
    await otrsApiService.updateTicket({
      TicketID: ticketId,
      StateID: stateId,
    })
    await ctx.reply(`Заявке #Номер_${ticketNumber} присвоен статус ${TicketStateLabelRu[stateId as TicketState]}`);
  } catch (e: any) {
    await ctx.reply(`Не удалось сменить статус`);
  }

})
// обработка текстов в зависимости от state + добавление Article по reply
bot.on('message:text', authMiddleware, async (ctx) => {
  const msg = ctx.message;
  const text = msg.text.trim();

  // 1) Если это reply на сообщение бота с тикетом — добавляем Article
  if (msg.reply_to_message && msg.reply_to_message.from?.is_bot) {
    const replied = msg.reply_to_message;

    // ищем номер тикета в тексте исходного сообщения, формат: #Номер_202601293600002
    const match = replied.text?.match(/#Номер_(\d+)/);
    if (match) {
      const ticketNumber = match[1];
      try {
        const ticketId = (await otrsApiService.getTicketList({
          TicketNumber: ticketNumber,
          ResultType: 'ARRAY',
          Limit: 1
        }) as TicketListResponse).Tickets?.[0].TicketID

        await otrsApiService.createArticle({
          Subject: 'Ответ из Telegram',
          Body: text,
          TicketID: ticketId
        });

        await ctx.reply(`Комментарий добавлен в тикет #${ticketNumber}`);
      } catch (e: any) {
        console.error(e);
        await ctx.reply(`Не удалось добавить комментарий в тикет #${ticketNumber}: ${e.message}`);
      }

      // reply‑логика обработана, дальше state не трогаем
      return;
    }
  }

  // 2) Логика авторизации по state

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
        ChallengeToken,
      });

      await ctx.reply(
          `Успешный вход в OTRS как ${Me.UserLogin}.\nТеперь этот Telegram‑аккаунт привязан к OTRS пользователю.`,
      );

      await ctx.api.setMyCommands(privateCommands, {
        scope: { type: 'chat', chat_id: ctx.chat!.id },
      });
    } catch (e: any) {
      console.error(e);
      await ctx.reply(`Не удалось войти в OTRS: ${e.message}`);
    }
    return;
  }

  // 3) Остальные текстовые сообщения (если нужно — сюда добавишь ещё логику)
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
