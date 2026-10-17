# Система учета СИЗ сотрудников: React + Python (FastAPI)


## Запуск в Docker

Весь проект поднимается одной командой: `docker compose up --build`. 


## Архитектура backend 

```
HTTP-запрос
   │
   ▼
routers/       
   │             
   ▼
services/       
   │             
   ▼
repositories/   
   │
   ▼
models.py → MySQL
```


## Структура проекта

```
fullstack-project/
├── backend/
│   ├── app/
│   │   ├── routers/                 
│   │   │   ├── auth.py              
│   │   │   ├── employee.py          
│   │   │   ├── admin_catalog.py     
│   │   │   ├── admin_inventory.py   
│   │   │   ├── admin_requests.py    
│   │   │   └── admin_control.py     
│   │   ├── services/                
│   │   ├── repositories/           
│   │   ├── dto/                     
│   │   ├── models.py                
│   │   ├── mappers.py              
│   │   ├── unit_of_work.py         
│   │   ├── dependencies.py         
│   │   ├── security.py             
│   │   ├── set_password.py          
│   │   ├── exceptions.py            
│   │   ├── error_handlers.py        
│   │   ├── cleanup.py               
│   │   ├── init_db.py               
│   │   └── database.py              
│   ├── main.py                     
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env                         
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── admin/               # SizTab, RequestsTab, AddSizTab, ControlTab, AdminPage
│   │   │   └── employee/            # SizTab, RequestsTab, NotificationsTab, EmployeePage
│   │   ├── components/              # TabsBar, AppHeader, Modal, Toast, ui, Icons
│   │   ├── api.js, utils.js, App.jsx, main.jsx, App.css, index.css
│   ├── index.html, package.json
│   ├── Dockerfile, nginx.conf
│   └── vite.config.js               # api -> backend:8000
├── mobile/                          
├── docker-compose.yml               
├── .env.example                     
└── DOCKER.md                                                 

```

### 1. Backend (Python)

```bash
cd backend
#python -m venv .venv
.venv\Scripts\activate
#pip install -r requirements.txt
#copy .env.example .env
uvicorn main:app --reload --port 8000
```

Backend будет доступен на `http://localhost:8000`

### 2. Frontend (React)

**новый терминал**:

```bash
cd frontend
#npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

База данных:
<img width="1125" height="806" alt="изображение" src="https://github.com/user-attachments/assets/02ae3e0a-7015-4b85-8b7f-ecf8db9bc3ee" />



