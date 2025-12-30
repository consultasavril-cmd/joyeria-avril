// ============================================
// ARCHIVO: scripts.js - CORREGIDO
// DESCRIPCIÓN: Funcionalidades para Joyería Avril
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Inicializando Joyería Avril');
    
    // Inicializar todas las funcionalidades
    inicializarMenuMovil();
    inicializarScrollSuave();
    inicializarHeroScroll();
});

// ========================
// 1. MENÚ MÓVIL - VERSIÓN SIMPLIFICADA Y CORREGIDA
// ========================
function inicializarMenuMovil() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // Verificar que existan los elementos
    if (!menuToggle || !navMenu) {
        console.error('❌ ERROR: No se encontraron los elementos del menú');
        return;
    }
    
    console.log('✅ Elementos del menú encontrados');
    
    // Evento para abrir/cerrar menú
    menuToggle.addEventListener('click', function(event) {
        event.stopPropagation(); // Importante: evitar que el clic se propague
        
        // Alternar clase 'active' en el menú
        navMenu.classList.toggle('active');
        
        // Cambiar ícono
        if (navMenu.classList.contains('active')) {
            menuToggle.innerHTML = '<i class="fas fa-times"></i>';
            console.log('📱 Menú ABIERTO');
        } else {
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            console.log('📱 Menú CERRADO');
        }
    });
    
    // Cerrar menú al hacer clic en enlaces
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                console.log('📱 Menú cerrado por clic en enlace');
            }
        });
    });
    
    // Cerrar menú al hacer clic fuera (opcional pero recomendado)
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navMenu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnToggle && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Cerrar menú al cambiar a desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}

// ========================
// 2. SCROLL SUAVE PARA ENLACES INTERNOS
// ========================
function inicializarScrollSuave() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(event) {
            const targetId = this.getAttribute('href');
            
            // Si es solo '#', no hacer nada
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                event.preventDefault();
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Ajustar por header fijo
                    behavior: 'smooth'
                });
                
                console.log(`🔍 Scroll a: ${targetId}`);
            }
        });
    });
}

// ========================
// 3. SCROLL EN HERO
// ========================
function inicializarHeroScroll() {
    const heroScroll = document.querySelector('.hero-scroll');
    
    if (heroScroll) {
        heroScroll.addEventListener('click', function() {
            const categoriesSection = document.querySelector('.categories');
            
            if (categoriesSection) {
                window.scrollTo({
                    top: categoriesSection.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                console.log('🔍 Scroll a sección de categorías');
            }
        });
    }
}

// ========================
// FUNCIÓN DE DEPURACIÓN
// ========================
function depurarMenu() {
    console.log('🔍 DEPURACIÓN DEL MENÚ:');
    console.log('menuToggle:', document.getElementById('menuToggle'));
    console.log('navMenu:', document.querySelector('.nav-menu'));
    console.log('Clase de navMenu:', document.querySelector('.nav-menu').className);
    console.log('Ancho de ventana:', window.innerWidth);
}

// Hacer disponible para depuración en consola
window.depurarMenu = depurarMenu;

// ========================
// MENSAJE DE CONSOLA
// ========================
console.log(`
╔══════════════════════════════════════╗
║      🛍️  Joyería Avril              ║
║      Script: scripts.js             ║
║      Menú móvil: ACTIVADO ✅        ║
║      Scroll suave: ACTIVADO ✅      ║
╚══════════════════════════════════════╝
`);
