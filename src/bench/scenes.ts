import { mount } from 'svelte';
import Scenes from './Scenes.svelte';
import '../ui/app.css';
import '../ui/table.css';

mount(Scenes, { target: document.getElementById('bench')! });
