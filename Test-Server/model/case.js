// const mongoose = require('mongoose')

// const caseSchema = new mongoose.Schema({
//     device: {
//         type: String,
//         // required: true
//     },
//     model: {
//         type: String,
//         // required: true
//     },
//     user_query: {
//         type: String,
//         // required: true
//     },
//     steps: {
//         type: [String],
//         default: []
//     },
//     mapped_steps:{
//         type:[String],
//         default:[]
//     }

// },
//     { timestamps: true })
// module.exports = mongoose.model('Case', caseSchema)



// const mongoose = require('mongoose');

// const caseSchema = new mongoose.Schema({
//     device: {
//         type: String,
//         // required: true
//     },
//     model: {
//         type: String,
//         // required: true
//     },
//     user_query: {
//         type: String,
//         // required: true
//     },
//     steps: {
//         type: [String],
//         default: []
//     },
//     // ✅ FIXED: mapped_steps should be an array of objects, not strings
//     mapped_steps: [{
//         step: {
//             type: String,
//             required: true
//         },
//         api: {
//             type: String,
//             required: true
//         },
//         parameter: {
//             type: String,
//             required: true
//         }
//     }]
// }, { 
//     timestamps: true 
// });

// module.exports = mongoose.model('Case', caseSchema);


// const mongoose = require('mongoose');
// const caseSchema = new mongoose.Schema({
//     device: String,
//     model: String,
//     user_query: String,
//     steps: [String],
//     mapped_steps: [{
//         step: String,
//         api: String,
//         parameter: String
//     }],
//     createdAtFormatted: String  // 👈 add this
// }, { timestamps: true });
// module.exports = mongoose.model('Case', caseSchema);



// const mongoose = require('mongoose');

// const caseSchema = new mongoose.Schema({
//   device: String,
//   model: String,
//   user_query: String,
//   steps: [String],
//   mapped_steps: [{
//     step: String,
//     api: String,
//     parameter: String
//   }],
//   createdAtFormatted: String // 👈 this field
// }, { timestamps: true });

// // Pre-validate hook: runs before saving to DB
// caseSchema.pre('validate', function(next) {
//   if (this.isNew) {
//     const now = new Date();
//     this.createdAtFormatted = now.toLocaleString();
//   }
//   next();
// });

// module.exports = mongoose.model('Case', caseSchema);
