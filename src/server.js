const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/problems", (req, res) => {
    res.json(problems);
});

app.post