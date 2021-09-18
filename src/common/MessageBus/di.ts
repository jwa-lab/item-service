module.exports = {
    services: {
        eventEmitterMessageBus: {
            class: "./EventEmitterMessageBus"
        },
        messageBus: "@eventEmitterMessageBus"
    }
};
