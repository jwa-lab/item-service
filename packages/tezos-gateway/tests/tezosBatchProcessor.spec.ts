import TezosBatchProcessor from "../src/TezosBatchProcessor";

describe("Given initialized TezosBatchProcessor", () => {
    let tezosBatchProcessor;
    let maxBatchGasLimit;
    let logger;
    let tezosClient;
    let batchEstimates;
    let opHash;

    beforeEach(() => {
        maxBatchGasLimit = 1000;
        logger = { debug: jest.fn(), info: jest.fn() };
        tezosClient = {
            estimate: {
                batch: jest.fn(() => Promise.resolve(batchEstimates))
            },
            wallet: {
                batch: jest.fn(() => ({
                    send: jest.fn(() =>
                        Promise.resolve({
                            opHash
                        })
                    )
                }))
            }
        };

        tezosBatchProcessor = new TezosBatchProcessor(
            logger,
            tezosClient,
            maxBatchGasLimit
        );
    });

    describe("When I add a new valid operation", () => {
        let canAddOperation;

        beforeEach(async () => {
            batchEstimates = [{ gasLimit: 500 }];
            canAddOperation = await tezosBatchProcessor.handleMessage(1, {
                kind: "Transaction",
                item_id: "1"
            });
        });

        it("Then indicates that the operation was added", () => {
            expect(canAddOperation).toEqual(true);
        });

        describe("And I add another valid operation which exceeds the max gas limit", () => {
            beforeEach(async () => {
                batchEstimates = [{ gasLimit: 500 }, { gasLimit: 501 }];
                canAddOperation = await tezosBatchProcessor.handleMessage(2, {
                    kind: "Transaction",
                    item_id: "2"
                });
            });

            it("Then indicates that the operation can't be added", () => {
                expect(canAddOperation).toEqual(false);
            });
        });

        describe("When I process the batch", () => {
            let batchProcessingResult;

            beforeEach(async () => {
                opHash = "hash1";
                batchProcessingResult =
                    await tezosBatchProcessor.processNextBatch();
            });

            it("Then returns a successful processing result", () => {
                expect(batchProcessingResult.success).toEqual(true);
                expect(batchProcessingResult.opHash).toEqual("hash1");
                expect(
                    Array.from(
                        batchProcessingResult.batch.getOperations().entries()
                    )
                ).toEqual([[1, { kind: "Transaction", item_id: "1" }]]);
            });

            it("Then returns the estimates for each operation", () => {
                expect(
                    Array.from(
                        batchProcessingResult.batch.getEstimates().entries()
                    )
                ).toEqual([[1, { gasLimit: 500 }]]);
            });
        });
    });
});
