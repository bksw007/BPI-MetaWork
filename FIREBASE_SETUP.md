# วิธีการตั้งค่า Firebase Authentication

เนื่องจากคุณแจ้งว่ายังไม่ได้สร้าง Firebase Auth ต่อไปนี้คือขั้นตอนการสร้างและตั้งค่าครับ:

## 1. สร้างโปรเจกต์ Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก **"Add project"** (หรือ "Create a project")
3. ตั้งชื่อโปรเจกต์ (เช่น `BPI-MetaWork`) แล้วคลิก **Continue**
4. เรื่อง Google Analytics: จะเปิดหรือปิดก็ได้ (แนะนำให้เปิดไว้เพื่อดู Analytics ภายหลัง) แล้วคลิก **Create project**
5. รอจนเสร็จ แล้วคลิก **Continue**

## 2. สร้าง Web App และรับค่า Config

1. ในหน้าหลักของโปรเจกต์ คลิกที่ไอคอน **Web (</>)** (วงกลมที่มี `</>`)
2. ช่อง **App nickname**: ใส่ชื่อแอป (เช่น `BPI Web`)
3. **ไม่ต้อง** ติ๊ก "Also set up Firebase Hosting" (เราทำทีหลังได้)
4. คลิก **Register app**
5. คุณจะเห็นโค้ด `firebaseConfig` ให้ดูเฉพาะส่วนที่เป็นค่าต่าง ๆ:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```
6. **ยังไม่ต้องก๊อปปี้ไปวางในโค้ดโดยตรง** แต่ให้เตรียมค่าเหล่านี้ไปใส่ในไฟล์ `.env.local`

## 3. เปิดใช้งาน Authentication

1. ที่เมนูซ้ายมือ เลือก **Build** -> **Authentication**
2. คลิก **Get started**
3. เลือกแท็บ **Sign-in method**
4. **Email/Password**:
   - คลิกที่ **Email/Password**
   - กดเปิดสวิตช์ **Enable** อันแรก (Email/Password)
   - (ไม่ต้องเปิด Email link)
   - คลิก **Save**
5. **Google** (ถ้าต้องการใช้ Google Login):
   - คลิก **Add new provider** -> **Google**
   - กดเปิดสวิตช์ **Enable**
   - ตั้งชื่อโปรเจกต์บราวน์เซอร์ (Project public-facing name)
   - เลือก **Project support email** (อีเมลของคุณ)
   - คลิก **Save**

6. **เพิ่ม Authorized Domains (สำคัญสำหรับ Error: unauthorized-domain)**
   - ในหน้า **Authentication** -> **Settings**
   - คลิกแท็บ **Authorized domains**
   - คลิก **Add domain**
   - พิมพ์ `localhost` แล้วกด Add (ปกติจะมีให้อยู่แล้ว แต่ถ้าไม่มีต้องเพิ่ม)
   - ถ้าคุณ deploy ขึ้นเว็บจริง (เช่น Vercel) อย่าลืมกลับมาเพิ่มโดเมนของเว็บจริงที่นี่ด้วย

## 4. อัปเดตไฟล์ `.env.local`

เปิดไฟล์ `.env.local` ในโปรเจกต์ของคุณ แล้วนำค่าจากขั้นตอนที่ 2 มาใส่ให้ตรงกัน:

```env
VITE_FIREBASE_API_KEY=นำค่า apiKey มาใส่
VITE_FIREBASE_AUTH_DOMAIN=นำค่า authDomain มาใส่
VITE_FIREBASE_PROJECT_ID=นำค่า projectId มาใส่
VITE_FIREBASE_STORAGE_BUCKET=นำค่า storageBucket มาใส่
VITE_FIREBASE_MESSAGING_SENDER_ID=นำค่า messagingSenderId มาใส่
VITE_FIREBASE_APP_ID=นำค่า appId มาใส่
```

## 5. (เพิ่มเติม) ตั้งค่า Firestore Database

ถ้าแอปต้องใช้ฐานข้อมูลด้วย:

1. ไปที่เมนู **Build** -> **Firestore Database**
2. คลิก **Create database**
3. เลือก Location (แนะนำ `asia-southeast1` สิงคโปร์ เพื่อความเร็วในไทย) -> **Next**
4. เลือก **Start in test mode** (เพื่อให้เริ่มใช้งานได้เลยโดยยังไม่ติด Permission) -> **Create**

---

เมื่อทำครบทุกข้อแล้ว ให้ลองรัน `npm run dev` ใหม่ (ถ้ายังรันค้างอยู่ ให้ปิดแล้วเปิดใหม่) แล้วลอง Login ดูครับ
