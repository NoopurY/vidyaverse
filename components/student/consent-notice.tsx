/** Bilingual consent notice shown before any sharing (DPDP Act, 2023) */
export function ConsentNotice() {
  return (
    <div className="space-y-2 rounded border border-line bg-page p-3 text-xs leading-relaxed">
      <p className="font-semibold text-ink">Consent notice</p>
      <p>
        By approving, you allow AICTE (data fiduciary) to share only the listed fields of your verified academic record with the named requester, for the stated purpose, until the expiry date. You can revoke this consent at any time from the portal or by WhatsApp (REVOKE &lt;consent ID&gt;); revocation takes effect immediately. Category, contact details and parent name are never shared.
      </p>
      <p className="font-semibold text-ink" lang="hi">सहमति सूचना</p>
      <p lang="hi">
        स्वीकृति देकर आप AICTE (डेटा फ़िड्यूशियरी) को अनुमति देते हैं कि वह आपके सत्यापित शैक्षणिक रिकॉर्ड के केवल सूचीबद्ध फ़ील्ड, बताए गए उद्देश्य के लिए, समाप्ति तिथि तक, नामित अनुरोधकर्ता के साथ साझा करे। आप पोर्टल या WhatsApp (REVOKE &lt;consent ID&gt;) से कभी भी सहमति वापस ले सकते हैं; यह तुरंत लागू होगी। श्रेणी, संपर्क विवरण और अभिभावक का नाम कभी साझा नहीं किया जाता।
      </p>
    </div>
  );
}
