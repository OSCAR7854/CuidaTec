// --- Mapa de Unidades de Salud con rutas ---
function inicializarMapaNicaragua() {
    if (!document.getElementById('mapa-nicaragua')) return;
    // Centrar el mapa en León, Nicaragua
    var mapa = L.map('mapa-nicaragua').setView([12.4333, -86.8797], 11);
    // Capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);

    // Plugin de rutas
    var routingControl;

    // Solo centros de salud del departamento de León
    const centrosSaludLeon = [
        {
            nombre: "Centro de Salud de León",
            tipo: "Centro de Salud",
            coords: [12.4333, -86.8797]
        },
        // Ejemplo de más centros (puedes agregar más aquí)
        {
            nombre: "Hospital Escuela Oscar Danilo Rosales",
            tipo: "Hospital",
            coords: [12.4372, -86.8787]
        },
        {
            nombre: "Clínica Periférica Sutiaba",
            tipo: "Clínica",
            coords: [12.4300, -86.8950]
        }
    ];
    // Dibujar rutas entre todos los centros de salud
    if (centrosSaludLeon.length > 1) {
        for (let i = 0; i < centrosSaludLeon.length - 1; i++) {
            const start = centrosSaludLeon[i].coords;
            const end = centrosSaludLeon[i + 1].coords;
            L.Routing.control({
                waypoints: [
                    L.latLng(start[0], start[1]),
                    L.latLng(end[0], end[1])
                ],
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: false,
                routeWhileDragging: false,
                show: false,
                createMarker: function() { return null; }
            }).addTo(mapa);
        }
    }

    // Almacenar la ubicación del usuario
    let ubicacionUsuario = null;

    // Función para trazar ruta desde usuario al destino
    window.trazarRuta = function(destinoCoords) {
        if (!ubicacionUsuario) {
            alert("Ubicación del usuario no disponible.");
            return;
        }
        // Si ya hay una ruta activa, eliminarla
        if (routingControl) {
            mapa.removeControl(routingControl);
        }
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(ubicacionUsuario.lat, ubicacionUsuario.lng),
                L.latLng(destinoCoords[0], destinoCoords[1])
            ],
            routeWhileDragging: false,
            show: true,
            language: 'es'
        }).addTo(mapa);
    };

    // Añadir marcadores al mapa solo de León
    centrosSaludLeon.forEach(c => {
        const marcador = L.marker(c.coords).addTo(mapa);
        marcador.bindPopup(`
            <strong>${c.nombre}</strong><br>
            ${c.tipo}<br><br>
            <button onclick="trazarRuta([${c.coords[0]}, ${c.coords[1]}])">Ver Ruta</button>
        `);
    });

    // Obtener ubicación del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            ubicacionUsuario = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };
            // Mostrar marcador del usuario
            L.marker([ubicacionUsuario.lat, ubicacionUsuario.lng], { icon: L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            })})
            .addTo(mapa)
            .bindPopup("Tu ubicación actual")
            .openPopup();
            mapa.setView([12.4333, -86.8797], 11);
        }, err => {
            alert("No se pudo obtener tu ubicación.");
            console.error(err);
        });
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}
// Lógica principal de la plataforma CuidaTec

document.addEventListener('DOMContentLoaded', function() {
    // --- Preclasificación de enfermedades y síntomas ---
    const enfermedades = [
        {
            nombre: "Gripe",
            sintomas: ["fiebre", "tos", "dolor de garganta", "congestión", "estornudos"],
            gravedad: "leve",
            recomendacion: "Descanso, líquidos y paracetamol si es necesario. No siempre requiere médico."
        },
        {
            nombre: "COVID-19",
            sintomas: ["fiebre", "tos seca", "cansancio", "pérdida de olfato", "dificultad para respirar"],
            gravedad: "moderado",
            recomendacion: "Es recomendable consultar a un médico si los síntomas empeoran."
        },
        {
            nombre: "Migraña",
            sintomas: ["dolor de cabeza", "náuseas", "sensibilidad a la luz", "mareos"],
            gravedad: "leve",
            recomendacion: "Descanso en un lugar oscuro y analgésicos comunes. Si es frecuente, acudir a un médico."
        },
        {
            nombre: "Neumonía",
            sintomas: ["fiebre alta", "escalofríos", "dolor en el pecho", "dificultad para respirar", "tos con flema"],
            gravedad: "grave",
            recomendacion: "Debe acudir a un médico lo antes posible."
        }
    ];

    const btnBuscar = document.getElementById("buscarEnfermedad");
    if (btnBuscar) {
        btnBuscar.addEventListener("click", () => {
            const input = document.getElementById("sintomas").value.toLowerCase();
            const sintomasUsuario = input.split(",").map(s => s.trim());
            let resultados = [];
            enfermedades.forEach(enf => {
                // Verificamos si al menos 1 síntoma coincide
                const coincidencias = enf.sintomas.filter(s => sintomasUsuario.includes(s));
                if (coincidencias.length > 0) {
                    resultados.push({
                        nombre: enf.nombre,
                        coincidencias: coincidencias,
                        gravedad: enf.gravedad,
                        recomendacion: enf.recomendacion
                    });
                }
            });
            mostrarResultadosEnfermedad(resultados);
        });
    }

    function mostrarResultadosEnfermedad(resultados) {
        const contenedor = document.getElementById("resultadoEnfermedad");
        if (!contenedor) return;
        contenedor.innerHTML = "";
        if (resultados.length === 0) {
            contenedor.innerHTML = "<p>No se encontraron coincidencias. Intente describir los síntomas de otra manera.</p>";
            return;
        }
        resultados.forEach(r => {
            const div = document.createElement("div");
            div.classList.add("resultado");
            div.innerHTML = `
                <h3>${r.nombre}</h3>
                <p><strong>Síntomas coincidentes:</strong> ${r.coincidencias.join(", ")}</p>
                <p><strong>Gravedad:</strong> ${r.gravedad}</p>
                <p><strong>Recomendación:</strong> ${r.recomendacion}</p>
            `;
            contenedor.appendChild(div);
        });
    }
    // Inicializar mapa solo cuando se muestra la sección de unidades
    const navUnidades = document.querySelector('a[href="#unidades"]');
    if (navUnidades) {
        navUnidades.addEventListener('click', function() {
            setTimeout(inicializarMapaNicaragua, 200); // Espera a que la sección sea visible
        });
    }
    // Ocultar contenido principal y navegación hasta login
    const main = document.querySelector('main');
    const nav = document.querySelector('nav');
    if (main) main.style.display = 'none';
    if (nav) nav.style.display = 'none';

    // Mostrar modal de login automáticamente
    const modalLogin = document.getElementById('modal-login');
    if (modalLogin) modalLogin.style.display = 'flex';

    // Botón de cerrar sesión
    const btnLogout = document.getElementById('btn-logout');

    // Modales de login y registro
    const btnLogin = document.getElementById('btn-login');
    const modalRegister = document.getElementById('modal-register');
    const closeLogin = document.getElementById('close-login');
    const closeRegister = document.getElementById('close-register');
    const linkToRegister = document.getElementById('link-to-register');
    const linkToLogin = document.getElementById('link-to-login');

    if (btnLogin) btnLogin.onclick = () => { modalLogin.style.display = 'flex'; };
    if (closeLogin) closeLogin.onclick = () => { modalLogin.style.display = 'none'; };
    if (closeRegister) closeRegister.onclick = () => { modalRegister.style.display = 'none'; };
    if (linkToRegister) linkToRegister.onclick = (e) => {
        e.preventDefault();
        modalLogin.style.display = 'none';
        modalRegister.style.display = 'flex';
    };
    if (linkToLogin) linkToLogin.onclick = (e) => {
        e.preventDefault();
        modalRegister.style.display = 'none';
        modalLogin.style.display = 'flex';
    };
    // Cerrar modal al hacer click fuera del contenido
    window.onclick = function(event) {
        if (event.target === modalLogin) modalLogin.style.display = 'none';
        if (event.target === modalRegister) modalRegister.style.display = 'none';
    };


    // Navegación entre secciones
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarSeccion(this.getAttribute('href').substring(1));
        });
    });

    // Lógica de login y registro simulada (localStorage)
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    if (formLogin) {
        formLogin.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const users = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                localStorage.setItem('usuarioActivo', JSON.stringify(user));
                modalLogin.style.display = 'none';
                if (main) main.style.display = '';
                if (nav) nav.style.display = '';
                if (btnLogout) btnLogout.style.display = '';
                if (btnLogin) btnLogin.style.display = 'none';
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        };
    }
    if (formRegister) {
        formRegister.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            let users = JSON.parse(localStorage.getItem('usuarios') || '[]');
            if (users.find(u => u.email === email)) {
                alert('El correo ya está registrado');
                return;
            }
            const newUser = { name, email, password };
            users.push(newUser);
            localStorage.setItem('usuarios', JSON.stringify(users));
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            modalRegister.style.display = 'none';
            modalLogin.style.display = 'flex';
        };
    }

    // Si ya hay sesión activa, mostrar contenido
    const usuarioActivo = localStorage.getItem('usuarioActivo');
    if (usuarioActivo) {
        if (main) main.style.display = '';
        if (nav) nav.style.display = '';
        if (modalLogin) modalLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = '';
        if (btnLogin) btnLogin.style.display = 'none';
    }

    // Cerrar sesión
    if (btnLogout) {
        btnLogout.onclick = function() {
            localStorage.removeItem('usuarioActivo');
            if (main) main.style.display = 'none';
            if (nav) nav.style.display = 'none';
            if (modalLogin) modalLogin.style.display = 'flex';
            btnLogout.style.display = 'none';
            if (btnLogin) btnLogin.style.display = '';
        };
    }

    // Chatbot
    const chatbotForm = document.getElementById('chatbot-form');
    if (chatbotForm) {
        chatbotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            enviarMensajeChatbot();
        });
    }
});

function mostrarSeccion(id) {
    document.querySelectorAll('main section').forEach(sec => {
        sec.style.display = (sec.id === id) ? 'block' : 'none';
    });
}

function enviarMensajeChatbot() {
    const input = document.getElementById('chatbot-text');
    const mensajes = document.getElementById('chatbot-messages');
    const texto = input.value.trim();
    if (!texto) return;
    agregarMensajeChat('usuario', texto);
    input.value = '';
    // Simulación de respuesta IA (aquí se integraría la API real)
    setTimeout(() => {
        agregarMensajeChat('bot', 'Estoy procesando tu consulta. Pronto recibirás una respuesta.');
    }, 1000);
}

function agregarMensajeChat(remitente, texto) {
    const mensajes = document.getElementById('chatbot-mensajes');
    const div = document.createElement('div');
    div.className = 'mensaje-' + remitente;
    div.textContent = texto;
    mensajes.appendChild(div);
    mensajes.scrollTop = mensajes.scrollHeight;
}
