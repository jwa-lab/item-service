import { TransferItemInstanceHandler } from "../src/natsHandlers/transferItemInstance/TransferItemInstance";
import logger from "./utils/mockLogger";
import eventBus from "./utils/mockEventBus";
import { ItemInstanceTransferredEvent } from "../src/events/item";

describe("Given TransferItemInstance Handler", () => {
    let transferItemInstanceHandler;
    let itemRepository;
    let itemInstanceRepository;

    beforeEach(() => {
        itemRepository = {
            getItem: jest.fn().mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "updated name",
                total_quantity: 10,
                available_quantity: 10,
                data: {},
                frozen: false,
                tezos_operation_hash: "tezos_operation_hash_abcd"
            })
        };

        itemInstanceRepository = {
            transferItemInstance: jest.fn().mockReturnValue({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    level: "202",
                    type: "Armor"
                },
                tezos_operation_hash: "tezos_operation_hash_efgh"
            })
        };

        transferItemInstanceHandler = new TransferItemInstanceHandler(
            "test-service",
            logger,
            itemRepository,
            itemInstanceRepository,
            eventBus
        );
    });

    describe("When called with an item", () => {
        let response;

        beforeEach(async () => {
            response = await transferItemInstanceHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1,
                    instance_number: 1,
                    to_user_id: "Mr 2"
                }
            });
        });

        it("Then updates the item instance to the repository", () => {
            expect(
                itemInstanceRepository.transferItemInstance.mock.calls[0]
            ).toEqual([1, 1, "Mr 2"]);
        });

        it("Then returns the newly updated item instance", () => {
            expect(response).toEqual({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    level: "202",
                    type: "Armor"
                },
                tezos_operation_hash: "tezos_operation_hash_efgh"
            });
        });

        it("Then publishes a new ItemInstanceTransferredEvent event", () => {
            expect(eventBus.publish.mock.calls[0][0]).toEqual(
                new ItemInstanceTransferredEvent(1, 1, "Mr 2")
            );
        });
    });
});
