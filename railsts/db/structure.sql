--
-- PostgreSQL database dump
--

\restrict C8EuoyWSojPFEAzmpIXVIMifsJhLncu4KG18D9AxxMpWP3RuIyP5LNw0K7iYTme

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
-- Name: tablefunc; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;


--
-- Name: EXTENSION tablefunc; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION tablefunc IS 'functions that manipulate whole tables, including crosstab';


--
-- Name: budget_info; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.budget_info AS (
	work_chart_id integer,
	labels text[],
	"position" integer
);


--
-- Name: budget_stats; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.budget_stats AS (
	hours_bought interval,
	hours_used interval
);


--
-- Name: cron_spec; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cron_spec AS (
	minutes smallint,
	hours smallint,
	day_of_month smallint,
	month smallint,
	day_of_week smallint,
	year smallint
);


--
-- Name: _keep_relationship_nodes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._keep_relationship_nodes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
          begin
              if exists ( select
                            count(distinct work_chart.id) as count_rows
                          from work_chart
                          inner join work_chart parents
                                  on parents.id = work_chart.parent_id
                                and parents.display_label = 'Clients'
                          inner join work_chart rels
                                  on rels.display_label = work_chart.display_label
                                and rels.id <> work_chart.id
                          inner join work_chart main_rel
                                  on main_rel.display_label = 'Client Relationship'
                                and main_rel.parent_id = 2
                                and rels.parent_id = main_rel.id
                                and main_rel.id = old.parent_id
                          where
                            work_chart.display_label = old.display_label
                        )
              then
                raise exception 'Cannot remove client relationship node for the client node that still exists';
                return null;
              else
                return old;
              end if;
          end;
      $$;


--
-- Name: array_sum(bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.array_sum(bigint[]) RETURNS bigint
    LANGUAGE sql
    AS $_$
SELECT sum($1[i])::bigint
FROM generate_series(array_lower($1,1), array_upper($1,1)) index(i);
$_$;


--
-- Name: array_sum(interval[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.array_sum(interval[]) RETURNS interval
    LANGUAGE sql
    AS $_$
SELECT sum($1[i])::interval
FROM generate_series(array_lower($1,1), array_upper($1,1)) index(i);
$_$;


--
-- Name: check_accounts_reference(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_accounts_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
          ref_id INTEGER;
      BEGIN

          /* Short-circuit: the FK trigger for this violation tends to go off
              _after_ this trigger, so the error message is misleading.
          */
          IF NOT EXISTS(SELECT 1 FROM account_kinds WHERE code = NEW.kind_code) THEN
              RETURN NEW;
          END IF;

          SELECT id INTO ref_id
          FROM (SELECT id, 'work_chart' AS kind_code
                FROM work_chart
                UNION
                SELECT id, 'role' AS kind_code
                FROM roles) AS reference_targets
          WHERE reference_targets.id = NEW.reference_id
          AND   reference_targets.kind_code = NEW.kind_code;

          IF ref_id IS NULL THEN
              RAISE EXCEPTION 'accounts.reference_id % not found in work_chart or roles', NEW.reference_id;
          END IF;

          RETURN NEW;
      END;
      $$;


--
-- Name: compile_budget(integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.compile_budget(_work_chart_id integer, _kind_prefix character varying) RETURNS public.budget_stats
    LANGUAGE plpgsql
    AS $$
      declare
        result budget_stats;
      begin
        select
          sum(billed.duration) as duration_sum
        into result.hours_used
        from (
          select
          stats.date,
          stats.duration,
          stats.budget_id
        from (
          select
            entries.date,
            entries.labels,
            entries.ids,
            entries.duration,
            first_value(days.work_chart_id) over (partition by entries.id order by days.position desc) as budget_id,
            days.position
          from (
            select
              work_entries.id,
              work_entries.date_performed as date,
              work_entries.work_chart_id,
              chart_labels.ids,
              chart_labels.labels,
              work_entry_durations.duration
            from work_entry_durations
            inner join work_entries
                    on work_entries.id = work_entry_durations.work_entry_id
            inner join chart_labels
                    on chart_labels.id = work_entries.work_chart_id
            where
                  _work_chart_id = any(chart_labels.ids)
                    and work_entry_durations.kind_code like _kind_prefix
            order by work_entries.date_performed
          ) entries
          inner join (
            select
              worked_days.date_performed as date,
              transactions.work_chart_id,
              chart_labels.ids,
              array_length(chart_labels.ids, 1) as position
            from transactions
            inner join chart_labels
                    on chart_labels.id = transactions.work_chart_id
            inner join(
              select
                distinct work_entries.date_performed
              from work_entries
              inner join chart_labels on work_entries.work_chart_id = chart_labels.id
              where _work_chart_id = any(chart_labels.ids)
              order by date_performed
              )  worked_days
              on worked_days.date_performed >= transactions.date
                  and ( transactions.date_closed is null or worked_days.date_performed < transactions.date_closed )
                  and ( transactions.kind_code like _kind_prefix or transactions.kind_code is null )
            and _work_chart_id = any(chart_labels.ids)
            group by worked_days.date_performed, transactions.work_chart_id, chart_labels.ids
            order by worked_days.date_performed
            ) days
            on days.date = entries.date
            and days.work_chart_id = any(entries.ids)
          order by days.date
          ) stats
        where
          stats.budget_id = _work_chart_id
        ) billed;

        select
          sum(transactions.hours) * interval '1 hour' as hours_bought
        into
          result.hours_bought
        from transactions
        where
              transactions.work_chart_id = _work_chart_id
          and transactions.date <= now()
          and ( transactions.date_closed is null or transactions.date_closed > now() )
          and transactions.kind_code like _kind_prefix;

        return result;

      end
      $$;


--
-- Name: ensure_durations_logged(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_durations_logged(date_performed date) RETURNS void
    LANGUAGE plpgsql
    AS $$
        declare
          duration record;
        begin
          for duration in
            select work_entry_durations.*
            from work_entry_durations
          inner join work_entries
                  on work_entries.id = work_entry_durations.work_entry_id
                and work_entries.date_performed >= ensure_durations_logged.date_performed
          except
          select work_entry_durations.*
          from work_entry_durations
          inner join budget_events
                  on budget_events.cause_id = work_entry_durations.id
          loop
            update work_entry_durations set id = duration.id
            where id = duration.id;
          end loop;
        end;
      $$;


--
-- Name: get_curent_budget_for(integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_curent_budget_for(_work_chart_id integer, _kind_prefix character varying) RETURNS public.budget_info
    LANGUAGE plpgsql
    AS $$
      declare
        result budget_info;
      begin
        select
          transactions.work_chart_id,
          transaction_labels.labels,
          array_length(transaction_labels.ids, 1) as position
        into result.work_chart_id, result.labels, result.position
        from transactions
        inner join chart_labels
                on now() >= transactions.date
              and ( transactions.date_closed is null or now() < transactions.date_closed )
              and chart_labels.id = _work_chart_id
              and ( transactions.kind_code like _kind_prefix or transactions.kind_code is null )
              and transactions.work_chart_id = any(chart_labels.ids)
        inner join chart_labels transaction_labels
                on transaction_labels.id = transactions.work_chart_id
        order by position desc
        limit 1;

        return result;

      end
      $$;


--
-- Name: guard_parent_charts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_parent_charts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        declare
          child_id integer;
        begin
          select id into child_id
          from work_chart
          where parent_id = OLD.id
          limit 1;

          if child_id is not null then
            raise exception 'Cannot delete a work chart that has children';
          end if;

          return old;
        end;
      $$;


--
-- Name: integer_idx(integer[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.integer_idx(integer[], integer) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$ 
    SELECT MIN(CASE WHEN $1[i] = $2 THEN i 
    ELSE NULL END)::int 
    FROM generate_series(array_lower($1, 1), 
    array_upper($1, 1)) i; 
    $_$;


--
-- Name: refresh_charts_matererialized_views(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_charts_matererialized_views() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            begin
                refresh materialized view concurrently chart_labels;
                refresh materialized view concurrently charts_search_specs;
                return null;
            end $$;


--
-- Name: right_types_code_lowercase(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.right_types_code_lowercase() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.code := LOWER(NEW.code);
    RETURN NEW;
END;
$$;


--
-- Name: right_types_name_lowercase(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.right_types_name_lowercase() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.name := LOWER(NEW.name);
    RETURN NEW;
END;
$$;


--
-- Name: rights_enforce_target_type(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rights_enforce_target_type() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_type     TEXT;
    right_id        INTEGER;
BEGIN
    target_type := TG_ARGV[0];
    right_id := NEW.right_id;
    
    PERFORM 1
    FROM right_types rt
    JOIN rights r
        ON rt.id = r.right_type_id
    WHERE r.id = right_id AND rt.target_kind_code = target_type;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operation only valid for right types with target "%s"', target_type;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: timesheet_get_kids(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.timesheet_get_kids(integer) RETURNS SETOF integer
    LANGUAGE plpgsql
    AS $_$
 DECLARE
   parent   ALIAS FOR $1;
   myrec    RECORD;
   myrec2   RECORD;
 BEGIN
 
   RETURN NEXT parent;
   FOR myrec IN SELECT id FROM work_chart WHERE parent_id = parent ORDER BY id ASC LOOP
     -- RETURN NEXT myrec.id;
     FOR myrec2 IN SELECT * FROM timesheet_get_kids(myrec.id) id LOOP
       RETURN NEXT myrec2.id;
     END LOOP;
   END LOOP;
 
 RETURN;
 END;
$_$;


--
-- Name: timesheet_get_kids(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.timesheet_get_kids(text) RETURNS SETOF integer
    LANGUAGE plpgsql
    AS $_$
 DECLARE
   pname   TEXT = $1;
   parent  INTEGER;
   myrec   RECORD;
   numrows INTEGER;
 BEGIN
 
   SELECT INTO parent id FROM work_chart
     WHERE LOWER(display_label) ~ ('^'||LOWER(pname))
     ORDER BY parent_id ASC, id ASC LIMIT 1;
   IF NOT FOUND THEN
     RAISE EXCEPTION 'Could not find a node with a name of %', pname;
   END IF;
 
   FOR myrec IN SELECT id FROM timesheet_get_kids(parent) id LOOP
     RETURN NEXT myrec.id;
   END LOOP;
 
 RETURN;
 END;
$_$;


--
-- Name: update_last_modified(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_last_modified() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: work_chart_restrict_entries_to_leaf(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.work_chart_restrict_entries_to_leaf() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    do_check    BOOLEAN;
    parent_id   INTEGER;
    entry_id    INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        do_check := TRUE;
    ELSIF TG_OP = 'UPDATE' THEN
        do_check := NEW.parent_id <> OLD.parent_id;
    END IF;

    IF do_check THEN
        parent_id := NEW.parent_id;

        SELECT e.id INTO entry_id
        FROM work_entries e
        WHERE e.work_chart_id = parent_id
        LIMIT 1;

        IF entry_id IS NOT NULL THEN
            RAISE EXCEPTION 'work_chart.parent_id cannot refer to a tuple referenced by work_entries (parent_id: %)', parent_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: work_entry_audits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.work_entry_audits() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        begin
          INSERT INTO 
            work_entry_audits
            (date_created,
            created_by,
            last_modified,
            modified_by,
            work_chart_id,
            role_id,
            date_performed,
            description,
            legacy_id,
            work_entries_id,
            audit_timestamp)
          VALUES 
          (OLD.date_created,
           OLD.created_by,
           OLD.last_modified,
           OLD.modified_by,
           OLD.work_chart_id,
           OLD.role_id,
           OLD.date_performed,
           OLD.description,
           OLD.legacy_id,
           OLD.id,
           NOW());

          return NEW;
        end;
      $$;


--
-- Name: work_entry_duration_production_category(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.work_entry_duration_production_category() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    p_cat_id    INTEGER;
    kind_code   VARCHAR(30);
    do_change   BOOLEAN;
BEGIN

    IF TG_OP = 'INSERT' THEN
        do_change := NEW.production_category_id IS NULL;
    ELSIF NEW.kind_code <> OLD.kind_code THEN
        do_change := NEW.production_category_id IS NULL;
    END IF;

    IF do_change THEN
        kind_code := NEW.kind_code;

        SELECT production_category_id
        INTO p_cat_id
        FROM duration_kinds
        WHERE code = kind_code;

        NEW.production_category_id := p_cat_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: work_entry_durations_audits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.work_entry_durations_audits() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        begin
          IF (TG_OP = 'DELETE') 
             OR 
             (TG_OP = 'UPDATE' AND (OLD.kind_code != NEW.kind_code 
                                    OR 
                                    OLD.production_category_id != NEW.production_category_id
                                    OR
                                    OLD.duration != NEW.duration
                                    OR
                                    OLD.rate != NEW.rate)
             ) THEN
            INSERT INTO 
              work_entry_durations_audits
              (date_created,
              created_by,
              last_modified,
              modified_by,
              work_entry_id,
              kind_code,
              production_category_id,
              duration,
              rate,
              audit_timestamp)
            VALUES 
            (OLD.date_created,
             OLD.created_by,
             OLD.last_modified,
             OLD.modified_by,
             OLD.work_entry_id,
             OLD.kind_code,
             OLD.production_category_id,
             OLD.duration,
             OLD.rate,
             NOW());
          END IF;

          IF TG_OP = 'UPDATE' THEN
            RETURN NEW;
          END IF;

          IF TG_OP = 'DELETE' THEN
            RETURN OLD;
          END IF;
        end;
      $$;


--
-- Name: work_entry_restrict_to_leaf(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.work_entry_restrict_to_leaf() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    do_check    BOOLEAN;
    node_id     INTEGER;
    leaf_id     INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        do_check := TRUE;
    ELSIF TG_OP = 'UPDATE' THEN
        do_check := NEW.work_chart_id <> OLD.work_chart_id;
    END IF;
    
    IF do_check THEN
        node_id := NEW.work_chart_id;
        
        SELECT c.id INTO leaf_id
        FROM work_chart c
        WHERE c.parent_id = node_id
        LIMIT 1;

        IF leaf_id IS NOT NULL THEN
            RAISE EXCEPTION 'work_entries may only refer to work_chart records with no children (work_chart_id: %)', node_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: array_cat_agg(anycompatiblearray); Type: AGGREGATE; Schema: public; Owner: -
--

CREATE AGGREGATE public.array_cat_agg(anycompatiblearray) (
    SFUNC = array_cat,
    STYPE = anycompatiblearray
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_kinds (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    display_label character varying(100) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT account_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT account_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text))))
);


--
-- Name: account_transaction_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_transaction_kinds (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    is_credit boolean NOT NULL,
    display_label character varying(100) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT account_transaction_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT account_transaction_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text))))
);


--
-- Name: account_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_transactions (
    id integer DEFAULT nextval('public.account_transactions_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    account_id integer NOT NULL,
    kind_code character varying(30) NOT NULL,
    value interval NOT NULL,
    notes text NOT NULL,
    reference_stamp timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT account_transactions_id_valid CHECK ((id > 0)),
    CONSTRAINT account_transactions_value_not_negative CHECK ((value >= '00:00:00'::interval))
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer DEFAULT nextval('public.accounts_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    reference_id integer NOT NULL,
    kind_code character varying(30) NOT NULL,
    display_label character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT accounts_id_valid CHECK ((id > 0))
);


--
-- Name: accounts_summary_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.accounts_summary_view AS
 SELECT a.id AS account_id,
    max(t.reference_stamp) AS last_transaction,
    count(t.value) AS num_transactions,
    sum(
        CASE
            WHEN k.is_credit THEN t.value
            ELSE (- t.value)
        END) AS balance
   FROM ((public.accounts a
     LEFT JOIN public.account_transactions t ON ((a.id = t.account_id)))
     JOIN public.account_transaction_kinds k ON (((k.code)::text = (t.kind_code)::text)))
  GROUP BY a.id;


--
-- Name: actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actions (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    display_label character varying(100) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT actions_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text))))
);


--
-- Name: work_chart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_chart_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_chart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_chart (
    id integer DEFAULT nextval('public.work_chart_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    parent_id integer,
    branch_order integer,
    display_label character varying(100) NOT NULL,
    status character varying(30) NOT NULL,
    dont_send_empty_reports boolean DEFAULT false,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_chart_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text)))),
    CONSTRAINT work_chart_id_valid CHECK ((id > 0))
);


--
-- Name: chart_labels; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.chart_labels AS
 WITH RECURSIVE tree AS (
         SELECT work_chart.id,
            work_chart.parent_id,
            work_chart.display_label,
            ARRAY[(work_chart.display_label)::text] AS labels,
            ARRAY[work_chart.id] AS ids,
            work_chart.status AS tree_status
           FROM public.work_chart
          WHERE (work_chart.parent_id = 1)
        UNION ALL
         SELECT f1.id,
            f1.parent_id,
            f1.display_label,
            array_append(tree_1.labels, (f1.display_label)::text) AS labels,
            array_append(tree_1.ids, f1.id) AS ids,
                CASE
                    WHEN (((f1.status)::text = 'hidden'::text) OR ((tree_1.tree_status)::text = 'hidden'::text)) THEN 'hidden'::character varying(30)
                    WHEN (((f1.status)::text = 'dead'::text) OR ((tree_1.tree_status)::text = 'dead'::text)) THEN 'dead'::character varying(30)
                    ELSE 'active'::character varying(30)
                END AS tree_status
           FROM (tree tree_1
             JOIN public.work_chart f1 ON ((f1.parent_id = tree_1.id)))
        )
 SELECT id,
    labels,
    ids,
    tree_status
   FROM tree
  WITH NO DATA;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    date date,
    hours double precision,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    user_id integer,
    work_chart_id integer,
    description text,
    date_closed date,
    kind_code character varying(30),
    recur_at public.cron_spec,
    mode character varying DEFAULT 'cumulative'::character varying,
    CONSTRAINT hours_round_to_fifteen_minutes CHECK ((((hours)::numeric % 0.25) = (0)::numeric))
);


--
-- Name: active_hours_bought; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_hours_bought AS
 SELECT transactions.work_chart_id AS budget_id,
    transactions.kind_code,
    chart_labels.labels,
    (sum(transactions.hours) * '01:00:00'::interval) AS total_bought
   FROM (public.transactions
     JOIN public.chart_labels ON ((chart_labels.id = transactions.work_chart_id)))
  WHERE ((transactions.date <= CURRENT_DATE) AND ((transactions.date_closed IS NULL) OR (transactions.date_closed > (now())::date)))
  GROUP BY transactions.work_chart_id, chart_labels.labels, transactions.kind_code;


--
-- Name: budget_days; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.budget_days AS
 WITH RECURSIVE budget_days_1(budget_id, labels, date, date_closed, kind_code) AS (
         SELECT chart_labels.id AS budget_id,
            chart_labels.labels,
            transactions.date,
            transactions.date_closed,
            transactions.kind_code
           FROM (public.transactions
             JOIN public.chart_labels ON ((chart_labels.id = transactions.work_chart_id)))
          WHERE ((transactions.date <= (now())::date) AND ((transactions.date_closed IS NULL) OR (transactions.date_closed > (now())::date)))
        UNION
         SELECT budget_days_1_1.budget_id,
            budget_days_1_1.labels,
            ((budget_days_1_1.date + '1 day'::interval))::date AS date,
            budget_days_1_1.date_closed,
            budget_days_1_1.kind_code
           FROM budget_days_1 budget_days_1_1
          WHERE (((budget_days_1_1.date_closed IS NULL) AND (budget_days_1_1.date <= now())) OR ((budget_days_1_1.date_closed IS NOT NULL) AND (budget_days_1_1.date < budget_days_1_1.date_closed)))
        )
 SELECT budget_id,
    labels,
    date,
    kind_code,
    array_length(labels, 1) AS "position"
   FROM budget_days_1;


--
-- Name: work_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entries (
    id integer DEFAULT nextval('public.work_entries_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_chart_id integer NOT NULL,
    role_id integer NOT NULL,
    date_performed date NOT NULL,
    description text NOT NULL,
    legacy_id integer,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_entries_id_valid CHECK ((id > 0))
);


--
-- Name: work_entry_durations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entry_durations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entry_durations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_durations (
    id integer DEFAULT nextval('public.work_entry_durations_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_entry_id integer NOT NULL,
    kind_code character varying(30) NOT NULL,
    production_category_id integer NOT NULL,
    duration interval NOT NULL,
    rate numeric,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_entry_durations_id_valid CHECK ((id > 0))
);


--
-- Name: under_budget_entries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.under_budget_entries AS
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
   FROM ((public.work_entry_durations
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
           FROM (public.work_entries work_entries_1
             JOIN ( SELECT DISTINCT chart_labels.id,
                    chart_labels.ids,
                    chart_labels.labels
                   FROM (public.transactions
                     JOIN public.chart_labels ON ((transactions.work_chart_id = ANY (chart_labels.ids))))) charts ON ((charts.id = work_entries_1.work_chart_id)))) work_entries ON ((work_entries.id = work_entry_durations.work_entry_id)))
     JOIN public.budget_days ON (((budget_days.budget_id = ANY (work_entries.chart_ids)) AND (budget_days.date = work_entries.date_performed) AND ((work_entry_durations.kind_code)::text ~~ ((budget_days.kind_code)::text || '%'::text)))));


--
-- Name: budget_entries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.budget_entries AS
 SELECT DISTINCT ON (entries.id) first_value(id) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS id,
    first_value(date) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS date,
    first_value(role_id) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS role_id,
    first_value(labels) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS labels,
    first_value(ids) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS ids,
    first_value(duration) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS duration,
    first_value(budget_id) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS budget_id,
    first_value(kind_code) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS kind_code
   FROM public.under_budget_entries entries;


--
-- Name: active_hours_used; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_hours_used AS
 SELECT budget_id,
    sum(duration) AS total_duration,
    array_agg(DISTINCT role_id) AS role_ids,
    kind_code
   FROM public.budget_entries
  GROUP BY budget_id, kind_code;


--
-- Name: all_budget_days; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.all_budget_days AS
 WITH RECURSIVE budget_days_1(budget_id, labels, date, date_closed, kind_code) AS (
         SELECT chart_labels.id AS budget_id,
            chart_labels.labels,
            transactions.date,
            transactions.date_closed,
            transactions.kind_code
           FROM (public.transactions
             JOIN public.chart_labels ON ((chart_labels.id = transactions.work_chart_id)))
        UNION ALL
         SELECT budget_days_1_1.budget_id,
            budget_days_1_1.labels,
            ((budget_days_1_1.date + '1 day'::interval))::date AS date,
            budget_days_1_1.date_closed,
            budget_days_1_1.kind_code
           FROM budget_days_1 budget_days_1_1
          WHERE (((budget_days_1_1.date_closed IS NULL) AND (budget_days_1_1.date <= now())) OR ((budget_days_1_1.date_closed IS NOT NULL) AND (budget_days_1_1.date < budget_days_1_1.date_closed)))
        )
 SELECT budget_id,
    labels,
    date,
    kind_code,
    array_length(labels, 1) AS "position"
   FROM budget_days_1;


--
-- Name: all_under_budget_entries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.all_under_budget_entries AS
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
   FROM (((public.work_entry_durations
     JOIN public.work_entries ON ((work_entries.id = work_entry_durations.work_entry_id)))
     JOIN public.chart_labels ON ((chart_labels.id = work_entries.work_chart_id)))
     JOIN public.all_budget_days ON (((all_budget_days.budget_id = ANY (chart_labels.ids)) AND (all_budget_days.date = work_entries.date_performed) AND ((work_entry_durations.kind_code)::text ~~ ((all_budget_days.kind_code)::text || '%'::text)))));


--
-- Name: all_budget_entries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.all_budget_entries AS
 SELECT DISTINCT ON (entries.id) first_value(id) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS id,
    first_value(date) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS date,
    first_value(role_id) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS role_id,
    first_value(labels) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS labels,
    first_value(ids) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS ids,
    first_value(duration) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS duration,
    first_value(budget_id) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS budget_id,
    first_value(kind_code) OVER (PARTITION BY entries.id ORDER BY "position" DESC) AS kind_code
   FROM public.all_under_budget_entries entries;


--
-- Name: hours_in_the_bank; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.hours_in_the_bank AS
 SELECT bought.budget_id AS work_chart_id,
    bought.labels,
    bought.kind_code,
    bought.total_bought AS hours_bought,
    COALESCE(used.total_duration, '00:00:00'::interval) AS hours_used,
    COALESCE(used.role_ids, ARRAY[]::integer[]) AS role_ids,
    (bought.total_bought - COALESCE(used.total_duration, '00:00:00'::interval)) AS hours_left
   FROM (public.active_hours_bought bought
     LEFT JOIN public.active_hours_used used ON (((used.budget_id = bought.budget_id) AND ((used.kind_code)::text = (bought.kind_code)::text))));


--
-- Name: all_hours_in_the_bank; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.all_hours_in_the_bank AS
 SELECT DISTINCT ON (transactions.work_chart_id, transactions.kind_code) transactions.work_chart_id,
    chart_labels.labels,
    transactions.kind_code,
    sum(hours_in_the_bank.hours_bought) AS hours_bought,
    sum(hours_in_the_bank.hours_used) AS hours_used,
    public.array_cat_agg(hours_in_the_bank.role_ids) AS role_ids,
    sum(hours_in_the_bank.hours_left) AS hours_left
   FROM ((public.transactions
     LEFT JOIN public.hours_in_the_bank ON (((hours_in_the_bank.work_chart_id = transactions.work_chart_id) AND ((hours_in_the_bank.kind_code)::text = (transactions.kind_code)::text))))
     JOIN public.chart_labels ON ((chart_labels.id = transactions.work_chart_id)))
  GROUP BY transactions.id, transactions.work_chart_id, chart_labels.labels, transactions.kind_code;


--
-- Name: approval_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_kinds (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    status integer NOT NULL,
    display_label character varying(100) NOT NULL,
    abbr_label character varying(4) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT approval_kinds_abbr_label_valid CHECK (((length((abbr_label)::text) > 0) AND ((abbr_label)::text = btrim((abbr_label)::text)))),
    CONSTRAINT approval_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT approval_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text))))
);


--
-- Name: approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approvals (
    id integer NOT NULL,
    work_entry_id integer,
    comment text,
    role_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    approved boolean,
    owner_ids integer[]
);


--
-- Name: approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.approvals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.approvals_id_seq OWNED BY public.approvals.id;


--
-- Name: duration_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.duration_kinds (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    status integer NOT NULL,
    display_label character varying(100) NOT NULL,
    abbr_label character varying(4) NOT NULL,
    production_category_id integer NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT duration_kinds_abbr_label_valid CHECK (((length((abbr_label)::text) > 0) AND ((abbr_label)::text = btrim((abbr_label)::text)))),
    CONSTRAINT duration_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT duration_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text))))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) DEFAULT ''::character varying NOT NULL,
    encrypted_password character varying(255) DEFAULT ''::character varying NOT NULL,
    reset_password_token character varying(255),
    reset_password_sent_at timestamp without time zone,
    remember_created_at timestamp without time zone,
    sign_in_count integer DEFAULT 0,
    current_sign_in_at timestamp without time zone,
    last_sign_in_at timestamp without time zone,
    current_sign_in_ip character varying(255),
    last_sign_in_ip character varying(255),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    name character varying(255),
    role_id integer NOT NULL,
    start_date timestamp without time zone,
    time_zone_code character varying(50) NOT NULL,
    status_code character varying(30) NOT NULL,
    username character varying(30) NOT NULL,
    modified_by integer,
    created_by integer,
    CONSTRAINT users_username_check CHECK (((username)::text ~ '^[a-z]{2,}$'::text))
);


--
-- Name: work_entry_fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_fees (
    work_entry_id integer NOT NULL,
    fee numeric(9,2),
    date_created timestamp without time zone DEFAULT now() NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_entry_fees_fee_valid CHECK ((fee >= (0)::numeric))
);


--
-- Name: approvals_summaries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.approvals_summaries AS
 SELECT entries.id,
    entries.work_chart_id,
    entries.date_performed,
    entries.description,
    approvals.owner_ids AS approval_owner_ids,
    json_build_object('id', users.id, 'email', users.email, 'name', users.name) AS owner,
    COALESCE(( SELECT array_agg(a.a) AS array_agg
           FROM unnest(array_agg(DISTINCT rejections.as_json)) a(a)
          WHERE (a.a IS NOT NULL)), ARRAY[]::jsonb[]) AS comments,
    string_agg(DISTINCT (kinds.display_label)::text, ', '::text) AS kind_code_display,
    sum(fees.fee) OVER (PARTITION BY fees.date_created) AS total_fees,
    array_agg(json_build_object('kind_code', durations.kind_code, 'duration', (date_part('epoch'::text, durations.duration) / (60)::double precision))) AS durations
   FROM ((((((public.work_entries entries
     JOIN public.approvals ON (((approvals.work_entry_id = entries.id) AND (approvals.approved IS NULL))))
     JOIN public.users ON ((users.role_id = entries.role_id)))
     LEFT JOIN ( SELECT (json_build_object('username', users_1.name, 'created_at', date(approvals_1.created_at), 'body', approvals_1.comment))::jsonb AS as_json,
            approvals_1.work_entry_id
           FROM (public.approvals approvals_1
             JOIN public.users users_1 ON ((users_1.role_id = approvals_1.role_id)))
          WHERE (approvals_1.approved IS FALSE)
          ORDER BY approvals_1.created_at DESC) rejections ON ((rejections.work_entry_id = entries.id)))
     JOIN public.work_entry_durations durations ON ((durations.work_entry_id = entries.id)))
     JOIN public.duration_kinds kinds ON (((kinds.code)::text = (durations.kind_code)::text)))
     LEFT JOIN public.work_entry_fees fees ON ((fees.work_entry_id = entries.id)))
  GROUP BY entries.id, entries.work_chart_id, entries.date_performed, entries.description, approvals.owner_ids, users.id, users.email, users.name, fees.fee, fees.date_created;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: charts_search_specs; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.charts_search_specs AS
 SELECT chart_labels.id,
    chart_labels.labels,
    chart_labels.tree_status,
    ( SELECT array_agg(wid.wid) AS array_agg
           FROM unnest(array_agg(work_chart.id)) wid(wid)
          WHERE (wid.wid IS NOT NULL)) AS child_ids,
    to_tsvector(array_to_string(chart_labels.labels[2:array_upper(chart_labels.labels, 1)], ' '::text)) AS search_spec
   FROM (public.chart_labels
     LEFT JOIN public.work_chart ON ((work_chart.parent_id = chart_labels.id)))
  GROUP BY chart_labels.id, chart_labels.labels, chart_labels.tree_status
  WITH NO DATA;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    review_id integer,
    author_id integer,
    stage_value integer,
    body text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: communications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.communications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: communications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communications (
    id integer DEFAULT nextval('public.communications_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    description character varying(100) DEFAULT ''::character varying NOT NULL,
    work_chart_id integer NOT NULL,
    communication_date timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    medium_kind character varying(10) NOT NULL,
    action_taken text,
    notes text,
    created_by integer,
    modified_by integer,
    CONSTRAINT communications_description_valid CHECK (((length((description)::text) > 0) AND ((description)::text = btrim((description)::text)))),
    CONSTRAINT communications_id_valid CHECK ((id > 0))
);


--
-- Name: communications_contacts_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communications_contacts_map (
    communication_id integer NOT NULL,
    contact_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: communications_roles_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communications_roles_map (
    communication_id integer NOT NULL,
    role_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: contact_item_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_item_values_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_item_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_item_values (
    id integer DEFAULT nextval('public.contact_item_values_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    contact_item_id integer,
    created_by integer,
    modified_by integer,
    CONSTRAINT contact_item_values_id_valid CHECK ((id > 0))
);


--
-- Name: contact_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_items (
    id integer DEFAULT nextval('public.contact_items_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    contact_id integer NOT NULL,
    kind character varying(50) NOT NULL,
    label character varying(20) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT contact_items_id_valid CHECK ((id > 0))
);


--
-- Name: contact_own_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_own_role (
    contact_id integer NOT NULL,
    role_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: contact_roles_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_roles_map (
    contact_id integer NOT NULL,
    role_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    description character varying(100) DEFAULT ''::character varying NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT contact_roles_description_valid CHECK (((length((description)::text) > 0) AND ((description)::text = btrim((description)::text))))
);


--
-- Name: contact_roles_map_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_roles_map_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_work_charts_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_work_charts_map (
    contact_id integer NOT NULL,
    work_chart_id integer NOT NULL,
    description character varying(100) DEFAULT ''::character varying NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT contact_work_charts_description_valid CHECK (((length((description)::text) > 0) AND ((description)::text = btrim((description)::text))))
);


--
-- Name: contact_work_charts_map_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_work_charts_map_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id integer DEFAULT nextval('public.contacts_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    status integer NOT NULL,
    label character varying(40),
    first_name character varying(40),
    last_name character varying(40),
    created_by integer,
    modified_by integer,
    CONSTRAINT contacts_id_valid CHECK ((id > 0))
);


--
-- Name: cron_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cron_jobs (
    id integer NOT NULL,
    recur_at public.cron_spec NOT NULL,
    task_name character varying NOT NULL,
    arguments jsonb NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: cron_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cron_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cron_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cron_jobs_id_seq OWNED BY public.cron_jobs.id;


--
-- Name: current_cron_jobs; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.current_cron_jobs AS
 SELECT id,
    recur_at,
    task_name,
    arguments,
    created_at,
    updated_at
   FROM public.cron_jobs
  WHERE ((((recur_at).minutes IS NULL) OR (((recur_at).minutes)::double precision = date_part('minute'::text, now()))) AND (((recur_at).hours IS NULL) OR (((recur_at).hours)::double precision = date_part('hour'::text, now()))) AND (((recur_at).day_of_month IS NULL) OR (((recur_at).day_of_month)::double precision = date_part('day'::text, now()))) AND (((recur_at).month IS NULL) OR (((recur_at).month)::double precision = date_part('month'::text, now()))) AND (((recur_at).day_of_week IS NULL) OR (((recur_at).day_of_week)::double precision = date_part('dow'::text, now()))) AND (((recur_at).year IS NULL) OR (((recur_at).year)::double precision = date_part('year'::text, now()))));


--
-- Name: right_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.right_targets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: right_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.right_targets (
    id integer DEFAULT nextval('public.right_targets_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    right_id integer NOT NULL,
    ref_obj_pk text NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: right_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.right_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: right_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.right_types (
    id integer DEFAULT nextval('public.right_types_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    code character varying(50) NOT NULL,
    display_label character varying(100) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    target_kind_code character varying(30),
    created_by integer,
    modified_by integer,
    CONSTRAINT right_types_code_valid CHECK ((((code)::text ~ '[^[:space:]]'::text) AND ((code)::text = btrim((code)::text))))
);


--
-- Name: rights_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rights (
    id integer DEFAULT nextval('public.rights_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    role_id integer NOT NULL,
    right_type_id integer NOT NULL,
    is_granted boolean NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT rights_id_valid CHECK ((id > 0))
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer DEFAULT nextval('public.roles_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    code character varying(50) NOT NULL,
    display_label character varying(100) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT roles_code_valid CHECK ((((code)::text = btrim((code)::text)) AND ((code)::text ~ '[^[:space:]]'::text)))
);


--
-- Name: rights_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.rights_view AS
 SELECT rights.id,
    rights.role_id,
    rights.is_granted,
    right_types.code,
    right_types.display_label,
    right_types.target_kind_code,
        CASE
            WHEN (count(right_targets.ref_obj_pk) > 0) THEN array_agg((right_targets.ref_obj_pk)::integer)
            ELSE ARRAY[]::integer[]
        END AS target_ids
   FROM (((public.rights
     JOIN public.right_types ON ((right_types.id = rights.right_type_id)))
     LEFT JOIN public.right_targets ON ((right_targets.right_id = rights.id)))
     JOIN public.roles ON ((roles.id = rights.role_id)))
  GROUP BY rights.id, rights.role_id, rights.is_granted, right_types.code, right_types.display_label, right_types.target_kind_code;


--
-- Name: roles_has_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles_has_roles (
    role_id integer NOT NULL,
    has_role_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT roles_has_role_nonredundancy CHECK ((role_id <> has_role_id))
);


--
-- Name: teams; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.teams AS
 SELECT roles.id AS role_id,
    roles.code,
    roles.display_label,
        CASE
            WHEN (count(manager_roles.code) > 0) THEN json_object_agg(DISTINCT manager_roles.code, manager_users.name) FILTER (WHERE (manager_roles.code IS NOT NULL))
            ELSE '{}'::json
        END AS managers,
        CASE
            WHEN (count(user_roles.code) > 0) THEN json_object_agg(DISTINCT user_roles.code, user_roles.user_name) FILTER (WHERE (user_roles.code IS NOT NULL))
            ELSE '{}'::json
        END AS users
   FROM ((((((public.roles
     JOIN public.roles_has_roles ON ((roles_has_roles.role_id = roles.id)))
     JOIN public.roles other_roles ON ((other_roles.id = roles_has_roles.has_role_id)))
     LEFT JOIN public.rights_view ON (((roles.id = ANY (rights_view.target_ids)) AND ((rights_view.code)::text = 'manage_team'::text))))
     LEFT JOIN public.roles manager_roles ON ((manager_roles.id = rights_view.role_id)))
     LEFT JOIN public.users manager_users ON ((manager_users.role_id = manager_roles.id)))
     LEFT JOIN ( SELECT roles_1.code,
            roles_has_roles_1.has_role_id AS team_role_id,
            users.name AS user_name
           FROM ((public.roles roles_1
             JOIN public.roles_has_roles roles_has_roles_1 ON ((roles_has_roles_1.role_id = roles_1.id)))
             JOIN public.users ON (((users.role_id = roles_1.id) AND ((users.status_code)::text = 'enabled'::text))))) user_roles ON ((user_roles.team_role_id = roles.id)))
  WHERE ((other_roles.code)::text = 'operational'::text)
  GROUP BY roles.id, roles.code, roles.display_label;


--
-- Name: work_hours_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.work_hours_stats AS
 SELECT work_entries.date_performed,
    sum(work_entry_durations.duration) AS duration,
        CASE
            WHEN ((work_entry_durations.kind_code)::text ~~ '%pto'::text) THEN 'pto'::text
            WHEN ((work_entry_durations.kind_code)::text ~~ 'nonbillable%'::text) THEN 'nonbillable'::text
            ELSE 'billable'::text
        END AS kind,
    roles.code AS role_code
   FROM ((public.work_entry_durations
     JOIN public.work_entries ON ((work_entries.id = work_entry_durations.work_entry_id)))
     JOIN public.roles ON ((roles.id = work_entries.role_id)))
  GROUP BY work_entries.date_performed,
        CASE
            WHEN ((work_entry_durations.kind_code)::text ~~ '%pto'::text) THEN 'pto'::text
            WHEN ((work_entry_durations.kind_code)::text ~~ 'nonbillable%'::text) THEN 'nonbillable'::text
            ELSE 'billable'::text
        END, roles.code
  ORDER BY work_entries.date_performed;


--
-- Name: day_work_totals; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.day_work_totals AS
 SELECT roles.code,
    teams.code AS team_code,
    teams.display_label AS team_display_label,
    work_hours_stats.date_performed,
    json_object_agg(work_hours_stats.kind, work_hours_stats.duration) AS durations
   FROM ((public.roles
     JOIN public.teams ON (((teams.users -> (roles.code)::text) IS NOT NULL)))
     JOIN public.work_hours_stats ON (((work_hours_stats.role_code)::text = (roles.code)::text)))
  GROUP BY roles.code, teams.code, teams.display_label, work_hours_stats.date_performed
  ORDER BY work_hours_stats.date_performed;


--
-- Name: delayed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delayed_jobs (
    id integer NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    handler text NOT NULL,
    last_error text,
    run_at timestamp without time zone,
    locked_at timestamp without time zone,
    failed_at timestamp without time zone,
    locked_by character varying,
    queue character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: delayed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.delayed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: delayed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.delayed_jobs_id_seq OWNED BY public.delayed_jobs.id;


--
-- Name: entry_daily_summaries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.entry_daily_summaries AS
SELECT
    NULL::integer AS id,
    NULL::date AS date_performed,
    NULL::text AS description,
    NULL::integer AS role_id,
    NULL::numeric AS fee_total,
    NULL::jsonb[] AS owners,
    NULL::boolean AS is_invoiced,
    NULL::json AS approved_roles,
    NULL::character varying[] AS kinds,
    NULL::interval AS total_billable,
    NULL::interval AS total_nonbillable,
    NULL::interval AS total_pto,
    NULL::interval AS total_duration,
    NULL::integer AS work_chart_id,
    NULL::text[] AS work_chart_label_parts;


--
-- Name: users_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.users_details AS
 SELECT id,
    email,
    name,
    role_id,
    status_code,
    time_zone_code AS time_zone,
    ( SELECT COALESCE(array_to_json(array_agg(r.*)), '[]'::json) AS "coalesce"
           FROM (public.roles_has_roles rhr
             JOIN public.roles r ON ((r.id = rhr.has_role_id)))
          WHERE ((rhr.role_id = users.role_id) AND (rhr.has_role_id IN ( SELECT rhrs.role_id
                   FROM (public.roles_has_roles rhrs
                     JOIN public.roles rs ON ((rhrs.has_role_id = rs.id)))
                  WHERE ((rs.code)::text = 'operational'::text))))) AS myteam,
    ( SELECT COALESCE(array_to_json(array_agg(r.*)), '[]'::json) AS "coalesce"
           FROM (public.roles_has_roles rhr
             JOIN public.roles r ON ((r.id = rhr.has_role_id)))
          WHERE ((rhr.role_id = users.role_id) AND (rhr.has_role_id IN ( SELECT rhrs.role_id
                   FROM (public.roles_has_roles rhrs
                     JOIN public.roles rs ON ((rhrs.has_role_id = rs.id)))
                  WHERE ((rs.code)::text <> 'operational'::text))))) AS myroles,
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
    FROM public.roles roles_target_label
   WHERE (roles_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'site_mgmt_action'::text THEN ( SELECT roles_target_label.display_label
    FROM public.roles roles_target_label
   WHERE (roles_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'user'::text THEN ( SELECT users_target_label.username
    FROM public.users users_target_label
   WHERE (users_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'work_chart'::text THEN ( SELECT work_chart_target_label.display_label
    FROM public.work_chart work_chart_target_label
   WHERE (work_chart_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'account'::text THEN ( SELECT work_chart_target_label.display_label
    FROM public.work_chart work_chart_target_label
   WHERE (work_chart_target_label.id = (r_tar.ref_obj_pk)::integer))
 ELSE NULL::character varying
END AS label
                                   FROM public.right_targets r_tar
                                  WHERE (r_tar.right_id = r_1.id)) tar) AS targets
                   FROM (public.rights r_1
                     JOIN public.right_types r_t ON ((r_t.id = r_1.right_type_id)))
                  WHERE (r_1.role_id = users.role_id)) r) AS rights_direct,
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
    FROM public.roles roles_target_label
   WHERE (roles_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'site_mgmt_action'::text THEN ( SELECT roles_target_label.display_label
    FROM public.roles roles_target_label
   WHERE (roles_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'user'::text THEN ( SELECT users_target_label.username
    FROM public.users users_target_label
   WHERE (users_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'work_chart'::text THEN ( SELECT work_chart_target_label.display_label
    FROM public.work_chart work_chart_target_label
   WHERE (work_chart_target_label.id = (r_tar.ref_obj_pk)::integer))
 WHEN 'account'::text THEN ( SELECT work_chart_target_label.display_label
    FROM public.work_chart work_chart_target_label
   WHERE (work_chart_target_label.id = (r_tar.ref_obj_pk)::integer))
 ELSE NULL::character varying
END AS label
                                   FROM public.right_targets r_tar
                                  WHERE (r_tar.right_id = r_1.id)) tar) AS targets
                   FROM ((public.rights r_1
                     JOIN public.right_types r_t ON ((r_t.id = r_1.right_type_id)))
                     JOIN public.roles r_for_rights ON ((r_for_rights.id = r_1.role_id)))
                  WHERE (EXISTS ( SELECT r_1_1.id,
                            r_1_1.date_created,
                            r_1_1.created_by,
                            r_1_1.last_modified,
                            r_1_1.modified_by,
                            r_1_1.code,
                            r_1_1.display_label,
                            r_1_1.description
                           FROM (public.roles_has_roles rhr
                             JOIN public.roles r_1_1 ON ((r_1_1.id = rhr.has_role_id)))
                          WHERE ((rhr.role_id = users.role_id) AND (rhr.has_role_id IN ( SELECT rhrs.role_id
                                   FROM (public.roles_has_roles rhrs
                                     JOIN public.roles rs ON ((rhrs.has_role_id = rs.id)))
                                  WHERE ((rs.code)::text <> 'operational'::text))) AND (r_1_1.id = r_for_rights.id))))) r) AS rights_by_roles
   FROM public.users users;


--
-- Name: global_reviewers; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.global_reviewers AS
 SELECT users_details.id,
    users_details.email,
    users_details.name,
    users_details.role_id
   FROM (public.users_details
     JOIN ( SELECT DISTINCT rights.role_id
           FROM (( SELECT json_array_elements(users_details_1.rights_direct) AS rightd,
                    users_details_1.role_id
                   FROM public.users_details users_details_1) rights
             LEFT JOIN ( SELECT json_array_elements(users_details_1.rights_by_roles) AS rightd,
                    users_details_1.role_id
                   FROM public.users_details users_details_1) rightsr ON ((rights.role_id = rightsr.role_id)))
          WHERE (((rights.rightd ->> 'code'::text) = 'global_reviewer'::text) OR ((rightsr.rightd ->> 'code'::text) = 'global_reviewer'::text))) reviewers ON ((users_details.role_id = reviewers.role_id)));


--
-- Name: lookup_contact_item_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lookup_contact_item_kinds (
    code character varying(50) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    status integer NOT NULL,
    display_label character varying(100) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT lookup_contact_item_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT lookup_contact_item_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text))))
);


--
-- Name: lookup_medium_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lookup_medium_kinds (
    code character varying(10) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    status integer NOT NULL,
    display_label character varying(100) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT lookup_medium_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT lookup_medium_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text))))
);


--
-- Name: lookups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lookups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lookups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lookups (
    id integer DEFAULT nextval('public.lookups_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    status integer NOT NULL,
    style integer NOT NULL,
    model character varying(200) NOT NULL,
    label character varying(50) NOT NULL,
    display_label character varying(100) NOT NULL,
    is_web_editable boolean NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT lookups_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text)))),
    CONSTRAINT lookups_id_valid CHECK ((id > 0))
);


--
-- Name: managed_work_charts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.managed_work_charts AS
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
   FROM (public.work_chart
     JOIN ( SELECT DISTINCT (right_targets.ref_obj_pk)::integer AS work_chart_id
           FROM ((public.rights
             JOIN public.right_types ON (((right_types.id = rights.right_type_id) AND ((right_types.code)::text = 'project_manage'::text))))
             JOIN public.right_targets ON ((right_targets.right_id = rights.id)))
          WHERE (rights.is_granted IS TRUE)) targets ON ((targets.work_chart_id = work_chart.id)));


--
-- Name: newer_labels; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.newer_labels AS
 WITH RECURSIVE tree AS (
         SELECT work_chart.id,
            work_chart.parent_id,
            work_chart.display_label,
            ARRAY[(work_chart.display_label)::text] AS labels,
            ARRAY[work_chart.id] AS ids,
            work_chart.status AS tree_status
           FROM public.work_chart
          WHERE (work_chart.parent_id = 1)
        UNION ALL
         SELECT f1.id,
            f1.parent_id,
            f1.display_label,
            array_append(tree_1.labels, (f1.display_label)::text) AS labels,
            array_append(tree_1.ids, f1.id) AS ids,
                CASE
                    WHEN (((f1.status)::text = 'hidden'::text) OR ((tree_1.tree_status)::text = 'hidden'::text)) THEN 'hidden'::character varying(30)
                    WHEN (((f1.status)::text = 'dead'::text) OR ((tree_1.tree_status)::text = 'dead'::text)) THEN 'dead'::character varying(30)
                    ELSE 'active'::character varying(30)
                END AS tree_status
           FROM (tree tree_1
             JOIN public.work_chart f1 ON ((f1.parent_id = tree_1.id)))
        )
 SELECT id,
    labels,
    ids,
    tree_status
   FROM tree;


--
-- Name: planned_communications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planned_communications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planned_communications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planned_communications (
    id integer DEFAULT nextval('public.planned_communications_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_chart_id integer NOT NULL,
    target_date timestamp without time zone NOT NULL,
    description character varying(100) DEFAULT ''::character varying NOT NULL,
    medium_kind character varying(10) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT planned_communications_description_valid CHECK (((length((description)::text) > 0) AND ((description)::text = btrim((description)::text)))),
    CONSTRAINT planned_communications_id_valid CHECK ((id > 0))
);


--
-- Name: planned_communications_contacts_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planned_communications_contacts_map (
    planned_communication_id integer NOT NULL,
    contact_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: planned_communications_roles_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planned_communications_roles_map (
    planned_communication_id integer NOT NULL,
    role_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: production_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_category_id_seq
    START WITH 5
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: production_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_categories (
    id integer DEFAULT nextval('public.production_category_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    name character varying NOT NULL,
    is_excluded boolean DEFAULT false NOT NULL,
    is_production boolean DEFAULT false NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT name_valid CHECK (((name)::text ~ '^[a-z ]+$'::text)),
    CONSTRAINT production_category_sane_flags CHECK ((NOT (is_excluded AND is_production)))
);


--
-- Name: project_summaries; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.project_summaries AS
 SELECT work_chart_id AS project_id,
    project_labels,
    json_agg(json_build_object('labels', labels, 'date_performed', date_performed, 'name', user_name, 'duration', duration, 'kind', kind, 'duration_kind', duration_kind, 'ordering', row_number)) AS entries,
    now() AS generated_at
   FROM ( SELECT stats_1.work_chart_id,
            stats_1.project_labels,
            stats_1.labels,
            stats_1.date_performed,
            stats_1.duration,
            stats_1.kind,
            stats_1.duration_kind,
            stats_1.user_name,
            row_number() OVER (PARTITION BY ROW(stats_1.work_chart_id, stats_1.kind) ORDER BY stats_1.date_performed DESC) AS row_number
           FROM ( SELECT DISTINCT ON (work_entry_durations.id) chart_labels.id AS work_chart_id,
                    chart_labels.labels AS project_labels,
                    leaf_labels.labels,
                    work_entries.date_performed,
                    work_entry_durations.duration,
                        CASE
                            WHEN ((work_entry_durations.kind_code)::text ~ '^billable'::text) THEN 'billable'::text
                            ELSE 'nonbillable'::text
                        END AS kind,
                    duration_kinds.display_label AS duration_kind,
                    users.name AS user_name
                   FROM ((((((public.chart_labels
                     JOIN public.transactions ON ((transactions.work_chart_id = chart_labels.id)))
                     JOIN public.chart_labels leaf_labels ON ((chart_labels.id = ANY (leaf_labels.ids))))
                     JOIN public.work_entries ON ((work_entries.work_chart_id = leaf_labels.id)))
                     JOIN public.work_entry_durations ON ((work_entry_durations.work_entry_id = work_entries.id)))
                     JOIN public.duration_kinds ON (((duration_kinds.code)::text = (work_entry_durations.kind_code)::text)))
                     JOIN public.users ON ((users.role_id = work_entries.role_id)))) stats_1) stats
  WHERE (row_number <= 5)
  GROUP BY work_chart_id, project_labels
  WITH NO DATA;


--
-- Name: report_items; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.report_items AS
 WITH RECURSIVE tree AS (
         SELECT work_chart.id,
            work_chart.parent_id,
            work_chart.display_label,
            ARRAY[work_chart.id] AS path,
            ARRAY[(work_chart.display_label)::text] AS labels
           FROM public.work_chart
          WHERE (work_chart.parent_id = 1)
        UNION ALL
         SELECT f1.id,
            f1.parent_id,
            f1.display_label,
            array_append(tree_1.path, f1.id) AS path,
            array_append(tree_1.labels, (f1.display_label)::text) AS labels
           FROM (tree tree_1
             JOIN public.work_chart f1 ON ((f1.parent_id = tree_1.id)))
        )
 SELECT work_entries.id,
    work_entries.date_performed,
    work_entries.role_id,
    tree.path,
    tree.labels,
    work_entries.description,
    ( SELECT users.name
           FROM public.users
          WHERE (users.role_id = work_entries.role_id)) AS fullname,
    ( SELECT sum(work_entry_fees.fee) AS sum
           FROM public.work_entry_fees
          WHERE (work_entry_fees.work_entry_id = work_entries.id)) AS total_fee,
    ARRAY( SELECT work_entry_durations.kind_code
           FROM public.work_entry_durations
          WHERE (work_entry_durations.work_entry_id = work_entries.id)) AS duration_kind_codes,
    ARRAY( SELECT work_entry_durations.duration
           FROM public.work_entry_durations
          WHERE (work_entry_durations.work_entry_id = work_entries.id)) AS duration_values,
        CASE
            WHEN (( SELECT count(*) AS count
               FROM public.approvals
              WHERE ((approvals.work_entry_id = work_entries.id) AND (approvals.approved IS NULL))) > 0) THEN false
            ELSE true
        END AS approved
   FROM (public.work_entries
     JOIN tree ON ((tree.id = work_entries.work_chart_id)));


--
-- Name: reports_presets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports_presets (
    id integer NOT NULL,
    user_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    name character varying,
    report_type character varying,
    start_date date,
    end_date date,
    work_chart_id integer,
    roles text[] DEFAULT '{}'::text[],
    description boolean,
    show_all_roles boolean,
    fragmentation character varying,
    dates_relative boolean,
    dates_period_type character varying
);


--
-- Name: reports_presets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reports_presets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reports_presets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reports_presets_id_seq OWNED BY public.reports_presets.id;


--
-- Name: roles_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.roles_view AS
 WITH RECURSIVE tree AS (
         SELECT roles_1.id,
            roles_1.code,
            roles_1.display_label,
            roles_1.description,
            ARRAY[]::character varying[] AS inherited_roles,
            ARRAY[]::integer[] AS inherited_role_ids
           FROM (public.roles roles_1
             LEFT JOIN public.roles_has_roles ON ((roles_has_roles.role_id = roles_1.id)))
          WHERE (roles_has_roles.role_id IS NULL)
        UNION ALL
         SELECT roles_1.id,
            roles_1.code,
            roles_1.display_label,
            roles_1.description,
            (tree.inherited_roles || tree.code) AS inherited_roles,
            (tree.inherited_role_ids || tree.id) AS inherited_role_ids
           FROM ((tree
             JOIN public.roles_has_roles ON ((roles_has_roles.has_role_id = tree.id)))
             JOIN public.roles roles_1 ON ((roles_1.id = roles_has_roles.role_id)))
        )
 SELECT id,
    code,
    display_label,
    description,
    public.array_cat_agg(inherited_roles) AS inherited_roles,
    public.array_cat_agg(inherited_role_ids) AS inherited_role_ids,
    array_agg(inherited_roles[array_length(inherited_roles, 1)]) AS direct_roles,
    array_agg(inherited_role_ids[array_length(inherited_role_ids, 1)]) AS direct_role_ids
   FROM tree roles
  GROUP BY id, code, display_label, description;


--
-- Name: right_targets_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.right_targets_view AS
 SELECT targets.id,
    rights_view.id AS right_id,
    rights_view.code,
    rights_view.target_kind_code,
    (targets.ref_obj_pk)::integer AS ref_obj_pk,
        CASE
            WHEN ((rights_view.target_kind_code)::text = 'work_chart'::text) THEN ( SELECT work_chart.display_label
               FROM public.work_chart
              WHERE (work_chart.id = (targets.ref_obj_pk)::integer))
            WHEN ((rights_view.target_kind_code)::text = 'role'::text) THEN ( SELECT roles_view.display_label
               FROM public.roles_view
              WHERE (roles_view.id = (targets.ref_obj_pk)::integer))
            WHEN ((rights_view.target_kind_code)::text = 'user'::text) THEN ( SELECT users.name
               FROM public.users
              WHERE (users.id = (targets.ref_obj_pk)::integer))
            ELSE ''::character varying
        END AS label
   FROM (public.rights_view
     JOIN public.right_targets targets ON ((targets.right_id = rights_view.id)));


--
-- Name: right_type_target_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.right_type_target_kinds (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    display_label character varying(100) NOT NULL,
    model_class character varying(100) NOT NULL,
    relation_name character varying(100) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT right_type_target_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT right_type_target_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text)))),
    CONSTRAINT right_type_target_kinds_model_class_valid CHECK (((length((model_class)::text) > 0) AND ((model_class)::text = btrim((model_class)::text)))),
    CONSTRAINT right_type_target_kinds_relation_name_valid CHECK (((length((relation_name)::text) > 0) AND ((relation_name)::text = btrim((relation_name)::text))))
);


--
-- Name: role_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.role_details AS
 SELECT id,
    code,
    label,
    ( SELECT
                CASE
                    WHEN (count(DISTINCT unnest.unnest) > 0) THEN array_agg(DISTINCT unnest.unnest)
                    ELSE ARRAY[]::integer[]
                END AS "array"
           FROM unnest(public.array_cat_agg(details.role_ids)) unnest(unnest)) AS role_ids,
    ( SELECT
                CASE
                    WHEN (count(DISTINCT unnest.unnest) > 0) THEN array_agg(DISTINCT unnest.unnest)
                    ELSE ARRAY[]::integer[]
                END AS "array"
           FROM unnest(public.array_cat_agg(details.direct_role_ids)) unnest(unnest)) AS direct_role_ids,
        CASE
            WHEN (count(DISTINCT (direct_rights)::jsonb) > 0) THEN (replace(string_agg(DISTINCT (direct_rights)::text, ', '::text), '], ['::text, ', '::text))::jsonb
            ELSE '[]'::jsonb
        END AS direct_rights,
        CASE
            WHEN (count(DISTINCT (indirect_rights)::jsonb) > 0) THEN (replace(string_agg(DISTINCT (indirect_rights)::text, ', '::text), '], ['::text, ', '::text))::jsonb
            ELSE '[]'::jsonb
        END AS indirect_rights
   FROM ( SELECT roles_view.id,
            roles_view.code,
            roles_view.display_label AS label,
            ( SELECT array_agg(DISTINCT unnest.unnest) AS array_agg
                   FROM unnest(roles_view.inherited_role_ids) unnest(unnest)) AS role_ids,
            ( SELECT array_agg(DISTINCT unnest.unnest) AS array_agg
                   FROM unnest(roles_view.direct_role_ids) unnest(unnest)) AS direct_role_ids,
            ( SELECT json_agg(DISTINCT r.*) FILTER (WHERE (direct_rights.id IS NOT NULL)) AS json_agg
                   FROM ( SELECT direct_rights.id,
                            true AS is_direct,
                            direct_rights.code,
                            direct_rights.target_kind_code,
                            direct_rights.display_label AS label,
                                CASE
                                    WHEN (count(right_targets_view.id) > 0) THEN (json_agg(DISTINCT (json_build_object('id', right_targets_view.id, 'ref_obj_pk', right_targets_view.ref_obj_pk, 'label', right_targets_view.label))::jsonb))::jsonb
                                    ELSE '[]'::jsonb
                                END AS targets) r) AS direct_rights,
            ( SELECT json_agg(DISTINCT r.*) FILTER (WHERE (indirect_rights.id IS NOT NULL)) AS json_agg
                   FROM ( SELECT indirect_rights.id,
                            false AS is_direct,
                            indirect_rights.code,
                            indirect_rights.target_kind_code,
                            indirect_rights.display_label AS label,
                                CASE
                                    WHEN (count(indirect_right_targets.id) > 0) THEN (json_agg(DISTINCT (json_build_object('id', indirect_right_targets.id, 'ref_obj_pk', indirect_right_targets.ref_obj_pk, 'label', indirect_right_targets.label))::jsonb))::jsonb
                                    ELSE '[]'::jsonb
                                END AS targets) r) AS indirect_rights
           FROM ((((public.roles_view
             LEFT JOIN public.rights_view direct_rights ON ((direct_rights.role_id = roles_view.id)))
             LEFT JOIN public.right_targets_view ON ((right_targets_view.right_id = direct_rights.id)))
             LEFT JOIN public.rights_view indirect_rights ON ((indirect_rights.role_id = ANY (roles_view.inherited_role_ids))))
             LEFT JOIN public.right_targets_view indirect_right_targets ON ((indirect_right_targets.right_id = indirect_rights.id)))
          GROUP BY roles_view.id, roles_view.code, roles_view.display_label, roles_view.inherited_role_ids, roles_view.direct_role_ids, indirect_rights.id, indirect_rights.code, indirect_rights.target_kind_code, indirect_rights.display_label, direct_rights.id, direct_rights.code, direct_rights.target_kind_code, direct_rights.display_label) details
  GROUP BY id, code, label
  ORDER BY label;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    data text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: tag_set_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_set_kinds (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    status integer NOT NULL,
    display_label character varying(100) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT tag_set_kinds_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT tag_set_kinds_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text))))
);


--
-- Name: tag_set_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tag_set_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tag_set_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_set_tags (
    id integer DEFAULT nextval('public.tag_set_tags_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    tag_set_id integer NOT NULL,
    display_label character varying(30) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT tag_set_tags_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text)))),
    CONSTRAINT tag_set_tags_id_valid CHECK ((id > 0))
);


--
-- Name: tag_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tag_sets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tag_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_sets (
    id integer DEFAULT nextval('public.tag_sets_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    kind_code character varying(30) NOT NULL,
    display_label character varying(50) NOT NULL,
    is_single_use boolean NOT NULL,
    mutually_exclusive boolean NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT tag_sets_display_label_valid CHECK (((length((display_label)::text) > 0) AND ((display_label)::text = btrim((display_label)::text)))),
    CONSTRAINT tag_sets_id_valid CHECK ((id > 0))
);


--
-- Name: time_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_zones (
    code character varying(50) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    utc_offset numeric,
    is_visible boolean NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT time_zones_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text)))),
    CONSTRAINT time_zones_utc_offset_valid CHECK (((utc_offset >= ('-24'::integer)::numeric) AND (utc_offset <= (24)::numeric)))
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_details AS
SELECT
    NULL::integer AS id,
    NULL::character varying(255) AS email,
    NULL::character varying(255) AS name,
    NULL::integer AS role_id,
    NULL::character varying(30) AS status_code,
    NULL::character varying(50) AS time_zone,
    NULL::integer[] AS team_ids,
    NULL::integer[] AS role_ids,
    NULL::integer[] AS direct_role_ids,
    NULL::jsonb AS direct_rights,
    NULL::jsonb AS indirect_rights;


--
-- Name: user_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_statuses (
    code character varying(30) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    display_label character varying(50) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT user_statuses_code_valid CHECK (((length((code)::text) > 0) AND ((code)::text = btrim((code)::text))))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users_roles (
    user_id integer,
    role_id integer
);


--
-- Name: work_chart_kind_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_chart_kind_sets (
    work_chart_id integer NOT NULL
);


--
-- Name: work_chart_kinds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_chart_kinds (
    work_chart_id integer NOT NULL,
    kind_code character varying(30) NOT NULL
);


--
-- Name: work_chart_kinds_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_chart_kinds_defaults (
    work_chart_id integer NOT NULL,
    kind_code character varying(30) NOT NULL
);


--
-- Name: work_chart_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_chart_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_chart_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_chart_notes (
    id integer DEFAULT nextval('public.work_chart_notes_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_chart_id integer NOT NULL,
    subject character varying(100) NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_chart_notes_id_valid CHECK ((id > 0)),
    CONSTRAINT work_chart_notes_subject_valid CHECK (((length((subject)::text) > 0) AND ((subject)::text = btrim((subject)::text))))
);


--
-- Name: work_chart_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_chart_statuses (
    status character varying(30) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    date_created timestamp without time zone DEFAULT now() NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_chart_statuses_status_check CHECK (((status)::text !~ '[^-_a-z0-9]'::text))
);


--
-- Name: work_chart_tag_set_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_chart_tag_set_map (
    work_chart_id integer NOT NULL,
    tag_set_id integer NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    children_inherit boolean NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: work_chart_tree_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.work_chart_tree_view AS
 SELECT id,
    parent_id,
    (level - 1) AS level,
    branch,
    pos
   FROM public.connectby('work_chart'::text, 'id'::text, 'parent_id'::text, 'branch_order, display_label'::text, (1)::text, 0, '~'::text) tree(id integer, parent_id integer, level integer, branch text, pos integer)
  ORDER BY pos;


--
-- Name: work_entry_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entry_approvals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entry_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_approvals (
    id integer DEFAULT nextval('public.work_entry_approvals_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_entry_id integer NOT NULL,
    kind_code character varying(30) NOT NULL,
    role_id integer,
    is_approved boolean NOT NULL,
    approved_at timestamp without time zone NOT NULL,
    approved_by character varying(32) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_entry_approvals_id_valid CHECK ((id > 0))
);


--
-- Name: work_entry_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_audits (
    id integer NOT NULL,
    date_created timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_chart_id integer NOT NULL,
    role_id integer,
    date_performed date NOT NULL,
    description text NOT NULL,
    legacy_id integer,
    work_entries_id integer NOT NULL,
    audit_timestamp timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: work_entry_audits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entry_audits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entry_audits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_entry_audits_id_seq OWNED BY public.work_entry_audits.id;


--
-- Name: work_entry_durations_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_durations_audits (
    id integer NOT NULL,
    date_created timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_entry_id integer NOT NULL,
    kind_code character varying(30) NOT NULL,
    production_category_id integer NOT NULL,
    duration interval NOT NULL,
    rate numeric,
    audit_timestamp timestamp without time zone NOT NULL,
    created_by integer,
    modified_by integer
);


--
-- Name: work_entry_durations_audits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entry_durations_audits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entry_durations_audits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.work_entry_durations_audits_id_seq OWNED BY public.work_entry_durations_audits.id;


--
-- Name: work_entry_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entry_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entry_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_logs (
    id integer DEFAULT nextval('public.work_entry_logs_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_entry_id integer NOT NULL,
    action_code character varying(30) NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_entry_logs_id_valid CHECK ((id > 0))
);


--
-- Name: work_entry_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entry_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entry_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_notes (
    id integer DEFAULT nextval('public.work_entry_notes_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_entry_id integer NOT NULL,
    subject character varying(100) NOT NULL,
    content text NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_entry_notes_id_valid CHECK ((id > 0))
);


--
-- Name: work_entry_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.work_entry_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: work_entry_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_entry_tags (
    id integer DEFAULT nextval('public.work_entry_tags_id_seq'::regclass) NOT NULL,
    date_created timestamp without time zone DEFAULT (timeofday())::timestamp without time zone NOT NULL,
    last_modified timestamp without time zone NOT NULL,
    work_entry_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_by integer,
    modified_by integer,
    CONSTRAINT work_entry_tags_id_valid CHECK ((id > 0))
);


--
-- Name: approvals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals ALTER COLUMN id SET DEFAULT nextval('public.approvals_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: cron_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cron_jobs ALTER COLUMN id SET DEFAULT nextval('public.cron_jobs_id_seq'::regclass);


--
-- Name: delayed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delayed_jobs ALTER COLUMN id SET DEFAULT nextval('public.delayed_jobs_id_seq'::regclass);


--
-- Name: reports_presets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports_presets ALTER COLUMN id SET DEFAULT nextval('public.reports_presets_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_entry_audits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_audits ALTER COLUMN id SET DEFAULT nextval('public.work_entry_audits_id_seq'::regclass);


--
-- Name: work_entry_durations_audits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations_audits ALTER COLUMN id SET DEFAULT nextval('public.work_entry_durations_audits_id_seq'::regclass);


--
-- Name: account_kinds account_kinds_display_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_kinds
    ADD CONSTRAINT account_kinds_display_label_key UNIQUE (display_label);


--
-- Name: account_kinds account_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_kinds
    ADD CONSTRAINT account_kinds_pkey PRIMARY KEY (code);


--
-- Name: account_transaction_kinds account_transaction_kinds_display_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transaction_kinds
    ADD CONSTRAINT account_transaction_kinds_display_label_key UNIQUE (display_label);


--
-- Name: account_transaction_kinds account_transaction_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transaction_kinds
    ADD CONSTRAINT account_transaction_kinds_pkey PRIMARY KEY (code);


--
-- Name: account_transactions account_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (code);


--
-- Name: approval_kinds approval_kinds_abbr_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_kinds
    ADD CONSTRAINT approval_kinds_abbr_label_unique UNIQUE (abbr_label);


--
-- Name: approval_kinds approval_kinds_display_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_kinds
    ADD CONSTRAINT approval_kinds_display_label_unique UNIQUE (display_label);


--
-- Name: approval_kinds approval_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_kinds
    ADD CONSTRAINT approval_kinds_pkey PRIMARY KEY (code);


--
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: communications_contacts_map communications_contacts_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_contacts_map
    ADD CONSTRAINT communications_contacts_map_pkey PRIMARY KEY (communication_id, contact_id);


--
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (id);


--
-- Name: communications_roles_map communications_roles_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_roles_map
    ADD CONSTRAINT communications_roles_map_pkey PRIMARY KEY (communication_id, role_id);


--
-- Name: contact_item_values contact_item_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_item_values
    ADD CONSTRAINT contact_item_values_pkey PRIMARY KEY (id);


--
-- Name: contact_items contact_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_items
    ADD CONSTRAINT contact_items_pkey PRIMARY KEY (id);


--
-- Name: contact_own_role contact_own_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_own_role
    ADD CONSTRAINT contact_own_role_pkey PRIMARY KEY (contact_id, role_id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: cron_jobs cron_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cron_jobs
    ADD CONSTRAINT cron_jobs_pkey PRIMARY KEY (id);


--
-- Name: delayed_jobs delayed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delayed_jobs
    ADD CONSTRAINT delayed_jobs_pkey PRIMARY KEY (id);


--
-- Name: duration_kinds duration_kinds_abbr_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duration_kinds
    ADD CONSTRAINT duration_kinds_abbr_label_unique UNIQUE (abbr_label);


--
-- Name: duration_kinds duration_kinds_display_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duration_kinds
    ADD CONSTRAINT duration_kinds_display_label_unique UNIQUE (display_label);


--
-- Name: duration_kinds duration_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duration_kinds
    ADD CONSTRAINT duration_kinds_pkey PRIMARY KEY (code);


--
-- Name: lookup_contact_item_kinds lookup_contact_item_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookup_contact_item_kinds
    ADD CONSTRAINT lookup_contact_item_kinds_pkey PRIMARY KEY (code);


--
-- Name: lookup_medium_kinds lookup_medium_kinds_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookup_medium_kinds
    ADD CONSTRAINT lookup_medium_kinds_code_unique PRIMARY KEY (code);


--
-- Name: lookups lookups_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookups
    ADD CONSTRAINT lookups_label_unique UNIQUE (label);


--
-- Name: lookups lookups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookups
    ADD CONSTRAINT lookups_pkey PRIMARY KEY (id);


--
-- Name: planned_communications_contacts_map planned_communications_contacts_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_contacts_map
    ADD CONSTRAINT planned_communications_contacts_map_pkey PRIMARY KEY (planned_communication_id, contact_id);


--
-- Name: planned_communications planned_communications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications
    ADD CONSTRAINT planned_communications_pkey PRIMARY KEY (id);


--
-- Name: planned_communications_roles_map planned_communications_roles_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_roles_map
    ADD CONSTRAINT planned_communications_roles_map_pkey PRIMARY KEY (planned_communication_id, role_id);


--
-- Name: production_categories production_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_categories
    ADD CONSTRAINT production_categories_pkey PRIMARY KEY (id);


--
-- Name: production_categories production_category_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_categories
    ADD CONSTRAINT production_category_name_unique UNIQUE (name);


--
-- Name: reports_presets reports_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports_presets
    ADD CONSTRAINT reports_presets_pkey PRIMARY KEY (id);


--
-- Name: right_type_target_kinds right_type_target_kinds_display_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_type_target_kinds
    ADD CONSTRAINT right_type_target_kinds_display_label_key UNIQUE (display_label);


--
-- Name: right_type_target_kinds right_type_target_kinds_model_class_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_type_target_kinds
    ADD CONSTRAINT right_type_target_kinds_model_class_key UNIQUE (model_class);


--
-- Name: right_type_target_kinds right_type_target_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_type_target_kinds
    ADD CONSTRAINT right_type_target_kinds_pkey PRIMARY KEY (code);


--
-- Name: right_type_target_kinds right_type_target_kinds_relation_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_type_target_kinds
    ADD CONSTRAINT right_type_target_kinds_relation_name_key UNIQUE (relation_name);


--
-- Name: right_types right_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_types
    ADD CONSTRAINT right_types_code_key UNIQUE (code, target_kind_code);


--
-- Name: right_types right_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_types
    ADD CONSTRAINT right_types_pkey PRIMARY KEY (id);


--
-- Name: rights rights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_pkey PRIMARY KEY (id);


--
-- Name: rights rights_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_role_id_key UNIQUE (role_id, right_type_id, is_granted);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles_has_roles roles_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_has_roles
    ADD CONSTRAINT roles_has_roles_pkey PRIMARY KEY (role_id, has_role_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: tag_set_kinds tag_set_kinds_display_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_kinds
    ADD CONSTRAINT tag_set_kinds_display_label_unique UNIQUE (display_label);


--
-- Name: tag_set_kinds tag_set_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_kinds
    ADD CONSTRAINT tag_set_kinds_pkey PRIMARY KEY (code);


--
-- Name: tag_set_tags tag_set_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_tags
    ADD CONSTRAINT tag_set_tags_pkey PRIMARY KEY (id);


--
-- Name: tag_sets tag_sets_kind_code_display_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_sets
    ADD CONSTRAINT tag_sets_kind_code_display_label_unique UNIQUE (kind_code, display_label);


--
-- Name: tag_sets tag_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_sets
    ADD CONSTRAINT tag_sets_pkey PRIMARY KEY (id);


--
-- Name: time_zones time_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_zones
    ADD CONSTRAINT time_zones_pkey PRIMARY KEY (code);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_statuses user_statuses_display_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_statuses
    ADD CONSTRAINT user_statuses_display_label_key UNIQUE (display_label);


--
-- Name: user_statuses user_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_statuses
    ADD CONSTRAINT user_statuses_pkey PRIMARY KEY (code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: work_chart_kind_sets work_chart_kind_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_kind_sets
    ADD CONSTRAINT work_chart_kind_sets_pkey PRIMARY KEY (work_chart_id);


--
-- Name: work_chart_kinds_defaults work_chart_kinds_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_kinds_defaults
    ADD CONSTRAINT work_chart_kinds_defaults_pkey PRIMARY KEY (work_chart_id);


--
-- Name: work_chart_kinds work_chart_kinds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_kinds
    ADD CONSTRAINT work_chart_kinds_pkey PRIMARY KEY (work_chart_id, kind_code);


--
-- Name: work_chart_notes work_chart_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_notes
    ADD CONSTRAINT work_chart_notes_pkey PRIMARY KEY (id);


--
-- Name: work_chart work_chart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart
    ADD CONSTRAINT work_chart_pkey PRIMARY KEY (id);


--
-- Name: work_chart_statuses work_chart_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_statuses
    ADD CONSTRAINT work_chart_statuses_pkey PRIMARY KEY (status);


--
-- Name: work_chart_tag_set_map work_chart_tag_set_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_tag_set_map
    ADD CONSTRAINT work_chart_tag_set_map_pkey PRIMARY KEY (work_chart_id, tag_set_id);


--
-- Name: work_entries work_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entries
    ADD CONSTRAINT work_entries_pkey PRIMARY KEY (id);


--
-- Name: work_entry_approvals work_entry_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_approvals
    ADD CONSTRAINT work_entry_approvals_pkey PRIMARY KEY (id);


--
-- Name: work_entry_audits work_entry_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_audits
    ADD CONSTRAINT work_entry_audits_pkey PRIMARY KEY (id);


--
-- Name: work_entry_durations_audits work_entry_durations_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations_audits
    ADD CONSTRAINT work_entry_durations_audits_pkey PRIMARY KEY (id);


--
-- Name: work_entry_durations work_entry_durations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations
    ADD CONSTRAINT work_entry_durations_pkey PRIMARY KEY (id);


--
-- Name: work_entry_durations work_entry_durations_work_entry_id_kind_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations
    ADD CONSTRAINT work_entry_durations_work_entry_id_kind_code_unique UNIQUE (work_entry_id, kind_code);


--
-- Name: work_entry_fees work_entry_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_fees
    ADD CONSTRAINT work_entry_fees_pkey PRIMARY KEY (work_entry_id);


--
-- Name: work_entry_logs work_entry_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_logs
    ADD CONSTRAINT work_entry_logs_pkey PRIMARY KEY (id);


--
-- Name: work_entry_notes work_entry_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_notes
    ADD CONSTRAINT work_entry_notes_pkey PRIMARY KEY (id);


--
-- Name: work_entry_tags work_entry_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_tags
    ADD CONSTRAINT work_entry_tags_pkey PRIMARY KEY (id);


--
-- Name: accounts_index_1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_index_1 ON public.accounts USING btree (reference_id, kind_code);


--
-- Name: chart_labels_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX chart_labels_id_idx ON public.chart_labels USING btree (id);


--
-- Name: chart_labels_ids_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chart_labels_ids_idx ON public.chart_labels USING btree (ids);


--
-- Name: chart_labels_labels_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chart_labels_labels_idx ON public.chart_labels USING btree (labels);


--
-- Name: charts_search_spec_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX charts_search_spec_id_idx ON public.charts_search_specs USING btree (id);


--
-- Name: charts_search_spec_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX charts_search_spec_idx ON public.charts_search_specs USING gin (search_spec);


--
-- Name: delayed_jobs_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX delayed_jobs_priority ON public.delayed_jobs USING btree (priority, run_at);


--
-- Name: index_approvals_on_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_approvals_on_approved ON public.approvals USING btree (approved);


--
-- Name: index_approvals_on_owner_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_approvals_on_owner_ids ON public.approvals USING btree (owner_ids);


--
-- Name: index_approvals_on_work_entry_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_approvals_on_work_entry_id ON public.approvals USING btree (work_entry_id);


--
-- Name: index_reports_presets_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_reports_presets_on_user_id ON public.reports_presets USING btree (user_id);


--
-- Name: index_sessions_on_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sessions_on_session_id ON public.sessions USING btree (session_id);


--
-- Name: index_sessions_on_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_sessions_on_updated_at ON public.sessions USING btree (updated_at);


--
-- Name: index_transactions_on_kind_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transactions_on_kind_code ON public.transactions USING btree (kind_code);


--
-- Name: index_transactions_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transactions_on_user_id ON public.transactions USING btree (user_id);


--
-- Name: index_transactions_on_work_chart_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_transactions_on_work_chart_id ON public.transactions USING btree (work_chart_id);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: index_users_on_reset_password_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_reset_password_token ON public.users USING btree (reset_password_token);


--
-- Name: index_users_roles_on_user_id_and_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_users_roles_on_user_id_and_role_id ON public.users_roles USING btree (user_id, role_id);


--
-- Name: index_work_entry_audits_on_date_performed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_work_entry_audits_on_date_performed ON public.work_entry_audits USING btree (date_performed);


--
-- Name: index_work_entry_audits_on_work_chart_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_work_entry_audits_on_work_chart_id ON public.work_entry_audits USING btree (work_chart_id);


--
-- Name: project_summaries_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX project_summaries_ids ON public.project_summaries USING btree (project_id);


--
-- Name: unique_schema_migrations; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_schema_migrations ON public.schema_migrations USING btree (version);


--
-- Name: work_chart_parent_id_display_label_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX work_chart_parent_id_display_label_unique ON public.work_chart USING btree (parent_id, regexp_replace(lower((display_label)::text), 'W+'::text, ''::text));


--
-- Name: work_chart_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_chart_parent_id_idx ON public.work_chart USING btree (parent_id);


--
-- Name: work_entries_date_performed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_entries_date_performed_idx ON public.work_entries USING btree (date_performed);


--
-- Name: work_entries_work_chart_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_entries_work_chart_id_idx ON public.work_entries USING btree (work_chart_id);


--
-- Name: entry_daily_summaries _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.entry_daily_summaries AS
 SELECT entries.id,
    entries.date_performed,
    entries.description,
    entries.role_id,
    sum(DISTINCT fees.fee) AS fee_total,
    COALESCE(( SELECT array_agg(a.a) AS array_agg
           FROM unnest(array_agg(DISTINCT approvals.user_json)) a(a)
          WHERE (a.a IS NOT NULL)), ARRAY[]::jsonb[]) AS owners,
    false AS is_invoiced,
    COALESCE(json_agg(DISTINCT (json_build_object('updated_at', approved_approvals.updated_at, 'role_id', approved_approvals.role_id, 'approved', approved_approvals.approved))::jsonb) FILTER (WHERE (approved_approvals.approved IS NOT NULL)), '[]'::json) AS approved_roles,
    array_agg(DISTINCT kinds.display_label) AS kinds,
    COALESCE(( SELECT sum(work_entry_durations.duration) AS sum
           FROM public.work_entry_durations
          WHERE ((work_entry_durations.work_entry_id = entries.id) AND ((work_entry_durations.kind_code)::text ~~ 'billable%'::text))), '00:00:00'::interval) AS total_billable,
    COALESCE(( SELECT sum(work_entry_durations.duration) AS sum
           FROM public.work_entry_durations
          WHERE ((work_entry_durations.work_entry_id = entries.id) AND ((work_entry_durations.kind_code)::text ~~ 'nonbillable%'::text) AND ((work_entry_durations.kind_code)::text !~~ '%_pto'::text))), '00:00:00'::interval) AS total_nonbillable,
    COALESCE(( SELECT sum(work_entry_durations.duration) AS sum
           FROM public.work_entry_durations
          WHERE ((work_entry_durations.work_entry_id = entries.id) AND ((work_entry_durations.kind_code)::text ~~ '%_pto'::text))), '00:00:00'::interval) AS total_pto,
    sum(durations.duration) AS total_duration,
    entries.work_chart_id,
    chart_labels.labels AS work_chart_label_parts
   FROM ((((((public.work_entries entries
     LEFT JOIN public.work_entry_fees fees ON ((fees.work_entry_id = entries.id)))
     LEFT JOIN ( SELECT (json_build_object('email', users.email, 'name', users.name))::jsonb AS user_json,
            approvals_1.approved,
            approvals_1.work_entry_id
           FROM (public.users
             JOIN public.approvals approvals_1 ON ((users.role_id = ANY (approvals_1.owner_ids))))) approvals ON (((approvals.work_entry_id = entries.id) AND (approvals.approved IS NULL))))
     LEFT JOIN public.approvals approved_approvals ON (((approved_approvals.work_entry_id = entries.id) AND (approved_approvals.approved IS TRUE))))
     JOIN public.work_entry_durations durations ON ((durations.work_entry_id = entries.id)))
     JOIN public.duration_kinds kinds ON (((kinds.code)::text = (durations.kind_code)::text)))
     JOIN public.chart_labels ON ((chart_labels.id = entries.work_chart_id)))
  GROUP BY entries.id, entries.date_performed, entries.description, chart_labels.labels, fees.fee, fees.work_entry_id;


--
-- Name: user_details _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.user_details AS
 SELECT users.id,
    users.email,
    users.name,
    users.role_id,
    users.status_code,
    users.time_zone_code AS time_zone,
        CASE
            WHEN (count(teams.role_id) > 0) THEN array_agg(teams.role_id)
            ELSE ARRAY[]::integer[]
        END AS team_ids,
    role_details.role_ids,
    role_details.direct_role_ids,
    role_details.direct_rights,
    role_details.indirect_rights
   FROM ((public.users
     JOIN public.role_details ON ((role_details.id = users.role_id)))
     LEFT JOIN public.teams ON (((teams.users)::jsonb @> ((((('{"'::text || (role_details.code)::text) || '": "'::text) || (users.name)::text) || '"}'::text))::jsonb)))
  GROUP BY users.id, users.email, users.role_id, users.status_code, users.time_zone_code, role_details.role_ids, role_details.direct_role_ids, role_details.direct_rights, role_details.indirect_rights
  ORDER BY users.name;


--
-- Name: account_kinds account_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER account_kinds_last_modified BEFORE INSERT OR UPDATE ON public.account_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: account_transaction_kinds account_transaction_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER account_transaction_kinds_last_modified BEFORE INSERT OR UPDATE ON public.account_transaction_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: account_transactions account_transactions_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER account_transactions_last_modified BEFORE INSERT OR UPDATE ON public.account_transactions FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: accounts accounts_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER accounts_last_modified BEFORE INSERT OR UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: accounts accounts_reference_exists; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER accounts_reference_exists BEFORE INSERT OR UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.check_accounts_reference();


--
-- Name: actions actions_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER actions_last_modified BEFORE INSERT OR UPDATE ON public.actions FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: approval_kinds approval_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER approval_kinds_last_modified BEFORE INSERT OR UPDATE ON public.approval_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: communications_contacts_map communications_contacts_map_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER communications_contacts_map_last_modified BEFORE INSERT OR UPDATE ON public.communications_contacts_map FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: communications communications_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER communications_last_modified BEFORE INSERT OR UPDATE ON public.communications FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: communications_roles_map communications_roles_map_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER communications_roles_map_last_modified BEFORE INSERT OR UPDATE ON public.communications_roles_map FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: contact_item_values contact_item_values_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contact_item_values_last_modified BEFORE INSERT OR UPDATE ON public.contact_item_values FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: contact_items contact_items_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contact_items_last_modified BEFORE INSERT OR UPDATE ON public.contact_items FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: contact_own_role contact_own_role_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contact_own_role_last_modified BEFORE INSERT OR UPDATE ON public.contact_own_role FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: contact_roles_map contact_roles_map_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contact_roles_map_last_modified BEFORE INSERT OR UPDATE ON public.contact_roles_map FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: contact_work_charts_map contact_work_charts_map_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contact_work_charts_map_last_modified BEFORE INSERT OR UPDATE ON public.contact_work_charts_map FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: contacts contacts_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contacts_last_modified BEFORE INSERT OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: duration_kinds duration_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER duration_kinds_last_modified BEFORE INSERT OR UPDATE ON public.duration_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_chart guard_parent_charts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER guard_parent_charts BEFORE DELETE ON public.work_chart FOR EACH ROW EXECUTE FUNCTION public.guard_parent_charts();


--
-- Name: lookup_contact_item_kinds lookup_contact_item_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lookup_contact_item_kinds_last_modified BEFORE INSERT OR UPDATE ON public.lookup_contact_item_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: lookup_medium_kinds lookup_medium_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lookup_medium_kinds_last_modified BEFORE INSERT OR UPDATE ON public.lookup_medium_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: lookups lookups_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lookups_last_modified BEFORE INSERT OR UPDATE ON public.lookups FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: planned_communications_contacts_map planned_communications_contacts_map_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER planned_communications_contacts_map_last_modified BEFORE INSERT OR UPDATE ON public.planned_communications_contacts_map FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: planned_communications planned_communications_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER planned_communications_last_modified BEFORE INSERT OR UPDATE ON public.planned_communications FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: planned_communications_roles_map planned_communications_roles_map_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER planned_communications_roles_map_last_modified BEFORE INSERT OR UPDATE ON public.planned_communications_roles_map FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: production_categories production_categories_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER production_categories_last_modified BEFORE INSERT OR UPDATE ON public.production_categories FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_chart refresh_charts_matererialized_views; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER refresh_charts_matererialized_views AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE ON public.work_chart FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_charts_matererialized_views();


--
-- Name: right_targets right_targets_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER right_targets_last_modified BEFORE INSERT OR UPDATE ON public.right_targets FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: right_type_target_kinds right_type_target_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER right_type_target_kinds_last_modified BEFORE INSERT OR UPDATE ON public.right_type_target_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: right_types right_types_code_enforce_lowercase; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER right_types_code_enforce_lowercase BEFORE INSERT OR UPDATE ON public.right_types FOR EACH ROW EXECUTE FUNCTION public.right_types_code_lowercase();


--
-- Name: right_types right_types_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER right_types_last_modified BEFORE INSERT OR UPDATE ON public.right_types FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: rights rights_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER rights_last_modified BEFORE INSERT OR UPDATE ON public.rights FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: roles_has_roles roles_has_roles_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER roles_has_roles_last_modified BEFORE INSERT OR UPDATE ON public.roles_has_roles FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: roles roles_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER roles_last_modified BEFORE INSERT OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: tag_set_kinds tag_set_kinds_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tag_set_kinds_last_modified BEFORE INSERT OR UPDATE ON public.tag_set_kinds FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: tag_set_tags tag_set_tags_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tag_set_tags_last_modified BEFORE INSERT OR UPDATE ON public.tag_set_tags FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: tag_sets tag_sets_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tag_sets_last_modified BEFORE INSERT OR UPDATE ON public.tag_sets FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: time_zones time_zones_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER time_zones_last_modified BEFORE INSERT OR UPDATE ON public.time_zones FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: user_statuses users_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER users_last_modified BEFORE INSERT OR UPDATE ON public.user_statuses FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_chart work_chart_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_chart_last_modified BEFORE INSERT OR UPDATE ON public.work_chart FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_chart work_chart_leaf_restriction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER work_chart_leaf_restriction AFTER INSERT OR UPDATE ON public.work_chart DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.work_chart_restrict_entries_to_leaf();


--
-- Name: work_chart_notes work_chart_notes_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_chart_notes_last_modified BEFORE INSERT OR UPDATE ON public.work_chart_notes FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_chart_statuses work_chart_statuses_update_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_chart_statuses_update_last_modified BEFORE INSERT OR UPDATE ON public.work_chart_statuses FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_chart_tag_set_map work_chart_tag_set_map_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_chart_tag_set_map_last_modified BEFORE INSERT OR UPDATE ON public.work_chart_tag_set_map FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_entries work_entries_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entries_last_modified BEFORE INSERT OR UPDATE ON public.work_entries FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_entries work_entries_leaf_restriction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER work_entries_leaf_restriction AFTER INSERT OR UPDATE ON public.work_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.work_entry_restrict_to_leaf();


--
-- Name: work_entry_approvals work_entry_approvals_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_approvals_last_modified BEFORE INSERT OR UPDATE ON public.work_entry_approvals FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_entries work_entry_audits; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_audits BEFORE UPDATE ON public.work_entries FOR EACH ROW EXECUTE FUNCTION public.work_entry_audits();


--
-- Name: work_entry_durations work_entry_duration_production_category; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_duration_production_category BEFORE INSERT ON public.work_entry_durations FOR EACH ROW EXECUTE FUNCTION public.work_entry_duration_production_category();


--
-- Name: work_entry_durations work_entry_durations_audits_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_durations_audits_delete BEFORE DELETE ON public.work_entry_durations FOR EACH ROW EXECUTE FUNCTION public.work_entry_durations_audits();


--
-- Name: work_entry_durations work_entry_durations_audits_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_durations_audits_update BEFORE UPDATE ON public.work_entry_durations FOR EACH ROW EXECUTE FUNCTION public.work_entry_durations_audits();


--
-- Name: work_entry_durations work_entry_durations_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_durations_last_modified BEFORE INSERT OR UPDATE ON public.work_entry_durations FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_entry_fees work_entry_fees_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_fees_last_modified BEFORE INSERT OR UPDATE ON public.work_entry_fees FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_entry_logs work_entry_logs_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_logs_last_modified BEFORE INSERT OR UPDATE ON public.work_entry_logs FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_entry_notes work_entry_notes_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_notes_last_modified BEFORE INSERT OR UPDATE ON public.work_entry_notes FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: work_entry_tags work_entry_tags_last_modified; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER work_entry_tags_last_modified BEFORE INSERT OR UPDATE ON public.work_entry_tags FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();


--
-- Name: account_kinds account_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_kinds
    ADD CONSTRAINT account_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: account_kinds account_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_kinds
    ADD CONSTRAINT account_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: account_transaction_kinds account_transaction_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transaction_kinds
    ADD CONSTRAINT account_transaction_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: account_transaction_kinds account_transaction_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transaction_kinds
    ADD CONSTRAINT account_transaction_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: account_transactions account_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: account_transactions account_transactions_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: accounts accounts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: accounts accounts_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: actions actions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: actions actions_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: approval_kinds approval_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_kinds
    ADD CONSTRAINT approval_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: approval_kinds approval_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_kinds
    ADD CONSTRAINT approval_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: communications_contacts_map communications_contacts_map_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_contacts_map
    ADD CONSTRAINT communications_contacts_map_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: communications_contacts_map communications_contacts_map_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_contacts_map
    ADD CONSTRAINT communications_contacts_map_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: communications communications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: communications communications_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: communications_roles_map communications_roles_map_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_roles_map
    ADD CONSTRAINT communications_roles_map_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: communications_roles_map communications_roles_map_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_roles_map
    ADD CONSTRAINT communications_roles_map_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: contact_item_values contact_item_values_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_item_values
    ADD CONSTRAINT contact_item_values_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: contact_item_values contact_item_values_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_item_values
    ADD CONSTRAINT contact_item_values_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: contact_items contact_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_items
    ADD CONSTRAINT contact_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: contact_items contact_items_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_items
    ADD CONSTRAINT contact_items_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: contact_own_role contact_own_role_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_own_role
    ADD CONSTRAINT contact_own_role_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: contact_own_role contact_own_role_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_own_role
    ADD CONSTRAINT contact_own_role_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: contact_roles_map contact_roles_map_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_roles_map
    ADD CONSTRAINT contact_roles_map_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: contact_roles_map contact_roles_map_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_roles_map
    ADD CONSTRAINT contact_roles_map_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: contact_work_charts_map contact_work_charts_map_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_work_charts_map
    ADD CONSTRAINT contact_work_charts_map_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: contact_work_charts_map contact_work_charts_map_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_work_charts_map
    ADD CONSTRAINT contact_work_charts_map_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: contacts contacts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: contacts contacts_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: duration_kinds duration_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duration_kinds
    ADD CONSTRAINT duration_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: duration_kinds duration_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duration_kinds
    ADD CONSTRAINT duration_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: duration_kinds duration_kinds_production_category_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duration_kinds
    ADD CONSTRAINT duration_kinds_production_category_id_fk FOREIGN KEY (production_category_id) REFERENCES public.production_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: account_transactions fk_account_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: accounts fk_accounts_status_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT fk_accounts_status_code FOREIGN KEY (kind_code) REFERENCES public.account_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communications_contacts_map fk_communications_contacts_map_communication_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_contacts_map
    ADD CONSTRAINT fk_communications_contacts_map_communication_id FOREIGN KEY (communication_id) REFERENCES public.communications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communications_contacts_map fk_communications_contacts_map_contact_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_contacts_map
    ADD CONSTRAINT fk_communications_contacts_map_contact_id FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communications_roles_map fk_communications_roles_map_communication_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications_roles_map
    ADD CONSTRAINT fk_communications_roles_map_communication_id FOREIGN KEY (communication_id) REFERENCES public.communications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communications fk_communications_work_chart_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT fk_communications_work_chart_id FOREIGN KEY (work_chart_id) REFERENCES public.work_chart(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contact_item_values fk_contact_item_values; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_item_values
    ADD CONSTRAINT fk_contact_item_values FOREIGN KEY (contact_item_id) REFERENCES public.contact_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_items fk_contact_items_contact_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_items
    ADD CONSTRAINT fk_contact_items_contact_id FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_items fk_contact_items_kind; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_items
    ADD CONSTRAINT fk_contact_items_kind FOREIGN KEY (kind) REFERENCES public.lookup_contact_item_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contact_own_role fk_contact_own_role_contact_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_own_role
    ADD CONSTRAINT fk_contact_own_role_contact_id FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_roles_map fk_contact_roles_map_contact_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_roles_map
    ADD CONSTRAINT fk_contact_roles_map_contact_id FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_work_charts_map fk_contact_work_charts_map_contact_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_work_charts_map
    ADD CONSTRAINT fk_contact_work_charts_map_contact_id FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contact_work_charts_map fk_contact_work_charts_map_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_work_charts_map
    ADD CONSTRAINT fk_contact_work_charts_map_id FOREIGN KEY (work_chart_id) REFERENCES public.work_chart(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: roles_has_roles fk_has_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_has_roles
    ADD CONSTRAINT fk_has_role_id FOREIGN KEY (has_role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: account_transactions fk_kind_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT fk_kind_code FOREIGN KEY (kind_code) REFERENCES public.account_transaction_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: communications fk_medium_kind_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT fk_medium_kind_code FOREIGN KEY (medium_kind) REFERENCES public.lookup_medium_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: planned_communications_contacts_map fk_planned_communications_contacts_map_communication_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_contacts_map
    ADD CONSTRAINT fk_planned_communications_contacts_map_communication_id FOREIGN KEY (planned_communication_id) REFERENCES public.planned_communications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: planned_communications_contacts_map fk_planned_communications_contacts_map_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_contacts_map
    ADD CONSTRAINT fk_planned_communications_contacts_map_id FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: planned_communications_roles_map fk_planned_communications_roles_map_communication_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_roles_map
    ADD CONSTRAINT fk_planned_communications_roles_map_communication_id FOREIGN KEY (planned_communication_id) REFERENCES public.planned_communications(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: planned_communications fk_planned_communications_work_chart_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications
    ADD CONSTRAINT fk_planned_communications_work_chart_id FOREIGN KEY (work_chart_id) REFERENCES public.work_chart(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: planned_communications fk_planned_medium_kind_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications
    ADD CONSTRAINT fk_planned_medium_kind_code FOREIGN KEY (medium_kind) REFERENCES public.lookup_medium_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: approvals fk_rails_350d6258af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT fk_rails_350d6258af FOREIGN KEY (work_entry_id) REFERENCES public.work_entries(id);


--
-- Name: reports_presets fk_rails_9e3beef87f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports_presets
    ADD CONSTRAINT fk_rails_9e3beef87f FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: right_targets fk_right_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_targets
    ADD CONSTRAINT fk_right_id FOREIGN KEY (right_id) REFERENCES public.rights(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rights fk_right_type_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT fk_right_type_id FOREIGN KEY (right_type_id) REFERENCES public.right_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: rights fk_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles_has_roles fk_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_has_roles
    ADD CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tag_set_tags fk_tag_set_tags_tag_set_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_tags
    ADD CONSTRAINT fk_tag_set_tags_tag_set_id FOREIGN KEY (tag_set_id) REFERENCES public.tag_sets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tag_sets fk_tag_sets_kind_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_sets
    ADD CONSTRAINT fk_tag_sets_kind_code FOREIGN KEY (kind_code) REFERENCES public.tag_set_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: right_types fk_target_kind_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_types
    ADD CONSTRAINT fk_target_kind_code FOREIGN KEY (target_kind_code) REFERENCES public.right_type_target_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_chart_notes fk_work_chart_notes_work_chart_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_notes
    ADD CONSTRAINT fk_work_chart_notes_work_chart_id FOREIGN KEY (work_chart_id) REFERENCES public.work_chart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_chart_tag_set_map fk_work_chart_tag_set_map_tag_set_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_tag_set_map
    ADD CONSTRAINT fk_work_chart_tag_set_map_tag_set_id FOREIGN KEY (tag_set_id) REFERENCES public.tag_sets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_chart_tag_set_map fk_work_chart_tag_set_map_work_chart_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_tag_set_map
    ADD CONSTRAINT fk_work_chart_tag_set_map_work_chart_id FOREIGN KEY (work_chart_id) REFERENCES public.work_chart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_entries fk_work_entries_work_chart_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entries
    ADD CONSTRAINT fk_work_entries_work_chart_id FOREIGN KEY (work_chart_id) REFERENCES public.work_chart(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_entry_approvals fk_work_entry_approvals_kind_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_approvals
    ADD CONSTRAINT fk_work_entry_approvals_kind_code FOREIGN KEY (kind_code) REFERENCES public.approval_kinds(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_entry_approvals fk_work_entry_approvals_work_entry_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_approvals
    ADD CONSTRAINT fk_work_entry_approvals_work_entry_id FOREIGN KEY (work_entry_id) REFERENCES public.work_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_entry_durations fk_work_entry_durations_kind_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations
    ADD CONSTRAINT fk_work_entry_durations_kind_code FOREIGN KEY (kind_code) REFERENCES public.duration_kinds(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_entry_durations fk_work_entry_durations_work_entry_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations
    ADD CONSTRAINT fk_work_entry_durations_work_entry_id FOREIGN KEY (work_entry_id) REFERENCES public.work_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_entry_logs fk_work_entry_logs_action_code; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_logs
    ADD CONSTRAINT fk_work_entry_logs_action_code FOREIGN KEY (action_code) REFERENCES public.actions(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_entry_logs fk_work_entry_logs_work_entry_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_logs
    ADD CONSTRAINT fk_work_entry_logs_work_entry_id FOREIGN KEY (work_entry_id) REFERENCES public.work_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_entry_notes fk_work_entry_notes_work_entry_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_notes
    ADD CONSTRAINT fk_work_entry_notes_work_entry_id FOREIGN KEY (work_entry_id) REFERENCES public.work_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_entry_tags fk_work_entry_tags_tag_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_tags
    ADD CONSTRAINT fk_work_entry_tags_tag_id FOREIGN KEY (tag_id) REFERENCES public.tag_set_tags(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_entry_tags fk_work_entry_tags_work_entry_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_tags
    ADD CONSTRAINT fk_work_entry_tags_work_entry_id FOREIGN KEY (work_entry_id) REFERENCES public.work_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lookup_contact_item_kinds lookup_contact_item_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookup_contact_item_kinds
    ADD CONSTRAINT lookup_contact_item_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: lookup_contact_item_kinds lookup_contact_item_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookup_contact_item_kinds
    ADD CONSTRAINT lookup_contact_item_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: lookup_medium_kinds lookup_medium_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookup_medium_kinds
    ADD CONSTRAINT lookup_medium_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: lookup_medium_kinds lookup_medium_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookup_medium_kinds
    ADD CONSTRAINT lookup_medium_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: lookups lookups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookups
    ADD CONSTRAINT lookups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: lookups lookups_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lookups
    ADD CONSTRAINT lookups_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: planned_communications_contacts_map planned_communications_contacts_map_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_contacts_map
    ADD CONSTRAINT planned_communications_contacts_map_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: planned_communications_contacts_map planned_communications_contacts_map_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_contacts_map
    ADD CONSTRAINT planned_communications_contacts_map_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: planned_communications planned_communications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications
    ADD CONSTRAINT planned_communications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: planned_communications planned_communications_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications
    ADD CONSTRAINT planned_communications_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: planned_communications_roles_map planned_communications_roles_map_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_roles_map
    ADD CONSTRAINT planned_communications_roles_map_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: planned_communications_roles_map planned_communications_roles_map_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planned_communications_roles_map
    ADD CONSTRAINT planned_communications_roles_map_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: production_categories production_categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_categories
    ADD CONSTRAINT production_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: production_categories production_categories_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_categories
    ADD CONSTRAINT production_categories_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: right_targets right_targets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_targets
    ADD CONSTRAINT right_targets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: right_targets right_targets_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_targets
    ADD CONSTRAINT right_targets_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: right_type_target_kinds right_type_target_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_type_target_kinds
    ADD CONSTRAINT right_type_target_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: right_type_target_kinds right_type_target_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_type_target_kinds
    ADD CONSTRAINT right_type_target_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: right_types right_types_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_types
    ADD CONSTRAINT right_types_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: right_types right_types_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.right_types
    ADD CONSTRAINT right_types_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: rights rights_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: rights rights_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: roles roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: roles_has_roles roles_has_roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_has_roles
    ADD CONSTRAINT roles_has_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: roles_has_roles roles_has_roles_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles_has_roles
    ADD CONSTRAINT roles_has_roles_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: roles roles_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: tag_set_kinds tag_set_kinds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_kinds
    ADD CONSTRAINT tag_set_kinds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: tag_set_kinds tag_set_kinds_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_kinds
    ADD CONSTRAINT tag_set_kinds_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: tag_set_tags tag_set_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_tags
    ADD CONSTRAINT tag_set_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: tag_set_tags tag_set_tags_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_set_tags
    ADD CONSTRAINT tag_set_tags_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: tag_sets tag_sets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_sets
    ADD CONSTRAINT tag_sets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: tag_sets tag_sets_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_sets
    ADD CONSTRAINT tag_sets_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: time_zones time_zones_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_zones
    ADD CONSTRAINT time_zones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: time_zones time_zones_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_zones
    ADD CONSTRAINT time_zones_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: user_statuses user_statuses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_statuses
    ADD CONSTRAINT user_statuses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: user_statuses user_statuses_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_statuses
    ADD CONSTRAINT user_statuses_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_status_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_status_code_fkey FOREIGN KEY (status_code) REFERENCES public.user_statuses(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_time_zone_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_time_zone_code_fkey FOREIGN KEY (time_zone_code) REFERENCES public.time_zones(code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_chart work_chart_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart
    ADD CONSTRAINT work_chart_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_chart_kind_sets work_chart_kind_sets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_kind_sets
    ADD CONSTRAINT work_chart_kind_sets_id_fk FOREIGN KEY (work_chart_id) REFERENCES public.work_chart(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_chart_kinds_defaults work_chart_kinds_defaults_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_kinds_defaults
    ADD CONSTRAINT work_chart_kinds_defaults_fk FOREIGN KEY (work_chart_id, kind_code) REFERENCES public.work_chart_kinds(work_chart_id, kind_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_chart_kinds work_chart_kinds_kind_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_kinds
    ADD CONSTRAINT work_chart_kinds_kind_code_fk FOREIGN KEY (kind_code) REFERENCES public.duration_kinds(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_chart_kinds work_chart_kinds_work_chart_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_kinds
    ADD CONSTRAINT work_chart_kinds_work_chart_id_fk FOREIGN KEY (work_chart_id) REFERENCES public.work_chart_kind_sets(work_chart_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_chart work_chart_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart
    ADD CONSTRAINT work_chart_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_chart_notes work_chart_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_notes
    ADD CONSTRAINT work_chart_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_chart_notes work_chart_notes_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_notes
    ADD CONSTRAINT work_chart_notes_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_chart work_chart_status_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart
    ADD CONSTRAINT work_chart_status_fk FOREIGN KEY (status) REFERENCES public.work_chart_statuses(status) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_chart_statuses work_chart_statuses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_statuses
    ADD CONSTRAINT work_chart_statuses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_chart_statuses work_chart_statuses_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_statuses
    ADD CONSTRAINT work_chart_statuses_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_chart_tag_set_map work_chart_tag_set_map_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_tag_set_map
    ADD CONSTRAINT work_chart_tag_set_map_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_chart_tag_set_map work_chart_tag_set_map_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_chart_tag_set_map
    ADD CONSTRAINT work_chart_tag_set_map_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entries work_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entries
    ADD CONSTRAINT work_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entries work_entries_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entries
    ADD CONSTRAINT work_entries_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_approvals work_entry_approvals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_approvals
    ADD CONSTRAINT work_entry_approvals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_approvals work_entry_approvals_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_approvals
    ADD CONSTRAINT work_entry_approvals_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_audits work_entry_audits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_audits
    ADD CONSTRAINT work_entry_audits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_audits work_entry_audits_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_audits
    ADD CONSTRAINT work_entry_audits_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_durations_audits work_entry_durations_audits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations_audits
    ADD CONSTRAINT work_entry_durations_audits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_durations_audits work_entry_durations_audits_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations_audits
    ADD CONSTRAINT work_entry_durations_audits_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_durations work_entry_durations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations
    ADD CONSTRAINT work_entry_durations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_durations work_entry_durations_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations
    ADD CONSTRAINT work_entry_durations_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_durations work_entry_durations_production_category_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_durations
    ADD CONSTRAINT work_entry_durations_production_category_id_fk FOREIGN KEY (production_category_id) REFERENCES public.production_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_entry_fees work_entry_fees_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_fees
    ADD CONSTRAINT work_entry_fees_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_fees work_entry_fees_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_fees
    ADD CONSTRAINT work_entry_fees_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_fees work_entry_fees_work_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_fees
    ADD CONSTRAINT work_entry_fees_work_entry_id_fkey FOREIGN KEY (work_entry_id) REFERENCES public.work_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_entry_logs work_entry_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_logs
    ADD CONSTRAINT work_entry_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_logs work_entry_logs_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_logs
    ADD CONSTRAINT work_entry_logs_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_notes work_entry_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_notes
    ADD CONSTRAINT work_entry_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_notes work_entry_notes_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_notes
    ADD CONSTRAINT work_entry_notes_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- Name: work_entry_tags work_entry_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_tags
    ADD CONSTRAINT work_entry_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.roles(id);


--
-- Name: work_entry_tags work_entry_tags_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_entry_tags
    ADD CONSTRAINT work_entry_tags_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict C8EuoyWSojPFEAzmpIXVIMifsJhLncu4KG18D9AxxMpWP3RuIyP5LNw0K7iYTme

--
-- PostgreSQL database dump
--

\restrict V4fds1Lgoodykn8TBNCLXQTqtVFJlef5nNzblWAtxacsaFrb7AXckQU10B5oiK6

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
-- Data for Name: ar_internal_metadata; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.ar_internal_metadata VALUES ('environment', 'production', '2017-01-12 09:01:19.90274', '2020-11-06 10:49:52.650299');


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.schema_migrations VALUES ('20120920145613');
INSERT INTO public.schema_migrations VALUES ('20120920145619');
INSERT INTO public.schema_migrations VALUES ('20120920145632');
INSERT INTO public.schema_migrations VALUES ('20120920151337');
INSERT INTO public.schema_migrations VALUES ('20120921180717');
INSERT INTO public.schema_migrations VALUES ('20121213174235');
INSERT INTO public.schema_migrations VALUES ('20130109153834');
INSERT INTO public.schema_migrations VALUES ('20130220092644');
INSERT INTO public.schema_migrations VALUES ('20130228143757');
INSERT INTO public.schema_migrations VALUES ('20130730194105');
INSERT INTO public.schema_migrations VALUES ('20130917070614');
INSERT INTO public.schema_migrations VALUES ('20130925172227');
INSERT INTO public.schema_migrations VALUES ('20130326114320');
INSERT INTO public.schema_migrations VALUES ('20130408214712');
INSERT INTO public.schema_migrations VALUES ('20130418085141');
INSERT INTO public.schema_migrations VALUES ('20130418090012');
INSERT INTO public.schema_migrations VALUES ('20130418090716');
INSERT INTO public.schema_migrations VALUES ('20130419102257');
INSERT INTO public.schema_migrations VALUES ('20130423135229');
INSERT INTO public.schema_migrations VALUES ('20130424211645');
INSERT INTO public.schema_migrations VALUES ('20130430095128');
INSERT INTO public.schema_migrations VALUES ('20130430105839');
INSERT INTO public.schema_migrations VALUES ('20130517201933');
INSERT INTO public.schema_migrations VALUES ('20131206211620');
INSERT INTO public.schema_migrations VALUES ('20131210150551');
INSERT INTO public.schema_migrations VALUES ('20131210201655');
INSERT INTO public.schema_migrations VALUES ('20131210203227');
INSERT INTO public.schema_migrations VALUES ('20131212145625');
INSERT INTO public.schema_migrations VALUES ('20131223215759');
INSERT INTO public.schema_migrations VALUES ('20140121151211');
INSERT INTO public.schema_migrations VALUES ('20140124141515');
INSERT INTO public.schema_migrations VALUES ('20140124142528');
INSERT INTO public.schema_migrations VALUES ('20140116152822');
INSERT INTO public.schema_migrations VALUES ('20140203212657');
INSERT INTO public.schema_migrations VALUES ('20140127213148');
INSERT INTO public.schema_migrations VALUES ('20140407113458');
INSERT INTO public.schema_migrations VALUES ('20141029131628');
INSERT INTO public.schema_migrations VALUES ('20150225195806');
INSERT INTO public.schema_migrations VALUES ('20150127145043');
INSERT INTO public.schema_migrations VALUES ('20150127201326');
INSERT INTO public.schema_migrations VALUES ('20150820130208');
INSERT INTO public.schema_migrations VALUES ('20150901181846');
INSERT INTO public.schema_migrations VALUES ('20150901201917');
INSERT INTO public.schema_migrations VALUES ('20150901134802');
INSERT INTO public.schema_migrations VALUES ('20150901140927');
INSERT INTO public.schema_migrations VALUES ('20151019160650');
INSERT INTO public.schema_migrations VALUES ('20151019164548');
INSERT INTO public.schema_migrations VALUES ('20151019165224');
INSERT INTO public.schema_migrations VALUES ('20151020064658');
INSERT INTO public.schema_migrations VALUES ('20151021080657');
INSERT INTO public.schema_migrations VALUES ('20151021164228');
INSERT INTO public.schema_migrations VALUES ('20151022115208');
INSERT INTO public.schema_migrations VALUES ('20151023154147');
INSERT INTO public.schema_migrations VALUES ('20151026162650');
INSERT INTO public.schema_migrations VALUES ('20151026184148');
INSERT INTO public.schema_migrations VALUES ('20151028103314');
INSERT INTO public.schema_migrations VALUES ('20151028125658');
INSERT INTO public.schema_migrations VALUES ('20151109125647');
INSERT INTO public.schema_migrations VALUES ('20151109130835');
INSERT INTO public.schema_migrations VALUES ('20151112145607');
INSERT INTO public.schema_migrations VALUES ('20151118195620');
INSERT INTO public.schema_migrations VALUES ('20151119083744');
INSERT INTO public.schema_migrations VALUES ('20151123145854');
INSERT INTO public.schema_migrations VALUES ('20151123161153');
INSERT INTO public.schema_migrations VALUES ('20151123173117');
INSERT INTO public.schema_migrations VALUES ('20151126132628');
INSERT INTO public.schema_migrations VALUES ('20151207160104');
INSERT INTO public.schema_migrations VALUES ('20151209091928');
INSERT INTO public.schema_migrations VALUES ('20151210214802');
INSERT INTO public.schema_migrations VALUES ('20151215114242');
INSERT INTO public.schema_migrations VALUES ('20151215175922');
INSERT INTO public.schema_migrations VALUES ('20151216161106');
INSERT INTO public.schema_migrations VALUES ('20151222133005');
INSERT INTO public.schema_migrations VALUES ('20151228120559');
INSERT INTO public.schema_migrations VALUES ('20151229084723');
INSERT INTO public.schema_migrations VALUES ('20151230100507');
INSERT INTO public.schema_migrations VALUES ('20160108210154');
INSERT INTO public.schema_migrations VALUES ('20160301111100');
INSERT INTO public.schema_migrations VALUES ('20160301144313');
INSERT INTO public.schema_migrations VALUES ('20160303192259');
INSERT INTO public.schema_migrations VALUES ('20160304210018');
INSERT INTO public.schema_migrations VALUES ('20160308171237');
INSERT INTO public.schema_migrations VALUES ('20160308173848');
INSERT INTO public.schema_migrations VALUES ('20160309113229');
INSERT INTO public.schema_migrations VALUES ('20160309164346');
INSERT INTO public.schema_migrations VALUES ('20160310135916');
INSERT INTO public.schema_migrations VALUES ('20160310145639');
INSERT INTO public.schema_migrations VALUES ('20160311093836');
INSERT INTO public.schema_migrations VALUES ('20160404154318');
INSERT INTO public.schema_migrations VALUES ('20160415134724');
INSERT INTO public.schema_migrations VALUES ('20160422140903');
INSERT INTO public.schema_migrations VALUES ('20160426070852');
INSERT INTO public.schema_migrations VALUES ('20160426071842');
INSERT INTO public.schema_migrations VALUES ('20160426093339');
INSERT INTO public.schema_migrations VALUES ('20160613162429');
INSERT INTO public.schema_migrations VALUES ('20160614135824');
INSERT INTO public.schema_migrations VALUES ('20160614140258');
INSERT INTO public.schema_migrations VALUES ('20160616145538');
INSERT INTO public.schema_migrations VALUES ('20160620114321');
INSERT INTO public.schema_migrations VALUES ('20160620122500');
INSERT INTO public.schema_migrations VALUES ('20160623121245');
INSERT INTO public.schema_migrations VALUES ('20160624101629');
INSERT INTO public.schema_migrations VALUES ('20160912133311');
INSERT INTO public.schema_migrations VALUES ('20160912155130');
INSERT INTO public.schema_migrations VALUES ('20161004154501');
INSERT INTO public.schema_migrations VALUES ('20161020180058');
INSERT INTO public.schema_migrations VALUES ('20160824134256');
INSERT INTO public.schema_migrations VALUES ('20160824154718');
INSERT INTO public.schema_migrations VALUES ('20160829102705');
INSERT INTO public.schema_migrations VALUES ('20160830085541');
INSERT INTO public.schema_migrations VALUES ('20160729093338');
INSERT INTO public.schema_migrations VALUES ('20160729140211');
INSERT INTO public.schema_migrations VALUES ('20160820065814');
INSERT INTO public.schema_migrations VALUES ('20160822153116');
INSERT INTO public.schema_migrations VALUES ('20160822160812');
INSERT INTO public.schema_migrations VALUES ('20160822162003');
INSERT INTO public.schema_migrations VALUES ('20160823164103');
INSERT INTO public.schema_migrations VALUES ('20161214131815');
INSERT INTO public.schema_migrations VALUES ('20161221095542');
INSERT INTO public.schema_migrations VALUES ('20161229161531');
INSERT INTO public.schema_migrations VALUES ('20161230151120');
INSERT INTO public.schema_migrations VALUES ('20160823202034');
INSERT INTO public.schema_migrations VALUES ('20160901202150');
INSERT INTO public.schema_migrations VALUES ('20161026163829');
INSERT INTO public.schema_migrations VALUES ('20170210134126');
INSERT INTO public.schema_migrations VALUES ('20170210140906');
INSERT INTO public.schema_migrations VALUES ('20170214193121');
INSERT INTO public.schema_migrations VALUES ('20170215172913');
INSERT INTO public.schema_migrations VALUES ('20170216142913');
INSERT INTO public.schema_migrations VALUES ('20170218160936');
INSERT INTO public.schema_migrations VALUES ('20170220091844');
INSERT INTO public.schema_migrations VALUES ('20170220102452');
INSERT INTO public.schema_migrations VALUES ('20170228092217');
INSERT INTO public.schema_migrations VALUES ('20170530070458');
INSERT INTO public.schema_migrations VALUES ('20180419171617');
INSERT INTO public.schema_migrations VALUES ('20180419171855');
INSERT INTO public.schema_migrations VALUES ('20201105152042');
INSERT INTO public.schema_migrations VALUES ('20181127172955');
INSERT INTO public.schema_migrations VALUES ('20230525190458');
INSERT INTO public.schema_migrations VALUES ('20230525211154');
INSERT INTO public.schema_migrations VALUES ('20230525212944');
INSERT INTO public.schema_migrations VALUES ('20230525214446');
INSERT INTO public.schema_migrations VALUES ('20230525220454');
INSERT INTO public.schema_migrations VALUES ('20230607011235');
INSERT INTO public.schema_migrations VALUES ('20230731222725');
INSERT INTO public.schema_migrations VALUES ('20230801200414');
INSERT INTO public.schema_migrations VALUES ('20230801201507');
INSERT INTO public.schema_migrations VALUES ('20230808162443');
INSERT INTO public.schema_migrations VALUES ('20230808172427');
INSERT INTO public.schema_migrations VALUES ('20230808233911');
INSERT INTO public.schema_migrations VALUES ('20230818185944');
INSERT INTO public.schema_migrations VALUES ('20230818204216');
INSERT INTO public.schema_migrations VALUES ('20230825170634');
INSERT INTO public.schema_migrations VALUES ('20230829000404');
INSERT INTO public.schema_migrations VALUES ('20230830172943');
INSERT INTO public.schema_migrations VALUES ('20230914002529');
INSERT INTO public.schema_migrations VALUES ('20230922235202');
INSERT INTO public.schema_migrations VALUES ('20230922235302');
INSERT INTO public.schema_migrations VALUES ('20231219204150');
INSERT INTO public.schema_migrations VALUES ('20231219204943');
INSERT INTO public.schema_migrations VALUES ('20231226202423');


--
-- PostgreSQL database dump complete
--

\unrestrict V4fds1Lgoodykn8TBNCLXQTqtVFJlef5nNzblWAtxacsaFrb7AXckQU10B5oiK6

