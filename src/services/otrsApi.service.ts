import fetch from 'node-fetch';
import {otrsBaseUrl} from "../config/vars";
import {
    ApiRequest, ApiResponse, ArticleShort,
    ArticlesResponse,
    CreateArticleResponse,
    CreateTicketParams, CreateTicketResponse, LoginRequest,
    LoginResponse,
    OtrsAuth,
    TicketCountResponse,
    TicketListFilters,
    TicketListResponse, TicketShort, UpdateTicketParams, UpdateTicketResponse
} from "../types/otrsResponse.interface";

export class OtrsApiService {

    protected _baseUrl: string;
    protected _auth: Partial<OtrsAuth>;

    constructor(baseUrl: string) {
        this._baseUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/api`;
        this._auth = {};
    }

    set auth(value: OtrsAuth) {
        this._auth = {
            OTRSAgentInterface: value.OTRSAgentInterface,
            ChallengeToken: value.ChallengeToken,
        };
    }

    protected async _request<TRes = unknown, TReq = unknown>(endpoint: string, data: TReq | {} = {}): Promise<ApiResponse<TRes>> {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this._baseUrl}${normalizedEndpoint}`;
        const body: ApiRequest<TReq | {}> = {
            ...data,
            ...this._auth
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
    }

    async login(login: string, password: string) {
        const data: LoginRequest = { User: login, Password: password };
        const res = await this._request<LoginResponse, LoginRequest>('/auth/login', data);
        if (res.Response === 'OK') {
            this.auth = {
                OTRSAgentInterface: res.SessionValue,
                ChallengeToken: res.ChallengeToken
            }
            return res;
        }
        throw new Error(res.Message || 'Login failed');
    }

    async logout() {
        const res = await this._request('/auth/logout');
        this._auth = {};
        return res;
    }

    /**
     * Получение списка тикетов или только количества.
     * Соответствует tickets getTicketList (ResultType=ARRAY/COUNT).
     */
    async getTicketList(
        filters: TicketListFilters = {},
    ): Promise<ApiResponse<TicketListResponse|TicketCountResponse>> {
        // Приведение массивов к формату API (comma-separated), если нужно
        const normalizeArray = (v?: string[] | number[]) =>
            Array.isArray(v) ? v.join(',') : v;

        const payload: Record<string, unknown> = {
            ...filters,
            Queues: normalizeArray(filters.Queues),
            QueueIDs: normalizeArray(filters.QueueIDs),
            Types: normalizeArray(filters.Types),
            TypeIDs: normalizeArray(filters.TypeIDs),
            States: normalizeArray(filters.States),
            StateIDs: normalizeArray(filters.StateIDs),
            Priorities: normalizeArray(filters.Priorities),
            PriorityIDs: normalizeArray(filters.PriorityIDs),
            Services: normalizeArray(filters.Services),
            ServiceIDs: normalizeArray(filters.ServiceIDs),
            SLAs: normalizeArray(filters.SLAs),
            SLAIDs: normalizeArray(filters.SLAIDs),
            Locks: normalizeArray(filters.Locks),
            LockIDs: normalizeArray(filters.LockIDs),
            OwnerIDs: normalizeArray(filters.OwnerIDs),
            ResponsibleIDs: normalizeArray(filters.ResponsibleIDs),
            WatchUserIDs: normalizeArray(filters.WatchUserIDs),
            SortBy: Array.isArray(filters.SortBy) ? filters.SortBy.join(',') : filters.SortBy,
            OrderBy: Array.isArray(filters.OrderBy) ? filters.OrderBy.join(',') : filters.OrderBy,
        };

        return this._request<TicketListResponse | TicketCountResponse>(
            '/tickets/getTicketList',
            payload,
        );
    }

    /**
     * Удобная обёртка, если нужно только Count tickets.
     */

    async getTicketCount(filters: Omit<TicketListFilters, 'ResultType'> = {}): Promise<number> {
        const res = await this.getTicketList({ ...filters, ResultType: 'COUNT' });
        if ((res as TicketCountResponse).Count != null) {
            return (res as TicketCountResponse).Count;
        }
        return (res as any).Tickets?.length ?? 0;
    }

    /**
     * Создание заявки.
     */
    async createTicket(params: ApiRequest<CreateTicketParams>) {
        return this._request<CreateTicketResponse>('/tickets/createTicket', params);
    }

    async updateTicket(params: ApiRequest<UpdateTicketParams>) {
        return this._request<UpdateTicketResponse>('/tickets/updateTicket', params);
    }

    async createArticle(params: {
        TicketID: number;
        Subject: string;
        Body: string;
        // + ArticleType, Estimated и т.д.
    }) {
        return this._request<CreateArticleResponse>('/tickets/createArticle', params);
    }

    /**
     * Получить записи к тикету по id.
     */

    async getArticles(ticketId: number, opts?: { Limit?: number; Page?: number }) {
        return this._request<ArticlesResponse, {TicketID: number} >('/tickets/getArticles', { TicketID: ticketId, ...opts });
    }

    async updateField<T extends string>(
        endpoint: `/tickets/update${Capitalize<T>}`,
        params: { TicketID: number; [key: string]: unknown },
    ) {
        return this._request(endpoint, params);  // универсалка для updateQueue, updatePriority и т.п.
    }

    async updateOwner(ticketId: number, newOwnerId: number) {
        return this.updateField('/tickets/updateOwner', { TicketID: ticketId, NewUserID: newOwnerId });
    }

    async getSingleTicket(ticketId: number): Promise<TicketShort | null> {
        const res = await this.getTicketList({
            TicketID: ticketId,
            ResultType: 'ARRAY',
            Limit: 1
        });

        return (res as TicketListResponse).Tickets?.[0] || null;
    }

    async getTicketWithArticles(ticketId: number): Promise<{
        ticket: TicketShort | null;
        articles: ArticleShort[];
    }> {
        const [ticketRes, articlesRes] = await Promise.all([
            this.getSingleTicket(ticketId),
            this.getArticles(ticketId)
        ]);

        return {
            ticket: ticketRes,
            articles: (articlesRes as ArticlesResponse).Articles || []
        };
    }
}

export default new OtrsApiService(otrsBaseUrl);