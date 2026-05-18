#!/usr/bin/python3

print('''class UpdateCreatedBy < ActiveRecord::Migration[5.0]
  def change
    execute <<-sql''')

with open('views_referencing_tables_with_created_by.txt') as f:
  views = f.readlines()

for view in views:
  stripped_view = view.strip('\n')
  print(f'DROP VIEW IF EXISTS {stripped_view} CASCADE;')

print('\n')

with open('tables_containing_created_by.txt') as f:
  tables = f.readlines()

for table in tables:
  stripped_table = table.strip('\n   ')

  # if the table has deferred triggers, we need to temporarily change them to immediate

  if stripped_table in ['work_chart', 'work_entries']:
    print(f'set constraints {stripped_table}_leaf_restriction immediate;')

  # rename the old column, so that the new columns' foreign keys aren't named "roles_created_by_new_fkey" and such

  print(f'ALTER TABLE {stripped_table} RENAME COLUMN created_by TO created_by_old;')
  print(f'ALTER TABLE {stripped_table} ADD COLUMN created_by INTEGER REFERENCES roles(id);')

  print(f'ALTER TABLE {stripped_table} RENAME COLUMN modified_by TO modified_by_old;')
  print(f'ALTER TABLE {stripped_table} ADD COLUMN modified_by INTEGER REFERENCES roles(id);')

  # Cases: a number, empty, an email, or one of the following: user_system, system, schema, manual, migration

  print(f'''UPDATE {stripped_table} SET created_by =
  CASE WHEN created_by_old ~ '^[0-9]+$' THEN
    CASE WHEN created_by_old::integer IN (SELECT id FROM roles) THEN
      created_by_old::integer
    ELSE
      null
    END 
  ELSE
    CASE WHEN created_by_old ~ '^[^@]+@.+$' THEN
      (SELECT id FROM roles WHERE roles.code = regexp_replace(created_by_old, '^([^@]+)@.+$', 'user_\\\\1'))
    ELSE
      (SELECT id FROM roles WHERE roles.code = {stripped_table}.created_by_old)
    END
  END;''')

  print(f'''UPDATE {stripped_table} SET modified_by =
  CASE WHEN modified_by_old ~ '^[0-9]+$' THEN
    CASE WHEN modified_by_old::integer IN (SELECT id FROM roles) THEN
      modified_by_old::integer
    ELSE
      null
    END 
  ELSE
    CASE WHEN modified_by_old ~ '^[^@]+@.+$' THEN
      (SELECT id FROM roles WHERE roles.code = regexp_replace(modified_by_old, '^([^@]+)@.+$', 'user_\\\\1'))
    ELSE
      (SELECT id FROM roles WHERE roles.code = {stripped_table}.modified_by_old)
    END
  END;''')

  print(f'ALTER TABLE {stripped_table} DROP COLUMN created_by_old;')

  print(f'ALTER TABLE {stripped_table} DROP COLUMN modified_by_old;')

  # if we changed the trigger deferrability, change it back

  if stripped_table in ['work_chart', 'work_entries']:
    print(f'set constraints {stripped_table}_leaf_restriction deferred;')

  print('\n')

create_views = {
'budget_entries': """CREATE OR REPLACE VIEW budget_entries AS
SELECT DISTINCT ON (entries.id) first_value(entries.id) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS id,
    first_value(entries.date) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS date,
    first_value(entries.role_id) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS role_id,
    first_value(entries.labels) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS labels,
    first_value(entries.ids) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS ids,
    first_value(entries.duration) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS duration,
    first_value(entries.budget_id) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS budget_id,
    first_value(entries.kind_code) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS kind_code
   FROM under_budget_entries entries;""",
'all_budget_entries': """CREATE OR REPLACE VIEW all_budget_entries AS
 SELECT DISTINCT ON (entries.id) first_value(entries.id) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS id,
    first_value(entries.date) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS date,
    first_value(entries.role_id) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS role_id,
    first_value(entries.labels) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS labels,
    first_value(entries.ids) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS ids,
    first_value(entries.duration) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS duration,
    first_value(entries.budget_id) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS budget_id,
    first_value(entries.kind_code) OVER (PARTITION BY entries.id ORDER BY entries."position" DESC) AS kind_code
   FROM all_under_budget_entries entries;""",
'active_hours_used': """CREATE OR REPLACE VIEW active_hours_used AS
 SELECT budget_entries.budget_id,
    sum(budget_entries.duration) AS total_duration,
    array_agg(DISTINCT budget_entries.role_id) AS role_ids,
    budget_entries.kind_code
   FROM budget_entries
  GROUP BY budget_entries.budget_id, budget_entries.kind_code;""",
'accounts_summary_view': """CREATE OR REPLACE VIEW accounts_summary_view AS
  SELECT a.id AS account_id,
    max(t.reference_stamp) AS last_transaction,
    count(t.value) AS num_transactions,
    sum(
      CASE
        WHEN k.is_credit THEN t.value
        ELSE - t.value
      END) AS balance
  FROM accounts a
    LEFT JOIN account_transactions t ON a.id = t.account_id
    JOIN account_transaction_kinds k ON k.code::text = t.kind_code::text
  GROUP BY a.id;
""",

'active_hours_bought': """CREATE OR REPLACE VIEW active_hours_bought AS
 SELECT transactions.work_chart_id AS budget_id,
    transactions.kind_code,
    chart_labels.labels,
    sum(transactions.hours) * '01:00:00'::interval AS total_bought
   FROM transactions
     JOIN chart_labels ON chart_labels.id = transactions.work_chart_id
  WHERE transactions.date < now()::date AND (transactions.date_closed IS NULL OR transactions.date_closed > now()::date)
  GROUP BY transactions.work_chart_id, chart_labels.labels, transactions.kind_code;
""",

'all_budget_days': """CREATE OR REPLACE VIEW all_budget_days AS
 WITH RECURSIVE budget_days_1(budget_id, labels, date, date_closed, kind_code) AS (
         SELECT chart_labels.id AS budget_id,
            chart_labels.labels,
            transactions.date,
            transactions.date_closed,
            transactions.kind_code
           FROM transactions
             JOIN chart_labels ON chart_labels.id = transactions.work_chart_id
        UNION ALL
         SELECT budget_days_1_1.budget_id,
            budget_days_1_1.labels,
            (budget_days_1_1.date + '1 day'::interval)::date AS date,
            budget_days_1_1.date_closed,
            budget_days_1_1.kind_code
           FROM budget_days_1 budget_days_1_1
          WHERE budget_days_1_1.date_closed IS NULL AND budget_days_1_1.date <= now() OR budget_days_1_1.date_closed IS NOT NULL AND budget_days_1_1.date < budget_days_1_1.date_closed
        )
 SELECT budget_days_1.budget_id,
    budget_days_1.labels,
    budget_days_1.date,
    budget_days_1.kind_code,
    array_length(budget_days_1.labels, 1) AS "position"
   FROM budget_days_1;
""",

'all_hours_in_the_bank': """CREATE OR REPLACE VIEW all_hours_in_the_bank AS
 SELECT DISTINCT ON (transactions.work_chart_id, transactions.kind_code) transactions.work_chart_id,
    chart_labels.labels,
    transactions.kind_code,
    sum(hours_in_the_bank.hours_bought) AS hours_bought,
    sum(hours_in_the_bank.hours_used) AS hours_used,
    array_cat_agg(hours_in_the_bank.role_ids) AS role_ids,
    sum(hours_in_the_bank.hours_left) AS hours_left
   FROM transactions
     LEFT JOIN hours_in_the_bank ON hours_in_the_bank.work_chart_id = transactions.work_chart_id AND hours_in_the_bank.kind_code::text = transactions.kind_code::text
     JOIN chart_labels ON chart_labels.id = transactions.work_chart_id
  GROUP BY transactions.id, transactions.work_chart_id, chart_labels.labels, transactions.kind_code;
""",

'all_under_budget_entries': """CREATE OR REPLACE VIEW all_under_budget_entries AS
 SELECT work_entries.id,
    work_entries.role_id,
    all_budget_days.budget_id,
    work_entries.date_performed AS date,
    work_entries.work_chart_id,
    all_budget_days.kind_code,
    chart_labels.ids,
    chart_labels.labels,
    work_entry_durations.duration,
    all_budget_days."position"
   FROM work_entry_durations
     JOIN work_entries ON work_entries.id = work_entry_durations.work_entry_id
     JOIN chart_labels ON chart_labels.id = work_entries.work_chart_id
     JOIN all_budget_days ON (all_budget_days.budget_id = ANY (chart_labels.ids)) AND all_budget_days.date = work_entries.date_performed AND work_entry_durations.kind_code::text ~~ (all_budget_days.kind_code::text || '%'::text);
""",

'approvals_summaries': """CREATE OR REPLACE VIEW approvals_summaries AS
 SELECT entries.id,
    entries.work_chart_id,
    entries.date_performed,
    entries.description,
    approvals.owner_ids AS approval_owner_ids,
    json_build_object('id', users.id, 'email', users.email, 'name', users.name) AS owner,
    COALESCE(( SELECT array_agg(a.a) AS array_agg
           FROM unnest(array_agg(DISTINCT rejections.as_json)) a(a)
          WHERE a.a IS NOT NULL), ARRAY[]::jsonb[]) AS comments,
    string_agg(DISTINCT kinds.display_label::text, ', '::text) AS kind_code_display,
    sum(fees.fee) OVER (PARTITION BY fees.date_created) AS total_fees,
    array_agg(json_build_object('kind_code', durations.kind_code, 'duration', date_part('epoch'::text, durations.duration) / 60::double precision)) AS durations
   FROM work_entries entries
     JOIN approvals ON approvals.work_entry_id = entries.id AND approvals.approved IS NULL
     JOIN users ON users.role_id = entries.role_id
     LEFT JOIN ( SELECT json_build_object('username', users_1.name, 'created_at', date(approvals_1.created_at), 'body', approvals_1.comment)::jsonb AS as_json,
            approvals_1.work_entry_id
           FROM approvals approvals_1
             JOIN users users_1 ON users_1.role_id = approvals_1.role_id
          WHERE approvals_1.approved IS FALSE
          ORDER BY approvals_1.created_at DESC) rejections ON rejections.work_entry_id = entries.id
     JOIN work_entry_durations durations ON durations.work_entry_id = entries.id
     JOIN duration_kinds kinds ON kinds.code::text = durations.kind_code::text
     LEFT JOIN work_entry_fees fees ON fees.work_entry_id = entries.id
  GROUP BY entries.id, entries.work_chart_id, entries.date_performed, entries.description, approvals.owner_ids, users.id, users.email, users.name, fees.fee, fees.date_created;
""",

'budget_days': """CREATE OR REPLACE VIEW budget_days AS
 WITH RECURSIVE budget_days_1(budget_id, labels, date, date_closed, kind_code) AS (
         SELECT chart_labels.id AS budget_id,
            chart_labels.labels,
            transactions.date,
            transactions.date_closed,
            transactions.kind_code
           FROM transactions
             JOIN chart_labels ON chart_labels.id = transactions.work_chart_id
          WHERE transactions.date <= now()::date AND (transactions.date_closed IS NULL OR transactions.date_closed > now()::date)
        UNION
         SELECT budget_days_1_1.budget_id,
            budget_days_1_1.labels,
            (budget_days_1_1.date + '1 day'::interval)::date AS date,
            budget_days_1_1.date_closed,
            budget_days_1_1.kind_code
           FROM budget_days_1 budget_days_1_1
          WHERE budget_days_1_1.date_closed IS NULL AND budget_days_1_1.date <= now() OR budget_days_1_1.date_closed IS NOT NULL AND budget_days_1_1.date < budget_days_1_1.date_closed
        )
 SELECT budget_days_1.budget_id,
    budget_days_1.labels,
    budget_days_1.date,
    budget_days_1.kind_code,
    array_length(budget_days_1.labels, 1) AS "position"
   FROM budget_days_1;
""",

'day_work_totals': """CREATE OR REPLACE VIEW day_work_totals AS
 SELECT roles.code,
    teams.code AS team_code,
    teams.display_label AS team_display_label,
    work_hours_stats.date_performed,
    json_object_agg(work_hours_stats.kind, work_hours_stats.duration) AS durations
   FROM roles
     JOIN teams ON (teams.users -> roles.code::text) IS NOT NULL
     JOIN work_hours_stats ON work_hours_stats.role_code::text = roles.code::text
  GROUP BY roles.code, teams.code, teams.display_label, work_hours_stats.date_performed
  ORDER BY work_hours_stats.date_performed;
""",

'entry_daily_summaries': """CREATE OR REPLACE VIEW entry_daily_summaries AS
 SELECT entries.id,
    entries.date_performed,
    entries.description,
    entries.role_id,
    sum(DISTINCT fees.fee) AS fee_total,
    COALESCE(( SELECT array_agg(a.a) AS array_agg
           FROM unnest(array_agg(DISTINCT approvals.user_json)) a(a)
          WHERE a.a IS NOT NULL), ARRAY[]::jsonb[]) AS owners,
    false AS is_invoiced,
    COALESCE(json_agg(DISTINCT json_build_object('updated_at', approved_approvals.updated_at, 'role_id', approved_approvals.role_id, 'approved', approved_approvals.approved)::jsonb) FILTER (WHERE approved_approvals.approved IS NOT NULL), '[]'::json) AS approved_roles,
    array_agg(DISTINCT kinds.display_label) AS kinds,
    COALESCE(( SELECT sum(work_entry_durations.duration) AS sum
           FROM work_entry_durations
          WHERE work_entry_durations.work_entry_id = entries.id AND work_entry_durations.kind_code::text ~~ 'billable%'::text), '00:00:00'::interval) AS total_billable,
    COALESCE(( SELECT sum(work_entry_durations.duration) AS sum
           FROM work_entry_durations
          WHERE work_entry_durations.work_entry_id = entries.id AND work_entry_durations.kind_code::text ~~ 'nonbillable%'::text AND work_entry_durations.kind_code::text !~~ '%_pto'::text), '00:00:00'::interval) AS total_nonbillable,
    COALESCE(( SELECT sum(work_entry_durations.duration) AS sum
           FROM work_entry_durations
          WHERE work_entry_durations.work_entry_id = entries.id AND work_entry_durations.kind_code::text ~~ '%_pto'::text), '00:00:00'::interval) AS total_pto,
    sum(durations.duration) AS total_duration,
    entries.work_chart_id,
    chart_labels.labels AS work_chart_label_parts
   FROM work_entries entries
     LEFT JOIN work_entry_fees fees ON fees.work_entry_id = entries.id
     LEFT JOIN ( SELECT json_build_object('email', users.email, 'name', users.name)::jsonb AS user_json,
            approvals_1.approved,
            approvals_1.work_entry_id
           FROM users
             JOIN approvals approvals_1 ON users.role_id = ANY (approvals_1.owner_ids)) approvals ON approvals.work_entry_id = entries.id AND approvals.approved IS NULL
     LEFT JOIN approvals approved_approvals ON approved_approvals.work_entry_id = entries.id AND approved_approvals.approved IS TRUE
     JOIN work_entry_durations durations ON durations.work_entry_id = entries.id
     JOIN duration_kinds kinds ON kinds.code::text = durations.kind_code::text
     JOIN chart_labels ON chart_labels.id = entries.work_chart_id
  GROUP BY entries.id, entries.date_performed, entries.description, chart_labels.labels, fees.fee, fees.work_entry_id;
""",

'global_reviewers': """CREATE OR REPLACE VIEW global_reviewers AS
 SELECT users_details.id,
    users_details.email,
    users_details.name,
    users_details.role_id
   FROM users_details
     JOIN ( SELECT DISTINCT rights.role_id
           FROM ( SELECT json_array_elements(users_details_1.rights_direct) AS rightd,
                    users_details_1.role_id
                   FROM users_details users_details_1) rights
             LEFT JOIN ( SELECT json_array_elements(users_details_1.rights_by_roles) AS rightd,
                    users_details_1.role_id
                   FROM users_details users_details_1) rightsr ON rights.role_id = rightsr.role_id
          WHERE (rights.rightd ->> 'code'::text) = 'global_reviewer'::text OR (rightsr.rightd ->> 'code'::text) = 'global_reviewer'::text) reviewers ON users_details.role_id = reviewers.role_id;
""",

'hours_in_the_bank': """CREATE OR REPLACE VIEW hours_in_the_bank AS
 SELECT bought.budget_id AS work_chart_id,
    bought.labels,
    bought.kind_code,
    bought.total_bought AS hours_bought,
    COALESCE(used.total_duration, '00:00:00'::interval) AS hours_used,
    COALESCE(used.role_ids, ARRAY[]::integer[]) AS role_ids,
    bought.total_bought - COALESCE(used.total_duration, '00:00:00'::interval) AS hours_left
   FROM active_hours_bought bought
     LEFT JOIN active_hours_used used ON used.budget_id = bought.budget_id AND used.kind_code::text = bought.kind_code::text;
""",

'managed_work_charts': """CREATE OR REPLACE VIEW managed_work_charts AS
 SELECT work_chart.id,
    work_chart.date_created,
    work_chart.created_by,
    work_chart.last_modified,
    work_chart.modified_by,
    work_chart.parent_id,
    work_chart.branch_order,
    work_chart.display_label,
    work_chart.status,
    targets.work_chart_id
   FROM work_chart
     JOIN ( SELECT DISTINCT right_targets.ref_obj_pk::integer AS work_chart_id
           FROM rights
             JOIN right_types ON right_types.id = rights.right_type_id AND right_types.code::text = 'project_manage'::text
             JOIN right_targets ON right_targets.right_id = rights.id
          WHERE rights.is_granted IS TRUE) targets ON targets.work_chart_id = work_chart.id;
""",

'newer_labels': """CREATE OR REPLACE VIEW newer_labels AS
 WITH RECURSIVE tree AS (
         SELECT work_chart.id,
            work_chart.parent_id,
            work_chart.display_label,
            ARRAY[work_chart.display_label::text] AS labels,
            ARRAY[work_chart.id] AS ids,
            work_chart.status AS tree_status
           FROM work_chart
          WHERE work_chart.parent_id = 1
        UNION ALL
         SELECT f1.id,
            f1.parent_id,
            f1.display_label,
            array_append(tree_1.labels, f1.display_label::text) AS labels,
            array_append(tree_1.ids, f1.id) AS ids,
                CASE
                    WHEN f1.status::text = 'hidden'::text OR tree_1.tree_status::text = 'hidden'::text THEN 'hidden'::character varying(30)
                    WHEN f1.status::text = 'dead'::text OR tree_1.tree_status::text = 'dead'::text THEN 'dead'::character varying(30)
                    ELSE 'active'::character varying(30)
                END AS tree_status
           FROM tree tree_1
             JOIN work_chart f1 ON f1.parent_id = tree_1.id
        )
 SELECT tree.id,
    tree.labels,
    tree.ids,
    tree.tree_status
   FROM tree;
""",

'report_items': """CREATE OR REPLACE VIEW report_items AS
 WITH RECURSIVE tree AS (
         SELECT work_chart.id,
            work_chart.parent_id,
            work_chart.display_label,
            ARRAY[work_chart.id] AS path,
            ARRAY[work_chart.display_label::text] AS labels
           FROM work_chart
          WHERE work_chart.parent_id = 1
        UNION ALL
         SELECT f1.id,
            f1.parent_id,
            f1.display_label,
            array_append(tree_1.path, f1.id) AS path,
            array_append(tree_1.labels, f1.display_label::text) AS labels
           FROM tree tree_1
             JOIN work_chart f1 ON f1.parent_id = tree_1.id
        )
 SELECT work_entries.id,
    work_entries.date_performed,
    work_entries.role_id,
    tree.path,
    tree.labels,
    work_entries.description,
    ( SELECT users.name
           FROM users
          WHERE users.role_id = work_entries.role_id) AS fullname,
    ( SELECT sum(work_entry_fees.fee) AS sum
           FROM work_entry_fees
          WHERE work_entry_fees.work_entry_id = work_entries.id) AS total_fee,
    ARRAY( SELECT work_entry_durations.kind_code
           FROM work_entry_durations
          WHERE work_entry_durations.work_entry_id = work_entries.id) AS duration_kind_codes,
    ARRAY( SELECT work_entry_durations.duration
           FROM work_entry_durations
          WHERE work_entry_durations.work_entry_id = work_entries.id) AS duration_values,
        CASE
            WHEN (( SELECT count(*) AS count
               FROM approvals
              WHERE approvals.work_entry_id = work_entries.id AND approvals.approved IS NULL)) > 0 THEN false
            ELSE true
        END AS approved
   FROM work_entries
     JOIN tree ON tree.id = work_entries.work_chart_id;
""",

'right_targets_view': """CREATE OR REPLACE VIEW right_targets_view AS
 SELECT targets.id,
    rights_view.id AS right_id,
    rights_view.code,
    rights_view.target_kind_code,
    targets.ref_obj_pk::integer AS ref_obj_pk,
        CASE
            WHEN rights_view.target_kind_code::text = 'work_chart'::text THEN ( SELECT work_chart.display_label
               FROM work_chart
              WHERE work_chart.id = targets.ref_obj_pk::integer)
            WHEN rights_view.target_kind_code::text = 'role'::text THEN ( SELECT roles_view.display_label
               FROM roles_view
              WHERE roles_view.id = targets.ref_obj_pk::integer)
            WHEN rights_view.target_kind_code::text = 'user'::text THEN ( SELECT users.name
               FROM users
              WHERE users.id = targets.ref_obj_pk::integer)
            ELSE ''::character varying
        END AS label
   FROM rights_view
     JOIN right_targets targets ON targets.right_id = rights_view.id;
""",

'rights_view': """CREATE OR REPLACE VIEW rights_view AS
 SELECT rights.id,
    rights.role_id,
    rights.is_granted,
    right_types.code,
    right_types.display_label,
    right_types.target_kind_code,
        CASE
            WHEN count(right_targets.ref_obj_pk) > 0 THEN array_agg(right_targets.ref_obj_pk::integer)
            ELSE ARRAY[]::integer[]
        END AS target_ids
   FROM rights
     JOIN right_types ON right_types.id = rights.right_type_id
     LEFT JOIN right_targets ON right_targets.right_id = rights.id
     JOIN roles ON roles.id = rights.role_id
  GROUP BY rights.id, rights.role_id, rights.is_granted, right_types.code, right_types.display_label, right_types.target_kind_code;
""",

'role_details': """CREATE OR REPLACE VIEW role_details AS
 SELECT details.id,
    details.code,
    details.label,
    ( SELECT
                CASE
                    WHEN count(DISTINCT unnest.unnest) > 0 THEN array_agg(DISTINCT unnest.unnest)
                    ELSE ARRAY[]::integer[]
                END AS "array"
           FROM unnest(array_cat_agg(details.role_ids)) unnest(unnest)) AS role_ids,
    ( SELECT
                CASE
                    WHEN count(DISTINCT unnest.unnest) > 0 THEN array_agg(DISTINCT unnest.unnest)
                    ELSE ARRAY[]::integer[]
                END AS "array"
           FROM unnest(array_cat_agg(details.direct_role_ids)) unnest(unnest)) AS direct_role_ids,
        CASE
            WHEN count(DISTINCT details.direct_rights::jsonb) > 0 THEN replace(string_agg(DISTINCT details.direct_rights::text, ', '::text), '], ['::text, ', '::text)::jsonb
            ELSE '[]'::jsonb
        END AS direct_rights,
        CASE
            WHEN count(DISTINCT details.indirect_rights::jsonb) > 0 THEN replace(string_agg(DISTINCT details.indirect_rights::text, ', '::text), '], ['::text, ', '::text)::jsonb
            ELSE '[]'::jsonb
        END AS indirect_rights
   FROM ( SELECT roles_view.id,
            roles_view.code,
            roles_view.display_label AS label,
            ( SELECT array_agg(DISTINCT unnest.unnest) AS array_agg
                   FROM unnest(roles_view.inherited_role_ids) unnest(unnest)) AS role_ids,
            ( SELECT array_agg(DISTINCT unnest.unnest) AS array_agg
                   FROM unnest(roles_view.direct_role_ids) unnest(unnest)) AS direct_role_ids,
            ( SELECT json_agg(DISTINCT r.*) FILTER (WHERE direct_rights.id IS NOT NULL) AS json_agg
                   FROM ( SELECT direct_rights.id,
                            true AS is_direct,
                            direct_rights.code,
                            direct_rights.target_kind_code,
                            direct_rights.display_label AS label,
                                CASE
                                    WHEN count(right_targets_view.id) > 0 THEN json_agg(DISTINCT json_build_object('id', right_targets_view.id, 'ref_obj_pk', right_targets_view.ref_obj_pk, 'label', right_targets_view.label)::jsonb)::jsonb
                                    ELSE '[]'::jsonb
                                END AS targets) r) AS direct_rights,
            ( SELECT json_agg(DISTINCT r.*) FILTER (WHERE indirect_rights.id IS NOT NULL) AS json_agg
                   FROM ( SELECT indirect_rights.id,
                            false AS is_direct,
                            indirect_rights.code,
                            indirect_rights.target_kind_code,
                            indirect_rights.display_label AS label,
                                CASE
                                    WHEN count(indirect_right_targets.id) > 0 THEN json_agg(DISTINCT json_build_object('id', indirect_right_targets.id, 'ref_obj_pk', indirect_right_targets.ref_obj_pk, 'label', indirect_right_targets.label)::jsonb)::jsonb
                                    ELSE '[]'::jsonb
                                END AS targets) r) AS indirect_rights
           FROM roles_view
             LEFT JOIN rights_view direct_rights ON direct_rights.role_id = roles_view.id
             LEFT JOIN right_targets_view ON right_targets_view.right_id = direct_rights.id
             LEFT JOIN rights_view indirect_rights ON indirect_rights.role_id = ANY (roles_view.inherited_role_ids)
             LEFT JOIN right_targets_view indirect_right_targets ON indirect_right_targets.right_id = indirect_rights.id
          GROUP BY roles_view.id, roles_view.code, roles_view.display_label, roles_view.inherited_role_ids, roles_view.direct_role_ids, indirect_rights.id, indirect_rights.code, indirect_rights.target_kind_code, indirect_rights.display_label, direct_rights.id, direct_rights.code, direct_rights.target_kind_code, direct_rights.display_label) details
  GROUP BY details.id, details.code, details.label
  ORDER BY details.label;
""",

'roles_view': """CREATE OR REPLACE VIEW roles_view AS
 WITH RECURSIVE tree AS (
         SELECT roles_1.id,
            roles_1.code,
            roles_1.display_label,
            roles_1.description,
            ARRAY[]::character varying[] AS inherited_roles,
            ARRAY[]::integer[] AS inherited_role_ids
           FROM roles roles_1
             LEFT JOIN roles_has_roles ON roles_has_roles.role_id = roles_1.id
          WHERE roles_has_roles.role_id IS NULL
        UNION ALL
         SELECT roles_1.id,
            roles_1.code,
            roles_1.display_label,
            roles_1.description,
            tree.inherited_roles || tree.code AS inherited_roles,
            tree.inherited_role_ids || tree.id AS inherited_role_ids
           FROM tree
             JOIN roles_has_roles ON roles_has_roles.has_role_id = tree.id
             JOIN roles roles_1 ON roles_1.id = roles_has_roles.role_id
        )
 SELECT roles.id,
    roles.code,
    roles.display_label,
    roles.description,
    array_cat_agg(roles.inherited_roles) AS inherited_roles,
    array_cat_agg(roles.inherited_role_ids) AS inherited_role_ids,
    array_agg(roles.inherited_roles[array_length(roles.inherited_roles, 1)]) AS direct_roles,
    array_agg(roles.inherited_role_ids[array_length(roles.inherited_role_ids, 1)]) AS direct_role_ids
   FROM tree roles
  GROUP BY roles.id, roles.code, roles.display_label, roles.description;
""",

'teams': """CREATE OR REPLACE VIEW teams AS
 SELECT roles.id AS role_id,
    roles.code,
    roles.display_label,
        CASE
            WHEN count(manager_roles.code) > 0 THEN json_object_agg(DISTINCT manager_roles.code, manager_users.name) FILTER (WHERE manager_roles.code IS NOT NULL)
            ELSE '{}'::json
        END AS managers,
        CASE
            WHEN count(user_roles.code) > 0 THEN json_object_agg(DISTINCT user_roles.code, user_roles.user_name) FILTER (WHERE user_roles.code IS NOT NULL)
            ELSE '{}'::json
        END AS users
   FROM roles
     JOIN roles_has_roles ON roles_has_roles.role_id = roles.id
     JOIN roles other_roles ON other_roles.id = roles_has_roles.has_role_id
     LEFT JOIN rights_view ON (roles.id = ANY (rights_view.target_ids)) AND rights_view.code::text = 'manage_team'::text
     LEFT JOIN roles manager_roles ON manager_roles.id = rights_view.role_id
     LEFT JOIN users manager_users ON manager_users.role_id = manager_roles.id
     LEFT JOIN ( SELECT roles_1.code,
            roles_has_roles_1.has_role_id AS team_role_id,
            users.name AS user_name
           FROM roles roles_1
             JOIN roles_has_roles roles_has_roles_1 ON roles_has_roles_1.role_id = roles_1.id
             JOIN users ON users.role_id = roles_1.id AND users.status_code::text = 'enabled'::text) user_roles ON user_roles.team_role_id = roles.id
  WHERE other_roles.code::text = 'operational'::text
  GROUP BY roles.id, roles.code, roles.display_label;
""",

'under_budget_entries': """CREATE OR REPLACE VIEW under_budget_entries AS
 SELECT DISTINCT work_entries.id,
    work_entries.role_id,
    budget_days.budget_id,
    work_entries.date_performed AS date,
    work_entries.work_chart_id,
    budget_days.kind_code,
    work_entries.chart_ids AS ids,
    work_entries.labels,
    work_entry_durations.duration,
    budget_days."position"
   FROM work_entry_durations
     JOIN ( SELECT DISTINCT work_entries_1.id,
            work_entries_1.date_created,
            work_entries_1.created_by,
            work_entries_1.last_modified,
            work_entries_1.modified_by,
            work_entries_1.work_chart_id,
            work_entries_1.role_id,
            work_entries_1.date_performed,
            work_entries_1.description,
            work_entries_1.legacy_id,
            charts.labels,
            charts.ids AS chart_ids
           FROM work_entries work_entries_1
             JOIN ( SELECT DISTINCT chart_labels.id,
                    chart_labels.ids,
                    chart_labels.labels
                   FROM transactions
                     JOIN chart_labels ON transactions.work_chart_id = ANY (chart_labels.ids)) charts ON charts.id = work_entries_1.work_chart_id) work_entries ON work_entries.id = work_entry_durations.work_entry_id
     JOIN budget_days ON (budget_days.budget_id = ANY (work_entries.chart_ids)) AND budget_days.date = work_entries.date_performed AND work_entry_durations.kind_code::text ~~ (budget_days.kind_code::text || '%'::text);
""",

'user_details': """CREATE OR REPLACE VIEW user_details AS
 SELECT users.id,
    users.email,
    users.name,
    users.role_id,
    users.status_code,
    users.time_zone_code AS time_zone,
        CASE
            WHEN count(teams.role_id) > 0 THEN array_agg(teams.role_id)
            ELSE ARRAY[]::integer[]
        END AS team_ids,
    role_details.role_ids,
    role_details.direct_role_ids,
    role_details.direct_rights,
    role_details.indirect_rights
   FROM users
     JOIN role_details ON role_details.id = users.role_id
     LEFT JOIN teams ON teams.users::jsonb @> ((((('{"'::text || role_details.code::text) || '": "'::text) || users.name::text) || '"}'::text)::jsonb)
  GROUP BY users.id, users.email, users.role_id, users.status_code, users.time_zone_code, role_details.role_ids, role_details.direct_role_ids, role_details.direct_rights, role_details.indirect_rights
  ORDER BY users.name;
""",

'users_details': """CREATE OR REPLACE VIEW users_details AS
 SELECT users.id,
    users.email,
    users.name,
    users.role_id,
    users.status_code,
    users.time_zone_code AS time_zone,
    ( SELECT COALESCE(array_to_json(array_agg(r.*)), '[]'::json) AS "coalesce"
           FROM roles_has_roles rhr
             JOIN roles r ON r.id = rhr.has_role_id
          WHERE rhr.role_id = users.role_id AND (rhr.has_role_id IN ( SELECT rhrs.role_id
                   FROM roles_has_roles rhrs
                     JOIN roles rs ON rhrs.has_role_id = rs.id
                  WHERE rs.code::text = 'operational'::text))) AS myteam,
    ( SELECT COALESCE(array_to_json(array_agg(r.*)), '[]'::json) AS "coalesce"
           FROM roles_has_roles rhr
             JOIN roles r ON r.id = rhr.has_role_id
          WHERE rhr.role_id = users.role_id AND (rhr.has_role_id IN ( SELECT rhrs.role_id
                   FROM roles_has_roles rhrs
                     JOIN roles rs ON rhrs.has_role_id = rs.id
                  WHERE rs.code::text <> 'operational'::text))) AS myroles,
    ( SELECT COALESCE(array_to_json(array_agg(r.*)), '[]'::json) AS "coalesce"
           FROM ( SELECT r_1.id,
                    true AS is_direct,
                    r_t.code,
                    r_t.target_kind_code,
                    r_t.display_label AS label,
                    ( SELECT COALESCE(array_to_json(array_agg(tar.*)), '[]'::json) AS "coalesce"
                           FROM ( SELECT r_tar.id,
                                    r_tar.ref_obj_pk,
CASE r_t.target_kind_code
 WHEN 'role'::text THEN ( SELECT roles_target_label.display_label
    FROM roles roles_target_label
   WHERE roles_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'site_mgmt_action'::text THEN ( SELECT roles_target_label.display_label
    FROM roles roles_target_label
   WHERE roles_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'user'::text THEN ( SELECT users_target_label.username
    FROM users users_target_label
   WHERE users_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'work_chart'::text THEN ( SELECT work_chart_target_label.display_label
    FROM work_chart work_chart_target_label
   WHERE work_chart_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'account'::text THEN ( SELECT work_chart_target_label.display_label
    FROM work_chart work_chart_target_label
   WHERE work_chart_target_label.id = r_tar.ref_obj_pk::integer)
 ELSE NULL::character varying
END AS label
                                   FROM right_targets r_tar
                                  WHERE r_tar.right_id = r_1.id) tar) AS targets
                   FROM rights r_1
                     JOIN right_types r_t ON r_t.id = r_1.right_type_id
                  WHERE r_1.role_id = users.role_id) r) AS rights_direct,
    ( SELECT COALESCE(array_to_json(array_agg(r.*)), '[]'::json) AS "coalesce"
           FROM ( SELECT r_1.id,
                    false AS is_direct,
                    r_t.code,
                    r_t.target_kind_code,
                    r_t.display_label AS label,
                    ( SELECT COALESCE(array_to_json(array_agg(tar.*)), '[]'::json) AS "coalesce"
                           FROM ( SELECT r_tar.id,
                                    r_tar.ref_obj_pk,
CASE r_t.target_kind_code
 WHEN 'role'::text THEN ( SELECT roles_target_label.display_label
    FROM roles roles_target_label
   WHERE roles_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'site_mgmt_action'::text THEN ( SELECT roles_target_label.display_label
    FROM roles roles_target_label
   WHERE roles_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'user'::text THEN ( SELECT users_target_label.username
    FROM users users_target_label
   WHERE users_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'work_chart'::text THEN ( SELECT work_chart_target_label.display_label
    FROM work_chart work_chart_target_label
   WHERE work_chart_target_label.id = r_tar.ref_obj_pk::integer)
 WHEN 'account'::text THEN ( SELECT work_chart_target_label.display_label
    FROM work_chart work_chart_target_label
   WHERE work_chart_target_label.id = r_tar.ref_obj_pk::integer)
 ELSE NULL::character varying
END AS label
                                   FROM right_targets r_tar
                                  WHERE r_tar.right_id = r_1.id) tar) AS targets
                   FROM rights r_1
                     JOIN right_types r_t ON r_t.id = r_1.right_type_id
                     JOIN roles r_for_rights ON r_for_rights.id = r_1.role_id
                  WHERE (EXISTS ( SELECT r_1_1.id,
                            r_1_1.date_created,
                            r_1_1.created_by,
                            r_1_1.last_modified,
                            r_1_1.modified_by,
                            r_1_1.code,
                            r_1_1.display_label,
                            r_1_1.description
                           FROM roles_has_roles rhr
                             JOIN roles r_1_1 ON r_1_1.id = rhr.has_role_id
                          WHERE rhr.role_id = users.role_id AND (rhr.has_role_id IN ( SELECT rhrs.role_id
                                   FROM roles_has_roles rhrs
                                     JOIN roles rs ON rhrs.has_role_id = rs.id
                                  WHERE rs.code::text <> 'operational'::text)) AND r_1_1.id = r_for_rights.id))) r) AS rights_by_roles
   FROM users users;
""",

'work_chart_tree_view': """CREATE OR REPLACE VIEW work_chart_tree_view AS
 SELECT tree.id,
    tree.parent_id,
    tree.level - 1 AS level,
    tree.branch,
    tree.pos
   FROM connectby('work_chart'::text, 'id'::text, 'parent_id'::text, 'branch_order, display_label'::text, 1::text, 0, '~'::text) tree(id integer, parent_id integer, level integer, branch text, pos integer)
  ORDER BY tree.pos;
""",

'work_hours_stats': """CREATE OR REPLACE VIEW work_hours_stats AS
 SELECT work_entries.date_performed,
    sum(work_entry_durations.duration) AS duration,
        CASE
            WHEN work_entry_durations.kind_code::text ~~ '%pto'::text THEN 'pto'::text
            WHEN work_entry_durations.kind_code::text ~~ 'nonbillable%'::text THEN 'nonbillable'::text
            ELSE 'billable'::text
        END AS kind,
    roles.code AS role_code
   FROM work_entry_durations
     JOIN work_entries ON work_entries.id = work_entry_durations.work_entry_id
     JOIN roles ON roles.id = work_entries.role_id
  GROUP BY work_entries.date_performed, (
        CASE
            WHEN work_entry_durations.kind_code::text ~~ '%pto'::text THEN 'pto'::text
            WHEN work_entry_durations.kind_code::text ~~ 'nonbillable%'::text THEN 'nonbillable'::text
            ELSE 'billable'::text
        END), roles.code
  ORDER BY work_entries.date_performed;
"""}

# Order matters here, as some of the views are dependent on others
for view in views:
  stripped_view = view.strip('\n')
  print(create_views[stripped_view])

print('''
    sql
  end
end''')
