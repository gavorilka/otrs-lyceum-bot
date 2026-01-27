import {Entity, Column, PrimaryColumn} from "typeorm";

@Entity()
export class User {
    @PrimaryColumn({ type: "bigint", unique: true })
    telegramUserId!: number;

    @Column({ type: "varchar" })
    otrsLogin!: string;

    @Column({ type: "varchar", nullable: true })
    otrsSessionToken!: string;

    @Column({ type: "varchar", nullable: true })
    otrsChallengeToken!: string;
}
