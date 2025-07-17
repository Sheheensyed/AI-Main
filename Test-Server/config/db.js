const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('TestAutomationAi', 'root', 'sgbi#sheheen#salim123', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
