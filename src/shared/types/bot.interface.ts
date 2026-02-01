import {Context, SessionFlavor} from "grammy";
import {User} from "../../db/entities/User";

export interface SessionData {
    state: 'WAITING_LOGIN' | 'WAITING_PASSWORD' | null;
    tmpLogin: string | null;
}

export interface AuthContext {
    user?: User;
}

export type MyContext = Context & SessionFlavor<SessionData> & AuthContext;