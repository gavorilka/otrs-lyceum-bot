import { MiddlewareFn } from "grammy";
import {MyContext} from "../types/bot.interface";
import otrsApiService from "../services/otrsApi.service";
import userService from "../services/user.service";

export const authMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
    const user = await userService.getUser(ctx);

    if (!user) {
        await ctx.reply(
            "❌ Ты ещё не зарегистрирован.\nИспользуй /login чтобы привязать OTRS."
        );
        return;
    }

    otrsApiService.auth = {
        OTRSAgentInterface: user.otrsSessionToken,
        ChallengeToken: user.otrsChallengeToken
    }
    // если надо — кладём пользователя в ctx
    ctx.user = user;
    await next();
};
