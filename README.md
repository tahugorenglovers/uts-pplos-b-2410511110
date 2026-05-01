# uts-pplos-b-2410511110
UTS SE Semester 4
Nama: ALDIN AIMAR MASSAD
NIM: 2410511110
URL Repository: https://github.com/tahugorenglovers/uts-pplos-b-2410511110
Link video demo: https://youtu.be/dfkHaQ313lE

# Sistem pemesanan tiket event

## Overview
Aplikasi ini menggunakan microservice based pemesanan tiket yang mengimplementasi Autetntikasi, event browsing, pembelian ticket,
E Ticket memakai QR Code, dan Validasi tiket

Aplikasi ini menggunakan API Gateway pattern untuk route request ke service masing-masing.

---

## Architecture

Sistem ini terdiri dari:

- **API Gateway (Node.js - Express)**
  Menghandle routing sebagai entry point tunggal.
- **Auth Service (Node.js + MongoDB)**  
  Menghandle:
  - JWT Authentication
  - Google OAuth Login
  - User management

- **Event Service (Laravel PHP + MySQL)**  
  Menghandle:
  - Data untuk event
  - Tipe/kategori tiket (VIP, Regular, dll.)

- **Order Service (Node.js + MongoDB)**  
  Menghandle:
  - Pembelian tiket/checkout
  - Generasi QR Code
  - Validasi Tiket

---

## System Flow

### 1. Autentikasi JWT Token
Client → Gateway → Auth Service → MongoDB  
→ Returns JWT token

### 2. Browse Events Memakai Laravel
Client → Gateway → Event Service Laravel → MySQL

### 3. Checkout with QR ticket
Client → Gateway → Order Service  
→ Order Service calls Event Service  
→ Calculates total price  
→ Generates QR ticket  
→ Stores in MongoDB

### 4. Validasi Tiket
Client scans QR → Gateway → Order Service  
→ Validate ticket → mark as used

---

## Features

- JWT Authentication
- Google OAuth Login
- User auto-registration via OAuth
- Event listing & detail
- Ticket category selection
- Checkout system
- QR Code e-ticket generation
- Ticket validation (1-time use)

---

## Feature
- **QR Code feature**
  - Dibuat saat checkout Generated during checkout
  - Memiliki ticket code yang unique
  - Bisa di scan memakai HP
  - Dipakai untuk validasi ticket

- **OAuth**
  - User bisa login memakai google
  - Jika user belum dibuat
    - Dibuat secara otomatis
    - oauth_provider = google
  - Akan menyimpan:
    - Nama
    - Email
    - Foto profil

---

## Tech Stack

| Service        | Technology           |
|----------------|----------------------|
| Gateway        | Node.js (Express)    |
| Auth Service   | Node.js + MongoDB    |
| Event Service  | Laravel PHP + MySQL  |
| Order Service  | Node.js + MongoDB    |
| Auth           | JWT + Google OAuth   |
| QR Code        | qrcode (npm)         |

## Setup Environment Variables

Setiap service memakai file .env masing-masing, dimana

- **Gateway**
PORT=3000
AUTH_SERVICE=http://localhost:3001
EVENT_SERVICE=http://localhost:8000
ORDER_SERVICE=http://localhost:3002

- **Auth Service**
PORT=3001
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret

GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

- **Event Service**
(Taro di .env laravel)
DB_DATABASE=event_service
DB_USERNAME=root
DB_PASSWORD=

- **Order Service**
PORT=3002
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
EVENT_SERVICE_URL=http://localhost:8000/api

## API Endpoints

- **Auth Service**
POST /auth/register
POST /auth/login
GET /auth/profile
GET /auth/google

- **Event Service**
GET /events

- **Order Service**
POST /orders → checkout
GET /orders → user orders
POST /orders/validate-ticket → validate QR