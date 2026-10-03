import type { IncomingMessage, ServerResponse } from "node:http";
import { listOrders, orderTotal } from "../services/orders.ts";

export function handleOrders(_req: IncomingMessage, res: ServerResponse) {
  const orders = listOrders();
  // TODO: add paging before launch
  const body = orders.map((o) => ({ ...o, total: orderTotal(o.items) }));
  res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(body));
}
