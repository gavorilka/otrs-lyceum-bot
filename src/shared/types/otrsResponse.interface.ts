export type OtrsAuth = {
    OTRSAgentInterface: string;
    ChallengeToken: string;
};

export type ApiRequest<T = unknown> = Partial<OtrsAuth> & T

export interface LoginRequest {
    User: string,
    Password: string
}

export type ApiResponse<T = unknown> = {
    Response: 'OK' | 'ERROR';
    Message?: string;
} & T;

export interface MeResponse {
    Avatar: string;
    Email: string;
    FirstName: string;
    UserLogin: string;
    FullName: string;
    LastName: string;
    ID: number;
}

export interface LoginSettings {
    Language: string;
}

export interface LoginResponse {
    SessionName: string;
    Settings: LoginSettings;
    Me: MeResponse;
    SessionValue: string;
    ChallengeToken: string;
}

export interface TicketShort {
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
    Tickets: TicketShort[];
    Count?: number;
    NeedTokenUpdate?: 0 | 1;
}

export interface TicketCountResponse{
    Count: number;
    NeedTokenUpdate?: 0 | 1;
}

export type TicketDynamicFieldsMode = 'none' | 'mobile' | 'all';

export interface TicketListFilters {
    // базовые
    ViewID?: number;
    FullTextSearch?: string;

    TicketID?: number;
    TicketNumber?: string;
    Title?: string;

    Queues?: string[];       // comma‑separated в Perl, у нас уже массив
    QueueIDs?: number[];

    Types?: string[];
    TypeIDs?: number[];

    States?: string[];
    StateIDs?: number[];
    StateType?: string;      // Open/Closed/...

    Priorities?: string[];
    PriorityIDs?: number[];

    Services?: string[];
    ServiceIDs?: number[];

    SLAs?: string[];
    SLAIDs?: number[];

    Locks?: string[];
    LockIDs?: number[];

    OwnerIDs?: number[];
    ResponsibleIDs?: number[];
    WatchUserIDs?: number[];

    CustomerID?: string;
    CustomerUserLogin?: string;

    From?: string;
    To?: string;
    Cc?: string;
    Subject?: string;
    Body?: string;

    SortBy?: string | string[];   // Age, EscalationSolutionTime и т.п.
    OrderBy?: 'Up' | 'Down' | ('Up' | 'Down')[];

    Count?: boolean;  // если true, то вернёт только Count, без массива Tickets
    DynamicFieldsMode?: TicketDynamicFieldsMode;

    // пагинация
    Offset?: number;
    Limit?: number;

    // прочие параметры API, если начнёте использовать:
    UserID?: number;          // берётся из сессии на стороне OTRS, но в API тоже есть
    SmartSort?: 0 | 1;        // SmartTicketSearch в Perl
}


export interface CreateTicketResponse {
    TicketID?: number;
    FailedOperations?: string[];  // если createTicket с ошибками (dynamic fields и т.п.)
}

export interface UpdateTicketResponse {
    FailedUpdatedItems?: string[];  // "Title, Queue" если не обновилось
}

export interface CreateArticleResponse {
    ArticleID?: number;
    FailedOperations?: string[];
}

export interface ArticlesResponse {
    Articles?: ArticleShort[];  // см. ниже
    Count?: number;
}

export interface ArticleShort {
    ArticleID: number;
    Subject: string;
    Body: string;
    CreateTime: string;
    SenderType: string;
    // + From, To, Cc, Direction (из roadmap 6.35.207)
}

// CreateTicketParams (из тестов + Perl CreateTicket)
export interface CreateTicketParams {
    Title: string;
    QueueID: number;
    PriorityID: number;
    Body?: string;  // для авто‑артикля
    ArticleType?: 'email' | 'phone' | 'chat' | 'internal';
    SenderType?: 'agent' | 'customer';
    CustomerID?: string;
    CustomerUser?: string;
    StateID?: number;
    TypeID?: number;
    ServiceID?: number;
    SLAID?: number;
    OwnerID?: number;
    Lock?: 'lock' | 'unlock';  // LockByOwner=true по умолчанию
    Estimated?: string;  // "10" (минуты?)
    UntilTimeDateUnix?: number;
    From?: string;
    To?: string;
    Cc?: string;
    ReplyTo?: string;
    ContentType?: 'text/html';
    DynamicFields?: Record<string, unknown>;
}

// UpdateTicketParams (из тестов + Perl UpdateTicket)
export interface UpdateTicketParams {
    TicketID: number;
    Title?: string;
    QueueID?: number;
    TypeID?: number;
    ServiceID?: number;
    SLAID?: number;
    CustomerID?: string;
    CustomerUserID?: string;
    Lock?: 'lock' | 'unlock';
    StateID?: number;
    NewOwnerID?: number;
    NewResponsibleID?: number;
    PriorityID?: number;
    UntilTimeDateUnix?: number;  // или Year/Month/Day/Hour/Minute
    Rule?: 'TicketEdit';  // из roadmap
    ArchiveFlag?: 'y' | 'n';
    DynamicFields?: Record<string, unknown>;
    // Нельзя менять State/Owner/Priority если !locked (roadmap)
}
