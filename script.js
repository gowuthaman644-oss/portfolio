// Frame configuration
const FRAME_COUNT = 240;
const framePath = (index) => `ezgif-frame-${String(index).padStart(3, '0')}.jpg`;

const canvas = document.getElementById('hero-canvas');
// Ultra High Performance Canvas Context (Zero Alpha Overhead)
const ctx = canvas.getContext('2d', { 
  alpha: false, 
  desynchronized: true,
  willReadFrequently: false 
});

const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');

const images = [];
let loadedCount = 0;
let lenisInstance = null;

// Physics & Frame Interpolation State
let targetFrame = 0;
let currentFrame = 0;
let isFirstFrameDrawn = false;

function hidePreloader() {
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 600);
  }
}

// Preload images into memory for 60-120fps lock
function preloadImages() {
  for (let i = 1; i <= FRAME_COUNT; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.src = framePath(i);
    
    img.onload = () => {
      loadedCount++;
      const progress = (loadedCount / FRAME_COUNT) * 100;
      if (loaderBar) loaderBar.style.width = `${progress}%`;

      if (i === 1 && !isFirstFrameDrawn) {
        isFirstFrameDrawn = true;
        renderFrame(0);
        setTimeout(hidePreloader, 300);
      }

      if (loadedCount === FRAME_COUNT) {
        hidePreloader();
        if (lenisInstance) lenisInstance.resize();
        updateScrollTarget();
      }
    };

    img.onerror = () => {
      loadedCount++;
      if (loadedCount === FRAME_COUNT) {
        hidePreloader();
        if (lenisInstance) lenisInstance.resize();
        updateScrollTarget();
      }
    };

    images.push(img);
  }

  // Backup fallback
  setTimeout(hidePreloader, 800);
}

// Canvas Sizing with Ultra Retina 4K / High-DPI support
let viewportWidth = 0;
let viewportHeight = 0;

function resizeCanvas() {
  // Device pixel ratio scaling up to 3x for ultra pixel density
  const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;

  canvas.width = Math.round(viewportWidth * dpr);
  canvas.height = Math.round(viewportHeight * dpr);
  
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;

  renderFrame(currentFrame);
  if (lenisInstance) lenisInstance.resize();
  updateScrollTarget();
}

window.addEventListener('resize', resizeCanvas);

// High Quality COVER fit rendering with sub-pixel alignment & high-grade interpolation
function renderFrame(frameValue) {
  const clampedValue = Math.max(0, Math.min(FRAME_COUNT - 1, frameValue));
  const baseIndex = Math.floor(clampedValue);
  const nextIndex = Math.min(FRAME_COUNT - 1, baseIndex + 1);
  const progress = clampedValue - baseIndex;

  const imgBase = images[baseIndex];
  if (!imgBase || !imgBase.complete || imgBase.naturalWidth === 0) return;

  const physicalWidth = canvas.width;
  const physicalHeight = canvas.height;

  // Clear background canvas buffer
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, physicalWidth, physicalHeight);

  // Enable maximum quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // COVER math logic: covers all sides edge-to-edge
  const drawImageCover = (img, alpha = 1.0) => {
    ctx.globalAlpha = alpha;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgAspect = imgWidth / imgHeight;
    const canvasAspect = physicalWidth / physicalHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasAspect > imgAspect) {
      drawWidth = physicalWidth;
      drawHeight = physicalWidth / imgAspect;
      drawX = 0;
      drawY = (physicalHeight - drawHeight) / 2;
    } else {
      drawHeight = physicalHeight;
      drawWidth = drawHeight * imgAspect;
      drawX = (physicalWidth - drawWidth) / 2;
      drawY = 0;
    }

    ctx.drawImage(
      img, 
      Math.round(drawX), 
      Math.round(drawY), 
      Math.round(drawWidth), 
      Math.round(drawHeight)
    );
  };

  // Draw primary frame
  drawImageCover(imgBase, 1.0);

  // Liquid sub-frame crossfading for zero-stutter continuous scrolling
  if (progress > 0.002 && baseIndex !== nextIndex) {
    const imgNext = images[nextIndex];
    if (imgNext && imgNext.complete && imgNext.naturalWidth > 0) {
      drawImageCover(imgNext, progress);
    }
  }

  ctx.globalAlpha = 1.0;
}

// Calculate scroll target frame bounded between top of page (0.0) and bottom of footer (1.0)
function updateScrollTarget() {
  const scrollTop = Math.max(0, window.scrollY || document.documentElement.scrollTop);
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  
  const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
  targetFrame = scrollFraction * (FRAME_COUNT - 1);
}

// Animation RAF Loop with Smooth Physics Lerping (0.06 for butter liquid momentum)
function animationLoop() {
  const lerpFactor = 0.06;
  const diff = targetFrame - currentFrame;

  if (Math.abs(diff) > 0.00005) {
    currentFrame += diff * lerpFactor;
    renderFrame(currentFrame);
  }

  requestAnimationFrame(animationLoop);
}

// Initialize Lenis smooth scroll with luxurious exponential deceleration curve
function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.8, // Luxurious, silky smooth deceleration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
    });

    function raf(time) {
      lenisInstance.raf(time);
      updateScrollTarget();
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  } else {
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
  }
}

// Direct Contact Form Email Handler (FormSubmit API + Mailto Fallback)
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const originalContent = submitBtn.innerHTML;

    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const subject = document.getElementById('form-subject').value.trim();
    const message = document.getElementById('form-message').value.trim();

    submitBtn.innerHTML = 'SENDING EMAIL...';
    submitBtn.disabled = true;

    try {
      // Send directly to gowuthaman644@gmail.com via FormSubmit AJAX
      const res = await fetch('https://formsubmit.co/ajax/gowuthaman644@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `New Portfolio Inquiry: ${subject}`,
          Name: name,
          Email: email,
          Subject: subject,
          Message: message
        })
      });

      if (res.ok) {
        alert(`✨ Thank you ${name}! Your email has been sent successfully to gowuthaman644@gmail.com.`);
        form.reset();
      } else {
        throw new Error('API submission fallback');
      }
    } catch (err) {
      // Fallback: Launch mailto client
      const mailtoLink = `mailto:gowuthaman644@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
      window.location.href = mailtoLink;
    } finally {
      submitBtn.innerHTML = originalContent;
      submitBtn.disabled = false;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  preloadImages();
  initSmoothScroll();
  initContactForm();
  requestAnimationFrame(animationLoop);
});
