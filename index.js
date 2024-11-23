const cors = require("cors");
const express = require("express");
require("dotenv").config();
const jwt = require('jsonwebtoken');

const app = express();

const port = process.env.PORT || 5000;
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://jesco-the-final-run.web.app/',
    'https://jesco-the-final-run.firebaseapp.com/' 
  ],
  credentials: true,
  optionSuccessStatus: 200,
}

// middleware
app.use(cors({corsOptions}));
app.use(express.json());

// token verification
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.send({ message: "No Token" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err, decoded) => {
    if (err) {
      return res.send({ message: "Invalid Token" });
    }
    req.decoded = decoded;
    next();
  });
};
// verify seller
const verifySeller = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  if (user?.role !== "seller") {
    return res.send({ message: "Forbidden access" });
  }
  next();
};

// mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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


async function run() {
  try {
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Get User

    app.get("/user/:email", async (req, res) => {
      const query = { email: { $regex: req.params.email, $options: "i" } };

      console.log(req.params.email)
      const user = await userCollection.findOne(query);
      if(!user){
        return res.send({message: "No User Found"})
      }
      res.send(user);
    });

    // insert users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const exitingUser = await userCollection.findOne(query);
      if (exitingUser) {
        return res.send({ message: "This user has already exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // add product
    app.post("/addproducts", async (req, res) =>{
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    })

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

    // add to wishlist
    app.patch('/wishlist/add', async (req, res) => {
      const {userEmail, productId} = req.body;

      const result = await userCollection.updateOne(
        {email: userEmail},
        {$addToSet: {wishlist: new ObjectId(String(productId))}}
      );
      res.send(result)
    })


    // get Data from wishlist
    app.get('/wishlist/:userId', verifyJWT, async(req, res)=>{
      const userId = req.params.userId;

      const user = await userCollection.findOne({_id: new ObjectId(String(userId))});

      if(!user){
        return res.send({message: "User not found"})
      }

      const wishlist = await productCollection
      .find({_id: {$in: user.wishlist || []}})
      .toArray();

      res.send(wishlist);
    })

    // Remove from wishlist
    app.patch('/wishlist/remove', async (req, res) => {
      const {userEmail, productId} = req.body;

      const result = await userCollection.updateOne(
        {email: userEmail},
        {$pull: {wishlist: new ObjectId(String(productId))}}
      );
      res.send(result)
    })


  } catch(error){
    console.log(error.name, error.message)
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