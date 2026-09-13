const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  ownerId: {type: mongoose.Schema.Types.ObjectId, required: true},
  ownerRole: {type: String, enum: ['user','admin'], required: true},
  position: {type: new mongoose.Schema({x:{type:Number,min:0,max:1,required:true},y:{type:Number,min:0,max:1,required:true}}, {_id:false}), default:null}
}, {timestamps:true});
schema.index({ownerId:1,ownerRole:1},{unique:true});
module.exports=mongoose.model('MusicPreference',schema);
