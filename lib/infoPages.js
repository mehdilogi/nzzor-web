// =============================================================================
// Content of the information pages: privacy, contact, FAQ.
// -----------------------------------------------------------------------------
// Sources, so every statement can be traced:
//   - Law 18-07 of 10 June 2018 on the protection of natural persons in the
//     processing of personal data.
//   - The BNA merchant agreement for CIB online payment: Art. 23 (cardholder
//     data covered by professional secrecy), Art. 7.5.3 (10-year archiving),
//     Art. 15 (90-day complaint window), Art. 16 (refund by the original
//     method only), Annexe 1 (100 DZD minimum), Art. 5 (no international cards).
//   - The CGV published at /terms (dated 12 September 2026): voucher within
//     24 h, on-request confirmation within 48 h, refund initiated within 7 days,
//     cancellation terms = those of the establishment.
//   - What the code actually does: analytics identifiers in localStorage, IP
//     stored only as a salted hash, country from Cloudflare, 90-day retention;
//     card data entered on SATIM's servers only; reCAPTCHA on checkout.
// Keep the three languages identical in substance. Update `updated` in all
// three when anything changes.
// =============================================================================

const AGENCY = "ALLOUNI TRAVEL AGENCY";
const ADDRESS_FR = "Cité 300 Logements Les Tours, Bât. A2, Sétif, Algérie";
const ADDRESS_EN = "Cité 300 Logements Les Tours, Building A2, Sétif, Algeria";
const ADDRESS_AR = "حي 300 مسكن Les Tours، العمارة A2، سطيف، الجزائر";
const RC = "23 A 5345108 00/19 — Sétif";
const EMAIL = "contact@nzzor.com";
const PHONES = "0770 08 08 30 / 0770 08 08 31";
const WA = process.env.NEXT_PUBLIC_WHATSAPP || "213770080830";
// The Ministry licence number. Set NEXT_PUBLIC_TOURISM_LICENCE in Vercel; until
// then the pages state the approval without inventing a number.
const LICENCE = process.env.NEXT_PUBLIC_TOURISM_LICENCE || "";

// ---------------------------------------------------------------------------
// PRIVACY
// ---------------------------------------------------------------------------
export const PRIVACY = {
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 11 novembre 2026",
    intro:
      "Cette page explique quelles données nous collectons quand vous utilisez nzzor.com, pourquoi, avec qui nous les partageons, combien de temps nous les gardons et comment exercer vos droits. Elle s'applique conformément à la loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.",
    sections: [
      {
        h: "1. Responsable du traitement",
        p: [
          `Le site nzzor.com est exploité par ${AGENCY} (nom commercial : Nzzor), agence de voyage agréée par le Ministère du Tourisme, ${ADDRESS_FR}, registre du commerce ${RC}.`,
          `Pour toute question relative à vos données : ${EMAIL}.`,
        ],
      },
      {
        h: "2. Les données que nous collectons",
        list: [
          "Pour une réservation : nom, prénom, adresse e-mail, numéro de téléphone, dates de séjour, chambres choisies, demandes particulières.",
          "Pour un compte client (facultatif) : les mêmes informations et un mot de passe, conservé uniquement sous forme chiffrée (hachage).",
          "Pour un paiement : la référence de la transaction, le numéro d'autorisation, le montant, la date et les derniers chiffres masqués de la carte, tels que transmis par la SATIM. Nous ne recevons jamais le numéro complet de votre carte ni son code.",
          "Pour la mesure d'audience : les pages vues, la page d'arrivée, la taille d'écran, le pays (déduit par notre hébergeur) et un identifiant aléatoire enregistré dans votre navigateur. Votre adresse IP n'est pas conservée en clair : seule une empreinte chiffrée et salée est enregistrée.",
          "Si vous nous écrivez sur WhatsApp ou par e-mail : le contenu de vos messages et votre numéro ou adresse.",
        ],
      },
      {
        h: "3. Pourquoi nous les utilisons",
        list: [
          "Traiter votre réservation, l'envoyer à l'établissement et vous adresser la confirmation et le bon d'échange (voucher).",
          "Encaisser le paiement via la plateforme SATIM et vous délivrer le reçu électronique.",
          "Répondre à vos demandes, réclamations et demandes de remboursement.",
          "Respecter nos obligations légales et contractuelles, notamment l'archivage des transactions.",
          "Comprendre l'utilisation du site pour l'améliorer, de façon agrégée.",
          "Protéger le site contre les abus (contrôle anti-robot lors du paiement).",
        ],
        p: ["Nous n'utilisons pas vos données à des fins publicitaires et nous ne les vendons pas."],
      },
      {
        h: "4. Vos données bancaires",
        p: [
          "Le paiement par carte CIB ou Edahabia se fait exclusivement sur les serveurs sécurisés de la SATIM, protégés par SSL et 3D Secure. Vos coordonnées bancaires ne transitent pas par notre site et nous n'y avons à aucun moment accès.",
          "Conformément à l'article 23 du contrat d'adhésion au paiement en ligne, les informations nominatives concernant les acheteurs sont couvertes par le secret professionnel.",
        ],
      },
      {
        h: "5. Avec qui nous les partageons",
        list: [
          "L'établissement que vous réservez : nom, téléphone, e-mail, dates, chambres et demandes particulières, pour préparer votre séjour.",
          "La SATIM et les banques du réseau interbancaire, pour traiter le paiement et les éventuels remboursements.",
          "Nos prestataires techniques, uniquement pour faire fonctionner le service : hébergement du site et de la base de données, réseau de diffusion (Cloudflare), envoi des e-mails transactionnels (Resend), contrôle anti-robot (Google reCAPTCHA). Certains de ces prestataires sont situés hors d'Algérie.",
          "Les autorités, lorsque la loi l'exige.",
        ],
        p: ["Aucune donnée n'est cédée à des tiers à des fins commerciales."],
      },
      {
        h: "6. Durée de conservation",
        list: [
          "Pièces relatives aux transactions et réservations payées : dix (10) ans à compter de l'opération, conformément à l'article 7.5.3 du contrat d'adhésion et à l'article 12 du Code de commerce.",
          "Compte client : tant que le compte existe ; supprimé sur demande, sous réserve des pièces que nous devons archiver.",
          "Données de mesure d'audience détaillées : 90 jours, puis seuls des totaux anonymes sont conservés.",
          "Messages WhatsApp et e-mails : le temps nécessaire au traitement de votre demande.",
        ],
      },
      {
        h: "7. Cookies et stockage local",
        p: [
          "Nous n'utilisons ni cookies publicitaires ni outils de suivi tiers. Le site enregistre dans votre navigateur votre langue, vos préférences d'affichage et l'identifiant aléatoire de mesure d'audience. Le contrôle anti-robot de Google peut déposer ses propres cookies sur la page de paiement.",
          "Vous pouvez effacer ces données à tout moment depuis les réglages de votre navigateur.",
        ],
      },
      {
        h: "8. Sécurité",
        p: [
          "Le site est servi exclusivement en HTTPS. Les mots de passe sont chiffrés, l'accès à l'administration est réservé et les adresses IP ne sont conservées que sous forme d'empreinte.",
        ],
      },
      {
        h: "9. Vos droits",
        p: [
          `Vous disposez d'un droit d'information, d'accès, de rectification, d'effacement et d'opposition sur vos données. Pour l'exercer, écrivez à ${EMAIL} en indiquant votre nom et, le cas échéant, votre référence de réservation. Nous répondons dans les meilleurs délais.`,
          "Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'Autorité nationale de protection des données à caractère personnel (ANPDP).",
        ],
      },
      {
        h: "10. Modifications",
        p: [
          "Nous pouvons mettre à jour cette politique. La date en haut de la page indique la dernière version. La version arabe et la version française font foi ; la version anglaise est fournie à titre d'information.",
        ],
      },
    ],
  },

  en: {
    title: "Privacy policy",
    updated: "Last updated: 11 November 2026",
    intro:
      "This page explains what data we collect when you use nzzor.com, why, who we share it with, how long we keep it and how to exercise your rights. It applies under Law 18-07 of 10 June 2018 on the protection of natural persons in the processing of personal data.",
    sections: [
      {
        h: "1. Data controller",
        p: [
          `nzzor.com is operated by ${AGENCY} (trading as Nzzor), a travel agency licensed by the Ministry of Tourism, ${ADDRESS_EN}, commercial register ${RC}.`,
          `For any question about your data: ${EMAIL}.`,
        ],
      },
      {
        h: "2. The data we collect",
        list: [
          "For a booking: first and last name, email address, phone number, stay dates, rooms chosen, special requests.",
          "For a customer account (optional): the same details and a password, stored only in hashed form.",
          "For a payment: the transaction reference, authorisation number, amount, date and the masked last digits of the card, as sent by SATIM. We never receive your full card number or its code.",
          "For audience measurement: pages viewed, landing page, screen size, country (derived by our host) and a random identifier stored in your browser. Your IP address is not stored in clear: only a salted, hashed fingerprint is kept.",
          "If you write to us on WhatsApp or by email: the content of your messages and your number or address.",
        ],
      },
      {
        h: "3. Why we use it",
        list: [
          "To process your booking, send it to the establishment and send you the confirmation and voucher.",
          "To take payment through the SATIM platform and issue your electronic receipt.",
          "To answer your requests, complaints and refund requests.",
          "To meet our legal and contractual obligations, including archiving transactions.",
          "To understand how the site is used, in aggregate, and improve it.",
          "To protect the site against abuse (anti-robot check at payment).",
        ],
        p: ["We do not use your data for advertising and we do not sell it."],
      },
      {
        h: "4. Your card details",
        p: [
          "CIB and Edahabia card payments are made only on SATIM's secure servers, protected by SSL and 3D Secure. Your card details never pass through our site and we have no access to them at any time.",
          "Under Article 23 of the online payment merchant agreement, personal information about buyers is covered by professional secrecy.",
        ],
      },
      {
        h: "5. Who we share it with",
        list: [
          "The establishment you book: name, phone, email, dates, rooms and special requests, to prepare your stay.",
          "SATIM and the banks of the interbank network, to process the payment and any refund.",
          "Our technical providers, only to run the service: website and database hosting, content delivery (Cloudflare), transactional email (Resend), anti-robot check (Google reCAPTCHA). Some of these providers are located outside Algeria.",
          "The authorities, where the law requires it.",
        ],
        p: ["No data is passed to third parties for commercial purposes."],
      },
      {
        h: "6. How long we keep it",
        list: [
          "Records of transactions and paid bookings: ten (10) years from the transaction, under Article 7.5.3 of the merchant agreement and Article 12 of the Commercial Code.",
          "Customer account: for as long as the account exists; deleted on request, except records we are required to archive.",
          "Detailed audience data: 90 days, after which only anonymous totals are kept.",
          "WhatsApp messages and emails: as long as needed to handle your request.",
        ],
      },
      {
        h: "7. Cookies and local storage",
        p: [
          "We use no advertising cookies and no third-party tracking tools. The site stores your language, display preferences and the random audience identifier in your browser. Google's anti-robot check may set its own cookies on the payment page.",
          "You can clear this data at any time in your browser settings.",
        ],
      },
      {
        h: "8. Security",
        p: [
          "The site is served over HTTPS only. Passwords are hashed, access to the administration is restricted and IP addresses are kept only as a fingerprint.",
        ],
      },
      {
        h: "9. Your rights",
        p: [
          `You have the right to information, access, rectification, erasure and objection regarding your data. To exercise it, write to ${EMAIL} with your name and, if relevant, your booking reference. We answer as quickly as we can.`,
          "If you believe your rights are not respected, you may refer the matter to the National Authority for the Protection of Personal Data (ANPDP).",
        ],
      },
      {
        h: "10. Changes",
        p: [
          "We may update this policy. The date at the top of the page shows the latest version. The Arabic and French versions are authoritative; the English version is provided for information.",
        ],
      },
    ],
  },

  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 11 نوفمبر 2026",
    intro:
      "توضح هذه الصفحة البيانات التي نجمعها عند استخدامك لموقع nzzor.com، وسبب جمعها، ومن نشاركها معه، ومدة الاحتفاظ بها، وكيفية ممارسة حقوقك. وهي مطبقة وفقاً للقانون رقم 18-07 المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.",
    sections: [
      {
        h: "1. المسؤول عن المعالجة",
        p: [
          `يُشغَّل موقع nzzor.com من طرف ${AGENCY} (الاسم التجاري: Nzzor)، وكالة سياحة وأسفار معتمدة من وزارة السياحة، ${ADDRESS_AR}، السجل التجاري ${RC}.`,
          `لأي سؤال يتعلق ببياناتك: ${EMAIL}.`,
        ],
      },
      {
        h: "2. البيانات التي نجمعها",
        list: [
          "عند الحجز: الاسم واللقب، البريد الإلكتروني، رقم الهاتف، تواريخ الإقامة، الغرف المختارة، الطلبات الخاصة.",
          "عند إنشاء حساب (اختياري): نفس المعلومات وكلمة مرور تُحفظ بشكل مشفّر فقط.",
          "عند الدفع: مرجع المعاملة، رقم الترخيص، المبلغ، التاريخ والأرقام الأخيرة المقنّعة للبطاقة كما ترسلها SATIM. لا نتلقى أبداً رقم بطاقتك الكامل ولا رمزها.",
          "لقياس الزيارات: الصفحات المعروضة، صفحة الدخول، حجم الشاشة، البلد (يحدده مزود الاستضافة) ومعرّف عشوائي محفوظ في متصفحك. لا يُحفظ عنوان IP الخاص بك بشكل واضح، بل بصمة مشفّرة فقط.",
          "إذا راسلتنا عبر واتساب أو البريد الإلكتروني: محتوى رسائلك ورقمك أو عنوانك.",
        ],
      },
      {
        h: "3. لماذا نستخدمها",
        list: [
          "معالجة حجزك، إرساله إلى المؤسسة وإرسال التأكيد وقسيمة الحجز إليك.",
          "تحصيل الدفع عبر منصة SATIM وتسليمك الإيصال الإلكتروني.",
          "الرد على طلباتك وشكاواك وطلبات الاسترداد.",
          "الوفاء بالتزاماتنا القانونية والتعاقدية، ولا سيما أرشفة المعاملات.",
          "فهم استخدام الموقع بشكل إجمالي لتحسينه.",
          "حماية الموقع من الاستخدام المسيء (التحقق من أنك لست روبوتاً عند الدفع).",
        ],
        p: ["لا نستخدم بياناتك لأغراض إشهارية ولا نبيعها."],
      },
      {
        h: "4. بياناتك البنكية",
        p: [
          "يتم الدفع ببطاقة CIB أو الذهبية حصرياً على خوادم SATIM المؤمّنة ببروتوكول SSL و3D Secure. لا تمر بياناتك البنكية عبر موقعنا ولا نطّلع عليها في أي وقت.",
          "وفقاً للمادة 23 من عقد الانخراط في الدفع الإلكتروني، فإن المعلومات الاسمية الخاصة بالمشترين مشمولة بالسر المهني.",
        ],
      },
      {
        h: "5. مع من نشاركها",
        list: [
          "المؤسسة التي تحجز فيها: الاسم، الهاتف، البريد الإلكتروني، التواريخ، الغرف والطلبات الخاصة، لتحضير إقامتك.",
          "SATIM والبنوك المنتمية للشبكة ما بين البنوك، لمعالجة الدفع وأي استرداد.",
          "مزودونا التقنيون، لتشغيل الخدمة فقط: استضافة الموقع وقاعدة البيانات، شبكة التوزيع (Cloudflare)، إرسال الرسائل الإلكترونية (Resend)، التحقق من الروبوتات (Google reCAPTCHA). بعض هؤلاء المزودين يقعون خارج الجزائر.",
          "السلطات، عندما يفرض القانون ذلك.",
        ],
        p: ["لا يتم التنازل عن أي بيانات لأطراف ثالثة لأغراض تجارية."],
      },
      {
        h: "6. مدة الاحتفاظ",
        list: [
          "الوثائق المتعلقة بالمعاملات والحجوزات المدفوعة: عشر (10) سنوات من تاريخ العملية، وفقاً للمادة 7.5.3 من عقد الانخراط والمادة 12 من القانون التجاري.",
          "حساب الزبون: طالما الحساب موجود؛ يُحذف بطلب منك، مع مراعاة الوثائق التي يجب أرشفتها.",
          "بيانات قياس الزيارات التفصيلية: 90 يوماً، ثم تُحفظ مجاميع مجهولة فقط.",
          "رسائل واتساب والبريد الإلكتروني: المدة اللازمة لمعالجة طلبك.",
        ],
      },
      {
        h: "7. ملفات تعريف الارتباط والتخزين المحلي",
        p: [
          "لا نستخدم ملفات تعريف ارتباط إشهارية ولا أدوات تتبّع خارجية. يحفظ الموقع في متصفحك لغتك وتفضيلات العرض والمعرّف العشوائي لقياس الزيارات. قد يضع نظام Google للتحقق من الروبوتات ملفاته الخاصة في صفحة الدفع.",
          "يمكنك حذف هذه البيانات في أي وقت من إعدادات متصفحك.",
        ],
      },
      {
        h: "8. الأمان",
        p: [
          "يُقدَّم الموقع حصرياً عبر HTTPS. كلمات المرور مشفّرة، والوصول إلى الإدارة محصور، وعناوين IP لا تُحفظ إلا كبصمة.",
        ],
      },
      {
        h: "9. حقوقك",
        p: [
          `لك الحق في الإعلام والاطلاع والتصحيح والمحو والاعتراض على بياناتك. لممارسة هذا الحق، راسلنا على ${EMAIL} مع ذكر اسمك ومرجع حجزك إن وُجد. نرد في أقرب الآجال.`,
          "إذا رأيت أن حقوقك لم تُحترم، يمكنك إخطار السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي (ANPDP).",
        ],
      },
      {
        h: "10. التعديلات",
        p: [
          "قد نقوم بتحديث هذه السياسة. يشير التاريخ أعلى الصفحة إلى آخر نسخة. النسختان العربية والفرنسية هما المعتمدتان، والنسخة الإنجليزية مقدّمة للإعلام فقط.",
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// CONTACT (also carries the Ministry approval)
// ---------------------------------------------------------------------------
const waHref = `https://wa.me/${WA}`;
const waDisplay = "+" + WA.replace(/^(\d{3})(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5");

export const CONTACT = {
  fr: {
    title: "Nous contacter",
    intro: "Une personne de notre équipe vous répond, en arabe, en français ou en anglais.",
    cards: [
      { label: "WhatsApp", value: waDisplay, href: waHref, note: "Réservations, questions, suivi" },
      { label: "Téléphone", value: PHONES, href: "tel:+213770080830" },
      { label: "E-mail", value: EMAIL, href: `mailto:${EMAIL}`, note: "Réclamations, remboursements, données personnelles" },
      { label: "Adresse", value: ADDRESS_FR },
    ],
    sections: [
      {
        id: "agrement",
        h: "Agence agréée",
        p: [
          `Nzzor est exploité par ${AGENCY}, agence de voyage agréée par le Ministère du Tourisme${LICENCE ? `, agrément n° ${LICENCE}` : ""}.`,
          `Registre du commerce : ${RC}.`,
        ],
      },
      {
        h: "Réclamations",
        p: [
          `Toute réclamation peut être adressée par écrit à ${EMAIL} ou par courrier à l'adresse ci-dessus, en indiquant votre référence de réservation (NZR-XXXX-XXXX). Le délai de réclamation est de 90 jours à compter de la date de l'opération.`,
          "Pour une difficulté liée au paiement, vous pouvez également contacter la SATIM au 3020 (appel gratuit).",
        ],
      },
    ],
  },
  en: {
    title: "Contact us",
    intro: "A person from our team answers, in Arabic, French or English.",
    cards: [
      { label: "WhatsApp", value: waDisplay, href: waHref, note: "Bookings, questions, follow-up" },
      { label: "Phone", value: PHONES, href: "tel:+213770080830" },
      { label: "Email", value: EMAIL, href: `mailto:${EMAIL}`, note: "Complaints, refunds, personal data" },
      { label: "Address", value: ADDRESS_EN },
    ],
    sections: [
      {
        id: "agrement",
        h: "Licensed agency",
        p: [
          `Nzzor is operated by ${AGENCY}, a travel agency licensed by the Ministry of Tourism${LICENCE ? `, licence no. ${LICENCE}` : ""}.`,
          `Commercial register: ${RC}.`,
        ],
      },
      {
        h: "Complaints",
        p: [
          `Send any complaint in writing to ${EMAIL} or by post to the address above, with your booking reference (NZR-XXXX-XXXX). Complaints can be made within 90 days of the transaction.`,
          "For a problem with a payment, you can also call SATIM on 3020 (free call).",
        ],
      },
    ],
  },
  ar: {
    title: "اتصل بنا",
    intro: "يرد عليك شخص من فريقنا، بالعربية أو الفرنسية أو الإنجليزية.",
    cards: [
      { label: "واتساب", value: waDisplay, href: waHref, note: "الحجوزات، الأسئلة، المتابعة" },
      { label: "الهاتف", value: PHONES, href: "tel:+213770080830" },
      { label: "البريد الإلكتروني", value: EMAIL, href: `mailto:${EMAIL}`, note: "الشكاوى، الاسترداد، المعطيات الشخصية" },
      { label: "العنوان", value: ADDRESS_AR },
    ],
    sections: [
      {
        id: "agrement",
        h: "وكالة معتمدة",
        p: [
          `يُشغَّل Nzzor من طرف ${AGENCY}، وكالة سياحة وأسفار معتمدة من وزارة السياحة${LICENCE ? `، رقم الاعتماد ${LICENCE}` : ""}.`,
          `السجل التجاري: ${RC}.`,
        ],
      },
      {
        h: "الشكاوى",
        p: [
          `يمكن إرسال أي شكوى كتابياً إلى ${EMAIL} أو بالبريد إلى العنوان أعلاه، مع ذكر مرجع الحجز (NZR-XXXX-XXXX). أجل تقديم الشكوى 90 يوماً من تاريخ العملية.`,
          "لأي مشكلة تتعلق بالدفع، يمكنك أيضاً الاتصال بـ SATIM على الرقم 3020 (مكالمة مجانية).",
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// FAQ (help centre)
// ---------------------------------------------------------------------------
export const FAQ = {
  fr: {
    title: "Questions fréquentes",
    intro: "Les réponses aux questions qu'on nous pose le plus. Pour tout le reste, écrivez-nous sur WhatsApp.",
    sections: [
      { h: "Comment payer ?", p: ["En ligne, par carte CIB ou Edahabia, sur la plateforme sécurisée de la SATIM. Les cartes internationales (Visa, Mastercard) ne peuvent pas être utilisées sur un site marchand algérien. Le montant minimum d'un paiement en ligne est de 100 DA."] },
      { h: "Mes informations de carte sont-elles en sécurité ?", p: ["Oui. Vous saisissez votre carte sur les serveurs de la SATIM, protégés par SSL et 3D Secure. Nous n'avons jamais accès à vos données bancaires."] },
      { h: "Quand vais-je recevoir ma confirmation ?", p: ["Dès que le paiement est autorisé, vous recevez votre reçu. La confirmation et le bon d'échange (voucher) vous sont envoyés par e-mail au plus tard dans les 24 heures. Pour une réservation « sur demande », nous vous répondons sous 48 heures au maximum."] },
      { h: "Pourquoi certains hôtels se réservent-ils via WhatsApp ?", p: ["Nous listons les hôtels de chaque wilaya, mais tous ne sont pas encore sous contrat avec Nzzor. Pour ceux-là, notre équipe réserve pour vous : vous nous envoyez vos dates sur WhatsApp, nous vérifions et confirmons le prix, puis vous payez et recevez votre bon."] },
      { h: "Puis-je annuler ou modifier ma réservation ?", p: ["Les conditions d'annulation sont celles de l'établissement, affichées sur sa page et rappelées avant le paiement. Pour annuler ou modifier, écrivez à contact@nzzor.com ou appelez-nous en indiquant votre référence de réservation."] },
      { h: "Comment suis-je remboursé ?", p: ["Le remboursement se fait uniquement sur la carte utilisée pour le paiement. Nous lançons le remboursement dans un délai de 7 jours après acceptation de votre demande ; le délai de crédit sur votre compte dépend ensuite de votre banque."] },
      { h: "Mon paiement a été refusé, que faire ?", p: ["Aucune réservation n'est confirmée sans autorisation de paiement, et vous n'êtes pas débité. Vérifiez les informations de votre carte et que le paiement en ligne est activé auprès de votre banque, puis réessayez. Pour un problème de paiement, la SATIM répond au 3020 (appel gratuit)."] },
      { h: "Où trouver ma réservation ?", p: ["Dans l'e-mail de confirmation (bouton « Voir ma réservation ») ou dans votre compte si vous en avez créé un. Gardez votre référence NZR-XXXX-XXXX : elle permet de retrouver votre réservation rapidement."] },
      { h: "Qui est derrière Nzzor ?", p: [`Nzzor est exploité par ${AGENCY}, agence de voyage agréée par le Ministère du Tourisme, basée à Sétif. Vous traitez avec une agence agréée, pas avec une plateforme anonyme.`] },
    ],
  },
  en: {
    title: "Frequently asked questions",
    intro: "Answers to the questions we hear most. For anything else, message us on WhatsApp.",
    sections: [
      { h: "How do I pay?", p: ["Online, with a CIB or Edahabia card, on SATIM's secure platform. International cards (Visa, Mastercard) cannot be used on an Algerian merchant site. The minimum online payment is 100 DZD."] },
      { h: "Are my card details safe?", p: ["Yes. You enter your card on SATIM's servers, protected by SSL and 3D Secure. We never have access to your card details."] },
      { h: "When will I get my confirmation?", p: ["As soon as the payment is authorised you receive your receipt. The confirmation and voucher are emailed within 24 hours at most. For an \"on request\" booking, we answer within 48 hours at most."] },
      { h: "Why are some hotels booked via WhatsApp?", p: ["We list the hotels of every wilaya, but not all of them are under contract with Nzzor yet. For those, our team books for you: send us your dates on WhatsApp, we check and confirm the price, then you pay and receive your voucher."] },
      { h: "Can I cancel or change my booking?", p: ["Cancellation terms are those of the establishment, shown on its page and repeated before payment. To cancel or change, write to contact@nzzor.com or call us with your booking reference."] },
      { h: "How am I refunded?", p: ["Refunds are made only to the card used for payment. We start the refund within 7 days of accepting your request; how long it takes to reach your account then depends on your bank."] },
      { h: "My payment was declined. What now?", p: ["No booking is confirmed without payment authorisation, and you are not charged. Check your card details and that online payment is enabled with your bank, then try again. For a payment problem, SATIM answers on 3020 (free call)."] },
      { h: "Where do I find my booking?", p: ["In the confirmation email (\"View my booking\" button) or in your account if you created one. Keep your NZR-XXXX-XXXX reference: it lets us find your booking quickly."] },
      { h: "Who is behind Nzzor?", p: [`Nzzor is operated by ${AGENCY}, a travel agency licensed by the Ministry of Tourism, based in Sétif. You are dealing with a licensed agency, not an anonymous platform.`] },
    ],
  },
  ar: {
    title: "الأسئلة الشائعة",
    intro: "إجابات عن أكثر الأسئلة التي تصلنا. لأي سؤال آخر، راسلنا عبر واتساب.",
    sections: [
      { h: "كيف أدفع؟", p: ["عبر الإنترنت ببطاقة CIB أو الذهبية، على منصة SATIM المؤمّنة. لا يمكن استخدام البطاقات الدولية (Visa، Mastercard) على موقع تجاري جزائري. الحد الأدنى للدفع عبر الإنترنت 100 دج."] },
      { h: "هل معلومات بطاقتي آمنة؟", p: ["نعم. تُدخل بيانات بطاقتك على خوادم SATIM المؤمّنة ببروتوكول SSL و3D Secure. لا نطّلع أبداً على بياناتك البنكية."] },
      { h: "متى أتلقى التأكيد؟", p: ["بمجرد قبول الدفع تتلقى إيصالك. يُرسل إليك التأكيد وقسيمة الحجز بالبريد الإلكتروني في أجل أقصاه 24 ساعة. بالنسبة للحجز «حسب الطلب»، نرد عليك في أجل أقصاه 48 ساعة."] },
      { h: "لماذا تُحجز بعض الفنادق عبر واتساب؟", p: ["نعرض فنادق كل ولاية، لكنها ليست كلها متعاقدة مع Nzzor بعد. بالنسبة لهذه الفنادق، يحجز فريقنا لك: ترسل لنا تواريخك عبر واتساب، نتحقق ونؤكد السعر، ثم تدفع وتتلقى قسيمتك."] },
      { h: "هل يمكنني إلغاء حجزي أو تعديله؟", p: ["شروط الإلغاء هي شروط المؤسسة، المعروضة في صفحتها والمذكورة قبل الدفع. للإلغاء أو التعديل، راسلنا على contact@nzzor.com أو اتصل بنا مع ذكر مرجع الحجز."] },
      { h: "كيف يتم استرداد أموالي؟", p: ["يتم الاسترداد حصرياً على البطاقة المستخدمة في الدفع. نبدأ إجراء الاسترداد في أجل 7 أيام من قبول طلبك، ثم تتوقف مدة وصوله إلى حسابك على بنكك."] },
      { h: "رُفض الدفع، ماذا أفعل؟", p: ["لا يُؤكَّد أي حجز دون قبول الدفع، ولا يُقتطع منك أي مبلغ. تحقق من معلومات بطاقتك ومن تفعيل الدفع عبر الإنترنت لدى بنكك، ثم أعد المحاولة. لأي مشكلة في الدفع، تجيب SATIM على الرقم 3020 (مكالمة مجانية)."] },
      { h: "أين أجد حجزي؟", p: ["في رسالة التأكيد (زر «عرض حجزي») أو في حسابك إن أنشأته. احتفظ بمرجعك NZR-XXXX-XXXX، فهو يسمح بإيجاد حجزك بسرعة."] },
      { h: "من يقف وراء Nzzor؟", p: [`يُشغَّل Nzzor من طرف ${AGENCY}، وكالة سياحة وأسفار معتمدة من وزارة السياحة، مقرها سطيف. أنت تتعامل مع وكالة معتمدة، لا مع منصة مجهولة.`] },
    ],
  },
};
