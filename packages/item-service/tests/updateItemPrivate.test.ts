import { UpdateItemHandler } from "../src/natsHandlers/updateItem/UpdateItem";
import logger from "./utils/mockLogger";
import eventBus from "./utils/mockEventBus";
import { ItemUpdatedEvent } from "../src/events/item";

describe("Given UpdateItem Handler", () => {
    let updateItemHandler;
    let itemRepository;
    let itemInstanceRepository;
    let transactionManager;

    beforeEach(() => {
        eventBus.publish.mockReset();

        itemRepository = {
            updateItem: jest.fn().mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "updated name",
                total_quantity: 10,
                available_quantity: 7,
                data: {},
                frozen: false
            }),
            getItem: jest.fn().mockReturnValue({
                is_studio: true,
                studio_id: "studio_id",
                item_id: 1,
                name: "name",
                total_quantity: 10,
                data: {},
                frozen: false
            })
        };

        itemInstanceRepository = {
            getItemInstancesByItemId: jest.fn().mockReturnValue({
                pagination: {
                    total: 3
                }
            })
        };

        transactionManager = {
            transaction: (fn) => fn()
        };

        updateItemHandler = new UpdateItemHandler(
            "test-service",
            logger,
            itemRepository,
            itemInstanceRepository,
            eventBus,
            transactionManager
        );
    });

    describe("When called with an item that already has 3 instances", () => {
        let response;

        beforeEach(async () => {
            response = await updateItemHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1,
                    name: "updated name",
                    total_quantity: 10,
                    data: {},
                    frozen: false
                }
            });
        });

        it("Then updates the item to the repository with the correct remaining number of items", () => {
            expect(itemRepository.updateItem.mock.calls[0][0]).toEqual({
                item_id: 1,
                studio_id: "studio_id",
                name: "updated name",
                total_quantity: 10,
                available_quantity: 7,
                data: {},
                frozen: false
            });
        });

        it("Then returns the newly updated item", () => {
            expect(response).toEqual({
                item_id: 1,
                studio_id: "studio_id",
                name: "updated name",
                total_quantity: 10,
                available_quantity: 7,
                data: {},
                frozen: false
            });
        });

        it("Then publishes a new ItemUpdatedEvent event", () => {
            expect(eventBus.publish.mock.calls[0][0]).toEqual(
                new ItemUpdatedEvent(1)
            );
        });
    });

    describe("When called with an item that already has more instances than total_quantity", () => {
        beforeEach(async () => {
            itemInstanceRepository = {
                getItemInstancesByItemId: jest.fn().mockReturnValue({
                    pagination: {
                        total: 4
                    }
                })
            };

            updateItemHandler = new UpdateItemHandler(
                "test-service",
                logger,
                itemRepository,
                itemInstanceRepository,
                eventBus,
                transactionManager
            );
        });

        it("Then throws an error indicating that total_quantity can't be less than the number of assigned instances", () => {
            expect(
                updateItemHandler.handle({
                    data: {
                        is_studio: true,
                        studio_id: "studio_id",
                        item_id: 1,
                        name: "updated name",
                        total_quantity: 3,
                        data: {},
                        frozen: false
                    }
                })
            ).rejects.toThrow(
                "Item's total_quantity can't be less than number of already assigned instances."
            );
        });

        it("Then doesn't publishes a new ItemUpdatedEvent event", () => {
            expect(eventBus.publish.mock.calls.length).toEqual(0);
        });
    });
});
