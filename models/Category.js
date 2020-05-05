const mongoose = require("mongoose");
const { Schema } = mongoose;

const CategorySchema = new Schema(
    {
        name: { type: String, required: true },
    },
    {
        timestamps: { createdAt: "createdAt" }
    }
);

module.exports = mongoose.model("Category", CategorySchema);