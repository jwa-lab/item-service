import { FreezeItemHandler } from "../src/natsHandlers/freezeItem/FreezeItem";
import { ItemFrozenEvent } from "../src/events/item";

import logger from "./utils/mockLogger";
import eventBus from "./utils/mockEventBus";
import { SavedItem } from "../src/entities/item";

describe("Given FreezeItem Handler", () => {
    let freezeItemHandler;
    let itemRepository;
    let transactionManager;

    beforeEach(() => {
        itemRepository = {
            updateItem: jest.fn(),
            getItem: jest.fn()
        };

        transactionManager = {
            transaction: (fn) => fn()
        };

        freezeItemHandler = new FreezeItemHandler(
            "test-service",
            logger,
            itemRepository,
            eventBus,
            transactionManager
        );
    });

    describe("When called with a missing studio_id", () => {
        it("Then throws an error indicating missing studio id", () => {
            expect(
                freezeItemHandler.handle({
                    data: {
                        is_studio: true,
                        item_id: 1
                    }
                })
            ).rejects.toThrow("STUDIO_ID_MISSING");
        });
    });

    describe("When called with a bad token type", () => {
        it("Then throws an error indicating a bad token type", () => {
            expect(
                freezeItemHandler.handle({
                    data: {
                        is_studio: false,
                        studio_id: "studio_id",
                        item_id: 1
                    }
                })
            ).rejects.toThrow("INVALID_JWT_STUDIO");
        });
    });

    describe("When called with no item id", () => {
        it("Then throws an error indicating a missing item id", () => {
            expect(
                freezeItemHandler.handle({
                    data: {
                        is_studio: true,
                        studio_id: "studio_id"
                    }
                })
            ).rejects.toThrow("MISSING_ITEM_ID");
        });
    });

    describe("When called in a nominal case", () => {
        let response;

        beforeEach(async () => {
            itemRepository.getItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "Awesome item",
                total_quantity: 10,
                available_quantity: 9,
                data: {},
                frozen: false
            });

            itemRepository.updateItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "Awesome item",
                total_quantity: 10,
                available_quantity: 9,
                data: {},
                frozen: true
            });

            response = await freezeItemHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1
                }
            });
        });

        it("Then updates the item with frozen set to true", () => {
            expect(itemRepository.updateItem.mock.calls[0][0]).toEqual(
                new SavedItem({
                    item_id: 1,
                    studio_id: "studio_id",
                    name: "Awesome item",
                    total_quantity: 10,
                    available_quantity: 9,
                    data: {},
                    frozen: true
                })
            );
        });

        it("Then publishes a new ItemFrozenEvent event", () => {
            expect(eventBus.publish.mock.calls[0][0]).toEqual(
                new ItemFrozenEvent(1)
            );
        });

        it("Then returns the frozen item", () => {
            expect(response).toEqual(
                new SavedItem({
                    item_id: 1,
                    studio_id: "studio_id",
                    name: "Awesome item",
                    total_quantity: 10,
                    available_quantity: 9,
                    data: {},
                    frozen: true
                })
            );
        });
    });

    describe("When called with an already frozen item", () => {
        let response;

        beforeEach(async () => {
            itemRepository.getItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "Awesome item",
                total_quantity: 10,
                available_quantity: 9,
                data: {},
                frozen: true
            });

            itemRepository.updateItem.mockReset();
            eventBus.publish.mockReset();

            response = await freezeItemHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1
                }
            });
        });

        it("Then doesn't update the item", () => {
            expect(itemRepository.updateItem.mock.calls[0]).toBeUndefined();
        });

        it("Then doesn't publish an ItemFrozenEvent event", () => {
            expect(eventBus.publish.mock.calls[0]).toBeUndefined();
        });

        it("Then returns the frozen item", () => {
            expect(response).toEqual(
                new SavedItem({
                    item_id: 1,
                    studio_id: "studio_id",
                    name: "Awesome item",
                    total_quantity: 10,
                    available_quantity: 9,
                    data: {},
                    frozen: true
                })
            );
        });
    });

    describe("When freezing an item from another studio", () => {
        beforeEach(async () => {
            itemRepository.getItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_id2",
                name: "Awesome item",
                total_quantity: 10,
                available_quantity: 9,
                data: {},
                frozen: true
            });

            itemRepository.updateItem.mockReset();
            eventBus.publish.mockReset();
        });

        it("Then doesn't update the item", () => {
            expect(itemRepository.updateItem.mock.calls[0]).toBeUndefined();
        });

        it("Then doesn't publish an ItemFrozenEvent event", () => {
            expect(eventBus.publish.mock.calls[0]).toBeUndefined();
        });

        it("Then throws an error", () => {
            expect(
                freezeItemHandler.handle({
                    data: {
                        is_studio: true,
                        studio_id: "studio_id1",
                        item_id: 1
                    }
                })
            ).rejects.toThrow("Invalid studio, you cannot freeze this item.");
        });
    });
});
