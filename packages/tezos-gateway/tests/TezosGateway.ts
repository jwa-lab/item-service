import { JSONCodec } from "nats";
import { Batch } from "../src/TezosBatchProcessor";
import { TezosGateway } from "../src/TezosGateway";

jest.useFakeTimers();

describe("Given initialized TezosGateway", () => {
    let logger;
    let jetStreamClient;
    let tezosBatchProcessor;
    let tezosBlockMonitor;
    let tezosGateway;
    let pullFn;
    let processNextBatchResult;
    let blockChanged;

    beforeEach(async () => {
        pullFn = jest.fn();
        logger = {
            debug: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
            crit: jest.fn()
        };

        jetStreamClient = {
            pullSubscribe: jest.fn(() => ({
                pull: pullFn
            })),
            publish: jest.fn()
        };

        tezosBatchProcessor = {
            handleMessage: jest.fn(),
            processNextBatch: jest.fn(() =>
                Promise.resolve(processNextBatchResult)
            )
        };

        tezosBlockMonitor = {
            blockHashChanged: jest.fn(async function* () {
                await new Promise((res) => setTimeout(res, 1));
                yield blockChanged;
            })
        };

        tezosGateway = new TezosGateway(
            logger,
            jetStreamClient,
            tezosBatchProcessor,
            tezosBlockMonitor
        );

        await tezosGateway.subscribe();
        tezosGateway.onReady();
    });

    describe("When consumer is ready", () => {
        it("Then pulls the next message right away", () => {
            expect(pullFn).toHaveBeenCalled();
        });

        describe("And when the block changes", () => {
            beforeEach(() => {
                processNextBatchResult = {
                    success: false,
                    opHash: "",
                    batch: new Batch(1000, {}, logger)
                };
                pullFn.mockReset();
                blockChanged = true;
                jest.runOnlyPendingTimers();
            });

            it("Then pulls the next message", () => {
                expect(pullFn).toHaveBeenCalled();
            });

            it("Then processes the next batch", () => {
                expect(tezosBatchProcessor.processNextBatch).toHaveBeenCalled();
            });
        });
    });

    describe("When an empty message comes in", () => {
        let nakFn;

        beforeEach(() => {
            nakFn = jest.fn();
            pullFn.mockReset();
        });

        it("Then throws an error", async () => {
            expect(
                tezosGateway.handle({ msg: { nak: nakFn } })
            ).rejects.toThrow();
        });

        it("Then pulls the next message", () => {
            expect(
                tezosGateway.handle({ msg: { nak: nakFn } })
            ).rejects.toThrow();
            expect(pullFn).toHaveBeenCalled();
        });
    });

    describe("When a new message comes in", () => {
        beforeEach(() => {
            pullFn.mockReset();
            tezosBatchProcessor.handleMessage.mockReturnValue(true);
            tezosGateway.handle({
                data: {
                    kind: "Transaction",
                    item_id: 1
                },
                msg: {
                    seq: 1,
                    subject: "some.subject",
                    ack: jest.fn()
                }
            });
        });

        it("Then forwards it to the batch processor", () => {
            expect(tezosBatchProcessor.handleMessage).toHaveBeenCalledWith(1, {
                kind: "Transaction",
                item_id: 1
            });
        });

        describe("And the message is already tracked", () => {
            beforeEach(() => {
                tezosBatchProcessor.handleMessage.mockReset();
                tezosGateway.handle({
                    data: {
                        kind: "Transaction",
                        item_id: 1
                    },
                    msg: {
                        seq: 1,
                        subject: "some.subject",
                        ack: jest.fn()
                    }
                });
            });

            it("Then ignores it", () => {
                expect(
                    tezosBatchProcessor.handleMessage
                ).not.toHaveBeenCalled();
            });

            it("Then pulls the next message", () => {
                expect(pullFn).toHaveBeenCalled();
            });
        });
    });

    describe("When the batch is full", () => {
        let nakFn;

        beforeEach(() => {
            nakFn = jest.fn();
            tezosBatchProcessor.handleMessage.mockReturnValue(false);
            tezosGateway.handle({
                data: {
                    kind: "Transaction",
                    item_id: 1
                },
                msg: {
                    seq: 1,
                    subject: "some.subject",
                    nak: nakFn,
                    ack: jest.fn()
                }
            });
        });

        it("Then pauses the delivery of the message", () => {
            expect(nakFn).toHaveBeenCalled();
        });
    });

    describe("When a batch has been processed", () => {
        let msg1Ack;
        let msg2Ack;

        beforeEach(async () => {
            msg1Ack = jest.fn();
            msg2Ack = jest.fn();

            tezosBatchProcessor.handleMessage.mockReturnValue(true);

            processNextBatchResult = {
                success: true,
                opHash: "hash1",
                batch: {
                    getOperations() {
                        return new Map([
                            [1, {}],
                            [2, {}]
                        ]);
                    },
                    getEstimate(id) {
                        return new Map([
                            [
                                1,
                                {
                                    burnFeeMutez: 11,
                                    gasLimit: 12,
                                    minimalFeeMutez: 13,
                                    storageLimit: 14,
                                    suggestedFeeMutez: 15,
                                    totalCost: 16
                                }
                            ],
                            [
                                2,
                                {
                                    burnFeeMutez: 21,
                                    gasLimit: 22,
                                    minimalFeeMutez: 23,
                                    storageLimit: 24,
                                    suggestedFeeMutez: 25,
                                    totalCost: 26
                                }
                            ]
                        ]).get(id);
                    }
                }
            };

            await tezosGateway.handle({
                data: {
                    kind: "Transaction",
                    item_id: 1
                },
                msg: {
                    seq: 1,
                    subject: "some.subject",
                    ack: msg1Ack,
                    headers: new Map([["confirmation-subject", "yes"]])
                }
            });
            await tezosGateway.handle({
                data: {
                    kind: "Transaction",
                    item_id: 2
                },
                msg: {
                    seq: 2,
                    subject: "some.subject",
                    ack: msg2Ack,
                    headers: new Map([["confirmation-subject", "yes"]])
                }
            });

            blockChanged = true;
            jest.runOnlyPendingTimers();
        });

        it("Then sends the message confirmation", () => {
            expect(jetStreamClient.publish.mock.calls[0][0]).toEqual("yes");
            expect(
                JSONCodec().decode(jetStreamClient.publish.mock.calls[0][1])
            ).toEqual({
                operation: {
                    kind: "Transaction",
                    item_id: 1
                },
                operationEstimate: {
                    burnFeeMutez: 11,
                    gasLimit: 12,
                    minimalFeeMutez: 13,
                    storageLimit: 14,
                    suggestedFeeMutez: 15,
                    totalCost: 16
                },
                operationHash: "hash1"
            });

            expect(jetStreamClient.publish.mock.calls[1][0]).toEqual("yes");
            expect(
                JSONCodec().decode(jetStreamClient.publish.mock.calls[1][1])
            ).toEqual({
                operation: {
                    kind: "Transaction",
                    item_id: 2
                },
                operationEstimate: {
                    burnFeeMutez: 21,
                    gasLimit: 22,
                    minimalFeeMutez: 23,
                    storageLimit: 24,
                    suggestedFeeMutez: 25,
                    totalCost: 26
                },
                operationHash: "hash1"
            });
        });

        it("Then acknowledges the jetstream messages", () => {
            expect(msg1Ack).toHaveBeenCalled();
            expect(msg2Ack).toHaveBeenCalled();
        });
    });
});
