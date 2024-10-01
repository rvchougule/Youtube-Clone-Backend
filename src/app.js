import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); //it accespts json
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // TO stores assets on my server in the public folder
app.use(cookieParser());

// route import

import userRoute from "./routes/user.routes.js";

// route declarations

app.use("/api/v1/users", userRoute);

export { app };
