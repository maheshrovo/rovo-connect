/* ============================================
   ROVO AUTOMATION - PRESENTATION SCRIPT
   Interactive Navigation & Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
    // State
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const progressBar = document.getElementById('progressBar');
    const slideCounter = document.getElementById('slideCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const keyboardHints = document.getElementById('keyboardHints');

    // Initialize
    updateSlide();
    startCounterAnimations();

    // Navigation Functions
    function goToSlide(index) {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;

        // Remove active class from current slide
        slides[currentSlide].classList.remove('active');
        slides[currentSlide].classList.add('prev');

        // Update current slide
        currentSlide = index;

        // Add active class to new slide
        setTimeout(() => {
            slides.forEach(slide => slide.classList.remove('prev'));
            slides[currentSlide].classList.add('active');
        }, 50);

        updateSlide();
        triggerSlideAnimations();
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }

    function updateSlide() {
        // Update progress bar
        const progress = ((currentSlide + 1) / totalSlides) * 100;
        progressBar.style.width = progress + '%';

        // Update counter
        slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;

        // Update navigation buttons
        prevBtn.style.opacity = currentSlide === 0 ? '0.3' : '1';
        prevBtn.style.pointerEvents = currentSlide === 0 ? 'none' : 'auto';
        nextBtn.style.opacity = currentSlide === totalSlides - 1 ? '0.3' : '1';
        nextBtn.style.pointerEvents = currentSlide === totalSlides - 1 ? 'none' : 'auto';
    }

    // Trigger animations when slide becomes active
    function triggerSlideAnimations() {
        const activeSlide = slides[currentSlide];
        const animatedElements = activeSlide.querySelectorAll('.animate-in');

        animatedElements.forEach((el, index) => {
            el.style.animation = 'none';
            el.offsetHeight; // Trigger reflow
            el.style.animation = null;
        });

        // Trigger counter animations for this slide
        const counters = activeSlide.querySelectorAll('.counter');
        counters.forEach(counter => animateCounter(counter));
    }

    // Counter Animation
    function animateCounter(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);

            counter.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    function startCounterAnimations() {
        // Start counters on first slide
        const firstSlide = slides[0];
        const counters = firstSlide.querySelectorAll('.counter');
        counters.forEach(counter => animateCounter(counter));
    }

    // Keyboard Navigation
    document.addEventListener('keydown', function (e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'Enter':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(totalSlides - 1);
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'h':
            case 'H':
                toggleHints();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                break;
        }
    });

    // Button Navigation
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Touch/Swipe Navigation
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left = next
            } else {
                prevSlide(); // Swipe right = prev
            }
        }
    }

    // Click navigation (click right side for next, left side for prev)
    document.addEventListener('click', function (e) {
        // Ignore clicks on buttons and interactive elements
        if (e.target.closest('.nav-btn, .product-card, a, button')) {
            return;
        }

        const clickX = e.clientX;
        const windowWidth = window.innerWidth;

        if (clickX > windowWidth * 0.7) {
            nextSlide();
        } else if (clickX < windowWidth * 0.3) {
            prevSlide();
        }
    });

    // Fullscreen Toggle
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Toggle Keyboard Hints
    function toggleHints() {
        keyboardHints.style.display = keyboardHints.style.display === 'none' ? 'flex' : 'none';
    }

    // Mouse wheel navigation
    let wheelDebounce = false;
    document.addEventListener('wheel', function (e) {
        if (wheelDebounce) return;

        wheelDebounce = true;
        setTimeout(() => wheelDebounce = false, 800);

        if (e.deltaY > 0) {
            nextSlide();
        } else {
            prevSlide();
        }
    }, { passive: true });

    // Product card flip functionality is handled via CSS and onclick in HTML

    // Preload animations
    window.addEventListener('load', function () {
        document.body.classList.add('loaded');
        triggerSlideAnimations();
    });

    // Add slide number indicators (optional feature)
    function createSlideIndicators() {
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'slide-indicators';
        indicatorContainer.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1000;
        `;

        for (let i = 0; i < totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'slide-indicator';
            indicator.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.3);
                background: ${i === 0 ? 'var(--accent-blue)' : 'transparent'};
                cursor: pointer;
                transition: all 0.3s ease;
                padding: 0;
            `;
            indicator.addEventListener('click', () => goToSlide(i));
            indicator.addEventListener('mouseenter', () => {
                indicator.style.transform = 'scale(1.5)';
            });
            indicator.addEventListener('mouseleave', () => {
                indicator.style.transform = 'scale(1)';
            });
            indicatorContainer.appendChild(indicator);
        }

        document.body.appendChild(indicatorContainer);

        // Update indicators on slide change
        const originalGoToSlide = goToSlide;
        goToSlide = function (index) {
            originalGoToSlide(index);
            updateIndicators();
        };

        function updateIndicators() {
            const indicators = indicatorContainer.querySelectorAll('.slide-indicator');
            indicators.forEach((ind, i) => {
                ind.style.background = i === currentSlide ? 'var(--accent-blue)' : 'transparent';
                ind.style.borderColor = i === currentSlide ? 'var(--accent-blue)' : 'rgba(255,255,255,0.3)';
            });
        }
    }

    createSlideIndicators();

    // Auto-play functionality (optional)
    let autoPlayInterval = null;
    let isAutoPlaying = false;

    function toggleAutoPlay() {
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            isAutoPlaying = false;
        } else {
            autoPlayInterval = setInterval(() => {
                if (currentSlide < totalSlides - 1) {
                    nextSlide();
                } else {
                    goToSlide(0);
                }
            }, 8000); // 8 seconds per slide
            isAutoPlaying = true;
        }
    }

    // Press 'A' to toggle autoplay
    document.addEventListener('keydown', function (e) {
        if (e.key === 'a' || e.key === 'A') {
            toggleAutoPlay();
        }
    });

    // Expose functions globally for debugging
    window.presentationAPI = {
        goToSlide,
        nextSlide,
        prevSlide,
        toggleFullscreen,
        toggleAutoPlay,
        getCurrentSlide: () => currentSlide,
        getTotalSlides: () => totalSlides
    };

    console.log('%c🚀 Rovo Automation Presentation Loaded', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
    console.log('%cNavigation: Arrow keys, Space, Click, Scroll, Swipe', 'color: #94a3b8;');
    console.log('%cF = Fullscreen | H = Hide hints | A = Autoplay', 'color: #94a3b8;');
});
