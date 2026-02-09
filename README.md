# GSS

PHP (XAMPP) web application for background verification / case management.

## Requirements

- PHP (via XAMPP)
- MySQL / MariaDB
- Web server (Apache via XAMPP)

## Local Setup (XAMPP)

1. Copy this project into:

   `C:\xampp\htdocs\GSS1`

2. Start services in XAMPP:

- Apache
- MySQL

3. Configure environment

- Create a local `.env` file (not committed)
- Update `APP_BASE_URL` / `APP_BASE_PATH` as per your machine

4. Database

- Import required schema / stored procedures as per your DB setup.

5. Open in browser

- `http://localhost/GSS1/`

## Security / Git Notes

This repository intentionally ignores sensitive files:

- `.env`
- `config/db_config.txt`
- `db_sp/`

Do **not** commit credentials or production connection details.

## Common Git Commands

```bash
git status
git add .
git commit -m "message"
git push
```

## Project Structure (high level)

- `api/` API endpoints
- `modules/` UI modules (role-based)
- `includes/` shared PHP includes (layout/auth/etc.)
- `assets/` static assets (css/js/img/fonts)
- `vendor/` composer dependencies
