
const manifestUrl = 'https://raw.githubusercontent.com/watsonlr/namebadge-apps/main/bootloader_downloads/loader_manifest.json';
let bootloaderList = [];
let bootloaderBinary = null;


const statusDiv = document.getElementById('status');
const bootloaderSelect = document.getElementById('bootloaderSelect');
const flashBtn = document.getElementById('flashBtn');
const flashControls = document.getElementById('flashControls');
const mainContent = document.getElementById('mainContent');
const unsupportedMsg = document.getElementById('unsupportedMsg');
const browserNameMsg = document.getElementById('browserNameMsg');


function isSupportedBrowser() {
  // Must have Web Serial API
  if (!('serial' in navigator)) {
    console.log('[DEBUG] Web Serial API not found in navigator.');
    return false;
  }
  const ua = navigator.userAgent;
  console.log('[DEBUG] User agent:', ua);
  // Detect Brave using navigator.brave if available
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    console.log('[DEBUG] Detected Brave browser.');
    return false;
  }
  // Exclude known unsupported browsers
  if (ua.includes('Firefox')) {
    console.log('[DEBUG] Detected Firefox.');
    return false;
  }
  if (ua.includes('Safari')) {
    console.log('[DEBUG] Detected Safari.');
    return false;
  }
  if (ua.includes('OPR/') || ua.includes('Opera')) {
    console.log('[DEBUG] Detected Opera.');
    return false;
  }
  // Accept Edge, Chrome, Chromium (Edge must be checked before Chrome)
  if (ua.includes('Edg/')) {
    console.log('[DEBUG] Detected Edge.');
    return true;
  }
  if (ua.includes('Chrome/')) {
    console.log('[DEBUG] Detected Chrome.');
    return true;
  }
  if (ua.includes('Chromium/')) {
    console.log('[DEBUG] Detected Chromium.');
    return true;
  }
  console.log('[DEBUG] Browser not recognized as supported.');
  return false;
}


function getBrowserName() {
  const ua = navigator.userAgent;
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') return 'Brave';
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/')) return 'Google Chrome';
  if (ua.includes('Chromium/')) return 'Chromium';
  if (ua.includes('Firefox/')) return 'Mozilla Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Unknown';
}

function showBrowserStatus() {
  console.log('[DEBUG] showBrowserStatus() called');
  const browserName = getBrowserName();
  if (isSupportedBrowser()) {
    console.log('[DEBUG] showBrowserStatus: supported browser, showing mainContent');
    mainContent.style.display = '';
    unsupportedMsg.style.display = 'none';
    statusDiv.textContent = `Good -- Your Browser (${browserName}) can be used to flash your board.`;
    flashControls.style.display = '';
    bootloaderSelect.disabled = false;
    flashBtn.disabled = false;
    fetchManifest();
  } else {
    console.log('[DEBUG] showBrowserStatus: unsupported browser, showing unsupportedMsg');
    mainContent.style.display = 'none';
    unsupportedMsg.style.display = '';
    if (browserNameMsg) {
      browserNameMsg.innerHTML = `This browser (<b>${browserName}</b>) is not supported for flashing your Namebadge.`;
    }
  }
}

async function fetchManifest() {
  statusDiv.textContent = 'Fetching manifest...';
  try {
    const resp = await fetch(manifestUrl);
    if (!resp.ok) throw new Error('Failed to fetch manifest');
    let manifest = await resp.json();
    // Reverse order: latest first
    manifest = manifest.slice().reverse();
    bootloaderList = manifest;
    populateBootloaderDropdown();
    bootloaderSelect.disabled = false;
    flashBtn.disabled = false;
    // Preload the latest
    await fetchBootloaderBinary(bootloaderList[0].binary_url);
  } catch (e) {
    console.log('[DEBUG] Error in fetchManifest:', e);
    statusDiv.textContent = 'Error fetching manifest: ' + e;
    bootloaderSelect.disabled = true;
    flashBtn.disabled = true;
    // Do NOT hide mainContent or show unsupportedMsg here!
  }
}

function populateBootloaderDropdown() {
  bootloaderSelect.innerHTML = '';
  bootloaderList.forEach((entry, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = `v${entry.loader_version} (HW v${entry.hw_version}) - ${entry.binary_url.split('/').pop()}`;
    if (idx === 0) opt.selected = true; // highlight most recent
    bootloaderSelect.appendChild(opt);
  });
}

async function fetchBootloaderBinary(url) {
  statusDiv.textContent = 'Downloading bootloader binary...';
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch bootloader binary');
    bootloaderBinary = await resp.arrayBuffer();
    statusDiv.textContent = `Bootloader ready (${bootloaderBinary.byteLength} bytes)`;
  } catch (e) {
    statusDiv.textContent = 'Error downloading bootloader: ' + e;
    bootloaderBinary = null;
  }
}

bootloaderSelect.addEventListener('change', async (e) => {
  const idx = parseInt(bootloaderSelect.value, 10);
  const entry = bootloaderList[idx];
  await fetchBootloaderBinary(entry.binary_url);
});

flashBtn.addEventListener('click', async () => {
  if (!bootloaderBinary) {
    statusDiv.textContent = 'Bootloader not loaded.';
    return;
  }
  if (!('serial' in navigator)) {
    statusDiv.textContent = 'Web Serial API not supported in this browser.';
    return;
  }
  try {
    statusDiv.textContent = 'Requesting serial port...';
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    statusDiv.textContent = 'Serial port opened. (Flashing not implemented yet)';
    // For now, just print to console
    console.log('Bootloader binary ready to flash:', bootloaderBinary);
    await port.close();
    statusDiv.textContent = 'Serial port closed.';
  } catch (e) {
    statusDiv.textContent = 'Serial error: ' + e;
  }
});

console.log('[DEBUG] Global: calling showBrowserStatus()');
showBrowserStatus();
