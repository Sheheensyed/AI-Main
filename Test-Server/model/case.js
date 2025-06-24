const mongoose = require('mongoose')

const caseSchema = new mongoose.Schema({
    device: {
        type: String,
        // required: true
    },
    model: {
        type: String,
        // required: true
    },
    user_query: {
        type: String,
        // required: true
    },
    steps: {
        type: [String],
        default: []
    },
    mapped_steps:{
        type:[String],
        default:[]
    }

},
    { timestamps: true })
module.exports = mongoose.model('Case', caseSchema)