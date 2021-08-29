var chokidar = require("chokidar");
const admin = require("firebase-admin");
const fs = require("fs");
const serviceAccount = require("./queans-75b3f-firebase-adminsdk-kmlou-bbcc65eb5e.json");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const tesseract = require("tesseract.js");
const uuid = require("uuid-v4");
const gc = new Storage({
  keyFilename: path.join(
    __dirname,
    "./queans-75b3f-firebase-adminsdk-kmlou-bbcc65eb5e.json"
  ),
  projectId: "queans-75b3f",
});

const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "queans-75b3f.appspot.com",
});
const db = admin.firestore();
const bucket = admin.storage().bucket();
const img = gc.bucket("staging.queans-75b3f.appspot.com");

// var storageRef = firebase.storage().ref();
var watcher = chokidar.watch("C:/Users/deepa/Pictures/Screenshots", {
  ignored: /^\./,
  persistent: true,
});

// gc.getBuckets().then((x) => {
//   console.log(x);
// });
i = 0;
watcher.on("add", async function (path) {
  // console.log("File", path, "has been added");
  const metadata = {
    metadata: {
      // This line is very important. It's to create a download token.
      firebaseStorageDownloadTokens: uuid(),
    },
    contentType: "image/png",
    cacheControl: "public, max-age=31536000",
  };
  //------------------------------------------------------------------------------------------------------------------------//
  if (i != 0) {
    console.log(`${path} uploaded.`);
    tesseract
      .recognize(path, "eng", { logger: (m) => console.log(m) })
      .then(async ({ data: { text } }) => {
        console.log("Result:", text);
        //------------------------------------------------------------------------------------------------------------------------//
        //------------------------------------------------------------------------------------------------------------------------//
        await bucket
          .upload(path, {
            // Support for HTTP requests made with `Accept-Encoding: gzip`
            gzip: true,
            metadata: metadata,
          })
          .then((x) => {
            // console.log(x[0].metadata.mediaLink);
            // let modiLink = "";

            token = x[0].metadata.metadata.firebaseStorageDownloadTokens;

            modiLink =
              "https://firebasestorage.googleapis.com/v0/b/" +
              bucket.name +
              "/o/" +
              encodeURIComponent(x[0].name) +
              "?alt=media&token=" +
              token;
            console.log(modiLink);
            var d = new Date();
            let obj = {
              ans: "",
              link: modiLink,
              timeStamp: d.getTime(),
              text: text,
            };
            console.log(obj);
            db.collection("questions2")
              .doc(`${d.getTime()}`)
              .set(obj)
              .then(() => {
                console.log("run");
              });
          });
        //------------------------------------------------------------------------------------------------------------------------//
        //------------------------------------------------------------------------------------------------------------------------//
      })
      .catch((error) => {
        console.log("error.message", error.message);
      });
  } else {
    i++;
  }
  //------------------------------------------------------------------------------------------------------------------------//
});
