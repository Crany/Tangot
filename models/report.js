const mongoose = require('mongoose') // Optional

const reportSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    reason: String,
    reportedTag: String,
    identifier: String,
    where: String,
});

module.exports = mongoose.model("Report", reportSchema);