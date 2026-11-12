import { mount } from 'svelte';
import Boat from './Boat.svelte';
import '../ui/app.css';
import '../ui/table.css';

mount(Boat, { target: document.getElementById('bench')! });
