(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./js/sw.js').then(() => console.log('Service Worker registered')).catch((err) => console.error('SW registration failed:', err));
  }
})();

const iconReset = document.getElementById("reset-svg");
const t = document.getElementById("plaintext");
const m = document.getElementById("method");
const r = document.getElementById("result");


function showNotif(text) {
  const notif = document.createElement('div');
  notif.textContent = text;
  Object.assign(notif.style, {
    position: 'fixed',
    top: '-40px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0066ff',
    color: '#fff',
    padding: '0.6rem 1.2rem',
    fontSize: '0.9rem',
    borderRadius: '6px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    transition: 'all 0.4s ease, opacity 0.4s ease',
    opacity: '0.9',
    zIndex: '9999',
  });
  document.body.appendChild(notif);
  requestAnimationFrame(() => {
    notif.style.top = '20px';
  });
  setTimeout(() => {
    notif.style.top = '-40px';
    notif.style.opacity = '0';
    setTimeout(() => {
      notif.remove();
    }, 400);
  }, 2500);
}

function copy() {
  if (!r.value) return
  
  try {
    navigator.clipboard.writeText(r.value);
    showNotif("⚡Copy")
  } catch (err) {
    showNotif("🔥Error");
  }
}

let rotasi = 1
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!t.value && !r.value) return;

  requestAnimationFrame(() => {
    t.value = "";
    m.value = "SHA-256";
    r.value = "";

    iconReset.style.transform = `rotate(-${360 * rotasi}deg)`
    rotasi++
  });
});

let typingTimer;

t.addEventListener("input", () => {
  clearTimeout(typingTimer);

  typingTimer = setTimeout(() => {
    const text = t.value;
    const method = m.value;
    hash(text, method);
  }, 500);
});

async function hash(text, method) {
  if (!text || !method) {
    r.value = ""
    return
  };
  // Non crypto hash
  function fnv1aHash(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return ("0000000" + hash.toString(16)).slice(-8);
  }
  function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }
  function sdbmHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    }
    return (hash >>> 0).toString(16);
  }
  function xorHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i) << (i % 8);
    }
    return (hash >>> 0).toString(16);
  }
  
  async function hashSHA256(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function hashSHA384(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-384", data);
    return [...new Uint8Array(hashBuffer)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  async function hashSHA512(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    return [...new Uint8Array(hashBuffer)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  async function hashSHA1(data) {
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  const hashMethods = {
    "SHA-256": hashSHA256,
    "SHA-384": hashSHA384,
    "SHA-512": hashSHA512,
    "SHA-1": hashSHA1,
    "FNV-1a": fnv1aHash,
    "DJB2": djb2Hash,
    "SDBM": sdbmHash,
    "XOR": xorHash,
  };
  if (!hashMethods[method]) {
    alert("Metode hasing not valid!");
    return;
  }
  try {
    if (method.startsWith("SHA")) {
      const data = new TextEncoder().encode(text);
      r.value = await hashMethods[method](data);
      return
    } else {
      r.value = await hashMethods[method](text);
    }
  } catch (err) {
    alert("Error on hashing");
  }
}