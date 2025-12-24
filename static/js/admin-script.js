// ========================
// CONFIGURACIÓN
// ========================
const ADMIN_PASSWORD = "avril2024";
const WHATSAPP_NUMBER = "59175833235";
const IMAGE_BASE_PATH = "/archivos/imagenes/"; // Ruta donde estarán las imágenes en GitHub

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
function inicializarPanel() {
    cargarProductosLocales();
    configurarFormulario();
}

// ========================
// GESTIÓN DE PRODUCTOS (LOCAL)
// ========================
function obtenerProductosLocales() {
    const productosJSON = localStorage.getItem('productos_joyeria_avril');
    return productosJSON ? JSON.parse(productosJSON) : [];
}

function guardarProductosLocales(productos) {
    localStorage.setItem('productos_joyeria_avril', JSON.stringify(productos));
    actualizarContadores(productos.length);
}

function cargarProductosLocales() {
    const productos = obtenerProductosLocales();
    actualizarContadores(productos.length);
    mostrarProductosEnLista(productos);
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
    
    // Verificar nombre duplicado en tiempo real
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
        
        // Mostrar sugerencia de nombres similares
        mostrarSugerenciasNombres(nombre, productos);
    } else {
        nombreInput.style.borderColor = '#ddd';
        nombreInput.style.backgroundColor = '';
        ocultarSugerencias();
    }
}

function mostrarSugerenciasNombres(nombre, productos) {
    ocultarSugerencias();
    
    // Buscar nombres similares
    const nombresSimilares = productos
        .filter(producto => 
            producto.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
            nombre.toLowerCase().includes(producto.nombre.toLowerCase())
        )
        .map(producto => producto.nombre)
        .slice(0, 3); // Mostrar máximo 3 sugerencias
    
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
// VERIFICAR IMAGEN DUPLICADA (por nombre de archivo)
// ========================
async function verificarImagenDuplicada(nombreArchivo, productos) {
    // Verificar si ya existe un producto con el mismo nombre de archivo
    for (const producto of productos) {
        if (producto.imagen === nombreArchivo) {
            return {
                duplicado: true,
                producto: producto,
                tipo: 'archivo_duplicado'
            };
        }
    }
    
    return { duplicado: false };
}

// ========================
// GENERAR NOMBRE DE ARCHIVO ÚNICO (MANTIENE NOMBRE ORIGINAL)
// ========================
function generarNombreArchivoUnico(nombreOriginal, productos) {
    // Obtener nombre base y extensión
    const partes = nombreOriginal.split('.');
    let nombreBase = partes.slice(0, -1).join('.');
    let extension = partes[partes.length - 1].toLowerCase();
    
    // Limpiar nombre base (opcional, para quitar caracteres problemáticos)
    nombreBase = nombreBase
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remover acentos
        .replace(/[^\w\s.-]/gi, '') // Remover caracteres especiales excepto puntos y guiones
        .replace(/\s+/g, '-'); // Reemplazar espacios con guiones
    
    // Verificar extensiones válidas
    const extensionesValidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (!extensionesValidas.includes(extension)) {
        extension = 'jpg'; // Default si extensión no es válida
    }
    
    let nombreFinal = `${nombreBase}.${extension}`;
    let contador = 1;
    
    // Si ya existe, agregar número hasta encontrar nombre único
    while (productos.some(p => p.imagen === nombreFinal)) {
        nombreFinal = `${nombreBase}-${contador}.${extension}`;
        contador++;
    }
    
    return nombreFinal;
}

// ========================
// AGREGAR PRODUCTO (SISTEMA CORREGIDO - MANTIENE NOMBRE ORIGINAL)
// ========================
async function agregarProducto() {
    // Obtener datos del formulario
    const nombre = document.getElementById('productName').value.trim();
    const categoria = document.getElementById('productCategory').value;
    const descripcion = document.getElementById('productDescription').value.trim();
    const imagenFile = document.getElementById('imageUpload').files[0];
    
    // ========================
    // VALIDACIONES
    // ========================
    
    // 1. Validar campos requeridos
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
    
    // 2. Verificar nombre duplicado (exacto)
    const productos = obtenerProductosLocales();
    const nombreExactoDuplicado = productos.some(producto => 
        producto.nombre.toLowerCase() === nombre.toLowerCase()
    );
    
    if (nombreExactoDuplicado) {
        mostrarMensaje('❌ Ya existe un producto con este nombre exacto. Usa un nombre diferente.', 'error');
        return;
    }
    
    // 3. Verificar nombre similar (alerta)
    const nombreSimilarDuplicado = productos.some(producto => 
        producto.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
        nombre.toLowerCase().includes(producto.nombre.toLowerCase())
    );
    
    if (nombreSimilarDuplicado) {
        const confirmar = confirm(`⚠️ Advertencia: Ya existen productos con nombres similares a "${nombre}".\n\n¿Deseas continuar de todos modos?`);
        if (!confirmar) return;
    }
    
    // 4. Validar tamaño de archivo (máximo 5MB)
    if (imagenFile.size > 5 * 1024 * 1024) {
        mostrarMensaje('❌ La imagen es demasiado grande. Máximo 5MB.', 'error');
        return;
    }
    
    // 5. Obtener nombre original del archivo
    const nombreArchivoOriginal = imagenFile.name;
    
    // 6. Generar nombre único (basado en el original)
    const nombreArchivoUnico = generarNombreArchivoUnico(nombreArchivoOriginal, productos);
    
    // 7. Verificar si el nombre de archivo ya existe
    const verificacionImagen = await verificarImagenDuplicada(nombreArchivoUnico, productos);
    if (verificacionImagen.duplicado) {
        const confirmar = confirm(`⚠️ El archivo "${nombreArchivoUnico}" ya existe en el producto: "${verificacionImagen.producto.nombre}".\n\n¿Deseas continuar de todos modos?`);
        if (!confirmar) return;
    }
    
    // ========================
    // CONVERTIR IMAGEN A DATA URL PARA VISTA PREVIA LOCAL
    // ========================
    let imagenPreview = '';
    try {
        imagenPreview = await convertirArchivoABase64(imagenFile);
    } catch (error) {
        mostrarMensaje('❌ Error al procesar la imagen: ' + error.message, 'error');
        return;
    }
    
    // ========================
    // CREAR Y GUARDAR PRODUCTO
    // ========================
    
    const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
    
    const nuevoProducto = {
        id: nuevoId,
        nombre: nombre,
        categoria: categoria,
        descripcion: descripcion,
        imagen_local: imagenPreview,        // ← Solo para vista previa en admin (Data URL)
        imagen: nombreArchivoUnico,         // ← NOMBRE DEL ARCHIVO ORIGINAL (o único si ya existe)
        whatsapp: WHATSAPP_NUMBER,
        fecha: new Date().toISOString().split('T')[0]
    };
    
    // Guardar
    productos.push(nuevoProducto);
    guardarProductosLocales(productos);
    mostrarProductosEnLista(productos);
    
    // Limpiar formulario
    document.getElementById('productForm').reset();
    document.getElementById('descCounter').textContent = '0';
    document.getElementById('descCounter').style.color = '#7f8c8d';
    document.getElementById('fileUploadArea').style.display = 'block';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('imageUrl').value = ''; // Limpiar URL si existe
    mostrarPlaceholderVacio();
    ocultarSugerencias();
    
    // Mensaje con instrucciones
    const mensaje = nombreArchivoUnico === nombreArchivoOriginal
        ? `✅ Producto agregado exitosamente.<br><br>
           <strong>Nombre del archivo:</strong> <code>${nombreArchivoUnico}</code><br><br>
           <strong>Instrucciones:</strong><br>
           1. Sube el archivo <code>${nombreArchivoUnico}</code> a GitHub<br>
           2. Luego exporta el JSON y súbelo también`
        : `✅ Producto agregado exitosamente.<br><br>
           <strong>Archivo original:</strong> ${nombreArchivoOriginal}<br>
           <strong>Archivo guardado como:</strong> <code>${nombreArchivoUnico}</code><br><br>
           <em>Nota: Se cambió el nombre porque ya existía uno similar</em><br><br>
           <strong>Instrucciones:</strong><br>
           1. Sube el archivo <code>${nombreArchivoUnico}</code> a GitHub<br>
           2. Luego exporta el JSON y súbelo también`;
    
    mostrarMensaje(mensaje, 'success');
}

// ========================
// CONVERTIR ARCHIVO A BASE64 (solo para preview local)
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
// MOSTRAR PRODUCTOS EN LISTA (CORREGIDO)
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
        // Nombre de categoría amigable
        const nombresCategorias = {
            'anillos': 'Anillos',
            'collares': 'Collares',
            'pulseras': 'Pulseras',
            'aros': 'Aros',
            'relojes': 'Relojes',
            'piercings': 'Piercings'
        };
        
        const categoriaNombre = nombresCategorias[producto.categoria] || producto.categoria;
        
        // Usar imagen local (Data URL) si existe, sino usar placeholder
        const imagenSrc = producto.imagen_local || 
                         `https://via.placeholder.com/100x100/764ba2/ffffff?text=${encodeURIComponent(producto.nombre.substring(0, 10))}`;
        
        html += `
            <div class="product-item" data-id="${producto.id}">
                <div class="product-header">
                    <h3>${producto.nombre}</h3>
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
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    const productos = obtenerProductosLocales();
    const nuevosProductos = productos.filter(p => p.id !== id);
    
    guardarProductosLocales(nuevosProductos);
    mostrarProductosEnLista(nuevosProductos);
    
    mostrarMensaje('✅ Producto eliminado', 'success');
}

function limpiarTodo() {
    if (!confirm('¿Estás seguro de eliminar TODOS los productos? Esto no se puede deshacer.')) return;
    
    localStorage.removeItem('productos_joyeria_avril');
    cargarProductosLocales();
    
    mostrarMensaje('✅ Todos los productos han sido eliminados', 'success');
}

// ========================
// EXPORTAR A JSON (CORREGIDO - solo nombres de archivo)
// ========================
function exportarJSON() {
    const productos = obtenerProductosLocales();
    
    if (productos.length === 0) {
        mostrarMensaje('❌ No hay productos para exportar', 'error');
        return;
    }
    
    // Preparar productos para exportar (solo datos necesarios para la tienda)
    const productosParaExportar = productos.map(producto => {
        return {
            id: producto.id,
            nombre: producto.nombre,
            categoria: producto.categoria,
            descripcion: producto.descripcion,
            imagen: producto.imagen,  // ← ¡SOLO EL NOMBRE DEL ARCHIVO!
            whatsapp: WHATSAPP_NUMBER,
            fecha: producto.fecha
        };
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
    
    // Mostrar resumen de archivos necesarios
    const archivosNecesarios = productos.map(p => p.imagen).join('\n• ');
    
    mostrarMensaje(
        `✅ JSON exportado con ${productos.length} productos.<br><br>
        <strong>Instrucciones para publicar:</strong><br>
        1. Sube este JSON a: <code>data/products_joyeria.json</code><br>
        2. Sube estas imágenes a: <code>${IMAGE_BASE_PATH}</code><br><br>
        <strong>Archivos de imagen necesarios (${productos.length}):</strong><br>
        • ${archivosNecesarios}`,
        'success'
    );
}

// ========================
// CARGAR DESDE ARCHIVO JSON REMOTO
// ========================
async function cargarDesdeArchivo() {
    if (!confirm('⚠️ Importante: Esto descargará productos desde GitHub y combinará con los locales.\n\n¿Continuar?')) return;
    
    try {
        // Intentar cargar desde GitHub
        const response = await fetch('../data/products_joyeria.json');
        
        if (!response.ok) {
            throw new Error(`No se pudo cargar el archivo JSON (Error ${response.status})`);
        }
        
        const productosRemotos = await response.json();
        
        if (!Array.isArray(productosRemotos)) {
            throw new Error('El archivo JSON no contiene un array válido');
        }
        
        // Obtener productos locales
        const productosLocales = obtenerProductosLocales();
        
        // Combinar productos (evitar duplicados por ID)
        const todosLosIds = new Set([
            ...productosLocales.map(p => p.id),
            ...productosRemotos.map(p => p.id)
        ]);
        
        let productosCombinados = [];
        
        // Agregar productos locales primero
        productosCombinados.push(...productosLocales);
        
        // Agregar productos remotos que no existan localmente
        productosRemotos.forEach(productoRemoto => {
            if (!productosLocales.some(p => p.id === productoRemoto.id)) {
                // Convertir producto remoto al formato local (agregar campo imagen_local vacío)
                productosCombinados.push({
                    ...productoRemoto,
                    imagen_local: '' // No tenemos la imagen localmente
                });
            }
        });
        
        // Guardar combinación
        guardarProductosLocales(productosCombinados);
        mostrarProductosEnLista(productosCombinados);
        
        const nuevos = productosCombinados.length - productosLocales.length;
        mostrarMensaje(
            `✅ ${productosCombinados.length} productos cargados.<br>
            • ${productosLocales.length} productos locales<br>
            • ${nuevos} productos nuevos desde GitHub`,
            'success'
        );
        
    } catch (error) {
        console.error('Error al cargar desde archivo:', error);
        mostrarMensaje(
            `❌ Error al cargar desde GitHub:<br>${error.message}<br><br>
            Verifica que:<br>
            1. El archivo existe en: <code>data/products_joyeria.json</code><br>
            2. El JSON tiene el formato correcto`,
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

function mostrarMensaje(texto, tipo = 'info') {
    const modal = document.getElementById('messageModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    // Configurar ícono según tipo
    let iconClass = '';
    switch(tipo) {
        case 'success': 
            iconClass = 'fas fa-check-circle success-icon'; 
            modalTitle.textContent = '¡Éxito!'; 
            modalMessage.innerHTML = texto; // Usar innerHTML para permitir <br>
            break;
        case 'error': 
            iconClass = 'fas fa-exclamation-circle error-icon'; 
            modalTitle.textContent = 'Error'; 
            modalMessage.innerHTML = texto;
            break;
        default: 
            iconClass = 'fas fa-info-circle info-icon'; 
            modalTitle.textContent = 'Información';
            modalMessage.textContent = texto;
    }
    
    modalIcon.className = iconClass;
    modal.style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('messageModal').style.display = 'none';
}

// ========================
// INICIALIZACIÓN DE EVENTOS EN EL FORMULARIO
// ========================
// Configurar contador de caracteres para descripción
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Configurar subida de archivos (ya está en admin.html)
});