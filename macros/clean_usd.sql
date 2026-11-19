{#
    Sheets values arrive as text and may carry display formatting ("$1,500").
    Strip $ and commas, then cast. Blank or unparseable values become null.
#}
{% macro clean_usd(column_name) %}
    safe_cast(nullif(regexp_replace(trim({{ column_name }}), r'[$,]', ''), '') as numeric)
{% endmacro %}
