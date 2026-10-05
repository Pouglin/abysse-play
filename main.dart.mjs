// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      AE: (x0,x1) => x0.getPropertyValue(x1),
      AF: x0 => x0.identifier,
      AG: () => Date.now(),
      AH: x0 => x0.history,
      AI: (x0,x1) => x0.createEvent(x1),
      AJ: x0 => x0.ctrlKey,
      AK: (x0,x1) => x0.createMediaElementSource(x1),
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: x0 => x0.tabIndex,
      BE: x0 => globalThis.parseFloat(x0),
      BF: x0 => x0.touches,
      BG: () => typeof dartUseDateNowForTicks !== "undefined",
      BH: x0 => x0.search,
      BI: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      BJ: x0 => x0.isComposing,
      BK: x0 => x0.createGain(),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: (x0,x1) => x0.contains(x1),
      CE: (x0,x1) => x0.getComputedStyle(x1),
      CF: x0 => x0.pressure,
      CG: () => 1000 * performance.now(),
      CH: x0 => x0.location,
      CI: x0 => x0.readText(),
      CJ: x0 => x0.code,
      CK: x0 => x0.createStereoPanner(),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: x0 => x0.activeElement,
      DE: x0 => x0.documentElement,
      DF: x0 => x0.tiltY,
      DG: x0 => x0.pop(),
      DH: x0 => x0.pathname,
      DI: x0 => x0.clipboard,
      DJ: x0 => x0.repeat,
      DK: (x0,x1) => x0.connect(x1),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: x0 => x0.parentNode,
      EE: x0 => x0.computedStyleMap(),
      EF: x0 => x0.tiltX,
      EG: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      EH: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      EI: (x0,x1) => x0.writeText(x1),
      EJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      EK: x0 => x0.load(),
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.tagName,
      FE: (x0,x1) => x0.get(x1),
      FF: x0 => x0.pointerType,
      FG: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      FH: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      FI: x0 => x0.unlock(),
      FJ: x0 => x0.userAgent,
      FK: x0 => x0.destination,
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: x0 => x0.target,
      GE: (o, p) => p in o,
      GF: x0 => x0.pointerId,
      GG: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      GH: o => Object.keys(o),
      GI: (x0,x1) => x0.lock(x1),
      GJ: x0 => x0.navigator,
      GK: x0 => x0.code,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: x0 => x0.clientY,
      HE: (x0,x1) => { x0.textContent = x1 },
      HF: x0 => x0.getCoalescedEvents(),
      HG: (x0,x1) => x0.getRandomValues(x1),
      HH: x0 => x0.state,
      HI: x0 => x0.orientation,
      HJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      HK: x0 => x0.message,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: x0 => x0.clientX,
      IE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      IF: (x0,x1) => x0.getModifierState(x1),
      IG: () => globalThis.crypto,
      IH: x0 => x0.hash,
      II: (x0,x1) => x0.querySelector(x1),
      IJ: () => globalThis.window,
      IK: x0 => x0.error,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      JE: x0 => x0.matches,
      JF: s => s.trimLeft(),
      JG: l => new DataView(new ArrayBuffer(l)),
      JH: x0 => x0.state,
      JI: (x0,x1) => { x0.title = x1 },
      JJ: (x0,x1) => x0.removeItem(x1),
      JK: x0 => x0.duration,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: x0 => x0.getBoundingClientRect(),
      KE: (x0,x1) => x0.matchMedia(x1),
      KF: s => s.toUpperCase(),
      KG: (map, o, v) => map.set(o, v),
      KH: (x0,x1) => x0.go(x1),
      KI: (x0,x1) => x0.vibrate(x1),
      KJ: x0 => x0.localStorage,
      KK: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      LE: x0 => x0.matches,
      LF: (x0,x1) => x0[x1],
      LG: () => new WeakMap(),
      LH: x0 => x0.parentElement,
      LI: x0 => x0.content,
      LJ: (x0,x1) => x0.getItem(x1),
      LK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      ME: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      MF: x0 => x0.index,
      MG: (d, digits) => d.toFixed(digits),
      MH: (x0,x1) => x0.querySelectorAll(x1),
      MI: x0 => x0.document,
      MJ: (x0,x1) => x0.key(x1),
      MK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: Date.now,
      NE: f => f.dartFunction,
      NF: x0 => x0.flags,
      NG: x0 => x0.maxHeight,
      NH: (x0,x1) => x0.removeProperty(x1),
      NI: x0 => new WeakRef(x0),
      NJ: x0 => x0.length,
      NK: (x0,x1) => { x0.playbackRate = x1 },
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: (handle) => clearTimeout(handle),
      OE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      OF: (a, s) => a.join(s),
      OG: x0 => x0.maxWidth,
      OH: (x0,x1) => x0.add(x1),
      OI: x0 => x0.deref(),
      OJ: (x0,x1,x2) => x0.setItem(x1,x2),
      OK: (x0,x1) => { x0.crossOrigin = x1 },
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: (a, l) => a.length = l,
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      PF: (x0,x1) => x0.error(x1),
      PG: x0 => x0.minHeight,
      PH: x0 => x0.data,
      PI: () => globalThis.WeakRef,
      PJ: x0 => x0.baseURI,
      PK: (x0,x1) => { x0.preload = x1 },
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: (x0,x1) => x0.closest(x1),
      QE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      QF: () => globalThis.console,
      QG: x0 => x0.minWidth,
      QH: (x0,x1) => { x0.scrollTop = x1 },
      QI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      QJ: x0 => x0.document,
      QK: (x0,x1) => x0.createElement(x1),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: x0 => x0.bottom,
      RE: (o, i) => o[i],
      RF: s => s.trimRight(),
      RG: x0 => x0.debugSkipFontRetryDelay,
      RH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      RI: x0 => x0.id,
      RJ: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      RK: () => globalThis.document,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: x0 => x0.top,
      SE: o => o.length,
      SF: x0 => x0.blur(),
      SG: x0 => x0.status,
      SH: (x0,x1) => { x0.value = x1 },
      SI: x0 => x0.offsetHeight,
      SJ: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      SK: x0 => x0.length,
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (x0,x1) => x0.exec(x1),
      TD: x0 => x0.right,
      TE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      TF: x0 => x0.button,
      TG: x0 => new Uint8Array(x0),
      TH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      TI: x0 => x0.offsetWidth,
      TJ: x0 => x0.abort(),
      TK: x0 => x0.getReader(),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: x0 => x0.length,
      UD: x0 => x0.left,
      UE: x0 => x0.language,
      UF: x0 => x0.innerHeight,
      UG: (x0,x1,x2) => x0.set(x1,x2),
      UH: (x0,x1) => { x0.value = x1 },
      UI: x0 => x0.stopPropagation(),
      UJ: () => new AbortController(),
      UK: x0 => x0.value,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (x0,x1) => { x0.lastIndex = x1 },
      VD: x0 => x0.clientY,
      VE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      VF: x0 => x0.innerWidth,
      VG: x0 => x0.buffer,
      VH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      VI: x0 => x0.disabled,
      VJ: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      VK: x0 => x0.done,
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      WD: x0 => x0.clientX,
      WE: () => globalThis.window.FinalizationRegistry,
      WF: x0 => x0.height,
      WG: x0 => x0.wasmMemory,
      WH: x0 => x0.value,
      WI: (x0,x1) => { x0.min = x1 },
      WJ: (x0,x1) => globalThis.fetch(x0,x1),
      WK: x0 => x0.read(),
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: o => o instanceof RegExp,
      XD: x0 => x0.changedTouches,
      XE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      XF: x0 => x0.width,
      XG: () => globalThis.window._flutter_skwasmInstance,
      XH: x0 => x0.selectionDirection,
      XI: (x0,x1) => { x0.max = x1 },
      XJ: (x0,x1) => x0.get(x1),
      XK: x0 => x0.body,
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: (string, times) => string.repeat(times),
      YD: x0 => x0.offsetY,
      YE: x0 => new window.FinalizationRegistry(x0),
      YF: x0 => x0.clientHeight,
      YG: x0 => x0.arrayBuffer(),
      YH: x0 => x0.selectionStart,
      YI: (x0,x1) => { x0.disabled = x1 },
      YJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      YK: (x0,x1) => new OffscreenCanvas(x0,x1),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: x0 => x0.dotAll,
      ZD: x0 => x0.offsetX,
      ZE: (x0,x1) => x0.unregister(x1),
      ZF: x0 => x0.clientWidth,
      ZG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      ZH: x0 => x0.selectionEnd,
      ZI: (x0,x1) => { x0.scrollLeft = x1 },
      ZJ: (x0,x1) => x0.forEach(x1),
      ZK: x0 => x0.assetBase,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: x0 => x0.unicode,
      aD: x0 => x0.type,
      aE: (x0,x1) => x0.contains(x1),
      aF: (x0,x1) => { x0.content = x1 },
      aG: (x0,x1) => x0.fetch(x1),
      aH: x0 => x0.value,
      aI: (x0,x1) => { x0.spellcheck = x1 },
      aJ: x0 => x0.statusText,
      aK: x0 => x0.loader,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: x0 => x0.ignoreCase,
      bD: x0 => x0.maxTouchPoints,
      bE: (s) => +s,
      bF: (x0,x1) => { x0.name = x1 },
      bG: x0 => x0.fontFallbackBaseUrl,
      bH: x0 => x0.selectionDirection,
      bI: (x0,x1) => { x0.disabled = x1 },
      bJ: x0 => x0.url,
      bK: () => globalThis._flutter,
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: x0 => x0.multiline,
      cD: x0 => x0.platform,
      cE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      cF: x0 => x0.head,
      cG: (x0,x1,x2) => x0.slice(x1,x2),
      cH: x0 => x0.selectionStart,
      cI: (a, i) => a.splice(i, 1),
      cJ: x0 => x0.status,
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (string, token) => string.split(token),
      dD: x0 => x0.body,
      dE: s => s.trim(),
      dF: (x0,x1) => x0.removeChild(x1),
      dG: (x0,x1) => x0.decode(x1),
      dH: x0 => x0.selectionEnd,
      dI: a => a.pop(),
      dJ: x0 => x0.getReader(),
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: o => o instanceof Array,
      eD: () => globalThis.document,
      eE: x0 => x0.classList,
      eF: x0 => x0.firstChild,
      eG: (x0,x1) => x0.adoptText(x1),
      eH: x0 => x0.keyCode,
      eI: (map, o) => map.get(o),
      eJ: x0 => x0.read(),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: (a, i) => a[i],
      fD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      fE: x0 => x0.preventDefault(),
      fF: x0 => x0.viewConstraints,
      fG: x0 => x0.first(),
      fH: (x0,x1) => x0.scrollIntoView(x1),
      fI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      fJ: x0 => x0.value,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: a => a.length,
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.parent,
      gF: x0 => x0.hostElement,
      gG: x0 => x0.next(),
      gH: x0 => x0.multiViewEnabled,
      gI: (a, s, e) => a.slice(s, e),
      gJ: x0 => x0.done,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: (x0,x1) => x0.test(x1),
      hD: x0 => x0.relatedTarget,
      hE: x0 => x0.timeStamp,
      hF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hG: x0 => x0.current(),
      hH: (x0,x1) => x0.replaceWith(x1),
      hI: (a, l) => a.length = l,
      hJ: x0 => x0.body,
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: x0 => x0.userAgent,
      iD: x0 => x0.shiftKey,
      iE: (x0,x1) => x0.hasAttribute(x1),
      iF: x0 => ({runApp: x0}),
      iG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      iH: (x0,x1) => { x0.type = x1 },
      iI: (x0,x1) => x0.transferFromImageBitmap(x1),
      iJ: x0 => x0.headers,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: x0 => x0.navigator,
      jD: (decoder, codeUnits) => decoder.decode(codeUnits),
      jE: x0 => x0.buttons,
      jF: (x0,x1) => x0.requestAnimationFrame(x1),
      jG: x0 => x0.v8BreakIterator,
      jH: (x0,x1) => { x0.className = x1 },
      jI: (x0,x1) => x0.getContext(x1),
      jJ: x0 => x0.signal,
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: Function.prototype.call.bind(String.prototype.toLowerCase),
      kD: () => new TextDecoder("utf-8", {fatal: true}),
      kE: x0 => x0.ctrlKey,
      kF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kG: () => globalThis.Intl,
      kH: (x0,x1) => { x0.tabIndex = x1 },
      kI: (x0,x1) => { x0.height = x1 },
      kJ: () => globalThis.removeSplashFromWeb(),
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: Object.is,
      lD: () => new TextDecoder("utf-8", {fatal: false}),
      lE: x0 => x0.y,
      lF: x0 => x0.now(),
      lG: (x0,x1) => x0.segment(x1),
      lH: (x0,x1) => { x0.name = x1 },
      lI: (x0,x1) => { x0.width = x1 },
      lJ: x0 => x0.close(),
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: x0 => x0.vendor,
      mD: (a, i, v) => a[i] = v,
      mE: x0 => x0.x,
      mF: x0 => x0.performance,
      mG: x0 => x0.index,
      mH: (x0,x1) => { x0.placeholder = x1 },
      mI: x0 => x0.height,
      mJ: x0 => x0.disconnect(),
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: (x0,x1) => x0.createTextNode(x1),
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.scrollTop,
      nF: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      nG: x0 => x0.next(),
      nH: (x0,x1) => { x0.autocomplete = x1 },
      nI: x0 => x0.width,
      nJ: x0 => x0.remove(),
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: (x0,x1) => { x0.id = x1 },
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.offsetTop,
      oF: (x0,x1) => x0.onResume(x1),
      oG: x0 => x0.value,
      oH: (x0,x1) => { x0.name = x1 },
      oI: x0 => x0.rasterEndMilliseconds,
      oJ: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: (x0,x1) => { x0.nonce = x1 },
      pD: x0 => x0.visibilityState,
      pE: x0 => x0.scrollLeft,
      pF: x0 => x0.system,
      pG: x0 => x0.done,
      pH: (x0,x1) => { x0.placeholder = x1 },
      pI: x0 => x0.rasterStartMilliseconds,
      pJ: (x0,x1) => { x0.src = x1 },
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: x0 => x0.nonce,
      qD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      qE: x0 => x0.offsetLeft,
      qF: x0 => x0.IN_PLAYABLES_ENV,
      qG: (o, m, a) => o[m].apply(o, a),
      qH: (x0,x1) => { x0.action = x1 },
      qI: x0 => x0.imageBitmaps,
      qJ: x0 => x0.pause(),
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: () => globalThis.window.flutterConfiguration,
      rD: x0 => x0.disconnect(),
      rE: x0 => x0.offsetParent,
      rF: () => globalThis.ytgame,
      rG: x0 => x0.iterator,
      rH: (x0,x1) => { x0.method = x1 },
      rI: x0 => x0.canvasKitMaximumSurfaces,
      rJ: x0 => x0.currentTime,
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: (x0,x1) => x0.attachShadow(x1),
      sD: x0 => new Intl.Locale(x0),
      sE: (o, p, r) => o.replace(p, () => r),
      sF: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      sG: () => globalThis.Symbol,
      sH: (x0,x1) => { x0.noValidate = x1 },
      sI: (a, i) => a.splice(i, 1)[0],
      sJ: (x0,x1) => { x0.loop = x1 },
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: (x0,x1) => x0.createElement(x1),
      tD: x0 => x0.region,
      tE: (o, p, r) => o.replaceAll(p, () => r),
      tF: (x0,x1) => x0.onPause(x1),
      tG: (x0,x1) => new Intl.Segmenter(x0,x1),
      tH: (x0,x1) => x0.removeAttribute(x1),
      tI: x0 => x0.cancel(),
      tJ: (x0,x1) => { x0.value = x1 },
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.scale,
      uD: x0 => x0.script,
      uE: x0 => x0.deltaMode,
      uF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      uG: x0 => x0.Segmenter,
      uH: x0 => x0.isConnected,
      uI: x0 => x0.name,
      uJ: x0 => x0.gain,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.visualViewport,
      vD: x0 => x0.language,
      vE: x0 => x0.deltaY,
      vF: (x0,x1) => x0.onAudioEnabledChange(x1),
      vG: () => new TextDecoder(),
      vH: x0 => x0.click(),
      vI: x0 => x0.hostElement,
      vJ: (x0,x1) => { x0.currentTime = x1 },
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.devicePixelRatio,
      wD: x0 => x0.languages,
      wE: x0 => x0.deltaX,
      wF: x0 => x0.gameReady(),
      wG: (handle) => clearInterval(handle),
      wH: (x0,x1) => x0.getElementsByClassName(x1),
      wI: x0 => x0.location,
      wJ: x0 => x0.resume(),
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.height,
      xD: (x0,x1) => x0.observe(x1),
      xE: x0 => x0.wheelDeltaY,
      xF: x0 => x0.game,
      xG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      xH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      xI: (x0,x1) => x0.getModifierState(x1),
      xJ: x0 => x0.play(),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.width,
      yD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      yE: x0 => x0.wheelDeltaX,
      yF: x0 => x0.firstFrameReady(),
      yG: () => Date.now(),
      yH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      yI: x0 => x0.metaKey,
      yJ: x0 => x0.state,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.screen,
      zD: x0 => new ResizeObserver(x0),
      zE: x0 => x0.key,
      zF: x0 => x0.isAudioEnabled(),
      zG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      zH: (x0,x1) => x0.dispatchEvent(x1),
      zI: x0 => x0.altKey,
      zJ: () => new AudioContext(),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
