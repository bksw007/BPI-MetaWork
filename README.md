# Packing Report - Professional Logistics Tracking

ระบบจัดการและติดตามการแพ็คสินค้าอย่างมืออาชีพ พร้อมการวิเคราะห์ข้อมูลแบบเรียลไทม์

## Features

- 📊 **Real-time Dashboard** - ติดตามข้อมูลแบบเรียลไทม์พร้อมกราฟและสถิติ
- 📝 **Easy Data Entry** - ฟอร์มการบันทึกข้อมูลที่ใช้งานง่าย
- 📈 **Advanced Analytics** - วิเคราะห์อัตราการใช้บรรจุภัณฑ์และประสิทธิภาพ
- 🔍 **Advanced Filtering** - กรองข้อมูลตามวันที่ ลูกค้า สินค้า และหมวดหมู่
- 📥 **Export & Report** - ส่งออกข้อมูลเป็น CSV
- 🎨 **Beautiful UI** - ธีมสีพาสเทล หรูหรา อบอุ่น แบบมืออาชีพ

## Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Firebase Firestore** - Real-time Database
- **Tailwind CSS** - Styling with custom pastel theme
- **React Router** - Routing
- **Recharts** - Data Visualization
- **Vite** - Build Tool

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd packing-report
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Setup Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Create a collection named `packingRecords`
   - Copy your Firebase configuration to `.env.local`

5. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Firebase Firestore Structure

```typescript
packingRecords/
  {
    id: string (auto-generated),
    date: string (YYYY-MM-DD),
    shipment: string,
    mode: string,
    product: string,
    siQTY: number,
    qty: number,
    packages: {
      "110x110x115": number,
      "110x110x90": number,
      // ... all package types
    },
    remark?: string,
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app will automatically deploy on every push to main branch.

## Project Structure

```
packing-report/
├── src/
│   ├── components/
│   │   ├── Landing/        # Landing page components
│   │   ├── Dashboard.tsx   # Dashboard view
│   │   ├── DataTable.tsx   # Data table view
│   │   └── DataInputForm.tsx # Data entry form
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   └── DashboardPage.tsx
│   ├── services/
│   │   └── firebaseService.ts # Firebase integration
│   ├── config/
│   │   └── firebase.ts     # Firebase configuration
│   └── index.css           # Global styles
├── components/             # Shared components
├── public/                 # Static assets
└── App.tsx                 # Main app with routing
```

## Color Palette

The app uses a beautiful pastel color scheme:

- **Lavender** - Primary actions and highlights
- **Peach** - Warm accents and secondary elements
- **Mint** - Success states and fresh elements
- **Powder Blue** - Data and analytics
- **Rose Quartz** - Important CTAs
- **Golden Hour** - Special highlights

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
