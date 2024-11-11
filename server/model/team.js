const mongoose = require('mongoose')
const Schema  = mongoose.Schema
const teamSchema = new Schema ({
    name:{
        type:String
    },
    group:{
        type:String
    },
    image_link:{
        type:String
    },
    score: {
        type: Number
    },
    numcheckpoint: {
        type: Number
    }
})
const teamModel = mongoose.model('Team', teamSchema)
module.exports=teamModel