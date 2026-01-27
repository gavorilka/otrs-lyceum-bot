import {Bot, GrammyError, HttpError, InlineKeyboard, session, Context, SessionFlavor} from "grammy";
import { OtrsApiClient } from './otrsApiClient';
import {botToken, otrsBaseUrl} from "./config/vars";
import db from "./db/db";
import {User} from "./db/entities/User";


export interface SessionData {
  state: 'WAITING_LOGIN' | 'WAITING_PASSWORD' | null;
  tmpLogin: string | null;
}

export type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(botToken);
const otrs = new OtrsApiClient(otrsBaseUrl);
const userRepo = db.getRepository(User);

console.log("Токен:", botToken);
bot.use(session({ initial: (): SessionData => ({ state: null, tmpLogin: null }) }));

bot.command("start", async (ctx) => {
  //await ctx.reply("Привет! Вот меню:", { reply_markup: menu });
  await ctx.reply(`Привет, ${ctx.from?.first_name}! Отправь /login чтобы связать Telegram с аккаунтом OTRS.`);
  console.log(ctx);
});

bot.command('login', async (ctx) => {
  ctx.session.state = 'WAITING_LOGIN';
  await ctx.reply('Введи логин OTRS:');
});

bot.command('me', async (ctx) => {
  const ticketList = await otrs.getTicketList({ UserLogin: 'agent1' });
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
      const { SessionValue, ChallengeToken, Me } = await otrs.login(login!, password);

      await userRepo.upsert({
        telegramUserId: ctx.from!.id,
        otrsLogin: Me.UserLogin,
        otrsSessionToken: SessionValue,
        otrsChallengeToken: ChallengeToken
      },["telegramUserId"]);

      await ctx.reply(
          `Успешный вход в OTRS как ${Me.UserLogin}.\nТеперь этот Telegram‑аккаунт привязан к OTRS пользователю.`
      );
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
