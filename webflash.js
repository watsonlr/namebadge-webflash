const manifestUrl = 'https://raw.githubusercontent.com/watsonlr/namebadge-apps/main/bootloader_downloads/loader_manifest.json';
let bootloaderInfo = null;
let bootloaderBinary = null;

const statusDiv = document.getElementById('status');
const connectBtn = document.getElementById('connectBtn');

async function fetchManifest() {
  statusDiv.textContent = 'Fetching manifest...';
  try {
    const resp = await fetch(manifestUrl);
    if (!resp.ok) throw new Error('Failed to fetch manifest');
    const manifest = await resp.json();
    // Pick the first entry for now
    bootloaderInfo = manifest[0];
    statusDiv.textContent = `Found bootloader: version ${bootloaderInfo.loader_version}, url: ${bootloaderInfo.url}`;
    await fetchBootloaderBinary(bootloaderInfo.url);
    connectBtn.disabled = false;
  } catch (e) {
    statusDiv.textContent = 'Error fetching manifest: ' + e;
  }
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
  }
}

connectBtn.addEventListener('click', async () => {
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

fetchManifest();
