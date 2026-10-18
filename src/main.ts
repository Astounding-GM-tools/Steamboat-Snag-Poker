import { mount } from 'svelte';
import App from './ui/App.svelte';
import './ui/app.css';
import './ui/table.css';

mount(App, { target: document.getElementById('app')! });
