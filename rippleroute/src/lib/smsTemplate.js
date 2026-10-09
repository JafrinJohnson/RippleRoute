/**
 * RippleRoute - Customer Delay Notification Template Builder
 * Generates natural English and Tamil delay notifications for WhatsApp and customer messaging.
 */

/**
 * Builds a natural delay notification message for customers in English or Tamil.
 * Trims to a maximum of 320 characters.
 * 
 * @param {Object} params
 * @param {string} params.customerName Customer full name or contact name
 * @param {string} params.code Order/Delivery code (e.g. DEL-GANDHI-01)
 * @param {string} params.reason Short reason for the delay (e.g. heavy rain, accident)
 * @param {string} params.etaText Assured arrival time (e.g. by 4:45 PM)
 * @param {string} [params.lang="en"] Language code ("en" | "ta")
 * @returns {string} Trimmed message string (max 320 chars)
 */
export function buildCustomerSms({
  customerName = "Customer",
  code = "DEL-01",
  reason = "road disruption",
  etaText = "shortly",
  lang = "en",
} = {}) {
  const firstName = (customerName || "Customer").trim().split(/\s+/)[0] || "Customer";

  let text = "";
  if (lang === "ta") {
    text = `வணக்கம் ${firstName}, உங்கள் KovaiSwift ஆர்டர் ${code} ${reason} காரணமாக தாமதமாகியுள்ளது. எங்கள் ஓட்டுநர் பாதுகாப்பான வழியில் பயணிக்கிறார். உறுதிசெய்யப்பட்ட வருகை நேரம்: ${etaText}. - KovaiSwift Logistics`;
  } else {
    text = `Hi ${firstName}, your KovaiSwift order ${code} is delayed due to ${reason}. Our driver is taking a safer route. Assured arrival: ${etaText}. - KovaiSwift Logistics`;
  }

  return text.length > 320 ? text.slice(0, 320) : text;
}

export default buildCustomerSms;
