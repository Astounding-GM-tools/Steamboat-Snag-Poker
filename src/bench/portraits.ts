import { mount } from 'svelte';
import Portraits from './Portraits.svelte';
import '../ui/app.css';
import '../ui/table.css';

mount(Portraits, { target: document.getElementById('bench')! });
