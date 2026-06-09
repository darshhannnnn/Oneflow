# OneFlow - Plan to Bill in One Place �

A modular Project Management system that lets a Project Manager take a project from **planning → execution → billing** in one place. Built with Next.js 16 and modern web technologies.

## 📋 Overview

**OneFlow** is a comprehensive Project Management ERP that integrates:
- **Plan:** Projects, tasks, people, dates
- **Execute:** Task board, hour logging, status updates, blockers
- **Bill & Track Money:** Link Sales Orders, Purchase Orders, Customer Invoices, Vendor Bills, and Expenses—see Revenue, Cost, Profit per project

## 🎯 Key Features

### 🎨 **Project Management**
- Create and manage projects with progress tracking
- Assign Project Managers and Team Members
- Set deadlines and monitor budget usage
- Visual progress bars and status indicators

### ✅ **Task Management**
- Create task lists under projects
- Assign users, due dates, and priorities
- Task states: New → In Progress → Blocked → Done
- Log hours and add comments/attachments

### 💰 **Financial Integration**
- **Sales Orders (SO)** - What the customer buys
- **Purchase Orders (PO)** - What you buy from vendors
- **Customer Invoices** - Your revenue
- **Vendor Bills** - Your costs from vendors
- **Expenses** - Team out-of-pocket, billable or not

### ⏱️ **Timesheet Tracking**
- Log working hours per task
- Mark as billable/non-billable
- Calculate costs with hourly rates
- Track team productivity

### 📊 **Analytics Dashboard**
- KPI Cards: Total Projects, Tasks Completed, Hours Logged
- Charts: Project Progress %, Resource Utilization
- Project Cost vs Revenue analysis
- Real-time profitability tracking

## 👥 User Roles

- **Admin:** Full system access
- **Project Manager:** Create/edit projects, assign people, manage tasks, approve expenses
- **Team Member:** View tasks, update status, log hours, submit expenses
- **Sales/Finance:** Create/link SO/PO/Customer Invoices/Vendor Bills/Expenses

## 🚀 CI/CD Pipeline

This project includes a complete CI/CD pipeline that automatically deploys to Google Cloud Platform.

**Quick Start:** See [`CICD-SETUP.md`](./CICD-SETUP.md) for 5-minute setup guide.

### Pipeline Features

- ✅ Automated testing with Jest
- ✅ Docker containerization
- ✅ Deploy to Google Cloud Run
- ✅ Zero-downtime deployments
- ✅ Automatic health checks

### Documentation

- 📘 **[CICD-SETUP.md](./CICD-SETUP.md)** - Quick setup guide (Start here!)
- 📗 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment documentation
- 📙 **[ENVIRONMENT.md](./ENVIRONMENT.md)** - Environment variables guide

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router) with Turbopack
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with Google OAuth
- **Storage:** Google Cloud Storage
- **Styling:** TailwindCSS 4
- **UI Components:** Radix UI + shadcn/ui
- **3D Graphics:** Three.js with React Three Fiber
- **Charts:** Recharts for analytics
- **Animations:** GSAP

## 🏃 Getting Started

### Prerequisites

- Node.js >= 20.9.0 (LTS 20.18.0 recommended)
- PostgreSQL database
- npm >= 10.0.0
- Google Cloud account (for OAuth and Storage)

### Local Development

First, install dependencies and set up the database:

```bash
# Install dependencies
npm install

# Set up environment variables
cp ENVIRONMENT.md .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npm run prisma:generate

# Run database migrations (optional)
npm run prisma:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
```

### Prisma Commands

```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:push      # Push schema to database
npm run prisma:pull      # Pull schema from database
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🐳 Docker

Build and run with Docker:

```bash
# Build image
docker build -t oneflow .

# Run container
docker run -p 8080:8080 \
  -e DATABASE_URL="your-database-url" \
  -e NODE_ENV=production \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret" \
  oneflow
```

## 🌐 Deployment

### Automated Deployment (Recommended)

Push to `main` branch to automatically deploy to Google Cloud Run:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

See [`CICD-SETUP.md`](./CICD-SETUP.md) for setup instructions.

### Manual Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for manual deployment steps.

## 📁 Project Structure

```
OneFlow/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth authentication
│   │   ├── user/          # User management
│   │   └── upload/        # File upload handlers
│   ├── dashboard/         # Dashboard pages
│   │   └── profile/       # User profile management
│   ├── login/             # Login/signup page
│   └── assistant/         # AI assistant (future)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Footer.jsx        # Global footer
│   ├── StaggeredMenu.jsx # Navigation menu
│   └── UserNav.jsx       # User navigation dropdown
├── lib/                   # Utility functions
│   ├── auth.js           # NextAuth configuration
│   ├── prisma.js         # Prisma client
│   ├── storage.js        # GCP storage utility
│   └── utils.js          # Helper functions
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
├── public/               # Static assets
├── .github/              # GitHub Actions workflows
├── Dockerfile            # Docker configuration
└── *.md                  # Documentation files
```

## 🔐 Environment Variables

Required environment variables (see `.env` file):

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**Authentication:**
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Google Cloud Storage:**
- `GCP_PROJECT_ID` - GCP project ID
- `GCP_BUCKET_NAME` - Storage bucket name
- `GCP_KEY_FILE` - Path to service account key (local)
- `GCP_SERVICE_ACCOUNT_KEY` - Service account JSON (production)

See documentation:
- [`ENVIRONMENT.md`](./ENVIRONMENT.md) - Environment variables
- [`GCP_STORAGE_SETUP.md`](./GCP_STORAGE_SETUP.md) - GCP Storage setup
- [`PRODUCTION_SETUP.md`](./PRODUCTION_SETUP.md) - Production deployment

## 📚 Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js)

### Other Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is built for educational purposes as part of a hackathon challenge.

## 🆘 Support

For setup and deployment issues, see:
- [`QUICK_SETUP.md`](./QUICK_SETUP.md) - Quick setup reference
- [`PRODUCTION_SETUP.md`](./PRODUCTION_SETUP.md) - Production deployment guide
- [`GCP_STORAGE_SETUP.md`](./GCP_STORAGE_SETUP.md) - Storage configuration
- [`NODE_VERSION_FIX.md`](./NODE_VERSION_FIX.md) - Node.js troubleshooting
- [`CICD-SETUP.md`](./CICD-SETUP.md) - CI/CD setup guide
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Deployment documentation

---

**Built with ❤️ by the OneFlow Team**
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Troubleshooting section
