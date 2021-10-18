import {
    ConsumerOpts,
    ConsumerOptsBuilder,
    JetStreamPullSubscription,
    JetStreamSubscription,
    PullOptions
} from "nats";
import { JetStreamMessage } from "./Messages";

export abstract class JetStreamConsumer {
    abstract readonly subject: string;

    getConsumerOptions(): ConsumerOptsBuilder | Partial<ConsumerOpts> {
        return {};
    }

    abstract handle(msg: JetStreamMessage<unknown>): Promise<void>;

    onReady(): void {
        console.log("Consumer.onReady not implemented");
    }
}

export abstract class JetStreamPushConsumer extends JetStreamConsumer {
    protected subscription?: JetStreamSubscription;

    setSubscription(subscription: JetStreamSubscription): void {
        if (this.subscription) {
            throw new Error("Consumer already has a subscription");
        }
        this.subscription = subscription;
    }

    getSubscription(): JetStreamSubscription {
        if (!this.subscription) {
            throw new Error("Consumer doesn't have a subscription yet");
        }
        return this.subscription;
    }
}

export abstract class JetStreamPullConsumer extends JetStreamConsumer {
    public pullOptions: Partial<PullOptions> = {};
    protected subscription?: JetStreamPullSubscription;

    setSubscription(subscription: JetStreamPullSubscription): void {
        if (this.subscription) {
            throw new Error(`Consumer already has a subscription`);
        }
        this.subscription = subscription;
    }

    getSubscription(): JetStreamPullSubscription {
        if (!this.subscription) {
            throw new Error(`Consumer doesn't have a subscription yet`);
        }
        return this.subscription;
    }
}
