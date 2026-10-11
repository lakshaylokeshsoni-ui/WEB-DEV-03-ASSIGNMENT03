# Inventory and Data Management System

**Course:** Web Dev III | **Assignment 3 / Unit 3**  
REST API built with Node.js, Express.js, MongoDB, Mongoose and dotenv.

## Requirements
- Node.js (LTS)
- MongoDB running locally or a MongoDB connection URI
- Postman, Thunder Client, or curl to test the API

## Setup
1. Extract the ZIP and open this folder in VS Code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`.
4. Set `MONGO_URI` in `.env`. The default works if MongoDB is running locally.
5. Start the API:
   ```bash
   npm run dev
   ```
   Or use `npm start`.
6. Visit `http://localhost:5000` to confirm the server is running.

Do not upload your `.env` file or `node_modules` folder to GitHub.

## API endpoints

Base URL: `http://localhost:5000/api/products`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create product |
| GET | `/api/products` | List products with filtering, sorting, pagination |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update product details |
| PATCH | `/api/products/:id/stock` | Restock or record a sale |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/low-stock` | Low-stock alert report |
| GET | `/api/products/category-summary` | Category-wise aggregation summary |

## Example product JSON
Use this body for `POST /api/products`:

```json
{
  "name": "Wireless Mouse",
  "sku": "WM-1001",
  "category": "Electronics",
  "description": "Wireless optical mouse",
  "price": 799,
  "quantity": 20,
  "lowStockThreshold": 5
}
```

`sku` must be unique. `price`, `quantity`, and `lowStockThreshold` cannot be negative.

## Query examples
- All products: `GET /api/products`
- Category: `GET /api/products?category=Electronics`
- Search name/SKU/description: `GET /api/products?search=mouse`
- Price range: `GET /api/products?minPrice=100&maxPrice=1000`
- Quantity range: `GET /api/products?minQuantity=5&maxQuantity=30`
- Sort by price low-to-high: `GET /api/products?sort=price&order=asc`
- Page 2, 5 records: `GET /api/products?page=2&limit=5`
- Combine options: `GET /api/products?category=Electronics&sort=price&order=asc&page=1&limit=10`

## Stock operation examples
`PATCH /api/products/PRODUCT_ID/stock`

Restock body:
```json
{ "operation": "restock", "quantity": 10 }
```

Sale body:
```json
{ "operation": "sale", "quantity": 2 }
```

A sale cannot reduce stock below zero.

## Reports
- `GET /api/products/low-stock` returns products whose quantity is at or below their low-stock threshold.
- `GET /api/products/category-summary` returns product count, total units, inventory value, and average price per category.

## Suggested testing order
1. Create two or three products with different categories.
2. List all products and try search/filter/sort/pagination.
3. Copy an `_id` from the response and get, update, and delete that product.
4. Test restock and sale; try a sale larger than available stock.
5. Test low-stock and category-summary endpoints.
6. Try duplicate SKU and invalid/negative values to check validation.

## Folder structure
```text
inventory-data-management-system/
├── middleware/
│   └── errorHandler.js
├── models/
│   └── Product.js
├── routes/
│   └── products.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```
