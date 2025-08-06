# Gegana Music Studio POS System

A modern Point of Sale system built for Gegana Music Studio with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Studio Booking Management**: 2-hour sessions from 11:00 AM to 1:00 AM
- **Product Sales**: Music equipment and refreshments
- **Payment Processing**: Cash, QRIS, Transfer with DP option (minimum 50k)
- **Booking Status Tracking**: On Process / Done status management
- **Employee Attendance**: Clock in/out system
- **Reports & Analytics**: Excel export for transactions and attendance
- **Role-based Access**: Admin and Staff roles
- **Real-time Data**: Powered by Supabase

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Excel Export**: XLSX library

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the migration script in the Supabase SQL editor:
   ```sql
   -- Copy and paste the content from supabase/migrations/create_gegana_schema.sql
   ```

### 2. Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main branch

## Demo Accounts

- **Admin**: username: `admin`, password: `admin123`
- **Staff**: username: `staff1`, password: `staff123`

## Database Schema

### Tables
- `users` - User authentication and roles
- `transactions` - Transaction records
- `transaction_items` - Items within transactions
- `booking_statuses` - Studio booking status
- `attendances` - Employee attendance records

### Security
- Row Level Security (RLS) enabled
- Role-based access policies
- Authenticated user requirements

## Studio Schedule

- **Operating Hours**: 11:00 AM - 1:00 AM
- **Session Duration**: 2 hours each
- **Available Slots**: 
  - 11:00-13:00, 13:00-15:00, 15:00-17:00
  - 17:00-19:00, 19:00-21:00, 21:00-23:00, 23:00-01:00
- **Price**: Rp 100,000 per session

## Payment Options

- **Cash**: Manual amount entry with change calculation
- **QRIS/Transfer**: Automatic exact amount
- **DP (Down Payment)**: Minimum Rp 50,000

## Products Available

- Beverages: Air Putih (3k), Kopi Hitam (8k), Kopi Susu (12k), etc.
- Food: Snack Ringan (10k), Roti Bakar (18k), Nasi Kotak (25k)
- Equipment: Stik Drum (35k), Pick Gitar (5k), Senar Gitar (25k), Kabel Audio (50k)

## License

Private project for Gegana Music Studio.