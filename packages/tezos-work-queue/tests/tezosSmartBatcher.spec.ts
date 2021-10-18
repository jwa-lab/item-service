import TezosBatchValidator from "../src/TezosBatchValidator";
import TezosSmartBatcher from "../src/TezosSmartBatcher";

describe("Given initialized TezosSmartBatcher", () => {
    let tezosSmartBatcher;
    let logger;
    let tezosClient;
    let opHash;
    let tezosBatchValidator;
    let result;

    beforeEach(() => {
        logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
        tezosClient = {
            wallet: {
                batch: jest.fn(() => ({
                    send: jest.fn(() =>
                        Promise.resolve({
                            opHash
                        })
                    )
                }))
            },
            estimate: {
                batch: jest.fn(() => Promise.resolve([]))
            }
        };
        tezosBatchValidator = new TezosBatchValidator(
            logger,
            tezosClient,
            "1000"
        );

        tezosSmartBatcher = new TezosSmartBatcher(
            logger,
            tezosClient,
            tezosBatchValidator
        );
    });

    describe("When the batch is empty AND I process the batch", () => {
        beforeEach(async () => {
            result = await tezosSmartBatcher.processNextBatch();
        });

        it("Then ignores the batch", () => {
            expect(result[0]).toEqual(false);
            expect(result[1]).toEqual("");
            expect(result[2].getOperations().size).toEqual(0);
        });
    });

    describe("When receiving a new operation AND I process the batch", () => {
        beforeEach(() => {
            tezosSmartBatcher.handleMessage(1, {
                kind: "Transaction",
                item_id: "1"
            });
        });

        beforeEach(async () => {
            opHash = "hash1";
            result = await tezosSmartBatcher.processNextBatch();
        });

        it("Then sends the batch", () => {
            expect(result[0]).toEqual(true);
            expect(result[1]).toEqual("hash1");
            expect(Array.from(result[2].getOperations().entries())).toEqual([
                [1, { kind: "Transaction", item_id: "1" }]
            ]);
        });
    });
});
