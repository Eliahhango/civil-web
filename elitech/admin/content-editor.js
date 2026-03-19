function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pathKey(path) {
  return path.join(".");
}

function getAtPath(target, path) {
  let current = target;
  for (let index = 0; index < path.length; index += 1) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[path[index]];
  }
  return current;
}

function setAtPath(target, path, nextValue) {
  if (!path.length) {
    return;
  }

  let current = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const token = path[index];
    if (!isPlainObject(current[token]) && !Array.isArray(current[token])) {
      current[token] = typeof path[index + 1] === "number" ? [] : {};
    }
    current = current[token];
  }

  current[path[path.length - 1]] = nextValue;
}

function createEmptyContentConfig() {
  return {
    site: { name: "", tagline: "" },
    seo: { title: "", description: "", image: "", url: "", twitterCard: "" },
    globalReplacements: [],
    rules: [],
    about: {
      heroTitle: "",
      label: "",
      title: "",
      description: "",
      experienceLabel: "",
      images: { primary: "", secondary: "", values: "" },
      featureCards: [],
      bulletPoints: [],
      pillars: [],
      valuesTitle: "",
      valuesDescription: "",
      faqIntroTitle: "",
      faqIntroDescription: ""
    },
    contact: {
      heroTitle: "",
      label: "",
      title: "",
      description: "",
      cards: [],
      formTitle: "",
      formDescription: "",
      mapEmbedUrl: "",
      workingHours: [],
      footerAddress: "",
      footerPhone: "",
      footerEmail: ""
    },
    faqs: {
      heroTitle: "",
      categories: []
    },
    servicesPage: {
      heroTitle: ""
    },
    services: [],
    projectsPage: {
      heroTitle: ""
    },
    projects: [],
    blogPage: {
      heroTitle: ""
    },
    blogPosts: []
  };
}

function mergeContent(baseValue, overrideValue) {
  if (Array.isArray(baseValue)) {
    return Array.isArray(overrideValue) ? deepClone(overrideValue) : deepClone(baseValue);
  }

  if (isPlainObject(baseValue)) {
    const output = {};
    const override = isPlainObject(overrideValue) ? overrideValue : {};
    const keys = Object.keys(baseValue);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      output[key] = mergeContent(baseValue[key], override[key]);
    }
    return output;
  }

  return overrideValue === undefined || overrideValue === null ? baseValue : overrideValue;
}

function textField(key, label, options = {}) {
  return { key, label, type: "text", ...options };
}

function textareaField(key, label, options = {}) {
  return { key, label, type: "textarea", rows: 4, ...options };
}

function urlField(key, label, options = {}) {
  return { key, label, type: "url", ...options };
}

function objectField(key, label, fields, options = {}) {
  return { key, label, type: "object", fields, ...options };
}

function arrayTextField(key, label, options = {}) {
  return { key, label, type: "arrayText", itemType: "text", addLabel: "Add item", ...options };
}

function arrayObjectField(key, label, fields, options = {}) {
  return { key, label, type: "arrayObject", fields, addLabel: "Add item", ...options };
}

const SECTION_DEFINITIONS = [
  {
    id: "site",
    label: "Site Settings",
    description: "Manage brand identity and search metadata without touching the frontend markup.",
    fields: [
      objectField("site", "Site Identity", [
        textField("name", "Site name"),
        textField("tagline", "Tagline")
      ]),
      objectField("seo", "SEO", [
        textField("title", "SEO title"),
        textareaField("description", "SEO description", { rows: 4 }),
        urlField("image", "Social image URL"),
        urlField("url", "Canonical URL"),
        textField("twitterCard", "Twitter card")
      ])
    ]
  },
  {
    id: "about",
    label: "About Us",
    description: "Edit the existing About page sections while keeping the same layout and imagery slots.",
    fields: [
      objectField("about", "About Page", [
        textField("heroTitle", "Hero title"),
        textField("label", "Section label"),
        textareaField("title", "Section title", { rows: 2 }),
        textareaField("description", "Description", { rows: 5 }),
        textField("experienceLabel", "Experience ribbon"),
        objectField("images", "Images", [
          urlField("primary", "Primary image"),
          urlField("secondary", "Secondary image"),
          urlField("values", "Values image")
        ]),
        arrayObjectField("featureCards", "Feature Cards", [
          textField("title", "Title"),
          textareaField("description", "Description", { rows: 3 }),
          urlField("image", "Image URL")
        ], {
          addLabel: "Add feature card",
          summary: (item, index) => item.title || `Feature Card ${index + 1}`,
          createItem: () => ({ title: "", description: "", image: "" })
        }),
        arrayTextField("bulletPoints", "Bullet Points", {
          addLabel: "Add bullet point"
        }),
        arrayObjectField("pillars", "Mission, Vision & Values", [
          textField("title", "Title"),
          textareaField("description", "Description", { rows: 3 })
        ], {
          addLabel: "Add pillar",
          summary: (item, index) => item.title || `Pillar ${index + 1}`,
          createItem: () => ({ title: "", description: "" })
        }),
        textField("valuesTitle", "Values section label"),
        textareaField("valuesDescription", "Values description", { rows: 4 }),
        textField("faqIntroTitle", "FAQ intro label"),
        textareaField("faqIntroDescription", "FAQ intro description", { rows: 4 })
      ])
    ]
  },
  {
    id: "services",
    label: "Services",
    description: "Manage archive cards and service detail page content. Reorder items to control display order.",
    fields: [
      objectField("servicesPage", "Services Archive", [
        textField("heroTitle", "Hero title")
      ]),
      arrayObjectField("services", "Services", [
        textField("slug", "Slug"),
        textField("title", "Title"),
        textareaField("excerpt", "Excerpt", { rows: 3 }),
        urlField("image", "Archive image"),
        arrayTextField("intro", "Intro paragraphs", {
          itemType: "textarea",
          rows: 3,
          addLabel: "Add intro paragraph"
        }),
        urlField("detailImage", "Detail image"),
        textField("whyChooseTitle", "Why choose title"),
        textareaField("whyChooseDescription", "Why choose description", { rows: 4 }),
        arrayObjectField("whyChooseItems", "Why Choose Cards", [
          textField("title", "Title"),
          textareaField("description", "Description", { rows: 3 }),
          urlField("image", "Image URL")
        ], {
          addLabel: "Add why choose card",
          summary: (item, index) => item.title || `Card ${index + 1}`,
          createItem: () => ({ title: "", description: "", image: "" })
        }),
        textField("offerTitle", "Offer title"),
        textareaField("offerDescription", "Offer description", { rows: 4 }),
        arrayTextField("offerItems", "Offer list", {
          addLabel: "Add offer item"
        }),
        textField("processTitle", "Process title"),
        arrayObjectField("processSteps", "Process Steps", [
          textField("title", "Title"),
          textareaField("description", "Description", { rows: 3 })
        ], {
          addLabel: "Add process step",
          summary: (item, index) => item.title || `Step ${index + 1}`,
          createItem: () => ({ title: "", description: "" })
        }),
        textField("faqTitle", "FAQ title"),
        arrayObjectField("faqItems", "FAQ Items", [
          textField("question", "Question"),
          textareaField("answer", "Answer", { rows: 4 })
        ], {
          addLabel: "Add FAQ",
          summary: (item, index) => item.question || `FAQ ${index + 1}`,
          createItem: () => ({ question: "", answer: "" })
        })
      ], {
        addLabel: "Add service",
        summary: (item, index) => item.title || item.slug || `Service ${index + 1}`,
        createItem: (_data, _path, index) => {
          const slug = `new-service-${index + 1}`;
          return {
            slug,
            title: "New Service",
            excerpt: "",
            image: "",
            intro: [],
            detailImage: "",
            whyChooseTitle: "",
            whyChooseDescription: "",
            whyChooseItems: [],
            offerTitle: "",
            offerDescription: "",
            offerItems: [],
            processTitle: "",
            processSteps: [],
            faqTitle: "",
            faqItems: []
          };
        }
      })
    ]
  },
  {
    id: "projects",
    label: "Projects",
    description: "Manage project archive cards and project detail content while preserving the public layouts.",
    fields: [
      objectField("projectsPage", "Projects Archive", [
        textField("heroTitle", "Hero title")
      ]),
      arrayObjectField("projects", "Projects", [
        textField("slug", "Slug"),
        textField("title", "Title"),
        textField("category", "Category"),
        urlField("image", "Archive image"),
        objectField("meta", "Project Meta", [
          textField("category", "Meta category"),
          textField("duration", "Duration"),
          textField("date", "Date"),
          textField("location", "Location")
        ]),
        arrayTextField("intro", "Intro paragraphs", {
          itemType: "textarea",
          rows: 3,
          addLabel: "Add intro paragraph"
        }),
        urlField("detailImage", "Detail image"),
        textField("keyFeaturesTitle", "Key features title"),
        textareaField("keyFeaturesDescription", "Key features description", { rows: 4 }),
        arrayObjectField("keyFeatures", "Key Features", [
          textField("title", "Title"),
          textareaField("description", "Description", { rows: 3 }),
          urlField("image", "Image URL")
        ], {
          addLabel: "Add feature",
          summary: (item, index) => item.title || `Feature ${index + 1}`,
          createItem: () => ({ title: "", description: "", image: "" })
        }),
        textField("processTitle", "Process title"),
        arrayObjectField("processSteps", "Process Steps", [
          textField("title", "Title"),
          textareaField("description", "Description", { rows: 3 })
        ], {
          addLabel: "Add process step",
          summary: (item, index) => item.title || `Step ${index + 1}`,
          createItem: () => ({ title: "", description: "" })
        }),
        textField("solutionsTitle", "Solutions section title"),
        textField("problemTitle", "Problem label"),
        textareaField("problemText", "Problem text", { rows: 4 }),
        textField("solutionsHeading", "Solutions heading"),
        textareaField("solutionsText", "Solutions text", { rows: 4 }),
        textField("faqTitle", "FAQ title"),
        arrayObjectField("faqItems", "FAQ Items", [
          textField("question", "Question"),
          textareaField("answer", "Answer", { rows: 4 })
        ], {
          addLabel: "Add FAQ",
          summary: (item, index) => item.question || `FAQ ${index + 1}`,
          createItem: () => ({ question: "", answer: "" })
        })
      ], {
        addLabel: "Add project",
        summary: (item, index) => item.title || item.slug || `Project ${index + 1}`,
        createItem: (_data, _path, index) => ({
          slug: `new-project-${index + 1}`,
          title: "New Project",
          category: "",
          image: "",
          meta: { category: "", duration: "", date: "", location: "" },
          intro: [],
          detailImage: "",
          keyFeaturesTitle: "",
          keyFeaturesDescription: "",
          keyFeatures: [],
          processTitle: "",
          processSteps: [],
          solutionsTitle: "",
          problemTitle: "",
          problemText: "",
          solutionsHeading: "",
          solutionsText: "",
          faqTitle: "",
          faqItems: []
        })
      })
    ]
  },
  {
    id: "blog",
    label: "Blog",
    description: "Manage seeded articles and publish new posts with the same frontend design and detail layout.",
    fields: [
      objectField("blogPage", "Blog Archive", [
        textField("heroTitle", "Hero title")
      ]),
      arrayObjectField("blogPosts", "Blog Posts", [
        textField("slug", "Slug"),
        textField("title", "Title"),
        textField("category", "Category"),
        textField("date", "Date label"),
        urlField("image", "Featured image"),
        textareaField("excerpt", "Excerpt", { rows: 4 }),
        objectField("body", "Article Body", [
          arrayTextField("intro", "Intro paragraphs", {
            itemType: "textarea",
            rows: 3,
            addLabel: "Add intro paragraph"
          }),
          textareaField("quote", "Quote", { rows: 3 }),
          arrayObjectField("sections", "Sections", [
            textField("title", "Section title"),
            arrayTextField("paragraphs", "Paragraphs", {
              itemType: "textarea",
              rows: 3,
              addLabel: "Add paragraph"
            }),
            arrayTextField("bullets", "Bullet list", {
              addLabel: "Add bullet"
            })
          ], {
            addLabel: "Add article section",
            summary: (item, index) => item.title || `Section ${index + 1}`,
            createItem: () => ({ title: "", paragraphs: [], bullets: [] })
          })
        ]),
        arrayTextField("tags", "Tags", {
          addLabel: "Add tag"
        })
      ], {
        addLabel: "Add blog post",
        summary: (item, index) => item.title || item.slug || `Post ${index + 1}`,
        createItem: (_data, _path, index) => ({
          slug: `new-post-${index + 1}`,
          title: "New Blog Post",
          category: "",
          date: "",
          image: "",
          excerpt: "",
          body: {
            intro: [],
            quote: "",
            sections: []
          },
          tags: []
        })
      })
    ]
  },
  {
    id: "faqs",
    label: "FAQs",
    description: "Control FAQ page categories, section anchors, and accordion items.",
    fields: [
      objectField("faqs", "FAQ Page", [
        textField("heroTitle", "Hero title"),
        arrayObjectField("categories", "FAQ Categories", [
          textField("id", "Anchor ID"),
          textField("navLabel", "Sidebar label"),
          textField("title", "Section title"),
          arrayObjectField("items", "Questions", [
            textField("question", "Question"),
            textareaField("answer", "Answer", { rows: 4 })
          ], {
            addLabel: "Add question",
            summary: (item, index) => item.question || `Question ${index + 1}`,
            createItem: () => ({ question: "", answer: "" })
          })
        ], {
          addLabel: "Add FAQ category",
          summary: (item, index) => item.title || item.navLabel || `Category ${index + 1}`,
          createItem: (_data, _path, index) => ({
            id: `faq-${index + 1}`,
            navLabel: `Category ${index + 1}`,
            title: `Category ${index + 1}`,
            items: []
          })
        })
      ])
    ]
  },
  {
    id: "contact",
    label: "Contact Info",
    description: "Update the contact page and the repeated footer contact details used across the site.",
    fields: [
      objectField("contact", "Contact Page", [
        textField("heroTitle", "Hero title"),
        textField("label", "Section label"),
        textareaField("title", "Section title", { rows: 2 }),
        textareaField("description", "Description", { rows: 4 }),
        arrayObjectField("cards", "Contact Cards", [
          textField("title", "Title"),
          textField("value", "Value"),
          textField("href", "Link")
        ], {
          addLabel: "Add contact card",
          summary: (item, index) => item.title || `Card ${index + 1}`,
          createItem: () => ({ title: "", value: "", href: "" })
        }),
        textField("formTitle", "Form title"),
        textareaField("formDescription", "Form description", { rows: 3 }),
        urlField("mapEmbedUrl", "Map embed URL"),
        arrayObjectField("workingHours", "Working Hours", [
          textField("days", "Days"),
          textField("hours", "Hours")
        ], {
          addLabel: "Add working-hours row",
          summary: (item, index) => item.days || `Hours ${index + 1}`,
          createItem: () => ({ days: "", hours: "" })
        }),
        textareaField("footerAddress", "Footer address", { rows: 2 }),
        textField("footerPhone", "Footer phone"),
        textField("footerEmail", "Footer email")
      ])
    ]
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "For site-wide replacements and runtime rules that still need manual JSON control.",
    fields: [
      { key: "globalReplacements", label: "Global Replacements", type: "json", rows: 10, help: "JSON array" },
      { key: "rules", label: "Runtime Rules", type: "json", rows: 16, help: "JSON array" }
    ]
  }
];

export class AdminContentEditor {
  constructor({ navEl, summaryEl, fieldsEl }) {
    this.navEl = navEl;
    this.summaryEl = summaryEl;
    this.fieldsEl = fieldsEl;
    this.activeSection = SECTION_DEFINITIONS[0].id;
    this.state = createEmptyContentConfig();
    this.jsonFields = {
      globalReplacements: "[]",
      rules: "[]"
    };
    this.repeaterConfigs = {};
    this.bindEvents();
  }

  bindEvents() {
    if (this.navEl) {
      this.navEl.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }
        const button = event.target.closest("[data-section]");
        if (!button) {
          return;
        }

        const sectionId = button.dataset.section || "";
        if (!sectionId || sectionId === this.activeSection) {
          return;
        }

        this.activeSection = sectionId;
        this.render();
      });
    }

    if (this.fieldsEl) {
      this.fieldsEl.addEventListener("input", (event) => this.handleInput(event));
      this.fieldsEl.addEventListener("change", (event) => this.handleInput(event));
      this.fieldsEl.addEventListener("click", (event) => this.handleAction(event));
    }
  }

  resolveSection(sectionId) {
    return SECTION_DEFINITIONS.find((section) => section.id === sectionId) || SECTION_DEFINITIONS[0];
  }

  setActiveSection(sectionId) {
    const nextSection = this.resolveSection(sectionId);
    this.activeSection = nextSection.id;
    this.render();
    return nextSection;
  }

  getActiveSectionMeta() {
    return this.resolveSection(this.activeSection);
  }

  setData(data) {
    this.state = mergeContent(createEmptyContentConfig(), isPlainObject(data) ? data : {});
    this.jsonFields.globalReplacements = JSON.stringify(this.state.globalReplacements || [], null, 2);
    this.jsonFields.rules = JSON.stringify(this.state.rules || [], null, 2);
    this.render();
  }

  getData() {
    const payload = deepClone(this.state);

    try {
      payload.globalReplacements = JSON.parse(this.jsonFields.globalReplacements || "[]");
    } catch (_error) {
      throw new Error("Global Replacements must be valid JSON.");
    }

    try {
      payload.rules = JSON.parse(this.jsonFields.rules || "[]");
    } catch (_error) {
      throw new Error("Runtime Rules must be valid JSON.");
    }

    payload.services = (payload.services || []).map((item, index) => ({
      ...item,
      id: item.slug || slugify(item.title) || `service-${index + 1}`,
      slug: item.slug || slugify(item.title) || `service-${index + 1}`,
      url: `/elitech/services/${item.slug || slugify(item.title) || `service-${index + 1}`}/`,
      order: index + 1
    }));

    payload.projects = (payload.projects || []).map((item, index) => ({
      ...item,
      id: item.slug || slugify(item.title) || `project-${index + 1}`,
      slug: item.slug || slugify(item.title) || `project-${index + 1}`,
      url: `/elitech/projects/${item.slug || slugify(item.title) || `project-${index + 1}`}/`,
      order: index + 1
    }));

    payload.blogPosts = (payload.blogPosts || []).map((item, index) => {
      const resolvedSlug = item.slug || slugify(item.title) || `post-${index + 1}`;
      const legacyUrl = String(item.url || "").trim();
      let nextUrl = legacyUrl;

      if (!nextUrl || /^\/elitech\/blog\/[^/]+\/?$/.test(nextUrl)) {
        nextUrl = `/elitech/blog/${resolvedSlug}/`;
      }

      if (nextUrl && !nextUrl.endsWith("/")) {
        nextUrl = `${nextUrl}/`;
      }

      return {
        ...item,
        id: resolvedSlug,
        slug: resolvedSlug,
        url: nextUrl || `/elitech/blog/${resolvedSlug}/`
      };
    });

    payload.faqs.categories = (payload.faqs.categories || []).map((item, index) => ({
      ...item,
      id: item.id || `faq-${index + 1}`
    }));

    return payload;
  }

  handleInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const jsonField = target.dataset.jsonField || "";
    if (jsonField) {
      this.jsonFields[jsonField] = target.value;
      return;
    }

    const rawPath = target.dataset.path || "";
    if (!rawPath) {
      return;
    }

    const path = rawPath.split(".").map((token) => (/^\d+$/.test(token) ? Number(token) : token));
    setAtPath(this.state, path, target.value);
  }

  handleAction(event) {
    if (!(event.target instanceof Element)) {
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action || "";
    const rawPath = button.dataset.path || "";
    const path = rawPath ? rawPath.split(".").map((token) => (/^\d+$/.test(token) ? Number(token) : token)) : [];
    const parentPath = path.slice(0, -1);
    const index = Number(button.dataset.index || 0);

    if (action === "add-array-item") {
      const config = this.repeaterConfigs[rawPath];
      if (!config) {
        return;
      }
      const list = Array.isArray(getAtPath(this.state, path)) ? deepClone(getAtPath(this.state, path)) : [];
      const nextItem = typeof config.createItem === "function"
        ? config.createItem(this.state, path, list.length)
        : (config.type === "arrayText" ? "" : {});
      list.push(deepClone(nextItem));
      setAtPath(this.state, path, list);
      this.render();
      return;
    }

    const collection = Array.isArray(getAtPath(this.state, parentPath)) ? deepClone(getAtPath(this.state, parentPath)) : [];
    if (!collection.length) {
      return;
    }

    if (action === "remove-array-item") {
      collection.splice(index, 1);
      setAtPath(this.state, parentPath, collection);
      this.render();
      return;
    }

    if (action === "move-array-item") {
      const direction = button.dataset.direction === "up" ? -1 : 1;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= collection.length) {
        return;
      }
      const currentItem = collection[index];
      collection[index] = collection[targetIndex];
      collection[targetIndex] = currentItem;
      setAtPath(this.state, parentPath, collection);
      this.render();
    }
  }

  render() {
    if (this.navEl) {
      this.navEl.innerHTML = SECTION_DEFINITIONS.map((section) => {
        let countMarkup = "";
        if (section.id === "services") {
          countMarkup = `<span>${(this.state.services || []).length}</span>`;
        } else if (section.id === "projects") {
          countMarkup = `<span>${(this.state.projects || []).length}</span>`;
        } else if (section.id === "blog") {
          countMarkup = `<span>${(this.state.blogPosts || []).length}</span>`;
        } else if (section.id === "faqs") {
          countMarkup = `<span>${(this.state.faqs.categories || []).length}</span>`;
        }

        return `
          <button type="button" class="content-section-btn ${section.id === this.activeSection ? "active" : ""}" data-section="${escapeHtml(section.id)}">
            <strong>${escapeHtml(section.label)}</strong>
            ${countMarkup}
          </button>
        `;
      }).join("");
    }

    const active = this.getActiveSectionMeta();
    if (this.summaryEl) {
      this.summaryEl.innerHTML = `
        <div class="content-summary-card">
          <p class="content-summary-label">CMS Section</p>
          <h3>${escapeHtml(active.label)}</h3>
          <p>${escapeHtml(active.description)}</p>
        </div>
      `;
    }

    this.repeaterConfigs = {};
    if (this.fieldsEl) {
      this.fieldsEl.innerHTML = this.renderFields(active.fields, []);
    }
  }

  renderFields(fields, basePath) {
    return fields.map((fieldDef) => {
      const currentPath = basePath.concat(fieldDef.key);
      const currentValue = getAtPath(this.state, currentPath);
      return this.renderField(fieldDef, currentPath, currentValue);
    }).join("");
  }

  renderField(fieldDef, path, value) {
    const id = `cms-field-${pathKey(path).replace(/\./g, "-")}`;

    if (fieldDef.type === "object") {
      return `
        <section class="cms-editor-card">
          <div class="cms-card-heading">
            <h3>${escapeHtml(fieldDef.label)}</h3>
          </div>
          <div class="cms-field-grid">
            ${this.renderFields(fieldDef.fields || [], path)}
          </div>
        </section>
      `;
    }

    if (fieldDef.type === "arrayText") {
      const items = Array.isArray(value) ? value : [];
      this.repeaterConfigs[pathKey(path)] = fieldDef;
      return `
        <section class="cms-editor-card cms-repeater-card">
          <div class="cms-card-heading">
            <h3>${escapeHtml(fieldDef.label)}</h3>
            <button type="button" class="btn-small btn-primary" data-action="add-array-item" data-path="${escapeHtml(pathKey(path))}">
              ${escapeHtml(fieldDef.addLabel || "Add item")}
            </button>
          </div>
          <div class="cms-repeater-list">
            ${items.map((item, index) => this.renderArrayTextItem(fieldDef, path.concat(index), item, index)).join("")}
          </div>
        </section>
      `;
    }

    if (fieldDef.type === "arrayObject") {
      const items = Array.isArray(value) ? value : [];
      this.repeaterConfigs[pathKey(path)] = fieldDef;
      return `
        <section class="cms-editor-card cms-repeater-card">
          <div class="cms-card-heading">
            <h3>${escapeHtml(fieldDef.label)}</h3>
            <button type="button" class="btn-small btn-primary" data-action="add-array-item" data-path="${escapeHtml(pathKey(path))}">
              ${escapeHtml(fieldDef.addLabel || "Add item")}
            </button>
          </div>
          <div class="cms-repeater-stack">
            ${items.map((item, index) => this.renderArrayObjectItem(fieldDef, path.concat(index), item, index)).join("")}
          </div>
        </section>
      `;
    }

    if (fieldDef.type === "json") {
      const fieldName = fieldDef.key;
      return `
        <label class="cms-field cms-field-full" for="${escapeHtml(id)}">
          <span>${escapeHtml(fieldDef.label)}</span>
          <textarea id="${escapeHtml(id)}" rows="${escapeHtml(fieldDef.rows || 8)}" class="code-textarea" data-json-field="${escapeHtml(fieldName)}">${escapeHtml(this.jsonFields[fieldName] || "[]")}</textarea>
          ${fieldDef.help ? `<small>${escapeHtml(fieldDef.help)}</small>` : ""}
        </label>
      `;
    }

    if (fieldDef.type === "textarea") {
      return `
        <label class="cms-field ${fieldDef.fullWidth ? "cms-field-full" : ""}" for="${escapeHtml(id)}">
          <span>${escapeHtml(fieldDef.label)}</span>
          <textarea id="${escapeHtml(id)}" rows="${escapeHtml(fieldDef.rows || 4)}" data-path="${escapeHtml(pathKey(path))}">${escapeHtml(value || "")}</textarea>
        </label>
      `;
    }

    return `
      <label class="cms-field ${fieldDef.fullWidth ? "cms-field-full" : ""}" for="${escapeHtml(id)}">
        <span>${escapeHtml(fieldDef.label)}</span>
        <input id="${escapeHtml(id)}" type="${escapeHtml(fieldDef.type || "text")}" value="${escapeHtml(value || "")}" data-path="${escapeHtml(pathKey(path))}">
      </label>
    `;
  }

  renderArrayTextItem(fieldDef, path, value, index) {
    const itemId = `cms-field-${pathKey(path).replace(/\./g, "-")}`;
    const multiline = fieldDef.itemType === "textarea";
    const input = multiline
      ? `<textarea id="${escapeHtml(itemId)}" rows="${escapeHtml(fieldDef.rows || 3)}" data-path="${escapeHtml(pathKey(path))}">${escapeHtml(value || "")}</textarea>`
      : `<input id="${escapeHtml(itemId)}" type="text" value="${escapeHtml(value || "")}" data-path="${escapeHtml(pathKey(path))}">`;

    return `
      <div class="cms-repeater-row">
        <label class="cms-field cms-field-full" for="${escapeHtml(itemId)}">
          <span>${escapeHtml(fieldDef.itemLabel || `${fieldDef.label} ${index + 1}`)}</span>
          ${input}
        </label>
        <div class="cms-inline-actions">
          <button type="button" class="btn-small" data-action="move-array-item" data-path="${escapeHtml(pathKey(path))}" data-index="${index}" data-direction="up">Up</button>
          <button type="button" class="btn-small" data-action="move-array-item" data-path="${escapeHtml(pathKey(path))}" data-index="${index}" data-direction="down">Down</button>
          <button type="button" class="btn-small btn-danger" data-action="remove-array-item" data-path="${escapeHtml(pathKey(path))}" data-index="${index}">Delete</button>
        </div>
      </div>
    `;
  }

  renderArrayObjectItem(fieldDef, path, value, index) {
    const summary = typeof fieldDef.summary === "function"
      ? fieldDef.summary(value || {}, index)
      : `${fieldDef.label} ${index + 1}`;

    return `
      <article class="cms-repeater-object">
        <div class="cms-repeater-object-header">
          <div>
            <p class="content-summary-label">${escapeHtml(fieldDef.itemLabel || fieldDef.label)}</p>
            <h4>${escapeHtml(summary)}</h4>
          </div>
          <div class="cms-inline-actions">
            <button type="button" class="btn-small" data-action="move-array-item" data-path="${escapeHtml(pathKey(path))}" data-index="${index}" data-direction="up">Up</button>
            <button type="button" class="btn-small" data-action="move-array-item" data-path="${escapeHtml(pathKey(path))}" data-index="${index}" data-direction="down">Down</button>
            <button type="button" class="btn-small btn-danger" data-action="remove-array-item" data-path="${escapeHtml(pathKey(path))}" data-index="${index}">Delete</button>
          </div>
        </div>
        <div class="cms-field-grid">
          ${this.renderFields(fieldDef.fields || [], path)}
        </div>
      </article>
    `;
  }
}
