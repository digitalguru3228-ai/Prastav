# PRASTAV — Frontend MVP

**Tagline:** Transforming Proposals into Decisions.

React + Vite + Tailwind CSS v4 frontend scaffold for the Employee, Approver and Admin dashboards.

## 1. Requirements

- Node.js 20.19+ recommended
- npm

## 2. Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

Build check:

```bash
npm run build
npm run preview
```

## 3. Demo navigation

The app starts at `/employee`.

- `/employee` — employee overview
- `/employee/proposals` — employee proposal list
- `/employee/new` — open new proposal form
- `/approver` — approval overview
- `/approver/pending` — pending reviews
- `/approver/assigned` — assigned proposals
- `/admin` — admin overview
- `/admin/proposals` — all proposals
- `/admin/users` — demo user directory
- `/admin/analytics` — analytics
- `/admin/audit` — approval activity history

Use the profile menu at the top-right to switch between demo roles. This is only a temporary development switcher, **not authentication or authorization**.

## 4. Important integration notes for the teammate building login/authentication

The dashboards are intentionally kept separate from the authentication page.

Recommended integration contract:

1. Keep the login page in its own component/route, for example `/login`.
2. After successful login, the auth layer should provide a normalized user object:
   ```js
   {
     id: "database-user-id",
     name: "Aarav Mehta",
     email: "aarav@example.com",
     role: "employee", // employee | approver | admin
     department: "Technology"
   }
   ```
3. Replace the temporary `currentUser` in `src/context/AppContext.jsx` with the authenticated user supplied by your auth provider.
4. Add a `ProtectedRoute` component that checks authentication and role before rendering each dashboard route.
5. On logout, clear the auth session and navigate to `/login`.
6. Keep authorization checks on the backend/database too. Hiding a route or button in React is not security.
7. Agree on role values (`employee`, `approver`, `admin`) with the authentication teammate before integration.

### Suggested route mapping

| Route | Allowed role |
|---|---|
| `/employee/*` | `employee` |
| `/approver/*` | `approver` |
| `/admin/*` | `admin` |

Do not copy the demo role switcher into production.

## 5. Suggested backend integration

Create API functions in `src/services/` rather than calling `fetch` from UI components. A future API layer could expose:

- `GET /api/requests`
- `POST /api/requests`
- `GET /api/requests/:id`
- `GET /api/approvals/pending`
- `POST /api/requests/:id/decision`
- `GET /api/admin/analytics`
- `GET /api/admin/audit-logs`
- `GET /api/admin/users`

The current app uses local in-memory demo data. Refreshing the browser resets demo changes. The file-upload control currently captures a filename only; it does not upload bytes to storage.

## 6. Folder structure

```text
src/
  components/
    Brand.jsx
    DashboardLayout.jsx
    RequestDetails.jsx
    RequestModal.jsx
    RequestTable.jsx
    StatCard.jsx
    StatusBadge.jsx
  context/
    AppContext.jsx
  data/
    mockData.js
  pages/
    AdminDashboard.jsx
    ApproverDashboard.jsx
    EmployeeDashboard.jsx
  App.jsx
  index.css
  main.jsx
public/
  prastav-logo.png
```

## 7. Design system

- Navy: `#102b59`
- Primary blue: `#17458a`
- Background: `#f5f7fb`
- White cards, subtle borders, rounded corners
- Lucide React icons
- Responsive sidebar and top navigation

## 8. Demo-data disclaimer

The included names, proposals, amounts, dates, analytics and user counts are sample data for frontend demonstration only. No real users or approvals are represented. Connect the backend and validate workflow permissions before using real information.
