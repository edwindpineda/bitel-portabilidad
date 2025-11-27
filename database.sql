-- Tabla para almacenar información de consumo de la API
CREATE TABLE IF NOT EXISTS cliente_rest(
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_usuario ENUM('user', 'developer') NOT NULL,
    fecha_consumo VARCHAR(255) UNIQUE NOT NULL,
    count_consumo INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- index para la columna fecha_consumo
    INDEX idx_fecha_consumo (fecha_consumo)
);



-- Tabla para almacenar información de contactos
CREATE TABLE IF NOT EXISTS tbl_contactos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    celular VARCHAR(255) NOT NULL UNIQUE,
    id_cliente_rest INT NOT NULL,
    count INT DEFAULT 0,
    incr_count INT DEFAULT 0 COMMENT 'Contador incremental de mensajes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índice para la columna celular
    INDEX idx_celular (celular),
    INDEX idx_id_cliente_rest (id_cliente_rest),
    INDEX idx_celular_id_cliente_rest (celular, id_cliente_rest),
    -- ON DELETE CASCADE
    FOREIGN KEY (id_cliente_rest) REFERENCES cliente_rest(id) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS tbl_historial_chat_ai(
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_contacto INT NOT NULL,
    input JSON NOT NULL,
    status_api VARCHAR(255) DEFAULT NULL COMMENT 'Estado de la respuesta de la API',
    costo_modelo DECIMAL(10,4) DEFAULT NULL COMMENT 'Costo del modelo',
    tkn_input INT DEFAULT NULL COMMENT 'Tokens de entrada',
    tkn_output INT DEFAULT NULL COMMENT 'Tokens de salida',
    nombre_modelo VARCHAR(255) DEFAULT NULL COMMENT 'Nombre del modelo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- ON DELETE CASCADE
    FOREIGN KEY (id_contacto) REFERENCES tbl_contactos(id) ON DELETE CASCADE,
    -- Índice para la columna id_contacto
    INDEX idx_id_contacto (id_contacto)
);


-- Tabla para almacenar los planes tarifarios de telefonía Bitel
CREATE TABLE IF NOT EXISTS tbl_planes_tarifarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del plan Bitel',
    tipo_plan ENUM('prepago', 'postpago', 'portabilidad') NOT NULL COMMENT 'Tipo de plan',
    precio_regular DECIMAL(10,2) NOT NULL COMMENT 'Precio regular del plan en soles',
    precio_promocional DECIMAL(10,2) DEFAULT NULL COMMENT 'Precio promocional (con descuento)',
    meses_promocion INT DEFAULT NULL COMMENT 'Duración de la promoción en meses',
    internet_ilimitado TINYINT(1) DEFAULT 0 COMMENT 'Internet ilimitado (1=sí, 0=no)',
    gigas_alta_velocidad INT DEFAULT NULL COMMENT 'GB en alta velocidad',
    minutos_ilimitados TINYINT(1) DEFAULT 0 COMMENT 'Minutos ilimitados (1=sí, 0=no)',
    sms_ilimitados TINYINT(1) DEFAULT 0 COMMENT 'SMS ilimitados (1=sí, 0=no)',
    gigas_acumulables TINYINT(1) DEFAULT 0 COMMENT 'GB acumulables (1=sí, 0=no)',
    bono_adicional VARCHAR(255) DEFAULT NULL COMMENT 'Bono adicional (ej: 30GB TikTok x 6 meses)',
    streaming_incluido VARCHAR(255) DEFAULT NULL COMMENT 'Servicios de streaming incluidos',
    vigencia_dias INT NOT NULL DEFAULT 30 COMMENT 'Vigencia del plan en días',
    descripcion TEXT COMMENT 'Descripción adicional del plan',
    requisitos TEXT COMMENT 'Requisitos para acceder al plan',
    activo TINYINT(1) DEFAULT 1 COMMENT 'Estado del plan (1=activo, 0=inactivo)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_nombre (nombre),
    INDEX idx_tipo_plan (tipo_plan),
    INDEX idx_activo (activo)
);

-- Insertar plan tarifario Bitel para portabilidad
INSERT INTO tbl_planes_tarifarios (nombre, tipo_plan, precio_regular, precio_promocional, meses_promocion, internet_ilimitado, gigas_alta_velocidad, minutos_ilimitados, sms_ilimitados, gigas_acumulables, bono_adicional, streaming_incluido, vigencia_dias, descripcion, requisitos, activo) VALUES
('Plan Portabilidad Bitel', 'portabilidad', 55.90, 27.90, 12, 1, 75, 1, 1, 1, '30GB para TikTok (x 6 meses)', 'Paramount+ Premium (x 6 meses), Bitel TV 360', 30, 'Plan de portabilidad con 50% de descuento por 12 meses. Internet ilimitado con 75GB en alta velocidad, llamadas y SMS ilimitados, GB acumulables.', 'Ser titular de la línea. Línea con mínimo 1 mes de antigüedad en operador actual. No tener recibo emitido en operador actual.', 1);


-- Tabla para almacenar FAQs de portabilidad Bitel
CREATE TABLE IF NOT EXISTS tbl_faq_portabilidad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero INT NOT NULL COMMENT 'Número de la pregunta',
    pregunta TEXT NOT NULL COMMENT 'Pregunta del cliente',
    proceso ENUM('Contacto', 'Toma de datos', 'Oferta', 'Cierre de ventas', 'Cierre de ventas (Contrato)', 'Aceptación') NOT NULL COMMENT 'Etapa del proceso de venta',
    respuesta TEXT NOT NULL COMMENT 'Respuesta sugerida para el agente',
    activo TINYINT(1) DEFAULT 1 COMMENT 'Estado de la FAQ (1=activo, 0=inactivo)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_proceso (proceso),
    INDEX idx_activo (activo)
);

-- Insertar FAQs de portabilidad Bitel 2025
INSERT INTO tbl_faq_portabilidad (numero, pregunta, proceso, respuesta, activo) VALUES
(1, '¿Esto es una promoción o me van a cambiar de operador?', 'Contacto', 'Este proceso es una portabilidad, lo que significa que tu número no cambia, pero sí lo hace el operador que te brinda el servicio, y con ello accedes a mejores beneficios. ¿Te interesa conservar tu número pero con más beneficios?', 1),
(2, '¿Qué datos necesitan?', 'Toma de datos', 'Solo necesitaremos tu nombre completo, número de DNI y dirección para procesar tu solicitud de manera segura y sin complicaciones. ¿Puedo tomar tus datos ahora para iniciar el registro?', 1),
(3, '¿Qué pasa si no quiero continuar?', 'Toma de datos', 'No te preocupes, esto no te compromete aún. Puedes decidirlo con calma antes de firmar el contrato, estamos para ayudarte a elegir lo mejor. ¿Te gustaría escuchar los beneficios antes de tomar tu decisión?', 1),
(4, '¿Qué incluye el plan que me ofrecen?', 'Oferta', 'El plan que te ofrecemos incluye Internet ilimitado, 75GB en alta velocidad, llamadas y SMS ilimitados, bono de 30GB para TikTok, Paramount+ y Bitel TV 360 por solo S/27.90 mensuales, y puedes conservar tu número sin costo adicional. ¿Te interesa asegurar esta promoción desde hoy?', 1),
(5, '¿Cuánto demora el cambio de operador?', 'Cierre de ventas (Contrato)', 'Una vez que confirmes tu decisión, el cambio se hará efectivo en un plazo máximo de 24 horas hábiles, y te enviaremos la confirmación correspondiente. ¿Quieres que lo activemos hoy mismo para que empieces a disfrutarlo mañana?', 1),
(6, '¿Tengo que pagar algo por hacer el cambio?', 'Cierre de ventas (Contrato)', 'El proceso de portabilidad es completamente gratuito, no tienes que pagar nada por el cambio; solo empezarás a pagar tu nuevo plan cuando esté activo. ¿Te gustaría aprovechar este beneficio sin ningún costo de cambio?', 1),
(7, '¿Qué pasa si tengo deuda con mi operador actual?', 'Cierre de ventas (Contrato)', 'La portabilidad podría no proceder si tienes una deuda activa con tu operador actual, pero si gustas, puedo ayudarte a verificarlo en este momento. ¿Te gustaría que revisemos eso juntos ahora mismo?', 1),
(8, '¿Puedo arrepentirme después de aceptar?', 'Aceptación', 'Si cambias de opinión antes de que se active el servicio, puedes cancelar la portabilidad sin problema; una vez activado, solo tendrás que esperar 30 días para hacer un nuevo cambio. ¿Prefieres asegurar el beneficio ahora y probar el servicio?', 1),
(9, '¿Voy a perder mi número?', 'Aceptación', 'Tu número se mantiene tal cual, eso no se modifica en ningún momento; lo único que cambia es el operador y, por supuesto, mejoras tu plan. ¿Te gustaría mantener tu número y mejorar todo lo demás?', 1),
(10, '¿Me llamarán otra vez?', 'Aceptación', 'Solo si es necesario validar datos adicionales se hará algún contacto, de lo contrario, te llegará la confirmación al finalizar el proceso. ¿Quieres que lo dejemos registrado ya para evitar demoras?', 1),
(11, '¿Y si ya acepté, qué sigue?', 'Aceptación', 'Un asesor se comunicará contigo para validar tu solicitud y confirmar el cambio, y también recibirás un mensaje o llamada de activación cuando todo esté listo. ¿Te gustaría dejarlo todo listo ahora y esperar solo la activación?', 1),
(12, '¿Me tienen que traer un chip nuevo?', 'Toma de datos', 'Sí, te llevamos el chip sin costo o puedes recogerlo cerquita. ¡Así activas tu nuevo plan lo más rápido posible! ¿Te gustaría que lo enviemos hoy mismo o prefieres recogerlo?', 1),
(13, '¿El cambio se hace automáticamente?', 'Cierre de ventas', 'Así es. Tú solo confirmas y nosotros nos encargamos. Es rápido, sin papeleos ni complicaciones. ¿Listo para dar el "conforme" y activarlo hoy mismo?', 1),
(14, '¿Qué operador soy mientras se procesa el cambio?', 'Cierre de ventas', 'Sigues usando tu línea normal hasta que se active el nuevo plan. Así no te quedas incomunicado en ningún momento. ¿Te parece bien que lo gestionemos ya para que no pierdas tiempo?', 1),
(15, '¿Puedo elegir el día del cambio?', 'Cierre de ventas', 'El cambio se hace rápido, entre hoy y mañana. Mientras antes confirmes, antes empiezas a disfrutar el nuevo plan. ¿Te gustaría que lo programemos ahora?', 1),
(16, '¿Qué pasa si no funciona el chip nuevo?', 'Aceptación', 'Estamos para ayudarte. Si hay algún detalle, te damos soporte inmediato para que no pierdas tiempo. ¿Te gustaría confirmar ahora y tener todo cubierto desde ya?', 1),
(17, '¿El nuevo plan es prepago o postpago?', 'Oferta', 'Es postpago, así tienes muchos más beneficios, más megas y mejores precios. ¡Te conviene muchísimo! ¿Te paso de una vez el detalle del plan para que lo aseguremos?', 1),
(18, '¿Me llega alguna confirmación?', 'Aceptación', 'Claro, recibirás un mensaje o llamada para que tengas todo claro. ¡Tu nueva experiencia empieza en breve! ¿Te gustaría que dejemos todo validado desde ya?', 1),
(19, '¿El nuevo chip tiene costo?', 'Toma de datos', 'Para nada. El chip va por nuestra cuenta, tú solo empiezas a disfrutar tu nuevo plan. ¿Te lo envío de una vez para que actives el beneficio?', 1),
(20, '¿Qué documentos necesito?', 'Toma de datos', 'Solo tu DNI. ¡Es rápido, fácil y en minutos dejamos todo listo! ¿Tienes tu DNI a la mano y lo dejamos activado hoy?', 1),
(21, '¿Puedo hacer portabilidad si soy menor de edad?', 'Contacto', 'Necesitamos que sea a nombre de un mayor de edad. ¿Hay alguien de confianza con quien podamos hacer el trámite para que no pierdas el beneficio?', 1),
(22, '¿Qué pasa si no me llega el chip?', 'Aceptación', 'Si hay algún retraso, lo solucionamos rápido. Lo importante es que ya aseguraste tu nuevo plan. ¿Confirmamos ahora y así te damos prioridad en el envío?', 1),
(23, '¿Hay algún compromiso de permanencia?', 'Oferta', 'Nada de ataduras. Solo esperamos 30 días para que pruebes todo lo que este plan te ofrece. ¡Pero seguro te quedas! ¿Confirmamos ahora para que empieces a disfrutarlo?', 1),
(24, '¿Puedo portar si mi línea está a nombre de otra persona?', 'Toma de datos', 'En ese caso, tendrías que ponerla a tu nombre. ¿Te ayudo con los pasos para hacerlo ya y no perder la oferta?', 1),
(25, '¿Mi saldo o paquetes actuales se trasladan al nuevo operador?', 'Cierre de ventas', 'Solo se cambia el operador, pero vas a ganar un plan más completo desde cero. ¡Es como reiniciar, pero con más beneficios! ¿Te gustaría empezar esta nueva experiencia hoy mismo?', 1),
(26, '¿Qué hago si quiero cancelar la portabilidad después de aceptar?', 'Aceptación', 'Si te arrepientes, podemos revisar. Pero te sugerimos probar el servicio, ¡seguro no querrás volver atrás! ¿Vamos dejando todo listo para que empieces ya?', 1);
