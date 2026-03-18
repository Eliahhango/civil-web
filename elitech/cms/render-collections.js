document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Attempt to fetch fresh data from the Cloud API
        let response = await fetch('/api/cms/content');
        
        // Fallback to local cached compiled JSON if API fails
        if (!response.ok) {
            response = await fetch('/elitech/cms/content.json');
        }
        const data = await response.json();

        // 1. Render Blogs
        const blogGrid = document.getElementById('cms-blog-grid');
        if (blogGrid && data.blogs && data.blogs.length > 0) {
            // Prepends in reverse order, so we reverse the array 
            // first to keep the newest (first in list) at the very top.
            data.blogs.slice().reverse().forEach(blog => {
                const col = document.createElement('div');
                col.className = 'col-xl-4 col-md-6';
                col.innerHTML = `
                    <div class="post-item">
                        <div class="post-featured-image">
                            <a href="${blog.url || '#'}">
                                <figure class="at-blog-shiny-glass-effect">
                                    <img src="${blog.image || '/elitech/wp-content/uploads/2025/11/post-image-placeholder.jpg'}" alt="${blog.title}" class="attachment-large size-large wp-post-image">
                                </figure>
                            </a>
                        </div>
                        <div class="post-item-tags">
                            <ul><li><a href="#">${blog.category || 'Uncategorized'}</a></li></ul>
                        </div>
                        <div class="post-item-body">
                            <div class="post-content-box">
                                <div class="post-item-meta"><p>${blog.date || ''}</p></div>
                                <div class="post-item-content">
                                    <h2><a href="${blog.url || '#'}">${blog.title}</a></h2>
                                    <p>${blog.excerpt || ''}</p>
                                </div>
                            </div>
                            <div class="post-item-btn">
                                <a href="${blog.url || '#'}">Read More <svg fill="currentColor" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M17.908 8.96934C15.4978 8.96934 13.3011 6.68213 13.3011 4.17043V3.14062H11.3238V4.17043C11.3238 5.99731 12.093 7.71091 13.3001 8.96934L1.10156 8.96934L1.10156 11.029L13.3001 11.029C12.093 12.2874 11.3238 14.001 11.3238 15.8279V16.8577H13.3011V15.8279C13.3011 13.3162 15.4978 11.029 17.908 11.029H18.8966V8.96934H17.908Z" fill-rule="evenodd"></path></svg></a>
                            </div>
                        </div>
                    </div>
                `;
                blogGrid.prepend(col);
            });
        }

        // 2. Render Projects
        const projectsGrid = document.getElementById('cms-projects-grid');
        if (projectsGrid && data.projects && data.projects.length > 0) {
            data.projects.slice().reverse().forEach(project => {
                const col = document.createElement('div');
                col.className = 'col-xl-4 col-md-6';
                col.innerHTML = `
                    <div class="project-item">
                        <div class="project-item-image">
                            <a href="${project.url || '#'}">
                                <figure class="at-blog-shiny-glass-effect">
                                    <img src="${project.image || '/elitech/wp-content/uploads/2025/11/project-image-placeholder.jpg'}" alt="${project.title}" class="attachment-large size-large wp-post-image">
                                </figure>
                            </a>
                        </div>
                        <div class="project-item-content">
                            <h2><a href="${project.url || '#'}">${project.title}</a></h2>
                            <p><a href="#">${project.category || 'Category'}</a></p>
                        </div>
                        <div class="project-item-btn">
                            <a href="${project.url || '#'}"><svg fill="currentColor" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M17.908 8.96934C15.4978 8.96934 13.3011 6.68213 13.3011 4.17043V3.14062H11.3238V4.17043C11.3238 5.99731 12.093 7.71091 13.3001 8.96934L1.10156 8.96934L1.10156 11.029L13.3001 11.029C12.093 12.2874 11.3238 14.001 11.3238 15.8279V16.8577H13.3011V15.8279C13.3011 13.3162 15.4978 11.029 17.908 11.029H18.8966V8.96934H17.908Z" fill-rule="evenodd"></path></svg></a>
                        </div>
                    </div>
                `;
                projectsGrid.prepend(col);
            });
        }

        // 3. Render Services
        const servicesGrid = document.getElementById('cms-services-grid');
        if (servicesGrid && data.services && data.services.length > 0) {
            data.services.slice().reverse().forEach((service) => {
                const el = document.createElement('div');
                el.className = 'elementor-element e-con-full service-item e-flex e-con e-child';
                el.setAttribute('data-e-type', 'container');
                el.setAttribute('data-element_type', 'container');
                el.innerHTML = `
                    <div class="elementor-element e-con-full e-flex e-con e-child" data-e-type="container" data-element_type="container">
                        <div class="elementor-element e-con-full e-flex e-con e-child" data-e-type="container" data-element_type="container">
                            <div class="elementor-element at-heading-animation at-animation-heading-none elementor-widget elementor-widget-heading" data-e-type="widget" data-element_type="widget" data-widget_type="heading.default">
                                <h2 class="elementor-heading-title elementor-size-default"><a href="${service.url || '#'}">${service.title}</a></h2>
                            </div>
                            <div class="elementor-element at-heading-animation at-animation-heading-none elementor-widget elementor-widget-heading" data-e-type="widget" data-element_type="widget" data-widget_type="heading.default">
                                <h3 class="elementor-heading-title elementor-size-default" style="color:#d4af37">*</h3>
                            </div>
                        </div>
                        <div class="elementor-element elementor-widget elementor-widget-text-editor" data-e-type="widget" data-element_type="widget" data-widget_type="text-editor.default">
                            <p>${service.excerpt || ''}</p>
                        </div>
                    </div>
                    <div class="elementor-element e-con-full e-flex e-con e-child" data-e-type="container" data-element_type="container">
                        <div class="elementor-element at-shiny-glass-effect service-item-image at-image-animation at-animation-image-none elementor-widget elementor-widget-image" data-e-type="widget" data-element_type="widget" data-widget_type="image.default">
                            <img src="${service.image || '/elitech/wp-content/uploads/2025/11/service-image-1.jpg'}" alt="${service.title}" class="attachment-full size-full" style="width:100%; height:auto;">
                        </div>
                        <div class="elementor-element elementor-absolute service-item-btn e-transform elementor-view-default elementor-widget elementor-widget-icon" data-e-type="widget" data-element_type="widget" data-widget_type="icon.default" data-settings='{"_position":"absolute"}'>
                            <div class="elementor-icon-wrapper">
                                <a class="elementor-icon" href="${service.url || '#'}">
                                    <svg fill="currentColor" height="14" viewBox="0 0 18 14" width="18" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M16.8065 5.82872C14.3962 5.82872 12.1995 3.54151 12.1995 1.02981V0L10.2223 0V1.02981C10.2223 2.85669 10.9914 4.57028 12.1985 5.82872L0 5.82872L0 7.88833L12.1985 7.88833C10.9914 9.14676 10.2223 10.8604 10.2223 12.6872V13.717H12.1995V12.6872C12.1995 10.1755 14.3962 7.88833 16.8065 7.88833H17.7951V5.82872H16.8065Z" fill-rule="evenodd"></path></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                servicesGrid.prepend(el);
            });
        }
    } catch (err) {
        console.error('Error loading collections:', err);
    }
});
