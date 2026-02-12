import {Context, SessionFlavor} from "grammy";
import {User} from "../../db/entities/User";
import {TicketListFilters} from "./otrsResponse.interface";

export interface SessionData {
    state: 'WAITING_LOGIN' | 'WAITING_PASSWORD' | null;
    tmpLogin: string | null;
    ticketListData?: {
            filters: TicketListFilters
            message: string
            count: number
            page: number
            ownerId: number
            loading?: boolean
    };
}

export interface AuthContext {
    user?: User;
}

export type MyContext = Context & SessionFlavor<SessionData> & AuthContext;