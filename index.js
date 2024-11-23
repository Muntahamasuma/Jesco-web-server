const cors = require("cors");
const express = require("express");
require("dotenv").config();
const jwt = require('jsonwebtoken');

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
        
        const products = await productCollection.find().limit(8).toArray();
        res.send({products})
    });

     // get product
     app.get("/all-products", async (req, res) => {
      const {
        title,
        sort = "asc",
        category,
        page = 1,
        limit = 6,
      } = req.query;

      const query = {};

      if (title) {
        query.title = { $regex: title, $options: "i" };
      }
      if (category) {
        query.category = { $regex: category, $options: "i" };
      }

      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      const sortOption = sort === "asc" ? 1 : -1;

      const products = await productCollection
        .find(query)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .sort({ price: sortOption })
        .toArray();

      const totalProducts = await productCollection.countDocuments(query);

      const categories = [
        ...new Set(products.map((product) => product.category)),
      ];

      res.json({ products, totalProducts, categories });
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