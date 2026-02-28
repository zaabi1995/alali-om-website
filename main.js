/* ── Language ─────────────────────────────────────────── */
let currentLang = localStorage.getItem('alali_lang') || 'en';

function applyLanguage(lang) {
    currentLang = lang;
    const html = document.documentElement;

    if (lang === 'ar') {
        html.lang = 'ar';
        html.dir = 'rtl';
        document.body.style.fontFamily = "'Tajawal', sans-serif";
    } else {
        html.lang = 'en';
        html.dir = 'ltr';
        document.body.style.fontFamily = "'Inter', sans-serif";
    }

    // Swap text content
    document.querySelectorAll('[data-en],[data-ar]').forEach(el => {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return;
        const txt = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        if (txt !== null) el.innerHTML = txt;
    });

    // Swap placeholders
    document.querySelectorAll('[data-en-placeholder],[data-ar-placeholder]').forEach(el => {
        const ph = lang === 'ar' ? el.getAttribute('data-ar-placeholder') : el.getAttribute('data-en-placeholder');
        if (ph) el.placeholder = ph;
    });

    // Swap select options
    document.querySelectorAll('option[data-en],option[data-ar]').forEach(opt => {
        const txt = lang === 'ar' ? opt.getAttribute('data-ar') : opt.getAttribute('data-en');
        if (txt !== null) opt.textContent = txt;
    });

    // Language label buttons
    const lbl  = document.getElementById('lang-label');
    const lblM = document.getElementById('lang-label-mobile');
    if (lbl)  lbl.textContent  = lang === 'ar' ? 'English' : 'العربية';
    if (lblM) lblM.textContent = lang === 'ar' ? 'EN' : 'AR';

    localStorage.setItem('alali_lang', lang);
}

function toggleLanguage() {
    applyLanguage(currentLang === 'en' ? 'ar' : 'en');
}

/* ── Mobile menu ─────────────────────────────────────── */
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('open');
}
function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.remove('open');
}

/* ── Scroll effects ──────────────────────────────────── */
const isHomePage = document.body.classList.contains('page-home');

window.addEventListener('scroll', function () {
    const navbar   = document.getElementById('navbar');
    const scrollBtn = document.getElementById('scroll-top');

    // Transparent → solid only on home page; inner pages are always solid
    if (navbar && isHomePage) {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    if (scrollBtn) {
        if (window.scrollY > 400) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    }
}, { passive: true });

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Fade-in on scroll ───────────────────────────────── */
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ── Toast ───────────────────────────────────────────── */
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ── Contact form — AJAX submission ──────────────────── */
function submitContactForm(e) {
    e.preventDefault();

    const nameEl    = document.getElementById('form-name');
    const emailEl   = document.getElementById('form-email');
    const phoneEl   = document.getElementById('form-phone');
    const subjectEl = document.getElementById('form-subject');
    const messageEl = document.getElementById('form-message');
    const honeypotEl = document.getElementById('form-honeypot');
    const submitBtn  = document.getElementById('form-submit');

    if (!nameEl || !emailEl || !subjectEl || !messageEl) return;

    const name    = nameEl.value.trim();
    const email   = emailEl.value.trim();
    const phone   = phoneEl ? phoneEl.value.trim() : '';
    const subject = subjectEl.value;
    const message = messageEl.value.trim();

    if (!name || !email || !subject || !message) {
        const msg = currentLang === 'ar'
            ? 'يرجى ملء جميع الحقول المطلوبة.'
            : 'Please fill in all required fields.';
        showToast(msg);
        return;
    }

    // Set loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span data-en="Sending..." data-ar="جارٍ الإرسال...">Sending...</span>';
    }

    fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            email,
            phone,
            subject,
            message,
            honeypot: honeypotEl ? honeypotEl.value : ''
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // Show success state
            const formEl = document.getElementById('contact-form');
            if (formEl) {
                formEl.innerHTML = `
                  <div class="text-center py-10">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                         style="background:rgba(45,159,93,.15)">
                      <i class="fa-solid fa-check text-2xl" style="color:#2D9F5D"></i>
                    </div>
                    <h4 class="text-xl font-bold text-primary mb-2"
                        data-en="Message Sent!" data-ar="تم الإرسال بنجاح!">Message Sent!</h4>
                    <p class="text-gray-500 text-sm"
                       data-en="Thank you for reaching out. We will get back to you as soon as possible."
                       data-ar="شكراً للتواصل معنا. سنرد عليك في أقرب وقت ممكن.">
                      Thank you for reaching out. We will get back to you as soon as possible.
                    </p>
                  </div>`;
                applyLanguage(currentLang);
            }
        } else {
            const msg = currentLang === 'ar'
                ? (data.error || 'حدث خطأ. يرجى المحاولة مرة أخرى.')
                : (data.error || 'Something went wrong. Please try again.');
            showToast(msg);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span data-en="Send Message" data-ar="إرسال الرسالة">Send Message</span>';
                applyLanguage(currentLang);
            }
        }
    })
    .catch(() => {
        const msg = currentLang === 'ar'
            ? 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
            : 'Connection error. Please try again.';
        showToast(msg);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span data-en="Send Message" data-ar="إرسال الرسالة">Send Message</span>';
            applyLanguage(currentLang);
        }
    });
}

/* ── Loading screen ──────────────────────────────────── */
window.addEventListener('load', function () {
    const ls = document.getElementById('loading-screen');
    if (!ls) return;
    setTimeout(() => {
        ls.style.opacity = '0';
        setTimeout(() => ls.remove(), 500);
    }, 900);
});

/* ── Mobile dropdown toggle ──────────────────────────── */
function toggleMobileDropdown(btn) {
    const menu = btn.nextElementSibling;
    const chevron = btn.querySelector('.fa-chevron-down');
    const isOpen = menu && menu.classList.contains('open');
    // Close all other open dropdowns
    document.querySelectorAll('.mobile-dropdown-menu.open').forEach(m => {
        m.classList.remove('open');
        const c = m.previousElementSibling && m.previousElementSibling.querySelector('.fa-chevron-down');
        if (c) c.classList.remove('rotated');
    });
    if (!isOpen && menu) {
        menu.classList.add('open');
        if (chevron) chevron.classList.add('rotated');
    }
}

/* ── Desktop dropdown (hover + click) ────────────────── */
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    let closeTimer = null;

    dropdowns.forEach(dd => {
        const toggle = dd.querySelector('.dropdown-toggle');
        if (!toggle) return;

        // Open on hover (desktop)
        dd.addEventListener('mouseenter', () => {
            if (window.innerWidth < 768) return;
            clearTimeout(closeTimer);
            // Close other dropdowns
            dropdowns.forEach(d => { if (d !== dd) d.classList.remove('open'); });
            dd.classList.add('open');
        });

        dd.addEventListener('mouseleave', () => {
            if (window.innerWidth < 768) return;
            closeTimer = setTimeout(() => dd.classList.remove('open'), 150);
        });
    });

    // Close all dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            dropdowns.forEach(d => d.classList.remove('open'));
        }
    });
}

/* ── Init ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    initDropdowns();
});
