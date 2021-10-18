var request = require("request");

function getItems(from, to) {
    return new Promise((res, rej) => {
        request(
            {
                method: "GET",
                url: `http://localhost:8000/api/item-service/items?start=${from}&limit=${to}`,
                headers: {
                    Authorization:
                        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEwNjllNzY2LTJiN2MtNGU5ZS1iOTY4LTQ3NTkyYjdkOTdjNyJ9.eyJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaXNzIjoiaHR0cDovL2F1dGhvcml6YXRpb24tc2VydmljZTo4OTk5L29hdXRoMi9kZWZhdWx0IiwiZXhwIjo0MTE2ODE2MzUxLCJpYXQiOjE2MzYzMDY2MDYsImp0aSI6IjJjNTYxY2Q3LTMwMzktNGQ0NC1hMGEwLWFmOTRiMjMyMmVhNCIsImNpZCI6InN0dWRpb19pZCIsInN1YiI6InN0dWRpb19pZCIsInN0dWRpbyI6dHJ1ZSwic2NwIjpbInN0dWRpb19zY29wZSJdfQ.A7Txyd7Iw9lQQVeXnmsFtaJEmTmh63pySMI9ANVn18T7C0uRDgNFv8X8P46Xl0xvYYH4xDTrdVcdaiBslzkdFunHAgYzGUenRJ2CvxsU8pQZe0PXzLcezipyvTJ6inCFvu8WBGXKIHQz9Y8GuJARLDstiPA7pQScTkQAaRfi7e8AYcU3C7wwJ673Bpjwb0bHSHGZyLAVfjKP-kfTSoyXgwJlTS6mpRGjQ6oinUDEuJgZSuSRSBtMT_zmSPYs5Xg_Y75YUXYhDkeFcMI3ACCER-kh_DHDnhBZIeA_AaZVwKDuqwBZ1M9xOz3lSa2-oxG8MX8MHzORjLnghBqqzq1p9g"
                }
            },
            (err, response) => {
                if (err) {
                    console.error(err);
                    rej(err);
                    return;
                }

                res(response.body);
            }
        );
    });
}

const MAX_ITEMS = 82822;
const ITEMS_PER_PAGE = 100;

async function start() {
    const pages = Math.ceil(MAX_ITEMS / ITEMS_PER_PAGE);

    const pagePromises = new Array(pages)
        .fill(null)
        .map((_, idx) => getItems(idx * ITEMS_PER_PAGE, ITEMS_PER_PAGE));

    const results = await Promise.all(pagePromises);

    const allItems = results.reduce((accum, resultPage) => {
        accum.push(...JSON.parse(resultPage).results);
        return accum;
    }, []);

    // const areNull = allItems.filter(item => {
    //   return item.tezos_contract_address === null
    // });

    let item_id = 0;

    allItems.forEach((item) => {
        if (item.item_id - item_id === 1) {
            item_id = item.item_id;
        } else {
            console.error(item.item_id);
            process.exit(1);
        }
    });
}

start();
