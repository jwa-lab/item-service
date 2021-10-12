import { GetItemInstanceHandler } from "../src/natsHandlers/getItemInstance/GetItemInstance";

describe("Given GetItemInstance Handler", () => {
    let getItemInstanceHandler;
    let itemRepository;
    let itemInstanceRepository;

    beforeEach(() => {
        itemRepository = {
            getItem: jest.fn().mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "laboris ut eu",
                available_quantity: 10,
                total_quantity: 10,
                is_frozen: false,
                data: {}
            })
        };

        itemInstanceRepository = {
            getInstance: jest.fn().mockReturnValue({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {}
            })
        };

        getItemInstanceHandler = new GetItemInstanceHandler(
            "test-service",
            itemInstanceRepository,
            itemRepository
        );
    });

    describe("When called with an item id and an instance number by an invalid studio", () => {
        it("Then throws an error about the given token.", () => {
            expect(
                getItemInstanceHandler.handle({
                    data: {
                        item_id: 1,
                        instance_number: 1,
                        studio_id: "studio_id_2",
                        is_studio: true
                    }
                })
            ).rejects.toThrow("INVALID_STUDIO_ID");
        });
    });

    describe("When called with an item id and an instance number", () => {
        let response;

        beforeEach(async () => {
            response = await getItemInstanceHandler.handle({
                data: {
                    item_id: 1,
                    instance_number: 1,
                    studio_id: "studio_id",
                    is_studio: true
                }
            });
        });

        it("Then returns the data of the requested instance", () => {
            expect(response).toEqual({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {}
            });
        });
    });

    describe("When called with an item with existing data", () => {
        let response;

        beforeEach(async () => {
            itemRepository.getItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "laboris ut eu",
                available_quantity: 10,
                total_quantity: 10,
                is_frozen: false,
                data: {
                    object: "car"
                }
            });

            itemInstanceRepository.getInstance.mockReturnValue({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    some: "thing"
                }
            });

            response = await getItemInstanceHandler.handle({
                data: {
                    item_id: 1,
                    instance_number: 1,
                    studio_id: "studio_id",
                    is_studio: true
                }
            });
        });

        it("Then returns the data of the requested instance + the data of the item", () => {
            expect(response).toEqual({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    object: "car",
                    some: "thing"
                }
            });
        });
    });

    describe("When called with an item with existing data that should be override", () => {
        let response;

        beforeEach(async () => {
            itemRepository.getItem.mockReturnValue({
                item_id: 1,
                studio_id: "studio_id",
                name: "laboris ut eu",
                available_quantity: 10,
                total_quantity: 10,
                is_frozen: false,
                data: {
                    object: "car"
                }
            });

            itemInstanceRepository.getInstance.mockReturnValue({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    object: "spaceship",
                    some: "thing"
                }
            });

            response = await getItemInstanceHandler.handle({
                data: {
                    item_id: 1,
                    instance_number: 1,
                    studio_id: "studio_id",
                    is_studio: true
                }
            });
        });

        it("Then returns the data of the requested instance over writing the item's data.", () => {
            expect(response).toEqual({
                instance_number: 1,
                item_id: 1,
                user_id: "Mr 2",
                data: {
                    object: "spaceship",
                    some: "thing"
                }
            });
        });
    });
});
