import {Bot, GrammyError, HttpError, InlineKeyboard, session} from "grammy";
import {botToken} from "./config/vars";
import {MyContext, SessionData} from "./types/bot.interface";
import otrsApiService from "./services/otrsApi.service";
import {requireAuth} from "./middlewares/requireAuth";
import userService from "./services/user.service";

const bot = new Bot<MyContext>(botToken);


console.log("Токен:", botToken);

bot.use(session({ initial: (): SessionData => ({ state: null, tmpLogin: null }) }));

const publicCommands = [
  { command: "start", description: "Начало работы" },
  { command: "login", description: "Войти в OTRS" },
];

const privateCommands = [
  { command: "me", description: "Мой профиль" },
  { command: "tickets", description: "Мои тикеты" },
  { command: "logout", description: "Выйти" },
];

bot.command("start", async (ctx) => {
  const user = await userService.getUser(ctx);

  if (user) {
    await ctx.api.setMyCommands(privateCommands, {
      scope: { type: "chat", chat_id: ctx.chat!.id },
    });

    await ctx.reply(`С возвращением, ${user.otrsLogin}!`);
  } else {
    await ctx.api.setMyCommands(publicCommands, {
      scope: {type: "chat", chat_id: ctx.chat!.id},
    });
  }

  //await ctx.reply("Привет! Вот меню:", { reply_markup: menu });
  await ctx.reply(`Привет, ${ctx.from?.first_name}! Отправь /login чтобы связать Telegram с аккаунтом OTRS.`);
  console.log(ctx);
});

bot.command('login', async (ctx) => {
  ctx.session.state = 'WAITING_LOGIN';
  await ctx.reply('Введи логин OTRS:');
});

bot.command('me', requireAuth, async (ctx) => {
  const user = ctx.user;
  const ticketList = await otrsApiService.getTicketList({ UserLogin: 'agent1' });
  console.log(ticketList)
  await ctx.reply(`Ответ ${ticketList}`);
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
