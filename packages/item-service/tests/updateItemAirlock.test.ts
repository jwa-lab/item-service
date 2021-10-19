import { JSONCodec } from "nats";
import { UpdateItemAirlockHandler } from "../src/natsHandlers/updateItem/UpdateItem";
import logger from "./utils/mockLogger";

describe("Given UpdateItem Airlock Handler", () => {
    let updateItemAirlockHandler;
    let natsConnection;

    const DEFAULT_STUDIO_HEADERS = {
        studio_id: "studio_id",
        is_studio: true
    };

    beforeEach(() => {
        natsConnection = {
            request: jest.fn()
        };

        updateItemAirlockHandler = new UpdateItemAirlockHandler(
            "test-service",
            logger,
            natsConnection
        );
    });

    describe("When called with an invalid token type", () => {
        it("Then throws an error indicating a bad token", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        name: "test",
                        total_quantity: 10,
                        data: {},
                        frozen: false
                    },
                    headers: {
                        studio_id: "studio_id",
                        is_studio: false
                    }
                })
            ).rejects.toThrow(
                "Invalid token type, a studio token is required."
            );
        });
    });

    describe("When called with an invalid message body", () => {
        it("Then throws an error when item_id is missing", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        name: "world",
                        total_quantity: 10,
                        data: {},
                        frozen: false
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"item_id" is required');
        });

        it("Then throws an error when name is missing", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        total_quantity: 10,
                        data: {},
                        frozen: false
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"name" is required');
        });

        it("Then throws an error when name is too long", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        name: new Array(101).fill("a").join(""),
                        total_quantity: 10,
                        data: {},
                        frozen: false
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow(
                '"name" length must be less than or equal to 100 characters long'
            );
        });

        it("Then throws an error when frozen is missing", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        name: "hello",
                        total_quantity: 10,
                        data: {}
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"frozen" is required');
        });

        it("Then throws an error when total_quantity is negative", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        name: "hello",
                        total_quantity: -1,
                        data: {},
                        frozen: false
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow(
                '"total_quantity" must be greater than or equal to 1'
            );
        });

        it("Then throws an error when data values are not strings", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        name: "hello",
                        total_quantity: 10,
                        data: {
                            test: true
                        },
                        frozen: false
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"data.test" must be a string');
        });
    });

    describe("When called with a valid message body", () => {
        let response;

        beforeEach(async () => {
            natsConnection.request.mockReturnValue(
                Promise.resolve({
                    data: JSONCodec().encode({
                        item_id: 1,
                        studio_id: "studio_id",
                        name: "new name !",
                        total_quantity: 100,
                        available_quantity: 100,
                        frozen: false,
                        data: {}
                    })
                })
            );

            response = await updateItemAirlockHandler.handle({
                body: {
                    item_id: 1,
                    name: "hello",
                    total_quantity: 10,
                    data: {},
                    frozen: false
                },
                headers: DEFAULT_STUDIO_HEADERS
            });
        });

        it("Then calls the private handler", () => {
            expect(natsConnection.request.mock.calls[0][0]).toBe(
                "test-service.update-item"
            );
        });

        it("Then returns the newly updated item", () => {
            expect(response).toEqual({
                item_id: 1,
                studio_id: "studio_id",
                name: "new name !",
                available_quantity: 100,
                total_quantity: 100,
                frozen: false,
                data: {}
            });
        });
    });
});
