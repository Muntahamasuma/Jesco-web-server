const cors = require("cors");
const express = require("express");
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6dfffw4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const userCollection = client.db("Jesco-web").collection("users");
const productCollection = client.db("Jesco-web").collection("products");

// add product
app.post("/addproducts", async (req, res) =>{
  const product = req.body;
  const result = await productCollection.insertOne(product);
  res.send(result);
})

async function run() {
  try {
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.get('/addproducts', async (req, res) => {
        
        const products = await productCollection.find().toArray();
        res.send(products)
    });

    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// api
app.get("/", (req, res) => {
  res.send("Server is running");
});

// JWT

app.post('/authentication', async (req, res) =>{
  const userEmail = req.body;
  const token = jwt.sign(userEmail, process.env.ACCESS_KEY_TOKEN, {expiresIn: '10d'});
  res.send({token});
});

app.listen(port, () => {
  console.log(`port is running on ${port}`);
});