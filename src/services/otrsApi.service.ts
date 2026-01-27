import fetch from 'node-fetch';
import {otrsBaseUrl} from "../config/vars";

type OtrsAuth = {
    OTRSAgentInterface: string;
    ChallengeToken: string;
};

export class OtrsApiService {

    protected _baseUrl: string;
    protected _auth: { [key: string]: string | null };

    constructor(baseUrl: string) {
        this._baseUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/api`;
        this._auth = { OTRSAgentInterface: null, ChallengeToken: null };
    }

    set auth(value: OtrsAuth) {
        if (
            !value.ChallengeToken ||
            !value.OTRSAgentInterface
        ) {
            throw new Error('auth must contain string fields OTRSAgentInterface and ChallengeToken');
        }

        this._auth = {
            OTRSAgentInterface: value.OTRSAgentInterface,
            ChallengeToken: value.ChallengeToken,
        };
    }

    protected async _request(endpoint: string, data = {}) {
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
        const res = await this._request('/auth/login', data);
        if (res.Response === 'OK') {
            this._auth[res.SessionName] = res.SessionValue;
            //this.auth.OTRSAgentInterface = res.SessionValue;
            this._auth.ChallengeToken = res.ChallengeToken;
            return res;
        }
        throw new Error(res.Message || 'Login failed');
    }

    async logout() {
        const res = await this._request('/auth/logout');
        this._auth = { OTRSAgentInterface: null, ChallengeToken: null };
        return res;
    }

    async getTicketList(filters = {}) {
        console.log(this._auth)
        return this._request('/tickets/getTicketList', filters);
    }
}

export default new OtrsApiService(otrsBaseUrl);