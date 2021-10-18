import TezosBlockMonitor from "../src/TezosBlockMonitor";

describe("Given initialized TezosBlockMonitor", () => {
    let tezosBlockMonitor;
    let logger;
    let tezosClient;
    let blockResponse;

    beforeEach(() => {
        logger = { info: jest.fn() };
        tezosClient = {
            rpc: {
                getBlock: () => Promise.resolve(blockResponse)
            }
        };

        tezosBlockMonitor = new TezosBlockMonitor(logger, tezosClient);
    });

    describe("When watching for hash changed", () => {
        let hashChangedSignal;
        let hasChangedIterator;

        beforeEach(async () => {
            blockResponse = { hash: "hash0" };

            hashChangedSignal = tezosBlockMonitor.blockHashChanged();

            hasChangedIterator = await hashChangedSignal.next();
        });

        it("Then return true to indicate that the block hasn't changed", () => {
            expect(hasChangedIterator.value).toBe(false);
        });

        describe("When the block has changed", () => {
            beforeEach(async () => {
                blockResponse = { hash: "hash1" };

                hasChangedIterator = await hashChangedSignal.next();
            });

            it("Then indicates that the block has changed", () => {
                expect(hasChangedIterator.value).toBe(true);
            });

            describe("And when the timer ticks again with a new block", () => {
                beforeEach(async () => {
                    blockResponse = { hash: "hash2" };

                    hasChangedIterator = await hashChangedSignal.next();
                });

                it("Then indicates that the block has changed", () => {
                    expect(hasChangedIterator.value).toBe(true);
                });
            });

            describe("And the hash doesn't change", () => {
                beforeEach(async () => {
                    hasChangedIterator = await hashChangedSignal.next();
                });

                it("Then indicates that the block hasn't changed", () => {
                    expect(hasChangedIterator.value).toBe(false);
                });
            });
        });
    });
});
