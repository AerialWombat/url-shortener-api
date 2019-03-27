const crypto = require("crypto");

const shortenUrl = (longUrl, startIndex, endIndex) => {
  const hash = crypto
    .createHash("md5")
    .update(longUrl)
    .digest("base64")
    .replace(/\//g, "_");
  return hash.substring(startIndex, endIndex + 1);
};

module.exports = {
  shortenUrl: shortenUrl
};
