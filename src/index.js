import { app } from "./app.js";
import connectDB from "./db/db.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("APP ERROR: -", error);
      process.exit(1);
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is listening on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(`MONGODB Connection Error: ${err}`);
  });
