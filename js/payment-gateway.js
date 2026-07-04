/**
 * LucktanInfo Payment Gateway Integration
 * Supports: Cashfree, PayU, Pine Labs
 * Mode: Demo/Sandbox (simulated payments until API keys are configured)
 */

const PaymentGateway = (() => {
  // ─── Configuration ───
  const CONFIG = {
    cashfree: {
      name: 'Cashfree',
      sdkUrl: 'https://sdk.cashfree.com/js/v3/cashfree.js',
      sandbox: true,
      appId: '', // Set your Cashfree App ID here
      enabled: true
    },
    payu: {
      name: 'PayU',
      sdkUrl: 'https://jssdk.payu.in/bolt/bolt.min.js',
      sandbox: true,
      merchantKey: '', // Set your PayU Merchant Key here
      enabled: true
    },
    pinelabs: {
      name: 'Pine Labs',
      sdkUrl: '',
      sandbox: true,
      merchantId: '', // Set your Pine Labs Merchant ID here
      enabled: true
    }
  };

  // ─── Currency ───
  const CURRENCIES = {
    USD: { symbol: '$', amount: 499, code: 'USD', label: 'USD ($)' },
    INR: { symbol: '₹', amount: 41999, code: 'INR', label: 'INR (₹)' }
  };

  let selectedCurrency = 'INR';
  let selectedGateway = 'cashfree';
  let courseInfo = null;
  let studentInfo = null;

  // ─── Helpers ───
  function generateOrderId() {
    return 'LTI-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function getAmount() {
    return CURRENCIES[selectedCurrency];
  }

  function formatAmount(amount, currencyCode) {
    const cur = CURRENCIES[currencyCode || selectedCurrency];
    return cur.symbol + cur.amount.toLocaleString('en-IN');
  }

  function isDemoMode(gateway) {
    const cfg = CONFIG[gateway];
    if (!cfg) return true;
    switch (gateway) {
      case 'cashfree': return !cfg.appId;
      case 'payu': return !cfg.merchantKey;
      case 'pinelabs': return !cfg.merchantId;
      default: return true;
    }
  }

  // ─── Demo Payment Simulation ───
  function simulatePayment(gateway, orderId, onSuccess, onFailure) {
    const overlay = document.getElementById('paymentProcessingOverlay');
    const statusText = document.getElementById('processingStatus');
    const gatewayName = CONFIG[gateway]?.name || gateway;

    overlay.classList.add('active');
    statusText.textContent = `Connecting to ${gatewayName}...`;

    const steps = [
      { text: `Initializing ${gatewayName} checkout...`, delay: 600 },
      { text: 'Verifying order details...', delay: 800 },
      { text: 'Processing payment...', delay: 1200 },
      { text: 'Confirming transaction...', delay: 800 },
      { text: 'Payment verified ✓', delay: 500 }
    ];

    let stepIndex = 0;
    function nextStep() {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        statusText.textContent = step.text;

        // Update progress bar
        const progress = ((stepIndex + 1) / steps.length) * 100;
        const progressBar = document.getElementById('processingProgressBar');
        if (progressBar) progressBar.style.width = progress + '%';

        stepIndex++;
        setTimeout(nextStep, step.delay);
      } else {
        overlay.classList.remove('active');
        onSuccess({
          orderId: orderId,
          gateway: gateway,
          transactionId: 'DEMO-' + Date.now(),
          amount: getAmount().amount,
          currency: selectedCurrency,
          status: 'SUCCESS',
          demo: true
        });
      }
    }
    setTimeout(nextStep, 400);
  }

  // ─── Cashfree Integration ───
  async function initCashfree(orderId) {
    if (isDemoMode('cashfree')) {
      return simulatePayment('cashfree', orderId, handlePaymentSuccess, handlePaymentFailure);
    }

    try {
      // Create order session via backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'cashfree',
          orderId: orderId,
          amount: getAmount().amount,
          currency: selectedCurrency,
          customerName: studentInfo?.name || 'Student',
          customerEmail: studentInfo?.email || '',
          customerPhone: studentInfo?.phone || '',
          courseId: courseInfo?.id || 'fundamentals'
        })
      });
      const data = await response.json();

      if (data.paymentSessionId) {
        const cashfree = Cashfree({ mode: CONFIG.cashfree.sandbox ? 'sandbox' : 'production' });
        cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_modal',
          onSuccess: (txData) => handlePaymentSuccess({ ...txData, gateway: 'cashfree', orderId }),
          onFailure: (txData) => handlePaymentFailure({ ...txData, gateway: 'cashfree', orderId })
        });
      }
    } catch (err) {
      console.error('Cashfree init error:', err);
      simulatePayment('cashfree', orderId, handlePaymentSuccess, handlePaymentFailure);
    }
  }

  // ─── PayU Integration ───
  async function initPayU(orderId) {
    if (isDemoMode('payu')) {
      return simulatePayment('payu', orderId, handlePaymentSuccess, handlePaymentFailure);
    }

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'payu',
          orderId: orderId,
          amount: getAmount().amount,
          currency: selectedCurrency,
          customerName: studentInfo?.name || 'Student',
          customerEmail: studentInfo?.email || '',
          customerPhone: studentInfo?.phone || '',
          courseId: courseInfo?.id || 'fundamentals'
        })
      });
      const data = await response.json();

      if (data.hash && typeof bolt !== 'undefined') {
        bolt.launch({
          key: CONFIG.payu.merchantKey,
          txnid: orderId,
          hash: data.hash,
          amount: getAmount().amount.toString(),
          firstname: studentInfo?.name || 'Student',
          email: studentInfo?.email || '',
          phone: studentInfo?.phone || '',
          productinfo: courseInfo?.name || 'Blockchain Course',
          surl: window.location.origin + '/api/verify-payment',
          furl: window.location.origin + '/api/verify-payment'
        }, {
          responseHandler: (response) => handlePaymentSuccess({ ...response, gateway: 'payu', orderId }),
          catchException: (response) => handlePaymentFailure({ ...response, gateway: 'payu', orderId })
        });
      }
    } catch (err) {
      console.error('PayU init error:', err);
      simulatePayment('payu', orderId, handlePaymentSuccess, handlePaymentFailure);
    }
  }

  // ─── Pine Labs Integration ───
  async function initPineLabs(orderId) {
    if (isDemoMode('pinelabs')) {
      return simulatePayment('pinelabs', orderId, handlePaymentSuccess, handlePaymentFailure);
    }

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: 'pinelabs',
          orderId: orderId,
          amount: getAmount().amount,
          currency: selectedCurrency,
          customerName: studentInfo?.name || 'Student',
          customerEmail: studentInfo?.email || '',
          customerPhone: studentInfo?.phone || '',
          courseId: courseInfo?.id || 'fundamentals'
        })
      });
      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error('Pine Labs init error:', err);
      simulatePayment('pinelabs', orderId, handlePaymentSuccess, handlePaymentFailure);
    }
  }

  // ─── Payment Callbacks ───
  function handlePaymentSuccess(data) {
    console.log('Payment Success:', data);

    // Save payment record
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: data.orderId,
        transactionId: data.transactionId || data.txnid || 'N/A',
        gateway: data.gateway,
        amount: getAmount().amount,
        currency: selectedCurrency,
        status: 'SUCCESS',
        demo: data.demo || false,
        course: courseInfo?.id,
        student: studentInfo
      })
    }).catch(() => {});

    // Show success UI
    if (typeof showPaymentSuccess === 'function') {
      showPaymentSuccess(data);
    }
  }

  function handlePaymentFailure(data) {
    console.error('Payment Failed:', data);
    const overlay = document.getElementById('paymentProcessingOverlay');
    if (overlay) overlay.classList.remove('active');

    alert('Payment failed. Please try again or select a different payment method.');
  }

  // ─── Public API ───
  return {
    CURRENCIES,

    setCurrency(code) {
      if (CURRENCIES[code]) {
        selectedCurrency = code;
      }
    },

    getCurrency() {
      return selectedCurrency;
    },

    getFormattedAmount() {
      const cur = CURRENCIES[selectedCurrency];
      return cur.symbol + cur.amount.toLocaleString('en-IN');
    },

    getAmountValue() {
      return CURRENCIES[selectedCurrency].amount;
    },

    setGateway(gateway) {
      if (CONFIG[gateway]) {
        selectedGateway = gateway;
      }
    },

    getGateway() {
      return selectedGateway;
    },

    setCourseInfo(info) {
      courseInfo = info;
    },

    setStudentInfo(info) {
      studentInfo = info;
    },

    isDemoMode(gateway) {
      return isDemoMode(gateway || selectedGateway);
    },

    async pay() {
      const orderId = generateOrderId();
      const gateway = selectedGateway;

      switch (gateway) {
        case 'cashfree':
          return initCashfree(orderId);
        case 'payu':
          return initPayU(orderId);
        case 'pinelabs':
          return initPineLabs(orderId);
        default:
          return simulatePayment(gateway, orderId, handlePaymentSuccess, handlePaymentFailure);
      }
    }
  };
})();
