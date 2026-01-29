import { PackingRecord, PACKAGE_COLUMNS, PACKAGE_GROUPS, PACKAGE_RATIOS } from '@types';

// Helper: Convert YYYY-MM-DD to DD/MM/YYYY
export const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

// Helper: Convert DD/MM/YYYY to YYYY-MM-DD
export const parseDisplayDate = (displayDate: string): string => {
  if (!displayDate) return '';
  const parts = displayDate.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return displayDate; // Fallback or return as is if already ISO?
};

// A simple CSV parser to avoid external dependencies for this demo
export const parseCSV = (text: string): PackingRecord[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map((line, index) => {
    // Handle split by comma, respecting quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record: any = { id: `row-${index}` };
    
    headers.forEach((header, i) => {
      const val = values[i]?.replace(/"/g, ''); // Clean quotes
      
      if (header === 'Date') {
        // Try to parse dd/mm/yyyy or d/m/yyyy and convert to ISO yyyy-mm-dd for internal use
        // This ensures charts and new Date() logic works correctly
        const ddmmyyyy = val?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
           const day = ddmmyyyy[1].padStart(2, '0');
           const month = ddmmyyyy[2].padStart(2, '0');
           const year = ddmmyyyy[3];
           record[header] = `${year}-${month}-${day}`;
        } else {
           record[header] = val || "";
        }
      } else if (header.includes("QTY") || header === "SI QTY" || PACKAGE_COLUMNS.includes(header)) {
        const num = parseFloat(val);
        record[header] = isNaN(num) ? 0 : num;
      } else {
        record[header] = val || "";
      }
    });

    return record as PackingRecord;
  });
};

export const generateSampleData = (): PackingRecord[] => {
  const customers = ["Toyota", "Honda", "Nissan", "Sony", "Panasonic"];
  const modes = ["Sea", "Air", "Truck"];
  const products = ["Electronics", "Auto Parts", "Batteries", "Screens"];
  
  const data: PackingRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 50; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const record: any = {
      id: `sample-${i}`,
      Date: date.toISOString().split('T')[0],
      Shipment: customers[Math.floor(Math.random() * customers.length)],
      Mode: modes[Math.floor(Math.random() * modes.length)],
      Product: products[Math.floor(Math.random() * products.length)],
      "SI QTY": Math.floor(Math.random() * 5) + 1,
      QTY: Math.floor(Math.random() * 1000) + 100,
    };

    // Fill package columns randomly
    PACKAGE_COLUMNS.forEach(col => {
      // 30% chance a specific package type is used
      if (Math.random() > 0.7) {
         record[col] = Math.floor(Math.random() * 20);
      } else {
         record[col] = 0;
      }
    });

    data.push(record);
  }
  return data;
};

export const aggregateData = (data: PackingRecord[]) => {
  const stats = {
    totalItems: data.reduce((acc, curr) => acc + (curr.QTY || 0), 0),
    totalSI: data.reduce((acc, curr) => acc + (curr["SI QTY"] || 0), 0),
    totalPackages: 0,
    topCustomer: "",
    topMode: "",
  };

  // Calculate total packages across all dimension columns
  data.forEach(row => {
    PACKAGE_COLUMNS.forEach(col => {
      const val = row[col] as number;
      if (val) stats.totalPackages += val;
    });
  });

  // Aggregations for charts
  const shipmentCounts: Record<string, number> = {};
  const modeCounts: Record<string, number> = {};
  const packageUsage: Record<string, number> = {};
  const dateMap: Record<string, { date: string, qty: number, packages: number }> = {};

  // Initialize package usage
  PACKAGE_COLUMNS.forEach(col => packageUsage[col] = 0);

  data.forEach(row => {
    // Shipment Top
    shipmentCounts[row.Shipment] = (shipmentCounts[row.Shipment] || 0) + row.QTY;
    
    // Mode Top
    modeCounts[row.Mode] = (modeCounts[row.Mode] || 0) + 1;

    // Package Breakdown
    PACKAGE_COLUMNS.forEach(col => {
      packageUsage[col] += (row[col] as number) || 0;
    });

    // Daily Timeline
    const d = row.Date;
    if (!dateMap[d]) dateMap[d] = { date: d, qty: 0, packages: 0 };
    dateMap[d].qty += row.QTY;
    
    let dailyPackages = 0;
    PACKAGE_COLUMNS.forEach(col => dailyPackages += (row[col] as number) || 0);
    dateMap[d].packages += dailyPackages;
  });

  // Find Top Customer
  stats.topCustomer = Object.entries(shipmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  stats.topMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Group Aggregations
  const groupStats: Record<string, number> = {};
  const ratioStats: Record<string, { used: number, maxCapacity: number }> = {};
  
  Object.keys(PACKAGE_GROUPS).forEach(group => {
     groupStats[group] = 0;
     ratioStats[group] = { used: 0, maxCapacity: 0 };
  });

  data.forEach(row => {
    Object.entries(PACKAGE_GROUPS).forEach(([groupName, columns]) => {
      columns.forEach(col => {
         const qty = (row[col] as number) || 0;
         groupStats[groupName] += qty;
         
         const ratio = PACKAGE_RATIOS[col] || 1;
         // Fix: "Ratio 1:30" means qty / 30 = capacity used
         // maxCapacity = qty / ratio (division, not multiplication)
         ratioStats[groupName].used += qty; // Total packages
         ratioStats[groupName].maxCapacity += (ratio > 0 ? qty / ratio : 0);
      });
    });
  });

  // Format chart data
  const timelineData = Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const packageData = Object.entries(packageUsage)
    .map(([name, value]) => ({ name: name.replace(" QTY", ""), value }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const shipmentChartData = Object.entries(shipmentCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  const modeChartData = Object.entries(modeCounts)
    .map(([name, value]) => ({ name, value }));

  return { stats, timelineData, packageData, shipmentChartData, modeChartData, groupStats, ratioStats };
};