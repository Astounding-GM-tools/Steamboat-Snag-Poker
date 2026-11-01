import { mount } from 'svelte';
import Bench from './Bench.svelte';
import '../ui/app.css';
import '../ui/table.css';

mount(Bench, { target: document.getElementById('bench')! });
