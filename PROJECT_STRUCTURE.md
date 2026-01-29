# 📁 โครงสร้างโปรเจกต์ BPI-MetaWork

## 🎯 ภาพรวม

โปรเจกต์นี้เป็น **Web Application** สำหรับจัดการงาน Packing และ Job Card โดยใช้ **React + TypeScript + Vite** พร้อม **Firebase** สำหรับ Authentication และ Database

---

## 📂 โครงสร้างไฟล์

```
BPI-MetaWork/
│
├── 📄 index.html                    # Entry point HTML
├── 📄 App.tsx                       # Main App Component (Root)
├── 📄 index.tsx                     # React DOM Render Entry
├── 📄 types.ts                      # Global TypeScript Types
├── 📄 utils.ts                      # Utility Functions
│
├── ⚙️ vite.config.ts                # Vite Configuration
├── ⚙️ tailwind.config.js            # Tailwind CSS Config
├── ⚙️ tsconfig.json                 # TypeScript Config
├── ⚙️ package.json                  # Dependencies & Scripts
├── ⚙️ vercel.json                   # Vercel Deployment Config
├── ⚙️ firestore.rules               # Firestore Security Rules
│
├── 📝 README.md                     # Project Documentation
├── 📝 DESIGN_PLAN.md                # Design Guidelines
├── 📝 FIREBASE_SETUP.md             # Firebase Setup Guide
├── 📝 implementation_plan.md        # Implementation Plan
├── 📝 app-config.md                 # App Configuration
├── 📝 date-format-guide.md          # Date Format Guide
│
├── 🔧 GoogleSheetScript.js          # Google Apps Script
├── 🔧 import-data.js                # Data Import Script
├── 🔧 batch-import.html             # Batch Import Tool
│
├── 📂 components/                   # ⚠️ Legacy Components (Root Level)
│   ├── Dashboard.tsx                # Dashboard Component
│   ├── DataInputForm.tsx            # Data Entry Form
│   ├── DataTable.tsx                # Data Table Display
│   ├── PackingReport.tsx            # Packing Report
│   ├── ShipmentDetailModal.tsx      # Shipment Details Modal
│   ├── StatsCard.tsx                # Statistics Card
│   ├── SuccessModal.tsx             # Success Modal
│   ├── LoadingModal.tsx             # Loading Modal
│   └── DataUploader.tsx             # Data Upload Component
│
├── 📂 src/                          # ✅ Main Source Directory
│   │
│   ├── 📄 index.css                 # Global CSS Styles
│   ├── 📄 vite-env.d.ts             # Vite Environment Types
│   │
│   ├── 📂 pages/                    # 🌐 Page Components
│   │   ├── LoginPage.tsx            # Login Page
│   │   ├── HomePage.tsx             # Home/Landing Page
│   │   ├── DashboardPage.tsx        # Dashboard Page
│   │   ├── KanbanBoardPage.tsx      # Kanban Board Page
│   │   ├── ActivityReportPage.tsx   # Activity Report Page
│   │   ├── UserProfilePage.tsx      # User Profile Page
│   │   ├── AdminProfilePage.tsx     # Admin Profile Page
│   │   └── PendingPage.tsx          # Pending Approval Page
│   │
│   ├── 📂 components/               # 🧩 Reusable Components
│   │   │
│   │   ├── 📂 Landing/              # Landing Page Components
│   │   │   ├── HomeHero.tsx         # Hero Section
│   │   │   ├── Features.tsx         # Features Section
│   │   │   ├── StatsShowcase.tsx    # Statistics Showcase
│   │   │   ├── DashboardPreview.tsx # Dashboard Preview
│   │   │   ├── HomeFooter.tsx       # Home Footer
│   │   │   ├── PendingHero.tsx      # Pending Page Hero
│   │   │   └── PendingFooter.tsx    # Pending Page Footer
│   │   │
│   │   ├── 📂 board/                # Kanban Board Components
│   │   │   ├── KanbanBoard.tsx      # Main Kanban Board
│   │   │   ├── KanbanColumn.tsx     # Kanban Column
│   │   │   ├── JobCardItem.tsx      # Job Card Item
│   │   │   ├── NewJobCardForm.tsx   # Create Job Card Form
│   │   │   ├── EditJobCardForm.tsx  # Edit Job Card Form
│   │   │   ├── JobCardDetailModal.tsx # Job Card Details Modal
│   │   │   └── GanttView.tsx        # Gantt Chart View
│   │   │
│   │   ├── 📂 common/               # Common Shared Components
│   │   │   ├── ConfirmDialog.tsx    # Confirmation Dialog
│   │   │   └── SuccessAnimation.tsx # Success Animation
│   │   │
│   │   ├── UnifiedNavbar.tsx        # Navigation Bar
│   │   ├── UnifiedLoading.tsx       # Loading Component
│   │   ├── ProtectedRoute.tsx       # Route Protection
│   │   └── FirebaseTest.tsx         # Firebase Test Component
│   │
│   ├── 📂 contexts/                 # 🔐 React Contexts
│   │   └── AuthContext.tsx          # Authentication Context
│   │
│   ├── 📂 services/                 # 🔌 API & Services
│   │   ├── firebaseService.ts       # Firebase Service
│   │   ├── jobCardService.ts        # Job Card Service
│   │   └── api.ts                   # API Service
│   │
│   ├── 📂 config/                   # ⚙️ Configuration Files
│   │   ├── firebase.ts              # Firebase Configuration
│   │   └── dateConfig.ts            # Date Configuration
│   │
│   └── 📂 types/                    # 📝 TypeScript Type Definitions
│
├── 📂 public/                       # 🖼️ Static Assets
│   └── concept 2.1.png              # Concept Design Image
│
├── 📂 dist/                         # 🏗️ Build Output (Generated)
└── 📂 node_modules/                 # 📦 Dependencies (Generated)
```

---

## 🔍 คำอธิบายโครงสร้าง

### 📌 Root Level Files

| ไฟล์        | คำอธิบาย                                    |
| ----------- | ------------------------------------------- |
| `App.tsx`   | Component หลักของแอปพลิเคชัน จัดการ Routing |
| `index.tsx` | Entry point สำหรับ React DOM                |
| `types.ts`  | Type definitions ที่ใช้ทั่วทั้งโปรเจกต์     |
| `utils.ts`  | Utility functions ที่ใช้ร่วมกัน             |

### 📂 `src/pages/`

เก็บ **Page Components** ทั้งหมด แต่ละไฟล์คือหน้าเว็บหนึ่งหน้า:

- **LoginPage**: หน้า Login
- **HomePage**: หน้าแรก (Landing)
- **DashboardPage**: Dashboard แสดงสถิติ
- **KanbanBoardPage**: Kanban Board สำหรับจัดการงาน
- **ActivityReportPage**: รายงานกิจกรรม
- **UserProfilePage**: โปรไฟล์ผู้ใช้
- **AdminProfilePage**: โปรไฟล์ Admin
- **PendingPage**: หน้ารออนุมัติ

### 📂 `src/components/`

เก็บ **Reusable Components** แบ่งเป็น 3 กลุ่ม:

#### 1. **Landing/** - Components สำหรับหน้า Landing

- Hero sections, Features, Stats, Preview

#### 2. **board/** - Components สำหรับ Kanban Board

- Kanban Board, Columns, Cards, Forms, Modals

#### 3. **common/** - Components ที่ใช้ร่วมกันทั่วทั้งแอป

- Dialogs, Animations

### 📂 `src/services/`

เก็บ **Business Logic** และการเชื่อมต่อ Backend:

- `firebaseService.ts` - จัดการ Firebase operations
- `jobCardService.ts` - จัดการ Job Card CRUD
- `api.ts` - API calls อื่นๆ

### 📂 `src/contexts/`

เก็บ **React Context** สำหรับ State Management:

- `AuthContext.tsx` - จัดการ Authentication state

### 📂 `src/config/`

เก็บ **Configuration Files**:

- `firebase.ts` - Firebase config
- `dateConfig.ts` - Date format config

---

## ⚠️ ปัญหาที่พบ

### 🔴 1. **โครงสร้างไฟล์ซ้ำซ้อน (Duplicate Structure)**

```
❌ ปัญหา:
/components/          ← Legacy components (Root level)
/src/components/      ← New components (Inside src)
```

**ผลกระทบ:**

- สับสน ไม่รู้ว่าควรใช้ไฟล์ไหน
- Maintenance ยาก
- Import paths ไม่สม่ำเสมอ

### 🔴 2. **Entry Files อยู่นอก `src/`**

```
❌ ปัญหา:
/App.tsx              ← ควรอยู่ใน src/
/index.tsx            ← ควรอยู่ใน src/
/types.ts             ← ควรอยู่ใน src/types/
/utils.ts             ← ควรอยู่ใน src/utils/
```

**ผลกระทบ:**

- ไม่เป็นไปตามมาตรฐาน Vite/React
- Import paths ยุ่งยาก

---

## ✅ คำแนะนำการปรับปรุง

### 📋 แผนการ Refactor

#### **Phase 1: รวม Components**

```bash
# ย้าย Legacy components เข้า src/components/legacy/
mv components/* src/components/legacy/

# หรือ Merge เข้ากับ components ใหม่
# (ต้องตรวจสอบว่าไฟล์ไหนยังใช้งานอยู่)
```

#### **Phase 2: ย้าย Entry Files**

```bash
# ย้าย App.tsx และ index.tsx เข้า src/
mv App.tsx src/
mv index.tsx src/

# ย้าย types และ utils
mv types.ts src/types/index.ts
mv utils.ts src/utils/index.ts
```

#### **Phase 3: อัพเดท Import Paths**

```typescript
// Before
import { SomeType } from "../types";
import { someUtil } from "../utils";

// After
import { SomeType } from "@/types";
import { someUtil } from "@/utils";
```

#### **Phase 4: ตั้งค่า Path Alias**

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
});
```

---

## 🎯 โครงสร้างที่แนะนำ (Recommended Structure)

```
BPI-MetaWork/
│
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
│
├── 📂 src/
│   ├── main.tsx                     # ✅ Entry point (เปลี่ยนชื่อจาก index.tsx)
│   ├── App.tsx                      # ✅ Main App
│   ├── index.css
│   │
│   ├── 📂 pages/                    # Pages
│   ├── 📂 components/               # Components
│   ├── 📂 contexts/                 # Contexts
│   ├── 📂 services/                 # Services
│   ├── 📂 config/                   # Config
│   ├── 📂 types/                    # Types
│   │   └── index.ts                 # ✅ ย้ายจาก /types.ts
│   ├── 📂 utils/                    # Utils
│   │   └── index.ts                 # ✅ ย้ายจาก /utils.ts
│   └── 📂 hooks/                    # ✅ Custom Hooks (ถ้ามี)
│
├── 📂 public/                       # Static assets
├── 📂 scripts/                      # ✅ ย้าย scripts มาไว้ที่นี่
│   ├── GoogleSheetScript.js
│   ├── import-data.js
│   └── batch-import.html
│
└── 📂 docs/                         # ✅ ย้าย documentation
    ├── README.md
    ├── DESIGN_PLAN.md
    ├── FIREBASE_SETUP.md
    └── implementation_plan.md
```

---

## 🚀 ขั้นตอนการ Refactor (Step-by-Step)

### ✅ **Step 1: Backup**

```bash
git add .
git commit -m "Backup before refactoring"
```

### ✅ **Step 2: สร้างโฟลเดอร์ใหม่**

```bash
mkdir -p src/utils src/hooks scripts docs
```

### ✅ **Step 3: ย้ายไฟล์**

```bash
# ย้าย Entry files
mv App.tsx src/
mv index.tsx src/main.tsx

# ย้าย Types & Utils
mv types.ts src/types/index.ts
mv utils.ts src/utils/index.ts

# ย้าย Scripts
mv GoogleSheetScript.js scripts/
mv import-data.js scripts/
mv batch-import.html scripts/

# ย้าย Docs
mv *.md docs/
```

### ✅ **Step 4: อัพเดท `index.html`**

```html
<!-- Before -->
<script type="module" src="/index.tsx"></script>

<!-- After -->
<script type="module" src="/src/main.tsx"></script>
```

### ✅ **Step 5: อัพเดท Import Paths**

ใช้ Find & Replace ใน VS Code:

- `from '../types'` → `from '@/types'`
- `from '../utils'` → `from '@/utils'`
- `from '../components'` → `from '@/components'`

### ✅ **Step 6: ทดสอบ**

```bash
npm run dev
```

### ✅ **Step 7: ลบโฟลเดอร์เก่า**

```bash
# ตรวจสอบว่าไม่มีไฟล์ใช้งานแล้ว
rm -rf components/  # Legacy components
```

---

## 📊 สรุป

| หัวข้อ      | สถานะปัจจุบัน           | ควรเป็น                       |
| ----------- | ----------------------- | ----------------------------- |
| Entry Files | อยู่ที่ Root            | ใน `src/`                     |
| Components  | 2 โฟลเดอร์ (Root + src) | เฉพาะ `src/components/`       |
| Types/Utils | อยู่ที่ Root            | ใน `src/types/`, `src/utils/` |
| Scripts     | อยู่ที่ Root            | ใน `scripts/`                 |
| Docs        | อยู่ที่ Root            | ใน `docs/`                    |

---

## 💡 Best Practices

1. **ใช้ Path Alias** - ทำให้ import สะดวก
2. **แยก Business Logic** - ไว้ใน `services/`
3. **แยก UI Components** - ไว้ใน `components/`
4. **ใช้ TypeScript** - สำหรับ type safety
5. **เขียน Documentation** - อธิบายโค้ดให้ชัดเจน

---

## 🔗 Resources

- [Vite Guide](https://vitejs.dev/guide/)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**สร้างเมื่อ:** 2026-01-29  
**เวอร์ชัน:** 1.0  
**ผู้จัดทำ:** Antigravity AI
