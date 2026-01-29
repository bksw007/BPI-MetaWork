# Application Configuration

## 📅 Date Format Configuration

### Standard Format: dd-mm-yyyy

**Configuration Location**: `src/config/dateConfig.ts`

### Settings:

- **Format**: `dd-mm-yyyy` (คงที่ทั้งระบบ)
- **Validation**: Regex `/^(\d{2})-(\d{2})-(\d{4})$/`
- **Storage**: Firebase เก็บแบบ dd-mm-yyyy
- **Display**: UI แสดง dd-mm-yyyy
- **Import**: CSV รับ dd-mm-yyyy

### Examples:

- ✅ Valid: `21-01-2024`, `15-12-2023`, `01-03-2024`
- ❌ Invalid: `2024-01-21`, `21/01/2024`, `21-1-2024`

## 🔥 Firebase Configuration

**Environment Variables** (`.env.local`):

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=packing-report-cursor.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=packing-report-cursor
VITE_FIREBASE_STORAGE_BUCKET=packing-report-cursor.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=647670800448
VITE_FIREBASE_APP_ID=1:647670800448:web:a6cf825def4d2ec7c07fa5
VITE_GOOGLE_SCRIPT_URL=YOUR_SCRIPT_URL
```

**Collection**: `packingRecords`

**Security Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /packingRecords/{documentId} {
      allow read, write: if true; // Development mode
    }
  }
}
```

## 📊 Data Structure

### Firestore Document:

```typescript
{
  date: string,           // dd-mm-yyyy
  shipment: string,
  mode: string,
  product: string,
  siQty: number,
  qty: number,
  packages: {
    [key: string]: number  // Normalized package types
  },
  remark: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Package Columns:

```typescript
[
  "110x110x115 QTY",
  "110x110x90 QTY",
  "110x110x65 QTY",
  "80X120X115 QTY",
  "80X120X90 QTY",
  "80X120X65 QTY",
  "42X46X68 QTY",
  "47X66X68 QTY",
  "53X53X58 QTY",
  "57X64X84 QTY",
  "68X74X86 QTY",
  "70X100X90 QTY",
  "27X27X22 QTY",
  "53X53X19 QTY",
  "WARP QTY",
  "UNIT QTY",
  "RETURNABLE QTY",
];
```

## 🎨 UI Theme

### Color Palette (Pastel Luxury):

- **Soft Lavender**: `#E8D5FF` - Primary
- **Peach Blush**: `#FFE5D9` - Secondary
- **Mint Cream**: `#E0F7E9` - Success
- **Powder Blue**: `#D4E8F5` - Data/Analytics
- **Rose Quartz**: `#F5E6E8` - CTA

## 🛠️ Development Tools

### Batch Import:

- **File**: `batch-import.html`
- **URL**: `http://localhost:3000/batch-import.html`
- **Format**: CSV with dd-mm-yyyy dates

### Firebase Test:

- **File**: `src/components/FirebaseTest.tsx`
- **Route**: `/test`
- **Purpose**: Connection testing

## 📝 File Structure

```
src/
├── config/
│   ├── firebase.ts      # Firebase configuration
│   └── dateConfig.ts    # Date format configuration
├── services/
│   └── firebaseService.ts # Firebase operations
├── components/
│   ├── FirebaseTest.tsx  # Connection test
│   ├── Dashboard.tsx     # Dashboard view
│   ├── DataTable.tsx     # Data table
│   └── DataInputForm.tsx # Data entry
└── pages/
    ├── LandingPage.tsx   # Landing page
    └── DashboardPage.tsx # Main dashboard
```

## 🚀 Quick Start

1. **Install dependencies**: `npm install`
2. **Set up Firebase**: Configure `.env.local`
3. **Run development**: `npm run dev`
4. **Access app**: `http://localhost:3000`
5. **Import data**: `http://localhost:3000/batch-import.html`
6. **Test connection**: `http://localhost:3000/test`

## ✅ Status

- ✅ Date format: dd-mm-yyyy (consistent)
- ✅ Firebase connection: Configured
- ✅ Real-time sync: Enabled
- ✅ Batch import: Ready
- ✅ UI theme: Pastel luxury
- ✅ Security rules: Development mode
