import { UpdateItemHandler } from "../src/natsHandlers/updateItem/UpdateItem";
import logger from "./utils/mockLogger";
import eventBus from "./utils/mockEventBus";
import { ItemUpdatedEvent } from "../src/events/item";

describe("Given UpdateItem Handler", () => {
    let updateItemHandler;
    let itemRepository;

    beforeEach(() => {
        itemRepository = {
            updateItem: jest.fn().mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "updated name",
                total_quantity: 10,
                available_quantity: 10,
                data: {},
                frozen: false
            })
        };

        updateItemHandler = new UpdateItemHandler(
            "test-service",
            logger,
            itemRepository,
            eventBus
        );
    });

    describe("When called with an item", () => {
        let response;

        beforeEach(async () => {
            response = await updateItemHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1,
                    name: "updated name",
                    total_quantity: 10,
                    available_quantity: 10,
                    data: {},
                    frozen: false
                }
            });
        });

        it("Then updates the item to the repository", () => {
            expect(itemRepository.updateItem.mock.calls[0][0]).toEqual({
                item_id: 1,
                studio_id: "studio_id",
                name: "updated name",
                total_quantity: 10,
                available_quantity: 10,
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
                available_quantity: 10,
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
});
