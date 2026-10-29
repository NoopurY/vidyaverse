/** Plain-language fix hints in English, Hindi and Marathi for each issue type (used when no LLM is configured). */
export type HintLang = "en" | "hi" | "mr";

export const HINTS: Record<string, Record<HintLang, string>> = {
  missing_apaar: {
    en: "APAAR ID is missing. Ask the student to generate their APAAR ID on DigiLocker (or through the school's UDISE+ login) and enter the 12 digits.",
    hi: "APAAR आईडी नहीं है। छात्र से DigiLocker पर APAAR आईडी बनवाएँ और 12 अंक दर्ज करें।",
    mr: "APAAR आयडी नाही. विद्यार्थ्याला DigiLocker वर APAAR आयडी तयार करायला सांगा आणि 12 अंक भरा.",
  },
  invalid_apaar: {
    en: "APAAR ID must be exactly 12 digits with no letters or spaces. Check for a missing or extra digit, or Excel converting it to scientific format (format the column as Text).",
    hi: "APAAR आईडी ठीक 12 अंकों की होनी चाहिए, बिना अक्षर या स्पेस के। कॉलम को Text फ़ॉर्मेट करें।",
    mr: "APAAR आयडी अचूक 12 अंकी असावा, अक्षरे किंवा जागा नसाव्यात. कॉलम Text फॉरमॅट करा.",
  },
  apaar_not_found: {
    en: "This APAAR ID does not exist in the APAAR registry. Re-check the number with the student's DigiLocker APAAR card.",
    hi: "यह APAAR आईडी रजिस्ट्री में नहीं मिली। छात्र के DigiLocker APAAR कार्ड से नंबर दोबारा जाँचें।",
    mr: "हा APAAR आयडी नोंदणीत सापडला नाही. विद्यार्थ्याच्या DigiLocker APAAR कार्डवरून क्रमांक पुन्हा तपासा.",
  },
  apaar_mismatch: {
    en: "Name or date of birth does not match the APAAR registry. Use the spelling and DOB exactly as on the APAAR card, or ask the student to correct APAAR first.",
    hi: "नाम या जन्मतिथि APAAR रजिस्ट्री से मेल नहीं खाती। APAAR कार्ड के अनुसार ही लिखें।",
    mr: "नाव किंवा जन्मतारीख APAAR नोंदणीशी जुळत नाही. APAAR कार्डप्रमाणेच लिहा.",
  },
  missing_field: {
    en: "A mandatory field is empty. Fill in the highlighted column using the dropdown values from the template.",
    hi: "एक अनिवार्य कॉलम खाली है। टेम्पलेट के ड्रॉपडाउन से मान भरें।",
    mr: "एक आवश्यक कॉलम रिकामा आहे. टेम्पलेटमधील ड्रॉपडाउनमधून मूल्य भरा.",
  },
  duplicate_in_institution: {
    en: "This student appears more than once for your institution. Keep one row; to change an existing student use Students → Edit.",
    hi: "यह छात्र आपके संस्थान में एक से अधिक बार है। एक ही पंक्ति रखें।",
    mr: "हा विद्यार्थी तुमच्या संस्थेत एकापेक्षा जास्त वेळा आहे. एकच ओळ ठेवा.",
  },
  cross_institution_duplicate: {
    en: "This APAAR is already actively enrolled at another institution. If the student is transferring, raise a transfer request from the Transfers page.",
    hi: "यह APAAR किसी अन्य संस्थान में सक्रिय है। स्थानांतरण हो तो Transfers पेज से अनुरोध करें।",
    mr: "हा APAAR दुसऱ्या संस्थेत सक्रिय आहे. स्थलांतर असल्यास Transfers पेजवरून विनंती करा.",
  },
  intake_exceeded: {
    en: "No approved seat is left for this program and seat type. Admission cannot be recorded beyond AICTE-approved intake; check the Seat Ledger.",
    hi: "इस प्रोग्राम/सीट प्रकार में कोई स्वीकृत सीट शेष नहीं है। Seat Ledger देखें।",
    mr: "या प्रोग्राम/जागा प्रकारात मंजूर जागा शिल्लक नाही. Seat Ledger पाहा.",
  },
  inconsistency: {
    en: "The values in this row contradict each other. Correct the nationality, category, seat type or dates as described.",
    hi: "इस पंक्ति के मान आपस में मेल नहीं खाते। राष्ट्रीयता, श्रेणी, सीट प्रकार या तिथियाँ ठीक करें।",
    mr: "या ओळीतील मूल्ये एकमेकांशी जुळत नाहीत. राष्ट्रीयत्व, प्रवर्ग, जागा प्रकार किंवा तारखा दुरुस्त करा.",
  },
  fuzzy_duplicate: {
    en: "A student with a very similar name, same date of birth and same parent already exists. Confirm it is a different person; AICTE will review.",
    hi: "समान नाम, जन्मतिथि और अभिभावक वाला छात्र पहले से है। पुष्टि करें कि यह अलग व्यक्ति है।",
    mr: "सारखे नाव, जन्मतारीख आणि पालक असलेला विद्यार्थी आधीच आहे. ही वेगळी व्यक्ती असल्याची खात्री करा.",
  },
  no_counselling: {
    en: "No counselling allotment (JoSAA/CAP) was found for this student at your institution and program. Add the counselling reference or document the admission route.",
    hi: "इस छात्र का काउंसलिंग आवंटन नहीं मिला। काउंसलिंग संदर्भ जोड़ें।",
    mr: "या विद्यार्थ्याचे समुपदेशन (CAP) वाटप सापडले नाही. समुपदेशन संदर्भ जोडा.",
  },
  format: {
    en: "The format is incorrect. Mobile must be 10 digits; email must look like name@domain.com.",
    hi: "फ़ॉर्मेट गलत है। मोबाइल 10 अंक का और ईमेल name@domain.com जैसा होना चाहिए।",
    mr: "फॉरमॅट चुकीचा आहे. मोबाइल 10 अंकी आणि ईमेल name@domain.com सारखा असावा.",
  },
};

export function hintFor(type: string, lang: HintLang = "en") {
  return (HINTS[type] ?? HINTS.inconsistency)[lang];
}
