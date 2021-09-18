import { Logger } from "../../common/Logger/Logger";
import { MessageBus } from "../../common/MessageBus/MessageBus";
import { RunnerPlugin } from "../../common/NatsRunner/Plugin";
import { Item } from "../../entities/item";
import { TokenizationEvents } from "../tokenization/TokenizationService";
import { TezosTokenizationService } from "./TezosTokenizationService";

export class TezosPlugin extends RunnerPlugin {
    constructor(
        private logger: Logger,
        private messageBus: MessageBus,
        private tezosTokenizationService: TezosTokenizationService
    ) {
        super();
    }

    async start(): Promise<void> {
        this.messageBus.subscribe(
            TokenizationEvents.ITEM_CREATED,
            (itemId: Pick<Item, "item_id">) => 
                this.tezosTokenizationService.createItem(itemId)
        );
    
        this.logger.debug("Tezos Tokenization service listening on Item events");
    }
}
