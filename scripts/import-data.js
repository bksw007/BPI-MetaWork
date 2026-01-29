// สร้างไฟล์ import-data.js สำหรับนำเข้าข้อมูลจำนวนมาก
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');

// Firebase config
// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "packing-report-main.firebaseapp.com",
  projectId: "packing-report-main",
  storageBucket: "packing-report-main.firebasestorage.app",
  messagingSenderId: "469899743055",
  appId: "1:469899743055:web:d7020fd97511b14d9c7f3a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ฟังก์ชันแปลงข้อมูลจาก CSV/JSON เป็น Firestore format
function convertToFirestore(record) {
  const packages = {};
  
  // แปลง package columns เป็น nested object
  // Defined mapping: Firestore Key -> [List of possible CSV Header Names]
  const mapping = {
    "warp": ["WARP QTY", "PALLET", "WOODEN CASE 96x219x83"],
    "returnable": ["RETURNABLE QTY", "RETURNABLE P110X110X110"],
    "110x110x115": ["110x110x115 QTY", "PALLET 110x110x115"],
    "110x110x90": ["110x110x90 QTY", "PALLET 110x110x90"],
    "110x110x65": ["110x110x65 QTY", "PALLET 110x110x65"],
    "80x120x115": ["80X120X115 QTY", "PALLET 80x120x115"],
    "80x120x90": ["80X120X90 QTY", "PALLET 80x120x90"],
    "80x120x65": ["80X120X65 QTY", "PALLET 80x120x65"],
    "42x46x68": ["42X46X68 QTY", "PALLET 42X46X68"],
    "47x66x68": ["47X66X68 QTY", "PALLET 47X66X68"],
    "53x53x58": ["53X53X58 QTY", "PALLET 53X53X58"],
    "57x64x84": ["57X64X84 QTY", "PALLET 57X64X84"],
    "68x74x86": ["68X74X86 QTY", "PALLET 68X74X86"],
    "70x100x90": ["70X100X90 QTY", "PALLET 70X100X90"],
    "27x27x22": ["27X27X22 QTY", "CARTON 27X27X22"],
    "53x53x19": ["53X53X19 QTY", "CARTON 53X53X19"],
    "unit": ["UNIT QTY", "UNIT"]
  };

  // Initialize all package keys to 0
  Object.keys(mapping).forEach(key => packages[key] = 0);

  // Process mapping: Sum up values from all matching columns found in the record
  Object.entries(mapping).forEach(([firestoreKey, possibleHeaders]) => {
    let total = 0;
    possibleHeaders.forEach(header => {
      // Case-insensitive lookup for headers in the record
      const matchingHeader = Object.keys(record).find(k => k.trim().toUpperCase() === header.trim().toUpperCase());
      if (matchingHeader) {
         total += (Number(record[matchingHeader]) || 0);
      }
    });
    packages[firestoreKey] = total;
  });

  return {
    date: record.Date || '',
    shipment: record.Shipment || '',
    mode: record.Mode || '',
    product: record.Product || '',
    siQty: Number(record['SI QTY']) || 0,
    qty: Number(record.QTY) || 0,
    packages,
    remark: record.Remark || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// ฟังก์ชัน import ข้อมูล
async function importData(data) {
  const batchSize = 500; // จำกัด 500 records ต่อ batch
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`Starting import of ${data.length} records...`);
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)}`);
    
    try {
      const promises = batch.map(async (record) => {
        try {
          const firestoreData = convertToFirestore(record);
          await addDoc(collection(db, 'packingRecords'), firestoreData);
          return { success: true };
        } catch (error) {
          console.error(`Error importing record:`, error);
          return { success: false, error };
        }
      });
      
      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });
      
      // รอ 1 วินาทีระหว่าง batches เพื่อไม่ให้ Firebase โหลดเกิน
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Batch error:`, error);
      errorCount += batch.length;
    }
  }
  
  console.log(`Import completed! Success: ${successCount}, Errors: ${errorCount}`);
}

// ตัวอย่างการใช้งาน
async function main() {
  try {
    // อ่านข้อมูลจากไฟล์ JSON
    const data = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
    await importData(data);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// รัน script
if (require.main === module) {
  main();
}

module.exports = { importData, convertToFirestore };
