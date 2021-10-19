import { GetItemInstancesHandler } from "../src/natsHandlers/getItemInstances/GetItemInstances";

describe("Given GetItemInstances Handler", () => {
    let getItemInstancesHandler;
    let itemRepository;
    let itemInstanceRepository;

    beforeEach(() => {
        itemRepository = {
            getItemsByIds: jest.fn().mockReturnValue([
                {
                    item_id: 1,
                    studio_id: "studio_id",
                    name: "updated name",
                    total_quantity: 10,
                    available_quantity: 10,
                    data: {
                        obj: "plane"
                    },
                    frozen: false,
                    tezos_contract_address: "some_contract_address",
                    tezos_block: "tezos_block_abcd"
                },
                {
                    item_id: 2,
                    studio_id: "studio_id",
                    name: "updated name",
                    total_quantity: 10,
                    available_quantity: 10,
                    data: {
                        obj: "car"
                    },
                    frozen: false,
                    tezos_contract_address: "some_contract_address",
                    tezos_block: "tezos_block_abcd"
                }
            ])
        };

        itemInstanceRepository = {
            getItemInstancesByUserId: jest.fn().mockReturnValue({
                pagination: {
                    from: 0,
                    count: 2,
                    total: 2
                },
                results: [
                    {
                        instance_number: 1,
                        item_id: 1,
                        user_id: "Mr 2",
                        data: {
                            level: "202",
                            type: "Armor"
                        },
                        tezos_contract_address: "some_contract_address",
                        tezos_block: "tezos_block_efgh"
                    },
                    {
                        instance_number: 1,
                        item_id: 2,
                        user_id: "Mr 1",
                        data: {
                            level: "202",
                            type: "Armor"
                        },
                        tezos_contract_address: "some_contract_address",
                        tezos_block: "tezos_block_efgh"
                    }
                ]
            })
        };

        getItemInstancesHandler = new GetItemInstancesHandler(
            "test-service",
            itemInstanceRepository,
            itemRepository
        );
    });

    describe("When called with no user_id", () => {
        let response;

        beforeEach(async () => {
            response = await getItemInstancesHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    start: 0,
                    limit: 10,
                    user_id: undefined
                }
            });
        });

        it("Then get the item instances from repository", () => {
            expect(
                itemInstanceRepository.getItemInstancesByUserId.mock.calls[0]
            ).toEqual([0, 10, undefined]);
        });

        it("Then returns the instances with the aggregated item's data'", () => {
            expect(response).toEqual({
                pagination: {
                    from: 0,
                    count: 2,
                    total: 2
                },
                results: [
                    {
                        instance_number: 1,
                        item_id: 1,
                        user_id: "Mr 2",
                        data: {
                            level: "202",
                            type: "Armor",
                            obj: "plane"
                        },
                        tezos_contract_address: "some_contract_address",
                        tezos_block: "tezos_block_efgh"
                    },
                    {
                        instance_number: 1,
                        item_id: 2,
                        user_id: "Mr 1",
                        data: {
                            level: "202",
                            type: "Armor",
                            obj: "car"
                        },
                        tezos_contract_address: "some_contract_address",
                        tezos_block: "tezos_block_efgh"
                    }
                ]
            });
        });
    });

    describe("When called with an a user_id", () => {
        let response;

        beforeEach(async () => {
            itemInstanceRepository.getItemInstancesByUserId.mockReturnValue({
                pagination: {
                    from: 0,
                    count: 1,
                    total: 1
                },
                results: [
                    {
                        instance_number: 1,
                        item_id: 1,
                        user_id: "Mr 2",
                        data: {
                            level: "202",
                            type: "Armor"
                        },
                        tezos_contract_address: "some_contract_address",
                        tezos_block: "tezos_block_efgh"
                    }
                ]
            });

            response = await getItemInstancesHandler.handle({
                data: {
                    is_studio: true,
                    studio_id: "studio_id",
                    start: 0,
                    limit: 10,
                    user_id: "Mr 2"
                }
            });
        });

        it("Then get the item instances from repository", () => {
            expect(
                itemInstanceRepository.getItemInstancesByUserId.mock.calls[0]
            ).toEqual([0, 10, "Mr 2"]);
        });

        it("Then returns the instances with the aggregated item's data", () => {
            expect(response).toEqual({
                pagination: {
                    from: 0,
                    count: 1,
                    total: 1
                },
                results: [
                    {
                        instance_number: 1,
                        item_id: 1,
                        user_id: "Mr 2",
                        data: {
                            level: "202",
                            type: "Armor",
                            obj: "plane"
                        },
                        tezos_contract_address: "some_contract_address",
                        tezos_block: "tezos_block_efgh"
                    }
                ]
            });
        });
    });
});
