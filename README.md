# MediTrack Healthcare System

MediTrack is a full-stack healthcare management system built with Django REST Framework, React, and PostgreSQL.

## Current Features

- Custom Django user model
- Email based authentication foundation
- Bangladesh phone number support
- JWT authentication setup
- OTP verification architecture
- Bangla and English language support planned
- Patient and appointment CRUD modules planned

## Tech Stack

### Backend
- Python
- Django
- Django REST Framework
- Simple JWT

### Frontend
- React
- JavaScript
- HTML
- CSS

### Database
- PostgreSQL

### Tools
- Git
- GitHub
- VS Code

## Project Structure

```text
MediTrack/
├── backend/
├── frontend/
├── .gitignore
└── README.md

### Backend Setup

cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

### Development Status

The project is currently under active development. Authentication, OTP verification, PostgreSQL integration, patient CRUD, appointment management, and the React frontend will be implemented progressively.