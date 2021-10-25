import { AssignItemHandler } from "../src/natsHandlers/assignItem/AssignItem";
import { ItemAssignedEvent } from "../src/events/item";
import logger from "./utils/mockLogger";
import eventBus from "./utils/mockEventBus";

describe("Given AssignItem Handler", () => {
    let assignItemHandler;
    let itemRepository;
    let itemInstancesRepository;
    let mockTransactionManager;

    beforeEach(() => {
        itemInstancesRepository = {
            createInstance: jest.fn().mockReturnValue({
                item_id: 1,
                user_id: "test_user_id",
                instance_number: 1,
                data: {}
            })
        };

        itemRepository = {
            assignItem: jest.fn().mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "Awesome item",
                total_quantity: 10,
                available_quantity: 9,
                data: {
                    some: "data"
                },
                frozen: false
            }),
            getItem: jest.fn().mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "Awesome item",
                total_quantity: 10,
                available_quantity: 10,
                data: {
                    some: "data"
                },
                frozen: false
            })
        };

        mockTransactionManager = {
            transaction: (fn) => fn()
        };

        assignItemHandler = new AssignItemHandler(
            "test-service",
            logger,
            itemRepository,
            itemInstancesRepository,
            eventBus,
            mockTransactionManager
        );
    });

    describe("When called with a missing studio_id", () => {
        it("Then throws an error indicating missing studio id", () => {
            expect(
                assignItemHandler.handle({
                    data: {
                        is_studio: true,
                        item_id: 1,
                        user_id: "test_user_id"
                    }
                })
            ).rejects.toThrow("STUDIO_ID_MISSING");
        });
    });

    describe("When called with a bad token type", () => {
        it("Then throws an error indicating a bad token type", () => {
            expect(
                assignItemHandler.handle({
                    data: {
                        is_studio: false,
                        studio_id: "studio_id",
                        item_id: 1,
                        user_id: "test_user_id"
                    }
                })
            ).rejects.toThrow("INVALID_JWT_STUDIO");
        });
    });

    describe("When called with no user id", () => {
        it("Then throws an error indicating a missing user id", () => {
            expect(
                assignItemHandler.handle({
                    data: {
                        is_studio: true,
                        studio_id: "studio_id",
                        item_id: 1
                    }
                })
            ).rejects.toThrow("USER_ID_MISSING");
        });
    });

    describe("When called with no item id", () => {
        it("Then throws an error indicating a missing item id", () => {
            expect(
                assignItemHandler.handle({
                    data: {
                        is_studio: true,
                        studio_id: "studio_id",
                        user_id: "test_user_id"
                    }
                })
            ).rejects.toThrow("MISSING_ITEM_ID");
        });
    });

    describe("When called in a nominal case", () => {
        let response;

        beforeEach(async () => {
            response = await assignItemHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1,
                    user_id: "test_user_id"
                }
            });
        });

        it("Then publishes a new ItemAssignedEvent event", () => {
            expect(eventBus.publish.mock.calls[0][0]).toEqual(
                new ItemAssignedEvent(1, 1, "test_user_id")
            );
        });

        it("Then return the created instance", () => {
            expect(response).toEqual({
                item_id: 1,
                user_id: "test_user_id",
                instance_number: 1,
                data: {
                    some: "data"
                }
            });
        });
    });
});
