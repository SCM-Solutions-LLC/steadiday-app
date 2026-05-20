/**
 * Healthcare Provider Data Utilities
 *
 * This module combines:
 * 1. NPI Registry API (8+ million real providers, always up-to-date)
 * 2. Local fallback data for offline/demo usage
 */

import {
  searchProviders,
  searchOrganizations,
  searchHospitals,
  searchNursingFacilities,
  searchClinics,
  searchPharmacies,
  searchAllProviders,
  formatNPIResults,
  getNPIByNumber,
  TAXONOMY_CATEGORIES,
  US_STATES,
  NPI_REGISTRY_STATS,
  type FormattedProvider,
  type NPIResult,
} from "../api/npi-registry";
import { logger } from "./logger";

// Re-export for convenience
export {
  searchProviders,
  searchOrganizations,
  searchHospitals,
  searchNursingFacilities,
  searchClinics,
  searchPharmacies,
  searchAllProviders,
  formatNPIResults,
  getNPIByNumber,
  TAXONOMY_CATEGORIES,
  US_STATES,
  NPI_REGISTRY_STATS,
  type FormattedProvider,
  type NPIResult,
};

// Common medical specialties for autocomplete
export const commonSpecialties = [
  "General Practice",
  "Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Geriatrics",
  "Hematology",
  "Nephrology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology (ENT)",
  "Physical Medicine",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urology",
  "Allergy & Immunology",
  "Anesthesiology",
  "Emergency Medicine",
  "Pain Management",
  "Sports Medicine",
  "Podiatry",
  "Dentistry",
  "Oral Surgery",
  "Orthodontics",
  "Optometry",
  "Chiropractic",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Nurse Practitioner",
  "Physician Assistant",
];

// Facility types for filtering
export const facilityTypes = [
  "Hospital",
  "General Acute Care Hospital",
  "Psychiatric Hospital",
  "Rehabilitation Hospital",
  "Children's Hospital",
  "Skilled Nursing Facility",
  "Nursing Home",
  "Assisted Living Facility",
  "Home Health Agency",
  "Hospice",
  "Urgent Care Center",
  "Community Health Center",
  "Federally Qualified Health Center",
  "Rural Health Clinic",
  "Ambulatory Surgery Center",
  "Dialysis Center",
  "Pharmacy",
  "Laboratory",
  "Imaging Center",
  "Mental Health Center",
  "Substance Abuse Treatment Center",
  "Pain Management Clinic",
  "Physical Therapy Center",
  "Infusion Center",
  "Sleep Disorder Center",
  "Long Term Acute Care Hospital",
  "Residential Treatment Facility",
];

// Common doctor and practice database for autocomplete (fallback/demo data)
export interface DoctorTemplate {
  name: string;
  specialty: string;
  phoneNumber: string;
  address: string;
  type: "doctor" | "practice";
  npi?: string;
}

// Local fallback data for offline/demo usage
export const commonDoctorsAndPractices: DoctorTemplate[] = [
  // General/Family Medicine
  { name: "Dr. Sarah Johnson", specialty: "Family Medicine", phoneNumber: "(555) 123-4567", address: "123 Main St, Suite 100", type: "doctor" },
  { name: "Dr. Michael Chen", specialty: "Family Medicine", phoneNumber: "(555) 234-5678", address: "456 Oak Ave, Building A", type: "doctor" },
  { name: "Dr. Emily Rodriguez", specialty: "General Practice", phoneNumber: "(555) 345-6789", address: "789 Elm St, Floor 2", type: "doctor" },
  { name: "Family Health Center", specialty: "Family Medicine", phoneNumber: "(555) 456-7890", address: "321 Pine St", type: "practice" },
  { name: "Primary Care Associates", specialty: "General Practice", phoneNumber: "(555) 567-8901", address: "654 Maple Dr, Suite 200", type: "practice" },
  { name: "Dr. Robert Kim", specialty: "Internal Medicine", phoneNumber: "(555) 111-2222", address: "100 Health Plaza Dr", type: "doctor" },
  { name: "Community Health Clinic", specialty: "Family Medicine", phoneNumber: "(555) 222-3333", address: "200 Community Way", type: "practice" },
  { name: "Dr. Angela Park", specialty: "Internal Medicine", phoneNumber: "(555) 333-4444", address: "300 Medical Center Blvd", type: "doctor" },

  // Cardiology
  { name: "Dr. Robert Thompson", specialty: "Cardiology", phoneNumber: "(555) 678-9012", address: "987 Heart Lane, Suite 300", type: "doctor" },
  { name: "Dr. Lisa Martinez", specialty: "Cardiology", phoneNumber: "(555) 789-0123", address: "135 Cardiac Center Dr", type: "doctor" },
  { name: "Heart & Vascular Institute", specialty: "Cardiology", phoneNumber: "(555) 890-1234", address: "246 Medical Plaza Blvd", type: "practice" },
  { name: "Dr. Steven Patel", specialty: "Cardiology", phoneNumber: "(555) 444-5555", address: "400 Heartbeat Ave", type: "doctor" },
  { name: "Cardiovascular Associates", specialty: "Cardiology", phoneNumber: "(555) 555-6666", address: "500 Artery Dr, Suite 100", type: "practice" },

  // Orthopedics
  { name: "Dr. James Wilson", specialty: "Orthopedics", phoneNumber: "(555) 901-2345", address: "357 Bone & Joint Way", type: "doctor" },
  { name: "Dr. Patricia Anderson", specialty: "Orthopedics", phoneNumber: "(555) 012-3456", address: "468 Sports Medicine Dr", type: "doctor" },
  { name: "Orthopedic Surgery Center", specialty: "Orthopedics", phoneNumber: "(555) 123-4568", address: "579 Mobility Ln, Floor 3", type: "practice" },
  { name: "Dr. Kevin O'Brien", specialty: "Orthopedics", phoneNumber: "(555) 666-7777", address: "600 Joint Care Blvd", type: "doctor" },
  { name: "Spine & Sports Orthopedics", specialty: "Orthopedics", phoneNumber: "(555) 777-8888", address: "700 Back Health Way", type: "practice" },

  // Dermatology
  { name: "Dr. Amanda Taylor", specialty: "Dermatology", phoneNumber: "(555) 234-5679", address: "680 Skin Care Blvd", type: "doctor" },
  { name: "Dr. David Lee", specialty: "Dermatology", phoneNumber: "(555) 345-6780", address: "791 Beauty Plaza", type: "doctor" },
  { name: "Dermatology Associates", specialty: "Dermatology", phoneNumber: "(555) 456-7891", address: "802 Clear Skin Way", type: "practice" },
  { name: "Dr. Michelle Wang", specialty: "Dermatology", phoneNumber: "(555) 888-9999", address: "800 Healthy Skin Dr", type: "doctor" },
  { name: "Skin Health Center", specialty: "Dermatology", phoneNumber: "(555) 999-0000", address: "900 Dermcare Plaza", type: "practice" },

  // Pediatrics
  { name: "Dr. Jennifer White", specialty: "Pediatrics", phoneNumber: "(555) 567-8902", address: "913 Kids Health Center", type: "doctor" },
  { name: "Dr. Christopher Brown", specialty: "Pediatrics", phoneNumber: "(555) 678-9013", address: "024 Children's Way", type: "doctor" },
  { name: "Children's Medical Group", specialty: "Pediatrics", phoneNumber: "(555) 789-0124", address: "135 Young Lives Plaza", type: "practice" },
  { name: "Dr. Rachel Green", specialty: "Pediatrics", phoneNumber: "(555) 100-1111", address: "1000 Little Ones Way", type: "doctor" },
  { name: "Pediatric Care Partners", specialty: "Pediatrics", phoneNumber: "(555) 200-2222", address: "1100 Growing Up Blvd", type: "practice" },

  // Ophthalmology/Optometry
  { name: "Dr. Karen Davis", specialty: "Ophthalmology", phoneNumber: "(555) 890-1235", address: "246 Vision Center Dr", type: "doctor" },
  { name: "Dr. Richard Miller", specialty: "Optometry", phoneNumber: "(555) 901-2346", address: "357 Eye Care Ln", type: "doctor" },
  { name: "Vision Care Center", specialty: "Ophthalmology", phoneNumber: "(555) 012-3457", address: "468 Sight Saver Blvd", type: "practice" },
  { name: "Dr. Laura Peterson", specialty: "Ophthalmology", phoneNumber: "(555) 300-3333", address: "1200 Clear Vision Dr", type: "doctor" },
  { name: "Eye Health Specialists", specialty: "Ophthalmology", phoneNumber: "(555) 400-4444", address: "1300 Eagle Eye Blvd", type: "practice" },

  // Dentistry
  { name: "Dr. Susan Garcia", specialty: "Dentistry", phoneNumber: "(555) 123-4569", address: "579 Dental Plaza", type: "doctor" },
  { name: "Dr. Thomas Harris", specialty: "Orthodontics", phoneNumber: "(555) 234-5670", address: "680 Smile Way", type: "doctor" },
  { name: "Bright Smile Dental", specialty: "Dentistry", phoneNumber: "(555) 345-6781", address: "791 Perfect Teeth Dr", type: "practice" },
  { name: "Dr. Mark Robinson", specialty: "Dentistry", phoneNumber: "(555) 500-5555", address: "1400 Oral Health Center", type: "doctor" },
  { name: "Family Dental Care", specialty: "Dentistry", phoneNumber: "(555) 600-6666", address: "1500 Tooth Lane", type: "practice" },

  // Neurology
  { name: "Dr. Mary Clark", specialty: "Neurology", phoneNumber: "(555) 456-7892", address: "802 Brain Health Center", type: "doctor" },
  { name: "Dr. William Lewis", specialty: "Neurology", phoneNumber: "(555) 567-8903", address: "913 Neuro Care Plaza", type: "doctor" },
  { name: "Neurology Specialists", specialty: "Neurology", phoneNumber: "(555) 678-9014", address: "024 Memory Lane", type: "practice" },
  { name: "Dr. Elizabeth Turner", specialty: "Neurology", phoneNumber: "(555) 700-7777", address: "1600 Mind Health Dr", type: "doctor" },
  { name: "Brain & Spine Institute", specialty: "Neurology", phoneNumber: "(555) 800-8888", address: "1700 Neural Center Blvd", type: "practice" },

  // Endocrinology
  { name: "Dr. Barbara Walker", specialty: "Endocrinology", phoneNumber: "(555) 789-0125", address: "135 Hormone Health Way", type: "doctor" },
  { name: "Dr. Joseph Hall", specialty: "Endocrinology", phoneNumber: "(555) 890-1236", address: "246 Diabetes Care Center", type: "doctor" },
  { name: "Dr. Natalie Adams", specialty: "Endocrinology", phoneNumber: "(555) 900-9999", address: "1800 Thyroid Center Dr", type: "doctor" },
  { name: "Endocrine & Diabetes Institute", specialty: "Endocrinology", phoneNumber: "(555) 101-0101", address: "1900 Hormone Health Plaza", type: "practice" },

  // Gastroenterology
  { name: "Dr. Nancy Allen", specialty: "Gastroenterology", phoneNumber: "(555) 901-2347", address: "357 Digestive Health Dr", type: "doctor" },
  { name: "Dr. Daniel Young", specialty: "Gastroenterology", phoneNumber: "(555) 012-3458", address: "468 GI Specialists Plaza", type: "doctor" },
  { name: "Dr. Brian Foster", specialty: "Gastroenterology", phoneNumber: "(555) 202-0202", address: "2000 Digestive Care Blvd", type: "doctor" },
  { name: "GI Health Associates", specialty: "Gastroenterology", phoneNumber: "(555) 303-0303", address: "2100 Gut Health Center", type: "practice" },

  // Psychiatry/Mental Health
  { name: "Dr. Margaret King", specialty: "Psychiatry", phoneNumber: "(555) 123-4560", address: "579 Mental Wellness Center", type: "doctor" },
  { name: "Dr. George Wright", specialty: "Psychiatry", phoneNumber: "(555) 234-5671", address: "680 Mind Care Way", type: "doctor" },
  { name: "Behavioral Health Center", specialty: "Psychiatry", phoneNumber: "(555) 345-6782", address: "791 Healing Plaza", type: "practice" },
  { name: "Dr. Sarah Mitchell", specialty: "Psychiatry", phoneNumber: "(555) 404-0404", address: "2200 Mental Health Dr", type: "doctor" },
  { name: "Wellness & Mental Health Group", specialty: "Psychiatry", phoneNumber: "(555) 505-0505", address: "2300 Serenity Way", type: "practice" },

  // Physical Therapy
  { name: "Dr. Carol Scott", specialty: "Physical Therapy", phoneNumber: "(555) 456-7893", address: "802 Recovery Center", type: "doctor" },
  { name: "Movement & Mobility PT", specialty: "Physical Therapy", phoneNumber: "(555) 567-8904", address: "913 Rehabilitation Dr", type: "practice" },
  { name: "Dr. John Baker", specialty: "Physical Therapy", phoneNumber: "(555) 606-0606", address: "2400 Motion Health Blvd", type: "doctor" },
  { name: "Active Recovery Physical Therapy", specialty: "Physical Therapy", phoneNumber: "(555) 707-0707", address: "2500 Strength Way", type: "practice" },

  // Geriatrics
  { name: "Dr. Helen Cooper", specialty: "Geriatrics", phoneNumber: "(555) 808-0808", address: "2600 Senior Care Dr", type: "doctor" },
  { name: "Dr. Frank Edwards", specialty: "Geriatrics", phoneNumber: "(555) 909-0909", address: "2700 Golden Years Blvd", type: "doctor" },
  { name: "Senior Health Partners", specialty: "Geriatrics", phoneNumber: "(555) 010-1010", address: "2800 Aging Well Center", type: "practice" },

  // Pulmonology
  { name: "Dr. Timothy Ross", specialty: "Pulmonology", phoneNumber: "(555) 111-1212", address: "2900 Lung Health Dr", type: "doctor" },
  { name: "Respiratory Care Associates", specialty: "Pulmonology", phoneNumber: "(555) 212-1313", address: "3000 Breathing Easy Blvd", type: "practice" },

  // Rheumatology
  { name: "Dr. Catherine Morris", specialty: "Rheumatology", phoneNumber: "(555) 313-1414", address: "3100 Joint Health Center", type: "doctor" },
  { name: "Arthritis & Rheumatology Center", specialty: "Rheumatology", phoneNumber: "(555) 414-1515", address: "3200 Mobility Way", type: "practice" },

  // Urology
  { name: "Dr. Andrew Hughes", specialty: "Urology", phoneNumber: "(555) 515-1616", address: "3300 Urologic Care Dr", type: "doctor" },
  { name: "Urology Associates", specialty: "Urology", phoneNumber: "(555) 616-1717", address: "3400 Kidney Health Blvd", type: "practice" },

  // Pain Management
  { name: "Dr. Victoria Price", specialty: "Pain Management", phoneNumber: "(555) 717-1818", address: "3500 Pain Relief Center", type: "doctor" },
  { name: "Comprehensive Pain Management", specialty: "Pain Management", phoneNumber: "(555) 818-1919", address: "3600 Comfort Care Way", type: "practice" },

  // Allergy & Immunology
  { name: "Dr. Ryan Brooks", specialty: "Allergy & Immunology", phoneNumber: "(555) 919-2020", address: "3700 Allergy Relief Dr", type: "doctor" },
  { name: "Allergy & Asthma Center", specialty: "Allergy & Immunology", phoneNumber: "(555) 020-2121", address: "3800 Immune Health Blvd", type: "practice" },

  // Oncology
  { name: "Dr. Diana Reed", specialty: "Oncology", phoneNumber: "(555) 121-2222", address: "3900 Cancer Care Center", type: "doctor" },
  { name: "Regional Cancer Institute", specialty: "Oncology", phoneNumber: "(555) 222-2323", address: "4000 Hope & Healing Way", type: "practice" },

  // Nephrology
  { name: "Dr. Peter Graham", specialty: "Nephrology", phoneNumber: "(555) 323-2424", address: "4100 Kidney Care Dr", type: "doctor" },
  { name: "Nephrology Associates", specialty: "Nephrology", phoneNumber: "(555) 424-2525", address: "4200 Renal Health Center", type: "practice" },
];

/**
 * Unified provider search that queries NPI Registry with local fallback
 *
 * @param query - Search term (name, specialty, etc.)
 * @param options - Search options
 * @returns Combined results from NPI Registry and local data
 */
export async function searchHealthcareProviders(params: {
  query?: string;
  specialty?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type?: "all" | "individual" | "organization";
  limit?: number;
  useLocalFallback?: boolean;
  signal?: AbortSignal;
}): Promise<{
  providers: FormattedProvider[];
  source: "npi" | "local" | "mixed";
  totalCount: number;
  isLiveData: boolean;
}> {
  const { query, specialty, city, state, zipCode, type = "all", limit = 50, useLocalFallback = true, signal } = params;

  try {
    // Try NPI Registry first
    let results: FormattedProvider[] = [];

    if (type === "all") {
      const response = await searchAllProviders({
        query,
        specialty,
        city,
        state,
        zipCode,
        limit,
        signal,
      });

      // Format results - prioritize individuals (doctors) over organizations
      const individuals = formatNPIResults(response.individuals);
      const organizations = formatNPIResults(response.organizations);

      // Filter out organizations with no useful name
      const validOrganizations = organizations.filter(org =>
        org.name && org.name.trim().length > 0
      );

      // Filter out individuals with no name
      const validIndividuals = individuals.filter(ind =>
        ind.name && ind.name.trim().length > 0
      );

      // Sort individuals first (actual doctors), then organizations
      // Also prioritize results that have the search term in their name
      const queryLower = query?.toLowerCase() || "";

      const sortedIndividuals = validIndividuals.sort((a, b) => {
        const aHasName = a.name.toLowerCase().includes(queryLower) ? 0 : 1;
        const bHasName = b.name.toLowerCase().includes(queryLower) ? 0 : 1;
        return aHasName - bHasName;
      });

      const sortedOrganizations = validOrganizations.sort((a, b) => {
        const aHasName = a.name.toLowerCase().includes(queryLower) ? 0 : 1;
        const bHasName = b.name.toLowerCase().includes(queryLower) ? 0 : 1;
        return aHasName - bHasName;
      });

      // Interleave results: show doctors first, then organizations
      results = [...sortedIndividuals, ...sortedOrganizations];
    } else if (type === "individual") {
      const response = await searchProviders({
        name: query,
        specialty,
        city,
        state,
        zipCode,
        limit,
      });
      const formatted = formatNPIResults(response.results ?? []);
      // Filter out any with empty names
      results = formatted.filter(p => p.name && p.name.trim().length > 0);
    } else {
      const response = await searchOrganizations({
        name: query,
        facilityType: specialty,
        city,
        state,
        zipCode,
        limit,
      });
      results = formatNPIResults(response.results ?? []);
    }

    if (results.length > 0) {
      return {
        providers: results.slice(0, limit),
        source: "npi",
        totalCount: results.length,
        isLiveData: true,
      };
    }

    // Fall back to local data if no results
    if (useLocalFallback) {
      const localResults = searchLocalProviders(query, specialty);
      return {
        providers: localResults.map(convertLocalToFormatted),
        source: "local",
        totalCount: localResults.length,
        isLiveData: false,
      };
    }

    return {
      providers: [],
      source: "npi",
      totalCount: 0,
      isLiveData: true,
    };
  } catch (error) {
    logger.error("NPI Registry search failed, using local fallback:", error);

    if (useLocalFallback) {
      const localResults = searchLocalProviders(query, specialty);
      return {
        providers: localResults.map(convertLocalToFormatted),
        source: "local",
        totalCount: localResults.length,
        isLiveData: false,
      };
    }

    throw error;
  }
}

/**
 * Search local provider data (for offline/demo use)
 */
function searchLocalProviders(query?: string, specialty?: string): DoctorTemplate[] {
  let results = [...commonDoctorsAndPractices];

  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.specialty.toLowerCase().includes(lowerQuery) ||
        p.address.toLowerCase().includes(lowerQuery)
    );
  }

  if (specialty) {
    const lowerSpecialty = specialty.toLowerCase();
    results = results.filter(p => p.specialty.toLowerCase().includes(lowerSpecialty));
  }

  return results;
}

/**
 * Convert local provider format to FormattedProvider
 */
function convertLocalToFormatted(local: DoctorTemplate): FormattedProvider {
  // Extract city, state, zip from address if possible
  const addressParts = local.address.split(",").map(s => s.trim());

  return {
    npi: local.npi ?? "",
    name: local.name,
    type: local.type === "doctor" ? "individual" : "organization",
    specialty: local.specialty,
    address: addressParts[0] ?? local.address,
    city: addressParts[1] ?? "",
    state: "",
    zipCode: "",
    phone: local.phoneNumber,
  };
}

/**
 * Get provider database statistics
 */
export function getProviderDatabaseInfo() {
  return {
    npiRegistry: {
      ...NPI_REGISTRY_STATS,
      description: "The official CMS National Provider Identifier database",
      coverage: "All 50 US states, DC, and territories",
      updateFrequency: "Real-time as providers register/update",
      apiStatus: "Free, no authentication required",
    },
    localFallback: {
      totalProviders: commonDoctorsAndPractices.length,
      description: "Sample provider data for offline/demo use",
      coverage: "Demo data only",
    },
    facilityTypes: facilityTypes.length,
    specialties: commonSpecialties.length,
  };
}
