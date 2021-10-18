import { BlockResponse } from "@taquito/rpc";
import { TransferParams, withKind, OpKind } from "@taquito/taquito";

export type TezosTransferOperation = withKind<
    TransferParams,
    OpKind.TRANSACTION
>;

export interface TezosOperationEstimate {
    burnFeeMutez: number;
    gasLimit: number;
    minimalFeeMutez: number;
    storageLimit: number;
    suggestedFeeMutez: number;
    totalCost: number;
}

export interface TezosOperationConfirmation {
    block: BlockResponse;
    expectedConfirmation: number;
    currentConfirmation: number;
    completed: boolean;
}

export interface TezosWorkerTokenizationConfirmation {
    operation: TezosTransferOperation;
    operationEstimate: TezosOperationEstimate;
    operationHash: string;
}
