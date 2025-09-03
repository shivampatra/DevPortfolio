/**
 * Main JavaScript file for the portfolio website
 */
document.addEventListener('DOMContentLoaded', function() {
    // Preloader handling
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', function() {
        setTimeout(function() {
            preloader.classList.add('fade-out');
            setTimeout(function() {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    });

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-bs-theme', savedTheme);
    }
    
    themeToggle.addEventListener('click', function() {
        if (htmlElement.getAttribute('data-bs-theme') === 'dark') {
            htmlElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Back to top button
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
    });

    // Active navigation link highlighting
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavLink() {
        const scrollPosition = window.pageYOffset + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavLink);
    
    // Initialize animations
    initializeAnimations();
});

// Initialize animations
function initializeAnimations() {
    // Animate on scroll
    const animatedElements = document.querySelectorAll('.animate__animated');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const animationClass = entry.target.classList.contains('animate__fadeInUp') ? 'animate__fadeInUp' : 'animate__fadeIn';
                entry.target.classList.add(animationClass);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // Project card hover effects
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.querySelector('.project-overlay').style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', function() {
            this.querySelector('.project-overlay').style.opacity = '0';
        });
    });
    
    // Tech item hover effects
    const techItems = document.querySelectorAll('.tech-item');
    
    techItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.classList.add('tech-hover');
        });
        
        item.addEventListener('mouseleave', function() {
            this.classList.remove('tech-hover');
        });
    });
}