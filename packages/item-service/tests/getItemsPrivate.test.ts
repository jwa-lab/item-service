import { GetItemsHandler } from "../src/natsHandlers/getItems/GetItems";

describe("Given GetItems Handler", () => {
    let getItemHandler;
    let itemRepository;

    beforeEach(() => {
        itemRepository = {
            getItems: jest.fn().mockReturnValue({
                results: [],
                pagination: {
                    from: 0,
                    count: 0,
                    total: 0
                }
            })
        };

        getItemHandler = new GetItemsHandler("item-service", itemRepository);
    });

    describe("When called with an invalid token", () => {
        it("Then throws an error about the given token.", () => {
            expect(
                getItemHandler.handle({
                    data: {
                        start: 0,
                        limit: 10,
                        is_studio: false
                    }
                })
            ).rejects.toThrow("INVALID_JWT_STUDIO");
        });
    });

    describe("When called with required arguments", () => {
        let response;

        beforeEach(async () => {
            response = await getItemHandler.handle({
                data: {
                    start: 0,
                    limit: 10,
                    studio_id: "studio_id",
                    is_studio: true
                }
            });
        });

        it("Then returns the results and the pagination object", () => {
            expect(response).toEqual({
                results: [],
                pagination: {
                    from: 0,
                    count: 0,
                    total: 0
                }
            });
        });
    });
});
