# Numerology API v2

A TypeScript-based Express API for numerology calculations and PDF report generation.

## Features

- Numerology calculations based on birth date and name
- PDF report generation
- Multi-language support (English and French)
- RESTful API endpoints

## Prerequisites

- Node.js (v14 or higher)
- pnpm package manager

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file based on the provided example

## Development

To start the development server:

```bash
pnpm dev
```

The server will start on port 3000 (or the port specified in your `.env` file).

## Building for Production

To build the project:

```bash
pnpm build
```

To start the production server:

```bash
pnpm start
```

## API Endpoints

### Calculate Numerology

```
POST /calculate
Content-Type: application/json

{
  "birthDate": "1990-01-01",
  "fullName": "John Doe"
}
```

### Generate PDF Report

```
POST /generate-pdf
Content-Type: application/json

{
  "birthDate": "1990-01-01",
  "fullName": "John Doe",
  "includeDetails": true,
  "language": "en"
}
```

## Project Structure

```
src/
├── config/
│   └── numerology-data.ts  # Contains all numerology data mappings
├── controllers/
│   ├── calculation.controller.ts
│   └── pdf.controller.ts
├── services/
│   ├── calculation.service.ts
│   └── pdf.service.ts
├── types/
│   └── numerology-types.ts
├── utils/
│   ├── numerology-utils.ts
│   └── date-utils.ts
├── app.ts
└── server.ts
``` 