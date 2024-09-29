const express = require("express");
const app = express();
const port = 8000;
require("./config/mongo_config");
const cors = require("cors");
app.use(express.json(), express.urlencoded({ extended: true }), cors());

//introduce your routes to the server
const UserRoute = require("./routes/user_routes");
const ActivityRoute = require("./routes/activity_routes");
const CreditRoute = require("./routes/credit_routes");

app.use(UserRoute);
app.use(ActivityRoute);
app.use(CreditRoute);

app.listen(port, () => console.log("Chigga, the server is all fired up on port 8000"));
