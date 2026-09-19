// Somali phone numbers are stored without a country code (e.g. "615202020").
// WhatsApp requires E.164 format, so default any number with no "+" to +252 (Somalia).
const normalizePhone = (phone) => {
  let p = (phone || "").replace(/[\s-]/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("252")) return `+${p}`;
  if (p.startsWith("0")) p = p.slice(1);
  return `+252${p}`;
};

// Sends an OTP over WhatsApp via the Twilio API using native fetch (no SDK).
const sendOtpWhatsapp = async (phone, otpCode) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("WhatsApp OTP lama dirin: Twilio lama dejin (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM).");
  }

  const to = normalizePhone(phone);
  const body = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    Body: `Taysir Foundation: Lambarkaaga xaqiijinta (OTP) waa ${otpCode}. Wuxuu dhacayaa 10 daqiiqo gudahood. Ha la wadaagin qof kale.`,
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp OTP lama dirin: ${errText}`);
  }
};

module.exports = { sendOtpWhatsapp, normalizePhone };
