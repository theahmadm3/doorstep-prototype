# Doorstep Prototype - Food Delivery Platform

A modern food delivery platform built with Next.js 15, TypeScript, and Firebase. This application provides a complete food ordering and delivery system with support for customers, restaurants (vendors), delivery riders, and administrators.

## Features

### For Customers
- Browse restaurants and menus
- Place orders for delivery or pickup
- Real-time order tracking
- Multiple delivery addresses management
- Order history and reordering

### For Restaurants (Vendors)
- Manage restaurant profile and menu items
- Process incoming orders
- Update order status in real-time
- Analytics dashboard
- Manage delivery riders

### For Delivery Riders
- View available delivery jobs
- Accept and manage deliveries
- Real-time navigation with Google Maps
- Delivery history and earnings

### For Administrators
- Manage all restaurants and riders
- Monitor all orders system-wide
- Platform analytics and reporting
- User management

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Firebase (Authentication, Firestore)
- **Maps**: Google Maps API
- **Payments**: Paystack
- **AI**: Google Genkit

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Firebase project
- Google Maps API key
- Paystack account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/theahmadm3/doorstep-prototype.git
cd doorstep-prototype
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your configuration values.

4. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Available Scripts

- `npm run dev` - Start development server with Turbopack on port 9002
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with watch mode

## Project Structure

```
doorstep-prototype/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── customer/     # Customer pages
│   │   ├── vendor/       # Restaurant/vendor pages
│   │   ├── rider/        # Delivery rider pages
│   │   └── api/          # API routes
│   ├── components/       # Reusable React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── checkout/     # Checkout flow components
│   │   └── ...
│   ├── lib/              # Utility functions and shared code
│   │   ├── types/        # TypeScript type definitions
│   │   ├── api.ts        # API client functions
│   │   ├── auth-api.ts   # Authentication API
│   │   └── utils.ts      # Utility functions
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state stores
│   └── ai/               # Genkit AI configurations
├── docs/                 # Documentation
└── public/               # Static assets
```

## Environment Variables

See `.env.example` for a complete list of required environment variables.

## User Roles

The platform supports four user roles:

1. **Customer** - Can browse and order food
2. **Restaurant (Vendor)** - Can manage menu and orders
3. **Rider** - Can accept and deliver orders
4. **Admin** - Platform administration

## Development Guidelines

### Code Quality

- All code must pass TypeScript type checking: `npm run typecheck`
- Follow ESLint rules: `npm run lint`
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

### Type Safety

This project uses strict TypeScript. All components and functions should have proper type definitions. See `src/lib/types/index.ts` for shared types.

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Responsive design is required for all pages

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests and type checking: `npm run typecheck && npm run lint`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Open a Pull Request

## License

This project is part of a prototype and is not yet licensed for public use.

## Support

For questions or issues, please open an issue on GitHub.

