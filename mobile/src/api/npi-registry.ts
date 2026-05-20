/**
 * NPI Registry API Integration
 *
 * The National Provider Identifier (NPI) Registry is the official CMS database
 * containing 8+ million healthcare providers nationwide.
 *
 * This includes:
 * - Individual providers (doctors, nurses, therapists, etc.)
 * - Organizations (hospitals, clinics, nursing homes, skilled nursing facilities, etc.)
 *
 * The data is maintained by CMS and updated in real-time.
 * API Documentation: https://npiregistry.cms.hhs.gov/api-page
 */

import { logger } from "../utils/logger";

const NPI_API_BASE_URL = "https://npiregistry.cms.hhs.gov/api";
const API_VERSION = "2.1";

export type NPIEntityType = "1" | "2"; // 1 = Individual, 2 = Organization
export type NPIProviderType = "individual" | "organization";

export interface NPIAddress {
  country_code: string;
  country_name: string;
  address_purpose: string;
  address_type: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  telephone_number?: string;
  fax_number?: string;
}

export interface NPITaxonomy {
  code: string;
  taxonomy_group?: string;
  desc: string;
  state?: string;
  license?: string;
  primary: boolean;
}

export interface NPIBasic {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  credential?: string;
  sole_proprietor?: string;
  gender?: string;
  enumeration_date?: string;
  last_updated?: string;
  name_prefix?: string;
  name_suffix?: string;
  // Organization fields
  organization_name?: string;
  organizational_subpart?: string;
  authorized_official_first_name?: string;
  authorized_official_last_name?: string;
  authorized_official_telephone_number?: string;
  authorized_official_title_or_position?: string;
}

export interface NPIResult {
  number: string; // NPI number
  enumeration_type: NPIProviderType;
  basic: NPIBasic;
  addresses: NPIAddress[];
  taxonomies: NPITaxonomy[];
  practiceLocations?: NPIAddress[];
  identifiers?: Array<{
    identifier: string;
    code: string;
    desc: string;
    state?: string;
    issuer?: string;
  }>;
  other_names?: Array<{
    type: string;
    code: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    organization_name?: string;
  }>;
}

export interface NPISearchResponse {
  result_count: number;
  results: NPIResult[];
}

export interface NPISearchParams {
  // Individual provider search
  first_name?: string;
  last_name?: string;

  // Organization search
  organization_name?: string;

  // Common filters
  number?: string; // NPI number
  enumeration_type?: NPIEntityType;
  taxonomy_description?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  limit?: number; // Max 200
  skip?: number; // For pagination

  // Advanced filters
  address_purpose?: "LOCATION" | "MAILING";
  use_first_name_alias?: boolean;
  pretty?: boolean;

  // AbortSignal for cancellation
  signal?: AbortSignal;
}

/**
 * Common taxonomy descriptions for filtering healthcare providers
 */
export const TAXONOMY_CATEGORIES = {
  // Individual Providers
  PHYSICIAN: "Physician",
  FAMILY_MEDICINE: "Family Medicine",
  INTERNAL_MEDICINE: "Internal Medicine",
  PEDIATRICS: "Pediatrics",
  CARDIOLOGY: "Cardiology",
  DERMATOLOGY: "Dermatology",
  NEUROLOGY: "Neurology",
  ORTHOPEDICS: "Orthopaedic",
  PSYCHIATRY: "Psychiatry",
  OBSTETRICS: "Obstetrics",
  GYNECOLOGY: "Gynecology",
  ONCOLOGY: "Oncology",
  OPHTHALMOLOGY: "Ophthalmology",
  UROLOGY: "Urology",
  GASTROENTEROLOGY: "Gastroenterology",
  PULMONOLOGY: "Pulmonology",
  NEPHROLOGY: "Nephrology",
  RHEUMATOLOGY: "Rheumatology",
  ENDOCRINOLOGY: "Endocrinology",
  GERIATRICS: "Geriatric",
  EMERGENCY_MEDICINE: "Emergency",
  ANESTHESIOLOGY: "Anesthesiology",
  RADIOLOGY: "Radiology",
  PATHOLOGY: "Pathology",
  PHYSICAL_THERAPY: "Physical Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
  SPEECH_THERAPY: "Speech",
  NURSE_PRACTITIONER: "Nurse Practitioner",
  PHYSICIAN_ASSISTANT: "Physician Assistant",
  REGISTERED_NURSE: "Registered Nurse",
  DENTIST: "Dentist",
  OPTOMETRIST: "Optometrist",
  PHARMACIST: "Pharmacist",
  PSYCHOLOGIST: "Psychologist",
  SOCIAL_WORKER: "Social Worker",
  CHIROPRACTOR: "Chiropractic",
  PODIATRIST: "Podiatrist",

  // Organizational/Facility Types
  HOSPITAL: "Hospital",
  GENERAL_ACUTE_CARE_HOSPITAL: "General Acute Care Hospital",
  PSYCHIATRIC_HOSPITAL: "Psychiatric Hospital",
  REHABILITATION_HOSPITAL: "Rehabilitation Hospital",
  CHILDRENS_HOSPITAL: "Children's Hospital",
  NURSING_FACILITY: "Nursing Facility",
  SKILLED_NURSING_FACILITY: "Skilled Nursing Facility",
  NURSING_HOME: "Nursing & Custodial Care Facility",
  ASSISTED_LIVING: "Assisted Living",
  HOSPICE: "Hospice",
  HOME_HEALTH: "Home Health",
  CLINIC: "Clinic",
  COMMUNITY_HEALTH_CENTER: "Community Health Center",
  URGENT_CARE: "Urgent Care",
  PHARMACY: "Pharmacy",
  LABORATORY: "Laboratory",
  DIAGNOSTIC_IMAGING: "Radiology",
  AMBULANCE: "Ambulance",
  DIALYSIS_CENTER: "Dialysis",
  REHABILITATION_CENTER: "Rehabilitation",
  MENTAL_HEALTH_CENTER: "Mental Health",
  SUBSTANCE_ABUSE: "Substance Abuse",
  MEDICAL_GROUP: "Multi-Specialty",
  SINGLE_SPECIALTY_GROUP: "Single Specialty",
  DURABLE_MEDICAL_EQUIPMENT: "Durable Medical Equipment",
  SLEEP_CENTER: "Sleep",
  PAIN_CLINIC: "Pain",
  INFUSION_CENTER: "Infusion",
  SURGERY_CENTER: "Ambulatory Surgical",
  LONG_TERM_CARE: "Long Term Care Hospital",
  RESIDENTIAL_TREATMENT: "Residential Treatment",
} as const;

/**
 * US States and Territories for location filtering
 */
export const US_STATES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  PR: "Puerto Rico",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  VI: "Virgin Islands",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  GU: "Guam",
  AS: "American Samoa",
  MP: "Northern Mariana Islands",
} as const;

/**
 * Search the NPI Registry for healthcare providers
 */
export async function searchNPIRegistry(params: NPISearchParams): Promise<NPISearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append("version", API_VERSION);

  // Add search parameters
  if (params.first_name) searchParams.append("first_name", params.first_name);
  if (params.last_name) searchParams.append("last_name", params.last_name);
  if (params.organization_name) searchParams.append("organization_name", params.organization_name);
  if (params.number) searchParams.append("number", params.number);
  if (params.enumeration_type) searchParams.append("enumeration_type", params.enumeration_type);
  if (params.taxonomy_description) searchParams.append("taxonomy_description", params.taxonomy_description);
  if (params.city) searchParams.append("city", params.city);
  if (params.state) searchParams.append("state", params.state);
  if (params.postal_code) searchParams.append("postal_code", params.postal_code);
  if (params.country_code) searchParams.append("country_code", params.country_code || "US");
  if (params.limit) searchParams.append("limit", Math.min(params.limit, 200).toString());
  if (params.skip) searchParams.append("skip", params.skip.toString());
  if (params.address_purpose) searchParams.append("address_purpose", params.address_purpose);
  if (params.use_first_name_alias !== undefined) {
    searchParams.append("use_first_name_alias", params.use_first_name_alias.toString());
  }

  const url = `${NPI_API_BASE_URL}/?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      signal: params.signal,
    });

    if (!response.ok) {
      throw new Error(`NPI Registry API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as NPISearchResponse;
  } catch (error) {
    logger.error("NPI Registry search failed:", error);
    throw error;
  }
}

/**
 * Look up a specific provider by NPI number
 */
export async function getNPIByNumber(npiNumber: string): Promise<NPIResult | null> {
  const response = await searchNPIRegistry({ number: npiNumber, limit: 1 });
  return response.results?.[0] ?? null;
}

/**
 * Search for individual healthcare providers (doctors, nurses, etc.)
 */
export async function searchProviders(params: {
  name?: string;
  firstName?: string;
  lastName?: string;
  specialty?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  limit?: number;
  skip?: number;
}): Promise<NPISearchResponse> {
  const searchParams: NPISearchParams = {
    enumeration_type: "1", // Individual providers
    limit: params.limit ?? 50,
    skip: params.skip,
    country_code: "US",
    use_first_name_alias: true,
  };

  if (params.firstName) searchParams.first_name = params.firstName;
  if (params.lastName) searchParams.last_name = params.lastName;
  if (params.specialty) searchParams.taxonomy_description = params.specialty;
  if (params.city) searchParams.city = params.city;
  if (params.state) searchParams.state = params.state;
  if (params.zipCode) searchParams.postal_code = params.zipCode;

  // If just a name string, try to split it
  if (params.name && !params.firstName && !params.lastName) {
    // Clean the name - remove common prefixes
    const cleanedName = params.name
      .trim()
      .replace(/^(dr\.?\s*|doctor\s+|mr\.?\s*|mrs\.?\s*|ms\.?\s*)/i, "")
      .trim();

    const nameParts = cleanedName.split(/\s+/).filter(p => p.length > 0);

    if (nameParts.length >= 2) {
      // If multiple parts, first is first name, last is last name
      searchParams.first_name = nameParts[0];
      searchParams.last_name = nameParts[nameParts.length - 1];
    } else if (nameParts.length === 1) {
      // Single word - search as last name (most common search pattern)
      searchParams.last_name = nameParts[0];
    }
  }

  return searchNPIRegistry(searchParams);
}

/**
 * Search for healthcare organizations (hospitals, clinics, nursing homes, etc.)
 */
export async function searchOrganizations(params: {
  name?: string;
  facilityType?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  limit?: number;
  skip?: number;
}): Promise<NPISearchResponse> {
  const searchParams: NPISearchParams = {
    enumeration_type: "2", // Organizations
    limit: params.limit ?? 50,
    skip: params.skip,
    country_code: "US",
  };

  if (params.name) searchParams.organization_name = params.name;
  if (params.facilityType) searchParams.taxonomy_description = params.facilityType;
  if (params.city) searchParams.city = params.city;
  if (params.state) searchParams.state = params.state;
  if (params.zipCode) searchParams.postal_code = params.zipCode;

  return searchNPIRegistry(searchParams);
}

/**
 * Search for hospitals
 */
export async function searchHospitals(params: {
  name?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  hospitalType?: keyof typeof HOSPITAL_TYPES;
  limit?: number;
  skip?: number;
}): Promise<NPISearchResponse> {
  const hospitalTaxonomy = params.hospitalType
    ? HOSPITAL_TYPES[params.hospitalType]
    : TAXONOMY_CATEGORIES.HOSPITAL;

  return searchOrganizations({
    name: params.name,
    facilityType: hospitalTaxonomy,
    city: params.city,
    state: params.state,
    zipCode: params.zipCode,
    limit: params.limit,
    skip: params.skip,
  });
}

export const HOSPITAL_TYPES = {
  GENERAL: "General Acute Care Hospital",
  PSYCHIATRIC: "Psychiatric Hospital",
  REHABILITATION: "Rehabilitation Hospital",
  CHILDRENS: "Children",
  CRITICAL_ACCESS: "Critical Access",
  MILITARY: "Military Hospital",
  CHRONIC_DISEASE: "Chronic Disease Hospital",
  LONG_TERM_ACUTE: "Long Term Care Hospital",
} as const;

/**
 * Search for nursing facilities and skilled nursing facilities
 */
export async function searchNursingFacilities(params: {
  name?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  facilityType?: "nursing_home" | "skilled_nursing" | "assisted_living" | "all";
  limit?: number;
  skip?: number;
}): Promise<NPISearchResponse> {
  let taxonomy: string;

  switch (params.facilityType) {
    case "skilled_nursing":
      taxonomy = TAXONOMY_CATEGORIES.SKILLED_NURSING_FACILITY;
      break;
    case "assisted_living":
      taxonomy = TAXONOMY_CATEGORIES.ASSISTED_LIVING;
      break;
    case "nursing_home":
      taxonomy = TAXONOMY_CATEGORIES.NURSING_HOME;
      break;
    default:
      taxonomy = "Nursing"; // Matches all nursing-related facilities
  }

  return searchOrganizations({
    name: params.name,
    facilityType: taxonomy,
    city: params.city,
    state: params.state,
    zipCode: params.zipCode,
    limit: params.limit,
    skip: params.skip,
  });
}

/**
 * Search for clinics and medical practices
 */
export async function searchClinics(params: {
  name?: string;
  specialty?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  limit?: number;
  skip?: number;
}): Promise<NPISearchResponse> {
  return searchOrganizations({
    name: params.name,
    facilityType: params.specialty ?? TAXONOMY_CATEGORIES.CLINIC,
    city: params.city,
    state: params.state,
    zipCode: params.zipCode,
    limit: params.limit,
    skip: params.skip,
  });
}

/**
 * Search for pharmacies
 */
export async function searchPharmacies(params: {
  name?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  limit?: number;
  skip?: number;
}): Promise<NPISearchResponse> {
  return searchOrganizations({
    name: params.name,
    facilityType: TAXONOMY_CATEGORIES.PHARMACY,
    city: params.city,
    state: params.state,
    zipCode: params.zipCode,
    limit: params.limit,
    skip: params.skip,
  });
}

/**
 * Comprehensive healthcare provider search (individuals + organizations)
 * Searches by first name, last name, and organization name for maximum coverage.
 * When a single word is typed, it searches as both first name AND last name
 * so that typing either "John" or "Smith" will find "John Smith".
 */
export async function searchAllProviders(params: {
  query?: string;
  specialty?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<{
  individuals: NPIResult[];
  organizations: NPIResult[];
  totalCount: number;
}> {
  const limit = Math.min((params.limit ?? 50), 100);
  const query = params.query?.trim();

  if (!query || query.length < 2) {
    return { individuals: [], organizations: [], totalCount: 0 };
  }

  // Clean the query - remove common prefixes like "Dr.", "Dr", etc.
  const cleanedQuery = query.replace(/^(dr\.?\s*|doctor\s+)/i, "").trim();

  // Split query into potential first/last name parts
  const nameParts = cleanedQuery.split(/\s+/).filter(p => p.length > 0);

  // Build search promises
  const searchPromises: Promise<NPISearchResponse>[] = [];

  const signal = params.signal;

  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    searchPromises.push(
      searchNPIRegistry({
        enumeration_type: "1",
        first_name: firstName,
        last_name: lastName,
        taxonomy_description: params.specialty,
        city: params.city,
        state: params.state,
        postal_code: params.zipCode,
        limit: Math.ceil(limit * 0.4),
        use_first_name_alias: true,
        signal,
      })
    );

    searchPromises.push(
      searchNPIRegistry({
        enumeration_type: "1",
        first_name: lastName,
        last_name: firstName,
        taxonomy_description: params.specialty,
        city: params.city,
        state: params.state,
        postal_code: params.zipCode,
        limit: Math.ceil(limit * 0.15),
        use_first_name_alias: true,
        signal,
      })
    );

    searchPromises.push(
      searchNPIRegistry({
        enumeration_type: "1",
        first_name: firstName,
        last_name: lastName,
        taxonomy_description: params.specialty,
        limit: Math.ceil(limit * 0.3),
        use_first_name_alias: true,
        signal,
      })
    );
  } else {
    searchPromises.push(
      searchNPIRegistry({
        enumeration_type: "1",
        last_name: cleanedQuery,
        taxonomy_description: params.specialty,
        city: params.city,
        state: params.state,
        postal_code: params.zipCode,
        limit: Math.ceil(limit * 0.4),
        use_first_name_alias: true,
        signal,
      })
    );

    searchPromises.push(
      searchNPIRegistry({
        enumeration_type: "1",
        first_name: cleanedQuery,
        taxonomy_description: params.specialty,
        city: params.city,
        state: params.state,
        postal_code: params.zipCode,
        limit: Math.ceil(limit * 0.3),
        use_first_name_alias: true,
        signal,
      })
    );

    if (params.city) {
      searchPromises.push(
        searchNPIRegistry({
          enumeration_type: "1",
          last_name: cleanedQuery,
          taxonomy_description: params.specialty,
          state: params.state,
          limit: Math.ceil(limit * 0.2),
          use_first_name_alias: true,
          signal,
        })
      );
    }
  }

  // Always search organizations by name
  searchPromises.push(
    searchNPIRegistry({
      enumeration_type: "2",
      organization_name: cleanedQuery,
      taxonomy_description: params.specialty,
      city: params.city,
      state: params.state,
      postal_code: params.zipCode,
      limit: Math.ceil(limit * 0.3),
      signal,
    })
  );

  // Use allSettled so one failed request doesn't discard all results
  const settled = await Promise.allSettled(searchPromises);

  if (signal?.aborted) {
    return { individuals: [], organizations: [], totalCount: 0 };
  }

  // Extract successful responses
  const responses: NPISearchResponse[] = settled.map(r =>
    r.status === "fulfilled" ? r.value : { result_count: 0, results: [] }
  );

  // Organization response is always the last one
  const orgResponse = responses[responses.length - 1];
  const individualResponses = responses.slice(0, -1);

  // Combine and deduplicate individual results
  const existingNPIs = new Set<string>();
  const allIndividuals: NPIResult[] = [];

  for (const response of individualResponses) {
    if (response.results) {
      for (const result of response.results) {
        if (!existingNPIs.has(result.number)) {
          allIndividuals.push(result);
          existingNPIs.add(result.number);
        }
      }
    }
  }

  return {
    individuals: allIndividuals,
    organizations: orgResponse.results ?? [],
    totalCount: allIndividuals.length + (orgResponse.result_count ?? 0),
  };
}

/**
 * Helper to format NPI result into a simple provider object
 */
export interface FormattedProvider {
  npi: string;
  name: string;
  type: "individual" | "organization";
  specialty: string;
  credentials?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  fax?: string;
  lastUpdated?: string;
  /** For organizations: the authorized official (doctor) name if available */
  authorizedOfficialName?: string;
}

function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .split(" ")
    .map(word => {
      if (word.length <= 1) return word.toUpperCase();
      if (word === word.toUpperCase() && word.length > 2) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(" ");
}

export function formatNPIResult(result: NPIResult): FormattedProvider {
  // The API returns "NPI-1" for individuals and "NPI-2" for organizations
  const rawType = String(result.enumeration_type || "");
  const isIndividual = rawType === "NPI-1" || rawType === "individual";
  const normalizedType: "individual" | "organization" = isIndividual ? "individual" : "organization";

  const primaryAddress = result.addresses?.find(a => a.address_purpose === "LOCATION")
    ?? result.addresses?.[0];
  const primaryTaxonomy = result.taxonomies?.find(t => t.primary)
    ?? result.taxonomies?.[0];

  let name: string;
  if (isIndividual) {
    const firstName = toTitleCase(result.basic.first_name ?? "");
    const lastName = toTitleCase(result.basic.last_name ?? "");
    const credential = result.basic.credential ? `, ${result.basic.credential}` : "";
    name = `${firstName} ${lastName}${credential}`.trim();
  } else {
    const orgName = toTitleCase(
      result.basic.organization_name
      || result.other_names?.[0]?.organization_name
      || ""
    );

    let officialName = "";
    if (result.basic.authorized_official_last_name) {
      const officialFirst = toTitleCase(result.basic.authorized_official_first_name || "");
      const officialLast = toTitleCase(result.basic.authorized_official_last_name || "");
      officialName = `${officialFirst} ${officialLast}`.trim();
    }

    if (orgName) {
      name = orgName;
    } else if (officialName) {
      name = `Dr. ${officialName} - ${primaryTaxonomy?.desc || "Practice"}`;
    } else {
      name = primaryTaxonomy?.desc ? `${primaryTaxonomy.desc} Practice` : "";
    }
  }

  let authorizedOfficialName: string | undefined;
  if (!isIndividual && result.basic.authorized_official_last_name) {
    const officialFirst = toTitleCase(result.basic.authorized_official_first_name || "");
    const officialLast = toTitleCase(result.basic.authorized_official_last_name || "");
    authorizedOfficialName = `${officialFirst} ${officialLast}`.trim();
  }

  return {
    npi: result.number,
    name,
    type: normalizedType,
    specialty: primaryTaxonomy?.desc ?? "General",
    credentials: isIndividual ? result.basic.credential : undefined,
    address: toTitleCase([primaryAddress?.address_1, primaryAddress?.address_2].filter(Boolean).join(", ")),
    city: toTitleCase(primaryAddress?.city ?? ""),
    state: primaryAddress?.state ?? "",
    zipCode: primaryAddress?.postal_code?.substring(0, 5) ?? "",
    phone: primaryAddress?.telephone_number,
    fax: primaryAddress?.fax_number,
    lastUpdated: result.basic.last_updated,
    authorizedOfficialName,
  };
}

/**
 * Format multiple NPI results
 */
export function formatNPIResults(results: NPIResult[]): FormattedProvider[] {
  return results.map(formatNPIResult);
}

/**
 * Get estimated provider counts by category
 * Note: These are approximate figures based on NPI registry statistics
 */
export const NPI_REGISTRY_STATS = {
  totalProviders: 8_500_000,
  individualProviders: 6_000_000,
  organizations: 2_500_000,
  hospitals: 7_500,
  nursingFacilities: 28_000,
  skilledNursingFacilities: 15_000,
  pharmacies: 90_000,
  clinics: 150_000,
  homeHealthAgencies: 35_000,
  lastUpdated: "Real-time (CMS maintains this database)",
} as const;
