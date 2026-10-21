# Subscription & Billing Management System

A modern SaaS starter application for managing customers, subscription plans, recurring billing records, invoices, payments, and revenue insights. The project uses the MERN stack with a React dashboard styled using Tailwind CSS and Font Awesome icons.

## Project Name

**Subscription & Billing Management System**

## Description

The Subscription & Billing Management System provides a centralized interface for subscription-based businesses to manage customer records, pricing plans, subscriptions, invoices, and payment activity.

The frontend is built with React and Vite. Tailwind CSS provides utility-first styling, Font Awesome supplies icons, and Recharts renders dashboard charts. The backend is a REST API built with Node.js and Express, with MongoDB accessed through Mongoose.

This repository is a starter project. The dashboard includes illustrative sample data, and the API supports basic customer, plan, and subscription operations plus invoice and payment listing. Production features such as authentication, tenant isolation, payment-provider checkout and verified webhooks must be added before handling real customer or payment data.

## Features

### Dashboard
- SaaS-style responsive admin dashboard.
- Summary cards for monthly recurring revenue, active subscriptions, customers, and outstanding invoices.
- Revenue chart and subscription-plan overview.
- Recent invoice table.
- Responsive sidebar navigation.

### Customer Management
- Retrieve customer records from the API.
- Create a customer using the customer API.
- Store customer name, email, company, and status.
- Search loaded records in the frontend.

### Subscription Management
- Mongoose model for customer subscriptions.
- Subscription status options including Trial, Active, Past Due, Suspended, and Cancelled.
- Associate a subscription with a customer and plan.
- Store billing-period dates and cancellation-at-period-end settings.
- List subscriptions with populated customer and plan details.

### Plans and Pricing
- Create and list subscription plans.
- Store plan name, description, amount, currency, monthly/yearly interval, features, and active status.
- Amounts are stored as integer minor currency units (for example, cents).

### Invoices and Payments
- Invoice and payment database models.
- List invoices and payment records through REST endpoints.
- Track invoice and payment statuses.
- Keep provider references for future payment gateway integration.

### Developer Experience
- Separate frontend and backend applications.
- Vite development server with hot reload.
- Environment-based configuration.
- Express middleware for security headers, CORS, request logging, and JSON parsing.
- Centralized API error handling.
- Mongoose schemas and indexes.

## Technologies

### Frontend
- **React** — component-based user interface.
- **Vite** — frontend development server and build tool.
- **Tailwind CSS** — utility-first styling.
- **Font Awesome** — icons.
- **Recharts** — dashboard charts.
- **React Router** — client-side navigation.
- **Axios** — HTTP requests.

### Backend
- **Node.js** — JavaScript runtime.
- **Express.js** — REST API framework.
- **MongoDB** — document database.
- **Mongoose** — MongoDB object modeling.
- **Helmet** — security-related HTTP headers.
- **CORS** — cross-origin request configuration.
- **Morgan** — HTTP request logging.
- **dotenv** — environment variable loading.
- **Nodemon** — automatic backend restarts during development.

### Tools
- **npm** — dependency management.
- **Git and GitHub** — version control.

## Project Structure

```text
subscription-billing-saas/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       └── lib/
│           └── api.js
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   └── db.js
│       ├── models/
│       │   ├── Customer.js
│       │   ├── Plan.js
│       │   ├── Subscription.js
│       │   ├── Invoice.js
│       │   └── Payment.js
│       ├── routes/
│       │   ├── customerRoutes.js
│       │   ├── planRoutes.js
│       │   ├── subscriptionRoutes.js
│       │   ├── invoiceRoutes.js
│       │   └── paymentRoutes.js
│       └── utils/
│           └── asyncHandler.js
├── .gitignore
├── package.json
└── README.md
```

## Requirements

Install these before running the application:

- Node.js 20 or later.
- npm (included with Node.js).
- MongoDB running locally, or a MongoDB Atlas database.
- Visual Studio Code or another code editor (recommended).

Check your versions:

```bash
node --version
npm --version
```

## How to Run the Project

### 1. Download and Extract

Download or clone the project, then open the extracted `subscription-billing-saas` folder in VS Code.

If using Git:

```bash
git clone <your-repository-url>
cd subscription-billing-saas
```

Replace `<your-repository-url>` with your actual Git repository URL.

### 2. Install Dependencies

Run these commands from the project root:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `server` directory. You can copy the example file:

**Windows PowerShell:**

```powershell
Copy-Item server/.env.example server/.env
```

Then set the values in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/subscription_billing
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

For a local MongoDB setup, make sure the MongoDB service is running. If you use MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string. Keep credentials private and never commit `.env` to Git.

### 4. Start the Application

From the project root, run:

```bash
npm run dev
```

This starts the backend and frontend development servers concurrently.

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api`

Keep the terminal open while developing. Press `Ctrl + C` to stop the development servers.

### 5. Verify the Backend

Open the following URL in a browser:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "subscription-billing-api"
}
```

The dashboard endpoint is available at:

```text
http://localhost:5000/api/dashboard
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API health |
| GET | `/api/dashboard` | Dashboard summary and illustrative chart data |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create a customer |
| GET | `/api/plans` | List plans |
| POST | `/api/plans` | Create a plan |
| GET | `/api/subscriptions` | List subscriptions |
| POST | `/api/subscriptions` | Create a subscription record |
| GET | `/api/invoices` | List invoices |
| GET | `/api/payments` | List payment records |

The API uses JSON request and response bodies. For plan creation, `amount` is an integer in minor currency units. For subscription creation, provide existing MongoDB IDs for `customer` and `plan`, plus a valid `currentPeriodEnd` date.

Example customer request:

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "company": "Example Studio"
}
```

Example plan request:

```json
{
  "name": "Professional",
  "description": "For growing teams",
  "amount": 2900,
  "currency": "USD",
  "interval": "month",
  "features": ["Priority support", "Advanced reports"]
}
```

## Troubleshooting

### MongoDB connection error
- Confirm MongoDB is running.
- Check `MONGODB_URI` in `server/.env`.
- If using Atlas, check the database user, network access rules, and connection string.

### Port already in use
Change `PORT` in `server/.env` if port `5000` is occupied. If you change the API port, update `VITE_API_URL` in `client/.env` accordingly.

### Frontend cannot reach the API
- Confirm the backend is running.
- Check `CLIENT_ORIGIN` in `server/.env`.
- Optional: create `client/.env` with `VITE_API_URL=http://localhost:5000/api` if your API uses a different address.

### Missing dependencies
Run the install commands again from the project root, then restart `npm run dev`.

## Security and Production Readiness

This starter is intended for development and demonstration. Before deploying or processing real customer or payment data, implement and test:

- Authentication and secure session/token management.
- Role-based access control and tenant-level data isolation.
- Request validation, rate limiting, and audit logs.
- Payment-provider hosted checkout and verified webhooks.
- Idempotency for payment and billing operations.
- A reliable scheduler/queue for renewals, retries, and notifications.
- Invoice numbering, tax rules, refunds, reconciliation, and currency handling.
- Automated backend, frontend, and end-to-end tests.
- Production environment secrets, backups, monitoring, and deployment configuration.

Do not store raw payment card numbers or CVC values in MongoDB. Payment status must be confirmed by the trusted payment provider, not by the frontend.

## License

Add a license file before publicly distributing this project. If no license is included, all rights remain with the copyright holder by default.
