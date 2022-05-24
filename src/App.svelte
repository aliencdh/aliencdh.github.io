<script>
    import NavBar from './NavBar.svelte';
    import SectionMarker from './SectionMarker.svelte';
    import Section from './Section.svelte';

    let about_me = {
        // top: -10
    };
</script>

<div class="main">
    <NavBar />
    <h2>Welcome to my humble little personal blog~</h2>	

    <SectionMarker title="about me" />
    <Section div_class="about_me">
        <p>
        I'm Alicia, a Netherlands-based fullstack developer.
        I prefer backend work (such as writing APIs and implementing logic/libraries),
        but I can handle frontend work,
        mostly in html-based environments (such as webdev, tauri, electron).
        I also have knowledge of gamedev (mostly retro 2D games) and algorithms.
        </p>
    </Section>

    <SectionMarker title="languages" />
    <Section div_class="languages">
        <p>
            A list of the programming languages I'm confident in (marked with ★),
            but also any other languages I have enough knowledge to work with:
        </p>
        <ul>
            <li><a href="https://www.rust-lang.org/">Rust</a> ★</li>
            <li><a href="https://en.wikipedia.org/wiki/C++">C++</a> ★</li>
            <li><a href="https://en.wikipedia.org/wiki/C_(programming_language)">C</a> ★</li>
            <li>
                <a href="https://en.wikipedia.org/wiki/JavaScript">Javascript</a>/
                <a href="https://www.typescriptlang.org/">Typescript</a> ★
            </li>
            <li><a href="https://www.python.org/">Python</a> ★</li>
            <li><a href="https://en.wikipedia.org/wiki/C_Sharp_(programming_language)">C#</a> ★</li>
            <li><a href="https://www.lua.org/">Lua</a> ★</li>
            <li><a href="https://www.haskell.org/">Haskell</a></li>
            <li><a href="https://en.wikipedia.org/wiki/Elixir_(programming_language)">Elixir</a></li>
            <li><a href="https://en.wikipedia.org/wiki/Java_(programming_language)">Java</a></li>
            <li><a href="https://www.nasm.us/">NASM x86 assembly</a></li>
        </ul>
    </Section>

</div>


<style>
    .main {
        color: white;
        background-color: #292929;
        height: 100%;
        width: 100%;

        font-family: 'Inconsolata', monospace;
        padding: none;
    }
    .main h2 {
        text-align: center;
    }
    .main a {
        text-decoration: none;
        color: white;
    }
</style>