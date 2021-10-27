const express = require('express');
var cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();


const app = express();
const port = 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zwiso.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db(process.env.DB_NAME);
        const productCollection = database.collection(process.env.COLLECTION_NAME);
        const ordersCollection = database.collection("orders");
        //post api
        app.post('/addProduct', async (req, res) => {
            console.log('new data : ', req.body);
            const newUser = req.body;
            const result = await productCollection.insertOne(newUser);
            console.log(`Added user at index: ${result.insertedId}`);
            console.log('Success');
            res.json(result);
        })

        //use post to load the data of local storage
        app.post('/product/bykey', async (req, res) => {
            // console.log('the keys of product : ', req.body);
            const productsKeys = req.body;
            const filter = { key: { $in: productsKeys } };
            const cursor = productCollection.find(filter);
            const products = await cursor.toArray();
            console.log('hitt ', products);
            res.json(products);
        })


        //get api
        app.get('/products', async (req, res) => {
            // console.log(req.query);
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const cursor = productCollection.find({});
            const count = await cursor.count();
            let products;
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }
            res.send({
                count,
                products
            });
        });

        //add order api 
        app.post('/orders', async (req, res) => {
            console.log('orders : ', req.body);
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            console.log('Successfully ordered');
            res.json(result);
        })

    } finally {
        // the next line is commented, because connection is closing before trigger post
        // await client.close();
    }

}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
