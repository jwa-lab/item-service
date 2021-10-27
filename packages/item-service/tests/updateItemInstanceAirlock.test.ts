import { JSONCodec } from "nats";
import { UpdateItemInstanceAirlockHandler } from "../src/natsHandlers/updateItemInstance/UpdateItemInstance";
import logger from "./utils/mockLogger";
import { randomBytes } from "crypto";

describe("Given UpdateItemInstance Airlock Handler", () => {
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

        updateItemAirlockHandler = new UpdateItemInstanceAirlockHandler(
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
                        instance_number: 1,
                        data: {}
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
                        instance_number: 1,
                        data: {}
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"item_id" is required');
        });

        it("Then throws an error when instance_number is missing", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        data: {}
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"instance_number" is required');
        });

        it("Then throws an error when data values are not strings", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        instance_number: 1,
                        data: {
                            test: true
                        }
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow('"data.test" must be a string');
        });

        it("Then throws an error when data is too big (10001 bytes or higher)", () => {
            expect(
                updateItemAirlockHandler.handle({
                    body: {
                        item_id: 1,
                        instance_number: 1,
                        data: {
                            test: randomBytes(11000).toString("ascii")
                        }
                    },
                    headers: DEFAULT_STUDIO_HEADERS
                })
            ).rejects.toThrow(
                "Maximum payload size exceeded, got 11004 bytes but maximum is 10000 bytes."
            );
        });
    });

    describe("When called with a valid message body", () => {
        let response;

        beforeEach(async () => {
            natsConnection.request.mockReturnValue(
                Promise.resolve({
                    data: JSONCodec().encode({
                        item_id: 1,
                        instance_number: 1,
                        user_id: "Mr 2",
                        data: {},
                        tezos_contract_address: "tezos_contract_address",
                        tezos_block: "tezos_block"
                    })
                })
            );

            response = await updateItemAirlockHandler.handle({
                body: {
                    item_id: 1,
                    instance_number: 1,
                    data: {}
                },
                headers: DEFAULT_STUDIO_HEADERS
            });
        });

        it("Then calls the private handler", () => {
            expect(natsConnection.request.mock.calls[0][0]).toBe(
                "test-service.update-item-instance"
            );
        });

        it("Then returns the newly updated item instance", () => {
            expect(response).toEqual({
                item_id: 1,
                instance_number: 1,
                user_id: "Mr 2",
                data: {},
                tezos_contract_address: "tezos_contract_address",
                tezos_block: "tezos_block"
            });
        });
    });
});
