# BZ FARM - Poultry Management System

## Project Members
- Abdulla
- Tundag
- Lasola
- Familara
- Alcoran
- Rivera

---

## Demo Accounts

### Admin Account
**Username:** admin  
**Password:** admin123

### Manager Account
**Username:** manager  
**Password:** manager123

---

## Installation Guide

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BZ_FARM
```

---

### 2. Backend Setup (Laravel)

Open **PowerShell** and run:

```bash
composer install
cp .env.example .env
```

Edit the `.env` file:

```env
DB_CONNECTION=mysql
DB_DATABASE=bz_farm
```

Then run:

```bash
php artisan migrate
php artisan key:generate
php artisan db:seed
```

---

### 3. Frontend Setup (React/Vite)

Open **Command Prompt (CMD)** and run:

```bash
npm install
npm run build
```

### When should I run `npm run build`?

Run it whenever you make changes to React/Vite frontend files and want the latest changes to be reflected in the Laravel application.

For development, you can use:

```bash
npm run dev
```

This automatically updates the frontend whenever you save changes.

---

## Running the Application

Start the Laravel server:

```bash
php artisan serve
```

Visit:

```
http://127.0.0.1:8000
```

---

## Database

Create a MySQL database named:

```sql
bz_farm
```

before running migrations.

---

## Technologies Used

- Laravel
- React
- Vite
- MySQL
- Bootstrap

---

## Notes

- Make sure Apache and MySQL are running if using XAMPP.
- Run `php artisan migrate:fresh --seed` if you need to reset the database and reseed data.
- Run `npm run build` after frontend changes for production deployment.
