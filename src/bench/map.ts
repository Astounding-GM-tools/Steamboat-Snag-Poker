import { mount } from 'svelte';
import RiverMap from './RiverMap.svelte';
import '../ui/app.css';
import '../ui/table.css';

mount(RiverMap, { target: document.getElementById('bench')! });
