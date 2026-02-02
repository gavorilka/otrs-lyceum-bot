import db from "../db/db";
import {User} from "../db/entities/User";
import {MyContext} from "../shared/types/bot.interface";

export class UserService {
    private repo = db.getRepository(User);

    async upsertByTelegramId(data: {
        TelegramUserId: number;
        OtrsUserId:number;
        OtrsLogin: string;
        SessionValue?: string;
        ChallengeToken?: string;
    }) {
        await this.repo.upsert(
            {
                telegramUserId: data.TelegramUserId,
                otrsUserId: data.OtrsUserId,
                otrsLogin: data.OtrsLogin,
                otrsSessionToken: data.SessionValue,
                otrsChallengeToken: data.SessionValue,
            },
            ["telegramUserId"]
        );
    }

    async getUser(ctx: MyContext) {
        if (!ctx.from) return null;

        return this.repo.findOneBy({
            telegramUserId: ctx.from.id,
        })
    }

}

export default new UserService();
