Sure! Here is the **complete `.md` file content**, cleanly formatted and ready for GitHub.
You can **copy–paste this into a file named `README.md`** directly.

---

# **📦 Product Importer — Scalable CSV Upload System**

A production-grade web application designed to handle **large CSV imports (500,000+ products)**, provide **real-time progress updates**, support **complete product management**, expose **webhook configurations**, and ensure **scalable asynchronous processing** using Celery/Dramatiq.

This README provides architecture, requirements, API details, UI behavior, deployment guidance, and development instructions—suitable for any IDE Agent (Kiro, Cursor, Copilot Workspace) to build the application end-to-end.

---

## **🚀 Overview**

This application imports large product CSVs into PostgreSQL while maintaining high performance and responsiveness.
It includes:

- Bulk CSV upload via UI
- Real-time upload progress (SSE/WebSockets/polling)
- Asynchronous background processing
- Product CRUD dashboard
- Bulk delete
- Webhook configuration and testing
- Clean minimal UI
- Public deployment (Render/Heroku/AWS/etc.)

---

# **📚 Functional Requirements**

## **✔ STORY 1 — CSV Upload via UI**

Users must be able to upload CSV files up to **500,000 records**.

### Requirements

- Upload CSV via browser UI
- Show real-time progress bar & status
- CSV parsing and DB import must run asynchronously
- Duplicate SKUs overwrite existing products
- SKU treated as **case-insensitive**
- SKU must be **unique**
- Products have `active/inactive` field (UI-managed, not part of CSV)
- System must stay responsive during long uploads

---

## **✔ STORY 1A — Upload Progress Visibility**

UI should visually show upload progress in real time.

### Must include:

- Progress bar
- Percentage completion
- Status messages → “Parsing CSV…”, “Validating…”, “Importing…”, “Completed”
- Clear error messages
- Retry option on failure
- Implemented using SSE/WebSockets or polling API

---

## **✔ STORY 2 — Product Management UI**

A complete CRUD dashboard.

### Features:

- Paginated product list
- Filters: SKU, name, active status, description
- Inline edit or modal form
- Create new product
- Update product
- Delete product
- Minimal clean HTML/JS interface

---

## **✔ STORY 3 — Bulk Delete**

Users must be able to delete **all** products.

### Features:

- “Delete All Products” button
- Confirmation modal: _“Are you sure? This cannot be undone.”_
- Success/error notifications
- Responsive UI with loading indicator
- Operation must not block UI

---

## **✔ STORY 4 — Webhook Configuration UI**

Users configure and manage webhooks.

### Features:

- Add/edit/delete webhooks
- Event types support:

  - `product.created`
  - `product.updated`
  - `upload.completed`

- Enable/disable toggle
- Test webhook:

  - Show HTTP status
  - Show response time

- Processing done asynchronously
- Must not slow down the app

---

# **🛠 Recommended Technology Stack**

| Component      | Recommended                 |
| -------------- | --------------------------- |
| Web Framework  | FastAPI (or Django)         |
| ORM            | Django Orm                  |
| Database       | default sqlite3             |
| Async Worker   | Celery or Dramatiq          |
| Message Broker | Redis or RabbitMQ           |
| Deployment     | Render / Heroku / AWS / GCP |
| Frontend       | Minimal HTML+JS             |

---

# **📐 System Architecture**

```
                      ┌──────────────────────┐
                      │        UI App        │
                      │ (HTML/JS Frontend)   │
                      └───────┬──────────────┘
                              │
                     CSV Upload (POST)
                              │
               ┌──────────────▼──────────────┐
               │         FastAPI API         │
               │     (REST + SSE endpoints)  │
               └──────────────┬──────────────┘
                              │
                 Create Async Upload Task
                              │
                    ┌────────▼────────┐
                    │     Celery      │
                    │  Worker Pool    │
                    └──────┬─────────┘
                           │
                 Process CSV in chunks
                           │
                     Upsert Products
                           │
                Store task progress in Redis
                           │
       UI receives updates through SSE/WebSockets
```

---

# **📄 Database Schema**

## **Product Table**

| Column      | Type      | Notes               |
| ----------- | --------- | ------------------- |
| id          | UUID      | PK                  |
| sku         | TEXT      | UNIQUE (lowercased) |
| name        | TEXT      |                     |
| description | TEXT      |                     |
| price       | NUMERIC   |                     |
| active      | BOOLEAN   | default = true      |
| created_at  | timestamp |                     |
| updated_at  | timestamp |                     |

---

## **Webhook Table**

| Column             | Type    |
| ------------------ | ------- |
| id                 | UUID    |
| url                | TEXT    |
| event_type         | TEXT    |
| enabled            | BOOLEAN |
| last_status        | INTEGER |
| last_response_time | FLOAT   |

---

# **📊 API Endpoints**

## **CSV Upload**

```
POST /upload
GET /upload/status/{task_id}
GET /upload/progress/{task_id}   # (SSE)
```

---

## **Products API**

```
GET    /products?page=1&sku=...&active=...
POST   /products
PUT    /products/{id}
DELETE /products/{id}
DELETE /products                 # bulk delete
```

---

## **Webhook API**

```
GET    /webhooks
POST   /webhooks
PUT    /webhooks/{id}
DELETE /webhooks/{id}

POST   /webhooks/test/{id}
```

---

# **⚡ Asynchronous Worker (Celery)**

Worker tasks include:

- Stream-read CSV in batches
- Validate records
- Convert SKU to lowercase
- PostgreSQL bulk upsert using `ON CONFLICT DO UPDATE`
- Update progress into Redis
- Send webhook events:

  - On product created
  - On product updated
  - On upload completion
  

### Progress keys stored as Redis:

```
upload:{task_id}:progress
upload:{task_id}:status
upload:{task_id}:error
```

---

# **🧹 Bulk Delete Workflow**

1. User clicks “Delete All Products”
2. Confirmation modal
3. Backend triggers Celery task
4. Worker truncates table (or batch deletes)
5. UI waits for success state
6. Notify user

---

# **🔔 Webhooks**

## Triggered on:

- Product created
- Product updated
- CSV upload completed

### Webhook Test API Workflow:

1. Send dummy payload `{ "test": true }`
2. Display:

   - HTTP Status
   - Response time
   - Optional body excerpt

### Processing must be:

- Async
- Retried on failure
- Logged

---

# **🖥 UI Functionality Overview**

## Pages:

### **1. Dashboard**

- CSV upload
- Upload progress bar
- Status messages
- Upload history

### **2. Product List**

- Pagination
- Filters
- Inline edit or modal
- Create new product
- Delete product
- Bulk delete

### **3. Webhook Management**

- List webhooks
- Add/edit/delete
- Enable/disable
- Test webhook
- Show last response results

---

# **🌐 Deployment Guide**

Supported platforms:

- Render (recommended)
- Railway
- Heroku
- AWS EC2 / Docker
- GCP Cloud Run

### Required environment variables:

```
DATABASE_URL=postgres...
REDIS_URL=redis...
CELERY_BROKER_URL=redis...
SECRET_KEY=...
```

### Notes:

- CSV uploads MUST be async to bypass 30-sec web timeouts
- Render supports SSE natively
- Use worker dyno for Celery

---

# **📁 Folder Structure**

```
product-importer/
│
├── app/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── workers/
│   ├── webhooks/
│   ├── templates/   # HTML
│   ├── static/      # JS/CSS
│   └── main.py
│
├── celery_app.py
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

# **✔ Developer Checklist**

| Task                    | Done |
| ----------------------- | ---- |
| CSV Upload UI           | ☐    |
| Real-time progress      | ☐    |
| Async background worker | ☐    |
| PostgreSQL schema       | ☐    |
| Product CRUD            | ☐    |
| Pagination + filtering  | ☐    |
| Bulk delete             | ☐    |
| Webhook config UI       | ☐    |
| Webhook tester          | ☐    |
| Deployment              | ☐    |
| README                  | ✔    |

---

# **✨ Instructions for IDE Agent (Kiro/Cursor/Copilot Workspace)**

**Build the complete application EXACTLY as specified above using:**

- FastAPI
- SQLAlchemy
- Celery + Redis
- PostgreSQL
- HTML + vanilla JS UI
- SSE for progress
- Complete CRUD + webhooks
- Fully deployable setup (Docker, Render configs, etc.)

When writing code, ensure:

- Modular structure
- Proper documentation
- Clean commit history
- Scalable batch processing
- Optimized queries
- Secure input handling
