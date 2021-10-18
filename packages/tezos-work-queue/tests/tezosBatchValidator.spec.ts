import TezosBatchValidator, { Batch } from "../src/TezosBatchValidator";
import { TezosOperationEstimate } from "../src/types";

describe("Given initialized Batch", () => {
    let batch;

    beforeEach(() => {
        batch = new Batch();
    });

    describe("When I add operations", () => {
        beforeEach(() => {
            batch.addOperation(1, { kind: "Transaction", item_id: "1" });
            batch.addOperation(2, { kind: "Transaction", item_id: "2" });
        });

        it("Then I can retrieve them by id", () => {
            expect(batch.getOperation(1).item_id).toEqual("1");
            expect(batch.getOperation(2).item_id).toEqual("2");
            expect(batch.getOperation(3)).toBeUndefined();
        });

        it("Then I can retrieve them all as one batch", () => {
            expect(Array.from(batch.getOperations().entries())).toEqual([
                [1, { kind: "Transaction", item_id: "1" }],
                [2, { kind: "Transaction", item_id: "2" }]
            ]);
        });

        describe("When I add estimates", () => {
            beforeEach(() => {
                batch.setEstimates([
                    { gasLimit: 1 },
                    { gasLimit: 2 }
                ] as TezosOperationEstimate[]);
            });

            it("Then maps them to operations", () => {
                expect(Array.from(batch.getEstimates())).toEqual([
                    [1, { gasLimit: 1 }],
                    [2, { gasLimit: 2 }]
                ]);
            });
        });
    });
});

describe("Given initialized TezosBatchValidator", () => {
    let tezosBatchValidator;
    let logger;
    let tezosClient;
    let batchEstimates;

    beforeEach(() => {
        logger = { debug: jest.fn() };
        tezosClient = {
            estimate: {
                batch: jest.fn(() => Promise.resolve(batchEstimates))
            }
        };

        tezosBatchValidator = new TezosBatchValidator(
            logger,
            tezosClient,
            "3000"
        );
    });

    describe("When I add an operation", () => {
        let result;

        beforeEach(async () => {
            batchEstimates = [{ gasLimit: 1000 }];

            result = await tezosBatchValidator.addOperation(1, {
                kind: "Transaction",
                item_id: "1"
            });
        });

        it("Then accepts the operation", () => {
            expect(result).toEqual(true);
        });

        it("Then calls the estimation API with the new batch", () => {
            expect(tezosClient.estimate.batch).toHaveBeenCalledWith([
                { kind: "Transaction", item_id: "1" }
            ]);
        });

        it("Then adds the operation to the batch", () => {
            const operations = Array.from(
                tezosBatchValidator.rotateBatch().getOperations().entries()
            );

            expect(operations).toEqual([
                [1, { kind: "Transaction", item_id: "1" }]
            ]);
        });

        it("Then adds the estimates to the batch", () => {
            const estimates = Array.from(
                tezosBatchValidator.rotateBatch().getEstimates().entries()
            );

            expect(estimates).toEqual([[1, { gasLimit: 1000 }]]);
        });

        describe("When I add too many operations", () => {
            beforeEach(async () => {
                batchEstimates = [{ gasLimit: 1000 }, { gasLimit: 2001 }];

                result = await tezosBatchValidator.addOperation(2, {
                    kind: "Transaction",
                    item_id: "2"
                });
            });

            it("Then rejects the operation", () => {
                expect(result).toEqual(false);
            });

            it("Then calls the estimation API with the new batch", () => {
                expect(tezosClient.estimate.batch).toHaveBeenCalledWith([
                    { kind: "Transaction", item_id: "1" },
                    { kind: "Transaction", item_id: "2" }
                ]);
            });

            it("Then doesn't add the operation to the batch", () => {
                const operations = Array.from(
                    tezosBatchValidator.rotateBatch().getOperations().entries()
                );

                expect(operations).toEqual([
                    [1, { kind: "Transaction", item_id: "1" }]
                ]);
            });

            it("Then doesn't add the estimates to the batch", () => {
                const estimates = Array.from(
                    tezosBatchValidator.rotateBatch().getEstimates().entries()
                );

                expect(estimates).toEqual([[1, { gasLimit: 1000 }]]);
            });
        });
    });
});
