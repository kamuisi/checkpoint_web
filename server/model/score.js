const mongoose = require('mongoose')
const Schema  = mongoose.Schema
const scoreSchema = new Schema ({
    scores:{
        type: Array
    }
})
const scoreModel = mongoose.model('Score', scoreSchema)
module.exports=scoreModel