/**
 * ==============================================================================
 * CARLOS'S DUTY - TIENDA DE VIDEOJUEGOS
 * Script de Interactividad, Manipulación del DOM, Carrito y Fetch API
 * ==============================================================================
 * 
 * Contenido:
 *  1. Estado Global y Persistencia (Carrito de Compras)
 *  2. Inicialización de la Aplicación
 *  3. Helpers y Funciones de Utilidad (DOM y Moneda)
 *  4. Gestión del Carrito de Compras (Agregar, Modificar, Eliminar y Renderizar)
 *  5. Formulario de Búsqueda de Productos (Evento Submit y Filtrado)
 *  6. Formulario de Contacto (Evento Submit y Validación)
 *  7. Carga Dinámica con Fetch API (Manejo de Errores y Renderizado)
 *  8. Notificaciones Visuales (Toasts accesibles)
 */

// ==============================================================================
// 1. ESTADO GLOBAL
// ==============================================================================

/**
 * Lista de productos en el carrito.
 * Cada elemento tiene la estructura:
 * { id: string|number, titulo: string, precio: number, precioFormateado: string, imagen: string, cantidad: number }
 */
let carrito = [];

/**
 * Catálogo completo de productos cargados (estáticos + fetch) para búsquedas.
 */
let productosDisponibles = [];


// ==============================================================================
// 2. INICIALIZACIÓN DE LA APLICACIÓN
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar carrito guardado en localStorage (si existe)
    cargarCarritoLocalStorage();

    // 2. Registrar los productos iniciales que ya están en el HTML
    registrarProductosEstaticos();

    // 3. Inicializar eventos interactivos
    inicializarEventosBotonesAgregar();
    inicializarFormularioBusqueda();
    inicializarFormularioContacto();
    inicializarEventosCarrito();
    inicializarCargaFetch();

    // 4. Renderizar el estado inicial del carrito en el DOM
    actualizarCarritoDOM();
});


// ==============================================================================
// 3. HELPERS Y FUNCIONES DE UTILIDAD
// ==============================================================================

/**
 * Parsea un precio en string (ej: "$59.990" o "59990") a un número entero.
 * @param {string|number} precioStr 
 * @returns {number} Valor numérico
 */
function parsearPrecio(precioStr) {
    if (typeof precioStr === 'number') return precioStr;
    if (!precioStr) return 0;
    const limpio = precioStr.toString().replace(/[^0-9]/g, '');
    return parseInt(limpio, 10) || 0;
}

/**
 * Formatea un número como moneda en pesos chilenos ($XX.XXX).
 * @param {number} valor 
 * @returns {string} Precio formateado
 */
function formatearPrecio(valor) {
    return '$' + valor.toLocaleString('es-CL');
}

/**
 * Helper seguro para crear nodos del DOM con clases, texto y atributos.
 * Previene vulnerabilidades de inyección HTML.
 * @param {string} tag - Nombre de la etiqueta HTML.
 * @param {string} className - Clases CSS del elemento.
 * @param {string} textContent - Texto plano interno.
 * @param {Object} attributes - Objeto clave-valor con atributos HTML.
 * @returns {HTMLElement} Elemento DOM creado.
 */
function crearElemento(tag, className = '', textContent = '', attributes = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    Object.entries(attributes).forEach(([clave, valor]) => {
        el.setAttribute(clave, valor);
    });
    return el;
}

/**
 * Muestra u oculta un elemento spinner en la interfaz.
 * @param {HTMLElement|string} spinner - Elemento DOM o ID del spinner.
 * @param {boolean} visible - Verdadero para mostrar, falso para ocultar.
 */
function setSpinnerVisible(spinner, visible) {
    const el = typeof spinner === 'string' ? document.getElementById(spinner) : spinner;
    if (!el) return;
    if (visible) {
        el.classList.remove('d-none');
    } else {
        el.classList.add('d-none');
    }
}

/**
 * Habilita o deshabilita un botón, actualizando opcionalmente su contenido.
 * @param {HTMLElement|string} boton - Elemento DOM o ID del botón.
 * @param {boolean} habilitado - Verdadero para habilitar, falso para deshabilitar.
 * @param {string|null} htmlContenido - Contenido HTML/texto opcional a actualizar.
 */
function setBotonEstado(boton, habilitado, htmlContenido = null) {
    const el = typeof boton === 'string' ? document.getElementById(boton) : boton;
    if (!el) return;
    el.disabled = !habilitado;
    if (htmlContenido !== null) {
        el.innerHTML = htmlContenido;
    }
}


// ==============================================================================
// 4. GESTIÓN DEL CARRITO DE COMPRAS
// ==============================================================================

/**
 * Guarda el carrito actual en el almacenamiento local (localStorage).
 */
function guardarCarritoLocalStorage() {
    try {
        localStorage.setItem('carlos_duty_carrito', JSON.stringify(carrito));
    } catch (e) {
        console.warn('No se pudo guardar el carrito en localStorage:', e);
    }
}

/**
 * Carga el carrito desde localStorage al iniciar la página.
 */
function cargarCarritoLocalStorage() {
    try {
        const datos = localStorage.getItem('carlos_duty_carrito');
        if (datos) {
            carrito = JSON.parse(datos);
        }
    } catch (e) {
        console.warn('No se pudo leer el carrito desde localStorage:', e);
        carrito = [];
    }
}

/**
 * Agrega un producto a la lista del carrito o incrementa su cantidad si ya existe.
 * @param {Object} producto - Objeto del producto a agregar.
 */
function agregarAlCarrito(producto) {
    // Validar que el producto tenga datos mínimos requeridos
    if (!producto || !producto.id) return;

    // Buscar si ya se encuentra en el carrito
    const itemExistente = carrito.find((item) => String(item.id) === String(producto.id));

    if (itemExistente) {
        // Incrementar cantidad existente
        itemExistente.cantidad += 1;
    } else {
        // Insertar nuevo producto en la lista del carrito con cantidad inicial = 1
        carrito.push({
            id: producto.id,
            titulo: producto.titulo || 'Videojuego',
            precio: parsearPrecio(producto.precio),
            precioFormateado: producto.precioFormateado || formatearPrecio(parsearPrecio(producto.precio)),
            imagen: producto.imagen || 'assets/images/placeholder.jpg',
            cantidad: 1
        });
    }

    // Persistir y actualizar interfaz
    guardarCarritoLocalStorage();
    actualizarCarritoDOM();

    // Mostrar feedback accesible
    mostrarNotificacion(`¡"${producto.titulo}" agregado al carrito! 🎮`);
}

/**
 * Modifica la cantidad de un producto en el carrito (+1 o -1).
 * Si la cantidad resultante es menor a 1 unidad, se elimina automáticamente del carrito.
 * @param {string|number} productoId - ID del producto a modificar.
 * @param {number} delta - Cambio en cantidad (+1 o -1).
 */
function cambiarCantidad(productoId, delta) {
    const indice = carrito.findIndex((item) => String(item.id) === String(productoId));
    if (indice === -1) return;

    carrito[indice].cantidad += delta;

    // Regla: al tener menos de 1 unidad este se elimina del carro
    if (carrito[indice].cantidad < 1) {
        const tituloEliminado = carrito[indice].titulo;
        carrito.splice(indice, 1);
        mostrarNotificacion(`"${tituloEliminado}" fue eliminado del carrito.`, 'info');
    }

    guardarCarritoLocalStorage();
    actualizarCarritoDOM();
}

/**
 * Elimina por completo un producto del carrito.
 * @param {string|number} productoId - ID del producto a remover.
 */
function eliminarDelCarrito(productoId) {
    const indice = carrito.findIndex((item) => String(item.id) === String(productoId));
    if (indice === -1) return;

    const tituloEliminado = carrito[indice].titulo;
    carrito.splice(indice, 1);

    guardarCarritoLocalStorage();
    actualizarCarritoDOM();
    mostrarNotificacion(`"${tituloEliminado}" fue eliminado del carrito.`, 'info');
}

/**
 * Vacía todos los productos del carrito de compras.
 */
function vaciarCarrito() {
    if (carrito.length === 0) return;

    if (confirm('¿Estás seguro de que deseas vaciar tu carrito de compras?')) {
        carrito = [];
        guardarCarritoLocalStorage();
        actualizarCarritoDOM();
        mostrarNotificacion('El carrito ha sido vaciado.', 'info');
    }
}

/**
 * Procesa la compra simulada de los productos en el carrito.
 */
function finalizarCompra() {
    if (carrito.length === 0) return;

    const totalCalculado = calcularTotalCarrito();
    const cantidadTotal = calcularCantidadTotalCarrito();

    alert(`¡Gracias por tu compra en Carlos's Duty!\n\nHas adquirido ${cantidadTotal} producto(s) por un total de ${formatearPrecio(totalCalculado)}.\nSe ha enviado el comprobante a tu correo.`);

    carrito = [];
    guardarCarritoLocalStorage();
    actualizarCarritoDOM();

    // Cerrar el panel offcanvas si está abierto
    const offcanvasEl = document.getElementById('offcanvasCarrito');
    if (offcanvasEl && typeof bootstrap !== 'undefined') {
        const modalInstance = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (modalInstance) modalInstance.hide();
    }
}

/**
 * Calcula la suma total en pesos de los productos en el carrito.
 * @returns {number} Monto total
 */
function calcularTotalCarrito() {
    return carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
}

/**
 * Calcula el número total de unidades de productos en el carrito.
 * @returns {number} Cantidad de unidades
 */
function calcularCantidadTotalCarrito() {
    return carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

/**
 * Actualiza dinámicamente el área del carrito en el DOM (resumen, lista y contador).
 */
function actualizarCarritoDOM() {
    const contenedorLista = document.getElementById('lista-carrito');
    const badgeContador = document.getElementById('contador-carrito');
    const resumenCantidad = document.getElementById('resumen-cantidad');
    const resumenTotal = document.getElementById('resumen-total');
    const btnFinalizar = document.getElementById('btn-finalizar-compra');
    const btnVaciar = document.getElementById('btn-vaciar-carrito');

    const totalCantidad = calcularCantidadTotalCarrito();
    const totalPrecio = calcularTotalCarrito();

    // 1. Actualizar Badge del Carrito en la barra de navegación
    if (badgeContador) {
        badgeContador.textContent = totalCantidad;
        if (totalCantidad > 0) {
            badgeContador.classList.remove('d-none');
        } else {
            badgeContador.classList.add('d-none');
        }
    }

    // 2. Actualizar textos de resumen
    if (resumenCantidad) {
        resumenCantidad.textContent = `${totalCantidad} unidad${totalCantidad === 1 ? '' : 'es'}`;
    }
    if (resumenTotal) {
        resumenTotal.textContent = formatearPrecio(totalPrecio);
    }

    // 3. Habilitar o deshabilitar botones de acción según si hay productos
    if (btnFinalizar) btnFinalizar.disabled = carrito.length === 0;
    if (btnVaciar) btnVaciar.disabled = carrito.length === 0;

    // 4. Renderizar lista de productos en el DOM
    if (!contenedorLista) return;
    contenedorLista.replaceChildren();

    // Estado vacío
    if (carrito.length === 0) {
        const estadoVacio = crearElemento('div', 'text-center py-5 text-secondary');
        const icono = crearElemento('i', 'bi bi-cart-x display-3 text-secondary opacity-50 mb-3 d-block');
        const titulo = crearElemento('p', 'h6 text-light mb-1', 'Tu carrito está vacío');
        const subtitulo = crearElemento('p', 'small text-muted mb-0', '¡Explora nuestro catálogo y agrega tus juegos y consolas favoritas!');

        estadoVacio.appendChild(icono);
        estadoVacio.appendChild(titulo);
        estadoVacio.appendChild(subtitulo);
        contenedorLista.appendChild(estadoVacio);
        return;
    }

    // Renderizar cada elemento de la lista del carrito
    carrito.forEach((item) => {
        const itemCard = crearElemento('div', 'card bg-black border-secondary mb-3 p-2');
        const row = crearElemento('div', 'row g-2 align-items-center');

        // Imagen en miniatura
        const colImg = crearElemento('div', 'col-3 col-sm-2 text-center');
        const img = crearElemento('img', 'img-fluid rounded border border-secondary', '', {
            src: item.imagen,
            alt: item.titulo,
            style: 'height: 55px; object-fit: cover;'
        });
        colImg.appendChild(img);

        // Título y Precio unitario
        const colInfo = crearElemento('div', 'col-9 col-sm-5');
        const titulo = crearElemento('h4', 'h6 text-light mb-1 text-truncate', item.titulo, { title: item.titulo });
        const precioUnitario = crearElemento('p', 'small text-neon mb-0', formatearPrecio(item.precio));
        colInfo.appendChild(titulo);
        colInfo.appendChild(precioUnitario);

        // Controles de Cantidad (+ y -)
        const colControles = crearElemento('div', 'col-8 col-sm-4 d-flex align-items-center justify-content-start justify-content-sm-center');
        const grupoBotones = crearElemento('div', 'btn-group btn-group-sm', '', { role: 'group', 'aria-label': `Control de cantidad para ${item.titulo}` });

        // Botón Disminuir (-)
        const btnMenos = crearElemento('button', 'btn btn-outline-secondary text-light px-2', '', {
            type: 'button',
            'data-accion': 'restar',
            'data-id': String(item.id),
            'aria-label': `Disminuir cantidad de ${item.titulo}`
        });
        btnMenos.appendChild(crearElemento('i', 'bi bi-dash'));

        // Indicador de Cantidad
        const spanCantidad = crearElemento('span', 'btn btn-dark disabled text-light fw-bold px-2', String(item.cantidad), {
            'aria-label': `Cantidad actual: ${item.cantidad}`
        });

        // Botón Aumentar (+)
        const btnMas = crearElemento('button', 'btn btn-outline-secondary text-light px-2', '', {
            type: 'button',
            'data-accion': 'sumar',
            'data-id': String(item.id),
            'aria-label': `Aumentar cantidad de ${item.titulo}`
        });
        btnMas.appendChild(crearElemento('i', 'bi bi-plus'));

        grupoBotones.appendChild(btnMenos);
        grupoBotones.appendChild(spanCantidad);
        grupoBotones.appendChild(btnMas);
        colControles.appendChild(grupoBotones);

        // Botón Eliminar individual
        const colEliminar = crearElemento('div', 'col-4 col-sm-1 text-end');
        const btnEliminar = crearElemento('button', 'btn btn-sm btn-outline-danger border-0 p-1', '', {
            type: 'button',
            'data-accion': 'eliminar',
            'data-id': String(item.id),
            'aria-label': `Eliminar ${item.titulo} del carrito`
        });
        btnEliminar.appendChild(crearElemento('i', 'bi bi-trash3-fill'));
        colEliminar.appendChild(btnEliminar);

        // Ensamblado
        row.appendChild(colImg);
        row.appendChild(colInfo);
        row.appendChild(colControles);
        row.appendChild(colEliminar);
        itemCard.appendChild(row);

        contenedorLista.appendChild(itemCard);
    });
}

/**
 * Inicializa los eventos click delegados para el área del carrito y sus botones de acción.
 */
function inicializarEventosCarrito() {
    const contenedorLista = document.getElementById('lista-carrito');
    const btnVaciar = document.getElementById('btn-vaciar-carrito');
    const btnFinalizar = document.getElementById('btn-finalizar-compra');

    // Delegación de eventos 'click' para los botones +, - y eliminar dentro de la lista
    if (contenedorLista) {
        contenedorLista.addEventListener('click', (e) => {
            const boton = e.target.closest('button[data-accion]');
            if (!boton) return;

            const accion = boton.dataset.accion;
            const id = boton.dataset.id;

            if (accion === 'sumar') {
                cambiarCantidad(id, 1);
            } else if (accion === 'restar') {
                cambiarCantidad(id, -1);
            } else if (accion === 'eliminar') {
                eliminarDelCarrito(id);
            }
        });
    }

    // Botón Vaciar Carrito
    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            vaciarCarrito();
        });
    }

    // Botón Finalizar Compra
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', () => {
            finalizarCompra();
        });
    }
}

/**
 * Registra los productos que ya están en el HTML inicial para permitir agregarlos y buscarlos.
 */
function registrarProductosEstaticos() {
    const elementosEstaticos = document.querySelectorAll('.item-producto');
    elementosEstaticos.forEach((el) => {
        const id = el.dataset.id || el.querySelector('.card-title')?.textContent.trim();
        const titulo = el.dataset.titulo || el.querySelector('.card-title')?.textContent.trim() || 'Producto';
        const categoria = el.dataset.categoria || 'Consolas / Accesorios';
        const precio = parsearPrecio(el.dataset.precio || el.querySelector('.fw-bold.fs-5')?.textContent);
        const imagen = el.dataset.imagen || el.querySelector('img')?.src;

        // Añadir a productos disponibles para búsqueda si no existe
        if (!productosDisponibles.some((p) => String(p.id) === String(id))) {
            productosDisponibles.push({ id, titulo, categoria, precio, imagen, elementoDOM: el });
        }
    });
}

/**
 * Inicializa los listeners 'click' en todos los botones "Agregar al carrito" de las tarjetas.
 */
function inicializarEventosBotonesAgregar() {
    // Delegación global para cualquier botón con clase .btn-agregar-carrito o dentro de .product-card
    document.addEventListener('click', (evento) => {
        const boton = evento.target.closest('.btn-agregar-carrito, .product-card .btn-outline-neon');
        if (!boton) return;

        // Si el botón está dentro del offcanvas o es de carga/búsqueda, ignorar
        if (boton.closest('#offcanvasCarrito') || boton.id === 'btn-cargar-juegos' || boton.type === 'submit') {
            return;
        }

        evento.preventDefault();

        // Obtener datos del contenedor padre
        const itemContainer = boton.closest('.item-producto, .col-12');
        if (!itemContainer) return;

        const id = itemContainer.dataset.id || itemContainer.querySelector('.card-title')?.textContent.trim();
        const titulo = itemContainer.dataset.titulo || itemContainer.querySelector('.card-title')?.textContent.trim();
        const precio = itemContainer.dataset.precio || itemContainer.querySelector('.fw-bold.fs-5')?.textContent;
        const imagen = itemContainer.dataset.imagen || itemContainer.querySelector('img')?.src;

        agregarAlCarrito({
            id: id,
            titulo: titulo,
            precio: precio,
            imagen: imagen
        });
    });
}


// ==============================================================================
// 5. FORMULARIO DE BÚSQUEDA DE PRODUCTOS (EVENTO SUBMIT)
// ==============================================================================

/**
 * Inicializa el formulario de búsqueda de productos con su evento 'submit'.
 */
function inicializarFormularioBusqueda() {
    const formBusqueda = document.getElementById('form-busqueda');
    const inputBusqueda = document.getElementById('input-busqueda');
    const alertaBusqueda = document.getElementById('alerta-busqueda');
    const btnMostrarTodos = document.getElementById('btn-mostrar-todos');

    if (!formBusqueda) return;

    // EVENTO 'submit': Procesa la búsqueda de productos
    formBusqueda.addEventListener('submit', (evento) => {
        evento.preventDefault(); // Previene la recarga de página por defecto

        const termino = inputBusqueda?.value.trim().toLowerCase();
        if (!termino) return;

        procesarBusqueda(termino);
    });

    // Botón para restablecer y mostrar todos los productos
    if (btnMostrarTodos) {
        btnMostrarTodos.addEventListener('click', () => {
            mostrarTodosLosProductos();
            if (inputBusqueda) inputBusqueda.value = '';
        });
    }
}

/**
 * Filtra los productos visibles en la página según el término de búsqueda ingresado.
 * @param {string} termino - Término de búsqueda.
 */
function procesarBusqueda(termino) {
    const alertaBusqueda = document.getElementById('alerta-busqueda');
    const btnMostrarTodos = document.getElementById('btn-mostrar-todos');
    const todosLosProductosDOM = document.querySelectorAll('.item-producto');

    let coincidencias = 0;

    todosLosProductosDOM.forEach((item) => {
        const titulo = (item.dataset.titulo || item.querySelector('.card-title')?.textContent || '').toLowerCase();
        const categoria = (item.dataset.categoria || item.querySelector('.badge')?.textContent || '').toLowerCase();
        const descripcion = (item.querySelector('.card-text')?.textContent || '').toLowerCase();

        const coincide = titulo.includes(termino) || categoria.includes(termino) || descripcion.includes(termino);

        if (coincide) {
            item.classList.remove('d-none');
            coincidencias++;
        } else {
            item.classList.add('d-none');
        }
    });

    // Desplazar la pantalla a la sección de productos para que el usuario vea los resultados
    const seccionProductos = document.getElementById('productos');
    if (seccionProductos) {
        seccionProductos.scrollIntoView({ behavior: 'smooth' });
    }

    // Mostrar alerta accesible con el resultado de la búsqueda
    if (alertaBusqueda) {
        alertaBusqueda.replaceChildren();

        if (coincidencias > 0) {
            const alertSuccess = crearElemento('div', 'alert alert-dark border-success text-light d-flex justify-content-between align-items-center shadow-sm');
            const texto = crearElemento('span', '', `Mostrando ${coincidencias} resultado(s) para "${termino}".`);
            const icono = crearElemento('i', 'bi bi-check-circle text-neon me-2');
            const p = crearElemento('div', 'd-flex align-items-center');
            p.appendChild(icono);
            p.appendChild(texto);
            alertSuccess.appendChild(p);

            alertaBusqueda.appendChild(alertSuccess);
            alertaBusqueda.classList.remove('d-none');
        } else {
            const alertWarning = crearElemento('div', 'alert alert-dark border-warning text-light text-center shadow-sm py-4');
            const icono = crearElemento('i', 'bi bi-search display-6 text-warning mb-2 d-block');
            const h5 = crearElemento('h5', 'fw-bold text-warning', `No encontramos productos para "${termino}"`);
            const p = crearElemento('p', 'text-muted small mb-3', 'Verifica la ortografía o intenta buscar con palabras clave más generales (ej: "PlayStation", "Zelda", "Xbox").');
            
            const btnReset = crearElemento('button', 'btn btn-outline-neon btn-sm', 'Restablecer catálogo', {
                type: 'button'
            });
            btnReset.addEventListener('click', () => {
                mostrarTodosLosProductos();
                const inputBusqueda = document.getElementById('input-busqueda');
                if (inputBusqueda) inputBusqueda.value = '';
            });

            alertWarning.appendChild(icono);
            alertWarning.appendChild(h5);
            alertWarning.appendChild(p);
            alertWarning.appendChild(btnReset);

            alertaBusqueda.appendChild(alertWarning);
            alertaBusqueda.classList.remove('d-none');
        }
    }

    // Mostrar botón de reseteo
    if (btnMostrarTodos) {
        btnMostrarTodos.classList.remove('d-none');
    }
}

/**
 * Restablece la visualización de todos los productos y oculta las alertas de búsqueda.
 */
function mostrarTodosLosProductos() {
    const todosLosProductosDOM = document.querySelectorAll('.item-producto');
    todosLosProductosDOM.forEach((item) => {
        item.classList.remove('d-none');
    });

    const alertaBusqueda = document.getElementById('alerta-busqueda');
    if (alertaBusqueda) {
        alertaBusqueda.classList.add('d-none');
        alertaBusqueda.replaceChildren();
    }

    const btnMostrarTodos = document.getElementById('btn-mostrar-todos');
    if (btnMostrarTodos) {
        btnMostrarTodos.classList.add('d-none');
    }
}


// ==============================================================================
// 6. FORMULARIO DE CONTACTO (EVENTO SUBMIT)
// ==============================================================================

/**
 * Inicializa el formulario de contacto con su respectivo evento 'submit' y validación.
 */
function inicializarFormularioContacto() {
    const formulario = document.getElementById('form-contacto');
    const mensajeEstado = document.getElementById('mensaje-formulario');

    if (!formulario) return;

    formulario.addEventListener('submit', (evento) => {
        // Prevenir la recarga por defecto de la página
        evento.preventDefault();

        // Obtener valores de los inputs
        const nombre = document.getElementById('nombreContacto')?.value.trim();
        const email = document.getElementById('emailContacto')?.value.trim();
        const mensaje = document.getElementById('mensajeContacto')?.value.trim();

        // Validación básica
        if (!nombre || !email || !mensaje) {
            if (mensajeEstado) {
                mensajeEstado.className = 'alert alert-danger mt-3';
                mensajeEstado.textContent = 'Por favor, completa todos los campos requeridos.';
                mensajeEstado.classList.remove('d-none');
            }
            return;
        }

        // Simulación de envío exitoso manipulando el DOM de forma segura
        if (mensajeEstado) {
            mensajeEstado.className = 'alert alert-success mt-3 shadow-sm';
            mensajeEstado.replaceChildren();

            const icono = crearElemento('i', 'bi bi-check-circle-fill me-2');
            const textoInicio = document.createTextNode('¡Gracias ');
            const strongNombre = crearElemento('strong', '', nombre);
            const textoMedio = document.createTextNode('! Tu mensaje ha sido recibido. Responderemos a ');
            const emEmail = crearElemento('em', '', email);
            const textoFinal = document.createTextNode(' a la brevedad.');

            mensajeEstado.appendChild(icono);
            mensajeEstado.appendChild(textoInicio);
            mensajeEstado.appendChild(strongNombre);
            mensajeEstado.appendChild(textoMedio);
            mensajeEstado.appendChild(emEmail);
            mensajeEstado.appendChild(textoFinal);
            mensajeEstado.classList.remove('d-none');
        }

        // Limpiar el formulario
        formulario.reset();

        // Ocultar mensaje después de 6 segundos
        setTimeout(() => {
            if (mensajeEstado) mensajeEstado.classList.add('d-none');
        }, 6000);
    });
}


// ==============================================================================
// 7. CARGA DINÁMICA CON FETCH API Y GESTIÓN DE ERRORES
// ==============================================================================

/**
 * Inicializa el botón para cargar el catálogo digital desde el archivo JSON externo.
 */
function inicializarCargaFetch() {
    const btnCargar = document.getElementById('btn-cargar-juegos');
    if (btnCargar) {
        btnCargar.addEventListener('click', () => {
            cargarCatalogoFetch();
        });
    }
}

/**
 * Realiza una petición fetch con tiempo de espera límite (timeout) y reintentos automáticos.
 * @param {string} url - Recurso a solicitar.
 * @param {Object} opciones - Opciones de configuración (timeoutMs, reintentos, retardoMs).
 * @returns {Promise<Response>} Respuesta de la petición fetch.
 */
async function fetchConReintentos(url, opciones = {}) {
    const { timeoutMs = 5000, reintentos = 2, retardoMs = 1000 } = opciones;

    for (let intento = 0; intento <= reintentos; intento++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const respuesta = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status} (${respuesta.statusText || 'Recurso no disponible'})`);
            }

            return respuesta;
        } catch (error) {
            clearTimeout(timeoutId);

            const esUltimoIntento = intento === reintentos;
            if (esUltimoIntento) {
                if (error.name === 'AbortError') {
                    throw new Error('La solicitud superó el tiempo de espera límite (timeout).');
                }
                throw error;
            }

            // Esperar antes del siguiente intento
            await new Promise((resolve) => setTimeout(resolve, retardoMs));
        }
    }
}

/**
 * Crea la estructura DOM de una tarjeta de videojuego cargado con Fetch API.
 * @param {Object} juego - Objeto con los datos del videojuego.
 * @returns {HTMLElement} Nodo de columna con la tarjeta completa.
 */
function crearTarjetaJuego(juego) {
    const columna = crearElemento('div', 'col-12 col-sm-6 col-lg-3 d-flex align-items-stretch item-producto', '', {
        'data-id': String(juego.id),
        'data-titulo': juego.titulo,
        'data-categoria': juego.categoria,
        'data-precio': String(parsearPrecio(juego.precio)),
        'data-imagen': juego.imagen
    });

    const tarjeta = crearElemento('article', 'card product-card w-100 position-relative h-100');

    // Badge Digital
    const badgeDigital = crearElemento('span', 'badge bg-success position-absolute top-0 end-0 m-3 fs-6', 'DIGITAL');

    // Contenedor de Imagen
    const wrapperImg = crearElemento('div', 'card-img-wrapper');
    const imagen = crearElemento('img', 'card-img-top p-3', '', {
        src: juego.imagen,
        alt: juego.titulo,
        loading: 'lazy'
    });
    wrapperImg.appendChild(imagen);

    // Cuerpo de la Tarjeta
    const cardBody = crearElemento('div', 'card-body d-flex flex-column text-center');

    const badgeCat = crearElemento('span', 'badge bg-dark text-info mb-2 align-self-center', juego.categoria);
    const titulo = crearElemento('h3', 'card-title h5 text-neon', juego.titulo);
    const descripcion = crearElemento('p', 'card-text text-secondary flex-grow-1', juego.descripcion);
    const precio = crearElemento('p', 'fw-bold text-light fs-5 mb-2', juego.precio);

    const boton = crearElemento('button', 'btn btn-outline-neon mt-auto btn-agregar-carrito', '', {
        type: 'button',
        'aria-label': `Agregar ${juego.titulo} al carrito`
    });
    const iconoBoton = crearElemento('i', 'bi bi-cart-plus me-1', '', { 'aria-hidden': 'true' });
    const textoBoton = document.createTextNode(' Agregar al carrito');
    boton.appendChild(iconoBoton);
    boton.appendChild(textoBoton);

    // Ensamblado
    cardBody.appendChild(badgeCat);
    cardBody.appendChild(titulo);
    cardBody.appendChild(descripcion);
    cardBody.appendChild(precio);
    cardBody.appendChild(boton);

    tarjeta.appendChild(badgeDigital);
    tarjeta.appendChild(wrapperImg);
    tarjeta.appendChild(cardBody);

    columna.appendChild(tarjeta);

    return columna;
}

/**
 * Muestra un mensaje amigable y orientador al usuario en caso de error en la petición Fetch.
 * @param {HTMLElement} contenedor - Elemento DOM donde se inyectará el mensaje.
 * @param {string} titulo - Título amigable del error.
 * @param {string} detalle - Explicación y sugerencia de solución.
 */
function mostrarErrorFetchAmigable(contenedor, titulo, detalle) {
    contenedor.replaceChildren();

    const col = crearElemento('div', 'col-12');
    const alertBox = crearElemento('div', 'alert alert-danger text-center shadow-lg py-4 border-danger');
    
    const icono = crearElemento('i', 'bi bi-wifi-off display-4 text-danger mb-3 d-block');
    const h4 = crearElemento('h4', 'alert-heading fw-bold text-light mb-2', titulo);
    const p = crearElemento('p', 'mb-3 text-muted', detalle);
    
    const btnReintentar = crearElemento('button', 'btn btn-neon px-4 py-2', '', {
        type: 'button'
    });
    btnReintentar.appendChild(crearElemento('i', 'bi bi-arrow-clockwise me-2'));
    btnReintentar.appendChild(document.createTextNode('Intentar nuevamente'));
    btnReintentar.addEventListener('click', () => {
        cargarCatalogoFetch();
    });

    alertBox.appendChild(icono);
    alertBox.appendChild(h4);
    alertBox.appendChild(p);
    alertBox.appendChild(btnReintentar);
    col.appendChild(alertBox);

    contenedor.appendChild(col);
}

/**
 * Carga productos desde el archivo JSON externo utilizando Fetch API y gestiona errores.
 */
async function cargarCatalogoFetch() {
    const contenedor = document.getElementById('contenedor-catalogo-fetch');
    const spinner = document.getElementById('fetch-spinner');
    const btnCargar = document.getElementById('btn-cargar-juegos');

    if (!contenedor) return;

    setSpinnerVisible(spinner, true);
    setBotonEstado(btnCargar, false, '<span class="spinner-border spinner-border-sm me-2"></span>Cargando catálogo digital...');

    try {
        // Petición a Fetch API hacia el JSON local
        const respuesta = await fetchConReintentos('assets/data/productos.json', {
            timeoutMs: 5000,
            reintentos: 1,
            retardoMs: 800
        });

        const juegos = await respuesta.json();

        // Limpiar contenedor antes de renderizar
        contenedor.replaceChildren();

        // Renderizar dinámicamente cada juego obtenido del JSON
        juegos.forEach((juego) => {
            const nodoJuego = crearTarjetaJuego(juego);
            contenedor.appendChild(nodoJuego);

            // Registrar en productos disponibles para búsqueda
            if (!productosDisponibles.some((p) => String(p.id) === String(juego.id))) {
                productosDisponibles.push({
                    id: juego.id,
                    titulo: juego.titulo,
                    categoria: juego.categoria,
                    precio: parsearPrecio(juego.precio),
                    imagen: juego.imagen,
                    elementoDOM: nodoJuego
                });
            }
        });

        // Actualizar estado del botón a éxito
        if (btnCargar) {
            setBotonEstado(btnCargar, true, '<i class="bi bi-check2-circle me-2"></i>Catálogo Digital Actualizado');
            btnCargar.classList.replace('btn-neon', 'btn-outline-neon');
        }

    } catch (error) {
        console.error('Error al cargar productos desde JSON:', error);

        // Mensaje amigable y orientador para el usuario
        const mensajeAmigable = 'No pudimos cargar los videojuegos digitales en este momento. Verifica que tu servidor web local esté en funcionamiento o inténtalo otra vez.';
        
        mostrarErrorFetchAmigable(
            contenedor,
            '¡Ups! No fue posible cargar el catálogo digital',
            mensajeAmigable
        );

        if (btnCargar) {
            setBotonEstado(btnCargar, true, '<i class="bi bi-arrow-clockwise me-2"></i>Reintentar Carga');
            btnCargar.classList.replace('btn-outline-neon', 'btn-neon');
        }

    } finally {
        setSpinnerVisible(spinner, false);
    }
}


// ==============================================================================
// 8. NOTIFICACIONES VISUALES (TOASTS ACCESIBLES)
// ==============================================================================

/**
 * Muestra una notificación emergente accesible en la esquina inferior de la pantalla.
 * @param {string} mensaje - Mensaje a mostrar.
 * @param {string} tipo - Tipo de notificación ('success', 'info', 'warning').
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
    let contenedorToast = document.getElementById('toast-container');
    if (!contenedorToast) {
        contenedorToast = crearElemento('div', 'position-fixed bottom-0 end-0 p-3', '', {
            id: 'toast-container',
            'aria-live': 'polite',
            'aria-atomic': 'true',
            style: 'z-index: 1090;'
        });
        document.body.appendChild(contenedorToast);
    }

    const fondoClase = tipo === 'success' ? 'bg-success text-dark' : (tipo === 'info' ? 'bg-info text-dark' : 'bg-warning text-dark');
    const iconoClase = tipo === 'success' ? 'bi-cart-check-fill' : (tipo === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-triangle-fill');

    const alerta = crearElemento('div', `alert ${fondoClase} alert-dismissible fade show shadow-lg fw-semibold d-flex align-items-center mb-2`, '', {
        role: 'alert'
    });

    if (tipo === 'success') {
        alerta.style.backgroundColor = 'var(--verde-neon, #00ff66)';
        alerta.style.color = '#000';
    }

    const icono = crearElemento('i', `bi ${iconoClase} me-2 fs-5`);
    const texto = crearElemento('span', 'flex-grow-1', mensaje);
    const btnCerrar = crearElemento('button', 'btn-close', '', {
        type: 'button',
        'data-bs-dismiss': 'alert',
        'aria-label': 'Cerrar notificación'
    });

    alerta.appendChild(icono);
    alerta.appendChild(texto);
    alerta.appendChild(btnCerrar);

    contenedorToast.appendChild(alerta);

    // Eliminar automáticamente tras 3.5 segundos
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 3500);
}
