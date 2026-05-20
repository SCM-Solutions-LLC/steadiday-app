// Pharmacy data structure
export interface PharmacyData {
  name: string;
  phone?: string;
  address?: string;
}

// Common pharmacy chains with contact info
export const pharmacyDatabase: PharmacyData[] = [
  // Major national chains
  { name: "CVS Pharmacy", phone: "1-800-746-7287" },
  { name: "Walgreens", phone: "1-800-925-4733" },
  { name: "Rite Aid", phone: "1-800-748-3243" },
  { name: "Walmart Pharmacy", phone: "1-800-925-6278" },
  { name: "Target Pharmacy", phone: "1-800-591-3869" },
  { name: "Kroger Pharmacy", phone: "1-800-576-4377" },
  { name: "Safeway Pharmacy", phone: "1-877-723-3929" },
  { name: "Albertsons Pharmacy", phone: "1-877-932-7948" },
  { name: "Publix Pharmacy", phone: "1-800-242-1227" },
  { name: "H-E-B Pharmacy", phone: "1-800-432-3113" },
  { name: "Meijer Pharmacy", phone: "1-800-543-3704" },

  // Wholesale clubs
  { name: "Costco Pharmacy", phone: "1-800-774-2678" },
  { name: "Sam's Club Pharmacy", phone: "1-888-746-7726" },
  { name: "BJ's Pharmacy", phone: "1-800-257-2582" },

  // Regional chains
  { name: "Winn-Dixie Pharmacy", phone: "1-866-946-6349" },
  { name: "Giant Eagle Pharmacy", phone: "1-800-553-2324" },
  { name: "Fred Meyer Pharmacy", phone: "1-800-576-4377" },
  { name: "QFC Pharmacy", phone: "1-800-576-4377" },
  { name: "Ralph's Pharmacy", phone: "1-800-576-4377" },
  { name: "Food Lion Pharmacy", phone: "1-800-210-9569" },
  { name: "Stop & Shop Pharmacy", phone: "1-800-767-7772" },
  { name: "Giant Food Pharmacy", phone: "1-888-469-4426" },
  { name: "ShopRite Pharmacy", phone: "1-800-746-7748" },
  { name: "Wegmans Pharmacy", phone: "1-800-934-6267" },

  // Specialty pharmacies
  { name: "Kaiser Permanente Pharmacy", phone: "1-800-464-4000" },
  { name: "Capsule Pharmacy", phone: "1-888-226-7488" },
  { name: "PillPack", phone: "1-855-745-5725" },
  { name: "Alto Pharmacy", phone: "1-800-874-5881" },

  // Independent
  { name: "Local Independent Pharmacy" },
];

// Legacy export for backward compatibility
export const commonPharmacies = pharmacyDatabase.map((p) => p.name);

// Search pharmacy by name and return full data
export const searchPharmacy = (searchTerm: string): PharmacyData | undefined => {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  return pharmacyDatabase.find(
    (pharmacy) => pharmacy.name.toLowerCase() === normalizedSearch
  );
};
