var request = require("request");

var options = {
    method: "POST",
    url: "http://localhost:8000/api/item-service/item",
    headers: {
        "Content-Type": "application/json",
        Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjdkYjM5YzE3LWVjNzQtNDczMC04NmFkLTBlYjc3ODljMzJmMSJ9.eyJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaXNzIjoiaHR0cDovL2F1dGhvcml6YXRpb24tc2VydmljZTo4OTk5L29hdXRoMi9kZWZhdWx0IiwiZXhwIjo0MTE2ODE2MzUxLCJpYXQiOjE2MzcwMzA4MTgsImp0aSI6ImM3MTdlN2EzLTBjNGUtNGQzZi04YjhjLTVhMDQ3NDYwMDgzMSIsImNpZCI6InN0dWRpb19pZCIsInN1YiI6InN0dWRpb19pZCIsInN0dWRpbyI6dHJ1ZSwic2NwIjpbInN0dWRpb19zY29wZSJdfQ.dWX6FC7Gc4Dn8VFOoW655PSyLuOnp3RAa3BS0ZJRcUHdVyFW0qbTCq4UeXJQfEO50PEJ4OHbhhwm2HecugXwKLv4dd7UiZkyB6LfU6JBudq_3UjwbuHF6xr6AKUnDm921BjVglnsKCMbLsBLnru83P8oKKqFdAXOWkeGAn6oMdhkzNNMMlyyg3XnfOLmToZhlxb_FWT-Dgp63l7PSeTnj2boZhu-q4E30rsGnieXhAjV7cr0tnywtCcXkrlTHmjwBPmqcjbRXZphoGPn6NCVlyXGqDSAvz_H6kO7FxW4Q9EIr8NNx89GfDoKKKE23Skzi4AH8FBrMbFs9j3lvrQNHA"
    },
    body: JSON.stringify({
        frozen: false,
        name: "reprehenderit veniam",
        data: {},
        total_quantity: 10
    })
};

let item_id = -1;

// setInterval(
//     () =>
//         request(options, function (error, response) {
//             if (error) {
//                 console.error(error);
//                 process.exit(1);
//             }

//             console.log(JSON.parse(response.body).item_id);
//         }),
//     50
// );

setInterval(
    () =>
        request(options, function (error, response) {
            if (error) {
                console.error(error);
                process.exit(1);
            }

            console.log(JSON.parse(response.body).item_id);
        }),
    100
);

// let i = 10000;

// while (i > 0) {
//     request(options, function (error, response) {
//         if (error) {
//             console.error(error);
//             process.exit(1);
//         }

//         console.log(JSON.parse(response.body).item_id);
//     })
//     i--;
// }
