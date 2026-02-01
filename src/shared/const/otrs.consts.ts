import {TicketPriority, TicketState} from "../types/otrs.enum";

// RU-лейблы (можно позже заменить на i18n)

export const TicketPriorityLabelRu: Record<TicketPriority, string> = {
    [TicketPriority.VeryLow]:  'Очень низкий',
    [TicketPriority.Low]:      'Низкий',
    [TicketPriority.Normal]:   'Нормальный',
    [TicketPriority.High]:     'Срочная',
    [TicketPriority.VeryHigh]: 'Горит',
};

export const TicketStateLabelRu: Record<TicketState, string> = {
    [TicketState.New]:                   'Новая',
    [TicketState.ClosedSuccessful]:      'Закрыта успешно',
    [TicketState.ClosedUnsuccessful]:    'Закрыта не успешно',
    [TicketState.Open]:                  'Открыта',
    [TicketState.Deleted]:               'Удалена',
    [TicketState.PendingReminder]:       'Ожидает напоминания',
    [TicketState.PendingAutoClosePlus]:  'Ожидает автозакрытия+',
    [TicketState.PendingAutoCloseMinus]: 'Ожидает автозакрытия-',
    [TicketState.Merged]:                'Объединенная',
    [TicketState.InProgress]:            'Принята в работу',
};
