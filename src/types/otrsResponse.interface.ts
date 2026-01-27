export interface Ticket {
    EscalationSolutionTime: number;
    SLAID: number | null;
    EscalationTime: number;
    CustomerID: string;
    LockID: number;
    OwnerID: number;
    UntilTime: number;
    Lock: string;
    StateID: number;
    ArchiveFlag: string;
    Service: string;
    ChangedServer: string;
    CreateBy: number;
    CreatedServer: string;
    CustomerUserID: string;
    ChangeBy: number;
    CreateTimeUnix: number;
    CustomerUserLastname: string | null;
    QueueID: number;
    EscalationUpdateTime: number;
    StateType: string;
    Responsible: string;
    UnlockTimeout: number;
    Priority: string;
    HasWatch: number;
    Created: string;
    Changed: string;
    Queue: string;
    Seen: number;
    Title: string;
    DynamicFields: Record<string, any>;
    Type: string;
    TypeID: number;
    GroupID: number;
    Age: number;
    LinkCount: number;
    RealTillTimeNotUsed: number;
    TicketID: number;
    PriorityID: number;
    TicketNumber: string;
    ServiceID: number;
    Owner: string;
    CustomerUserFirstname: string | null;
    UntilTimeDate: string | null;
    ResponsibleID: number;
    WatcherCount: number;
    State: string;
    UntilTimeDateUnix: number;
    EscalationResponseTime: number;
}

export interface TicketListResponse {
    NeedTokenUpdate: number;
    Tickets: Ticket[];
    Response: string;
}

export interface TicketCountResponse {
    Response: string;
    Count: number;
    NeedTokenUpdate: number;
}