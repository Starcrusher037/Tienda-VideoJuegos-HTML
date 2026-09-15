

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    inicializarCarrito();
    inicializarEventosTarjetas();
    inicializarFormularioContacto();
    inicializarCargaFetch();
});


// Estado del contador de compras
let totalProductosCarrito = 0;


function inicializarCarrito() {
    // Selección de botones "Agregar al carrito"
    const botonesCarrito = document.querySelectorAll('.product-card .btn');
    const badgeCarrito = document.getElementById('contador-carrito');

    botonesCarrito.forEach((boton) => {
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
            const tituloProducto = tarjeta ? tarjeta.querySelector('.card-title').textContent : 'Producto';

            // Notificación flotante dinámica (Toast / Alerta en DOM)
            mostrarNotificacion(`¡Añadiste "${tituloProducto}" a tus compras! 🎮`);
        });
    });
}




  
 
function mostrarNotificacion(mensaje) {
    // Contenedor de notificaciones
    let contenedorToast = document.getElementById('toast-container');
    if (!contenedorToast) {
        contenedorToast = document.createElement('div');
        contenedorToast.id = 'toast-container';
        contenedorToast.className = 'position-fixed bottom-0 end-0 p-3';
        contenedorToast.style.zIndex = '1080';
        document.body.appendChild(contenedorToast);
    }

    // Creación dinámica del elemento visual (DOM createElement)
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show shadow-lg text-dark fw-semibold';
    alerta.style.backgroundColor = 'var(--verde-neon, #00ff66)';
    alerta.style.border = 'none';
    alerta.setAttribute('role', 'alert');

    alerta.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>${mensaje}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;

    // Añadir al DOM
    contenedorToast.appendChild(alerta);

    // Eliminar del DOM después de 3.5 segundos
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 3500);
}



function inicializarEventosTarjetas() {
    const tarjetas = document.querySelectorAll('.product-card');

    tarjetas.forEach((tarjeta) => {
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

        // Simulación de envío exitoso manipulando el DOM
        if (mensajeEstado) {
            mensajeEstado.className = 'alert alert-success mt-3';
            mensajeEstado.innerHTML = `¡Gracias <strong>${nombre}</strong>! Tu consulta ha sido enviada con éxito. Te responderemos a <em>${email}</em>.`;
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


function inicializarCargaFetch() {
    const btnCargar = document.getElementById('btn-cargar-juegos');
    if (btnCargar) {
        btnCargar.addEventListener('click', () => {
            cargarCatalogoFetch();
        });
    }
}

/**
 * Carga productos desde el archivo JSON externo utilizando Fetch API y promesas (async/await)
 */
async function cargarCatalogoFetch() {
    const contenedor = document.getElementById('contenedor-catalogo-fetch');
    const spinner = document.getElementById('fetch-spinner');
    const btnCargar = document.getElementById('btn-cargar-juegos');

    if (!contenedor) return;

    // Mostrar spinner de carga
    if (spinner) spinner.classList.remove('d-none');
    if (btnCargar) btnCargar.disabled = true;

    try {
        // Llamada a la Fetch API
        const respuesta = await fetch('assets/data/productos.json');

        // Manejo de posibles errores de respuesta HTTP
        if (!respuesta.ok) {
            throw new Error(`Error en la solicitud: ${respuesta.status} - ${respuesta.statusText}`);
        }

        // Procesar JSON
        const juegos = await respuesta.json();

        // Limpiar contenedor antes de renderizar
        contenedor.innerHTML = '';

        // Renderizar dinámicamente en el DOM con createElement y appendChild
        juegos.forEach((juego) => {
            const columna = document.createElement('div');
            columna.className = 'col-12 col-sm-6 col-lg-3 d-flex align-items-stretch';

            // Estructura de tarjeta creada dinámicamente
            columna.innerHTML = `
                <div class="card product-card w-100 position-relative">
                    <span class="badge bg-success position-absolute top-0 end-0 m-3 fs-6">DIGITAL</span>
                    <div class="card-img-wrapper">
                        <img src="${juego.imagen}" class="card-img-top p-3" alt="${juego.titulo}" loading="lazy">
                    </div>
                    <div class="card-body d-flex flex-column text-center">
                        <span class="badge bg-dark text-info mb-2 align-self-center">${juego.categoria}</span>
                        <h3 class="card-title h5 text-neon">${juego.titulo}</h3>
                        <p class="card-text text-secondary flex-grow-1">${juego.descripcion}</p>
                        <p class="fw-bold text-light fs-5 mb-2">${juego.precio}</p>
                        <button type="button" class="btn btn-outline-neon mt-auto"><i class="bi bi-cart-plus me-1"></i> Agregar al carrito</button>
                    </div>
                </div>
            `;

            // Agregar al DOM
            contenedor.appendChild(columna);
        });

        // Re-asignar eventos de click y mouseover a los nuevos elementos generados
        inicializarCarrito();
        inicializarEventosTarjetas();

        // Modificar el botón de carga
        if (btnCargar) {
            btnCargar.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Catálogo Actualizado';
            btnCargar.classList.replace('btn-neon', 'btn-outline-neon');
        }

    } catch (error) {
        // Manejo de errores de carga o conexión
        console.error('Error al cargar los datos con Fetch API:', error);
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    No se pudieron cargar los datos dinámicos. Por favor, asegúrate de servir la página desde un servidor local (ej: Live Server o http.server).
                </div>
            </div>
        `;
    } finally {
        // Ocultar spinner
        if (spinner) spinner.classList.add('d-none');
    }
}
