import { MiddlewareFn } from "grammy";
import UserService from "../services/user.service";
import {MyContext} from "../types/bot.interface";

export const requireAuth: MiddlewareFn<MyContext> = async (ctx, next) => {
    const user = await UserService.getUser(ctx);

    if (!user) {
        await ctx.reply(
            "❌ Ты ещё не зарегистрирован.\nИспользуй /login чтобы привязать OTRS."
        );
        return;
    }

    // если надо — кладём пользователя в ctx
    ctx.user = user;
    await next();
};
