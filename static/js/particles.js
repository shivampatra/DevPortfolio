/**
 * Three.js particles background for hero section
 */
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    // Init Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        alpha: true,
        antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    
    const positionArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);
    
    // Set colors based on theme
    const isDarkTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const baseColor = isDarkTheme ? 0.5 : 0.7;
    
    for (let i = 0; i < particlesCount * 3; i++) {
        // Positions
        positionArray[i] = (Math.random() - 0.5) * 10;
        
        // Colors - slightly varied based on theme
        colorArray[i] = baseColor + Math.random() * 0.3;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    // Material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.8
    });
    
    // Points
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Set camera position
    camera.position.z = 3;
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;
    
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate);
        
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
        
        particles.rotation.x += 0.001;
        particles.rotation.y += 0.001;
        
        particles.rotation.x += (targetY - particles.rotation.x) * 0.05;
        particles.rotation.y += (targetX - particles.rotation.y) * 0.05;
        
        renderer.render(scene, camera);
    };
    
    animate();

    // Theme change handling
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
            const baseColor = isDark ? 0.5 : 0.7;
            
            // Update particle colors
            for (let i = 0; i < particlesCount * 3; i++) {
                colorArray[i] = baseColor + Math.random() * 0.3;
            }
            
            particlesGeometry.attributes.color.needsUpdate = true;
        });
    }
});