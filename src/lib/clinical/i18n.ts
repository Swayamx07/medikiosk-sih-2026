import { SupportedLanguage } from "@/types/clinical";

export interface PatientFlowI18n {
  steps: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
    step7: string;
  };
  navigation: {
    back: string;
    proceed: string;
    finish: string;
    cancel: string;
    startNew: string;
  };
  consent: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDesc: string;
    statement1Title: string;
    statement1Text: string;
    statement2Title: string;
    statement2Text: string;
    statement3Title: string;
    statement3Text: string;
    checkboxLabel: string;
    checkboxHelp: string;
    badgeGranted: string;
    proceedButton: string;
  };
  identify: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDesc: string;
    demoLabel: string;
    fullNameLabel: string;
    identifierLabel: string;
    verifiedBadge: string;
  };
  mode: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDesc: string;
    generalTitle: string;
    generalDesc: string;
    ayushTitle: string;
    ayushDesc: string;
    activeMode: string;
    selectMode: string;
  };
  interview: {
    title: string;
    subtitle: string;
    placeholder: string;
    sendButton: string;
    voiceStart: string;
    voiceListening: string;
    proceedToDocs: string;
    chiefComplaintConfirmTitle: string;
    chiefComplaintConfirmDesc: string;
    editButton: string;
    confirmButton: string;
    confirmedBadge: string;
  };
  documents: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDesc: string;
    docTypeLabel: string;
    dropzoneTitle: string;
    dropzoneDesc: string;
    selectFileButton: string;
    uploadButton: string;
    uploadingState: string;
    processingState: string;
    proceedReview: string;
    digitizedTitle: string;
    viewFile: string;
  };
  review: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDesc: string;
    patientProfileTitle: string;
    chiefComplaintTitle: string;
    submitButton: string;
    submittingButton: string;
    successReceiptTitle: string;
    successReceiptDesc: string;
    waitingAreaNote: string;
    startNewIntakeButton: string;
  };
}

export const PATIENT_I18N: Record<SupportedLanguage, PatientFlowI18n> = {
  en: {
    steps: {
      step1: "Step 1 of 7",
      step2: "Step 2 of 7",
      step3: "Step 3 of 7",
      step4: "Step 4 of 7",
      step5: "Step 5 of 7",
      step6: "Step 6 of 7",
      step7: "Step 7 of 7",
    },
    navigation: {
      back: "Back",
      proceed: "Proceed",
      finish: "Finish & Submit",
      cancel: "Cancel",
      startNew: "Start New Patient Intake",
    },
    consent: {
      title: "Patient Consent & Privacy Notice",
      subtitle: "Digital health records under ABDM and clinical safety guidelines require transparent patient consent.",
      cardTitle: "Informed Consent Acknowledgement",
      cardDesc: "Please review the statements below before beginning your intake.",
      statement1Title: "Assisted Case-Taking",
      statement1Text: "I understand that MediKiosk is an assistive tool to record symptoms and organize health history. It does not provide autonomous medical diagnosis.",
      statement2Title: "Physician Review",
      statement2Text: "All recorded information, extracted documents, and clinical summaries will be reviewed and verified by the attending physician before any treatment decision.",
      statement3Title: "Data Protection & Privacy",
      statement3Text: "Patient intake data is securely stored and handled in accordance with digital health safety standards.",
      checkboxLabel: "I acknowledge and grant consent for digital case-taking",
      checkboxHelp: "Click to acknowledge clinical terms and authorization.",
      badgeGranted: "Consent Granted ✓",
      proceedButton: "Proceed to Step 3: Identify",
    },
    identify: {
      title: "Patient Identification",
      subtitle: "Identify using registered demo profiles or provide minimal patient details.",
      cardTitle: "Patient Identification & Verification",
      cardDesc: "Verification ensures clinical records are correctly associated with the patient.",
      demoLabel: "Select Scenario Profile",
      fullNameLabel: "Full Name",
      identifierLabel: "Identifier / ABHA",
      verifiedBadge: "Patient Record Verified",
    },
    mode: {
      title: "Select Clinical Intake Mode",
      subtitle: "Choose the consultation discipline to adapt clinical questionnaire and terminology.",
      cardTitle: "Intake Discipline",
      cardDesc: "Different medical systems evaluate symptoms according to their specific clinical methodologies.",
      generalTitle: "General OPD / Allopathy",
      generalDesc: "Standard clinical symptom inquiry: onset, duration, severity, red-flag triage, and medication history.",
      ayushTitle: "AYUSH Mode",
      ayushDesc: "Structured traditional intake including Dashavidha Pariksha, Prakriti, and lifestyle history.",
      activeMode: "Active Mode ✓",
      selectMode: "Select",
    },
    interview: {
      title: "Clinical Interview",
      subtitle: "Interactive conversational symptom intake with clinical safety evaluation.",
      placeholder: "Type your answer or speak using the microphone...",
      sendButton: "Send Answer",
      voiceStart: "Speak",
      voiceListening: "Listening...",
      proceedToDocs: "Proceed to Step 6: Documents",
      chiefComplaintConfirmTitle: "Please confirm your main health concern",
      chiefComplaintConfirmDesc: "Verify your primary symptom statement before continuing with follow-up questions.",
      editButton: "Edit",
      confirmButton: "Confirm & Continue",
      confirmedBadge: "Chief Complaint Confirmed ✓",
    },
    documents: {
      title: "Upload Previous Medical Documents",
      subtitle: "Upload past laboratory reports, prescriptions, or discharge summaries for clinical timeline extraction.",
      cardTitle: "Document Ingestion & Digitization",
      cardDesc: "Supported formats: PDF, JPEG, PNG, WebP (Max 15 MB per file).",
      docTypeLabel: "Document Classification:",
      dropzoneTitle: "Drag and drop medical documents here, or click to browse",
      dropzoneDesc: "Blood tests, lipid profiles, prescriptions, or discharge summaries.",
      selectFileButton: "Select Document File",
      uploadButton: "Upload & Extract Data",
      uploadingState: "Uploading to Secure Storage...",
      processingState: "Extracting Structured Clinical Facts...",
      proceedReview: "Proceed to Step 7: Review",
      digitizedTitle: "Digitized Medical Documents",
      viewFile: "View Secure File",
    },
    review: {
      title: "Review & Submit Case Intake",
      subtitle: "Review summary of captured patient information before transferring to physician workstation.",
      cardTitle: "Case Intake Verification",
      cardDesc: "Your case information will be submitted to the physician queue with appropriate clinical priority.",
      patientProfileTitle: "Patient Profile",
      chiefComplaintTitle: "Confirmed Chief Complaint:",
      submitButton: "Finish & Submit to Doctor Queue",
      submittingButton: "Submitting to Queue...",
      successReceiptTitle: "Case Intake Successfully Transmitted",
      successReceiptDesc: "Your clinical intake and uploaded records are now securely registered in the attending physician triage queue.",
      waitingAreaNote: "Please proceed to the outpatient waiting area. Your token will be called by the clinic.",
      startNewIntakeButton: "Start New Patient Intake",
    },
  },
  hi: {
    steps: {
      step1: "चरण 1 / 7",
      step2: "चरण 2 / 7",
      step3: "चरण 3 / 7",
      step4: "चरण 4 / 7",
      step5: "चरण 5 / 7",
      step6: "चरण 6 / 7",
      step7: "चरण 7 / 7",
    },
    navigation: {
      back: "पीछे जाएं",
      proceed: "आगे बढ़ें",
      finish: "समाप्त और जमा करें",
      cancel: "रद्द करें",
      startNew: "नया मरीज पंजीकरण शुरू करें",
    },
    consent: {
      title: "मरीज सहमति एवं गोपनीयता सूचना",
      subtitle: "ABDM और नैदानिक सुरक्षा मानकों के तहत डिजिटल स्वास्थ्य रिकॉर्ड के लिए स्पष्ट सहमति आवश्यक है।",
      cardTitle: "सूचित सहमति पावती",
      cardDesc: "केस-टेकिंग शुरू करने से पहले कृपया निम्नलिखित विवरण पढ़ें।",
      statement1Title: "सहायक केस-टेकिंग",
      statement1Text: "मैं समझता/समझती हूँ कि यह प्रणाली लक्षणों को दर्ज करने के लिए एक सहायक उपकरण है, यह स्वायत्त निदान प्रदान नहीं करती।",
      statement2Title: "डॉक्टर द्वारा समीक्षा",
      statement2Text: "इलाज का कोई भी निर्णय लेने से पहले सभी दर्ज जानकारी और रिपोर्ट डॉक्टर द्वारा जांची जाएगी।",
      statement3Title: "डेटा सुरक्षा और गोपनीयता",
      statement3Text: "आपकी स्वास्थ्य जानकारी डिजिटल स्वास्थ्य सुरक्षा मानकों के अनुसार सुरक्षित रखी जाती है।",
      checkboxLabel: "मैं डिजिटल केस-टेकिंग के लिए सहमति स्वीकार करता/करती हूँ",
      checkboxHelp: "नैदानिक शर्तों और प्राधिकरण को स्वीकार करने के लिए क्लिक करें।",
      badgeGranted: "सहमति स्वीकृत ✓",
      proceedButton: "चरण 3 पर जाएं: पहचान",
    },
    identify: {
      title: "मरीज पहचान",
      subtitle: "डेमो प्रोफाइल चुनें या मरीज का बुनियादी विवरण दर्ज करें।",
      cardTitle: "मरीज पहचान एवं सत्यापन",
      cardDesc: "सत्यापन सुनिश्चित करता है कि नैदानिक रिकॉर्ड सही मरीज से जुड़े हैं।",
      demoLabel: "परिदृश्य प्रोफाइल चुनें",
      fullNameLabel: "पूरा नाम",
      identifierLabel: "पहचान संख्या / आभा आईडी",
      verifiedBadge: "मरीज रिकॉर्ड सत्यापित",
    },
    mode: {
      title: "नैदानिक पद्धति चुनें",
      subtitle: "प्रश्नावली और शब्दावली को अनुकूलित करने के लिए परामर्श पद्धति चुनें।",
      cardTitle: "परामर्श विधा",
      cardDesc: "विभिन्न चिकित्सा प्रणालियाँ अपने विशिष्ट सिद्धांतों के अनुसार लक्षणों का मूल्यांकन करती हैं।",
      generalTitle: "सामान्य ओपीडी / एलोपैथी",
      generalDesc: "मानक लक्षण पूछताछ: शुरुआत, तीव्रता, आपातकालीन ट्राइएज और दवाओं का इतिहास।",
      ayushTitle: "आयुष विधा (AYUSH)",
      ayushDesc: "दशविध परीक्षा, प्रकृति और जीवनशैली इतिहास सहित पारंपरिक पूछताछ।",
      activeMode: "सक्रिय विधा ✓",
      selectMode: "चुनें",
    },
    interview: {
      title: "नैदानिक साक्षात्कार",
      subtitle: "नैदानिक सुरक्षा मूल्यांकन के साथ संवादात्मक लक्षण पूछताछ।",
      placeholder: "अपना उत्तर टाइप करें या माइक्रोफ़ोन दबाकर बोलें...",
      sendButton: "उत्तर भेजें",
      voiceStart: "बोलें",
      voiceListening: "सुन रहा हूँ...",
      proceedToDocs: "चरण 6 पर जाएं: दस्तावेज़",
      chiefComplaintConfirmTitle: "कृपया अपनी मुख्य स्वास्थ्य समस्या की पुष्टि करें",
      chiefComplaintConfirmDesc: "अगले प्रश्नों पर आगे बढ़ने से पहले अपने मुख्य लक्षण विवरण की पुष्टि करें।",
      editButton: "संशोधित करें",
      confirmButton: "पुष्टि करें और आगे बढ़ें",
      confirmedBadge: "मुख्य समस्या सत्यापित ✓",
    },
    documents: {
      title: "पिछले चिकित्सा दस्तावेज़ अपलोड करें",
      subtitle: "नैदानिक टाइमलाइन के लिए पिछली लैब रिपोर्ट, नुस्खे या डिस्चार्ज सारांश अपलोड करें।",
      cardTitle: "दस्तावेज़ डिजिटलीकरण",
      cardDesc: "स्वीकृत प्रारूप: PDF, JPEG, PNG, WebP (अधिकतम 15 MB प्रति फ़ाइल)।",
      docTypeLabel: "दस्तावेज़ प्रकार:",
      dropzoneTitle: "दस्तावेज़ यहाँ खींचकर छोड़ें, या ब्राउज़ करने के लिए क्लिक करें",
      dropzoneDesc: "रक्त परीक्षण, लिपिड प्रोफाइल, नुस्खे, या डिस्चार्ज सारांश।",
      selectFileButton: "फ़ाइल चुनें",
      uploadButton: "अपलोड और विश्लेषण करें",
      uploadingState: "सुरक्षित स्टोरेज में अपलोड हो रहा है...",
      processingState: "तथ्यात्मक नैदानिक डेटा निकाला जा रहा है...",
      proceedReview: "चरण 7 पर जाएं: समीक्षा",
      digitizedTitle: "डिजिटल किए गए दस्तावेज़",
      viewFile: "सुरक्षित फ़ाइल देखें",
    },
    review: {
      title: "केस समीक्षा एवं सबमिशन",
      subtitle: "डॉक्टर के पास भेजने से पहले दर्ज की गई जानकारी की समीक्षा करें।",
      cardTitle: "केस इनटेक सत्यापन",
      cardDesc: "आपकी जानकारी उपयुक्त नैदानिक प्राथमिकता के साथ डॉक्टर की कतार में जमा की जाएगी।",
      patientProfileTitle: "मरीज प्रोफ़ाइल",
      chiefComplaintTitle: "पुष्ट मुख्य समस्या:",
      submitButton: "डॉक्टर कतार में जमा करें",
      submittingButton: "जमा हो रहा है...",
      successReceiptTitle: "केस इनटेक सफलतापूर्वक जमा हुआ",
      successReceiptDesc: "आपकी नैदानिक जानकारी और दस्तावेज़ डॉक्टर की ट्राइएज कतार में सुरक्षित रूप से दर्ज कर दिए गए हैं।",
      waitingAreaNote: "कृपया ओपीडी प्रतीक्षालय में प्रतीक्षा करें। आपका टोकन जल्द ही पुकारा जाएगा।",
      startNewIntakeButton: "नया मरीज पंजीकरण शुरू करें",
    },
  },
  mr: {
    steps: {
      step1: "टप्पा १ / ७",
      step2: "टप्पा २ / ७",
      step3: "टप्पा ३ / ७",
      step4: "टप्पा ४ / ७",
      step5: "टप्पा ५ / ७",
      step6: "टप्पा ६ / ७",
      step7: "टप्पा ७ / ७",
    },
    navigation: {
      back: "मागे जा",
      proceed: "पुढे जा",
      finish: "पूर्ण करा आणि सादर करा",
      cancel: "रद्द करा",
      startNew: "नवीन रुग्ण नोंदणी सुरू करा",
    },
    consent: {
      title: "रुग्ण संमती व गोपनीयता सूचना",
      subtitle: "ABDM आणि वैद्यकीय सुरक्षा मार्गदर्शक तत्त्वांनुसार डिजिटल नोंदींसाठी स्पष्ट संमती आवश्यक आहे.",
      cardTitle: "माहितीपूर्ण संमती पावती",
      cardDesc: "केस नोंदणी सुरू करण्यापूर्वी कृपया खालील विधाने वाचा.",
      statement1Title: "साहाय्यक केस नोंदणी",
      statement1Text: "मला समजले आहे की हे साधन लक्षणे नोंदवण्यासाठी आहे, हे स्वयंचलित वैद्यकीय निदान करत नाही.",
      statement2Title: "वैद्यकीय डॉक्टरांची तपासणी",
      statement2Text: "उपचाराचा कोणताही निर्णय घेण्यापूर्वी सर्व नोंदवलेली माहिती आणि अहवाल डॉक्टरांकडून तपासले जातील.",
      statement3Title: "माहिती सुरक्षा आणि गोपनीयता",
      statement3Text: "आपली आरोग्य माहिती डिजिटल सुरक्षा मानकांनुसार पूर्णपणे सुरक्षित ठेवली जाते.",
      checkboxLabel: "मी डिजिटल केस नोंदणीसाठी संमती देत आहे",
      checkboxHelp: "वैद्यकीय अटी मान्य करण्यासाठी क्लिक करा.",
      badgeGranted: "संमती मान्य ✓",
      proceedButton: "टप्पा ३ वर जा: ओळख",
    },
    identify: {
      title: "रुग्ण ओळख",
      subtitle: "डेमो प्रोफाइल निवडा किंवा रुग्णाचा मूळ तपशील प्रविष्ट करा.",
      cardTitle: "रुग्ण ओळख आणि पडताळणी",
      cardDesc: "पडताळणीमुळे वैद्यकीय नोंदी योग्य रुग्णाशी जोडल्या जातात.",
      demoLabel: "परिदृश्य प्रोफाइल निवडा",
      fullNameLabel: "पूर्ण नाव",
      identifierLabel: "ओळख क्रमांक / आभा आयडी",
      verifiedBadge: "रुग्ण नोंदणी पडताळली",
    },
    mode: {
      title: "वैद्यकीय पद्धती निवडा",
      subtitle: "प्रश्नावली आणि वैद्यकीय संज्ञा जुळवून घेण्यासाठी योग्य पद्धती निवडा.",
      cardTitle: "तपासणी पद्धती",
      cardDesc: "विविध वैद्यकीय प्रणाली त्यांच्या विशिष्ट सिद्धांतांनुसार लक्षणांचे मूल्यांकन करतात.",
      generalTitle: "सामान्य ओपीडी / ॲलोपॅथी",
      generalDesc: "मानक लक्षण विचारणा: सुरुवात, तीव्रता, तातडीचे मूल्यांकन आणि औषधांचा इतिहास.",
      ayushTitle: "आयुष पद्धती (AYUSH)",
      ayushDesc: "दशविध परीक्षा, प्रकृती आणि जीवनशैली इतिहासासह पारंपरिक विचारणा.",
      activeMode: "सक्रिय पद्धती ✓",
      selectMode: "निवडा",
    },
    interview: {
      title: "वैद्यकीय विचारणा",
      subtitle: "वैद्यकीय सुरक्षेसह संवादात्मक लक्षण विचारणा.",
      placeholder: "आपले उत्तर टाईप करा किंवा माइकवर क्लिक करून बोला...",
      sendButton: "उत्तर पाठवा",
      voiceStart: "बोला",
      voiceListening: "ऐकत आहे...",
      proceedToDocs: "टप्पा ६ वर जा: कागदपत्रे",
      chiefComplaintConfirmTitle: "कृपया आपल्या मुख्य आरोग्य तक्रारीची खात्री करा",
      chiefComplaintConfirmDesc: "पुढील प्रश्नांकडे जाण्यापूर्वी आपल्या मुख्य लक्षणांची खात्री करा.",
      editButton: "बदल करा",
      confirmButton: "खात्री करा आणि पुढे जा",
      confirmedBadge: "मुख्य तक्रार पुष्ट झाली ✓",
    },
    documents: {
      title: "मागील वैद्यकीय कागदपत्रे अपलोड करा",
      subtitle: "वैद्यकीय नोंदींसाठी मागील लॅब रिपोर्ट, प्रिस्क्रिप्शन किंवा डिस्चार्ज समरी अपलोड करा.",
      cardTitle: "कागदपत्रे डिजिटलीकरण",
      cardDesc: "स्वीकृत स्वरूप: PDF, JPEG, PNG, WebP (कमाल १५ MB प्रति फाइल).",
      docTypeLabel: "कागदपत्राचा प्रकार:",
      dropzoneTitle: "फाइल येथे ड्रॅग आणि ड्रॉप करा, किंवा निवडण्यासाठी क्लिक करा",
      dropzoneDesc: "रक्त तपासणी, लिपिड प्रोफाइल, प्रिस्क्रिप्शन किंवा डिस्चार्ज समरी.",
      selectFileButton: "फाइल निवडा",
      uploadButton: "अपलोड करा आणि माहिती काढा",
      uploadingState: "सुरक्षित स्टोरेजमध्ये अपलोड होत आहे...",
      processingState: "वैद्यकीय माहिती गोळा केली जात आहे...",
      proceedReview: "टप्पा ७ वर जा: आढावा",
      digitizedTitle: "डिजिटल केलेली कागदपत्रे",
      viewFile: "सुरक्षित फाइल पहा",
    },
    review: {
      title: "केस आढावा आणि सादर करा",
      subtitle: "डॉक्टरांच्या डॅशबोर्डवर पाठवण्यापूर्वी नोंदवलेल्या माहितीचा आढावा घ्या.",
      cardTitle: "केस नोंदणी पडताळणी",
      cardDesc: "आपली माहिती योग्य वैद्यकीय प्राधान्यासह डॉक्टरांच्या रांगेत सादर केली जाईल.",
      patientProfileTitle: "रुग्ण तपशील",
      chiefComplaintTitle: "खात्री केलेली मुख्य तक्रार:",
      submitButton: "डॉक्टरांच्या रांगेत सादर करा",
      submittingButton: "सादर होत आहे...",
      successReceiptTitle: "केस नोंदणी यशस्वीरीत्या सादर झाली",
      successReceiptDesc: "आपली वैद्यकीय माहिती आणि कागदपत्रे डॉक्टरांच्या ट्रायज रांगेत सुरक्षितपणे नोंदवली गेली आहेत.",
      waitingAreaNote: "कृपया ओपीडी प्रतीक्षा कक्षात थांबा. आपला टोकन क्रमांक लवकरच पुकारला जाईल.",
      startNewIntakeButton: "नवीन रुग्ण नोंदणी सुरू करा",
    },
  },
};
