const cors = require("cors");
const express = require("express");
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


// mongodb


// api
app.get('/', (req, res)=>{
  res.send("Server is running")
})
app.listen(port,()=>{
  console.log(`port is running on ${port}`)
})