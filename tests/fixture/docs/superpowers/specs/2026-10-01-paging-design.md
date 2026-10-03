# Paging for the orders list

`GET /orders` returns at most 20 orders per page. The page is chosen with `?page=N`, starting at 1.
The response keeps its shape (an array) and adds a `X-Total-Count` header.
