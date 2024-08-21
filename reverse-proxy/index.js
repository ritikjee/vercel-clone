import express from "express";
import "dotenv/config";
import httpProxy from "http-proxy";

const app = express();

const PORT = process.env.PORT || 8080;
const BASE_PATH =
  "https://graphql-eu-north-1.s3.eu-north-1.amazonaws.com/__outputs/";

const proxy = httpProxy.createProxy();

app.use((req, res) => {
  const subdomain = req.hostname.split(".")[0];
  const resolvesTo = `${BASE_PATH}${subdomain}`;
  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
