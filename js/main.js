document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initFaqAccordion();
  initContactForm();
  initNewsletterForm();

  initScrollReveal();
  initOTPVerification();
  initHeroParticles();
});

/**
 * Continuously Moving Hero Particle System
 */
function initHeroParticles() {
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const hero = canvas.parentElement;
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = 55;
  const particles = [];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -Math.random() * 0.3 - 0.1;
      this.size = Math.random() * 2.5 + 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.life = 0;
      this.maxLife = Math.random() * 400 + 200;
      // 40% chance white, 60% gold
      this.isWhite = Math.random() < 0.4;
      if (this.isWhite) {
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.4 + 0.15;
      }
      this.hue = Math.random() * 30 + 35; // gold range
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      const progress = this.life / this.maxLife;
      if (progress < 0.1) this.currentOpacity = this.opacity * (progress / 0.1);
      else if (progress > 0.8) this.currentOpacity = this.opacity * ((1 - progress) / 0.2);
      else this.currentOpacity = this.opacity;
      if (this.life >= this.maxLife || this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
        this.reset();
        this.y = canvas.height + 10;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      if (this.isWhite) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.currentOpacity})`;
      } else {
        ctx.fillStyle = `hsla(${this.hue}, 90%, 55%, ${this.currentOpacity})`;
      }
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  function drawConnections() {
    const maxDist = 100;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          // White connection if either particle is white
          if (particles[i].isWhite || particles[j].isWhite) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          } else {
            ctx.strokeStyle = `rgba(241, 168, 10, ${alpha})`;
          }
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
}



/**
 * Mobile Navigation Menu Toggle
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
      
      // Toggle burger icon
      const icon = menuBtn.querySelector('i') || menuBtn;
      if (navLinks.classList.contains('active')) {
        icon.textContent = 'âœ•';
      } else {
        icon.textContent = 'â˜°';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuBtn) {
        navLinks.classList.remove('active');
        const icon = menuBtn.querySelector('i') || menuBtn;
        icon.textContent = 'â˜°';
      }
    });
  }
}

/**
 * FAQ Accordion Component
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (question && answer) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other FAQs
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            otherItem.querySelector('.faq-answer').style.maxHeight = null;
          }
        });
        
        // Toggle current FAQ
        if (isActive) {
          item.classList.remove('active');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    }
  });
}

/**
 * Contact Form Handling & Validation
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');
  
  if (form && feedback) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Reset feedback
      feedback.className = 'form-feedback';
      feedback.style.display = 'none';
      
      // Get field values
      const name = document.getElementById('formName').value.trim();
      const email = document.getElementById('formEmail').value.trim();
      const subject = document.getElementById('formSubject').value;
      const message = document.getElementById('formMessage').value.trim();
      const agree = document.getElementById('formAgree').checked;
      
      // Validate
      if (!name) {
        showError('Please enter your name.');
        return;
      }
      
      if (!email || !validateEmail(email)) {
        showError('Please enter a valid email address.');
        return;
      }
      
      if (!subject || subject === '') {
        showError('Please select a subject.');
        return;
      }
      
      if (!message) {
        showError('Please enter your message.');
        return;
      }
      
      if (!agree) {
        showError('You must agree to the Terms of Service and Privacy Policy.');
        return;
      }
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending Message...';
      
      try {
        const success = await sendToZapier('contact', { name, email, subject, message });
        
        if (success) {
          feedback.textContent = 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.';
          feedback.className = 'form-feedback success';
          feedback.style.display = 'block';
          form.reset();
        } else {
          showError('Failed to submit message. Please try again.');
        }
      } catch (error) {
        console.error('Contact form submission error:', error);
        showError('A network error occurred. Please check your connection and try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
  
  function showError(msg) {
    feedback.textContent = msg;
    feedback.className = 'form-feedback error';
  }
  
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

/**
 * Footer Newsletter Signup Handling
 */
function initNewsletterForm() {
  const forms = document.querySelectorAll('.footer-newsletter');
  
  forms.forEach(form => {
    let feedback = form.parentNode.querySelector('.newsletter-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'newsletter-feedback';
      form.parentNode.appendChild(feedback);
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      feedback.className = 'newsletter-feedback';
      feedback.style.display = 'none';
      
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (!email) {
        showFeedback('Please enter your email.', 'error');
        return;
      }
      
      const submitBtn = form.querySelector('button');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'âŒ›';
      
      try {
        const success = await sendToZapier('newsletter', { email });
        
        if (success) {
          showFeedback('Subscribed successfully!', 'success');
          form.reset();
        } else {
          showFeedback('Subscription failed.', 'error');
        }
      } catch (error) {
        console.error('Newsletter submission error:', error);
        showFeedback('Error subscribing.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
    
    function showFeedback(msg, type) {
      feedback.textContent = msg;
      feedback.className = `newsletter-feedback ${type}`;
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 5000);
    }
  });
}

/**
 * Email OTP Verification System
 */
let generatedOTP = '';
let emailVerified = false;
let otpTimerInterval = null;

function initOTPVerification() {
  const sendBtn = document.getElementById('otpSendBtn');
  const resendBtn = document.getElementById('otpResendBtn');
  const emailInput = document.getElementById('regEmail');
  const otpWrap = document.getElementById('otpInputWrap');
  const otpBoxes = document.querySelectorAll('.otp-box');
  const verifiedBadge = document.getElementById('otpVerifiedBadge');
  const otpErrorMsg = document.getElementById('otpErrorMsg');

  if (!sendBtn || !emailInput) return;

  // Send OTP
  sendBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add('reg-error');
      showOtpError('Please enter a valid email first');
      return;
    }

    // Generate 6-digit OTP
    generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    emailVerified = false;

    // Lock email field
    emailInput.readOnly = true;
    sendBtn.textContent = 'Sent âœ“';
    sendBtn.disabled = true;
    sendBtn.classList.add('otp-sent');

    // Show OTP boxes
    otpWrap.style.display = 'block';
    otpBoxes[0].focus();

    // Start cooldown timer
    startOtpTimer();

    // Show demo toast with OTP
    showOtpToast(email, generatedOTP);

    hideOtpError();
  });

  // Resend OTP
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
      otpBoxes.forEach(b => { b.value = ''; b.classList.remove('otp-correct', 'otp-wrong'); });
      otpBoxes[0].focus();
      startOtpTimer();
      showOtpToast(emailInput.value.trim(), generatedOTP);
      hideOtpError();
    });
  }

  // OTP box navigation & auto-verify
  otpBoxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);
      box.classList.remove('otp-wrong');

      if (val && i < otpBoxes.length - 1) {
        otpBoxes[i + 1].focus();
      }

      // Check if all 6 digits entered
      const entered = Array.from(otpBoxes).map(b => b.value).join('');
      if (entered.length === 6) {
        verifyOTP(entered);
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        otpBoxes[i - 1].focus();
      }
    });

    // Paste support
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (pasted.length === 6) {
        pasted.split('').forEach((digit, idx) => {
          if (otpBoxes[idx]) otpBoxes[idx].value = digit;
        });
        otpBoxes[5].focus();
        verifyOTP(pasted);
      }
    });
  });

  // Change email (unlock)
  if (emailInput) {
    emailInput.addEventListener('dblclick', () => {
      if (emailInput.readOnly && !emailVerified) {
        emailInput.readOnly = false;
        sendBtn.textContent = 'Send OTP';
        sendBtn.disabled = false;
        sendBtn.classList.remove('otp-sent');
        otpWrap.style.display = 'none';
        otpBoxes.forEach(b => { b.value = ''; b.classList.remove('otp-correct', 'otp-wrong'); });
        clearInterval(otpTimerInterval);
      }
    });
  }

  function verifyOTP(entered) {
    if (entered === generatedOTP) {
      // Success
      emailVerified = true;
      otpBoxes.forEach(b => b.classList.add('otp-correct'));
      verifiedBadge.style.display = 'inline-flex';
      otpWrap.style.display = 'none';
      sendBtn.textContent = 'Verified âœ“';
      sendBtn.classList.add('otp-verified');
      clearInterval(otpTimerInterval);
      hideOtpError();
    } else {
      // Failure
      otpBoxes.forEach(b => b.classList.add('otp-wrong'));
      showOtpError('Invalid OTP. Please try again.');
      setTimeout(() => {
        otpBoxes.forEach(b => { b.value = ''; b.classList.remove('otp-wrong'); });
        otpBoxes[0].focus();
      }, 800);
    }
  }

  function startOtpTimer() {
    let seconds = 60;
    const timerEl = document.getElementById('otpTimer');
    const resend = document.getElementById('otpResendBtn');
    if (resend) resend.disabled = true;

    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
      seconds--;
      if (timerEl) timerEl.textContent = `Resend in ${seconds}s`;
      if (seconds <= 0) {
        clearInterval(otpTimerInterval);
        if (timerEl) timerEl.textContent = '';
        if (resend) resend.disabled = false;
      }
    }, 1000);
    if (timerEl) timerEl.textContent = `Resend in ${seconds}s`;
  }

  function showOtpError(msg) {
    if (otpErrorMsg) { otpErrorMsg.textContent = msg; otpErrorMsg.style.display = 'block'; }
  }
  function hideOtpError() {
    if (otpErrorMsg) { otpErrorMsg.textContent = ''; otpErrorMsg.style.display = 'none'; }
  }
}

function showOtpToast(email, code) {
  // Remove existing toast
  const old = document.getElementById('otpDemoToast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'otpDemoToast';
  toast.className = 'otp-demo-toast';
  toast.innerHTML = `
    <div class="otp-toast-header">
      <span>ðŸ“§ OTP Sent (Demo)</span>
      <button onclick="this.parentElement.parentElement.remove()">âœ•</button>
    </div>
    <p>Sent to: <strong>${email}</strong></p>
    <div class="otp-toast-code">${code}</div>
    <p class="otp-toast-note">In production, this would be sent via email</p>
  `;
  document.body.appendChild(toast);

  setTimeout(() => { if (toast.parentElement) toast.classList.add('otp-toast-fade'); }, 15000);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 16000);
}

// Reset OTP state when modal opens
function resetOTPState() {
  emailVerified = false;
  generatedOTP = '';
  clearInterval(otpTimerInterval);
  const emailInput = document.getElementById('regEmail');
  const sendBtn = document.getElementById('otpSendBtn');
  const otpWrap = document.getElementById('otpInputWrap');
  const badge = document.getElementById('otpVerifiedBadge');
  const boxes = document.querySelectorAll('.otp-box');
  if (emailInput) emailInput.readOnly = false;
  if (sendBtn) { sendBtn.textContent = 'Send OTP'; sendBtn.disabled = false; sendBtn.classList.remove('otp-sent', 'otp-verified'); }
  if (otpWrap) otpWrap.style.display = 'none';
  if (badge) badge.style.display = 'none';
  boxes.forEach(b => { b.value = ''; b.classList.remove('otp-correct', 'otp-wrong'); });
}


/**
 * Scroll Reveal Animations using IntersectionObserver
 */
function initScrollReveal() {
  const style = document.createElement('style');
  style.innerHTML = `
    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .reveal.active {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll(
    '.feature-card, .course-card, .testimonial-card, .pricing-card, .showcase-step-card, .contact-info-card, .prop-card, .expert-card, .section-header'
  );
  
  const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: '0px'
  };
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  targets.forEach(target => {
    target.classList.add('reveal');
    observer.observe(target);
  });
}

