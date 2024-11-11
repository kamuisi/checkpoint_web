const mongoose = require('mongoose')
const Schema  = mongoose.Schema
const teamweb = new Schema ({
    team:{
        type:String
    },
    dualwith:{
        type:String
    },
    turn:{
        type:Number
    },
    time:{
        type:Number
    }, 
    cp:{
        type:Number
    }
})
const teamwebModel = mongoose.model('Teamweb', teamweb)
module.exports= teamwebModel