const mongoose = require('mongoose')
require('dotenv').config()

module.exports = connectDB = async()=>{
    const databaseURL = process.env.DB_URL
    try {
        mongoose.set('strictQuery',false);
        const conn = await mongoose.connect(databaseURL)
        console.log(`Database Connected : ${conn.connection.host}`);
    } catch (error) {
        console.log(error)
    }
}
