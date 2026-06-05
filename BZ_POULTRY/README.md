# BZ Farm - Poultry Farm Management System

A web-based poultry farm management system with role-based login for Admin and Manager users.

## Features

- **Dashboard** - Overview with KPIs, charts, stock alerts, and recent activities
- **Poultry Stock** - Manage flocks (layers, pullets, roosters)
- **Feed Inventory** - Track feed stock, consumption, and costs
- **Medicine & Vaccine** - Monitor medical supplies and expiry dates
- **Inventory** - Manage supplies and equipment
- **Egg Production** - Daily production records by building
- **Sales Management** - Sales transactions, customers, and analytics
- **Reports** - Generate farm reports
- **Settings** (Admin only) - User management and profile settings

## Requirements

- PHP 8.2+
- MySQL (XAMPP)
- Composer

## Setup

1. Make sure XAMPP Apache and MySQL are running
2. Database is already configured in `.env`:
   ```
   DB_DATABASE=bz_farm
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Run migrations and seed (if not done):
   ```
   php artisan migrate:fresh --seed
   ```
4. Access the app at:
   ```
   http://localhost/BZ_FARM/BZ_POULTRY/public
   ```

## Login Credentials

| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Manager | manager   | manager123  |

- **Admin** has full access including Settings (user management)
- **Manager** can access all operational modules

## Database

- Database name: `bz_farm`
- Schema reference: `database/bz_farm_schema.sql`
