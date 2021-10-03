module.exports = {
  services: {
    GetDocsHandler: {
      class: "./openApi",
      main: "GetDocsHandler",
      tags: [{ name: "nats.handler" }],
      arguments: ["%cwd%", "%config.SERVICE_NAME%", "@logger"],
    },
  },
};
