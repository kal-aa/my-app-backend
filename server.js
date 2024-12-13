import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import route from "./route.js";
import error from "./middlewares/error.js";
import notFound from "./middlewares/notFound.js";
import logger from "./middlewares/logger.js";
const port = process.env.PORT || 5000;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://kal-aa.github.io"],
  })
);

const isDevelopment = process.env.NODE_ENV === "development";
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", ...(isDevelopment ? ["https://vercel.live"] : [])],
    },
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// setup a view engine 'ejs'
app.set("view engine", "ejs");

//  change the location of the views folder of 'ejs'
app.set("views", path.join(__dirname, "views"));

// parse incoming body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// logger
app.use(logger);

app.get("/", (req, res) => {
  res.send(`This is Kalab:\n Welcome to my backend!`);
});

app.use("/FB", route);

// errorhandler
app.use(error);
app.use("*", notFound);

app.listen(port, () => {
  console.log("You're listening to port", port);
});
