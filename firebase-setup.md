# Firebase Setup Guide

## 1. สร้าง Collection packingRecords

ใน Firebase Console:
1. เข้าไปที่ Firestore Database
2. คลิก "Start collection"
3. ตั้งชื่อ collection: `packingRecords`
4. คลิก "Next" แล้ว "Save"

## 2. ตั้งค่า Security Rules

ไปที่ Firestore Database > Rules และใช้ rules ต่อไปนี้:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตให้อ่านและเขียนข้อมูลใน collection packingRecords
    match /packingRecords/{documentId} {
      allow read, write: if request.auth != null; // ต้อง login ก่อน
      // หรือถ้าต้องการให้ใช้งานได้เลย (ไม่ปลอดภัยสำหรับ production)
      // allow read, write: if true;
    }
  }
}
```

## 3. ทดสอบการเชื่อมต่อ

สร้าง test component เพื่อทดสอบ:

```typescript
// src/components/FirebaseTest.tsx
import { useEffect, useState } from 'react';
import { getPackingRecords } from '../services/firebaseService';

export default function FirebaseTest() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const data = await getPackingRecords();
        setRecords(data);
        console.log('Firebase connected successfully!', data);
      } catch (err) {
        setError('Failed to connect to Firebase');
        console.error('Firebase error:', err);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4">
      <h2>Firebase Connection Test</h2>
      {loading && <p>Testing connection...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <p>Records found: {records.length}</p>
    </div>
  );
}
```

## 4. ตรวจสอบ Environment Variables

ตรวจสอบว่า `.env.local` มีค่าที่ถูกต้อง:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 5. เริ่มต้น Development Server

```bash
npm run dev
```

แล้วเปิด http://localhost:3000 เพื่อทดสอบ
