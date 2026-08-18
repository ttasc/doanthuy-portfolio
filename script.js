// script.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Fetch data.json trực tiếp
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error("Không thể tải file dữ liệu.");
        const data = await response.json();

        // 2. SUCKLESS LOGIC: Hàm đệ quy chuẩn hóa đường dẫn ảnh ngay trên Client
        // Đổi toàn bộ "/assets/..." thành "./assets/..." để web không bị lỗi 404
        const fixImagePaths = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    // Regex: Nếu chuỗi bắt đầu bằng "/assets/" hoặc "assets/" thì đổi thành "./assets/"
                    // Nếu đã là "./assets/" hoặc "http..." thì bỏ qua (giữ nguyên).
                    if (/^\/?assets\//.test(obj[key])) {
                        obj[key] = obj[key].replace(/^\/?assets\//, './assets/');
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    fixImagePaths(obj[key]);
                }
            }
        };
        fixImagePaths(data);

        // Gán vào window để các hàm cũ phía dưới vẫn hoạt động bình thường
        window.portfolioData = data;

        // 3. DOM Elements Cache
        const currentYear = document.getElementById('current-year');
        if(currentYear) currentYear.textContent = new Date().getFullYear();

        // 4. Khởi tạo các hàm Render (Giữ nguyên y hệt source cũ của bạn)
        renderHero(data.personal_info, data.about_me);
        renderAbout(data.about_me);
        renderSkills(data.professional_skills);
        renderProjects(data.featured_projects);
        renderEducation(data.education);
        renderContact(data.personal_info.contact);

        // 5. Khởi tạo logic UI
        initScrollSpy();
        initProjectFiltering(data.featured_projects);

        // 6. Khởi tạo Theme Switcher
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

    // Lấy câu đầu tiên trong working style làm positioning statement
    const positioning = about.working_style[0].description;
    document.getElementById('hero-positioning').textContent = positioning;

    // Contact ở Nav
    const navContact = document.getElementById('nav-contact');
    navContact.innerHTML = `
        <p>${info.contact.email}</p>
        <p>${info.contact.phone}</p>
    `;
}

function renderAbout(about) {
    // Overview
    const overviewHtml = about.experience_overview.map(p => `<p>${p}</p>`).join('');
    document.getElementById('about-overview').innerHTML = overviewHtml;

    // Working Style
    const styleHtml = about.working_style.map(style => `
        <div class="working-style-item">
            <h4 class="working-style-title">${style.title}</h4>
            <p>${style.description}</p>
        </div>
    `).join('');
    document.getElementById('working-style-list').innerHTML = styleHtml;

    // Goals
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

        // 1. Tạo mục lục ở Hero
        const indexLi = document.createElement('li');
        indexLi.className = 'index-item';
        indexLi.innerHTML = `
            <a href="#${skillId}">
                <span class="index-num">${num}</span>
                <span class="index-name">${skill.category}</span>
            </a>
        `;
        indexList.appendChild(indexLi);

        // 2. Tạo phần Detail
        const descriptions = skill.descriptions.map(desc => `<li>${desc}</li>`).join('');

        let portfoliosHtml = '';
        if (skill.portfolios && skill.portfolios.length > 0) {
            portfoliosHtml = skill.portfolios.map(group => {
                const itemsHtml = group.items.map(item => `
                    <a href="${item.link !== 'https://linktosource' ? item.link : '#'}" class="portfolio-item" target="_blank" rel="noopener">
                        <img src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 400 300\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23eee\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' fill=\\'%23999\\'>No Image</text></svg>'">
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
    // Render Social Links
    let socialHtml = contact.social_links.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener">${link.platform} ↗</a><br>
    `).join('');

    // Thiết kế phần Contact dạng Editorial với Email cực lớn
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
   PROJECT LOGIC & DIALOG (MODAL)
   ========================================================================== */

let flatProjects = [];
let currentFilteredProjects = [];
let currentProjectIndex = 0;

function renderProjects(categories) {
    const filterContainer = document.getElementById('project-filters');

    // Nút "Tất cả"
    filterContainer.innerHTML = `<button class="filter-btn active" data-filter="All">All Projects</button>`;

    // Flatten data & tạo nút filter
    categories.forEach(cat => {
        // Render filter buttons
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = cat.category_name;
        btn.textContent = cat.category_name;
        filterContainer.appendChild(btn);

        // Add category info to items and push to flat array
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
        // Thiết kế lại cấu trúc Card: Tách inner thành 2 phần Left (Thumbnail) và Right (Content)
        card.innerHTML = `
            <div class="project-card-inner">
                <div class="project-thumbnail">
                    <img src="${proj.thumbnail || './assets/source.png'}" alt="${proj.name}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 400 300\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23eee\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' fill=\\'%23999\\'>No Image</text></svg>'">
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
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filterVal = e.target.dataset.filter;
            if (filterVal === 'All') {
                currentFilteredProjects = [...flatProjects];
            } else {
                currentFilteredProjects = flatProjects.filter(p => p._category === filterVal);
            }
            // Add subtle fade effect
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

// Modal Logic
const modal = document.getElementById('project-modal');
const closeBtn = document.getElementById('modal-close');
const prevBtn = document.getElementById('modal-prev');
const nextBtn = document.getElementById('modal-next');

closeBtn.addEventListener('click', () => modal.close());

// Đóng modal khi click ra ngoài backdrop
modal.addEventListener('click', (e) => {
    const dialogDimensions = modal.getBoundingClientRect();
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        modal.close();
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

    // Meta data (Main tasks)
    const tasksContainer = document.getElementById('modal-tasks');
    if (project.main_tasks && project.main_tasks.length > 0) {
        tasksContainer.innerHTML = project.main_tasks.map(task => `<li>${task}</li>`).join('');
    } else {
        tasksContainer.innerHTML = '';
    }

    // Impact (Result)
    const resultContainer = document.getElementById('modal-result');
    if (project.result && project.result.length > 0) {
        resultContainer.innerHTML = project.result.map(res => `<li>${res}</li>`).join('');
    } else {
        resultContainer.innerHTML = '';
    }

    // Galleries (Xử lý khi mảng rỗng)
    const galleryContainer = document.getElementById('modal-galleries');
    galleryContainer.innerHTML = '';

    const renderImgGrid = (title, images) => {
        if (!images || images.length === 0) return '';
        const imgs = images.map(img => `<img src="${img.image_url}" alt="${img.name}" loading="lazy">`).join('');
        return `<h4>${title}</h4><div class="modal-img-grid">${imgs}</div>`;
    };

    galleryContainer.innerHTML += renderImgGrid('Plan / Strategy Images', project.plan_images);
    galleryContainer.innerHTML += renderImgGrid('Product / Execution Images', project.product_images);

    // Update nút điều hướng
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === projectList.length - 1;

    modal.showModal();
    // Scroll content modal lên top
    modal.querySelector('.modal-body').scrollTop = 0;
}

/* ==========================================================================
   SCROLL SPY LOGIC (Highlight menu khi cuộn)
   ========================================================================== */
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
        rootMargin: '-20% 0px -70% 0px', // Trigger vùng giữa màn hình
        threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
}

/* ==========================================================================
   THEME SWITCHER LOGIC
   ========================================================================== */
function initThemeSwitcher() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const root = document.documentElement;
    // Bắt fallback lại light (nếu người dùng chưa từng chọn)
    const currentTheme = localStorage.getItem('portfolio-theme') || 'light';

    // Cập nhật trạng thái active ngay lập tức
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
