// /**
//  * Skills progress bar animations
//  */
// document.addEventListener('DOMContentLoaded', function() {
//     // Detect when skills section is in viewport
//     const skillsSection = document.getElementById('skills');
//     if (!skillsSection) return;
    
//     const progressBars = document.querySelectorAll('.progress-bar');
//     let animated = false;
    
//     // IntersectionObserver to detect when skills section enters viewport
//     const observer = new IntersectionObserver((entries) => {
//         entries.forEach(entry => {
//             if (entry.isIntersecting && !animated) {
//                 animateProgressBars();
//                 animated = true;
//             }
//         });
//     }, { threshold: 0.2 });
    
//     observer.observe(skillsSection);
    
//     // Animate all progress bars when skills section is visible
//     function animateProgressBars() {
//         progressBars.forEach((progressBar, index) => {
//             const progressValue = progressBar.getAttribute('data-progress');
            
//             // Stagger animations
//             setTimeout(() => {
//                 progressBar.style.width = progressValue + '%';
                
//                 // Add counting animation to skill percentage text
//                 const percentageSpan = progressBar.closest('.skill-item').querySelector('.skill-percentage');
//                 animateCounter(percentageSpan, progressValue);
//             }, index * 100);
//         });
//     }
    
//     // Counter animation for skill percentages
//     function animateCounter(element, target) {
//         const duration = 1500;
//         const start = 0;
//         const increment = 1;
//         const stepTime = Math.abs(Math.floor(duration / (target - start)));
        
//         let current = start;
        
//         const counter = setInterval(function() {
//             current += increment;
//             element.textContent = current + '%';
            
//             if (current >= target) {
//                 element.textContent = target + '%';
//                 clearInterval(counter);
//             }
//         }, stepTime);
//     }
    
//     // Reset animations on window resize
//     let resizeTimer;
    
//     window.addEventListener('resize', () => {
//         clearTimeout(resizeTimer);
//         resizeTimer = setTimeout(() => {
//             // Reset progress bars
//             progressBars.forEach(progressBar => {
//                 progressBar.style.transition = 'none';
//                 progressBar.style.width = '0%';
//             });
            
//             // Reset animation flag
//             animated = false;
            
//             // Force re-check if skills section is visible
//             observer.disconnect();
//             setTimeout(() => {
//                 observer.observe(skillsSection);
//             }, 100);
            
//             // Restore transitions
//             setTimeout(() => {
//                 progressBars.forEach(progressBar => {
//                     progressBar.style.transition = 'width 1s ease-in-out';
//                 });
//             }, 50);
//         }, 250);
//     });
    
//     // Extra animation for skill category headers
//     const skillCategories = document.querySelectorAll('.category-title');
    
//     skillCategories.forEach(category => {
//         category.addEventListener('mouseenter', function() {
//             this.classList.add('pulse-animation');
//         });
        
//         category.addEventListener('mouseleave', function() {
//             this.classList.remove('pulse-animation');
//         });
//     });
    
//     // Add hover effect to skill items
//     const skillItems = document.querySelectorAll('.skill-item');
    
//     skillItems.forEach(item => {
//         item.addEventListener('mouseenter', function() {
//             const progressBar = this.querySelector('.progress-bar');
//             progressBar.style.opacity = '0.9';
//             progressBar.style.boxShadow = '0 0 10px rgba(var(--bs-primary-rgb), 0.7)';
//         });
        
//         item.addEventListener('mouseleave', function() {
//             const progressBar = this.querySelector('.progress-bar');
//             progressBar.style.opacity = '1';
//             progressBar.style.boxShadow = 'none';
//         });
//     });
// });



// 2nd VERSION


/**
 * Skills section: fill the bars and count up the percentages once the
 * section scrolls into view. Runs once.
 *
 * Progressive enhancement: without JS (or with reduced motion) the bars
 * simply render at their final values.
 */
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('skills');
    if (!section) return;

    const DURATION = 1200;  // ms, bars and counters share this
    const STAGGER = 90;     // ms between rows within one category

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const clamp = (value) => Math.min(100, Math.max(0, Number.parseFloat(value) || 0));
    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

    // Stagger within each category so both columns fill in parallel
    const rows = [];
    section.querySelectorAll('.skills-category').forEach((category) => {
        category.querySelectorAll('.skill-item').forEach((item, index) => {
            const bar = item.querySelector('.progress-bar');
            const label = item.querySelector('.skill-percentage');
            if (!bar || !label) return;

            item.style.setProperty('--i', index);
            rows.push({
                label,
                target: clamp(bar.dataset.progress),
                delay: index * STAGGER,
            });
        });
    });
    if (!rows.length) return;

    // Hand timing to the stylesheet, then arm the "hidden" state
    section.style.setProperty('--sk-duration', `${DURATION}ms`);
    section.style.setProperty('--sk-stagger', `${STAGGER}ms`);
    rows.forEach(({ label }) => { label.textContent = '0%'; });
    section.classList.add('is-enhanced');

    function countUp({ label, target, delay }) {
        const begin = performance.now() + delay;

        const frame = (now) => {
            const t = Math.min(1, Math.max(0, (now - begin) / DURATION));
            label.textContent = `${Math.round(target * easeOutQuint(t))}%`;
            if (t < 1) requestAnimationFrame(frame);
        };

        requestAnimationFrame(frame);
    }

    function reveal() {
        section.classList.add('is-revealed');
        rows.forEach(countUp);
    }

    if (!('IntersectionObserver' in window)) {
        reveal();
        return;
    }

    // Fire when the section's top edge passes ~85% of the viewport height.
    // (A fixed threshold can never be met if the section is taller than the screen.)
    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            reveal();
            observer.disconnect();
        }
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });

    observer.observe(section);
});
