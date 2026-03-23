document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for Animations
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once shown
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => observer.observe(el));

    // 2. Navigation Active Link Update
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 3. Navbar Sticky Effect
    const navbar = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.style.padding = "1rem 10%";
            navbar.style.background = "rgba(5, 7, 10, 0.9)";
        } else {
            navbar.classList.remove('scrolled');
            navbar.style.padding = "1.5rem 10%";
            navbar.style.background = "rgba(5, 7, 10, 0.7)";
        }
    });

    // 4. Form Submission Mocking
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalContent = btn.innerHTML;
            
            btn.innerHTML = 'Sending... <i data-lucide="loader-2" class="animate-spin"></i>';
            lucide.createIcons();

            setTimeout(() => {
                btn.innerHTML = 'Sent Successfully! <i data-lucide="check-circle-2"></i>';
                btn.style.background = 'var(--accent-blue)';
                lucide.createIcons();
                contactForm.reset();

                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.background = 'var(--grad-primary)';
                    lucide.createIcons();
                }, 3000);
            }, 1500);
        });
    }

    // 5. Initialize Lucide Icons (already done in HTML but good practice to call again if dynamic elements exist)
    lucide.createIcons();
});
