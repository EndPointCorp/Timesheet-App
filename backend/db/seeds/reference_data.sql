--
-- PostgreSQL database dump
--

\restrict 8uZO2LR8BMdnc0dky4nuSdMchiSqs45YbXgjiJFYkGYR8EULQddZO6WkG5hGSDL

-- Dumped from database version 16.12 (Debian 16.12-1.pgdg13+1)
-- Dumped by pg_dump version 16.12 (Debian 16.12-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: account_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.account_kinds VALUES ('role', '2009-11-11 10:23:46.167993', '2025-10-20 21:23:14.810547', 'Role', NULL, NULL);
INSERT INTO public.account_kinds VALUES ('work_chart', '2009-11-11 10:23:46.169624', '2025-10-20 21:23:14.810547', 'Work Chart', NULL, NULL);


--
-- Data for Name: account_transaction_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.account_transaction_kinds VALUES ('purchase', '2009-11-11 10:23:46.425906', '2025-10-20 21:23:14.810547', true, 'Purchase', NULL, NULL);
INSERT INTO public.account_transaction_kinds VALUES ('correction', '2009-11-11 10:23:46.427453', '2025-10-20 21:23:14.810547', true, 'Correction', NULL, NULL);
INSERT INTO public.account_transaction_kinds VALUES ('return', '2009-11-11 10:23:46.427568', '2025-10-20 21:23:14.810547', false, 'Return', NULL, NULL);
INSERT INTO public.account_transaction_kinds VALUES ('invoice', '2009-11-11 10:23:46.427603', '2025-10-20 21:23:14.810547', false, 'Invoice', NULL, NULL);


--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.actions VALUES ('legacy_import', '2009-01-12 14:02:18.949007', '2025-10-20 21:23:14.810547', 'Imported from Legacy Application', NULL, NULL);


--
-- Data for Name: approval_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.approval_kinds VALUES ('officer', '2009-01-12 14:02:39.70474', '2025-10-20 21:23:14.810547', 1, 'Officer', 'O', NULL, NULL);
INSERT INTO public.approval_kinds VALUES ('manager', '2009-01-12 14:02:39.723477', '2025-10-20 21:23:14.810547', 1, 'Manager', 'M', NULL, NULL);
INSERT INTO public.approval_kinds VALUES ('client_rep', '2009-01-12 14:02:39.72367', '2025-10-20 21:23:14.810547', 1, 'Client Rep', 'CR', NULL, NULL);
INSERT INTO public.approval_kinds VALUES ('other', '2009-01-12 14:02:39.723742', '2025-10-20 21:23:14.810547', 1, 'Other', 'OT', NULL, NULL);


--
-- Data for Name: production_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.production_categories VALUES (1, '2009-01-12 14:02:29.44525', '2025-10-20 21:23:14.810547', 'billable', false, true, NULL, NULL);
INSERT INTO public.production_categories VALUES (2, '2009-01-12 14:02:29.447215', '2025-10-20 21:23:14.810547', 'in house', false, true, NULL, NULL);
INSERT INTO public.production_categories VALUES (3, '2009-01-12 14:02:29.447355', '2025-10-20 21:23:14.810547', 'end point', false, false, NULL, NULL);
INSERT INTO public.production_categories VALUES (4, '2009-01-12 14:02:29.44742', '2025-10-20 21:23:14.810547', 'exclude', true, false, NULL, NULL);


--
-- Data for Name: duration_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.duration_kinds VALUES ('billable_standard', '2009-01-12 14:02:30.079069', '2025-10-20 21:23:14.810547', 1, 'Billable: Standard', 'BS', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('billable_project', '2009-01-12 14:02:30.081123', '2025-10-20 21:23:14.810547', 1, 'Billable: Project', 'BP', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('billable_emergency', '2009-01-12 14:02:30.081309', '2025-10-20 21:23:14.810547', 1, 'Billable: Emergency', 'BE', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('billable_training', '2009-01-12 14:02:30.081393', '2025-10-20 21:23:14.810547', 1, 'Billable: Training', 'BT', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_standard', '2009-01-12 14:02:30.081466', '2025-10-20 21:23:14.810547', 1, 'Non-Billable: Standard', 'NBS', 3, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_training', '2009-01-12 14:02:30.081533', '2025-10-20 21:23:14.810547', 1, 'Non-Billable: Training', 'NBT', 2, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_pto', '2009-01-12 14:02:30.081611', '2025-10-20 21:23:14.810547', 1, 'Non-Billable: Paid Time Off', 'NBTO', 4, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_project', '2009-01-12 14:02:30.08169', '2025-10-20 21:23:14.810547', 1, 'Non-Billable: Internal Project', 'NBP', 2, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_infrastructure', '2009-01-12 14:02:30.081768', '2025-10-20 21:23:14.810547', 1, 'Non-Billable: Infrastructure', 'NI', 2, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_baseline', '2010-08-10 13:52:26.055946', '2025-10-20 21:23:14.810547', 1, 'Non-Billable: Baseline', 'NBB', 2, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('billable_support', '2015-07-01 08:48:51', '2025-10-20 21:23:14.810547', 1, 'Billable: Support', 'BSUP', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('billable_hosting', '2015-07-01 08:50:06', '2025-10-20 21:23:14.810547', 1, 'Billable: Hosting', 'BHOS', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('billable_consulting', '2015-07-01 08:50:53', '2025-10-20 21:23:14.810547', 1, 'Billable: Consulting', 'BCON', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('billable_travel', '2015-07-21 06:11:00', '2025-10-20 21:23:14.810547', 1, 'Billable: Travel', 'BTR', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_travel', '2015-07-21 06:11:17', '2025-10-20 21:23:14.810547', 1, 'Non-billable: Travel', 'NTR', 1, NULL, NULL);
INSERT INTO public.duration_kinds VALUES ('nonbillable_relationship', '2016-04-20 08:00:45.260663', '2025-10-20 21:23:14.810547', 1, 'Non-Billable: Relationship', 'NBR', 1, NULL, NULL);


--
-- Data for Name: lookup_contact_item_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lookup_contact_item_kinds VALUES ('email_address', '2009-01-12 14:02:31.175862', '2025-10-20 21:23:14.810547', 1, 'E-mail Address', NULL, NULL);
INSERT INTO public.lookup_contact_item_kinds VALUES ('phone_number', '2009-01-12 14:02:31.176228', '2025-10-20 21:23:14.810547', 1, 'Phone Number', NULL, NULL);
INSERT INTO public.lookup_contact_item_kinds VALUES ('street_address', '2009-01-12 14:02:31.17636', '2025-10-20 21:23:14.810547', 1, 'Street Address', NULL, NULL);
INSERT INTO public.lookup_contact_item_kinds VALUES ('other', '2009-01-12 14:02:31.176431', '2025-10-20 21:23:14.810547', 1, 'Other', NULL, NULL);


--
-- Data for Name: lookup_medium_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lookup_medium_kinds VALUES ('phone', '2009-11-18 14:28:29.104236', '2025-10-20 21:23:14.810547', 1, 'Phone', NULL, NULL);
INSERT INTO public.lookup_medium_kinds VALUES ('email', '2009-11-18 14:28:29.104457', '2025-10-20 21:23:14.810547', 1, 'E-mail', NULL, NULL);
INSERT INTO public.lookup_medium_kinds VALUES ('irc', '2009-11-18 14:28:29.104526', '2025-10-20 21:23:14.810547', 1, 'IRC', NULL, NULL);


--
-- Data for Name: lookups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lookups VALUES (1, '2009-01-12 14:02:31.083467', '2025-10-20 21:23:14.810547', 1, 1, 'Contact::Item::Kind', 'contact_item_kinds', 'Contact Item Kinds', true, NULL, NULL);
INSERT INTO public.lookups VALUES (2, '2009-11-18 14:28:29.077656', '2025-10-20 21:23:14.810547', 1, 1, 'Medium::Kind', 'medium_kinds', 'Medium Kinds', true, NULL, NULL);


--
-- Data for Name: right_type_target_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.right_type_target_kinds VALUES ('user', '2010-04-29 08:29:54.771345', '2025-10-20 21:23:14.810547', 'User', 'IC::M::User', 'users', NULL, NULL);
INSERT INTO public.right_type_target_kinds VALUES ('role', '2010-04-29 08:29:54.772875', '2025-10-20 21:23:14.810547', 'Role', 'IC::M::Role', 'roles', NULL, NULL);
INSERT INTO public.right_type_target_kinds VALUES ('work_chart', '2010-04-29 08:30:05.978374', '2025-10-20 21:23:14.810547', 'Work Chart', 'EndPoint::M::WorkChart', 'work_chart', NULL, NULL);
INSERT INTO public.right_type_target_kinds VALUES ('account', '2010-04-29 08:30:05.980274', '2025-10-20 21:23:14.810547', 'Account', 'EndPoint::M::Account', 'accounts', NULL, NULL);
INSERT INTO public.right_type_target_kinds VALUES ('site_mgmt_action', '2010-04-29 08:29:54.773028', '2025-10-20 21:23:14.810547', 'Site Mgmt Action', 'IC::M::ManageClass::Action', 'ic_manage_class_actions', NULL, NULL);


--
-- Data for Name: right_types; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.right_types VALUES (1, '2010-04-29 08:29:54.901124', '2025-10-20 21:23:14.810547', 'superuser', 'Unrestricted Access', 'Special right type that grants unrestricted access', NULL, NULL, NULL);
INSERT INTO public.right_types VALUES (2, '2010-04-29 08:29:54.901919', '2025-10-20 21:23:14.810547', 'access_site_mgmt', 'Access: Site Management', 'Determines access to the site management facility', NULL, NULL, NULL);
INSERT INTO public.right_types VALUES (4, '2010-04-29 08:29:54.903257', '2025-10-20 21:23:14.810547', 'switch_user', 'Switch to Different User', 'Determines right to become a different user (bypassing login form)', 'user', NULL, NULL);
INSERT INTO public.right_types VALUES (8, '2009-02-07 01:34:08.176839', '2025-10-20 21:23:14.810547', 'report', 'Reporting right on work chart', '', 'work_chart', NULL, NULL);
INSERT INTO public.right_types VALUES (5, '2009-01-12 14:02:22.655681', '2025-10-20 21:23:14.810547', 'manage', 'Manage other roles', '', 'role', NULL, NULL);
INSERT INTO public.right_types VALUES (6, '2009-01-12 14:02:22.655776', '2025-10-20 21:23:14.810547', 'bill', 'Able to bill time', '', NULL, NULL, NULL);
INSERT INTO public.right_types VALUES (7, '2009-01-12 14:02:22.655861', '2025-10-20 21:23:14.810547', 'bill', 'Bill time to specific work chart nodes', '', 'work_chart', NULL, NULL);
INSERT INTO public.right_types VALUES (9, '2009-04-17 07:32:30.980944', '2025-10-20 21:23:14.810547', 'access_control', 'Allows creating users and changing permissions', '', NULL, NULL, NULL);
INSERT INTO public.right_types VALUES (10, '2009-04-17 07:32:48.76746', '2025-10-20 21:23:14.810547', 'naggable', 'Naggable right', '', NULL, NULL, NULL);
INSERT INTO public.right_types VALUES (13, '2010-01-28 08:18:31.730749', '2025-10-20 21:23:14.810547', 'accounts_overview', 'See account management page', '', NULL, NULL, NULL);
INSERT INTO public.right_types VALUES (14, '2010-01-28 08:18:31.853442', '2025-10-20 21:23:14.810547', 'view_account', 'View account details', '', 'account', NULL, NULL);
INSERT INTO public.right_types VALUES (15, '2010-01-28 08:18:31.854208', '2025-10-20 21:23:14.810547', 'edit_account', 'Manage account', '', 'account', NULL, NULL);
INSERT INTO public.right_types VALUES (17, '2009-01-12 14:02:22.655499', '2025-10-20 21:23:14.810547', 'manage', 'Manage work chart nodes', '', 'work_chart', NULL, NULL);
INSERT INTO public.right_types VALUES (18, '2009-01-12 14:02:22.655598', '2025-10-20 21:23:14.810547', 'report', 'Report on roles', '', 'role', NULL, NULL);
INSERT INTO public.right_types VALUES (3, '2010-04-29 08:29:54.903162', '2025-10-20 21:23:14.810547', 'execute', 'Execute: Site Management Action', 'Determines right to execute site management action', 'site_mgmt_action', NULL, NULL);
INSERT INTO public.right_types VALUES (19, '2013-07-30 20:29:39', '2025-10-20 21:23:14.810547', 'create_users', 'Create Users', '', NULL, NULL, NULL);
INSERT INTO public.right_types VALUES (20, '2013-12-11 10:19:14', '2025-10-20 21:23:14.810547', 'represent', 'Represent', 'Represents a client / chart', 'work_chart', NULL, NULL);
INSERT INTO public.right_types VALUES (21, '2014-03-25 06:49:56', '2025-10-20 21:23:14.810547', 'project_manage', 'Project manage', 'Manages a client / chart', 'work_chart', NULL, NULL);
INSERT INTO public.right_types VALUES (22, '2015-03-11 11:58:56', '2025-10-20 21:23:14.810547', 'get_nag_emails_for_project_manager', 'Get nag emails for project manager', 'Receives nag emails for project manager', 'work_chart', NULL, NULL);
INSERT INTO public.right_types VALUES (23, '2015-05-18 13:48:43', '2025-10-20 21:23:14.810547', 'get_nag_emails_for_project', 'Get nag emails for project', 'Receives nag emails for work charts', 'work_chart', NULL, NULL);
INSERT INTO public.right_types VALUES (24, '2015-05-18 13:48:43', '2025-10-20 21:23:14.810547', 'get_nag_emails_for_team', 'Get nag emails for team', 'Receives nag emails for team', 'role', NULL, NULL);
INSERT INTO public.right_types VALUES (25, '2015-12-15 07:49:13.444507', '2025-10-20 21:23:14.810547', 'manage_team', 'Manage team', '', 'role', NULL, NULL);
INSERT INTO public.right_types VALUES (26, '2016-03-09 15:47:01.018102', '2025-10-20 21:23:14.810547', 'global_reviewer', 'Global timesheets reviewer', 'Reviews timesheets where there is no project manager', 'role', NULL, NULL);
INSERT INTO public.right_types VALUES (27, '2016-11-06 11:08:31.353893', '2025-10-20 21:23:14.810547', 'new_features_tester', 'New features tester', 'Tests not released features', NULL, NULL, NULL);


--
-- Data for Name: tag_set_kinds; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tag_set_kinds VALUES ('work_entry', '2009-01-12 14:02:27.767621', '2025-10-20 21:23:14.810547', 1, 'For Work Entries', NULL, NULL);
INSERT INTO public.tag_set_kinds VALUES ('work_chart', '2009-01-12 14:02:27.790417', '2025-10-20 21:23:14.810547', 1, 'For Work Chart', NULL, NULL);
INSERT INTO public.tag_set_kinds VALUES ('contacts', '2009-01-12 14:02:27.79059', '2025-10-20 21:23:14.810547', 1, 'For Contacts', NULL, NULL);


--
-- Data for Name: time_zones; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.time_zones VALUES ('US/Pacific', '2010-04-29 08:29:54.177905', '2025-10-20 21:23:14.810547', -8, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('US/Mountain', '2010-04-29 08:29:54.179353', '2025-10-20 21:23:14.810547', -7, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('US/Central', '2010-04-29 08:29:54.179448', '2025-10-20 21:23:14.810547', -6, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('US/Eastern', '2010-04-29 08:29:54.179481', '2025-10-20 21:23:14.810547', -5, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('Europe/Stockholm', '2010-04-29 08:29:54.179512', '2025-10-20 21:23:14.810547', 1, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('America/Puerto_Rico', '2010-04-29 08:29:54.179542', '2025-10-20 21:23:14.810547', -5, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('Europe/Warsaw', '2011-12-14 09:51:47.303696', '2025-10-20 21:23:14.810547', 1, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('America/Costa_Rica', '2012-08-28 13:47:12.897634', '2025-10-20 21:23:14.810547', -6, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('Asia/Kolkata', '2012-12-05 01:34:33.111601', '2025-10-20 21:23:14.810547', 5.5, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('Asia/Jakarta', '2012-12-05 01:35:39.064119', '2025-10-20 21:23:14.810547', 7, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('Europe/Prague', '2012-12-05 01:36:23.688163', '2025-10-20 21:23:14.810547', 1, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('Australia/Sydney', '2017-06-30 15:15:41.758025', '2025-10-20 21:23:14.810547', -10.0, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('Europe/Istanbul', '2021-05-28 13:31:14.538298', '2025-10-20 21:23:14.810547', 3, true, NULL, NULL);
INSERT INTO public.time_zones VALUES ('America/Sao_Paulo', '2012-08-28 13:49:12.594386', '2025-10-20 21:23:14.810547', -4, true, NULL, NULL);


--
-- Data for Name: user_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_statuses VALUES ('disabled', '2010-04-29 08:29:55.289616', '2025-10-20 21:23:14.810547', 'Disabled', NULL, NULL);
INSERT INTO public.user_statuses VALUES ('enabled', '2010-04-29 08:29:55.291238', '2025-10-20 21:23:14.810547', 'Enabled', NULL, NULL);


--
-- Data for Name: work_chart_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.work_chart_statuses VALUES ('active', 'Work chart node represents an active client or project with which some relationship is maintained', '2009-01-22 11:29:14.027179', '2025-10-20 21:23:14.810547', NULL, NULL);
INSERT INTO public.work_chart_statuses VALUES ('hidden', 'Work chart node should be hidden from general view as it represents a client or project that is inactive or deprecated', '2009-01-22 11:29:14.027179', '2025-10-20 21:23:14.810547', NULL, NULL);
INSERT INTO public.work_chart_statuses VALUES ('dead', 'work chart node no longer exists and never displayed in any list', '2014-03-25 07:52:11', '2025-10-20 21:23:14.810547', NULL, NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict 8uZO2LR8BMdnc0dky4nuSdMchiSqs45YbXgjiJFYkGYR8EULQddZO6WkG5hGSDL

