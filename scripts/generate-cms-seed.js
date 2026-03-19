const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = process.cwd();
const ELITECH_ROOT = path.join(ROOT, "elitech");
const LEGACY_CONTENT_PATH = path.join(ELITECH_ROOT, "cms", "content.json");
const DEFAULT_CONTENT_PATH = path.join(ROOT, "api", "cms", "default-content.json");
const PUBLIC_CONTENT_PATH = path.join(ELITECH_ROOT, "cms", "content.json");

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function loadPage(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  const html = readFile(filePath);
  return cheerio.load(html, { decodeEntities: false });
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHtml(value) {
  return String(value || "")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

function slugFromHref(href) {
  const cleanHref = String(href || "").trim();
  const parts = cleanHref.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickFirst($root, selector, attrName) {
  const element = $root(selector).first();
  if (!element.length) {
    return "";
  }

  return attrName ? String(element.attr(attrName) || "").trim() : cleanText(element.text());
}

function pickTexts($elements, $) {
  return $elements
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean);
}

function extractInfoBoxes($scope, $, maxItems = Infinity) {
  return $scope
    .find(".elementskit-infobox")
    .slice(0, maxItems)
    .map((_, el) => {
      const box = $(el);
      return {
        title: cleanText(box.find(".elementskit-info-box-title").first().text()),
        description: cleanText(box.find(".box-body p").first().text()),
        image: String(box.closest(".e-con, .elementor-element").find("img").first().attr("src") || "").trim()
      };
    })
    .get()
    .filter((item) => item.title || item.description);
}

function extractAccordionItems($scope, $, headingSelector = ".ekit-accordion-title") {
  return $scope
    .find(".elementskit-card")
    .map((_, el) => {
      const card = $(el);
      return {
        question: cleanText(card.find(headingSelector).first().text()),
        answer: cleanText(card.find(".elementskit-card-body").first().text())
      };
    })
    .get()
    .filter((item) => item.question && item.answer);
}

function extractParagraphs($scope, $) {
  return $scope
    .find("p")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean);
}

function findContainerByHeading($, text) {
  const match = $("h1, h2, h3, h4")
    .filter((_, el) => cleanText($(el).text()).toLowerCase() === text.toLowerCase())
    .first();

  if (!match.length) {
    return cheerio.load("<div></div>")("div");
  }

  const widget = match.closest(".elementor-element");
  const container = widget.parent();
  return container.length ? container : widget;
}

function getFooterContact($) {
  const hours = $(".ekit-business-hours-inner .ekit-single-day")
    .map((_, el) => {
      const item = $(el);
      return {
        days: cleanText(item.find(".ekit-business-day").text()),
        hours: cleanText(item.find(".ekit-business-time").text())
      };
    })
    .get()
    .filter((item) => item.days || item.hours);

  const footerAddress = cleanText(
    $(".elementor-heading-title")
      .filter((_, el) => cleanText($(el).text()).toLowerCase() === "contact information")
      .first()
      .closest(".e-con")
      .find(".elementor-widget-text-editor p")
      .first()
      .text()
  );

  const footerGetInTouch = $(".elementor-heading-title")
    .filter((_, el) => cleanText($(el).text()).toLowerCase() === "get in touch")
    .first()
    .closest(".e-con")
    .find(".elementskit-infobox");

  const footerPhone = cleanText(footerGetInTouch.eq(0).find(".box-body p").first().text());
  const footerEmail = cleanText(footerGetInTouch.eq(1).find(".box-body p").first().text());

  return {
    workingHours: hours,
    footerAddress,
    footerPhone,
    footerEmail
  };
}

function extractAbout() {
  const $ = loadPage("elitech/about-us/index.html");
  const introSection = $('[data-id="922977c"]');
  const pillars = [
    {
      title: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our mission").first().text()),
      description: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our mission").first().next("p").text())
    },
    {
      title: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our vision").first().text()),
      description: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our vision").first().next("p").text())
    },
    {
      title: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our value").first().text()),
      description: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our value").first().next("p").text())
    }
  ].filter((item) => item.title);

  const faqSection = findContainerByHeading($, "frequently asked questions");

  return {
    heroTitle: pickFirst($, ".elementor-page h1.elementor-heading-title"),
    label: cleanText(introSection.find("h3").first().text()),
    title: cleanText(introSection.find("h2").first().text()),
    description: cleanText(introSection.find(".elementor-widget-text-editor p").first().text()),
    experienceLabel: String($(".e-text-path").first().attr("data-text") || "").trim(),
    images: {
      primary: String($(".about-us-image img").first().attr("src") || "").trim(),
      secondary: String($(".about-us-image-box-2 img").first().attr("src") || "").trim(),
      values: String($(".values-image img").first().attr("src") || "").trim()
    },
    featureCards: extractInfoBoxes($('[data-id="3b25c37"]'), $, 2),
    bulletPoints: pickTexts($('[data-id="e0e5b1f"] .elementor-icon-list-text'), $),
    pillars,
    valuesTitle: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our core values").first().text()),
    valuesDescription: cleanText($("h3").filter((_, el) => cleanText($(el).text()).toLowerCase() === "our core values").first().closest(".e-con").find(".elementor-widget-text-editor p").first().text()),
    faqIntroTitle: cleanText(faqSection.find("h3, h2").first().text()),
    faqIntroDescription: cleanText(faqSection.find(".elementor-widget-text-editor p").first().text())
  };
}

function extractContact() {
  const $ = loadPage("elitech/contact-us/index.html");
  const introSection = $('[data-id="ca441f8"], [data-id="908c0f2"]').first().closest(".e-con").parent();
  const cards = $('[data-id="f011ab1"] .elementskit-infobox')
    .map((_, el) => {
      const card = $(el);
      const link = card.closest("a");
      return {
        title: cleanText(card.find(".elementskit-info-box-title").first().text()),
        value: cleanText(card.find(".box-body p").first().text()),
        href: String((link.length ? link.attr("href") : "") || "").trim()
      };
    })
    .get()
    .filter((item) => item.title && item.value);

  const footer = getFooterContact($);
  const formSection = findContainerByHeading($, "get in touch with us");

  return {
    heroTitle: pickFirst($, ".elementor-page h1.elementor-heading-title"),
    label: cleanText(introSection.find("h3").first().text()),
    title: cleanText(introSection.find("h2").first().text()),
    description: cleanText(introSection.find(".elementor-widget-text-editor p").first().text()),
    cards,
    formTitle: cleanText(formSection.find("h2").first().text()),
    formDescription: cleanText(formSection.find(".elementor-widget-text-editor p").first().text()),
    mapEmbedUrl: String($("iframe").first().attr("src") || "").trim(),
    workingHours: footer.workingHours,
    footerAddress: footer.footerAddress,
    footerPhone: footer.footerPhone,
    footerEmail: footer.footerEmail
  };
}

function extractFaqs() {
  const $ = loadPage("elitech/faqs/index.html");
  const navMap = new Map();

  $('.service-category-list a[href^="#"]').each((_, el) => {
    const anchor = $(el);
    const href = String(anchor.attr("href") || "").trim().replace(/^#/, "");
    if (href) {
      navMap.set(href, cleanText(anchor.find(".elementor-icon-list-text").text()) || cleanText(anchor.text()));
    }
  });

  const categories = $('[id^="faq-"]')
    .map((_, el) => {
      const section = $(el);
      const id = String(section.attr("id") || "").trim();
      return {
        id,
        navLabel: navMap.get(id) || "",
        title: cleanText(section.find("h2").first().text()),
        items: extractAccordionItems(section, $)
      };
    })
    .get()
    .filter((item) => item.id && item.title);

  return {
    heroTitle: pickFirst($, ".elementor-page h1.elementor-heading-title"),
    categories
  };
}

function extractServiceDetail(slug) {
  const filePath = path.join(ELITECH_ROOT, "services", slug, "index.html");
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const $ = cheerio.load(readFile(filePath), { decodeEntities: false });
  const introContainer = $(".page-single-image").first().closest(".e-con");
  const whyContainer = findContainerByHeading($, "why choose our consultation services?");
  const offerContainer = findContainerByHeading($, "what we offer");
  const processContainer = findContainerByHeading($, "service process");
  const faqContainer = findContainerByHeading($, "everything you need to know");

  return {
    title: pickFirst($, ".elementor-page h1.elementor-heading-title"),
    detailImage: String($(".page-single-image img").first().attr("src") || "").trim(),
    intro: extractParagraphs(introContainer, $),
    whyChooseTitle: cleanText(whyContainer.find("h2").first().text()),
    whyChooseDescription: cleanText(whyContainer.find(".elementor-widget-text-editor p").first().text()),
    whyChooseItems: extractInfoBoxes(whyContainer, $, 4).map((item) => ({
      title: item.title,
      description: item.description
    })),
    offerTitle: cleanText(offerContainer.find("h2").first().text()),
    offerDescription: cleanText(offerContainer.find(".elementor-widget-text-editor p").first().text()),
    offerItems: pickTexts(offerContainer.find(".service-offer-list .elementor-icon-list-text"), $),
    processTitle: cleanText(processContainer.find("h2").first().text()),
    processSteps: extractInfoBoxes(processContainer, $, 4).map((item) => ({
      title: item.title,
      description: item.description
    })),
    faqTitle: cleanText(faqContainer.find("h2").first().text()),
    faqItems: extractAccordionItems(faqContainer, $)
  };
}

function extractServices() {
  const $ = loadPage("elitech/services/index.html");
  const items = $("#cms-services-grid")
    .children(".service-item")
    .map((index, el) => {
      const item = $(el);
      const href = String(item.find("h2 a").first().attr("href") || item.find(".service-item-btn a").first().attr("href") || "").trim();
      const title = cleanText(item.find("h2").first().text());
      const slug = href && href !== "#" ? slugFromHref(href) : slugify(title);
      const detail = extractServiceDetail(slug);

      return {
        id: slug || `service-${index + 1}`,
        slug: slug || `service-${index + 1}`,
        title: detail && detail.title ? detail.title : title,
        excerpt: cleanText(item.find(".elementor-widget-text-editor p").first().text()),
        image: String(item.find("img").first().attr("src") || "").trim(),
        url: href && href !== "#" ? href : `/elitech/services/${slug || `service-${index + 1}`}/`,
        order: index + 1,
        intro: detail ? detail.intro : [],
        detailImage: detail ? detail.detailImage : String(item.find("img").first().attr("src") || "").trim(),
        whyChooseTitle: detail ? detail.whyChooseTitle : "",
        whyChooseDescription: detail ? detail.whyChooseDescription : "",
        whyChooseItems: detail ? detail.whyChooseItems : [],
        offerTitle: detail ? detail.offerTitle : "What we offer",
        offerDescription: detail ? detail.offerDescription : "",
        offerItems: detail ? detail.offerItems : [],
        processTitle: detail ? detail.processTitle : "Service process",
        processSteps: detail ? detail.processSteps : [],
        faqTitle: detail ? detail.faqTitle : "Everything You Need to Know",
        faqItems: detail ? detail.faqItems : []
      };
    })
    .get();

  return {
    heroTitle: pickFirst($, ".elementor-page h1.elementor-heading-title"),
    items
  };
}

function extractProjectDetail(slug) {
  const filePath = path.join(ELITECH_ROOT, "projects", slug, "index.html");
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const $ = cheerio.load(readFile(filePath), { decodeEntities: false });
  const introContainer = $(".page-single-image").first().closest(".e-con");
  const keyFeaturesContainer = findContainerByHeading($, "key features");
  const processContainer = findContainerByHeading($, "project development process");
  const solutionsContainer = findContainerByHeading($, "project solutions & problem");
  const faqContainer = findContainerByHeading($, "everything you need to know");

  const metaValues = $(".project-entry-meta li, .project-sidebar-meta li")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean);

  return {
    title: pickFirst($, ".elementor-page h1.elementor-heading-title"),
    detailImage: String($(".page-single-image img").first().attr("src") || "").trim(),
    intro: extractParagraphs(introContainer, $),
    meta: {
      category: metaValues[0] || "",
      duration: metaValues[1] || "",
      date: metaValues[2] || "",
      location: metaValues[3] || ""
    },
    keyFeaturesTitle: cleanText(keyFeaturesContainer.find("h2").first().text()),
    keyFeaturesDescription: cleanText(keyFeaturesContainer.find(".elementor-widget-text-editor p").first().text()),
    keyFeatures: extractInfoBoxes(keyFeaturesContainer, $, 4),
    processTitle: cleanText(processContainer.find("h2").first().text()),
    processSteps: extractInfoBoxes(processContainer, $, 4).map((item) => ({
      title: item.title,
      description: item.description
    })),
    solutionsTitle: cleanText(solutionsContainer.find("h2").first().text()),
    problemTitle: cleanText(solutionsContainer.find("h3").eq(0).text()),
    problemText: cleanText(solutionsContainer.find(".elementor-widget-text-editor").eq(0).text()),
    solutionsHeading: cleanText(solutionsContainer.find("h3").eq(1).text()),
    solutionsText: cleanText(solutionsContainer.find(".elementor-widget-text-editor").eq(1).text()),
    faqTitle: cleanText(faqContainer.find("h2").first().text()),
    faqItems: extractAccordionItems(faqContainer, $)
  };
}

function extractProjects() {
  const $ = loadPage("elitech/projects/index.html");
  const items = $("#cms-projects-grid")
    .children(".col-xl-4, .col-md-6")
    .map((index, el) => {
      const item = $(el);
      const href = String(item.find("h2 a").first().attr("href") || item.find(".project-item-btn a").first().attr("href") || "").trim();
      const slug = href ? slugFromHref(href) : `project-${index + 1}`;
      const detail = extractProjectDetail(slug);

      return {
        id: slug,
        slug,
        title: detail && detail.title ? detail.title : cleanText(item.find("h2").first().text()),
        category: cleanText(item.find(".project-item-content p").first().text()),
        image: String(item.find("img").first().attr("src") || "").trim(),
        url: href || `/elitech/projects/${slug}/`,
        order: index + 1,
        meta: detail ? detail.meta : {
          category: cleanText(item.find(".project-item-content p").first().text()),
          duration: "",
          date: "",
          location: ""
        },
        intro: detail ? detail.intro : [],
        detailImage: detail ? detail.detailImage : String(item.find("img").first().attr("src") || "").trim(),
        keyFeaturesTitle: detail ? detail.keyFeaturesTitle : "Key features",
        keyFeaturesDescription: detail ? detail.keyFeaturesDescription : "",
        keyFeatures: detail ? detail.keyFeatures : [],
        processTitle: detail ? detail.processTitle : "Project development process",
        processSteps: detail ? detail.processSteps : [],
        solutionsTitle: detail ? detail.solutionsTitle : "Project solutions & problem",
        problemTitle: detail ? detail.problemTitle : "Project Problem:",
        problemText: detail ? detail.problemText : "",
        solutionsHeading: detail ? detail.solutionsHeading : "Project Solutions:",
        solutionsText: detail ? detail.solutionsText : "",
        faqTitle: detail ? detail.faqTitle : "Everything You Need to Know",
        faqItems: detail ? detail.faqItems : []
      };
    })
    .get();

  return {
    heroTitle: pickFirst($, ".page-header h1.entry-title"),
    items
  };
}

function extractBlogDetail(slug) {
  const filePath = path.join(ELITECH_ROOT, slug, "index.html");
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const $ = cheerio.load(readFile(filePath), { decodeEntities: false });
  const entry = $(".post-entry").first();
  const intro = [];
  const sections = [];
  let quote = "";
  let currentSection = null;

  entry.children().each((_, el) => {
    const node = $(el);
    const tag = String(el.tagName || "").toLowerCase();

    if (tag === "p") {
      const value = cleanText(node.text());
      if (!value) {
        return;
      }
      if (!currentSection) {
        intro.push(value);
      } else {
        currentSection.paragraphs.push(value);
      }
      return;
    }

    if (tag === "blockquote") {
      quote = cleanText(node.text());
      return;
    }

    if (tag === "h2") {
      currentSection = {
        title: cleanText(node.text()),
        paragraphs: [],
        bullets: []
      };
      sections.push(currentSection);
      return;
    }

    if (tag === "ul") {
      const bullets = node
        .find("li")
        .map((__, li) => cleanText($(li).text()))
        .get()
        .filter(Boolean);

      if (!currentSection) {
        currentSection = {
          title: "Highlights",
          paragraphs: [],
          bullets: []
        };
        sections.push(currentSection);
      }

      currentSection.bullets.push(...bullets);
    }
  });

  const tags = $(".post-tags a")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean);

  return {
    title: pickFirst($, ".page-header h1.text-anime"),
    date: cleanText($(".post-single-meta li").first().text().replace(/^[^A-Za-z0-9]+/, "")),
    category: cleanText($(".post-single-meta li").eq(1).text().replace(/^[^A-Za-z0-9]+/, "")),
    image: String($(".post-single-image img").first().attr("src") || "").trim(),
    body: {
      intro,
      quote,
      sections
    },
    tags
  };
}

function buildExcerptFromBody(body) {
  const firstIntro = Array.isArray(body && body.intro) ? body.intro[0] : "";
  if (!firstIntro) {
    return "";
  }
  return firstIntro.length > 140 ? `${firstIntro.slice(0, 137).trim()}...` : firstIntro;
}

function extractBlogPosts() {
  const $ = loadPage("elitech/blog/index.html");
  const items = $("#cms-blog-grid")
    .children(".col-xl-4, .col-md-6")
    .map((index, el) => {
      const item = $(el);
      const href = String(item.find("h2 a").first().attr("href") || item.find(".post-item-btn a").first().attr("href") || "").trim();
      const slug = href ? slugFromHref(href) : `blog-post-${index + 1}`;
      const detail = extractBlogDetail(slug);
      const date = cleanText(item.find(".post-item-meta p").first().text()) || (detail ? detail.date : "");
      const category = cleanText(item.find(".post-item-tags li").first().text()) || (detail ? detail.category : "");
      const image = String(item.find("img").first().attr("src") || "").trim() || (detail ? detail.image : "");

      return {
        id: slug,
        slug,
        title: detail && detail.title ? detail.title : cleanText(item.find("h2").first().text()),
        category,
        date,
        image,
        url: href || `/elitech/${slug}/`,
        excerpt: detail ? buildExcerptFromBody(detail.body) : "",
        body: detail ? detail.body : { intro: [], quote: "", sections: [] },
        tags: detail ? detail.tags : []
      };
    })
    .get();

  return {
    heroTitle: pickFirst($, ".page-header h1.entry-title"),
    items
  };
}

function buildDefaultContent() {
  const legacy = JSON.parse(readFile(LEGACY_CONTENT_PATH));
  const about = extractAbout();
  const contact = extractContact();
  const faqs = extractFaqs();
  const services = extractServices();
  const projects = extractProjects();
  const blog = extractBlogPosts();

  return {
    site: legacy.site || {},
    seo: legacy.seo || {},
    globalReplacements: Array.isArray(legacy.globalReplacements) ? legacy.globalReplacements : [],
    rules: Array.isArray(legacy.rules) ? legacy.rules : [],
    about,
    contact,
    faqs,
    servicesPage: {
      heroTitle: services.heroTitle
    },
    services: services.items,
    projectsPage: {
      heroTitle: projects.heroTitle
    },
    projects: projects.items,
    blogPage: {
      heroTitle: blog.heroTitle
    },
    blogPosts: blog.items
  };
}

function main() {
  const content = buildDefaultContent();
  writeJson(DEFAULT_CONTENT_PATH, content);
  writeJson(PUBLIC_CONTENT_PATH, content);
  console.log(`Generated CMS seed content:\n- ${DEFAULT_CONTENT_PATH}\n- ${PUBLIC_CONTENT_PATH}`);
}

main();
