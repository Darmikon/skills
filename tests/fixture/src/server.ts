import { createServer } from "node:http";
import { handleOrders } from "./routes/orders.ts";

// Listens on port 8080 by default.
const port = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  if (req.url?.startsWith("/orders")) return handleOrders(req, res);
  res.writeHead(404).end();
}).listen(port);
