# CRM: Lead and Client Management

[Português](README.md) · **English**

![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22.13+-5fa04e?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003b57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)

A full-stack app that helps small digital agencies (websites, marketing and social media) track a client's whole lifecycle: from the first contact as a **lead** to **recurring billing**, including conversation history and the weekly schedule.

> The user interface is in Brazilian Portuguese.

## Features

- **Weekly dashboard**: a 7-day schedule plus alerts for overdue and upcoming payments.
- **Contacts**: search by name, filter by status, and shortcuts to WhatsApp, Google Maps and e-mail.
- **Lead → client pipeline**: promote a lead by registering the contracted service and the first payment in a single transaction.
- **Interaction history**: each entry automatically updates the contact's last-contact date.
- **Services and payments**: one-off, installment or monthly charges, proof-of-payment upload, and an "overdue" status computed from the due date.
- **Recurring tasks**: daily, weekly, biweekly, monthly or custom repetition. You can edit or delete a single occurrence, the following ones, or the whole series.
- **Finances**: revenue received this month compared with the expected amount, broken down by charge type.

## Tech stack

| Layer    | Technologies                                        |
| -------- | --------------------------------------------------- |
| Frontend | Vue 3 (Composition API, `<script setup>`), Vue Router, Vite |
| Backend  | Node.js, Express 5, Multer (file uploads)           |
| Database | SQLite through the built-in `node:sqlite` module    |
| Infra    | Docker (multi-stage build) and Docker Compose       |

## Project structure

```
.
├── client/                 # Vue SPA
│   └── src/
│       ├── api/            # HTTP client and per-resource functions
│       ├── components/     # reusable components and contact panels
│       ├── composables/    # useRequest (loading/error state for API calls)
│       ├── constants/      # UI labels
│       ├── utils/          # date/currency formatting and external links
│       └── views/          # pages
├── server/                 # Express REST API
│   ├── routes/             # contacts, interactions, services, payments, tasks
│   ├── config.js           # environment variables
│   ├── db.js               # connection and helpers (insert, update, transaction)
│   ├── schema.sql          # tables and indexes
│   └── seed.js             # sample data
├── Dockerfile
└── compose.yaml
```

## Getting started

### With Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000. The database and uploaded files are stored in the `crm-data` volume.

To load sample data:

```bash
docker compose exec crm node seed.js
```

### Locally

Requires **Node.js 22.13 or newer** (for `node:sqlite`).

```bash
npm install
npm run install:all
npm run seed     # optional: sample data
npm run dev      # API on :3000, frontend on :5173
```

Open http://localhost:5173. Vite proxies `/api` and `/uploads` to the API.

To run the production build without Docker:

```bash
npm run build
npm start        # API + frontend on http://localhost:3000
```

> The seed script **deletes all existing data** before inserting the samples.

### Environment variables

| Variable       | Default                 | Description                          |
| -------------- | ----------------------- | ------------------------------------ |
| `PORT`         | `3000`                  | API port                             |
| `DATA_DIR`     | `server/data`           | Folder for the `crm.db` file         |
| `UPLOADS_DIR`  | `server/uploads`        | Folder for uploaded payment proofs   |
| `VITE_API_URL` | `http://localhost:3000` | Vite dev proxy target                |

## API

See the [endpoint table in the Portuguese README](README.md#api). Routes and payloads are the same.

## Technical decisions

- **Built-in SQLite (`node:sqlite`)**: no native dependencies to compile, and the whole database is a single file, which keeps backups and deploys simple.
- **Payment status derived from dates**: "paid", "pending" and "overdue" are computed from `paid_date` and `due_date`. Overdue statuses are refreshed on read, so no cron job is needed.
- **Materialized recurrence**: a series creates 12 occurrences inside one transaction, linked by `recurrence_group_id`. Each occurrence can be completed or edited on its own. Monthly series respect month ends (Jan 31 → Feb 28 → Mar 31).
- **Local-time dates**: dates are formatted as `YYYY-MM-DD` in local time, avoiding the off-by-one-day bug `toISOString()` causes in the evening in negative UTC offsets.
- **Single container**: in production Express serves both the API and the Vue build, so a deploy is one image and one volume.

## Roadmap

- Authentication and multi-user support
- Automated tests for the API and components
- Responsive mobile layout
- Financial report export

## Author

**Lucas Baccelli**: [LinkedIn](https://www.linkedin.com/in/lucasbaccelli) · [GitHub](https://github.com/baxelin)

## License

Released under the [MIT](LICENSE) license.
