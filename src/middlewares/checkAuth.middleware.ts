import {MiddlewareFn} from "grammy";
import {MyContext} from "../shared/types/bot.interface";
import userService from "../services/user.service";
import otrsApiService from "../services/otrsApi.service";

export const checkAuthMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
    const user = await userService.getUser(ctx);

    if (!user) {
        return await next();
    }

    otrsApiService.auth = {
        OTRSAgentInterface: user.otrsSessionToken,
        ChallengeToken: user.otrsChallengeToken
    }

    ctx.user = user;
    await next();
};