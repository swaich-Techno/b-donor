const EMERGENCY_KEYWORDS = [
  "chest pain",
  "difficulty breathing",
  "breathless",
  "stroke",
  "seizure",
  "unconscious",
  "severe bleeding",
  "blood vomiting",
  "suicidal",
  "poison",
  "pregnancy bleeding"
];

const PRESCRIPTION_KEYWORDS = ["prescription", "medicine dose", "antibiotic", "tablet dosage", "prescribe"];

function detectEmergency(message = "") {
  const text = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => text.includes(keyword));
}

function asksForPrescription(message = "") {
  const text = message.toLowerCase();
  return PRESCRIPTION_KEYWORDS.some((keyword) => text.includes(keyword));
}

function localHealthAssistantReply(message = "") {
  if (asksForPrescription(message)) {
    return {
      reply: "Only an approved doctor can provide prescription through B Donor. I can help prepare a symptom summary and questions to discuss with a doctor.",
      redFlags: [],
      possibleConcerns: [],
      followUpQuestions: ["How long have you had these symptoms?", "Do you have fever, severe pain, breathing difficulty, or bleeding?"]
    };
  }

  const redFlags = detectEmergency(message)
    ? ["Emergency warning: severe symptoms may need urgent medical care. Please contact emergency services or go to the nearest hospital immediately."]
    : [];

  return {
    reply: [
      redFlags[0] || "I can help organize your symptoms, but I cannot diagnose you or replace a doctor.",
      "For mild symptoms, rest, hydration, temperature tracking, and avoiding self-medication can help while you arrange medical advice.",
      "I can create a doctor discussion summary from what you share."
    ].join(" "),
    redFlags,
    possibleConcerns: detectEmergency(message) ? ["Potential urgent medical concern"] : ["Needs doctor confirmation if symptoms persist or worsen"],
    followUpQuestions: [
      "When did the symptoms start?",
      "How severe is it from 1 to 10?",
      "Do you have fever, breathing difficulty, chest pain, fainting, or bleeding?",
      "Do you have allergies, chronic conditions, or current medicines?"
    ]
  };
}

function summarizeReportLocally({ fileName, reportCategory, notes = "" }) {
  const redFlags = [];
  const lowerNotes = notes.toLowerCase();

  if (["critical", "very high", "very low", "positive dengue", "positive malaria"].some((term) => lowerNotes.includes(term))) {
    redFlags.push("Some values or words may indicate urgent review. Please consult a qualified doctor promptly.");
  }

  return {
    aiSummary: `Report ${fileName || ""} ${reportCategory ? `(${reportCategory})` : ""} was uploaded. B Donor can summarize notes for doctor discussion, but final interpretation must be done by a qualified doctor.`,
    detectedPossibleIssues: lowerNotes ? ["Possible concern detected from uploaded notes; doctor review recommended."] : [],
    redFlags
  };
}

async function askGeminiSafely(message) {
  if (!process.env.GEMINI_API_KEY) return null;

  const systemPrompt = [
    "You are B Donor AI Health Assistant.",
    "Do not diagnose, prescribe, or replace a doctor.",
    "Give general care guidance, red flags, follow-up questions, and a doctor discussion summary.",
    "For severe symptoms, tell the user to seek emergency care.",
    "If asked for prescription, say only an approved doctor can provide prescription through B Donor."
  ].join(" ");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUser message:\n${message}` }]
        }]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  askGeminiSafely,
  detectEmergency,
  localHealthAssistantReply,
  summarizeReportLocally
};
