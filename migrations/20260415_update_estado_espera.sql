-- Actualizar nombre del estado "En Espera" a "En Espera de Aprobacion"
UPDATE estado_ticket
SET nombre = 'En Espera de Aprobacion',
    descripcion = 'Ticket en espera de aprobacion'
WHERE nombre = 'En Espera';
