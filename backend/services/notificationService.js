function normalizePhoneForWhatsApp(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function createManualWhatsAppUrl(phone, message) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  if (!normalizedPhone) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function buildBloodRequestMessage({ request, donor, matchType, distanceKm }) {
  const emergencyLine = request.urgency === "critical"
    ? "Critical emergency request. Please respond only if you are healthy, available, and able to donate through a licensed hospital or blood bank."
    : "Please respond only if you are healthy and available.";

  return [
    "B Donor voluntary blood request alert",
    `Required blood group: ${request.bloodGroupRequired}`,
    `Your blood group: ${donor.bloodGroup || "Not provided"}`,
    `Match type: ${matchType === "compatible" ? "Emergency compatible match" : "Exact match"}`,
    `Approx distance: ${distanceKm?.toFixed ? distanceKm.toFixed(1) : distanceKm} km`,
    `Hospital/place: ${request.hospitalName || request.city || "Not provided"}`,
    emergencyLine,
    "B Donor only connects voluntary donors. Collection, testing, transfusion, and storage must be handled by licensed medical professionals."
  ].join("\n");
}

module.exports = {
  buildBloodRequestMessage,
  createManualWhatsAppUrl,
  normalizePhoneForWhatsApp
};
