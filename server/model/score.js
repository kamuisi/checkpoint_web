const mongoose = require('mongoose')
const Schema  = mongoose.Schema
const scoreSchema = new Schema ({
    team_name: {
        type:String
    },
    cp: {
        type:Number
    },
    time_finish: {
        type:String
    },
    score: {
        type:Number
    }
})
const scoreModel = mongoose.model('Score', scoreSchema)
module.exports=scoreModel