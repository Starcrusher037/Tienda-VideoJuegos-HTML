

// ==========================================
// ESTADO GLOBAL
// ==========================================
let totalProductosCarrito = 0;

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    inicializarCarrito();
    inicializarEventosTarjetas();
    inicializarFormularioContacto();
    inicializarCargaFetch();
});


// ==========================================
// FUNCIONES AUXILIARES (HELPERS REUTILIZABLES)
// ==========================================

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
 * Habilita o deshabilita un botón, actualizando opcionalmente su contenido o estilos.
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

/**
 * Helper para crear elementos DOM con clases, atributos y contenido de texto seguro.
 * @param {string} tag - Etiqueta del elemento.
 * @param {string} className - Clases CSS del elemento.
 * @param {string} textContent - Contenido en texto plano (seguro contra XSS).
 * @param {Object} attributes - Atributos adicionales en formato clave-valor.
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


// ==========================================
// GESTIÓN DEL CARRITO Y NOTIFICACIONES
// ==========================================

function inicializarCarrito() {
    // Selección de botones "Agregar al carrito"
    const botonesCarrito = document.querySelectorAll('.product-card .btn');
    const badgeCarrito = document.getElementById('contador-carrito');

    botonesCarrito.forEach((boton) => {
        // Evitar duplicar listeners comprobando dataset
        if (boton.dataset.carritoInicializado) return;
        boton.dataset.carritoInicializado = 'true';

        // Evento 'click' en cada botón de producto
        boton.addEventListener('click', (evento) => {
            evento.preventDefault();

            // Incrementar contador
            totalProductosCarrito++;
            if (badgeCarrito) {
                badgeCarrito.textContent = totalProductosCarrito;
                badgeCarrito.classList.remove('d-none');
            }

            // Obtener título del producto seleccionado
            const tarjeta = boton.closest('.product-card');
            const tituloProducto = tarjeta ? tarjeta.querySelector('.card-title')?.textContent : 'Producto';

            // Notificación flotante dinámica (Toast / Alerta en DOM)
            mostrarNotificacion(`¡Añadiste "${tituloProducto}" a tus compras! 🎮`);
        });
    });
}

function mostrarNotificacion(mensaje) {
    // Contenedor de notificaciones
    let contenedorToast = document.getElementById('toast-container');
    if (!contenedorToast) {
        contenedorToast = crearElemento('div', 'position-fixed bottom-0 end-0 p-3');
        contenedorToast.id = 'toast-container';
        contenedorToast.style.zIndex = '1080';
        document.body.appendChild(contenedorToast);
    }

    // Creación dinámica del elemento visual usando DOM explícito
    const alerta = crearElemento('div', 'alert alert-success alert-dismissible fade show shadow-lg text-dark fw-semibold', '', { role: 'alert' });
    alerta.style.backgroundColor = 'var(--verde-neon, #00ff66)';
    alerta.style.border = 'none';

    const icono = crearElemento('i', 'bi bi-check-circle-fill me-2');
    const texto = crearElemento('span', '', mensaje);
    const btnCerrar = crearElemento('button', 'btn-close', '', {
        type: 'button',
        'data-bs-dismiss': 'alert',
        'aria-label': 'Cerrar'
    });

    alerta.appendChild(icono);
    alerta.appendChild(texto);
    alerta.appendChild(btnCerrar);

    // Añadir al DOM
    contenedorToast.appendChild(alerta);

    // Eliminar del DOM después de 3.5 segundos
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 3500);
}


// ==========================================
// INTERACCIONES Y EVENTOS VISUALES
// ==========================================

function inicializarEventosTarjetas() {
    const tarjetas = document.querySelectorAll('.product-card');

    tarjetas.forEach((tarjeta) => {
        if (tarjeta.dataset.hoverInicializado) return;
        tarjeta.dataset.hoverInicializado = 'true';

        // Evento mouseover: cambia el aspecto e interactúa con el botón
        tarjeta.addEventListener('mouseover', () => {
            tarjeta.style.transition = 'all 0.3s ease';
            tarjeta.style.boxShadow = '0 0 20px rgba(0, 255, 102, 0.4)';
        });

        // Evento mouseout: restaura el estilo original
        tarjeta.addEventListener('mouseout', () => {
            tarjeta.style.boxShadow = '';
        });
    });
}


// ==========================================
// FORMULARIO DE CONTACTO
// ==========================================

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
            mensajeEstado.className = 'alert alert-success mt-3';
            mensajeEstado.replaceChildren();

            const textoInicio = document.createTextNode('¡Gracias ');
            const strongNombre = crearElemento('strong', '', nombre);
            const textoMedio = document.createTextNode('! Tu consulta ha sido enviada con éxito. Te responderemos a ');
            const emEmail = crearElemento('em', '', email);
            const textoFinal = document.createTextNode('.');

            mensajeEstado.appendChild(textoInicio);
            mensajeEstado.appendChild(strongNombre);
            mensajeEstado.appendChild(textoMedio);
            mensajeEstado.appendChild(emEmail);
            mensajeEstado.appendChild(textoFinal);
            mensajeEstado.classList.remove('d-none');
        }

        // Limpiar el formulario
        formulario.reset();

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            if (mensajeEstado) mensajeEstado.classList.add('d-none');
        }, 5000);
    });
}


// ==========================================
// GESTIÓN DE SOLICITUDES Y RENDERIZADO (FETCH API)
// ==========================================

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
 * Crea la estructura DOM de una tarjeta de producto de forma explícita y segura (createElement/appendChild).
 * @param {Object} juego - Objeto con los datos del videojuego.
 * @returns {HTMLElement} Nodo de columna con la tarjeta completa.
 */
function crearTarjetaJuego(juego) {
    const columna = crearElemento('div', 'col-12 col-sm-6 col-lg-3 d-flex align-items-stretch');

    const tarjeta = crearElemento('div', 'card product-card w-100 position-relative');

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

    const boton = crearElemento('button', 'btn btn-outline-neon mt-auto', '', { type: 'button' });
    const iconoBoton = crearElemento('i', 'bi bi-cart-plus me-1');
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
 * Renderiza un mensaje de alerta orientador para el usuario en caso de error o advertencia.
 * @param {HTMLElement} contenedor - Contenedor donde se inserta el mensaje.
 * @param {string} titulo - Título descriptivo del error.
 * @param {string} detalle - Detalle orientador con sugerencias de acción.
 * @param {string} tipo - Tipo de alerta Bootstrap ('warning', 'danger', 'info').
 */
function mostrarMensajeOrientador(contenedor, titulo, detalle, tipo = 'warning') {
    contenedor.replaceChildren();

    const col = crearElemento('div', 'col-12');
    const alertBox = crearElemento('div', `alert alert-${tipo} text-center shadow-sm`);
    
    const icono = crearElemento('i', 'bi bi-exclamation-triangle-fill me-2 fs-5');
    const h5 = crearElemento('h5', 'alert-heading fw-bold mb-2', titulo);
    const p = crearElemento('p', 'mb-0 text-muted small', detalle);

    alertBox.appendChild(icono);
    alertBox.appendChild(h5);
    alertBox.appendChild(p);
    col.appendChild(alertBox);

    contenedor.appendChild(col);
}

/**
 * Carga productos desde el archivo JSON externo utilizando Fetch API, timeout, reintentos y manipulación segura del DOM.
 */
async function cargarCatalogoFetch() {
    const contenedor = document.getElementById('contenedor-catalogo-fetch');
    const spinner = document.getElementById('fetch-spinner');
    const btnCargar = document.getElementById('btn-cargar-juegos');

    if (!contenedor) return;

    // Actualización de estado visual mediante helpers reutilizables
    setSpinnerVisible(spinner, true);
    setBotonEstado(btnCargar, false, '<span class="spinner-border spinner-border-sm me-2"></span>Cargando catálogo...');

    try {
        // Llamada a la Fetch API con timeout (5s) y reintentos (2 intentos automáticos)
        const respuesta = await fetchConReintentos('assets/data/productos.json', {
            timeoutMs: 5000,
            reintentos: 2,
            retardoMs: 1000
        });

        // Procesar JSON
        const juegos = await respuesta.json();

        // Limpiar contenedor de forma segura antes de renderizar
        contenedor.replaceChildren();

        // Renderizado seguro y explícito en el DOM usando createElement y appendChild
        juegos.forEach((juego) => {
            const nodoJuego = crearTarjetaJuego(juego);
            contenedor.appendChild(nodoJuego);
        });

        // Re-asignar eventos a los nuevos elementos generados
        inicializarCarrito();
        inicializarEventosTarjetas();

        // Modificar el botón de carga con estado de éxito
        if (btnCargar) {
            setBotonEstado(btnCargar, true, '<i class="bi bi-check2-circle me-2"></i>Catálogo Actualizado');
            btnCargar.classList.replace('btn-neon', 'btn-outline-neon');
        }

    } catch (error) {
        console.error('Error al cargar el catálogo con Fetch API:', error);

        // Mensaje orientador claro para el usuario
        let orientacion = 'Por favor, asegúrate de estar ejecutando la aplicación desde un servidor local (ej: Live Server o http.server) y verifica tu conexión.';
        if (error.message.includes('timeout')) {
            orientacion = 'El servidor tardó demasiado en responder. Comprueba tu conexión a internet o intenta nuevamente en unos segundos.';
        }

        mostrarMensajeOrientador(
            contenedor,
            'No se pudo cargar el catálogo digital',
            `${error.message}. ${orientacion}`,
            'warning'
        );

        // Restaurar estado del botón para permitir reintentar manualmente
        if (btnCargar) {
            setBotonEstado(btnCargar, true, '<i class="bi bi-arrow-clockwise me-2"></i>Reintentar Carga');
            btnCargar.classList.replace('btn-outline-neon', 'btn-neon');
        }

    } finally {
        // Ocultar spinner mediante helper reutilizable
        setSpinnerVisible(spinner, false);
    }
}

