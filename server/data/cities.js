// cities.js
// Static city list for the location picker. Selecting a city passes its lat/lon
// to the same OpenAQ nearest-station lookup used by "Use My Current Location".
// `popular: true` cities are pinned to the top of the picker.

export const CITIES = [
  // ---- Delhi NCR (core winter-smog region) ----
  { name: "Delhi", state: "Delhi", lat: 28.6139, lon: 77.2090, popular: true },
  { name: "Noida", state: "Uttar Pradesh", lat: 28.5355, lon: 77.3910, popular: true },
  { name: "Greater Noida", state: "Uttar Pradesh", lat: 28.4744, lon: 77.5040 },
  { name: "Gurugram", state: "Haryana", lat: 28.4595, lon: 77.0266, popular: true },
  { name: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6692, lon: 77.4538, popular: true },
  { name: "Faridabad", state: "Haryana", lat: 28.4089, lon: 77.3178 },
  { name: "Sonipat", state: "Haryana", lat: 28.9288, lon: 77.0913 },
  { name: "Bahadurgarh", state: "Haryana", lat: 28.6928, lon: 76.9237 },
  { name: "Bhiwadi", state: "Rajasthan", lat: 28.2100, lon: 76.8600 },

  // ---- Metros / major cities ----
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lon: 72.8777, popular: true },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567, popular: true },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5946, popular: true },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707, popular: true },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639, popular: true },
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lon: 78.4867, popular: true },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714, popular: true },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462, popular: true },
  { name: "Patna", state: "Bihar", lat: 25.5941, lon: 85.1376, popular: true },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lon: 75.7873, popular: true },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lon: 76.7794, popular: true },

  // ---- Uttar Pradesh ----
  { name: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lon: 80.3319 },
  { name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lon: 78.0081 },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  { name: "Prayagraj", state: "Uttar Pradesh", lat: 25.4358, lon: 81.8463 },
  { name: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lon: 77.7064 },
  { name: "Gorakhpur", state: "Uttar Pradesh", lat: 26.7606, lon: 83.3732 },
  { name: "Aligarh", state: "Uttar Pradesh", lat: 27.8974, lon: 78.0880 },
  { name: "Bareilly", state: "Uttar Pradesh", lat: 28.3670, lon: 79.4304 },
  { name: "Moradabad", state: "Uttar Pradesh", lat: 28.8386, lon: 78.7733 },

  // ---- Haryana / Punjab / Himachal / J&K / Uttarakhand ----
  { name: "Rohtak", state: "Haryana", lat: 28.8955, lon: 76.6066 },
  { name: "Panipat", state: "Haryana", lat: 29.3909, lon: 76.9635 },
  { name: "Karnal", state: "Haryana", lat: 29.6857, lon: 76.9905 },
  { name: "Hisar", state: "Haryana", lat: 29.1492, lon: 75.7217 },
  { name: "Amritsar", state: "Punjab", lat: 31.6340, lon: 74.8723 },
  { name: "Ludhiana", state: "Punjab", lat: 30.9010, lon: 75.8573 },
  { name: "Jalandhar", state: "Punjab", lat: 31.3260, lon: 75.5762 },
  { name: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lon: 77.1734 },
  { name: "Jammu", state: "Jammu & Kashmir", lat: 32.7266, lon: 74.8570 },
  { name: "Srinagar", state: "Jammu & Kashmir", lat: 34.0837, lon: 74.7973 },
  { name: "Dehradun", state: "Uttarakhand", lat: 30.3165, lon: 78.0322 },

  // ---- Rajasthan ----
  { name: "Jodhpur", state: "Rajasthan", lat: 26.2389, lon: 73.0243 },
  { name: "Udaipur", state: "Rajasthan", lat: 24.5854, lon: 73.7125 },
  { name: "Kota", state: "Rajasthan", lat: 25.2138, lon: 75.8648 },
  { name: "Ajmer", state: "Rajasthan", lat: 26.4499, lon: 74.6399 },
  { name: "Bikaner", state: "Rajasthan", lat: 28.0229, lon: 73.3119 },

  // ---- Madhya Pradesh / Chhattisgarh ----
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  { name: "Gwalior", state: "Madhya Pradesh", lat: 26.2183, lon: 78.1828 },
  { name: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lon: 79.9864 },
  { name: "Ujjain", state: "Madhya Pradesh", lat: 23.1765, lon: 75.7885 },
  { name: "Raipur", state: "Chhattisgarh", lat: 21.2514, lon: 81.6296 },

  // ---- Gujarat / Maharashtra / Goa ----
  { name: "Surat", state: "Gujarat", lat: 21.1702, lon: 72.8311 },
  { name: "Vadodara", state: "Gujarat", lat: 22.3072, lon: 73.1812 },
  { name: "Rajkot", state: "Gujarat", lat: 22.3039, lon: 70.8022 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lon: 79.0882 },
  { name: "Nashik", state: "Maharashtra", lat: 19.9975, lon: 73.7898 },
  { name: "Thane", state: "Maharashtra", lat: 19.2183, lon: 72.9781 },
  { name: "Navi Mumbai", state: "Maharashtra", lat: 19.0330, lon: 73.0297 },
  { name: "Chhatrapati Sambhajinagar (Aurangabad)", state: "Maharashtra", lat: 19.8762, lon: 75.3433 },
  { name: "Panaji", state: "Goa", lat: 15.4909, lon: 73.8278 },

  // ---- Bihar / Jharkhand / Odisha / West Bengal ----
  { name: "Gaya", state: "Bihar", lat: 24.7955, lon: 85.0002 },
  { name: "Muzaffarpur", state: "Bihar", lat: 26.1209, lon: 85.3647 },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lon: 85.3096 },
  { name: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lon: 86.2029 },
  { name: "Dhanbad", state: "Jharkhand", lat: 23.7957, lon: 86.4304 },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lon: 85.8245 },
  { name: "Cuttack", state: "Odisha", lat: 20.4625, lon: 85.8830 },
  { name: "Howrah", state: "West Bengal", lat: 22.5958, lon: 88.2636 },
  { name: "Asansol", state: "West Bengal", lat: 23.6739, lon: 86.9524 },
  { name: "Siliguri", state: "West Bengal", lat: 26.7271, lon: 88.3953 },

  // ---- North-East ----
  { name: "Guwahati", state: "Assam", lat: 26.1445, lon: 91.7362 },
  { name: "Shillong", state: "Meghalaya", lat: 25.5788, lon: 91.8933 },
  { name: "Imphal", state: "Manipur", lat: 24.8170, lon: 93.9368 },
  { name: "Agartala", state: "Tripura", lat: 23.8315, lon: 91.2868 },
  { name: "Gangtok", state: "Sikkim", lat: 27.3389, lon: 88.6065 },

  // ---- South India ----
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lon: 80.6480 },
  { name: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lon: 79.4192 },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lon: 76.9558 },
  { name: "Madurai", state: "Tamil Nadu", lat: 9.9252, lon: 78.1198 },
  { name: "Tiruchirappalli", state: "Tamil Nadu", lat: 10.7905, lon: 78.7047 },
  { name: "Puducherry", state: "Puducherry", lat: 11.9416, lon: 79.8083 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lon: 76.2673 },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lon: 76.9366 },
  { name: "Kozhikode", state: "Kerala", lat: 11.2588, lon: 75.7804 },
  { name: "Mysuru", state: "Karnataka", lat: 12.2958, lon: 76.6394 },
  { name: "Mangaluru", state: "Karnataka", lat: 12.9141, lon: 74.8560 },
  { name: "Hubballi", state: "Karnataka", lat: 15.3647, lon: 75.1240 },
];

// ---- Helpers ----

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Popular cities first, then everything else alphabetically.
export const SORTED_CITIES = [...CITIES].sort((a, b) => {
  if (!!b.popular !== !!a.popular) return b.popular ? 1 : -1;
  return a.name.localeCompare(b.name);
});

// Case-insensitive search on city name or state. Empty query returns all.
export function searchCities(query = "") {
  const q = norm(query);
  if (!q) return SORTED_CITIES;
  return SORTED_CITIES.filter(
    (c) => norm(c.name).includes(q) || norm(c.state).includes(q)
  );
}
