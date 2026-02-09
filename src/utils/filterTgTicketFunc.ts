import {CommandContext, InlineKeyboard} from "grammy";
import {MyContext} from "../shared/types/bot.interface";
import {TicketListFilters} from "../shared/types/otrsResponse.interface";
import otrsApiService from "../services/otrsApi.service";

export const filterTgTicketFunc = async (ctx: CommandContext<MyContext>, filters: TicketListFilters, message: string) => {
    try {
        const count = await otrsApiService.getTicketCount(filters);
        if (count === 0) {
            await ctx.reply("Нет заявок, соответствующих фильтру.");
            return;
        }
        const response = await otrsApiService.getTicketList({
            ...filters,
            Limit: count
        });
        if (!('Tickets' in response)) {
            return new Error("Response does not contain Tickets")
        }

        const ticketList = new InlineKeyboard()

        for (const  ticket of response.Tickets) {
            ticketList.text(`${ticket.Title} (${ticket.State})`, `ticket:${ticket.TicketID}`).row()
        }

        await ctx.reply(`${message}`, { reply_markup: ticketList });
    } catch (error: any) {
        await ctx.reply(error.message);
    }
}