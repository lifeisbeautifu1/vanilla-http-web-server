# Node.js Web Server с мониторингом, метриками и логированием

## 📋 Обзор

Этот проект — простой HTTP-сервер на Node.js с Express-like функциональностью, который предоставляет:
- REST API для управления продуктами
- Статический веб-сервер
- **Полноценное логирование** (Winston → файлы → Loki → Grafana)
- **Метрики приложения** (prom-client → Prometheus → Grafana)

## 🛠 Технологии мониторинга

### Prometheus
Система сбора и хранения метрик. Периодически опрашивает приложение (`/metrics` endpoint) и забирает метрики в формате time-series.

### Grafana
Платформа визуализации. Подключается к Prometheus и Loki, строит графики и дашборды.

### Loki
Система агрегации логов. Хранит логи с метаданными (labels), эффективна и легковесна.

### Promtail
Агент для сбора логов. Читает лог-файлы, добавляет labels и отправляет в Loki.

### Winston
Библиотека для структурированного логирования в Node.js.

### prom-client
Клиент Prometheus для Node.js, экспортирует метрики приложения.

## 🏗 Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                    Твоё приложение                          │
│  ┌─────────────┐         ┌─────────────┐                   │
│  │   Winston   │         │  prom-client │                   │
│  │   Logger    │         │   Metrics    │                   │
│  └──────┬──────┘         └──────┬───────┘                   │
│         │                       │                            │
│         ▼                       ▼                            │
│  📄 logs/app.log          /metrics endpoint                 │
│  (JSON формат)            (текст, Prometheus format)        │
└──────────┼──────────────────────┼───────────────────────────┘
           │                      │
           │                      │
           ▼                      ▼
    ┌─────────────┐        ┌─────────────┐
    │   Promtail  │        │  Prometheus │
    │   (агент)   │        │   (скрапер)  │
    └──────┬──────┘        └──────┬───────┘
           │                      │
           │ push                 │ scrape
           │ логи                 │ метрики
           ▼                      ▼
    ┌─────────────┐        ┌─────────────┐
    │    Loki     │        │  Prometheus │
    │ (хранилище  │        │ (хранилище  │
    │   логов)    │        │  метрик)    │
    └──────┬──────┘        └──────┬───────┘
           │                      │
           └──────────┬───────────┘
                      │
                      ▼
               ┌─────────────┐
               │   Grafana   │
               │ (дашборды)  │
               └─────────────┘
```

### Как это работает:

1. **Приложение** генерирует логи (Winston) и метрики (prom-client)
2. **Winston** пишет логи в консоль и файл `logs/app.log` в JSON формате
3. **prom-client** хранит метрики в памяти процесса и отдаёт их по `/metrics`
4. **Promtail** читает логи из файла и отправляет в Loki
5. **Prometheus** опрашивает `/metrics` каждые 15 секунд и сохраняет метрики
6. **Loki** хранит логи структурированно с labels для быстрого поиска
7. **Grafana** подключается к Prometheus (метрики) и Loki (логи), показывает дашборды

## 📊 Метрики

### Custom HTTP метрики:
- `http_requests_total` — общее количество запросов (labels: method, path, status)
- `http_request_duration_seconds` — время обработки запроса (гистограмма)
- `http_requests_in_progress` — текущие активные запросы

### Default Node.js метрики:
- `nodejs_heap_size_used_bytes` — используемая память heap
- `nodejs_heap_size_total_bytes` — общий размер heap
- `nodejs_active_handles_total` — активные handles
- `nodejs_active_requests_total` — активные запросы
- И многие другие (CPU, event loop, GC)

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск через Docker Compose (рекомендуется)

```bash
docker-compose up --build
```

Это запустит все сервисы:
- **app** (порт 5000) — твоё приложение
- **prometheus** (порт 9090) — сбор метрик
- **loki** (порт 3100) — хранение логов
- **promtail** — сбор логов
- **grafana** (порт 3000) — дашборды

### 3. Доступ к сервисам

| Сервис | URL | Логин/Пароль |
|--------|-----|--------------|
| Приложение | http://localhost:5000 | — |
| Метрики (Prometheus format) | http://localhost:5000/metrics | — |
| Prometheus UI | http://localhost:9090 | — |
| Grafana | http://localhost:3000 | admin/admin |
| Loki API | http://localhost:3100 | — |

## 📁 Структура проекта

```
├── src/
│   ├── index.ts              # Главный файл сервера
│   ├── utils/
│   │   ├── logger.ts         # Настройка Winston logger
│   │   └── metrics.ts        # Настройка prom-client метрик
│   ├── controllers/          # Контроллеры API
│   └── ...
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml    # Конфигурация Prometheus
│   ├── loki/
│   │   └── loki-config.yml   # Конфигурация Loki
│   ├── promtail/
│   │   └── promtail-config.yml # Конфигурация Promtail
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/  # Авто-подключение источников
│       │   └── dashboards/   # Авто-загрузка дашбордов
│       └── dashboards/       # JSON дашборды
├── logs/                     # Лог-файлы приложения
├── docker-compose.yml        # Оркестрация всех сервисов
└── Dockerfile
```

## 🔍 Использование

### Локальный запуск (без Docker)

```bash
npm run dev
```

Логи будут писаться в:
- Консоль (цветные)
- Файл `logs/app.log` (JSON формат)

### Проверка метрик

Открой http://localhost:5000/metrics — увидишь все метрики в формате Prometheus.

Пример:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/products",status="200"} 5
http_requests_total{method="POST",path="/api/products",status="201"} 2
```

### Grafana дашборды

После запуска `docker-compose up`:

1. Открой http://localhost:3000 (admin/admin)
2. Источники данных (Prometheus, Loki) подключены автоматически
3. Дашборд "Node.js App Metrics" загружен автоматически
4. Для просмотра логов:
   - Go to Explore → Выбери Loki → Query: `{job="node-app"}`

## 📈 Дашборд "Node.js App Metrics"

Включает панели:

1. **Requests per Second** — запросы в секунду по методам и путям
2. **Requests In Progress** — текущие активные запросы
3. **Request Duration (Percentiles)** — 50-й и 95-й перцентили времени ответа
4. **Request Rate by Path and Status** — график запросов по статусам
5. **Node.js Heap Size** — использование памяти
6. **Node.js Active Handles/Requests** — активные handles/requests

## 🔔 Алертинг (будущее расширение)

Grafana поддерживает алерты. Можно настроить:
- Alert при > 100 ошибок 5xx в минуту
- Alert при времени ответа > 1s (95-й перцентиль)
- Alert при использовании памяти > 500MB

## 🧪 Тестирование

Сделай несколько запросов к приложению:

```bash
# GET все продукты
curl http://localhost:5000/api/products

# GET один продукт
curl http://localhost:5000/api/products/1

# POST новый продукт
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 99.99}'

# Проверь метрики
curl http://localhost:5000/metrics

# Проверь логи
tail -f logs/app.log
```

## 🎯 PromQL примеры для Prometheus

```promql
# Запросы в секунду за последнюю минуту
rate(http_requests_total[1m])

# 95-й перцентиль времени ответа
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Ошибки 5xx
sum(rate(http_requests_total{status=~"5.."}[5m]))

# Использование памяти
nodejs_heap_size_used_bytes
```

## 📝 Log формат

Логи в JSON формате:

```json
{
  "level": "info",
  "message": "Incoming request",
  "timestamp": "2025-10-25 14:30:00",
  "method": "GET",
  "url": "/api/products",
  "path": "/api/products",
  "ip": "127.0.0.1"
}
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| PORT | 5000 | Порт приложения |
| LOG_LEVEL | info | Уровень логирования (error, warn, info, debug) |

### Prometheus scraping interval

В `monitoring/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s  # Как часто забирать метрики
```

## 🚀 Следующие шаги

1. **Алертинг**: Настроить правила алертов в Grafana
2. **Трейсинг**: Добавить OpenTelemetry для distributed tracing
3. **Уведомления**: Интегрировать Alertmanager для уведомлений (Slack, Email, Telegram)
4. **Retention**: Настроить хранение метрик и логов (сколько дней хранить)

## 📚 Ресурсы

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [prom-client GitHub](https://github.com/siimon/prom-client)
- [Winston GitHub](https://github.com/winstonjs/winston)
