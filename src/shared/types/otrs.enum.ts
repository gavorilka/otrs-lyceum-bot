export enum TicketPriority {
    VeryLow   = 1,
    Low       = 2,
    Normal    = 3,
    High      = 4,
    VeryHigh  = 5,
}

export enum TicketState {
    New                    = 1,
    ClosedSuccessful       = 2,
    ClosedUnsuccessful     = 3,
    Open                   = 4,
    Deleted                = 5,
    PendingReminder        = 6,
    PendingAutoClosePlus   = 7,
    PendingAutoCloseMinus  = 8,
    Merged                 = 9,
    InProgress             = 10,
}