(function () {
  "use strict";

  var API_URL = "/api/cms/content";
  var STATIC_URL = "/elitech/cms/content.json";

  function normalizePath(value) {
    var clean = String(value || "/").replace(/\\+/g, "/");
    if (!clean.startsWith("/")) {
      clean = "/" + clean;
    }
    return clean.endsWith("/") ? clean : clean + "/";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getCurrentPath() {
    return normalizePath(window.location.pathname);
  }

  function getCurrentSlug() {
    var segments = getCurrentPath().split("/").filter(Boolean);
    return segments.length ? segments[segments.length - 1] : "";
  }

  function getCmsData() {
    if (window.__ELITECH_CMS_DATA__ && typeof window.__ELITECH_CMS_DATA__ === "object") {
      return Promise.resolve(window.__ELITECH_CMS_DATA__);
    }

    return fetch(API_URL, { cache: "no-store" })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
        return fetch(STATIC_URL, { cache: "no-store" }).then(function (fallback) {
          if (!fallback.ok) {
            throw new Error("Unable to load CMS content.");
          }
          return fallback.json();
        });
      })
      .catch(function () {
        return fetch(STATIC_URL, { cache: "no-store" }).then(function (fallback) {
          if (!fallback.ok) {
            throw new Error("Unable to load CMS content.");
          }
          return fallback.json();
        });
      });
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function sortByOrder(items) {
    return safeArray(items).slice().sort(function (left, right) {
      return Number(left && left.order || 0) - Number(right && right.order || 0);
    });
  }

  function setText(node, value) {
    if (node) {
      node.textContent = String(value || "");
    }
  }

  function setLink(node, href, text) {
    if (!node) {
      return;
    }
    if (href) {
      node.setAttribute("href", href);
    }
    if (text !== undefined) {
      node.textContent = String(text || "");
    }
  }

  function setImage(node, src, alt) {
    if (!node) {
      return;
    }
    if (src) {
      node.setAttribute("src", src);
      node.removeAttribute("srcset");
      node.removeAttribute("sizes");
      node.removeAttribute("loading");
    }
    if (alt !== undefined) {
      node.setAttribute("alt", String(alt || ""));
    }
  }

  function setParagraphs(container, paragraphs) {
    if (!container) {
      return;
    }
    container.innerHTML = safeArray(paragraphs).map(function (text) {
      return "<p>" + escapeHtml(text) + "</p>";
    }).join("");
  }

  function getTemplateClone(container) {
    if (!container || !container.firstElementChild) {
      return null;
    }
    return container.firstElementChild.cloneNode(true);
  }

  function renderFromTemplate(container, items, binder, options) {
    if (!container) {
      return;
    }

    var template = getTemplateClone(container);
    if (!template) {
      return;
    }

    var renderItems = safeArray(items).slice();
    if (options && typeof options.limit === "number") {
      renderItems = renderItems.slice(0, options.limit);
    }

    container.innerHTML = "";
    
    // Use an IntersectionObserver to animate content naturally as it scrolls into view (Mobile compatible)
    var observer = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(function(entries, obs) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var target = entry.target;
            target.classList.remove("elementor-invisible");
            target.classList.add("animated", "fadeInUp");
            target.style.visibility = "visible";
            target.style.opacity = "1";
            target.style.animationName = "fadeInUp";
            
            var invisibles = target.querySelectorAll(".elementor-invisible, [style*='visibility: hidden']");
            for (var i = 0; i < invisibles.length; i++) {
              invisibles[i].classList.remove("elementor-invisible");
              invisibles[i].classList.add("animated", "fadeInUp");
              invisibles[i].style.visibility = "visible";
              invisibles[i].style.opacity = "1";
              invisibles[i].style.animationName = "fadeInUp";
            }
            obs.unobserve(target);
          }
        });
      }, { threshold: 0.1 });
    }

    renderItems.forEach(function (item, index) {
      var node = template.cloneNode(true);
      
      if (observer) {
        // Prepare element for scroll animation
        node.classList.add("elementor-invisible");
        node.style.visibility = "hidden";
        node.style.opacity = "0";
        node.style.animationName = "none";
        observer.observe(node);
        
        var invisibles = node.querySelectorAll(".elementor-invisible");
        for (var i = 0; i < invisibles.length; i++) {
          invisibles[i].style.visibility = "hidden";
          invisibles[i].style.opacity = "0";
          invisibles[i].style.animationName = "none";
        }
      } else {
        // Fallback if IntersectionObserver isn't supported (old browsers)
        node.classList.remove("elementor-invisible");
        var invisibles = node.querySelectorAll(".elementor-invisible");
        for (var i = 0; i < invisibles.length; i++) {
          invisibles[i].classList.remove("elementor-invisible");
          invisibles[i].classList.add("animated", "fadeInUp");
          invisibles[i].style.visibility = "visible";
          invisibles[i].style.opacity = "1";
          invisibles[i].style.animationName = "fadeInUp";
        }
        
        node.classList.add("animated", "fadeInUp");
        node.style.visibility = "visible";
        node.style.opacity = "1";
        node.style.animationName = "fadeInUp";
      }

      binder(node, item, index);
      container.appendChild(node);
    });
  }

  function updateBreadcrumb(label) {
    setText(document.querySelector(".breadcrumb-trail .trail-end span span"), label);
  }

  function updatePageTitle(title) {
    var hero = document.querySelector(".page-header h1, .page-header-box h1, h1.elementor-heading-title");
    setText(hero, title);
  }

  function replaceAccordionItems(container, items) {
    if (!container) {
      return;
    }

    var template = container.querySelector(".elementskit-card");
    if (!template) {
      return;
    }

    container.innerHTML = "";
    safeArray(items).forEach(function (item, index) {
      var node = template.cloneNode(true);
      var baseId = "cms-accordion-" + Math.random().toString(36).slice(2) + "-" + index;
      var link = node.querySelector(".ekit-accordion--toggler");
      var title = node.querySelector(".ekit-accordion-title");
      var content = node.querySelector(".collapse, .multi-collapse");
      var answer = node.querySelector(".elementskit-card-body p");

      setText(title, item && item.question || "");
      setText(answer, item && item.answer || "");

      node.classList.toggle("active", index === 0);
      if (link) {
        link.setAttribute("href", "#" + baseId);
        link.setAttribute("data-target", "#" + baseId);
        link.setAttribute("aria-controls", baseId);
        link.setAttribute("aria-expanded", index === 0 ? "true" : "false");
      }
      if (content) {
        content.setAttribute("id", baseId);
        content.classList.toggle("show", index === 0);
      }

      container.appendChild(node);
    });
  }

  function replaceListItems(list, items) {
    if (!list) {
      return;
    }

    var template = list.querySelector("li");
    if (!template) {
      return;
    }

    list.innerHTML = "";
    safeArray(items).forEach(function (itemText) {
      var node = template.cloneNode(true);
      setText(node.querySelector(".elementor-icon-list-text"), itemText);
      list.appendChild(node);
    });
  }

  function bindServiceCard(node, item, index) {
    if (node.querySelector(".service-item-body-gold")) {
      var homeHeadings = node.querySelectorAll(".elementskit-info-box-title");
      setText(homeHeadings[0], item.excerpt || item.title || "");
      setText(homeHeadings[1], item.title || "");
      setLink(node.querySelector(".elementskit-btn"), item.url || "#");
      return;
    }

    setLink(node.querySelector("h2 a"), item.url || "#", item.title || "");
    
    var h3Nodes = node.querySelectorAll("h3");
    for (var i = 0; i < h3Nodes.length; i++) {
      var text = h3Nodes[i].textContent || "";
      if (text.trim().match(/^\d+\.$/)) {
        var numText = (index < 9 ? "0" + (index + 1) : (index + 1)) + ".";
        setText(h3Nodes[i], numText);
        break;
      }
    }

    setText(node.querySelector(".elementor-widget-text-editor p"), item.excerpt || "");
    setImage(node.querySelector(".service-item-image img"), item.image || "", item.title || "");
    setLink(node.querySelector(".service-item-btn a"), item.url || "#");
  }

  function bindProjectCard(node, item) {
    if (node.querySelector(".project-item-gold")) {
      setLink(node.querySelector(".project-item-image-gold a"), item.url || "#");
      setImage(node.querySelector(".project-item-image-gold img"), item.image || item.detailImage || "", item.title || "");
      setText(node.querySelector(".project-item-categories-gold"), item.category || "");
      setText(node.querySelector(".project-item-content-gold h2"), item.title || "");
      setText(node.querySelector(".project-item-content-gold p"), safeArray(item.intro)[0] || "");
      setLink(node.querySelector(".project-item-content-gold a"), item.url || "#");
      setLink(node.querySelector(".project-readmore-btn-gold a"), item.url || "#");
      return;
    }

    setLink(node.querySelector(".project-item-image a"), item.url || "#");
    setImage(node.querySelector(".project-item-image img"), item.image || item.detailImage || "", item.title || "");
    setLink(node.querySelector(".project-item-content h2 a"), item.url || "#", item.title || "");
    setText(node.querySelector(".project-item-content p a"), item.category || "");
    setLink(node.querySelector(".project-item-btn a"), item.url || "#");
  }

  function bindBlogCard(node, item) {
    if (node.querySelector(".elementskit-post-image-card")) {
      setLink(node.querySelector(".elementskit-entry-thumb"), item.url || "#");
      setImage(node.querySelector(".elementskit-entry-thumb img"), item.image || "", item.title || "");
      setText(node.querySelector(".elementskit-meta-wraper span a"), item.category || "");
      setText(node.querySelector(".entry-title a"), item.title || "");
      setLink(node.querySelector(".entry-title a"), item.url || "#");
      setText(node.querySelector(".elementskit-entry-header + .elementskit-post-body p, .elementskit-post-body p"), item.excerpt || "");
      return;
    }

    setLink(node.querySelector(".post-featured-image a"), item.url || "#");
    setImage(node.querySelector(".post-featured-image img"), item.image || "", item.title || "");
    setText(node.querySelector(".post-item-tags a"), item.category || "");
    setText(node.querySelector(".post-item-meta p"), item.date || "");
    setLink(node.querySelector(".post-item-content h2 a"), item.url || "#", item.title || "");
    setText(node.querySelector(".post-item-content p"), item.excerpt || "");
    setLink(node.querySelector(".post-item-btn a"), item.url || "#");
  }

  function applySharedContact(contact) {
    if (!contact) {
      return;
    }

    var workingRows = document.querySelectorAll(".ekit-single-day");
    if (workingRows.length && safeArray(contact.workingHours).length) {
      var template = workingRows[0].cloneNode(true);
      var parent = workingRows[0].parentElement;
      if (parent) {
        parent.innerHTML = "";
        safeArray(contact.workingHours).forEach(function (row) {
          var node = template.cloneNode(true);
          setText(node.querySelector(".ekit-business-day"), row.days || "");
          setText(node.querySelector(".ekit-business-time"), row.hours || "");
          parent.appendChild(node);
        });
      }
    }

    setText(document.querySelector(".elementor-element-0a1fea6 p"), contact.footerAddress || "");
    setText(document.querySelector(".elementor-element-2a6ca4f p"), contact.footerAddress || "");

    var footerPhoneLinks = document.querySelectorAll('a[href^="tel:"]');
    footerPhoneLinks.forEach(function (link) {
      var text = (link.textContent || "").trim();
      if (/^\+?[\d\s()-]+$/.test(text) || text === "") {
        if (contact.footerPhone) {
          link.setAttribute("href", "tel:" + contact.footerPhone.replace(/[^\d+]/g, ""));
          link.textContent = contact.footerPhone;
        }
      }
    });

    var footerEmailLinks = document.querySelectorAll('a[href^="mailto:"]');
    footerEmailLinks.forEach(function (link) {
      if (contact.footerEmail) {
        link.setAttribute("href", "mailto:" + contact.footerEmail);
        var text = (link.textContent || "").trim();
        if (!text || text.indexOf("@") >= 0) {
          link.textContent = contact.footerEmail;
        }
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll(".elementor-widget-text-editor p"), function (paragraph) {
      var text = (paragraph.textContent || "").trim();
      if (text === "Kibaha, Pwani, Tanzania" && contact.footerAddress) {
        paragraph.textContent = contact.footerAddress;
      }
      if (text === "+255 688 164 510" && contact.footerPhone) {
        paragraph.textContent = contact.footerPhone;
      }
      if (text === "hangoeliah@outlook.com" && contact.footerEmail) {
        paragraph.textContent = contact.footerEmail;
      }
    });
  }

  function applyAboutPage(about) {
    if (getCurrentPath() !== "/elitech/about-us/" || !about) {
      return;
    }

    updatePageTitle(about.heroTitle || "About us");
    updateBreadcrumb("About Us");

    setText(document.querySelector('[data-id="922977c"] h3'), about.label || "");
    setText(document.querySelector('[data-id="922977c"] h2'), about.title || "");
    setText(document.querySelector('[data-id="922977c"] .elementor-widget-text-editor p'), about.description || "");
    setImage(document.querySelector(".about-us-image img"), about.images && about.images.primary || "", about.title || "");
    setImage(document.querySelector(".about-us-image-box-2 img"), about.images && about.images.secondary || "", about.title || "");
    setImage(document.querySelector('img[src*="our-values-image"]'), about.images && about.images.values || "", about.valuesTitle || "");

    var pathRing = document.querySelector(".e-text-path");
    if (pathRing && about.experienceLabel) {
      pathRing.setAttribute("data-text", about.experienceLabel);
    }

    var aboutCards = document.querySelectorAll('[data-id="3b25c37"] .elementskit-infobox');
    safeArray(about.featureCards).forEach(function (card, index) {
      var node = aboutCards[index];
      if (!node) {
        return;
      }
      setText(node.querySelector(".elementskit-info-box-title"), card.title || "");
      setText(node.querySelector("p"), card.description || "");
    });

    var pillarTitleSelectors = [
      '[data-id="d96a807"] .elementskit-info-box-title',
      '[data-id="186b1ee"] .elementskit-info-box-title',
      '[data-id="d063e1a"] .elementskit-info-box-title'
    ];
    var pillarDescriptionSelectors = [
      '[data-id="d96a807"] .box-body p',
      '[data-id="186b1ee"] .box-body p',
      '[data-id="d063e1a"] .box-body p'
    ];
    var pillarListSelectors = [
      '[data-id="90289eb"] ul',
      '[data-id="f29d521"] ul',
      '[data-id="9dcd2f5"] ul'
    ];
    safeArray(about.pillars).forEach(function (pillar, index) {
      setText(document.querySelector(pillarTitleSelectors[index]), pillar.title || "");
      setText(document.querySelector(pillarDescriptionSelectors[index]), pillar.description || "");
      replaceListItems(document.querySelector(pillarListSelectors[index]), about.bulletPoints || []);
    });

    setText(document.querySelector('[data-id="2d53a47"] h3'), about.valuesTitle || "");
    setText(document.querySelector('[data-id="2d53a47"] .elementor-widget-text-editor p'), about.valuesDescription || "");
    setText(document.querySelector('[data-id="0a6b639"] h3'), about.faqIntroTitle || "");
    setText(document.querySelector('[data-id="0a6b639"] .elementor-widget-text-editor p'), about.faqIntroDescription || "");
  }

  function applyContactPage(contact) {
    if (getCurrentPath() !== "/elitech/contact-us/" || !contact) {
      return;
    }

    updatePageTitle(contact.heroTitle || "Contact us");
    updateBreadcrumb("Contact Us");

    setText(document.querySelector('[data-id="dc25cf4"] h3'), contact.label || "");
    setText(document.querySelector('[data-id="dc25cf4"] h2'), contact.title || "");
    setText(document.querySelector('[data-id="dc25cf4"] .elementor-widget-text-editor p'), contact.description || "");

    var cards = document.querySelectorAll('[data-id="f011ab1"] .elementskit-infobox');
    safeArray(contact.cards).forEach(function (card, index) {
      var node = cards[index];
      if (!node) {
        return;
      }
      setText(node.querySelector(".elementskit-info-box-title"), card.title || "");
      setText(node.querySelector("p"), card.value || "");
      var link = node.closest("a");
      if (link && card.href) {
        link.setAttribute("href", card.href);
      }
    });

    setText(document.querySelector('[data-id="1135d22"] h2'), contact.formTitle || "");
    setText(document.querySelector('[data-id="1135d22"] .elementor-widget-text-editor p'), contact.formDescription || "");

    var mapFrame = document.querySelector("iframe[title]");
    if (mapFrame && contact.mapEmbedUrl) {
      mapFrame.setAttribute("src", contact.mapEmbedUrl);
      mapFrame.setAttribute("title", contact.footerAddress || contact.title || "Map");
      mapFrame.setAttribute("aria-label", contact.footerAddress || contact.title || "Map");
    }
  }

  function applyFaqPage(faqs) {
    if (getCurrentPath() !== "/elitech/faqs/" || !faqs) {
      return;
    }

    updatePageTitle(faqs.heroTitle || "Frequently asked questions");
    updateBreadcrumb("FAQs");

    var navList = document.querySelector(".service-category-list ul");
    var navTemplate = navList && navList.querySelector("li");
    if (navList && navTemplate) {
      navList.innerHTML = "";
      safeArray(faqs.categories).forEach(function (category) {
        var navNode = navTemplate.cloneNode(true);
        setText(navNode.querySelector(".elementor-icon-list-text"), category.navLabel || category.title || "");
        setLink(navNode.querySelector("a"), "#" + (category.id || ""));
        navList.appendChild(navNode);
      });
    }

    var sectionTemplate = document.querySelector('[id^="faq-"]');
    var sectionsParent = sectionTemplate && sectionTemplate.parentElement;
    if (!sectionsParent || !sectionTemplate) {
      return;
    }

    sectionsParent.innerHTML = "";
    safeArray(faqs.categories).forEach(function (category) {
      var sectionNode = sectionTemplate.cloneNode(true);
      sectionNode.setAttribute("id", category.id || "");
      setText(sectionNode.querySelector("h2"), category.title || "");
      replaceAccordionItems(sectionNode.querySelector(".elementskit-accordion"), category.items || []);
      sectionsParent.appendChild(sectionNode);
    });
  }

  function applyServiceDetailPage(data) {
    var path = getCurrentPath();
    if (path === "/elitech/services/" || path.indexOf("/elitech/services/") !== 0) {
      return;
    }

    var slug = getCurrentSlug();
    var service = sortByOrder(data.services).find(function (item) {
      return item && item.slug === slug;
    });

    if (!service) {
      window.location.replace("/elitech/services/");
      return;
    }

    updatePageTitle(service.title || "");
    updateBreadcrumb(service.title || "Service");
    setImage(document.querySelector(".page-single-image img"), service.detailImage || service.image || "", service.title || "");
    setParagraphs(document.querySelector('[data-id="7a24b0a"], [data-id="9723542"]'), service.intro || []);
    setText(document.querySelector('[data-id="3374bfb"] h2'), service.whyChooseTitle || "");
    setText(document.querySelector('[data-id="87d0d00"] p'), service.whyChooseDescription || "");
    renderFromTemplate(document.querySelector('[data-id="3aac059"]'), service.whyChooseItems || [], function (node, item) {
      setText(node.querySelector(".elementskit-info-box-title"), item.title || "");
      setText(node.querySelector("p"), item.description || "");
    });
    setText(document.querySelector('[data-id="429881d"] h2'), service.offerTitle || "");
    setText(document.querySelector('[data-id="909764c"] p'), service.offerDescription || "");
    replaceListItems(document.querySelector(".service-offer-list ul"), service.offerItems || []);
    setText(document.querySelector('[data-id="66988b4"] h2'), service.processTitle || "");
    renderFromTemplate(document.querySelector('[data-id="7b2c96a"]'), service.processSteps || [], function (node, item) {
      setText(node.querySelector(".elementskit-info-box-title"), item.title || "");
      setText(node.querySelector("p"), item.description || "");
    });
    setText(document.querySelector('[data-id="3e6cea2"] h2'), service.faqTitle || "");
    replaceAccordionItems(document.querySelector('[data-id="7950d03"] .elementskit-accordion'), service.faqItems || []);
  }

  function applyProjectDetailPage(data) {
    var path = getCurrentPath();
    if (path === "/elitech/projects/" || path.indexOf("/elitech/projects/") !== 0) {
      return;
    }

    var slug = getCurrentSlug();
    var project = sortByOrder(data.projects).find(function (item) {
      return item && item.slug === slug;
    });

    if (!project) {
      window.location.replace("/elitech/projects/");
      return;
    }

    updatePageTitle(project.title || "");
    updateBreadcrumb(project.title || "Project");
    setImage(document.querySelector(".page-single-image img"), project.detailImage || project.image || "", project.title || "");
    setParagraphs(document.querySelector('[data-id="9723542"]'), project.intro || []);
    setText(document.querySelector('[data-id="12537ef"] h2'), project.keyFeaturesTitle || "");
    setText(document.querySelector('[data-id="f4bf5a3"] p'), project.keyFeaturesDescription || "");
    renderFromTemplate(document.querySelector('[data-id="4de3535"]'), project.keyFeatures || [], function (node, item) {
      setText(node.querySelector(".elementskit-info-box-title"), item.title || "");
      setText(node.querySelector("p"), item.description || "");
    });
    setText(document.querySelector('[data-id="ec9eeab"] h2'), project.processTitle || "");
    renderFromTemplate(document.querySelector('[data-id="2c9b96a"]'), project.processSteps || [], function (node, item) {
      setText(node.querySelector(".elementskit-info-box-title"), item.title || "");
      setText(node.querySelector("p"), item.description || "");
    });
    setText(document.querySelector('[data-id="cefe05a"] h2'), project.solutionsTitle || "");
    setText(document.querySelector('[data-id="83d426b"] p'), project.problemText || "");
    setText(document.querySelector('[data-id="3396c07"] h3'), project.problemTitle || "");
    setText(document.querySelector('[data-id="0ead120"] .elementskit-info-box-title'), project.solutionsHeading || "");
    setText(document.querySelector('[data-id="f839319"] p'), project.solutionsText || "");
    setText(document.querySelector('[data-id="d75da27"] h2'), project.faqTitle || "");
    replaceAccordionItems(document.querySelector('[data-id="2b8af2a"] .elementskit-accordion'), project.faqItems || []);
  }

  function buildBlogArticle(body) {
    var html = [];
    safeArray(body && body.intro).forEach(function (paragraph) {
      html.push("<p>" + escapeHtml(paragraph) + "</p>");
    });
    if (body && body.quote) {
      html.push("<blockquote class=\"wp-block-quote is-layout-flow wp-block-quote-is-layout-flow\"><p>" + escapeHtml(body.quote) + "</p></blockquote>");
    }
    safeArray(body && body.sections).forEach(function (section) {
      html.push("<h2 class=\"wp-block-heading\">" + escapeHtml(section.title || "") + "</h2>");
      safeArray(section.paragraphs).forEach(function (paragraph) {
        html.push("<p>" + escapeHtml(paragraph) + "</p>");
      });
      if (safeArray(section.bullets).length) {
        html.push("<ul>");
        safeArray(section.bullets).forEach(function (bullet) {
          html.push("<li>" + escapeHtml(bullet) + "</li>");
        });
        html.push("</ul>");
      }
    });
    return html.join("");
  }

  function applyBlogDetailPage(data) {
    var path = getCurrentPath();
    var slug = "";

    if (path.indexOf("/elitech/blog/") === 0 && path !== "/elitech/blog/") {
      slug = getCurrentSlug();
    } else if (document.querySelector(".post-single-meta")) {
      slug = getCurrentSlug();
    }

    if (!slug) {
      return;
    }

    var post = safeArray(data.blogPosts).find(function (item) {
      return item && item.slug === slug;
    });

    if (!post) {
      window.location.replace("/elitech/blog/");
      return;
    }

    setText(document.querySelector(".page-header-box h1, .page-header h1"), post.title || "");
    updateBreadcrumb(post.title || "Blog");
    var metaItems = document.querySelectorAll(".post-single-meta li");
    if (metaItems[0]) {
      var dateIcon = metaItems[0].querySelector("i");
      metaItems[0].innerHTML = (dateIcon ? dateIcon.outerHTML : "") + escapeHtml(post.date || "");
    }
    if (metaItems[1]) {
      var categoryIcon = metaItems[1].querySelector("i");
      metaItems[1].innerHTML = (categoryIcon ? categoryIcon.outerHTML : "") + "<a href=\"#\">" + escapeHtml(post.category || "") + "</a>";
    }
    setImage(document.querySelector(".post-single-image img"), post.image || "", post.title || "");
    var article = document.querySelector(".post-entry");
    if (article) {
      article.innerHTML = buildBlogArticle(post.body || {});
    }

    var tags = document.querySelector(".post-tags .tag-links");
    if (tags) {
      tags.innerHTML = "Tags:" + safeArray(post.tags).map(function (tag) {
        return "<a href=\"#\">" + escapeHtml(tag) + "</a>";
      }).join("");
    }
  }

  function renderCollections(data) {
    var path = getCurrentPath();
    var services = sortByOrder(data.services);
    var projects = sortByOrder(data.projects);
    var posts = safeArray(data.blogPosts);

    var servicesGrid = document.getElementById("cms-services-grid");
    if (servicesGrid) {
      renderFromTemplate(servicesGrid, services, bindServiceCard, {
        limit: path === "/elitech/home-version-2/" ? servicesGrid.children.length : undefined
      });
    }

    var projectsGrid = document.getElementById("cms-projects-grid");
    if (projectsGrid) {
      renderFromTemplate(projectsGrid, projects, bindProjectCard, {
        limit: path === "/elitech/home-version-2/" ? projectsGrid.children.length : undefined
      });
    }

    var blogGrid = document.getElementById("cms-blog-grid");
    if (blogGrid) {
      renderFromTemplate(blogGrid, posts, bindBlogCard, {
        limit: path === "/elitech/home-version-2/" ? blogGrid.children.length : undefined
      });
    }

    if (path === "/elitech/services/") {
      updatePageTitle(data.servicesPage && data.servicesPage.heroTitle || "Our services");
      updateBreadcrumb("Services");
    }

    if (path === "/elitech/projects/") {
      updatePageTitle(data.projectsPage && data.projectsPage.heroTitle || "Our projects");
      updateBreadcrumb("Projects");
    }

    if (path === "/elitech/blog/") {
      updatePageTitle(data.blogPage && data.blogPage.heroTitle || "Blog");
      updateBreadcrumb("Blog");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    getCmsData()
      .then(function (data) {
        if (!data || typeof data !== "object") {
          return;
        }

        applySharedContact(data.contact || {});
        renderCollections(data);
        applyAboutPage(data.about || {});
        applyContactPage(data.contact || {});
        applyFaqPage(data.faqs || {});
        applyServiceDetailPage(data);
        applyProjectDetailPage(data);
        applyBlogDetailPage(data);
      })
      .catch(function (error) {
        console.error("Failed to render CMS content:", error);
      });
  });

  // Generic Android/Mobile Fallbacks for Static Elements
  document.addEventListener("DOMContentLoaded", function () {
    // 1. Fix buggy srcset strings that cause missing images on Android Chrome/WebKit
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768) {
        function cleanImages() {
            var images = document.querySelectorAll("img[srcset]");
            for(var i=0; i<images.length; i++) {
                images[i].removeAttribute("srcset");
                images[i].removeAttribute("sizes");
                images[i].setAttribute("loading", "eager");
            }
        }
        
        cleanImages();
        setTimeout(cleanImages, 1000);
        setTimeout(cleanImages, 2500);

        // 2. Elementor animations (Waypoints) often fail on mobile scrolling. Native fallback:
        var observer = null;
        if (typeof IntersectionObserver !== "undefined") {
          observer = new IntersectionObserver(function(entries, obs) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                var el = entry.target;
                
                if (el.classList.contains("elementor-invisible") || el.classList.contains("at-image-animation")) {
                  el.classList.remove("elementor-invisible");
                  el.classList.add("animated", "fadeInUp");
                  el.style.visibility = "visible";
                  el.style.opacity = "1";
                  el.style.animationName = "fadeInUp";
                }

                if (el.classList.contains("elementor-counter-number")) {
                  var target = el.getAttribute("data-to-value");
                  if (target) {
                    el.innerText = target;
                  }
                }
                obs.unobserve(el);
              }
            });
          }, { threshold: 0.1 });
          
          var triggers = document.querySelectorAll(".elementor-invisible, .at-image-animation, .elementor-counter-number");
          for(var i=0; i<triggers.length; i++) {
              observer.observe(triggers[i]);
          }
        }

        // 3. Absolute Fallback: Force everything to show/animate after 3 seconds anyway
        setTimeout(function() {
            var invisibles = document.querySelectorAll(".elementor-invisible, .at-image-animation");
            for(var j=0; j<invisibles.length; j++) {
                invisibles[j].classList.remove("elementor-invisible");
                invisibles[j].classList.add("animated", "fadeInUp");
                invisibles[j].style.visibility = "visible";
                invisibles[j].style.opacity = "1";
            }
            var counters = document.querySelectorAll(".elementor-counter-number");
            for(var k=0; k<counters.length; k++) {
                var val = counters[k].getAttribute("data-to-value");
                if (val && counters[k].innerText === "0") counters[k].innerText = val;
            }
        }, 3000);
    }
  });

})();