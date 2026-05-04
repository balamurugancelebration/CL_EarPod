document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------
    // NAVBAR & HAMBURGER LOGIC
    // ----------------------------------
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ----------------------------------
    // FADE-UP ANIMATIONS (Intersection Observer)
    // ----------------------------------
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // ----------------------------------
    // FAQ ACCORDION LOGIC
    // ----------------------------------
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
            // Close others
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item) otherItem.classList.remove('active');
            });
            // Toggle clicked
            item.classList.toggle('active');
        });
    });

    // ----------------------------------
    // CANVAS IMAGE SEQUENCE
    // ----------------------------------
    const canvas = document.getElementById('product-canvas');
    if (!canvas) return; // Guard clause
    const ctx = canvas.getContext('2d', { alpha: false });

    const frameCount = 192;
    const currentFrame = index => `images/frame_${index.toString().padStart(4, '0')}.jpg`;

    const images = [];
    let loadedImages = 0;

    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;

    let targetScrollFraction = 0;
    let currentScrollFraction = 0;
    // High easing tightly binds the frames to the scroll wheel to prevent low-FPS slideshow lag
    const easing = 0.15;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        ctx.scale(dpr, dpr);

        const frameIndex = Math.round(currentScrollFraction * (frameCount - 1));
        lastDrawnFrame = -1; // force redraw on resize
        renderFrame(frameIndex);
    }

    function preloadImages() {
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            images.push(img);

            img.onload = () => {
                loadedImages++;
                if (i === 0) {
                    resizeCanvas();
                    renderFrame(0);
                    setTimeout(() => canvas.classList.add('loaded'), 100);
                }
            };
        }
    }

    let lastDrawnFrame = -1;

    function renderFrame(frameIndex) {
        if (frameIndex === lastDrawnFrame || frameIndex >= frameCount) return; // Stop expensive overdrawing!
        if (!images[frameIndex] || !images[frameIndex].complete) return;

        const img = images[frameIndex];

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const imgAspect = img.width / img.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, drawX, drawY;
        const isMobile = window.innerWidth <= 900;

        // Always use 'contain' logic to ensure the entire product is visible without clipping
        if (canvasAspect > imgAspect) {
            drawHeight = canvasHeight; drawWidth = imgAspect * drawHeight;
            drawX = (canvasWidth - drawWidth) / 2; drawY = 0;
        } else {
            drawWidth = canvasWidth; drawHeight = drawWidth / imgAspect;
            drawX = 0; drawY = (canvasHeight - drawHeight) / 2;
        }

        // Apply scale down effect at the end of the sequence
        const progress = frameIndex / (frameCount - 1);
        let globalScale = 1.5; // 50% zoom in overall

        // Shrink further during the last 20% of frames
        if (progress > 0.8) {
            const shrinkProgress = (progress - 0.8) / 0.2;
            // Reduce scale from 1.5 down to 0.45 (which is below 50% of original size)
            globalScale = 1.5 - (shrinkProgress * 1.05); 
        }

        drawWidth *= globalScale;
        drawHeight *= globalScale;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = (canvasHeight - drawHeight) / 2;

        // Use Math.round to solve sub-pixel aliasing jitter naturally
        ctx.drawImage(img, Math.round(drawX), Math.round(drawY), Math.round(drawWidth), Math.round(drawHeight));
        lastDrawnFrame = frameIndex;

        updateHeroTextLayers(frameIndex);
    }

    const textLayers = [
        document.getElementById('hero-text-1'),
        document.getElementById('hero-text-2'),
        document.getElementById('hero-text-3')
    ];

    function updateHeroTextLayers(frameIndex) {
        // Guard if layers missing
        if (!textLayers[0]) return;

        // Define ranges: Layer 1 (0-50), Layer 2 (50-120), Layer 3 (120-191)
        textLayers.forEach(layer => {
            if (layer) layer.classList.remove('active');
        });

        if (frameIndex < 50) {
            if (textLayers[0]) textLayers[0].classList.add('active');
        } else if (frameIndex >= 45 && frameIndex < 120) {
            if (textLayers[1]) textLayers[1].classList.add('active');
        } else if (frameIndex >= 115) {
            if (textLayers[2]) textLayers[2].classList.add('active');
        }
    }

    function onScroll() {
        const scrollContainer = document.querySelector('.scroll-container');
        if (!scrollContainer) return;

        const maxScroll = scrollContainer.scrollHeight - window.innerHeight;
        targetScrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    }

    function tick() {
        currentScrollFraction += (targetScrollFraction - currentScrollFraction) * easing;
        const frameIndex = Math.round(currentScrollFraction * (frameCount - 1));

        if (loadedImages > 0) {
            renderFrame(frameIndex);
        }
        requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas);

    // Boot sequence
    preloadImages();
    requestAnimationFrame(tick);

    // ----------------------------------
    // RING DOT WAVE SCROLL ANIMATION
    // ----------------------------------
    const rings = document.querySelectorAll('.dotted-ring');
    const ringSection = document.getElementById('ring-wave-container');
    
    if (rings.length > 0 && ringSection) {
        let ringAnimActive = false;
        let ringRafId = null;
        const ringCount = rings.length;

        // Use IntersectionObserver to ONLY run the loop when visible on screen
        const ringObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!ringAnimActive) {
                        ringAnimActive = true;
                        ringRafId = requestAnimationFrame(renderRings);
                    }
                } else {
                    ringAnimActive = false;
                    if (ringRafId) cancelAnimationFrame(ringRafId);
                }
            });
        }, { threshold: 0 });
        ringObserver.observe(ringSection);
        
        function renderRings() {
            if (!ringAnimActive) return;

            // Use raw scrollY directly — NO lerp. Lerp adds perceived lag on mobile.
            const cycle = window.scrollY / 1500;

            for (let index = 0; index < ringCount; index++) {
                const ring = rings[index];
                const offset = index / ringCount;
                
                let progress = (cycle - offset) % 1;
                if (progress < 0) progress += 1;
                
                const scale = progress * 3.5;
                
                let opacity = 0;
                if (progress < 0.1) {
                    opacity = progress / 0.1;
                } else {
                    opacity = 1 - ((progress - 0.1) / 0.9);
                }
                
                const visualThickness = 12 - (progress * 11);
                const actualBorderWidth = visualThickness / Math.max(0.1, scale);
                
                // Batch all style writes in one go
                const t = scale.toFixed(3);
                ring.style.cssText = `transform:scale(${t});border-width:${actualBorderWidth.toFixed(2)}px;opacity:${opacity.toFixed(3)};`;
            }
            
            ringRafId = requestAnimationFrame(renderRings);
        }
    }
});
