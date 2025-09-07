document.addEventListener('DOMContentLoaded', () => {

    // --- Utility Functions ---
    const debounce = (func, delay = 250) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // --- Mobile Menu Toggle ---
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

    if (mobileMenuToggle && mobileNav && mobileMenuClose) {
        const toggleMenu = () => {
            const isExpanded = mobileNav.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', String(isExpanded));
        };

        mobileMenuToggle.addEventListener('click', toggleMenu);
        mobileMenuClose.addEventListener('click', toggleMenu);

        // Close menu when a link is clicked
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileNav.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
    }

    // --- Generic Slider Function ---
    const initializeSlider = (carouselSelector, config) => {
        const carousel = document.querySelector(carouselSelector);
        if (!carousel) return;
 
        const container = carousel.querySelector(config.container);
        let slides = Array.from(carousel.querySelectorAll(config.slides));
        const dotsContainer = carousel.querySelector(config.dotsContainer);
        const prevBtn = carousel.querySelector(config.prevBtn);
        const nextBtn = carousel.querySelector(config.nextBtn);
 
        if (!container || slides.length === 0) return;
 
        let currentIndex = 1; // Start at the first "real" slide
        let isDragging = false;
        let startPos = 0;
        let currentDrag = 0;
        let autoSlideInterval;
        let currentSlidesPerView = config.slidesPerView || 1;
 
        // --- Infinite Loop Setup ---
        const slideCount = slides.length;
        const firstClone = slides[0].cloneNode(true);
        const lastClone = slides[slideCount - 1].cloneNode(true);
        container.appendChild(firstClone);
        container.insertBefore(lastClone, slides[0]);
        slides = Array.from(carousel.querySelectorAll(config.slides)); // Re-query all slides including clones
 
        const updateResponsiveSettings = () => {
            let newSlidesPerView = config.slidesPerView || 1;
            if (config.responsive) {
                const sortedBreakpoints = Object.keys(config.responsive).sort((a, b) => parseInt(b) - parseInt(a));
                const activeBreakpoint = sortedBreakpoints.find(bp => window.innerWidth >= parseInt(bp, 10));
                if (activeBreakpoint) {
                    newSlidesPerView = config.responsive[activeBreakpoint].slidesPerView;
                }
            }
            currentSlidesPerView = newSlidesPerView;
        };
 
        if (dotsContainer && config.generateDots) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < slideCount; i++) {
                const dot = document.createElement('button');
                dot.classList.add(config.dotClass);
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => goToSlide(i + 1));
                dotsContainer.appendChild(dot);
            }
        }
        const dots = dotsContainer ? Array.from(dotsContainer.children) : [];
 
        const setPosition = (withTransition = true) => {
            // Using a refined cubic-bezier for a smoother, more professional animation
            container.style.transition = withTransition ? `transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)` : 'none';
            // Correctly calculate slide width based on the container and slidesPerView
            const slideWidth = container.clientWidth / currentSlidesPerView;
            container.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        };
 
        const goToSlide = (index) => {
            currentIndex = index;
            setPosition();
            updateControls();
        };
 
        const updateControls = () => {
            if (dots.length > 0) {
                let dotIndex = currentIndex - 1;
                if (dotIndex >= slideCount) dotIndex = 0;
                if (dotIndex < 0) dotIndex = slideCount - 1;
                dots.forEach((dot, i) => dot.classList.toggle('active', i === dotIndex));
            }
        };
 
        const handleTransitionEnd = () => {
            if (currentIndex === 0) { // If we are at the clone of the last slide
                currentIndex = slideCount;
                setPosition(false);
            } else if (currentIndex === slideCount + 1) { // If we are at the clone of the first slide
                currentIndex = 1;
                setPosition(false);
            }
        };
 
        const startAutoSlide = () => {
            if (!config.autoPlay) return;
            stopAutoSlide();
            autoSlideInterval = setInterval(() => goToSlide(currentIndex + 1), config.autoPlay);
        };
 

        const stopAutoSlide = () => clearInterval(autoSlideInterval);
 
        const dragStart = (e) => {
            isDragging = true;
            startPos = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            container.style.cursor = 'grabbing';
            stopAutoSlide();
            container.style.transition = 'none';
 
            document.addEventListener('mousemove', dragging);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchmove', dragging, { passive: false });
            document.addEventListener('touchend', dragEnd);
        };
 
        const dragging = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            currentDrag = currentPosition - startPos;
            const slideWidth = slides[0].getBoundingClientRect().width;
            container.style.transform = `translateX(${-currentIndex * slideWidth + currentDrag}px)`;
        };
 
        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
 
            document.removeEventListener('mousemove', dragging);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchmove', dragging);
            document.removeEventListener('touchend', dragEnd);
 
            container.style.cursor = 'grab';
 
            const dragThreshold = slides[0].clientWidth / 4;
            if (Math.abs(currentDrag) > dragThreshold) {
                goToSlide(currentIndex + (currentDrag < 0 ? 1 : -1));
            } else {
                goToSlide(currentIndex);
            }
 
            currentDrag = 0;
            startAutoSlide();
        };
 
        // Event Listeners
        if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
 
        container.addEventListener('transitionend', handleTransitionEnd);
        container.addEventListener('mousedown', dragStart);
        container.addEventListener('touchstart', dragStart, { passive: true });
 
        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);
 
        window.addEventListener('resize', debounce(() => {
            updateResponsiveSettings();
            setPosition(false);
        }));
 
        // Initial setup
        updateResponsiveSettings();
        setPosition(false);
        updateControls();
        startAutoSlide();
    };

    // --- Initialize Testimonial Slider ---
    initializeSlider('.testimonials-carousel', {
        container: '.testimonials-container',
        slides: '.testimonial-slide',
        prevBtn: '#testimonialPrev',
        nextBtn: '#testimonialNext',
        dotsContainer: '.testimonial-controls',
        dotClass: 'testimonial-dot',
        generateDots: true,
        slidesPerView: 1, // Default view for mobile
        responsive: { // A cleaner, more balanced responsive layout
            // At 992px screen width or more (larger tablets/desktops), show 2 testimonials
            992: { slidesPerView: 2 },
            // At 1400px screen width or more (large desktops), show 3 testimonials
            1400: { slidesPerView: 3 }
        }
    });

    // --- Initialize Gallery Slider ---
    // Now uses the new 'responsive' option to change slide count on different screen sizes.
    initializeSlider('.gallery-carousel', {
        container: '.gallery-track',
        slides: '.gallery-slide',
        prevBtn: '#galleryPrev',
        nextBtn: '#galleryNext',
        dotsContainer: '#galleryControls',
        dotClass: 'gallery-dot',
        generateDots: true,
        loop: true,
        autoPlay: 5000,
        slidesPerView: 1, // Default view for mobile
        responsive: {
            // At 768px screen width or more, show 2 slides
            768: { slidesPerView: 2 },
            // At 1024px screen width or more, show 3 slides
            1024: { slidesPerView: 3 }
        }
    });

    // --- Scroll Effects (Header & Scroll-to-Top) ---
    const header = document.querySelector('.header');
    const scrollToTopBtn = document.querySelector('.scroll-to-top');

    const handleScroll = () => {
        const scrollY = window.scrollY;
        if (header) {
            header.classList.toggle('scrolled', scrollY > 50);
        }
        if (scrollToTopBtn) {
            scrollToTopBtn.classList.toggle('visible', scrollY > 300);
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
