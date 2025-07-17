require('dotenv').config()
require('./connection')
const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const server = express()
server.use(cors())

server.use(express.json());

const caseRoute = require('./routes/caseRoutes')
server.use(caseRoute)

const mappingRoutes = require('./routes/mappingRoutes')
server.use('/api',mappingRoutes)

const mappingRoute = require('./routes/mappingRoute')
server.use("/api",mappingRoute)

const PORT = process.env.PORT || 4000

// server.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running successfully in port number ${PORT}`);
// })
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running successfully in port number ${PORT}`);

  try {
    // 👇 Test DB connection
    await prisma.$connect();
    console.log('✅ MySQL database connected via Prisma');
  } catch (error) {
    console.error('❌ Prisma failed to connect to MySQL:', error.message);
  }
});


server.get('/', (req, res) => {
    res.send(`get request recieved`)
})

