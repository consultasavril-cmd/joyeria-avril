// ============================================
// ARCHIVO: main.js
// DESCRIPCIÓN: Funcionalidades básicas para Joyería Avril
// FUNCIONALIDADES: Menú móvil y eventos básicos
// ============================================

// ========================
// VARIABLES GLOBALES
// ========================
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.querySelector('.nav-menu');

// ========================
// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
// ========================
function inicializarAplicacion() {
    // 1. Configurar menú móvil
    configurarMenuMovil();
    
    // 2. Configurar eventos adicionales
    configurarEventosAdicionales();
    
    // 3. Cualquier otra inicialización necesaria
    console.log('✅ Joyería Avril - Aplicación inicializada');
}

// ========================
// CONFIGURAR MENÚ MÓVIL
// ========================
function configurarMenuMovil() {
    if (!menuToggle || !navMenu) {
        console.warn('⚠️ Elementos del menú no encontrados');
        return;
    }
    
    // Toggle del menú al hacer clic en el botón hamburguesa
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.innerHTML = navMenu.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Cerrar menú al hacer clic en cualquier enlace
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', (event) => {
        const isClickInsideMenu = navMenu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnToggle && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}

// ========================
// CONFIGURAR EVENTOS ADICIONALES
// ========================
function configurarEventosAdicionales() {
    // 1. Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Ajustar por header fijo
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 2. Animación de scroll en hero
    const heroScroll = document.querySelector('.hero-scroll');
    if (heroScroll) {
        heroScroll.addEventListener('click', () => {
            const categoriesSection = document.querySelector('.categories');
            if (categoriesSection) {
                window.scrollTo({
                    top: categoriesSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // 3. Tooltips para botones de WhatsApp
    const whatsappBtns = document.querySelectorAll('.whatsapp-btn, .floating-whatsapp');
    whatsappBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            // Podríamos agregar tooltips dinámicos aquí si es necesario
        });
    });
    
    // 4. Prevenir envío de formularios (si hay alguno)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Formulario prevenido - página estática');
        });
    });
}

// ========================
// FUNCIONES DE UTILIDAD
// ========================
function esMovil() {
    return window.innerWidth <= 768;
}

function recargarPagina() {
    window.location.reload();
}

// ========================
// MANEJADORES DE ERRORES
// ========================
window.addEventListener('error', function(e) {
    console.error('❌ Error capturado:', e.message);
});

// ========================
// INICIALIZACIÓN AL CARGAR EL DOM
// ========================
document.addEventListener('DOMContentLoaded', inicializarAplicacion);

// ========================
// MANEJAR CAMBIOS DE TAMAÑO DE VENTANA
// ========================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Cerrar menú móvil al cambiar a desktop
        if (window.innerWidth > 768 && navMenu) {
            navMenu.classList.remove('active');
            if (menuToggle) {
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    }, 250);
});

// ========================
// EXPORTAR FUNCIONES (si se necesitan globalmente)
// ========================
// Esto permite llamar a las funciones desde la consola del navegador si es necesario
if (typeof window !== 'undefined') {
    window.JoyeriaAvril = {
        recargarPagina,
        esMovil,
        inicializarAplicacion
    };
}

// ========================
// CONSOLA DE BIENVENIDA
// ========================
console.log(`
╔══════════════════════════════════════╗
║      🛍️  Joyería Avril              ║
║      Versión: 1.0.0                 ║
║      Estado: Página estática        ║
║      Cargada correctamente ✅        ║
╚══════════════════════════════════════╝
`);