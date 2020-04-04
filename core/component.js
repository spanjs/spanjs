
import { SimpleObserver, DictionaryObserver } from './observer';
import { Template } from './template';


/**
 * @description
 */
const HOOKS = {
    ON_CREATE: 'onCreate',
    ON_DATA:'onData'
}
/**
 * 
 * @param {string} name 
 * @param {Object} hooks 
 * @param {Object} thisArg 
 */
const ExecuteHook = (name, hooks, thisArg, data ) => hooks[name] ? (data ? hooks[name].apply(thisArg, [data]) : hooks[name].apply(thisArg, []) ) : null;

/**
 * 
 * @param {Object} data 
 * @param {function} set 
 */
const DataProxy = (data, renderer) => {
    let proxy = new Proxy(data, {
    get: (target, key)=>{
        return target[key];
    },
    set: (target, key, value) => {         
        if (!target.hasOwnProperty(key)) { return false; }
        target[key] = value;
        setTimeout(()=>{
            renderer.send(proxy);   
        });
        return true;
    },
});
    return proxy;
}
const DataReceiver = new DictionaryObserver(false);
/**
 * TODO: Consider classes when using multiple instances of the same components
 * @param {string} name 
 * @param {Object} state 
 */
export const Component = (name, state) => {
    
    let State = {
        name: name,
        ...state.data,
        ...state.methods,
        component:{
            emitter: DataReceiver
        }
    };
    let Hooks = state.hooks;

    let raw_template = document.querySelector(`#${name}`).innerHTML;

    let renderer = new SimpleObserver(false); 

    let proxy = DataProxy( State, renderer);
    
    DataReceiver.subscribe(State.name,(data)=>{
        ExecuteHook(HOOKS.ON_DATA, Hooks, proxy, data);
    });
    // onData HOOK //TODO: define onData Hook
    renderer.subscribe(State.name, ()=>{
        // onBeforeChange HOOK
        Template.render(State.name, proxy);
        // onAfterChange HOOK
    });
    
    Template.render(State.name, proxy);
    
    return { 
        name: name, 
        raw_template: raw_template,
        ready:()=>{
            ExecuteHook(HOOKS.ON_CREATE, Hooks, proxy);
        }
    };
};