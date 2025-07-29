import mongoose from "mongoose";

const mongoUrl = "mongodb://localhost:27017/OAS";

const connectToMongo = () =>
{
    try {
        mongoose.connect(mongoUrl);
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error; 
    }
}
  

export default connectToMongo