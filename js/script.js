let logo = document.querySelector('.logo');

if (logo) {
    logo.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// 1. Mostrar/Ocultar botón de Volver Arriba
const backToTopBtn = document.getElementById('backToTopBtn');

if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 2. Colapsar/Desplegar Menú en Móviles
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarContent = document.getElementById('sidebarContent');

if (mobileMenuBtn && sidebarContent) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebarContent.classList.toggle('expanded');
        if (sidebarContent.classList.contains('expanded')) {
            mobileMenuBtn.innerText = 'Ocultar Índice Temático';
        } else {
            mobileMenuBtn.innerText = 'Ver Índice Temático';
        }
    });

    // Cerrar el menú automáticamente al hacer clic en un enlace si estamos en móvil
    const sidebarLinks = sidebarContent.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                sidebarContent.classList.remove('expanded');
                mobileMenuBtn.innerText = 'Ver Índice Temático';
            }
        });
    });
}

// 3. Resaltar sección activa en el menú lateral
const sections = document.querySelectorAll('.content-section h2, .content-section h3');
const navLinks = document.querySelectorAll('.sidebar-content a');

if (sections.length > 0 && navLinks.length > 0) {
    const observerOptions = {
        root: null,
        rootMargin: '-100px 0px -40% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Quitar activo de todos
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Encontrar el enlace que corresponde al ID del subtópico
                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.sidebar-content a[href="#${id}"]`);
                
                if (activeLink) {
                    activeLink.classList.add('active');
                    // Scroll del sidebar si se sale de la vista
                    const sidebar = document.querySelector('.sidebar');
                    if(sidebar && window.innerWidth > 900) {
                        const linkRect = activeLink.getBoundingClientRect();
                        const sidebarRect = sidebar.getBoundingClientRect();
                        if (linkRect.top < sidebarRect.top || linkRect.bottom > sidebarRect.bottom) {
                            activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        if(section.hasAttribute('id')) {
             sectionObserver.observe(section);
        }
    });
}
