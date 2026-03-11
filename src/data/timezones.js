export const SINGAPORE_TZ = "Asia/Singapore";

// City-first list for better UX. Some cities share the same IANA timezone id intentionally.
export const TIMEZONE_OPTIONS = [
  // Southeast Asia
  { id: "Asia/Singapore", label: "Singapore" },
  { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur" },
  { id: "Asia/Bangkok", label: "Bangkok" },
  { id: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh City" },
  { id: "Asia/Jakarta", label: "Jakarta" },
  { id: "Asia/Makassar", label: "Bali" },
  { id: "Asia/Manila", label: "Manila" },

  // Greater China / East Asia
  { id: "Asia/Shanghai", label: "Beijing" },
  { id: "Asia/Shanghai", label: "Shanghai" },
  { id: "Asia/Hong_Kong", label: "Hong Kong" },
  { id: "Asia/Taipei", label: "Taipei" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Asia/Seoul", label: "Seoul" },

  // Central / South Asia
  { id: "Asia/Almaty", label: "Almaty" },
  { id: "Asia/Almaty", label: "Astana" },
  { id: "Asia/Tashkent", label: "Tashkent" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Kolkata", label: "Mumbai" },
  { id: "Asia/Kolkata", label: "New Delhi" },
  { id: "Asia/Karachi", label: "Karachi" },

  // Europe
  { id: "Europe/Moscow", label: "Moscow" },
  { id: "Europe/Istanbul", label: "Istanbul" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Dublin", label: "Dublin" },
  { id: "Europe/Lisbon", label: "Lisbon" },
  { id: "Europe/Madrid", label: "Madrid" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Europe/Brussels", label: "Brussels" },
  { id: "Europe/Berlin", label: "Berlin" },
  { id: "Europe/Amsterdam", label: "Amsterdam" },
  { id: "Europe/Zurich", label: "Zurich" },
  { id: "Europe/Rome", label: "Rome" },
  { id: "Europe/Stockholm", label: "Stockholm" },
  { id: "Europe/Helsinki", label: "Helsinki" },
  { id: "Europe/Warsaw", label: "Warsaw" },
  { id: "Europe/Athens", label: "Athens" },

  // Africa
  { id: "Africa/Cairo", label: "Cairo" },
  { id: "Africa/Lagos", label: "Lagos" },
  { id: "Africa/Nairobi", label: "Nairobi" },
  { id: "Africa/Johannesburg", label: "Johannesburg" },

  // Australia / NZ / Pacific
  { id: "Australia/Perth", label: "Perth" },
  { id: "Australia/Adelaide", label: "Adelaide" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Australia/Melbourne", label: "Melbourne" },
  { id: "Australia/Brisbane", label: "Brisbane" },
  { id: "Australia/Darwin", label: "Darwin" },
  { id: "Pacific/Auckland", label: "Auckland" },
  { id: "Pacific/Wellington", label: "Wellington" },
  { id: "Pacific/Chatham", label: "Chatham" },
  { id: "Pacific/Fiji", label: "Fiji" },
  { id: "Pacific/Honolulu", label: "Honolulu" },

  // North America
  { id: "America/Toronto", label: "Toronto" },
  { id: "America/Vancouver", label: "Vancouver" },
  { id: "America/New_York", label: "New York" },
  { id: "America/New_York", label: "Miami" },
  { id: "America/Chicago", label: "Chicago" },
  { id: "America/Denver", label: "Denver" },
  { id: "America/Phoenix", label: "Phoenix" },
  { id: "America/Los_Angeles", label: "Los Angeles" },
  { id: "America/Anchorage", label: "Anchorage" },
  { id: "America/Mexico_City", label: "Mexico City" },
  { id: "America/Bogota", label: "Bogota" },

  // South America
  { id: "America/Lima", label: "Lima" },
  { id: "America/Santiago", label: "Santiago" },
  { id: "America/Sao_Paulo", label: "Sao Paulo" },
  { id: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },

  // Utility
  { id: "UTC", label: "UTC" },
];
