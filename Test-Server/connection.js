const mongoose = require('mongoose')

connectionString = process.env.DATABASE

mongoose.connect(connectionString).then((res)=>{
    console.log('MongoDB connected successfully');
}).catch((err)=>{
    console.log(`MongoDB connection failed ${err}`);
})