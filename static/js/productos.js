// ============================================
// ARCHIVO: productos.js
// DESCRIPCIÓN: Lógica para la página de productos
// FUNCIONALIDADES: Carga productos, filtros, búsqueda, cards con WhatsApp
// ============================================

// ========================
// CONFIGURACIÓN
// ========================
const CONFIG = {
    JSON_URL: './data/products_joyeria.json',  // Ruta al JSON de productos
    IMAGE_BASE_PATH: '/archivos/imagenes/',  // Ruta base de imágenes
    WHATSAPP_NUMBER: '59175833235',          // Número de WhatsApp
    PRODUCTS_PER_PAGE: 12,                   // Productos por página
    CATEGORY_NAMES: {
        'anillos': 'Anillos',
        'collares': 'Collares',
        'pulseras': 'Pulseras',
        'aros': 'Aros',
        'relojes': 'Relojes',
        'piercings': 'Piercings'
    }
};

// ========================
// ESTADO DE LA APLICACIÓN
// ========================
let estado = {
    productos: [],
    productosFiltrados: [],
    categoriaActiva: 'all',
    busquedaTexto: '',
    paginaActual: 1,
    cargando: true
};

// ========================
// ELEMENTOS DEL DOM
// ========================
const elementos = {
    productsGrid: document.getElementById('productsGrid'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    noResultsState: document.getElementById('noResultsState'),
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    searchResultsCount: document.getElementById('searchResultsCount'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),
    categoryFilters: document.querySelectorAll('.category-filter'),
    noStockModal: document.getElementById('noStockModal'),
    noStockCategory: document.getElementById('noStockCategory'),
    noStockMessage: document.getElementById('noStockMessage'),
    viewOtherCategories: document.getElementById('viewOtherCategories'),
    goToHome: document.getElementById('goToHome')
};

// ========================
// FUNCIÓN PRINCIPAL
// ========================
async function inicializarProductos() {
    try {
        // 1. Obtener parámetros de la URL
        obtenerParametrosURL();
        
        // 2. Cargar productos
        await cargarProductos();
        
        // 3. Configurar eventos
        configurarEventos();
        
        // 4. Renderizar productos
        renderizarProductos();
        
        // 5. Verificar si hay stock en categoría específica
        verificarStockCategoria();
        
    } catch (error) {
        console.error('Error al inicializar productos:', error);
        mostrarError();
    }
}

// ========================
// CARGAR PRODUCTOS
// ========================
async function cargarProductos() {
    try {
        estado.cargando = true;
        actualizarEstadoCarga(true);
        
        const respuesta = await fetch(CONFIG.JSON_URL);
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        
        if (!Array.isArray(datos)) {
            throw new Error('El formato del JSON no es válido');
        }
        
        // Filtrar productos sin imagen o sin nombre
        estado.productos = datos.filter(producto => 
            producto.imagen && producto.nombre && producto.categoria
        );
        
        console.log(`✅ ${estado.productos.length} productos cargados`);
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        
        // Intentar cargar desde localStorage como fallback
        const productosLocal = localStorage.getItem('productos_joyeria_avril');
        if (productosLocal) {
            const datos = JSON.parse(productosLocal);
            estado.productos = datos.map(p => ({
                id: p.id,
                nombre: p.nombre,
                categoria: p.categoria,
                descripcion: p.descripcion,
                imagen: p.imagen, // Solo nombre del archivo
                whatsapp: CONFIG.WHATSAPP_NUMBER,
                fecha: p.fecha
            }));
            console.log(`⚠️ ${estado.productos.length} productos cargados desde localStorage`);
        } else {
            throw error;
        }
    } finally {
        estado.cargando = false;
        actualizarEstadoCarga(false);
    }
}

// ========================
// FILTRAR PRODUCTOS
// ========================
function filtrarProductos() {
    let filtrados = [...estado.productos];
    
    // Filtrar por categoría
    if (estado.categoriaActiva !== 'all') {
        filtrados = filtrados.filter(producto => 
            producto.categoria === estado.categoriaActiva
        );
    }
    
    // Filtrar por búsqueda
    if (estado.busquedaTexto.trim() !== '') {
        const busqueda = estado.busquedaTexto.toLowerCase().trim();
        filtrados = filtrados.filter(producto => 
            producto.nombre.toLowerCase().includes(busqueda) ||
            producto.descripcion.toLowerCase().includes(busqueda) ||
            producto.categoria.toLowerCase().includes(busqueda)
        );
    }
    
    estado.productosFiltrados = filtrados;
    estado.paginaActual = 1; // Resetear a primera página
    
    // Actualizar contador de resultados
    actualizarContadorResultados();
}

// ========================
// RENDERIZAR PRODUCTOS
// ========================
function renderizarProductos() {
    filtrarProductos();
    
    // Verificar si hay productos
    if (estado.productosFiltrados.length === 0) {
        mostrarEstadoVacio();
        return;
    }
    
    // Calcular productos para la página actual
    const inicio = (estado.paginaActual - 1) * CONFIG.PRODUCTS_PER_PAGE;
    const fin = inicio + CONFIG.PRODUCTS_PER_PAGE;
    const productosPagina = estado.productosFiltrados.slice(inicio, fin);
    
    // Limpiar grid
    elementos.productsGrid.innerHTML = '';
    
    // Crear cards
    productosPagina.forEach(producto => {
        const card = crearCardProducto(producto);
        elementos.productsGrid.appendChild(card);
    });
    
    // Mostrar paginación si es necesario
    actualizarPaginacion();
    
    // Ocultar estados vacíos
    elementos.emptyState.style.display = 'none';
    elementos.noResultsState.style.display = 'none';
    elementos.productsGrid.style.display = 'grid';
}

// ========================
// CREAR CARD DE PRODUCTO
// ========================
// ========================
// CREAR CARD DE PRODUCTO (MODIFICADA - SIN ÍCONO EN EL TEXTO)
// ========================
function crearCardProducto(producto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Obtener nombre de categoría amigable
    const categoriaNombre = CONFIG.CATEGORY_NAMES[producto.categoria] || producto.categoria;
    
    // Construir ruta completa de la imagen
    const imagenSrc = producto.imagen.startsWith('http') 
        ? producto.imagen 
        : CONFIG.IMAGE_BASE_PATH + producto.imagen;
    
    // Crear mensaje para WhatsApp
    const mensajeWhatsApp = encodeURIComponent(
        `Hola, me interesa el producto: ${producto.nombre}\n\n` +
        `Descripción: ${producto.descripcion}\n\n` +
        `Categoría: ${categoriaNombre}\n\n` +
        `¿Podrías darme más información sobre disponibilidad y precio?`
    );
    
    // Estructura de la card - MODIFICADA: Sin ícono en el texto
    card.innerHTML = `
        <div class="product-image">
            <img src="${imagenSrc}" 
                 alt="${producto.nombre}" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x250/764ba2/ffffff?text=Imagen+no+disponible'">
            <span class="product-category-badge">${categoriaNombre}</span>
        </div>
        
        <div class="product-content">
            <h3 class="product-title">${producto.nombre}</h3>
            <p class="product-description">${producto.descripcion}</p>
            
            <div class="product-price-info">
                <p class="product-price-text">
                    Consultar precio por WhatsApp
                </p>
            </div>
            
            <div class="product-actions">
                <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${mensajeWhatsApp}" 
                   class="btn-whatsapp-full" 
                   target="_blank">
                    <i class="fab fa-whatsapp"></i>
                    Consultar Producto
                </a>
            </div>
        </div>
    `;
    
    return card;
}

// ========================
// PAGINACIÓN
// ========================
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(estado.productosFiltrados.length / CONFIG.PRODUCTS_PER_PAGE);
    
    if (totalPaginas > 1) {
        elementos.pagination.style.display = 'flex';
        elementos.pageInfo.textContent = `Página ${estado.paginaActual} de ${totalPaginas}`;
        
        // Habilitar/deshabilitar botones
        elementos.prevPage.disabled = estado.paginaActual === 1;
        elementos.nextPage.disabled = estado.paginaActual === totalPaginas;
    } else {
        elementos.pagination.style.display = 'none';
    }
}

// ========================
// MANEJADORES DE EVENTOS
// ========================
function configurarEventos() {
    // Búsqueda
    elementos.searchInput.addEventListener('input', function(e) {
        estado.busquedaTexto = e.target.value;
        elementos.clearSearch.style.display = estado.busquedaTexto ? 'block' : 'none';
        renderizarProductos();
    });
    
    // Limpiar búsqueda
    elementos.clearSearch.addEventListener('click', function() {
        elementos.searchInput.value = '';
        estado.busquedaTexto = '';
        elementos.clearSearch.style.display = 'none';
        renderizarProductos();
    });
    
    // Filtros de categoría
    elementos.categoryFilters.forEach(button => {
        button.addEventListener('click', function() {
            // Remover activo de todos
            elementos.categoryFilters.forEach(btn => btn.classList.remove('active'));
            
            // Activar el clickeado
            this.classList.add('active');
            
            // Actualizar categoría activa
            estado.categoriaActiva = this.dataset.category;
            
            // Actualizar URL
            actualizarURL();
            
            // Renderizar productos
            renderizarProductos();
        });
    });
    
    // Paginación
    elementos.prevPage.addEventListener('click', function() {
        if (estado.paginaActual > 1) {
            estado.paginaActual--;
            renderizarProductos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    elementos.nextPage.addEventListener('click', function() {
        const totalPaginas = Math.ceil(estado.productosFiltrados.length / CONFIG.PRODUCTS_PER_PAGE);
        if (estado.paginaActual < totalPaginas) {
            estado.paginaActual++;
            renderizarProductos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Limpiar filtros
    elementos.clearFiltersBtn.addEventListener('click', function() {
        elementos.searchInput.value = '';
        estado.busquedaTexto = '';
        estado.categoriaActiva = 'all';
        
        // Activar botón "Todos"
        elementos.categoryFilters.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === 'all') {
                btn.classList.add('active');
            }
        });
        
        elementos.clearSearch.style.display = 'none';
        renderizarProductos();
    });
    
    // Modal sin stock
    if (elementos.viewOtherCategories) {
        elementos.viewOtherCategories.addEventListener('click', function() {
            elementos.noStockModal.style.display = 'none';
            estado.categoriaActiva = 'all';
            elementos.categoryFilters.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === 'all') {
                    btn.classList.add('active');
                }
            });
            actualizarURL();
            renderizarProductos();
        });
    }
    
    if (elementos.goToHome) {
        elementos.goToHome.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && elementos.noStockModal.style.display === 'flex') {
            elementos.noStockModal.style.display = 'none';
        }
    });
    
    // Cerrar modal haciendo clic fuera
    elementos.noStockModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
}

// ========================
// MANEJO DE URL
// ========================
function obtenerParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('cat');
    
    if (categoria && CONFIG.CATEGORY_NAMES[categoria]) {
        estado.categoriaActiva = categoria;
        
        // Activar botón correspondiente
        elementos.categoryFilters.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === categoria) {
                btn.classList.add('active');
            }
        });
    }
}

function actualizarURL() {
    const params = new URLSearchParams();
    
    if (estado.categoriaActiva !== 'all') {
        params.set('cat', estado.categoriaActiva);
    }
    
    const nuevaURL = params.toString() 
        ? `productos.html?${params.toString()}`
        : 'productos.html';
    
    // Actualizar URL sin recargar
    window.history.replaceState({}, '', nuevaURL);
}

// ========================
// VERIFICAR STOCK EN CATEGORÍA
// ========================
function verificarStockCategoria() {
    if (estado.categoriaActiva !== 'all') {
        const productosEnCategoria = estado.productos.filter(p => p.categoria === estado.categoriaActiva);
        
        if (productosEnCategoria.length === 0) {
            mostrarModalSinStock(estado.categoriaActiva);
        }
    }
}

function mostrarModalSinStock(categoria) {
    const categoriaNombre = CONFIG.CATEGORY_NAMES[categoria] || categoria;
    
    elementos.noStockCategory.textContent = categoriaNombre;
    elementos.noStockMessage.textContent = `Actualmente no tenemos productos disponibles en la categoría ${categoriaNombre}.`;
    
    // Cambiar fondo según categoría
    const coloresCategorias = {
        'anillos': '#764ba2',
        'collares': '#667eea',
        'pulseras': '#f8c8dc',
        'aros': '#ff9966',
        'relojes': '#3399ff',
        'piercings': '#ff66b2'
    };
    
    const icono = elementos.noStockModal.querySelector('.no-stock-icon i');
    if (icono) {
        icono.style.color = coloresCategorias[categoria] || '#764ba2';
    }
    
    elementos.noStockModal.style.display = 'flex';
}

// ========================
// MANEJO DE ESTADOS
// ========================
function mostrarEstadoVacio() {
    if (estado.busquedaTexto || estado.categoriaActiva !== 'all') {
        // No hay resultados con los filtros actuales
        elementos.noResultsState.style.display = 'block';
        elementos.emptyState.style.display = 'none';
    } else {
        // No hay productos en absoluto
        elementos.emptyState.style.display = 'block';
        elementos.noResultsState.style.display = 'none';
    }
    
    elementos.productsGrid.style.display = 'none';
    elementos.pagination.style.display = 'none';
}

function actualizarEstadoCarga(cargando) {
    elementos.loadingState.style.display = cargando ? 'block' : 'none';
    elementos.productsGrid.style.display = cargando ? 'none' : 'grid';
}

function actualizarContadorResultados() {
    const total = estado.productosFiltrados.length;
    
    if (estado.busquedaTexto) {
        elementos.searchResultsCount.textContent = `${total} resultado${total !== 1 ? 's' : ''} para "${estado.busquedaTexto}"`;
    } else if (estado.categoriaActiva !== 'all') {
        const catNombre = CONFIG.CATEGORY_NAMES[estado.categoriaActiva] || estado.categoriaActiva;
        elementos.searchResultsCount.textContent = `${total} producto${total !== 1 ? 's' : ''} en ${catNombre}`;
    } else {
        elementos.searchResultsCount.textContent = `${total} producto${total !== 1 ? 's' : ''} en total`;
    }
}

function mostrarError() {
    elementos.loadingState.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar productos</h3>
            <p>No pudimos cargar la colección. Por favor, intenta de nuevo.</p>
            <button onclick="location.reload()" class="btn-primary">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

// ========================
// INICIALIZACIÓN
// ========================
document.addEventListener('DOMContentLoaded', inicializarProductos);

// ========================
// CONSOLA DE BIENVENIDA
// ========================
console.log(`
╔══════════════════════════════════════════╗
║     🛍️  Joyería Avril - Productos       ║
║     Versión: 1.0.0                       ║
║     Estado: Sistema de productos cargado ║
║     Configuración:                       ║
║     • JSON: ${CONFIG.JSON_URL}           ║
║     • Imágenes: ${CONFIG.IMAGE_BASE_PATH}║
║     • WhatsApp: ${CONFIG.WHATSAPP_NUMBER}║
╚══════════════════════════════════════════╝
`);
