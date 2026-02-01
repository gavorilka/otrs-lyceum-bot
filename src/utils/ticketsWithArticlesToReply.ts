import {ArticleShort, TicketShort} from "../shared/types/otrsResponse.interface";
import {TicketPriority, TicketState} from "../shared/types/otrs.enum";
import {TicketPriorityLabelRu, TicketStateLabelRu} from "../shared/const/otrs.consts";

export function ticketsWithArticlesToReply(data: { ticket: TicketShort; articles: ArticleShort[];
}): string {

    // Извлечение данных из очереди
    const queueName = data.ticket.Queue.includes('::')
        ? data.ticket.Queue.split('::')[1]
        : data.ticket.Queue;

    // HTML для всех сообщений (каждое в свой blockquote)
    const messagesHtml = data.articles
        .map(article =>
            `<blockquote expandable>${article.Body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</blockquote>`
        )
        .join('\n');

    let text = `<b>Заявка</b>\n` +
        `#Номер_${data.ticket.TicketNumber}\n` +
        `<i>Приоритет:</i> ${TicketPriorityLabelRu[data.ticket.PriorityID as TicketPriority] || TicketPriorityLabelRu[TicketPriority.Normal]}\n` +
        `<i>Состояние:</i> ${TicketStateLabelRu[data.ticket.StateID as TicketState] || TicketStateLabelRu[TicketState.New]}\n` +
        `<i>Очередь:</i> ${queueName}\n` +
        `<i>Сервис:</i> ${data.ticket.Service}\n` +
        `\n` +
        `<b>Заявитель</b>\n` +
        `<i>ФИО:</i> ${data.ticket.Title}\n` +
        `<i>E-mail:</i> ${data.ticket.CustomerID}`

    if(messagesHtml) {
        text += `\n\n` +
            `<b>Сообщения</b>` +
            `\n${messagesHtml}`
    }
    return text;
}
