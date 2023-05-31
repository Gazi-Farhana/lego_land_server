const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.welwgq7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const toyCollection = client.db("toysDB").collection("toys");

    //my toys
    app.get("/toys", async (req, res) => {
      let email = {};
      let sort = {};
      if (req.query?.email) {
        email = { email: req.query.email };
      }

      let query = req.query?.sort;
      if (query == "high") {
        sort = { price: -1 };
      } else if (query == "low") {
        sort = { price: 1 };
      }
      const cursor = toyCollection.find(email).sort(sort);
      const result = await cursor.toArray();
      res.send(result);
    });

    //data sorted by id
    app.get("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    //category data
    app.get("/category", async (req, res) => {
      let query = {};
      if (req.query?.sub_category) {
        query = {
          sub_category: { $regex: new RegExp(req.query.sub_category, "i") },
        };
      }
      const cursor = toyCollection.find(query).limit(20);
      const result = await cursor.toArray();
      res.send(result);
    });

    //search data
    app.get("/search", async (req, res) => {
      let query = {};
      if (req.query?.name) {
        query = { name: { $regex: new RegExp(req.query.name, "i") } };
      }
      const cursor = toyCollection.find(query).limit(20);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/toys", async (req, res) => {
      const toy = req.body;
      const result = await toyCollection.insertOne(toy);
      res.send(result);
    });

    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const update = req.body;
      const updateToy = {
        $set: {
          price: update.price,
          quantity: update.quantity,
          description: update.description,
        },
      };
      const result = await toyCollection.updateOne(filter, updateToy, options);
      res.send(result);
    });

    app.delete("/toys/:id", async (req, res) => {
      const result = await toyCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The Web is running");
});

app.listen(port, () => {
  console.log(`listening port: 5000`);
});
