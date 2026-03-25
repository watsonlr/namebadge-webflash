
const manifestUrl = 'https://raw.githubusercontent.com/watsonlr/namebadge-apps/main/bootloader_downloads/loader_manifest.json';
let bootloaderList = [];
let bootloaderBinary = null;


const statusDiv = document.getElementById('status');
const bootloaderSelect = document.getElementById('bootloaderSelect');
const flashBtn = document.getElementById('flashBtn');
const flashControls = document.getElementById('flashControls');
const mainContent = document.getElementById('mainContent');
const unsupportedMsg = document.getElementById('unsupportedMsg');


function isSupportedBrowser() {
  // Must have Web Serial API
  if (!('serial' in navigator)) return false;
  const ua = navigator.userAgent;
  // Exclude known unsupported browsers
  if (ua.includes('Firefox') || ua.includes('Safari') || ua.includes('OPR/') || ua.includes('Opera') || ua.includes('Brave/')) return false;
  // Accept Edge, Chrome, Chromium
  if (ua.includes('Edg/')) return true; // Edge
  if (ua.includes('Chrome/')) return true; // Chrome/Chromium
  if (ua.includes('Chromium/')) return true;
  return false;
}


function showBrowserStatus() {
  if (isSupportedBrowser()) {
    mainContent.style.display = '';
    unsupportedMsg.style.display = 'none';
    statusDiv.textContent = 'Good -- Your Browser can be used to flash your board.';
    flashControls.style.display = '';
    bootloaderSelect.disabled = false;
    flashBtn.disabled = false;
    fetchManifest();
  } else {
    mainContent.style.display = 'none';
    unsupportedMsg.style.display = '';
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
    statusDiv.textContent = 'Error fetching manifest: ' + e;
    bootloaderSelect.disabled = true;
    flashBtn.disabled = true;
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

showBrowserStatus();
