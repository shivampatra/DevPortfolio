/**
 * Skills progress bar animations
 */
document.addEventListener('DOMContentLoaded', function() {
    // Detect when skills section is in viewport
    const skillsSection = document.getElementById('skills');
    if (!skillsSection) return;
    
    const progressBars = document.querySelectorAll('.progress-bar');
    let animated = false;
    
    // IntersectionObserver to detect when skills section enters viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animateProgressBars();
                animated = true;
            }
        });
    }, { threshold: 0.2 });
    
    observer.observe(skillsSection);
    
    // Animate all progress bars when skills section is visible
    function animateProgressBars() {
        progressBars.forEach((progressBar, index) => {
            const progressValue = progressBar.getAttribute('data-progress');
            
            // Stagger animations
            setTimeout(() => {
                progressBar.style.width = progressValue + '%';
                
                // Add counting animation to skill percentage text
                const percentageSpan = progressBar.closest('.skill-item').querySelector('.skill-percentage');
                animateCounter(percentageSpan, progressValue);
            }, index * 100);
        });
    }
    
    // Counter animation for skill percentages
    function animateCounter(element, target) {
        const duration = 1500;
        const start = 0;
        const increment = 1;
        const stepTime = Math.abs(Math.floor(duration / (target - start)));
        
        let current = start;
        
        const counter = setInterval(function() {
            current += increment;
            element.textContent = current + '%';
            
            if (current >= target) {
                element.textContent = target + '%';
                clearInterval(counter);
            }
        }, stepTime);
    }
    
    // Reset animations on window resize
    let resizeTimer;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Reset progress bars
            progressBars.forEach(progressBar => {
                progressBar.style.transition = 'none';
                progressBar.style.width = '0%';
            });
            
            // Reset animation flag
            animated = false;
            
            // Force re-check if skills section is visible
            observer.disconnect();
            setTimeout(() => {
                observer.observe(skillsSection);
            }, 100);
            
            // Restore transitions
            setTimeout(() => {
                progressBars.forEach(progressBar => {
                    progressBar.style.transition = 'width 1s ease-in-out';
                });
            }, 50);
        }, 250);
    });
    
    // Extra animation for skill category headers
    const skillCategories = document.querySelectorAll('.category-title');
    
    skillCategories.forEach(category => {
        category.addEventListener('mouseenter', function() {
            this.classList.add('pulse-animation');
        });
        
        category.addEventListener('mouseleave', function() {
            this.classList.remove('pulse-animation');
        });
    });
    
    // Add hover effect to skill items
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const progressBar = this.querySelector('.progress-bar');
            progressBar.style.opacity = '0.9';
            progressBar.style.boxShadow = '0 0 10px rgba(var(--bs-primary-rgb), 0.7)';
        });
        
        item.addEventListener('mouseleave', function() {
            const progressBar = this.querySelector('.progress-bar');
            progressBar.style.opacity = '1';
            progressBar.style.boxShadow = 'none';
        });
    });
});