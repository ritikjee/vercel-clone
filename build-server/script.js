import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import fs from "fs";
import mime from "mime-types";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const s3 = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function run() {
  const outDirPath = path.join(__dirname, "output");

  const process = exec(`cd ${outDirPath} && npm install && npm run build`);

  process.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  process.stdout.on("error", function (data) {
    console.log("Error", data.toString());
  });

  process.on("exit", function (code) {
    console.log("Child exited with code " + code.toString());
  });

  process.on("close", async function (code) {
    console.log("Child closed with code " + code.toString());

    const distFolderPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      const command = new PutObjectCommand({
        Bucket: "graphql-eu-north-1",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath) || "application/octet-stream",
      });

      await s3.send(command);
    }
    console.log("Done...");
  });
}

run();
