// File: app.js
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra xem biến portfolioData từ file data.js đã được tải chưa
    if (typeof portfolioData === 'undefined') {
        document.getElementById('main-content').innerHTML = `
            <div style="padding: 4rem;">
                <h2>Lỗi tải dữ liệu</h2>
                <p>Không tìm thấy file data.js. Vui lòng đảm bảo bạn đã tạo file data.js đúng cấu trúc.</p>
            </div>`;
        return;
    }

    // Render toàn bộ website lập tức (Zero delay)
    renderHero(portfolioData);
    renderAbout(portfolioData.about_me);
    renderSkills(portfolioData.professional_skills);
    renderWork(portfolioData.featured_projects);
    renderEducation(portfolioData.education);
    renderContact(portfolioData.personal_info);

    setupScrollSpy();
});

function renderHero(data) {
    const hero = document.getElementById('hero');
    const { personal_info, professional_skills } = data;

    const glanceHtml = professional_skills.map(skill => `
        <div class="glance-item">
            <h3>${skill.category}</h3>
            <p>${skill.descriptions[0].split(':')[0]}</p>
        </div>
    `).join('');

    hero.innerHTML = `
        <h1 class="huge-text">${personal_info.name}</h1>
        <h2 class="title-text">${personal_info.title}</h2>
        <div class="at-a-glance">
            ${glanceHtml}
        </div>
    `;
}

function renderAbout(about) {
    const section = document.getElementById('about');

    const workingStyleHtml = about.working_style.map(ws => `
        <div class="working-style-item">
            <h4>${ws.title}</h4>
            <p>${ws.description}</p>
        </div>
    `).join('');

    const overviewHtml = about.experience_overview.map(p => `<p>${p}</p>`).join('');

    section.innerHTML = `
        <h2 class="section-title">01 / About</h2>
        <div class="about-grid">
            <div class="about-block">
                <h3>Working Style</h3>
                ${workingStyleHtml}
                <br>
                <h3>Career Goals</h3>
                <p><strong>Short-term:</strong> ${about.career_goals.short_term}</p>
                <p><strong>Long-term:</strong> ${about.career_goals.long_term}</p>
            </div>
            <div class="about-block">
                <h3>Experience Overview</h3>
                ${overviewHtml}
            </div>
        </div>
    `;
}

function renderSkills(skills) {
    const section = document.getElementById('skills');

    const skillsHtml = skills.map((skill, index) => {
        const descHtml = skill.descriptions.map(d => `<li>${d}</li>`).join('');

        let portfoliosHtml = '';
        if (skill.portfolios && skill.portfolios.length > 0) {
            const groupsHtml = skill.portfolios.map(group => {
                const itemsHtml = group.items.map(item => `
                    <a href="${item.link}" target="_blank" class="portfolio-item">
                        <img src="${item.image_url}" alt="${item.name}" loading="lazy" decoding="async">
                        <span>${item.name}</span>
                    </a>
                `).join('');
                return `
                    <div class="portfolio-group">
                        <h4>${group.group_name}</h4>
                        <div class="portfolio-items-grid">${itemsHtml}</div>
                    </div>
                `;
            }).join('');

            portfoliosHtml = `
                <details>
                    <summary>View Selected Work (${skill.portfolios.length} Groups)</summary>
                    <div class="details-content">${groupsHtml}</div>
                </details>
            `;
        }

        return `
            <div class="skill-card">
                <div class="skill-header">
                    <h3>${skill.category}</h3>
                    <span>0${index + 1}</span>
                </div>
                <ul class="skill-desc">${descHtml}</ul>
                ${portfoliosHtml}
            </div>
        `;
    }).join('');

    section.innerHTML = `
        <h2 class="section-title">02 / Skills</h2>
        <div class="skill-grid">
            ${skillsHtml}
        </div>
    `;
}

let globalProjectsData = [];

function renderWork(featured_projects) {
    const section = document.getElementById('work');
    let projectCounter = 1;
    let html = `<h2 class="section-title">03 / Selected Work</h2>`;

    featured_projects.forEach(category => {
        let categoryHtml = `<div class="work-category"><h3>${category.category_name}</h3>`;

        category.projects.forEach(project => {
            const indexStr = projectCounter.toString().padStart(2, '0');
            project.internalId = projectCounter;
            globalProjectsData.push(project);

            categoryHtml += `
                <div class="project-row" onclick="openProject(${project.internalId})">
                    <div class="project-num">${indexStr}</div>
                    <div class="project-name">${project.name}</div>
                </div>
            `;
            projectCounter++;
        });

        categoryHtml += `</div>`;
        html += categoryHtml;
    });

    section.innerHTML = html;
}

function openProject(id) {
    const project = globalProjectsData.find(p => p.internalId === id);
    if (!project) return;

    const dialog = document.getElementById('project-modal');
    const body = document.getElementById('modal-body');

    const renderImages = (images, title) => {
        if (!images || images.length === 0) return '';
        const imgsHtml = images.map(img => `<img src="${img.image_url}" alt="${img.name}" loading="lazy" decoding="async">`).join('');
        return `<h4 class="modal-gallery-title">${title}</h4><div class="modal-images">${imgsHtml}</div>`;
    };

    body.innerHTML = `
        <h2 class="huge-text" style="font-size: clamp(2rem, 5vw, 4rem);">${project.name}</h2>
        <p class="title-text" style="margin-bottom: 2rem;">Overview: ${project.overview}</p>

        <div class="modal-grid">
            <div class="modal-meta">
                <h4>MY ROLE</h4>
                <p>${project.main_tasks.role}</p>

                <h4>SCOPE</h4>
                <p>${project.main_tasks.scope}</p>

                <h4>COORDINATION</h4>
                <p>${project.main_tasks.coordination}</p>

                <h4>OUTCOME</h4>
                <p>${project.impact.outcome}</p>

                <h4>METRICS / IMPACT</h4>
                <p>${project.impact.metrics}</p>
            </div>

            <div class="modal-visuals">
                ${renderImages(project.plan_images, 'Plan & Strategy')}
                ${renderImages(project.product_images, 'Product Output')}
            </div>
        </div>
    `;

    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

// Logic đóng Modal
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('project-modal').close();
    document.body.style.overflow = 'auto';
});

document.getElementById('project-modal').addEventListener('close', () => {
    document.body.style.overflow = 'auto';
});

document.getElementById('project-modal').addEventListener('click', (e) => {
    const dialogDimensions = e.target.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
        e.target.close();
    }
});

function renderEducation(education) {
    const section = document.getElementById('education');
    const eduHtml = education.map(edu => `
        <div class="edu-item">
            <h3>${edu.title}</h3>
            ${edu.institution ? `<p>${edu.institution} | ${edu.period}</p>` : ''}
        </div>
    `).join('');

    section.innerHTML = `
        <h2 class="section-title">04 / Education</h2>
        ${eduHtml}
    `;
}

function renderContact(info) {
    const section = document.getElementById('contact');
    const socialsHtml = info.contact.social_links.map(link => `<a href="${link.url}" target="_blank">${link.platform}</a>`).join('');

    section.innerHTML = `
        <h2 class="section-title">05 / Contact</h2>
        <p>Let's create something together.</p>
        <a href="mailto:${info.contact.email}" class="contact-huge">${info.contact.email}</a>
        <p>Phone: ${info.contact.phone}</p>
        <div class="social-links">
            ${socialsHtml}
        </div>
    `;
}

function setupScrollSpy() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');
    const progressBar = document.getElementById('progress-bar');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(sec => observer.observe(sec));

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.offsetHeight;
        const winHeight = window.innerHeight;
        const scrollPercent = scrollTop / (docHeight - winHeight);
        if(progressBar) progressBar.style.width = scrollPercent * 100 + "%";
    });
}
