// script.js

window.FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Cpath d='M80 240 L160 140 L240 240 Z' fill='%23cbd5e1'/%3E%3Cpath d='M180 240 L220 180 L280 240 Z' fill='%2394a3b8'/%3E%3Ccircle cx='100' cy='100' r='24' fill='%23cbd5e1'/%3E%3C/svg%3E";

window.handleImgErr = function(img) {
    img.onerror = null;
    img.src = window.FALLBACK_IMAGE;
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error("Không thể tải file dữ liệu.");
        const data = await response.json();

        const fixImagePaths = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    if (/^\/?assets\//.test(obj[key])) {
                        obj[key] = obj[key].replace(/^\/?assets\//, './assets/');
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    fixImagePaths(obj[key]);
                }
            }
        };
        fixImagePaths(data);

        window.portfolioData = data;

        const currentYear = document.getElementById('current-year');
        if(currentYear) currentYear.textContent = new Date().getFullYear();

        renderHero(data.personal_info, data.about_me);
        renderAbout(data.about_me);
        renderSkills(data.professional_skills);
        renderProjects(data.featured_projects);
        renderEducation(data.education);
        renderContact(data.personal_info.contact);

        initScrollSpy();
        initProjectFiltering(data.featured_projects);
        initThemeSwitcher();

    } catch (error) {
        console.error("Lỗi khởi tạo Web:", error);
        document.body.innerHTML = "<h2 style='padding: 2rem; text-align:center;'>Đang cập nhật hệ thống. Vui lòng quay lại sau!</h2>";
    }
});

/* ==========================================================================
   RENDER FUNCTIONS
   ========================================================================== */

function renderHero(info, about) {
    document.getElementById('hero-name').textContent = info.name;
    document.getElementById('hero-title').textContent = info.title;

    const positioning = about.working_style[0].description;
    document.getElementById('hero-positioning').textContent = positioning;

    const navContact = document.getElementById('nav-contact');
    navContact.innerHTML = `
        <p>${info.contact.email}</p>
        <p>${info.contact.phone}</p>
    `;
}

function renderAbout(about) {
    const overviewHtml = about.experience_overview.map(p => `<p>${p}</p>`).join('');
    document.getElementById('about-overview').innerHTML = overviewHtml;

    const styleHtml = about.working_style.map(style => `
        <div class="working-style-item">
            <h4 class="working-style-title">${style.title}</h4>
            <p>${style.description}</p>
        </div>
    `).join('');
    document.getElementById('working-style-list').innerHTML = styleHtml;

    document.getElementById('career-goals').innerHTML = `
        <p><strong>Ngắn hạn:</strong> ${about.career_goals.short_term}</p>
        <p><strong>Dài hạn:</strong> ${about.career_goals.long_term}</p>
    `;
}

function renderSkills(skills) {
    const indexList = document.getElementById('index-list');
    const container = document.getElementById('skills-container');

    skills.forEach((skill, index) => {
        const num = String(index + 1).padStart(2, '0');
        const skillId = `skill-${index}`;

        const indexLi = document.createElement('li');
        indexLi.className = 'index-item';
        indexLi.innerHTML = `
            <a href="#${skillId}">
                <span class="index-num">${num}</span>
                <span class="index-name">${skill.category}</span>
            </a>
        `;
        indexList.appendChild(indexLi);

        const descriptions = skill.descriptions.map(desc => `<li>${desc}</li>`).join('');

        let portfoliosHtml = '';
        if (skill.portfolios && skill.portfolios.length > 0) {
            portfoliosHtml = skill.portfolios.map(group => {
                const itemsHtml = group.items.map(item => `
                    <a href="${item.link !== 'https://linktosource' ? item.link : '#'}" class="portfolio-item" target="_blank" rel="noopener">
                        <img src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="handleImgErr(this)">
                        <span class="portfolio-name">${item.name}</span>
                    </a>
                `).join('');
                return `
                    <div class="portfolio-group">
                        <h4 class="group-name">${group.group_name}</h4>
                        <div class="portfolio-grid">${itemsHtml}</div>
                    </div>
                `;
            }).join('');
        }

        const skillEl = document.createElement('div');
        skillEl.className = 'skill-category';
        skillEl.id = skillId;
        skillEl.innerHTML = `
            <div class="skill-header">
                <span class="skill-num">${num}</span>
                <h3 class="skill-title">${skill.category}</h3>
            </div>
            <div class="skill-description">
                <ul>${descriptions}</ul>
            </div>
            <div class="skill-portfolios">
                ${portfoliosHtml}
            </div>
        `;
        container.appendChild(skillEl);
    });
}

function renderEducation(education) {
    const eduHtml = education.map(edu => `
        <li>
            <h4 class="edu-title">${edu.title}</h4>
            <div class="edu-meta">
                ${edu.institution ? `<span>${edu.institution}</span>` : ''}
                ${edu.period ? `<span>${edu.period}</span>` : ''}
            </div>
        </li>
    `).join('');
    document.getElementById('education-list').innerHTML = eduHtml;
}

function renderContact(contact) {
    let socialHtml = contact.social_links.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener">${link.platform} ↗</a><br>
    `).join('');

    document.getElementById('contact-details').innerHTML = `
        <a href="mailto:${contact.email}" class="huge-email">${contact.email}</a>

        <div class="contact-meta-grid">
            <div class="contact-meta-item">
                <span class="micro-label">Điện thoại</span>
                <a href="tel:${contact.phone}">${contact.phone}</a>
            </div>
            <div class="contact-meta-item">
                <span class="micro-label">Mạng xã hội</span>
                ${socialHtml}
            </div>
        </div>
    `;
}

/* ==========================================================================
   PROJECT LOGIC & DIALOG (MODAL) ĐÃ FIX TƯƠNG THÍCH IOS CŨ
   ========================================================================== */

let flatProjects = [];
let currentFilteredProjects = [];
let currentProjectIndex = 0;

function renderProjects(categories) {
    const filterContainer = document.getElementById('project-filters');

    filterContainer.innerHTML = `<button class="filter-btn active" data-filter="All">All Projects</button>`;

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = cat.category_name;
        btn.textContent = cat.category_name;
        filterContainer.appendChild(btn);

        cat.projects.forEach(proj => {
            proj._category = cat.category_name;
            flatProjects.push(proj);
        });
    });

    currentFilteredProjects = [...flatProjects];
    drawProjectGrid(currentFilteredProjects);
}

function drawProjectGrid(projects) {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';

    projects.forEach((proj, idx) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-card-inner">
                <div class="project-thumbnail">
                    <img src="${proj.thumbnail || './assets/source.png'}" alt="${proj.name}" loading="lazy" onerror="handleImgErr(this)">
                </div>
                <div class="project-card-content">
                    <div class="project-card-cat">${proj._category}</div>
                    <h3 class="project-card-title">${proj.name}</h3>
                    <span class="micro-label">Khám phá <span class="project-card-arrow">→</span></span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => openModal(idx, projects));
        grid.appendChild(card);
    });
}

function initProjectFiltering() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filterVal = e.target.dataset.filter;
            if (filterVal === 'All') {
                currentFilteredProjects = [...flatProjects];
            } else {
                currentFilteredProjects = flatProjects.filter(p => p._category === filterVal);
            }
            const grid = document.getElementById('project-grid');
            grid.style.opacity = '0';
            setTimeout(() => {
                drawProjectGrid(currentFilteredProjects);
                grid.style.opacity = '1';
                grid.style.transition = 'opacity 0.3s ease';
            }, 150);
        });
    });
}

const modal = document.getElementById('project-modal');
const closeBtn = document.getElementById('modal-close');
const prevBtn = document.getElementById('modal-prev');
const nextBtn = document.getElementById('modal-next');

// Hàm chuẩn hóa đóng Modal (Chạy được trên mọi dòng máy)
function closeModalNative() {
    if (typeof modal.close === 'function') {
        modal.close();
    } else {
        modal.removeAttribute('open');
        modal.classList.remove('polyfill-open');
    }
}

closeBtn.addEventListener('click', closeModalNative);

modal.addEventListener('click', (e) => {
    const dialogDimensions = modal.getBoundingClientRect();
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        closeModalNative();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentProjectIndex > 0) openModal(currentProjectIndex - 1, currentFilteredProjects);
});

nextBtn.addEventListener('click', () => {
    if (currentProjectIndex < currentFilteredProjects.length - 1) openModal(currentProjectIndex + 1, currentFilteredProjects);
});

function openModal(index, projectList) {
    currentProjectIndex = index;
    const project = projectList[index];

    document.getElementById('modal-category').textContent = project._category;
    document.getElementById('modal-title').textContent = project.name;
    document.getElementById('modal-overview').innerHTML = project.overview;

    const tasksContainer = document.getElementById('modal-tasks');
    if (project.main_tasks && project.main_tasks.length > 0) {
        tasksContainer.innerHTML = project.main_tasks.map(task => `<li>${task}</li>`).join('');
    } else {
        tasksContainer.innerHTML = '';
    }

    const resultContainer = document.getElementById('modal-result');
    if (project.result && project.result.length > 0) {
        resultContainer.innerHTML = project.result.map(res => `<li>${res}</li>`).join('');
    } else {
        resultContainer.innerHTML = '';
    }

    const galleryContainer = document.getElementById('modal-galleries');
    galleryContainer.innerHTML = '';

    const renderImgGrid = (title, images) => {
        if (!images || images.length === 0) return '';
        const imgs = images.map(img => `<img src="${img.image_url}" alt="${img.name}" loading="lazy" onerror="handleImgErr(this)">`).join('');
        return `<h4>${title}</h4><div class="modal-img-grid">${imgs}</div>`;
    };

    galleryContainer.innerHTML += renderImgGrid('Plan / Strategy Images', project.plan_images);
    galleryContainer.innerHTML += renderImgGrid('Product / Execution Images', project.product_images);

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === projectList.length - 1;

    // Hỗ trợ dự phòng (Polyfill) nếu Safari quá cũ không có hàm showModal
    if (typeof modal.showModal === 'function') {
        modal.showModal();
    } else {
        modal.setAttribute('open', '');
        modal.classList.add('polyfill-open');
    }

    modal.querySelector('.modal-body').scrollTop = 0;
}

function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-item');

    const observer = new IntersectionObserver((entries) => {
        let currentId = '';
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                currentId = entry.target.getAttribute('id');
            }
        });

        if(currentId) {
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-target') === currentId) {
                    item.classList.add('active');
                }
            });
        }
    }, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
}

function initThemeSwitcher() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const root = document.documentElement;
    const currentTheme = localStorage.getItem('portfolio-theme') || 'light';

    updateActiveBtn(currentTheme);

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme-val');
            root.setAttribute('data-theme', theme);
            localStorage.setItem('portfolio-theme', theme);
            updateActiveBtn(theme);
        });
    });

    function updateActiveBtn(theme) {
        themeBtns.forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-theme-val') === theme) {
                b.classList.add('active');
            }
        });
    }
}
