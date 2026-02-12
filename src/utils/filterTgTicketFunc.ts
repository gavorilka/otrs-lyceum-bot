import { InlineKeyboard } from "grammy";
import { MyContext } from "../shared/types/bot.interface";
import otrsApiService from "../services/otrsApi.service";
import {TicketListFilters} from "../shared/types/otrsResponse.interface";

const PAGE_SIZE = 5;

export const renderTicketPage = async (
    ctx: MyContext,
    page: number,
    isEdit = false
) => {
    const session = ctx.session.ticketListData;

    if (!session) return;

    // защита от чужих нажатий
    if (ctx.from?.id !== session.ownerId) {
        await ctx.answerCallbackQuery({
            text: "Это меню не для вас",
            show_alert: false,
        });
        return;
    }

    // защита от спама
    if (session.loading) {
        await ctx.answerCallbackQuery();
        return;
    }

    session.loading = true;

    try {
        const totalPages = Math.ceil(session.count / PAGE_SIZE);

        // защита от выхода за границы
        if (page < 0) page = 0;
        if (page > totalPages - 1) page = totalPages - 1;

        const response = await otrsApiService.getTicketList({
            ...session.filters,
            Limit: PAGE_SIZE,
            Offset: page * PAGE_SIZE,
        });

        if (!("Tickets" in response)) {
            throw new Error("Invalid response");
        }

        const keyboard = new InlineKeyboard();

        for (const ticket of response.Tickets) {
            keyboard
                .text(
                    `${ticket.Title.slice(0, 40)} (${ticket.State})`,
                    `ticket:${ticket.TicketID}`
                )
                .row();
        }

        if (totalPages > 1) {
            keyboard.row();

            if (page > 0) {
                keyboard.text("⬅️", `page:${page - 1}`);
            }

            keyboard.text(`📄 ${page + 1}/${totalPages}`, "noop");

            if (page < totalPages - 1) {
                keyboard.text("➡️", `page:${page + 1}`);
            }
        }

        session.page = page;

        if (isEdit) {
            try {
                await ctx.editMessageText(session.message, {
                    reply_markup: keyboard,
                });
            } catch (e: any) {
                // message is not modified — игнорим
                if (!e.description?.includes("message is not modified")) {
                    throw e;
                }
            }
        } else {
            await ctx.reply(session.message, {
                reply_markup: keyboard,
            });
        }
    } finally {
        session.loading = false;
    }
};

export const filterTgTicketFunc = async (
    ctx: MyContext,
    filters: TicketListFilters,
    message: string
) => {
    try {
        const count = await otrsApiService.getTicketCount(filters);

        if (count === 0) {
            await ctx.reply("Нет заявок, соответствующих фильтру.");
            return;
        }

        ctx.session.ticketListData = {
            filters,
            message,
            count,
            page: 0,
            ownerId: ctx.from!.id,
        };

        await renderTicketPage(ctx, 0, false);
    } catch (error: any) {
        await ctx.reply(error.message);
    }
};
