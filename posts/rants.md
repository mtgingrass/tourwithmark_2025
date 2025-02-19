---
title: "Rants"
format: html
---

# Rants

::: {.callout-note appearance="simple"}
💭 **Unfiltered thoughts, updated regularly.**
:::

{% for rant in rants %}
## {{ rant.date }}
{{ rant.content }}

---
{% endfor %}