import { CreateItemHandler } from "../src/natsHandlers/createItem/CreateItem";
import logger from "./utils/mockLogger";

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
            itemRepository
        );
    });

    describe("When called with an item", () => {
        let response;

        beforeEach(async () => {
            itemRepository.addItem.mockReturnValue(1);

            response = await createItemHandler.handle({
                data: {
                    name: "hello",
                    total_quantity: 10,
                    available_quantity: 10,
                    data: {},
                    is_frozen: false
                }
            });
        });

        it("Then adds the item to the repository", () => {
            expect(itemRepository.addItem.mock.calls[0][0]).toEqual({
                name: "hello",
                total_quantity: 10,
                available_quantity: 10,
                data: {},
                is_frozen: false
            });
        });

        it("Then returns the item_id of the newly created item", () => {
            expect(response).toEqual({
                item_id: 1
            });
        });
    });
});
