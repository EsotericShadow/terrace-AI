// Mapping of document titles to their official terrace.ca URLs
// This ensures users can always access the full official documents

export const DOCUMENT_URL_MAP: Record<string, string> = {
  // Bylaws - exact matching
  '1724': 'https://www.terrace.ca/media/3902',
  'Access to Information and Fees and Charges': 'https://www.terrace.ca/media/3902',
  '2122': 'https://www.terrace.ca/media/430',
  'Airport Revitalization Tax Exemption': 'https://www.terrace.ca/media/430',
  '1702': 'https://www.terrace.ca/media/36',
  'All Terrain Vehicles Regulation Bylaw': 'https://www.terrace.ca/media/36',
  '2159': 'https://www.terrace.ca/media/3998',
  'Animal Control Consolidated Bylaw': 'https://www.terrace.ca/media/3998',
  '2159_Animal_Control_Consolidated_bylaw.pdf': 'https://www.terrace.ca/media/3998',
  '2284': 'https://www.terrace.ca/media/3998', // Animal Control Amendment
  '2284 23 Animal Control Amendment Bylaw 0': 'https://www.terrace.ca/media/3998',
  '1721': 'https://www.terrace.ca/media/3958',
  'Board of Variance Bylaw': 'https://www.terrace.ca/media/3958',
  '2307': 'https://www.terrace.ca/media/3959',
  'Building Bylaw': 'https://www.terrace.ca/media/3959',
  '2244': 'https://www.terrace.ca/media/3960',
  'Business Improvement Area Bylaw': 'https://www.terrace.ca/media/3960',
  '2112-2016': 'https://www.terrace.ca/media/3962',
  'Business Licence Consolidated Bylaw': 'https://www.terrace.ca/media/3962',
  '1471': 'https://www.terrace.ca/media/3963',
  'Campground Bylaw': 'https://www.terrace.ca/media/3963',
  '1279-1992': 'https://www.terrace.ca/media/3910',
  'Cemeteries Regulation Bylaw': 'https://www.terrace.ca/media/3910',
  '1953': 'https://www.terrace.ca/media/3911',
  'Controlled Substance Property Remediation Bylaw': 'https://www.terrace.ca/media/3911',
  '2314': 'https://www.terrace.ca/media/3912',
  'Council Procedure Bylaw': 'https://www.terrace.ca/media/3912',
  '1876': 'https://www.terrace.ca/media/3913',
  'Council Remuneration and Benefits Bylaw': 'https://www.terrace.ca/media/3913',
  '2238': 'https://www.terrace.ca/media/3914',
  'Development Cost Charges Bylaw': 'https://www.terrace.ca/media/3914',
  '1460': 'https://www.terrace.ca/media/3915',
  'Development Permit Procedures Bylaw': 'https://www.terrace.ca/media/3915',
  '2329-2025': 'https://www.terrace.ca/media/4096',
  'Downtown Revitalization Tax Exemption Bylaw': 'https://www.terrace.ca/media/4096',
  '1915': 'https://www.terrace.ca/media/3919',
  'Emergency Program Bylaw': 'https://www.terrace.ca/media/3919',
  '2316-2025': 'https://www.terrace.ca/media/4106',
  'Financial Plan Bylaw 2025-2029': 'https://www.terrace.ca/media/4106',
  '2260-2022': 'https://www.terrace.ca/media/3546',
  'Fire Prevention Bylaw': 'https://www.terrace.ca/media/3546',
  '1722': 'https://www.terrace.ca/media/3921',
  'Freedom of Information Bylaw': 'https://www.terrace.ca/media/3921',
  '1463': 'https://www.terrace.ca/media/3922',
  'Highway Naming and Block Numbering': 'https://www.terrace.ca/media/3922',
  '2099-2016': 'https://www.terrace.ca/media/3924',
  'Manufactured Home Park Bylaw': 'https://www.terrace.ca/media/3924',
  '2100-2016': 'https://www.terrace.ca/media/3926',
  'Noise Control Bylaw': 'https://www.terrace.ca/media/3926',
  '1318-1993': 'https://www.terrace.ca/media/3927',
  'Nuisance Bylaw Consolidated': 'https://www.terrace.ca/media/3927',
  '2142': 'https://www.terrace.ca/media/3930',
  'Official Community Plan': 'https://www.terrace.ca/media/3930',
  '1942': 'https://www.terrace.ca/media/3932',
  'Parks and Public Places Bylaw Consolidated': 'https://www.terrace.ca/media/3932',
  '2289-2024': 'https://www.terrace.ca/media/3920',
  'Parks, Recreation & Culture Fees and Charges': 'https://www.terrace.ca/media/3920',
  '1978': 'https://www.terrace.ca/media/3933',
  'Pesticides for Non-Essential Purposes': 'https://www.terrace.ca/media/3933',
  '2058': 'https://www.terrace.ca/media/3934',
  'Planning Fees Bylaw Consolidated': 'https://www.terrace.ca/media/3934',
  '2058_Planning_Fees_Consolidated_bylaw.pdf': 'https://www.terrace.ca/media/3934',
  '1709': 'https://www.terrace.ca/media/3935',
  'Private Swimming Pool Bylaw': 'https://www.terrace.ca/media/3935',
  '2315': 'https://www.terrace.ca/media/3936',
  'Public Notice Bylaw': 'https://www.terrace.ca/media/3936',
  '2257-2022': 'https://www.terrace.ca/media/3937',
  'Safe Streets Bylaw': 'https://www.terrace.ca/media/3937',
  '1373': 'https://www.terrace.ca/media/3939',
  'Security Alarm Bylaw': 'https://www.terrace.ca/media/3939',
  '1327': 'https://www.terrace.ca/media/3940',
  'Sewer Connection and Rates Bylaw': 'https://www.terrace.ca/media/3940',
  '1574': 'https://www.terrace.ca/media/3941',
  'Sewer Frontage Tax Bylaw': 'https://www.terrace.ca/media/3941',
  '2102': 'https://www.terrace.ca/media/3943',
  'Sign Regulation Bylaw': 'https://www.terrace.ca/media/3943',
  '2130 - 2017': 'https://www.terrace.ca/media/3945',
  'Solid Waste Operations Bylaw': 'https://www.terrace.ca/media/3945',
  '2017': 'https://www.terrace.ca/media/3947',
  'Standards of Maintenance Bylaw': 'https://www.terrace.ca/media/3947',
  '1313': 'https://www.terrace.ca/media/3948',
  'Street & Traffic Regulations Consolidated Bylaw': 'https://www.terrace.ca/media/3948',
  '1888': 'https://www.terrace.ca/media/3949',
  'Tax Installment Payment Bylaw': 'https://www.terrace.ca/media/3949',
  '2327': 'https://www.terrace.ca/media/3997',
  'Tax Rates Bylaw 2025': 'https://www.terrace.ca/media/3997',
  '1827-2005': 'https://www.terrace.ca/media/3951',
  'Ticket Information Utilization Bylaw': 'https://www.terrace.ca/media/3951',
  '1326': 'https://www.terrace.ca/media/3953',
  'Water Distribution & Sale Consolidated Bylaw': 'https://www.terrace.ca/media/3953',
  '1326_Water_Distribution_and_Sale_Consolidated_bylaw.pdf': 'https://www.terrace.ca/media/3953',
  '1573': 'https://www.terrace.ca/media/3954',
  'Water Frontage Tax Consolidated Bylaw': 'https://www.terrace.ca/media/3954',
  '1952': 'https://www.terrace.ca/media/3955',
  'Wood Burning Appliance Installation and Operation Bylaw': 'https://www.terrace.ca/media/3955',
  '1972': 'https://www.terrace.ca/media/3956',
  'Wood First Bylaw': 'https://www.terrace.ca/media/3956',
  '2069-2014': 'https://www.terrace.ca/media/3985',
  'Zoning Consolidated Bylaw': 'https://www.terrace.ca/media/3985',
};

/**
 * Find the official terrace.ca URL for a document
 * @param documentTitle - The title of the document
 * @returns The URL or null if not found
 */
export function getDocumentUrl(documentTitle: string): string | null {
  // Try exact match first
  if (DOCUMENT_URL_MAP[documentTitle]) {
    return DOCUMENT_URL_MAP[documentTitle];
  }

  // Try fuzzy matching - check if title contains any key
  const lowerTitle = documentTitle.toLowerCase();
  for (const [key, url] of Object.entries(DOCUMENT_URL_MAP)) {
    if (lowerTitle.includes(key.toLowerCase())) {
      return url;
    }
  }

  // Try extracting bylaw number (e.g., "2159" from "2159_Animal_Control_Consolidated_bylaw.pdf")
  const bylawMatch = documentTitle.match(/(\d{4})/);
  if (bylawMatch) {
    const bylawNum = bylawMatch[1];
    if (DOCUMENT_URL_MAP[bylawNum]) {
      return DOCUMENT_URL_MAP[bylawNum];
    }
  }

  return null;
}

