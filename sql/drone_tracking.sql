--
-- PostgreSQL database dump
--

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-23 22:12:17

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16481)
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    drone_id character varying(255) NOT NULL
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16480)
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.devices_id_seq OWNER TO postgres;

--
-- TOC entry 4924 (class 0 OID 0)
-- Dependencies: 219
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- TOC entry 222 (class 1259 OID 16497)
-- Name: location_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location_logs (
    id integer NOT NULL,
    drone_id character varying(255),
    latitude double precision,
    longitude double precision,
    speed double precision,
    altitude double precision,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.location_logs OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16496)
-- Name: location_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.location_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.location_logs_id_seq OWNER TO postgres;

--
-- TOC entry 4925 (class 0 OID 0)
-- Dependencies: 221
-- Name: location_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.location_logs_id_seq OWNED BY public.location_logs.id;


--
-- TOC entry 4760 (class 2604 OID 16484)
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- TOC entry 4761 (class 2604 OID 16500)
-- Name: location_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_logs ALTER COLUMN id SET DEFAULT nextval('public.location_logs_id_seq'::regclass);


--
-- TOC entry 4764 (class 2606 OID 16495)
-- Name: devices devices_drone_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_drone_id_key UNIQUE (drone_id);


--
-- TOC entry 4766 (class 2606 OID 16493)
-- Name: devices devices_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_name_key UNIQUE (name);


--
-- TOC entry 4768 (class 2606 OID 16491)
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- TOC entry 4770 (class 2606 OID 16504)
-- Name: location_logs location_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_logs
    ADD CONSTRAINT location_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4771 (class 2606 OID 16505)
-- Name: location_logs location_logs_drone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location_logs
    ADD CONSTRAINT location_logs_drone_id_fkey FOREIGN KEY (drone_id) REFERENCES public.devices(drone_id);


-- Completed on 2026-01-23 22:12:18

--
-- PostgreSQL database dump complete
--


