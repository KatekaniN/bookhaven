const https = require("https");
const fs = require("fs");
const path = require("path");

const avatars = [
  {
    name: "sarah",
    url: "https://ui-avatars.com/api/?name=Sarah&size=400&background=B7A3CA&color=fff&bold=true",
  },
  {
    name: "alex",
    url: "https://ui-avatars.com/api/?name=Alex&size=400&background=9d7bb4&color=fff&bold=true",
  },
  {
    name: "emma",
    url: "https://ui-avatars.com/api/?name=Emma&size=400&background=8B5A9C&color=fff&bold=true",
  },
];

const downloadAvatar = (name, url) => {
  const filePath = path.join(
    __dirname,
    "..",
    "public",
    "avatars",
    `${name}.jpg`
  );

  https.get(url, (response) => {
    const writeStream = fs.createWriteStream(filePath);
    response.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log(`✅ Downloaded ${name}.jpg`);
    });

    writeStream.on("error", (err) => {
      console.error(`❌ Error downloading ${name}.jpg:`, err);
    });
  });
};

console.log("📥 Downloading avatar placeholders...");
avatars.forEach((avatar) => {
  downloadAvatar(avatar.name, avatar.url);
});
