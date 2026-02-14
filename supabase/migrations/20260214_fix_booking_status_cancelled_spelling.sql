-- Fix booking_status enum: rename 'canceled' to 'cancelled' to match application code.
-- PostgreSQL 10+ supports ALTER TYPE ... RENAME VALUE.
ALTER TYPE booking_status RENAME VALUE 'canceled' TO 'cancelled';
