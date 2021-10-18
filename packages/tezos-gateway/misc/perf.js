var request = require("request");

var options = {
    method: "POST",
    url: "http://localhost:8000/api/item-service/item",
    headers: {
        "Content-Type": "application/json",
        Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjcwODBiMGFhLWU3NmItNDU1Yy04NGU0LWU2ZGJiYWRlZjBjYSJ9.eyJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaXNzIjoiaHR0cDovL2F1dGhvcml6YXRpb24tc2VydmljZTo4OTk5L29hdXRoMi9kZWZhdWx0IiwiZXhwIjo0MTE2ODE2MzUxLCJpYXQiOjE2Mzc1NTM0NTgsImp0aSI6ImU5ZGE1NzQ0LThiYzUtNDg3Ny05MTY4LWUyODNiODdhMzFmYyIsImNpZCI6InN0dWRpb19pZCIsInN1YiI6InN0dWRpb19pZCIsInN0dWRpbyI6dHJ1ZSwic2NwIjpbInN0dWRpb19zY29wZSJdfQ.fBpzw2cY3xxGlncB-sJ6PsV0S3QagVd9DmbTDqGG_JSicn9QhBVJnW9FCeOej0WSooRH0sgTpuAlHWEEP8lLUy5xWst8D4S-1KfB9NV_-Homg5Hy6lGItfoNzT08fomLkCp3vL5sQNhdLmBTWV8EfisUeKV0UfL6yBlg9dPCsjFiS6DELQZtiZuOBWBcz6wuHvZH5KAx0lFGvfBNu59zgw3MKzzKyWUcRuUAqEEmqCrvmZBSyhWOU-sNXMJ40iCni-wRCTWHiixPfI9zvZfikpyfxUmzLnZ1OsrwrxMUhfsAyLp1rpFX7tp0F3pLgwZsDCsgIXn9efM0lBeb16j8kQ"
    },
    body: JSON.stringify({
        frozen: false,
        name: "reprehenderit veniam",
        data: {},
        total_quantity: 10
    })
};

setInterval(
    () =>
        request(options, function (error, response) {
            if (error) {
                console.error(error);
                process.exit(1);
            }

            console.log(JSON.parse(response.body).item_id);
        }),
    500
);
