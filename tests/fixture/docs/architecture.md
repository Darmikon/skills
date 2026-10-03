# Architecture

Requests go to `src/server.ts`, which hands `/orders` to the orders route.
Totals are computed in the orders service and returned in cents.
