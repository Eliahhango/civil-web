const MAX_PAYLOAD_BYTES_DEFAULT = 1024 * 1024;
const MAX_SHORT_TEXT = 240;
const MAX_MEDIUM_TEXT = 1200;
const MAX_LONG_TEXT = 6000;
const MAX_SELECTOR_LENGTH = 256;
const MAX_PATHS_PER_RULE = 20;
const MAX_REPLACEMENTS = 300;
const MAX_RULES = 300;
const MAX_COLLECTION_ITEMS = 100;
const MAX_TAGS = 20;

const ALLOWED_RULE_ACTIONS = new Set([
  "text",
  "addClass",
  "remove",
  "attr:href",
  "attr:src",
  "attr:alt",
  "attr:title",
  "style:color",
  "style:background-color",
  "style:font-weight",
  "style:text-decoration",
  "style:opacity"
]);

const URL_PROTOCOL_ALLOWLIST = new Set(["http:", "https:", "mailto:", "tel:"]);
const CLASS_TOKEN_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ANCHOR_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getMaxPayloadBytes() {
  const raw = Number(process.env.CMS_MAX_PAYLOAD_BYTES || MAX_PAYLOAD_BYTES_DEFAULT);
  if (!Number.isFinite(raw) || raw <= 0) {
    return MAX_PAYLOAD_BYTES_DEFAULT;
  }
  return Math.floor(raw);
}

function fail(status, error) {
  return { ok: false, status, error };
}

function ok(data) {
  return { ok: true, data };
}

function isSafeUrl(value) {
  const urlValue = String(value || "").trim();
  if (!urlValue) {
    return true;
  }

  if (/^javascript:/i.test(urlValue)) {
    return false;
  }

  if (/^[/?#]|^\.\.?\//.test(urlValue)) {
    return true;
  }

  try {
    const parsed = new URL(urlValue);
    return URL_PROTOCOL_ALLOWLIST.has(parsed.protocol);
  } catch (_error) {
    return false;
  }
}

function safeString(value, fieldName, maxLength, options = {}) {
  if (typeof value !== "string") {
    return fail(400, `Invalid ${fieldName}: expected string`);
  }

  const normalized = options.trim === false ? value : value.trim();
  if (!normalized && options.required) {
    return fail(400, `Invalid ${fieldName}: required`);
  }

  if (normalized.length > maxLength) {
    return fail(400, `Invalid ${fieldName}: too long`);
  }

  if (options.slug && normalized && !SLUG_PATTERN.test(normalized)) {
    return fail(400, `Invalid ${fieldName}: invalid slug`);
  }

  if (options.anchorId && normalized && !ANCHOR_ID_PATTERN.test(normalized)) {
    return fail(400, `Invalid ${fieldName}: invalid id`);
  }

  if (options.email && normalized && !EMAIL_PATTERN.test(normalized)) {
    return fail(400, `Invalid ${fieldName}: invalid email`);
  }

  if (options.url && normalized && !isSafeUrl(normalized)) {
    return fail(400, `Invalid ${fieldName}: invalid URL`);
  }

  return ok(normalized);
}

function ensureArray(value, fieldName, maxItems) {
  if (!Array.isArray(value)) {
    return fail(400, `Invalid ${fieldName}: expected array`);
  }

  if (value.length > maxItems) {
    return fail(400, `Invalid ${fieldName}: too many items`);
  }

  return ok(value);
}

function validateStringArray(value, fieldName, options = {}) {
  const arrayResult = ensureArray(value, fieldName, options.maxItems || MAX_COLLECTION_ITEMS);
  if (!arrayResult.ok) {
    return arrayResult;
  }

  const normalized = [];
  for (let index = 0; index < arrayResult.data.length; index += 1) {
    const itemResult = safeString(
      arrayResult.data[index],
      `${fieldName}[${index}]`,
      options.maxLength || MAX_MEDIUM_TEXT,
      { required: options.requiredItems === true, url: options.url === true, email: options.email === true }
    );
    if (!itemResult.ok) {
      return itemResult;
    }

    if (!itemResult.data && options.skipEmpty !== false) {
      continue;
    }

    normalized.push(itemResult.data);
  }

  return ok(normalized);
}

function validateReplacement(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid globalReplacements[${index}]`);
  }

  const from = safeString(value.from || "", `globalReplacements[${index}].from`, 400, { required: true });
  if (!from.ok) {
    return from;
  }

  const to = safeString(value.to || "", `globalReplacements[${index}].to`, MAX_LONG_TEXT);
  if (!to.ok) {
    return to;
  }

  return ok({
    from: from.data,
    to: to.data,
    wholeWord: value.wholeWord === true,
    caseSensitive: value.caseSensitive === true
  });
}

function validateRule(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid rules[${index}]`);
  }

  if (!Array.isArray(value.paths) || value.paths.length === 0 || value.paths.length > MAX_PATHS_PER_RULE) {
    return fail(400, `Invalid rules[${index}].paths`);
  }

  const normalizedPaths = [];
  for (let i = 0; i < value.paths.length; i += 1) {
    const pathValueResult = safeString(value.paths[i], `rules[${index}].paths[${i}]`, 240, { required: true });
    if (!pathValueResult.ok) {
      return pathValueResult;
    }

    const pathValue = pathValueResult.data;
    if (!pathValue.startsWith("/") && pathValue !== "*") {
      return fail(400, `Invalid rules[${index}].paths[${i}]`);
    }
    normalizedPaths.push(pathValue);
  }

  const selectorResult = safeString(value.selector || "", `rules[${index}].selector`, MAX_SELECTOR_LENGTH, { required: true });
  if (!selectorResult.ok) {
    return selectorResult;
  }

  const actionResult = safeString(value.action || "", `rules[${index}].action`, 64, { required: true });
  if (!actionResult.ok) {
    return actionResult;
  }

  const action = actionResult.data;
  if (!ALLOWED_RULE_ACTIONS.has(action)) {
    return fail(400, `Invalid rules[${index}].action`);
  }

  const valueResult = safeString(value.value || "", `rules[${index}].value`, MAX_LONG_TEXT);
  if (!valueResult.ok) {
    return valueResult;
  }

  const ruleValue = valueResult.data;
  if ((action === "attr:href" || action === "attr:src") && !isSafeUrl(ruleValue)) {
    return fail(400, `Invalid rules[${index}].value URL`);
  }

  if (action === "addClass") {
    const tokens = ruleValue.split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return fail(400, `Invalid rules[${index}].value class list`);
    }

    for (let i = 0; i < tokens.length; i += 1) {
      if (!CLASS_TOKEN_PATTERN.test(tokens[i])) {
        return fail(400, `Invalid rules[${index}].value class token`);
      }
    }
  }

  if (action.indexOf("style:") === 0 && /(expression\s*\(|javascript:|url\s*\()/i.test(ruleValue)) {
    return fail(400, `Invalid rules[${index}].value style`);
  }

  return ok({
    paths: normalizedPaths,
    selector: selectorResult.data,
    action,
    value: ruleValue
  });
}

function validateImageSet(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}: expected object`);
  }

  const primary = safeString(value.primary || "", `${fieldName}.primary`, 500, { url: true });
  if (!primary.ok) return primary;
  const secondary = safeString(value.secondary || "", `${fieldName}.secondary`, 500, { url: true });
  if (!secondary.ok) return secondary;
  const values = safeString(value.values || "", `${fieldName}.values`, 500, { url: true });
  if (!values.ok) return values;

  return ok({
    primary: primary.data,
    secondary: secondary.data,
    values: values.data
  });
}

function validateFeatureCard(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}`);
  }

  const title = safeString(value.title || "", `${fieldName}.title`, MAX_SHORT_TEXT, { required: true });
  if (!title.ok) return title;
  const description = safeString(value.description || "", `${fieldName}.description`, MAX_MEDIUM_TEXT, { required: true });
  if (!description.ok) return description;
  const image = safeString(value.image || "", `${fieldName}.image`, 500, { url: true });
  if (!image.ok) return image;

  return ok({
    title: title.data,
    description: description.data,
    image: image.data
  });
}

function validateTitleDescriptionItem(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}`);
  }

  const title = safeString(value.title || "", `${fieldName}.title`, MAX_SHORT_TEXT, { required: true });
  if (!title.ok) return title;
  const description = safeString(value.description || "", `${fieldName}.description`, MAX_MEDIUM_TEXT, { required: true });
  if (!description.ok) return description;

  return ok({
    title: title.data,
    description: description.data
  });
}

function validateTitleDescriptionImageItem(value, fieldName) {
  const baseResult = validateTitleDescriptionItem(value, fieldName);
  if (!baseResult.ok) {
    return baseResult;
  }

  const image = safeString(value.image || "", `${fieldName}.image`, 500, { url: true });
  if (!image.ok) return image;

  return ok({
    ...baseResult.data,
    image: image.data
  });
}

function validateFaqItem(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}`);
  }

  const question = safeString(value.question || "", `${fieldName}.question`, MAX_SHORT_TEXT, { required: true });
  if (!question.ok) return question;
  const answer = safeString(value.answer || "", `${fieldName}.answer`, MAX_LONG_TEXT, { required: true });
  if (!answer.ok) return answer;

  return ok({
    question: question.data,
    answer: answer.data
  });
}

function validateFaqCategory(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid faqs.categories[${index}]`);
  }

  const navLabel = safeString(value.navLabel || "", `faqs.categories[${index}].navLabel`, MAX_SHORT_TEXT, { required: true });
  if (!navLabel.ok) return navLabel;
  const title = safeString(value.title || "", `faqs.categories[${index}].title`, MAX_SHORT_TEXT, { required: true });
  if (!title.ok) return title;

  const itemsResult = ensureArray(value.items || [], `faqs.categories[${index}].items`, MAX_COLLECTION_ITEMS);
  if (!itemsResult.ok) {
    return itemsResult;
  }

  const items = [];
  for (let itemIndex = 0; itemIndex < itemsResult.data.length; itemIndex += 1) {
    const itemResult = validateFaqItem(itemsResult.data[itemIndex], `faqs.categories[${index}].items[${itemIndex}]`);
    if (!itemResult.ok) {
      return itemResult;
    }
    items.push(itemResult.data);
  }

  const idSource = String(value.id || `faq-${index + 1}`).trim();
  const id = safeString(idSource, `faqs.categories[${index}].id`, 80, { required: true, anchorId: true });
  if (!id.ok) {
    return id;
  }

  return ok({
    id: id.data,
    navLabel: navLabel.data,
    title: title.data,
    items
  });
}

function validateAbout(value) {
  if (!isPlainObject(value)) {
    return fail(400, "Invalid about: expected object");
  }

  const images = validateImageSet(value.images || {}, "about.images");
  if (!images.ok) return images;

  const featureCardsInput = ensureArray(value.featureCards || [], "about.featureCards", MAX_COLLECTION_ITEMS);
  if (!featureCardsInput.ok) return featureCardsInput;
  const featureCards = [];
  for (let index = 0; index < featureCardsInput.data.length; index += 1) {
    const item = validateFeatureCard(featureCardsInput.data[index], `about.featureCards[${index}]`);
    if (!item.ok) return item;
    featureCards.push(item.data);
  }

  const bulletPoints = validateStringArray(value.bulletPoints || [], "about.bulletPoints", {
    maxItems: MAX_COLLECTION_ITEMS,
    maxLength: MAX_MEDIUM_TEXT
  });
  if (!bulletPoints.ok) return bulletPoints;

  const pillarsInput = ensureArray(value.pillars || [], "about.pillars", MAX_COLLECTION_ITEMS);
  if (!pillarsInput.ok) return pillarsInput;
  const pillars = [];
  for (let index = 0; index < pillarsInput.data.length; index += 1) {
    const item = validateTitleDescriptionItem(pillarsInput.data[index], `about.pillars[${index}]`);
    if (!item.ok) return item;
    pillars.push(item.data);
  }

  const heroTitle = safeString(value.heroTitle || "", "about.heroTitle", MAX_SHORT_TEXT, { required: true });
  if (!heroTitle.ok) return heroTitle;
  const label = safeString(value.label || "", "about.label", MAX_SHORT_TEXT);
  if (!label.ok) return label;
  const title = safeString(value.title || "", "about.title", MAX_MEDIUM_TEXT, { required: true });
  if (!title.ok) return title;
  const description = safeString(value.description || "", "about.description", MAX_LONG_TEXT, { required: true });
  if (!description.ok) return description;
  const experienceLabel = safeString(value.experienceLabel || "", "about.experienceLabel", MAX_MEDIUM_TEXT);
  if (!experienceLabel.ok) return experienceLabel;
  const valuesTitle = safeString(value.valuesTitle || "", "about.valuesTitle", MAX_SHORT_TEXT);
  if (!valuesTitle.ok) return valuesTitle;
  const valuesDescription = safeString(value.valuesDescription || "", "about.valuesDescription", MAX_LONG_TEXT);
  if (!valuesDescription.ok) return valuesDescription;
  const faqIntroTitle = safeString(value.faqIntroTitle || "", "about.faqIntroTitle", MAX_SHORT_TEXT);
  if (!faqIntroTitle.ok) return faqIntroTitle;
  const faqIntroDescription = safeString(value.faqIntroDescription || "", "about.faqIntroDescription", MAX_LONG_TEXT);
  if (!faqIntroDescription.ok) return faqIntroDescription;

  return ok({
    heroTitle: heroTitle.data,
    label: label.data,
    title: title.data,
    description: description.data,
    experienceLabel: experienceLabel.data,
    images: images.data,
    featureCards,
    bulletPoints: bulletPoints.data,
    pillars,
    valuesTitle: valuesTitle.data,
    valuesDescription: valuesDescription.data,
    faqIntroTitle: faqIntroTitle.data,
    faqIntroDescription: faqIntroDescription.data
  });
}

function normalizePhoneHref(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function deriveCardHref(title, value, href) {
  const explicit = String(href || "").trim();
  if (explicit) {
    return explicit;
  }

  if (EMAIL_PATTERN.test(String(value || "").trim())) {
    return `mailto:${String(value || "").trim()}`;
  }

  if (/phone/i.test(String(title || "")) || /^\+?[\d\s()-]+$/.test(String(value || "").trim())) {
    return normalizePhoneHref(value);
  }

  return "";
}

function validateContactCard(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}`);
  }

  const title = safeString(value.title || "", `${fieldName}.title`, MAX_SHORT_TEXT, { required: true });
  if (!title.ok) return title;
  const cardValue = safeString(value.value || "", `${fieldName}.value`, MAX_MEDIUM_TEXT, { required: true });
  if (!cardValue.ok) return cardValue;
  const href = safeString(deriveCardHref(title.data, cardValue.data, value.href), `${fieldName}.href`, 500, { url: true });
  if (!href.ok) return href;

  return ok({
    title: title.data,
    value: cardValue.data,
    href: href.data
  });
}

function validateWorkingHour(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}`);
  }

  const days = safeString(value.days || "", `${fieldName}.days`, MAX_SHORT_TEXT, { required: true });
  if (!days.ok) return days;
  const hours = safeString(value.hours || "", `${fieldName}.hours`, MAX_SHORT_TEXT, { required: true });
  if (!hours.ok) return hours;

  return ok({
    days: days.data,
    hours: hours.data
  });
}

function validateContact(value) {
  if (!isPlainObject(value)) {
    return fail(400, "Invalid contact: expected object");
  }

  const cardsInput = ensureArray(value.cards || [], "contact.cards", MAX_COLLECTION_ITEMS);
  if (!cardsInput.ok) return cardsInput;
  const cards = [];
  for (let index = 0; index < cardsInput.data.length; index += 1) {
    const item = validateContactCard(cardsInput.data[index], `contact.cards[${index}]`);
    if (!item.ok) return item;
    cards.push(item.data);
  }

  const workingHoursInput = ensureArray(value.workingHours || [], "contact.workingHours", MAX_COLLECTION_ITEMS);
  if (!workingHoursInput.ok) return workingHoursInput;
  const workingHours = [];
  for (let index = 0; index < workingHoursInput.data.length; index += 1) {
    const item = validateWorkingHour(workingHoursInput.data[index], `contact.workingHours[${index}]`);
    if (!item.ok) return item;
    workingHours.push(item.data);
  }

  const heroTitle = safeString(value.heroTitle || "", "contact.heroTitle", MAX_SHORT_TEXT, { required: true });
  if (!heroTitle.ok) return heroTitle;
  const label = safeString(value.label || "", "contact.label", MAX_SHORT_TEXT);
  if (!label.ok) return label;
  const title = safeString(value.title || "", "contact.title", MAX_MEDIUM_TEXT, { required: true });
  if (!title.ok) return title;
  const description = safeString(value.description || "", "contact.description", MAX_LONG_TEXT, { required: true });
  if (!description.ok) return description;
  const formTitle = safeString(value.formTitle || "", "contact.formTitle", MAX_SHORT_TEXT, { required: true });
  if (!formTitle.ok) return formTitle;
  const formDescription = safeString(value.formDescription || "", "contact.formDescription", MAX_LONG_TEXT);
  if (!formDescription.ok) return formDescription;
  const mapEmbedUrl = safeString(value.mapEmbedUrl || "", "contact.mapEmbedUrl", 2000, { url: true });
  if (!mapEmbedUrl.ok) return mapEmbedUrl;
  const footerAddress = safeString(value.footerAddress || "", "contact.footerAddress", MAX_MEDIUM_TEXT);
  if (!footerAddress.ok) return footerAddress;
  const footerPhone = safeString(value.footerPhone || "", "contact.footerPhone", MAX_SHORT_TEXT);
  if (!footerPhone.ok) return footerPhone;
  const footerEmail = safeString(value.footerEmail || "", "contact.footerEmail", 200, { email: true });
  if (!footerEmail.ok) return footerEmail;

  return ok({
    heroTitle: heroTitle.data,
    label: label.data,
    title: title.data,
    description: description.data,
    cards,
    formTitle: formTitle.data,
    formDescription: formDescription.data,
    mapEmbedUrl: mapEmbedUrl.data,
    workingHours,
    footerAddress: footerAddress.data,
    footerPhone: footerPhone.data,
    footerEmail: footerEmail.data
  });
}

function validateMeta(value, fieldName) {
  if (!isPlainObject(value)) {
    return ok({
      category: "",
      duration: "",
      date: "",
      location: ""
    });
  }

  const category = safeString(value.category || "", `${fieldName}.category`, MAX_SHORT_TEXT);
  if (!category.ok) return category;
  const duration = safeString(value.duration || "", `${fieldName}.duration`, MAX_SHORT_TEXT);
  if (!duration.ok) return duration;
  const date = safeString(value.date || "", `${fieldName}.date`, MAX_SHORT_TEXT);
  if (!date.ok) return date;
  const location = safeString(value.location || "", `${fieldName}.location`, MAX_MEDIUM_TEXT);
  if (!location.ok) return location;

  return ok({
    category: category.data,
    duration: duration.data,
    date: date.data,
    location: location.data
  });
}

function validateServiceItem(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid services[${index}]`);
  }

  const slug = safeString(value.slug || "", `services[${index}].slug`, 120, { required: true, slug: true });
  if (!slug.ok) return slug;
  const title = safeString(value.title || "", `services[${index}].title`, MAX_SHORT_TEXT, { required: true });
  if (!title.ok) return title;
  const excerpt = safeString(value.excerpt || "", `services[${index}].excerpt`, MAX_MEDIUM_TEXT);
  if (!excerpt.ok) return excerpt;
  const image = safeString(value.image || "", `services[${index}].image`, 500, { url: true });
  if (!image.ok) return image;
  const detailImage = safeString(value.detailImage || "", `services[${index}].detailImage`, 500, { url: true });
  if (!detailImage.ok) return detailImage;
  const whyChooseTitle = safeString(value.whyChooseTitle || "", `services[${index}].whyChooseTitle`, MAX_SHORT_TEXT);
  if (!whyChooseTitle.ok) return whyChooseTitle;
  const whyChooseDescription = safeString(value.whyChooseDescription || "", `services[${index}].whyChooseDescription`, MAX_LONG_TEXT);
  if (!whyChooseDescription.ok) return whyChooseDescription;
  const offerTitle = safeString(value.offerTitle || "", `services[${index}].offerTitle`, MAX_SHORT_TEXT);
  if (!offerTitle.ok) return offerTitle;
  const offerDescription = safeString(value.offerDescription || "", `services[${index}].offerDescription`, MAX_LONG_TEXT);
  if (!offerDescription.ok) return offerDescription;
  const processTitle = safeString(value.processTitle || "", `services[${index}].processTitle`, MAX_SHORT_TEXT);
  if (!processTitle.ok) return processTitle;
  const faqTitle = safeString(value.faqTitle || "", `services[${index}].faqTitle`, MAX_SHORT_TEXT);
  if (!faqTitle.ok) return faqTitle;

  const intro = validateStringArray(value.intro || [], `services[${index}].intro`, {
    maxItems: MAX_COLLECTION_ITEMS,
    maxLength: MAX_LONG_TEXT
  });
  if (!intro.ok) return intro;

  const offerItems = validateStringArray(value.offerItems || [], `services[${index}].offerItems`, {
    maxItems: MAX_COLLECTION_ITEMS,
    maxLength: MAX_MEDIUM_TEXT
  });
  if (!offerItems.ok) return offerItems;

  const whyChooseItemsInput = ensureArray(value.whyChooseItems || [], `services[${index}].whyChooseItems`, MAX_COLLECTION_ITEMS);
  if (!whyChooseItemsInput.ok) return whyChooseItemsInput;
  const whyChooseItems = [];
  for (let itemIndex = 0; itemIndex < whyChooseItemsInput.data.length; itemIndex += 1) {
    const itemResult = validateTitleDescriptionImageItem(
      whyChooseItemsInput.data[itemIndex],
      `services[${index}].whyChooseItems[${itemIndex}]`
    );
    if (!itemResult.ok) return itemResult;
    whyChooseItems.push(itemResult.data);
  }

  const processStepsInput = ensureArray(value.processSteps || [], `services[${index}].processSteps`, MAX_COLLECTION_ITEMS);
  if (!processStepsInput.ok) return processStepsInput;
  const processSteps = [];
  for (let itemIndex = 0; itemIndex < processStepsInput.data.length; itemIndex += 1) {
    const itemResult = validateTitleDescriptionItem(
      processStepsInput.data[itemIndex],
      `services[${index}].processSteps[${itemIndex}]`
    );
    if (!itemResult.ok) return itemResult;
    processSteps.push(itemResult.data);
  }

  const faqItemsInput = ensureArray(value.faqItems || [], `services[${index}].faqItems`, MAX_COLLECTION_ITEMS);
  if (!faqItemsInput.ok) return faqItemsInput;
  const faqItems = [];
  for (let itemIndex = 0; itemIndex < faqItemsInput.data.length; itemIndex += 1) {
    const itemResult = validateFaqItem(faqItemsInput.data[itemIndex], `services[${index}].faqItems[${itemIndex}]`);
    if (!itemResult.ok) return itemResult;
    faqItems.push(itemResult.data);
  }

  return ok({
    id: slug.data,
    slug: slug.data,
    title: title.data,
    excerpt: excerpt.data,
    image: image.data,
    url: `/elitech/services/${slug.data}/`,
    order: index + 1,
    intro: intro.data,
    detailImage: detailImage.data,
    whyChooseTitle: whyChooseTitle.data,
    whyChooseDescription: whyChooseDescription.data,
    whyChooseItems,
    offerTitle: offerTitle.data,
    offerDescription: offerDescription.data,
    offerItems: offerItems.data,
    processTitle: processTitle.data,
    processSteps,
    faqTitle: faqTitle.data,
    faqItems
  });
}

function validateProjectItem(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid projects[${index}]`);
  }

  const slug = safeString(value.slug || "", `projects[${index}].slug`, 120, { required: true, slug: true });
  if (!slug.ok) return slug;
  const title = safeString(value.title || "", `projects[${index}].title`, MAX_SHORT_TEXT, { required: true });
  if (!title.ok) return title;
  const category = safeString(value.category || "", `projects[${index}].category`, MAX_SHORT_TEXT);
  if (!category.ok) return category;
  const image = safeString(value.image || "", `projects[${index}].image`, 500, { url: true });
  if (!image.ok) return image;
  const detailImage = safeString(value.detailImage || "", `projects[${index}].detailImage`, 500, { url: true });
  if (!detailImage.ok) return detailImage;
  const keyFeaturesTitle = safeString(value.keyFeaturesTitle || "", `projects[${index}].keyFeaturesTitle`, MAX_SHORT_TEXT);
  if (!keyFeaturesTitle.ok) return keyFeaturesTitle;
  const keyFeaturesDescription = safeString(value.keyFeaturesDescription || "", `projects[${index}].keyFeaturesDescription`, MAX_LONG_TEXT);
  if (!keyFeaturesDescription.ok) return keyFeaturesDescription;
  const processTitle = safeString(value.processTitle || "", `projects[${index}].processTitle`, MAX_SHORT_TEXT);
  if (!processTitle.ok) return processTitle;
  const solutionsTitle = safeString(value.solutionsTitle || "", `projects[${index}].solutionsTitle`, MAX_SHORT_TEXT);
  if (!solutionsTitle.ok) return solutionsTitle;
  const problemTitle = safeString(value.problemTitle || "", `projects[${index}].problemTitle`, MAX_SHORT_TEXT);
  if (!problemTitle.ok) return problemTitle;
  const problemText = safeString(value.problemText || "", `projects[${index}].problemText`, MAX_LONG_TEXT);
  if (!problemText.ok) return problemText;
  const solutionsHeading = safeString(value.solutionsHeading || "", `projects[${index}].solutionsHeading`, MAX_SHORT_TEXT);
  if (!solutionsHeading.ok) return solutionsHeading;
  const solutionsText = safeString(value.solutionsText || "", `projects[${index}].solutionsText`, MAX_LONG_TEXT);
  if (!solutionsText.ok) return solutionsText;
  const faqTitle = safeString(value.faqTitle || "", `projects[${index}].faqTitle`, MAX_SHORT_TEXT);
  if (!faqTitle.ok) return faqTitle;

  const meta = validateMeta(value.meta || {}, `projects[${index}].meta`);
  if (!meta.ok) return meta;

  const intro = validateStringArray(value.intro || [], `projects[${index}].intro`, {
    maxItems: MAX_COLLECTION_ITEMS,
    maxLength: MAX_LONG_TEXT
  });
  if (!intro.ok) return intro;

  const keyFeaturesInput = ensureArray(value.keyFeatures || [], `projects[${index}].keyFeatures`, MAX_COLLECTION_ITEMS);
  if (!keyFeaturesInput.ok) return keyFeaturesInput;
  const keyFeatures = [];
  for (let itemIndex = 0; itemIndex < keyFeaturesInput.data.length; itemIndex += 1) {
    const itemResult = validateTitleDescriptionImageItem(
      keyFeaturesInput.data[itemIndex],
      `projects[${index}].keyFeatures[${itemIndex}]`
    );
    if (!itemResult.ok) return itemResult;
    keyFeatures.push(itemResult.data);
  }

  const processStepsInput = ensureArray(value.processSteps || [], `projects[${index}].processSteps`, MAX_COLLECTION_ITEMS);
  if (!processStepsInput.ok) return processStepsInput;
  const processSteps = [];
  for (let itemIndex = 0; itemIndex < processStepsInput.data.length; itemIndex += 1) {
    const itemResult = validateTitleDescriptionItem(
      processStepsInput.data[itemIndex],
      `projects[${index}].processSteps[${itemIndex}]`
    );
    if (!itemResult.ok) return itemResult;
    processSteps.push(itemResult.data);
  }

  const faqItemsInput = ensureArray(value.faqItems || [], `projects[${index}].faqItems`, MAX_COLLECTION_ITEMS);
  if (!faqItemsInput.ok) return faqItemsInput;
  const faqItems = [];
  for (let itemIndex = 0; itemIndex < faqItemsInput.data.length; itemIndex += 1) {
    const itemResult = validateFaqItem(faqItemsInput.data[itemIndex], `projects[${index}].faqItems[${itemIndex}]`);
    if (!itemResult.ok) return itemResult;
    faqItems.push(itemResult.data);
  }

  return ok({
    id: slug.data,
    slug: slug.data,
    title: title.data,
    category: category.data,
    image: image.data,
    url: `/elitech/projects/${slug.data}/`,
    order: index + 1,
    meta: meta.data,
    intro: intro.data,
    detailImage: detailImage.data,
    keyFeaturesTitle: keyFeaturesTitle.data,
    keyFeaturesDescription: keyFeaturesDescription.data,
    keyFeatures,
    processTitle: processTitle.data,
    processSteps,
    solutionsTitle: solutionsTitle.data,
    problemTitle: problemTitle.data,
    problemText: problemText.data,
    solutionsHeading: solutionsHeading.data,
    solutionsText: solutionsText.data,
    faqTitle: faqTitle.data,
    faqItems
  });
}

function validateBlogSection(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}`);
  }

  const title = safeString(value.title || "", `${fieldName}.title`, MAX_SHORT_TEXT, { required: true });
  if (!title.ok) return title;
  const paragraphs = validateStringArray(value.paragraphs || [], `${fieldName}.paragraphs`, {
    maxItems: MAX_COLLECTION_ITEMS,
    maxLength: MAX_LONG_TEXT
  });
  if (!paragraphs.ok) return paragraphs;
  const bullets = validateStringArray(value.bullets || [], `${fieldName}.bullets`, {
    maxItems: MAX_COLLECTION_ITEMS,
    maxLength: MAX_MEDIUM_TEXT
  });
  if (!bullets.ok) return bullets;

  return ok({
    title: title.data,
    paragraphs: paragraphs.data,
    bullets: bullets.data
  });
}

function validateBlogBody(value, fieldName) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid ${fieldName}: expected object`);
  }

  const intro = validateStringArray(value.intro || [], `${fieldName}.intro`, {
    maxItems: MAX_COLLECTION_ITEMS,
    maxLength: MAX_LONG_TEXT
  });
  if (!intro.ok) return intro;

  const quote = safeString(value.quote || "", `${fieldName}.quote`, MAX_LONG_TEXT);
  if (!quote.ok) return quote;

  const sectionsInput = ensureArray(value.sections || [], `${fieldName}.sections`, MAX_COLLECTION_ITEMS);
  if (!sectionsInput.ok) return sectionsInput;
  const sections = [];
  for (let index = 0; index < sectionsInput.data.length; index += 1) {
    const section = validateBlogSection(sectionsInput.data[index], `${fieldName}.sections[${index}]`);
    if (!section.ok) return section;
    sections.push(section.data);
  }

  return ok({
    intro: intro.data,
    quote: quote.data,
    sections
  });
}

function validateBlogPost(value, index) {
  if (!isPlainObject(value)) {
    return fail(400, `Invalid blogPosts[${index}]`);
  }

  const slug = safeString(value.slug || "", `blogPosts[${index}].slug`, 120, { required: true, slug: true });
  if (!slug.ok) return slug;
  const title = safeString(value.title || "", `blogPosts[${index}].title`, MAX_MEDIUM_TEXT, { required: true });
  if (!title.ok) return title;
  const category = safeString(value.category || "", `blogPosts[${index}].category`, MAX_SHORT_TEXT);
  if (!category.ok) return category;
  const date = safeString(value.date || "", `blogPosts[${index}].date`, MAX_SHORT_TEXT);
  if (!date.ok) return date;
  const image = safeString(value.image || "", `blogPosts[${index}].image`, 500, { url: true });
  if (!image.ok) return image;
  const url = safeString(value.url || `/elitech/blog/${slug.data}/`, `blogPosts[${index}].url`, 500, { url: true });
  if (!url.ok) return url;
  const excerpt = safeString(value.excerpt || "", `blogPosts[${index}].excerpt`, MAX_LONG_TEXT);
  if (!excerpt.ok) return excerpt;
  const body = validateBlogBody(value.body || {}, `blogPosts[${index}].body`);
  if (!body.ok) return body;
  const tags = validateStringArray(value.tags || [], `blogPosts[${index}].tags`, {
    maxItems: MAX_TAGS,
    maxLength: MAX_SHORT_TEXT
  });
  if (!tags.ok) return tags;

  return ok({
    id: slug.data,
    slug: slug.data,
    title: title.data,
    category: category.data,
    date: date.data,
    image: image.data,
    url: url.data,
    excerpt: excerpt.data,
    body: body.data,
    tags: tags.data
  });
}

function parseBody(req, maxBytes) {
  const contentLength = Number((req.headers && req.headers["content-length"]) || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return fail(413, "Payload too large");
  }

  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body, "utf8") > maxBytes) {
      return fail(413, "Payload too large");
    }

    try {
      return ok(JSON.parse(req.body));
    } catch (_error) {
      return fail(400, "Malformed JSON payload");
    }
  }

  if (!isPlainObject(req.body)) {
    return fail(400, "Invalid payload object");
  }

  const serialized = JSON.stringify(req.body);
  if (Buffer.byteLength(serialized, "utf8") > maxBytes) {
    return fail(413, "Payload too large");
  }

  return ok(req.body);
}

function validateAndNormalizePayload(req) {
  const maxBytes = getMaxPayloadBytes();
  const parsedBodyResult = parseBody(req, maxBytes);
  if (!parsedBodyResult.ok) {
    return parsedBodyResult;
  }

  const body = parsedBodyResult.data;
  const bodyKeys = Object.keys(body || {});
  const allowedTopLevelKeys = [
    "site",
    "seo",
    "globalReplacements",
    "rules",
    "about",
    "contact",
    "faqs",
    "servicesPage",
    "services",
    "projectsPage",
    "projects",
    "blogPage",
    "blogPosts"
  ];

  for (let i = 0; i < bodyKeys.length; i += 1) {
    if (!allowedTopLevelKeys.includes(bodyKeys[i])) {
      return fail(400, `Invalid payload field: ${bodyKeys[i]}`);
    }
  }

  const siteValue = isPlainObject(body.site) ? body.site : {};
  const siteName = safeString(siteValue.name || "", "site.name", MAX_SHORT_TEXT);
  if (!siteName.ok) return siteName;
  const siteTagline = safeString(siteValue.tagline || "", "site.tagline", MAX_MEDIUM_TEXT);
  if (!siteTagline.ok) return siteTagline;

  const seoValue = isPlainObject(body.seo) ? body.seo : {};
  const seoTitle = safeString(seoValue.title || "", "seo.title", MAX_MEDIUM_TEXT);
  if (!seoTitle.ok) return seoTitle;
  const seoDescription = safeString(seoValue.description || "", "seo.description", MAX_LONG_TEXT);
  if (!seoDescription.ok) return seoDescription;
  const seoImage = safeString(seoValue.image || "", "seo.image", 500, { url: true });
  if (!seoImage.ok) return seoImage;
  const seoUrl = safeString(seoValue.url || "", "seo.url", 500, { url: true });
  if (!seoUrl.ok) return seoUrl;
  const seoTwitterCard = safeString(seoValue.twitterCard || "", "seo.twitterCard", 120);
  if (!seoTwitterCard.ok) return seoTwitterCard;

  if (!Array.isArray(body.globalReplacements)) {
    return fail(400, "Invalid globalReplacements: expected array");
  }
  if (body.globalReplacements.length > MAX_REPLACEMENTS) {
    return fail(400, "Too many global replacements");
  }

  const globalReplacements = [];
  for (let i = 0; i < body.globalReplacements.length; i += 1) {
    const replacementResult = validateReplacement(body.globalReplacements[i], i);
    if (!replacementResult.ok) {
      return replacementResult;
    }
    globalReplacements.push(replacementResult.data);
  }

  if (!Array.isArray(body.rules)) {
    return fail(400, "Invalid rules: expected array");
  }
  if (body.rules.length > MAX_RULES) {
    return fail(400, "Too many rules");
  }

  const rules = [];
  for (let i = 0; i < body.rules.length; i += 1) {
    const ruleResult = validateRule(body.rules[i], i);
    if (!ruleResult.ok) {
      return ruleResult;
    }
    rules.push(ruleResult.data);
  }

  const about = validateAbout(body.about || {});
  if (!about.ok) return about;

  const contact = validateContact(body.contact || {});
  if (!contact.ok) return contact;

  const faqsInput = isPlainObject(body.faqs) ? body.faqs : {};
  const faqsHeroTitle = safeString(faqsInput.heroTitle || "", "faqs.heroTitle", MAX_SHORT_TEXT, { required: true });
  if (!faqsHeroTitle.ok) return faqsHeroTitle;
  const faqCategoriesInput = ensureArray(faqsInput.categories || [], "faqs.categories", MAX_COLLECTION_ITEMS);
  if (!faqCategoriesInput.ok) return faqCategoriesInput;
  const faqCategories = [];
  for (let index = 0; index < faqCategoriesInput.data.length; index += 1) {
    const categoryResult = validateFaqCategory(faqCategoriesInput.data[index], index);
    if (!categoryResult.ok) return categoryResult;
    faqCategories.push(categoryResult.data);
  }

  const servicesPageInput = isPlainObject(body.servicesPage) ? body.servicesPage : {};
  const servicesPageHeroTitle = safeString(servicesPageInput.heroTitle || "", "servicesPage.heroTitle", MAX_SHORT_TEXT, {
    required: true
  });
  if (!servicesPageHeroTitle.ok) return servicesPageHeroTitle;

  const servicesInput = ensureArray(body.services || [], "services", MAX_COLLECTION_ITEMS);
  if (!servicesInput.ok) return servicesInput;
  const services = [];
  for (let index = 0; index < servicesInput.data.length; index += 1) {
    const itemResult = validateServiceItem(servicesInput.data[index], index);
    if (!itemResult.ok) return itemResult;
    services.push(itemResult.data);
  }

  const projectsPageInput = isPlainObject(body.projectsPage) ? body.projectsPage : {};
  const projectsPageHeroTitle = safeString(projectsPageInput.heroTitle || "", "projectsPage.heroTitle", MAX_SHORT_TEXT, {
    required: true
  });
  if (!projectsPageHeroTitle.ok) return projectsPageHeroTitle;

  const projectsInput = ensureArray(body.projects || [], "projects", MAX_COLLECTION_ITEMS);
  if (!projectsInput.ok) return projectsInput;
  const projects = [];
  for (let index = 0; index < projectsInput.data.length; index += 1) {
    const itemResult = validateProjectItem(projectsInput.data[index], index);
    if (!itemResult.ok) return itemResult;
    projects.push(itemResult.data);
  }

  const blogPageInput = isPlainObject(body.blogPage) ? body.blogPage : {};
  const blogPageHeroTitle = safeString(blogPageInput.heroTitle || "", "blogPage.heroTitle", MAX_SHORT_TEXT, {
    required: true
  });
  if (!blogPageHeroTitle.ok) return blogPageHeroTitle;

  const blogPostsInput = ensureArray(body.blogPosts || [], "blogPosts", MAX_COLLECTION_ITEMS);
  if (!blogPostsInput.ok) return blogPostsInput;
  const blogPosts = [];
  for (let index = 0; index < blogPostsInput.data.length; index += 1) {
    const itemResult = validateBlogPost(blogPostsInput.data[index], index);
    if (!itemResult.ok) return itemResult;
    blogPosts.push(itemResult.data);
  }

  return ok({
    site: {
      name: siteName.data,
      tagline: siteTagline.data
    },
    seo: {
      title: seoTitle.data,
      description: seoDescription.data,
      image: seoImage.data,
      url: seoUrl.data,
      twitterCard: seoTwitterCard.data
    },
    globalReplacements,
    rules,
    about: about.data,
    contact: contact.data,
    faqs: {
      heroTitle: faqsHeroTitle.data,
      categories: faqCategories
    },
    servicesPage: {
      heroTitle: servicesPageHeroTitle.data
    },
    services,
    projectsPage: {
      heroTitle: projectsPageHeroTitle.data
    },
    projects,
    blogPage: {
      heroTitle: blogPageHeroTitle.data
    },
    blogPosts
  });
}

module.exports = {
  ALLOWED_RULE_ACTIONS,
  validateAndNormalizePayload
};
