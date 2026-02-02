import { MiddlewareFn } from "grammy";
import {MyContext} from "../shared/types/bot.interface";
import otrsApiService from "../services/otrsApi.service";
import userService from "../services/user.service";

export const requiredAuthMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
    const user = await userService.getUser(ctx);
    //console.log(user);
    if (!user) {
        await ctx.reply(
            "❌ Ты ещё не вошёл.\nИспользуй /login чтобы войти OTRS."
        );
        return;
    }

    otrsApiService.auth = {
        OTRSAgentInterface: user.otrsSessionToken,
        ChallengeToken: user.otrsChallengeToken
    }

    ctx.user = user;
    await next();
};
