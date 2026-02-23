# 📊 BudgetOS — Dashboard de Presupuesto Quincenal

Dashboard financiero personal conectado a **Google Sheets**, con seguimiento quincenal acumulable anualmente.

---

## 📁 Estructura de tu Google Sheet

### Pestaña 1: `Presupuesto`

> Un registro por cada categoría de gasto en cada quincena.
> Las quincenas van de **Q1** (Ene 1-15) a **Q24** (Dic 16-31).

| Quincena | Año  | Categoria   | Presupuesto (USD) |
|----------|------|-------------|-------------------|
| Q1       | 2025 | Mercado     | 180               |
| Q1       | 2025 | Transporte  | 60                |
| Q1       | 2025 | Educación   | 120               |
| Q2       | 2025 | Mercado     | 180               |
| Q2       | 2025 | Transporte  | 60                |
| ...      | ...  | ...         | ...               |
| Q24      | 2025 | Mercado     | 180               |

**Mapa de quincenas:**
- Q1 = Ene 1-15 · Q2 = Ene 16-31
- Q3 = Feb 1-15 · Q4 = Feb 16-28
- Q5 = Mar 1-15 · Q6 = Mar 16-31
- *(continúa hasta Q24 = Dic 16-31)*

---

### Pestaña 2: `Gastos`

> Un registro por cada gasto. Estos son los **campos exactos** de tu hoja:

| Fecha del Gasto | Establecimiento | Monto (USD) | Categoria del Gasto | Necesidad    | Quincena | Descripcion o Detalles Adicionales      |
|-----------------|-----------------|-------------|---------------------|--------------|----------|-----------------------------------------|
| 2025-01-03      | Super Xtra      | 45.50       | Mercado             | Necesario    | Q1       | Compras de la semana - frutas, lácteos  |
| 2025-01-08      | Terpel          | 30.00       | Transporte          | Necesario    | Q1       | Gasolina para la semana                 |
| 2025-01-12      | Escuela ABC     | 120.00      | Educación           | Necesario    | Q1       | Mensualidad enero - hijo                |

**Valores válidos para `Necesidad`:**
| Valor          | Significado                              |
|----------------|------------------------------------------|
| `Necesario`    | Gasto esencial, no se puede evitar       |
| `Importante`   | Relevante pero podría diferirse          |
| `Moderado`     | Conveniente pero prescindible            |
| `Prescindible` | Capricho / lujo / gasto evitable         |

> 💡 **Tip:** La columna `Quincena` puede llenarse manualmente (Q1, Q2…) o el sistema la calcula automáticamente desde la fecha.

---

## 📊 Vistas del Dashboard

| Sección | Descripción |
|---------|-------------|
| **Resumen Anual** | KPIs: presupuesto total, gasto, saldo, gastos prescindibles |
| **Quincena Actual** | Estado detallado de la quincena en curso + gauge de ejecución |
| **Timeline Quincenal** | Barras comparativas Q1-Q24 + vista acumulada anual |
| **Análisis de Necesidad** | Donut/barras por nivel de necesidad del gasto |
| **Top Establecimientos** | Ranking de dónde más se gasta |
| **Detalle por Categoría** | Tabla expandible con ejecución y trazabilidad completa |
| **Trazabilidad** | Tabla filtrable con todos los gastos: establecimiento, necesidad, descripción |

---

## ⚙️ Setup

### 1. Google Cloud API Key
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea proyecto → Habilita **Google Sheets API**
3. Credenciales → Crear **Clave de API**
4. Restringe la key a Google Sheets API y tu dominio

### 2. Compartir tu Sheet
1. Abre tu Google Sheet
2. Compartir → **"Cualquier persona con el enlace puede ver"**
3. Copia el ID de la URL: `docs.google.com/spreadsheets/d/[ID]/edit`

### 3. Instalación local
```bash
git clone https://github.com/tu-usuario/budget-dashboard.git
cd budget-dashboard
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm start
```

### 4. Deploy en Netlify
1. Sube a GitHub → Conecta en [netlify.com](https://netlify.com)
2. Netlify detecta `netlify.toml` automáticamente
3. **Site settings → Environment variables:**
   - `REACT_APP_GOOGLE_API_KEY`
   - `REACT_APP_SPREADSHEET_ID`
   - `REACT_APP_SHEET_PRESUPUESTO` = `Presupuesto`
   - `REACT_APP_SHEET_GASTOS` = `Gastos`
4. Deploy → ¡Listo!

---

## 🔄 Flujo de trabajo quincenal

1. **Al iniciar cada quincena:** Agrega una fila en `Presupuesto` para cada categoría (Q1, Q2, etc.)
2. **Durante la quincena:** Registra cada gasto en `Gastos` con todos sus campos
3. **El dashboard se actualiza automáticamente** cada 5 minutos y acumula todo el año

---

## 🛠 Stack
React 18 · Recharts · Lucide Icons · Google Sheets API v4 · Netlify
Tipografía: Syne + Outfit + JetBrains Mono
