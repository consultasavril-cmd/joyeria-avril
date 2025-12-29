// ========================
// CONFIGURACIÓN
// ========================
const ADMIN_PASSWORD = "avril2024";
const WHATSAPP_NUMBER = "59175833235";
const IMAGE_BASE_PATH = "/archivos/imagenes/";

// DETECTAR RUTA BASE AUTOMÁTICAMENTE
function getBasePath() {
    // Si estamos en GitHub Pages
    if (window.location.hostname.includes('github.io')) {
        return window.location.pathname.split('/').slice(0, -1).join('/') + '/';
    }
    // Si estamos en local
    return '/';
}

// Usar ruta relativa desde la ubicación actual del script
const JSON_REMOTE_URL = "data/products_joyeria.json"; // Ruta relativa desde admin.html

// ========================
// SISTEMA DE LOGIN
// ========================
function verificarPassword() {
    const password = document.getElementById('adminPassword').value;
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    
    if (password === ADMIN_PASSWORD) {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        sessionStorage.setItem('admin_authenticated', 'true');
        inicializarPanel();
    } else {
        mostrarMensaje('❌ Contraseña incorrecta', 'error');
        document.getElementById('adminPassword').value = '';
    }
}

// Verificar si ya está autenticado
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        inicializarPanel();
    }
});

// ========================
// INICIALIZAR PANEL
// ========================
async function inicializarPanel() {
    try {
        console.log("🔄 Inicializando panel admin...");
        // Intentar cargar desde JSON remoto
        const productos = await cargarJSONRemoto();
        console.log("✅ Panel inicializado con", productos.length, "productos");
        configurarFormulario();
    } catch (error) {
        console.log("ℹ️ Trabajando solo con datos locales:", error.message);
        // Si falla, cargar solo locales
        cargarProductosLocales();
        configurarFormulario();
    }
}

// ========================
// CARGAR JSON REMOTO - VERSIÓN MEJORADA
// ========================
async function cargarJSONRemoto() {
    // Probar múltiples rutas posibles
    const rutasPosibles = [
        "data/products_joyeria.json",           // Desde admin.html
        "../data/products_joyeria.json",        // Desde static/js/
        "./data/products_joyeria.json",         // Ruta relativa
        "/data/products_joyeria.json",          // Ruta absoluta
        "https://raw.githubusercontent.com/consultasavril-cmd/joyeria-avril/main/data/productos_joyeria.json" // URL directa GitHub
    ];
    
    let ultimoError = null;
    
    for (const ruta of rutasPosibles) {
        try {
            console.log("📡 Probando ruta:", ruta);
            
            const response = await fetch(ruta + '?nocache=' + new Date().getTime());
            
            console.log("📊 Respuesta HTTP para", ruta + ":", response.status, response.statusText);
            
            if (response.ok) {
                const productosRemotos = await response.json();
                
                if (!Array.isArray(productosRemotos)) {
                    throw new Error("El JSON no contiene un array válido");
                }
                
                console.log(`✅ ${productosRemotos.length} producto(s) cargados desde: ${ruta}`);
                
                // Obtener productos locales actuales
                const productosLocales = obtenerProductosLocales();
                
                // Combinar productos
                const productosCombinados = combinarProductos(productosRemotos, productosLocales);
                
                // Guardar combinación
                guardarProductosLocales(productosCombinados);
                mostrarProductosEnLista(productosCombinados);
                
                // Mostrar mensaje
                mostrarMensaje(
                    `✅ <strong>${productosCombinados.length} productos cargados</strong><br><br>` +
                    `• ${productosRemotos.length} desde el archivo JSON<br>` +
                    `• ${productosLocales.length} locales`,
                    'success',
                    5000
                );
                
                return productosCombinados;
            } else if (response.status !== 404) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            
        } catch (error) {
            console.log(`❌ Error con ruta ${ruta}:`, error.message);
            ultimoError = error;
        }
    }
    
    // Si ninguna ruta funcionó
    console.warn("⚠️ Ninguna ruta funcionó, usando datos locales");
    mostrarMensaje(
        "📝 <strong>No se pudo cargar el archivo JSON</strong><br><br>" +
        "Probé las siguientes rutas:<br>" +
        rutasPosibles.map(r => `<code>${r}</code>`).join('<br>') +
        "<br><br><strong>Posibles soluciones:</strong><br>" +
        "1. Verifica que el archivo existe en <code>data/products_joyeria.json</code><br>" +
        "2. Usa la consola (F12) para ver errores detallados<br>" +
        "3. Agrega productos manualmente y expórtalos",
        'info',
        10000
    );
    
    throw ultimoError || new Error("No se pudo cargar el JSON desde ninguna ruta");
}

// ========================
// COMBINAR PRODUCTOS
// ========================
function combinarProductos(productosRemotos, productosLocales) {
    // Usar un Map para evitar duplicados por ID
    const productosMap = new Map();
    
    // Primero agregar productos remotos
    productosRemotos.forEach(remoto => {
        productosMap.set(remoto.id, {
            ...remoto,
            imagen_local: '' // No tenemos la imagen localmente
        });
    });
    
    // Luego agregar productos locales (sobrescriben si mismo ID)
    productosLocales.forEach(local => {
        productosMap.set(local.id, local);
    });
    
    // Convertir a array y ordenar por ID
    return Array.from(productosMap.values())
        .sort((a, b) => a.id - b.id);
}

// ========================
// GESTIÓN DE PRODUCTOS (LOCAL - TEMPORAL)
// ========================
function obtenerProductosLocales() {
    const productosJSON = localStorage.getItem('productos_joyeria_avril');
    return productosJSON ? JSON.parse(productosJSON) : [];
}

function guardarProductosLocales(productos) {
    localStorage.setItem('productos_joyeria_avril', JSON.stringify(productos));
    actualizarContadores(productos.length);
    return productos;
}

function cargarProductosLocales() {
    const productos = obtenerProductosLocales();
    actualizarContadores(productos.length);
    mostrarProductosEnLista(productos);
    return productos;
}

// ========================
// CONFIGURAR FORMULARIO
// ========================
function configurarFormulario() {
    const form = document.getElementById('productForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        agregarProducto();
    });
    
    const nombreInput = document.getElementById('productName');
    nombreInput.addEventListener('input', verificarNombreDuplicado);
}

// ========================
// VERIFICAR NOMBRE DUPLICADO
// ========================
function verificarNombreDuplicado() {
    const nombreInput = document.getElementById('productName');
    const nombre = nombreInput.value.trim();
    
    if (!nombre) return;
    
    const productos = obtenerProductosLocales();
    const nombreDuplicado = productos.some(producto => 
        producto.nombre.toLowerCase() === nombre.toLowerCase()
    );
    
    if (nombreDuplicado) {
        nombreInput.style.borderColor = '#e74c3c';
        nombreInput.style.backgroundColor = '#ffeaea';
        mostrarSugerenciasNombres(nombre, productos);
    } else {
        nombreInput.style.borderColor = '#ddd';
        nombreInput.style.backgroundColor = '';
        ocultarSugerencias();
    }
}

function mostrarSugerenciasNombres(nombre, productos) {
    ocultarSugerencias();
    
    const nombresSimilares = productos
        .filter(producto => 
            producto.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
            nombre.toLowerCase().includes(producto.nombre.toLowerCase())
        )
        .map(producto => producto.nombre)
        .slice(0, 3);
    
    if (nombresSimilares.length === 0) return;
    
    const sugerenciasContainer = document.createElement('div');
    sugerenciasContainer.id = 'sugerenciasNombres';
    sugerenciasContainer.className = 'sugerencias-nombres';
    sugerenciasContainer.innerHTML = `
        <div class="sugerencias-header">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Nombre similar encontrado</strong>
        </div>
        <div class="sugerencias-lista">
            <p>Nombres similares ya existentes:</p>
            <ul>
                ${nombresSimilares.map(nombre => `<li>${nombre}</li>`).join('')}
            </ul>
            <p class="sugerencias-ayuda">Sugerencia: Agrega detalles únicos como "con diamantes", "plateado", "oro 18k", etc.</p>
        </div>
    `;
    
    document.getElementById('productName').parentNode.appendChild(sugerenciasContainer);
}

function ocultarSugerencias() {
    const sugerencias = document.getElementById('sugerenciasNombres');
    if (sugerencias) {
        sugerencias.remove();
    }
}

// ========================
// GENERAR NOMBRE DE ARCHIVO ÚNICO
// ========================
function generarNombreArchivoUnico(nombreOriginal, productos) {
    const partes = nombreOriginal.split('.');
    let nombreBase = partes.slice(0, -1).join('.');
    let extension = partes[partes.length - 1].toLowerCase();
    
    nombreBase = nombreBase
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s.-]/gi, '')
        .replace(/\s+/g, '-');
    
    const extensionesValidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (!extensionesValidas.includes(extension)) {
        extension = 'jpg';
    }
    
    let nombreFinal = `${nombreBase}.${extension}`;
    let contador = 1;
    
    while (productos.some(p => p.imagen === nombreFinal)) {
        nombreFinal = `${nombreBase}-${contador}.${extension}`;
        contador++;
    }
    
    return nombreFinal;
}

// ========================
// AGREGAR PRODUCTO
// ========================
async function agregarProducto() {
    const nombre = document.getElementById('productName').value.trim();
    const categoria = document.getElementById('productCategory').value;
    const descripcion = document.getElementById('productDescription').value.trim();
    const imagenFile = document.getElementById('imageUpload').files[0];
    
    // VALIDACIONES
    if (!nombre) {
        mostrarMensaje('❌ Ingresa el nombre del producto', 'error');
        return;
    }
    
    if (!categoria) {
        mostrarMensaje('❌ Selecciona una categoría', 'error');
        return;
    }
    
    if (!descripcion) {
        mostrarMensaje('❌ Ingresa una descripción', 'error');
        return;
    }
    
    if (descripcion.length > 150) {
        mostrarMensaje('❌ La descripción no debe superar 150 caracteres', 'error');
        return;
    }
    
    if (!imagenFile) {
        mostrarMensaje('❌ Debes seleccionar una imagen desde tu computadora', 'error');
        return;
    }
    
    const productos = obtenerProductosLocales();
    const nombreExactoDuplicado = productos.some(producto => 
        producto.nombre.toLowerCase() === nombre.toLowerCase()
    );
    
    if (nombreExactoDuplicado) {
        mostrarMensaje('❌ Ya existe un producto con este nombre exacto. Usa un nombre diferente.', 'error');
        return;
    }
    
    if (imagenFile.size > 5 * 1024 * 1024) {
        mostrarMensaje('❌ La imagen es demasiado grande. Máximo 5MB.', 'error');
        return;
    }
    
    const nombreArchivoOriginal = imagenFile.name;
    const nombreArchivoUnico = generarNombreArchivoUnico(nombreArchivoOriginal, productos);
    
    // Convertir imagen a Base64 para vista previa local
    let imagenPreview = '';
    try {
        imagenPreview = await convertirArchivoABase64(imagenFile);
    } catch (error) {
        mostrarMensaje('❌ Error al procesar la imagen: ' + error.message, 'error');
        return;
    }
    
    // Generar nuevo ID (buscar máximo actual + 1)
    const maxId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) : 0;
    const nuevoId = maxId + 1;
    
    const nuevoProducto = {
        id: nuevoId,
        nombre: nombre,
        categoria: categoria,
        descripcion: descripcion,
        imagen_local: imagenPreview,
        imagen: nombreArchivoUnico,
        whatsapp: WHATSAPP_NUMBER,
        fecha: new Date().toISOString().split('T')[0]
    };
    
    productos.push(nuevoProducto);
    guardarProductosLocales(productos);
    mostrarProductosEnLista(productos);
    
    // Limpiar formulario
    document.getElementById('productForm').reset();
    document.getElementById('descCounter').textContent = '0';
    document.getElementById('descCounter').style.color = '#7f8c8d';
    document.getElementById('fileUploadArea').style.display = 'block';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('imageUrl').value = '';
    mostrarPlaceholderVacio();
    ocultarSugerencias();
    
    const mensaje = nombreArchivoUnico === nombreArchivoOriginal
        ? `✅ Producto agregado exitosamente.<br><br>
           <strong>Nombre del archivo:</strong> <code>${nombreArchivoUnico}</code><br><br>
           <strong>Recuerda:</strong> Para publicarlo en la tienda:<br>
           1. Genera el JSON con "Publicar en la Tienda"<br>
           2. Súbelo a GitHub`
        : `✅ Producto agregado exitosamente.<br><br>
           <strong>Archivo guardado como:</strong> <code>${nombreArchivoUnico}</code><br><br>
           <strong>Recuerda:</strong> Para publicarlo en la tienda:<br>
           1. Genera el JSON con "Publicar en la Tienda"<br>
           2. Súbelo a GitHub`;
    
    mostrarMensaje(mensaje, 'success');
}

// ========================
// CONVERTIR ARCHIVO A BASE64
// ========================
function convertirArchivoABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function mostrarPlaceholderVacio() {
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = `
        <div class="empty-preview">
            <i class="far fa-image"></i>
            <p>Se verá la imagen aquí al seleccionar un archivo</p>
        </div>
    `;
}

// ========================
// MOSTRAR PRODUCTOS EN LISTA
// ========================
function mostrarProductosEnLista(productos) {
    const productsList = document.getElementById('productsList');
    
    if (productos.length === 0) {
        productsList.innerHTML = `
            <div class="empty-list">
                <i class="fas fa-box-open"></i>
                <p>No hay productos guardados</p>
                <small>Agrega el primero usando el formulario</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    productos.forEach(producto => {
        const nombresCategorias = {
            'anillos': 'Anillos',
            'collares': 'Collares',
            'pulseras': 'Pulseras',
            'aros': 'Aros',
            'relojes': 'Relojes',
            'piercings': 'Piercings'
        };
        
        const categoriaNombre = nombresCategorias[producto.categoria] || producto.categoria;
        const imagenSrc = producto.imagen_local || 
                         `https://via.placeholder.com/100x100/764ba2/ffffff?text=${encodeURIComponent(producto.nombre.substring(0, 10))}`;
        
        // Determinar si el producto es solo local (tiene imagen_local)
        const esSoloLocal = producto.imagen_local ? true : false;
        
        html += `
            <div class="product-item" data-id="${producto.id}">
                <div class="product-header">
                    <h3>${producto.nombre} ${esSoloLocal ? '<span class="local-badge">(LOCAL)</span>' : ''}</h3>
                    <span class="product-category">${categoriaNombre}</span>
                    <span class="product-date">${producto.fecha}</span>
                </div>
                
                <div class="product-body">
                    <div class="product-image">
                        <img src="${imagenSrc}" alt="${producto.nombre}">
                    </div>
                    
                    <div class="product-info">
                        <p><strong>Categoría:</strong> ${categoriaNombre}</p>
                        <p><strong>Descripción:</strong> ${producto.descripcion.substring(0, 100)}${producto.descripcion.length > 100 ? '...' : ''}</p>
                        <p><strong>Archivo:</strong> <code>${producto.imagen}</code></p>
                        <p><strong>Ruta final:</strong> <small>${IMAGE_BASE_PATH}${producto.imagen}</small></p>
                        ${esSoloLocal ? '<p class="local-warning"><small><i class="fas fa-exclamation-triangle"></i> Solo existe localmente</small></p>' : ''}
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-delete" onclick="eliminarProducto(${producto.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    });
    
    productsList.innerHTML = html;
}

// ========================
// ELIMINAR PRODUCTOS
// ========================
function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?\n\n⚠️ IMPORTANTE: Esto solo lo eliminará localmente. Para eliminarlo completamente, también debes actualizar el archivo JSON en GitHub.')) return;
    
    const productos = obtenerProductosLocales();
    const nuevosProductos = productos.filter(p => p.id !== id);
    
    guardarProductosLocales(nuevosProductos);
    mostrarProductosEnLista(nuevosProductos);
    
    mostrarMensaje(
        '✅ Producto eliminado localmente.<br><br>' +
        '<strong>Recuerda:</strong> Para eliminarlo completamente:<br>' +
        '1. Exporta el JSON actualizado<br>' +
        '2. Súbelo a GitHub reemplazando el archivo existente',
        'success'
    );
}

function limpiarTodo() {
    if (!confirm('⚠️ ¿Estás seguro de eliminar TODOS los productos LOCALMENTE?\n\nEsto no afectará el archivo JSON en GitHub hasta que lo reemplace.')) return;
    
    localStorage.removeItem('productos_joyeria_avril');
    cargarProductosLocales();
    
    mostrarMensaje(
        '✅ Todos los productos locales han sido eliminados.<br><br>' +
        '<strong>Recuerda:</strong> Los productos aún existen en GitHub.<br>' +
        'Para actualizar la tienda, sube un JSON vacío.',
        'success'
    );
}

// ========================
// EXPORTAR A JSON (PARA GITHUB)
// ========================
function exportarJSON() {
    const productos = obtenerProductosLocales();
    
    if (productos.length === 0) {
        mostrarMensaje('❌ No hay productos para exportar', 'error');
        return;
    }
    
    // Preparar productos para exportar (sin imagen_local)
    const productosParaExportar = productos.map(producto => {
        // Crear copia sin imagen_local
        const { imagen_local, ...productoParaExportar } = producto;
        return productoParaExportar;
    });
    
    const jsonStr = JSON.stringify(productosParaExportar, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_joyeria_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const archivosNecesarios = productos.map(p => p.imagen).join('\n• ');
    
    mostrarMensaje(
        `✅ JSON exportado con ${productos.length} productos.<br><br>
        <strong>Instrucciones para publicar:</strong><br>
        1. <strong>Sube este JSON</strong> a: <code>data/products_joyeria.json</code> (REEMPLAZA el existente)<br>
        2. <strong>Sube estas imágenes</strong> a: <code>${IMAGE_BASE_PATH}</code><br><br>
        <strong>Archivos de imagen necesarios (${productos.length}):</strong><br>
        • ${archivosNecesarios}<br><br>
        <strong>IMPORTANTE:</strong> Al reemplazar el JSON, la tienda mostrará SOLO estos productos.`,
        'success'
    );
}

// ========================
// CARGAR DESDE ARCHIVO JSON REMOTO (SINCRONIZACIÓN)
// ========================
async function cargarDesdeArchivo() {
    if (!confirm('⚠️ Esto sincronizará los productos locales con el archivo JSON actual.\n\n¿Deseas continuar?')) return;
    
    try {
        const productosSincronizados = await cargarJSONRemoto();
        
        if (productosSincronizados.length === 0) {
            mostrarMensaje(
                "📝 <strong>No hay productos en el archivo JSON</strong><br><br>" +
                "El archivo está vacío o no existe.<br>" +
                "Agrega productos y expórtalos para crear el archivo.",
                'info'
            );
        } else {
            mostrarMensaje(
                `✅ Sincronización completada.<br><br>
                <strong>Total productos:</strong> ${productosSincronizados.length}<br>
                <strong>Origen:</strong> Archivo JSON + Locales<br><br>
                <strong>Nota:</strong> Exporta el JSON para guardar cambios.`,
                'success',
                5000
            );
        }
        
    } catch (error) {
        console.error('Error al sincronizar:', error);
        mostrarMensaje(
            `❌ Error al sincronizar:<br>${error.message}<br><br>
            Verifica que:<br>
            1. El archivo existe en: <code>data/products_joyeria.json</code><br>
            2. Tienes conexión a internet<br>
            3. El JSON tiene formato válido`,
            'error'
        );
    }
}

// ========================
// FUNCIONES AUXILIARES
// ========================
function actualizarContadores(cantidad) {
    document.getElementById('productCount').textContent = `${cantidad} productos`;
    document.getElementById('totalProducts').textContent = cantidad;
}

function mostrarMensaje(texto, tipo = 'info', autoCerrar = null) {
    const modal = document.getElementById('messageModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    let iconClass = '';
    switch(tipo) {
        case 'success': 
            iconClass = 'fas fa-check-circle success-icon'; 
            modalTitle.textContent = '¡Éxito!'; 
            break;
        case 'error': 
            iconClass = 'fas fa-exclamation-circle error-icon'; 
            modalTitle.textContent = 'Error'; 
            break;
        default: 
            iconClass = 'fas fa-info-circle info-icon'; 
            modalTitle.textContent = 'Información';
    }
    
    modalIcon.className = iconClass;
    modalMessage.innerHTML = texto;
    modal.style.display = 'flex';
    
    // Auto-cierre opcional
    if (autoCerrar) {
        setTimeout(() => {
            if (modal.style.display === 'flex') {
                cerrarModal();
            }
        }, autoCerrar);
    }
}

function cerrarModal() {
    document.getElementById('messageModal').style.display = 'none';
}

// ========================
// DEBUG: Verificar rutas
// ========================
document.addEventListener('DOMContentLoaded', function() {
    // Agregar estilos para el badge local
    const estilos = document.createElement('style');
    estilos.textContent = `
        .local-badge {
            background: #f39c12;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.7em;
            margin-left: 5px;
            vertical-align: middle;
        }
        
        .local-warning {
            color: #e74c3c;
            margin-top: 5px;
            padding: 5px;
            background: #ffeaea;
            border-radius: 3px;
            border-left: 3px solid #e74c3c;
            font-size: 12px;
        }
        
        .local-warning i {
            margin-right: 5px;
        }
        
        .sync-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 10px;
            transition: background 0.3s;
        }
        
        .sync-btn:hover {
            background: #138496;
        }
    `;
    document.head.appendChild(estilos);
    
    // Debug: mostrar información de ruta
    console.log("📍 Ubicación actual:", window.location.href);
    console.log("📁 Ruta del script:", document.currentScript ? document.currentScript.src : "N/A");
    
    // Cambiar botón a sync
    setTimeout(() => {
        const btnLoad = document.querySelector('.btn-load');
        if (btnLoad) {
            btnLoad.classList.add('sync-btn');
            btnLoad.innerHTML = '<i class="fas fa-sync-alt"></i> Sincronizar con JSON';
        }
    }, 100);
});// ========================
// CONFIGURACIÓN DE INTERFAZ
// ========================

// Contador de caracteres para descripción
function configurarContadorCaracteres() {
    const descTextarea = document.getElementById('productDescription');
    if (descTextarea) {
        descTextarea.addEventListener('input', function() {
            const counter = document.getElementById('descCounter');
            counter.textContent = this.value.length;
            
            if (this.value.length > 140) {
                counter.style.color = '#e74c3c';
            } else if (this.value.length > 120) {
                counter.style.color = '#f39c12';
            } else {
                counter.style.color = '#7f8c8d';
            }
        });
    }
}

// Configurar subida de archivos
function configurarSubidaArchivos() {
    const fileUpload = document.getElementById('imageUpload');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInfo = document.getElementById('fileInfo');
    
    if (!fileUpload || !fileUploadArea) return;
    
    // Evento para seleccionar archivo
    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            mostrarInformacionArchivo(file);
            mostrarVistaPreviaArchivo(file);
        }
    });
    
    // Arrastrar y soltar
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.background = '#f0f0f0';
        this.style.borderColor = '#764ba2';
    });
    
    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.background = '';
        this.style.borderColor = '';
    });
    
    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.background = '';
        this.style.borderColor = '';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            fileUpload.files = e.dataTransfer.files;
            mostrarInformacionArchivo(file);
            mostrarVistaPreviaArchivo(file);
        } else {
            alert('Por favor, selecciona solo archivos de imagen (JPG, PNG, GIF)');
        }
    });
}

function mostrarInformacionArchivo(file) {
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInfo = document.getElementById('fileInfo');
    
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    if (fileUploadArea) fileUploadArea.style.display = 'none';
    if (fileInfo) fileInfo.style.display = 'block';
}

function mostrarVistaPreviaArchivo(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewContainer = document.getElementById('previewContainer');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="preview-content">
                    <img src="${e.target.result}" 
                         alt="Vista previa" 
                         class="preview-image">
                    <div class="preview-info">
                        <p><small>${file.name} (${(file.size / 1024).toFixed(0)} KB)</small></p>
                    </div>
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);
}

