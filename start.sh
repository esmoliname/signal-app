#!/usr/bin/env bash
set -e

echo "=== Signal - 30-Day Intelligence Hub Auto-Start ==="

# 1. Setup Backend Environment
echo "[1/4] Configurando Backend (Python FastAPI)..."
cd backend

if [ ! -f ".env" ]; then
    echo "  -> Creando .env desde plantilla .env.example..."
    cp .env.example .env
fi

if [ ! -d "venv" ]; then
    echo "  -> Creando entorno virtual venv..."
    python3 -m venv venv
fi

echo "  -> Activando venv e instalando dependencias..."
source venv/bin/activate
pip install -q -r requirements.txt

# Iniciar servidor Backend en segundo plano
echo "[2/4] Iniciando servidor Backend en http://localhost:8000..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 2. Setup Frontend Environment
echo "[3/4] Configurando Frontend (Vue 3 + Vite)..."
cd frontend

if [ ! -f ".env" ]; then
    echo "  -> Creando .env desde plantilla .env.example..."
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "  -> Instalando paquetes npm..."
    npm install
fi

echo "[4/4] Iniciando servidor Frontend Vite en http://localhost:5173..."
npm run dev -- --host &
FRONTEND_PID=$!

trap "echo 'Deteniendo servicios...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT TERM EXIT

echo ""
echo "🚀 ¡Signal - 30-Day Intelligence Hub se está ejecutando!"
echo "   - Frontend UI: http://localhost:5173"
echo "   - Backend API: http://localhost:8000"
echo "   - Swagger Docs: http://localhost:8000/docs"
echo "Presiona Ctrl+C para detener."

wait
