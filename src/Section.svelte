<script>
    export let settings = {};
    export let div_class;

    const style = `
        border-radius: 0 8px 8px 0;
        float: left;
        position: relative;
        top: ${settings.top || 0}%;
        overflow-wrap: break-word;
        hyphens: auto;
        inline-size: 70%;
    `;
</script>

<div style={style} class={div_class}>
    <slot></slot>
</div>