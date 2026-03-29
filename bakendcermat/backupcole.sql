cd --
-- PostgreSQL database dump
--

\restrict bHOaL3SJ8G5sQvK4qHaIHWHQvW5jvjsuKSuS43a5ybOanrl5s9OonefaVLXPy6I

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-03-06 21:05:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 35 (class 2615 OID 16494)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- TOC entry 22 (class 2615 OID 16388)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- TOC entry 33 (class 2615 OID 16624)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- TOC entry 32 (class 2615 OID 16613)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- TOC entry 11 (class 2615 OID 16386)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- TOC entry 12 (class 2615 OID 16605)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- TOC entry 36 (class 2615 OID 16542)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- TOC entry 30 (class 2615 OID 16653)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- TOC entry 6 (class 3079 OID 16689)
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 4 (class 3079 OID 16443)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 5 (class 3079 OID 16654)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- TOC entry 7 (class 3079 OID 40590)
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 7
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- TOC entry 3 (class 3079 OID 16432)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1237 (class 1247 OID 16784)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- TOC entry 1261 (class 1247 OID 16925)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- TOC entry 1234 (class 1247 OID 16778)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1231 (class 1247 OID 16773)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1279 (class 1247 OID 17028)
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1291 (class 1247 OID 17101)
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1273 (class 1247 OID 17006)
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1282 (class 1247 OID 17038)
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1267 (class 1247 OID 16967)
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1405 (class 1247 OID 17936)
-- Name: announcement_audience; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.announcement_audience AS ENUM (
    'todos',
    'docentes',
    'estudiantes',
    'apoderados',
    'seccion_especifica'
);


ALTER TYPE public.announcement_audience OWNER TO postgres;

--
-- TOC entry 1402 (class 1247 OID 17926)
-- Name: announcement_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.announcement_status AS ENUM (
    'borrador',
    'pendiente_aprobacion',
    'publicado',
    'archivado'
);


ALTER TYPE public.announcement_status OWNER TO postgres;

--
-- TOC entry 1378 (class 1247 OID 17762)
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendance_status AS ENUM (
    'presente',
    'tarde',
    'falta',
    'justificado'
);


ALTER TYPE public.attendance_status OWNER TO postgres;

--
-- TOC entry 1468 (class 1247 OID 21972)
-- Name: audit_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_action AS ENUM (
    'insert',
    'update',
    'delete',
    'publish',
    'approve',
    'reject',
    'close'
);


ALTER TYPE public.audit_action OWNER TO postgres;

--
-- TOC entry 1414 (class 1247 OID 17988)
-- Name: charge_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.charge_status AS ENUM (
    'pendiente',
    'pagado_parcial',
    'pagado',
    'vencido'
);


ALTER TYPE public.charge_status OWNER TO postgres;

--
-- TOC entry 1411 (class 1247 OID 17976)
-- Name: charge_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.charge_type AS ENUM (
    'matricula',
    'pension',
    'material',
    'uniforme',
    'otro'
);


ALTER TYPE public.charge_type OWNER TO postgres;

--
-- TOC entry 1477 (class 1247 OID 26068)
-- Name: concept_periodicity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.concept_periodicity AS ENUM (
    'unico',
    'mensual',
    'anual',
    'opcional'
);


ALTER TYPE public.concept_periodicity OWNER TO postgres;

--
-- TOC entry 1474 (class 1247 OID 26052)
-- Name: concept_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.concept_type AS ENUM (
    'matricula',
    'pension',
    'interes',
    'certificado',
    'taller',
    'servicio',
    'otro'
);


ALTER TYPE public.concept_type OWNER TO postgres;

--
-- TOC entry 1483 (class 1247 OID 26084)
-- Name: discount_scope; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.discount_scope AS ENUM (
    'todos',
    'pension',
    'matricula',
    'especifico'
);


ALTER TYPE public.discount_scope OWNER TO postgres;

--
-- TOC entry 1480 (class 1247 OID 26078)
-- Name: discount_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.discount_type AS ENUM (
    'porcentaje',
    'monto_fijo'
);


ALTER TYPE public.discount_type OWNER TO postgres;

--
-- TOC entry 1348 (class 1247 OID 17569)
-- Name: education_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.education_level AS ENUM (
    'inicial',
    'primaria',
    'secundaria'
);


ALTER TYPE public.education_level OWNER TO postgres;

--
-- TOC entry 1384 (class 1247 OID 17806)
-- Name: evaluation_grade; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.evaluation_grade AS ENUM (
    'AD',
    'A',
    'B',
    'C'
);


ALTER TYPE public.evaluation_grade OWNER TO postgres;

--
-- TOC entry 1387 (class 1247 OID 17816)
-- Name: evaluation_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.evaluation_status AS ENUM (
    'borrador',
    'publicada',
    'cerrada'
);


ALTER TYPE public.evaluation_status OWNER TO postgres;

--
-- TOC entry 1438 (class 1247 OID 21610)
-- Name: justification_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.justification_status AS ENUM (
    'pendiente',
    'aprobada',
    'rechazada'
);


ALTER TYPE public.justification_status OWNER TO postgres;

--
-- TOC entry 1462 (class 1247 OID 21946)
-- Name: notification_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_status AS ENUM (
    'no_leida',
    'leida'
);


ALTER TYPE public.notification_status OWNER TO postgres;

--
-- TOC entry 1459 (class 1247 OID 21930)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'evaluacion_publicada',
    'justificacion_aprobada',
    'justificacion_rechazada',
    'pago_registrado',
    'comunicado_nuevo',
    'tarea_nueva',
    'recordatorio_pago'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- TOC entry 1420 (class 1247 OID 18025)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'efectivo',
    'transferencia',
    'tarjeta',
    'yape',
    'plin',
    'pasarela'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 1534 (class 1247 OID 40606)
-- Name: public_news_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.public_news_category AS ENUM (
    'institucional',
    'academico',
    'eventos',
    'deportes',
    'tecnologia',
    'admisiones',
    'logros',
    'comunidad',
    'otro'
);


ALTER TYPE public.public_news_category OWNER TO postgres;

--
-- TOC entry 1531 (class 1247 OID 40598)
-- Name: public_news_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.public_news_status AS ENUM (
    'borrador',
    'publicado',
    'archivado'
);


ALTER TYPE public.public_news_status OWNER TO postgres;

--
-- TOC entry 1396 (class 1247 OID 17888)
-- Name: submission_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.submission_status AS ENUM (
    'pendiente',
    'entregada',
    'revisada',
    'atrasada'
);


ALTER TYPE public.submission_status OWNER TO postgres;

--
-- TOC entry 1333 (class 1247 OID 17503)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'director',
    'coordinator',
    'secretary',
    'teacher',
    'student',
    'guardian',
    'finance',
    'cashier',
    'web_editor'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 1324 (class 1247 OID 17354)
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- TOC entry 1315 (class 1247 OID 17310)
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- TOC entry 1318 (class 1247 OID 17325)
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- TOC entry 1330 (class 1247 OID 17396)
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- TOC entry 1327 (class 1247 OID 17367)
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- TOC entry 1300 (class 1247 OID 17236)
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- TOC entry 484 (class 1255 OID 16540)
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 484
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- TOC entry 493 (class 1255 OID 16755)
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- TOC entry 442 (class 1255 OID 16539)
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 442
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- TOC entry 456 (class 1255 OID 16538)
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 456
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- TOC entry 526 (class 1255 OID 16597)
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 526
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- TOC entry 506 (class 1255 OID 16618)
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 506
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- TOC entry 474 (class 1255 OID 16599)
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 474
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- TOC entry 435 (class 1255 OID 16609)
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- TOC entry 543 (class 1255 OID 16610)
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- TOC entry 448 (class 1255 OID 16620)
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 448
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- TOC entry 487 (class 1255 OID 16387)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- TOC entry 470 (class 1255 OID 22212)
-- Name: activate_user(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.activate_user(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar que quien ejecuta es admin/director
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'director')
  ) THEN
    RAISE EXCEPTION 'No autorizado para activar usuarios';
  END IF;

  -- Activar usuario
  UPDATE profiles
  SET is_active = true
  WHERE id = p_user_id;

  RETURN true;
END;
$$;


ALTER FUNCTION public.activate_user(p_user_id uuid) OWNER TO postgres;

--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 470
-- Name: FUNCTION activate_user(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.activate_user(p_user_id uuid) IS 'Activa un usuario (solo admin/director)';


--
-- TOC entry 434 (class 1255 OID 23626)
-- Name: approve_enrollment_application(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid) RETURNS TABLE(success boolean, message text, student_id uuid, guardian_id uuid, user_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  v_application RECORD;
  v_guardian_id UUID;
  v_student_id UUID;
  v_user_id UUID;
  v_student_code TEXT;
  v_temp_password TEXT;
  v_academic_year_id UUID;
BEGIN
  -- Obtener datos de la solicitud
  SELECT * INTO v_application
  FROM enrollment_applications
  WHERE id = p_application_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Solicitud no encontrada o ya procesada'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Verificar que la sección corresponde al grado solicitado
  IF NOT EXISTS (
    SELECT 1 FROM sections s
    WHERE s.id = p_section_id AND s.grade_level_id = v_application.grade_level_id
  ) THEN
    RETURN QUERY SELECT false, 'La sección no corresponde al grado solicitado'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Obtener año académico activo
  SELECT id INTO v_academic_year_id
  FROM academic_years
  WHERE is_active = TRUE
  LIMIT 1;
  
  IF v_academic_year_id IS NULL THEN
    RETURN QUERY SELECT false, 'No hay año académico activo'::TEXT, NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- 1. Crear o buscar apoderado
  SELECT id INTO v_guardian_id
  FROM guardians
  WHERE dni = v_application.guardian_document_number
  LIMIT 1;
  
  IF v_guardian_id IS NULL THEN
    -- Crear apoderado SIN usuario (se creará después desde el frontend/admin)
    -- La creación de usuarios de Supabase Auth debe hacerse desde el API, no desde SQL
    INSERT INTO guardians (
      user_id,
      first_name,
      last_name,
      dni,
      phone,
      email,
      address,
      relationship
    ) VALUES (
      NULL,  -- user_id se asignará cuando el admin cree el usuario manualmente
      v_application.guardian_first_name,
      v_application.guardian_last_name,
      v_application.guardian_document_number,
      v_application.guardian_phone,
      v_application.guardian_email,
      v_application.guardian_address,
      v_application.guardian_relationship
    )
    RETURNING id INTO v_guardian_id;
  END IF;
  
  -- 2. Generar código de estudiante
  v_student_code := 'EST' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(student_code FROM 4) AS INTEGER)), 0) + 1
     FROM students
     WHERE student_code ~ '^EST[0-9]+$')::TEXT,
    6, '0'
  );
  
  -- NOTA: La creación del usuario de Supabase Auth debe hacerse desde el frontend
  -- porque no tenemos acceso directo a auth.users desde funciones SQL.
  -- El frontend deberá llamar a supabase.auth.admin.createUser() después de esta función.
  
  -- 3. Crear estudiante (sin user_id, se asignará después desde el frontend)
  INSERT INTO students (
    user_id,
    section_id,
    student_code,
    first_name,
    last_name,
    dni,
    birth_date,
    gender,
    address,
    photo_url,
    enrollment_date,
    status
  ) VALUES (
    NULL,  -- user_id se asignará cuando el admin cree el usuario manualmente o desde frontend
    p_section_id,
    v_student_code,
    v_application.student_first_name,
    v_application.student_last_name,
    v_application.student_document_number,  -- Se guarda en dni
    v_application.student_birth_date,
    v_application.student_gender,
    v_application.student_address,
    v_application.student_photo_url,
    now(),
    'active'
  )
  RETURNING id INTO v_student_id;
  
  -- 4. Crear relación estudiante-apoderado
  INSERT INTO student_guardians (
    student_id,
    guardian_id,
    is_primary
  ) VALUES (
    v_student_id,
    v_guardian_id,
    true  -- Primer apoderado es principal
  );
  
  -- 5. Actualizar solicitud
  UPDATE enrollment_applications
  SET
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = p_approved_by
  WHERE id = p_application_id;
  
  -- 6. Verificar que el trigger haya inscrito al estudiante en cursos
  -- (El trigger auto_enroll_student_to_section_courses debería ejecutarse automáticamente)
  PERFORM pg_sleep(0.1); -- Pequeña pausa para asegurar que el trigger se complete
  
  -- 7. Crear notificación para el apoderado (solo si tiene usuario)
  -- Obtener user_id del guardian si existe
  SELECT g.user_id INTO v_user_id FROM guardians g WHERE g.id = v_guardian_id;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      status
    ) VALUES (
      v_user_id,
      'matricula_aprobada',
      'Matrícula Aprobada',
      'La solicitud de matrícula para ' || v_application.student_first_name || ' ' || v_application.student_last_name || ' ha sido aprobada. Código: ' || v_student_code,
      'enrollment_application',
      p_application_id,
      'unread'
    );
  END IF;
  
  -- Retornar éxito con IDs
  RETURN QUERY SELECT true, 'Matrícula aprobada exitosamente. Estudiante inscrito en ' || 
    (SELECT COUNT(*)::TEXT FROM student_course_enrollments sce WHERE sce.student_id = v_student_id AND sce.status = 'active') || 
    ' cursos.'::TEXT, v_student_id, v_guardian_id, v_user_id;
END;
$_$;


ALTER FUNCTION public.approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid) OWNER TO postgres;

--
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 434
-- Name: FUNCTION approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid) IS 'Aprueba una solicitud de matrícula, crea estudiante y apoderado, y usa student_guardians en lugar de guardian_id directo. El trigger auto_enroll_student_to_section_courses inscribe automáticamente al estudiante en los cursos de su sección.';


--
-- TOC entry 523 (class 1255 OID 22014)
-- Name: audit_and_notify_payment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_and_notify_payment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_student_id uuid;
  v_guardian_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Auditar el pago
    PERFORM create_audit_log(
      NEW.received_by,
      'insert'::audit_action,
      'payment',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      NEW.notes
    );
    
    -- Obtener student_id y notificar al apoderado
    v_student_id := NEW.student_id;
    
    -- Buscar apoderado principal
    SELECT g.user_id INTO v_guardian_user_id
    FROM student_guardians sg
    JOIN guardians g ON g.id = sg.guardian_id
    WHERE sg.student_id = v_student_id AND sg.is_primary = true
    LIMIT 1;
    
    IF v_guardian_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_guardian_user_id,
        'pago_registrado'::notification_type,
        'Pago registrado exitosamente',
        'Se ha registrado un pago de S/ ' || NEW.amount::text,
        'payment',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_and_notify_payment() OWNER TO postgres;

--
-- TOC entry 561 (class 1255 OID 22010)
-- Name: audit_evaluation_changes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_evaluation_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_student_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Solo auditar si cambió el grado o el estado
    IF OLD.grade IS DISTINCT FROM NEW.grade OR OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM create_audit_log(
        NEW.recorded_by,
        'update'::audit_action,
        'evaluation',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        NULL
      );
      
      -- Si se publicó, notificar al estudiante y apoderados
      IF OLD.status = 'borrador' AND NEW.status = 'publicada' THEN
        -- Obtener user_id del estudiante de forma segura
        SELECT user_id INTO v_student_user_id
        FROM students
        WHERE id = NEW.student_id;
        
        -- Solo crear notificación si el estudiante tiene user_id
        IF v_student_user_id IS NOT NULL THEN
          PERFORM create_notification(
            v_student_user_id,
            'evaluacion_publicada'::notification_type,
            'Nueva calificación publicada',
            'Se ha publicado una nueva calificación en ' || (SELECT name FROM courses WHERE id = NEW.course_id),
            'evaluation',
            NEW.id
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_evaluation_changes() OWNER TO postgres;

--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 561
-- Name: FUNCTION audit_evaluation_changes(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_evaluation_changes() IS 'Auditoria cambios en evaluaciones y notifica cuando se publican. Solo crea notificaciones si el estudiante tiene user_id.';


--
-- TOC entry 471 (class 1255 OID 23248)
-- Name: auto_enroll_student_to_section_courses(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_enroll_student_to_section_courses() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_academic_year_id UUID;
  v_course RECORD;
BEGIN
  -- Solo procesar cuando se asigna o cambia de sección (y el estudiante está activo)
  IF (NEW.section_id IS NOT NULL AND NEW.status = 'active') AND 
     (OLD IS NULL OR OLD.section_id IS DISTINCT FROM NEW.section_id OR OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Obtener año académico activo
    SELECT id INTO v_academic_year_id
    FROM academic_years
    WHERE is_active = TRUE
    LIMIT 1;
    
    IF v_academic_year_id IS NULL THEN
      RAISE EXCEPTION 'No hay año académico activo';
    END IF;
    
    -- Si cambió de sección, marcar cursos antiguos como dropped
    IF OLD IS NOT NULL AND OLD.section_id IS NOT NULL AND OLD.section_id != NEW.section_id THEN
      UPDATE student_course_enrollments
      SET status = 'dropped'
      WHERE student_id = NEW.id 
        AND section_id = OLD.section_id
        AND academic_year_id = v_academic_year_id
        AND status = 'active';
    END IF;
    
    -- Inscribir en todos los cursos asignados a la nueva sección
    FOR v_course IN
      SELECT DISTINCT course_id
      FROM teacher_course_assignments
      WHERE section_id = NEW.section_id
        AND academic_year_id = v_academic_year_id
        AND is_active = TRUE
    LOOP
      -- Insertar solo si no existe
      INSERT INTO student_course_enrollments (
        student_id,
        course_id,
        section_id,
        academic_year_id,
        status
      ) VALUES (
        NEW.id,
        v_course.course_id,
        NEW.section_id,
        v_academic_year_id,
        'active'
      )
      ON CONFLICT (student_id, course_id, academic_year_id) 
      DO UPDATE SET 
        status = 'active',
        section_id = NEW.section_id,
        enrollment_date = NOW();
    END LOOP;
  END IF;
  
  -- Si el estudiante se retira, marcar todos sus cursos como dropped
  IF NEW.status != 'active' AND (OLD IS NULL OR OLD.status != NEW.status) THEN
    UPDATE student_course_enrollments
    SET status = 'dropped'
    WHERE student_id = NEW.id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_enroll_student_to_section_courses() OWNER TO postgres;

--
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 471
-- Name: FUNCTION auto_enroll_student_to_section_courses(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.auto_enroll_student_to_section_courses() IS 'Auto-inscribe al estudiante en todos los cursos de su sección cuando se matricula';


--
-- TOC entry 439 (class 1255 OID 34917)
-- Name: check_schedule_overlap(uuid, integer, time without time zone, time without time zone, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_schedule_overlap(p_section_id uuid, p_day_of_week integer, p_start_time time without time zone, p_end_time time without time zone, p_schedule_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO overlap_count
    FROM course_schedules
    WHERE section_id = p_section_id
    AND day_of_week = p_day_of_week
    AND (p_schedule_id IS NULL OR id != p_schedule_id)
    AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < p_end_time AND end_time >= p_end_time) OR
        (start_time >= p_start_time AND end_time <= p_end_time)
    );
    
    RETURN overlap_count > 0;
END;
$$;


ALTER FUNCTION public.check_schedule_overlap(p_section_id uuid, p_day_of_week integer, p_start_time time without time zone, p_end_time time without time zone, p_schedule_id uuid) OWNER TO postgres;

--
-- TOC entry 512 (class 1255 OID 22009)
-- Name: create_audit_log(uuid, public.audit_action, text, uuid, jsonb, jsonb, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_audit_log(p_user_id uuid, p_action public.audit_action, p_entity_type text, p_entity_id uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_reason text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    reason
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_reason
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;


ALTER FUNCTION public.create_audit_log(p_user_id uuid, p_action public.audit_action, p_entity_type text, p_entity_id uuid, p_old_values jsonb, p_new_values jsonb, p_reason text) OWNER TO postgres;

--
-- TOC entry 465 (class 1255 OID 22008)
-- Name: create_notification(uuid, public.notification_type, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION public.create_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text, p_entity_type text, p_entity_id uuid) OWNER TO postgres;

--
-- TOC entry 478 (class 1255 OID 22210)
-- Name: create_user_with_profile(text, text, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_user_with_profile(p_email text, p_password text, p_role text, p_first_name text, p_last_name text, p_created_by uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Nota: La creación real del usuario en auth.users debe hacerse
  -- desde el servidor con la API de Supabase Auth (no desde SQL)
  -- Esta función solo prepara la estructura

  -- Validar rol
  IF p_role NOT IN ('admin', 'director', 'coordinator', 'secretary', 'teacher', 'student', 'guardian', 'finance', 'cashier', 'web_editor') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_role;
  END IF;

  -- Retornar estructura esperada
  v_result := json_build_object(
    'success', true,
    'message', 'Usar Supabase Admin API para crear usuario en auth.users',
    'email', p_email,
    'role', p_role,
    'first_name', p_first_name,
    'last_name', p_last_name
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION public.create_user_with_profile(p_email text, p_password text, p_role text, p_first_name text, p_last_name text, p_created_by uuid) OWNER TO postgres;

--
-- TOC entry 539 (class 1255 OID 22211)
-- Name: deactivate_user(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.deactivate_user(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Verificar que quien ejecuta es admin/director
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'director')
  ) THEN
    RAISE EXCEPTION 'No autorizado para desactivar usuarios';
  END IF;

  -- Desactivar usuario
  UPDATE profiles
  SET is_active = false
  WHERE id = p_user_id;

  RETURN true;
END;
$$;


ALTER FUNCTION public.deactivate_user(p_user_id uuid) OWNER TO postgres;

--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 539
-- Name: FUNCTION deactivate_user(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.deactivate_user(p_user_id uuid) IS 'Desactiva un usuario (solo admin/director)';


--
-- TOC entry 515 (class 1255 OID 40660)
-- Name: generate_news_slug(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_news_slug() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  base_slug text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Intentar usar unaccent si está disponible, sino usar el título directamente
    BEGIN
      base_slug := unaccent(NEW.title);
    EXCEPTION WHEN undefined_function THEN
      base_slug := NEW.title;
    END;
    
    -- Limpiar el slug: minúsculas, solo alfanuméricos y guiones
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          base_slug,
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    ) || '-' || substring(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_news_slug() OWNER TO postgres;

--
-- TOC entry 441 (class 1255 OID 23167)
-- Name: get_teacher_course_load(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_teacher_course_load(p_teacher_id uuid, p_academic_year_id uuid) RETURNS TABLE(course_name character varying, section_name character varying, grade_level_name character varying, total_assignments bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name AS course_name,
    s.section_letter AS section_name,
    gl.name AS grade_level_name,
    COUNT(*) AS total_assignments
  FROM teacher_course_assignments tca
  INNER JOIN courses c ON tca.course_id = c.id
  INNER JOIN sections s ON tca.section_id = s.id
  INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
  WHERE tca.teacher_id = p_teacher_id
    AND tca.academic_year_id = p_academic_year_id
    AND tca.is_active = TRUE
  GROUP BY c.name, s.name, gl.name
  ORDER BY gl.name, s.name, c.name;
END;
$$;


ALTER FUNCTION public.get_teacher_course_load(p_teacher_id uuid, p_academic_year_id uuid) OWNER TO postgres;

--
-- TOC entry 433 (class 1255 OID 22262)
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_role(user_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM profiles WHERE id = user_id LIMIT 1;
$$;


ALTER FUNCTION public.get_user_role(user_id uuid) OWNER TO postgres;

--
-- TOC entry 521 (class 1255 OID 22012)
-- Name: notify_justification_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_justification_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_guardian_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Auditar el cambio
    PERFORM create_audit_log(
      NEW.reviewed_by,
      CASE 
        WHEN NEW.status = 'aprobada' THEN 'approve'::audit_action
        WHEN NEW.status = 'rechazada' THEN 'reject'::audit_action
        ELSE 'update'::audit_action
      END,
      'attendance_justification',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.review_notes
    );
    
    -- Notificar al apoderado solo si tiene user_id
    IF NEW.status IN ('aprobada', 'rechazada') AND NEW.guardian_id IS NOT NULL THEN
      SELECT user_id INTO v_guardian_user_id
      FROM guardians
      WHERE id = NEW.guardian_id;
      
      IF v_guardian_user_id IS NOT NULL THEN
        PERFORM create_notification(
          v_guardian_user_id,
          CASE 
            WHEN NEW.status = 'aprobada' THEN 'justificacion_aprobada'::notification_type
            ELSE 'justificacion_rechazada'::notification_type
          END,
          'Justificación ' || NEW.status,
          'Su justificación de inasistencia ha sido ' || NEW.status,
          'justification',
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_justification_status() OWNER TO postgres;

--
-- TOC entry 5305 (class 0 OID 0)
-- Dependencies: 521
-- Name: FUNCTION notify_justification_status(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.notify_justification_status() IS 'Auditoria cambios en justificaciones y notifica al apoderado. Solo crea notificaciones si el apoderado tiene user_id.';


--
-- TOC entry 457 (class 1255 OID 23250)
-- Name: sync_student_enrollments_on_teacher_assignment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_student_enrollments_on_teacher_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_student RECORD;
BEGIN
  -- Solo procesar cuando se crea o activa una asignación
  IF NEW.is_active = TRUE AND (OLD IS NULL OR OLD.is_active = FALSE) THEN
    
    -- Inscribir a todos los estudiantes activos de esa sección en el curso
    FOR v_student IN
      SELECT id
      FROM students
      WHERE section_id = NEW.section_id
        AND status = 'active'
    LOOP
      INSERT INTO student_course_enrollments (
        student_id,
        course_id,
        section_id,
        academic_year_id,
        status
      ) VALUES (
        v_student.id,
        NEW.course_id,
        NEW.section_id,
        NEW.academic_year_id,
        'active'
      )
      ON CONFLICT (student_id, course_id, academic_year_id) 
      DO UPDATE SET 
        status = 'active',
        section_id = NEW.section_id,
        enrollment_date = NOW();
    END LOOP;
  END IF;
  
  -- Si se desactiva la asignación, marcar inscripciones como dropped
  IF NEW.is_active = FALSE AND (OLD IS NULL OR OLD.is_active = TRUE) THEN
    UPDATE student_course_enrollments
    SET status = 'dropped'
    WHERE course_id = NEW.course_id
      AND section_id = NEW.section_id
      AND academic_year_id = NEW.academic_year_id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_student_enrollments_on_teacher_assignment() OWNER TO postgres;

--
-- TOC entry 5307 (class 0 OID 0)
-- Dependencies: 457
-- Name: FUNCTION sync_student_enrollments_on_teacher_assignment(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sync_student_enrollments_on_teacher_assignment() IS 'Sincroniza inscripciones cuando se asigna un nuevo curso a una sección';


--
-- TOC entry 449 (class 1255 OID 34915)
-- Name: update_course_schedules_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_course_schedules_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_course_schedules_updated_at() OWNER TO postgres;

--
-- TOC entry 501 (class 1255 OID 23112)
-- Name: update_enrollment_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_enrollment_applications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_enrollment_applications_updated_at() OWNER TO postgres;

--
-- TOC entry 496 (class 1255 OID 22180)
-- Name: update_profiles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_profiles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_profiles_updated_at() OWNER TO postgres;

--
-- TOC entry 559 (class 1255 OID 40662)
-- Name: update_public_news_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_public_news_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_public_news_updated_at() OWNER TO postgres;

--
-- TOC entry 486 (class 1255 OID 23246)
-- Name: update_student_course_enrollments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_student_course_enrollments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_student_course_enrollments_updated_at() OWNER TO postgres;

--
-- TOC entry 503 (class 1255 OID 23064)
-- Name: update_task_submissions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_task_submissions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_task_submissions_updated_at() OWNER TO postgres;

--
-- TOC entry 567 (class 1255 OID 23163)
-- Name: update_teacher_assignments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_teacher_assignments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_teacher_assignments_updated_at() OWNER TO postgres;

--
-- TOC entry 460 (class 1255 OID 23165)
-- Name: validate_teacher_course_limit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_teacher_course_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_course_count INTEGER;
  max_courses_per_teacher INTEGER := 6;
BEGIN
  SELECT COUNT(DISTINCT course_id)
  INTO current_course_count
  FROM teacher_course_assignments
  WHERE teacher_id = NEW.teacher_id
    AND academic_year_id = NEW.academic_year_id
    AND is_active = TRUE
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF current_course_count >= max_courses_per_teacher THEN
    RAISE EXCEPTION 'El docente ya tiene % cursos asignados. Máximo permitido: %', 
      current_course_count, max_courses_per_teacher;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_teacher_course_limit() OWNER TO postgres;

--
-- TOC entry 514 (class 1255 OID 17389)
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- TOC entry 440 (class 1255 OID 17470)
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- TOC entry 475 (class 1255 OID 17402)
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- TOC entry 443 (class 1255 OID 17351)
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- TOC entry 533 (class 1255 OID 17342)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- TOC entry 570 (class 1255 OID 17397)
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- TOC entry 463 (class 1255 OID 17410)
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- TOC entry 495 (class 1255 OID 17341)
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- TOC entry 516 (class 1255 OID 17469)
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- TOC entry 571 (class 1255 OID 17339)
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- TOC entry 502 (class 1255 OID 17378)
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- TOC entry 438 (class 1255 OID 17463)
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- TOC entry 529 (class 1255 OID 17140)
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- TOC entry 489 (class 1255 OID 17255)
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- TOC entry 476 (class 1255 OID 17233)
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- TOC entry 548 (class 1255 OID 17114)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 498 (class 1255 OID 17113)
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 461 (class 1255 OID 17112)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 494 (class 1255 OID 80403)
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- TOC entry 500 (class 1255 OID 17196)
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 527 (class 1255 OID 17212)
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 537 (class 1255 OID 17213)
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 491 (class 1255 OID 17231)
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- TOC entry 549 (class 1255 OID 17179)
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- TOC entry 568 (class 1255 OID 80404)
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- TOC entry 518 (class 1255 OID 17195)
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- TOC entry 530 (class 1255 OID 80409)
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- TOC entry 517 (class 1255 OID 17129)
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- TOC entry 509 (class 1255 OID 80407)
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- TOC entry 531 (class 1255 OID 17229)
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- TOC entry 483 (class 1255 OID 17253)
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- TOC entry 525 (class 1255 OID 17130)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 347 (class 1259 OID 16525)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 347
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- TOC entry 427 (class 1259 OID 90159)
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 364 (class 1259 OID 16929)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 364
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- TOC entry 355 (class 1259 OID 16727)
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 355
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 355
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- TOC entry 346 (class 1259 OID 16518)
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 346
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- TOC entry 359 (class 1259 OID 16816)
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 359
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- TOC entry 358 (class 1259 OID 16804)
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 358
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- TOC entry 357 (class 1259 OID 16791)
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 357
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 357
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- TOC entry 367 (class 1259 OID 17041)
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- TOC entry 420 (class 1259 OID 30401)
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 420
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- TOC entry 366 (class 1259 OID 17011)
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- TOC entry 368 (class 1259 OID 17074)
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- TOC entry 365 (class 1259 OID 16979)
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 345 (class 1259 OID 16507)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 345
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- TOC entry 344 (class 1259 OID 16506)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 344
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 362 (class 1259 OID 16858)
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 362
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- TOC entry 363 (class 1259 OID 16876)
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 363
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- TOC entry 348 (class 1259 OID 16533)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 348
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- TOC entry 356 (class 1259 OID 16757)
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 356
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 356
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 356
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 356
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- TOC entry 361 (class 1259 OID 16843)
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 361
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- TOC entry 360 (class 1259 OID 16834)
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 360
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 360
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- TOC entry 343 (class 1259 OID 16495)
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 343
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 343
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- TOC entry 382 (class 1259 OID 17541)
-- Name: academic_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_years (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    year integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.academic_years OWNER TO postgres;

--
-- TOC entry 397 (class 1259 OID 17947)
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    audience public.announcement_audience DEFAULT 'todos'::public.announcement_audience NOT NULL,
    section_id uuid,
    status public.announcement_status DEFAULT 'borrador'::public.announcement_status,
    priority text DEFAULT 'normal'::text,
    attachment_url text,
    created_by uuid,
    approved_by uuid,
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- TOC entry 396 (class 1259 OID 17897)
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    submission_text text,
    attachment_url text,
    score integer,
    feedback text,
    status public.submission_status DEFAULT 'pendiente'::public.submission_status,
    submitted_at timestamp with time zone,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignment_submissions OWNER TO postgres;

--
-- TOC entry 395 (class 1259 OID 17861)
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    course_id uuid NOT NULL,
    section_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    instructions text,
    due_date timestamp with time zone NOT NULL,
    max_score integer DEFAULT 20,
    attachment_url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- TOC entry 393 (class 1259 OID 17771)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    section_id uuid NOT NULL,
    course_id uuid,
    date date DEFAULT CURRENT_DATE NOT NULL,
    status public.attendance_status DEFAULT 'presente'::public.attendance_status NOT NULL,
    justification text,
    recorded_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 402 (class 1259 OID 21617)
-- Name: attendance_justifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_justifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    attendance_id uuid NOT NULL,
    student_id uuid NOT NULL,
    guardian_id uuid,
    reason text NOT NULL,
    attachment_url text,
    status public.justification_status DEFAULT 'pendiente'::public.justification_status,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.attendance_justifications OWNER TO postgres;

--
-- TOC entry 404 (class 1259 OID 21987)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action public.audit_action NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    old_values jsonb,
    new_values jsonb,
    reason text,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 401 (class 1259 OID 18089)
-- Name: cash_closures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_closures (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    closure_date date DEFAULT CURRENT_DATE NOT NULL,
    opening_balance numeric(10,2) DEFAULT 0,
    cash_received numeric(10,2) NOT NULL,
    expected_balance numeric(10,2) NOT NULL,
    actual_balance numeric(10,2) NOT NULL,
    difference numeric(10,2) NOT NULL,
    notes text,
    closed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    cashier_id uuid,
    opening_time timestamp with time zone,
    closing_time timestamp with time zone,
    total_cash numeric(10,2) DEFAULT 0,
    total_cards numeric(10,2) DEFAULT 0,
    total_transfers numeric(10,2) DEFAULT 0,
    total_yape numeric(10,2) DEFAULT 0,
    total_plin numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) DEFAULT 0,
    payments_count integer DEFAULT 0
);


ALTER TABLE public.cash_closures OWNER TO postgres;

--
-- TOC entry 398 (class 1259 OID 17997)
-- Name: charges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charges (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    type public.charge_type NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    final_amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    status public.charge_status DEFAULT 'pendiente'::public.charge_status,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    concept_id uuid,
    period_month integer,
    period_year integer,
    CONSTRAINT charges_period_month_check CHECK (((period_month >= 1) AND (period_month <= 12)))
);


ALTER TABLE public.charges OWNER TO postgres;

--
-- TOC entry 387 (class 1259 OID 17625)
-- Name: competencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competencies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    course_id uuid NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.competencies OWNER TO postgres;

--
-- TOC entry 392 (class 1259 OID 17731)
-- Name: course_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_assignments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    teacher_id uuid NOT NULL,
    course_id uuid NOT NULL,
    section_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    is_tutor boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.course_assignments OWNER TO postgres;

--
-- TOC entry 425 (class 1259 OID 34872)
-- Name: course_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    academic_year_id uuid NOT NULL,
    section_id uuid NOT NULL,
    course_id uuid NOT NULL,
    teacher_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    room_number character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT course_schedules_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7))),
    CONSTRAINT valid_time_range CHECK ((end_time > start_time))
);


ALTER TABLE public.course_schedules OWNER TO postgres;

--
-- TOC entry 5395 (class 0 OID 0)
-- Dependencies: 425
-- Name: TABLE course_schedules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.course_schedules IS 'Horarios de clases por sección, curso y docente';


--
-- TOC entry 5396 (class 0 OID 0)
-- Dependencies: 425
-- Name: COLUMN course_schedules.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_schedules.day_of_week IS '1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo';


--
-- TOC entry 5397 (class 0 OID 0)
-- Dependencies: 425
-- Name: COLUMN course_schedules.room_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.course_schedules.room_number IS 'Número o nombre del aula/salón';


--
-- TOC entry 386 (class 1259 OID 17608)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    grade_level_id uuid NOT NULL,
    hours_per_week integer DEFAULT 2,
    created_at timestamp with time zone DEFAULT now(),
    color character varying(7) DEFAULT '#1D4ED8'::character varying
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 5399 (class 0 OID 0)
-- Dependencies: 386
-- Name: COLUMN courses.color; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.courses.color IS 'Color hexadecimal para identificación visual del curso (#RRGGBB)';


--
-- TOC entry 414 (class 1259 OID 26146)
-- Name: discounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discounts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    type public.discount_type NOT NULL,
    value numeric(10,2) NOT NULL,
    scope public.discount_scope DEFAULT 'todos'::public.discount_scope,
    specific_concept_id uuid,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT discounts_value_check CHECK ((value >= (0)::numeric))
);


ALTER TABLE public.discounts OWNER TO postgres;

--
-- TOC entry 406 (class 1259 OID 23073)
-- Name: enrollment_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollment_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_first_name text NOT NULL,
    student_last_name text NOT NULL,
    student_document_type text NOT NULL,
    student_document_number text NOT NULL,
    student_birth_date date NOT NULL,
    student_gender text NOT NULL,
    student_address text,
    student_photo_url text,
    guardian_first_name text NOT NULL,
    guardian_last_name text NOT NULL,
    guardian_document_type text NOT NULL,
    guardian_document_number text NOT NULL,
    guardian_phone text NOT NULL,
    guardian_email text NOT NULL,
    guardian_address text,
    guardian_relationship text NOT NULL,
    grade_level_id uuid NOT NULL,
    previous_school text,
    has_special_needs boolean DEFAULT false,
    special_needs_description text,
    emergency_contact_name text,
    emergency_contact_phone text,
    notes text,
    status text DEFAULT 'pending'::text,
    application_date timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    rejection_reason text,
    admin_notes text,
    academic_year_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT enrollment_applications_guardian_document_type_check CHECK ((guardian_document_type = ANY (ARRAY['DNI'::text, 'CE'::text, 'Pasaporte'::text]))),
    CONSTRAINT enrollment_applications_guardian_relationship_check CHECK ((guardian_relationship = ANY (ARRAY['Padre'::text, 'Madre'::text, 'Tutor'::text, 'Otro'::text]))),
    CONSTRAINT enrollment_applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))),
    CONSTRAINT enrollment_applications_student_document_type_check CHECK ((student_document_type = ANY (ARRAY['DNI'::text, 'CE'::text, 'Pasaporte'::text]))),
    CONSTRAINT enrollment_applications_student_gender_check CHECK ((student_gender = ANY (ARRAY['M'::text, 'F'::text])))
);


ALTER TABLE public.enrollment_applications OWNER TO postgres;

--
-- TOC entry 394 (class 1259 OID 17823)
-- Name: evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    competency_id uuid NOT NULL,
    period_id uuid NOT NULL,
    grade public.evaluation_grade,
    observations text,
    status public.evaluation_status DEFAULT 'borrador'::public.evaluation_status,
    recorded_by uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.evaluations OWNER TO postgres;

--
-- TOC entry 411 (class 1259 OID 26093)
-- Name: fee_concepts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_concepts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    type public.concept_type NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    periodicity public.concept_periodicity DEFAULT 'unico'::public.concept_periodicity,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fee_concepts_base_amount_check CHECK ((base_amount >= (0)::numeric))
);


ALTER TABLE public.fee_concepts OWNER TO postgres;

--
-- TOC entry 412 (class 1259 OID 26106)
-- Name: financial_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_plans (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    academic_year_id uuid NOT NULL,
    concept_id uuid NOT NULL,
    number_of_installments integer NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT financial_plans_number_of_installments_check CHECK ((number_of_installments > 0))
);


ALTER TABLE public.financial_plans OWNER TO postgres;

--
-- TOC entry 384 (class 1259 OID 17575)
-- Name: grade_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_levels (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    level public.education_level NOT NULL,
    grade integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.grade_levels OWNER TO postgres;

--
-- TOC entry 389 (class 1259 OID 17668)
-- Name: guardians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guardians (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dni text,
    phone text,
    email text,
    address text,
    relationship text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.guardians OWNER TO postgres;

--
-- TOC entry 417 (class 1259 OID 26834)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    sender_role text NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_sender_role_check CHECK ((sender_role = ANY (ARRAY['teacher'::text, 'guardian'::text])))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 430 (class 1259 OID 97949)
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- TOC entry 429 (class 1259 OID 97948)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 429
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 403 (class 1259 OID 21951)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    status public.notification_status DEFAULT 'no_leida'::public.notification_status,
    related_entity_type text,
    related_entity_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 399 (class 1259 OID 18037)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    charge_id uuid NOT NULL,
    student_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    transaction_ref text,
    notes text,
    received_by uuid,
    payment_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 383 (class 1259 OID 17551)
-- Name: periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.periods (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    academic_year_id uuid NOT NULL,
    name text NOT NULL,
    period_number integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_closed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.periods OWNER TO postgres;

--
-- TOC entry 432 (class 1259 OID 97957)
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO postgres;

--
-- TOC entry 431 (class 1259 OID 97956)
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 431
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- TOC entry 413 (class 1259 OID 26128)
-- Name: plan_installments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_installments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    plan_id uuid NOT NULL,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT plan_installments_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT plan_installments_installment_number_check CHECK ((installment_number > 0))
);


ALTER TABLE public.plan_installments OWNER TO postgres;

--
-- TOC entry 381 (class 1259 OID 17523)
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    full_name text NOT NULL,
    dni text,
    phone text,
    email text,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    user_id uuid
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- TOC entry 5419 (class 0 OID 0)
-- Dependencies: 381
-- Name: COLUMN profiles.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.is_active IS 'Usuario activo en el sistema (soft delete)';


--
-- TOC entry 5420 (class 0 OID 0)
-- Dependencies: 381
-- Name: COLUMN profiles.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.updated_at IS 'Última actualización del perfil';


--
-- TOC entry 5421 (class 0 OID 0)
-- Dependencies: 381
-- Name: COLUMN profiles.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.profiles.created_by IS 'Usuario administrador que creó este perfil';


--
-- TOC entry 426 (class 1259 OID 40625)
-- Name: public_news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_news (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    slug text,
    excerpt text NOT NULL,
    content text,
    image_url text,
    category public.public_news_category DEFAULT 'institucional'::public.public_news_category NOT NULL,
    author text DEFAULT 'Dirección General'::text,
    status public.public_news_status DEFAULT 'borrador'::public.public_news_status NOT NULL,
    is_featured boolean DEFAULT false,
    published_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.public_news OWNER TO postgres;

--
-- TOC entry 400 (class 1259 OID 18062)
-- Name: receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    receipt_number text NOT NULL,
    payment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    pdf_url text,
    issued_by uuid,
    issued_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.receipts OWNER TO postgres;

--
-- TOC entry 385 (class 1259 OID 17586)
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    academic_year_id uuid NOT NULL,
    grade_level_id uuid NOT NULL,
    section_letter text NOT NULL,
    capacity integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- TOC entry 410 (class 1259 OID 23206)
-- Name: student_course_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_course_enrollments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    section_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    enrollment_date timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_course_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'dropped'::text, 'completed'::text])))
);


ALTER TABLE public.student_course_enrollments OWNER TO postgres;

--
-- TOC entry 5426 (class 0 OID 0)
-- Dependencies: 410
-- Name: TABLE student_course_enrollments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.student_course_enrollments IS 'Inscripciones de estudiantes a cursos específicos';


--
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 410
-- Name: COLUMN student_course_enrollments.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.student_course_enrollments.status IS 'active: inscrito actualmente, dropped: dado de baja, completed: curso completado';


--
-- TOC entry 415 (class 1259 OID 26164)
-- Name: student_discounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_discounts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    discount_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    notes text,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.student_discounts OWNER TO postgres;

--
-- TOC entry 390 (class 1259 OID 17688)
-- Name: student_guardians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_guardians (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    guardian_id uuid NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.student_guardians OWNER TO postgres;

--
-- TOC entry 388 (class 1259 OID 17642)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    student_code text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dni text,
    birth_date date,
    gender text,
    address text,
    section_id uuid,
    enrollment_date date DEFAULT CURRENT_DATE,
    status text DEFAULT 'active'::text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 405 (class 1259 OID 23029)
-- Name: task_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    submission_date timestamp with time zone DEFAULT now(),
    content text,
    attachment_url text,
    attachment_name text,
    attachment_size integer,
    status text DEFAULT 'submitted'::text,
    grade numeric(5,2),
    grade_letter text,
    feedback text,
    graded_by uuid,
    graded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT task_submissions_grade_letter_check CHECK ((grade_letter = ANY (ARRAY['AD'::text, 'A'::text, 'B'::text, 'C'::text, NULL::text]))),
    CONSTRAINT task_submissions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'graded'::text, 'returned'::text])))
);


ALTER TABLE public.task_submissions OWNER TO postgres;

--
-- TOC entry 407 (class 1259 OID 23119)
-- Name: teacher_course_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_course_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    section_id uuid NOT NULL,
    course_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.teacher_course_assignments OWNER TO postgres;

--
-- TOC entry 391 (class 1259 OID 17708)
-- Name: teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    teacher_code text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dni text,
    phone text,
    email text,
    specialization text,
    hire_date date DEFAULT CURRENT_DATE,
    status text DEFAULT 'active'::text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.teachers OWNER TO postgres;

--
-- TOC entry 409 (class 1259 OID 23173)
-- Name: teacher_assignment_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.teacher_assignment_stats AS
 SELECT t.id AS teacher_id,
    ((t.first_name || ' '::text) || t.last_name) AS teacher_name,
    count(DISTINCT tca.course_id) AS total_courses,
    count(DISTINCT tca.section_id) AS total_sections,
    sum(( SELECT count(*) AS count
           FROM public.students st
          WHERE ((st.section_id = tca.section_id) AND (st.status = 'active'::text)))) AS total_students,
    string_agg(DISTINCT c.name, ', '::text ORDER BY c.name) AS courses_list
   FROM ((public.teachers t
     LEFT JOIN public.teacher_course_assignments tca ON (((t.id = tca.teacher_id) AND (tca.is_active = true))))
     LEFT JOIN public.courses c ON ((tca.course_id = c.id)))
  WHERE (t.status = 'active'::text)
  GROUP BY t.id, t.first_name, t.last_name
  ORDER BY t.last_name, t.first_name;


ALTER VIEW public.teacher_assignment_stats OWNER TO postgres;

--
-- TOC entry 408 (class 1259 OID 23168)
-- Name: teacher_assignments_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.teacher_assignments_view AS
 SELECT tca.id,
    tca.teacher_id,
    ((t.first_name || ' '::text) || t.last_name) AS teacher_name,
    p.email AS teacher_email,
    tca.section_id,
    sec.section_letter AS section_name,
    gl.id AS grade_level_id,
    gl.name AS grade_level_name,
    gl.level,
    tca.course_id,
    c.name AS course_name,
    c.code AS course_code,
    tca.academic_year_id,
    ay.year AS academic_year,
    ay.is_active AS is_current_year,
    tca.is_active,
    tca.assigned_at,
    tca.notes,
    ( SELECT count(*) AS count
           FROM public.students st
          WHERE ((st.section_id = tca.section_id) AND (st.status = 'active'::text))) AS student_count
   FROM ((((((public.teacher_course_assignments tca
     JOIN public.teachers t ON ((tca.teacher_id = t.id)))
     JOIN public.profiles p ON ((t.user_id = p.id)))
     JOIN public.sections sec ON ((tca.section_id = sec.id)))
     JOIN public.grade_levels gl ON ((sec.grade_level_id = gl.id)))
     JOIN public.courses c ON ((tca.course_id = c.id)))
     JOIN public.academic_years ay ON ((tca.academic_year_id = ay.id)))
  WHERE (tca.is_active = true);


ALTER VIEW public.teacher_assignments_view OWNER TO postgres;

--
-- TOC entry 428 (class 1259 OID 94621)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name character varying(255),
    email character varying(255),
    password character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 380 (class 1259 OID 17473)
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- TOC entry 416 (class 1259 OID 26620)
-- Name: messages_2025_12_13; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_13 OWNER TO supabase_admin;

--
-- TOC entry 418 (class 1259 OID 28169)
-- Name: messages_2025_12_14; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_14 OWNER TO supabase_admin;

--
-- TOC entry 419 (class 1259 OID 30387)
-- Name: messages_2025_12_15; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_15 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_15 OWNER TO supabase_admin;

--
-- TOC entry 421 (class 1259 OID 33720)
-- Name: messages_2025_12_16; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_16 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_16 OWNER TO supabase_admin;

--
-- TOC entry 422 (class 1259 OID 33732)
-- Name: messages_2025_12_17; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_17 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_17 OWNER TO supabase_admin;

--
-- TOC entry 423 (class 1259 OID 33744)
-- Name: messages_2025_12_18; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_18 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_18 OWNER TO supabase_admin;

--
-- TOC entry 424 (class 1259 OID 33756)
-- Name: messages_2025_12_19; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_12_19 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_12_19 OWNER TO supabase_admin;

--
-- TOC entry 374 (class 1259 OID 17304)
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- TOC entry 377 (class 1259 OID 17327)
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- TOC entry 376 (class 1259 OID 17326)
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 349 (class 1259 OID 16546)
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 349
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 371 (class 1259 OID 17242)
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- TOC entry 372 (class 1259 OID 17269)
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- TOC entry 351 (class 1259 OID 16588)
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- TOC entry 350 (class 1259 OID 16561)
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- TOC entry 5453 (class 0 OID 0)
-- Dependencies: 350
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 369 (class 1259 OID 17144)
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- TOC entry 370 (class 1259 OID 17158)
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- TOC entry 373 (class 1259 OID 17279)
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- TOC entry 3944 (class 0 OID 0)
-- Name: messages_2025_12_13; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_13 FOR VALUES FROM ('2025-12-13 00:00:00') TO ('2025-12-14 00:00:00');


--
-- TOC entry 3945 (class 0 OID 0)
-- Name: messages_2025_12_14; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_14 FOR VALUES FROM ('2025-12-14 00:00:00') TO ('2025-12-15 00:00:00');


--
-- TOC entry 3946 (class 0 OID 0)
-- Name: messages_2025_12_15; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_15 FOR VALUES FROM ('2025-12-15 00:00:00') TO ('2025-12-16 00:00:00');


--
-- TOC entry 3947 (class 0 OID 0)
-- Name: messages_2025_12_16; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_16 FOR VALUES FROM ('2025-12-16 00:00:00') TO ('2025-12-17 00:00:00');


--
-- TOC entry 3948 (class 0 OID 0)
-- Name: messages_2025_12_17; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_17 FOR VALUES FROM ('2025-12-17 00:00:00') TO ('2025-12-18 00:00:00');


--
-- TOC entry 3949 (class 0 OID 0)
-- Name: messages_2025_12_18; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_18 FOR VALUES FROM ('2025-12-18 00:00:00') TO ('2025-12-19 00:00:00');


--
-- TOC entry 3950 (class 0 OID 0)
-- Name: messages_2025_12_19; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_19 FOR VALUES FROM ('2025-12-19 00:00:00') TO ('2025-12-20 00:00:00');


--
-- TOC entry 3960 (class 2604 OID 16510)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 4202 (class 2604 OID 97952)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 4203 (class 2604 OID 97960)
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- TOC entry 5124 (class 0 OID 16525)
-- Dependencies: 347
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- TOC entry 5195 (class 0 OID 90159)
-- Dependencies: 427
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5138 (class 0 OID 16929)
-- Dependencies: 364
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- TOC entry 5129 (class 0 OID 16727)
-- Dependencies: 355
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	{"sub": "381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8", "email": "admin@cermatschool.edu.pe", "email_verified": false, "phone_verified": false}	email	2025-12-05 03:55:31.834501+00	2025-12-05 03:55:31.834934+00	2025-12-05 03:55:31.834934+00	ff2d823c-e646-4801-b893-0ba3fa55a279
4ac1dd30-d8b6-4bc2-b508-1b618070cc51	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	{"sub": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "email": "jperez@cermatschool.edu.pe", "email_verified": false, "phone_verified": false}	email	2025-12-05 04:12:27.290678+00	2025-12-05 04:12:27.290745+00	2025-12-05 04:12:27.290745+00	f1a9eb96-7187-4c47-ae5e-73629d099c05
21748cbb-948b-480b-8ae7-093a3accccd8	21748cbb-948b-480b-8ae7-093a3accccd8	{"sub": "21748cbb-948b-480b-8ae7-093a3accccd8", "email": "mgarcia@email.com", "email_verified": false, "phone_verified": false}	email	2025-12-05 04:15:46.581213+00	2025-12-05 04:15:46.581259+00	2025-12-05 04:15:46.581259+00	249255f0-edc3-43df-92b3-766c1a449c88
e5af0bd9-b423-4ef3-8a33-366053e9787b	e5af0bd9-b423-4ef3-8a33-366053e9787b	{"sub": "e5af0bd9-b423-4ef3-8a33-366053e9787b", "email": "aquispe@cermatschool.edu.pe", "email_verified": false, "phone_verified": false}	email	2025-12-05 04:17:48.958611+00	2025-12-05 04:17:48.958665+00	2025-12-05 04:17:48.958665+00	9496d3af-444a-45d9-af90-dd30c85d3736
7d71be34-f728-47ce-9c1a-0a4b136809fc	7d71be34-f728-47ce-9c1a-0a4b136809fc	{"sub": "7d71be34-f728-47ce-9c1a-0a4b136809fc", "role": "student", "email": "yasmin.yucramamani@cermatschool.edu.pe", "full_name": "yasmin yucra mamani", "email_verified": false, "phone_verified": false}	email	2025-12-09 22:57:29.735467+00	2025-12-09 22:57:29.735526+00	2025-12-09 22:57:29.735526+00	cda46caf-9802-4be3-9c01-e8429a664b87
c5940104-93b0-43fa-a31d-252349432077	c5940104-93b0-43fa-a31d-252349432077	{"sub": "c5940104-93b0-43fa-a31d-252349432077", "role": "student", "email": "kasu.yucraapaza@cermatschool.edu.pe", "full_name": "kasu yucra apaza", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:13:09.370605+00	2025-12-10 00:13:09.371129+00	2025-12-10 00:13:09.371129+00	202ea525-c1e9-4961-9bd0-118e746be2c9
0cdbbe7d-486f-4348-8cf7-0ca92c591a3c	0cdbbe7d-486f-4348-8cf7-0ca92c591a3c	{"sub": "0cdbbe7d-486f-4348-8cf7-0ca92c591a3c", "role": "guardian", "email": "joel@gmail.com", "full_name": "joel loslos", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:13:10.278672+00	2025-12-10 00:13:10.278735+00	2025-12-10 00:13:10.278735+00	48a37005-b9ee-4117-b308-ff36d1eafd2f
11a8f7d0-621b-45d6-abe7-fdc4e35e8198	11a8f7d0-621b-45d6-abe7-fdc4e35e8198	{"sub": "11a8f7d0-621b-45d6-abe7-fdc4e35e8198", "role": "student", "email": "kaorikasu.yucraapaza@cermatschool.edu.pe", "full_name": "kaori kasu yucra apaza", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:15:52.537828+00	2025-12-10 00:15:52.537877+00	2025-12-10 00:15:52.537877+00	828ac00e-8d02-483a-a8ee-e0b2dbf04d5d
0c705609-6c56-4304-a2ca-9f836aa29e3d	0c705609-6c56-4304-a2ca-9f836aa29e3d	{"sub": "0c705609-6c56-4304-a2ca-9f836aa29e3d", "role": "guardian", "email": "joel2@gmail.com", "full_name": "pez joel  loslos", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:15:53.910508+00	2025-12-10 00:15:53.911146+00	2025-12-10 00:15:53.911146+00	9509e9ac-1cc5-466c-a173-d834cc032326
5600fe2b-ea99-4a90-8a79-b75d6e44c50e	5600fe2b-ea99-4a90-8a79-b75d6e44c50e	{"sub": "5600fe2b-ea99-4a90-8a79-b75d6e44c50e", "role": "student", "email": "kaorikasu22.yucraapaza@cermatschool.edu.pe", "full_name": "kaori kasu22 yucra apaza", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:18:33.154477+00	2025-12-10 00:18:33.155125+00	2025-12-10 00:18:33.155125+00	173a76cb-3e29-4ac6-a64c-143ac5dc57b4
4b467673-86db-4d50-9948-d6e3f157dcac	4b467673-86db-4d50-9948-d6e3f157dcac	{"sub": "4b467673-86db-4d50-9948-d6e3f157dcac", "role": "guardian", "email": "joel23@gmail.com", "full_name": "pez joel 2 loslos", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:18:34.23214+00	2025-12-10 00:18:34.232189+00	2025-12-10 00:18:34.232189+00	ef4c2b47-56ad-47f3-ab91-6b56d45916a1
2b686556-b760-4e0e-aa0e-ad192ec7237e	2b686556-b760-4e0e-aa0e-ad192ec7237e	{"sub": "2b686556-b760-4e0e-aa0e-ad192ec7237e", "role": "student", "email": "kaorikasu2223.yucraapaza2@cermatschool.edu.pe", "full_name": "kaori kasu2223 yucra apaza2", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:21:18.38279+00	2025-12-10 00:21:18.382838+00	2025-12-10 00:21:18.382838+00	4723b2d0-b480-445e-91e5-45d6ff0b57bd
ab0acf73-2736-4ed0-b26b-df44f8896ac0	ab0acf73-2736-4ed0-b26b-df44f8896ac0	{"sub": "ab0acf73-2736-4ed0-b26b-df44f8896ac0", "role": "guardian", "email": "joel2344@gmail.com", "full_name": "pez joel 2 loslos", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:21:19.196876+00	2025-12-10 00:21:19.196924+00	2025-12-10 00:21:19.196924+00	d678ab10-093c-4d0c-9f7c-a03d8d28c68a
8a4d5d5b-c0c9-46be-9431-ee15ccf71522	8a4d5d5b-c0c9-46be-9431-ee15ccf71522	{"sub": "8a4d5d5b-c0c9-46be-9431-ee15ccf71522", "role": "student", "email": "kaorikasu22234.yucraapaza222@cermatschool.edu.pe", "full_name": "kaori kasu22234 yucra apaza222", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:24:58.912898+00	2025-12-10 00:24:58.912954+00	2025-12-10 00:24:58.912954+00	478893cb-f5f0-47aa-bf1a-bdfcb6602798
f65d7fae-3a5c-4a7d-a34d-941f32c10df3	f65d7fae-3a5c-4a7d-a34d-941f32c10df3	{"sub": "f65d7fae-3a5c-4a7d-a34d-941f32c10df3", "role": "guardian", "email": "joel23444@gmail.com", "full_name": "pez joel 23 loslos3", "email_verified": false, "phone_verified": false}	email	2025-12-10 00:24:59.915703+00	2025-12-10 00:24:59.915762+00	2025-12-10 00:24:59.915762+00	153d86bc-a6d0-4b82-9de5-6c23d421cf27
5d439ad0-dd4a-4d8a-99dd-46ae838b647d	5d439ad0-dd4a-4d8a-99dd-46ae838b647d	{"sub": "5d439ad0-dd4a-4d8a-99dd-46ae838b647d", "role": "student", "email": "johan.avila@cermatschool.edu.pe", "full_name": "Johan Avila", "email_verified": false, "phone_verified": false}	email	2025-12-10 15:40:16.787931+00	2025-12-10 15:40:16.78799+00	2025-12-10 15:40:16.78799+00	8088cc36-e1d4-471d-8a92-06d6d8bf01c8
8fab40e4-97d0-4cbd-a3c0-f5cebbc50310	8fab40e4-97d0-4cbd-a3c0-f5cebbc50310	{"sub": "8fab40e4-97d0-4cbd-a3c0-f5cebbc50310", "role": "guardian", "email": "asd@gmail.com", "full_name": "Jose Anton", "email_verified": false, "phone_verified": false}	email	2025-12-10 15:40:18.461095+00	2025-12-10 15:40:18.461146+00	2025-12-10 15:40:18.461146+00	3ba38157-fce9-443f-8dc0-cac01021d796
96f4ba8a-6596-485b-9375-838db139b477	96f4ba8a-6596-485b-9375-838db139b477	{"sub": "96f4ba8a-6596-485b-9375-838db139b477", "role": "student", "email": "pepfonsales.yanapari@cermatschool.edu.pe", "full_name": "pep fonsales yana pari", "email_verified": false, "phone_verified": false}	email	2025-12-10 15:54:46.055624+00	2025-12-10 15:54:46.055685+00	2025-12-10 15:54:46.055685+00	615b6849-cfa4-4521-bfca-b48b64cd8cf3
112f3e08-c975-4ec6-a46d-b2096ef6d4be	112f3e08-c975-4ec6-a46d-b2096ef6d4be	{"sub": "112f3e08-c975-4ec6-a46d-b2096ef6d4be", "role": "guardian", "email": "lucho@gmail.com", "full_name": "lucho pedro", "email_verified": false, "phone_verified": false}	email	2025-12-10 15:54:47.477324+00	2025-12-10 15:54:47.477377+00	2025-12-10 15:54:47.477377+00	1567dfef-3543-4a09-9cea-e03f60ba4a59
d2020502-096c-4440-bf0c-3f52a6fc3728	d2020502-096c-4440-bf0c-3f52a6fc3728	{"sub": "d2020502-096c-4440-bf0c-3f52a6fc3728", "role": "student", "email": "lores.ppp@cermatschool.edu.pe", "full_name": "lores ppp", "email_verified": false, "phone_verified": false}	email	2025-12-10 16:06:14.796518+00	2025-12-10 16:06:14.796569+00	2025-12-10 16:06:14.796569+00	15471c23-6c23-4e4b-96d7-9b74dfd27e4d
d3b1e4dc-da81-425e-8668-5a85d90dea48	d3b1e4dc-da81-425e-8668-5a85d90dea48	{"sub": "d3b1e4dc-da81-425e-8668-5a85d90dea48", "role": "guardian", "email": "pepeppp@gmail.com", "full_name": "llll lllll", "email_verified": false, "phone_verified": false}	email	2025-12-10 16:06:16.345687+00	2025-12-10 16:06:16.345751+00	2025-12-10 16:06:16.345751+00	5d0bf88b-bcbb-4b5f-a796-77c984b255ba
471c0d0e-b6fc-4487-b8c2-1eb1ccebec9b	471c0d0e-b6fc-4487-b8c2-1eb1ccebec9b	{"sub": "471c0d0e-b6fc-4487-b8c2-1eb1ccebec9b", "role": "student", "email": "antonio.lara@cermatschool.edu.pe", "full_name": "Antonio  Lara", "email_verified": false, "phone_verified": false}	email	2025-12-19 19:39:35.581148+00	2025-12-19 19:39:35.581208+00	2025-12-19 19:39:35.581208+00	3ab210e7-bd7f-42c7-a6ee-3be1a1092b64
75a5d5a9-11b4-4b8d-b931-6c888702ad6d	75a5d5a9-11b4-4b8d-b931-6c888702ad6d	{"sub": "75a5d5a9-11b4-4b8d-b931-6c888702ad6d", "role": "guardian", "email": "jose@gmail.con", "full_name": "Jose Lara", "email_verified": false, "phone_verified": false}	email	2025-12-19 19:39:36.874186+00	2025-12-19 19:39:36.874238+00	2025-12-19 19:39:36.874238+00	f287adc5-17f6-4f8c-9559-0cb25dc24068
7b4a290f-f1ea-4053-afb6-fd6024d36319	7b4a290f-f1ea-4053-afb6-fd6024d36319	{"sub": "7b4a290f-f1ea-4053-afb6-fd6024d36319", "role": "student", "email": "ronald.quispe@cermatschool.edu.pe", "full_name": "Ronald Quispe", "email_verified": false, "phone_verified": false}	email	2025-12-22 17:04:43.638531+00	2025-12-22 17:04:43.638583+00	2025-12-22 17:04:43.638583+00	b7958119-e885-4c09-9b1b-75677ac6d883
dc5799a6-cda2-4a85-8903-4799402e71fb	dc5799a6-cda2-4a85-8903-4799402e71fb	{"sub": "dc5799a6-cda2-4a85-8903-4799402e71fb", "role": "guardian", "email": "ronaldo@gmail.com", "full_name": "Ronaldo Quiste", "email_verified": false, "phone_verified": false}	email	2025-12-22 17:04:44.838091+00	2025-12-22 17:04:44.838145+00	2025-12-22 17:04:44.838145+00	5e19955b-9ab4-41c6-817b-dbf2f1a91dd1
f7962b8d-64a7-4870-9a79-845e113668a8	f7962b8d-64a7-4870-9a79-845e113668a8	{"sub": "f7962b8d-64a7-4870-9a79-845e113668a8", "role": "student", "email": "emerson.cuna@cermatschool.edu.pe", "full_name": "Emerson Cuña", "email_verified": false, "phone_verified": false}	email	2025-12-22 17:35:14.94728+00	2025-12-22 17:35:14.947336+00	2025-12-22 17:35:14.947336+00	03d7b4bd-35ee-4e57-827e-91eded221868
14c0d2ba-a330-4436-9be8-58d75eb5947a	14c0d2ba-a330-4436-9be8-58d75eb5947a	{"sub": "14c0d2ba-a330-4436-9be8-58d75eb5947a", "role": "guardian", "email": "lorenzo@gmail.com", "full_name": "Lorenzo Cuña", "email_verified": false, "phone_verified": false}	email	2025-12-22 17:35:15.94508+00	2025-12-22 17:35:15.945767+00	2025-12-22 17:35:15.945767+00	5affaf5c-221c-4efe-b150-35c07b2885c8
\.


--
-- TOC entry 5123 (class 0 OID 16518)
-- Dependencies: 346
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5133 (class 0 OID 16816)
-- Dependencies: 359
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
18a55a5a-e5c5-4200-a461-585cf4065106	2025-12-10 00:13:09.444829+00	2025-12-10 00:13:09.444829+00	password	c5077bcf-8494-477c-92c6-4ef0e6ca9ae7
e612453b-ca28-40be-99ea-f0f2d118c2a6	2025-12-10 00:13:10.298114+00	2025-12-10 00:13:10.298114+00	password	35e7c674-3020-4970-8541-93c8b15208e0
69d62e15-ec10-40b0-b812-a06a42e320a3	2025-12-10 00:15:52.556+00	2025-12-10 00:15:52.556+00	password	d716385b-a1a6-491f-90c9-85a1a0a07568
43d45fff-763a-4c96-aca4-abf971cd5913	2025-12-10 00:15:53.921279+00	2025-12-10 00:15:53.921279+00	password	65eed788-3389-4572-852e-4ada234a3324
ca612738-0561-4fd0-a59c-257b47e0db6e	2025-12-10 00:18:33.179016+00	2025-12-10 00:18:33.179016+00	password	cb52d1c3-6f1d-45c5-92bc-764c8aa46f2c
efb363c2-bdd5-4c49-96de-bc87a32a956d	2025-12-10 00:18:34.249762+00	2025-12-10 00:18:34.249762+00	password	4f4df858-50c0-4d95-aca7-8e8f620a79a0
6913e73d-95e1-4848-973a-00425cd0d490	2025-12-10 00:21:18.394439+00	2025-12-10 00:21:18.394439+00	password	c2bafd71-e552-47b9-b70e-5258810eeb68
14eb3103-124e-4680-a506-2cfe72b51ab4	2025-12-10 00:21:19.208429+00	2025-12-10 00:21:19.208429+00	password	f3972443-0d3d-41f9-89d5-e9489899e000
e90980e3-01b2-45b8-872a-52130a23a3ea	2025-12-10 15:40:16.821005+00	2025-12-10 15:40:16.821005+00	password	d29d3202-484a-411e-b244-40bb32cf6a80
7be18cb7-c3fa-48c4-8e39-ba89993f2357	2025-12-10 15:40:18.471656+00	2025-12-10 15:40:18.471656+00	password	b2b01a0b-9d4a-4f6e-ba05-3fc726c36093
ea9b4904-32da-4941-b45d-b9c610de899d	2025-12-19 19:39:36.894828+00	2025-12-19 19:39:36.894828+00	password	3e97d7bd-8776-4221-8d31-974ad9670fe4
bcfb2e00-549a-4171-aefb-6db626f65b74	2025-12-10 15:54:46.077959+00	2025-12-10 15:54:46.077959+00	password	9fca0191-1505-4576-b0d6-e57f33c90988
5dd0fe0f-be32-482a-a3fd-57c0885c92e2	2025-12-22 19:01:35.304783+00	2025-12-22 19:01:35.304783+00	password	19497e13-9a9e-405a-83fa-898563fbcc4a
3f407cd5-d090-453c-829b-38eed4d69d76	2025-12-10 16:06:14.806885+00	2025-12-10 16:06:14.806885+00	password	8d025983-6f58-41df-86c2-7a7ccdf0b512
7471236c-8bdf-4fba-be60-d1cf5d60c461	2025-12-10 16:06:16.359853+00	2025-12-10 16:06:16.359853+00	password	dacd2153-6fa4-4754-8df6-b63a65e4c81a
63b6d194-f27d-47de-b7f2-de205ab8394f	2025-12-10 16:09:06.091319+00	2025-12-10 16:09:06.091319+00	password	b89ea86c-259b-4de5-bd9d-b34c3b316658
b57a410a-fb1e-458e-b708-2aa54db729c3	2026-03-07 02:00:02.496401+00	2026-03-07 02:00:02.496401+00	password	9ac1b075-9b60-4fb5-b702-2f26e79d4665
24eea40a-dc23-4051-8fc8-86163081232a	2026-03-07 02:00:04.51416+00	2026-03-07 02:00:04.51416+00	password	42747ec5-2123-44cc-a483-688270e6eb20
c6e0457e-7c87-4c09-8815-a1ed4d27217f	2026-03-07 02:00:14.715683+00	2026-03-07 02:00:14.715683+00	password	cfe790e3-23c3-4775-84bf-f30d7f7c4e93
\.


--
-- TOC entry 5132 (class 0 OID 16804)
-- Dependencies: 358
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- TOC entry 5131 (class 0 OID 16791)
-- Dependencies: 357
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- TOC entry 5141 (class 0 OID 17041)
-- Dependencies: 367
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- TOC entry 5188 (class 0 OID 30401)
-- Dependencies: 420
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- TOC entry 5140 (class 0 OID 17011)
-- Dependencies: 366
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- TOC entry 5142 (class 0 OID 17074)
-- Dependencies: 368
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- TOC entry 5139 (class 0 OID 16979)
-- Dependencies: 365
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5122 (class 0 OID 16507)
-- Dependencies: 345
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	162	m57fhdqbpa7j	96f4ba8a-6596-485b-9375-838db139b477	f	2025-12-10 15:54:46.075539+00	2025-12-10 15:54:46.075539+00	\N	bcfb2e00-549a-4171-aefb-6db626f65b74
00000000-0000-0000-0000-000000000000	169	5xcw33rbmy22	d2020502-096c-4440-bf0c-3f52a6fc3728	f	2025-12-10 16:06:14.805553+00	2025-12-10 16:06:14.805553+00	\N	3f407cd5-d090-453c-829b-38eed4d69d76
00000000-0000-0000-0000-000000000000	170	e5ibb54s2v43	d3b1e4dc-da81-425e-8668-5a85d90dea48	f	2025-12-10 16:06:16.358668+00	2025-12-10 16:06:16.358668+00	\N	7471236c-8bdf-4fba-be60-d1cf5d60c461
00000000-0000-0000-0000-000000000000	172	24nriui2uv65	96f4ba8a-6596-485b-9375-838db139b477	f	2025-12-10 16:09:06.089459+00	2025-12-10 16:09:06.089459+00	\N	63b6d194-f27d-47de-b7f2-de205ab8394f
00000000-0000-0000-0000-000000000000	385	yuzwx37slugr	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	f	2026-03-07 02:00:02.464185+00	2026-03-07 02:00:02.464185+00	\N	b57a410a-fb1e-458e-b708-2aa54db729c3
00000000-0000-0000-0000-000000000000	129	7pcyylix5q6f	c5940104-93b0-43fa-a31d-252349432077	f	2025-12-10 00:13:09.418725+00	2025-12-10 00:13:09.418725+00	\N	18a55a5a-e5c5-4200-a461-585cf4065106
00000000-0000-0000-0000-000000000000	130	qwfh3sb4rcdd	0cdbbe7d-486f-4348-8cf7-0ca92c591a3c	f	2025-12-10 00:13:10.295348+00	2025-12-10 00:13:10.295348+00	\N	e612453b-ca28-40be-99ea-f0f2d118c2a6
00000000-0000-0000-0000-000000000000	386	tdsjadttt7cu	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	f	2026-03-07 02:00:04.512855+00	2026-03-07 02:00:04.512855+00	\N	24eea40a-dc23-4051-8fc8-86163081232a
00000000-0000-0000-0000-000000000000	132	pivzmvkkhlhm	11a8f7d0-621b-45d6-abe7-fdc4e35e8198	f	2025-12-10 00:15:52.552862+00	2025-12-10 00:15:52.552862+00	\N	69d62e15-ec10-40b0-b812-a06a42e320a3
00000000-0000-0000-0000-000000000000	133	qx3rroctwir3	0c705609-6c56-4304-a2ca-9f836aa29e3d	f	2025-12-10 00:15:53.91948+00	2025-12-10 00:15:53.91948+00	\N	43d45fff-763a-4c96-aca4-abf971cd5913
00000000-0000-0000-0000-000000000000	387	cal7syhoygfh	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	f	2026-03-07 02:00:14.713174+00	2026-03-07 02:00:14.713174+00	\N	c6e0457e-7c87-4c09-8815-a1ed4d27217f
00000000-0000-0000-0000-000000000000	135	ycgdaq5d4j2k	5600fe2b-ea99-4a90-8a79-b75d6e44c50e	f	2025-12-10 00:18:33.173226+00	2025-12-10 00:18:33.173226+00	\N	ca612738-0561-4fd0-a59c-257b47e0db6e
00000000-0000-0000-0000-000000000000	136	rjjfq3toyjke	4b467673-86db-4d50-9948-d6e3f157dcac	f	2025-12-10 00:18:34.248474+00	2025-12-10 00:18:34.248474+00	\N	efb363c2-bdd5-4c49-96de-bc87a32a956d
00000000-0000-0000-0000-000000000000	138	x5lyqquhrq27	2b686556-b760-4e0e-aa0e-ad192ec7237e	f	2025-12-10 00:21:18.391104+00	2025-12-10 00:21:18.391104+00	\N	6913e73d-95e1-4848-973a-00425cd0d490
00000000-0000-0000-0000-000000000000	139	23wwu725yofy	ab0acf73-2736-4ed0-b26b-df44f8896ac0	f	2025-12-10 00:21:19.20534+00	2025-12-10 00:21:19.20534+00	\N	14eb3103-124e-4680-a506-2cfe72b51ab4
00000000-0000-0000-0000-000000000000	290	mvjalrscyhjs	75a5d5a9-11b4-4b8d-b931-6c888702ad6d	f	2025-12-19 19:39:36.893425+00	2025-12-19 19:39:36.893425+00	\N	ea9b4904-32da-4941-b45d-b9c610de899d
00000000-0000-0000-0000-000000000000	355	5boovl342hag	f7962b8d-64a7-4870-9a79-845e113668a8	f	2025-12-22 19:01:35.303419+00	2025-12-22 19:01:35.303419+00	\N	5dd0fe0f-be32-482a-a3fd-57c0885c92e2
00000000-0000-0000-0000-000000000000	159	wfokefyiz7ko	5d439ad0-dd4a-4d8a-99dd-46ae838b647d	f	2025-12-10 15:40:16.8131+00	2025-12-10 15:40:16.8131+00	\N	e90980e3-01b2-45b8-872a-52130a23a3ea
00000000-0000-0000-0000-000000000000	160	h3sqwafkw7tp	8fab40e4-97d0-4cbd-a3c0-f5cebbc50310	f	2025-12-10 15:40:18.47027+00	2025-12-10 15:40:18.47027+00	\N	7be18cb7-c3fa-48c4-8e39-ba89993f2357
\.


--
-- TOC entry 5136 (class 0 OID 16858)
-- Dependencies: 362
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- TOC entry 5137 (class 0 OID 16876)
-- Dependencies: 363
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- TOC entry 5125 (class 0 OID 16533)
-- Dependencies: 348
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
\.


--
-- TOC entry 5130 (class 0 OID 16757)
-- Dependencies: 356
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
18a55a5a-e5c5-4200-a461-585cf4065106	c5940104-93b0-43fa-a31d-252349432077	2025-12-10 00:13:09.402838+00	2025-12-10 00:13:09.402838+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	45.191.99.131	\N	\N	\N	\N	\N
e612453b-ca28-40be-99ea-f0f2d118c2a6	0cdbbe7d-486f-4348-8cf7-0ca92c591a3c	2025-12-10 00:13:10.293709+00	2025-12-10 00:13:10.293709+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	45.191.99.131	\N	\N	\N	\N	\N
69d62e15-ec10-40b0-b812-a06a42e320a3	11a8f7d0-621b-45d6-abe7-fdc4e35e8198	2025-12-10 00:15:52.55036+00	2025-12-10 00:15:52.55036+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	45.191.99.131	\N	\N	\N	\N	\N
43d45fff-763a-4c96-aca4-abf971cd5913	0c705609-6c56-4304-a2ca-9f836aa29e3d	2025-12-10 00:15:53.918159+00	2025-12-10 00:15:53.918159+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	45.191.99.131	\N	\N	\N	\N	\N
ca612738-0561-4fd0-a59c-257b47e0db6e	5600fe2b-ea99-4a90-8a79-b75d6e44c50e	2025-12-10 00:18:33.171922+00	2025-12-10 00:18:33.171922+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	45.191.99.131	\N	\N	\N	\N	\N
efb363c2-bdd5-4c49-96de-bc87a32a956d	4b467673-86db-4d50-9948-d6e3f157dcac	2025-12-10 00:18:34.247004+00	2025-12-10 00:18:34.247004+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	45.191.99.131	\N	\N	\N	\N	\N
6913e73d-95e1-4848-973a-00425cd0d490	2b686556-b760-4e0e-aa0e-ad192ec7237e	2025-12-10 00:21:18.389513+00	2025-12-10 00:21:18.389513+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	38.226.246.217	\N	\N	\N	\N	\N
14eb3103-124e-4680-a506-2cfe72b51ab4	ab0acf73-2736-4ed0-b26b-df44f8896ac0	2025-12-10 00:21:19.204533+00	2025-12-10 00:21:19.204533+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	38.226.246.217	\N	\N	\N	\N	\N
ea9b4904-32da-4941-b45d-b9c610de899d	75a5d5a9-11b4-4b8d-b931-6c888702ad6d	2025-12-19 19:39:36.891251+00	2025-12-19 19:39:36.891251+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Avast/143.0.0.0	179.7.0.160	\N	\N	\N	\N	\N
e90980e3-01b2-45b8-872a-52130a23a3ea	5d439ad0-dd4a-4d8a-99dd-46ae838b647d	2025-12-10 15:40:16.805114+00	2025-12-10 15:40:16.805114+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Avast/142.0.0.0	132.184.128.42	\N	\N	\N	\N	\N
7be18cb7-c3fa-48c4-8e39-ba89993f2357	8fab40e4-97d0-4cbd-a3c0-f5cebbc50310	2025-12-10 15:40:18.467993+00	2025-12-10 15:40:18.467993+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Avast/142.0.0.0	132.184.128.42	\N	\N	\N	\N	\N
bcfb2e00-549a-4171-aefb-6db626f65b74	96f4ba8a-6596-485b-9375-838db139b477	2025-12-10 15:54:46.074226+00	2025-12-10 15:54:46.074226+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Avast/142.0.0.0	132.184.128.42	\N	\N	\N	\N	\N
5dd0fe0f-be32-482a-a3fd-57c0885c92e2	f7962b8d-64a7-4870-9a79-845e113668a8	2025-12-22 19:01:35.301814+00	2025-12-22 19:01:35.301814+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Avast/143.0.0.0	179.7.0.160	\N	\N	\N	\N	\N
3f407cd5-d090-453c-829b-38eed4d69d76	d2020502-096c-4440-bf0c-3f52a6fc3728	2025-12-10 16:06:14.804677+00	2025-12-10 16:06:14.804677+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Avast/142.0.0.0	132.184.128.42	\N	\N	\N	\N	\N
7471236c-8bdf-4fba-be60-d1cf5d60c461	d3b1e4dc-da81-425e-8668-5a85d90dea48	2025-12-10 16:06:16.351905+00	2025-12-10 16:06:16.351905+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Avast/142.0.0.0	132.184.128.42	\N	\N	\N	\N	\N
63b6d194-f27d-47de-b7f2-de205ab8394f	96f4ba8a-6596-485b-9375-838db139b477	2025-12-10 16:09:06.087883+00	2025-12-10 16:09:06.087883+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Avast/142.0.0.0	132.184.128.42	\N	\N	\N	\N	\N
b57a410a-fb1e-458e-b708-2aa54db729c3	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	2026-03-07 02:00:02.419642+00	2026-03-07 02:00:02.419642+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	38.226.246.193	\N	\N	\N	\N	\N
24eea40a-dc23-4051-8fc8-86163081232a	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	2026-03-07 02:00:04.511718+00	2026-03-07 02:00:04.511718+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	38.226.246.193	\N	\N	\N	\N	\N
c6e0457e-7c87-4c09-8815-a1ed4d27217f	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	2026-03-07 02:00:14.711138+00	2026-03-07 02:00:14.711138+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	38.226.246.193	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5135 (class 0 OID 16843)
-- Dependencies: 361
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5134 (class 0 OID 16834)
-- Dependencies: 360
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- TOC entry 5120 (class 0 OID 16495)
-- Dependencies: 343
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	e6b72532-188d-4e0c-9985-dd2834e6ce71	authenticated	authenticated	david@gmail.com	$2a$06$ObKr2kGJcyCDJGPv4VBCA.HjTPCIl2hHCmJArR/XSFdNRpjNZB/5W	2025-12-09 23:58:51.653859+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{}	\N	2025-12-09 23:58:51.653859+00	2025-12-09 23:58:51.653859+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e5af0bd9-b423-4ef3-8a33-366053e9787b	authenticated	authenticated	aquispe@cermatschool.edu.pe	$2a$10$1nqdXTvhSQLAz7cwV0PHhudzEr.sHhohmev7AESbDUOagLIkNcIXO	2025-12-05 04:17:48.96007+00	\N		\N		\N			\N	2025-12-19 19:16:22.740115+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2025-12-05 04:17:48.957633+00	2025-12-19 19:16:22.742554+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	11a8f7d0-621b-45d6-abe7-fdc4e35e8198	authenticated	authenticated	kaorikasu.yucraapaza@cermatschool.edu.pe	$2a$10$XCZYepto4XfBOxC7K.26NunevlzXJmGAMMWnVAp3NtqHZKb0zdxFe	2025-12-10 00:15:52.542395+00	\N		\N		\N			\N	2025-12-10 00:15:52.550261+00	{"provider": "email", "providers": ["email"]}	{"sub": "11a8f7d0-621b-45d6-abe7-fdc4e35e8198", "role": "student", "email": "kaorikasu.yucraapaza@cermatschool.edu.pe", "full_name": "kaori kasu yucra apaza", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:15:52.533004+00	2025-12-10 00:15:52.555472+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	authenticated	authenticated	jperez@cermatschool.edu.pe	$2a$10$ekMInt5KBD/VQ91b/pHkp.D8bBHID7iTkGUaJ76pmsxkGMBxNd/DW	2025-12-05 04:12:27.293173+00	\N		\N		\N			\N	2025-12-30 01:43:57.612326+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2025-12-05 04:12:27.285931+00	2025-12-30 01:43:57.615932+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0cdbbe7d-486f-4348-8cf7-0ca92c591a3c	authenticated	authenticated	joel@gmail.com	$2a$10$ot9h6QnZ2kcNMaf6.csPH.Zvk2Ks1j4g5K4N7MysDCYNgLbiJslpa	2025-12-10 00:13:10.286518+00	\N		\N		\N			\N	2025-12-10 00:13:10.293602+00	{"provider": "email", "providers": ["email"]}	{"sub": "0cdbbe7d-486f-4348-8cf7-0ca92c591a3c", "role": "guardian", "email": "joel@gmail.com", "full_name": "joel loslos", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:13:10.271315+00	2025-12-10 00:13:10.297754+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c5940104-93b0-43fa-a31d-252349432077	authenticated	authenticated	kasu.yucraapaza@cermatschool.edu.pe	$2a$10$ryXp1uwe8M2b7waPueVTPeHP3ADV/eGjHY4R/xgDw2nPH/2X6Pnxi	2025-12-10 00:13:09.388829+00	\N		\N		\N			\N	2025-12-10 00:13:09.401481+00	{"provider": "email", "providers": ["email"]}	{"sub": "c5940104-93b0-43fa-a31d-252349432077", "role": "student", "email": "kasu.yucraapaza@cermatschool.edu.pe", "full_name": "kasu yucra apaza", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:13:09.342514+00	2025-12-10 00:13:09.443553+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	21748cbb-948b-480b-8ae7-093a3accccd8	authenticated	authenticated	mgarcia@email.com	$2a$10$aUVU0pkwXwJ3Y6SbUQIGUeuOVvpcCkIW8XGCfTE40CBCMKhs0qZJG	2025-12-05 04:15:46.582564+00	\N		\N		\N			\N	2025-12-30 01:42:32.441355+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2025-12-05 04:15:46.58023+00	2025-12-30 01:42:32.443906+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	2b686556-b760-4e0e-aa0e-ad192ec7237e	authenticated	authenticated	kaorikasu2223.yucraapaza2@cermatschool.edu.pe	$2a$10$OI8yAtf/NTvQmfKVflmf6OhyfqWpsW2HLeaT6pfF4dE/z.w1XiPha	2025-12-10 00:21:18.385499+00	\N		\N		\N			\N	2025-12-10 00:21:18.389427+00	{"provider": "email", "providers": ["email"]}	{"sub": "2b686556-b760-4e0e-aa0e-ad192ec7237e", "role": "student", "email": "kaorikasu2223.yucraapaza2@cermatschool.edu.pe", "full_name": "kaori kasu2223 yucra apaza2", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:21:18.378197+00	2025-12-10 00:21:18.394089+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5600fe2b-ea99-4a90-8a79-b75d6e44c50e	authenticated	authenticated	kaorikasu22.yucraapaza@cermatschool.edu.pe	$2a$10$DkA3uGIOkpZ1afHgugI0COvyqiFO3qi4s7Ik.cTLCEOdH1zC0NzWa	2025-12-10 00:18:33.16339+00	\N		\N		\N			\N	2025-12-10 00:18:33.171168+00	{"provider": "email", "providers": ["email"]}	{"sub": "5600fe2b-ea99-4a90-8a79-b75d6e44c50e", "role": "student", "email": "kaorikasu22.yucraapaza@cermatschool.edu.pe", "full_name": "kaori kasu22 yucra apaza", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:18:33.136782+00	2025-12-10 00:18:33.178418+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0c705609-6c56-4304-a2ca-9f836aa29e3d	authenticated	authenticated	joel2@gmail.com	$2a$10$ekUdp854K0xbxGe4a2kZs./WJgObhZskruXLIncjTPN3hlRzysAC.	2025-12-10 00:15:53.914233+00	\N		\N		\N			\N	2025-12-10 00:15:53.918073+00	{"provider": "email", "providers": ["email"]}	{"sub": "0c705609-6c56-4304-a2ca-9f836aa29e3d", "role": "guardian", "email": "joel2@gmail.com", "full_name": "pez joel  loslos", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:15:53.907525+00	2025-12-10 00:15:53.920998+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7d71be34-f728-47ce-9c1a-0a4b136809fc	authenticated	authenticated	yasmin.yucramamani@cermatschool.edu.pe	$2a$10$a8VgxyjTAEiAQvI46qiSn.ZkbJzr7vcteV2i/Byn8TS8ppQLwwR9O	2025-12-09 22:57:29.739386+00	\N		\N		\N			\N	2025-12-30 01:29:37.852475+00	{"provider": "email", "providers": ["email"]}	{"sub": "7d71be34-f728-47ce-9c1a-0a4b136809fc", "role": "student", "email": "yasmin.yucramamani@cermatschool.edu.pe", "full_name": "yasmin yucra mamani", "email_verified": true, "phone_verified": false}	\N	2025-12-09 22:57:29.718406+00	2025-12-30 01:29:37.855269+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4b467673-86db-4d50-9948-d6e3f157dcac	authenticated	authenticated	joel23@gmail.com	$2a$10$TGzJnOccmB.N8mUIfXiUL.6o7Hl29DemeH4uO8Gg6xxvNcFOZOuJ2	2025-12-10 00:18:34.239408+00	\N		\N		\N			\N	2025-12-10 00:18:34.24629+00	{"provider": "email", "providers": ["email"]}	{"sub": "4b467673-86db-4d50-9948-d6e3f157dcac", "role": "guardian", "email": "joel23@gmail.com", "full_name": "pez joel 2 loslos", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:18:34.224966+00	2025-12-10 00:18:34.249421+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	authenticated	authenticated	admin@cermatschool.edu.pe	$2a$10$oqApiTRVsii6lSJs7aIJCed5rQN/S6wLAuk/iu2uyptVYUBV3lxpy	2025-12-05 03:55:31.840684+00	\N		\N		\N			\N	2026-03-07 02:00:14.711029+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2025-12-05 03:55:31.819513+00	2026-03-07 02:00:14.714707+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	ab0acf73-2736-4ed0-b26b-df44f8896ac0	authenticated	authenticated	joel2344@gmail.com	$2a$10$qKQTfwloBWpuYnquvvnCIenA2itxnuaYPtxBAljUWo9B7Bz9a11ZC	2025-12-10 00:21:19.198981+00	\N		\N		\N			\N	2025-12-10 00:21:19.204441+00	{"provider": "email", "providers": ["email"]}	{"sub": "ab0acf73-2736-4ed0-b26b-df44f8896ac0", "role": "guardian", "email": "joel2344@gmail.com", "full_name": "pez joel 2 loslos", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:21:19.193826+00	2025-12-10 00:21:19.20752+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5d439ad0-dd4a-4d8a-99dd-46ae838b647d	authenticated	authenticated	johan.avila@cermatschool.edu.pe	$2a$10$sPnp/IR79Pts2..GOLdMy.iBIdGTSBL6ZRPag.4iC9T40bgNUjEp2	2025-12-10 15:40:16.795675+00	\N		\N		\N			\N	2025-12-10 15:40:16.805011+00	{"provider": "email", "providers": ["email"]}	{"sub": "5d439ad0-dd4a-4d8a-99dd-46ae838b647d", "role": "student", "email": "johan.avila@cermatschool.edu.pe", "full_name": "Johan Avila", "email_verified": true, "phone_verified": false}	\N	2025-12-10 15:40:16.763182+00	2025-12-10 15:40:16.820399+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	112f3e08-c975-4ec6-a46d-b2096ef6d4be	authenticated	authenticated	lucho@gmail.com	$2a$10$EhdTH5mcU2K0CkMpF3/poungOY4IGHxFFWv46pzRIWaSWivptPyva	2025-12-10 15:54:47.482434+00	\N		\N		\N			\N	2025-12-10 16:09:57.094058+00	{"provider": "email", "providers": ["email"]}	{"sub": "112f3e08-c975-4ec6-a46d-b2096ef6d4be", "role": "guardian", "email": "lucho@gmail.com", "full_name": "lucho pedro", "email_verified": true, "phone_verified": false}	\N	2025-12-10 15:54:47.473623+00	2025-12-10 16:09:57.096483+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	471c0d0e-b6fc-4487-b8c2-1eb1ccebec9b	authenticated	authenticated	antonio.lara@cermatschool.edu.pe	$2a$10$HN.kLDddfubczHJoPjJYne788zLUNApaqpnqMuKxWQubj05pb5ykC	2025-12-19 19:39:35.59196+00	\N		\N		\N			\N	2025-12-22 18:59:53.228306+00	{"provider": "email", "providers": ["email"]}	{"sub": "471c0d0e-b6fc-4487-b8c2-1eb1ccebec9b", "role": "student", "email": "antonio.lara@cermatschool.edu.pe", "full_name": "Antonio  Lara", "email_verified": true, "phone_verified": false}	\N	2025-12-19 19:39:35.554989+00	2025-12-22 18:59:53.230415+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8a4d5d5b-c0c9-46be-9431-ee15ccf71522	authenticated	authenticated	kaorikasu22234.yucraapaza222@cermatschool.edu.pe	$2a$10$9xyCIbsiDbiX4ChfLx5ib.BxIL21Ye2rUggZwyiW0xTXrlR6Vf1cy	2025-12-10 00:24:58.922044+00	\N		\N		\N			\N	2025-12-23 00:26:31.608044+00	{"provider": "email", "providers": ["email"]}	{"sub": "8a4d5d5b-c0c9-46be-9431-ee15ccf71522", "role": "student", "email": "kaorikasu22234.yucraapaza222@cermatschool.edu.pe", "full_name": "kaori kasu22234 yucra apaza222", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:24:58.874254+00	2025-12-30 01:19:06.226116+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	75a5d5a9-11b4-4b8d-b931-6c888702ad6d	authenticated	authenticated	jose@gmail.con	$2a$10$YsE5HTKmsMSDGBS9.ZKjFOof53IQeMrdXmwjs/9URtqaiN9y0iAPC	2025-12-19 19:39:36.886292+00	\N		\N		\N			\N	2025-12-19 19:39:36.89099+00	{"provider": "email", "providers": ["email"]}	{"sub": "75a5d5a9-11b4-4b8d-b931-6c888702ad6d", "role": "guardian", "email": "jose@gmail.con", "full_name": "Jose Lara", "email_verified": true, "phone_verified": false}	\N	2025-12-19 19:39:36.869461+00	2025-12-19 19:39:36.894412+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d2020502-096c-4440-bf0c-3f52a6fc3728	authenticated	authenticated	lores.ppp@cermatschool.edu.pe	$2a$10$//gcKKjdoG4FZqXK89PTieedLnScrur0jAbX5XPA4g4Ahzkum16xm	2025-12-10 16:06:14.800019+00	\N		\N		\N			\N	2025-12-10 16:06:14.804573+00	{"provider": "email", "providers": ["email"]}	{"sub": "d2020502-096c-4440-bf0c-3f52a6fc3728", "role": "student", "email": "lores.ppp@cermatschool.edu.pe", "full_name": "lores ppp", "email_verified": true, "phone_verified": false}	\N	2025-12-10 16:06:14.787639+00	2025-12-10 16:06:14.806541+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8fab40e4-97d0-4cbd-a3c0-f5cebbc50310	authenticated	authenticated	asd@gmail.com	$2a$10$LIW8Fl3YGg0HkTP.u/3WNulJzG2yC5/urwxc.JT1TKNsjRktot.Z.	2025-12-10 15:40:18.464019+00	\N		\N		\N			\N	2025-12-10 15:40:18.467897+00	{"provider": "email", "providers": ["email"]}	{"sub": "8fab40e4-97d0-4cbd-a3c0-f5cebbc50310", "role": "guardian", "email": "asd@gmail.com", "full_name": "Jose Anton", "email_verified": true, "phone_verified": false}	\N	2025-12-10 15:40:18.457121+00	2025-12-10 15:40:18.471335+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d3b1e4dc-da81-425e-8668-5a85d90dea48	authenticated	authenticated	pepeppp@gmail.com	$2a$10$Wo4/P3DIKthX2R3eoQTSLua9yJR1E.8zYfWA2Y8Yorakq56aBJI02	2025-12-10 16:06:16.349052+00	\N		\N		\N			\N	2025-12-10 16:06:16.351652+00	{"provider": "email", "providers": ["email"]}	{"sub": "d3b1e4dc-da81-425e-8668-5a85d90dea48", "role": "guardian", "email": "pepeppp@gmail.com", "full_name": "llll lllll", "email_verified": true, "phone_verified": false}	\N	2025-12-10 16:06:16.343327+00	2025-12-10 16:06:16.359547+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	96f4ba8a-6596-485b-9375-838db139b477	authenticated	authenticated	pepfonsales.yanapari@cermatschool.edu.pe	$2a$10$89E0hordpdbW4TAEPKABx.4yJo00yS3sIaSnukV8BntIKEnPE.pQ2	2025-12-10 15:54:46.064385+00	\N		\N		\N			\N	2025-12-10 16:09:06.087784+00	{"provider": "email", "providers": ["email"]}	{"sub": "96f4ba8a-6596-485b-9375-838db139b477", "role": "student", "email": "pepfonsales.yanapari@cermatschool.edu.pe", "full_name": "pep fonsales yana pari", "email_verified": true, "phone_verified": false}	\N	2025-12-10 15:54:46.043547+00	2025-12-10 16:09:06.09061+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f65d7fae-3a5c-4a7d-a34d-941f32c10df3	authenticated	authenticated	joel23444@gmail.com	$2a$10$3uIhaYUbydPsz7exfu5PSudr6f6B1cMaP11xZL0C72pKLR4PCTBIK	2025-12-10 00:24:59.922732+00	\N		\N		\N			\N	2025-12-30 01:47:38.181695+00	{"provider": "email", "providers": ["email"]}	{"sub": "f65d7fae-3a5c-4a7d-a34d-941f32c10df3", "role": "guardian", "email": "joel23444@gmail.com", "full_name": "pez joel 23 loslos3", "email_verified": true, "phone_verified": false}	\N	2025-12-10 00:24:59.912131+00	2025-12-30 01:47:38.184432+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f7962b8d-64a7-4870-9a79-845e113668a8	authenticated	authenticated	emerson.cuna@cermatschool.edu.pe	$2a$10$EAeiWcEyRNaYkVAHw0mXYeoJYa1j2mTcgHN9KE0JkxZ.d6IyJWiJG	2025-12-22 17:35:14.954353+00	\N		\N		\N			\N	2025-12-22 19:01:35.30167+00	{"provider": "email", "providers": ["email"]}	{"sub": "f7962b8d-64a7-4870-9a79-845e113668a8", "role": "student", "email": "emerson.cuna@cermatschool.edu.pe", "full_name": "Emerson Cuña", "email_verified": true, "phone_verified": false}	\N	2025-12-22 17:35:14.936107+00	2025-12-22 19:01:35.304481+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7b4a290f-f1ea-4053-afb6-fd6024d36319	authenticated	authenticated	ronald.quispe@cermatschool.edu.pe	$2a$10$p91hnq3JJbER2gU0LXAd9uO5qaTu7gOjrSidyj5htwT.cX/5umQi2	2025-12-22 17:04:43.645589+00	\N		\N		\N			\N	2025-12-22 17:06:24.346711+00	{"provider": "email", "providers": ["email"]}	{"sub": "7b4a290f-f1ea-4053-afb6-fd6024d36319", "role": "student", "email": "ronald.quispe@cermatschool.edu.pe", "full_name": "Ronald Quispe", "email_verified": true, "phone_verified": false}	\N	2025-12-22 17:04:43.623365+00	2025-12-22 17:06:24.350833+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	dc5799a6-cda2-4a85-8903-4799402e71fb	authenticated	authenticated	ronaldo@gmail.com	$2a$10$rMRAvJ6AQcBWXufno.7sJufF2B1mFhJ32sTRr9zqPGxnAp.HUNcSO	2025-12-22 17:04:44.840976+00	\N		\N		\N			\N	2025-12-22 17:06:47.693936+00	{"provider": "email", "providers": ["email"]}	{"sub": "dc5799a6-cda2-4a85-8903-4799402e71fb", "role": "guardian", "email": "ronaldo@gmail.com", "full_name": "Ronaldo Quiste", "email_verified": true, "phone_verified": false}	\N	2025-12-22 17:04:44.835509+00	2025-12-22 17:06:47.69701+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	14c0d2ba-a330-4436-9be8-58d75eb5947a	authenticated	authenticated	lorenzo@gmail.com	$2a$10$2HM2MlvpPCVVuX7K0vR6POjkCEDmceJYnMwSdVqf6FLmDQW6AmMf2	2025-12-22 17:35:15.948851+00	\N		\N		\N			\N	2025-12-22 17:35:15.951757+00	{"provider": "email", "providers": ["email"]}	{"sub": "14c0d2ba-a330-4436-9be8-58d75eb5947a", "role": "guardian", "email": "lorenzo@gmail.com", "full_name": "Lorenzo Cuña", "email_verified": true, "phone_verified": false}	\N	2025-12-22 17:35:15.941893+00	2025-12-22 17:35:15.955086+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- TOC entry 5152 (class 0 OID 17541)
-- Dependencies: 382
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_years (id, year, start_date, end_date, is_active, created_at) FROM stdin;
82fad6ef-2963-4d3f-b42e-4d40f83929da	2025	2025-03-01	2025-12-20	t	2025-12-08 17:54:58.978512+00
88a29365-ba5f-4ce5-af91-e274510b4f26	2026	2026-03-12	2026-12-25	f	2025-12-10 15:59:29.722281+00
\.


--
-- TOC entry 5167 (class 0 OID 17947)
-- Dependencies: 397
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, audience, section_id, status, priority, attachment_url, created_by, approved_by, published_at, expires_at, created_at, updated_at) FROM stdin;
3c8fb64d-5de1-42ad-8ab9-e1e5522296a6	docente	reunion	docentes	\N	publicado	normal	http://localhost:5173/communications/teacher	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	2025-12-09 21:52:02.136+00	2025-12-19 00:00:00+00	2025-12-09 21:49:30.922378+00	2025-12-09 21:52:02.136+00
\.


--
-- TOC entry 5166 (class 0 OID 17897)
-- Dependencies: 396
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_submissions (id, assignment_id, student_id, submission_text, attachment_url, score, feedback, status, submitted_at, reviewed_at, reviewed_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5165 (class 0 OID 17861)
-- Dependencies: 395
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, course_id, section_id, title, description, instructions, due_date, max_score, attachment_url, created_by, created_at, updated_at) FROM stdin;
9cf37264-90f5-40a9-ab7f-bcef7002e7e4	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	tareita	nada	nada	2025-12-19 00:00:00+00	20	http://localhost:5173/tasks/teacher	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-09 07:18:33.414163+00	2025-12-10 02:06:19.371+00
dfa29e64-0485-44bb-a28a-93b84061b53b	6c2b34b8-3248-4332-a064-2cdfff6fe87f	00eb9249-d8ef-48d7-9ad3-e285de259bb4	ensayo	arto	\N	2025-12-10 00:00:00+00	20	http://localhost:5173/tasks/teacher	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 16:07:25.142493+00	2025-12-10 16:07:25.142493+00
c50060aa-c306-46be-a547-ed87c9ae5900	6c2b34b8-3248-4332-a064-2cdfff6fe87f	00eb9249-d8ef-48d7-9ad3-e285de259bb4	Tarea Cuestionario	ninguna	nada	2025-12-30 00:00:00+00	20	http://localhost:5173/tasks/teacher	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-30 01:45:01.124471+00	2025-12-30 01:45:01.124471+00
\.


--
-- TOC entry 5163 (class 0 OID 17771)
-- Dependencies: 393
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, student_id, section_id, course_id, date, status, justification, recorded_by, created_at, updated_at) FROM stdin;
b58b4ce7-d3be-481f-a0fe-8f36b92d86fb	4daa56a9-6e2f-4638-9e4a-fa1872f12e04	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-10	tarde	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 01:28:22.637425+00	2025-12-10 01:28:22.637425+00
1620681a-b6f9-4405-82b9-fc2e6d2750ff	33bf68fe-ecc5-4362-924b-ee5ec2ac2a4d	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-10	falta	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 01:28:22.637425+00	2025-12-10 01:28:22.637425+00
686e9e76-c993-4e88-a614-a279152cf24f	4dd6e4d7-af07-4d0c-93c0-d79218ecc8e8	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-10	falta	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 01:28:22.637425+00	2025-12-10 01:28:22.637425+00
5e942c0b-fca8-4491-bccf-ecb352cf1261	98a75b52-9e1b-423a-89ef-4ce2f78d8141	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-10	tarde	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 01:28:22.637425+00	2025-12-10 01:28:22.637425+00
1d3145e2-bbbf-49b0-97a9-a396f521f0fa	89f31b92-613d-421f-9d52-a1805b45c405	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-10	presente	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 01:28:22.637425+00	2025-12-10 01:28:22.637425+00
c74eb4c9-adbe-420d-8c48-4b030c7770f3	a8a2d256-a127-44b7-81f7-2e0e7381b404	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-10	presente	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 01:28:22.637425+00	2025-12-10 01:28:22.637425+00
f025a11c-3682-4878-b47c-448222a0a61e	e2ceb392-d03d-449c-bd08-a38dea1c580a	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-10	presente	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 01:28:22.637425+00	2025-12-10 01:28:22.637425+00
17f0c3ed-5382-4c77-903a-481f2386e1be	2961c410-45c3-46c0-8f4a-8d61d4192baa	00eb9249-d8ef-48d7-9ad3-e285de259bb4	6c2b34b8-3248-4332-a064-2cdfff6fe87f	2025-12-30	tarde	mal	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-30 01:44:10.300068+00	2025-12-30 01:44:10.300068+00
\.


--
-- TOC entry 5172 (class 0 OID 21617)
-- Dependencies: 402
-- Data for Name: attendance_justifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_justifications (id, attendance_id, student_id, guardian_id, reason, attachment_url, status, reviewed_by, reviewed_at, review_notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5174 (class 0 OID 21987)
-- Dependencies: 404
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, reason, ip_address, user_agent, created_at) FROM stdin;
13e20d9f-754c-4f40-b5aa-0f93a07c4942	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	update	evaluation	d512b7b0-6402-4378-bcb2-083f6bdd5ac9	{"id": "d512b7b0-6402-4378-bcb2-083f6bdd5ac9", "grade": "AD", "status": "borrador", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-09T07:09:16.365929+00:00", "student_id": "a8a2d256-a127-44b7-81f7-2e0e7381b404", "updated_at": "2025-12-09T07:09:16.365929+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "muy bien", "published_at": null, "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	{"id": "d512b7b0-6402-4378-bcb2-083f6bdd5ac9", "grade": "AD", "status": "publicada", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-09T07:09:16.365929+00:00", "student_id": "a8a2d256-a127-44b7-81f7-2e0e7381b404", "updated_at": "2025-12-09T21:37:53.207+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "muy bien", "published_at": "2025-12-09T21:37:53.207+00:00", "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	\N	\N	\N	2025-12-09 21:37:53.275156+00
09c698b0-0c78-4d37-aa2c-ff026dc97826	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	update	evaluation	d512b7b0-6402-4378-bcb2-083f6bdd5ac9	{"id": "d512b7b0-6402-4378-bcb2-083f6bdd5ac9", "grade": "AD", "status": "publicada", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-09T07:09:16.365929+00:00", "student_id": "a8a2d256-a127-44b7-81f7-2e0e7381b404", "updated_at": "2025-12-09T21:37:53.207+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "muy bien", "published_at": "2025-12-09T21:37:53.207+00:00", "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	{"id": "d512b7b0-6402-4378-bcb2-083f6bdd5ac9", "grade": "AD", "status": "borrador", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-09T07:09:16.365929+00:00", "student_id": "a8a2d256-a127-44b7-81f7-2e0e7381b404", "updated_at": "2025-12-30T01:31:32.595+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "muy bien", "published_at": "2025-12-09T21:37:53.207+00:00", "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	\N	\N	\N	2025-12-30 01:31:32.554323+00
30fa17d5-8383-48e9-b829-6421805a2a5e	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	update	evaluation	18f022d1-5f07-4669-a1b7-b66f03e7c516	{"id": "18f022d1-5f07-4669-a1b7-b66f03e7c516", "grade": "AD", "status": "publicada", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-10T16:06:57.412288+00:00", "student_id": "2961c410-45c3-46c0-8f4a-8d61d4192baa", "updated_at": "2025-12-10T16:06:57.412288+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "bueno", "published_at": "2025-12-10T16:06:59.185+00:00", "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	{"id": "18f022d1-5f07-4669-a1b7-b66f03e7c516", "grade": "A", "status": "borrador", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-10T16:06:57.412288+00:00", "student_id": "2961c410-45c3-46c0-8f4a-8d61d4192baa", "updated_at": "2025-12-30T01:44:24.099+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "bueno", "published_at": "2025-12-10T16:06:59.185+00:00", "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	\N	\N	\N	2025-12-30 01:44:24.074898+00
a7f2416e-51fb-4782-a5fe-a2b7501449f4	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	update	evaluation	18f022d1-5f07-4669-a1b7-b66f03e7c516	{"id": "18f022d1-5f07-4669-a1b7-b66f03e7c516", "grade": "A", "status": "borrador", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-10T16:06:57.412288+00:00", "student_id": "2961c410-45c3-46c0-8f4a-8d61d4192baa", "updated_at": "2025-12-30T01:44:24.099+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "bueno", "published_at": "2025-12-10T16:06:59.185+00:00", "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	{"id": "18f022d1-5f07-4669-a1b7-b66f03e7c516", "grade": "A", "status": "publicada", "course_id": "6c2b34b8-3248-4332-a064-2cdfff6fe87f", "period_id": "3e156318-49bd-4949-a8fe-01ea16ed1ab3", "created_at": "2025-12-10T16:06:57.412288+00:00", "student_id": "2961c410-45c3-46c0-8f4a-8d61d4192baa", "updated_at": "2025-12-30T01:44:27.556+00:00", "recorded_by": "4ac1dd30-d8b6-4bc2-b508-1b618070cc51", "observations": "bueno", "published_at": "2025-12-30T01:44:27.556+00:00", "competency_id": "323128a4-e54a-47d6-ab13-b67607c47e6b"}	\N	\N	\N	2025-12-30 01:44:27.418284+00
\.


--
-- TOC entry 5171 (class 0 OID 18089)
-- Dependencies: 401
-- Data for Name: cash_closures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cash_closures (id, closure_date, opening_balance, cash_received, expected_balance, actual_balance, difference, notes, closed_by, created_at, cashier_id, opening_time, closing_time, total_cash, total_cards, total_transfers, total_yape, total_plin, total_amount, payments_count) FROM stdin;
e19952f2-02b0-404b-b02e-9702a219f2eb	2025-12-10	0.00	0.00	0.00	0.00	0.00	\N	\N	2025-12-10 00:38:19.289828+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	2025-12-10 00:38:19.285+00	\N	0.00	0.00	0.00	0.00	0.00	0.00	0
\.


--
-- TOC entry 5168 (class 0 OID 17997)
-- Dependencies: 398
-- Data for Name: charges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.charges (id, student_id, academic_year_id, type, description, amount, discount, final_amount, due_date, status, created_by, created_at, updated_at, concept_id, period_month, period_year) FROM stdin;
\.


--
-- TOC entry 5157 (class 0 OID 17625)
-- Dependencies: 387
-- Data for Name: competencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competencies (id, course_id, code, description, order_index, created_at) FROM stdin;
323128a4-e54a-47d6-ab13-b67607c47e6b	6c2b34b8-3248-4332-a064-2cdfff6fe87f	C1,C2,C3	cumplir	1	2025-12-08 18:01:59.841945+00
\.


--
-- TOC entry 5162 (class 0 OID 17731)
-- Dependencies: 392
-- Data for Name: course_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_assignments (id, teacher_id, course_id, section_id, academic_year_id, is_tutor, created_at) FROM stdin;
\.


--
-- TOC entry 5193 (class 0 OID 34872)
-- Dependencies: 425
-- Data for Name: course_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_schedules (id, academic_year_id, section_id, course_id, teacher_id, day_of_week, start_time, end_time, room_number, created_at, updated_at) FROM stdin;
2b035291-2f93-4995-9fc0-b9d144834624	82fad6ef-2963-4d3f-b42e-4d40f83929da	741116ee-ae2e-443f-ac98-17dc4479ad13	2b4c8279-cdda-4f11-b7c2-f8a7bc6c1b77	43d662f7-accf-4532-a39b-582cf1e7e2bc	1	09:30:00	10:30:00	\N	2025-12-16 20:35:12.430314+00	2025-12-17 16:57:42.853026+00
72dbe7b6-fff2-4a53-b4f7-293a0de9afca	82fad6ef-2963-4d3f-b42e-4d40f83929da	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	43d662f7-accf-4532-a39b-582cf1e7e2bc	2	07:00:00	08:00:00	lnb2	2025-12-16 19:26:59.528188+00	2025-12-17 18:33:01.439994+00
231d4754-39c3-4734-9bb6-1d825dcfd541	82fad6ef-2963-4d3f-b42e-4d40f83929da	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	43d662f7-accf-4532-a39b-582cf1e7e2bc	4	07:00:00	09:30:00	\N	2025-12-19 18:32:58.803311+00	2025-12-19 18:32:58.803311+00
fef31c41-9afa-42e2-be01-8e178e64421e	82fad6ef-2963-4d3f-b42e-4d40f83929da	741116ee-ae2e-443f-ac98-17dc4479ad13	f0a45088-8704-42ea-853f-f12909844839	43d662f7-accf-4532-a39b-582cf1e7e2bc	3	07:00:00	09:00:00	\N	2025-12-17 17:17:43.295826+00	2025-12-19 18:33:10.792708+00
c8ae607c-15c1-417d-9cbe-384a2d82db88	82fad6ef-2963-4d3f-b42e-4d40f83929da	741116ee-ae2e-443f-ac98-17dc4479ad13	543a3622-283a-42c0-a741-215b3286982c	43d662f7-accf-4532-a39b-582cf1e7e2bc	1	07:00:00	08:00:00	\N	2025-12-16 21:19:27.84106+00	2025-12-19 18:34:33.495528+00
e0048dd6-6aeb-403b-975c-c17867098ef6	82fad6ef-2963-4d3f-b42e-4d40f83929da	741116ee-ae2e-443f-ac98-17dc4479ad13	2b4c8279-cdda-4f11-b7c2-f8a7bc6c1b77	43d662f7-accf-4532-a39b-582cf1e7e2bc	2	10:00:00	11:30:00	as23	2025-12-22 18:22:01.848237+00	2025-12-22 18:22:01.848237+00
\.


--
-- TOC entry 5156 (class 0 OID 17608)
-- Dependencies: 386
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, code, name, description, grade_level_id, hours_per_week, created_at, color) FROM stdin;
55e90a7a-a681-4710-a3f4-bad6ac24ceaa	ED.CIV-101	EDUCACION CIVICA	\N	c7f28d98-81f1-417e-9ebd-dc6daddab445	4	2025-12-16 20:04:16.858026+00	#1D4ED8
f23ee0c9-1118-49cd-89f3-af31c36498b1	COM-101	COMUNICACION	\N	c7f28d98-81f1-417e-9ebd-dc6daddab445	2	2025-12-16 20:05:13.131896+00	#1D4ED8
6c2b34b8-3248-4332-a064-2cdfff6fe87f	MAT	MATEMATICA 1	\N	c7f28d98-81f1-417e-9ebd-dc6daddab445	12	2025-12-08 18:01:40.225253+00	#84CC16
f0a45088-8704-42ea-853f-f12909844839	EDU-REL-101	EDUCACION RELIGIOSA	\N	c7f28d98-81f1-417e-9ebd-dc6daddab445	2	2025-12-16 20:04:58.971631+00	#06B6D4
543a3622-283a-42c0-a741-215b3286982c	HIST-101	HISTORIA DEL PERU	\N	c7f28d98-81f1-417e-9ebd-dc6daddab445	2	2025-12-16 20:04:00.008754+00	#6366F1
2b4c8279-cdda-4f11-b7c2-f8a7bc6c1b77	CIE-TEC-101	CIENCIA Y TECNOLOCIA	\N	c7f28d98-81f1-417e-9ebd-dc6daddab445	4	2025-12-16 20:04:40.883483+00	#84CC16
\.


--
-- TOC entry 5182 (class 0 OID 26146)
-- Dependencies: 414
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discounts (id, name, type, value, scope, specific_concept_id, description, is_active, created_at, updated_at) FROM stdin;
250491bd-c1b1-4736-a218-311a228aa9cf	descuetno por hermanos 10%	porcentaje	10.00	pension	\N	\N	t	2025-12-09 23:35:52.980542+00	2025-12-09 23:35:52.944+00
\.


--
-- TOC entry 5176 (class 0 OID 23073)
-- Dependencies: 406
-- Data for Name: enrollment_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollment_applications (id, student_first_name, student_last_name, student_document_type, student_document_number, student_birth_date, student_gender, student_address, student_photo_url, guardian_first_name, guardian_last_name, guardian_document_type, guardian_document_number, guardian_phone, guardian_email, guardian_address, guardian_relationship, grade_level_id, previous_school, has_special_needs, special_needs_description, emergency_contact_name, emergency_contact_phone, notes, status, application_date, reviewed_at, reviewed_by, rejection_reason, admin_notes, academic_year_id, created_at, updated_at) FROM stdin;
0677869c-fd90-47cf-998f-c9ce0000487a	david	yucra mamani	DNI	74242504	2025-12-10	M	jr life	\N	samuel	yucra mamani	DNI	74242504	944042223	david@gmail.com	asd	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	jt life	f		yaneth	944042633		approved	2025-12-09 06:14:38.509906+00	2025-12-09 06:56:58.385127+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-09 06:14:38.509906+00	2025-12-09 06:56:58.385127+00
2277ecaf-2605-4c89-850b-9750295e4700	casandra	yucra mamani	DNI	74242508	2025-12-18	F	jr life	\N	david	yucra mamani	DNI	74274256	944042223	david@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	I.E PRIAMRIA	f		yaneth	944042223		approved	2025-12-09 22:40:08.566792+00	2025-12-09 22:40:16.99804+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-09 22:40:08.566792+00	2025-12-09 22:40:16.99804+00
e02819c1-d4a0-45ab-af2e-8a09cf6b607b	yasmin	yucra mamani	DNI	74242502	2025-12-18	F	jr life	\N	david	yucra mamani	DNI	74274256	944042223	david@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	I.E PRIAMRIA	f		yaneth	944042223		approved	2025-12-09 22:57:15.459586+00	2025-12-09 22:57:29.2215+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-09 22:57:15.459586+00	2025-12-09 22:57:29.2215+00
3bea2efb-93fe-4cb6-a03a-f69a9eb607b5	kasu	yucra apaza	DNI	742503235	2025-11-11	F	jr arequipa	\N	joel	loslos	DNI	744444444	94444444	joel@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	i.e.pedro	f		solos montes	999999999		approved	2025-12-10 00:12:54.798945+00	2025-12-10 00:13:08.697185+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:12:54.798945+00	2025-12-10 00:13:08.697185+00
7085241c-8e4f-429c-9066-317d344a1ef5	kaori kasu	yucra apaza	DNI	66666666	2025-11-11	F	jr arequipa	\N	pez joel 	loslos	DNI	7777777	94444444	joel2@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	i.e.pedro	f		solos montes	999999999		approved	2025-12-10 00:15:42.13503+00	2025-12-10 00:15:52.093813+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:15:42.13503+00	2025-12-10 00:15:52.093813+00
66a1404c-a534-424d-b4d9-03040534aba9	kaori kasu22	yucra apaza	DNI	66666666	2025-11-11	M	jr arequipa	\N	pez joel 2	loslos	DNI	7777777	94444444	joel23@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	i.e.pedro	f		solos montes	999999999		approved	2025-12-10 00:17:21.998839+00	2025-12-10 00:18:32.656176+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:17:21.998839+00	2025-12-10 00:18:32.656176+00
345b8893-e3c5-4b1a-8f0b-7547f09d1056	kaori kasu2223	yucra apaza2	DNI	9999999999	2025-11-11	F	jr arequipa	\N	pez joel 2	loslos	DNI	7877777	94444444	joel2344@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	i.e.pedro	f		solos montes	2222222222		approved	2025-12-10 00:20:57.675421+00	2025-12-10 00:21:17.949089+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:20:57.675421+00	2025-12-10 00:21:17.949089+00
efb5e6de-2ded-46df-afad-79d5b84dada4	kaori kasu22234	yucra apaza222	DNI	99999222	2025-11-11	F	jr arequipa	\N	pez joel 23	loslos3	DNI	7877775	94444444	joel23444@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	i.e.pedro	f		solos montes	944042223		approved	2025-12-10 00:24:46.209048+00	2025-12-10 00:24:58.148391+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:24:46.209048+00	2025-12-10 00:24:58.148391+00
6e3bfbf6-6e2e-4e02-b183-222dd8952eff	Johan	Avila	DNI	72344556	2001-01-18	M	Av. Sol 123	\N	Jose	Anton	DNI	72456789	962344556	asd@gmail.com	Av. Sol 123	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	San Martin	f		Rosaura	923445456		approved	2025-12-10 15:39:46.090069+00	2025-12-10 15:40:15.850975+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 15:39:46.090069+00	2025-12-10 15:40:15.850975+00
89812d9f-1b02-4e1e-87a5-77b8c8c880d7	david robert 	yucra mamani	DNI	74242508	2025-07-06	M	jr life	\N	ronal	yucra	DNI	742466632	9440422223	ronal@gmail.com	Av Infancia N°300	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	I.E san Juan	f		rosa	944042223		pending	2025-12-10 15:52:12.050389+00	\N	\N	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 15:52:12.050389+00	2025-12-10 15:52:12.050389+00
75ba584c-f737-4c60-b3b5-f90d481ca2f1	pep fonsales	yana pari	DNI	742422203	2025-12-10	M	jr.lifi	\N	lucho	pedro	DNI	74444444	944444444	lucho@gmail.com	jr life	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	ie life	f		rosa	9999999999		approved	2025-12-10 15:54:33.675603+00	2025-12-10 15:54:45.446077+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 15:54:33.675603+00	2025-12-10 15:54:45.446077+00
6a94e984-f0e5-4200-991c-5961f3410952	lores	ppp	DNI	44444444	2025-12-10	M	je life	\N	llll	lllll	DNI	444444444	444444444	pepeppp@gmail.com	jr life	Padre	cadf8994-c29d-4557-9be7-f1d838293ea3	iiiii	f		jjjj	999999999		approved	2025-12-10 16:05:56.825341+00	2025-12-10 16:06:14.173547+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 16:05:56.825341+00	2025-12-10 16:06:14.173547+00
baff48fd-62ef-429a-8739-342479ec93fa	Antonio 	Lara	DNI	72344546	2009-01-19	M	Av Infancia N°300	\N	Jose	Lara	DNI	72344545	982233432	jose@gmail.con	Av Infancia N°300	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	Las Mercedes	f		Jose	982233432		approved	2025-12-19 19:38:59.255175+00	2025-12-19 19:39:34.571913+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-19 19:38:59.255175+00	2025-12-19 19:39:34.571913+00
4c07cb30-a890-459c-aa94-acae553f86a2	Raphael	Cuña	DNI	72633434	2005-01-22	M	Av Infancia N°300	\N	Renzo 	Cuña	DNI	72631474	982343432	renzo@gmail.com	Av Infancia N°300	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	Viva Esperanza	f		Renzo Cuña	982343432		approved	2025-12-22 16:30:50.808316+00	2025-12-22 16:31:09.35155+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 16:30:50.808316+00	2025-12-22 16:31:09.35155+00
6c75d6be-08c3-4387-be5a-b094de2af068	Nando	Cuña	DNI	726314711	2016-01-22	M	Av Infancia N°300	\N	Jhonatan	Cuña	DNI	72344556	980786756	jhonatan@gmail.com	Av Infancia N°300	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	Viva Esperanza	f		Jhonatan	980786756		approved	2025-12-22 17:02:22.716692+00	2025-12-22 17:02:40.999244+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:02:22.716692+00	2025-12-22 17:02:40.999244+00
8724c766-1386-4b9f-b235-00ee512bd1ec	Ronald	Quispe	DNI	72344543	2025-12-22	M	Av Infancia N°300	\N	Ronaldo	Quiste	DNI	74545454	989323234	ronaldo@gmail.com	Av Infancia N°300	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	Viva Esperanza	f		Ronaldo 	989323234		approved	2025-12-22 17:04:33.451852+00	2025-12-22 17:04:43.134745+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:04:33.451852+00	2025-12-22 17:04:43.134745+00
55ec3709-6bce-4b78-bfd1-7fc1cae6a830	Esther	Cuña	DNI	72383443	2025-12-22	M	Av Infancia N°300	\N	Rosalia	Cuña	DNI	23782323	989233232	rosalia@gmail.com	Av Infancia N°300	Madre	c7f28d98-81f1-417e-9ebd-dc6daddab445	San Martin	f		Rosalia Cuña	989233232		approved	2025-12-22 17:20:07.69511+00	2025-12-22 17:20:21.128981+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:20:07.69511+00	2025-12-22 17:20:21.128981+00
d77649e6-2089-4d8d-a30b-d4345b18116f	Rosmery	Cuña	DNI	78232322	2025-12-22	F	Av Infancia N°300	\N	Rosa	Cuña	DNI	78232323	989322323	rosa@gmail.com	Av Infancia N°300	Madre	c7f28d98-81f1-417e-9ebd-dc6daddab445	San martin	f		Rosa	989322323		approved	2025-12-22 17:25:47.146126+00	2025-12-22 17:26:01.77409+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:25:47.146126+00	2025-12-22 17:26:01.77409+00
3ba017fe-1cd3-4697-8070-22913a30e327	Renzo	Cuña	DNI	72832323	2025-12-22	M	Av Infancia N°300	\N	Mateo	Cuña	DNI	72332323	72833443	mateo@gmai.com	Av Infancia N°300	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	San Martin	f		Mateo	72833443		approved	2025-12-22 17:30:23.881225+00	2025-12-22 17:30:33.372154+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:30:23.881225+00	2025-12-22 17:30:33.372154+00
83348782-6ef3-4135-9f72-5d12d1b71d95	Emerson	Cuña	DNI	72633443	2009-02-04	M	Av Infancia N°300	\N	Lorenzo	Cuña	DNI	72833443	72833443	lorenzo@gmail.com	Av Infancia N°300	Padre	c7f28d98-81f1-417e-9ebd-dc6daddab445	Sansadasd	f		Lorenzo	72833443		approved	2025-12-22 17:35:04.187037+00	2025-12-22 17:35:14.404121+00	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	\N	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:35:04.187037+00	2025-12-22 17:35:14.404121+00
\.


--
-- TOC entry 5164 (class 0 OID 17823)
-- Dependencies: 394
-- Data for Name: evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluations (id, student_id, course_id, competency_id, period_id, grade, observations, status, recorded_by, published_at, created_at, updated_at) FROM stdin;
3e545c3b-1f47-4484-a840-55829ba11084	ca8b62ee-aee8-41ff-8d93-f2716741a49b	6c2b34b8-3248-4332-a064-2cdfff6fe87f	323128a4-e54a-47d6-ab13-b67607c47e6b	3e156318-49bd-4949-a8fe-01ea16ed1ab3	AD	\N	borrador	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	\N	2025-12-30 01:31:32.078974+00	2025-12-30 01:31:32.078974+00
d512b7b0-6402-4378-bcb2-083f6bdd5ac9	a8a2d256-a127-44b7-81f7-2e0e7381b404	6c2b34b8-3248-4332-a064-2cdfff6fe87f	323128a4-e54a-47d6-ab13-b67607c47e6b	3e156318-49bd-4949-a8fe-01ea16ed1ab3	AD	muy bien	borrador	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-09 21:37:53.207+00	2025-12-09 07:09:16.365929+00	2025-12-30 01:31:32.595+00
18f022d1-5f07-4669-a1b7-b66f03e7c516	2961c410-45c3-46c0-8f4a-8d61d4192baa	6c2b34b8-3248-4332-a064-2cdfff6fe87f	323128a4-e54a-47d6-ab13-b67607c47e6b	3e156318-49bd-4949-a8fe-01ea16ed1ab3	A	bueno	publicada	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-30 01:44:27.556+00	2025-12-10 16:06:57.412288+00	2025-12-30 01:44:27.556+00
\.


--
-- TOC entry 5179 (class 0 OID 26093)
-- Dependencies: 411
-- Data for Name: fee_concepts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_concepts (id, name, type, base_amount, periodicity, description, is_active, created_at, updated_at) FROM stdin;
58def855-19d9-4d3b-b216-839aa1a4fa52	pension  2025	pension	100.00	mensual	\N	t	2025-12-09 23:35:00.447404+00	2025-12-09 23:35:00.295+00
\.


--
-- TOC entry 5180 (class 0 OID 26106)
-- Dependencies: 412
-- Data for Name: financial_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_plans (id, name, academic_year_id, concept_id, number_of_installments, description, is_active, created_at, updated_at) FROM stdin;
bf8588f4-aa4c-4786-8de6-fbce12e7c392	plan 205	82fad6ef-2963-4d3f-b42e-4d40f83929da	58def855-19d9-4d3b-b216-839aa1a4fa52	1	\N	t	2025-12-09 23:35:34.321901+00	2025-12-09 23:35:27.727+00
3aa4bd68-5ee1-45d8-a9c0-304a950af435	plan todo completo	82fad6ef-2963-4d3f-b42e-4d40f83929da	58def855-19d9-4d3b-b216-839aa1a4fa52	2	\N	t	2025-12-10 16:03:23.269995+00	2025-12-10 16:03:24.749+00
\.


--
-- TOC entry 5154 (class 0 OID 17575)
-- Dependencies: 384
-- Data for Name: grade_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade_levels (id, level, grade, name, created_at) FROM stdin;
c7f28d98-81f1-417e-9ebd-dc6daddab445	primaria	1	1ero de Primaria	2025-12-08 17:54:58.978512+00
cadf8994-c29d-4557-9be7-f1d838293ea3	secundaria	1	1 secundaria	2025-12-10 16:00:28.315348+00
\.


--
-- TOC entry 5159 (class 0 OID 17668)
-- Dependencies: 389
-- Data for Name: guardians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guardians (id, user_id, first_name, last_name, dni, phone, email, address, relationship, is_primary, created_at, updated_at) FROM stdin;
2e1df12c-86db-4b42-a95c-0afb27791f09	\N	samuel	yucra mamani	74242504	944042223	david@gmail.com	asd	Padre	f	2025-12-09 06:56:58.385127+00	2025-12-09 06:56:58.385127+00
d06c8c42-2cf3-46b8-a548-3440d7b2172f	e6b72532-188d-4e0c-9985-dd2834e6ce71	david	yucra mamani	74274256	944042223	david@gmail.com	jr life	Padre	f	2025-12-09 22:40:16.99804+00	2025-12-09 22:40:16.99804+00
5322d436-8982-4a93-ae9d-1f650f30b924	\N	joel	loslos	744444444	94444444	joel@gmail.com	jr life	Padre	f	2025-12-10 00:13:08.697185+00	2025-12-10 00:13:08.697185+00
dd36ecb8-5a36-4901-afc1-792e4591c1b8	\N	pez joel 	loslos	7777777	94444444	joel2@gmail.com	jr life	Padre	f	2025-12-10 00:15:52.093813+00	2025-12-10 00:15:52.093813+00
aee80822-2d03-425f-9f19-72e3c41e5c9d	\N	pez joel 2	loslos	7877777	94444444	joel2344@gmail.com	jr life	Padre	f	2025-12-10 00:21:17.949089+00	2025-12-10 00:21:17.949089+00
d66b6c8b-0b14-48ca-a0e7-a34c8a4da4bd	\N	pez joel 23	loslos3	7877775	94444444	joel23444@gmail.com	jr life	Padre	f	2025-12-10 00:24:58.148391+00	2025-12-10 00:24:58.148391+00
06615899-3857-43b8-9f59-8c0a2568b488	f65d7fae-3a5c-4a7d-a34d-941f32c10df3	pez joel 23	loslos3	\N	94444444	joel23444@gmail.com	\N	Padre	f	2025-12-10 00:25:00.392602+00	2025-12-10 00:25:00.392602+00
32b4d6f3-d1c4-4abe-acee-9d3cfc62e40a	\N	Jose	Anton	72456789	962344556	asd@gmail.com	Av. Sol 123	Padre	f	2025-12-10 15:40:15.850975+00	2025-12-10 15:40:15.850975+00
aa0c3b5d-947c-468b-bbaa-ffdb30f55f2f	8fab40e4-97d0-4cbd-a3c0-f5cebbc50310	Jose	Anton	\N	962344556	asd@gmail.com	\N	Padre	f	2025-12-10 15:40:19.66555+00	2025-12-10 15:40:19.66555+00
18f19607-104b-400d-9468-3a6084e93b7a	\N	lucho	pedro	74444444	944444444	lucho@gmail.com	jr life	Padre	f	2025-12-10 15:54:45.446077+00	2025-12-10 15:54:45.446077+00
6478bfc0-fdd5-45fc-991b-d9bde433ba7a	112f3e08-c975-4ec6-a46d-b2096ef6d4be	lucho	pedro	\N	944444444	lucho@gmail.com	\N	Padre	f	2025-12-10 15:54:48.182355+00	2025-12-10 15:54:48.182355+00
3915bfc3-9048-4f20-b226-1b6c2b7e65c5	\N	llll	lllll	444444444	444444444	pepeppp@gmail.com	jr life	Padre	f	2025-12-10 16:06:14.173547+00	2025-12-10 16:06:14.173547+00
04ac23b2-f64d-4c14-a89b-36ff86f3c454	d3b1e4dc-da81-425e-8668-5a85d90dea48	llll	lllll	\N	444444444	pepeppp@gmail.com	\N	Padre	f	2025-12-10 16:06:16.995114+00	2025-12-10 16:06:16.995114+00
8f163007-bc4d-48f5-8890-f5e59eaf1ab8	\N	Jose	Lara	72344545	982233432	jose@gmail.con	Av Infancia N°300	Padre	f	2025-12-19 19:39:34.571913+00	2025-12-19 19:39:34.571913+00
bfbc9e34-6182-43f7-b480-ee14deecb9df	75a5d5a9-11b4-4b8d-b931-6c888702ad6d	Jose	Lara	\N	982233432	jose@gmail.con	\N	Padre	f	2025-12-19 19:39:37.607148+00	2025-12-19 19:39:37.607148+00
f09ab96f-27d4-4da3-9c2c-6d7b878e3a1f	\N	Renzo 	Cuña	72631474	982343432	renzo@gmail.com	Av Infancia N°300	Padre	f	2025-12-22 16:31:09.35155+00	2025-12-22 16:31:09.35155+00
183226c1-1e40-4353-bdc1-f001d2871217	\N	Jhonatan	Cuña	72344556	980786756	jhonatan@gmail.com	Av Infancia N°300	Padre	f	2025-12-22 17:02:40.999244+00	2025-12-22 17:02:40.999244+00
fb745f8d-06b3-4137-a37b-67f241819283	\N	Ronaldo	Quiste	74545454	989323234	ronaldo@gmail.com	Av Infancia N°300	Padre	f	2025-12-22 17:04:43.134745+00	2025-12-22 17:04:43.134745+00
80d77cf0-7906-4604-9c87-93f99cff37bb	dc5799a6-cda2-4a85-8903-4799402e71fb	Ronaldo	Quiste	\N	989323234	ronaldo@gmail.com	\N	Padre	f	2025-12-22 17:04:45.524119+00	2025-12-22 17:04:45.524119+00
fb189567-48b1-49c2-95ca-02c4bd99e153	\N	Rosalia	Cuña	23782323	989233232	rosalia@gmail.com	Av Infancia N°300	Madre	f	2025-12-22 17:20:21.128981+00	2025-12-22 17:20:21.128981+00
f43bd54d-663e-4ce6-a556-441dc4b46a8b	\N	Rosa	Cuña	78232323	989322323	rosa@gmail.com	Av Infancia N°300	Madre	f	2025-12-22 17:26:01.77409+00	2025-12-22 17:26:01.77409+00
26ee4cf5-b2f2-4045-aaf2-cbaf928b219e	\N	Mateo	Cuña	72332323	72833443	mateo@gmai.com	Av Infancia N°300	Padre	f	2025-12-22 17:30:33.372154+00	2025-12-22 17:30:33.372154+00
dbf86909-c6e6-4a22-a60e-ffb49412b41b	\N	Lorenzo	Cuña	72833443	72833443	lorenzo@gmail.com	Av Infancia N°300	Padre	f	2025-12-22 17:35:14.404121+00	2025-12-22 17:35:14.404121+00
d6770786-270f-42e2-b885-bde9a37e2fd0	14c0d2ba-a330-4436-9be8-58d75eb5947a	Lorenzo	Cuña	\N	72833443	lorenzo@gmail.com	\N	Padre	f	2025-12-22 17:35:16.530136+00	2025-12-22 17:35:16.530136+00
\.


--
-- TOC entry 5185 (class 0 OID 26834)
-- Dependencies: 417
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, student_id, sender_role, sender_id, content, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5198 (class 0 OID 97949)
-- Dependencies: 430
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, migration, batch) FROM stdin;
\.


--
-- TOC entry 5173 (class 0 OID 21951)
-- Dependencies: 403
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, status, related_entity_type, related_entity_id, created_at, read_at) FROM stdin;
\.


--
-- TOC entry 5169 (class 0 OID 18037)
-- Dependencies: 399
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, charge_id, student_id, amount, payment_method, transaction_ref, notes, received_by, payment_date, created_at) FROM stdin;
\.


--
-- TOC entry 5153 (class 0 OID 17551)
-- Dependencies: 383
-- Data for Name: periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.periods (id, academic_year_id, name, period_number, start_date, end_date, is_closed, created_at) FROM stdin;
3e156318-49bd-4949-a8fe-01ea16ed1ab3	82fad6ef-2963-4d3f-b42e-4d40f83929da	Bimestre 1	1	2025-12-08	2026-01-01	f	2025-12-08 17:58:54.032641+00
2ded8656-827d-422b-822c-f90cdb36f909	88a29365-ba5f-4ce5-af91-e274510b4f26	trimestre 2	1	2025-12-29	2026-01-02	f	2025-12-30 01:39:00.298304+00
\.


--
-- TOC entry 5200 (class 0 OID 97957)
-- Dependencies: 432
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
1	App\\Models\\User	a00e1883-fce9-4249-be43-267a9789efbe	api-token	14138cfefb8107b0a28e70366bba4c91b911c19a7a0df26b7595f930f316c3b5	["*"]	\N	\N	2026-03-07 01:52:08+00	2026-03-07 01:52:08+00
\.


--
-- TOC entry 5181 (class 0 OID 26128)
-- Dependencies: 413
-- Data for Name: plan_installments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plan_installments (id, plan_id, installment_number, due_date, amount, description, created_at) FROM stdin;
b9faa866-dba9-4373-bd09-b813f3247654	bf8588f4-aa4c-4786-8de6-fbce12e7c392	1	2026-01-22	200.00	\N	2025-12-09 23:35:34.681289+00
f4a78d1b-f8fd-46f1-8fb2-98d159163955	3aa4bd68-5ee1-45d8-a9c0-304a950af435	1	2026-01-10	250.00	\N	2025-12-10 16:03:23.737291+00
ac8565e6-a586-4438-b126-4f49873b5e5a	3aa4bd68-5ee1-45d8-a9c0-304a950af435	2	2026-02-10	250.00	\N	2025-12-10 16:03:23.737291+00
\.


--
-- TOC entry 5151 (class 0 OID 17523)
-- Dependencies: 381
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, role, full_name, dni, phone, email, avatar_url, is_active, created_at, updated_at, created_by, user_id) FROM stdin;
381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	admin	Director General	\N	\N	admin@cermatschool.edu.pe	\N	t	2025-12-05 04:10:19.032009+00	2025-12-05 04:10:19.032009+00	\N	\N
4ac1dd30-d8b6-4bc2-b508-1b618070cc51	teacher	Prof. Juan Pérez	\N	\N	jperez@cermatschool.edu.pe	\N	t	2025-12-05 04:14:26.873411+00	2025-12-05 04:14:26.873411+00	\N	\N
21748cbb-948b-480b-8ae7-093a3accccd8	guardian	María García	\N	\N	mgarcia@email.com	\N	t	2025-12-05 04:17:01.185974+00	2025-12-05 04:17:01.185974+00	\N	\N
e5af0bd9-b423-4ef3-8a33-366053e9787b	student	Ana Quispe	\N	\N	aquispe@cermatschool.edu.pe	\N	t	2025-12-05 04:18:50.597103+00	2025-12-05 04:18:50.597103+00	\N	\N
7d71be34-f728-47ce-9c1a-0a4b136809fc	student	Yasmin Yucra Mamani	\N	\N	yasmin.yucramamani@cermatschool.edu.pe	\N	t	2025-12-09 23:09:15.158374+00	2025-12-09 23:09:15.158374+00	\N	\N
e6b72532-188d-4e0c-9985-dd2834e6ce71	guardian	David Yucra Mamani	\N	\N	david@gmail.com	\N	t	2025-12-09 23:58:51.653859+00	2025-12-09 23:58:51.653859+00	\N	\N
c5940104-93b0-43fa-a31d-252349432077	student	kasu yucra apaza	\N	\N	kasu.yucraapaza@cermatschool.edu.pe	\N	t	2025-12-10 00:13:09.977172+00	2025-12-10 00:13:09.977172+00	\N	\N
0cdbbe7d-486f-4348-8cf7-0ca92c591a3c	guardian	joel loslos	\N	\N	joel@gmail.com	\N	t	2025-12-10 00:13:10.502027+00	2025-12-10 00:13:10.502027+00	\N	\N
11a8f7d0-621b-45d6-abe7-fdc4e35e8198	student	kaori kasu yucra apaza	\N	\N	kaorikasu.yucraapaza@cermatschool.edu.pe	\N	t	2025-12-10 00:15:53.567231+00	2025-12-10 00:15:53.567231+00	\N	\N
0c705609-6c56-4304-a2ca-9f836aa29e3d	guardian	pez joel  loslos	\N	\N	joel2@gmail.com	\N	t	2025-12-10 00:15:54.142997+00	2025-12-10 00:15:54.142997+00	\N	\N
5600fe2b-ea99-4a90-8a79-b75d6e44c50e	student	kaori kasu22 yucra apaza	\N	\N	kaorikasu22.yucraapaza@cermatschool.edu.pe	\N	t	2025-12-10 00:18:33.857967+00	2025-12-10 00:18:33.857967+00	\N	\N
4b467673-86db-4d50-9948-d6e3f157dcac	guardian	pez joel 2 loslos	\N	\N	joel23@gmail.com	\N	t	2025-12-10 00:18:34.487609+00	2025-12-10 00:18:34.487609+00	\N	\N
2b686556-b760-4e0e-aa0e-ad192ec7237e	student	kaori kasu2223 yucra apaza2	\N	\N	kaorikasu2223.yucraapaza2@cermatschool.edu.pe	\N	t	2025-12-10 00:21:18.888919+00	2025-12-10 00:21:18.888919+00	\N	\N
ab0acf73-2736-4ed0-b26b-df44f8896ac0	guardian	pez joel 2 loslos	\N	\N	joel2344@gmail.com	\N	t	2025-12-10 00:21:19.42838+00	2025-12-10 00:21:19.42838+00	\N	\N
8a4d5d5b-c0c9-46be-9431-ee15ccf71522	student	kaori kasu22234 yucra apaza222	\N	\N	kaorikasu22234.yucraapaza222@cermatschool.edu.pe	\N	t	2025-12-10 00:24:59.583295+00	2025-12-10 00:24:59.583295+00	\N	\N
f65d7fae-3a5c-4a7d-a34d-941f32c10df3	guardian	pez joel 23 loslos3	\N	\N	joel23444@gmail.com	\N	t	2025-12-10 00:25:00.160502+00	2025-12-10 00:25:00.160502+00	\N	\N
5d439ad0-dd4a-4d8a-99dd-46ae838b647d	student	Johan Avila	\N	\N	johan.avila@cermatschool.edu.pe	\N	t	2025-12-10 15:40:18.051539+00	2025-12-10 15:40:18.051539+00	\N	\N
8fab40e4-97d0-4cbd-a3c0-f5cebbc50310	guardian	Jose Anton	\N	\N	asd@gmail.com	\N	t	2025-12-10 15:40:19.129427+00	2025-12-10 15:40:19.129427+00	\N	\N
96f4ba8a-6596-485b-9375-838db139b477	student	pep fonsales yana pari	\N	\N	pepfonsales.yanapari@cermatschool.edu.pe	\N	t	2025-12-10 15:54:46.984077+00	2025-12-10 15:54:46.984077+00	\N	\N
112f3e08-c975-4ec6-a46d-b2096ef6d4be	guardian	lucho pedro	\N	\N	lucho@gmail.com	\N	t	2025-12-10 15:54:47.828246+00	2025-12-10 15:54:47.828246+00	\N	\N
d2020502-096c-4440-bf0c-3f52a6fc3728	student	lores ppp	\N	\N	lores.ppp@cermatschool.edu.pe	\N	t	2025-12-10 16:06:15.953519+00	2025-12-10 16:06:15.953519+00	\N	\N
d3b1e4dc-da81-425e-8668-5a85d90dea48	guardian	llll lllll	\N	\N	pepeppp@gmail.com	\N	t	2025-12-10 16:06:16.674917+00	2025-12-10 16:06:16.674917+00	\N	\N
471c0d0e-b6fc-4487-b8c2-1eb1ccebec9b	student	Antonio  Lara	\N	\N	antonio.lara@cermatschool.edu.pe	\N	t	2025-12-19 19:39:36.47201+00	2025-12-19 19:39:36.47201+00	\N	\N
75a5d5a9-11b4-4b8d-b931-6c888702ad6d	guardian	Jose Lara	\N	\N	jose@gmail.con	\N	t	2025-12-19 19:39:37.225525+00	2025-12-19 19:39:37.225525+00	\N	\N
7b4a290f-f1ea-4053-afb6-fd6024d36319	student	Ronald Quispe	\N	\N	ronald.quispe@cermatschool.edu.pe	\N	t	2025-12-22 17:04:44.471442+00	2025-12-22 17:04:44.471442+00	\N	\N
dc5799a6-cda2-4a85-8903-4799402e71fb	guardian	Ronaldo Quiste	\N	\N	ronaldo@gmail.com	\N	t	2025-12-22 17:04:45.114487+00	2025-12-22 17:04:45.114487+00	\N	\N
f7962b8d-64a7-4870-9a79-845e113668a8	student	Emerson Cuña	\N	\N	emerson.cuna@cermatschool.edu.pe	\N	t	2025-12-22 17:35:15.569074+00	2025-12-22 17:35:15.569074+00	\N	\N
14c0d2ba-a330-4436-9be8-58d75eb5947a	guardian	Lorenzo Cuña	\N	\N	lorenzo@gmail.com	\N	t	2025-12-22 17:35:16.243479+00	2025-12-22 17:35:16.243479+00	\N	\N
a00e1883-fce9-4249-be43-267a9789efbe	admin	Administrador	\N	\N	admin@cermatschool.edu.pe	\N	t	2026-03-07 01:49:53+00	2026-03-07 01:49:53+00	\N	a00e1883-fce9-4249-be43-267a9789efbe
\.


--
-- TOC entry 5194 (class 0 OID 40625)
-- Dependencies: 426
-- Data for Name: public_news; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_news (id, title, slug, excerpt, content, image_url, category, author, status, is_featured, published_at, created_by, updated_by, created_at, updated_at) FROM stdin;
6a2fa4f9-c162-46e1-af83-4eb8dd21abd0	Proceso de Admisión Abierto	proceso-de-admision-abierto-6a2fa4f9	Las inscripciones para el proceso de admisión 2026 están abiertas. Conoce los requisitos y fechas importantes.	Ofrecemos becas por rendimiento académico y descuentos por hermanos. No pierdas la oportunidad de formar parte de nuestra comunidad educativa.	https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop	admisiones	Secretaría Académica	publicado	t	2025-12-19 06:06:26.738605+00	\N	\N	2025-12-22 06:06:26.738605+00	2025-12-22 06:06:26.738605+00
b4005acf-9f78-4c59-b5e6-160ce7004351	Inicio del Año Escolar 2025	inicio-del-ano-escolar-2025-b4005acf	Damos la bienvenida a todos nuestros estudiantes y familias para un nuevo año lleno de aprendizaje y crecimiento.	El año escolar 2025 inicia con renovadas energías y proyectos innovadores. Nuestro compromiso con la excelencia educativa se mantiene firme, ofreciendo a nuestros estudiantes las mejores oportunidades de desarrollo integral.	https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop	institucional	Dirección General	publicado	f	2025-12-15 06:06:26.738605+00	\N	\N	2025-12-22 06:06:26.738605+00	2025-12-22 18:35:09.12858+00
1a102576-c5b5-4db2-8ae4-42e4605cece1	Talleres de Robótica 2025	talleres-de-robotica-2025-1a102576	Inauguramos nuestros nuevos talleres de robótica educativa para primaria y secundaria.	Los estudiantes podrán desarrollar habilidades en programación, diseño y construcción de robots. Este programa busca fomentar el pensamiento computacional y la creatividad en nuestros alumnos.	https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop	tecnologia	Área de Innovación	publicado	t	2025-12-22 19:31:38.35+00	\N	\N	2025-12-22 06:06:26.738605+00	2025-12-22 19:31:37.296254+00
9075db78-7f4f-4ff7-83e3-4b587607b020	hola mundo	hola-mundo-9075db78	adsdasd	asdasd	https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop	institucional	Dirección General	publicado	f	2025-12-22 19:31:47.591+00	\N	\N	2025-12-22 06:12:42.125494+00	2025-12-22 19:31:46.516359+00
610c21c5-43aa-4eeb-b42a-b03eb065b24f	Nothing	nothing-610c21c5	Nothing	Nothing to commit	https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop	institucional	Dirección General	publicado	f	2025-12-22 19:32:22.914+00	\N	\N	2025-12-22 19:32:21.885076+00	2025-12-22 19:32:21.885076+00
\.


--
-- TOC entry 5170 (class 0 OID 18062)
-- Dependencies: 400
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receipts (id, receipt_number, payment_id, student_id, total_amount, pdf_url, issued_by, issued_at, created_at) FROM stdin;
\.


--
-- TOC entry 5155 (class 0 OID 17586)
-- Dependencies: 385
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (id, academic_year_id, grade_level_id, section_letter, capacity, created_at) FROM stdin;
741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	c7f28d98-81f1-417e-9ebd-dc6daddab445	A	30	2025-12-08 17:54:58.978512+00
00eb9249-d8ef-48d7-9ad3-e285de259bb4	82fad6ef-2963-4d3f-b42e-4d40f83929da	cadf8994-c29d-4557-9be7-f1d838293ea3	AL	20	2025-12-10 16:01:25.148841+00
\.


--
-- TOC entry 5178 (class 0 OID 23206)
-- Dependencies: 410
-- Data for Name: student_course_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_course_enrollments (id, student_id, course_id, section_id, academic_year_id, enrollment_date, status, created_at, updated_at) FROM stdin;
28a41406-cbca-4437-9322-359ca01764b2	a8a2d256-a127-44b7-81f7-2e0e7381b404	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-09 06:56:58.385127+00	active	2025-12-09 06:56:58.385127+00	2025-12-09 06:56:58.385127+00
77c35231-2d3a-4626-b831-27143230cc57	e2ceb392-d03d-449c-bd08-a38dea1c580a	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-09 22:40:16.99804+00	active	2025-12-09 22:40:16.99804+00	2025-12-09 22:40:16.99804+00
36f16ce3-6968-440e-901a-5eae5d65cbc6	89f31b92-613d-421f-9d52-a1805b45c405	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-09 22:57:29.2215+00	active	2025-12-09 22:57:29.2215+00	2025-12-09 22:57:29.2215+00
7f7e60f1-7e4c-4421-88b0-245830d23809	4daa56a9-6e2f-4638-9e4a-fa1872f12e04	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:13:08.697185+00	active	2025-12-10 00:13:08.697185+00	2025-12-10 00:13:08.697185+00
3eb4ed1e-b638-49a3-b78e-4eb32a96ac21	33bf68fe-ecc5-4362-924b-ee5ec2ac2a4d	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:18:32.656176+00	active	2025-12-10 00:18:32.656176+00	2025-12-10 00:18:32.656176+00
e320c709-9b3c-4363-a483-0079ced198ca	4dd6e4d7-af07-4d0c-93c0-d79218ecc8e8	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:21:17.949089+00	active	2025-12-10 00:21:17.949089+00	2025-12-10 00:21:17.949089+00
a31ea920-c076-406a-a86b-481248617a13	98a75b52-9e1b-423a-89ef-4ce2f78d8141	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 00:24:58.148391+00	active	2025-12-10 00:24:58.148391+00	2025-12-10 00:24:58.148391+00
c7e4e7b4-3fc6-4690-9d04-0d3429da0cfb	ca8b62ee-aee8-41ff-8d93-f2716741a49b	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 15:40:15.850975+00	active	2025-12-10 15:40:15.850975+00	2025-12-10 15:40:15.850975+00
3b08b032-48da-4051-8eb1-af5a390da227	20930f1f-7482-41ef-8c8d-ec36940587ac	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 15:54:45.446077+00	active	2025-12-10 15:54:45.446077+00	2025-12-10 15:54:45.446077+00
89c52f62-7428-484b-925a-e57cc8a0c8a8	2961c410-45c3-46c0-8f4a-8d61d4192baa	6c2b34b8-3248-4332-a064-2cdfff6fe87f	00eb9249-d8ef-48d7-9ad3-e285de259bb4	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-10 16:06:14.173547+00	active	2025-12-10 16:06:14.173547+00	2025-12-10 16:06:14.173547+00
3c4ea0c9-b2a4-401f-ae68-6db0842cc117	8539d64f-a33c-4bb2-90a4-cdb1d4fc85ea	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-19 19:39:34.571913+00	active	2025-12-19 19:39:34.571913+00	2025-12-19 19:39:34.571913+00
bb325497-4be8-4d6b-aa9f-1bea3993261b	4f82d680-95f9-4836-8142-67c21c077f5e	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 16:31:09.35155+00	active	2025-12-22 16:31:09.35155+00	2025-12-22 16:31:09.35155+00
5c3760fa-e80e-43f2-9d33-a86b1ef82b55	83b9c823-b83c-48a4-9405-db559c87e4e8	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:02:40.999244+00	active	2025-12-22 17:02:40.999244+00	2025-12-22 17:02:40.999244+00
1d68b8c7-576b-4e48-8811-4b554f9e2aed	344b677c-0966-4a87-bdd8-bd9bb1fbbcc2	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:04:43.134745+00	active	2025-12-22 17:04:43.134745+00	2025-12-22 17:04:43.134745+00
0ae1071c-0601-46d7-8557-56cacc649423	cc35c8f9-2e64-4345-9c04-e0c71f83ef8f	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:20:21.128981+00	active	2025-12-22 17:20:21.128981+00	2025-12-22 17:20:21.128981+00
1da09905-ca7c-432b-bea1-191e60aeece3	b989c2cd-fe8d-4545-8ee3-8f3676864fcb	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:26:01.77409+00	active	2025-12-22 17:26:01.77409+00	2025-12-22 17:26:01.77409+00
fbfbb1d6-0463-4608-a902-e5975aac521c	9d952acf-e6b4-4da7-9c54-cf52e841fc85	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:30:33.372154+00	active	2025-12-22 17:30:33.372154+00	2025-12-22 17:30:33.372154+00
1fc060d4-8d0d-4213-8e1b-f2651a1c6df5	2daf9a5d-9743-479a-9acc-d2de3a338241	6c2b34b8-3248-4332-a064-2cdfff6fe87f	741116ee-ae2e-443f-ac98-17dc4479ad13	82fad6ef-2963-4d3f-b42e-4d40f83929da	2025-12-22 17:35:14.404121+00	active	2025-12-22 17:35:14.404121+00	2025-12-22 17:35:14.404121+00
\.


--
-- TOC entry 5183 (class 0 OID 26164)
-- Dependencies: 415
-- Data for Name: student_discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_discounts (id, student_id, discount_id, academic_year_id, notes, assigned_by, created_at) FROM stdin;
\.


--
-- TOC entry 5160 (class 0 OID 17688)
-- Dependencies: 390
-- Data for Name: student_guardians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_guardians (id, student_id, guardian_id, is_primary, created_at) FROM stdin;
6bc7a383-55a3-4a26-970e-e994e11563db	a8a2d256-a127-44b7-81f7-2e0e7381b404	2e1df12c-86db-4b42-a95c-0afb27791f09	t	2025-12-09 06:56:58.385127+00
5999acde-89a1-48d9-8675-f0c1bdca7ac3	e2ceb392-d03d-449c-bd08-a38dea1c580a	d06c8c42-2cf3-46b8-a548-3440d7b2172f	t	2025-12-09 22:40:16.99804+00
c9be6ed8-18c3-4c4f-8ae1-ac8a9c475943	89f31b92-613d-421f-9d52-a1805b45c405	d06c8c42-2cf3-46b8-a548-3440d7b2172f	t	2025-12-09 22:57:29.2215+00
b5a88a94-d12f-4a11-bfde-77f27baae1c9	4daa56a9-6e2f-4638-9e4a-fa1872f12e04	5322d436-8982-4a93-ae9d-1f650f30b924	t	2025-12-10 00:13:08.697185+00
4821e2d4-1320-4b46-9b2d-ed77a7bd769d	33bf68fe-ecc5-4362-924b-ee5ec2ac2a4d	dd36ecb8-5a36-4901-afc1-792e4591c1b8	t	2025-12-10 00:18:32.656176+00
95543956-d514-45cf-93c4-f0f27ea30344	4dd6e4d7-af07-4d0c-93c0-d79218ecc8e8	aee80822-2d03-425f-9f19-72e3c41e5c9d	t	2025-12-10 00:21:17.949089+00
c875fa48-3044-476d-8521-2de209ac6d4c	33bf68fe-ecc5-4362-924b-ee5ec2ac2a4d	d66b6c8b-0b14-48ca-a0e7-a34c8a4da4bd	t	2025-12-10 00:51:45.394695+00
0503ff8f-72ce-487f-b549-a378317df38d	33bf68fe-ecc5-4362-924b-ee5ec2ac2a4d	06615899-3857-43b8-9f59-8c0a2568b488	t	2025-12-10 00:51:45.394695+00
00e1f65e-276b-4baf-9420-bd8a1a485750	4dd6e4d7-af07-4d0c-93c0-d79218ecc8e8	d66b6c8b-0b14-48ca-a0e7-a34c8a4da4bd	t	2025-12-10 00:51:45.394695+00
0957155b-3cd1-4c26-b07d-bdb69fb5b80b	4dd6e4d7-af07-4d0c-93c0-d79218ecc8e8	06615899-3857-43b8-9f59-8c0a2568b488	t	2025-12-10 00:51:45.394695+00
76b81176-4bfd-46cd-ac2f-4b7554e43288	98a75b52-9e1b-423a-89ef-4ce2f78d8141	d66b6c8b-0b14-48ca-a0e7-a34c8a4da4bd	t	2025-12-10 00:24:58.148391+00
73ac37af-86f0-479b-8ac9-18cf388f9cd8	98a75b52-9e1b-423a-89ef-4ce2f78d8141	06615899-3857-43b8-9f59-8c0a2568b488	t	2025-12-10 00:51:45.394695+00
950428e2-abf6-4bdc-831c-a48ef0989332	ca8b62ee-aee8-41ff-8d93-f2716741a49b	32b4d6f3-d1c4-4abe-acee-9d3cfc62e40a	t	2025-12-10 15:40:15.850975+00
4997531d-c68a-423d-95a4-894af10028d7	20930f1f-7482-41ef-8c8d-ec36940587ac	18f19607-104b-400d-9468-3a6084e93b7a	t	2025-12-10 15:54:45.446077+00
1db747a0-9b15-4d02-ba79-1f7c24c20b7c	2961c410-45c3-46c0-8f4a-8d61d4192baa	3915bfc3-9048-4f20-b226-1b6c2b7e65c5	t	2025-12-10 16:06:14.173547+00
d5fd01d7-d8fd-4cdf-87db-d6758cb0a3ed	8539d64f-a33c-4bb2-90a4-cdb1d4fc85ea	8f163007-bc4d-48f5-8890-f5e59eaf1ab8	t	2025-12-19 19:39:34.571913+00
c7d4bb93-3ea1-4ab0-9ad9-a4abbae8f919	4f82d680-95f9-4836-8142-67c21c077f5e	f09ab96f-27d4-4da3-9c2c-6d7b878e3a1f	t	2025-12-22 16:31:09.35155+00
423939c8-0f39-4382-b294-6bca80670f1a	83b9c823-b83c-48a4-9405-db559c87e4e8	183226c1-1e40-4353-bdc1-f001d2871217	t	2025-12-22 17:02:40.999244+00
bc5937fd-902b-4a90-8639-c91aec22d53f	344b677c-0966-4a87-bdd8-bd9bb1fbbcc2	fb745f8d-06b3-4137-a37b-67f241819283	t	2025-12-22 17:04:43.134745+00
5b876df5-d72f-479d-b673-b562be1aea22	cc35c8f9-2e64-4345-9c04-e0c71f83ef8f	fb189567-48b1-49c2-95ca-02c4bd99e153	t	2025-12-22 17:20:21.128981+00
e2b9d746-0dc4-41b7-b4d4-532ae63cf41c	b989c2cd-fe8d-4545-8ee3-8f3676864fcb	f43bd54d-663e-4ce6-a556-441dc4b46a8b	t	2025-12-22 17:26:01.77409+00
44be0695-263d-4702-838c-d183a9173fb3	9d952acf-e6b4-4da7-9c54-cf52e841fc85	26ee4cf5-b2f2-4045-aaf2-cbaf928b219e	t	2025-12-22 17:30:33.372154+00
cd181d7e-3341-47fd-94c8-13ace77d6312	2daf9a5d-9743-479a-9acc-d2de3a338241	dbf86909-c6e6-4a22-a60e-ffb49412b41b	t	2025-12-22 17:35:14.404121+00
\.


--
-- TOC entry 5158 (class 0 OID 17642)
-- Dependencies: 388
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, user_id, student_code, first_name, last_name, dni, birth_date, gender, address, section_id, enrollment_date, status, photo_url, created_at, updated_at) FROM stdin;
e2ceb392-d03d-449c-bd08-a38dea1c580a	\N	EST000002	casandra	yucra mamani	74242508	2025-12-18	F	jr life	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-09	active	\N	2025-12-09 22:40:16.99804+00	2025-12-09 22:40:16.99804+00
a8a2d256-a127-44b7-81f7-2e0e7381b404	\N	EST000001	david	yucra mamani	74242504	2025-12-10	M	jr life	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-09	active	\N	2025-12-09 06:56:58.385127+00	2025-12-09 06:56:58.385127+00
33bf68fe-ecc5-4362-924b-ee5ec2ac2a4d	5600fe2b-ea99-4a90-8a79-b75d6e44c50e	EST000005	kaori kasu22	yucra apaza	66666666	2025-11-11	M	jr arequipa	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-10	active	\N	2025-12-10 00:18:32.656176+00	2025-12-10 00:18:32.656176+00
4dd6e4d7-af07-4d0c-93c0-d79218ecc8e8	2b686556-b760-4e0e-aa0e-ad192ec7237e	EST000006	kaori kasu2223	yucra apaza2	9999999999	2025-11-11	F	jr arequipa	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-10	active	\N	2025-12-10 00:21:17.949089+00	2025-12-10 00:21:17.949089+00
98a75b52-9e1b-423a-89ef-4ce2f78d8141	8a4d5d5b-c0c9-46be-9431-ee15ccf71522	EST000007	kaori kasu22234	yucra apaza222	99999222	2025-11-11	F	jr arequipa	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-10	active	\N	2025-12-10 00:24:58.148391+00	2025-12-10 00:24:58.148391+00
4daa56a9-6e2f-4638-9e4a-fa1872f12e04	c5940104-93b0-43fa-a31d-252349432077	EST000004	kasu	yucra apaza	742503235	2025-11-11	F	jr arequipa	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-10	active	\N	2025-12-10 00:13:08.697185+00	2025-12-10 00:13:08.697185+00
89f31b92-613d-421f-9d52-a1805b45c405	7d71be34-f728-47ce-9c1a-0a4b136809fc	EST000003	yasmin	yucra mamani	74242502	2025-12-18	F	jr life	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-09	active	\N	2025-12-09 22:57:29.2215+00	2025-12-09 22:57:29.2215+00
ca8b62ee-aee8-41ff-8d93-f2716741a49b	\N	EST000008	Johan	Avila	72344556	2001-01-18	M	Av. Sol 123	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-10	active	\N	2025-12-10 15:40:15.850975+00	2025-12-10 15:40:15.850975+00
20930f1f-7482-41ef-8c8d-ec36940587ac	\N	EST000009	pep fonsales	yana pari	742422203	2025-12-10	M	jr.lifi	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-10	active	\N	2025-12-10 15:54:45.446077+00	2025-12-10 15:54:45.446077+00
2961c410-45c3-46c0-8f4a-8d61d4192baa	\N	EST000010	lores	ppp	44444444	2025-12-10	M	je life	00eb9249-d8ef-48d7-9ad3-e285de259bb4	2025-12-10	active	\N	2025-12-10 16:06:14.173547+00	2025-12-10 16:06:14.173547+00
8539d64f-a33c-4bb2-90a4-cdb1d4fc85ea	\N	EST000011	Antonio 	Lara	72344546	2009-01-19	M	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-19	active	\N	2025-12-19 19:39:34.571913+00	2025-12-19 19:39:34.571913+00
4f82d680-95f9-4836-8142-67c21c077f5e	\N	EST000012	Raphael	Cuña	72633434	2005-01-22	M	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-22	active	\N	2025-12-22 16:31:09.35155+00	2025-12-22 16:31:09.35155+00
83b9c823-b83c-48a4-9405-db559c87e4e8	\N	EST000013	Nando	Cuña	726314711	2016-01-22	M	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-22	active	\N	2025-12-22 17:02:40.999244+00	2025-12-22 17:02:40.999244+00
344b677c-0966-4a87-bdd8-bd9bb1fbbcc2	\N	EST000014	Ronald	Quispe	72344543	2025-12-22	M	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-22	active	\N	2025-12-22 17:04:43.134745+00	2025-12-22 17:04:43.134745+00
cc35c8f9-2e64-4345-9c04-e0c71f83ef8f	\N	EST000015	Esther	Cuña	72383443	2025-12-22	M	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-22	active	\N	2025-12-22 17:20:21.128981+00	2025-12-22 17:20:21.128981+00
b989c2cd-fe8d-4545-8ee3-8f3676864fcb	\N	EST000016	Rosmery	Cuña	78232322	2025-12-22	F	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-22	active	\N	2025-12-22 17:26:01.77409+00	2025-12-22 17:26:01.77409+00
9d952acf-e6b4-4da7-9c54-cf52e841fc85	\N	EST000017	Renzo	Cuña	72832323	2025-12-22	M	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-22	active	\N	2025-12-22 17:30:33.372154+00	2025-12-22 17:30:33.372154+00
2daf9a5d-9743-479a-9acc-d2de3a338241	\N	EST000018	Emerson	Cuña	72633443	2009-02-04	M	Av Infancia N°300	741116ee-ae2e-443f-ac98-17dc4479ad13	2025-12-22	active	\N	2025-12-22 17:35:14.404121+00	2025-12-22 17:35:14.404121+00
\.


--
-- TOC entry 5175 (class 0 OID 23029)
-- Dependencies: 405
-- Data for Name: task_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_submissions (id, assignment_id, student_id, submission_date, content, attachment_url, attachment_name, attachment_size, status, grade, grade_letter, feedback, graded_by, graded_at, created_at, updated_at) FROM stdin;
ff906370-ebf8-4673-a5ab-9b7e871a3e66	9cf37264-90f5-40a9-ab7f-bcef7002e7e4	98a75b52-9e1b-423a-89ef-4ce2f78d8141	2025-12-10 04:01:25.538+00	hola	\N	\N	0	graded	12.00	B	\N	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	2025-12-10 16:07:57.611+00	2025-12-10 04:01:25.583555+00	2025-12-10 16:07:56.186243+00
\.


--
-- TOC entry 5177 (class 0 OID 23119)
-- Dependencies: 407
-- Data for Name: teacher_course_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_course_assignments (id, teacher_id, section_id, course_id, academic_year_id, assigned_by, assigned_at, is_active, notes, created_at, updated_at) FROM stdin;
43af6280-fe0d-41ae-aed7-e717594b8bbc	43d662f7-accf-4532-a39b-582cf1e7e2bc	741116ee-ae2e-443f-ac98-17dc4479ad13	6c2b34b8-3248-4332-a064-2cdfff6fe87f	82fad6ef-2963-4d3f-b42e-4d40f83929da	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	2025-12-09 05:22:49.941449	t	\N	2025-12-09 05:22:49.941449	2025-12-09 05:22:49.941449
46f8b630-fc0e-45e8-87c7-506911957039	43d662f7-accf-4532-a39b-582cf1e7e2bc	00eb9249-d8ef-48d7-9ad3-e285de259bb4	6c2b34b8-3248-4332-a064-2cdfff6fe87f	82fad6ef-2963-4d3f-b42e-4d40f83929da	381ea57b-c0d5-4f1d-a5fd-57c02fe2c3a8	2025-12-10 16:01:45.929829	t	\N	2025-12-10 16:01:45.929829	2025-12-10 16:01:45.929829
\.


--
-- TOC entry 5161 (class 0 OID 17708)
-- Dependencies: 391
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachers (id, user_id, teacher_code, first_name, last_name, dni, phone, email, specialization, hire_date, status, photo_url, created_at, updated_at) FROM stdin;
43d662f7-accf-4532-a39b-582cf1e7e2bc	4ac1dd30-d8b6-4bc2-b508-1b618070cc51	T001	Juan	Pérez	12345678	\N	\N	\N	2025-12-08	active	\N	2025-12-08 17:54:58.978512+00	2025-12-08 17:54:58.978512+00
\.


--
-- TOC entry 5196 (class 0 OID 94621)
-- Dependencies: 428
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, created_at, updated_at) FROM stdin;
a00e1883-fce9-4249-be43-267a9789efbe	Administrador	admin@cermatschool.edu.pe	$2y$12$KN3QdBZdwpxJFHxMvOU.I.ZbfQds8zb28ersDTublT4TX2TPeaalS	2026-03-07 00:18:45.653518	2026-03-07 00:21:38.440292
\.


--
-- TOC entry 5184 (class 0 OID 26620)
-- Dependencies: 416
-- Data for Name: messages_2025_12_13; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_13 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 5186 (class 0 OID 28169)
-- Dependencies: 418
-- Data for Name: messages_2025_12_14; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_14 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 5187 (class 0 OID 30387)
-- Dependencies: 419
-- Data for Name: messages_2025_12_15; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_15 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 5189 (class 0 OID 33720)
-- Dependencies: 421
-- Data for Name: messages_2025_12_16; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_16 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 5190 (class 0 OID 33732)
-- Dependencies: 422
-- Data for Name: messages_2025_12_17; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_17 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 5191 (class 0 OID 33744)
-- Dependencies: 423
-- Data for Name: messages_2025_12_18; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_18 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 5192 (class 0 OID 33756)
-- Dependencies: 424
-- Data for Name: messages_2025_12_19; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_12_19 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- TOC entry 5148 (class 0 OID 17304)
-- Dependencies: 374
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-12-05 03:03:12
20211116045059	2025-12-05 03:03:14
20211116050929	2025-12-05 03:03:16
20211116051442	2025-12-05 03:03:18
20211116212300	2025-12-05 03:03:20
20211116213355	2025-12-05 03:03:21
20211116213934	2025-12-05 03:03:23
20211116214523	2025-12-05 03:03:25
20211122062447	2025-12-05 03:03:27
20211124070109	2025-12-05 03:03:29
20211202204204	2025-12-05 03:03:30
20211202204605	2025-12-05 03:03:32
20211210212804	2025-12-05 03:03:37
20211228014915	2025-12-05 03:03:39
20220107221237	2025-12-05 03:03:41
20220228202821	2025-12-05 03:03:42
20220312004840	2025-12-05 03:03:44
20220603231003	2025-12-05 03:03:47
20220603232444	2025-12-05 03:03:48
20220615214548	2025-12-05 03:03:50
20220712093339	2025-12-05 03:03:52
20220908172859	2025-12-05 03:03:54
20220916233421	2025-12-05 03:03:55
20230119133233	2025-12-05 03:03:57
20230128025114	2025-12-05 03:03:59
20230128025212	2025-12-05 03:04:01
20230227211149	2025-12-05 03:04:03
20230228184745	2025-12-05 03:04:04
20230308225145	2025-12-05 03:04:06
20230328144023	2025-12-05 03:04:08
20231018144023	2025-12-05 03:04:10
20231204144023	2025-12-05 03:04:12
20231204144024	2025-12-05 03:04:14
20231204144025	2025-12-05 03:04:16
20240108234812	2025-12-05 03:04:17
20240109165339	2025-12-05 03:04:19
20240227174441	2025-12-05 03:04:22
20240311171622	2025-12-05 03:04:24
20240321100241	2025-12-05 03:04:28
20240401105812	2025-12-05 03:04:33
20240418121054	2025-12-05 03:04:35
20240523004032	2025-12-05 03:04:41
20240618124746	2025-12-05 03:04:43
20240801235015	2025-12-05 03:04:44
20240805133720	2025-12-05 03:04:46
20240827160934	2025-12-05 03:04:48
20240919163303	2025-12-05 03:04:50
20240919163305	2025-12-05 03:04:52
20241019105805	2025-12-05 03:04:53
20241030150047	2025-12-05 03:05:00
20241108114728	2025-12-05 03:05:02
20241121104152	2025-12-05 03:05:04
20241130184212	2025-12-05 03:05:06
20241220035512	2025-12-05 03:05:07
20241220123912	2025-12-05 03:05:09
20241224161212	2025-12-05 03:05:11
20250107150512	2025-12-05 03:05:12
20250110162412	2025-12-05 03:05:14
20250123174212	2025-12-05 03:05:16
20250128220012	2025-12-05 03:05:17
20250506224012	2025-12-05 03:05:19
20250523164012	2025-12-05 03:05:20
20250714121412	2025-12-05 03:05:22
20250905041441	2025-12-05 03:05:24
20251103001201	2025-12-05 03:05:25
20251120212548	2026-02-27 23:36:18
20251120215549	2026-02-27 23:36:18
20260218120000	2026-02-27 23:36:19
\.


--
-- TOC entry 5150 (class 0 OID 17327)
-- Dependencies: 377
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- TOC entry 5126 (class 0 OID 16546)
-- Dependencies: 349
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- TOC entry 5145 (class 0 OID 17242)
-- Dependencies: 371
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- TOC entry 5146 (class 0 OID 17269)
-- Dependencies: 372
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5128 (class 0 OID 16588)
-- Dependencies: 351
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-12-05 03:03:07.140256
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-12-05 03:03:07.156856
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-12-05 03:03:07.207902
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-12-05 03:03:07.266554
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-12-05 03:03:07.270774
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-12-05 03:03:07.280272
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-12-05 03:03:07.284287
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-12-05 03:03:07.293649
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-12-05 03:03:07.298486
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-12-05 03:03:07.301254
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-12-05 03:03:07.304143
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-12-05 03:03:07.334801
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-12-05 03:03:07.337616
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-12-05 03:03:07.340054
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-12-05 03:03:07.344995
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-12-05 03:03:07.349446
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-12-05 03:03:07.352593
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-12-05 03:03:07.358405
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-12-05 03:03:07.372637
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-12-05 03:03:07.382182
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-12-05 03:03:07.384853
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-12-05 03:03:07.387709
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-12-05 03:03:07.45596
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-12-05 03:03:07.488531
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-12-05 03:03:07.491644
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-12-05 03:03:07.502002
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-12-05 03:03:07.506151
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2025-12-30 02:09:48.557771
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2025-12-05 03:03:07.163508
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2025-12-05 03:03:07.275226
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2025-12-05 03:03:07.287256
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2025-12-05 03:03:07.290297
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2025-12-05 03:03:07.392813
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2025-12-05 03:03:07.404576
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2025-12-05 03:03:07.411732
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2025-12-05 03:03:07.417013
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2025-12-05 03:03:07.422234
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2025-12-05 03:03:07.427961
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2025-12-05 03:03:07.434003
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2025-12-05 03:03:07.44159
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2025-12-05 03:03:07.443333
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2025-12-05 03:03:07.447524
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2025-12-05 03:03:07.450325
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2025-12-05 03:03:07.45942
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2025-12-05 03:03:07.465934
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2025-12-05 03:03:07.469218
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2025-12-05 03:03:07.476092
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2025-12-05 03:03:07.480178
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2025-12-05 03:03:07.484608
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2025-12-05 03:03:07.508794
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-02-12 20:11:55.431792
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-02-12 20:11:55.531059
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-02-12 20:11:55.532313
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-02-12 20:11:55.665443
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-02-12 20:11:55.66787
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-02-12 20:11:55.669082
56	fix-optimized-search-function	cb58526ebc23048049fd5bf2fd148d18b04a2073	2026-02-12 20:11:55.680725
\.


--
-- TOC entry 5127 (class 0 OID 16561)
-- Dependencies: 350
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- TOC entry 5143 (class 0 OID 17144)
-- Dependencies: 369
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- TOC entry 5144 (class 0 OID 17158)
-- Dependencies: 370
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- TOC entry 5147 (class 0 OID 17279)
-- Dependencies: 373
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3943 (class 0 OID 16658)
-- Dependencies: 352
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5460 (class 0 OID 0)
-- Dependencies: 344
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 387, true);


--
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 429
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);


--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 431
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 1, true);


--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 376
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- TOC entry 4333 (class 2606 OID 16829)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 4289 (class 2606 OID 16531)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4633 (class 2606 OID 90196)
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- TOC entry 4635 (class 2606 OID 90194)
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4356 (class 2606 OID 16935)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 4311 (class 2606 OID 16953)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- TOC entry 4313 (class 2606 OID 16963)
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- TOC entry 4287 (class 2606 OID 16524)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 4335 (class 2606 OID 16822)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 4331 (class 2606 OID 16810)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4323 (class 2606 OID 17003)
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- TOC entry 4325 (class 2606 OID 16797)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 4369 (class 2606 OID 17062)
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- TOC entry 4371 (class 2606 OID 17060)
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- TOC entry 4373 (class 2606 OID 17058)
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4600 (class 2606 OID 30407)
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4366 (class 2606 OID 17022)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4377 (class 2606 OID 17084)
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4379 (class 2606 OID 17086)
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- TOC entry 4360 (class 2606 OID 16988)
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4281 (class 2606 OID 16514)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4284 (class 2606 OID 16740)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 4345 (class 2606 OID 16869)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 4347 (class 2606 OID 16867)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4352 (class 2606 OID 16883)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4292 (class 2606 OID 16537)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4318 (class 2606 OID 16761)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4342 (class 2606 OID 16850)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 4337 (class 2606 OID 16841)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4274 (class 2606 OID 16923)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 4276 (class 2606 OID 16501)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4414 (class 2606 OID 17548)
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- TOC entry 4416 (class 2606 OID 17550)
-- Name: academic_years academic_years_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_year_key UNIQUE (year);


--
-- TOC entry 4489 (class 2606 OID 17959)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 4485 (class 2606 OID 17909)
-- Name: assignment_submissions assignment_submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- TOC entry 4487 (class 2606 OID 17907)
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4481 (class 2606 OID 17871)
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4514 (class 2606 OID 21629)
-- Name: attendance_justifications attendance_justifications_attendance_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_justifications
    ADD CONSTRAINT attendance_justifications_attendance_id_key UNIQUE (attendance_id);


--
-- TOC entry 4516 (class 2606 OID 21627)
-- Name: attendance_justifications attendance_justifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_justifications
    ADD CONSTRAINT attendance_justifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4468 (class 2606 OID 17782)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 4470 (class 2606 OID 17784)
-- Name: attendance attendance_student_id_course_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_course_id_date_key UNIQUE (student_id, course_id, date);


--
-- TOC entry 4526 (class 2606 OID 21995)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4507 (class 2606 OID 18101)
-- Name: cash_closures cash_closures_closure_date_closed_by_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_closures
    ADD CONSTRAINT cash_closures_closure_date_closed_by_key UNIQUE (closure_date, closed_by);


--
-- TOC entry 4509 (class 2606 OID 18099)
-- Name: cash_closures cash_closures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_closures
    ADD CONSTRAINT cash_closures_pkey PRIMARY KEY (id);


--
-- TOC entry 4491 (class 2606 OID 18008)
-- Name: charges charges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_pkey PRIMARY KEY (id);


--
-- TOC entry 4434 (class 2606 OID 17636)
-- Name: competencies competencies_course_id_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencies
    ADD CONSTRAINT competencies_course_id_code_key UNIQUE (course_id, code);


--
-- TOC entry 4436 (class 2606 OID 17634)
-- Name: competencies competencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencies
    ADD CONSTRAINT competencies_pkey PRIMARY KEY (id);


--
-- TOC entry 4464 (class 2606 OID 17740)
-- Name: course_assignments course_assignments_course_id_section_id_academic_year_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_course_id_section_id_academic_year_id_key UNIQUE (course_id, section_id, academic_year_id);


--
-- TOC entry 4466 (class 2606 OID 17738)
-- Name: course_assignments course_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4614 (class 2606 OID 34881)
-- Name: course_schedules course_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_schedules
    ADD CONSTRAINT course_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 4430 (class 2606 OID 17619)
-- Name: courses courses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_key UNIQUE (code);


--
-- TOC entry 4432 (class 2606 OID 17617)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- TOC entry 4577 (class 2606 OID 26158)
-- Name: discounts discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4542 (class 2606 OID 23090)
-- Name: enrollment_applications enrollment_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_applications
    ADD CONSTRAINT enrollment_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 4474 (class 2606 OID 17833)
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 4476 (class 2606 OID 17835)
-- Name: evaluations evaluations_student_id_competency_id_period_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_student_id_competency_id_period_id_key UNIQUE (student_id, competency_id, period_id);


--
-- TOC entry 4568 (class 2606 OID 26105)
-- Name: fee_concepts fee_concepts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_concepts
    ADD CONSTRAINT fee_concepts_pkey PRIMARY KEY (id);


--
-- TOC entry 4570 (class 2606 OID 26117)
-- Name: financial_plans financial_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_plans
    ADD CONSTRAINT financial_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 4422 (class 2606 OID 17585)
-- Name: grade_levels grade_levels_level_grade_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_levels
    ADD CONSTRAINT grade_levels_level_grade_key UNIQUE (level, grade);


--
-- TOC entry 4424 (class 2606 OID 17583)
-- Name: grade_levels grade_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_levels
    ADD CONSTRAINT grade_levels_pkey PRIMARY KEY (id);


--
-- TOC entry 4446 (class 2606 OID 17682)
-- Name: guardians guardians_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_dni_key UNIQUE (dni);


--
-- TOC entry 4448 (class 2606 OID 17678)
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- TOC entry 4450 (class 2606 OID 17680)
-- Name: guardians guardians_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_user_id_key UNIQUE (user_id);


--
-- TOC entry 4591 (class 2606 OID 26844)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4642 (class 2606 OID 97954)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4524 (class 2606 OID 21960)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4500 (class 2606 OID 18046)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4418 (class 2606 OID 17562)
-- Name: periods periods_academic_year_id_period_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.periods
    ADD CONSTRAINT periods_academic_year_id_period_number_key UNIQUE (academic_year_id, period_number);


--
-- TOC entry 4420 (class 2606 OID 17560)
-- Name: periods periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.periods
    ADD CONSTRAINT periods_pkey PRIMARY KEY (id);


--
-- TOC entry 4644 (class 2606 OID 97964)
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4646 (class 2606 OID 97966)
-- Name: personal_access_tokens personal_access_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_key UNIQUE (token);


--
-- TOC entry 4573 (class 2606 OID 26138)
-- Name: plan_installments plan_installments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_installments
    ADD CONSTRAINT plan_installments_pkey PRIMARY KEY (id);


--
-- TOC entry 4575 (class 2606 OID 26140)
-- Name: plan_installments plan_installments_plan_id_installment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_installments
    ADD CONSTRAINT plan_installments_plan_id_installment_number_key UNIQUE (plan_id, installment_number);


--
-- TOC entry 4408 (class 2606 OID 17535)
-- Name: profiles profiles_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_dni_key UNIQUE (dni);


--
-- TOC entry 4410 (class 2606 OID 17533)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4412 (class 2606 OID 94631)
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 4626 (class 2606 OID 40638)
-- Name: public_news public_news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_news
    ADD CONSTRAINT public_news_pkey PRIMARY KEY (id);


--
-- TOC entry 4628 (class 2606 OID 40640)
-- Name: public_news public_news_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_news
    ADD CONSTRAINT public_news_slug_key UNIQUE (slug);


--
-- TOC entry 4503 (class 2606 OID 18071)
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 4505 (class 2606 OID 18073)
-- Name: receipts receipts_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_receipt_number_key UNIQUE (receipt_number);


--
-- TOC entry 4426 (class 2606 OID 17597)
-- Name: sections sections_academic_year_id_grade_level_id_section_letter_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_academic_year_id_grade_level_id_section_letter_key UNIQUE (academic_year_id, grade_level_id, section_letter);


--
-- TOC entry 4428 (class 2606 OID 17595)
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- TOC entry 4564 (class 2606 OID 23218)
-- Name: student_course_enrollments student_course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 4566 (class 2606 OID 23220)
-- Name: student_course_enrollments student_course_enrollments_student_id_course_id_academic_ye_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_student_id_course_id_academic_ye_key UNIQUE (student_id, course_id, academic_year_id);


--
-- TOC entry 4580 (class 2606 OID 26172)
-- Name: student_discounts student_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_discounts
    ADD CONSTRAINT student_discounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4582 (class 2606 OID 26174)
-- Name: student_discounts student_discounts_student_id_discount_id_academic_year_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_discounts
    ADD CONSTRAINT student_discounts_student_id_discount_id_academic_year_id_key UNIQUE (student_id, discount_id, academic_year_id);


--
-- TOC entry 4452 (class 2606 OID 17695)
-- Name: student_guardians student_guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_pkey PRIMARY KEY (id);


--
-- TOC entry 4454 (class 2606 OID 17697)
-- Name: student_guardians student_guardians_student_id_guardian_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_student_id_guardian_id_key UNIQUE (student_id, guardian_id);


--
-- TOC entry 4440 (class 2606 OID 17657)
-- Name: students students_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_dni_key UNIQUE (dni);


--
-- TOC entry 4442 (class 2606 OID 17653)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 4444 (class 2606 OID 17655)
-- Name: students students_student_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_code_key UNIQUE (student_code);


--
-- TOC entry 4536 (class 2606 OID 23044)
-- Name: task_submissions task_submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- TOC entry 4538 (class 2606 OID 94618)
-- Name: task_submissions task_submissions_assignment_student_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_assignment_student_unique UNIQUE (assignment_id, student_id);


--
-- TOC entry 4540 (class 2606 OID 23042)
-- Name: task_submissions task_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4555 (class 2606 OID 23130)
-- Name: teacher_course_assignments teacher_course_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4557 (class 2606 OID 23132)
-- Name: teacher_course_assignments teacher_course_assignments_teacher_id_section_id_course_id__key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_teacher_id_section_id_course_id__key UNIQUE (teacher_id, section_id, course_id, academic_year_id);


--
-- TOC entry 4456 (class 2606 OID 17725)
-- Name: teachers teachers_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_dni_key UNIQUE (dni);


--
-- TOC entry 4458 (class 2606 OID 17719)
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- TOC entry 4460 (class 2606 OID 17723)
-- Name: teachers teachers_teacher_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_teacher_code_key UNIQUE (teacher_code);


--
-- TOC entry 4462 (class 2606 OID 17721)
-- Name: teachers teachers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);


--
-- TOC entry 4638 (class 2606 OID 94629)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4640 (class 2606 OID 94627)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4402 (class 2606 OID 17487)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4585 (class 2606 OID 26628)
-- Name: messages_2025_12_13 messages_2025_12_13_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_13
    ADD CONSTRAINT messages_2025_12_13_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4594 (class 2606 OID 28177)
-- Name: messages_2025_12_14 messages_2025_12_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_14
    ADD CONSTRAINT messages_2025_12_14_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4597 (class 2606 OID 30395)
-- Name: messages_2025_12_15 messages_2025_12_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_15
    ADD CONSTRAINT messages_2025_12_15_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4603 (class 2606 OID 33728)
-- Name: messages_2025_12_16 messages_2025_12_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_16
    ADD CONSTRAINT messages_2025_12_16_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4606 (class 2606 OID 33740)
-- Name: messages_2025_12_17 messages_2025_12_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_17
    ADD CONSTRAINT messages_2025_12_17_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4609 (class 2606 OID 33752)
-- Name: messages_2025_12_18 messages_2025_12_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_18
    ADD CONSTRAINT messages_2025_12_18_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4612 (class 2606 OID 33764)
-- Name: messages_2025_12_19 messages_2025_12_19_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_12_19
    ADD CONSTRAINT messages_2025_12_19_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4398 (class 2606 OID 17335)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- TOC entry 4395 (class 2606 OID 17308)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4387 (class 2606 OID 17302)
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4295 (class 2606 OID 16554)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 4390 (class 2606 OID 17278)
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- TOC entry 4303 (class 2606 OID 16595)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 4305 (class 2606 OID 16593)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4301 (class 2606 OID 16571)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 4385 (class 2606 OID 17167)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 4383 (class 2606 OID 17152)
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 4393 (class 2606 OID 17288)
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- TOC entry 4290 (class 1259 OID 16532)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 4264 (class 1259 OID 16750)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4629 (class 1259 OID 90200)
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- TOC entry 4630 (class 1259 OID 90199)
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- TOC entry 4631 (class 1259 OID 90197)
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- TOC entry 4636 (class 1259 OID 90198)
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- TOC entry 4265 (class 1259 OID 16752)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4266 (class 1259 OID 16753)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4321 (class 1259 OID 16831)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 4354 (class 1259 OID 16939)
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- TOC entry 4309 (class 1259 OID 16919)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 4309
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- TOC entry 4314 (class 1259 OID 16747)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 4357 (class 1259 OID 16936)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 4598 (class 1259 OID 30408)
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- TOC entry 4358 (class 1259 OID 16937)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 4329 (class 1259 OID 16942)
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- TOC entry 4326 (class 1259 OID 16803)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 4327 (class 1259 OID 16948)
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- TOC entry 4367 (class 1259 OID 17073)
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- TOC entry 4364 (class 1259 OID 17026)
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- TOC entry 4374 (class 1259 OID 17099)
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4375 (class 1259 OID 17097)
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4380 (class 1259 OID 17098)
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- TOC entry 4361 (class 1259 OID 16995)
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- TOC entry 4362 (class 1259 OID 16994)
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- TOC entry 4363 (class 1259 OID 16996)
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- TOC entry 4267 (class 1259 OID 16754)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4268 (class 1259 OID 16751)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4277 (class 1259 OID 16515)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 4278 (class 1259 OID 16516)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 4279 (class 1259 OID 16746)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 4282 (class 1259 OID 16833)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 4285 (class 1259 OID 16938)
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- TOC entry 4348 (class 1259 OID 16875)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 4349 (class 1259 OID 16940)
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- TOC entry 4350 (class 1259 OID 16890)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 4353 (class 1259 OID 16889)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 4315 (class 1259 OID 16941)
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- TOC entry 4316 (class 1259 OID 17111)
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- TOC entry 4319 (class 1259 OID 16832)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 4340 (class 1259 OID 16857)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 4343 (class 1259 OID 16856)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 4338 (class 1259 OID 16842)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 4339 (class 1259 OID 17004)
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- TOC entry 4328 (class 1259 OID 17001)
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- TOC entry 4320 (class 1259 OID 16830)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 4269 (class 1259 OID 16910)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 4269
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- TOC entry 4270 (class 1259 OID 16748)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 4271 (class 1259 OID 16505)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 4272 (class 1259 OID 16965)
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- TOC entry 4482 (class 1259 OID 18115)
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- TOC entry 4483 (class 1259 OID 18114)
-- Name: idx_assignments_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_section ON public.assignments USING btree (section_id);


--
-- TOC entry 4471 (class 1259 OID 18109)
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date ON public.attendance USING btree (date);


--
-- TOC entry 4472 (class 1259 OID 18110)
-- Name: idx_attendance_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_student ON public.attendance USING btree (student_id);


--
-- TOC entry 4527 (class 1259 OID 22004)
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- TOC entry 4528 (class 1259 OID 22003)
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at DESC);


--
-- TOC entry 4529 (class 1259 OID 22001)
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- TOC entry 4530 (class 1259 OID 22002)
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- TOC entry 4510 (class 1259 OID 25430)
-- Name: idx_cash_closures_cashier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cash_closures_cashier ON public.cash_closures USING btree (cashier_id);


--
-- TOC entry 4511 (class 1259 OID 25431)
-- Name: idx_cash_closures_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cash_closures_date ON public.cash_closures USING btree (closure_date);


--
-- TOC entry 4512 (class 1259 OID 25432)
-- Name: idx_cash_closures_opening_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cash_closures_opening_time ON public.cash_closures USING btree (opening_time);


--
-- TOC entry 4492 (class 1259 OID 25215)
-- Name: idx_charges_concept; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_charges_concept ON public.charges USING btree (concept_id);


--
-- TOC entry 4493 (class 1259 OID 18118)
-- Name: idx_charges_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_charges_due_date ON public.charges USING btree (due_date);


--
-- TOC entry 4494 (class 1259 OID 18117)
-- Name: idx_charges_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_charges_status ON public.charges USING btree (status);


--
-- TOC entry 4495 (class 1259 OID 18116)
-- Name: idx_charges_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_charges_student ON public.charges USING btree (student_id);


--
-- TOC entry 4543 (class 1259 OID 23107)
-- Name: idx_enrollment_applications_academic_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollment_applications_academic_year ON public.enrollment_applications USING btree (academic_year_id);


--
-- TOC entry 4544 (class 1259 OID 23109)
-- Name: idx_enrollment_applications_application_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollment_applications_application_date ON public.enrollment_applications USING btree (application_date);


--
-- TOC entry 4545 (class 1259 OID 23108)
-- Name: idx_enrollment_applications_grade_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollment_applications_grade_level ON public.enrollment_applications USING btree (grade_level_id);


--
-- TOC entry 4546 (class 1259 OID 23110)
-- Name: idx_enrollment_applications_guardian_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollment_applications_guardian_email ON public.enrollment_applications USING btree (guardian_email);


--
-- TOC entry 4547 (class 1259 OID 23106)
-- Name: idx_enrollment_applications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollment_applications_status ON public.enrollment_applications USING btree (status);


--
-- TOC entry 4548 (class 1259 OID 23111)
-- Name: idx_enrollment_applications_student_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollment_applications_student_document ON public.enrollment_applications USING btree (student_document_number);


--
-- TOC entry 4477 (class 1259 OID 18112)
-- Name: idx_evaluations_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_period ON public.evaluations USING btree (period_id);


--
-- TOC entry 4478 (class 1259 OID 18113)
-- Name: idx_evaluations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_status ON public.evaluations USING btree (status);


--
-- TOC entry 4479 (class 1259 OID 18111)
-- Name: idx_evaluations_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_student ON public.evaluations USING btree (student_id);


--
-- TOC entry 4517 (class 1259 OID 21652)
-- Name: idx_justifications_attendance; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_justifications_attendance ON public.attendance_justifications USING btree (attendance_id);


--
-- TOC entry 4518 (class 1259 OID 21650)
-- Name: idx_justifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_justifications_status ON public.attendance_justifications USING btree (status);


--
-- TOC entry 4519 (class 1259 OID 21651)
-- Name: idx_justifications_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_justifications_student ON public.attendance_justifications USING btree (student_id);


--
-- TOC entry 4586 (class 1259 OID 26863)
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- TOC entry 4587 (class 1259 OID 26864)
-- Name: idx_messages_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_is_read ON public.messages USING btree (is_read) WHERE (is_read = false);


--
-- TOC entry 4588 (class 1259 OID 26862)
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- TOC entry 4589 (class 1259 OID 26861)
-- Name: idx_messages_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_student_id ON public.messages USING btree (student_id);


--
-- TOC entry 4520 (class 1259 OID 21968)
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- TOC entry 4521 (class 1259 OID 21967)
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_status ON public.notifications USING btree (status) WHERE (status = 'no_leida'::public.notification_status);


--
-- TOC entry 4522 (class 1259 OID 21966)
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- TOC entry 4496 (class 1259 OID 18119)
-- Name: idx_payments_charge; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_charge ON public.payments USING btree (charge_id);


--
-- TOC entry 4497 (class 1259 OID 18120)
-- Name: idx_payments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_date ON public.payments USING btree (payment_date);


--
-- TOC entry 4498 (class 1259 OID 25216)
-- Name: idx_payments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_student ON public.payments USING btree (student_id);


--
-- TOC entry 4571 (class 1259 OID 26196)
-- Name: idx_plan_installments_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plan_installments_plan ON public.plan_installments USING btree (plan_id);


--
-- TOC entry 4403 (class 1259 OID 22179)
-- Name: idx_profiles_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);


--
-- TOC entry 4404 (class 1259 OID 22178)
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- TOC entry 4405 (class 1259 OID 22177)
-- Name: idx_profiles_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);


--
-- TOC entry 4406 (class 1259 OID 22176)
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- TOC entry 4621 (class 1259 OID 40652)
-- Name: idx_public_news_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_news_category ON public.public_news USING btree (category);


--
-- TOC entry 4622 (class 1259 OID 40654)
-- Name: idx_public_news_is_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_news_is_featured ON public.public_news USING btree (is_featured) WHERE (is_featured = true);


--
-- TOC entry 4623 (class 1259 OID 40653)
-- Name: idx_public_news_published_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_news_published_at ON public.public_news USING btree (published_at DESC);


--
-- TOC entry 4624 (class 1259 OID 40651)
-- Name: idx_public_news_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_news_status ON public.public_news USING btree (status);


--
-- TOC entry 4501 (class 1259 OID 25217)
-- Name: idx_receipts_payment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_receipts_payment ON public.receipts USING btree (payment_id);


--
-- TOC entry 4615 (class 1259 OID 34904)
-- Name: idx_schedules_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_course ON public.course_schedules USING btree (course_id);


--
-- TOC entry 4616 (class 1259 OID 34905)
-- Name: idx_schedules_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_day ON public.course_schedules USING btree (day_of_week);


--
-- TOC entry 4617 (class 1259 OID 34902)
-- Name: idx_schedules_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_section ON public.course_schedules USING btree (section_id);


--
-- TOC entry 4618 (class 1259 OID 34907)
-- Name: idx_schedules_section_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_section_day ON public.course_schedules USING btree (section_id, day_of_week, start_time);


--
-- TOC entry 4619 (class 1259 OID 34903)
-- Name: idx_schedules_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_teacher ON public.course_schedules USING btree (teacher_id);


--
-- TOC entry 4620 (class 1259 OID 34906)
-- Name: idx_schedules_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_year ON public.course_schedules USING btree (academic_year_id);


--
-- TOC entry 4558 (class 1259 OID 23242)
-- Name: idx_student_course_enrollments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_course_enrollments_course ON public.student_course_enrollments USING btree (course_id);


--
-- TOC entry 4559 (class 1259 OID 23243)
-- Name: idx_student_course_enrollments_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_course_enrollments_section ON public.student_course_enrollments USING btree (section_id);


--
-- TOC entry 4560 (class 1259 OID 23245)
-- Name: idx_student_course_enrollments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_course_enrollments_status ON public.student_course_enrollments USING btree (status);


--
-- TOC entry 4561 (class 1259 OID 23241)
-- Name: idx_student_course_enrollments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_course_enrollments_student ON public.student_course_enrollments USING btree (student_id);


--
-- TOC entry 4562 (class 1259 OID 23244)
-- Name: idx_student_course_enrollments_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_course_enrollments_year ON public.student_course_enrollments USING btree (academic_year_id);


--
-- TOC entry 4578 (class 1259 OID 26195)
-- Name: idx_student_discounts_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_discounts_student ON public.student_discounts USING btree (student_id);


--
-- TOC entry 4437 (class 1259 OID 18107)
-- Name: idx_students_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_section ON public.students USING btree (section_id);


--
-- TOC entry 4438 (class 1259 OID 18108)
-- Name: idx_students_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_status ON public.students USING btree (status);


--
-- TOC entry 4531 (class 1259 OID 23060)
-- Name: idx_task_submissions_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_submissions_assignment ON public.task_submissions USING btree (assignment_id);


--
-- TOC entry 4532 (class 1259 OID 23063)
-- Name: idx_task_submissions_graded; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_submissions_graded ON public.task_submissions USING btree (graded_at);


--
-- TOC entry 4533 (class 1259 OID 23062)
-- Name: idx_task_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_submissions_status ON public.task_submissions USING btree (status);


--
-- TOC entry 4534 (class 1259 OID 23061)
-- Name: idx_task_submissions_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_submissions_student ON public.task_submissions USING btree (student_id);


--
-- TOC entry 4549 (class 1259 OID 23161)
-- Name: idx_teacher_assignments_academic_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_assignments_academic_year ON public.teacher_course_assignments USING btree (academic_year_id);


--
-- TOC entry 4550 (class 1259 OID 23162)
-- Name: idx_teacher_assignments_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_assignments_active ON public.teacher_course_assignments USING btree (is_active);


--
-- TOC entry 4551 (class 1259 OID 23160)
-- Name: idx_teacher_assignments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_assignments_course ON public.teacher_course_assignments USING btree (course_id);


--
-- TOC entry 4552 (class 1259 OID 23159)
-- Name: idx_teacher_assignments_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_assignments_section ON public.teacher_course_assignments USING btree (section_id);


--
-- TOC entry 4553 (class 1259 OID 23158)
-- Name: idx_teacher_assignments_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_course_assignments USING btree (teacher_id);


--
-- TOC entry 4647 (class 1259 OID 97967)
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- TOC entry 4396 (class 1259 OID 17488)
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- TOC entry 4400 (class 1259 OID 17489)
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4583 (class 1259 OID 26629)
-- Name: messages_2025_12_13_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_13_inserted_at_topic_idx ON realtime.messages_2025_12_13 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4592 (class 1259 OID 28178)
-- Name: messages_2025_12_14_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_14_inserted_at_topic_idx ON realtime.messages_2025_12_14 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4595 (class 1259 OID 30396)
-- Name: messages_2025_12_15_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_15_inserted_at_topic_idx ON realtime.messages_2025_12_15 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4601 (class 1259 OID 33729)
-- Name: messages_2025_12_16_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_16_inserted_at_topic_idx ON realtime.messages_2025_12_16 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4604 (class 1259 OID 33741)
-- Name: messages_2025_12_17_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_17_inserted_at_topic_idx ON realtime.messages_2025_12_17 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4607 (class 1259 OID 33753)
-- Name: messages_2025_12_18_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_18_inserted_at_topic_idx ON realtime.messages_2025_12_18 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4610 (class 1259 OID 33765)
-- Name: messages_2025_12_19_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_12_19_inserted_at_topic_idx ON realtime.messages_2025_12_19 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4399 (class 1259 OID 91306)
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- TOC entry 4293 (class 1259 OID 16560)
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 4296 (class 1259 OID 16582)
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- TOC entry 4388 (class 1259 OID 17303)
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4381 (class 1259 OID 17178)
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- TOC entry 4297 (class 1259 OID 17143)
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- TOC entry 4298 (class 1259 OID 80408)
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- TOC entry 4299 (class 1259 OID 16583)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 4391 (class 1259 OID 17294)
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- TOC entry 4648 (class 0 OID 0)
-- Name: messages_2025_12_13_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_13_inserted_at_topic_idx;


--
-- TOC entry 4649 (class 0 OID 0)
-- Name: messages_2025_12_13_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_13_pkey;


--
-- TOC entry 4650 (class 0 OID 0)
-- Name: messages_2025_12_14_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_14_inserted_at_topic_idx;


--
-- TOC entry 4651 (class 0 OID 0)
-- Name: messages_2025_12_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_14_pkey;


--
-- TOC entry 4652 (class 0 OID 0)
-- Name: messages_2025_12_15_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_15_inserted_at_topic_idx;


--
-- TOC entry 4653 (class 0 OID 0)
-- Name: messages_2025_12_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_15_pkey;


--
-- TOC entry 4654 (class 0 OID 0)
-- Name: messages_2025_12_16_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_16_inserted_at_topic_idx;


--
-- TOC entry 4655 (class 0 OID 0)
-- Name: messages_2025_12_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_16_pkey;


--
-- TOC entry 4656 (class 0 OID 0)
-- Name: messages_2025_12_17_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_17_inserted_at_topic_idx;


--
-- TOC entry 4657 (class 0 OID 0)
-- Name: messages_2025_12_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_17_pkey;


--
-- TOC entry 4658 (class 0 OID 0)
-- Name: messages_2025_12_18_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_18_inserted_at_topic_idx;


--
-- TOC entry 4659 (class 0 OID 0)
-- Name: messages_2025_12_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_18_pkey;


--
-- TOC entry 4660 (class 0 OID 0)
-- Name: messages_2025_12_19_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_19_inserted_at_topic_idx;


--
-- TOC entry 4661 (class 0 OID 0)
-- Name: messages_2025_12_19_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_19_pkey;


--
-- TOC entry 4782 (class 2620 OID 34916)
-- Name: course_schedules course_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER course_schedules_updated_at BEFORE UPDATE ON public.course_schedules FOR EACH ROW EXECUTE FUNCTION public.update_course_schedules_updated_at();


--
-- TOC entry 4777 (class 2620 OID 23113)
-- Name: enrollment_applications enrollment_applications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enrollment_applications_updated_at BEFORE UPDATE ON public.enrollment_applications FOR EACH ROW EXECUTE FUNCTION public.update_enrollment_applications_updated_at();


--
-- TOC entry 4771 (class 2620 OID 22205)
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();


--
-- TOC entry 4776 (class 2620 OID 23065)
-- Name: task_submissions task_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER task_submissions_updated_at BEFORE UPDATE ON public.task_submissions FOR EACH ROW EXECUTE FUNCTION public.update_task_submissions_updated_at();


--
-- TOC entry 4773 (class 2620 OID 22011)
-- Name: evaluations trigger_audit_evaluations; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_audit_evaluations AFTER UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.audit_evaluation_changes();


--
-- TOC entry 4774 (class 2620 OID 22015)
-- Name: payments trigger_audit_payments; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_audit_payments AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_and_notify_payment();


--
-- TOC entry 4772 (class 2620 OID 23439)
-- Name: students trigger_auto_enroll_student_courses; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_auto_enroll_student_courses AFTER INSERT OR UPDATE OF section_id, status ON public.students FOR EACH ROW EXECUTE FUNCTION public.auto_enroll_student_to_section_courses();


--
-- TOC entry 4783 (class 2620 OID 40661)
-- Name: public_news trigger_generate_news_slug; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_generate_news_slug BEFORE INSERT ON public.public_news FOR EACH ROW EXECUTE FUNCTION public.generate_news_slug();


--
-- TOC entry 4775 (class 2620 OID 22013)
-- Name: attendance_justifications trigger_notify_justifications; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_notify_justifications AFTER UPDATE ON public.attendance_justifications FOR EACH ROW EXECUTE FUNCTION public.notify_justification_status();


--
-- TOC entry 4778 (class 2620 OID 23440)
-- Name: teacher_course_assignments trigger_sync_student_enrollments; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_sync_student_enrollments AFTER INSERT OR UPDATE OF is_active ON public.teacher_course_assignments FOR EACH ROW EXECUTE FUNCTION public.sync_student_enrollments_on_teacher_assignment();


--
-- TOC entry 4784 (class 2620 OID 40663)
-- Name: public_news trigger_update_public_news_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_public_news_updated_at BEFORE UPDATE ON public.public_news FOR EACH ROW EXECUTE FUNCTION public.update_public_news_updated_at();


--
-- TOC entry 4781 (class 2620 OID 23438)
-- Name: student_course_enrollments trigger_update_student_course_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_student_course_enrollments_updated_at BEFORE UPDATE ON public.student_course_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_student_course_enrollments_updated_at();


--
-- TOC entry 4779 (class 2620 OID 23164)
-- Name: teacher_course_assignments trigger_update_teacher_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_teacher_assignments_updated_at BEFORE UPDATE ON public.teacher_course_assignments FOR EACH ROW EXECUTE FUNCTION public.update_teacher_assignments_updated_at();


--
-- TOC entry 4780 (class 2620 OID 23166)
-- Name: teacher_course_assignments trigger_validate_teacher_course_limit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validate_teacher_course_limit BEFORE INSERT OR UPDATE ON public.teacher_course_assignments FOR EACH ROW WHEN ((new.is_active = true)) EXECUTE FUNCTION public.validate_teacher_course_limit();


--
-- TOC entry 4770 (class 2620 OID 17340)
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- TOC entry 4766 (class 2620 OID 17234)
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- TOC entry 4767 (class 2620 OID 80410)
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 4768 (class 2620 OID 80411)
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 4769 (class 2620 OID 17131)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 4664 (class 2606 OID 16734)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4669 (class 2606 OID 16823)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4668 (class 2606 OID 16811)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4667 (class 2606 OID 16798)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4675 (class 2606 OID 17063)
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4676 (class 2606 OID 17068)
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4677 (class 2606 OID 17092)
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4678 (class 2606 OID 17087)
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4674 (class 2606 OID 16989)
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4662 (class 2606 OID 16767)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4671 (class 2606 OID 16870)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4672 (class 2606 OID 16943)
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- TOC entry 4673 (class 2606 OID 16884)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4665 (class 2606 OID 17106)
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4666 (class 2606 OID 16762)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4670 (class 2606 OID 16851)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4715 (class 2606 OID 24887)
-- Name: announcements announcements_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 4716 (class 2606 OID 24882)
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 4717 (class 2606 OID 17960)
-- Name: announcements announcements_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;


--
-- TOC entry 4712 (class 2606 OID 17910)
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- TOC entry 4713 (class 2606 OID 17920)
-- Name: assignment_submissions assignment_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4714 (class 2606 OID 17915)
-- Name: assignment_submissions assignment_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4709 (class 2606 OID 17872)
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4710 (class 2606 OID 17882)
-- Name: assignments assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4711 (class 2606 OID 17877)
-- Name: assignments assignments_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- TOC entry 4700 (class 2606 OID 17795)
-- Name: attendance attendance_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- TOC entry 4729 (class 2606 OID 21630)
-- Name: attendance_justifications attendance_justifications_attendance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_justifications
    ADD CONSTRAINT attendance_justifications_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES public.attendance(id) ON DELETE CASCADE;


--
-- TOC entry 4730 (class 2606 OID 21640)
-- Name: attendance_justifications attendance_justifications_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_justifications
    ADD CONSTRAINT attendance_justifications_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE SET NULL;


--
-- TOC entry 4731 (class 2606 OID 21645)
-- Name: attendance_justifications attendance_justifications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_justifications
    ADD CONSTRAINT attendance_justifications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4732 (class 2606 OID 21635)
-- Name: attendance_justifications attendance_justifications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_justifications
    ADD CONSTRAINT attendance_justifications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4701 (class 2606 OID 17800)
-- Name: attendance attendance_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4702 (class 2606 OID 17790)
-- Name: attendance attendance_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- TOC entry 4703 (class 2606 OID 17785)
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4734 (class 2606 OID 21996)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4727 (class 2606 OID 25425)
-- Name: cash_closures cash_closures_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_closures
    ADD CONSTRAINT cash_closures_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- TOC entry 4728 (class 2606 OID 18102)
-- Name: cash_closures cash_closures_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_closures
    ADD CONSTRAINT cash_closures_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4718 (class 2606 OID 18014)
-- Name: charges charges_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4719 (class 2606 OID 18019)
-- Name: charges charges_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4720 (class 2606 OID 18009)
-- Name: charges charges_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4689 (class 2606 OID 17637)
-- Name: competencies competencies_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencies
    ADD CONSTRAINT competencies_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4696 (class 2606 OID 17756)
-- Name: course_assignments course_assignments_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4697 (class 2606 OID 17746)
-- Name: course_assignments course_assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4698 (class 2606 OID 17751)
-- Name: course_assignments course_assignments_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- TOC entry 4699 (class 2606 OID 17741)
-- Name: course_assignments course_assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- TOC entry 4760 (class 2606 OID 34882)
-- Name: course_schedules course_schedules_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_schedules
    ADD CONSTRAINT course_schedules_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4761 (class 2606 OID 34892)
-- Name: course_schedules course_schedules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_schedules
    ADD CONSTRAINT course_schedules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4762 (class 2606 OID 34887)
-- Name: course_schedules course_schedules_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_schedules
    ADD CONSTRAINT course_schedules_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- TOC entry 4763 (class 2606 OID 34897)
-- Name: course_schedules course_schedules_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_schedules
    ADD CONSTRAINT course_schedules_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- TOC entry 4688 (class 2606 OID 17620)
-- Name: courses courses_grade_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_grade_level_id_fkey FOREIGN KEY (grade_level_id) REFERENCES public.grade_levels(id) ON DELETE RESTRICT;


--
-- TOC entry 4753 (class 2606 OID 26159)
-- Name: discounts discounts_specific_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discounts
    ADD CONSTRAINT discounts_specific_concept_id_fkey FOREIGN KEY (specific_concept_id) REFERENCES public.fee_concepts(id) ON DELETE SET NULL;


--
-- TOC entry 4738 (class 2606 OID 23101)
-- Name: enrollment_applications enrollment_applications_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_applications
    ADD CONSTRAINT enrollment_applications_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- TOC entry 4739 (class 2606 OID 23091)
-- Name: enrollment_applications enrollment_applications_grade_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_applications
    ADD CONSTRAINT enrollment_applications_grade_level_id_fkey FOREIGN KEY (grade_level_id) REFERENCES public.grade_levels(id);


--
-- TOC entry 4740 (class 2606 OID 23096)
-- Name: enrollment_applications enrollment_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollment_applications
    ADD CONSTRAINT enrollment_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);


--
-- TOC entry 4704 (class 2606 OID 17846)
-- Name: evaluations evaluations_competency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_competency_id_fkey FOREIGN KEY (competency_id) REFERENCES public.competencies(id) ON DELETE CASCADE;


--
-- TOC entry 4705 (class 2606 OID 17841)
-- Name: evaluations evaluations_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4706 (class 2606 OID 17851)
-- Name: evaluations evaluations_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.periods(id) ON DELETE CASCADE;


--
-- TOC entry 4707 (class 2606 OID 17856)
-- Name: evaluations evaluations_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4708 (class 2606 OID 17836)
-- Name: evaluations evaluations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4750 (class 2606 OID 26118)
-- Name: financial_plans financial_plans_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_plans
    ADD CONSTRAINT financial_plans_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4751 (class 2606 OID 26123)
-- Name: financial_plans financial_plans_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_plans
    ADD CONSTRAINT financial_plans_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.fee_concepts(id) ON DELETE RESTRICT;


--
-- TOC entry 4692 (class 2606 OID 17683)
-- Name: guardians guardians_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4758 (class 2606 OID 26850)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- TOC entry 4759 (class 2606 OID 26845)
-- Name: messages messages_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4733 (class 2606 OID 21961)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4721 (class 2606 OID 18047)
-- Name: payments payments_charge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES public.charges(id) ON DELETE RESTRICT;


--
-- TOC entry 4722 (class 2606 OID 18057)
-- Name: payments payments_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_received_by_fkey FOREIGN KEY (received_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4723 (class 2606 OID 18052)
-- Name: payments payments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4685 (class 2606 OID 17563)
-- Name: periods periods_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.periods
    ADD CONSTRAINT periods_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4752 (class 2606 OID 26141)
-- Name: plan_installments plan_installments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_installments
    ADD CONSTRAINT plan_installments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.financial_plans(id) ON DELETE CASCADE;


--
-- TOC entry 4683 (class 2606 OID 22171)
-- Name: profiles profiles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- TOC entry 4684 (class 2606 OID 94632)
-- Name: profiles profiles_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4764 (class 2606 OID 40641)
-- Name: public_news public_news_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_news
    ADD CONSTRAINT public_news_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4765 (class 2606 OID 40646)
-- Name: public_news public_news_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_news
    ADD CONSTRAINT public_news_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4724 (class 2606 OID 18084)
-- Name: receipts receipts_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4725 (class 2606 OID 18074)
-- Name: receipts receipts_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;


--
-- TOC entry 4726 (class 2606 OID 18079)
-- Name: receipts receipts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4686 (class 2606 OID 17598)
-- Name: sections sections_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4687 (class 2606 OID 17603)
-- Name: sections sections_grade_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_grade_level_id_fkey FOREIGN KEY (grade_level_id) REFERENCES public.grade_levels(id) ON DELETE RESTRICT;


--
-- TOC entry 4746 (class 2606 OID 23236)
-- Name: student_course_enrollments student_course_enrollments_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4747 (class 2606 OID 23226)
-- Name: student_course_enrollments student_course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4748 (class 2606 OID 23231)
-- Name: student_course_enrollments student_course_enrollments_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- TOC entry 4749 (class 2606 OID 23221)
-- Name: student_course_enrollments student_course_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_course_enrollments
    ADD CONSTRAINT student_course_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4754 (class 2606 OID 26185)
-- Name: student_discounts student_discounts_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_discounts
    ADD CONSTRAINT student_discounts_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4755 (class 2606 OID 26190)
-- Name: student_discounts student_discounts_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_discounts
    ADD CONSTRAINT student_discounts_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4756 (class 2606 OID 26180)
-- Name: student_discounts student_discounts_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_discounts
    ADD CONSTRAINT student_discounts_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;


--
-- TOC entry 4757 (class 2606 OID 26175)
-- Name: student_discounts student_discounts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_discounts
    ADD CONSTRAINT student_discounts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4693 (class 2606 OID 17703)
-- Name: student_guardians student_guardians_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE CASCADE;


--
-- TOC entry 4694 (class 2606 OID 17698)
-- Name: student_guardians student_guardians_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4690 (class 2606 OID 17663)
-- Name: students students_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;


--
-- TOC entry 4691 (class 2606 OID 17658)
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4735 (class 2606 OID 23045)
-- Name: task_submissions task_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- TOC entry 4736 (class 2606 OID 23055)
-- Name: task_submissions task_submissions_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.profiles(id);


--
-- TOC entry 4737 (class 2606 OID 23050)
-- Name: task_submissions task_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 4741 (class 2606 OID 23148)
-- Name: teacher_course_assignments teacher_course_assignments_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- TOC entry 4742 (class 2606 OID 23153)
-- Name: teacher_course_assignments teacher_course_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- TOC entry 4743 (class 2606 OID 23143)
-- Name: teacher_course_assignments teacher_course_assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4744 (class 2606 OID 23138)
-- Name: teacher_course_assignments teacher_course_assignments_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- TOC entry 4745 (class 2606 OID 23133)
-- Name: teacher_course_assignments teacher_course_assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- TOC entry 4695 (class 2606 OID 17726)
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4663 (class 2606 OID 16572)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4679 (class 2606 OID 17153)
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4680 (class 2606 OID 17173)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4681 (class 2606 OID 17168)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- TOC entry 4682 (class 2606 OID 17289)
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- TOC entry 4938 (class 0 OID 16525)
-- Dependencies: 347
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4952 (class 0 OID 16929)
-- Dependencies: 364
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4943 (class 0 OID 16727)
-- Dependencies: 355
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4937 (class 0 OID 16518)
-- Dependencies: 346
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4947 (class 0 OID 16816)
-- Dependencies: 359
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4946 (class 0 OID 16804)
-- Dependencies: 358
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4945 (class 0 OID 16791)
-- Dependencies: 357
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4953 (class 0 OID 16979)
-- Dependencies: 365
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4936 (class 0 OID 16507)
-- Dependencies: 345
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4950 (class 0 OID 16858)
-- Dependencies: 362
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4951 (class 0 OID 16876)
-- Dependencies: 363
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4939 (class 0 OID 16533)
-- Dependencies: 348
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4944 (class 0 OID 16757)
-- Dependencies: 356
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4949 (class 0 OID 16843)
-- Dependencies: 361
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4948 (class 0 OID 16834)
-- Dependencies: 360
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4935 (class 0 OID 16495)
-- Dependencies: 343
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5047 (class 3256 OID 22005)
-- Name: audit_logs Admin can read all audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can read all audit logs" ON public.audit_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5015 (class 3256 OID 21656)
-- Name: attendance_justifications Admin roles can manage all justifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin roles can manage all justifications" ON public.attendance_justifications TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'secretary'::public.user_role]))))));


--
-- TOC entry 5102 (class 3256 OID 34913)
-- Name: course_schedules Admin roles can manage schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin roles can manage schedules" ON public.course_schedules TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role]))))));


--
-- TOC entry 5098 (class 3256 OID 34908)
-- Name: course_schedules Admin roles can view all schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin roles can view all schedules" ON public.course_schedules FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role, 'secretary'::public.user_role]))))));


--
-- TOC entry 5018 (class 3256 OID 21704)
-- Name: academic_years Admins can delete academic years; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete academic years" ON public.academic_years FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5033 (class 3256 OID 21719)
-- Name: competencies Admins can delete competencies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete competencies" ON public.competencies FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5030 (class 3256 OID 21716)
-- Name: courses Admins can delete courses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5024 (class 3256 OID 21710)
-- Name: grade_levels Admins can delete grade levels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete grade levels" ON public.grade_levels FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5021 (class 3256 OID 21707)
-- Name: periods Admins can delete periods; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete periods" ON public.periods FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5027 (class 3256 OID 21713)
-- Name: sections Admins can delete sections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete sections" ON public.sections FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5016 (class 3256 OID 21702)
-- Name: academic_years Admins can insert academic years; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert academic years" ON public.academic_years FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5031 (class 3256 OID 21717)
-- Name: competencies Admins can insert competencies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert competencies" ON public.competencies FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5028 (class 3256 OID 21714)
-- Name: courses Admins can insert courses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5022 (class 3256 OID 21708)
-- Name: grade_levels Admins can insert grade levels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert grade levels" ON public.grade_levels FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5019 (class 3256 OID 21705)
-- Name: periods Admins can insert periods; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert periods" ON public.periods FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5025 (class 3256 OID 21711)
-- Name: sections Admins can insert sections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can insert sections" ON public.sections FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5017 (class 3256 OID 21703)
-- Name: academic_years Admins can update academic years; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update academic years" ON public.academic_years FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5032 (class 3256 OID 21718)
-- Name: competencies Admins can update competencies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update competencies" ON public.competencies FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5029 (class 3256 OID 21715)
-- Name: courses Admins can update courses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update courses" ON public.courses FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5023 (class 3256 OID 21709)
-- Name: grade_levels Admins can update grade levels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update grade levels" ON public.grade_levels FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5020 (class 3256 OID 21706)
-- Name: periods Admins can update periods; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update periods" ON public.periods FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5026 (class 3256 OID 21712)
-- Name: sections Admins can update sections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update sections" ON public.sections FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5115 (class 3256 OID 40670)
-- Name: enrollment_applications Allow anonymous insert enrollment_applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow anonymous insert enrollment_applications" ON public.enrollment_applications FOR INSERT TO anon WITH CHECK (true);


--
-- TOC entry 5114 (class 3256 OID 40669)
-- Name: academic_years Allow anonymous read academic_years; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow anonymous read academic_years" ON public.academic_years FOR SELECT TO anon USING (true);


--
-- TOC entry 5113 (class 3256 OID 40668)
-- Name: grade_levels Allow anonymous read grade_levels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow anonymous read grade_levels" ON public.grade_levels FOR SELECT TO anon USING (true);


--
-- TOC entry 5116 (class 3256 OID 40671)
-- Name: enrollment_applications Allow anonymous read own enrollment_applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow anonymous read own enrollment_applications" ON public.enrollment_applications FOR SELECT TO anon USING (true);


--
-- TOC entry 5090 (class 3256 OID 26598)
-- Name: guardians Allow authenticated all on guardians; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated all on guardians" ON public.guardians TO authenticated USING (true) WITH CHECK (true);


--
-- TOC entry 5058 (class 3256 OID 25697)
-- Name: profiles Allow authenticated inserts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated inserts" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);


--
-- TOC entry 5110 (class 3256 OID 40666)
-- Name: enrollment_applications Anyone can submit enrollment application; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can submit enrollment application" ON public.enrollment_applications FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- TOC entry 5111 (class 3256 OID 40667)
-- Name: enrollment_applications Applicants can read own applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Applicants can read own applications" ON public.enrollment_applications FOR SELECT TO authenticated, anon USING (((guardian_email = ((current_setting('request.headers'::text, true))::json ->> 'x-applicant-email'::text)) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'secretary'::public.user_role, 'coordinator'::public.user_role])))))));


--
-- TOC entry 4995 (class 3256 OID 18123)
-- Name: academic_years Authenticated users can read academic years; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5000 (class 3256 OID 18128)
-- Name: competencies Authenticated users can read competencies; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read competencies" ON public.competencies FOR SELECT TO authenticated USING (true);


--
-- TOC entry 4999 (class 3256 OID 18127)
-- Name: courses Authenticated users can read courses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read courses" ON public.courses FOR SELECT TO authenticated USING (true);


--
-- TOC entry 4997 (class 3256 OID 18125)
-- Name: grade_levels Authenticated users can read grade levels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read grade levels" ON public.grade_levels FOR SELECT TO authenticated USING (true);


--
-- TOC entry 4996 (class 3256 OID 18124)
-- Name: periods Authenticated users can read periods; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read periods" ON public.periods FOR SELECT TO authenticated USING (true);


--
-- TOC entry 4998 (class 3256 OID 18126)
-- Name: sections Authenticated users can read sections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read sections" ON public.sections FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5001 (class 3256 OID 18129)
-- Name: students Authenticated users can read students; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can read students" ON public.students FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5112 (class 3256 OID 25932)
-- Name: cash_closures Cashiers can manage cash closures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Cashiers can manage cash closures" ON public.cash_closures TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5011 (class 3256 OID 18145)
-- Name: cash_closures Finance roles can insert cash closures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance roles can insert cash closures" ON public.cash_closures FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['cashier'::public.user_role, 'admin'::public.user_role]))))));


--
-- TOC entry 5010 (class 3256 OID 18144)
-- Name: cash_closures Finance roles can read cash closures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance roles can read cash closures" ON public.cash_closures FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'cashier'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role]))))));


--
-- TOC entry 5076 (class 3256 OID 25924)
-- Name: charges Finance staff can manage charges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage charges" ON public.charges TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5083 (class 3256 OID 26204)
-- Name: discounts Finance staff can manage discounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage discounts" ON public.discounts TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role]))))));


--
-- TOC entry 5042 (class 3256 OID 26198)
-- Name: fee_concepts Finance staff can manage fee concepts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage fee concepts" ON public.fee_concepts TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role]))))));


--
-- TOC entry 5079 (class 3256 OID 26200)
-- Name: financial_plans Finance staff can manage financial plans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage financial plans" ON public.financial_plans TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role]))))));


--
-- TOC entry 5091 (class 3256 OID 25927)
-- Name: payments Finance staff can manage payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage payments" ON public.payments TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5081 (class 3256 OID 26202)
-- Name: plan_installments Finance staff can manage plan installments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage plan installments" ON public.plan_installments TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role]))))));


--
-- TOC entry 5093 (class 3256 OID 25930)
-- Name: receipts Finance staff can manage receipts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage receipts" ON public.receipts TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5086 (class 3256 OID 26207)
-- Name: student_discounts Finance staff can manage student discounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can manage student discounts" ON public.student_discounts TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role]))))));


--
-- TOC entry 5094 (class 3256 OID 25931)
-- Name: cash_closures Finance staff can read cash closures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can read cash closures" ON public.cash_closures FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5082 (class 3256 OID 26203)
-- Name: discounts Finance staff can read discounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can read discounts" ON public.discounts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5041 (class 3256 OID 26197)
-- Name: fee_concepts Finance staff can read fee concepts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can read fee concepts" ON public.fee_concepts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5043 (class 3256 OID 26199)
-- Name: financial_plans Finance staff can read financial plans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can read financial plans" ON public.financial_plans FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5080 (class 3256 OID 26201)
-- Name: plan_installments Finance staff can read plan installments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can read plan installments" ON public.plan_installments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))));


--
-- TOC entry 5084 (class 3256 OID 26205)
-- Name: student_discounts Finance staff can read student discounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Finance staff can read student discounts" ON public.student_discounts FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))) OR (student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))) OR (student_id IN ( SELECT sg.student_id
   FROM (public.student_guardians sg
     JOIN public.guardians g ON ((sg.guardian_id = g.id)))
  WHERE (g.user_id = auth.uid())))));


--
-- TOC entry 5013 (class 3256 OID 21654)
-- Name: attendance_justifications Guardians can insert justifications for their students; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Guardians can insert justifications for their students" ON public.attendance_justifications FOR INSERT TO authenticated WITH CHECK ((guardian_id IN ( SELECT guardians.id
   FROM public.guardians
  WHERE (guardians.user_id = auth.uid()))));


--
-- TOC entry 5002 (class 3256 OID 18130)
-- Name: guardians Guardians can read own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Guardians can read own data" ON public.guardians FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5012 (class 3256 OID 21653)
-- Name: attendance_justifications Guardians can read their students' justifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Guardians can read their students' justifications" ON public.attendance_justifications FOR SELECT TO authenticated USING (((guardian_id IN ( SELECT guardians.id
   FROM public.guardians
  WHERE (guardians.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'secretary'::public.user_role, 'coordinator'::public.user_role])))))));


--
-- TOC entry 5003 (class 3256 OID 18131)
-- Name: student_guardians Guardians can see their students; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Guardians can see their students" ON public.student_guardians FOR SELECT TO authenticated USING ((guardian_id IN ( SELECT guardians.id
   FROM public.guardians
  WHERE (guardians.user_id = auth.uid()))));


--
-- TOC entry 5014 (class 3256 OID 21655)
-- Name: attendance_justifications Guardians can update pending justifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Guardians can update pending justifications" ON public.attendance_justifications FOR UPDATE TO authenticated USING ((((guardian_id IN ( SELECT guardians.id
   FROM public.guardians
  WHERE (guardians.user_id = auth.uid()))) AND (status = 'pendiente'::public.justification_status)) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'secretary'::public.user_role])))))));


--
-- TOC entry 5101 (class 3256 OID 34911)
-- Name: course_schedules Guardians can view their children schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Guardians can view their children schedules" ON public.course_schedules FOR SELECT TO authenticated USING ((section_id IN ( SELECT s.section_id
   FROM ((public.students s
     JOIN public.student_guardians sg ON ((s.id = sg.student_id)))
     JOIN public.guardians g ON ((sg.guardian_id = g.id)))
  WHERE ((g.user_id = auth.uid()) AND (s.section_id IS NOT NULL)))));


--
-- TOC entry 5109 (class 3256 OID 40665)
-- Name: academic_years Public can read academic years; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read academic years" ON public.academic_years FOR SELECT TO anon USING (true);


--
-- TOC entry 5108 (class 3256 OID 40664)
-- Name: grade_levels Public can read grade levels; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read grade levels" ON public.grade_levels FOR SELECT TO anon USING (true);


--
-- TOC entry 5039 (class 3256 OID 21725)
-- Name: assignment_submissions Students can insert submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can insert submissions" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK ((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))));


--
-- TOC entry 5008 (class 3256 OID 18136)
-- Name: assignment_submissions Students can manage own submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions TO authenticated USING (((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['teacher'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role])))))));


--
-- TOC entry 5040 (class 3256 OID 21726)
-- Name: assignment_submissions Students can update own submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can update own submissions" ON public.assignment_submissions FOR UPDATE TO authenticated USING (((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))) OR (reviewed_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['teacher'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role])))))));


--
-- TOC entry 5100 (class 3256 OID 34910)
-- Name: course_schedules Students can view their section schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Students can view their section schedules" ON public.course_schedules FOR SELECT TO authenticated USING ((section_id IN ( SELECT students.section_id
   FROM public.students
  WHERE ((students.user_id = auth.uid()) AND (students.section_id IS NOT NULL)))));


--
-- TOC entry 5049 (class 3256 OID 22007)
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- TOC entry 5096 (class 3256 OID 26857)
-- Name: messages Teachers and guardians can insert messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers and guardians can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (((sender_id = auth.uid()) AND (((sender_role = 'teacher'::text) AND (EXISTS ( SELECT 1
   FROM ((public.teachers t
     JOIN public.teacher_course_assignments tca ON ((tca.teacher_id = t.id)))
     JOIN public.students s ON ((s.section_id = tca.section_id)))
  WHERE ((t.user_id = auth.uid()) AND (s.id = messages.student_id))))) OR ((sender_role = 'guardian'::text) AND (EXISTS ( SELECT 1
   FROM (public.guardians g
     JOIN public.student_guardians sg ON ((sg.guardian_id = g.id)))
  WHERE ((g.user_id = auth.uid()) AND (sg.student_id = messages.student_id))))))));


--
-- TOC entry 5095 (class 3256 OID 26855)
-- Name: messages Teachers and guardians can read relevant messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers and guardians can read relevant messages" ON public.messages FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM ((public.teachers t
     JOIN public.teacher_course_assignments tca ON ((tca.teacher_id = t.id)))
     JOIN public.students s ON ((s.section_id = tca.section_id)))
  WHERE ((t.user_id = auth.uid()) AND (s.id = messages.student_id)))) OR (EXISTS ( SELECT 1
   FROM (public.guardians g
     JOIN public.student_guardians sg ON ((sg.guardian_id = g.id)))
  WHERE ((g.user_id = auth.uid()) AND (sg.student_id = messages.student_id)))) OR (sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role])))))));


--
-- TOC entry 5038 (class 3256 OID 21724)
-- Name: assignments Teachers can delete assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can delete assignments" ON public.assignments FOR DELETE TO authenticated USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role])))))));


--
-- TOC entry 5036 (class 3256 OID 21722)
-- Name: assignments Teachers can insert assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['teacher'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role]))))));


--
-- TOC entry 5034 (class 3256 OID 21720)
-- Name: evaluations Teachers can insert evaluations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can insert evaluations" ON public.evaluations FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['teacher'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role]))))));


--
-- TOC entry 5005 (class 3256 OID 18133)
-- Name: attendance Teachers can manage attendance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can manage attendance" ON public.attendance TO authenticated USING (((recorded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['teacher'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role])))))));


--
-- TOC entry 5004 (class 3256 OID 18132)
-- Name: teachers Teachers can read own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can read own data" ON public.teachers FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR true));


--
-- TOC entry 5037 (class 3256 OID 21723)
-- Name: assignments Teachers can update assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update assignments" ON public.assignments FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role])))))));


--
-- TOC entry 5035 (class 3256 OID 21721)
-- Name: evaluations Teachers can update evaluations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can update evaluations" ON public.evaluations FOR UPDATE TO authenticated USING (((recorded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role])))))));


--
-- TOC entry 5099 (class 3256 OID 34909)
-- Name: course_schedules Teachers can view their schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teachers can view their schedules" ON public.course_schedules FOR SELECT TO authenticated USING ((teacher_id IN ( SELECT teachers.id
   FROM public.teachers
  WHERE (teachers.user_id = auth.uid()))));


--
-- TOC entry 5048 (class 3256 OID 22006)
-- Name: audit_logs Users can read own audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5045 (class 3256 OID 21969)
-- Name: notifications Users can read own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- TOC entry 5057 (class 3256 OID 25696)
-- Name: profiles Users can read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- TOC entry 5009 (class 3256 OID 18137)
-- Name: announcements Users can read published announcements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read published announcements" ON public.announcements FOR SELECT TO authenticated USING (((status = 'publicado'::public.announcement_status) OR (created_by = auth.uid())));


--
-- TOC entry 5007 (class 3256 OID 18135)
-- Name: assignments Users can read relevant assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read relevant assignments" ON public.assignments FOR SELECT TO authenticated USING (true);


--
-- TOC entry 5071 (class 3256 OID 25922)
-- Name: charges Users can read relevant charges; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read relevant charges" ON public.charges FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))) OR (student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))) OR (student_id IN ( SELECT sg.student_id
   FROM (public.student_guardians sg
     JOIN public.guardians g ON ((sg.guardian_id = g.id)))
  WHERE (g.user_id = auth.uid())))));


--
-- TOC entry 5006 (class 3256 OID 18134)
-- Name: evaluations Users can read relevant evaluations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read relevant evaluations" ON public.evaluations FOR SELECT TO authenticated USING (((status = 'publicada'::public.evaluation_status) OR (recorded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'teacher'::public.user_role])))))));


--
-- TOC entry 5077 (class 3256 OID 25925)
-- Name: payments Users can read relevant payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read relevant payments" ON public.payments FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))) OR (student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))) OR (student_id IN ( SELECT sg.student_id
   FROM (public.student_guardians sg
     JOIN public.guardians g ON ((sg.guardian_id = g.id)))
  WHERE (g.user_id = auth.uid())))));


--
-- TOC entry 5092 (class 3256 OID 25928)
-- Name: receipts Users can read relevant receipts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read relevant receipts" ON public.receipts FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'cashier'::public.user_role]))))) OR (student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))) OR (student_id IN ( SELECT sg.student_id
   FROM (public.student_guardians sg
     JOIN public.guardians g ON ((sg.guardian_id = g.id)))
  WHERE (g.user_id = auth.uid())))));


--
-- TOC entry 5097 (class 3256 OID 26859)
-- Name: messages Users can update message read status; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update message read status" ON public.messages FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM ((public.teachers t
     JOIN public.teacher_course_assignments tca ON ((tca.teacher_id = t.id)))
     JOIN public.students s ON ((s.section_id = tca.section_id)))
  WHERE ((t.user_id = auth.uid()) AND (s.id = messages.student_id)))) OR (EXISTS ( SELECT 1
   FROM (public.guardians g
     JOIN public.student_guardians sg ON ((sg.guardian_id = g.id)))
  WHERE ((g.user_id = auth.uid()) AND (sg.student_id = messages.student_id))))));


--
-- TOC entry 5046 (class 3256 OID 21970)
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- TOC entry 5064 (class 3256 OID 25698)
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid()));


--
-- TOC entry 4961 (class 0 OID 17541)
-- Dependencies: 382
-- Name: academic_years; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5069 (class 3256 OID 23180)
-- Name: teacher_course_assignments admin_create_assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_create_assignments ON public.teacher_course_assignments FOR INSERT TO authenticated WITH CHECK ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'coordinator'::text])));


--
-- TOC entry 5066 (class 3256 OID 23118)
-- Name: enrollment_applications admin_delete_applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_delete_applications ON public.enrollment_applications FOR DELETE TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text])));


--
-- TOC entry 5051 (class 3256 OID 23182)
-- Name: teacher_course_assignments admin_delete_assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_delete_assignments ON public.teacher_course_assignments FOR DELETE TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text])));


--
-- TOC entry 5067 (class 3256 OID 23178)
-- Name: teacher_course_assignments admin_director_view_all_assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_director_view_all_assignments ON public.teacher_course_assignments FOR SELECT TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'coordinator'::text])));


--
-- TOC entry 5078 (class 3256 OID 23447)
-- Name: student_course_enrollments admin_staff_manage_enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_staff_manage_enrollments ON public.student_course_enrollments TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'coordinator'::text, 'secretary'::text]))) WITH CHECK ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'coordinator'::text, 'secretary'::text])));


--
-- TOC entry 5072 (class 3256 OID 23441)
-- Name: student_course_enrollments admin_staff_view_all_enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_staff_view_all_enrollments ON public.student_course_enrollments FOR SELECT TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'coordinator'::text, 'secretary'::text])));


--
-- TOC entry 5070 (class 3256 OID 23181)
-- Name: teacher_course_assignments admin_update_assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_update_assignments ON public.teacher_course_assignments FOR UPDATE TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'coordinator'::text])));


--
-- TOC entry 4975 (class 0 OID 17947)
-- Dependencies: 397
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5089 (class 3256 OID 24828)
-- Name: announcements announcements_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY announcements_delete_policy ON public.announcements FOR DELETE TO authenticated USING ((((created_by = auth.uid()) AND (status = 'borrador'::public.announcement_status)) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role])))))));


--
-- TOC entry 5087 (class 3256 OID 24825)
-- Name: announcements announcements_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY announcements_insert_policy ON public.announcements FOR INSERT TO authenticated WITH CHECK (((created_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['teacher'::public.user_role, 'admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role])))))));


--
-- TOC entry 5085 (class 3256 OID 24824)
-- Name: announcements announcements_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY announcements_select_policy ON public.announcements FOR SELECT TO authenticated USING (((status = 'publicado'::public.announcement_status) OR (created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role])))))));


--
-- TOC entry 5088 (class 3256 OID 24826)
-- Name: announcements announcements_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY announcements_update_policy ON public.announcements FOR UPDATE TO authenticated USING ((((created_by = auth.uid()) AND (status = ANY (ARRAY['borrador'::public.announcement_status, 'pendiente_aprobacion'::public.announcement_status]))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role]))))))) WITH CHECK ((((created_by = auth.uid()) AND (status = ANY (ARRAY['borrador'::public.announcement_status, 'pendiente_aprobacion'::public.announcement_status]))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'coordinator'::public.user_role])))))));


--
-- TOC entry 4974 (class 0 OID 17897)
-- Dependencies: 396
-- Name: assignment_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4973 (class 0 OID 17861)
-- Dependencies: 395
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4971 (class 0 OID 17771)
-- Dependencies: 393
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4980 (class 0 OID 21617)
-- Dependencies: 402
-- Name: attendance_justifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.attendance_justifications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4982 (class 0 OID 21987)
-- Dependencies: 404
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4979 (class 0 OID 18089)
-- Dependencies: 401
-- Name: cash_closures; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4976 (class 0 OID 17997)
-- Dependencies: 398
-- Name: charges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4966 (class 0 OID 17625)
-- Dependencies: 387
-- Name: competencies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4970 (class 0 OID 17731)
-- Dependencies: 392
-- Name: course_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4993 (class 0 OID 34872)
-- Dependencies: 425
-- Name: course_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.course_schedules ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4965 (class 0 OID 17608)
-- Dependencies: 386
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4990 (class 0 OID 26146)
-- Dependencies: 414
-- Name: discounts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4984 (class 0 OID 23073)
-- Dependencies: 406
-- Name: enrollment_applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.enrollment_applications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4972 (class 0 OID 17823)
-- Dependencies: 394
-- Name: evaluations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4987 (class 0 OID 26093)
-- Dependencies: 411
-- Name: fee_concepts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.fee_concepts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4988 (class 0 OID 26106)
-- Dependencies: 412
-- Name: financial_plans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_plans ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4963 (class 0 OID 17575)
-- Dependencies: 384
-- Name: grade_levels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5075 (class 3256 OID 23445)
-- Name: student_course_enrollments guardians_view_children_enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY guardians_view_children_enrollments ON public.student_course_enrollments FOR SELECT TO authenticated USING ((student_id IN ( SELECT s.id
   FROM ((public.students s
     JOIN public.student_guardians sg ON ((sg.student_id = s.id)))
     JOIN public.guardians g ON ((g.id = sg.guardian_id)))
  WHERE (g.user_id = auth.uid()))));


--
-- TOC entry 5055 (class 3256 OID 23072)
-- Name: task_submissions guardians_view_children_submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY guardians_view_children_submissions ON public.task_submissions FOR SELECT TO authenticated USING ((student_id IN ( SELECT sg.student_id
   FROM (public.student_guardians sg
     JOIN public.guardians g ON ((g.id = sg.guardian_id)))
  WHERE (g.user_id = auth.uid()))));


--
-- TOC entry 5063 (class 3256 OID 23116)
-- Name: enrollment_applications guardians_view_own_applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY guardians_view_own_applications ON public.enrollment_applications FOR SELECT TO authenticated USING ((guardian_email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- TOC entry 4992 (class 0 OID 26834)
-- Dependencies: 417
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4981 (class 0 OID 21951)
-- Dependencies: 403
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4977 (class 0 OID 18037)
-- Dependencies: 399
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4962 (class 0 OID 17551)
-- Dependencies: 383
-- Name: periods; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4989 (class 0 OID 26128)
-- Dependencies: 413
-- Name: plan_installments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.plan_installments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4960 (class 0 OID 17523)
-- Dependencies: 381
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5061 (class 3256 OID 22264)
-- Name: profiles profiles_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text])));


--
-- TOC entry 5060 (class 3256 OID 22263)
-- Name: profiles profiles_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text]))));


--
-- TOC entry 5062 (class 3256 OID 22265)
-- Name: profiles profiles_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (((id = auth.uid()) OR (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text])))) WITH CHECK (((id = auth.uid()) OR (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text]))));


--
-- TOC entry 5056 (class 3256 OID 23114)
-- Name: enrollment_applications public_can_create_applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_can_create_applications ON public.enrollment_applications FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- TOC entry 4994 (class 0 OID 40625)
-- Dependencies: 426
-- Name: public_news; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.public_news ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5107 (class 3256 OID 40659)
-- Name: public_news public_news_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_news_delete ON public.public_news FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- TOC entry 5105 (class 3256 OID 40657)
-- Name: public_news public_news_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_news_insert ON public.public_news FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'web_editor'::public.user_role]))))));


--
-- TOC entry 5104 (class 3256 OID 40656)
-- Name: public_news public_news_select_all_for_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_news_select_all_for_admin ON public.public_news FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'web_editor'::public.user_role]))))));


--
-- TOC entry 5103 (class 3256 OID 40655)
-- Name: public_news public_news_select_published; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_news_select_published ON public.public_news FOR SELECT USING ((status = 'publicado'::public.public_news_status));


--
-- TOC entry 5106 (class 3256 OID 40658)
-- Name: public_news public_news_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_news_update ON public.public_news FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'director'::public.user_role, 'web_editor'::public.user_role]))))));


--
-- TOC entry 4978 (class 0 OID 18062)
-- Dependencies: 400
-- Name: receipts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4964 (class 0 OID 17586)
-- Dependencies: 385
-- Name: sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5065 (class 3256 OID 23117)
-- Name: enrollment_applications staff_update_applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY staff_update_applications ON public.enrollment_applications FOR UPDATE TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'secretary'::text, 'coordinator'::text]))) WITH CHECK ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'secretary'::text, 'coordinator'::text])));


--
-- TOC entry 5059 (class 3256 OID 23115)
-- Name: enrollment_applications staff_view_all_applications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY staff_view_all_applications ON public.enrollment_applications FOR SELECT TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'director'::text, 'secretary'::text, 'coordinator'::text])));


--
-- TOC entry 4986 (class 0 OID 23206)
-- Dependencies: 410
-- Name: student_course_enrollments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_course_enrollments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4991 (class 0 OID 26164)
-- Dependencies: 415
-- Name: student_discounts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_discounts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4968 (class 0 OID 17688)
-- Dependencies: 390
-- Name: student_guardians; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4967 (class 0 OID 17642)
-- Dependencies: 388
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5050 (class 3256 OID 23067)
-- Name: task_submissions students_insert_own_submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_insert_own_submissions ON public.task_submissions FOR INSERT TO authenticated WITH CHECK ((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))));


--
-- TOC entry 5052 (class 3256 OID 23068)
-- Name: task_submissions students_update_own_submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_update_own_submissions ON public.task_submissions FOR UPDATE TO authenticated USING (((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))) AND (status = ANY (ARRAY['draft'::text, 'submitted'::text])))) WITH CHECK ((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))));


--
-- TOC entry 5074 (class 3256 OID 23444)
-- Name: student_course_enrollments students_view_own_enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_view_own_enrollments ON public.student_course_enrollments FOR SELECT TO authenticated USING ((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))));


--
-- TOC entry 5044 (class 3256 OID 23066)
-- Name: task_submissions students_view_own_submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY students_view_own_submissions ON public.task_submissions FOR SELECT TO authenticated USING ((student_id IN ( SELECT students.id
   FROM public.students
  WHERE (students.user_id = auth.uid()))));


--
-- TOC entry 4983 (class 0 OID 23029)
-- Dependencies: 405
-- Name: task_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4985 (class 0 OID 23119)
-- Dependencies: 407
-- Name: teacher_course_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.teacher_course_assignments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4969 (class 0 OID 17708)
-- Dependencies: 391
-- Name: teachers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5054 (class 3256 OID 23071)
-- Name: task_submissions teachers_update_submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY teachers_update_submissions ON public.task_submissions FOR UPDATE TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['teacher'::text, 'admin'::text, 'director'::text, 'coordinator'::text]))) WITH CHECK ((public.get_user_role(auth.uid()) = ANY (ARRAY['teacher'::text, 'admin'::text, 'director'::text, 'coordinator'::text])));


--
-- TOC entry 5068 (class 3256 OID 23179)
-- Name: teacher_course_assignments teachers_view_own_assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY teachers_view_own_assignments ON public.teacher_course_assignments FOR SELECT TO authenticated USING ((teacher_id IN ( SELECT teachers.id
   FROM public.teachers
  WHERE (teachers.user_id = auth.uid()))));


--
-- TOC entry 5053 (class 3256 OID 23070)
-- Name: task_submissions teachers_view_submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY teachers_view_submissions ON public.task_submissions FOR SELECT TO authenticated USING ((public.get_user_role(auth.uid()) = ANY (ARRAY['teacher'::text, 'admin'::text, 'director'::text, 'coordinator'::text])));


--
-- TOC entry 5073 (class 3256 OID 23442)
-- Name: student_course_enrollments teachers_view_their_course_enrollments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY teachers_view_their_course_enrollments ON public.student_course_enrollments FOR SELECT TO authenticated USING ((course_id IN ( SELECT tca.course_id
   FROM (public.teacher_course_assignments tca
     JOIN public.teachers t ON ((t.id = tca.teacher_id)))
  WHERE ((t.user_id = auth.uid()) AND (tca.is_active = true)))));


--
-- TOC entry 4959 (class 0 OID 17473)
-- Dependencies: 380
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4940 (class 0 OID 16546)
-- Dependencies: 349
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4956 (class 0 OID 17242)
-- Dependencies: 371
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4957 (class 0 OID 17269)
-- Dependencies: 372
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4942 (class 0 OID 16588)
-- Dependencies: 351
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4941 (class 0 OID 16561)
-- Dependencies: 350
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4954 (class 0 OID 17144)
-- Dependencies: 369
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4955 (class 0 OID 17158)
-- Dependencies: 370
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4958 (class 0 OID 17279)
-- Dependencies: 373
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5117 (class 6104 OID 16426)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- TOC entry 5118 (class 6104 OID 22158)
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;

--
-- TOC entry 5119 (class 6106 OID 22159)
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 35
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 22
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 127
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 12
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 36
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 30
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 484
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 493
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 442
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 456
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 492
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 538
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 519
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 507
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 508
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 477
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 550
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 528
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 468
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 451
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 534
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 444
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 575
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 572
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 526
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 506
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 474
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 450
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 562
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 542
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 569
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 532
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 481
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 479
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 555
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 437
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5254 (class 0 OID 0)
-- Dependencies: 557
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 453
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 565
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 564
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 488
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 482
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 466
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 552
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 554
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 485
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 556
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 553
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 574
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 499
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 455
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 558
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 435
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 543
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 448
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 490
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 546
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 436
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 454
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 464
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 520
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 467
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 560
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 511
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 522
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 563
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 452
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 487
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 470
-- Name: FUNCTION activate_user(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.activate_user(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.activate_user(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.activate_user(p_user_id uuid) TO service_role;


--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 434
-- Name: FUNCTION approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid) TO anon;
GRANT ALL ON FUNCTION public.approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.approve_enrollment_application(p_application_id uuid, p_section_id uuid, p_approved_by uuid) TO service_role;


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 523
-- Name: FUNCTION audit_and_notify_payment(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.audit_and_notify_payment() TO anon;
GRANT ALL ON FUNCTION public.audit_and_notify_payment() TO authenticated;
GRANT ALL ON FUNCTION public.audit_and_notify_payment() TO service_role;


--
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 561
-- Name: FUNCTION audit_evaluation_changes(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.audit_evaluation_changes() TO anon;
GRANT ALL ON FUNCTION public.audit_evaluation_changes() TO authenticated;
GRANT ALL ON FUNCTION public.audit_evaluation_changes() TO service_role;


--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 471
-- Name: FUNCTION auto_enroll_student_to_section_courses(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.auto_enroll_student_to_section_courses() TO anon;
GRANT ALL ON FUNCTION public.auto_enroll_student_to_section_courses() TO authenticated;
GRANT ALL ON FUNCTION public.auto_enroll_student_to_section_courses() TO service_role;


--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 439
-- Name: FUNCTION check_schedule_overlap(p_section_id uuid, p_day_of_week integer, p_start_time time without time zone, p_end_time time without time zone, p_schedule_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_schedule_overlap(p_section_id uuid, p_day_of_week integer, p_start_time time without time zone, p_end_time time without time zone, p_schedule_id uuid) TO anon;
GRANT ALL ON FUNCTION public.check_schedule_overlap(p_section_id uuid, p_day_of_week integer, p_start_time time without time zone, p_end_time time without time zone, p_schedule_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.check_schedule_overlap(p_section_id uuid, p_day_of_week integer, p_start_time time without time zone, p_end_time time without time zone, p_schedule_id uuid) TO service_role;


--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 512
-- Name: FUNCTION create_audit_log(p_user_id uuid, p_action public.audit_action, p_entity_type text, p_entity_id uuid, p_old_values jsonb, p_new_values jsonb, p_reason text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_audit_log(p_user_id uuid, p_action public.audit_action, p_entity_type text, p_entity_id uuid, p_old_values jsonb, p_new_values jsonb, p_reason text) TO anon;
GRANT ALL ON FUNCTION public.create_audit_log(p_user_id uuid, p_action public.audit_action, p_entity_type text, p_entity_id uuid, p_old_values jsonb, p_new_values jsonb, p_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.create_audit_log(p_user_id uuid, p_action public.audit_action, p_entity_type text, p_entity_id uuid, p_old_values jsonb, p_new_values jsonb, p_reason text) TO service_role;


--
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 465
-- Name: FUNCTION create_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text, p_entity_type text, p_entity_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text, p_entity_type text, p_entity_id uuid) TO anon;
GRANT ALL ON FUNCTION public.create_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text, p_entity_type text, p_entity_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text, p_entity_type text, p_entity_id uuid) TO service_role;


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 478
-- Name: FUNCTION create_user_with_profile(p_email text, p_password text, p_role text, p_first_name text, p_last_name text, p_created_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_user_with_profile(p_email text, p_password text, p_role text, p_first_name text, p_last_name text, p_created_by uuid) TO anon;
GRANT ALL ON FUNCTION public.create_user_with_profile(p_email text, p_password text, p_role text, p_first_name text, p_last_name text, p_created_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_user_with_profile(p_email text, p_password text, p_role text, p_first_name text, p_last_name text, p_created_by uuid) TO service_role;


--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 539
-- Name: FUNCTION deactivate_user(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.deactivate_user(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.deactivate_user(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.deactivate_user(p_user_id uuid) TO service_role;


--
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 515
-- Name: FUNCTION generate_news_slug(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_news_slug() TO anon;
GRANT ALL ON FUNCTION public.generate_news_slug() TO authenticated;
GRANT ALL ON FUNCTION public.generate_news_slug() TO service_role;


--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 441
-- Name: FUNCTION get_teacher_course_load(p_teacher_id uuid, p_academic_year_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_teacher_course_load(p_teacher_id uuid, p_academic_year_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_teacher_course_load(p_teacher_id uuid, p_academic_year_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_teacher_course_load(p_teacher_id uuid, p_academic_year_id uuid) TO service_role;


--
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 433
-- Name: FUNCTION get_user_role(user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_role(user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_role(user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_role(user_id uuid) TO service_role;


--
-- TOC entry 5306 (class 0 OID 0)
-- Dependencies: 521
-- Name: FUNCTION notify_justification_status(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_justification_status() TO anon;
GRANT ALL ON FUNCTION public.notify_justification_status() TO authenticated;
GRANT ALL ON FUNCTION public.notify_justification_status() TO service_role;


--
-- TOC entry 5308 (class 0 OID 0)
-- Dependencies: 457
-- Name: FUNCTION sync_student_enrollments_on_teacher_assignment(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.sync_student_enrollments_on_teacher_assignment() TO anon;
GRANT ALL ON FUNCTION public.sync_student_enrollments_on_teacher_assignment() TO authenticated;
GRANT ALL ON FUNCTION public.sync_student_enrollments_on_teacher_assignment() TO service_role;


--
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 462
-- Name: FUNCTION unaccent(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent(text) TO postgres;
GRANT ALL ON FUNCTION public.unaccent(text) TO anon;
GRANT ALL ON FUNCTION public.unaccent(text) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent(text) TO service_role;


--
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 504
-- Name: FUNCTION unaccent(regdictionary, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO postgres;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO anon;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO service_role;


--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 541
-- Name: FUNCTION unaccent_init(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent_init(internal) TO postgres;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO anon;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO service_role;


--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 497
-- Name: FUNCTION unaccent_lexize(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO service_role;


--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 449
-- Name: FUNCTION update_course_schedules_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_course_schedules_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_course_schedules_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_course_schedules_updated_at() TO service_role;


--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 501
-- Name: FUNCTION update_enrollment_applications_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_enrollment_applications_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_enrollment_applications_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_enrollment_applications_updated_at() TO service_role;


--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 496
-- Name: FUNCTION update_profiles_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_profiles_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_profiles_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_profiles_updated_at() TO service_role;


--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 559
-- Name: FUNCTION update_public_news_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_public_news_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_public_news_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_public_news_updated_at() TO service_role;


--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 486
-- Name: FUNCTION update_student_course_enrollments_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_student_course_enrollments_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_student_course_enrollments_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_student_course_enrollments_updated_at() TO service_role;


--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 503
-- Name: FUNCTION update_task_submissions_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_task_submissions_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_task_submissions_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_task_submissions_updated_at() TO service_role;


--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 567
-- Name: FUNCTION update_teacher_assignments_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_teacher_assignments_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_teacher_assignments_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_teacher_assignments_updated_at() TO service_role;


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 460
-- Name: FUNCTION validate_teacher_course_limit(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_teacher_course_limit() TO anon;
GRANT ALL ON FUNCTION public.validate_teacher_course_limit() TO authenticated;
GRANT ALL ON FUNCTION public.validate_teacher_course_limit() TO service_role;


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 514
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 440
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 475
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 443
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 533
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 570
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 463
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 495
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 516
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 571
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 502
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 438
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 459
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 447
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 505
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 347
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 427
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 364
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 355
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 346
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 359
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 358
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 357
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 367
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 420
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 366
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 368
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 365
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 345
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 344
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 362
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 363
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 348
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 356
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 361
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 360
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- TOC entry 5381 (class 0 OID 0)
-- Dependencies: 343
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- TOC entry 5382 (class 0 OID 0)
-- Dependencies: 342
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- TOC entry 5383 (class 0 OID 0)
-- Dependencies: 341
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- TOC entry 5384 (class 0 OID 0)
-- Dependencies: 382
-- Name: TABLE academic_years; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.academic_years TO anon;
GRANT ALL ON TABLE public.academic_years TO authenticated;
GRANT ALL ON TABLE public.academic_years TO service_role;


--
-- TOC entry 5385 (class 0 OID 0)
-- Dependencies: 397
-- Name: TABLE announcements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.announcements TO anon;
GRANT ALL ON TABLE public.announcements TO authenticated;
GRANT ALL ON TABLE public.announcements TO service_role;


--
-- TOC entry 5386 (class 0 OID 0)
-- Dependencies: 396
-- Name: TABLE assignment_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignment_submissions TO anon;
GRANT ALL ON TABLE public.assignment_submissions TO authenticated;
GRANT ALL ON TABLE public.assignment_submissions TO service_role;


--
-- TOC entry 5387 (class 0 OID 0)
-- Dependencies: 395
-- Name: TABLE assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assignments TO anon;
GRANT ALL ON TABLE public.assignments TO authenticated;
GRANT ALL ON TABLE public.assignments TO service_role;


--
-- TOC entry 5388 (class 0 OID 0)
-- Dependencies: 393
-- Name: TABLE attendance; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attendance TO anon;
GRANT ALL ON TABLE public.attendance TO authenticated;
GRANT ALL ON TABLE public.attendance TO service_role;


--
-- TOC entry 5389 (class 0 OID 0)
-- Dependencies: 402
-- Name: TABLE attendance_justifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attendance_justifications TO anon;
GRANT ALL ON TABLE public.attendance_justifications TO authenticated;
GRANT ALL ON TABLE public.attendance_justifications TO service_role;


--
-- TOC entry 5390 (class 0 OID 0)
-- Dependencies: 404
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- TOC entry 5391 (class 0 OID 0)
-- Dependencies: 401
-- Name: TABLE cash_closures; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cash_closures TO anon;
GRANT ALL ON TABLE public.cash_closures TO authenticated;
GRANT ALL ON TABLE public.cash_closures TO service_role;


--
-- TOC entry 5392 (class 0 OID 0)
-- Dependencies: 398
-- Name: TABLE charges; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.charges TO anon;
GRANT ALL ON TABLE public.charges TO authenticated;
GRANT ALL ON TABLE public.charges TO service_role;


--
-- TOC entry 5393 (class 0 OID 0)
-- Dependencies: 387
-- Name: TABLE competencies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.competencies TO anon;
GRANT ALL ON TABLE public.competencies TO authenticated;
GRANT ALL ON TABLE public.competencies TO service_role;


--
-- TOC entry 5394 (class 0 OID 0)
-- Dependencies: 392
-- Name: TABLE course_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_assignments TO anon;
GRANT ALL ON TABLE public.course_assignments TO authenticated;
GRANT ALL ON TABLE public.course_assignments TO service_role;


--
-- TOC entry 5398 (class 0 OID 0)
-- Dependencies: 425
-- Name: TABLE course_schedules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.course_schedules TO anon;
GRANT ALL ON TABLE public.course_schedules TO authenticated;
GRANT ALL ON TABLE public.course_schedules TO service_role;


--
-- TOC entry 5400 (class 0 OID 0)
-- Dependencies: 386
-- Name: TABLE courses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.courses TO anon;
GRANT ALL ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;


--
-- TOC entry 5401 (class 0 OID 0)
-- Dependencies: 414
-- Name: TABLE discounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.discounts TO anon;
GRANT ALL ON TABLE public.discounts TO authenticated;
GRANT ALL ON TABLE public.discounts TO service_role;


--
-- TOC entry 5402 (class 0 OID 0)
-- Dependencies: 406
-- Name: TABLE enrollment_applications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.enrollment_applications TO anon;
GRANT ALL ON TABLE public.enrollment_applications TO authenticated;
GRANT ALL ON TABLE public.enrollment_applications TO service_role;


--
-- TOC entry 5403 (class 0 OID 0)
-- Dependencies: 394
-- Name: TABLE evaluations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.evaluations TO anon;
GRANT ALL ON TABLE public.evaluations TO authenticated;
GRANT ALL ON TABLE public.evaluations TO service_role;


--
-- TOC entry 5404 (class 0 OID 0)
-- Dependencies: 411
-- Name: TABLE fee_concepts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.fee_concepts TO anon;
GRANT ALL ON TABLE public.fee_concepts TO authenticated;
GRANT ALL ON TABLE public.fee_concepts TO service_role;


--
-- TOC entry 5405 (class 0 OID 0)
-- Dependencies: 412
-- Name: TABLE financial_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_plans TO anon;
GRANT ALL ON TABLE public.financial_plans TO authenticated;
GRANT ALL ON TABLE public.financial_plans TO service_role;


--
-- TOC entry 5406 (class 0 OID 0)
-- Dependencies: 384
-- Name: TABLE grade_levels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.grade_levels TO anon;
GRANT ALL ON TABLE public.grade_levels TO authenticated;
GRANT ALL ON TABLE public.grade_levels TO service_role;


--
-- TOC entry 5407 (class 0 OID 0)
-- Dependencies: 389
-- Name: TABLE guardians; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.guardians TO anon;
GRANT ALL ON TABLE public.guardians TO authenticated;
GRANT ALL ON TABLE public.guardians TO service_role;


--
-- TOC entry 5408 (class 0 OID 0)
-- Dependencies: 417
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;


--
-- TOC entry 5409 (class 0 OID 0)
-- Dependencies: 430
-- Name: TABLE migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.migrations TO anon;
GRANT ALL ON TABLE public.migrations TO authenticated;
GRANT ALL ON TABLE public.migrations TO service_role;


--
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 429
-- Name: SEQUENCE migrations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.migrations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.migrations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.migrations_id_seq TO service_role;


--
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 403
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- TOC entry 5413 (class 0 OID 0)
-- Dependencies: 399
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- TOC entry 5414 (class 0 OID 0)
-- Dependencies: 383
-- Name: TABLE periods; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.periods TO anon;
GRANT ALL ON TABLE public.periods TO authenticated;
GRANT ALL ON TABLE public.periods TO service_role;


--
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 432
-- Name: TABLE personal_access_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.personal_access_tokens TO anon;
GRANT ALL ON TABLE public.personal_access_tokens TO authenticated;
GRANT ALL ON TABLE public.personal_access_tokens TO service_role;


--
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 431
-- Name: SEQUENCE personal_access_tokens_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.personal_access_tokens_id_seq TO anon;
GRANT ALL ON SEQUENCE public.personal_access_tokens_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.personal_access_tokens_id_seq TO service_role;


--
-- TOC entry 5418 (class 0 OID 0)
-- Dependencies: 413
-- Name: TABLE plan_installments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.plan_installments TO anon;
GRANT ALL ON TABLE public.plan_installments TO authenticated;
GRANT ALL ON TABLE public.plan_installments TO service_role;


--
-- TOC entry 5422 (class 0 OID 0)
-- Dependencies: 381
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- TOC entry 5423 (class 0 OID 0)
-- Dependencies: 426
-- Name: TABLE public_news; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.public_news TO anon;
GRANT ALL ON TABLE public.public_news TO authenticated;
GRANT ALL ON TABLE public.public_news TO service_role;


--
-- TOC entry 5424 (class 0 OID 0)
-- Dependencies: 400
-- Name: TABLE receipts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.receipts TO anon;
GRANT ALL ON TABLE public.receipts TO authenticated;
GRANT ALL ON TABLE public.receipts TO service_role;


--
-- TOC entry 5425 (class 0 OID 0)
-- Dependencies: 385
-- Name: TABLE sections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sections TO anon;
GRANT ALL ON TABLE public.sections TO authenticated;
GRANT ALL ON TABLE public.sections TO service_role;


--
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 410
-- Name: TABLE student_course_enrollments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_course_enrollments TO anon;
GRANT ALL ON TABLE public.student_course_enrollments TO authenticated;
GRANT ALL ON TABLE public.student_course_enrollments TO service_role;


--
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 415
-- Name: TABLE student_discounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_discounts TO anon;
GRANT ALL ON TABLE public.student_discounts TO authenticated;
GRANT ALL ON TABLE public.student_discounts TO service_role;


--
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 390
-- Name: TABLE student_guardians; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.student_guardians TO anon;
GRANT ALL ON TABLE public.student_guardians TO authenticated;
GRANT ALL ON TABLE public.student_guardians TO service_role;


--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 388
-- Name: TABLE students; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.students TO anon;
GRANT ALL ON TABLE public.students TO authenticated;
GRANT ALL ON TABLE public.students TO service_role;


--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 405
-- Name: TABLE task_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.task_submissions TO anon;
GRANT ALL ON TABLE public.task_submissions TO authenticated;
GRANT ALL ON TABLE public.task_submissions TO service_role;


--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 407
-- Name: TABLE teacher_course_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teacher_course_assignments TO anon;
GRANT ALL ON TABLE public.teacher_course_assignments TO authenticated;
GRANT ALL ON TABLE public.teacher_course_assignments TO service_role;


--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 391
-- Name: TABLE teachers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teachers TO anon;
GRANT ALL ON TABLE public.teachers TO authenticated;
GRANT ALL ON TABLE public.teachers TO service_role;


--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 409
-- Name: TABLE teacher_assignment_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teacher_assignment_stats TO anon;
GRANT ALL ON TABLE public.teacher_assignment_stats TO authenticated;
GRANT ALL ON TABLE public.teacher_assignment_stats TO service_role;


--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 408
-- Name: TABLE teacher_assignments_view; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teacher_assignments_view TO anon;
GRANT ALL ON TABLE public.teacher_assignments_view TO authenticated;
GRANT ALL ON TABLE public.teacher_assignments_view TO service_role;


--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 428
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 380
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- TOC entry 5439 (class 0 OID 0)
-- Dependencies: 416
-- Name: TABLE messages_2025_12_13; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_13 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_13 TO dashboard_user;


--
-- TOC entry 5440 (class 0 OID 0)
-- Dependencies: 418
-- Name: TABLE messages_2025_12_14; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_14 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_14 TO dashboard_user;


--
-- TOC entry 5441 (class 0 OID 0)
-- Dependencies: 419
-- Name: TABLE messages_2025_12_15; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_15 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_15 TO dashboard_user;


--
-- TOC entry 5442 (class 0 OID 0)
-- Dependencies: 421
-- Name: TABLE messages_2025_12_16; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_16 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_16 TO dashboard_user;


--
-- TOC entry 5443 (class 0 OID 0)
-- Dependencies: 422
-- Name: TABLE messages_2025_12_17; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_17 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_17 TO dashboard_user;


--
-- TOC entry 5444 (class 0 OID 0)
-- Dependencies: 423
-- Name: TABLE messages_2025_12_18; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_18 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_18 TO dashboard_user;


--
-- TOC entry 5445 (class 0 OID 0)
-- Dependencies: 424
-- Name: TABLE messages_2025_12_19; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_12_19 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_12_19 TO dashboard_user;


--
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 374
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 377
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 376
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 349
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 371
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- TOC entry 5452 (class 0 OID 0)
-- Dependencies: 372
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- TOC entry 5454 (class 0 OID 0)
-- Dependencies: 350
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- TOC entry 5455 (class 0 OID 0)
-- Dependencies: 369
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- TOC entry 5456 (class 0 OID 0)
-- Dependencies: 370
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- TOC entry 5457 (class 0 OID 0)
-- Dependencies: 373
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- TOC entry 5458 (class 0 OID 0)
-- Dependencies: 352
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- TOC entry 5459 (class 0 OID 0)
-- Dependencies: 353
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- TOC entry 2755 (class 826 OID 16603)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2756 (class 826 OID 16604)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2754 (class 826 OID 16602)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2765 (class 826 OID 16682)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2764 (class 826 OID 16681)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- TOC entry 2763 (class 826 OID 16680)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2768 (class 826 OID 16637)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2767 (class 826 OID 16636)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2766 (class 826 OID 16635)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2760 (class 826 OID 16617)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2762 (class 826 OID 16616)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2761 (class 826 OID 16615)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2747 (class 826 OID 16490)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2748 (class 826 OID 16491)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2746 (class 826 OID 16489)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2750 (class 826 OID 16493)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2745 (class 826 OID 16488)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2749 (class 826 OID 16492)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2758 (class 826 OID 16607)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2759 (class 826 OID 16608)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2757 (class 826 OID 16606)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2753 (class 826 OID 16545)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2752 (class 826 OID 16544)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2751 (class 826 OID 16543)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 3936 (class 3466 OID 16621)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- TOC entry 3941 (class 3466 OID 16700)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- TOC entry 3935 (class 3466 OID 16619)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- TOC entry 3942 (class 3466 OID 16703)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- TOC entry 3937 (class 3466 OID 16622)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- TOC entry 3938 (class 3466 OID 16623)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

-- Completed on 2026-03-06 21:06:37

--
-- PostgreSQL database dump complete
--

\unrestrict bHOaL3SJ8G5sQvK4qHaIHWHQvW5jvjsuKSuS43a5ybOanrl5s9OonefaVLXPy6I

