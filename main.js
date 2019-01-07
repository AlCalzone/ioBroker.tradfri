const isCompactMode = !!module && !!module.parent;
console.log(`compact mode = ${isCompactMode}`);
module.exports = require("./build/main.js")(isCompactMode);
