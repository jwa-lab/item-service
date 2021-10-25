import { UpdateItemInstanceHandler } from "../src/natsHandlers/updateItemInstance/UpdateItemInstance";
import logger from "./utils/mockLogger";
import eventBus from "./utils/mockEventBus";
import { ItemInstanceUpdatedEvent } from "../src/events/item";

describe("Given UpdateItemInstance Handler", () => {
    let updateItemInstanceHandler;
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
                tezos_contract_address: "some_contract_address",
                tezos_block: "tezos_block_abcd"
            })
        };

        itemInstanceRepository = {
            updateItemInstance: jest.fn().mockReturnValue({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    level: "202",
                    type: "Armor"
                },
                tezos_contract_address: "some_contract_address",
                tezos_block: "tezos_block_efgh"
            })
        };

        updateItemInstanceHandler = new UpdateItemInstanceHandler(
            "test-service",
            logger,
            itemRepository,
            itemInstanceRepository,
            eventBus
        );
    });

    describe("When called with an item instance reference and some data", () => {
        let response;

        beforeEach(async () => {
            response = await updateItemInstanceHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1,
                    instance_number: 1,
                    data: {
                        level: "202",
                        type: "Armor"
                    }
                }
            });
        });

        it("Then updates the item instance to the repository", () => {
            expect(
                itemInstanceRepository.updateItemInstance.mock.calls[0]
            ).toEqual([
                1,
                1,
                {
                    level: "202",
                    type: "Armor"
                }
            ]);
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
                tezos_contract_address: "some_contract_address",
                tezos_block: "tezos_block_efgh"
            });
        });

        it("Then publishes a new ItemInstanceUpdatedEvent event", () => {
            expect(eventBus.publish.mock.calls[0][0]).toEqual(
                new ItemInstanceUpdatedEvent(1, 1, {
                    level: "202",
                    type: "Armor"
                })
            );
        });
    });

    describe("When called with an item instance reference with an item that already have properties", () => {
        let response;

        beforeEach(async () => {
            itemRepository.getItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "updated name",
                total_quantity: 10,
                available_quantity: 10,
                data: {
                    some: "data"
                },
                frozen: false,
                tezos_contract_address: "some_contract_address",
                tezos_block: "tezos_block_abcd"
            });

            itemInstanceRepository.updateItemInstance.mockReturnValue({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    level: "202",
                    type: "Armor"
                },
                tezos_contract_address: "some_contract_address",
                tezos_block: "tezos_block_efgh"
            });

            response = await updateItemInstanceHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    item_id: 1,
                    instance_number: 1,
                    data: {
                        level: "202",
                        type: "Armor"
                    }
                }
            });
        });

        it("Then updates the item instance to the repository", () => {
            expect(
                itemInstanceRepository.updateItemInstance.mock.calls[0]
            ).toEqual([
                1,
                1,
                {
                    level: "202",
                    type: "Armor"
                }
            ]);
        });

        it("Then returns the newly updated item instance", () => {
            expect(response).toEqual({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    level: "202",
                    type: "Armor",
                    some: "data"
                },
                tezos_contract_address: "some_contract_address",
                tezos_block: "tezos_block_efgh"
            });
        });

        it("Then publishes a new ItemInstanceUpdatedEvent event", () => {
            expect(eventBus.publish.mock.calls[0][0]).toEqual(
                new ItemInstanceUpdatedEvent(1, 1, {
                    level: "202",
                    type: "Armor"
                })
            );
        });
    });
});
