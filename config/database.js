const { Sequelize } = require("sequelize");

const DbConstants = {
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
};

const sequelize = new Sequelize(DbConstants.DB_NAME, "postgres", "1234", {
  dialect: "postgres",
  host: "localhost",
  pool: {
    max: 3000,
    min: 0,
    acquire: 1000000,
    idle: 20000,
    evict: 10000,
  },
  logging: false,

});

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log(`DataBase Synced Sucessfully`);
  } catch (err) {
    console.log(`Error In DB ${err}`);
  }
})();

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB Successfully");
  } catch (err) {
    console.log(`Unable To Connect, The Error : ${err}`);
  }
})();

module.exports = sequelize;
