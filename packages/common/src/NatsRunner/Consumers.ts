import { ConsumerOpts, ConsumerOptsBuilder } from "nats";
import { JetStreamMessage } from "./Messages";

export abstract class JetStreamConsumer {
    abstract readonly subject: string;
  
    getConsumerOptions(): ConsumerOptsBuilder | Partial<ConsumerOpts> {
      return {};
    }

    abstract handle<T>(msg: JetStreamMessage<T>): Promise<void>;
  } 
