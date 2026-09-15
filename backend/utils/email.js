// Sends transactional email via the Resend REST API using Node's built-in fetch
// (no SDK dependency needed). Requires RESEND_API_KEY in the environment.
// RESEND_FROM_EMAIL can be set once a sending domain is verified on Resend;
// until then it falls back to Resend's shared testing address.
const sendOtpEmail = async (to, otpCode) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("RESEND_API_KEY lama dejinin server-ka.");
    err.statusCode = 500;
    throw err;
  }
  const from = process.env.RESEND_FROM_EMAIL || "Taysir Foundation <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Koodhkaaga OTP: ${otpCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
          <h2 style="color:#1F3A5F;">Taysir Foundation</h2>
          <p>Koodhkaaga soo gelitaanka (OTP) waa:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color:#1F3A5F;">${otpCode}</p>
          <p style="color:#777; font-size: 13px;">Koodhkani wuxuu dhici doonaa 10 daqiiqo gudahood. Haddii aadan codsan, iska indho tir email-kan.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Email-ka lama dirin: ${body}`);
    err.statusCode = 502;
    throw err;
  }
};

module.exports = { sendOtpEmail };
