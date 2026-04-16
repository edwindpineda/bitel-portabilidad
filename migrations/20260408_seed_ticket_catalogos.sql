-- Seed de catalogos para el modulo de tickets de soporte
-- Ejecutar: node migrations/run_migration.js 20260408_seed_ticket_catalogos.sql

-- Estado Ticket
INSERT INTO estado_ticket (nombre, descripcion, color, es_inicial, es_final, orden)
VALUES
  ('Abierto', 'Ticket recien creado', '#3B82F6', true, false, 1),
  ('En Progreso', 'Ticket siendo atendido', '#F59E0B', false, false, 2),
  ('En Espera de Aprobacion', 'Ticket en espera de aprobacion', '#8B5CF6', false, false, 3),
  ('Resuelto', 'Ticket resuelto', '#10B981', false, true, 4),
  ('Cerrado', 'Ticket cerrado', '#6B7280', false, true, 5)
ON CONFLICT DO NOTHING;

-- Prioridad Ticket
INSERT INTO prioridad_ticket (nombre, descripcion, color, nivel, tiempo_respuesta_horas)
VALUES
  ('Baja', 'Prioridad baja', '#6B7280', 1, 72),
  ('Media', 'Prioridad media', '#3B82F6', 2, 48),
  ('Alta', 'Prioridad alta', '#F59E0B', 3, 24),
  ('Urgente', 'Prioridad urgente', '#EF4444', 4, 4)
ON CONFLICT DO NOTHING;

-- Categoria Soporte
INSERT INTO categoria_soporte (nombre, descripcion, color, icono, orden)
VALUES
  ('Problema Tecnico', 'Problemas tecnicos con la plataforma', '#EF4444', 'AlertTriangle', 1),
  ('Consulta General', 'Consultas generales sobre el servicio', '#3B82F6', 'HelpCircle', 2),
  ('Facturacion', 'Temas relacionados a facturacion y pagos', '#10B981', 'Receipt', 3),
  ('Portabilidad', 'Consultas sobre portabilidad numerica', '#8B5CF6', 'ArrowLeftRight', 4),
  ('Reclamo', 'Reclamos del servicio', '#F59E0B', 'MessageSquareWarning', 5)
ON CONFLICT DO NOTHING;
