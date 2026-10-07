# Fullstack Demo: React + Python (FastAPI)

Стартовый проект для фулл-стек разработки:
- **Backend**: Python + FastAPI (порт 8000)
- **Frontend**: React + Vite (порт 5173), JS-инструменты работают на Node.js
- **VS Code**: готовые настройки запуска и отладки обеих частей сразу

## Базовая Структура

```
fullstack-project/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py            # POST /api/auth/login
│   │   │   ├── employee.py        # эндпоинты для вкладок сотрудника
│   │   │   └── admin.py           # эндпоинты для вкладок админа
│   │   ├── database.py            # подключение к MySQL (SQLAlchemy)
│   │   ├── models.py              # ORM-модели 
│   │   ├── schemas.py             # Pydantic-схемы запросов/ответов
│   │   └── auth.py                # проверка пароля
│   ├── main.py                    # точка входа FastAPI
│   ├── requirements.txt
│   ├── .env                       # настройки 
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── admin/              # SizTab, RequestsTab, AddSizTab, ControlTab, AdminPage
│   │   │   └── employee/           # SizTab, RequestsTab, NotificationsTab, EmployeePage
│   │   ├── components/
│   │   │   └── TabsBar.jsx
│   │   ├── api.js                 
│   │   ├── App.jsx                
│   │   ├── main.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js             # api → backend:8000
└── .vscode/
    ├── settings.json
    ├── launch.json                
    ├── tasks.json
    └── extensions.json
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

### 3. Запуск из VS Code одной кнопкой

- Открой проект в VS Code (`code .` в корне `fullstack-project`)
- Нажми **F5** и выбери конфигурацию **"Fullstack: Backend + Frontend (Chrome)"** — запустится backend и откроется Chrome с фронтендом под отладчиком
- Либо через палитру команд: `Run Task` → **"Fullstack: run all"**


