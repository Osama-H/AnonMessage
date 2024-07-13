const Redis = require("redis");

// Notice: On production we will pass the Url for our production instance of redis

const redisClient = Redis.createClient();
(async () => {
  await redisClient.connect();
})();
module.exports = getOrSetCache = async (key, cb) => {
  const value = await redisClient.get(key);
  if (value) {
    console.log("Cache hit");
    return JSON.parse(value);
  } else {
    console.log("Cache Miss");
    const freshValue = await cb();
    redisClient.setEx(key, 20, JSON.stringify(freshValue));
    return freshValue;
  }
};
