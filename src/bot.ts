import {Bot, GrammyError, HttpError, InlineKeyboard, session, Context, SessionFlavor} from "grammy";
import { OtrsApiClient } from './otrsApiClient';
import {botToken, otrsBaseUrl} from "./config/vars";


export interface SessionData {
  state: 'WAITING_LOGIN' | 'WAITING_PASSWORD' | null;
  tmpLogin: string | null;
}

export type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(botToken);
const otrs = new OtrsApiClient(otrsBaseUrl);
console.log("Токен:", botToken);
bot.use(session({ initial: (): SessionData => ({ state: null, tmpLogin: null }) }));


// Главное меню с 4 кнопками
// const menu = new InlineKeyboard()
//     .text("Родитель", "btn1")
//     .text("Ученик", "btn2").row()
//     .text("Сотрудник", "btn3")
//     .text("Кнопка 4", "btn4");
//
// const menu2 = new InlineKeyboard()
//     .text("Кнопка5", "btn5").row()
//     .text("Кнопка 6", "btn6").row()
//     .text("Кнопка 7", "btn7").row()
//     .text("Кнопка 8", "btn8");

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


// Обработка нажатий
// bot.callbackQuery("btn1", async (ctx) => await ctx.reply("Нажата кнопка 1",{ reply_markup: menu2 }));
// bot.callbackQuery("btn2", (ctx) => ctx.answerCallbackQuery("Нажата кнопка 2"));
// bot.callbackQuery("btn3", (ctx) => ctx.answerCallbackQuery("Нажата кнопка 3"));
// bot.callbackQuery("btn4", (ctx) => ctx.answerCallbackQuery("Нажата кнопка 4"));

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
