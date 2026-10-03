export interface IOrder { id: string; items: { priceCents: number; qty: number }[] }

const ORDERS: IOrder[] = [{ id: "a1", items: [{ priceCents: 1200, qty: 2 }] }];

export function listOrders(): IOrder[] {
  return ORDERS;
}

// Returns the total in euros.
export function orderTotal(items: IOrder["items"]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}

export function refundOrder(id: string): boolean {
  return ORDERS.some((o) => o.id === id);
}

// function oldTotal(items) {
//   let s = 0;
//   for (const i of items) s += i.price;
//   return s;
// }
