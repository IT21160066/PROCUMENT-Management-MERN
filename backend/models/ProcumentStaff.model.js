const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProcumentSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
});

module.exports = mongoose.model("ProcumentStaff", ProcumentSchema);
