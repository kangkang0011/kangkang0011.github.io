/* ============================================
   河南科技大学 - 交互脚本 (Enhanced)
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
    initNavScroll();
    initMobileMenu();
    initActiveNav();
    initScrollReveal();
    initCountUp();
    initBackToTop();
    initSmoothScroll();
});

function initNavScroll() {
    const header = document.querySelector(".header");
    window.addEventListener("scroll", () => {
        header.classList.toggle("scrolled", window.scrollY > 50);
    });
}

function initMobileMenu() {
    const toggle = document.getElementById("nav-toggle");
    const menu = document.querySelector(".nav__menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
        menu.classList.toggle("open");
        toggle.classList.toggle("active");
    });
    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menu.classList.remove("open");
            toggle.classList.remove("active");
        });
    });
}

function initActiveNav() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav__link");
    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 120) {
                current = section.getAttribute("id");
            }
        });
        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + current) {
                link.classList.add("active");
            }
        });
    });
}

function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        ".academic-card, .campus-card, .timeline__item, .stat, .faculty-stat, .faculty__detail-card, .research-card, .video-card, .intl-card, .alumni-card, .contact__item"
    );
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }, index * 60);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    revealElements.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.6s ease";
        observer.observe(el);
    });
}

function initCountUp() {
    const stats = document.querySelectorAll(".stat__number[data-target]");
    if (!stats.length) return;
    let counted = false;

    function animateCount(el) {
        const target = parseInt(el.getAttribute("data-target"));
        const duration = 2000;
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = Math.floor(eased * target);
            el.textContent = target >= 1000 ? val.toLocaleString() : val;
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target >= 1000 ? target.toLocaleString() : target;
        }
        requestAnimationFrame(update);
    }

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !counted) {
            counted = true;
            stats.forEach(animateCount);
            observer.disconnect();
        }
    }, { threshold: 0.5 });

    observer.observe(stats[0].closest(".about__stats") || stats[0]);
}

function initBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", () => {
        btn.classList.toggle("visible", window.scrollY > 500);
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            const targetId = this.getAttribute("href");
            if (targetId === "#") return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - 80, behavior: "smooth" });
            }
        });
    });
}
