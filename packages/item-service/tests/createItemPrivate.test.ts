import { CreateItemHandler } from "../src/natsHandlers/createItem/CreateItem";
import logger from "./utils/mockLogger";
import eventBus from "./utils/mockEventBus";
import { ItemCreatedEvent } from "../src/events/item";

describe("Given CreateItem  Handler", () => {
    let createItemHandler;
    let itemRepository;

    beforeEach(() => {
        itemRepository = {
            addItem: jest.fn()
        };

        createItemHandler = new CreateItemHandler(
            "test-service",
            logger,
            itemRepository,
            eventBus
        );
    });

    describe("When called with an item", () => {
        let response;

        beforeEach(async () => {
            itemRepository.addItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_abcd",
                name: "hello",
                total_quantity: 10,
                available_quantity: 10,
                data: {},
                frozen: false
            });

            response = await createItemHandler.handle({
                data: {
                    name: "hello",
                    studio_id: "studio_abcd",
                    total_quantity: 10,
                    available_quantity: 10,
                    data: {},
                    frozen: false
                }
            });
        });

        it("Then adds the item to the repository", () => {
            expect(itemRepository.addItem.mock.calls[0][0]).toEqual({
                name: "hello",
                studio_id: "studio_abcd",
                total_quantity: 10,
                available_quantity: 10,
                data: {},
                frozen: false
            });
        });

        it("Then returns the newly created item", () => {
            expect(response).toEqual({
                item_id: 1,
                name: "hello",
                studio_id: "studio_abcd",
                total_quantity: 10,
                available_quantity: 10,
                data: {},
                frozen: false
            });
        });

        it("Then publishes a new ItemCreatedEvent event", () => {
            expect(eventBus.publish.mock.calls[0][0]).toEqual(
                new ItemCreatedEvent(1)
            );
        });
    });
});
