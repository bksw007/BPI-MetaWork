export interface PackingRecord {
  id: string; // Generated on client for keying
  Timestamp?: string; // Col A
  Date: string; // Col B
  Shipment: string;
  Mode: string;
  Product: string;
  "SI QTY": number;
  QTY: number;
  Remark?: string; // Col Y
  [key: string]: string | number | undefined; // For dynamic package columns
}

export const PACKAGE_COLUMNS = [
  "110x110x115 QTY",
  "110x110x90 QTY",
  "110x110x65 QTY",
  "80X120X115 QTY",
  "80X120X90 QTY",
  "80X120X65 QTY",
  "RETURNABLE QTY",
  "42X46X68 QTY",
  "47X66X68 QTY",
  "53X53X58 QTY",
  "57X64X84 QTY",
  "68X74X86 QTY",
  "70X100X90 QTY",
  "27X27X22 QTY",
  "53X53X19 QTY",
  "WARP QTY",
  "UNIT QTY"
];

export const PACKAGE_GROUPS = {
  "Standard Package": [
    "110x110x115 QTY",
    "110x110x90 QTY",
    "110x110x65 QTY",
    "80X120X115 QTY",
    "80X120X90 QTY",
    "80X120X65 QTY"
  ],
  "Boxes Package": [
    "42X46X68 QTY",
    "47X66X68 QTY",
    "53X53X58 QTY",
    "57X64X84 QTY",
    "68X74X86 QTY",
    "70X100X90 QTY",
    "27X27X22 QTY",
    "53X53X19 QTY"
  ],
  "Returnable Package": [
    "RETURNABLE QTY"
  ],
  "Warp Package": [
    "WARP QTY",
    "UNIT QTY"
  ]
};

export const PACKAGE_RATIOS: Record<string, number> = {
  "110x110x115 QTY": 1,
  "110x110x90 QTY": 1,
  "110x110x65 QTY": 1,
  "80X120X115 QTY": 1,
  "80X120X90 QTY": 1,
  "80X120X65 QTY": 1,
  "RETURNABLE QTY": 2, // 1:2
  "42X46X68 QTY": 3,   // 1:3
  "47X66X68 QTY": 3,
  "53X53X58 QTY": 3,
  "57X64X84 QTY": 3,
  "68X74X86 QTY": 3,
  "70X100X90 QTY": 3,
  "27X27X22 QTY": 30,  // 1:30
  "53X53X19 QTY": 30,
  "WARP QTY": 10,      // 1:10
  "UNIT QTY": 1        // 1:1
};

export interface DashboardStats {
  totalItems: number;
  totalSI: number;
  totalPackages: number;
  topCustomer: string;
  topMode: string;
}
