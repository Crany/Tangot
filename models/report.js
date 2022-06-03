const mongoose = require('mongoose') // Optional

const reportSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    reason: String,
    reportedTag: String,
    reportedID: String,
    informantTag: String,
    identifier: String,
});

module.exports = mongoose.model("Report", reportSchema);