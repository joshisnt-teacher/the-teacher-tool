SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '012d7e16-3300-4ae6-b99a-146f99130bb0', '{"action":"user_signedup","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-09-27 08:08:00.467718+00', ''),
	('00000000-0000-0000-0000-000000000000', '7c48ab65-2fb7-43b2-a386-340ab8dd9c99', '{"action":"login","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-27 08:08:00.486888+00', ''),
	('00000000-0000-0000-0000-000000000000', '37cff833-32fe-4b54-ae65-f0f5899e69ed', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 09:06:08.615028+00', ''),
	('00000000-0000-0000-0000-000000000000', '45a55257-24a8-4645-88f3-c0a59fa593bd', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 09:06:08.61926+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ebe6347-74e9-47d7-a1fc-9134f58e751d', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 10:04:08.564265+00', ''),
	('00000000-0000-0000-0000-000000000000', '0946c741-8adf-4de3-82c3-bf5c9e9e8e80', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 10:04:08.566892+00', ''),
	('00000000-0000-0000-0000-000000000000', '38901ca7-8067-4b5d-8c63-dcc43c0d1f61', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 11:02:16.553774+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd48b93fc-e55b-4cb1-9da8-2b45a55840a8', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 11:02:16.555006+00', ''),
	('00000000-0000-0000-0000-000000000000', '3ad3058e-d595-4cbe-92a9-07a6e0bcf2ca', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 12:00:16.556904+00', ''),
	('00000000-0000-0000-0000-000000000000', '7ae59c82-ebd2-4e58-943f-44f1f07861fa', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 12:00:16.557764+00', ''),
	('00000000-0000-0000-0000-000000000000', '8ae49633-1a1c-43ed-bb93-e33b9ff0222b', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 13:28:00.021828+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd50f7798-f655-4aef-bdec-75b659d41489', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-27 13:28:00.041699+00', ''),
	('00000000-0000-0000-0000-000000000000', '08351778-a185-49d1-8137-8c11a554129a', '{"action":"logout","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"account"}', '2025-09-27 13:28:19.286354+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a48a8ab6-5a5e-4c11-8ee6-ef4c839f7418', '{"action":"login","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-27 13:28:23.691477+00', ''),
	('00000000-0000-0000-0000-000000000000', '4219b491-7920-49f3-b6de-c4bc5dada070', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-28 15:41:56.705998+00', ''),
	('00000000-0000-0000-0000-000000000000', '65ef3f7d-35a8-434f-9519-c8df9100d85e', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-28 15:41:56.718514+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a4cedff8-ba33-4fa9-ab43-03191afc5a5b', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-28 16:41:52.513101+00', ''),
	('00000000-0000-0000-0000-000000000000', '38d49266-0c5a-48c5-894e-bccfe11b1438', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-28 16:41:52.516041+00', ''),
	('00000000-0000-0000-0000-000000000000', '52f80ca9-480e-48c8-b272-53342cdc4186', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 02:32:30.032271+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e4408a9-34b1-4096-afee-19e3c47a3f8e', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 02:32:30.034683+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f1ebbbc-0009-43d8-a5be-de3dc80b5c91', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 03:31:20.506152+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b90195dc-b5ba-4730-b9bc-1aebdc00533a', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 03:31:20.513336+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a06b45dd-e429-41fc-9200-e838f1e8e871', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 05:27:45.493338+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b6b66efe-907a-4d4d-878c-fcd4a2a8df7b', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 05:27:45.496291+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bf79042b-44fb-448b-b378-c9e4d4e4207c', '{"action":"logout","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"account"}', '2025-09-29 05:27:49.34084+00', ''),
	('00000000-0000-0000-0000-000000000000', '4a8d9aae-2823-4c59-ae01-382cf7e945eb', '{"action":"login","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-29 05:27:54.715781+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da7a5491-506b-4538-8eb4-7ef7655f7af8', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 07:04:45.604976+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f7e6a699-98e4-4ff2-ab5c-b670b3dbeb85', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 07:04:45.606576+00', ''),
	('00000000-0000-0000-0000-000000000000', 'edb4b235-91b0-4ea1-8c3a-a48978c0373b', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 11:58:53.701766+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b740f2a3-b930-4bd1-bb43-7f0d4bb88704', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 11:58:53.724961+00', ''),
	('00000000-0000-0000-0000-000000000000', '7bf5b88d-eef0-41c0-bd8c-d703ca6e0d85', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 11:58:54.447713+00', ''),
	('00000000-0000-0000-0000-000000000000', '3561fc10-4954-4af0-9062-7156418cf040', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 12:58:05.855611+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb6e24da-774d-4a8c-a0db-b6452ec849da', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-29 12:58:05.858335+00', ''),
	('00000000-0000-0000-0000-000000000000', '2067838f-75c9-4e14-a5c9-63cff495fdf1', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 01:23:21.421794+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2dbaae5-39c7-4eff-8e2c-cadb903a15fc', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 01:23:21.429464+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f5519819-ab62-4329-8d9b-67477a2b6b36', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 02:29:29.887834+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb50f197-38d2-4192-973f-33754517988f', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 02:29:29.890488+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a5290d04-a3a9-40c8-8c33-99e55ccf4aa1', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 03:27:38.822309+00', ''),
	('00000000-0000-0000-0000-000000000000', '18aab45f-aa9d-44b1-b0f3-3ffb1c2db9fa', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 03:27:38.823019+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e489b4d4-853f-4fc3-b11b-cc2e998d7b4c', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 04:25:38.840249+00', ''),
	('00000000-0000-0000-0000-000000000000', '4dd3d5aa-7396-4312-8e06-e45070d51622', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 04:25:38.840903+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd753adbe-8ba7-4aac-8a21-5b9f582da8e0', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 05:23:38.819532+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd0b8b735-208d-422a-a925-3e794e10b7a7', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-09-30 05:23:38.820973+00', ''),
	('00000000-0000-0000-0000-000000000000', '09ed42e9-a3ee-423e-ba91-be20b737afba', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-10-02 00:46:02.789572+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de686445-38bc-4526-85d0-e1bcbd748be0', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-10-02 00:46:02.920522+00', ''),
	('00000000-0000-0000-0000-000000000000', '7880f677-d445-432a-aa6d-9eed265aa12a', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-10-02 01:47:40.487094+00', ''),
	('00000000-0000-0000-0000-000000000000', '08153705-f194-4141-821f-9638ad9f72d9', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-10-02 01:47:40.4934+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f5552959-c3bf-43e3-a26b-8ab34852a08b', '{"action":"token_refreshed","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-10-02 02:53:09.560071+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a33932d-b97d-4fee-ae85-f63609ab58d9', '{"action":"token_revoked","actor_id":"9f0642ef-b1e6-431b-be25-3dc6dffbc75f","actor_username":"josh@harvestais.com","actor_via_sso":false,"log_type":"token"}', '2025-10-02 02:53:09.576268+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', 'authenticated', 'authenticated', 'josh@harvestais.com', '$2a$10$oWiD0m/fPnGJjL7Teb4ugeUWA0VtFoUHyFIFisCL3xrsMo7pjd3Eq', '2025-09-27 08:08:00.475317+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-29 05:27:54.716579+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "9f0642ef-b1e6-431b-be25-3dc6dffbc75f", "email": "josh@harvestais.com", "email_verified": true, "phone_verified": false}', NULL, '2025-09-27 08:08:00.363059+00', '2025-10-02 02:53:09.602522+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('9f0642ef-b1e6-431b-be25-3dc6dffbc75f', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', '{"sub": "9f0642ef-b1e6-431b-be25-3dc6dffbc75f", "email": "josh@harvestais.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-27 08:08:00.443009+00', '2025-09-27 08:08:00.443072+00', '2025-09-27 08:08:00.443072+00', '10b65c29-193d-4dd4-b52b-483be68857ec');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('795f610e-ee73-4226-8127-e134ed16f827', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', '2025-09-29 05:27:54.717124+00', '2025-10-02 02:53:09.607085+00', NULL, 'aal1', NULL, '2025-10-02 02:53:09.607027', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '172.18.0.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('795f610e-ee73-4226-8127-e134ed16f827', '2025-09-29 05:27:54.720783+00', '2025-09-29 05:27:54.720783+00', 'password', '7de86e57-b08b-42a3-834e-64fe101d259e');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 13, 'l66g4zc6xkpu', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-29 05:27:54.719081+00', '2025-09-29 07:04:45.608133+00', NULL, '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 14, 'xksi7qmie7xy', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-29 07:04:45.608609+00', '2025-09-29 11:58:53.725578+00', 'l66g4zc6xkpu', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 15, 'winaa3asdd7o', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-29 11:58:53.726017+00', '2025-09-29 12:58:05.859337+00', 'xksi7qmie7xy', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 16, '6ftjxzmvbur2', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-29 12:58:05.860914+00', '2025-09-30 01:23:21.430684+00', 'winaa3asdd7o', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 17, '3etzuwq7zzlj', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-30 01:23:21.491461+00', '2025-09-30 02:29:29.891303+00', '6ftjxzmvbur2', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 18, 'muuksy7dv7mb', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-30 02:29:29.89306+00', '2025-09-30 03:27:38.823689+00', '3etzuwq7zzlj', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 19, 'zxsgcltamoev', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-30 03:27:38.823982+00', '2025-09-30 04:25:38.841574+00', 'muuksy7dv7mb', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 20, 'pmzmihpat56x', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-30 04:25:38.842309+00', '2025-09-30 05:23:38.821758+00', 'zxsgcltamoev', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 21, 'mkme7xwf7fig', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-09-30 05:23:38.822437+00', '2025-10-02 00:46:02.924101+00', 'pmzmihpat56x', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 22, 'wavsgjtc7edg', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-10-02 00:46:02.959457+00', '2025-10-02 01:47:40.494547+00', 'mkme7xwf7fig', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 23, '3dn75uv4wxft', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', true, '2025-10-02 01:47:40.497591+00', '2025-10-02 02:53:09.577301+00', 'wavsgjtc7edg', '795f610e-ee73-4226-8127-e134ed16f827'),
	('00000000-0000-0000-0000-000000000000', 24, '5676lf3y73ja', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', false, '2025-10-02 02:53:09.592883+00', '2025-10-02 02:53:09.592883+00', '3dn75uv4wxft', '795f610e-ee73-4226-8127-e134ed16f827');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: curriculum; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."curriculum" ("id", "authority", "learning_area", "year_band", "version", "year_level_description", "created_at", "updated_at") VALUES
	('a522ca9e-dac5-41ed-96ca-2c96c605c879', 'SCSA', 'HASS', 'Year 8', 'v1', 'In Year 8, Humanities and Social Sciences consists of Civics and Citizenship, Economics and Business, Geography and History.

Students develop increasing independence in critical thinking and skill application, which includes questioning, researching, analysing, evaluating, communicating and reflecting. They apply these skills to investigate events, developments, issues and phenomena, both historical and contemporary.

Students continue to build on their understanding of the concepts of the Westminster system, democracy and participation. They investigate the types of law in Australia and how they are made. They consider the responsibilities and freedoms of citizens, and how Australians can actively participate in their democracy. Students explore the different perspectives of Australian identity.

The concept of markets is introduced to further develop students understanding of the concepts of interdependence, making choices and allocation. They consider how markets work and the rights, responsibilities and opportunities that arise for businesses, consumers and governments. Work and work futures are explored as students consider the influences on the way people work now and consider how people will work in the future. Students focus on national and regional issues, with opportunities for the concepts to also be considered in relation to local community, or global, issues where appropriate.

The concepts of place, space, environment, interconnection, sustainability and change continue to be developed as a way of thinking and provide students with the opportunity to inquire into the significance of landscapes to people and the spatial change in the distribution of populations. They apply this understanding to a wide range of places and environments at the full range of scales, from local to global, and in a range of locations.

Students develop their historical understanding through key concepts, including evidence, continuity and change, cause and effect, perspectives, empathy, significance and contestability. These concepts are investigated within the historical context of the end of the ancient period to the beginning of the modern period, c. 650 AD (CE) – 1750. They consider how societies changed, what key beliefs and values emerged, and the causes and effects of contact between societies in this period.', '2025-09-19 14:08:04.92428+00', '2025-09-19 14:08:04.92428+00'),
	('7965eb01-8bc8-41fd-bf3b-64aaa5506544', 'SCSA', 'HASS', 'Year 7', 'v1', 'In Year 7, Humanities and Social Sciences consists of Civics and Citizenship, Economics and Business, Geography and History.

Students develop increasing independence in critical thinking and skill application, which includes questioning, researching, analysing, evaluating, communicating and reflecting. They apply these skills to investigate events, developments, issues, and phenomena, both historical and contemporary.

Students continue to build on their understanding of the concepts of the Westminster system and democracy by examining the key features of Australia''s democracy, and how it is shaped through the Australian Constitution and constitutional change. The concepts of justice, rights and responsibilities are further developed through a focus on Australia''s legal system.

An understanding of the concepts making choices and allocation is further developed through a focus on the interdependence of consumers and producers in the market, the characteristics of successful businesses, including how specialisation and entrepreneurial behaviour contributes to business success. Work and work futures are introduced, as students consider why people work. Students focus on national issues, with opportunities for the concepts to also be considered in relation to local community or global issues where appropriate.

The concepts of place, space, environment, interconnection, sustainability and change continue to be developed as a way of thinking and provide students with the opportunity to inquire into the nature of water as a natural resource. The concept of place is expanded through students'' investigation of the liveability of their own place. They apply this understanding to a wide range of places and environments at the full range of scales, from local to global, and in a range of locations.

Students develop their historical understanding through key concepts, including evidence, continuity and change, cause and effect, perspectives, empathy, significance and contestability. These concepts are investigated within the historical context of how we know about the ancient past, and why and where the earliest societies developed.', '2025-09-29 12:08:24.570437+00', '2025-09-29 12:08:24.570437+00'),
	('4e2cb79f-5aea-46a7-b349-ebfbd647755e', 'SCSA', 'HASS', 'Year 9', 'v1', 'In Year 9, Humanities and Social Sciences consists of Civics and Citizenship, Economics and Business, Geography and History.

Students develop increasing independence in critical thinking and skill application, which includes questioning, researching, analysing, evaluating, communicating and reflecting. They apply these skills to investigate events, developments, issues and phenomena, both historical and contemporary.

Students continue to build on their understanding of the concepts of the Westminster system, democracy, democratic values, justice and participation. They examine the role of key players in the political system, the way citizens'' decisions are shaped during an election campaign and how a government is formed. Students investigate how Australia''s court system works in support of a democratic and just society.

Students are introduced to the concepts of specialisation and trade while continuing to further their understanding of the key concepts of scarcity, making choices, interdependence, and allocation and markets. They examine the connections between consumers, businesses and government, both within Australia and with other countries, through the flow of goods, services and resources in a global economy. The roles and responsibilities of the participants in the changing Australian and global workplace are explored.

The concepts of place, space, environment, interconnection, sustainability and change continue to be developed as a way of thinking, which provides students with an opportunity to inquire into the production of food and fibre, the role of the biotic environment and to explore how people, through their choices and actions, are connected to places in a variety of ways. Students apply this understanding to a wide range of places and environments at the full range of scales, from local to global, and in a range of locations.

Students develop their historical understanding through key concepts, including evidence, continuity and change, cause and effect, perspectives, empathy, significance and contestability. These concepts are investigated within the historical context of the making of the modern world from 1750 to 1918. They consider how new ideas and technological developments contributed to change in this period, and the significance of World War I.', '2025-09-29 12:14:27.389012+00', '2025-09-29 12:14:27.389012+00'),
	('bec95769-e908-408e-8c61-85ca2bc5764b', 'SCSA', 'HASS', 'Year 10', 'v1', 'In Year 10 Humanities and Social Sciences consists of Civics and Citizenship, Economics and Business, Geography and History.

Students develop increasing independence in critical thinking and skill application, which includes questioning, researching, analysing, evaluating, communicating and reflecting. They apply these skills to investigate events, developments, issues and phenomena, both historical and contemporary.

Students continue to build on their understanding of the concepts of democracy, democratic values, justice, and rights and responsibilities by exploring Australia''s roles and responsibilities at a global level and its international legal obligations. They inquire in to the values and practices that enable a resilient democracy to be sustained.

Students are introduced to the concept of economic performance and living standards while continuing to further their understanding of the concepts of making choices, interdependence, specialisation, and allocation and markets through examining contemporary issues, events and/or case studies delving into the reasons for variations in the performance of economies. They explore the nature of externalities and investigate the role of governments in managing economic performance to improve living standards. They inquire into the ways businesses can manage their workforces to improve productivity.

The concepts of place, space, environment, interconnection, sustainability and change continue to be developed as a way of thinking, through an applied focus on the management of environmental resources and the geography of human wellbeing at the full range of scales, from local to global and in a range of locations.

Students develop their historical understanding through key concepts, including evidence, continuity and change, cause and effect, perspectives, empathy, significance and contestability. These concepts are investigated within the historical context of the modern world and Australia from 1918 to the present, with an emphasis on Australia in its global context.', '2025-09-29 12:15:05.404776+00', '2025-09-29 12:15:05.404776+00');


--
-- Data for Name: achievement_standard; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."achievement_standard" ("id", "curriculum_id", "description", "created_at", "updated_at") VALUES
	('7e6a5223-264d-4c72-9625-39c0e3bc323a', 'a522ca9e-dac5-41ed-96ca-2c96c605c879', 'At Standard, students construct a range of questions and use a variety of methods to select, collect and organise information and/or data from appropriate sources. They develop criteria to determine the usefulness of primary and/or secondary sources for a purpose. When interpreting sources, students identify their origin and purpose, and distinguish between fact and opinion. They interpret information and/or data to identify points of view/perspectives, relationships and/or trends, and to sequence events and developments. Students apply subject-specific skills to translate information and/or data from one format to another, in both familiar and unfamiliar situations. They draw simple evidence-based conclusions in a range of contexts. Students represent information and/or data in appropriate formats to suit audience and purpose. They develop texts using appropriate subject-specific terminology and concepts. Students use evidence to support findings and acknowledge sources of information.

Students explain the types of laws and how laws are made within the Westminster system and describe the rights and responsibilities of participants in the process. They apply aspects of democracy to case studies and explain the freedoms that underpin Australia’s democratic values.

Students explain how markets allocate resources in Australia and describe the interdependence of consumers, businesses and the government as a result of their involvement in the market. They identify how consumers and businesses influence and respond to each other in the market.

Students describe the geographical processes that produce landforms, and explain how places are perceived and valued differently. They consider the environmental and human characteristics of places to compare strategies for responding to a geographical challenge that takes into account environmental, economic and social factors. Students describe the interconnections within environments, and between people and places, to explain the movement of people at a local, national and global scale.

Students explain the feudal system in medieval Europe and the causes and effects of the Black Death, and describe patterns of change and continuity over time. They explain the significance of individuals and groups and how they were influenced by the beliefs and values of medieval society.', '2025-09-19 14:18:23.869803+00', '2025-09-19 14:18:23.869803+00');


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."classes" ("id", "class_name", "year_level", "subject", "term", "start_date", "end_date", "teacher_id", "school_id", "created_at", "updated_at", "curriculum_id") VALUES
	('726032d2-fc31-48e7-869e-ba9767effba9', 'HASS 8A', 'Year 8', 'Civics & Citizenship', 'Term 3', '2025-07-08', '2025-09-26', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', '4244acc9-e302-4b62-98c2-7feb9cac8d24', '2025-09-27 08:21:29.668578+00', '2025-10-02 01:51:22.189041+00', 'a522ca9e-dac5-41ed-96ca-2c96c605c879');


--
-- Data for Name: strand; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."strand" ("id", "name", "created_at", "updated_at", "curriculum_id") VALUES
	('27498894-2818-4d7c-a905-ff90e1665ce4', 'HASS Skills', '2025-09-19 14:08:04.92428+00', '2025-09-29 13:49:46.644485+00', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'Economics and Business', '2025-09-19 14:08:04.92428+00', '2025-09-29 13:49:50.074787+00', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('a358c07b-ac59-4d7b-bd08-705bd446494a', 'Civics and Citizenship', '2025-09-19 14:08:04.92428+00', '2025-09-29 13:49:52.288645+00', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('d7c32f37-f2c9-418a-b452-246af25beaa5', 'Geography', '2025-09-19 14:08:04.92428+00', '2025-09-29 13:49:54.217697+00', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'History', '2025-09-19 14:08:04.92428+00', '2025-09-29 13:49:56.260991+00', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('f6548a67-5f18-4d7e-ab13-1d034008e92f', 'HASS Skills', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('f9cf87f6-6f7c-4ff4-8638-a78d52e4ea23', 'Economics and Business', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('c59f675d-be08-404f-87d7-b07cffe40f0b', 'Civics and Citizenship', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('40ae0be5-2f8e-4183-831d-0f19414ca632', 'Geography', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'History', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('d6970e43-3c74-4f36-a400-797a128ee7a1', 'HASS Skills', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('ec9c9b23-3e01-44b1-afac-f8d78f914364', 'Economics and Business', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'Civics and Citizenship', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'Geography', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('66386e31-dca7-42e8-9e45-a69d207eb5b3', 'History', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'HASS Skills', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'Economics and Business', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('4f5974c9-819b-4d48-80a4-bae7320877af', 'Civics and Citizenship', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('32a877e7-5843-4a0e-a734-dca3ece2553a', 'Geography', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('8b054e76-3904-4a88-b15f-eb23fe1ab845', 'History', '2025-09-29 13:51:33.523443+00', '2025-09-29 13:51:33.523443+00', 'bec95769-e908-408e-8c61-85ca2bc5764b');


--
-- Data for Name: content_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."content_item" ("id", "strand_id", "code", "description", "created_at", "updated_at", "display_code", "curriculum_id") VALUES
	('f1a2d2d0-eafd-4267-9c07-82d40258e028', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS66', 'Use a variety of methods to collect relevant information and/or data from a range of appropriate sources, such as print, digital, audio, visual and fieldwork', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS66', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('2ac9a174-4bb9-4f3f-82ab-0fbbbd541f27', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS67', 'Select the best method for recording selected information and/or data (e.g. graphic organisers, mind maps, fieldwork notes, photos)', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS67', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('a5050516-9290-4440-8af5-2e31b7429075', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS68', 'Identify differences in terms of origin and purpose between primary and secondary sources', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS68', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('94a49254-7ae0-4c74-b083-449f2795f8e6', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS69', 'Use appropriate ethical protocols to plan and conduct an inquiry', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS69', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('7c8240be-fb50-4725-be67-ef81563041a7', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS70', 'Use criteria to select relevant information and/or data such as accuracy, reliability, currency and usefulness', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS70', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('e1a6ad16-9d53-45c7-b43c-75d0f7ffee25', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS71', 'Interpret information and/or data to identify key relationships and/or trends displayed in various formats', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS71', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('9fbd7726-57a1-4439-a089-c2d9b488a7c2', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS72', 'Identify points of view, perspectives, attitudes and/or values in information and/or data', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS72', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('0d5f90f1-9b63-4976-8375-3e5de23bc6b1', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS73', 'Translate information and/or data from one format to another', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS73', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('d2662358-7614-4908-b9e3-dc325ea9f103', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS74', 'Apply subject-specific skills and concepts in familiar and new situations', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS74', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('d5c95f91-dfc9-42d0-bdbe-5dfc88e85685', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS75', 'Draw evidence-based conclusions by evaluating information and/or data to generate alternatives, make comparisons, evaluate costs and benefits, and infer relationships', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS75', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('04bf8e8d-7918-4b86-8da7-b48f4740e0cf', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS76', 'Represent information and/or data using appropriate formats to suit audience and purpose', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS76', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('3ac2c771-36bf-497e-b39c-766eff3faec4', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS77', 'Develop texts, particularly descriptions and explanations, using subject-specific terminology and concepts supported by evidence', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS77', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('6a0db213-fc89-417e-9ef5-970fd3c01cda', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS78', 'Reflect on learning to review understandings and/or determine actions in response to events, challenges, developments or issues', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS78', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('83cc7fc2-c9d9-4e69-9473-030fc8e51690', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS92', 'Select a range of appropriate formats based on their effectiveness to suit audience and purpose, using relevant digital technologies as appropriate', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS92', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('ac1cb87c-fad5-43cd-86fd-265b51ff2dcd', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS93', 'Develop texts, particularly explanations and discussions, using evidence from a range of sources to support conclusions and/or arguments', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS93', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('2c3fba5a-5432-4516-9a43-8bc3dbac7be8', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS94', 'Deconstruct and reconstruct the collected information and/or data into a form that identifies the relationship between the information and the hypothesis, using subject-specific conventions, terminology and concepts', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS94', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('44e7dd58-1132-44c0-b717-b7684917b107', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS95', 'Compare evidence to substantiate judgements (e.g. use information/data from different places or times; use tables, graphs, models, theories)', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS95', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('682d4e4b-a362-4b5a-9062-1c52fddb6df5', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS96', 'Generate a range of viable options in response to an issue or event to recommend and justify a course of action, and predict the potential consequences of the proposed action', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS96', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('ad7f096a-c392-4831-8064-3117ed23e5da', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS97', 'Reflect on why all findings are tentative (e.g. the changing nature of knowledge, changes in circumstances, changes in values)', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS97', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('0db6c4aa-e364-4a38-b558-87f8983770e2', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS85', 'Use criteria to analyse the reliability, bias, usefulness and currency of primary and/or secondary sources', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS85', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('7379c598-faa6-428b-96a4-9a17982fb605', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS86', 'Analyse information and/or data in different formats (e.g. to explain cause and effect relationships, comparisons, categories, change over time)', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS86', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('b682754e-6a9d-489d-9cac-9d75d34a0fc8', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS87', 'Account for different interpretations and points of view/perspectives in information and/or data', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS87', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('f89f41fc-4c59-42ff-9c4d-4a3572a2d090', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS88', 'Analyse the ''big picture'' (e.g. put information/data into contexts, reconstruct by identifying new relationships, identify missing viewpoints or gaps)', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS88', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('3b0ef412-52bf-418f-ac43-c6ed8b168cc2', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS89', 'Apply subject-specific skills and concepts in familiar, new and hypothetical situations', '2025-09-29 13:39:12.723343+00', '2025-09-30 02:07:27.968444+00', 'WAHASS89', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('f76e2bb3-e0ef-43be-ab56-94d49d5c1f7b', '7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'ACHEK050', 'Indicators of economic performance (e.g. economic growth rates, unemployment trends, inflation rates, human development index, quality of life index, sustainability indexes) and how Australia''s economy is performing', '2025-09-29 13:28:50.648082+00', '2025-09-30 02:07:27.968444+00', 'ACHEK050', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('b6e7a2a8-277d-44cb-91c9-35841ec02b46', '7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'ACHEK051', 'The links between economic performance and living standards, the variations that exist within and between economies and the possible causes (e.g. foreign investment, employment rates and levels of debt)', '2025-09-29 13:28:50.648082+00', '2025-09-30 02:07:27.968444+00', 'ACHEK051', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('2447fe37-95a6-414e-b076-3825b4c5ab4a', '7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'ACHEK051', 'The distribution of income and wealth in the economy and the ways in which governments can redistribute income (e.g. through taxation, social welfare payments)', '2025-09-29 13:28:50.648082+00', '2025-09-30 02:07:27.968444+00', 'ACHEK051', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('121d2cc8-2646-4341-bc24-e0b74c21d01c', '7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'ACHEK052', 'The ways that governments manage the economy to improve economic performance and living standards (e.g. productivity policy, training and workforce development policy, migration), and to minimise the effects of externalities (e.g. regulation)', '2025-09-29 13:28:50.648082+00', '2025-09-30 02:07:27.968444+00', 'ACHEK052', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('4afa2c3e-1f16-4fde-94bd-65343d807b9e', '7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'ACHEK053', 'Factors that influence major consumer financial decisions (e.g. price, availability and cost of finance, marketing of products, age and gender of consumers, convenience, ethical and environmental considerations) and the short-term and long-term consequences of these decisions', '2025-09-29 13:28:50.648082+00', '2025-09-30 02:07:27.968444+00', 'ACHEK053', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('e663e9b4-3d9d-4564-94db-7096d79f914b', '7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'ACHEK054', 'The ways businesses organise themselves to improve productivity (e.g. provision of training, investment in applications of technology, use of just-in-time inventory systems)', '2025-09-29 13:28:50.648082+00', '2025-09-30 02:07:27.968444+00', 'ACHEK054', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('2fa00433-2d47-4403-a8af-eb63e5671b81', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS76', 'Represent information and/or data using appropriate formats to suit audience and purpose (e.g. tables, graphs, timelines, maps, models)', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS76', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('2e367406-5adb-4188-9d58-52325ec38a2f', 'a358c07b-ac59-4d7b-bd08-705bd446494a', 'ACHCK048', 'The purpose and value of the Australian Constitution', '2025-09-29 13:05:04.46193+00', '2025-09-29 13:05:04.46193+00', 'ACHCK048', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('f7e7c2f1-7271-47bf-abea-ff0e60466093', 'a358c07b-ac59-4d7b-bd08-705bd446494a', 'ACHCK048', 'The concept of the separation of powers between the legislature, executive and judiciary and how it seeks to prevent the excessive concentration of power', '2025-09-29 13:05:04.46193+00', '2025-09-29 13:05:04.46193+00', 'ACHCK048', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('ef029491-ac91-443f-a76f-6fcb6d679863', 'a358c07b-ac59-4d7b-bd08-705bd446494a', 'ACHCK048', 'The division of powers between state/territory and federal levels of government in Australia', '2025-09-29 13:05:04.46193+00', '2025-09-29 13:05:04.46193+00', 'ACHCK048', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('8b84ab74-773e-4d92-badb-da0635edf360', 'a358c07b-ac59-4d7b-bd08-705bd446494a', 'ACHCK048', 'The different roles of the House of Representatives and the Senate in Australia''s bicameral parliament', '2025-09-29 13:05:04.46193+00', '2025-09-29 13:05:04.46193+00', 'ACHCK048', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('8367f840-8364-4745-b87f-fa9fbba2bcd1', 'a358c07b-ac59-4d7b-bd08-705bd446494a', 'ACHCK049', 'The process for constitutional change through a referendum and examples of attempts to change the Australian Constitution by referendum, such as the successful vote on the Constitution Alteration (Aboriginals) 1967 or the unsuccessful vote on the Constitution Alteration (Establishment of Republic) 1999', '2025-09-29 13:05:04.46193+00', '2025-09-29 13:05:04.46193+00', 'ACHCK049', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('1e5af8a9-9289-4837-a009-f976252b41cd', 'a358c07b-ac59-4d7b-bd08-705bd446494a', 'ACHCK050', 'How Australia''s legal system aims to provide justice, including through the rule of law, presumption of innocence, burden of proof, right to a fair trial, and right to legal representation', '2025-09-29 13:05:04.46193+00', '2025-09-29 13:05:04.46193+00', 'ACHCK050', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('4e979dc5-015c-4346-bb3b-04eb5e0ea971', 'a358c07b-ac59-4d7b-bd08-705bd446494a', 'ACHCK050', 'How citizens participate in providing justice through their roles as witnesses and jurors', '2025-09-29 13:05:04.46193+00', '2025-09-29 13:05:04.46193+00', 'ACHCK050', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('952475bf-a561-47e2-894a-66860ffa89a4', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK017', 'How consumers rely on businesses to meet their needs and wants', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK017', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('9e17a969-8de7-42cf-8b4b-f10f79f244a4', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK017', 'How businesses respond to the demands of consumers (e.g. responding to preference for healthy options, environmentally friendly products and packaging, organic food)', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK017', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('73bdc047-5cc1-4320-bc8e-60f6f328dc89', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK017', 'Why businesses might set a certain price for a product and how they might adjust the price according to demand', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK017', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('952fa305-90b4-4bec-93d7-25044548a1a5', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK019', 'Characteristics of entrepreneurs, including the behaviours and skills they bring to their businesses (e.g. establishing a shared vision; and demonstrating initiative, innovation and enterprise)', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK019', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('508cbbfc-a0ce-4d67-8bff-56e253a56392', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK020', 'Why individuals work (e.g. earning an income, contributing to an individual''s self-esteem, material and non-material living standards, happiness)', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK020', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('cbeb0e4d-a23a-42ba-ba88-8a811fb91821', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK020', 'Different types of work (e.g. full-time, part-time, casual, at home, paid, unpaid, volunteer)', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK020', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('72421e34-d576-47e8-8c95-593c72b59dfb', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK020', 'How people derive an income and alternative sources of income (e.g. owning a business, being a shareholder, owning a rental service)', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK020', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('3b34c878-7805-4189-8735-20de7e74d131', '3e4ee67e-700d-4dfe-a3e5-71baa986ce67', 'ACHEK020', 'The ways people who have retired from employment earn an income (e.g. age pension, superannuation, private savings)', '2025-09-29 13:07:43.615266+00', '2025-09-29 13:07:43.615266+00', 'ACHEK020', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('b4b1bad5-b277-4792-909c-e155c3bd56f8', 'd7c32f37-f2c9-418a-b452-246af25beaa5', 'ACHGK037', 'The classification of environmental resources (renewable and non-renewable)', '2025-09-29 13:10:38.187898+00', '2025-09-29 13:10:38.187898+00', 'ACHGK037', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('b950c3b3-330e-4c34-9dab-65fc884835e9', 'd7c32f37-f2c9-418a-b452-246af25beaa5', 'ACHGK039', 'The quantity and variability of Australia''s water resources compared with those in other continents', '2025-09-29 13:10:38.187898+00', '2025-09-29 13:10:38.187898+00', 'ACHGK039', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('d4ff899b-9bac-4492-85c4-e878aa22153d', 'd7c32f37-f2c9-418a-b452-246af25beaa5', 'ACHGK040', 'Water scarcity and what causes it, why it is a problem and ways of overcoming water scarcity (e.g. recycling, stormwater harvesting and reuse, desalination, inter-regional transfer of water, reducing water consumption) including studies drawn from Australia, and one from West Asia or North Africa', '2025-09-29 13:10:38.187898+00', '2025-09-29 13:10:38.187898+00', 'ACHGK040', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('12fc72e6-5c0b-4577-87ed-27e23a1ebf62', 'd7c32f37-f2c9-418a-b452-246af25beaa5', 'ACHGK043', 'The factors that influence the decisions people make about where to live and their perceptions of the liveability of places', '2025-09-29 13:10:38.187898+00', '2025-09-29 13:10:38.187898+00', 'ACHGK043', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('87de7b9c-d236-41c6-a1bb-d1859a67498e', 'd7c32f37-f2c9-418a-b452-246af25beaa5', 'ACHGK044', 'The influence of accessibility to services and facilities on the liveability of places', '2025-09-29 13:10:38.187898+00', '2025-09-29 13:10:38.187898+00', 'ACHGK044', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('0ffccd54-1075-4361-aabe-487444586dec', 'd7c32f37-f2c9-418a-b452-246af25beaa5', 'ACHGK045', 'The influence of environmental quality on the liveability of places', '2025-09-29 13:10:38.187898+00', '2025-09-29 13:10:38.187898+00', 'ACHGK045', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('bb998604-e994-4a74-8de0-1d1f1fe6fbb1', 'd7c32f37-f2c9-418a-b452-246af25beaa5', 'ACHGK047', 'The strategies used to enhance the liveability of places, especially for young people, including examples from Australia and Europe', '2025-09-29 13:10:38.187898+00', '2025-09-29 13:10:38.187898+00', 'ACHGK047', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('183a31eb-46d7-4976-8c80-01cbadeb2b04', 'f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'ACDSEH001', 'How historians and archaeologists investigate history, including excavation and archival research', '2025-09-29 13:11:10.149963+00', '2025-09-29 13:11:10.149963+00', 'ACDSEH001', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('1405e0c3-2194-4344-92fa-0e0a0bd6140e', 'f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'ACDSEH029', 'The range of sources that can be used in an historical investigation, including archaeological and written sources', '2025-09-29 13:11:10.149963+00', '2025-09-29 13:11:10.149963+00', 'ACDSEH029', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('6db931a5-24f0-4e15-a2dd-f12b101a3cef', 'f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'ACDSEH148', 'The importance of conserving the remains of the ancient past, including the heritage of Aboriginal and Torres Strait Islander Peoples', '2025-09-29 13:11:10.149963+00', '2025-09-29 13:11:10.149963+00', 'ACDSEH148', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('67564c51-1d29-46fd-8fed-2cc73f9853a0', 'f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'ACDSEH002', 'The physical features and how they influenced the civilisation that developed there', '2025-09-29 13:11:10.149963+00', '2025-09-29 13:11:10.149963+00', 'ACDSEH002, ACDSEH003, ACDSEH004, ACDSEH005, ACDSEH006', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('545bed99-3273-41c1-b591-8b800725a7f4', 'f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'ACDSEH032', 'Roles of key groups in the ancient society, and the influence of law and religion', '2025-09-29 13:11:10.149963+00', '2025-09-29 13:11:10.149963+00', 'ACDSEH032, ACDSEH035, ACDSEH038, ACDSEH041, ACDSEH042', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('a8b2731e-7e6c-4db7-b41f-cb043f073aa3', 'f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'ACDSEH033', 'The significant beliefs, values and practices of the ancient society, with a particular emphasis on one of the following areas: everyday life, warfare, or death and funerary customs', '2025-09-29 13:11:10.149963+00', '2025-09-29 13:11:10.149963+00', 'ACDSEH033, ACDSEH036, ACDSEH039, ACDSEH042, ACDSEH045', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('ec6ec884-f754-44fe-9096-8d46b223dffc', 'f9ddb5f1-1b48-45ba-8509-a548ad5166a5', 'ACDSEH129', 'The role of a significant individual in the ancient society''s history', '2025-09-29 13:11:10.149963+00', '2025-09-29 13:11:10.149963+00', 'ACDSEH129, ACDSEH130, ACDSEH131, ACDSEH132, ACDSEH133', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('85190839-3aba-4e21-92d1-fa2618010367', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS64', 'Identify current understandings to consider possible gaps and/or misconceptions, new knowledge needed and challenges to personal perspectives', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS64', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('eb3749ed-c876-48a7-9ec9-56cc702c2a70', '27498894-2818-4d7c-a905-ff90e1665ce4', 'WAHASS65', 'Construct a range of questions, propositions and/or hypotheses', '2025-09-29 13:26:05.561013+00', '2025-09-29 13:26:05.561013+00', 'WAHASS65', '7965eb01-8bc8-41fd-bf3b-64aaa5506544'),
	('9050ae26-24af-4e3e-a95b-6179e55ce945', 'c59f675d-be08-404f-87d7-b07cffe40f0b', 'ACHCK061', 'The freedoms that enable active participation in Australia''s democracy within the bounds of law, including freedom of speech, association, assembly, religion and movement.', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHCK061', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('ca2c368a-ab35-4516-ae05-05ee547f1df7', 'c59f675d-be08-404f-87d7-b07cffe40f0b', 'ACHCK062', 'How citizens can participate in Australia''s democracy, including use of the electoral system, contact with their elected representatives, use of lobby groups and direct action.', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHCK062', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('4bfa3965-d4c2-460d-98b2-2a74f82379f0', 'c59f675d-be08-404f-87d7-b07cffe40f0b', 'ACHCK063', 'How laws are made in Australia through parliaments (statutory law).', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHCK063', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('bfef56ab-279b-4e50-9464-3571907120c1', 'c59f675d-be08-404f-87d7-b07cffe40f0b', 'ACHCK063', 'How laws are made in Australia through the courts (common law).', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHCK063', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('fd145a26-aa2a-4032-b6f2-dff4c7cbc3df', 'c59f675d-be08-404f-87d7-b07cffe40f0b', 'ACHCK064', 'The types of law in Australia, including criminal law, civil law and the place of Aboriginal and Torres Strait Islander customary law.', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHCK064', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('4553fb0d-e6d4-4cff-88b1-3341443e9957', 'c59f675d-be08-404f-87d7-b07cffe40f0b', 'ACHCK066', 'Different perspectives about Australia''s national identity, including Aboriginal and Torres Strait Islander perspectives and what it means to be Australian.', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHCK066', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('f9047457-5117-40ee-ab32-c34b6e28ba4a', 'f9cf87f6-6f7c-4ff4-8638-a78d52e4ea23', 'ACHEK027', 'The way markets operate in Australia and how the interaction between buyers and sellers influences prices and how markets enable the allocation of resources (how businesses answer the questions of what to produce, how to produce and for whom to produce).', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHEK027', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('e5ffc40f-e11a-4440-9814-cf3b83df4edb', 'f9cf87f6-6f7c-4ff4-8638-a78d52e4ea23', 'ACHEK027', 'How the government is involved in the market, such as providing some types of goods and services that are not being provided for sufficiently by the market (e.g. healthcare).', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHEK027', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('aac743a0-e20e-4714-b7ad-be5776883dd4', 'f9cf87f6-6f7c-4ff4-8638-a78d52e4ea23', 'ACHEK029', 'The rights and responsibilities of consumers and businesses in Australia.', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHEK029', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('0756c7fd-30a7-4b2f-ad55-ba6e0a0d994d', 'f9cf87f6-6f7c-4ff4-8638-a78d52e4ea23', 'ACHEK030', 'Types of businesses (e.g. sole trader, partnership, corporation, cooperative, franchise) and the ways that businesses respond to opportunities in Australia.', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHEK030', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('42edc95c-f7d0-4e4b-9653-a85596ca24a5', 'f9cf87f6-6f7c-4ff4-8638-a78d52e4ea23', 'ACHEK031', 'Influences on the ways people work (e.g. technological change, outsourced labour in the global economy, rapid communication changes and factors that might affect work in the future).', '2025-09-30 02:12:25.41058+00', '2025-09-30 02:12:25.41058+00', 'ACHEK031', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('534f19fb-3991-4ba1-ae5d-036078f81128', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK053', 'How the effects caused by geomorphic hazards are influenced by social, cultural and economic factors (e.g. where people choose to live, poverty, infrastructure and resources to prepare/respond).', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK053', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('f5bafb50-b637-4e6f-bc10-a9d044f0b67e', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK053', 'How the application of principles of prevention, mitigation and preparedness minimises the harmful effects of geomorphic hazards.', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK053', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('41d7bffc-0eb3-4601-9392-1ecc25d1f521', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK054', 'The causes and consequences of urbanisation in Australia and one other country from the Asia region.', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK054', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('da960a8d-75da-49b5-bc0c-8aa09e4cfd3c', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK056', 'The reasons for, and effects of, internal migration in Australia.', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK056', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('a1ff13eb-b01b-4174-b6b0-5b0cb36c8554', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK058', 'The reasons for, and effects of, international migration in Australia.', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK058', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('a2eb7d18-1508-4f62-8992-3decf3cbce6b', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS77', 'Develop texts, particularly descriptions and explanations, using appropriate subject-specific terminology and concepts that use evidence to support findings, conclusions and/or arguments, from a range of sources', '2025-09-30 02:28:46.279011+00', '2025-09-30 02:28:46.279011+00', 'WAHASS77', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('95f1d544-c62c-4861-a809-5081045c1268', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS78', 'Reflect on learning to review original understandings and/or determine actions in response to events, challenges, developments, issues, problems and/or phenomena', '2025-09-30 02:28:46.279011+00', '2025-09-30 02:28:46.279011+00', 'WAHASS78', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('caf4e9cf-d426-46bf-ada5-a5aabf71112f', '75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'ACHCK075', 'The role of political parties, and independent representatives in Australia''s system of government, including the formation of governments', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHCK075', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('a9ead7cf-5a5d-478d-88c8-2f4e610c750f', '75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'ACHCK076', 'How citizens'' choices are shaped at election time (e.g. public debate, media, opinion polls, advertising, interest groups, political party campaigns)', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHCK076', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('c7a5897d-720d-4354-922d-d7e1668a0587', '75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'ACHCK076', 'How social media is used to influence people''s understanding of issues', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHCK076', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('ed99e74f-5eaf-46d8-8790-223973e0e7ad', '75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'ACHCK077', 'The key features of Australia''s court system and the role of a particular court (e.g. a supreme court, a magistrates'' court, the Family Court of Australia) and the types of cases different courts hear', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHCK077', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('53edaed8-782a-4b45-b318-204712a63cfb', '75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'ACHCK077', 'How courts apply and interpret the law, resolve disputes, and make law through judgments (e.g. the role of precedents)', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHCK077', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('bcde690a-d97d-4302-856b-e6209b381d4c', '75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'ACHCK078', 'The key principles of Australia''s justice system, including equality before the law, independent judiciary, and right of appeal', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHCK078', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('06509e82-d806-4b58-a04d-d20344073e85', '75f88b52-e6ec-491c-b462-a8f78eb8b6e5', 'ACHCK078', 'The factors that can undermine the application of the principles of justice (e.g. bribery, coercion of witnesses, trial by media, court delays)', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHCK078', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('5af701ed-c83b-459f-88a7-763bb54d36a4', 'ec9c9b23-3e01-44b1-afac-f8d78f914364', 'ACHEK038', 'The role of the key participants in the Australian economy, such as consumers, producers, workers and the government', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHEK038', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('8da0ed72-d3bb-40ba-9489-7f69d92ddee3', 'ec9c9b23-3e01-44b1-afac-f8d78f914364', 'ACHEK038', 'Australia''s interdependence with other economies, such as trade and tourism, trade links with partners in the Asia region, and the goods and services traded', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHEK038', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('734999bb-1c3b-4205-a623-bd6129b1b46f', 'ec9c9b23-3e01-44b1-afac-f8d78f914364', 'ACHEK039', 'Why and how participants in the global economy are dependent on each other, including the activities of transnational corporations in the supply chains and the impact of global events on the Australian economy', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHEK039', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('f040ff2b-7414-4e91-9aa0-3d0f5da1e35f', 'ec9c9b23-3e01-44b1-afac-f8d78f914364', 'ACHEK040', 'Why and how people manage financial risks and rewards in the current Australian and global financial landscape, such as the use of differing investment types', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHEK040', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('854f429d-8753-47b1-8616-6cba355952f0', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACOKH009', 'Key features of the medieval world (feudalism, trade routes, voyages of discovery, contact and conflict).', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACOKH009', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('e6830c06-ecbf-4f24-be25-e420f7cd9df4', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH008', 'The way of life in medieval Europe (e.g. social, cultural, economic and political features) and the roles and relationships of different groups in society.', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH008', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('6cf070c8-d63c-47b7-854c-8cebd4f84e56', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH050', 'Significant developments and/or cultural achievements, such as changing relations between Islam and the West (including the Crusades), architecture, medieval manuscripts and music.', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH050', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('3eb11ecc-c344-4fb5-b2c9-17d7b5c5bf34', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH051', 'Continuity and change in society in one of the following areas: crime and punishment; military and defence systems; towns, cities and commerce.', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH051', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('58ed5724-9ff6-41cf-99bd-7716df51a6eb', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH052', 'The role of significant individuals in the medieval period (e.g. Charlemagne).', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH052', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('8789232b-883f-4d36-838f-6213327f2ae9', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH015', 'Living conditions and religious beliefs in the 14th century, including life expectancy, medical knowledge and beliefs about the power of God.', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH015', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('2250af45-b670-4ba1-b3bf-ee09e83d3315', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH069', 'The role of expanding trade between Europe and Asia during the Black Death, including the origin and spread of the disease.', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH069', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('002118e1-9198-4f04-aba1-5b3439fb3dc9', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH070', 'The causes and symptoms of the Black Death and the responses of different groups in society to the spread of the disease, such as the flagellants and monasteries.', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH070', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('008f1ad2-3ad5-40df-8df3-437411bba98d', 'af7eaa8b-0372-46a0-8327-a2e4d24a56f6', 'ACDSEH071', 'The effects of the Black Death on Asian, European and African populations, and conflicting theories about the impact of the plague.', '2025-09-30 02:22:23.92052+00', '2025-09-30 02:22:23.92052+00', 'ACDSEH071', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('99651c8c-7760-4348-9de1-9b328a1844c9', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS64', 'Identify current understandings to consider possible gaps and/or misconceptions, new knowledge needed and challenges to personal perspectives', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS64', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('b54d37fa-8e29-4d87-b9fa-640dcc5b5fcc', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS65', 'Construct a range of questions, propositions and/or hypotheses', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS65', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('0539966b-d924-42c0-82d6-1a5cf814cd11', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS66', 'Use a variety of methods to collect relevant information and/or data from a range of appropriate sources, such as print, digital, audio, visual and fieldwork', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS66', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('86b521a8-87b4-4e54-b94f-42ea7d94c52d', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS67', 'Select the best method for recording selected information and/or data (e.g. graphic organisers, mind maps, fieldwork sketches, photographs)', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS67', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('a50ae4f3-6a23-486a-9335-7eb0639dae99', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS68', 'Identify differences in terms of origin and purpose between primary sources and secondary sources', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS68', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('2103a58e-1521-4d51-acf9-fe3b5c9ffb76', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS69', 'Use appropriate ethical protocols to plan and conduct an inquiry (e.g. permission to use photos, visit Aboriginal cultural land, acknowledge sources)', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS69', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('a24fb818-265e-4710-b84e-b5a6d2b4a5ad', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS70', 'Use criteria to select relevant information and/or data such as accuracy, reliability, currency and usefulness', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS70', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('81ebbb65-646b-4f84-8448-1868c64cd7ef', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS71', 'Interpret information and/or data to identify key relationships and/or trends in various formats', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS71', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('55fea5d7-c853-4b44-a311-ba235f87582b', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS72', 'Identify points of view/perspectives, attitudes and/or values in information and/or data', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS72', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('c57ef4a9-e020-485f-8273-51e3d50d833b', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS73', 'Translate information and/or data from one format to another (e.g. table to graph)', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS73', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('d15851cc-31ef-4ef5-9abe-64ff6cef1974', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS79', 'Identify current personal knowledge, gaps, misconceptions, currency of information, personal perspective and possible perspectives of others', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS79', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('30587f2b-4c40-4b50-bfc7-5682c2704d68', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS80', 'Construct, select and evaluate a range of questions and hypotheses involving cause and effect, patterns and trends, and different perspectives', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS80', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('a9f46926-b960-4fa0-8045-4b1160da3eff', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS81', 'Analyse and clarify the purpose of an inquiry using appropriate methodologies, ethical protocols and concepts to plan for, and inform, an investigation', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS81', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('97f2dd01-158b-4e4f-abf6-2f4bdad09edf', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS82', 'Use a range of methods to collect, select, record and organise relevant and reliable information and/or data from multiple sources with and without digital and spatial technologies', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS82', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('0bb64984-ef91-48e5-bb36-cc84e3c94511', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS83', 'Identify the origin, purpose and context of primary sources and/or secondary sources', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS83', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('8a32db23-3964-4cb7-a5a3-76a657687c2e', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS84', 'Use appropriate ethical protocols, including specific formats for acknowledging other people''s information and understand that these formats vary between organisations', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS84', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('c8db1f9b-fd15-4663-b9a5-bfdd38a5893f', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS90', 'Draw evidence-based conclusions by evaluating information/data, taking into account ambiguities and multiple perspectives, and propose action in response to contemporary events or issues', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS90', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('67e24b44-5206-4a5c-92b1-a3c0b4fa8ee5', '8cd3c5e7-4850-4c7f-83f8-e3a3ce2cd45d', 'WAHASS91', 'Critically evaluate information and/or data and ideas from a range of sources to make generalisations, propose explanations, and predict outcomes', '2025-09-29 13:38:59.941347+00', '2025-09-30 02:07:27.968444+00', 'WAHASS91', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('ab8d12fe-964a-4334-83e5-6facae1ce03c', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS74', 'Apply subject-specific skills and concepts in familiar and new situations', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS74', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('102bd0ac-6b3d-48d1-95be-95cb47d2d667', 'f6548a67-5f18-4d7e-ab13-1d034008e92f', 'WAHASS75', 'Draw evidence-based conclusions by evaluating information and/or data to generate alternatives, plan actions, compare costs/benefits, infer relationships', '2025-09-30 02:28:27.9321+00', '2025-09-30 02:28:27.9321+00', 'WAHASS75', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('5fd26d4c-c380-4562-b4d6-732765bcf50f', 'ec9c9b23-3e01-44b1-afac-f8d78f914364', 'ACHEK040', 'The ways consumers can protect themselves from risks, such as debt, scams and identity theft', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHEK040', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('93b187ca-7fe1-4295-8d81-8fa5dcfe21df', '7aabcdfe-7636-4a54-9ad1-8f9f5ae9fdbd', 'ACHEK054', 'Ways that businesses respond to improved economic conditions (e.g. increasing research and development funding, adjusting marketing strategies to expand market share)', '2025-09-29 13:28:50.648082+00', '2025-09-30 02:07:27.968444+00', 'ACHEK054', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('7f93845c-d702-429a-98f7-4e92d81c09ad', '4f5974c9-819b-4d48-80a4-bae7320877af', 'ACHCK090', 'The key features and values of Australia''s system of government (e.g. democratic elections, the separation of powers) compared with one other system of government in the Asia region, such as China, Japan, India or Indonesia', '2025-09-29 13:27:55.298636+00', '2025-09-30 02:07:27.968444+00', 'ACHCK090', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('5755f2f8-2ef3-48ff-9da9-b6110b63fbb4', '4f5974c9-819b-4d48-80a4-bae7320877af', 'ACHCK091', 'Australia''s roles and responsibilities at a global level (e.g. provision of foreign aid, peacekeeping, participation in international organisations, such as the United Nations)', '2025-09-29 13:27:55.298636+00', '2025-09-30 02:07:27.968444+00', 'ACHCK091', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('560e7008-a883-43d0-b916-8548219e339f', '4f5974c9-819b-4d48-80a4-bae7320877af', 'ACHCK092', 'The role of the High Court, including interpreting the Constitution', '2025-09-29 13:27:55.298636+00', '2025-09-30 02:07:27.968444+00', 'ACHCK092', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('e2e4d242-bac6-4efa-8331-c571ba32d700', '4f5974c9-819b-4d48-80a4-bae7320877af', 'ACHCK093', 'The international agreements Australia has ratified and examples of how they shape government policies and laws (e.g. World Heritage, elimination of racial discrimination, rights of the child, rights of Indigenous Peoples)', '2025-09-29 13:27:55.298636+00', '2025-09-30 02:07:27.968444+00', 'ACHCK093', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('965b3734-9ae3-49a4-a2f2-d6ba1d0af8a3', '4f5974c9-819b-4d48-80a4-bae7320877af', 'ACHCK094', 'The threats to Australia''s democracy and other democracies, such as the influence of vested interests, organised crime, corruption and lawlessness', '2025-09-29 13:27:55.298636+00', '2025-09-30 02:07:27.968444+00', 'ACHCK094', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('7e899a3d-c2ce-4cec-b389-8f38a3182838', '4f5974c9-819b-4d48-80a4-bae7320877af', 'ACHCK094', 'The safeguards that protect Australia''s democratic system and society, including shared values and the right to dissent within the bounds of the law', '2025-09-29 13:27:55.298636+00', '2025-09-30 02:07:27.968444+00', 'ACHCK094', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('d90c011d-f752-4491-8de4-def62cd2183d', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK070', 'The human-induced environmental changes that challenge sustainability (e.g. water and atmospheric pollution, degradation of land, inland and coastal aquatic environments)', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK070', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('a0708442-d897-4bad-bd78-430e80e33349', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK071', 'The environmental worldviews of people and their implications for environmental management', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK071', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('8b0208e4-c8d3-4527-84b8-b58b621a073c', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK073', 'The causes and likely consequences of environmental change being investigated', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK073', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('cd9c91f9-1d7d-4ba3-a4b3-bb0d3e5e962f', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK074', 'The strategies to manage the environmental change being investigated', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK074', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('b50131a9-874d-4beb-bbf4-51da45752649', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK075', 'The application of environmental, economic and social criteria in evaluating management responses to the change being investigated', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK075', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('155b56bb-1b7e-46ae-9731-65e6ed4090c0', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK076', 'The different ways of measuring and mapping human wellbeing and development, and how these can be applied to measure differences between places', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK076', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('43de4de3-37a5-422c-920e-ace3d1b89d00', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK077', 'The reasons for spatial variations between countries in selected indicators of human wellbeing', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK077', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('b336fd11-3f38-4ab3-b58f-3270caaab1f7', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK078', 'The issues affecting the development of places and their impact on human wellbeing, drawing on a study from a developing country or region in Africa, South America or the Pacific Islands', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK078', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('f001919c-85a6-443f-8a0d-c6004412943c', '32a877e7-5843-4a0e-a734-dca3ece2553a', 'ACHGK081', 'The role of international and national government and non-government organisations'' initiatives in improving human wellbeing in Australia and other countries', '2025-09-29 13:30:18.98756+00', '2025-09-30 02:07:27.968444+00', 'ACHGK081', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('7985da81-a940-4f4a-aa65-25b18c713098', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH105', 'The US civil rights movement and its influence on Australia', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH105', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('8924a8f8-a6e4-411c-8958-9672b4680c97', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACOKFH018', 'The inter-war years between World War I and World War II, including the Treaty of Versailles, the Roaring Twenties and the Great Depression', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACOKFH018', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('d9e41703-60f4-4832-972b-4238a0e4633b', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH024', 'The causes and course of World War II', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH024', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('1eed463a-a11b-4569-8d7a-bcb37f64dec3', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH108', 'The experiences of Australians during World War II, such as prisoners of war (POWs), the Battle of Britain, Kokoda and the fall of Singapore', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH108', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('d4d32ad2-5081-4705-8480-b72bd2ae5298', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH109', 'The impact of World War II, with a particular emphasis on the Australian home front, including the changing roles of women and use of wartime government controls (e.g. conscription, manpower controls, rationing, censorship)', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH109', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('8029be17-6307-4e08-ba80-30fe5fa13670', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH107', 'An examination of significant events of World War II, including the Holocaust and use of the atomic bomb', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH107', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('fd691006-2e86-4f59-9ff6-88145ac9d3e2', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH023', 'The origins and significance of the Universal Declaration of Human Rights, including Australia''s involvement in its development', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH023', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('8686631c-25aa-43a5-8a9d-559e689d1389', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH104', 'The background to the struggle of Aboriginal and Torres Strait Islander Peoples for rights and freedoms before 1965, including the 1938 Day of Mourning and the Stolen Generations', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH104', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('1e4f031e-4990-429a-98bc-78cc2152a5f7', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH106', 'The significance of one of the following for the civil rights of Aboriginal and Torres Strait Islander Peoples: 1962 right to vote federally; 1967 referendum; reconciliation; Mabo decision; Bringing Them Home Report (the Stolen Generations); the Apology', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH106', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('d834b934-4aaf-4b32-8d7f-2d992c7d3e4f', '8b054e76-3904-4a88-b15f-eb23fe1ab845', 'ACDSEH134', 'Methods used by civil rights activists to achieve change for Aboriginal and Torres Strait Islander Peoples, and the role of one individual or group in the struggle', '2025-09-29 13:31:24.030729+00', '2025-09-30 02:07:27.968444+00', 'ACDSEH134', 'bec95769-e908-408e-8c61-85ca2bc5764b'),
	('3a72cef2-3771-496f-8807-963b26b2e45b', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK048', 'The different types of landscapes in Australia and their distinctive landform features (e.g. coastal, riverine, arid, mountain, karst).', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK048', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('f0fc0a49-d1a4-440b-8830-aff832a7ac3a', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK049', 'The spiritual, cultural and aesthetic value of landscapes and landforms for people, including Aboriginal and Torres Strait Islander Peoples.', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK049', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('b81040a0-f103-4847-a0f6-f62071811779', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK050', 'The geographical processes that produce landforms, including a case study of one type of landform, such as mountains, volcanoes, riverine or coastal landforms.', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK050', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('e403b7f9-f7e0-4c91-9084-57fff45e327a', '40ae0be5-2f8e-4183-831d-0f19414ca632', 'ACHGK053', 'The causes, spatial distribution, impacts and responses to a geomorphic hazard (e.g. volcanic eruption, earthquake, tsunami, landslide, avalanche).', '2025-09-30 02:19:47.055769+00', '2025-09-30 02:19:47.055769+00', 'ACHGK053', 'a522ca9e-dac5-41ed-96ca-2c96c605c879'),
	('83f4ce4a-4289-4e79-a031-728ff5e9dcce', 'ec9c9b23-3e01-44b1-afac-f8d78f914364', 'ACHEK041', 'The nature of innovation and how businesses seek to create and maintain a competitive advantage in the market, including the global market', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHEK041', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('aa161e9f-ffa4-4dcc-96fd-8b784820a9ff', 'ec9c9b23-3e01-44b1-afac-f8d78f914364', 'ACHEK042', 'The way the work environment is changing in contemporary Australia and the implication for current and future work', '2025-10-02 00:54:40.266841+00', '2025-10-02 00:54:40.266841+00', 'ACHEK042', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('7a1e779a-d92a-49b0-be87-f5f45e795b34', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK060', 'The distribution and characteristics of biomes as regions with distinctive climates, soils, vegetation and productivity', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK060', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('f26c15e6-fbe0-444f-a226-7c6c1cab5abc', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK061', 'The ways that humans in the production of food and fibre have altered some biomes (e.g. through vegetation clearance, drainage, terracing, irrigation)', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK061', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('9251a4e8-6890-45c5-8c92-7b791d3aa6b7', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK062', 'The environmental, economic and technological factors that influence crop yields in Australia and across the world (e.g. climate, soils, landforms, water resources, irrigation, accessibility, labour supply, agricultural technologies)', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK062', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('2ec201b1-26cd-417f-bff6-1987c0de0b03', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK063', 'The challenges to food production, including land and water degradation, shortage of fresh water, competing land uses, and climate change for Australia and the world', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK063', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('c6286d1c-274b-4ae5-8370-4d29fad61d11', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK064', 'The effects of anticipated future population growth on global food production and security; the capacity for Australia and the world to achieve food security; the implications for agriculture, agricultural innovation and environmental sustainability', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK064', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('0226d2f0-482e-49e1-84ff-7b7cdc8c5f6b', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK065', 'The perceptions people have of place, and how this influences their connections to different places', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK065', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('ec5bb747-9c74-4339-90f8-a2bf64e40a60', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK066', 'The way transportation, and information and communication technologies are used to connect people to services, information and people in other places', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK066', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('b80ace2c-d11b-410c-9f85-49edcd034023', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK067', 'The ways that places and people are interconnected with other places through trade in goods and services, at all scales', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK067', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('1a46471e-e128-4bcf-a854-d8551a0c2369', '00a2681f-6b9e-4e77-a6a2-5d694f2ce3c4', 'ACHGK069', 'The effects of people''s travel, recreational, cultural or leisure choices on places, and the implications for the future of these places', '2025-10-02 00:55:40.866517+00', '2025-10-02 00:55:40.866517+00', 'ACHGK069', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('55bfa3a6-b1ed-4733-a454-da071fdb5f40', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH017', 'The technological innovations that led to the Industrial Revolution, and other conditions that influenced the industrialisation of Britain (e.g. the agricultural revolution, access to raw materials, wealthy middle class, cheap labour, transport system, and expanding empire) and of Australia', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH017', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('ca55865b-d7fa-45ca-b556-c6dd095bd170', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH080', 'The population movements and changing settlement patterns during the Industrial Revolution', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH080', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('d3b6b9b1-e772-434f-be88-81ac5c37212d', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH081', 'The experiences of men, women and children during the Industrial Revolution, and their changing way of life', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH081', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('a62169f5-4fd9-42a1-a7e6-cba180101f4d', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH082', 'The short-term and long-term impacts of the Industrial Revolution, including global changes in landscapes, transport and communication', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH082', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('4f6de086-5939-4ffb-94d8-d119c8f48faa', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH021', 'The causes of World War I and the reasons that men enlisted to fight in the war', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH021', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('db6e5131-5951-49b1-9861-29e42a49dc9d', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH095', 'The places where Australians fought and the nature of warfare during World War I, including the Gallipoli campaign', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH095', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('a1064fd6-ec93-42cc-9374-5ca91a28c657', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH096', 'The impact of World War I, with a particular emphasis on Australia, such as the use of propaganda to influence the civilian population, the changing role of women and the conscription debate', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH096', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('d829319c-3ec2-425b-bff7-57217c98353e', '66386e31-dca7-42e8-9e45-a69d207eb5b3', 'ACDSEH097', 'The commemoration of World War I, including debates about the nature and significance of the ANZAC legend', '2025-10-02 00:56:58.133612+00', '2025-10-02 00:56:58.133612+00', 'ACDSEH097', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('8ccd9eb7-2798-4c7f-bb3e-46aa596d33c9', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS79', 'Identify current personal knowledge, gaps, misconceptions, currency of information, personal perspective and possible perspectives of others', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS79', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('fd5c79c9-c96b-4a2b-a28a-6c1cfe4b5c2a', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS80', 'Construct, select and evaluate a range of questions and hypotheses involving cause and effect, patterns and trends, and different perspectives', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS80', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('9c29eec5-3ac9-4d76-b7ad-5508d93a7cbe', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS81', 'Analyse and clarify the purpose of an inquiry using appropriate methodologies, ethical protocols and concepts to plan for, and inform, an investigation', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS81', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('61660a40-9547-432a-aeb5-ae78dddfd8f7', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS82', 'Use a range of methods to collect, select, record and organise relevant and reliable information and/or data from multiple sources that reflects the type of analysis of information that is needed (e.g. questionnaires, surveys, emails, discussion lists, tables, field sketches, annotated diagrams), with and without the use of digital and spatial technologies', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS82', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('a9f279f5-93eb-4536-b844-60956b639e9c', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS83', 'Identify the origin, purpose and context of primary sources and/or secondary sources', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS83', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('510e6e35-2339-45c4-b4b3-f7743d1c3c72', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS84', 'Use appropriate ethical protocols, including specific formats for acknowledging other people''s information and understand that these formats vary between organisations', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS84', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('b6c00a00-5a1a-4a6c-9786-216aefba7010', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS85', 'Use criteria to analyse the reliability, bias, usefulness and currency of primary sources and/or secondary sources', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS85', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('97a6e024-8312-4fb9-a4ef-5189110600bc', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS86', 'Analyse information and/or data in different formats (e.g. to explain cause and effect relationships, comparisons, categories and subcategories, change over time)', '2025-10-02 00:57:17.992024+00', '2025-10-02 00:57:17.992024+00', 'WAHASS86', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('4a106fb4-4b2b-4204-93a8-bd5e488be66f', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS87', 'Account for different interpretations and points of view/perspectives in information and/or data (e.g. from tables, statistics, graphs, models, cartoons, maps, timelines, newspapers)', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS87', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('35db5358-0c52-4aca-9295-004d95952fb4', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS88', 'Analyse the ''big picture'' (e.g. put information and/or data into different contexts, reconstruct information by identifying new relationships, identify missing viewpoints or gaps in knowledge)', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS88', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('d3e35c7a-3a57-4301-8a83-b2bff60b1b1d', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS89', 'Apply subject-specific skills and concepts in familiar, new and hypothetical situations', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS89', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('5bf3f7a9-9758-47be-ab67-0b02bd67afae', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS90', 'Draw evidence-based conclusions by evaluating information and/or data, taking into account ambiguities and multiple perspectives; to negotiate and resolve contentious issues; to propose individual and collective action in response to contemporary events, challenges, developments, issues, problems and/or phenomena', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS90', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('813ab349-47f0-4fdd-bf95-618abb88ac01', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS91', 'Critically evaluate information and/or data and ideas from a range of sources to make generalisations and inferences; propose explanations for patterns, trends, relationships and anomalies; predict outcomes', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS91', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('d622c8ce-c6dc-4dcd-a59d-acc570592790', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS92', 'Select a range of appropriate formats based on their effectiveness to suit audience and purpose, using relevant digital technologies as appropriate', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS92', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('48fe97d1-2eff-4a24-86bd-06068849daae', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS93', 'Develop texts, particularly explanations and discussions, using evidence from a range of sources to support conclusions and/or arguments', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS93', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('a87ce5e8-9174-4a85-8961-3c44439c2ecf', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS94', 'Deconstruct and reconstruct the collected information and/or data into a form that identifies the relationship between the information and the hypothesis, using subject-specific conventions, terminology and concepts', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS94', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('5eb2066a-d9bc-4093-98e7-1ad10812807d', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS95', 'Compare evidence to substantiate judgements (e.g. use information and/or data from different places or times; use tables, graphs, models, theories)', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS95', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('cd36a503-b555-4acb-aa84-e5082f3fa213', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS96', 'Generate a range of viable options in response to an issue or event to recommend and justify a course of action, and predict the potential consequences of the proposed action', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS96', '4e2cb79f-5aea-46a7-b349-ebfbd647755e'),
	('b4bea96b-0148-4924-b6eb-f58b33ac5691', 'd6970e43-3c74-4f36-a400-797a128ee7a1', 'WAHASS97', 'Reflect on why all findings are tentative (e.g. the changing nature of knowledge, changes in circumstances, changes in values)', '2025-10-02 00:58:16.603224+00', '2025-10-02 00:58:16.603224+00', 'WAHASS97', '4e2cb79f-5aea-46a7-b349-ebfbd647755e');


--
-- Data for Name: class_content_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."class_content_item" ("id", "class_id", "content_item_id", "created_at") VALUES
	('785f01cf-aeb0-4488-a328-ea2f9d5a4571', '726032d2-fc31-48e7-869e-ba9767effba9', '9050ae26-24af-4e3e-a95b-6179e55ce945', '2025-10-02 01:51:22.220931+00'),
	('0a939209-db37-46a8-b8d7-a944c06be531', '726032d2-fc31-48e7-869e-ba9767effba9', 'ca2c368a-ab35-4516-ae05-05ee547f1df7', '2025-10-02 01:51:22.220931+00'),
	('68483354-ef9d-401e-89ae-86d9ab9ac924', '726032d2-fc31-48e7-869e-ba9767effba9', '4bfa3965-d4c2-460d-98b2-2a74f82379f0', '2025-10-02 01:51:22.220931+00'),
	('72762bd1-55b5-4fb4-83e6-8ec48a094032', '726032d2-fc31-48e7-869e-ba9767effba9', 'bfef56ab-279b-4e50-9464-3571907120c1', '2025-10-02 01:51:22.220931+00'),
	('58031346-ba46-4632-a04d-1512f5ffe1c2', '726032d2-fc31-48e7-869e-ba9767effba9', 'fd145a26-aa2a-4032-b6f2-dff4c7cbc3df', '2025-10-02 01:51:22.220931+00'),
	('609b2f0d-ee7a-408d-be58-0ccc3e736ff6', '726032d2-fc31-48e7-869e-ba9767effba9', '4553fb0d-e6d4-4cff-88b1-3341443e9957', '2025-10-02 01:51:22.220931+00'),
	('ccd44e3f-c263-48e8-9248-6fbccce57a05', '726032d2-fc31-48e7-869e-ba9767effba9', '99651c8c-7760-4348-9de1-9b328a1844c9', '2025-10-02 01:51:22.220931+00'),
	('9b18c66d-e933-44f6-82e0-3f1b8d554cad', '726032d2-fc31-48e7-869e-ba9767effba9', 'b54d37fa-8e29-4d87-b9fa-640dcc5b5fcc', '2025-10-02 01:51:22.220931+00'),
	('793dde9e-b187-4bd8-8224-ffa74aa14c46', '726032d2-fc31-48e7-869e-ba9767effba9', '0539966b-d924-42c0-82d6-1a5cf814cd11', '2025-10-02 01:51:22.220931+00'),
	('fcf5491c-4f5c-45a0-99a2-bba050699cf5', '726032d2-fc31-48e7-869e-ba9767effba9', '86b521a8-87b4-4e54-b94f-42ea7d94c52d', '2025-10-02 01:51:22.220931+00'),
	('b2ecf404-bc1d-43f6-befd-5052df3e5bbc', '726032d2-fc31-48e7-869e-ba9767effba9', 'a50ae4f3-6a23-486a-9335-7eb0639dae99', '2025-10-02 01:51:22.220931+00'),
	('40be9b2a-b4d3-4010-9168-4ec4756e12a8', '726032d2-fc31-48e7-869e-ba9767effba9', '2103a58e-1521-4d51-acf9-fe3b5c9ffb76', '2025-10-02 01:51:22.220931+00'),
	('cd8caa75-66fd-4603-89b5-155ec9602ef5', '726032d2-fc31-48e7-869e-ba9767effba9', 'a24fb818-265e-4710-b84e-b5a6d2b4a5ad', '2025-10-02 01:51:22.220931+00'),
	('0210b95e-35e2-4af8-bb47-50f80bf9689e', '726032d2-fc31-48e7-869e-ba9767effba9', '81ebbb65-646b-4f84-8448-1868c64cd7ef', '2025-10-02 01:51:22.220931+00'),
	('ab953640-4e47-4c22-9308-787fd831fad0', '726032d2-fc31-48e7-869e-ba9767effba9', '55fea5d7-c853-4b44-a311-ba235f87582b', '2025-10-02 01:51:22.220931+00'),
	('738c9221-0c27-4e8b-b51c-5e26db9b3a7e', '726032d2-fc31-48e7-869e-ba9767effba9', 'c57ef4a9-e020-485f-8273-51e3d50d833b', '2025-10-02 01:51:22.220931+00'),
	('c98227a2-deba-4453-8a39-e65293d1afbd', '726032d2-fc31-48e7-869e-ba9767effba9', 'ab8d12fe-964a-4334-83e5-6facae1ce03c', '2025-10-02 01:51:22.220931+00'),
	('59b40481-86ea-46ac-910f-584fc26d6bb0', '726032d2-fc31-48e7-869e-ba9767effba9', '102bd0ac-6b3d-48d1-95be-95cb47d2d667', '2025-10-02 01:51:22.220931+00'),
	('c3422c35-0e22-4427-ba05-fb957ec1a48b', '726032d2-fc31-48e7-869e-ba9767effba9', '2fa00433-2d47-4403-a8af-eb63e5671b81', '2025-10-02 01:51:22.220931+00'),
	('aa1906f6-f149-470e-9208-70f0ac7002c0', '726032d2-fc31-48e7-869e-ba9767effba9', 'a2eb7d18-1508-4f62-8992-3decf3cbce6b', '2025-10-02 01:51:22.220931+00'),
	('d25ed625-260f-4319-8926-efdbd60c1ebb', '726032d2-fc31-48e7-869e-ba9767effba9', '95f1d544-c62c-4861-a809-5081045c1268', '2025-10-02 01:51:22.220931+00');


--
-- Data for Name: class_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."class_sessions" ("id", "class_id", "started_at", "ended_at", "created_at", "updated_at", "title", "description") VALUES
	('9218707c-f0a8-48b4-b350-44d478148801', '726032d2-fc31-48e7-869e-ba9767effba9', '2025-09-29 03:31:31.002+00', '2025-09-29 03:33:47.146+00', '2025-09-29 03:31:31.023215+00', '2025-09-29 03:33:47.18031+00', 'Government in Action', '90 min lesson on Australian Govt');


--
-- Data for Name: tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tag" ("id", "type", "name", "created_at", "updated_at") VALUES
	('0069da8e-6850-47fb-ac6e-5207057ed569', 'blooms_taxonomy', 'Create', '2025-09-20 06:52:01.098381+00', '2025-09-20 06:52:01.098381+00'),
	('16454545-28a2-4367-b290-5dca40ed3a9e', 'capability', 'Numeracy', '2025-09-19 14:09:53.529207+00', '2025-09-19 14:09:53.529207+00'),
	('272c0cf9-7431-4377-82b0-2375cee5d4cb', 'blooms_taxonomy', 'Evaluate', '2025-09-20 06:52:01.098381+00', '2025-09-20 06:52:01.098381+00'),
	('2b614d3f-3c18-45f0-9e94-6fb890012f43', 'blooms_taxonomy', 'Apply', '2025-09-20 06:52:01.098381+00', '2025-09-20 06:52:01.098381+00'),
	('4188c65a-48a3-4470-a26f-a85f25402a40', 'capability', 'ICT Capability', '2025-09-19 14:09:53.529207+00', '2025-09-19 14:09:53.529207+00'),
	('501a51cc-5f31-462a-957c-7d7a61c4b24b', 'capability', 'Personal and Social Capability', '2025-09-19 14:09:53.529207+00', '2025-09-19 14:09:53.529207+00'),
	('6bbdf77c-3453-49ea-97c4-9e58be0f0c82', 'blooms_taxonomy', 'Analyse', '2025-09-20 06:52:01.098381+00', '2025-09-24 23:11:12.702765+00'),
	('7eda7bf9-d5bd-4fc6-b4cf-7427d5610150', 'capability', 'Critical and Creative Thinking', '2025-09-19 14:09:53.529207+00', '2025-09-19 14:09:53.529207+00'),
	('8d8e2907-e663-47f8-b579-9146f38e1fe1', 'blooms_taxonomy', 'Understand', '2025-09-20 06:52:01.098381+00', '2025-09-20 06:52:01.098381+00'),
	('a8813e7d-9fc2-47d4-bbd1-aa8e768861e1', 'capability', 'Intercultural Understanding', '2025-09-19 14:09:53.529207+00', '2025-09-19 14:09:53.529207+00'),
	('b661b1cd-0465-4a79-84a2-12532619b5f5', 'capability', 'Literacy', '2025-09-19 14:09:53.529207+00', '2025-09-19 14:09:53.529207+00'),
	('ca37a7fa-4ea9-44fb-8478-10948d97fea8', 'blooms_taxonomy', 'Remember', '2025-09-20 06:52:01.098381+00', '2025-09-20 06:52:01.098381+00'),
	('e6819941-087f-42aa-b5d9-36bd9a87a6c9', 'capability', 'Ethical Understanding', '2025-09-19 14:09:53.529207+00', '2025-09-19 14:09:53.529207+00');


--
-- Data for Name: content_item_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."content_item_tag" ("content_item_id", "tag_id") VALUES
	('2e367406-5adb-4188-9d58-52325ec38a2f', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('2e367406-5adb-4188-9d58-52325ec38a2f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('f7e7c2f1-7271-47bf-abea-ff0e60466093', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('f7e7c2f1-7271-47bf-abea-ff0e60466093', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('ef029491-ac91-443f-a76f-6fcb6d679863', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('ef029491-ac91-443f-a76f-6fcb6d679863', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('8b84ab74-773e-4d92-badb-da0635edf360', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('8b84ab74-773e-4d92-badb-da0635edf360', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('8367f840-8364-4745-b87f-fa9fbba2bcd1', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('8367f840-8364-4745-b87f-fa9fbba2bcd1', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('1e5af8a9-9289-4837-a009-f976252b41cd', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('1e5af8a9-9289-4837-a009-f976252b41cd', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('1e5af8a9-9289-4837-a009-f976252b41cd', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('4e979dc5-015c-4346-bb3b-04eb5e0ea971', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('4e979dc5-015c-4346-bb3b-04eb5e0ea971', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('4e979dc5-015c-4346-bb3b-04eb5e0ea971', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('952475bf-a561-47e2-894a-66860ffa89a4', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('952475bf-a561-47e2-894a-66860ffa89a4', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('952475bf-a561-47e2-894a-66860ffa89a4', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('9e17a969-8de7-42cf-8b4b-f10f79f244a4', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('9e17a969-8de7-42cf-8b4b-f10f79f244a4', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('9e17a969-8de7-42cf-8b4b-f10f79f244a4', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('73bdc047-5cc1-4320-bc8e-60f6f328dc89', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('73bdc047-5cc1-4320-bc8e-60f6f328dc89', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('73bdc047-5cc1-4320-bc8e-60f6f328dc89', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('952fa305-90b4-4bec-93d7-25044548a1a5', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('952fa305-90b4-4bec-93d7-25044548a1a5', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('508cbbfc-a0ce-4d67-8bff-56e253a56392', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('cbeb0e4d-a23a-42ba-ba88-8a811fb91821', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('72421e34-d576-47e8-8c95-593c72b59dfb', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('3b34c878-7805-4189-8735-20de7e74d131', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b4b1bad5-b277-4792-909c-e155c3bd56f8', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('b4b1bad5-b277-4792-909c-e155c3bd56f8', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b950c3b3-330e-4c34-9dab-65fc884835e9', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('b950c3b3-330e-4c34-9dab-65fc884835e9', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d4ff899b-9bac-4492-85c4-e878aa22153d', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('d4ff899b-9bac-4492-85c4-e878aa22153d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d4ff899b-9bac-4492-85c4-e878aa22153d', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('12fc72e6-5c0b-4577-87ed-27e23a1ebf62', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('12fc72e6-5c0b-4577-87ed-27e23a1ebf62', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('87de7b9c-d236-41c6-a1bb-d1859a67498e', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('87de7b9c-d236-41c6-a1bb-d1859a67498e', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('0ffccd54-1075-4361-aabe-487444586dec', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('0ffccd54-1075-4361-aabe-487444586dec', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('bb998604-e994-4a74-8de0-1d1f1fe6fbb1', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('bb998604-e994-4a74-8de0-1d1f1fe6fbb1', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('bb998604-e994-4a74-8de0-1d1f1fe6fbb1', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('bb998604-e994-4a74-8de0-1d1f1fe6fbb1', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('183a31eb-46d7-4976-8c80-01cbadeb2b04', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('1405e0c3-2194-4344-92fa-0e0a0bd6140e', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('6db931a5-24f0-4e15-a2dd-f12b101a3cef', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('6db931a5-24f0-4e15-a2dd-f12b101a3cef', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('67564c51-1d29-46fd-8fed-2cc73f9853a0', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('545bed99-3273-41c1-b591-8b800725a7f4', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('545bed99-3273-41c1-b591-8b800725a7f4', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('545bed99-3273-41c1-b591-8b800725a7f4', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('a8b2731e-7e6c-4db7-b41f-cb043f073aa3', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a8b2731e-7e6c-4db7-b41f-cb043f073aa3', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('a8b2731e-7e6c-4db7-b41f-cb043f073aa3', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('ec6ec884-f754-44fe-9096-8d46b223dffc', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('85190839-3aba-4e21-92d1-fa2618010367', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('85190839-3aba-4e21-92d1-fa2618010367', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('85190839-3aba-4e21-92d1-fa2618010367', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('eb3749ed-c876-48a7-9ec9-56cc702c2a70', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('eb3749ed-c876-48a7-9ec9-56cc702c2a70', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f1a2d2d0-eafd-4267-9c07-82d40258e028', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('f1a2d2d0-eafd-4267-9c07-82d40258e028', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('f1a2d2d0-eafd-4267-9c07-82d40258e028', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('2ac9a174-4bb9-4f3f-82ab-0fbbbd541f27', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('2ac9a174-4bb9-4f3f-82ab-0fbbbd541f27', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('2ac9a174-4bb9-4f3f-82ab-0fbbbd541f27', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a5050516-9290-4440-8af5-2e31b7429075', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('a5050516-9290-4440-8af5-2e31b7429075', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('94a49254-7ae0-4c74-b083-449f2795f8e6', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('94a49254-7ae0-4c74-b083-449f2795f8e6', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('94a49254-7ae0-4c74-b083-449f2795f8e6', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('94a49254-7ae0-4c74-b083-449f2795f8e6', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('7c8240be-fb50-4725-be67-ef81563041a7', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('7c8240be-fb50-4725-be67-ef81563041a7', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('e1a6ad16-9d53-45c7-b43c-75d0f7ffee25', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('e1a6ad16-9d53-45c7-b43c-75d0f7ffee25', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('e1a6ad16-9d53-45c7-b43c-75d0f7ffee25', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('9fbd7726-57a1-4439-a089-c2d9b488a7c2', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('9fbd7726-57a1-4439-a089-c2d9b488a7c2', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('9fbd7726-57a1-4439-a089-c2d9b488a7c2', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('9fbd7726-57a1-4439-a089-c2d9b488a7c2', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('0d5f90f1-9b63-4976-8375-3e5de23bc6b1', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('0d5f90f1-9b63-4976-8375-3e5de23bc6b1', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('0d5f90f1-9b63-4976-8375-3e5de23bc6b1', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('0d5f90f1-9b63-4976-8375-3e5de23bc6b1', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('d2662358-7614-4908-b9e3-dc325ea9f103', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('d2662358-7614-4908-b9e3-dc325ea9f103', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d5c95f91-dfc9-42d0-bdbe-5dfc88e85685', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('d5c95f91-dfc9-42d0-bdbe-5dfc88e85685', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('d5c95f91-dfc9-42d0-bdbe-5dfc88e85685', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d5c95f91-dfc9-42d0-bdbe-5dfc88e85685', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('04bf8e8d-7918-4b86-8da7-b48f4740e0cf', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('04bf8e8d-7918-4b86-8da7-b48f4740e0cf', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('04bf8e8d-7918-4b86-8da7-b48f4740e0cf', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('04bf8e8d-7918-4b86-8da7-b48f4740e0cf', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('3ac2c771-36bf-497e-b39c-766eff3faec4', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('3ac2c771-36bf-497e-b39c-766eff3faec4', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('3ac2c771-36bf-497e-b39c-766eff3faec4', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('6a0db213-fc89-417e-9ef5-970fd3c01cda', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('6a0db213-fc89-417e-9ef5-970fd3c01cda', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('6a0db213-fc89-417e-9ef5-970fd3c01cda', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('7f93845c-d702-429a-98f7-4e92d81c09ad', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('7f93845c-d702-429a-98f7-4e92d81c09ad', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('5755f2f8-2ef3-48ff-9da9-b6110b63fbb4', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('5755f2f8-2ef3-48ff-9da9-b6110b63fbb4', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('560e7008-a883-43d0-b916-8548219e339f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('e2e4d242-bac6-4efa-8331-c571ba32d700', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('e2e4d242-bac6-4efa-8331-c571ba32d700', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('e2e4d242-bac6-4efa-8331-c571ba32d700', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('e2e4d242-bac6-4efa-8331-c571ba32d700', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('965b3734-9ae3-49a4-a2f2-d6ba1d0af8a3', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('965b3734-9ae3-49a4-a2f2-d6ba1d0af8a3', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('965b3734-9ae3-49a4-a2f2-d6ba1d0af8a3', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('965b3734-9ae3-49a4-a2f2-d6ba1d0af8a3', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('7e899a3d-c2ce-4cec-b389-8f38a3182838', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('7e899a3d-c2ce-4cec-b389-8f38a3182838', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('7e899a3d-c2ce-4cec-b389-8f38a3182838', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('7e899a3d-c2ce-4cec-b389-8f38a3182838', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('7e899a3d-c2ce-4cec-b389-8f38a3182838', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('f76e2bb3-e0ef-43be-ab56-94d49d5c1f7b', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('f76e2bb3-e0ef-43be-ab56-94d49d5c1f7b', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b6e7a2a8-277d-44cb-91c9-35841ec02b46', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('b6e7a2a8-277d-44cb-91c9-35841ec02b46', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b6e7a2a8-277d-44cb-91c9-35841ec02b46', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('2447fe37-95a6-414e-b076-3825b4c5ab4a', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('2447fe37-95a6-414e-b076-3825b4c5ab4a', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('121d2cc8-2646-4341-bc24-e0b74c21d01c', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('4afa2c3e-1f16-4fde-94bd-65343d807b9e', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('4afa2c3e-1f16-4fde-94bd-65343d807b9e', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('e663e9b4-3d9d-4564-94db-7096d79f914b', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('e663e9b4-3d9d-4564-94db-7096d79f914b', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('93b187ca-7fe1-4295-8d81-8fa5dcfe21df', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('93b187ca-7fe1-4295-8d81-8fa5dcfe21df', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('d90c011d-f752-4491-8de4-def62cd2183d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d90c011d-f752-4491-8de4-def62cd2183d', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('a0708442-d897-4bad-bd78-430e80e33349', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a0708442-d897-4bad-bd78-430e80e33349', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('8b0208e4-c8d3-4527-84b8-b58b621a073c', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('cd9c91f9-1d7d-4ba3-a4b3-bb0d3e5e962f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b50131a9-874d-4beb-bbf4-51da45752649', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('155b56bb-1b7e-46ae-9731-65e6ed4090c0', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('155b56bb-1b7e-46ae-9731-65e6ed4090c0', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('155b56bb-1b7e-46ae-9731-65e6ed4090c0', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('43de4de3-37a5-422c-920e-ace3d1b89d00', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('43de4de3-37a5-422c-920e-ace3d1b89d00', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('43de4de3-37a5-422c-920e-ace3d1b89d00', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('b336fd11-3f38-4ab3-b58f-3270caaab1f7', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('b336fd11-3f38-4ab3-b58f-3270caaab1f7', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b336fd11-3f38-4ab3-b58f-3270caaab1f7', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('b336fd11-3f38-4ab3-b58f-3270caaab1f7', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('f001919c-85a6-443f-8a0d-c6004412943c', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('f001919c-85a6-443f-8a0d-c6004412943c', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f001919c-85a6-443f-8a0d-c6004412943c', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('f001919c-85a6-443f-8a0d-c6004412943c', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('8924a8f8-a6e4-411c-8958-9672b4680c97', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d9e41703-60f4-4832-972b-4238a0e4633b', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('1eed463a-a11b-4569-8d7a-bcb37f64dec3', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('1eed463a-a11b-4569-8d7a-bcb37f64dec3', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('d4d32ad2-5081-4705-8480-b72bd2ae5298', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d4d32ad2-5081-4705-8480-b72bd2ae5298', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('8029be17-6307-4e08-ba80-30fe5fa13670', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('8029be17-6307-4e08-ba80-30fe5fa13670', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('8029be17-6307-4e08-ba80-30fe5fa13670', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('fd691006-2e86-4f59-9ff6-88145ac9d3e2', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('fd691006-2e86-4f59-9ff6-88145ac9d3e2', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('fd691006-2e86-4f59-9ff6-88145ac9d3e2', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('fd691006-2e86-4f59-9ff6-88145ac9d3e2', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('8686631c-25aa-43a5-8a9d-559e689d1389', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('8686631c-25aa-43a5-8a9d-559e689d1389', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('8686631c-25aa-43a5-8a9d-559e689d1389', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('8686631c-25aa-43a5-8a9d-559e689d1389', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('7985da81-a940-4f4a-aa65-25b18c713098', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('7985da81-a940-4f4a-aa65-25b18c713098', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('7985da81-a940-4f4a-aa65-25b18c713098', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('1e4f031e-4990-429a-98bc-78cc2152a5f7', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('1e4f031e-4990-429a-98bc-78cc2152a5f7', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('1e4f031e-4990-429a-98bc-78cc2152a5f7', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('1e4f031e-4990-429a-98bc-78cc2152a5f7', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('d834b934-4aaf-4b32-8d7f-2d992c7d3e4f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d834b934-4aaf-4b32-8d7f-2d992c7d3e4f', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('d834b934-4aaf-4b32-8d7f-2d992c7d3e4f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('d834b934-4aaf-4b32-8d7f-2d992c7d3e4f', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('d15851cc-31ef-4ef5-9abe-64ff6cef1974', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('d15851cc-31ef-4ef5-9abe-64ff6cef1974', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('d15851cc-31ef-4ef5-9abe-64ff6cef1974', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('30587f2b-4c40-4b50-bfc7-5682c2704d68', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('30587f2b-4c40-4b50-bfc7-5682c2704d68', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('30587f2b-4c40-4b50-bfc7-5682c2704d68', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a9f46926-b960-4fa0-8045-4b1160da3eff', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('a9f46926-b960-4fa0-8045-4b1160da3eff', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('a9f46926-b960-4fa0-8045-4b1160da3eff', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a9f46926-b960-4fa0-8045-4b1160da3eff', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('a9f46926-b960-4fa0-8045-4b1160da3eff', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('97f2dd01-158b-4e4f-abf6-2f4bdad09edf', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('97f2dd01-158b-4e4f-abf6-2f4bdad09edf', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('97f2dd01-158b-4e4f-abf6-2f4bdad09edf', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('97f2dd01-158b-4e4f-abf6-2f4bdad09edf', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('97f2dd01-158b-4e4f-abf6-2f4bdad09edf', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('97f2dd01-158b-4e4f-abf6-2f4bdad09edf', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('0bb64984-ef91-48e5-bb36-cc84e3c94511', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('0bb64984-ef91-48e5-bb36-cc84e3c94511', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('8a32db23-3964-4cb7-a5a3-76a657687c2e', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('8a32db23-3964-4cb7-a5a3-76a657687c2e', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('8a32db23-3964-4cb7-a5a3-76a657687c2e', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('8a32db23-3964-4cb7-a5a3-76a657687c2e', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('c8db1f9b-fd15-4663-b9a5-bfdd38a5893f', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('c8db1f9b-fd15-4663-b9a5-bfdd38a5893f', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('c8db1f9b-fd15-4663-b9a5-bfdd38a5893f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('c8db1f9b-fd15-4663-b9a5-bfdd38a5893f', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('c8db1f9b-fd15-4663-b9a5-bfdd38a5893f', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('67e24b44-5206-4a5c-92b1-a3c0b4fa8ee5', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('67e24b44-5206-4a5c-92b1-a3c0b4fa8ee5', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('67e24b44-5206-4a5c-92b1-a3c0b4fa8ee5', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('67e24b44-5206-4a5c-92b1-a3c0b4fa8ee5', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('83cc7fc2-c9d9-4e69-9473-030fc8e51690', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('83cc7fc2-c9d9-4e69-9473-030fc8e51690', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('83cc7fc2-c9d9-4e69-9473-030fc8e51690', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('83cc7fc2-c9d9-4e69-9473-030fc8e51690', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('ac1cb87c-fad5-43cd-86fd-265b51ff2dcd', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('ac1cb87c-fad5-43cd-86fd-265b51ff2dcd', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('ac1cb87c-fad5-43cd-86fd-265b51ff2dcd', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('2c3fba5a-5432-4516-9a43-8bc3dbac7be8', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('2c3fba5a-5432-4516-9a43-8bc3dbac7be8', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('2c3fba5a-5432-4516-9a43-8bc3dbac7be8', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('44e7dd58-1132-44c0-b717-b7684917b107', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('44e7dd58-1132-44c0-b717-b7684917b107', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('44e7dd58-1132-44c0-b717-b7684917b107', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('682d4e4b-a362-4b5a-9062-1c52fddb6df5', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('682d4e4b-a362-4b5a-9062-1c52fddb6df5', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('682d4e4b-a362-4b5a-9062-1c52fddb6df5', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('ad7f096a-c392-4831-8064-3117ed23e5da', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('ad7f096a-c392-4831-8064-3117ed23e5da', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('ad7f096a-c392-4831-8064-3117ed23e5da', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('0db6c4aa-e364-4a38-b558-87f8983770e2', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('0db6c4aa-e364-4a38-b558-87f8983770e2', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('7379c598-faa6-428b-96a4-9a17982fb605', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('7379c598-faa6-428b-96a4-9a17982fb605', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('7379c598-faa6-428b-96a4-9a17982fb605', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b682754e-6a9d-489d-9cac-9d75d34a0fc8', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('b682754e-6a9d-489d-9cac-9d75d34a0fc8', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('b682754e-6a9d-489d-9cac-9d75d34a0fc8', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b682754e-6a9d-489d-9cac-9d75d34a0fc8', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('f89f41fc-4c59-42ff-9c4d-4a3572a2d090', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('f89f41fc-4c59-42ff-9c4d-4a3572a2d090', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('f89f41fc-4c59-42ff-9c4d-4a3572a2d090', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f89f41fc-4c59-42ff-9c4d-4a3572a2d090', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('3b0ef412-52bf-418f-ac43-c6ed8b168cc2', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('3b0ef412-52bf-418f-ac43-c6ed8b168cc2', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('9050ae26-24af-4e3e-a95b-6179e55ce945', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('9050ae26-24af-4e3e-a95b-6179e55ce945', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('ca2c368a-ab35-4516-ae05-05ee547f1df7', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('ca2c368a-ab35-4516-ae05-05ee547f1df7', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('ca2c368a-ab35-4516-ae05-05ee547f1df7', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('4bfa3965-d4c2-460d-98b2-2a74f82379f0', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('4bfa3965-d4c2-460d-98b2-2a74f82379f0', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('4bfa3965-d4c2-460d-98b2-2a74f82379f0', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('bfef56ab-279b-4e50-9464-3571907120c1', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('bfef56ab-279b-4e50-9464-3571907120c1', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('bfef56ab-279b-4e50-9464-3571907120c1', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('fd145a26-aa2a-4032-b6f2-dff4c7cbc3df', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('fd145a26-aa2a-4032-b6f2-dff4c7cbc3df', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('fd145a26-aa2a-4032-b6f2-dff4c7cbc3df', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('4553fb0d-e6d4-4cff-88b1-3341443e9957', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('4553fb0d-e6d4-4cff-88b1-3341443e9957', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('4553fb0d-e6d4-4cff-88b1-3341443e9957', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('4553fb0d-e6d4-4cff-88b1-3341443e9957', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('f9047457-5117-40ee-ab32-c34b6e28ba4a', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f9047457-5117-40ee-ab32-c34b6e28ba4a', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('e5ffc40f-e11a-4440-9814-cf3b83df4edb', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('e5ffc40f-e11a-4440-9814-cf3b83df4edb', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('aac743a0-e20e-4714-b7ad-be5776883dd4', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('aac743a0-e20e-4714-b7ad-be5776883dd4', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('0756c7fd-30a7-4b2f-ad55-ba6e0a0d994d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('0756c7fd-30a7-4b2f-ad55-ba6e0a0d994d', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('42edc95c-f7d0-4e4b-9653-a85596ca24a5', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('42edc95c-f7d0-4e4b-9653-a85596ca24a5', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('3a72cef2-3771-496f-8807-963b26b2e45b', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('f0fc0a49-d1a4-440b-8830-aff832a7ac3a', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('f0fc0a49-d1a4-440b-8830-aff832a7ac3a', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f0fc0a49-d1a4-440b-8830-aff832a7ac3a', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('b81040a0-f103-4847-a0f6-f62071811779', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('e403b7f9-f7e0-4c91-9084-57fff45e327a', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('e403b7f9-f7e0-4c91-9084-57fff45e327a', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('534f19fb-3991-4ba1-ae5d-036078f81128', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('534f19fb-3991-4ba1-ae5d-036078f81128', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f5bafb50-b637-4e6f-bc10-a9d044f0b67e', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('f5bafb50-b637-4e6f-bc10-a9d044f0b67e', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('41d7bffc-0eb3-4601-9392-1ecc25d1f521', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('41d7bffc-0eb3-4601-9392-1ecc25d1f521', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('41d7bffc-0eb3-4601-9392-1ecc25d1f521', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('da960a8d-75da-49b5-bc0c-8aa09e4cfd3c', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a1ff13eb-b01b-4174-b6b0-5b0cb36c8554', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('854f429d-8753-47b1-8616-6cba355952f0', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('e6830c06-ecbf-4f24-be25-e420f7cd9df4', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('e6830c06-ecbf-4f24-be25-e420f7cd9df4', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('e6830c06-ecbf-4f24-be25-e420f7cd9df4', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('e6830c06-ecbf-4f24-be25-e420f7cd9df4', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('6cf070c8-d63c-47b7-854c-8cebd4f84e56', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('6cf070c8-d63c-47b7-854c-8cebd4f84e56', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('3eb11ecc-c344-4fb5-b2c9-17d7b5c5bf34', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('3eb11ecc-c344-4fb5-b2c9-17d7b5c5bf34', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('58ed5724-9ff6-41cf-99bd-7716df51a6eb', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('58ed5724-9ff6-41cf-99bd-7716df51a6eb', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('8789232b-883f-4d36-838f-6213327f2ae9', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('8789232b-883f-4d36-838f-6213327f2ae9', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('8789232b-883f-4d36-838f-6213327f2ae9', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('2250af45-b670-4ba1-b3bf-ee09e83d3315', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('2250af45-b670-4ba1-b3bf-ee09e83d3315', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('002118e1-9198-4f04-aba1-5b3439fb3dc9', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('002118e1-9198-4f04-aba1-5b3439fb3dc9', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('008f1ad2-3ad5-40df-8df3-437411bba98d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('008f1ad2-3ad5-40df-8df3-437411bba98d', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('008f1ad2-3ad5-40df-8df3-437411bba98d', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('99651c8c-7760-4348-9de1-9b328a1844c9', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('99651c8c-7760-4348-9de1-9b328a1844c9', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('99651c8c-7760-4348-9de1-9b328a1844c9', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b54d37fa-8e29-4d87-b9fa-640dcc5b5fcc', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('b54d37fa-8e29-4d87-b9fa-640dcc5b5fcc', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('0539966b-d924-42c0-82d6-1a5cf814cd11', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('0539966b-d924-42c0-82d6-1a5cf814cd11', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('0539966b-d924-42c0-82d6-1a5cf814cd11', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('86b521a8-87b4-4e54-b94f-42ea7d94c52d', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('86b521a8-87b4-4e54-b94f-42ea7d94c52d', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('86b521a8-87b4-4e54-b94f-42ea7d94c52d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a50ae4f3-6a23-486a-9335-7eb0639dae99', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('a50ae4f3-6a23-486a-9335-7eb0639dae99', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('2103a58e-1521-4d51-acf9-fe3b5c9ffb76', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('2103a58e-1521-4d51-acf9-fe3b5c9ffb76', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('2103a58e-1521-4d51-acf9-fe3b5c9ffb76', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('2103a58e-1521-4d51-acf9-fe3b5c9ffb76', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('a24fb818-265e-4710-b84e-b5a6d2b4a5ad', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('a24fb818-265e-4710-b84e-b5a6d2b4a5ad', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('81ebbb65-646b-4f84-8448-1868c64cd7ef', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('81ebbb65-646b-4f84-8448-1868c64cd7ef', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('81ebbb65-646b-4f84-8448-1868c64cd7ef', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('55fea5d7-c853-4b44-a311-ba235f87582b', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('55fea5d7-c853-4b44-a311-ba235f87582b', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('55fea5d7-c853-4b44-a311-ba235f87582b', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('55fea5d7-c853-4b44-a311-ba235f87582b', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('c57ef4a9-e020-485f-8273-51e3d50d833b', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('c57ef4a9-e020-485f-8273-51e3d50d833b', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('c57ef4a9-e020-485f-8273-51e3d50d833b', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('c57ef4a9-e020-485f-8273-51e3d50d833b', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('ab8d12fe-964a-4334-83e5-6facae1ce03c', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('ab8d12fe-964a-4334-83e5-6facae1ce03c', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('102bd0ac-6b3d-48d1-95be-95cb47d2d667', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('102bd0ac-6b3d-48d1-95be-95cb47d2d667', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('102bd0ac-6b3d-48d1-95be-95cb47d2d667', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('102bd0ac-6b3d-48d1-95be-95cb47d2d667', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('2fa00433-2d47-4403-a8af-eb63e5671b81', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('2fa00433-2d47-4403-a8af-eb63e5671b81', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('2fa00433-2d47-4403-a8af-eb63e5671b81', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('2fa00433-2d47-4403-a8af-eb63e5671b81', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('a2eb7d18-1508-4f62-8992-3decf3cbce6b', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('a2eb7d18-1508-4f62-8992-3decf3cbce6b', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a2eb7d18-1508-4f62-8992-3decf3cbce6b', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('95f1d544-c62c-4861-a809-5081045c1268', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('95f1d544-c62c-4861-a809-5081045c1268', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('caf4e9cf-d426-46bf-ada5-a5aabf71112f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('a9ead7cf-5a5d-478d-88c8-2f4e610c750f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a9ead7cf-5a5d-478d-88c8-2f4e610c750f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('c7a5897d-720d-4354-922d-d7e1668a0587', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('c7a5897d-720d-4354-922d-d7e1668a0587', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('ed99e74f-5eaf-46d8-8790-223973e0e7ad', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('53edaed8-782a-4b45-b318-204712a63cfb', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('bcde690a-d97d-4302-856b-e6209b381d4c', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('06509e82-d806-4b58-a04d-d20344073e85', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('06509e82-d806-4b58-a04d-d20344073e85', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('06509e82-d806-4b58-a04d-d20344073e85', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('5af701ed-c83b-459f-88a7-763bb54d36a4', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('8da0ed72-d3bb-40ba-9489-7f69d92ddee3', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('8da0ed72-d3bb-40ba-9489-7f69d92ddee3', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('734999bb-1c3b-4205-a623-bd6129b1b46f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('734999bb-1c3b-4205-a623-bd6129b1b46f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('f040ff2b-7414-4e91-9aa0-3d0f5da1e35f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f040ff2b-7414-4e91-9aa0-3d0f5da1e35f', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('f040ff2b-7414-4e91-9aa0-3d0f5da1e35f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('5fd26d4c-c380-4562-b4d6-732765bcf50f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('5fd26d4c-c380-4562-b4d6-732765bcf50f', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('5fd26d4c-c380-4562-b4d6-732765bcf50f', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('83f4ce4a-4289-4e79-a031-728ff5e9dcce', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('83f4ce4a-4289-4e79-a031-728ff5e9dcce', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('aa161e9f-ffa4-4dcc-96fd-8b784820a9ff', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('aa161e9f-ffa4-4dcc-96fd-8b784820a9ff', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('7a1e779a-d92a-49b0-be87-f5f45e795b34', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('7a1e779a-d92a-49b0-be87-f5f45e795b34', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('f26c15e6-fbe0-444f-a226-7c6c1cab5abc', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('f26c15e6-fbe0-444f-a226-7c6c1cab5abc', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('9251a4e8-6890-45c5-8c92-7b791d3aa6b7', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('9251a4e8-6890-45c5-8c92-7b791d3aa6b7', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('2ec201b1-26cd-417f-bff6-1987c0de0b03', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('2ec201b1-26cd-417f-bff6-1987c0de0b03', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('2ec201b1-26cd-417f-bff6-1987c0de0b03', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('c6286d1c-274b-4ae5-8370-4d29fad61d11', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('c6286d1c-274b-4ae5-8370-4d29fad61d11', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('c6286d1c-274b-4ae5-8370-4d29fad61d11', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('0226d2f0-482e-49e1-84ff-7b7cdc8c5f6b', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('0226d2f0-482e-49e1-84ff-7b7cdc8c5f6b', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('0226d2f0-482e-49e1-84ff-7b7cdc8c5f6b', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('0226d2f0-482e-49e1-84ff-7b7cdc8c5f6b', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('ec5bb747-9c74-4339-90f8-a2bf64e40a60', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('ec5bb747-9c74-4339-90f8-a2bf64e40a60', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b80ace2c-d11b-410c-9f85-49edcd034023', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('1a46471e-e128-4bcf-a854-d8551a0c2369', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('1a46471e-e128-4bcf-a854-d8551a0c2369', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('1a46471e-e128-4bcf-a854-d8551a0c2369', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('55bfa3a6-b1ed-4733-a454-da071fdb5f40', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('55bfa3a6-b1ed-4733-a454-da071fdb5f40', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('55bfa3a6-b1ed-4733-a454-da071fdb5f40', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('ca55865b-d7fa-45ca-b556-c6dd095bd170', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('ca55865b-d7fa-45ca-b556-c6dd095bd170', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d3b6b9b1-e772-434f-be88-81ac5c37212d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d3b6b9b1-e772-434f-be88-81ac5c37212d', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('d3b6b9b1-e772-434f-be88-81ac5c37212d', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('a62169f5-4fd9-42a1-a7e6-cba180101f4d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a62169f5-4fd9-42a1-a7e6-cba180101f4d', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('4f6de086-5939-4ffb-94d8-d119c8f48faa', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('4f6de086-5939-4ffb-94d8-d119c8f48faa', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('4f6de086-5939-4ffb-94d8-d119c8f48faa', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('db6e5131-5951-49b1-9861-29e42a49dc9d', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('db6e5131-5951-49b1-9861-29e42a49dc9d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('db6e5131-5951-49b1-9861-29e42a49dc9d', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('db6e5131-5951-49b1-9861-29e42a49dc9d', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('db6e5131-5951-49b1-9861-29e42a49dc9d', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('a1064fd6-ec93-42cc-9374-5ca91a28c657', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('a1064fd6-ec93-42cc-9374-5ca91a28c657', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('a1064fd6-ec93-42cc-9374-5ca91a28c657', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('d829319c-3ec2-425b-bff7-57217c98353e', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d829319c-3ec2-425b-bff7-57217c98353e', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('d829319c-3ec2-425b-bff7-57217c98353e', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('8ccd9eb7-2798-4c7f-bb3e-46aa596d33c9', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('8ccd9eb7-2798-4c7f-bb3e-46aa596d33c9', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('8ccd9eb7-2798-4c7f-bb3e-46aa596d33c9', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('fd5c79c9-c96b-4a2b-a28a-6c1cfe4b5c2a', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('fd5c79c9-c96b-4a2b-a28a-6c1cfe4b5c2a', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('fd5c79c9-c96b-4a2b-a28a-6c1cfe4b5c2a', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('9c29eec5-3ac9-4d76-b7ad-5508d93a7cbe', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('9c29eec5-3ac9-4d76-b7ad-5508d93a7cbe', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('9c29eec5-3ac9-4d76-b7ad-5508d93a7cbe', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('9c29eec5-3ac9-4d76-b7ad-5508d93a7cbe', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('9c29eec5-3ac9-4d76-b7ad-5508d93a7cbe', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('61660a40-9547-432a-aeb5-ae78dddfd8f7', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('61660a40-9547-432a-aeb5-ae78dddfd8f7', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('61660a40-9547-432a-aeb5-ae78dddfd8f7', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('61660a40-9547-432a-aeb5-ae78dddfd8f7', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('61660a40-9547-432a-aeb5-ae78dddfd8f7', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('61660a40-9547-432a-aeb5-ae78dddfd8f7', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('a9f279f5-93eb-4536-b844-60956b639e9c', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('a9f279f5-93eb-4536-b844-60956b639e9c', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('510e6e35-2339-45c4-b4b3-f7743d1c3c72', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('510e6e35-2339-45c4-b4b3-f7743d1c3c72', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('510e6e35-2339-45c4-b4b3-f7743d1c3c72', 'e6819941-087f-42aa-b5d9-36bd9a87a6c9'),
	('510e6e35-2339-45c4-b4b3-f7743d1c3c72', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('b6c00a00-5a1a-4a6c-9786-216aefba7010', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('b6c00a00-5a1a-4a6c-9786-216aefba7010', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('97a6e024-8312-4fb9-a4ef-5189110600bc', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('97a6e024-8312-4fb9-a4ef-5189110600bc', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('97a6e024-8312-4fb9-a4ef-5189110600bc', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('4a106fb4-4b2b-4204-93a8-bd5e488be66f', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('4a106fb4-4b2b-4204-93a8-bd5e488be66f', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('4a106fb4-4b2b-4204-93a8-bd5e488be66f', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('4a106fb4-4b2b-4204-93a8-bd5e488be66f', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('35db5358-0c52-4aca-9295-004d95952fb4', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('35db5358-0c52-4aca-9295-004d95952fb4', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('35db5358-0c52-4aca-9295-004d95952fb4', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('35db5358-0c52-4aca-9295-004d95952fb4', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('d3e35c7a-3a57-4301-8a83-b2bff60b1b1d', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('d3e35c7a-3a57-4301-8a83-b2bff60b1b1d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('5bf3f7a9-9758-47be-ab67-0b02bd67afae', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('5bf3f7a9-9758-47be-ab67-0b02bd67afae', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('5bf3f7a9-9758-47be-ab67-0b02bd67afae', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('5bf3f7a9-9758-47be-ab67-0b02bd67afae', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('5bf3f7a9-9758-47be-ab67-0b02bd67afae', 'a8813e7d-9fc2-47d4-bbd1-aa8e768861e1'),
	('813ab349-47f0-4fdd-bf95-618abb88ac01', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('813ab349-47f0-4fdd-bf95-618abb88ac01', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('813ab349-47f0-4fdd-bf95-618abb88ac01', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('813ab349-47f0-4fdd-bf95-618abb88ac01', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('d622c8ce-c6dc-4dcd-a59d-acc570592790', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('d622c8ce-c6dc-4dcd-a59d-acc570592790', '4188c65a-48a3-4470-a26f-a85f25402a40'),
	('d622c8ce-c6dc-4dcd-a59d-acc570592790', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('d622c8ce-c6dc-4dcd-a59d-acc570592790', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('48fe97d1-2eff-4a24-86bd-06068849daae', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('48fe97d1-2eff-4a24-86bd-06068849daae', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('48fe97d1-2eff-4a24-86bd-06068849daae', '501a51cc-5f31-462a-957c-7d7a61c4b24b'),
	('a87ce5e8-9174-4a85-8961-3c44439c2ecf', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('a87ce5e8-9174-4a85-8961-3c44439c2ecf', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('a87ce5e8-9174-4a85-8961-3c44439c2ecf', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('5eb2066a-d9bc-4093-98e7-1ad10812807d', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('5eb2066a-d9bc-4093-98e7-1ad10812807d', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('5eb2066a-d9bc-4093-98e7-1ad10812807d', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('cd36a503-b555-4acb-aa84-e5082f3fa213', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('cd36a503-b555-4acb-aa84-e5082f3fa213', '16454545-28a2-4367-b290-5dca40ed3a9e'),
	('cd36a503-b555-4acb-aa84-e5082f3fa213', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b4bea96b-0148-4924-b6eb-f58b33ac5691', 'b661b1cd-0465-4a79-84a2-12532619b5f5'),
	('b4bea96b-0148-4924-b6eb-f58b33ac5691', '7eda7bf9-d5bd-4fc6-b4cf-7427d5610150'),
	('b4bea96b-0148-4924-b6eb-f58b33ac5691', '501a51cc-5f31-462a-957c-7d7a61c4b24b');


--
-- Data for Name: dashboard_layouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dashboard_layouts" ("id", "teacher_id", "class_id", "name", "is_default", "layout_config", "created_at", "updated_at") VALUES
	('41559d9d-2f5e-48ad-a162-7650a34ad17b', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', '726032d2-fc31-48e7-869e-ba9767effba9', 'Default Layout', true, '[]', '2025-09-28 15:56:03.911674+00', '2025-09-28 15:56:03.911674+00'),
	('f303a092-3d7e-491c-a01c-2686fc6f753a', '9f0642ef-b1e6-431b-be25-3dc6dffbc75f', '726032d2-fc31-48e7-869e-ba9767effba9', 'Default Layout', true, '[]', '2025-09-28 15:56:03.93935+00', '2025-09-28 15:56:03.93935+00');


--
-- Data for Name: dashboard_widgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dashboard_widgets" ("id", "layout_id", "widget_type", "title", "data_source", "filters", "position", "config", "created_at", "updated_at") VALUES
	('1b5f81da-da9b-4f51-b67c-5375d3726f32', 'f303a092-3d7e-491c-a01c-2686fc6f753a', 'kpi', 'KPI Card', 'class_average', '{}', '{"h": 3, "w": 3, "x": 0, "y": 0}', '{}', '2025-09-28 15:56:54.468523+00', '2025-09-29 07:05:15.339871+00'),
	('14a92e89-12f1-47dd-8c6f-831cb485750e', 'f303a092-3d7e-491c-a01c-2686fc6f753a', 'bar_chart', 'Content Descriptor Avg.', 'content_coverage', '{}', '{"h": 4, "w": 6, "x": 0, "y": 3}', '{}', '2025-09-28 15:57:21.419576+00', '2025-09-29 07:05:15.340687+00'),
	('e4d0c363-4194-42dd-bcb0-4772c03462f2', 'f303a092-3d7e-491c-a01c-2686fc6f753a', 'pie_chart', 'Task Type Distribution', 'task_types', '{}', '{"h": 4, "w": 6, "x": 6, "y": 0}', '{}', '2025-09-29 03:48:02.561834+00', '2025-09-29 07:05:15.342409+00');


--
-- Data for Name: enrolments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tasks" ("id", "class_id", "name", "task_type", "weight_percent", "due_date", "max_score", "created_at", "updated_at", "description", "assessment_format", "blooms_taxonomy", "key_skill", "content_item_id", "is_legacy") VALUES
	('d59271d2-1db2-47bb-a3ed-40431a0a95ec', '726032d2-fc31-48e7-869e-ba9767effba9', 'Task 2 - Sample Test', 'Summative', NULL, '2025-08-22', 19.00, '2025-09-28 15:52:50.28786+00', '2025-09-28 15:52:50.28786+00', NULL, 'traditional', NULL, NULL, NULL, false),
	('2bfa35e4-158f-491a-995d-c1316404d31f', '726032d2-fc31-48e7-869e-ba9767effba9', 'Task 1 - Sample Test', 'Summative', NULL, '2025-07-25', 25.00, '2025-09-28 15:54:05.662593+00', '2025-09-28 15:54:05.662593+00', NULL, 'traditional', NULL, NULL, NULL, false),
	('3efe1e39-5494-447e-ac9f-71ada5467715', '726032d2-fc31-48e7-869e-ba9767effba9', 'Task 3 - Sample Essay', 'Summative', NULL, '2025-09-08', 15.00, '2025-09-28 16:42:19.240968+00', '2025-09-28 16:42:19.240968+00', NULL, 'traditional', NULL, NULL, NULL, false);


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."questions" ("id", "task_id", "number", "question", "max_score", "question_type", "created_at", "updated_at", "content_item", "general_capabilities", "blooms_taxonomy") VALUES
	('8b429493-bbb8-4cd2-8553-14892807b417', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 1, 'Which of the following is a feature of criminal law in Australia?', 1, 'MCQ', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK064', NULL, 'Remember'),
	('2954fbb7-1504-465f-bca7-172aa099141d', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 2, 'Define “civil law”.', 1, 'Definition', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK064', NULL, 'Remember'),
	('215ed370-99d4-4d86-932a-6132c526a621', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 3, 'Name one example of Aboriginal or Torres Strait Islander customary law.', 2, 'Short Answer', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK064', NULL, 'Understand'),
	('c32faa2c-9f2c-4b05-b144-a5656da8b3eb', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 4, 'Explain one difference between criminal and civil law.', 2, 'Short Answer', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK064', NULL, 'Analyse'),
	('2005fa19-e689-42ca-bc73-f45777dd2c34', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 5, 'Give an example of how Aboriginal customary law influences modern legal practices.', 2, 'Short Answer', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK064', NULL, 'Apply'),
	('471f3045-1c9b-46ab-8c0c-20cc98eba75c', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 6, 'Which statement reflects a diverse perspective on Australian national identity?', 1, 'MCQ', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK066', NULL, 'Understand'),
	('784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 7, 'Short answer: Describe how Aboriginal perspectives contribute to the idea of what it means to be Australian.', 2, 'Short Answer', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK066', NULL, 'Analyse'),
	('ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 8, 'Identify one challenge in balancing national identity with cultural diversity.', 2, 'Short Answer', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK066', NULL, 'Analyse'),
	('4f5bb13b-84f3-44a9-bede-144c29d88fc5', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 9, 'Explain how personal and social capability helps Australians engage with different perspectives.', 2, 'Short Answer', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK066', NULL, 'Apply'),
	('00ebad6c-4e9a-4012-a69e-2f38daa64876', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 10, 'Extended response: Evaluate the importance of recognising multiple perspectives when defining national identity.', 4, 'Long Answer', '2025-09-28 15:52:50.303107+00', '2025-09-28 15:52:50.303107+00', 'ACHCK066', NULL, 'Evaluate'),
	('6512f940-55df-4885-9cbf-f2021d7a9ac2', '2bfa35e4-158f-491a-995d-c1316404d31f', 1, 'Which freedom allows Australians to express opinions without government interference?', 1, 'MCQ', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK061', NULL, 'Remember'),
	('98531d68-eaae-42d1-a86f-02df0ac1a335', '2bfa35e4-158f-491a-995d-c1316404d31f', 2, 'Define “freedom of association”.', 1, 'Definition', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK061', NULL, 'Remember'),
	('21c80dce-e8e0-4053-8d51-d91e69296550', '2bfa35e4-158f-491a-995d-c1316404d31f', 3, 'Which freedom protects the right to gather in public places?', 1, 'MCQ', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK061', NULL, 'Understand'),
	('0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '2bfa35e4-158f-491a-995d-c1316404d31f', 4, 'Freedom of movement allows citizens to…', 1, 'MCQ', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK061', NULL, 'Understand'),
	('bc3604cb-d1f8-49a5-8181-481d2345722e', '2bfa35e4-158f-491a-995d-c1316404d31f', 5, 'Which is an example of contacting an elected representative?', 1, 'MCQ', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK062', NULL, 'Apply'),
	('c4f52043-4b6a-4b77-a4d3-94b7091f044f', '2bfa35e4-158f-491a-995d-c1316404d31f', 6, 'Identify one way lobby groups influence government.', 2, 'Short Answer', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK062', NULL, 'Apply'),
	('153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '2bfa35e4-158f-491a-995d-c1316404d31f', 7, 'What is direct action in a democracy?', 2, 'Short Answer', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK062', NULL, 'Analyse'),
	('2155072d-d19d-4d78-97a9-f242e975bd94', '2bfa35e4-158f-491a-995d-c1316404d31f', 8, 'Explain how a bill becomes law in Parliament.', 2, 'Short Answer', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK063', NULL, 'Analyse'),
	('f6473503-3e10-42d1-b34b-46961a7aa06e', '2bfa35e4-158f-491a-995d-c1316404d31f', 9, 'Which chamber of Parliament is known as the “house of review”?', 1, 'MCQ', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK063', NULL, 'Remember'),
	('5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '2bfa35e4-158f-491a-995d-c1316404d31f', 10, 'What is common law?', 1, 'Definition', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK063', NULL, 'Remember'),
	('b9253d23-ab63-4878-94a2-8b461a6ae06e', '2bfa35e4-158f-491a-995d-c1316404d31f', 11, 'Give an example of a civil law matter.', 2, 'Short Answer', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK064', NULL, 'Understand'),
	('c2d5793d-3be0-41ef-8a46-223964526eed', '2bfa35e4-158f-491a-995d-c1316404d31f', 12, 'How are criminal laws different from civil laws?', 2, 'Short Answer', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK064', NULL, 'Analyse'),
	('6f5f0afd-80c1-4680-a773-555b22ec1501', '2bfa35e4-158f-491a-995d-c1316404d31f', 13, 'Briefly explain Aboriginal and Torres Strait Islander customary law.', 2, 'Short Answer', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK064', NULL, 'Understand'),
	('cbd53302-961b-489b-95d5-dd15a09f186f', '2bfa35e4-158f-491a-995d-c1316404d31f', 14, 'Long answer: Describe two ways citizens can participate in Australia’s democracy and explain why each is important.', 6, 'Long Answer', '2025-09-28 15:54:05.675459+00', '2025-09-28 15:54:05.675459+00', 'ACHCK061/062', NULL, 'Evaluate'),
	('57bef7a2-cd6e-40ac-a783-5a636873b3b1', '3efe1e39-5494-447e-ac9f-71ada5467715', 1, 'How laws are made in Australia through parliaments (statutory law)', 15, 'Essay', '2025-09-28 16:42:19.255812+00', '2025-09-28 16:42:19.255812+00', 'ACHCK063', NULL, 'Evaluate');


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."students" ("id", "class_id", "student_id", "first_name", "last_name", "email", "year_level", "created_at", "updated_at") VALUES
	('ebe0b582-b4ab-471a-a071-11fb2e1b3714', '726032d2-fc31-48e7-869e-ba9767effba9', '53841', 'Jacob', 'Rutherford', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('94c6b87d-2012-4241-8e93-1485435cf1f0', '726032d2-fc31-48e7-869e-ba9767effba9', '17492', 'Mia', 'Blackwell', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('5fa382fe-f310-420c-b0af-1793dcb6aa38', '726032d2-fc31-48e7-869e-ba9767effba9', '92608', 'Oscar', 'Langford', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', '726032d2-fc31-48e7-869e-ba9767effba9', '35170', 'Harper', 'Fenwick', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('616f4ad7-42e8-4079-aefc-faa74b5b6dcd', '726032d2-fc31-48e7-869e-ba9767effba9', '48253', 'Leo', 'Strickland', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('70e83404-b607-442e-a3ce-0da79b4fe250', '726032d2-fc31-48e7-869e-ba9767effba9', '69024', 'Zoe', 'Markham', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('90b88e34-568b-4079-ad9a-de5c84b30d53', '726032d2-fc31-48e7-869e-ba9767effba9', '81736', 'Elijah', 'Redmond', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('2961b233-b486-44a2-a07e-973eb0551103', '726032d2-fc31-48e7-869e-ba9767effba9', '26349', 'Sienna', 'Hollings', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('1d236809-bf9d-4f17-b1cf-ab06a1081ffe', '726032d2-fc31-48e7-869e-ba9767effba9', '74518', 'Finn', 'Radford', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('f1f3853f-d06a-4d8a-8356-ef7d92b005e4', '726032d2-fc31-48e7-869e-ba9767effba9', '59137', 'Poppy', 'Ashcroft', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('9f00e5c5-3642-417a-97c7-39de49edf489', '726032d2-fc31-48e7-869e-ba9767effba9', '38062', 'Xavier', 'Truscott', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('5e601404-8f48-4d79-ad84-3e07be0c4fa6', '726032d2-fc31-48e7-869e-ba9767effba9', '42785', 'Evie', 'Cartledge', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('95ebf67e-473c-4407-a007-1f12ec793754', '726032d2-fc31-48e7-869e-ba9767effba9', '86490', 'Isaac', 'Beaumont', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('e8a3804a-952e-45a8-bdd5-96800054db68', '726032d2-fc31-48e7-869e-ba9767effba9', '53271', 'Daisy', 'Kirkland', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('32099647-abb3-4e40-8092-51e0617f0e73', '726032d2-fc31-48e7-869e-ba9767effba9', '70935', 'Cooper', 'McIntyre', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('74f8992e-96f2-4b0a-b42d-09d00564cba1', '726032d2-fc31-48e7-869e-ba9767effba9', '19864', 'Ruby', 'Glasson', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('e239eb87-5429-4c35-85d2-1f84cb5f8389', '726032d2-fc31-48e7-869e-ba9767effba9', '64327', 'Lucas', 'Pendleton', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('178f851e-b54e-4627-be81-8644c8160ff7', '726032d2-fc31-48e7-869e-ba9767effba9', '27583', 'Isla', 'Berryman', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('3f1ed16f-77b8-46f3-b8d1-71268611ad71', '726032d2-fc31-48e7-869e-ba9767effba9', '90841', 'Archer', 'Fawcett', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('1d804ec7-9693-42a1-830c-dc12efac1d83', '726032d2-fc31-48e7-869e-ba9767effba9', '36619', 'Matilda', 'Pemberton', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00'),
	('19f2b329-2846-4486-b4c6-d224c9c0a99c', '726032d2-fc31-48e7-869e-ba9767effba9', '48152', 'Henry', 'Kingsley', NULL, NULL, '2025-09-27 08:22:17.940449+00', '2025-09-27 08:22:17.940449+00');


--
-- Data for Name: question_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."question_results" ("id", "question_id", "student_id", "raw_score", "percent_score", "created_at", "updated_at") VALUES
	('52093919-e71a-4a14-9739-a642b0b9ecd1', '6512f940-55df-4885-9cbf-f2021d7a9ac2', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('48f0f19d-75e6-4890-92a8-fd1b9eff4b49', '98531d68-eaae-42d1-a86f-02df0ac1a335', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('14196412-e6b7-49aa-a98d-77ea9c3896a3', '21c80dce-e8e0-4053-8d51-d91e69296550', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c2a8b69a-de6f-4fb2-bc02-6b009d6c95b8', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('b5fc2d44-5ea8-4f4e-879e-b883121d04d5', 'bc3604cb-d1f8-49a5-8181-481d2345722e', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ccc89cf1-1952-4ae9-b698-1055418c5251', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c4909ef6-bf46-4e65-b943-47a2c0551567', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('607ab460-ac77-41bc-9047-ecf9925a9dc8', '2155072d-d19d-4d78-97a9-f242e975bd94', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c58e8154-0775-42ae-b41e-67d390cf8e65', 'f6473503-3e10-42d1-b34b-46961a7aa06e', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 200, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('84f1c8d4-b62b-4567-9968-a4a69666c54e', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('15347558-9872-47cb-be17-a2f8c97ad8f3', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ee307fad-4cfc-401e-a87b-08cf092af920', 'c2d5793d-3be0-41ef-8a46-223964526eed', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('8ce77411-9dd1-43df-ac1b-0a8c0a362b1c', '6f5f0afd-80c1-4680-a773-555b22ec1501', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a1f64f0c-5665-41ed-9200-d32109f96e78', 'cbd53302-961b-489b-95d5-dd15a09f186f', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 33.33333333333333, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('423b9a53-efef-4f4e-a6b0-31fd76792e4b', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('8356431f-bf0f-414b-b31e-c848ea14e577', '98531d68-eaae-42d1-a86f-02df0ac1a335', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ce0fbd61-238d-4738-842c-fa25e322f5f5', '21c80dce-e8e0-4053-8d51-d91e69296550', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('cfafaed6-e32e-4ebb-8b43-cff01437eef0', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('76847529-5e65-4ef4-9d84-09afb4e56c5a', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c5678ce7-e198-46c9-83e8-8de41c0d634b', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2d61bb51-d434-4184-8150-1b39dbd7ac9f', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a92cf561-1ddb-45bf-b8f4-79f03227b279', '2155072d-d19d-4d78-97a9-f242e975bd94', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('218dea62-aa44-4fdb-bebc-083b422cc809', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 200, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1a71d81c-0115-42b4-9cd2-9a8bb6555196', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('34aa70f3-e1f3-4400-85b0-c5f7657e0ef2', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ace81972-5908-45a9-b640-7da4e52729e5', 'c2d5793d-3be0-41ef-8a46-223964526eed', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f358d27e-43db-4dbc-a291-9094d989b01b', '6f5f0afd-80c1-4680-a773-555b22ec1501', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('35d284db-54b2-474c-ac21-50ba077a6103', 'cbd53302-961b-489b-95d5-dd15a09f186f', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 33.33333333333333, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c1d1d99d-3f9f-4c1c-b4ab-cf4cdc463356', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9f2832f1-9c29-4bde-aed5-d44e8f6324f2', '98531d68-eaae-42d1-a86f-02df0ac1a335', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('dd4c089b-e6f8-4d18-bfdf-e43ffed0919c', '21c80dce-e8e0-4053-8d51-d91e69296550', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7d541a53-5032-4963-8fda-caa16d7a8e9e', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('b28f1f15-9e56-4c33-b333-d08de216b5a9', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('05301f89-d7c3-4f9e-bddf-eb1ef38c572e', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('93b7b731-c355-4168-b85a-043b398a3bfc', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('39ea54a8-d9c6-44ec-a26e-606d5579f38e', '2155072d-d19d-4d78-97a9-f242e975bd94', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('5ba80811-5688-4b15-8ce8-3553c6c152d4', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f5e67d86-4a60-495a-8832-f9be423304df', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('bd28a384-0a3c-43ff-aee2-eaa8bf971b87', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2e0bb7af-27ca-4c11-ba00-0a46845af1f5', 'c2d5793d-3be0-41ef-8a46-223964526eed', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6f364adb-716b-46d3-b266-1fc07466f01c', '6f5f0afd-80c1-4680-a773-555b22ec1501', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('dd2be0c7-3802-4a26-8329-dd2cfbe1711c', 'cbd53302-961b-489b-95d5-dd15a09f186f', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 33.33333333333333, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('da8097fa-c425-4377-983a-e6aac657324a', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a20b8cb5-a06d-4c2c-aad0-16bf861ca42b', '98531d68-eaae-42d1-a86f-02df0ac1a335', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a6a16c9f-7004-4148-b457-2aedd69389d4', '21c80dce-e8e0-4053-8d51-d91e69296550', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('8bd37d58-2cc6-4879-9fd2-e090d76ce595', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('92b90f9a-0908-4592-8b0d-d382adef9139', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0373ea17-da2b-4e24-838e-e87c58e1d706', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7be60e06-fd61-4c8b-8795-0c9f3a518a2a', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('36061e52-df86-400f-8585-21764edb2d47', '2155072d-d19d-4d78-97a9-f242e975bd94', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('61fd4320-6964-4569-88e2-22a99ecf2424', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 200, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ad9a2dda-03de-4e9f-949b-16cd92ddfd21', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('b982ec70-97d1-41d4-8fa1-e661d69d67b9', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7c633f86-fa9f-4be6-8fb6-a49ed31677cb', 'c2d5793d-3be0-41ef-8a46-223964526eed', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3a351604-86d2-438e-9dd7-866334a9eb99', '6f5f0afd-80c1-4680-a773-555b22ec1501', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2e43daad-a076-4422-b4e5-630e91262f3f', 'cbd53302-961b-489b-95d5-dd15a09f186f', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 33.33333333333333, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f9c26c99-ec7e-484d-80ab-ad2734c6ba44', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3070994a-58bc-48fa-8b6d-e9e6e76f3474', '98531d68-eaae-42d1-a86f-02df0ac1a335', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f7735df1-e213-4c98-a709-792da7fd100a', '21c80dce-e8e0-4053-8d51-d91e69296550', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('54202099-4d58-4b65-99c8-dcf6ca09876c', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c2a8213f-04ea-400c-b21b-93da4a6d56c5', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d068d520-ed1b-4d42-8482-79de603ce0d5', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a26b8256-5cfe-431e-a7e1-2c77b5db963d', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1e404ca8-2a52-4ee3-be6d-099848ac4e34', '2155072d-d19d-4d78-97a9-f242e975bd94', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('869edc21-0937-42e0-81eb-124611c9f430', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 200, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ff57c01e-cf67-40a7-a254-597e11c0f484', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1ba9ce3f-eba6-4b48-8e2c-e7caf2be35ec', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f9231d9b-56c1-444e-ab23-70c0c3a72266', 'c2d5793d-3be0-41ef-8a46-223964526eed', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9f5ee515-986a-4963-bf5a-a76f50e4f6c6', '6f5f0afd-80c1-4680-a773-555b22ec1501', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('b3cb3b9e-d9e4-43f7-ab5e-4939a31e88e0', 'cbd53302-961b-489b-95d5-dd15a09f186f', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9659de33-e523-497d-b2b6-147377eef5b2', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('91104032-6e1d-4bce-a889-8845472a4772', '98531d68-eaae-42d1-a86f-02df0ac1a335', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('833f47c0-08d9-490c-a59a-5783794c49d2', '21c80dce-e8e0-4053-8d51-d91e69296550', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9d5f4d38-9445-4a9f-9bb1-3af04efca90e', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('e7e2b0ee-116c-4634-8109-944db3eae07c', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d2b62047-02b5-4a90-85ea-af365f1b9725', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('deb96bc8-eb63-4550-86db-6bdb022c2684', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1bde0a3d-0d39-4f01-a34f-0a23755e0eec', '2155072d-d19d-4d78-97a9-f242e975bd94', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3cccd629-4aa5-420b-aae6-c9e0891c4512', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 200, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9e0785ec-5abf-4231-b644-e8a6e17289e9', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('843af424-8e36-435f-8781-e7046b2b5c2a', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('e6ba4624-6ee8-4b5a-9b4c-a46932d7e48e', 'c2d5793d-3be0-41ef-8a46-223964526eed', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('e1e68b61-7075-4b95-978d-38df7561589e', '6f5f0afd-80c1-4680-a773-555b22ec1501', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7e9a4e1a-2c23-4b2a-9bf5-4aeb409f73a5', 'cbd53302-961b-489b-95d5-dd15a09f186f', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 33.33333333333333, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2d48e346-27ec-4195-8ab0-40b12ab8e073', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('b8856671-0494-47c1-968c-13ed9163cd6a', '98531d68-eaae-42d1-a86f-02df0ac1a335', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c731ce79-bb16-4081-94bd-b6576a7e2c4e', '21c80dce-e8e0-4053-8d51-d91e69296550', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a7be4409-05b6-4da1-9c8c-ec0afc6ea0eb', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a1331e47-d716-452c-9ae3-b2e02df6a3df', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('872c8f3f-2ab2-42a1-817e-da836ca26aec', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('01557f65-984f-4886-b831-55a1a53c26ab', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('121e8357-40dc-41e8-9310-18f6f1faa721', '2155072d-d19d-4d78-97a9-f242e975bd94', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6a1904ee-702d-4607-a432-3454b99ab17d', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9f6ef522-09e2-4130-a8c7-cd9e8886c887', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('51d4b163-c0fd-4465-b310-8bf69c369540', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6453d3cf-67ae-4612-b9aa-0f40a3e25451', 'c2d5793d-3be0-41ef-8a46-223964526eed', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('5fa87f48-ca9b-4cfc-b344-eabb19a537cc', '6f5f0afd-80c1-4680-a773-555b22ec1501', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('712076ba-91be-43e9-be68-36fd776b7096', 'cbd53302-961b-489b-95d5-dd15a09f186f', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 33.33333333333333, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9569a269-3382-467a-b400-90c81b4887d7', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ff52f7ca-42f5-45ab-a7df-5542689c1138', '98531d68-eaae-42d1-a86f-02df0ac1a335', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a2a56ae2-3b21-42d7-9051-99d4fed4b497', '21c80dce-e8e0-4053-8d51-d91e69296550', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('17ced808-1949-43b9-a4d4-a1fee38c33b0', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('960a2893-6637-4b2c-a0bf-b0ad0fc5a07c', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('cdd05291-2e1f-44f6-b7cf-e7eb5cc830de', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '2961b233-b486-44a2-a07e-973eb0551103', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6dccd467-d27e-42b2-b4dc-c22c0478df32', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '2961b233-b486-44a2-a07e-973eb0551103', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ce7286c5-34ba-4fd7-bc4b-95e11b68afd1', '2155072d-d19d-4d78-97a9-f242e975bd94', '2961b233-b486-44a2-a07e-973eb0551103', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d6a5faf7-d666-477c-8fab-0e747e318698', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('79da6778-98a7-4581-a27b-368233a6bb1a', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('350b58ad-79a5-4ea0-9ab0-f0c47a2b3b94', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '2961b233-b486-44a2-a07e-973eb0551103', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('bce7eda1-7613-4e3d-b478-3215dd5e2b64', 'c2d5793d-3be0-41ef-8a46-223964526eed', '2961b233-b486-44a2-a07e-973eb0551103', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('4f0dc341-8e9a-4f34-929d-9daf6771621e', '6f5f0afd-80c1-4680-a773-555b22ec1501', '2961b233-b486-44a2-a07e-973eb0551103', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('517f8303-cc06-4571-969b-1affcdb45038', 'cbd53302-961b-489b-95d5-dd15a09f186f', '2961b233-b486-44a2-a07e-973eb0551103', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('29c7ae0d-d05c-41f7-826d-a0885db95b03', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('63581d37-5d72-479f-9224-da820fce18ab', '98531d68-eaae-42d1-a86f-02df0ac1a335', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d7459eb0-2f0e-470a-84f8-ab6e8ded4b49', '21c80dce-e8e0-4053-8d51-d91e69296550', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2c2e8694-4713-4f04-9549-99c706c41c87', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('762f196d-e7b1-4836-a88c-1afd108b2c40', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('e571dd89-d8e0-46e5-b891-d5bf3b9e1b3c', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0c720232-df18-470f-9b70-c6999f7c48fe', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7dca6bc8-f951-460a-94b3-822b8fd86cf4', '2155072d-d19d-4d78-97a9-f242e975bd94', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('8682b927-cab9-4777-8712-b3cd45d39393', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 2, 200, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('e034a55a-8903-4731-93cc-906e96f0e113', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('29a0adf3-37ec-4b6b-a4df-6d1fe372cc59', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('036ba44d-b718-4ae6-9604-498d57e54810', 'c2d5793d-3be0-41ef-8a46-223964526eed', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9aedc283-e2ad-4153-aebb-63bcd8196376', '6f5f0afd-80c1-4680-a773-555b22ec1501', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9f0ce573-783b-45ee-a8f8-0a8a66ad27d8', 'cbd53302-961b-489b-95d5-dd15a09f186f', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 2, 33.33333333333333, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3e26f96f-1309-466f-a056-f57e81d9702f', '6512f940-55df-4885-9cbf-f2021d7a9ac2', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('385c3ddc-8fbb-41a4-b33f-dc2cc8f7f76a', '98531d68-eaae-42d1-a86f-02df0ac1a335', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('5edb81a2-b12d-47c9-861a-97408e7b4746', '21c80dce-e8e0-4053-8d51-d91e69296550', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ca46ccc7-8c8a-4ae7-a675-9298b04b3aca', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('76c01426-01f7-439a-b816-c73e38e6ce69', 'bc3604cb-d1f8-49a5-8181-481d2345722e', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3b99dd05-33a2-49fd-af55-1f26be1e9dc5', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('4aba58cc-3c4f-4d72-b9a3-f9736443fcf7', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a11f4f85-232a-43de-8d6a-a06f497f095c', '2155072d-d19d-4d78-97a9-f242e975bd94', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9ef7e769-94ca-4fdf-9fe0-9c4074afdf16', 'f6473503-3e10-42d1-b34b-46961a7aa06e', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c31eaed7-2b88-4ed1-a2eb-7dc207821856', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('63528fb4-d426-49da-a344-4299aa4d0cd6', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('aee6328c-910c-4e93-83d4-011d12fe8e6d', 'c2d5793d-3be0-41ef-8a46-223964526eed', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('dfb2985a-491d-4230-8a62-76af74b21c6d', '6f5f0afd-80c1-4680-a773-555b22ec1501', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1c6f0897-8cf2-4548-ae41-62368f847547', 'cbd53302-961b-489b-95d5-dd15a09f186f', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c8ded41c-d930-4ebe-8a34-5490dd4e4256', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('4ef6ef96-f93d-4cee-ab35-0b3e17677b7d', '98531d68-eaae-42d1-a86f-02df0ac1a335', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1829c9fb-d6f7-4017-ab60-0cf001e17f72', '21c80dce-e8e0-4053-8d51-d91e69296550', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('871541af-7613-450c-a550-10180f838bb8', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('af607a02-c3e4-43fa-a064-2e9cc1620b92', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ef8ce41e-e7ea-42d9-b21f-407f1f65d8e9', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c78d9c7f-298a-4e85-9fe5-e5bcb1c3f3f9', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('375cd310-abec-4bdd-b4e4-d14efc045a84', '2155072d-d19d-4d78-97a9-f242e975bd94', '9f00e5c5-3642-417a-97c7-39de49edf489', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('264c5b71-d23d-482c-9a9e-c0828ca6ad8d', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0f521374-942b-4714-8edf-bff1ba9b8c63', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('878298b4-50d9-4514-a58f-37e9761cc166', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('34f42b4f-a4b3-4ed9-b633-ad1570615d19', 'c2d5793d-3be0-41ef-8a46-223964526eed', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9b75352e-3c35-47b1-b604-a4f36d0609a3', '6f5f0afd-80c1-4680-a773-555b22ec1501', '9f00e5c5-3642-417a-97c7-39de49edf489', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('46815d5b-e4ca-4b5f-acb3-c71e555d7bc6', 'cbd53302-961b-489b-95d5-dd15a09f186f', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d611a014-88b9-4718-834b-1690618e2536', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c1cb928e-51f2-47e3-8da5-62550c12fe98', '98531d68-eaae-42d1-a86f-02df0ac1a335', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3fef7a09-7e51-4ee9-8f41-3072c7218724', '21c80dce-e8e0-4053-8d51-d91e69296550', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('72820738-137d-4900-9a82-4b985463fb1e', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3679a21b-4faa-49dd-a899-8d3e6e98504a', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('11f1d4b2-e97e-4df4-8f0f-16a7874db813', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('8e078bf8-f729-48c0-8420-facf3419c80e', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('16a28c87-232c-40ea-9434-f3cfee19d6b0', '2155072d-d19d-4d78-97a9-f242e975bd94', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6b3a9c43-8b3a-4949-8d22-5f34c7789b76', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d20336f7-3423-4b53-8869-0a0f57c1e86f', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('80c9d5ca-2342-4b3c-8971-a2aefc66d7e3', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7c96eada-38e3-444a-8ced-37b610747393', 'c2d5793d-3be0-41ef-8a46-223964526eed', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0baa2726-c19a-4957-9cf9-00acfe818d7a', '6f5f0afd-80c1-4680-a773-555b22ec1501', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('5a11c17b-a0fd-4d23-bfdf-2e97eb4fe7d7', 'cbd53302-961b-489b-95d5-dd15a09f186f', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('b48f1d2f-e50f-4111-ab82-f7ad5b329878', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0c23a5f2-4b2a-46f0-a4b0-9b7d99759095', '98531d68-eaae-42d1-a86f-02df0ac1a335', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9c5df5e3-8974-48af-9998-abfd73252a41', '21c80dce-e8e0-4053-8d51-d91e69296550', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('65f57d85-e317-485e-b668-6f5c97918c2c', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d46c59e1-39a5-4580-b576-efbd337c2eba', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '95ebf67e-473c-4407-a007-1f12ec793754', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6ee826c1-a20d-478b-9a12-92145dc7144b', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9bf7500b-c562-44f1-99aa-db76e83e42f2', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f8cd4249-ab01-434a-a4ca-0f1a47671827', '2155072d-d19d-4d78-97a9-f242e975bd94', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('270da6ab-cb2c-4fcc-9476-e134e3ea1d08', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('47f19fc8-d4d9-48e8-8d21-c0b7a1d87a97', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f5e7c38f-1575-4fb6-85e8-008125548d70', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c4ed41a9-b9c5-4c0e-bd1c-3e8646cd0ee3', 'c2d5793d-3be0-41ef-8a46-223964526eed', '95ebf67e-473c-4407-a007-1f12ec793754', 2, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2eebe096-0adf-4fd0-be6e-25c27a7c1c7a', '6f5f0afd-80c1-4680-a773-555b22ec1501', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('973fc9fd-a9d5-40f7-9714-621e7bcbf69d', 'cbd53302-961b-489b-95d5-dd15a09f186f', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('508a72e2-48e1-4fd6-a30d-fb418b1ae4b6', '6512f940-55df-4885-9cbf-f2021d7a9ac2', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('31aaee2d-44f5-47de-a7b2-776010516126', '98531d68-eaae-42d1-a86f-02df0ac1a335', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ddffe550-bdd7-4085-a97a-a509e8e19068', '21c80dce-e8e0-4053-8d51-d91e69296550', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d84f5f63-1ca2-4d85-9b36-5429d8d6c797', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', 'e8a3804a-952e-45a8-bdd5-96800054db68', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7c966c4c-0889-4dd6-acac-ecde80cefd33', 'bc3604cb-d1f8-49a5-8181-481d2345722e', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3957f4b3-96ea-4287-a63e-e3457967f97c', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3524d879-a973-4b09-886c-29ff7d5cda69', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0f0d4e27-af99-44a0-bbf4-2be3a75f4264', '2155072d-d19d-4d78-97a9-f242e975bd94', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('b3f126d3-9f66-4bc9-980a-2c388a2dd7d9', 'f6473503-3e10-42d1-b34b-46961a7aa06e', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('622d429c-78c2-4c7a-9beb-ea308d2d5564', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d70f1ed1-386a-492d-bbd1-51a5ba8796ae', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('cb79e019-0b55-4415-8019-5d14dedf5a8e', 'c2d5793d-3be0-41ef-8a46-223964526eed', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c09c1303-79aa-4c95-a8f2-597ccb02c090', '6f5f0afd-80c1-4680-a773-555b22ec1501', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6ae7a0b2-88f0-4bd9-8e84-f04c466dd40f', 'cbd53302-961b-489b-95d5-dd15a09f186f', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('fc89c260-5ead-45c7-a848-95477b45ee2e', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('37f6eeb5-2283-4f99-b9d2-54f1c2bd52fa', '98531d68-eaae-42d1-a86f-02df0ac1a335', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f13fddb3-36ea-4d2d-9f93-90c4aa472aba', '21c80dce-e8e0-4053-8d51-d91e69296550', '32099647-abb3-4e40-8092-51e0617f0e73', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ac228aa2-a193-459a-ba54-7e017f9fcea6', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9211276a-fd5d-45c4-ba92-ba1b888f6bea', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9605ea86-ceee-4dc3-a6fa-adbda03d4c6f', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('730e144b-b76c-44fc-85d4-6acfce8d7f83', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6358af74-8406-4ac5-bb6c-d10abba8b049', '2155072d-d19d-4d78-97a9-f242e975bd94', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('047ec90e-0993-425a-a4c4-f8ac9822aeb1', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '32099647-abb3-4e40-8092-51e0617f0e73', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('37f46649-1588-4132-a44f-6888125160d4', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a17288e7-dd52-49c1-9213-0e1987f4cc1b', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3b7d3530-0e75-48c0-b4e2-0fea729aedff', 'c2d5793d-3be0-41ef-8a46-223964526eed', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('893cb3fe-a550-49ac-b721-1dafed0b9005', '6f5f0afd-80c1-4680-a773-555b22ec1501', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('37b75725-ef9f-408c-9327-95730d28fe6d', 'cbd53302-961b-489b-95d5-dd15a09f186f', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ea0fbd92-0969-4e6d-8a77-3afdb237f976', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9a7abde6-f27b-4870-b258-d62010a87144', '98531d68-eaae-42d1-a86f-02df0ac1a335', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f0230c05-3756-48ff-9e18-1494e7c3a170', '21c80dce-e8e0-4053-8d51-d91e69296550', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3059ec59-f09d-451f-8079-8797ce3f9aa1', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c24e6784-3b38-42a8-80fe-4339de429979', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('8d3d6cf7-4314-455b-9f39-2e380fde43b9', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7b4f4945-ba63-4c89-8a7d-09c3d346abef', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('75947bc2-46d3-49b2-adbd-626e46c259b4', '2155072d-d19d-4d78-97a9-f242e975bd94', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('813de233-7431-4d6e-913f-1bf2380c0761', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('cd2a2403-fdbc-43dd-b7cb-dca287bed4db', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2b2ee44d-92d4-48a6-afee-e78d824c5d6d', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('2ec09b05-9c91-4bd6-b840-b535d9dd4f94', 'c2d5793d-3be0-41ef-8a46-223964526eed', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('96b59823-0559-43d2-8e6d-6612d0f77cc9', '6f5f0afd-80c1-4680-a773-555b22ec1501', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d77fbaee-f381-4538-a729-6cd3919afcf7', 'cbd53302-961b-489b-95d5-dd15a09f186f', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1028638c-e122-480a-95af-bf1e77a6a02f', '6512f940-55df-4885-9cbf-f2021d7a9ac2', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c075a65d-387a-473e-924a-df14afb82352', '98531d68-eaae-42d1-a86f-02df0ac1a335', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ff238532-594b-4c97-abef-068e48f0fd50', '21c80dce-e8e0-4053-8d51-d91e69296550', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f4dba7fb-a068-435b-b819-0751be9006b0', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f6cde6ce-214e-4b22-8a16-ab56ab391197', 'bc3604cb-d1f8-49a5-8181-481d2345722e', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('4bf7d39f-3470-4dbf-bfb4-86eeaa8a8fcf', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1909df34-1a13-43c7-97af-97cf27956e29', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('75bb7312-5cd4-475c-a698-0d27b91d2637', '2155072d-d19d-4d78-97a9-f242e975bd94', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a595ed07-641e-45ff-973b-2c23f54b8581', 'f6473503-3e10-42d1-b34b-46961a7aa06e', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0f930bdd-7bbe-4c71-939f-ea5b949afa75', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a0e45778-bb9c-459f-b89f-b94d7db76d8c', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('67f2daa3-46ac-46b8-9114-de82d06baefc', 'c2d5793d-3be0-41ef-8a46-223964526eed', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f96c81c9-745f-4eb3-a0d5-8290a97c81bb', '6f5f0afd-80c1-4680-a773-555b22ec1501', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ed044c19-4aa3-4586-82c0-cd38b425f4e3', 'cbd53302-961b-489b-95d5-dd15a09f186f', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('4c1b41ed-9fe9-473c-b63a-e1f32caa5359', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('84b3d53a-b708-41fc-8626-3ccef61b89da', '98531d68-eaae-42d1-a86f-02df0ac1a335', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('55d73374-2b02-4b29-a522-5e6cfd2740ed', '21c80dce-e8e0-4053-8d51-d91e69296550', '178f851e-b54e-4627-be81-8644c8160ff7', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('5f66091b-9c1d-41eb-b0f0-3471c1bfea9d', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '178f851e-b54e-4627-be81-8644c8160ff7', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('35e5f74b-6a17-43a2-90af-57c9b67b500d', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1a85f0b6-8ecb-432d-813c-39d880e0f351', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1c324b88-cc68-4ccb-b28c-388ea31be3a3', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '178f851e-b54e-4627-be81-8644c8160ff7', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('484066eb-248a-42d7-bd32-3b5a351d917d', '2155072d-d19d-4d78-97a9-f242e975bd94', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1e3e7b3a-9dea-42b6-b0b9-16c1cbc233d5', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '178f851e-b54e-4627-be81-8644c8160ff7', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('77d59523-d272-4a50-bf2d-9699ca9348fc', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1be4295c-da35-4a38-bbf6-f5c6875b6fad', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '178f851e-b54e-4627-be81-8644c8160ff7', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('e40d6226-1772-4724-9712-dbcd617ed128', 'c2d5793d-3be0-41ef-8a46-223964526eed', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7cf10e3d-a79d-4dfb-b0cb-6610933ca209', '6f5f0afd-80c1-4680-a773-555b22ec1501', '178f851e-b54e-4627-be81-8644c8160ff7', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('47cd2d17-eaf4-421f-a7bc-ff9a164e7f85', 'cbd53302-961b-489b-95d5-dd15a09f186f', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c43e769a-f2b8-4f81-bce9-30dc8d9ddb30', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('5378142f-6d44-4491-8967-9615c27dd52c', '98531d68-eaae-42d1-a86f-02df0ac1a335', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('008c4b62-dcbc-42c2-b76e-7398aaf12493', '21c80dce-e8e0-4053-8d51-d91e69296550', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('1941cdc6-00fd-410e-94a1-70760d11760a', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('875a756f-2ef6-42a4-833c-a54984ba74dd', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('ca7d188e-757e-4214-ba33-6402202ce8a8', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('67a7c3b0-5fb7-44d6-a2f3-b06577719bd5', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('54afbd52-2cf0-45c2-b7f5-50eca338b79b', '2155072d-d19d-4d78-97a9-f242e975bd94', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('a93dcdef-a730-4769-acfb-400b1b83a0fe', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d694c575-248d-4d8c-8dcd-99639780852e', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('fe8563e8-de24-422f-9a93-cbc87f412c4a', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f9825792-867b-4334-b7a0-c7af83e3c960', 'c2d5793d-3be0-41ef-8a46-223964526eed', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('faa7e644-0927-4cb1-871d-fb4eee4894e4', '6f5f0afd-80c1-4680-a773-555b22ec1501', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('0152730c-620b-4bbb-ba5c-1a0cc31b9ebd', 'cbd53302-961b-489b-95d5-dd15a09f186f', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('585fabde-2af2-4bc1-88ce-523afed48b81', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d6bfc347-8da9-4e73-8eb2-404b67905506', '98531d68-eaae-42d1-a86f-02df0ac1a335', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('135ac8de-7b9e-448e-8513-365f1f45815f', '21c80dce-e8e0-4053-8d51-d91e69296550', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f8c5bcc4-9259-4ea0-b082-4db4f639cefc', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('5c78c7e1-9625-4779-aa14-bfe350be7332', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('bce358a7-a57f-4f70-8279-29451aceafbc', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c4a0d9ad-2b28-4281-a379-b5b2dad2017f', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7029274f-2d93-4b13-964e-60e625456056', '2155072d-d19d-4d78-97a9-f242e975bd94', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3cb71754-6e8a-402e-90b7-7bd5d541a39c', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('fcecc408-d93c-4902-a3ea-ffaa81c819c7', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('c7d95db4-bd8b-47dd-a4ca-02a3e983b4db', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('150b0ef8-2bbd-4e1a-9728-c7bc29011486', 'c2d5793d-3be0-41ef-8a46-223964526eed', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('305d7152-3379-4d8e-900f-4ede43aa0ad0', '6f5f0afd-80c1-4680-a773-555b22ec1501', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('876e9dd4-ff31-4676-8dd0-e366cc8d2914', 'cbd53302-961b-489b-95d5-dd15a09f186f', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 16.666666666666664, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('91d247ca-02cd-479f-afa3-b3462359eb2e', '6512f940-55df-4885-9cbf-f2021d7a9ac2', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('f2b7ff08-51a7-4fa1-a6ec-6c11ce77388e', '98531d68-eaae-42d1-a86f-02df0ac1a335', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('6c297c4c-556b-4924-bc4f-76338a67b5f8', '21c80dce-e8e0-4053-8d51-d91e69296550', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('3d78549b-2440-4586-9017-d8d298bd4366', '0504ea98-ceaf-49b4-b4f3-4e6944fadf3a', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('7d412a9d-3719-44a8-b860-c557d30dc863', 'bc3604cb-d1f8-49a5-8181-481d2345722e', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 100, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('95d4bb19-5f75-4a92-afa3-5f2e25b32f29', 'c4f52043-4b6a-4b77-a4d3-94b7091f044f', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('e9e8d4d1-4f3c-40bd-a390-ee6200d0b68a', '153e6a51-f3f8-4adb-a270-e3a91e7d1a8f', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('9e9fb889-dfca-4292-a736-e2844b6aad42', '2155072d-d19d-4d78-97a9-f242e975bd94', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('12057a05-ffec-46a3-be51-15db6e17cea7', 'f6473503-3e10-42d1-b34b-46961a7aa06e', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('dbf077cc-14bd-4977-98a2-66863214dc7c', '5cdf4bd6-ab9f-453c-927f-17b489ddf5fd', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('bbf93d42-250f-4dad-be5f-82c5d08ae91d', 'b9253d23-ab63-4878-94a2-8b461a6ae06e', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('d1e16a7b-9e4e-4a72-8596-f833fdab6200', 'c2d5793d-3be0-41ef-8a46-223964526eed', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 50, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('db0f0806-fc41-4ede-a2d6-46ca06419e7a', '6f5f0afd-80c1-4680-a773-555b22ec1501', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('62c5ac54-256e-49c6-a30a-04fd86df304c', 'cbd53302-961b-489b-95d5-dd15a09f186f', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:54:05.709923+00', '2025-09-28 15:54:05.709923+00'),
	('33686515-ebeb-4338-9768-d6a85174891c', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 14, 93.33333333333333, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('4ba73acc-80be-4260-b4f0-70bcfb105d54', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '94c6b87d-2012-4241-8e93-1485435cf1f0', 14, 93.33333333333333, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('f3ca2d5a-28a1-48a0-a2ff-932460c4efb7', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 13, 86.66666666666667, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('f40bd0cc-9867-4b01-b504-84c38b501ed2', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 13, 86.66666666666667, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('0076f5da-f8eb-4fbd-9ee7-caad0f18cd4f', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 12, 80, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('df78d2ba-d56c-4e01-be75-09c320016477', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '70e83404-b607-442e-a3ce-0da79b4fe250', 12, 80, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('6f0584e9-a7d8-40ad-b6fc-d89236ef8a59', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '90b88e34-568b-4079-ad9a-de5c84b30d53', 11, 73.33333333333333, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('cbde863a-a13e-4c1f-bcaa-1ae0d802139c', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '2961b233-b486-44a2-a07e-973eb0551103', 10, 66.66666666666666, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('c4e44d43-a8dd-43d7-874d-2aae3e2d8994', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 10, 66.66666666666666, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('750bab0c-6055-4349-9725-34955816c370', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '9f00e5c5-3642-417a-97c7-39de49edf489', 10, 66.66666666666666, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('e700ac07-6f01-4481-aecb-740724aada60', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 9, 60, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('a7e2d615-0b0f-4850-9b34-bda14ff147ce', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '95ebf67e-473c-4407-a007-1f12ec793754', 8, 53.333333333333336, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('eafcec3f-38e2-4e57-9505-0599c500d612', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', 'e8a3804a-952e-45a8-bdd5-96800054db68', 8, 53.333333333333336, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('fcac294a-6165-4f8c-88e5-3f6a39897ac5', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '32099647-abb3-4e40-8092-51e0617f0e73', 8, 53.333333333333336, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('866f7e07-c738-48e2-8f3c-bd2255d574dc', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 7, 46.666666666666664, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('c97d8d7b-1985-46b4-bdc6-620bd11e28b8', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '178f851e-b54e-4627-be81-8644c8160ff7', 6, 40, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('11b09b3b-059b-45a3-96c2-50db1fd09f07', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 5, 33.33333333333333, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('a86eb9ab-2e41-4ea9-8f52-eb40e850ed46', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '1d804ec7-9693-42a1-830c-dc12efac1d83', 5, 33.33333333333333, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('5a90c0ae-f7e2-4f57-ae46-f043c597cad8', '57bef7a2-cd6e-40ac-a783-5a636873b3b1', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 4, 26.666666666666668, '2025-09-28 16:42:19.288007+00', '2025-09-28 16:42:19.288007+00'),
	('41da5186-0582-4f8a-a981-84630fda6c1e', '8b429493-bbb8-4cd2-8553-14892807b417', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d59ad11f-467a-44d4-875c-b98fd4a5cced', '2954fbb7-1504-465f-bca7-172aa099141d', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0409f09a-b529-4f96-b644-a103ad6ca45a', '215ed370-99d4-4d86-932a-6132c526a621', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('afdd33cd-f6d4-4586-9ab3-54c7c5c92afe', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5a08ed46-3cb3-45e4-b382-6f97ed93cd64', '2005fa19-e689-42ca-bc73-f45777dd2c34', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('2f2bee06-72ba-4cc1-882e-2c96df806c09', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('c9599653-7601-4282-b7e0-b02e235c9886', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8e74d87c-d579-45f7-abbf-f6f9fb80e5d4', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('397ebb5d-8f6d-4154-9389-cf45eb995f52', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d99edf64-c3d3-4554-a223-a7e77521a596', '00ebad6c-4e9a-4012-a69e-2f38daa64876', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 4, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('aefd0939-e71e-42d7-85c3-bf8f3e93b4a5', '8b429493-bbb8-4cd2-8553-14892807b417', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('283025a0-796b-45ba-b27f-1e03a9102269', '2954fbb7-1504-465f-bca7-172aa099141d', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('377a8821-9b7c-461b-9350-c02dd73b0891', '215ed370-99d4-4d86-932a-6132c526a621', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0cce51ef-d692-433d-8920-dcc44ef335e7', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('998d5f2c-70ba-4503-bcf5-87cd4e838880', '2005fa19-e689-42ca-bc73-f45777dd2c34', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f6ed5e04-accf-47c4-b437-b71453cfedb3', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '94c6b87d-2012-4241-8e93-1485435cf1f0', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f56dc2ad-d8ef-4dfa-aa36-dd3328eb9dce', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('1e2c4e79-bbb2-4bb3-84b2-67e4ed8e492d', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d71b2d7e-773b-4e96-8c5e-f57008b6bfa5', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '94c6b87d-2012-4241-8e93-1485435cf1f0', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('48a94731-8320-422c-a6b1-f28f356a4d90', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '94c6b87d-2012-4241-8e93-1485435cf1f0', 3, 75, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0a8a87a5-7d34-4be7-a342-dba13e660093', '8b429493-bbb8-4cd2-8553-14892807b417', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d9d4db37-f3c7-445b-a6ae-6423bf217459', '2954fbb7-1504-465f-bca7-172aa099141d', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ee9d6e18-11ce-4c90-aae7-b02644bc0e85', '215ed370-99d4-4d86-932a-6132c526a621', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a2d702b5-a3f0-4672-be69-d91d06000c2a', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('6bab7341-7803-471d-9f55-8b5b8ea49808', '2005fa19-e689-42ca-bc73-f45777dd2c34', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('24e7433e-4b33-4a59-8533-f6b233f095ca', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ccaea97c-c037-481b-8cc4-1c2f0885ce48', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4e3d07ef-5140-4dec-bc0c-ef5148da2aed', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('c042500d-b5d1-4fd4-a8c7-98527adc86f4', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('1e0ca9ab-642a-45a8-9da0-fa3a81125f80', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 4, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('368a5e3f-af8f-46b7-a5cc-6f0be20d8410', '8b429493-bbb8-4cd2-8553-14892807b417', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('899ab3bc-bcf3-4883-b783-05ae6f886719', '2954fbb7-1504-465f-bca7-172aa099141d', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a26a48e3-673d-4c2b-9603-5fc3cb0f7937', '215ed370-99d4-4d86-932a-6132c526a621', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d3e4b7da-3976-4849-b4db-df1c02277c47', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('1554819e-96b7-4166-9247-75c9aeebf189', '2005fa19-e689-42ca-bc73-f45777dd2c34', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d52deb9d-be9b-4c4c-8f2d-250805cbfa96', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('9d3909de-9ac9-4a4f-a705-451907ef8d44', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f2002fa0-df26-4093-9d4d-5f3cfec58d14', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5ff5bc3a-aef6-4853-929f-41dc253828c8', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b37d1299-9155-45e1-b275-a0868d340bfa', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 3, 75, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5c1ceac7-ffc5-4be5-9bba-d133fba87d58', '8b429493-bbb8-4cd2-8553-14892807b417', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('60cf2d5f-9330-44b8-af40-01540f726e83', '2954fbb7-1504-465f-bca7-172aa099141d', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4652a869-d5aa-40d5-9bf2-43cc72e8fdff', '215ed370-99d4-4d86-932a-6132c526a621', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('e3009fe3-1b26-4176-a943-c469a7417a61', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f265fc9d-e8bd-4764-94f4-3bb31d751c5f', '2005fa19-e689-42ca-bc73-f45777dd2c34', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0fc8b3e6-3780-4487-8e46-5bf7030a52d4', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('1dd75620-a2bb-4dd6-8254-52032930ca60', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8f2229e9-490f-47ce-9cb1-302158813fe1', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('fe2779df-734d-458e-a342-e44e8492ab0a', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b054814c-fb90-4933-b9df-1c1d36494dca', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 3, 75, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('dbe01a1f-18ed-46c8-a5df-ad0b1b35aa4c', '8b429493-bbb8-4cd2-8553-14892807b417', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('80c3979d-ab89-40ce-b26f-65d284f471e1', '2954fbb7-1504-465f-bca7-172aa099141d', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('035c360c-0850-4727-929e-94a2f1b454f2', '215ed370-99d4-4d86-932a-6132c526a621', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d42b8a64-e28f-4564-ada8-d37e8f3f808d', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a7e8147a-8049-41fd-861f-041b539037f5', '2005fa19-e689-42ca-bc73-f45777dd2c34', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('c30ac915-0109-4d21-966d-d9607d671203', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('13c5ccd6-cbf7-4c48-ae8f-eaee8397c84a', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('c5c3a0a2-d048-4d86-8073-a2408bd3f4dc', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '70e83404-b607-442e-a3ce-0da79b4fe250', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0b6cd316-c208-4ab3-b3e4-7866d3bf3634', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '70e83404-b607-442e-a3ce-0da79b4fe250', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('807e114e-031c-4535-ab69-db257b16ab72', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '70e83404-b607-442e-a3ce-0da79b4fe250', 3, 75, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('bac62995-1e27-43f9-a6e1-9326d00d8bad', '8b429493-bbb8-4cd2-8553-14892807b417', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7435d76c-d954-44fa-80ac-b1d3f45c02a2', '2954fbb7-1504-465f-bca7-172aa099141d', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('9dd60610-21da-4631-8622-030096502d43', '215ed370-99d4-4d86-932a-6132c526a621', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ce134500-d49d-4559-aaad-454ddee97fa2', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('76d9ca0e-a9fd-4449-9fa6-9e26c6a70e40', '2005fa19-e689-42ca-bc73-f45777dd2c34', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d0960265-1155-4d7d-842c-497a9aa60a70', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('32879764-6d28-44b1-95b7-a4c3602acce5', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('eeabce38-31f7-4c00-bb38-959675c4a4f1', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '90b88e34-568b-4079-ad9a-de5c84b30d53', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('eba06d30-b593-48f1-983b-d92bee3c9fe6', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '90b88e34-568b-4079-ad9a-de5c84b30d53', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('44297970-4fb2-429d-bd5f-ebcfb7b0df01', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '90b88e34-568b-4079-ad9a-de5c84b30d53', 3, 75, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('9547c678-edce-4e49-9e3f-500ed48520b4', '8b429493-bbb8-4cd2-8553-14892807b417', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('68ef5bc9-07d7-4055-8d02-633f9e5563f0', '2954fbb7-1504-465f-bca7-172aa099141d', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('2d58dc8a-f384-4e6e-a94b-a0e7f32f31f3', '215ed370-99d4-4d86-932a-6132c526a621', '2961b233-b486-44a2-a07e-973eb0551103', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('864f29b7-4038-4fad-89c0-f4341b70954b', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '2961b233-b486-44a2-a07e-973eb0551103', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('511056af-7ed1-4b97-b4ec-6969f9093724', '2005fa19-e689-42ca-bc73-f45777dd2c34', '2961b233-b486-44a2-a07e-973eb0551103', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('e54f0abe-506c-4768-99a5-3a7bce42af0f', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '2961b233-b486-44a2-a07e-973eb0551103', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('52a896c7-7353-4173-a097-eadd0adaba4b', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '2961b233-b486-44a2-a07e-973eb0551103', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('58ad7463-5a7a-40c7-8964-d41cb75512ee', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '2961b233-b486-44a2-a07e-973eb0551103', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('dbab068a-67f6-4577-ba7e-6911178b066d', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '2961b233-b486-44a2-a07e-973eb0551103', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('478e2b1b-4e5e-429c-b7d1-63fcaf72f58b', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '2961b233-b486-44a2-a07e-973eb0551103', 3, 75, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('06bcb712-59cc-4df1-b9ba-c9d645d9393c', '8b429493-bbb8-4cd2-8553-14892807b417', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8a0f3383-1ddd-46f2-baef-da0776c457b9', '2954fbb7-1504-465f-bca7-172aa099141d', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8e95cd39-c834-42e2-98f3-8d97e8314ef6', '215ed370-99d4-4d86-932a-6132c526a621', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0c1506bd-ed6d-4a1b-94f4-e477713f0dd8', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4e4f57b8-f9e5-4971-bbbb-3412ca021e72', '2005fa19-e689-42ca-bc73-f45777dd2c34', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a55ecbd1-53b6-432f-997d-d1797bfa66c4', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4b801908-1849-4bd5-9ddc-c46c6ba92a15', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ac5ca2cc-f4d9-43af-a3aa-48550d800c4b', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ec40c17f-3be6-4445-895c-f30c19b4271e', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('73456252-fcfe-407a-9583-2678703a2e56', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 3, 75, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('bbf9c406-0b6f-4152-8af9-ee58b6a202de', '8b429493-bbb8-4cd2-8553-14892807b417', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('1da51ee3-c3d4-4bac-9f0b-becc4bdb72f5', '2954fbb7-1504-465f-bca7-172aa099141d', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('73464f9f-757c-4074-b40e-cb12c382ef4a', '215ed370-99d4-4d86-932a-6132c526a621', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f6a5dcd6-4a33-4c3d-9e19-90f9e520dbeb', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0c24299b-2ccd-41d4-adaa-8f57a0d2b2d2', '2005fa19-e689-42ca-bc73-f45777dd2c34', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('47620539-27e2-43d8-9357-8d793b99bf0f', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('6907a9b8-2a3c-4a78-8b11-637af63a376d', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8be893c4-cf7e-446c-be5e-3c933e5804d0', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8d2ec27b-0a49-4214-a7cc-ca8b9cd82e98', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('3a589b9c-b96c-497d-9319-14a20706a6e8', '00ebad6c-4e9a-4012-a69e-2f38daa64876', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4a11e62d-0de2-4468-83fe-23d4d40e5b93', '8b429493-bbb8-4cd2-8553-14892807b417', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('6bc1f165-9cf2-4a09-be6f-4952a3004333', '2954fbb7-1504-465f-bca7-172aa099141d', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('25396b52-a5f1-4062-bf43-28caef8f0017', '215ed370-99d4-4d86-932a-6132c526a621', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8930f269-e519-4c95-a38b-a19ec0faca79', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('78869449-86a8-42f1-b24f-f40b9218e3e6', '2005fa19-e689-42ca-bc73-f45777dd2c34', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('267bdfc6-27a5-4458-bb1b-046db43ee610', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4a5c6c62-6b73-4d50-b504-7b83c9cce853', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('bce1bcdc-953d-4c34-9351-7b3f1486a260', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '9f00e5c5-3642-417a-97c7-39de49edf489', 2, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('0b8ac6a5-0bb1-4fc3-bf63-b02f70f11e33', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '9f00e5c5-3642-417a-97c7-39de49edf489', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('60b2f897-d4a7-45a1-b645-0a3450599d76', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '9f00e5c5-3642-417a-97c7-39de49edf489', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b3371626-62a6-4901-a681-443fc482e9af', '8b429493-bbb8-4cd2-8553-14892807b417', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7a809b81-4408-4992-94c0-103c42c67c18', '2954fbb7-1504-465f-bca7-172aa099141d', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('604eb7d5-6d7f-47d2-b424-0ee3406cb4f3', '215ed370-99d4-4d86-932a-6132c526a621', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5c1ff475-680e-42ff-8d26-daec234338d0', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5938de77-aa5f-4f86-8cde-86ea57232eab', '2005fa19-e689-42ca-bc73-f45777dd2c34', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('73d2709e-e462-40fb-afcf-f19af4740420', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('8ca5a114-6e7c-492c-b9e3-59e279d7abb6', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ca793ada-053e-4535-848a-472cfb31680d', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a789cc4c-40ab-4f61-b0ec-ae78bc5cf211', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d3f77b30-6345-45f7-865c-dca24239635a', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('36279b68-1d33-4994-b550-9f4a14e284c7', '8b429493-bbb8-4cd2-8553-14892807b417', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('30940077-9b77-4105-b79c-2b2219671150', '2954fbb7-1504-465f-bca7-172aa099141d', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('75b44eb8-e6b2-4a02-ac9e-3bfb49cdd80e', '215ed370-99d4-4d86-932a-6132c526a621', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('157ca55b-8c87-425d-aa42-abec398a99cd', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('bfcc5fa5-1528-4858-8f2d-0c86c44e4d3c', '2005fa19-e689-42ca-bc73-f45777dd2c34', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('83f5b754-829a-4721-9d82-3cd8af15bc8c', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b99102ec-5201-4888-aacc-677dcc5f6467', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a854eaf3-a247-4a3b-92e0-5db50d9e7ef9', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('dbfa8ed4-a6d7-4d54-ac08-dbb49ae47d91', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '95ebf67e-473c-4407-a007-1f12ec793754', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('c39c23f0-e468-4c3a-9acc-21e38823bdc5', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '95ebf67e-473c-4407-a007-1f12ec793754', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('1b918a15-65a1-4a97-9624-5681538ebc70', '8b429493-bbb8-4cd2-8553-14892807b417', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b9fcb64a-5d23-4918-a2ed-dda34210d0cd', '2954fbb7-1504-465f-bca7-172aa099141d', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d0110e52-4a05-4785-964e-77ca361ab48f', '215ed370-99d4-4d86-932a-6132c526a621', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('01ff5f36-591e-441b-9172-6b187ffdec21', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('c4f7e444-4b42-4238-988c-37340f373446', '2005fa19-e689-42ca-bc73-f45777dd2c34', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4c7aa6ae-d87e-43d7-aa50-800be2375306', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('58c45eee-e357-45ec-95fe-be00b60b6d1b', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('e7946b8e-ef99-4791-8f65-de6b1cb6a64b', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('9e4e9559-2911-4877-94b2-a861dcf3d495', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', 'e8a3804a-952e-45a8-bdd5-96800054db68', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b0f09754-883f-4fe2-8fb8-1c45160b402a', '00ebad6c-4e9a-4012-a69e-2f38daa64876', 'e8a3804a-952e-45a8-bdd5-96800054db68', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('deb11172-9cf5-4b0e-871a-6ccba21f0a7f', '8b429493-bbb8-4cd2-8553-14892807b417', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('67767485-8800-4dc1-b11c-875102a28ad6', '2954fbb7-1504-465f-bca7-172aa099141d', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4d61f0d8-ee4d-4944-8ab2-5f1da73461bf', '215ed370-99d4-4d86-932a-6132c526a621', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f094a454-9918-46ee-b733-27c50d50a1cc', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('39185322-0401-4e5e-8d92-da2cc69b891b', '2005fa19-e689-42ca-bc73-f45777dd2c34', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('25febf57-1afc-420b-8022-89c347723448', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('09607d23-e888-4b0d-b434-9f714738eed6', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b45d86d2-554f-4abe-9562-d9691a0bab1f', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7813f85c-c9bb-4136-8593-1357dcc4c205', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '32099647-abb3-4e40-8092-51e0617f0e73', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7a966af5-f0bb-4d0b-98f8-5d4a6ed6d85e', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '32099647-abb3-4e40-8092-51e0617f0e73', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7bba1042-82ce-44ef-be60-091031f7062e', '8b429493-bbb8-4cd2-8553-14892807b417', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f4f813d3-8e3e-4c30-9db3-d44c90201b0a', '2954fbb7-1504-465f-bca7-172aa099141d', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b297692c-6a0a-4ae0-969e-5272b8c8f525', '215ed370-99d4-4d86-932a-6132c526a621', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('1733717a-a0dc-4808-8d58-763fa79811ff', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('33d0fd3c-f07a-4c68-9651-0dd950644666', '2005fa19-e689-42ca-bc73-f45777dd2c34', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('184a809f-ad96-4c37-8f3e-decb6dac9348', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('43ef88a1-eb11-4dca-8ea0-f702278672e8', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('674b72d7-ec3e-49c5-a30d-bf3c86cf2e43', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('90010788-4445-4216-97ba-b0042d1d292d', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ea313c67-9f49-4dec-b56a-c8ecd2b1e41e', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('83c3cf68-f30f-4763-bf57-658c240d206a', '8b429493-bbb8-4cd2-8553-14892807b417', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('586b6277-c47e-434f-a529-e39370e370bd', '2954fbb7-1504-465f-bca7-172aa099141d', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('b4d1283c-feba-4dcd-acad-e3d7f46e0672', '215ed370-99d4-4d86-932a-6132c526a621', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('88ea179a-5ae3-4ca5-a1a5-775b10f0de7a', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a334bfa6-b034-4d8c-b284-c4703ac21c50', '2005fa19-e689-42ca-bc73-f45777dd2c34', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('e4fe7dac-d00a-4427-88d1-9d51487ec249', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('465f25b0-b5d9-4b54-8316-03e1d7c2411a', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4da03c26-0345-4946-ac8a-9d865a8d9a17', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('381c15a9-635f-47ed-a039-27dbea486d8d', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5e39fc7b-cc4b-4e38-9dcd-c3cecd3942c4', '00ebad6c-4e9a-4012-a69e-2f38daa64876', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('89013769-c801-47d9-9696-97f14ebbfeeb', '8b429493-bbb8-4cd2-8553-14892807b417', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('ac3a1462-c133-46ab-b2f1-dcfb4c75dbaa', '2954fbb7-1504-465f-bca7-172aa099141d', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7f20f724-3dba-4464-952b-98130a302e08', '215ed370-99d4-4d86-932a-6132c526a621', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('e28685f4-f7c0-41e5-b165-fb6ea841effe', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('364e45db-35ad-46f4-9bb2-376aa50a913f', '2005fa19-e689-42ca-bc73-f45777dd2c34', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5f1dbd88-20c9-41bc-b1ec-996c338bd5c7', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '178f851e-b54e-4627-be81-8644c8160ff7', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('23971a61-c1f2-470a-b04e-85eee33d89ec', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('e8a4d1fa-a102-43f1-b476-bf9e6b2dd0d4', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f75388a6-8096-4170-9f97-ed21d4110e29', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '178f851e-b54e-4627-be81-8644c8160ff7', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4f32a417-9306-49ad-ac22-5c56e9a6efcc', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '178f851e-b54e-4627-be81-8644c8160ff7', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('83e6b5a3-f220-4a9e-a38b-b5d9011f3cb9', '8b429493-bbb8-4cd2-8553-14892807b417', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('9b3be25e-cf80-4946-beb7-7642e09ce8be', '2954fbb7-1504-465f-bca7-172aa099141d', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('2a8a5cb0-d89f-47c3-89eb-b79f67440e68', '215ed370-99d4-4d86-932a-6132c526a621', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7f56147a-37b5-4a3f-af94-b26da68fea86', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a3b60412-2527-4932-bdd6-4349df0ba310', '2005fa19-e689-42ca-bc73-f45777dd2c34', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a7560906-a06b-48af-98a9-f497c31d28be', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f78a89d2-329f-4bf3-ae2d-a286a5802321', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('d5eaf220-df92-4222-9e28-71849a16ca66', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('86fd74c0-5b68-4e82-9c7e-e9000674f4cf', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('6f0fa928-b16b-4c31-9a06-0a21da268d97', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('98e67685-b4f1-4d57-94d9-8b9e71eb07ae', '8b429493-bbb8-4cd2-8553-14892807b417', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('f189e805-a876-4ecd-b7ca-e89bbffc7a21', '2954fbb7-1504-465f-bca7-172aa099141d', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('bcca91fb-cae2-46fa-9285-de0192669515', '215ed370-99d4-4d86-932a-6132c526a621', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5c02d42c-18b6-40e2-96b6-b4e151bb1956', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('7954c4e8-6d86-49ec-8181-046eb5862d2f', '2005fa19-e689-42ca-bc73-f45777dd2c34', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('62137995-03e6-4976-afcf-42eb74dab8de', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('5df4859a-9dc4-4bbe-851f-d9792442c7b2', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('35eb6b25-6c42-4b11-b598-791b1a59c637', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '1d804ec7-9693-42a1-830c-dc12efac1d83', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('26b7436c-25d3-4a82-a1b9-c84f56622083', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '1d804ec7-9693-42a1-830c-dc12efac1d83', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('2654d155-cdab-4088-bf0a-5a5f741f0c61', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '1d804ec7-9693-42a1-830c-dc12efac1d83', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('4d0cfe1f-8208-4309-8b45-14741e521912', '8b429493-bbb8-4cd2-8553-14892807b417', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('081fe50a-6f51-46e2-91d3-5cde4f2dec06', '2954fbb7-1504-465f-bca7-172aa099141d', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 100, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a482c3cd-b4b5-496b-9793-9d4836a7eaa0', '215ed370-99d4-4d86-932a-6132c526a621', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('474aa8e0-bf29-4c62-add6-acab5b57c26f', 'c32faa2c-9f2c-4b05-b144-a5656da8b3eb', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('e4cbbdf7-9b1f-47b0-97af-b310e1d6adad', '2005fa19-e689-42ca-bc73-f45777dd2c34', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('6fd60fef-598b-4c70-b070-c689dc382c8e', '471f3045-1c9b-46ab-8c0c-20cc98eba75c', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('a4f09c15-84fe-4d0c-8658-3af5597e6bdf', '784dc31c-9e2f-4ea9-b5fd-d6bf7aba652f', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('30f0f980-35c5-4ac9-92d6-59ca0fdc1822', 'ba95a243-d34f-4757-9f7f-e8ae6c6cd90a', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 1, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('35975aec-ef51-4f88-ba7d-2d85a9453d07', '4f5bb13b-84f3-44a9-bede-144c29d88fc5', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 0, 0, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00'),
	('76621057-9f36-4226-a65d-fb51f0433ff9', '00ebad6c-4e9a-4012-a69e-2f38daa64876', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 2, 50, '2025-09-28 15:52:50.33175+00', '2025-09-28 15:52:50.33175+00');


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."results" ("id", "student_id", "task_id", "raw_score", "percent_score", "normalised_percent", "feedback", "created_at", "updated_at") VALUES
	('12625224-eac8-46b0-86ab-2e6c9d01a59f', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 19.00, 100.00, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('ca60ae27-6011-4537-ab29-aef7bdcddb35', '94c6b87d-2012-4241-8e93-1485435cf1f0', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 18.00, 94.74, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('27ef0f27-be3b-451b-a7f7-d63c306e4d87', '5fa382fe-f310-420c-b0af-1793dcb6aa38', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 18.00, 94.74, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('a9845e21-cb29-474b-aaa3-0aeb8eb14852', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 17.00, 89.47, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('03bdfef0-b8f0-43b7-8c26-71acaf0d532d', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 18.00, 94.74, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('2c6d33b4-a0c9-4e50-9898-32b949b49945', '70e83404-b607-442e-a3ce-0da79b4fe250', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 16.00, 84.21, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('e7364382-5307-4fc9-ad97-09e1db6332f7', '90b88e34-568b-4079-ad9a-de5c84b30d53', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 16.00, 84.21, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('f07bcd3a-023d-4c1c-96bb-b8347b38e23b', '2961b233-b486-44a2-a07e-973eb0551103', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 15.00, 78.95, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('5bbdbf6e-bc19-4a8e-8b0a-cc3e031da7eb', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 15.00, 78.95, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('8633f71f-b6e8-4dbf-9c00-882c9bdff558', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 12.00, 63.16, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('54fe63bb-d45b-403f-a282-211b96cf63c4', '9f00e5c5-3642-417a-97c7-39de49edf489', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 12.00, 63.16, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('13c7378c-4f7c-4ac9-af31-dff11a844180', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 11.00, 57.89, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('faf37173-fca1-4dee-b616-18e463a4590a', '95ebf67e-473c-4407-a007-1f12ec793754', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 11.00, 57.89, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('5bfcf85e-9d06-4552-a368-e021f9422cec', 'e8a3804a-952e-45a8-bdd5-96800054db68', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 11.00, 57.89, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('c787b19d-4fd2-48ab-8886-4145f8a6d20b', '32099647-abb3-4e40-8092-51e0617f0e73', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 11.00, 57.89, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('468c8163-6c02-49ce-9c7a-92544a6ecc47', '74f8992e-96f2-4b0a-b42d-09d00564cba1', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 10.00, 52.63, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('f4dc729a-6c1b-4b09-ab8c-b03d3ad8e80d', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 10.00, 52.63, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('88c28cae-ac2f-4597-9600-67abaab10cbd', '178f851e-b54e-4627-be81-8644c8160ff7', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 10.00, 52.63, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('033a09fe-de40-4711-9a22-96939ab99b76', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 9.00, 47.37, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('f362f82b-b666-47cd-86ba-a83064469e8f', '1d804ec7-9693-42a1-830c-dc12efac1d83', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 8.00, 42.11, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('09e431cb-860f-489d-894e-8eeef405a311', '19f2b329-2846-4486-b4c6-d224c9c0a99c', 'd59271d2-1db2-47bb-a3ed-40431a0a95ec', 8.00, 42.11, NULL, NULL, '2025-09-28 15:52:50.358677+00', '2025-09-28 15:52:50.358677+00'),
	('94f68c60-c572-4d36-8f17-3afdb4157606', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', '2bfa35e4-158f-491a-995d-c1316404d31f', 21.00, 84.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('db56aa14-ab03-4739-b866-6ff40f15b78f', '94c6b87d-2012-4241-8e93-1485435cf1f0', '2bfa35e4-158f-491a-995d-c1316404d31f', 21.00, 84.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('ca921257-38d1-4ee3-bebc-35c5d9ca61d5', '5fa382fe-f310-420c-b0af-1793dcb6aa38', '2bfa35e4-158f-491a-995d-c1316404d31f', 20.00, 80.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('ee6aea8f-935b-4ab9-8293-24e5301bbe68', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', '2bfa35e4-158f-491a-995d-c1316404d31f', 20.00, 80.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('7d2a92b9-c8cb-4831-afb1-46b04f079761', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', '2bfa35e4-158f-491a-995d-c1316404d31f', 20.00, 80.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('459cf482-454a-4638-a944-3aa2d5be7c29', '70e83404-b607-442e-a3ce-0da79b4fe250', '2bfa35e4-158f-491a-995d-c1316404d31f', 19.00, 76.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('aa57b208-41f2-444d-95a2-b943b3d590bc', '90b88e34-568b-4079-ad9a-de5c84b30d53', '2bfa35e4-158f-491a-995d-c1316404d31f', 18.00, 72.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('2d615406-96ee-4bfd-87c1-07ac0fb13d81', '2961b233-b486-44a2-a07e-973eb0551103', '2bfa35e4-158f-491a-995d-c1316404d31f', 18.00, 72.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('7d37e1c3-be41-4ef5-a45f-1163a0c8065e', '1d236809-bf9d-4f17-b1cf-ab06a1081ffe', '2bfa35e4-158f-491a-995d-c1316404d31f', 18.00, 72.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('e3fc3d0d-4a35-482f-9479-e59f71bdaede', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', '2bfa35e4-158f-491a-995d-c1316404d31f', 16.00, 64.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('ca9c116a-25ae-45b8-a9a8-891f975aa862', '9f00e5c5-3642-417a-97c7-39de49edf489', '2bfa35e4-158f-491a-995d-c1316404d31f', 16.00, 64.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('99f002ee-0436-4c26-b898-c149069bfc37', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', '2bfa35e4-158f-491a-995d-c1316404d31f', 15.00, 60.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('5f9aea70-3c84-46d8-b447-7cd194f127d7', '95ebf67e-473c-4407-a007-1f12ec793754', '2bfa35e4-158f-491a-995d-c1316404d31f', 14.00, 56.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('fb9a42b9-7385-4e0e-bd4a-d520482bb3d2', 'e8a3804a-952e-45a8-bdd5-96800054db68', '2bfa35e4-158f-491a-995d-c1316404d31f', 13.00, 52.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('c8fe229b-a49f-4eba-a080-b881dd2dba9e', '32099647-abb3-4e40-8092-51e0617f0e73', '2bfa35e4-158f-491a-995d-c1316404d31f', 12.00, 48.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('39f99210-3b83-4355-8c9d-8d74e0907aec', '74f8992e-96f2-4b0a-b42d-09d00564cba1', '2bfa35e4-158f-491a-995d-c1316404d31f', 9.00, 36.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('6c9dda48-81c0-4a1b-abb1-3eaa352bf696', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', '2bfa35e4-158f-491a-995d-c1316404d31f', 8.00, 32.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('32f3080e-5bab-46bc-8094-e573ed2be59d', '178f851e-b54e-4627-be81-8644c8160ff7', '2bfa35e4-158f-491a-995d-c1316404d31f', 8.00, 32.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('b2bac2f0-a371-4e11-a839-a09361ce8df8', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', '2bfa35e4-158f-491a-995d-c1316404d31f', 5.00, 20.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('41c3f1fa-49e8-4071-ae51-07e29dce96d0', '1d804ec7-9693-42a1-830c-dc12efac1d83', '2bfa35e4-158f-491a-995d-c1316404d31f', 5.00, 20.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('d66909a3-f23e-4c31-a070-d0cf2a46379b', '19f2b329-2846-4486-b4c6-d224c9c0a99c', '2bfa35e4-158f-491a-995d-c1316404d31f', 3.00, 12.00, NULL, NULL, '2025-09-28 15:54:05.748078+00', '2025-09-28 15:54:05.748078+00'),
	('a7b9ac60-d0b3-42c4-a520-efcb4399dad4', 'ebe0b582-b4ab-471a-a071-11fb2e1b3714', '3efe1e39-5494-447e-ac9f-71ada5467715', 14.00, 93.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('1ec849a1-41c2-4982-8aab-5977ef506209', '94c6b87d-2012-4241-8e93-1485435cf1f0', '3efe1e39-5494-447e-ac9f-71ada5467715', 14.00, 93.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('2fb96e44-1a01-43ea-b3e1-dd11d354a7e1', '5fa382fe-f310-420c-b0af-1793dcb6aa38', '3efe1e39-5494-447e-ac9f-71ada5467715', 13.00, 86.67, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('aff3656b-ff66-4515-890f-7831bae921a3', '1ffc8c3d-1ac0-471c-a61e-01a8e0f62220', '3efe1e39-5494-447e-ac9f-71ada5467715', 13.00, 86.67, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('d015c356-1dea-47d0-a9b5-035ab91eba9d', '616f4ad7-42e8-4079-aefc-faa74b5b6dcd', '3efe1e39-5494-447e-ac9f-71ada5467715', 12.00, 80.00, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('ce03c970-7c0d-420d-a69f-084806d7120e', '70e83404-b607-442e-a3ce-0da79b4fe250', '3efe1e39-5494-447e-ac9f-71ada5467715', 12.00, 80.00, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('d86371d0-7b62-4f1d-9b2f-2e7522d35268', '90b88e34-568b-4079-ad9a-de5c84b30d53', '3efe1e39-5494-447e-ac9f-71ada5467715', 11.00, 73.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('480549d9-8b49-4b4d-bfa3-a7257f32e55f', '2961b233-b486-44a2-a07e-973eb0551103', '3efe1e39-5494-447e-ac9f-71ada5467715', 10.00, 66.67, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('e40007e0-7be1-448e-b4bc-104adcced9a4', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', '3efe1e39-5494-447e-ac9f-71ada5467715', 10.00, 66.67, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('ca8812c1-7e29-4b5b-9f9c-2176dc1b2d83', '9f00e5c5-3642-417a-97c7-39de49edf489', '3efe1e39-5494-447e-ac9f-71ada5467715', 10.00, 66.67, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('73bf2d10-deb0-4bf3-9118-61918f424a62', '5e601404-8f48-4d79-ad84-3e07be0c4fa6', '3efe1e39-5494-447e-ac9f-71ada5467715', 9.00, 60.00, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('f13fc205-daf0-4904-99c5-616e5346de05', '95ebf67e-473c-4407-a007-1f12ec793754', '3efe1e39-5494-447e-ac9f-71ada5467715', 8.00, 53.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('41ed3ca5-8b61-4728-a545-4b84f9952d87', 'e8a3804a-952e-45a8-bdd5-96800054db68', '3efe1e39-5494-447e-ac9f-71ada5467715', 8.00, 53.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('66395a9a-2eec-4505-95a5-66917b7de9e2', '32099647-abb3-4e40-8092-51e0617f0e73', '3efe1e39-5494-447e-ac9f-71ada5467715', 8.00, 53.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('4e62fcc2-f174-4b5d-bfea-db4e47f3d3bf', 'e239eb87-5429-4c35-85d2-1f84cb5f8389', '3efe1e39-5494-447e-ac9f-71ada5467715', 7.00, 46.67, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('778aa1ea-2fac-454f-9caf-8a606112c5d3', '178f851e-b54e-4627-be81-8644c8160ff7', '3efe1e39-5494-447e-ac9f-71ada5467715', 6.00, 40.00, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('62624396-be14-4569-bdb9-24d0c8e9bb45', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', '3efe1e39-5494-447e-ac9f-71ada5467715', 5.00, 33.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('0d2b208a-c339-4568-a269-8fe560e3b099', '1d804ec7-9693-42a1-830c-dc12efac1d83', '3efe1e39-5494-447e-ac9f-71ada5467715', 5.00, 33.33, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00'),
	('dafe0316-801b-4559-8bbc-78746744904e', '19f2b329-2846-4486-b4c6-d224c9c0a99c', '3efe1e39-5494-447e-ac9f-71ada5467715', 4.00, 26.67, NULL, NULL, '2025-09-28 16:42:19.305989+00', '2025-09-28 16:42:19.305989+00');


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schools" ("id", "name", "domain", "logo_url", "created_at", "updated_at") VALUES
	('4244acc9-e302-4b62-98c2-7feb9cac8d24', 'Demo School', NULL, NULL, '2025-09-27 08:20:54.857813+00', '2025-09-27 08:20:54.857813+00');


--
-- Data for Name: student_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."student_notes" ("id", "student_id", "class_session_id", "note", "rating", "category", "created_at", "updated_at") VALUES
	('dfad9f93-3ac6-4ca0-b33b-a387e0cda552', '3f1ed16f-77b8-46f3-b8d1-71268611ad71', '9218707c-f0a8-48b4-b350-44d478148801', 'Student made an effort to help their neighbour', 3, 'Pastoral', '2025-09-29 03:31:58.489595+00', '2025-09-29 03:31:58.489595+00'),
	('cdc26c94-526e-4075-b2dc-c159de86fb89', '19f2b329-2846-4486-b4c6-d224c9c0a99c', '9218707c-f0a8-48b4-b350-44d478148801', 'Student answered a question about common law really well, shows understanding of concept', 2, 'Academic', '2025-09-29 03:32:32.15971+00', '2025-09-29 03:32:32.15971+00'),
	('826537ec-f23a-4cd3-8032-87800e003165', '2961b233-b486-44a2-a07e-973eb0551103', '9218707c-f0a8-48b4-b350-44d478148801', 'Talking during instrauction', -1, 'Pastoral', '2025-09-29 03:32:47.076045+00', '2025-09-29 03:32:47.076045+00'),
	('957423a8-26fc-400e-bbaf-0403c465d385', 'f1f3853f-d06a-4d8a-8356-ef7d92b005e4', '9218707c-f0a8-48b4-b350-44d478148801', 'incorrect uniform, report after lesson', -1, 'Pastoral', '2025-09-29 03:33:00.313521+00', '2025-09-29 03:33:00.313521+00'),
	('accd76f4-a066-4083-960e-1f6b432411c4', '95ebf67e-473c-4407-a007-1f12ec793754', '9218707c-f0a8-48b4-b350-44d478148801', 'Great explanation of how different governments interact', 3, 'Academic', '2025-09-29 03:33:20.867047+00', '2025-09-29 03:33:20.867047+00');


--
-- Data for Name: student_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "name", "role", "school_id", "created_at", "updated_at") VALUES
	('9f0642ef-b1e6-431b-be25-3dc6dffbc75f', 'josh@harvestais.com', 'Josh', 'TEACHER', '4244acc9-e302-4b62-98c2-7feb9cac8d24', '2025-09-27 08:08:00.357495+00', '2025-09-27 08:21:10.53661+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 24, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
