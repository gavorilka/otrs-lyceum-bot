import fetch from 'node-fetch';
import {otrsBaseUrl} from "../config/vars";
import {
    ArticlesResponse,
    CreateArticleResponse,
    CreateTicketParams, CreateTicketResponse,
    LoginResponse,
    OtrsAuth,
    TicketCountResponse,
    TicketListFilters,
    TicketListResponse, UpdateTicketParams, UpdateTicketResponse
} from "../types/otrsResponse.interface";

type Json = Record<string, any>;

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

    protected async _request<T extends Json = Json>(endpoint: string, data: Json= {}): Promise<T> {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this._baseUrl}${normalizedEndpoint}`;
        const body = { ...data, ...this._auth };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
    }

    async login(login: string, password: string) {
        const data = { User: login, Password: password };
        const res = await this._request<LoginResponse>('/auth/login', data);
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
    ): Promise<TicketListResponse | TicketCountResponse> {
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
    async createTicket(params: CreateTicketParams): Promise<CreateTicketResponse> {
        return this._request('/tickets/createTicket', params);
    }

    async updateTicket(params: UpdateTicketParams): Promise<UpdateTicketResponse> {
        return this._request('/tickets/updateTicket', params);
    }

    async createArticle(params: {
        TicketID: number;
        Subject: string;
        Body: string;
        // + ArticleType, Estimated и т.д.
    }): Promise<CreateArticleResponse> {
        return this._request('/tickets/createArticle', params);
    }

    /**
     * Получить записи к тикету по id.
     */

    async getArticles(ticketId: number, opts?: { Limit?: number; Page?: number }): Promise<ArticlesResponse> {
        return this._request('/tickets/getArticles', { TicketID: ticketId, ...opts });
    }

    async updateField<T extends string>(
        endpoint: `/tickets/update${Capitalize<T>}`,
        params: { TicketID: number; [key: string]: unknown },
    ): Promise<Json> {
        return this._request(endpoint, params);  // универсалка для updateQueue, updatePriority и т.п.
    }

    async updateOwner(ticketId: number, newOwnerId: number): Promise<Json> {
        return this.updateField('/tickets/updateOwner', { TicketID: ticketId, NewUserID: newOwnerId });
    }

}

export default new OtrsApiService(otrsBaseUrl);