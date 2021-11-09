import { JWAError } from "@jwalab/js-common";

export class SQLUpdateNoRowsAffected extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            "SQLUpdateNoRowsAffected",
            `Error during the UPDATE request "${message}".`,
            "SQL_NO_UPDATE",
            origin
        );
    }
}
