const mongoose = require('mongoose')
const Schema  = mongoose.Schema
const scoreSchema = new Schema ({
    team_name: {
        type:String
    },
    cp: {
        type:Number,
        default: 0
    },
    time_finish: {
        type:String,
        default: "00:00:00"
    },
    outline: {
        type:Number,
        default: 0
    },
    negative_point: {
        type:Number,
        default: 0
    },
    score: {
        type:Number,
        default: 0
    }
})
const scoreModel = mongoose.model('Score', scoreSchema)
module.exports=scoreModel