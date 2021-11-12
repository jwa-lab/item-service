import { JSONCodec } from "nats";
import { GetItemsAirlockHandler } from "../src/natsHandlers/getItems/GetItems";
import logger from "./utils/mockLogger";

describe("Given GetItems Airlock Handler", () => {
    let getItemsAirlockHandler;
    let natsConnection;
    const DEFAULT_STUDIO_HEADERS = {
        studio_id: "studio_id",
        is_studio: true
    };

    beforeEach(() => {
        natsConnection = {
            request: jest.fn(() =>
                Promise.resolve({
                    data: JSONCodec().encode({
                        results: [],
                        pagination: {
                            from: 0,
                            count: 0,
                            total: 0
                        }
                    })
                })
            )
        };

        getItemsAirlockHandler = new GetItemsAirlockHandler(
            "item-service",
            logger,
            natsConnection
        );
    });

    describe("When called with an invalid token type", () => {
        it("Then throws an error indicating a bad token", () => {
            expect(
                getItemsAirlockHandler.handle({
                    query: {
                        start: 0,
                        limit: 10
                    },
                    headers: {
                        studio_id: "studio_id",
                        is_studio: false
                    }
                })
            ).rejects.toThrow(
                "Invalid token type provided. Details: A studio token is expected."
            );
        });
    });

    describe("When called with invalid arguments", () => {
        it("Then throws an error when start is negative", () => {
            expect(
                getItemsAirlockHandler.handle({
                    query: {
                        start: -1,
                        limit: 10
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"start" must be greater than or equal to 0');
        });

        it("Then throws an error when limit is inferior to 1", () => {
            expect(
                getItemsAirlockHandler.handle({
                    query: {
                        start: 0,
                        limit: 0
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"limit" must be greater than or equal to 1');
        });
    });

    describe("When called with no arguments", () => {
        let response;

        beforeEach(async () => {
            response = await getItemsAirlockHandler.handle({
                query: {},
                headers: DEFAULT_STUDIO_HEADERS
            });
        });

        it("Then calls the private handler", () => {
            expect(natsConnection.request.mock.calls[0][0]).toBe(
                "item-service.get-items"
            );
        });

        it("Then returns the results and the pagination", () => {
            expect(response).toEqual({
                results: [],
                pagination: {
                    from: 0,
                    count: 0,
                    total: 0
                }
            });
        });
    });

    describe("When called with valid arguments", () => {
        let response;

        beforeEach(async () => {
            response = await getItemsAirlockHandler.handle({
                query: {
                    start: 0,
                    limit: 10
                },
                headers: DEFAULT_STUDIO_HEADERS
            });
        });

        it("Then calls the private handler", () => {
            expect(natsConnection.request.mock.calls[0][0]).toBe(
                "item-service.get-items"
            );
        });

        it("Then returns the results and the pagination", () => {
            expect(response).toEqual({
                results: [],
                pagination: {
                    from: 0,
                    count: 0,
                    total: 0
                }
            });
        });
    });
});
