class SQLUpdateNoRowsAffected extends Error {
    constructor(message: string) {
        super(`Error during the UPDATE request "${message}".`);
        this.name = "SQLUpdateNoRowsAffected";
    }
}

export { SQLUpdateNoRowsAffected };
