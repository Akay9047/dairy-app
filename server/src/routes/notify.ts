import { Router, Response } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

function buildMessage(entry: any): string {
  const d = new Date(entry.date);
  const dateStr = d.toLocaleDateString("en-IN");
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `🐄 *SMART DAIRY SOLUTION*
Aapki Apni Digital Dairy

📅 Date: ${dateStr}
⏰ Time: ${timeStr} (${entry.shift === "MORNING" ? "Subah ☀️" : "Shaam 🌙"})
👨‍🌾 Kisaan: ${entry.farmer.name} (${entry.farmer.code})
📱 Mobile: ${entry.farmer.mobile}
🏘️ Gaon: ${entry.farmer.village}

🥛 Doodh: *${entry.liters.toFixed(2)} Liter*
💧 Fat: *${entry.fatPercent.toFixed(1)}%*
📊 SNF: ${entry.snfPercent?.toFixed(2) ?? "-"}%
💰 Rate/Liter: ₹${entry.ratePerLiter.toFixed(2)}
✅ *Kul Rakam: ₹${entry.totalAmount.toFixed(2)}*

🙏 Aapke vishwas ka shukriya!
_Thank you for your trust!_`;
}

// Send WhatsApp
router.post("/whatsapp/:entryId", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.milkEntry.findFirst({
      where: { id: req.params.entryId, dairyId: req.dairyId },
      include: { farmer: true },
    });
    if (!entry) return res.status(404).json({ error: "Entry nahi mili" });

    const message = buildMessage(entry);
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      // Return message for manual sharing if API not configured
      return res.status(200).json({
        success: false,
        configured: false,
        message,
        whatsappUrl: `https://wa.me/91${entry.farmer.mobile}?text=${encodeURIComponent(message)}`,
        error: "WhatsApp API configure nahi hai — manual link provide kar rahe hain",
      });
    }

    const phone = `91${entry.farmer.mobile.replace(/^(\+91|91)/, "")}`;
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      { messaging_product: "whatsapp", to: phone, type: "text", text: { body: message } },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    res.json({ success: true, message: "WhatsApp message bhej diya! ✅" });
  } catch (err: any) {
    console.error("WhatsApp error:", err.response?.data || err.message);
    res.status(500).json({ error: "WhatsApp message nahi gaya", details: err.response?.data });
  }
});

// Send SMS via Twilio
router.post("/sms/:entryId", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.milkEntry.findFirst({
      where: { id: req.params.entryId, dairyId: req.dairyId },
      include: { farmer: true },
    });
    if (!entry) return res.status(404).json({ error: "Entry nahi mili" });

    const smsText = `Smart Dairy: ${entry.farmer.name}, Doodh ${entry.liters}L, Fat ${entry.fatPercent}%, Rate Rs${entry.ratePerLiter}/L, Kul Rs${entry.totalAmount}. Shukriya!`;

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE;

    if (!sid || !auth || !from) {
      return res.status(200).json({
        success: false,
        configured: false,
        previewMessage: smsText,
        error: "SMS API configure nahi hai — preview de rahe hain",
      });
    }

    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      new URLSearchParams({ From: from, To: `+91${entry.farmer.mobile}`, Body: smsText }),
      { auth: { username: sid, password: auth } }
    );
    res.json({ success: true, message: "SMS bhej diya! ✅" });
  } catch (err: any) {
    res.status(500).json({ error: "SMS nahi gaya", details: err.response?.data });
  }
});

export default router;
